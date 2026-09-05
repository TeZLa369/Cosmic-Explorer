import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Animated,
  Easing,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import BouncyPressable from '../components/BouncyPressable';
import RevealView from '../components/RevealView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#D2DCF0",
  textMuted: "#9CAEC8",
  accent: "#89D9FF",
  accentSoft: "rgba(137, 217, 255, 0.16)",
  surface: "rgba(255, 255, 255, 0.08)",
  surfaceSoft: "rgba(255, 255, 255, 0.12)",
  surfaceElevated: "#0D172A",
  border: "rgba(255, 255, 255, 0.16)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  shadow: "rgba(0, 0, 0, 0.4)",
  gold: "#FFB800",
  cyan: "#38BDF8",
  purple: "#C084FC",
  rose: "#FB7185",
  emerald: "#34D399",
};

// 11 Complete Celestial Bodies of our Solar System
const CELESTIAL_BODIES = [
  {
    id: "sun",
    name: "The Sun",
    subtitle: "Sol • G-Type Yellow Dwarf Star",
    symbol: "☉",
    type: "Star",
    gradient: ["#FF7A00", "#FFAE00", "#FF4500"],
    accentColor: "#FFB800",
    tilt: "7.25°",
    distance: "0 AU (0 km)",
    distanceKm: "Center of Solar System",
    orbitPeriod: "230M Years (Galactic Orbit)",
    rotationPeriod: "27 Earth Days",
    gravity: "27.9 g (274 m/s²)",
    gravityFactor: 27.9,
    temperature: "5,500 °C (Surface) • 15M °C (Core)",
    moons: "8 Planets + Dwarf Planets",
    atmosphere: [
      { label: "Hydrogen", value: "73.4%" },
      { label: "Helium", value: "24.8%" },
      { label: "Oxygen", value: "0.77%" },
      { label: "Carbon", value: "0.29%" },
    ],
    missions: ["Parker Solar Probe", "SOHO", "Solar Orbiter", "STEREO"],
    dossier:
      "The Sun contains 99.86% of all mass in the entire Solar System. Every single second, its core fuses 600 million tons of hydrogen into helium, unleashing light that takes 8 minutes and 20 seconds to travel 150 million kilometers to Earth.",
    trivia: "A pinpoint spark from the Sun's core would vaporize anything within 160 kilometers.",
    soundId: "solar-wind",
  },
  {
    id: "mercury",
    name: "Mercury",
    subtitle: "The Swift Messenger • Terrestrial",
    symbol: "☿",
    type: "Rocky Planet",
    gradient: ["#A8A29E", "#78716C", "#57534E"],
    accentColor: "#D6D3D1",
    tilt: "0.03°",
    distance: "0.39 AU",
    distanceKm: "57.9 Million km",
    orbitPeriod: "88 Earth Days",
    rotationPeriod: "59 Earth Days",
    gravity: "0.38 g (3.7 m/s²)",
    gravityFactor: 0.38,
    temperature: "-180 °C (Night) to 430 °C (Day)",
    moons: "0",
    atmosphere: [
      { label: "Oxygen", value: "42%" },
      { label: "Sodium", value: "29%" },
      { label: "Hydrogen", value: "22%" },
      { label: "Helium", value: "6%" },
    ],
    missions: ["Mariner 10", "MESSENGER", "BepiColombo (Active)"],
    dossier:
      "Mercury is the smallest planet and closest to the Sun, speeding through space at nearly 47 km/s. It has virtually no atmosphere to trap heat, resulting in the wildest thermal swings in the solar system—from bone-chilling subzero nights to lead-melting solar noon.",
    trivia: "Radar signals from Earth discovered water ice preserved inside permanently shadowed polar craters.",
    soundId: "pulsar",
  },
  {
    id: "venus",
    name: "Venus",
    subtitle: "The Morning Star • Greenhouse Infernal",
    symbol: "♀",
    type: "Rocky Planet",
    gradient: ["#F59E0B", "#D97706", "#B45309"],
    accentColor: "#FBBF24",
    tilt: "177.3° (Retrograde)",
    distance: "0.72 AU",
    distanceKm: "108.2 Million km",
    orbitPeriod: "225 Earth Days",
    rotationPeriod: "243 Earth Days (Retrograde)",
    gravity: "0.91 g (8.87 m/s²)",
    gravityFactor: 0.91,
    temperature: "465 °C (869 °F) Uniform",
    moons: "0",
    atmosphere: [
      { label: "Carbon Dioxide", value: "96.5%" },
      { label: "Nitrogen", value: "3.5%" },
      { label: "Sulfuric Acid", value: "Trace Clouds" },
    ],
    missions: ["Venera 7–14", "Magellan", "Akatsuki", "DAVINCI+", "VERITAS"],
    dossier:
      "Venus is Earth's toxic twin. A runaway greenhouse effect traps immense solar radiation beneath sulfuric acid clouds, producing surface pressures 92 times greater than Earth (identical to being 900 meters deep in the ocean). It also rotates backward, with the Sun rising in the west.",
    trivia: "A day on Venus (243 Earth days) is actually longer than its entire year (225 Earth days)!",
    soundId: "jupiter-bow",
  },
  {
    id: "earth",
    name: "Earth",
    subtitle: "The Pale Blue Dot • Oasis of Life",
    symbol: "♁",
    type: "Terrestrial Planet",
    gradient: ["#0284C7", "#0369A1", "#075985"],
    accentColor: "#38BDF8",
    tilt: "23.44°",
    distance: "1.00 AU",
    distanceKm: "149.6 Million km",
    orbitPeriod: "365.25 Days",
    rotationPeriod: "23h 56m",
    gravity: "1.00 g (9.81 m/s²)",
    gravityFactor: 1.0,
    temperature: "15 °C (Average Global)",
    moons: "1 (Luna)",
    atmosphere: [
      { label: "Nitrogen", value: "78.1%" },
      { label: "Oxygen", value: "20.9%" },
      { label: "Argon", value: "0.93%" },
      { label: "Carbon Dioxide", value: "0.04%" },
    ],
    missions: ["ISS", "Hubble", "JWST", "Landsat", "Earth Fleet"],
    dossier:
      "The only known sanctuary of life in the cosmos. Earth possesses dynamic oceans covering 71% of its surface, a churning liquid iron core that generates a protective magnetosphere, and active tectonic plates that recycle vital chemical elements.",
    trivia: "Earth is moving around the Sun at an astonishing speed of 107,000 km/h (67,000 mph).",
    soundId: "martian-wind",
  },
  {
    id: "moon",
    name: "The Moon",
    subtitle: "Luna • Earth's Tidal Guardian",
    symbol: "☾",
    type: "Natural Satellite",
    gradient: ["#94A3B8", "#64748B", "#475569"],
    accentColor: "#CBD5E1",
    tilt: "1.54°",
    distance: "384,400 km from Earth",
    distanceKm: "0.00257 AU",
    orbitPeriod: "27.3 Days (Tidal Lock)",
    rotationPeriod: "27.3 Days (Synchronous)",
    gravity: "0.166 g (1.62 m/s²)",
    gravityFactor: 0.166,
    temperature: "-130 °C to 120 °C",
    moons: "0 (Orbits Earth)",
    atmosphere: [
      { label: "Helium", value: "29%" },
      { label: "Neon", value: "29%" },
      { label: "Hydrogen", value: "22%" },
      { label: "Argon", value: "20%" },
    ],
    missions: ["Apollo 11–17", "Artemis", "Chandrayaan-3", "Chang'e 6", "LRO"],
    dossier:
      "The Moon is Earth's only permanent natural satellite. It stabilizes our planet's axial tilt, moderating the climate seasons and driving oceanic tides. Its surface is covered in fine lunar regolith and impact basins that have remained unchanged for billions of years.",
    trivia: "Because there is no wind or liquid water on the Moon, Apollo astronauts' bootprints will endure for millions of years.",
    soundId: "pulsar",
  },
  {
    id: "mars",
    name: "Mars",
    subtitle: "The Red Planet • The Next Frontier",
    symbol: "♂",
    type: "Terrestrial Planet",
    gradient: ["#EF4444", "#DC2626", "#991B1B"],
    accentColor: "#F87171",
    tilt: "25.19°",
    distance: "1.52 AU",
    distanceKm: "227.9 Million km",
    orbitPeriod: "687 Earth Days",
    rotationPeriod: "24h 37m (1 Sol)",
    gravity: "0.38 g (3.72 m/s²)",
    gravityFactor: 0.38,
    temperature: "-63 °C (Average)",
    moons: "2 (Phobos & Deimos)",
    atmosphere: [
      { label: "Carbon Dioxide", value: "95.3%" },
      { label: "Nitrogen", value: "2.7%" },
      { label: "Argon", value: "1.6%" },
      { label: "Oxygen", value: "0.13%" },
    ],
    missions: ["Perseverance", "Curiosity", "Ingenuity", "Viking", "Mars Express"],
    dossier:
      "Mars owes its crimson color to iron oxide (rust) dusting its surface. It hosts Olympus Mons, the largest volcano in the Solar System (22 km high, 3x Everest), and Valles Marineris, a colossal canyon system spanning over 4,000 km.",
    trivia: "Sunsets on Mars appear eerie and blue due to fine dust particles scattering sunlight.",
    soundId: "martian-wind",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    subtitle: "King of Planets • Jovian Gas Giant",
    symbol: "♃",
    type: "Gas Giant",
    gradient: ["#EA580C", "#C2410C", "#9A3412"],
    accentColor: "#FB923C",
    tilt: "3.13°",
    distance: "5.20 AU",
    distanceKm: "778.5 Million km",
    orbitPeriod: "11.86 Earth Years",
    rotationPeriod: "9h 56m (Fastest in System)",
    gravity: "2.53 g (24.79 m/s²)",
    gravityFactor: 2.53,
    temperature: "-110 °C (Cloud Tops)",
    moons: "95 Confirmed (Europa, Ganymede, Io, Callisto)",
    atmosphere: [
      { label: "Hydrogen", value: "89.8%" },
      { label: "Helium", value: "10.2%" },
      { label: "Methane", value: "0.3%" },
      { label: "Ammonia", value: "0.02%" },
    ],
    missions: ["Juno (Active)", "Galileo", "Voyager 1 & 2", "JUICE", "Europa Clipper"],
    dossier:
      "Jupiter is more massive than all other planets in the solar system combined. It acts as an interstellar cosmic shield, deflecting comets. Its iconic Great Red Spot is an anticyclonic storm larger than Earth that has raged continuously for over 300 years.",
    trivia: "Jupiter's moon Ganymede is larger than the planet Mercury and possesses its own internal magnetic field.",
    soundId: "jupiter-bow",
  },
  {
    id: "saturn",
    name: "Saturn",
    subtitle: "Jewel of the Solar System • Ringed Giant",
    symbol: "♄",
    type: "Gas Giant",
    gradient: ["#F59E0B", "#B45309", "#78350F"],
    accentColor: "#FDE047",
    tilt: "26.73°",
    distance: "9.58 AU",
    distanceKm: "1.43 Billion km",
    orbitPeriod: "29.45 Earth Years",
    rotationPeriod: "10h 33m",
    gravity: "1.06 g (10.44 m/s²)",
    gravityFactor: 1.06,
    temperature: "-140 °C (Cloud Tops)",
    moons: "146 Confirmed (Titan, Enceladus, Mimas)",
    atmosphere: [
      { label: "Hydrogen", value: "96.3%" },
      { label: "Helium", value: "3.25%" },
      { label: "Methane", value: "0.45%" },
      { label: "Ammonia", value: "0.01%" },
    ],
    missions: ["Cassini-Huygens", "Voyager 1 & 2", "Pioneer 11", "Dragonfly (2028)"],
    dossier:
      "Saturn's dazzling ring system stretches up to 282,000 km across, yet is razor-thin—averaging only 10 to 30 meters in thickness. Made of billions of icy particles, comet fragments, and rocky boulders, the rings are a cosmic wonder. Saturn also has a density lower than water.",
    trivia: "If you had a cosmic bathtub large enough, Saturn would actually float in it!",
    soundId: "saturn-radio",
  },
  {
    id: "uranus",
    name: "Uranus",
    subtitle: "The Sideways Ice Giant • Cyan World",
    symbol: "♅",
    type: "Ice Giant",
    gradient: ["#06B6D4", "#0891B2", "#0E7490"],
    accentColor: "#67E8F9",
    tilt: "97.77° (Rolls on side)",
    distance: "19.2 AU",
    distanceKm: "2.87 Billion km",
    orbitPeriod: "84 Earth Years",
    rotationPeriod: "17h 14m (Retrograde)",
    gravity: "0.89 g (8.69 m/s²)",
    gravityFactor: 0.89,
    temperature: "-195 °C (-224 °C record minimum)",
    moons: "28 Confirmed (Miranda, Titania, Oberon)",
    atmosphere: [
      { label: "Hydrogen", value: "82.5%" },
      { label: "Helium", value: "15.2%" },
      { label: "Methane", value: "2.3%" },
    ],
    missions: ["Voyager 2 (1986 Flyby)"],
    dossier:
      "Uranus is an ice giant tilted 97.8° on its side, practically rolling around the Sun like a cosmic bowling ball. This extreme tilt results in 42 years of continuous sunlight followed by 42 years of polar darkness.",
    trivia: "Atmospheric methane absorbs red light while reflecting green and blue wavelengths, giving Uranus its striking cyan hue.",
    soundId: "black-hole",
  },
  {
    id: "neptune",
    name: "Neptune",
    subtitle: "The Supersonic Deep Blue • Edge of the Giants",
    symbol: "♆",
    type: "Ice Giant",
    gradient: ["#2563EB", "#1D4ED8", "#1E40AF"],
    accentColor: "#60A5FA",
    tilt: "28.32°",
    distance: "30.1 AU",
    distanceKm: "4.50 Billion km",
    orbitPeriod: "164.8 Earth Years",
    rotationPeriod: "16h 06m",
    gravity: "1.14 g (11.15 m/s²)",
    gravityFactor: 1.14,
    temperature: "-200 °C",
    moons: "16 Confirmed (Triton, Proteus, Nereid)",
    atmosphere: [
      { label: "Hydrogen", value: "80%" },
      { label: "Helium", value: "19%" },
      { label: "Methane", value: "1.5%" },
    ],
    missions: ["Voyager 2 (1989 Flyby)"],
    dossier:
      "Neptune is the windiest world in the Solar System. Supersonic storms whip frozen methane clouds at speeds exceeding 2,100 km/h (1,300 mph)—faster than a fighter jet. Its moon Triton orbits backwards and features cryovolcanoes spewing liquid nitrogen geysers.",
    trivia: "Neptune takes nearly 165 Earth years to orbit the Sun once. Since its discovery in 1846, it has completed only one full orbit in 2011!",
    soundId: "black-hole",
  },
  {
    id: "pluto",
    name: "Pluto",
    subtitle: "The Icy Heart of the Kuiper Belt",
    symbol: "♇",
    type: "Dwarf Planet",
    gradient: ["#A1A1AA", "#71717A", "#52525B"],
    accentColor: "#E4E4E7",
    tilt: "122.53°",
    distance: "39.5 AU",
    distanceKm: "5.91 Billion km",
    orbitPeriod: "248 Earth Years",
    rotationPeriod: "153.3 Hours (6.4 Earth Days)",
    gravity: "0.063 g (0.62 m/s²)",
    gravityFactor: 0.063,
    temperature: "-230 °C",
    moons: "5 (Charon, Styx, Nix, Kerberos, Hydra)",
    atmosphere: [
      { label: "Nitrogen", value: "98%" },
      { label: "Methane", value: "1.5%" },
      { label: "Carbon Monoxide", value: "0.5%" },
    ],
    missions: ["New Horizons (Historic 2015 Flyby)"],
    dossier:
      "Pluto lies deep in the frozen frontier of the Kuiper Belt. In 2015, NASA's New Horizons probe revealed a geologically active world with soaring water-ice mountains 3,500 meters high and a vast heart-shaped nitrogen glacier named Tombaugh Regio.",
    trivia: "Pluto and its largest moon Charon are gravitationally locked, perpetually facing the exact same side toward each other.",
    soundId: "pulsar",
  },
];

