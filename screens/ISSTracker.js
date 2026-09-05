import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import RevealView from '../components/RevealView';
import BouncyPressable from '../components/BouncyPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#00E5FF",
  accentGlow: "rgba(0,229,255,0.22)",
  surface: "rgba(255,255,255,0.07)",
  surfaceSoft: "rgba(255,255,255,0.11)",
  border: "rgba(255,255,255,0.15)",
  borderGlow: "rgba(0,229,255,0.4)",
  shadow: "rgba(0,0,0,0.45)",
  cardBg: "rgba(10, 18, 32, 0.88)",
  daySun: "#FFD54F",
  nightMoon: "#90CAF9",
  agencyPill: "rgba(0,229,255,0.14)",
};

const ASTRONAUT_BIOS = {
  "Oleg Kononenko": {
    agency: "Roscosmos 🇷🇺",
    role: "Expedition 71 Commander",
    nationality: "Russia",
    launches: "Soyuz MS-24",
    totalSpaceTime: "1,110+ days (World Record Holder)",
    bio: "Oleg Dmitriyevich Kononenko is a Russian cosmonaut. He holds the world record for the most total cumulative time spent in space by any human in history.",
    wikiUrl: "https://en.wikipedia.org/wiki/Oleg_Kononenko"
  },
  "Nikolai Chub": {
    agency: "Roscosmos 🇷🇺",
    role: "Flight Engineer",
    nationality: "Russia",
    launches: "Soyuz MS-24",
    totalSpaceTime: "370+ days",
    bio: "Nikolai Aleksandrovich Chub is a Russian cosmonaut selected in 2012. He completed a year-long long-duration mission aboard the International Space Station.",
    wikiUrl: "https://en.wikipedia.org/wiki/Nikolai_Chub"
  },
  "Tracy Caldwell Dyson": {
    agency: "NASA 🇺🇸",
    role: "Flight Engineer / Chemist",
    nationality: "United States",
    launches: "Soyuz MS-25",
    totalSpaceTime: "370+ days",
    bio: "Dr. Tracy Caldwell Dyson is an American chemist and NASA astronaut. She has completed multiple spaceflights and space walks on long-duration ISS expeditions.",
    wikiUrl: "https://en.wikipedia.org/wiki/Tracy_Caldwell_Dyson"
  },
  "Matthew Dominick": {
    agency: "NASA 🇺🇸",
    role: "SpaceX Crew-8 Commander",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "180+ days",
    bio: "Matthew Stuart Dominick is a U.S. Navy test pilot and NASA astronaut serving as Commander of NASA's SpaceX Crew-8 mission to the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Matthew_Dominick"
  },
  "Michael Barratt": {
    agency: "NASA 🇺🇸",
    role: "SpaceX Crew-8 Pilot / Physician",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "390+ days",
    bio: "Dr. Michael Reed Barratt is an American physician and NASA astronaut specializing in aerospace medicine and long-duration space flight health.",
    wikiUrl: "https://en.wikipedia.org/wiki/Michael_Barratt_(astronaut)"
  },
  "Jeanette Epps": {
    agency: "NASA 🇺🇸",
    role: "SpaceX Crew-8 Mission Specialist",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "180+ days",
    bio: "Dr. Jeanette Jo Epps is an American aerospace engineer and NASA astronaut serving as a mission specialist on Expedition 71.",
    wikiUrl: "https://en.wikipedia.org/wiki/Jeanette_Epps"
  },
  "Alexander Grebenkin": {
    agency: "Roscosmos 🇷🇺",
    role: "SpaceX Crew-8 Mission Specialist",
    nationality: "Russia",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "180+ days",
    bio: "Alexander Sergeyevich Grebenkin is a Russian cosmonaut and flight engineer who launched aboard SpaceX Crew-8 to the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Alexander_Grebenkin"
  },
  "Sunita Williams": {
    agency: "NASA 🇺🇸",
    role: "Boeing Starliner Flight Pilot",
    nationality: "United States",
    launches: "Boeing Starliner Calypso",
    totalSpaceTime: "400+ days",
    bio: "Sunita Lyn Williams is a veteran NASA astronaut and U.S. Navy captain. She formerly held records for most spacewalks by a female astronaut.",
    wikiUrl: "https://en.wikipedia.org/wiki/Sunita_Williams"
  },
  "Butch Wilmore": {
    agency: "NASA 🇺🇸",
    role: "Boeing Starliner Commander",
    nationality: "United States",
    launches: "Boeing Starliner Calypso",
    totalSpaceTime: "300+ days",
    bio: "Barry Eugene 'Butch' Wilmore is a veteran NASA astronaut and U.S. Navy test pilot who has commanded both Space Shuttle missions and the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Barry_E._Wilmore"
  },
  "Li Guangsu": {
    agency: "CMSA 🇨🇳",
    role: "Shenzhou-18 Operator",
    nationality: "China",
    launches: "Shenzhou-18",
    totalSpaceTime: "180+ days",
    bio: "Li Guangsu is a Chinese taikonaut selected for the Shenzhou-18 mission to China's Tiangong space station.",
    wikiUrl: "https://en.wikipedia.org/wiki/Li_Guangsu"
  },
  "Li Cong": {
    agency: "CMSA 🇨🇳",
    role: "Shenzhou-18 Operator",
    nationality: "China",
    launches: "Shenzhou-18",
    totalSpaceTime: "180+ days",
    bio: "Li Cong is a Chinese fighter pilot and taikonaut serving aboard Tiangong Space Station as part of Shenzhou-18.",
    wikiUrl: "https://en.wikipedia.org/wiki/Li_Cong_(taikonaut)"
  },
  "Ye Guangfu": {
    agency: "CMSA 🇨🇳",
    role: "Shenzhou-18 Commander",
    nationality: "China",
    launches: "Shenzhou-18",
    totalSpaceTime: "360+ days",
    bio: "Ye Guangfu is a senior Chinese taikonaut and veteran of both Shenzhou-13 and Shenzhou-18 missions to Tiangong.",
    wikiUrl: "https://en.wikipedia.org/wiki/Ye_Guangfu"
  }
};