// NASA Cosmic Audio Tracks
const COSMIC_AUDIO_TRACKS = [
  {
    id: "black-hole",
    title: "Perseus Black Hole Sonification",
    source: "NASA Chandra X-ray Observatory",
    description: "Deep gravitational acoustic ripples emitted by the supermassive black hole at the center of the Perseus galaxy cluster, scaled up 57 octaves to human hearing range.",
    freq: "57 Octaves Below Middle C • 44-55 Hz Sub-Bass",
  },
  {
    id: "martian-wind",
    title: "Martian Surface Wind",
    source: "NASA Perseverance Rover (SuperCam)",
    description: "Actual acoustic microphone recording of desolate gusts and dust devils whistling across the rocky surface of Jezero Crater on Mars.",
    freq: "Acoustic Atmospheric Pressure • 200-700 Hz Gusts",
  },
  {
    id: "jupiter-bow",
    title: "Jupiter Bow Shock Crossing",
    source: "NASA Juno Spacecraft",
    description: "Electromagnetic wave emissions captured as Juno crossed Jupiter's titanic magnetic shield, transitioning into the Jovian magnetosphere.",
    freq: "Plasma Wave Resonance • 140 Hz FM Sweep",
  },
  {
    id: "saturn-radio",
    title: "Saturn Kilometric Radio Emissions",
    source: "NASA Cassini Spacecraft",
    description: "Plasma waves generated by Saturn's intense auroras converted into an eerie, siren-like acoustic soundscape.",
    freq: "Kilometric Auroral Wave • 600-1600 Hz Chirps",
  },
  {
    id: "solar-wind",
    title: "Solar Wind Plasma Roar",
    source: "NASA Parker Solar Probe",
    description: "Acoustic representation of plasma turbulence as Parker plunged through the outer atmosphere (corona) of our Sun.",
    freq: "Coronal Turbulence • 1800-4500 Hz Whistler",
  },
  {
    id: "pulsar",
    title: "Vela Pulsar Cosmic Metronome",
    source: "Parkes Radio Telescope / CSIRO",
    description: "Rapid radio pulses emitted by a spinning neutron star rotating 11.2 times every single second like an unstoppable interstellar clock.",
    freq: "11.195 Hz Pulse Train • 650 Hz Clock Tick",
  },
  {
    id: "space-score",
    title: "Deep Space Odyssey (Ambient Score)",
    source: "NASA Explorer Cinematic Soundscape",
    description: "Atmospheric, sweeping cosmic synthesizer score capturing the quiet majesty and vast horizons of deep interstellar space.",
    freq: "Full Spectrum Symphonic Audio (Bundled)",
  },
];

export default function SolarSystem({ navigation }) {
  const insets = useSafeAreaInsets();

  // Active Celestial Body
  const [selectedPlanetIndex, setSelectedPlanetIndex] = useState(0);
  const currentBody = CELESTIAL_BODIES[selectedPlanetIndex];

  // Active Tab View: "overview" | "orrery" | "gravity" | "sounds"
  const [activeTab, setActiveTab] = useState("overview");

  // Interactive Gravity Calculator State
  const [userWeight, setUserWeight] = useState("70");
  const [weightUnit, setWeightUnit] = useState("kg");

  // Audio Player State
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const localBgmRef = useRef(null);

  // Equalizer visualizer bars animation
  const eqAnim1 = useRef(new Animated.Value(0.3)).current;
  const eqAnim2 = useRef(new Animated.Value(0.7)).current;
  const eqAnim3 = useRef(new Animated.Value(0.4)).current;
  const eqAnim4 = useRef(new Animated.Value(0.9)).current;
  const eqAnim5 = useRef(new Animated.Value(0.2)).current;

  // WebView references
  const webViewRef = useRef(null); // Orrery & Audio Engine
  const planet3DWebViewRef = useRef(null); // 3D Rotating Planet Viewer in Dossier

  // Animate Equalizer when audio is playing
  useEffect(() => {
    let animLoop = null;
    if (isPlayingAudio) {
      const createBarAnim = (animVal, min, max, duration) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(animVal, {
              toValue: max,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animVal, {
              toValue: min,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );

      animLoop = Animated.parallel([
        createBarAnim(eqAnim1, 0.2, 1.0, 320),
        createBarAnim(eqAnim2, 0.3, 0.9, 250),
        createBarAnim(eqAnim3, 0.1, 0.8, 400),
        createBarAnim(eqAnim4, 0.4, 1.0, 290),
        createBarAnim(eqAnim5, 0.2, 0.7, 360),
      ]);
      animLoop.start();
    } else {
      eqAnim1.setValue(0.3);
      eqAnim2.setValue(0.5);
      eqAnim3.setValue(0.3);
      eqAnim4.setValue(0.6);
      eqAnim5.setValue(0.2);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPlayingAudio]);

  // Handle Sound Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: "STOP_AUDIO" }));
      }
      if (localBgmRef.current) {
        localBgmRef.current.stopAsync().catch(() => {});
        localBgmRef.current.unloadAsync().catch(() => {});
        localBgmRef.current = null;
      }
    };
  }, []);

  // Synchronize 3D Planet Model when selected planet changes
  useEffect(() => {
    if (planet3DWebViewRef.current) {
      planet3DWebViewRef.current.postMessage(
        JSON.stringify({ type: "SET_PLANET", planetId: currentBody.id })
      );
    }
  }, [selectedPlanetIndex, currentBody.id]);

  // Helper to play bundled BGM via Expo AV
  const playLocalBgmTrack = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      if (!localBgmRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/audio/bgm1.mp3"),
          { shouldPlay: true, isLooping: true, volume: 0.35 }
        );
        localBgmRef.current = sound;
      } else {
        await localBgmRef.current.playAsync();
      }
    } catch (err) {
      console.log("Error playing bundled BGM:", err);
    }
  };

  const stopLocalBgmTrack = async () => {
    try {
      if (localBgmRef.current) {
        await localBgmRef.current.pauseAsync();
      }
    } catch (err) {
      console.log("Error pausing bundled BGM:", err);
    }
  };

  // Play / Pause Cosmic Audio
  const togglePlayAudio = async (trackIndex = activeAudioIndex) => {
    try {
      const isSameTrack = activeAudioIndex === trackIndex;
      if (isSameTrack && isPlayingAudio) {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: "STOP_AUDIO" }));
        }
        await stopLocalBgmTrack();
        setIsPlayingAudio(false);
        return;
      }

      setActiveAudioIndex(trackIndex);
      setAudioLoading(true);

      const targetTrack = COSMIC_AUDIO_TRACKS[trackIndex];

      if (targetTrack.id === "space-score") {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: "STOP_AUDIO" }));
        }
        await playLocalBgmTrack();
      } else {
        await stopLocalBgmTrack();
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: "PLAY_AUDIO", trackId: targetTrack.id })
          );
        }
      }

      setIsPlayingAudio(true);
      setAudioLoading(false);
    } catch (error) {
      console.log("Audio toggle error:", error);
      setAudioLoading(false);
      setIsPlayingAudio(false);
    }
  };

  // Switch to a planet and notify both 3D engines
  const handleSelectPlanet = (index) => {
    setSelectedPlanetIndex(index);
    const body = CELESTIAL_BODIES[index];

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "FOCUS_PLANET", planetId: body.id })
      );
    }
    if (planet3DWebViewRef.current) {
      planet3DWebViewRef.current.postMessage(
        JSON.stringify({ type: "SET_PLANET", planetId: body.id })
      );
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "PLANET_CLICKED") {
        const foundIndex = CELESTIAL_BODIES.findIndex((b) => b.id === data.planetId);
        if (foundIndex !== -1) {
          handleSelectPlanet(foundIndex);
        }
      } else if (data.type === "AUDIO_STARTED") {
        setIsPlayingAudio(true);
        setAudioLoading(false);
      }
    } catch (e) {}
  };

  // Calculate weight on current world
  const calculatedWeight = useMemo(() => {
    const numeric = parseFloat(userWeight) || 0;
    const factor = currentBody.gravityFactor;
    return (numeric * factor).toFixed(1);
  }, [userWeight, currentBody]);

  // Fun mobility description for weight on other worlds
  const mobilityBadge = useMemo(() => {
    const factor = currentBody.gravityFactor;
    if (factor > 20) return { title: "Crushing Gravity", desc: "Instant compression under immense stellar mass.", color: COLORS.rose };
    if (factor > 2.0) return { title: "Heavy Jovian Pull", desc: "Walking feels like carrying two people on your shoulders!", color: COLORS.rose };
    if (factor >= 0.85 && factor <= 1.15) return { title: "Earth-like Comfort", desc: "Natural bipedal walking and jumping.", color: COLORS.emerald };
    if (factor >= 0.35 && factor < 0.85) return { title: "Super Leaps", desc: "You can effortlessly leap over cars and obstacles!", color: COLORS.cyan };
    return { title: "Lunar Feathery Bounces", desc: "Slow-motion floating bounds like Apollo moonwalkers.", color: COLORS.gold };
  }, [currentBody]);

  // 3D Rotating Planet HTML (Three.js WebGL with REAL Photographic NASA Textures)
  const planet3DHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-touch-callout: none; -webkit-user-select: none; }
          body { background: transparent; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          canvas { display: block; width: 100vw; height: 100vh; }
          #loading-overlay {
            position: absolute;
            bottom: 12px;
            left: 12px;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.6);
            letter-spacing: 0.8px;
            pointer-events: none;
            transition: opacity 0.4s;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      </head>
      <body>
        <div id="loading-overlay">NASA PHOTOMETRIC TEXTURE • 60 FPS</div>
        <canvas id="c3d"></canvas>
        <script>
          const canvas = document.getElementById('c3d');
          const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.15;

          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 3.7;

          // Realistic Cosmic Lighting: Intense Sun key light + subtle deep space ambient fill
          const ambientLight = new THREE.AmbientLight(0x162035, 0.65);
          scene.add(ambientLight);

          const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
          sunLight.position.set(5, 3, 4);
          scene.add(sunLight);

          const backFillLight = new THREE.DirectionalLight(0x89d9ff, 0.25);
          backFillLight.position.set(-5, -2, -3);
          scene.add(backFillLight);

          // Tilt Pivot & Planet Rotation Pivot
          const tiltGroup = new THREE.Group();
          scene.add(tiltGroup);

          const planetMeshGroup = new THREE.Group();
          tiltGroup.add(planetMeshGroup);

          // Texture Loader & Cache
          const textureLoader = new THREE.TextureLoader();
          textureLoader.setCrossOrigin('anonymous');
          const textureCache = {};

          // Authentic NASA Satellite & Spacecraft Photographic Maps
          const NASA_PHOTO_URLS = {
            sun: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/sunmap.jpg',
            mercury: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/mercurymap.jpg',
            venus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/venusmap.jpg',
            earth: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_atmos_2048.jpg',
            earthClouds: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_clouds_1024.png',
            earthNormal: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_normal_2048.jpg',
            earthSpecular: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_specular_2048.jpg',
            moon: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg',
            mars: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg',
            jupiter: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/jupitermap.jpg',
            saturn: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnmap.jpg',
            saturnRing: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnringpattern.gif',
            uranus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/uranusmap.jpg',
            neptune: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/neptunemap.jpg',
            pluto: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/plutomap1k.jpg',
          };

          function loadTexture(url, callback) {
            if (textureCache[url]) {
              if (callback) callback(textureCache[url]);
              return textureCache[url];
            }
            return textureLoader.load(url, (tex) => {
              textureCache[url] = tex;
              if (callback) callback(tex);
            });
          }

          // Core Planet Sphere
          const sphereGeo = new THREE.SphereGeometry(1.0, 64, 64);
          const sphereMat = new THREE.MeshStandardMaterial({
            roughness: 0.75,
            metalness: 0.1,
          });
          const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
          planetMeshGroup.add(sphereMesh);

          // Realistic Dynamic Earth Clouds Layer
          const cloudsGeo = new THREE.SphereGeometry(1.018, 64, 64);
          const cloudsMat = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
          });
          const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
          cloudsMesh.visible = false;
          planetMeshGroup.add(cloudsMesh);

          // Preload Earth Clouds
          loadTexture(NASA_PHOTO_URLS.earthClouds, (t) => {
            cloudsMat.map = t;
            cloudsMat.needsUpdate = true;
          });

          // Accurate Saturn Rings Geometry with radial UV mapping
          function createRingGeometry(innerRadius, outerRadius, thetaSegments) {
            const geometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
            const pos = geometry.attributes.position;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
              v3.fromBufferAttribute(pos, i);
              geometry.attributes.uv.setXY(i, (v3.length() - innerRadius) / (outerRadius - innerRadius), 0.5);
            }
            return geometry;
          }

          const ringGeo = createRingGeometry(1.35, 2.35, 64);
          const ringMat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.visible = false;
          planetMeshGroup.add(ringMesh);

          // Preload Saturn Ring
          loadTexture(NASA_PHOTO_URLS.saturnRing, (t) => {
            ringMat.map = t;
            ringMat.needsUpdate = true;
          });

          // Atmospheric Fresnel Rim Glow
          const atmoGeo = new THREE.SphereGeometry(1.04, 32, 32);
          const atmoMat = new THREE.MeshBasicMaterial({
            color: 0x89D9FF,
            transparent: true,
            opacity: 0.22,
            side: THREE.BackSide,
          });
          const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
          planetMeshGroup.add(atmoMesh);

          // Planet Configs (Real axial tilts in radians & atmospheric haze colors)
          const planetConfigs = {
            sun: { tilt: 0.12, hasRings: false, isEarth: false, atmo: 0xFF9900, atmoOp: 0.45, roughness: 0.9 },
            mercury: { tilt: 0.001, hasRings: false, isEarth: false, atmo: 0xD6D3D1, atmoOp: 0.08, roughness: 0.85 },
            venus: { tilt: 3.09, hasRings: false, isEarth: false, atmo: 0xFBBF24, atmoOp: 0.32, roughness: 0.65 },
            earth: { tilt: 0.41, hasRings: false, isEarth: true, atmo: 0x38BDF8, atmoOp: 0.32, roughness: 0.6 },
            moon: { tilt: 0.027, hasRings: false, isEarth: false, atmo: 0xCBD5E1, atmoOp: 0.06, roughness: 0.9 },
            mars: { tilt: 0.44, hasRings: false, isEarth: false, atmo: 0xF87171, atmoOp: 0.22, roughness: 0.8 },
            jupiter: { tilt: 0.054, hasRings: false, isEarth: false, atmo: 0xFB923C, atmoOp: 0.22, roughness: 0.6 },
            saturn: { tilt: 0.466, hasRings: true, isEarth: false, ringScale: 1.0, atmo: 0xFDE047, atmoOp: 0.2, roughness: 0.65 },
            uranus: { tilt: 1.706, hasRings: true, isEarth: false, ringScale: 0.8, atmo: 0x67E8F9, atmoOp: 0.28, roughness: 0.5 },
            neptune: { tilt: 0.494, hasRings: false, isEarth: false, atmo: 0x60A5FA, atmoOp: 0.3, roughness: 0.55 },
            pluto: { tilt: 2.138, hasRings: false, isEarth: false, atmo: 0xE4E4E7, atmoOp: 0.1, roughness: 0.85 },
          };

          let currentPlanetId = 'sun';

          function updatePlanetModel(planetId) {
            currentPlanetId = planetId;
            const cfg = planetConfigs[planetId] || planetConfigs.earth;
            tiltGroup.rotation.z = cfg.tilt;

            // Load realistic photographic NASA texture
            const photoUrl = NASA_PHOTO_URLS[planetId];
            if (photoUrl) {
              loadTexture(photoUrl, (tex) => {
                sphereMesh.material.map = tex;
                sphereMesh.material.roughness = cfg.roughness;
                sphereMesh.material.needsUpdate = true;
              });
            }

            // Special handling for the Sun (radiant emissive glow)
            if (planetId === 'sun') {
              sphereMesh.material.emissive = new THREE.Color(0xFF6600);
              sphereMesh.material.emissiveIntensity = 0.85;
            } else {
              sphereMesh.material.emissive = new THREE.Color(0x000000);
              sphereMesh.material.emissiveIntensity = 0.0;
            }

            // Earth clouds layer & specular water
            if (cfg.isEarth) {
              cloudsMesh.visible = true;
              loadTexture(NASA_PHOTO_URLS.earthSpecular, (specTex) => {
                sphereMesh.material.roughnessMap = specTex;
                sphereMesh.material.needsUpdate = true;
              });
            } else {
              cloudsMesh.visible = false;
              sphereMesh.material.roughnessMap = null;
            }

            // Saturn/Uranus Rings
            if (cfg.hasRings) {
              ringMesh.visible = true;
              ringMesh.scale.set(cfg.ringScale || 1.0, cfg.ringScale || 1.0, 1.0);
            } else {
              ringMesh.visible = false;
            }

            // Atmosphere rim glow
            atmoMat.color.setHex(cfg.atmo);
            atmoMat.opacity = cfg.atmoOp;
          }

          // Initial Setup
          updatePlanetModel('sun');

          // Touch Drag Interaction
          let isDragging = false;
          let prevX = 0, prevY = 0;
          let velX = 0, velY = 0;

          window.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
              isDragging = true;
              prevX = e.touches[0].clientX;
              prevY = e.touches[0].clientY;
              velX = 0;
              velY = 0;
            }
          });

          window.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
              const dx = e.touches[0].clientX - prevX;
              const dy = e.touches[0].clientY - prevY;
              velX = dx * 0.006;
              velY = dy * 0.006;
              planetMeshGroup.rotation.y += velX;
              planetMeshGroup.rotation.x += velY;
              prevX = e.touches[0].clientX;
              prevY = e.touches[0].clientY;
            }
          });

          window.addEventListener('touchend', () => {
            isDragging = false;
          });

          // Listen for React Native commands
          function handleMsg(raw) {
            try {
              const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (data.type === 'SET_PLANET') {
                updatePlanetModel(data.planetId);
              }
            } catch(e) {}
          }
          window.addEventListener('message', (e) => { handleMsg(e.data); });
          document.addEventListener('message', (e) => { handleMsg(e.data); });

          // 60 FPS Render Loop
          function animate() {
            if (!isDragging) {
              // Natural continuous rotation
              planetMeshGroup.rotation.y += 0.005;
              // Inertial decay
              planetMeshGroup.rotation.x += velY;
              velY *= 0.92;
            }

            // Earth Clouds drift independently for high realism
            if (cloudsMesh.visible) {
              cloudsMesh.rotation.y += 0.002;
            }

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
          }
          animate();

          window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          });
        </script>
      </body>
      </html>
    `;
  }, []);

  // 3D Canvas Orrery & Web Audio Synthesizer HTML (for 3D Orrery Tab)
  const orreryHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-touch-callout: none; -webkit-user-select: none; }
          body { background: #03060E; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fff; }
          canvas { display: block; width: 100vw; height: 100vh; }
          #hud {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            background: rgba(13, 23, 42, 0.85);
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            backdrop-filter: blur(12px);
          }
          .speed-btn {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #D2DCF0;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          }
          .speed-btn.active {
            background: #38BDF8;
            color: #030712;
            border-color: #38BDF8;
          }
          #instructions {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            letter-spacing: 0.5px;
            pointer-events: none;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div id="instructions">Drag to orbit in 3D • Pinch to zoom • Tap planet to inspect</div>
        <div id="hud">
          <button class="speed-btn" onclick="setSpeed(0)">Pause</button>
          <button class="speed-btn active" id="btn-1" onclick="setSpeed(1)">1x</button>
          <button class="speed-btn" id="btn-5" onclick="setSpeed(5)">5x</button>
          <button class="speed-btn" id="btn-20" onclick="setSpeed(20)">20x</button>
        </div>
        <canvas id="orrery"></canvas>
        <script>
          /* Web Audio Cosmic Synthesizer Engine */
          let audioCtx = null;
          let activeSourceNodes = [];
          let isAudioEngineRunning = false;

          function ensureAudioContext() {
            if (!audioCtx) {
              const AudioContextClass = window.AudioContext || window.webkitAudioContext;
              if (AudioContextClass) audioCtx = new AudioContextClass();
            }
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
          }

          function stopAudio() {
            activeSourceNodes.forEach(function(node) {
              try { if (node.stop) node.stop(); if (node.disconnect) node.disconnect(); } catch(e) {}
            });
            activeSourceNodes = [];
            isAudioEngineRunning = false;
          }

          function playTrack(trackId) {
            ensureAudioContext();
            stopAudio();
            if (!audioCtx) return;
            isAudioEngineRunning = true;
            const now = audioCtx.currentTime;

            if (trackId === 'black-hole') {
              const osc1 = audioCtx.createOscillator();
              const osc2 = audioCtx.createOscillator();
              const filter = audioCtx.createBiquadFilter();
              const gain = audioCtx.createGain();
              osc1.type = 'sawtooth';
              osc1.frequency.setValueAtTime(44, now);
              osc2.type = 'sine';
              osc2.frequency.setValueAtTime(55, now);
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(95, now);
              filter.Q.setValueAtTime(7, now);
              const lfo = audioCtx.createOscillator();
              const lfoGain = audioCtx.createGain();
              lfo.frequency.setValueAtTime(0.18, now);
              lfoGain.gain.setValueAtTime(45, now);
              lfo.connect(filter.frequency);
              gain.gain.setValueAtTime(0.01, now);
              gain.gain.linearRampToValueAtTime(0.45, now + 0.8);
              osc1.connect(filter);
              osc2.connect(filter);
              filter.connect(gain);
              gain.connect(audioCtx.destination);
              osc1.start(now);
              osc2.start(now);
              lfo.start(now);
              activeSourceNodes = [osc1, osc2, lfo, lfoGain, filter, gain];
            } else if (trackId === 'martian-wind') {
              const bufferSize = audioCtx.sampleRate * 4;
              const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
              const output = noiseBuffer.getChannelData(0);
              let b0 = 0, b1 = 0, b2 = 0;
              for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.08;
              }
              const whiteNoise = audioCtx.createBufferSource();
              whiteNoise.buffer = noiseBuffer;
              whiteNoise.loop = true;
              const filter = audioCtx.createBiquadFilter();
              filter.type = 'bandpass';
              filter.frequency.setValueAtTime(380, now);
              filter.Q.setValueAtTime(3.8, now);
              const gustLfo = audioCtx.createOscillator();
              const gustGain = audioCtx.createGain();
              gustLfo.frequency.setValueAtTime(0.32, now);
              gustGain.gain.setValueAtTime(260, now);
              gustLfo.connect(filter.frequency);
              const masterGain = audioCtx.createGain();
              masterGain.gain.setValueAtTime(0.01, now);
              masterGain.gain.linearRampToValueAtTime(0.55, now + 0.6);
              whiteNoise.connect(filter);
              filter.connect(masterGain);
              masterGain.connect(audioCtx.destination);
              whiteNoise.start(now);
              gustLfo.start(now);
              activeSourceNodes = [whiteNoise, filter, gustLfo, gustGain, masterGain];
            } else if (trackId === 'jupiter-bow') {
              const carrier = audioCtx.createOscillator();
              const modulator = audioCtx.createOscillator();
              const modGain = audioCtx.createGain();
              const filter = audioCtx.createBiquadFilter();
              const masterGain = audioCtx.createGain();
              carrier.type = 'sawtooth';
              carrier.frequency.setValueAtTime(140, now);
              modulator.type = 'sine';
              modulator.frequency.setValueAtTime(16, now);
              modGain.gain.setValueAtTime(110, now);
              modulator.connect(carrier.frequency);
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(550, now);
              filter.Q.setValueAtTime(5, now);
              masterGain.gain.setValueAtTime(0.01, now);
              masterGain.gain.linearRampToValueAtTime(0.38, now + 0.6);
              carrier.connect(filter);
              filter.connect(masterGain);
              masterGain.connect(audioCtx.destination);
              carrier.start(now);
              modulator.start(now);
              activeSourceNodes = [carrier, modulator, modGain, filter, masterGain];
            } else if (trackId === 'saturn-radio') {
              const osc = audioCtx.createOscillator();
              const lfo = audioCtx.createOscillator();
              const lfoGain = audioCtx.createGain();
              const filter = audioCtx.createBiquadFilter();
              const masterGain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(950, now);
              lfo.type = 'triangle';
              lfo.frequency.setValueAtTime(0.35, now);
              lfoGain.gain.setValueAtTime(520, now);
              lfo.connect(osc.frequency);
              filter.type = 'bandpass';
              filter.frequency.setValueAtTime(1050, now);
              filter.Q.setValueAtTime(2.2, now);
              masterGain.gain.setValueAtTime(0.01, now);
              masterGain.gain.linearRampToValueAtTime(0.34, now + 0.6);
              osc.connect(filter);
              filter.connect(masterGain);
              masterGain.connect(audioCtx.destination);
              osc.start(now);
              lfo.start(now);
              activeSourceNodes = [osc, lfo, lfoGain, filter, masterGain];
            } else if (trackId === 'solar-wind') {
              const bufferSize = audioCtx.sampleRate * 3;
              const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
              const output = noiseBuffer.getChannelData(0);
              for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.09;
              const noise = audioCtx.createBufferSource();
              noise.buffer = noiseBuffer;
              noise.loop = true;
              const filter = audioCtx.createBiquadFilter();
              filter.type = 'highpass';
              filter.frequency.setValueAtTime(1900, now);
              const whistle = audioCtx.createOscillator();
              whistle.type = 'sine';
              whistle.frequency.setValueAtTime(3200, now);
              const whistleLfo = audioCtx.createOscillator();
              const whistleLfoGain = audioCtx.createGain();
              whistleLfo.frequency.setValueAtTime(0.6, now);
              whistleLfoGain.gain.setValueAtTime(1500, now);
              whistleLfo.connect(whistle.frequency);
              const whistleGain = audioCtx.createGain();
              whistleGain.gain.setValueAtTime(0.12, now);
              whistle.connect(whistleGain);
              const masterGain = audioCtx.createGain();
              masterGain.gain.setValueAtTime(0.01, now);
              masterGain.gain.linearRampToValueAtTime(0.38, now + 0.6);
              noise.connect(filter);
              filter.connect(masterGain);
              whistleGain.connect(masterGain);
              masterGain.connect(audioCtx.destination);
              noise.start(now);
              whistle.start(now);
              whistleLfo.start(now);
              activeSourceNodes = [noise, filter, whistle, whistleLfo, whistleLfoGain, whistleGain, masterGain];
            } else if (trackId === 'pulsar') {
              const osc = audioCtx.createOscillator();
              const pulseGain = audioCtx.createGain();
              const masterGain = audioCtx.createGain();
              osc.type = 'square';
              osc.frequency.setValueAtTime(650, now);
              pulseGain.gain.setValueAtTime(0, now);
              const pulseInterval = 1 / 11.2;
              for (let t = 0; t < 12; t += pulseInterval) {
                pulseGain.gain.setValueAtTime(0, now + t);
                pulseGain.gain.linearRampToValueAtTime(0.65, now + t + 0.003);
                pulseGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.035);
              }
              masterGain.gain.setValueAtTime(0.42, now);
              osc.connect(pulseGain);
              pulseGain.connect(masterGain);
              masterGain.connect(audioCtx.destination);
              osc.start(now);
              activeSourceNodes = [osc, pulseGain, masterGain];
              const timerId = setInterval(function() {
                if (!isAudioEngineRunning || !audioCtx) { clearInterval(timerId); return; }
                const loopNow = audioCtx.currentTime;
                for (let t = 0; t < 10; t += pulseInterval) {
                  pulseGain.gain.setValueAtTime(0, loopNow + t);
                  pulseGain.gain.linearRampToValueAtTime(0.65, loopNow + t + 0.003);
                  pulseGain.gain.exponentialRampToValueAtTime(0.001, loopNow + t + 0.035);
                }
              }, 9000);
            }

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUDIO_STARTED', trackId: trackId }));
            }
          }

          function handleIncomingMsg(raw) {
            try {
              const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
              if (data.type === 'PLAY_AUDIO') playTrack(data.trackId);
              else if (data.type === 'STOP_AUDIO') stopAudio();
            } catch(e) {}
          }
          window.addEventListener('message', function(e) { handleIncomingMsg(e.data); });
          document.addEventListener('message', function(e) { handleIncomingMsg(e.data); });

          /* Orrery Canvas */
          const canvas = document.getElementById('orrery');
          const ctx = canvas.getContext('2d');
          let width = canvas.width = window.innerWidth;
          let height = canvas.height = window.innerHeight;

          window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
          });

          let speedMultiplier = 1;
          function setSpeed(s) {
            speedMultiplier = s;
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            if (s === 0) document.querySelector('.speed-btn:nth-child(1)').classList.add('active');
            if (s === 1) document.getElementById('btn-1').classList.add('active');
            if (s === 5) document.getElementById('btn-5').classList.add('active');
            if (s === 20) document.getElementById('btn-20').classList.add('active');
          }

          const planets = [
            { id: 'mercury', name: 'Mercury', r: 3.5, dist: 38, speed: 0.04, color: '#D6D3D1', orbitColor: 'rgba(214, 211, 209, 0.15)', angle: 0.5 },
            { id: 'venus', name: 'Venus', r: 5.5, dist: 58, speed: 0.025, color: '#FBBF24', orbitColor: 'rgba(251, 191, 36, 0.15)', angle: 1.2 },
            { id: 'earth', name: 'Earth', r: 6.0, dist: 84, speed: 0.018, color: '#38BDF8', orbitColor: 'rgba(56, 189, 248, 0.18)', angle: 2.1 },
            { id: 'mars', name: 'Mars', r: 4.5, dist: 114, speed: 0.012, color: '#F87171', orbitColor: 'rgba(248, 113, 113, 0.18)', angle: 3.4 },
            { id: 'jupiter', name: 'Jupiter', r: 12.0, dist: 160, speed: 0.007, color: '#FB923C', orbitColor: 'rgba(251, 146, 60, 0.16)', angle: 4.5 },
            { id: 'saturn', name: 'Saturn', r: 9.5, dist: 206, speed: 0.0045, color: '#FDE047', hasRings: true, orbitColor: 'rgba(253, 224, 71, 0.14)', angle: 5.2 },
            { id: 'uranus', name: 'Uranus', r: 7.5, dist: 250, speed: 0.003, color: '#67E8F9', orbitColor: 'rgba(103, 232, 249, 0.12)', angle: 0.8 },
            { id: 'neptune', name: 'Neptune', r: 7.2, dist: 292, speed: 0.002, color: '#60A5FA', orbitColor: 'rgba(96, 165, 250, 0.12)', angle: 2.7 },
            { id: 'pluto', name: 'Pluto', r: 2.8, dist: 330, speed: 0.0014, color: '#E4E4E7', orbitColor: 'rgba(228, 228, 231, 0.1)', angle: 4.1 },
          ];

          const stars = [];
          for (let i = 0; i < 90; i++) {
            stars.push({
              x: Math.random() * width,
              y: Math.random() * height,
              r: Math.random() * 1.5 + 0.5,
              alpha: Math.random() * 0.7 + 0.3
            });
          }

          let camRotX = 0.55;
          let camRotY = 0;
          let zoom = 1.0;
          let isDragging = false;
          let lastTouchX = 0, lastTouchY = 0;
          let lastPinchDist = null;

          window.addEventListener('touchstart', (e) => {
            ensureAudioContext();
            if (e.touches.length === 1) {
              isDragging = true;
              lastTouchX = e.touches[0].clientX;
              lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              lastPinchDist = Math.sqrt(dx * dx + dy * dy);
            }
          });

          window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging) {
              const dx = e.touches[0].clientX - lastTouchX;
              const dy = e.touches[0].clientY - lastTouchY;
              camRotY += dx * 0.008;
              camRotX = Math.max(0.15, Math.min(1.45, camRotX + dy * 0.006));
              lastTouchX = e.touches[0].clientX;
              lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2 && lastPinchDist) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const factor = dist / lastPinchDist;
              zoom = Math.max(0.65, Math.min(2.5, zoom * factor));
              lastPinchDist = dist;
            }
          });

          window.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) { isDragging = false; lastPinchDist = null; }
          });

          canvas.addEventListener('click', (e) => {
            ensureAudioContext();
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const cx = width / 2;
            const cy = height / 2;

            const sunDist = Math.hypot(clickX - cx, clickY - cy);
            if (sunDist < 26 * zoom) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PLANET_CLICKED', planetId: 'sun' }));
              }
              return;
            }

            for (let p of planets) {
              const px = cx + Math.cos(p.angle + camRotY) * p.dist * zoom;
              const py = cy + Math.sin(p.angle + camRotY) * p.dist * zoom * Math.sin(camRotX);
              const d = Math.hypot(clickX - px, clickY - py);
              if (d < Math.max(22, p.r * zoom * 2.5)) {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PLANET_CLICKED', planetId: p.id }));
                }
                break;
              }
            }
          });

          function animate() {
            ctx.fillStyle = '#03060E';
            ctx.fillRect(0, 0, width, height);

            for (let s of stars) {
              ctx.beginPath();
              ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
              ctx.fill();
            }

            const cx = width / 2;
            const cy = height / 2;

            for (let p of planets) {
              ctx.beginPath();
              ctx.ellipse(cx, cy, p.dist * zoom, p.dist * zoom * Math.sin(camRotX), 0, 0, Math.PI * 2);
              ctx.strokeStyle = p.orbitColor;
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            const sunGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28 * zoom);
            sunGlow.addColorStop(0, '#FFF5C2');
            sunGlow.addColorStop(0.3, '#FFB800');
            sunGlow.addColorStop(0.7, 'rgba(255, 120, 0, 0.4)');
            sunGlow.addColorStop(1, 'rgba(255, 60, 0, 0)');
            ctx.beginPath();
            ctx.arc(cx, cy, 28 * zoom, 0, Math.PI * 2);
            ctx.fillStyle = sunGlow;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, 14 * zoom, 0, Math.PI * 2);
            ctx.fillStyle = '#FFAE00';
            ctx.fill();

            for (let p of planets) {
              p.angle += p.speed * speedMultiplier * 0.02;
              const px = cx + Math.cos(p.angle + camRotY) * p.dist * zoom;
              const py = cy + Math.sin(p.angle + camRotY) * p.dist * zoom * Math.sin(camRotX);

              if (p.hasRings) {
                ctx.beginPath();
                ctx.ellipse(px, py, p.r * 2.4 * zoom, p.r * 0.9 * zoom * Math.sin(camRotX + 0.3), 0.2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
                ctx.lineWidth = 2.5 * zoom;
                ctx.stroke();
              }

              ctx.beginPath();
              ctx.arc(px, py, p.r * zoom, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 6;
              ctx.fill();
              ctx.shadowBlur = 0;

              ctx.fillStyle = 'rgba(210, 220, 240, 0.85)';
              ctx.font = '10px -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(p.name, px, py + p.r * zoom + 12);
            }

            requestAnimationFrame(animate);
          }

          animate();
        </script>
      </body>
      </html>
    `;
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#03060E", "#071124", "#040915"]} style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <BouncyPressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </BouncyPressable>

            <View style={styles.headerCenter}>
              <View style={styles.headerBadge}>
                <Ionicons name="planet" size={13} color={COLORS.accent} />
                <Text style={styles.headerBadgeText}>SOLAR ODYSSEY</Text>
              </View>
              <Text style={styles.headerTitle}>Planetary Cockpit</Text>
            </View>

            <BouncyPressable
              style={[styles.audioToggleBtn, isPlayingAudio && styles.audioToggleActive]}
              onPress={() => togglePlayAudio()}
            >
              {audioLoading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Ionicons
                  name={isPlayingAudio ? "volume-high" : "volume-mute"}
                  size={18}
                  color={isPlayingAudio ? COLORS.accent : COLORS.textMuted}
                />
              )}
            </BouncyPressable>
          </View>

          {/* Navigation Mode Pill Tabs */}
          <View style={styles.tabBar}>
            {[
              { id: "overview", label: "Dossier & 3D", icon: "cube" },
              { id: "orrery", label: "Solar Orbit", icon: "planet-outline" },
              { id: "gravity", label: "Weight", icon: "scale-outline" },
              { id: "sounds", label: "Cosmic Audio", icon: "radio-outline" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <BouncyPressable
                  key={tab.id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={isActive ? "#030712" : COLORS.textMuted}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </BouncyPressable>
              );
            })}
          </View>

          {/* Planet Horizon Quick-Jump Bar */}
          {activeTab !== "orrery" && (
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
              >
                {CELESTIAL_BODIES.map((body, index) => {
                  const isSelected = selectedPlanetIndex === index;
                  return (
                    <BouncyPressable
                      key={body.id}
                      style={[
                        styles.planetPill,
                        isSelected && { borderColor: body.accentColor, backgroundColor: "rgba(255,255,255,0.14)" },
                      ]}
                      onPress={() => handleSelectPlanet(index)}
                    >
                      <LinearGradient
                        colors={body.gradient}
                        style={styles.planetIconCircle}
                      >
                        <Text style={styles.planetSymbol}>{body.symbol}</Text>
                      </LinearGradient>
                      <Text
                        style={[
                          styles.planetPillText,
                          isSelected && { color: COLORS.textPrimary, fontWeight: "700" },
                        ]}
                      >
                        {body.name}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Persistent 3D Orrery & Audio Engine */}
          <View style={activeTab === "orrery" ? styles.orreryWrapper : styles.hiddenEngine}>
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: orreryHtml }}
              style={styles.webView}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              scrollEnabled={false}
            />
          </View>

          {activeTab === "overview" && (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Interactive 3D Rotating Planet Model Stage */}
              <RevealView delay={40}>
                <View style={styles.planet3DStage}>
                  <WebView
                    ref={planet3DWebViewRef}
                    originWhitelist={["*"]}
                    source={{ html: planet3DHtml }}
                    style={styles.planet3DWebView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                  />

                  {/* Top HUD Badge */}
                  <View style={styles.hudBadge}>
                    <View style={styles.pulseLiveDot} />
                    <Text style={styles.hudBadgeText}>3D REALTIME MODEL • DRAG TO ROTATE</Text>
                  </View>

                  {/* Bottom Tilt Tag */}
                  <View style={styles.hudTiltTag}>
                    <Ionicons name="refresh" size={12} color={COLORS.accent} />
                    <Text style={styles.hudTiltText}>Axial Tilt: {currentBody.tilt}</Text>
                  </View>
                </View>
              </RevealView>

              {/* Giant Cinematic Celestial Sphere Card */}
              <RevealView delay={90}>
                <LinearGradient
                  colors={currentBody.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroPlanetCard}
                >
                  <View style={styles.heroPlanetContent}>
                    <View style={styles.heroTopRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{currentBody.type.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.symbolWatermark}>{currentBody.symbol}</Text>
                    </View>

                    <Text style={styles.heroPlanetName}>{currentBody.name}</Text>
                    <Text style={styles.heroPlanetSubtitle}>{currentBody.subtitle}</Text>

                    {/* Quick Stat Highlights */}
                    <View style={styles.heroStatsRow}>
                      <View style={styles.heroStat}>
                        <Text style={styles.heroStatLabel}>DISTANCE</Text>
                        <Text style={styles.heroStatValue}>{currentBody.distance}</Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStat}>
                        <Text style={styles.heroStatLabel}>YEAR LENGTH</Text>
                        <Text style={styles.heroStatValue}>{currentBody.orbitPeriod}</Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStat}>
                        <Text style={styles.heroStatLabel}>GRAVITY</Text>
                        <Text style={styles.heroStatValue}>{currentBody.gravity.split(" ")[0]} g</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </RevealView>

              {/* Cosmic Audio Fast-Launch Banner */}
              <RevealView delay={140}>
                <BouncyPressable
                  style={styles.soundBanner}
                  onPress={() => setActiveTab("sounds")}
                >
                  <View style={styles.soundBannerLeft}>
                    <Ionicons name="radio" size={20} color={COLORS.accent} />
                    <View style={styles.soundBannerTextWrap}>
                      <Text style={styles.soundBannerTitle}>Listen to Cosmic Sonifications</Text>
                      <Text style={styles.soundBannerSub}>Real NASA electromagnetic radio recordings</Text>
                    </View>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
                </BouncyPressable>
              </RevealView>

              {/* Astrophysical Telemetry Grid */}
              <RevealView delay={180}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="analytics-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.sectionTitle}>Astrophysical Telemetry</Text>
                </View>

                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryLabel}>True Distance</Text>
                    <Text style={styles.telemetryValue}>{currentBody.distanceKm}</Text>
                  </View>

                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryLabel}>Rotation (Day)</Text>
                    <Text style={styles.telemetryValue}>{currentBody.rotationPeriod}</Text>
                  </View>

                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryLabel}>Surface Temp</Text>
                    <Text style={styles.telemetryValue}>{currentBody.temperature}</Text>
                  </View>

                  <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryLabel}>Confirmed Moons</Text>
                    <Text style={styles.telemetryValue}>{currentBody.moons}</Text>
                  </View>
                </View>
              </RevealView>

              {/* Atmospheric Composition */}
              <RevealView delay={220}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cloud-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.sectionTitle}>Atmospheric Breakdown</Text>
                </View>

                <View style={styles.atmosphereCard}>
                  <View style={styles.atmospherePills}>
                    {currentBody.atmosphere.map((gas, i) => (
                      <View key={i} style={styles.gasPill}>
                        <Text style={styles.gasLabel}>{gas.label}</Text>
                        <Text style={styles.gasValue}>{gas.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </RevealView>

              {/* Exploration Missions Roster */}
              <RevealView delay={260}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="rocket-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.sectionTitle}>Historic & Active Missions</Text>
                </View>

                <View style={styles.missionsCard}>
                  <View style={styles.missionsWrap}>
                    {currentBody.missions.map((mission, i) => (
                      <View key={i} style={styles.missionTag}>
                        <Ionicons name="navigate" size={12} color={COLORS.accent} />
                        <Text style={styles.missionText}>{mission}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </RevealView>

              {/* Cosmic Dossier & Secrets */}
              <RevealView delay={300}>
                <View style={styles.dossierCard}>
                  <View style={styles.dossierHeader}>
                    <Ionicons name="sparkles" size={16} color={COLORS.gold} />
                    <Text style={styles.dossierTitle}>COSMIC DOSSIER</Text>
                  </View>
                  <Text style={styles.dossierText}>{currentBody.dossier}</Text>

                  <View style={styles.triviaBox}>
                    <Text style={styles.triviaLabel}>DID YOU KNOW?</Text>
                    <Text style={styles.triviaText}>{currentBody.trivia}</Text>
                  </View>
                </View>
              </RevealView>
            </ScrollView>
          )}

          {activeTab === "gravity" && (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <RevealView delay={60}>
                <View style={styles.gravityConsole}>
                  <View style={styles.gravityHeader}>
                    <Ionicons name="scale" size={24} color={COLORS.accent} />
                    <Text style={styles.gravityHeading}>Cosmic Gravity Scale</Text>
                  </View>
                  <Text style={styles.gravitySub}>
                    Calculate your exact weight across the planets and moons of our Solar System.
                  </Text>

                  {/* Weight Input Box */}
                  <View style={styles.weightInputCard}>
                    <Text style={styles.inputPrompt}>ENTER YOUR WEIGHT ON EARTH</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.weightTextInput}
                        value={userWeight}
                        onChangeText={setUserWeight}
                        keyboardType="numeric"
                        maxLength={5}
                        placeholderTextColor={COLORS.textMuted}
                      />
                      <View style={styles.unitToggle}>
                        <Pressable
                          style={[styles.unitBtn, weightUnit === "kg" && styles.unitBtnActive]}
                          onPress={() => setWeightUnit("kg")}
                        >
                          <Text style={[styles.unitText, weightUnit === "kg" && styles.unitTextActive]}>
                            KG
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.unitBtn, weightUnit === "lbs" && styles.unitBtnActive]}
                          onPress={() => setWeightUnit("lbs")}
                        >
                          <Text style={[styles.unitText, weightUnit === "lbs" && styles.unitTextActive]}>
                            LBS
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Highlight for Selected Planet */}
                  <View style={styles.selectedWorldCard}>
                    <Text style={styles.selectedWorldSubtitle}>YOUR WEIGHT ON</Text>
                    <Text style={styles.selectedWorldName}>{currentBody.name.toUpperCase()}</Text>

                    <View style={styles.calcResultRow}>
                      <Text style={styles.calcValue}>{calculatedWeight}</Text>
                      <Text style={styles.calcUnit}>{weightUnit}</Text>
                    </View>

                    {/* Mobility Gauge Card */}
                    <View style={[styles.mobilityCard, { borderColor: mobilityBadge.color }]}>
                      <Ionicons name="fitness-outline" size={20} color={mobilityBadge.color} />
                      <View style={styles.mobilityTextWrap}>
                        <Text style={[styles.mobilityTitle, { color: mobilityBadge.color }]}>
                          {mobilityBadge.title}
                        </Text>
                        <Text style={styles.mobilityDesc}>{mobilityBadge.desc}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Comprehensive Comparison Table */}
                  <Text style={styles.tableHeading}>ALL WORLDS AT A GLANCE</Text>
                  {CELESTIAL_BODIES.map((body) => {
                    const w = ((parseFloat(userWeight) || 0) * body.gravityFactor).toFixed(1);
                    const isCurrent = body.id === currentBody.id;
                    return (
                      <BouncyPressable
                        key={body.id}
                        style={[styles.worldRow, isCurrent && styles.worldRowActive]}
                        onPress={() => {
                          const idx = CELESTIAL_BODIES.findIndex((b) => b.id === body.id);
                          handleSelectPlanet(idx);
                        }}
                      >
                        <View style={styles.worldRowLeft}>
                          <LinearGradient colors={body.gradient} style={styles.smallCircle}>
                            <Text style={styles.smallSymbol}>{body.symbol}</Text>
                          </LinearGradient>
                          <View>
                            <Text style={styles.worldRowName}>{body.name}</Text>
                            <Text style={styles.worldRowGravity}>{body.gravityFactor} g</Text>
                          </View>
                        </View>

                        <Text style={styles.worldRowWeight}>
                          {w} <Text style={styles.weightUnitSmall}>{weightUnit}</Text>
                        </Text>
                      </BouncyPressable>
                    );
                  })}
                </View>
              </RevealView>
            </ScrollView>
          )}

          {activeTab === "sounds" && (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <RevealView delay={50}>
                {/* Visualizer Station Card */}
                <View style={styles.audioPlayerCard}>
                  <View style={styles.audioBadge}>
                    <Ionicons name="radio" size={14} color={COLORS.accent} />
                    <Text style={styles.audioBadgeText}>NASA COSMIC AUDIO RADIO</Text>
                  </View>

                  <Text style={styles.activeTrackTitle}>
                    {COSMIC_AUDIO_TRACKS[activeAudioIndex].title}
                  </Text>
                  <Text style={styles.activeTrackSource}>
                    {COSMIC_AUDIO_TRACKS[activeAudioIndex].source}
                  </Text>

                  {/* Equalizer Frequency Bars */}
                  <View style={styles.equalizerContainer}>
                    {[eqAnim1, eqAnim2, eqAnim3, eqAnim4, eqAnim5].map((bar, idx) => (
                      <Animated.View
                        key={idx}
                        style={[
                          styles.eqBar,
                          {
                            transform: [{ scaleY: bar }],
                            backgroundColor: isPlayingAudio ? COLORS.accent : COLORS.border,
                          },
                        ]}
                      />
                    ))}
                  </View>

                  <Text style={styles.freqTag}>
                    Frequency: {COSMIC_AUDIO_TRACKS[activeAudioIndex].freq}
                  </Text>

                  {/* Controls */}
                  <View style={styles.playerControls}>
                    <BouncyPressable
                      style={styles.ctrlBtn}
                      onPress={() => {
                        const prev = (activeAudioIndex - 1 + COSMIC_AUDIO_TRACKS.length) % COSMIC_AUDIO_TRACKS.length;
                        togglePlayAudio(prev);
                      }}
                    >
                      <Ionicons name="play-skip-back" size={24} color={COLORS.textPrimary} />
                    </BouncyPressable>

                    <BouncyPressable
                      style={styles.playBigBtn}
                      onPress={() => togglePlayAudio(activeAudioIndex)}
                    >
                      {audioLoading ? (
                        <ActivityIndicator size="small" color="#030712" />
                      ) : (
                        <Ionicons
                          name={isPlayingAudio ? "pause" : "play"}
                          size={28}
                          color="#030712"
                        />
                      )}
                    </BouncyPressable>

                    <BouncyPressable
                      style={styles.ctrlBtn}
                      onPress={() => {
                        const next = (activeAudioIndex + 1) % COSMIC_AUDIO_TRACKS.length;
                        togglePlayAudio(next);
                      }}
                    >
                      <Ionicons name="play-skip-forward" size={24} color={COLORS.textPrimary} />
                    </BouncyPressable>
                  </View>
                </View>
              </RevealView>

              {/* Track Playlist */}
              <RevealView delay={120}>
                <Text style={styles.playlistTitle}>COSMIC RECORDINGS PLAYLIST</Text>
                {COSMIC_AUDIO_TRACKS.map((track, index) => {
                  const isCur = activeAudioIndex === index;
                  return (
                    <BouncyPressable
                      key={track.id}
                      style={[styles.trackCard, isCur && styles.trackCardActive]}
                      onPress={() => togglePlayAudio(index)}
                    >
                      <View style={styles.trackCardTop}>
                        <View style={styles.trackIconWrap}>
                          <Ionicons
                            name={isCur && isPlayingAudio ? "volume-high" : "play"}
                            size={16}
                            color={isCur ? COLORS.accent : COLORS.textMuted}
                          />
                        </View>
                        <View style={styles.trackInfo}>
                          <Text style={[styles.trackName, isCur && { color: COLORS.accent }]}>
                            {track.title}
                          </Text>
                          <Text style={styles.trackSourceText}>{track.source}</Text>
                        </View>
                      </View>
                      <Text style={styles.trackDesc}>{track.description}</Text>
                    </BouncyPressable>
                  );
                })}
              </RevealView>
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03060E",
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  audioToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  audioToggleActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },

  // Pill Tabs
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tabButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#030712",
    fontWeight: "700",
  },

  // Planet Horizon Selector
  carouselContainer: {
    marginBottom: 8,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  planetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  planetIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  planetSymbol: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  planetPillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },

  // Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // 3D Planet Stage in Dossier
  planet3DStage: {
    height: 270,
    backgroundColor: "rgba(10, 19, 36, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(137, 217, 255, 0.25)",
    overflow: "hidden",
    position: "relative",
    marginTop: 6,
    marginBottom: 14,
  },
  planet3DWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  hudBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(3, 7, 18, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#38BDF8",
  },
  hudBadgeText: {
    color: "#D2DCF0",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  hudTiltTag: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(3, 7, 18, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  hudTiltText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  // 3D Orrery
  orreryWrapper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hiddenEngine: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: 10,
    height: 10,
    opacity: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: "#03060E",
  },

  // Hero Card
  heroPlanetCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  heroPlanetContent: {
    padding: 20,
    backgroundColor: "rgba(3, 7, 18, 0.45)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  symbolWatermark: {
    fontSize: 32,
    color: "rgba(255, 255, 255, 0.35)",
    fontWeight: "bold",
  },
  heroPlanetName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
  },
  heroPlanetSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.16)",
    justifyContent: "space-between",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.65)",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 4,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    height: "100%",
  },

  // Sound Banner
  soundBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  soundBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  soundBannerTextWrap: {
    flex: 1,
  },
  soundBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  soundBannerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },

  // Telemetry Grid
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  telemetryCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 16,
    padding: 14,
  },
  telemetryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  telemetryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 6,
  },

  // Atmosphere
  atmosphereCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  atmospherePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gasPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gasLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  gasValue: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  // Missions
  missionsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  missionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  missionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(137, 217, 255, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(137, 217, 255, 0.25)",
  },
  missionText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },

  // Dossier
  dossierCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  dossierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dossierTitle: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  dossierText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  triviaBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "rgba(255, 184, 0, 0.1)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  triviaLabel: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  triviaText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  // Gravity Console
  gravityConsole: {
    marginTop: 8,
  },
  gravityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gravityHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  gravitySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  weightInputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  inputPrompt: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  weightTextInput: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.accent,
    minWidth: 120,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 999,
    padding: 4,
  },
  unitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  unitBtnActive: {
    backgroundColor: COLORS.accent,
  },
  unitText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  unitTextActive: {
    color: "#030712",
  },
  selectedWorldCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginBottom: 20,
  },
  selectedWorldSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.textMuted,
  },
  selectedWorldName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  calcResultRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 10,
    gap: 6,
  },
  calcValue: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.accent,
  },
  calcUnit: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  mobilityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surfaceSoft,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    width: "100%",
  },
  mobilityTextWrap: {
    flex: 1,
  },
  mobilityTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  mobilityDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tableHeading: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  worldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 8,
  },
  worldRowActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  worldRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  smallSymbol: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  worldRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  worldRowGravity: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  worldRowWeight: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
  },
  weightUnitSmall: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "normal",
  },

  // Audio Station
  audioPlayerCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  audioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  audioBadgeText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  activeTrackTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 14,
  },
  activeTrackSource: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  equalizerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 48,
    marginVertical: 18,
  },
  eqBar: {
    width: 6,
    height: 48,
    borderRadius: 3,
  },
  freqTag: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
    marginBottom: 16,
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  playBigBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  playlistTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  trackCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 10,
  },
  trackCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceSoft,
  },
  trackCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trackIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  trackSourceText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  trackDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