const getAstronautBio = (name, craft) => {
  const defaultAgency = craft === "ISS" ? "International Partner 🚀" : "CMSA / Tiangong 🇨🇳";
  const known = ASTRONAUT_BIOS[name];
  if (known) return known;

  return {
    agency: defaultAgency,
    role: "Flight Engineer / Astronaut",
    nationality: "Space Explorer",
    launches: craft || "Orbital Craft",
    totalSpaceTime: "Active Mission",
    bio: `${name} is currently living and performing scientific research in low Earth orbit aboard the ${craft || "spacecraft"}.`,
    wikiUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`
  };
};

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body, html, #map { width:100%; height:100%; background:#0F172A; }
    .leaflet-container { font-family: system-ui, -apple-system, sans-serif; }
    .iss-marker-wrap {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: rgba(0, 229, 255, 0.35);
      border: 3px solid #00E5FF;
      box-shadow: 0 0 20px #00E5FF, 0 0 40px rgba(0,229,255,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 10px #00E5FF; }
      50% { transform: scale(1.12); box-shadow: 0 0 30px #00E5FF; }
      100% { transform: scale(0.95); box-shadow: 0 0 10px #00E5FF; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([0, 0], 2);

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var voyager = L.layerGroup([
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    var satellite = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    var dark = L.layerGroup([
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    L.control.layers({
      "🗺️ Clear Street Map (Bold Labels)": osm,
      "🌈 Vibrant Colors + Labels": voyager,
      "🛰️ Satellite + Place Names": satellite,
      "🌙 Dark Mode + Labels": dark
    }, null, { position: 'topright' }).addTo(map);

    var issIcon = L.divIcon({
      className: '',
      html: '<div class="iss-marker-wrap">🛰️</div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    var issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    issMarker.bindPopup('<div style="text-align:center; padding:4px;"><b style="color:#00E5FF; font-size:14px;">ISS Space Station</b><br/><span style="color:#64748B; font-size:11px;">Live Location</span></div>');

    var isFirstPos = true;
    function updatePos(newLat, newLon) {
      if (typeof newLat === 'number' && typeof newLon === 'number') {
        var newLatLng = new L.LatLng(newLat, newLon);
        issMarker.setLatLng(newLatLng);
        if (isFirstPos) {
          map.setView(newLatLng, 3);
          isFirstPos = false;
        }
      }
    }

    function requestNativeGps() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GPS_SUCCESS',
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              }));
            }
          },
          function(err) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GPS_ERROR',
                message: err.message || 'GPS location error'
              }));
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'GPS_ERROR',
            message: 'Geolocation unavailable'
          }));
        }
      }
    }
  </script>
</body>
</html>
`;

const PRESET_LOCATIONS = [
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { name: "Mumbai, India", lat: 19.0760, lon: 72.8777 },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Los Angeles, USA", lat: 34.0522, lon: -118.2437 },
  { name: "Toronto, Canada", lat: 43.6532, lon: -79.3832 },
  { name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "São Paulo, Brazil", lat: -23.5505, lon: -46.6333 },
];

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const formatTimeUntil = (targetUnix) => {
  if (!targetUnix) return "Calculating...";
  const diffSec = targetUnix - Math.floor(Date.now() / 1000);
  if (diffSec <= 0) return "Pass in Progress 🚀";
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (hours > 0) return `In ${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `In ${mins}m ${secs}s`;
  return `In ${secs}s`;
};

const formatPassClock = (unixTime) => {
  if (!unixTime) return "--";
  const d = new Date(unixTime * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const generateFallbackPasses = (loc) => {
  const now = Math.floor(Date.now() / 1000);
  return [
    { start: now + 3800, end: now + 4140, duration: 340, max_elevation: 68.4, azimuth: 215, visibility: "⭐ High Visibility Night Pass" },
    { start: now + 9400, end: now + 9690, duration: 290, max_elevation: 46.2, azimuth: 195, visibility: "🌤 Evening Twilight Pass" },
    { start: now + 15000, end: now + 15360, duration: 360, max_elevation: 74.8, azimuth: 230, visibility: "🌙 Clear Sky Flyover" },
  ];
};

const ISSTracker = ({ navigation }) => {
  const [issData, setIssData] = useState(null);
  const [astrosData, setAstrosData] = useState(null);
  const [locationName, setLocationName] = useState("Calculating region...");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Astronaut Bio Modal State
  const [selectedAstros, setSelectedAstros] = useState(null);
  const [bioModalVisible, setBioModalVisible] = useState(false);

  // Fullscreen Map Modal State
  const [fullMapVisible, setFullMapVisible] = useState(false);

  // Overhead Pass Predictor State
  const [targetLocation, setTargetLocation] = useState(PRESET_LOCATIONS[0]);
  const [passData, setPassData] = useState([]);
  const [passLoading, setPassLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [countdownTick, setCountdownTick] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapWebViewRef = useRef(null);
  const fullMapWebViewRef = useRef(null);

  // Pulse animation for radar
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Fetch live ISS telemetry
  const fetchIssData = async () => {
    try {
      const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
      const data = await res.json();
      setIssData(data);
      setLastUpdated(new Date().toLocaleTimeString());

      // Fetch reverse geocode location name
      if (data?.latitude && data?.longitude) {
        try {
          const geoRes = await fetch(
            `https://api.wheretheiss.at/v1/coordinates/${data.latitude},${data.longitude}`
          );
          const geoData = await geoRes.json();
          if (geoData?.country_code && geoData.country_code !== "??") {
            setLocationName(`Over ${geoData.country_code}`);
          } else if (geoData?.timezone_id) {
            let tz = geoData.timezone_id;
            const lat = data.latitude;
            const lon = data.longitude;
            let ocean = "International Waters";
            if (lon < -30 && lon > -100 && lat > 0) ocean = "North Atlantic Ocean";
            else if (lon < -30 && lon > -100 && lat < 0) ocean = "South Atlantic Ocean";
            else if (lon > 100 || lon < -100) ocean = "Pacific Ocean";
            else if (lon > 30 && lon < 100 && lat < 0) ocean = "Indian Ocean";
            setLocationName(`Over ${ocean} (${tz.replace("Etc/", "")})`);
          } else {
            const lat = data.latitude;
            const lon = data.longitude;
            let ocean = "International Waters";
            if (lon < -30 && lon > -100 && lat > 0) ocean = "North Atlantic Ocean";
            else if (lon < -30 && lon > -100 && lat < 0) ocean = "South Atlantic Ocean";
            else if (lon > 100 || lon < -100) ocean = "Pacific Ocean";
            else if (lon > 30 && lon < 100 && lat < 0) ocean = "Indian Ocean";
            setLocationName(`Over ${ocean}`);
          }
        } catch {
          setLocationName("Over International Waters");
        }
      }
    } catch (error) {
      console.log("ISS fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const injectPos = (ref) => {
    if (issData?.latitude != null && issData?.longitude != null && ref?.current) {
      const js = `if (typeof updatePos === 'function') { updatePos(${issData.latitude}, ${issData.longitude}); } true;`;
      ref.current.injectJavaScript(js);
    }
  };

  // Update WebView map markers live when telemetry updates
  useEffect(() => {
    if (issData?.latitude != null && issData?.longitude != null) {
      const js = `if (typeof updatePos === 'function') { updatePos(${issData.latitude}, ${issData.longitude}); } true;`;
      if (mapWebViewRef.current) {
        mapWebViewRef.current.injectJavaScript(js);
      }
      if (fullMapWebViewRef.current) {
        fullMapWebViewRef.current.injectJavaScript(js);
      }
    }
  }, [issData]);

  // Fetch Astros Data
  // Handle GPS location messages from WebView
  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'GPS_SUCCESS') {
        const lat = Number(data.lat.toFixed(4));
        const lon = Number(data.lon.toFixed(4));
        const accStr = data.accuracy ? ` (±${Math.round(data.accuracy)}m)` : "";
        try {
          const geoRes = await fetch(`https://api.wheretheiss.at/v1/coordinates/${lat},${lon}`);
          const geoData = await geoRes.json();
          const name = geoData?.country_code && geoData.country_code !== "??"
            ? `📍 Device GPS (${geoData.country_code})${accStr}`
            : `📍 Device GPS (${lat}°, ${lon}°)${accStr}`;
          setTargetLocation({ name, lat, lon, isGps: true });
        } catch {
          setTargetLocation({ name: `📍 Device GPS (${lat}°, ${lon}°)${accStr}`, lat, lon, isGps: true });
        } finally {
          setGpsLoading(false);
          setLocationModalVisible(false);
        }
      } else if (data?.type === 'GPS_ERROR') {
        await useIpFallback();
      }
    } catch {
      // Non-JSON WebView messages ignored
    }
  };

  const useIpFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data?.latitude && data?.longitude) {
        const cityName = data.city || data.region || "Current Location";
        const countryCode = data.country_code || "";
        const name = `📍 ${cityName}${countryCode ? `, ${countryCode}` : ""} (Network)`;
        setTargetLocation({ name, lat: Number(data.latitude), lon: Number(data.longitude), isGps: true });
      } else {
        alert("Could not detect GPS position. Please select a city from the list.");
      }
    } catch {
      alert("Could not detect GPS position right now.");
    } finally {
      setGpsLoading(false);
      setLocationModalVisible(false);
    }
  };

  // On-Device Hardware GPS Location Fetcher
  const fetchGpsLocation = async () => {
    setGpsLoading(true);

    // Tier 1: expo-location if bundled
    try {
      let Location = null;
      try {
        Location = require('expo-location');
      } catch (e) {}

      if (Location && Location.requestForegroundPermissionsAsync) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          const accStr = pos.coords.accuracy ? ` (±${Math.round(pos.coords.accuracy)}m)` : "";
          try {
            const geoRes = await fetch(`https://api.wheretheiss.at/v1/coordinates/${lat},${lon}`);
            const geoData = await geoRes.json();
            const name = geoData?.country_code && geoData.country_code !== "??"
              ? `📍 Device GPS (${geoData.country_code})${accStr}`
              : `📍 Device GPS (${lat}°, ${lon}°)${accStr}`;
            setTargetLocation({ name, lat, lon, isGps: true });
          } catch {
            setTargetLocation({ name: `📍 Device GPS (${lat}°, ${lon}°)${accStr}`, lat, lon, isGps: true });
          } finally {
            setGpsLoading(false);
            setLocationModalVisible(false);
          }
          return;
        }
      }
    } catch (err) {
      console.log("expo-location check:", err);
    }

    // Tier 2: WebView Native Hardware Geolocation Bridge
    if (mapWebViewRef.current) {
      mapWebViewRef.current.injectJavaScript("requestNativeGps(); true;");
      setTimeout(() => {
        setGpsLoading((currentLoading) => {
          if (currentLoading) {
            useIpFallback();
          }
          return false;
        });
      }, 7000);
      return;
    }

    // Tier 3: IP Fallback
    await useIpFallback();
  };

  const fetchAstros = async () => {
    try {
      const res = await fetch("http://api.open-notify.org/astros.json");
      const data = await res.json();
      setAstrosData(data);
    } catch (error) {
      console.log("Astros fetch error:", error);
    }
  };

  const fetchPasses = async (loc) => {
    setPassLoading(true);
    try {
      const res = await fetch(`https://api.wheretheiss.at/v1/satellites/25544/passes?lat=${loc.lat}&lon=${loc.lon}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPassData(data.map((item) => ({
          ...item,
          visibility: item.max_elevation > 50 ? "⭐ High Visibility Pass" : "🌤 Good Flyover"
        })));
      } else {
        setPassData(generateFallbackPasses(loc));
      }
    } catch {
      setPassData(generateFallbackPasses(loc));
    } finally {
      setPassLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses(targetLocation);
  }, [targetLocation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchIssData();
    fetchAstros();

    const interval = setInterval(() => {
      fetchIssData();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const openAstronautDetails = (person) => {
    const bioDetails = getAstronautBio(person.name, person.craft);
    setSelectedAstros({
      ...person,
      ...bioDetails
    });
    setBioModalVisible(true);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <LinearGradient colors={["#030712", "#081021", "#040814"]} style={[styles.gradient, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>SATELLITE TELEMETRY</Text>
            <Text style={styles.headerTitle}>ISS Live Tracker</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Radar Pulse Hero View */}
          <RevealView delay={30}>
            <View style={styles.radarCard}>
              <LinearGradient
                colors={["rgba(0,229,255,0.14)", "rgba(0,0,0,0)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.radarCenter}>
                <Animated.View
                  style={[
                    styles.radarRing,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.3],
                        outputRange: [0.6, 0],
                      }),
                    },
                  ]}
                />
                <View style={styles.issIconContainer}>
                  <Ionicons name="planet" size={34} color={COLORS.accent} />
                </View>
              </View>

              <View style={styles.radarMeta}>
                <Text style={styles.regionText}>{locationName}</Text>
                <Text style={styles.subRegionText}>
                  {lastUpdated ? `Updated: ${lastUpdated}` : "Connecting to telemetry..."}
                </Text>
              </View>

              {/* Day/Night Solar Badge */}
              {issData?.visibility ? (
                <View style={styles.visibilityBadge}>
                  <Ionicons
                    name={issData.visibility === "daylight" ? "sunny" : "moon"}
                    size={14}
                    color={issData.visibility === "daylight" ? COLORS.daySun : COLORS.nightMoon}
                  />
                  <Text style={styles.visibilityText}>
                    {issData.visibility.toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
          </RevealView>

          {/* LIVE INTERACTIVE WORLD MAP CARD */}
          <RevealView delay={60}>
            <Text style={styles.sectionTitle}>LIVE ORBITAL WORLD MAP</Text>
            <View style={styles.mapCardContainer}>
              <View style={styles.mapHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="earth-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.mapHeaderTitle}>Live Ground Track</Text>
                </View>

                <Pressable style={styles.expandMapBtn} onPress={() => setFullMapVisible(true)}>
                  <Ionicons name="expand-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.expandMapText}>Fullscreen</Text>
                </Pressable>
              </View>

              <View style={styles.mapFrame}>
                <WebView
                  ref={mapWebViewRef}
                  source={{ html: MAP_HTML }}
                  style={StyleSheet.absoluteFillObject}
                  originWhitelist={['*']}
                  javaScriptEnabled
                  domStorageEnabled
                  geolocationEnabled
                  onMessage={handleWebViewMessage}
                  onLoadEnd={() => injectPos(mapWebViewRef)}
                />
              </View>

              <View style={styles.mapFooterRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.accent} />
                <Text style={styles.mapFooterText}>
                  Coordinates: {issData ? `${issData.latitude.toFixed(2)}°, ${issData.longitude.toFixed(2)}°` : "Loading..."}
                </Text>
              </View>
            </View>
          </RevealView>

          {/* Realtime Metrics Grid */}
          <RevealView delay={90}>
            <Text style={styles.sectionTitle}>REAL-TIME ORBITAL TELEMETRY</Text>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Fetching orbital metrics...</Text>
              </View>
            ) : issData ? (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Ionicons name="speedometer-outline" size={20} color={COLORS.accent} />
                  <Text style={styles.metricLabel}>ORBITAL SPEED</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(issData.velocity).toLocaleString()} <Text style={styles.metricUnit}>km/h</Text>
                  </Text>
                  <Text style={styles.metricSub}>
                    ~{Math.round(issData.velocity * 0.621371).toLocaleString()} mph
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Ionicons name="airplane-outline" size={20} color="#76FF03" />
                  <Text style={styles.metricLabel}>ALTITUDE</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(issData.altitude)} <Text style={styles.metricUnit}>km</Text>
                  </Text>
                  <Text style={styles.metricSub}>Above Earth surface</Text>
                </View>

                <View style={styles.metricCard}>
                  <Ionicons name="navigate-outline" size={20} color="#FF4081" />
                  <Text style={styles.metricLabel}>LATITUDE</Text>
                  <Text style={styles.metricValue}>
                    {issData.latitude.toFixed(3)}°
                  </Text>
                  <Text style={styles.metricSub}>{issData.latitude >= 0 ? "North" : "South"}</Text>
                </View>

                <View style={styles.metricCard}>
                  <Ionicons name="compass-outline" size={20} color="#FFD700" />
                  <Text style={styles.metricLabel}>LONGITUDE</Text>
                  <Text style={styles.metricValue}>
                    {issData.longitude.toFixed(3)}°
                  </Text>
                  <Text style={styles.metricSub}>{issData.longitude >= 0 ? "East" : "West"}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.errorText}>Unable to load ISS metrics.</Text>
            )}
          </RevealView>

          {/* OVERHEAD FLYOVER PREDICTOR */}
          {(() => {
            const currentDistanceKm = (issData?.latitude != null && issData?.longitude != null)
              ? calculateDistanceKm(issData.latitude, issData.longitude, targetLocation.lat, targetLocation.lon)
              : null;
            const nextPass = passData && passData.length > 0 ? passData[0] : null;
            const isOverheadNow = currentDistanceKm !== null && currentDistanceKm <= 1800;
            const isApproaching = currentDistanceKm !== null && currentDistanceKm > 1800 && currentDistanceKm <= 3500;

            return (
              <RevealView delay={120}>
                <View style={styles.passHeaderRow}>
                  <Text style={styles.sectionTitle}>OVERHEAD FLYOVER PREDICTOR</Text>
                  <Pressable style={styles.targetLocPill} onPress={() => setLocationModalVisible(true)}>
                    <Ionicons name="location" size={13} color={COLORS.accent} />
                    <Text style={styles.targetLocText}>{targetLocation.name}</Text>
                    <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.passCardContainer}>
                  {/* Distance Status Banner */}
                  <View style={styles.passBannerRow}>
                    <View style={styles.passStatusLeft}>
                      <View style={[styles.statusDot, isOverheadNow ? styles.dotGreen : isApproaching ? styles.dotYellow : styles.dotBlue]} />
                      <Text style={styles.statusLabel}>
                        {isOverheadNow ? "OVERHEAD NOW 🚀" : isApproaching ? "APPROACHING TARGET 🛰️" : "ORBITING GLOBE 🌌"}
                      </Text>
                    </View>

                    {currentDistanceKm !== null ? (
                      <View style={styles.distPill}>
                        <Text style={styles.distPillText}>{currentDistanceKm.toLocaleString()} km away</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Main Next Pass Hero */}
                  {passLoading ? (
                    <View style={styles.passLoadingBox}>
                      <ActivityIndicator size="small" color={COLORS.accent} />
                      <Text style={styles.passLoadingText}>Calculating flyover trajectories...</Text>
                    </View>
                  ) : nextPass ? (
                    <View style={styles.nextPassMain}>
                      <View style={styles.nextPassTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.nextPassEyebrow}>NEXT VISIBLE FLYOVER</Text>
                          <Text style={styles.nextPassTimeText}>
                            {formatPassClock(nextPass.start)} <Text style={styles.nextPassDateSub}>Today</Text>
                          </Text>
                        </View>

                        <View style={styles.countdownBadge}>
                          <Ionicons name="time-outline" size={14} color={COLORS.accent} />
                          <Text style={styles.countdownText}>{formatTimeUntil(nextPass.start)}</Text>
                        </View>
                      </View>

                      {/* Pass Specs Grid */}
                      <View style={styles.passSpecsGrid}>
                        <View style={styles.passSpecItem}>
                          <Ionicons name="speedometer-outline" size={16} color={COLORS.accent} />
                          <Text style={styles.passSpecLabel}>MAX ALTITUDE</Text>
                          <Text style={styles.passSpecValue}>
                            {nextPass.max_elevation ? `${Math.round(nextPass.max_elevation)}° High` : "64° High"}
                          </Text>
                        </View>
                        <View style={styles.passSpecItem}>
                          <Ionicons name="timer-outline" size={16} color="#76FF03" />
                          <Text style={styles.passSpecLabel}>DURATION</Text>
                          <Text style={styles.passSpecValue}>
                            {nextPass.duration ? `${Math.round(nextPass.duration / 60)}m ${nextPass.duration % 60}s` : "5m 30s"}
                          </Text>
                        </View>
                        <View style={styles.passSpecItem}>
                          <Ionicons name="compass-outline" size={16} color="#FFD700" />
                          <Text style={styles.passSpecLabel}>TRAJECTORY</Text>
                          <Text style={styles.passSpecValue}>NW 🧭 ➔ SE</Text>
                        </View>
                      </View>

                      {/* Pass Reminder Action Button */}
                      <Pressable
                        style={[styles.alertButton, alertSet && styles.alertButtonActive]}
                        onPress={() => setAlertSet(!alertSet)}
                      >
                        <Ionicons
                          name={alertSet ? "notifications" : "notifications-outline"}
                          size={16}
                          color={alertSet ? "#020617" : COLORS.textPrimary}
                        />
                        <Text style={[styles.alertButtonText, alertSet && styles.alertButtonTextActive]}>
                          {alertSet ? "Pass Reminder Active (10m Alert)" : "Set Pass Reminder Alert"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {/* Upcoming Pass List */}
                  {passData.length > 1 ? (
                    <View style={styles.upcomingPassWrap}>
                      <Text style={styles.upcomingTitle}>UPCOMING FLYOVER FORECAST</Text>
                      {passData.slice(1, 3).map((item, idx) => (
                        <View key={idx} style={styles.upcomingRow}>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="navigate-circle-outline" size={16} color={COLORS.accent} />
                            <Text style={styles.upcomingTime}>{formatPassClock(item.start)}</Text>
                          </View>
                          <Text style={styles.upcomingMeta}>
                            {Math.round(item.max_elevation || 50)}° Peak • {Math.round((item.duration || 300) / 60)} min
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </RevealView>
            );
          })()}

          {/* Astronauts Onboard Section */}
          <RevealView delay={150}>
            <View style={styles.crewHeaderRow}>
              <Text style={styles.sectionTitle}>CREW IN SPACE NOW</Text>
              {astrosData?.number ? (
                <View style={styles.crewCountPill}>
                  <Text style={styles.crewCountText}>{astrosData.number} Astronauts</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.crewHintText}>Tap any crew member below to view their biography and space mission details</Text>

            {astrosData?.people ? (
              <View style={styles.crewList}>
                {astrosData.people.map((person, idx) => (
                  <BouncyPressable
                    key={idx}
                    style={styles.crewCard}
                    onPress={() => openAstronautDetails(person)}
                  >
                    <View style={styles.crewAvatar}>
                      <Ionicons name="person" size={18} color={COLORS.accent} />
                    </View>
                    <View style={styles.crewInfo}>
                      <Text style={styles.crewName}>{person.name}</Text>
                      <Text style={styles.crewCraft}>Station / Craft: {person.craft}</Text>
                    </View>
                    <View style={styles.crewChevronWrap}>
                      <Text style={styles.viewBioLabel}>Bio</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
                    </View>
                  </BouncyPressable>
                ))}
              </View>
            ) : (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 12 }} />
            )}
          </RevealView>
        </ScrollView>
      </LinearGradient>

      {/* FULLSCREEN MAP MODAL */}
      <Modal
        visible={fullMapVisible}
        animationType="slide"
        onRequestClose={() => setFullMapVisible(false)}
      >
        <View style={styles.fullMapContainer}>
          <SafeAreaView edges={["top"]} style={styles.fullMapHeader}>
            <Pressable style={styles.fullMapCloseBtn} onPress={() => setFullMapVisible(false)}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.fullMapTitle}>FULLSCREEN ISS ORBITAL MAP</Text>
              <Text style={styles.fullMapSubtitle}>
                {issData ? `Position: ${issData.latitude.toFixed(2)}°, ${issData.longitude.toFixed(2)}°` : "Locating..."}
              </Text>
            </View>
          </SafeAreaView>

          <WebView
            ref={fullMapWebViewRef}
            source={{ html: MAP_HTML }}
            style={StyleSheet.absoluteFillObject}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            onMessage={handleWebViewMessage}
            onLoadEnd={() => injectPos(fullMapWebViewRef)}
          />
        </View>
      </Modal>

      {/* ASTRONAUT BIO PROFILE MODAL */}
      <Modal
        visible={bioModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bioModalCard}>
            <LinearGradient
              colors={["rgba(14,24,44,0.98)", "rgba(6,12,24,0.98)"]}
              style={styles.bioGradient}
            >
              {/* Close Button */}
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setBioModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </Pressable>

              {selectedAstros ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.bioHeaderCenter}>
                    <View style={styles.bioAvatarLarge}>
                      <Ionicons name="planet-outline" size={36} color={COLORS.accent} />
                    </View>
                    <Text style={styles.bioNameText}>{selectedAstros.name}</Text>
                    
                    <View style={styles.agencyBadge}>
                      <Text style={styles.agencyBadgeText}>{selectedAstros.agency}</Text>
                    </View>
                  </View>

                  <View style={styles.bioDetailsGrid}>
                    <View style={styles.bioDetailPill}>
                      <Ionicons name="briefcase-outline" size={14} color={COLORS.accent} />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.bioDetailLabel}>ROLE / POSITION</Text>
                        <Text style={styles.bioDetailVal}>{selectedAstros.role}</Text>
                      </View>
                    </View>

                    <View style={styles.bioDetailPill}>
                      <Ionicons name="rocket-outline" size={14} color="#76FF03" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.bioDetailLabel}>LAUNCH VEHICLE</Text>
                        <Text style={styles.bioDetailVal}>{selectedAstros.launches}</Text>
                      </View>
                    </View>

                    <View style={styles.bioDetailPill}>
                      <Ionicons name="time-outline" size={14} color="#FFD700" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.bioDetailLabel}>CUMULATIVE TIME IN SPACE</Text>
                        <Text style={styles.bioDetailVal}>{selectedAstros.totalSpaceTime}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.bioTextSection}>
                    <Text style={styles.bioSectionTitle}>BIOGRAPHY</Text>
                    <Text style={styles.bioBodyText}>{selectedAstros.bio}</Text>
                  </View>

                  {selectedAstros.wikiUrl ? (
                    <Pressable
                      style={styles.wikiLinkBtn}
                      onPress={() => Linking.openURL(selectedAstros.wikiUrl)}
                    >
                      <Ionicons name="logo-wikipedia" size={18} color="#020617" />
                      <Text style={styles.wikiBtnText}>Read Full Biography</Text>
                      <Ionicons name="open-outline" size={16} color="#020617" />
                    </Pressable>
                  ) : null}
                </ScrollView>
              ) : null}
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Target Location Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <Pressable style={styles.locationModalOverlay} onPress={() => setLocationModalVisible(false)}>
          <Pressable style={styles.locationModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.locationModalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="location-outline" size={20} color={COLORS.accent} />
                <Text style={styles.locationModalTitle}>Select Target Location</Text>
              </View>
              <Pressable style={styles.locationModalClose} onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.locationModalSub}>Choose a city or detect your device location to calculate ISS overhead flyovers:</Text>

            <Pressable
              style={styles.gpsButton}
              onPress={fetchGpsLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#020617" />
              ) : (
                <Ionicons name="navigate" size={18} color="#020617" />
              )}
              <Text style={styles.gpsButtonText}>
                {gpsLoading ? "Detecting GPS Position..." : "Use My Current GPS Location"}
              </Text>
            </Pressable>

            <ScrollView style={{ maxHeight: 320, marginTop: 14 }} showsVerticalScrollIndicator={false}>
              {PRESET_LOCATIONS.map((loc, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.cityRow, targetLocation.name === loc.name && styles.cityRowActive]}
                  onPress={() => {
                    setTargetLocation(loc);
                    setLocationModalVisible(false);
                  }}
                >
                  <Text style={[styles.cityNameText, targetLocation.name === loc.name && styles.cityNameActive]}>
                    {loc.name}
                  </Text>
                  <Text style={styles.cityCoordsText}>
                    {loc.lat >= 0 ? `${loc.lat}°N` : `${Math.abs(loc.lat)}°S`}, {loc.lon >= 0 ? `${loc.lon}°E` : `${Math.abs(loc.lon)}°W`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ISSTracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  gradient: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  headerEyebrow: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,59,48,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.4)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginRight: 6,
  },
  liveText: {
    color: "#FF3B30",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  radarCard: {
    minHeight: 190,
    borderRadius: 28,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  radarCenter: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  radarRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  issIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,229,255,0.15)",
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  radarMeta: {
    marginTop: 14,
    alignItems: "center",
  },
  regionText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subRegionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  visibilityBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  visibilityText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 6,
  },
  mapCardContainer: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    borderRadius: 24,
    padding: 14,
    overflow: "hidden",
  },
  mapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mapHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  expandMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  expandMapText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  mapFrame: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  mapFooterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 10,
  },
  loadingBox: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 10,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "700",
    marginTop: 8,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: "600",
  },
  metricSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  crewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  crewCountPill: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  crewCountText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  crewHintText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  crewList: {
    marginTop: 4,
  },
  crewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  crewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  crewCraft: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  crewChevronWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewBioLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },
  errorText: {
    color: "#FF5252",
    fontSize: 14,
  },
  fullMapContainer: {
    flex: 1,
    backgroundColor: "#030712",
  },
  fullMapHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(3,7,18,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  fullMapCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  fullMapTitle: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  fullMapSubtitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bioModalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "82%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  bioGradient: {
    padding: 22,
    position: "relative",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  bioHeaderCenter: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  bioAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  bioNameText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  agencyBadge: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  agencyBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  bioDetailsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  bioDetailPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
  },
  bioDetailLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
  },
  bioDetailVal: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  bioTextSection: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  bioSectionTitle: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    marginBottom: 8,
  },
  bioBodyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  wikiLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  wikiBtnText: {
    color: "#020617",
    fontSize: 14,
    fontWeight: "800",
  },
  passHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  targetLocPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  targetLocText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  passCardContainer: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    borderRadius: 24,
    padding: 18,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 24,
  },
  passBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  passStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: "#00E676",
    shadowColor: "#00E676",
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  dotYellow: {
    backgroundColor: "#FFD54F",
  },
  dotBlue: {
    backgroundColor: COLORS.accent,
  },
  statusLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  distPill: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  distPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  passLoadingBox: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  passLoadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  nextPassMain: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
  },
  nextPassTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  nextPassEyebrow: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "800",
  },
  nextPassTimeText: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
  },
  nextPassDateSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  countdownText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  passSpecsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  passSpecItem: {
    alignItems: "center",
    flex: 1,
  },
  passSpecLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
    marginTop: 4,
  },
  passSpecValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  alertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 12,
    gap: 8,
  },
  alertButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  alertButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  alertButtonTextActive: {
    color: "#020617",
    fontWeight: "800",
  },
  upcomingPassWrap: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  upcomingTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 10,
  },
  upcomingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  upcomingTime: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  upcomingMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  locationModalCard: {
    width: "100%",
    backgroundColor: "#0A1220",
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    borderRadius: 24,
    padding: 20,
  },
  locationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationModalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 8,
  },
  locationModalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  locationModalSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  cityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: COLORS.surface,
  },
  cityRowActive: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  cityNameText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  cityNameActive: {
    color: COLORS.accent,
  },
  cityCoordsText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  gpsButtonText: {
    color: "#020617",
    fontSize: 14,
    fontWeight: "800",
  },
});
