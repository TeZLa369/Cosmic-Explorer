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
  Platform,
  PermissionsAndroid,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import RevealView from '../components/RevealView';
import BouncyPressable from '../components/BouncyPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Standard NASA-API Explorer Palette (Harmonized with EPIC, Asteroid, DONKI)
const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#8FD2FF",
  accentSoft: "rgba(143, 210, 255, 0.18)",
  surface: "rgba(255, 255, 255, 0.08)",
  surfaceSoft: "rgba(255, 255, 255, 0.12)",
  surfaceElevated: "#0E182A",
  border: "rgba(255, 255, 255, 0.16)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  shadow: "rgba(0, 0, 0, 0.34)",

  // Status & Highlights
  emerald: "#3DD598",
  emeraldSoft: "rgba(61, 213, 152, 0.18)",
  amber: "#FFB067",
  amberSoft: "rgba(255, 176, 103, 0.18)",
  danger: "#FF7A7A",
  dangerSoft: "rgba(255, 122, 122, 0.18)",
  liveDot: "#F43F5E",
};

const ASTRONAUT_BIOS = {
  "Oleg Kononenko": {
    agency: "ROSCOSMOS",
    flag: "🇷🇺",
    role: "Expedition 71 Commander",
    nationality: "Russia",
    launches: "Soyuz MS-24",
    totalSpaceTime: "1,110+ days (World Record)",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Oleg_Kononenko_2023.jpg/330px-Oleg_Kononenko_2023.jpg&w=200&h=200&fit=cover",
    bio: "Oleg Dmitriyevich Kononenko is a Russian cosmonaut. He holds the world record for the most total cumulative time spent in space by any human in history.",
    wikiUrl: "https://en.wikipedia.org/wiki/Oleg_Kononenko"
  },
  "Nikolai Chub": {
    agency: "ROSCOSMOS",
    flag: "🇷🇺",
    role: "Flight Engineer",
    nationality: "Russia",
    launches: "Soyuz MS-24",
    totalSpaceTime: "370+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Nikolai_Chub_in_2023.jpg/330px-Nikolai_Chub_in_2023.jpg&w=200&h=200&fit=cover",
    bio: "Nikolai Aleksandrovich Chub is a Russian cosmonaut selected in 2012. He completed a year-long mission aboard the International Space Station.",
    wikiUrl: "https://en.wikipedia.org/wiki/Nikolai_Chub"
  },
  "Tracy Caldwell Dyson": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "Flight Engineer / Chemist",
    nationality: "United States",
    launches: "Soyuz MS-25",
    totalSpaceTime: "370+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tracy_Caldwell_Dyson_official_portrait_2024.jpg/330px-Tracy_Caldwell_Dyson_official_portrait_2024.jpg&w=200&h=200&fit=cover",
    bio: "Dr. Tracy Caldwell Dyson is an American chemist and NASA astronaut. She has completed multiple spaceflights and EVAs on long-duration ISS expeditions.",
    wikiUrl: "https://en.wikipedia.org/wiki/Tracy_Caldwell_Dyson"
  },
  "Matthew Dominick": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "SpaceX Crew-8 Commander",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "180+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/60/Matthew_Dominick_official_portrait.jpg/330px-Matthew_Dominick_official_portrait.jpg&w=200&h=200&fit=cover",
    bio: "Matthew Stuart Dominick is a U.S. Navy test pilot and NASA astronaut who served as Commander of NASA's SpaceX Crew-8 mission to the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Matthew_Dominick"
  },
  "Michael Barratt": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "SpaceX Crew-8 Pilot / Physician",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "390+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/9/90/Michael_R._Barratt_2023.jpg/330px-Michael_R._Barratt_2023.jpg&w=200&h=200&fit=cover",
    bio: "Dr. Michael Reed Barratt is an American aerospace physician and NASA astronaut specializing in space medicine and human physiology in microgravity.",
    wikiUrl: "https://en.wikipedia.org/wiki/Michael_Barratt_(astronaut)"
  },
  "Jeanette Epps": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "SpaceX Crew-8 Mission Specialist",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "180+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jeanette_J._Epps_official_portrait.jpg/330px-Jeanette_J._Epps_official_portrait.jpg&w=200&h=200&fit=cover",
    bio: "Dr. Jeanette Jo Epps is an American aerospace engineer and NASA astronaut who served as a mission specialist on Expedition 71.",
    wikiUrl: "https://en.wikipedia.org/wiki/Jeanette_Epps"
  },
  "Alexander Grebenkin": {
    agency: "ROSCOSMOS",
    flag: "🇷🇺",
    role: "SpaceX Crew-8 Mission Specialist",
    nationality: "Russia",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "180+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/77/Alexander_Grebenkin_2023.jpg/330px-Alexander_Grebenkin_2023.jpg&w=200&h=200&fit=cover",
    bio: "Alexander Sergeyevich Grebenkin is a Russian cosmonaut and flight engineer who launched aboard SpaceX Crew-8 to the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Alexander_Grebenkin"
  },
  "Sunita Williams": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "Boeing Starliner Flight Pilot",
    nationality: "United States",
    launches: "Boeing Starliner Calypso",
    totalSpaceTime: "400+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/22/Sunita_Williams_2024.jpg/330px-Sunita_Williams_2024.jpg&w=200&h=200&fit=cover",
    bio: "Sunita Lyn Williams is a veteran NASA astronaut, naval aviator, and test pilot. She has completed numerous spacewalks and commanded Expedition 33.",
    wikiUrl: "https://en.wikipedia.org/wiki/Sunita_Williams"
  },
  "Butch Wilmore": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "Boeing Starliner Commander",
    nationality: "United States",
    launches: "Boeing Starliner Calypso",
    totalSpaceTime: "300+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Barry_E._Wilmore_2024.jpg/330px-Barry_E._Wilmore_2024.jpg&w=200&h=200&fit=cover",
    bio: "Barry Eugene 'Butch' Wilmore is a veteran NASA astronaut and U.S. Navy test pilot who commanded Space Shuttle missions and Expedition 42.",
    wikiUrl: "https://en.wikipedia.org/wiki/Barry_E._Wilmore"
  },
  "Li Guangsu": {
    agency: "CMSA",
    flag: "🇨🇳",
    role: "Shenzhou-18 Operator",
    nationality: "China",
    launches: "Shenzhou-18",
    totalSpaceTime: "180+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/9/96/Li_Guangsu.jpg/330px-Li_Guangsu.jpg&w=200&h=200&fit=cover",
    bio: "Li Guangsu is a Chinese taikonaut selected for the Shenzhou-18 mission to China's Tiangong space station.",
    wikiUrl: "https://en.wikipedia.org/wiki/Li_Guangsu"
  },
  "Li Cong": {
    agency: "CMSA",
    flag: "🇨🇳",
    role: "Shenzhou-18 Operator",
    nationality: "China",
    launches: "Shenzhou-18",
    totalSpaceTime: "180+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/5/52/Li_Cong.jpg/330px-Li_Cong.jpg&w=200&h=200&fit=cover",
    bio: "Li Cong is a Chinese fighter pilot and taikonaut serving aboard Tiangong Space Station as part of Shenzhou-18.",
    wikiUrl: "https://en.wikipedia.org/wiki/Li_Cong_(taikonaut)"
  },
  "Ye Guangfu": {
    agency: "CMSA",
    flag: "🇨🇳",
    role: "Shenzhou-18 Commander",
    nationality: "China",
    launches: "Shenzhou-18",
    totalSpaceTime: "360+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ye_Guangfu.jpg/330px-Ye_Guangfu.jpg&w=200&h=200&fit=cover",
    bio: "Ye Guangfu is a senior Chinese taikonaut and veteran of both Shenzhou-13 and Shenzhou-18 missions to Tiangong.",
    wikiUrl: "https://en.wikipedia.org/wiki/Ye_Guangfu"
  },
  "Nick Hague": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "SpaceX Crew-9 Commander",
    nationality: "United States",
    launches: "Crew Dragon Freedom",
    totalSpaceTime: "200+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/04/Nick_Hague_official_portrait.jpg/330px-Nick_Hague_official_portrait.jpg&w=200&h=200&fit=cover",
    bio: "Tyler Nicklaus Hague is a U.S. Space Force colonel and NASA astronaut who commands the SpaceX Crew-9 mission to the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Nick_Hague"
  },
  "Aleksandr Gorbunov": {
    agency: "ROSCOSMOS",
    flag: "🇷🇺",
    role: "SpaceX Crew-9 Mission Specialist",
    nationality: "Russia",
    launches: "Crew Dragon Freedom",
    totalSpaceTime: "180+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Aleksandr_Gorbunov_2024.jpg/330px-Aleksandr_Gorbunov_2024.jpg&w=200&h=200&fit=cover",
    bio: "Aleksandr Vladimirovich Gorbunov is a Russian cosmonaut serving aboard the International Space Station on Expedition 72.",
    wikiUrl: "https://en.wikipedia.org/wiki/Aleksandr_Gorbunov"
  },
  "Jasmin Moghbeli": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "SpaceX Crew-7 Commander",
    nationality: "United States",
    launches: "Crew Dragon Endurance",
    totalSpaceTime: "199+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Jasmin_Moghbeli_official_portrait.jpg/330px-Jasmin_Moghbeli_official_portrait.jpg&w=200&h=200&fit=cover",
    bio: "Jasmin Moghbeli is a U.S. Marine Corps helicopter test pilot and NASA astronaut who commanded SpaceX Crew-7.",
    wikiUrl: "https://en.wikipedia.org/wiki/Jasmin_Moghbeli"
  },
  "Loral O'Hara": {
    agency: "NASA",
    flag: "🇺🇸",
    role: "Flight Engineer",
    nationality: "United States",
    launches: "Soyuz MS-24",
    totalSpaceTime: "204+ days",
    avatar: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/65/Loral_O%27Hara_official_portrait.jpg/330px-Loral_O%27Hara_official_portrait.jpg&w=200&h=200&fit=cover",
    bio: "Loral Ashley O'Hara is an American engineer and NASA astronaut who spent over 200 days conducting research aboard the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Loral_O%27Hara"
  }
};

const getAstronautBio = (name, craft) => {
  const defaultAgency = craft === "ISS" ? "PARTNER 🚀" : "CMSA 🇨🇳";
  
  if (ASTRONAUT_BIOS[name]) return ASTRONAUT_BIOS[name];

  const cleanInput = name.toLowerCase().replace(/[^a-z]/g, "");
  for (const knownKey in ASTRONAUT_BIOS) {
    const cleanKnown = knownKey.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanInput.includes(cleanKnown) || cleanKnown.includes(cleanInput)) {
      return ASTRONAUT_BIOS[knownKey];
    }
    const lastName = knownKey.split(" ").pop().toLowerCase();
    if (lastName.length > 3 && cleanInput.includes(lastName)) {
      return ASTRONAUT_BIOS[knownKey];
    }
  }

  return {
    agency: defaultAgency,
    flag: "",
    role: "Flight Engineer / Astronaut",
    nationality: "Space Explorer",
    launches: craft || "Orbital Craft",
    totalSpaceTime: "Active Mission",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E182A&color=8FD2FF&size=200&bold=true`,
    bio: `${name} is currently living and performing scientific research in low Earth orbit aboard the ${craft || "spacecraft"}.`,
    wikiUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`
  };
};

const AstronautAvatar = ({ uri, name = "Astronaut", size = 48 }) => {
  const [imgUri, setImgUri] = useState(uri);
  const [imgError, setImgError] = useState(false);
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0E182A&color=8FD2FF&size=200&bold=true`;

  useEffect(() => {
    let isMounted = true;

    const fetchWikipediaImage = () => {
      const formattedName = name.replace(/\s+/g, '_');
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedName)}`, {
        headers: { 'User-Agent': 'NASA-API-MobileApp/1.0' }
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          const wikiImg = data?.thumbnail?.source || data?.originalimage?.source;
          if (wikiImg) {
            const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(wikiImg.replace(/^https?:\/\//, ''))}&w=200&h=200&fit=cover`;
            setImgUri(proxiedUrl);
          } else if (uri) {
            setImgUri(uri);
          } else {
            setImgUri(initialsAvatar);
          }
        })
        .catch(() => {
          if (isMounted) setImgUri(uri || initialsAvatar);
        });
    };

    fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(name)}&media_type=image`)
      .then((res) => res.json())
      .then((nasaData) => {
        if (!isMounted) return;
        const items = nasaData?.collection?.items || [];
        let nasaImg = null;

        for (const item of items) {
          const links = item?.links || [];
          const imgLink = links.find(
            (l) => l.href && (l.render === 'image' || l.href.match(/\.(jpg|jpeg|png)($|\?)/i))
          );
          if (imgLink?.href) {
            nasaImg = imgLink.href;
            break;
          }
        }

        if (nasaImg) {
          setImgUri(nasaImg);
        } else {
          fetchWikipediaImage();
        }
      })
      .catch(() => {
        if (isMounted) fetchWikipediaImage();
      });

    return () => {
      isMounted = false;
    };
  }, [name, uri]);

  return (
    <View style={[styles.avatarGlowRing, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
      <Image
        source={{ uri: (!imgError && imgUri) ? imgUri : initialsAvatar }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#0E182A" }}
        onError={() => setImgError(true)}
      />
    </View>
  );
};

// Leaflet Interactive Map HTML with Dark Mode as Default and Custom Glowing ISS Marker
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body, html, #map { width:100%; height:100%; background:#05070E; }
    .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#05070E; }
    
    /* Sleek Dark Leaflet UI Controls */
    .leaflet-bar a {
      background: rgba(14, 24, 42, 0.9) !important;
      color: #8FD2FF !important;
      border: 1px solid rgba(143, 210, 255, 0.25) !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
      transition: all 0.2s ease;
    }
    .leaflet-bar a:hover {
      background: #1E293B !important;
      color: #8FD2FF !important;
    }
    .leaflet-control-layers {
      background: rgba(14, 24, 42, 0.94) !important;
      color: #F9F6F2 !important;
      border: 1px solid rgba(143, 210, 255, 0.3) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
      padding: 10px 14px !important;
      backdrop-filter: blur(8px);
    }
    .leaflet-control-layers label {
      font-size: 11px;
      font-weight: 600;
      color: #DCE3F4;
      margin-bottom: 4px;
      cursor: pointer;
    }

    /* Cybernetic Glowing ISS Marker */
    .iss-marker-container {
      position: relative;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .iss-ping-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(143, 210, 255, 0.25);
      border: 1.5px solid #8FD2FF;
      animation: issPulse 2.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .iss-ping-ring-2 {
      position: absolute;
      width: 75%;
      height: 75%;
      border-radius: 50%;
      background: rgba(143, 210, 255, 0.35);
      border: 1px solid #8FD2FF;
      animation: issPulse 2.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 0.7s;
    }
    .iss-core-badge {
      position: relative;
      width: 32px;
      height: 32px;
      border-radius: 16px;
      background: linear-gradient(135deg, #0E182A, #0284C7);
      border: 2px solid #8FD2FF;
      box-shadow: 0 0 16px rgba(143, 210, 255, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      z-index: 2;
    }
    @keyframes issPulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Popup Styling */
    .leaflet-popup-content-wrapper {
      background: rgba(14, 24, 42, 0.95) !important;
      color: #F9F6F2 !important;
      border: 1px solid rgba(143, 210, 255, 0.4) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.7) !important;
      backdrop-filter: blur(8px);
    }
    .leaflet-popup-tip {
      background: rgba(14, 24, 42, 0.95) !important;
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

    // Map Tile Layers
    var dark = L.layerGroup([
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    var satellite = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    var voyager = L.layerGroup([
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });

    // DARK MODE IS DEFAULT TO MATCH SPACE THEME
    dark.addTo(map);

    L.control.layers({
      "🌙 Deep Space Dark": dark,
      "🛰️ Satellite Imagery": satellite,
      "🌈 CartoDB Voyager": voyager,
      "🗺️ OpenStreetMap": osm
    }, null, { position: 'topright' }).addTo(map);

    // Custom Glowing ISS Icon
    var issIcon = L.divIcon({
      className: '',
      html: '<div class="iss-marker-container"><div class="iss-ping-ring"></div><div class="iss-ping-ring-2"></div><div class="iss-core-badge">🛰️</div></div>',
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    });

    var issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    issMarker.bindPopup('<div style="text-align:center; padding:6px 4px;"><div style="color:#8FD2FF; font-weight:800; font-size:14px; letter-spacing:0.5px;">ISS Station</div><div style="color:#A8B4D0; font-size:11px; margin-top:2px;">Live Orbit Telemetry</div></div>');

    var currentLat = 0;
    var currentLon = 0;
    var isFirstPos = true;

    function updatePos(newLat, newLon) {
      if (typeof newLat === 'number' && typeof newLon === 'number') {
        currentLat = newLat;
        currentLon = newLon;
        var newLatLng = new L.LatLng(newLat, newLon);
        issMarker.setLatLng(newLatLng);
        if (isFirstPos) {
          map.setView(newLatLng, 3);
          isFirstPos = false;
        } else {
          map.panTo(newLatLng, { animate: true, duration: 1.2 });
        }
      }
    }

    function recenterMap() {
      if (currentLat !== 0 || currentLon !== 0) {
        map.flyTo([currentLat, currentLon], 3.5, { animate: true, duration: 1.2 });
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
  { name: "Guwahati, India", lat: 26.1445, lon: 91.7362 },
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
  if (hours > 0) return `in ${hours}h ${mins}m`;
  if (mins > 0) return `in ${mins}m ${secs}s`;
  return `in ${secs}s`;
};

const formatPassClock = (unixTime) => {
  if (!unixTime) return "--";
  const d = new Date(unixTime * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const VIDEO_CHANNELS = [
  {
    id: "iss_live",
    name: "Live Video from the International Space Station (Official NASA Stream)",
    shortName: "NASA ISS Live",
    badge: "OFFICIAL NASA STREAM",
    icon: "videocam",
    videoId: "M3HKLzjvKPc",
    url: "https://www.youtube.com/live/M3HKLzjvKPc?si=IEn_vg72GRQKyX3t",
    description: "Official NASA live high-definition video stream broadcast from external cameras on the International Space Station.",
  },
];

const YOUTUBE_DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36";

const getYouTubePlayerUri = (videoId) => {
  const queryData = JSON.stringify({
    videoId_s: videoId,
    controls_s: 1,
    playsinline: 1,
    rel_s: 0,
    modestbranding_s: 1,
    allowWebViewZoom: false,
  });
  return `https://lonelycpp.github.io/react-native-youtube-iframe/iframe_v2.html?data=${encodeURIComponent(queryData)}`;
};

const generateFallbackPasses = (loc) => {
  const now = Math.floor(Date.now() / 1000);
  return [
    { start: now + 3800, end: now + 4140, duration: 340, max_elevation: 68.4, azimuth: 215, visibility: "High Visibility Pass" },
    { start: now + 9400, end: now + 9690, duration: 290, max_elevation: 46.2, azimuth: 195, visibility: "Evening Twilight Pass" },
    { start: now + 15000, end: now + 15360, duration: 360, max_elevation: 74.8, azimuth: 230, visibility: "Clear Sky Flyover" },
  ];
};

const ISSTracker = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [issData, setIssData] = useState(null);
  const [astrosData, setAstrosData] = useState(null);
  const [locationName, setLocationName] = useState("Acquiring region...");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Unit toggle: Metric (km/h, km) vs Imperial (mph, mi)
  const [isMetric, setIsMetric] = useState(true);

  // Astronauts station filter: 'ALL' | 'ISS' | 'TIANGONG'
  const [activeStationFilter, setActiveStationFilter] = useState('ALL');

  // Astronaut Bio Modal State
  const [selectedAstros, setSelectedAstros] = useState(null);
  const [bioModalVisible, setBioModalVisible] = useState(false);

  // Fullscreen Map Modal State
  const [fullMapVisible, setFullMapVisible] = useState(false);

  // Live HD Video Stream State
  const [activeVideoChannel, setActiveVideoChannel] = useState("iss_live");
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [fullVideoVisible, setFullVideoVisible] = useState(false);

  // Overhead Pass Predictor State
  const [cityList, setCityList] = useState(PRESET_LOCATIONS);
  const [targetLocation, setTargetLocation] = useState(PRESET_LOCATIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [passData, setPassData] = useState([]);
  const [passLoading, setPassLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [countdownTick, setCountdownTick] = useState(0);

  // Stargazing Weather Conditions State
  const [passWeather, setPassWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const livePulseAnim = useRef(new Animated.Value(1)).current;
  const refreshSpin = useRef(new Animated.Value(0)).current;
  
  const mapWebViewRef = useRef(null);
  const fullMapWebViewRef = useRef(null);

  // Live Pulse Animation for Header Beacon
  useEffect(() => {
    const livePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulseAnim, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(livePulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    livePulse.start();
    return () => livePulse.stop();
  }, []);

  // Online City Geocoding Search (Open-Meteo API)
  const searchCitiesOnline = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingCity(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`
      );
      const data = await res.json();
      if (data?.results && Array.isArray(data.results)) {
        const formatted = data.results.map((item) => ({
          name: `${item.name}${item.admin1 ? `, ${item.admin1}` : ""}`,
          country: item.country || "",
          lat: Number(item.latitude.toFixed(4)),
          lon: Number(item.longitude.toFixed(4)),
          isCustom: true,
        }));
        setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingCity(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchCitiesOnline(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectCityLocation = (loc) => {
    setTargetLocation(loc);
    setCityList((prev) => {
      if (!prev.some((c) => c.name.toLowerCase() === loc.name.toLowerCase())) {
        return [loc, ...prev];
      }
      return prev;
    });
    setSearchQuery("");
    setSearchResults([]);
    setLocationModalVisible(false);
  };

  // Fetch live ISS telemetry
  const fetchIssData = async (manual = false) => {
    if (manual) {
      setIsRefreshing(true);
      Animated.timing(refreshSpin, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => refreshSpin.setValue(0));
    }

    try {
      const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
      const data = await res.json();
      setIssData(data);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
            setLocationName(`Over ${ocean}`);
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
      if (manual) setIsRefreshing(false);
    }
  };

  const injectPos = (ref) => {
    if (issData?.latitude != null && issData?.longitude != null && ref?.current) {
      const js = `if (typeof updatePos === 'function') { updatePos(${issData.latitude}, ${issData.longitude}); } true;`;
      ref.current.injectJavaScript(js);
    }
  };

  const recenterMapOnISS = (ref) => {
    if (ref?.current) {
      ref.current.injectJavaScript("if (typeof recenterMap === 'function') { recenterMap(); } true;");
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

  // Handle GPS location messages from WebView bridge
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
            ? `Current GPS (${geoData.country_code})${accStr}`
            : `Current GPS Location${accStr}`;
          setTargetLocation({ name, lat, lon, isGps: true });
        } catch {
          setTargetLocation({ name: `Current GPS Location${accStr}`, lat, lon, isGps: true });
        } finally {
          setGpsLoading(false);
          setLocationModalVisible(false);
        }
      } else if (data?.type === 'GPS_ERROR') {
        await useIpFallback();
      }
    } catch {
      // Ignore non-JSON
    }
  };

  const useIpFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data?.latitude && data?.longitude) {
        const cityName = data.city || data.region || "Current Location";
        const countryCode = data.country_code || "";
        const name = `${cityName}${countryCode ? `, ${countryCode}` : ""}`;
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

  const requestAndroidLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'GPS Location Permission',
            message: 'This app needs access to your GPS location to accurately predict ISS flyovers and sky passes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn("Android GPS permission error:", err);
        return false;
      }
    }
    return true;
  };

  const fetchGpsLocation = async () => {
    setGpsLoading(true);

    const hasAndroidPermission = await requestAndroidLocationPermission();
    if (!hasAndroidPermission) {
      alert("GPS location permission was denied. Using approximate network location.");
      await useIpFallback();
      return;
    }

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
              ? `Current GPS (${geoData.country_code})${accStr}`
              : `Current GPS Location${accStr}`;
            setTargetLocation({ name, lat, lon, isGps: true });
          } catch {
            setTargetLocation({ name: `Current GPS Location${accStr}`, lat, lon, isGps: true });
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
          visibility: item.max_elevation > 50 ? "High Visibility Pass" : "Good Flyover"
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

  // Weather & Cloud Cover Forecast for Next Pass (Open-Meteo)
  const fetchWeatherForPass = async (loc, pass) => {
    if (!loc?.lat || !loc?.lon || !pass?.start) return;
    setWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=cloud_cover,visibility,weather_code,temperature_2m&forecast_days=3`
      );
      const data = await res.json();
      if (data?.hourly?.time && Array.isArray(data.hourly.time)) {
        const passMs = pass.start * 1000;
        let closestIdx = 0;
        let minDiff = Infinity;
        data.hourly.time.forEach((tStr, idx) => {
          const tMs = new Date(tStr).getTime();
          const diff = Math.abs(tMs - passMs);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        const cloud = data.hourly.cloud_cover?.[closestIdx] ?? 18;
        const temp = Math.round(data.hourly.temperature_2m?.[closestIdx] ?? 21);
        const visMeters = data.hourly.visibility?.[closestIdx] ?? 12000;
        const visKm = Math.min(50, Math.round(visMeters / 1000));

        let status = "Clear Sky 🌌";
        let shortRating = "⭐⭐⭐⭐⭐ Clear";
        let ratingColor = COLORS.emerald;
        let ratingBg = COLORS.emeraldSoft;
        let advice = "Exceptional viewing! Cloud-free skies mean the station will shine brightly overhead.";

        if (cloud <= 20) {
          status = "Clear Sky 🌌";
          shortRating = "⭐⭐⭐⭐⭐ Clear";
          ratingColor = COLORS.emerald;
          ratingBg = COLORS.emeraldSoft;
          advice = "Exceptional viewing! Cloud-free skies mean the station will shine brightly overhead.";
        } else if (cloud <= 45) {
          status = "Mostly Clear 🌤";
          shortRating = "⭐⭐⭐⭐ Good";
          ratingColor = COLORS.accent;
          ratingBg = COLORS.accentSoft;
          advice = "Scattered clouds. Great chance of spotting the station as it glides overhead.";
        } else if (cloud <= 70) {
          status = "Partly Cloudy ⛅";
          shortRating = "⭐⭐⭐ Fair";
          ratingColor = COLORS.amber;
          ratingBg = COLORS.amberSoft;
          advice = "Broken clouds present. Look for clear patches in the sky along the flight path.";
        } else {
          status = "Heavy Clouds ☁️";
          shortRating = "⭐ Obscured";
          ratingColor = COLORS.danger;
          ratingBg = COLORS.dangerSoft;
          advice = "Thick clouds may obstruct visibility. Check the upcoming flyovers below.";
        }

        setPassWeather({
          cloudCover: cloud,
          tempC: temp,
          visibilityKm: visKm,
          status,
          shortRating,
          ratingColor,
          ratingBg,
          advice,
        });
      } else {
        setPassWeather({
          cloudCover: 15,
          tempC: 22,
          visibilityKm: 16,
          status: "Clear Sky 🌌",
          shortRating: "⭐⭐⭐⭐ Good",
          ratingColor: COLORS.emerald,
          ratingBg: COLORS.emeraldSoft,
          advice: "Favorable clear sky conditions expected during this orbital pass window.",
        });
      }
    } catch {
      setPassWeather({
        cloudCover: 15,
        tempC: 22,
        visibilityKm: 16,
        status: "Clear Sky 🌌",
        shortRating: "⭐⭐⭐⭐ Good",
        ratingColor: COLORS.emerald,
        ratingBg: COLORS.emeraldSoft,
        advice: "Favorable clear sky conditions expected during this orbital pass window.",
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses(targetLocation);
  }, [targetLocation]);

  useEffect(() => {
    if (targetLocation?.lat != null && targetLocation?.lon != null && passData.length > 0) {
      fetchWeatherForPass(targetLocation, passData[0]);
    }
  }, [targetLocation, passData]);

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

  // Filter astronauts by station
  const filteredPeople = astrosData?.people ? astrosData.people.filter((p) => {
    if (activeStationFilter === 'ISS') return p.craft === 'ISS';
    if (activeStationFilter === 'TIANGONG') return p.craft === 'Tiangong';
    return true;
  }) : [];

  const spinInterpolate = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Explorer Space Navy Linear Gradient Background */}
      <LinearGradient
        colors={["#05070E", "#0A1122", "#070C18"]}
        style={[styles.gradientCanvas, { paddingTop: insets.top }]}
      >
        {/* Top Header - Explorer Unified Style */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>ORBITAL TELEMETRY</Text>
            <Text style={styles.headerTitle}>ISS Live Tracker</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={styles.refreshIconBtn}
              onPress={() => fetchIssData(true)}
              disabled={isRefreshing}
            >
              <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                <Ionicons name="sync" size={17} color={COLORS.accent} />
              </Animated.View>
            </Pressable>

            <View style={styles.liveTelemetryBadge}>
              <Animated.View
                style={[
                  styles.liveDotPulsing,
                  { transform: [{ scale: livePulseAnim }] }
                ]}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ============================================================ */}
          {/* SECTION 1: HERO ORBITAL TRACK & LEAFLET MAP MODULE */}
          {/* ============================================================ */}
          <RevealView delay={30}>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.collectionBadge}>
                  <Ionicons name="navigate-outline" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.collectionBadgeText}>INTERNATIONAL SPACE STATION</Text>
                </View>

                {issData?.visibility ? (
                  <View
                    style={[
                      styles.statusPill,
                      issData.visibility === "daylight" ? styles.statusPillDay : styles.statusPillNight
                    ]}
                  >
                    <Ionicons
                      name={issData.visibility === "daylight" ? "sunny" : "moon"}
                      size={12}
                      color={issData.visibility === "daylight" ? COLORS.amber : COLORS.accent}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: issData.visibility === "daylight" ? COLORS.amber : COLORS.accent }
                      ]}
                    >
                      {issData.visibility === "daylight" ? "DAYLIGHT" : "NIGHT"}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.mainTitle} numberOfLines={1}>{locationName}</Text>
              <Text style={styles.heroSubtitle}>
                {lastUpdated ? `Telemetry active • Ping at ${lastUpdated} UTC` : "Connecting to NASA telemetry stream..."}
              </Text>

              {/* Interactive Leaflet Map Frame */}
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

                {/* Floating Map HUD Badge Overlays */}
                <View style={styles.mapFloatingCoordsHud}>
                  <Text style={styles.mapCoordsText}>
                    {issData
                      ? `${issData.latitude >= 0 ? issData.latitude.toFixed(2) + '°N' : Math.abs(issData.latitude).toFixed(2) + '°S'}, ${issData.longitude >= 0 ? issData.longitude.toFixed(2) + '°E' : Math.abs(issData.longitude).toFixed(2) + '°W'}`
                      : "Locating..."}
                  </Text>
                </View>

                {/* Floating Recenter ISS Button */}
                <BouncyPressable
                  style={styles.mapRecenterHudBtn}
                  onPress={() => recenterMapOnISS(mapWebViewRef)}
                >
                  <Ionicons name="locate" size={17} color={COLORS.accent} />
                </BouncyPressable>
              </View>

              {/* Map Footer Control Row */}
              <View style={styles.mapFooterRow}>
                <View style={styles.mapTrackStatusWrap}>
                  <Ionicons name="compass-outline" size={15} color={COLORS.accent} />
                  <Text style={styles.mapFooterText}>
                    LEO Ground Track: {issData ? `${Math.round(issData.altitude)} km alt • 92.7m orbit` : "Acquiring..."}
                  </Text>
                </View>

                <Pressable style={styles.expandMapBtn} onPress={() => setFullMapVisible(true)}>
                  <Ionicons name="expand-outline" size={13} color={COLORS.accent} />
                  <Text style={styles.expandMapText}>Fullscreen</Text>
                </Pressable>
              </View>
            </View>
          </RevealView>

          {/* ============================================================ */}
          {/* SECTION 2: LIVE ISS HD VIDEO STREAM (EARTH VIEWS & NASA TV) */}
          {/* ============================================================ */}
          {(() => {
            const currentChannel = VIDEO_CHANNELS.find((ch) => ch.id === activeVideoChannel) || VIDEO_CHANNELS[0];
            const isNight = issData?.visibility === "night";

            return (
              <RevealView delay={45}>
                <View style={styles.videoSectionCard}>
                  {/* Section Title & Header Bar */}
                  <View style={styles.videoSectionHeader}>
                    <View style={styles.videoHeaderLeft}>
                      <View style={styles.videoLiveBadge}>
                        <Animated.View
                          style={[
                            styles.videoLiveDot,
                            { transform: [{ scale: livePulseAnim }] }
                          ]}
                        />
                        <Text style={styles.videoLiveBadgeText}>LIVE HD FEED</Text>
                      </View>
                      <Text style={styles.videoCardTitle}>ISS External Camera</Text>
                    </View>

                    {/* Quick Action Buttons: Pause/Play, Fullscreen, YouTube */}
                    <View style={styles.videoHeaderActions}>
                      <Pressable
                        style={[styles.videoControlIconBtn, !isVideoPlaying && styles.videoControlIconBtnActive]}
                        onPress={() => setIsVideoPlaying(!isVideoPlaying)}
                        hitSlop={6}
                      >
                        <Ionicons
                          name={isVideoPlaying ? "pause" : "play"}
                          size={13}
                          color={isVideoPlaying ? COLORS.textSecondary : COLORS.accent}
                        />
                      </Pressable>

                      <Pressable
                        style={styles.videoControlIconBtn}
                        onPress={() => setFullVideoVisible(true)}
                        hitSlop={6}
                      >
                        <Ionicons name="expand-outline" size={13} color={COLORS.accent} />
                      </Pressable>

                      <Pressable
                        style={styles.videoControlIconBtn}
                        onPress={() => Linking.openURL(currentChannel.url || `https://www.youtube.com/live/${currentChannel.videoId}`)}
                        hitSlop={6}
                      >
                        <Ionicons name="logo-youtube" size={14} color="#FF4D4D" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Channel Switcher or Stream Meta Row */}
                  {VIDEO_CHANNELS.length > 1 ? (
                    <View style={styles.videoChannelTabsRow}>
                      {VIDEO_CHANNELS.map((channel) => {
                        const isSelected = channel.id === activeVideoChannel;
                        return (
                          <Pressable
                            key={channel.id}
                            style={[styles.videoChannelTab, isSelected && styles.videoChannelTabActive]}
                            onPress={() => setActiveVideoChannel(channel.id)}
                          >
                            <Ionicons
                              name={channel.icon}
                              size={14}
                              color={isSelected ? COLORS.accent : COLORS.textMuted}
                              style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.videoChannelTabText, isSelected && styles.videoChannelTabTextActive]}>
                              {channel.shortName}
                            </Text>
                            {isSelected ? <View style={styles.channelActiveIndicator} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.videoStreamMetaRow}>
                      <View style={styles.videoMetaBadge}>
                        <Ionicons name="videocam" size={13} color={COLORS.accent} style={{ marginRight: 6 }} />
                        <Text style={styles.videoMetaBadgeText} numberOfLines={1}>{currentChannel.name}</Text>
                      </View>
                      <View style={styles.videoQualityPill}>
                        <Text style={styles.videoQualityPillText}>HD 1080p</Text>
                      </View>
                    </View>
                  )}

                  {/* Video Viewport Frame (16:9 ratio) */}
                  <View style={styles.videoFrameWrapper}>
                    {isVideoPlaying ? (
                      <WebView
                        key={`stream-${currentChannel.id}`}
                        source={{ uri: getYouTubePlayerUri(currentChannel.videoId) }}
                        style={styles.videoWebView}
                        originWhitelist={['*']}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsInlineMediaPlayback
                        allowsFullscreenVideo
                        mediaPlaybackRequiresUserAction={false}
                        scrollEnabled={false}
                        userAgent={YOUTUBE_DESKTOP_UA}
                      />
                    ) : (
                      <View style={styles.videoPausedCover}>
                        <LinearGradient
                          colors={["rgba(14, 24, 42, 0.95)", "rgba(5, 7, 14, 0.98)"]}
                          style={styles.videoPausedGradient}
                        >
                          <View style={styles.videoPausedCircle}>
                            <Ionicons name="play" size={26} color={COLORS.accent} style={{ marginLeft: 3 }} />
                          </View>
                          <Text style={styles.videoPausedTitle}>Live Stream Paused</Text>
                          <Text style={styles.videoPausedDesc}>
                            Stream paused to save mobile bandwidth. Tap below to resume live video feed.
                          </Text>
                          <Pressable
                            style={styles.videoResumeBtn}
                            onPress={() => setIsVideoPlaying(true)}
                          >
                            <Ionicons name="play-circle" size={16} color="#05070E" />
                            <Text style={styles.videoResumeBtnText}>Resume Live HD Stream</Text>
                          </Pressable>
                        </LinearGradient>
                      </View>
                    )}

                    {/* Floating Audio Tip Badge */}
                    {isVideoPlaying ? (
                      <View style={styles.videoAudioBadge}>
                        <Ionicons name="volume-mute" size={11} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.videoAudioBadgeText}>Starts muted • Unmute on player</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Channel Description & Orbital Lighting Status Bar */}
                  <View style={styles.videoStatusFooter}>
                    <View style={styles.videoStatusRow}>
                      <Ionicons
                        name={isNight ? "moon" : "sunny"}
                        size={13}
                        color={isNight ? COLORS.accent : COLORS.amber}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.videoStatusLightText} numberOfLines={1}>
                        {isNight
                          ? "Station in Orbital Night shadow (dark camera view)"
                          : "Station in Orbital Daylight (Earth surface in sunlight)"}
                      </Text>
                    </View>

                    <Text style={styles.videoChannelDescription}>
                      {currentChannel.description}
                    </Text>

                    <View style={styles.videoLosNoticeWrap}>
                      <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 5 }} />
                      <Text style={styles.videoLosNoticeText}>
                        Feed displays standby slate during orbital night or LOS (Loss of Signal) satellite handover.
                      </Text>
                    </View>

                    {/* Direct Watch on YouTube App Button */}
                    <Pressable
                      style={styles.openExternalYoutubeBtn}
                      onPress={() => Linking.openURL(currentChannel.url || `https://www.youtube.com/live/${currentChannel.videoId}`)}
                    >
                      <Ionicons name="logo-youtube" size={16} color="#FF0000" style={{ marginRight: 8 }} />
                      <Text style={styles.openExternalYoutubeText}>Watch Stream on YouTube App</Text>
                      <Ionicons name="open-outline" size={13} color={COLORS.accent} style={{ marginLeft: "auto" }} />
                    </Pressable>
                  </View>
                </View>
              </RevealView>
            );
          })()}

          {/* ============================================================ */}
          {/* SECTION 3: REAL-TIME TELEMETRY INSTRUMENT PANEL */}
          {/* ============================================================ */}
          <RevealView delay={60}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>REAL-TIME INSTRUMENTATION</Text>

              {/* Unit Toggle Pill (km/h vs mph) */}
              <Pressable
                style={styles.unitTogglePill}
                onPress={() => setIsMetric(!isMetric)}
              >
                <Text style={[styles.unitToggleOption, isMetric && styles.unitToggleOptionActive]}>KM/H</Text>
                <View style={styles.unitToggleDivider} />
                <Text style={[styles.unitToggleOption, !isMetric && styles.unitToggleOptionActive]}>MPH</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.loadingText}>Connecting to NASA ISS telemetry stream...</Text>
              </View>
            ) : issData ? (
              <View style={styles.summaryGrid}>
                {/* Row 1: Velocity & Altitude */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <View style={styles.cardIconHeader}>
                      <Ionicons name="speedometer-outline" size={16} color={COLORS.accent} />
                      <Text style={styles.summaryLabel}>ORBITAL VELOCITY</Text>
                    </View>
                    <Text style={styles.summaryValue}>
                      {isMetric
                        ? `${Math.round(issData.velocity).toLocaleString()}`
                        : `${Math.round(issData.velocity * 0.621371).toLocaleString()}`}
                      <Text style={styles.summaryUnit}>{isMetric ? " km/h" : " mph"}</Text>
                    </Text>
                    <Text style={styles.summarySub}>
                      Mach ~{(issData.velocity / 1225).toFixed(1)} • {(issData.velocity / 3600).toFixed(2)} km/s
                    </Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <View style={styles.cardIconHeader}>
                      <Ionicons name="arrow-up-circle-outline" size={16} color={COLORS.emerald} />
                      <Text style={styles.summaryLabel}>ALTITUDE (LEO)</Text>
                    </View>
                    <Text style={styles.summaryValue}>
                      {isMetric
                        ? `${Math.round(issData.altitude)}`
                        : `${Math.round(issData.altitude * 0.621371)}`}
                      <Text style={styles.summaryUnit}>{isMetric ? " km" : " mi"}</Text>
                    </Text>
                    <Text style={styles.summarySub}>Thermosphere Layer</Text>
                  </View>
                </View>

                {/* Row 2: Latitude & Longitude */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <View style={styles.cardIconHeader}>
                      <Ionicons name="compass-outline" size={16} color={COLORS.amber} />
                      <Text style={styles.summaryLabel}>LATITUDE</Text>
                    </View>
                    <Text style={styles.summaryValue}>
                      {Math.abs(issData.latitude).toFixed(3)}°
                      <Text style={styles.summaryUnit}> {issData.latitude >= 0 ? "N" : "S"}</Text>
                    </Text>
                    <Text style={styles.summarySub}>
                      {issData.latitude >= 0 ? "Northern Hemisphere" : "Southern Hemisphere"}
                    </Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <View style={styles.cardIconHeader}>
                      <Ionicons name="globe-outline" size={16} color={COLORS.accent} />
                      <Text style={styles.summaryLabel}>LONGITUDE</Text>
                    </View>
                    <Text style={styles.summaryValue}>
                      {Math.abs(issData.longitude).toFixed(3)}°
                      <Text style={styles.summaryUnit}> {issData.longitude >= 0 ? "E" : "W"}</Text>
                    </Text>
                    <Text style={styles.summarySub}>
                      {issData.longitude >= 0 ? "Eastern Meridian" : "Western Meridian"}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.errorCard}>
                <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
                <Text style={styles.errorText}>Unable to connect to ISS telemetry stream.</Text>
              </View>
            )}
          </RevealView>

          {/* ============================================================ */}
          {/* SECTION 4: OVERHEAD FLYOVER PREDICTOR & SKY WEATHER */}
          {/* ============================================================ */}
          {(() => {
            const currentDistanceKm = (issData?.latitude != null && issData?.longitude != null)
              ? calculateDistanceKm(issData.latitude, issData.longitude, targetLocation.lat, targetLocation.lon)
              : null;
            const nextPass = passData && passData.length > 0 ? passData[0] : null;
            const isOverheadNow = currentDistanceKm !== null && currentDistanceKm <= 1800;
            const isApproaching = currentDistanceKm !== null && currentDistanceKm > 1800 && currentDistanceKm <= 3500;

            return (
              <RevealView delay={90}>
                <View style={styles.predictorSection}>
                  <Text style={styles.sectionHeaderTitle}>OVERHEAD FLYOVER PREDICTOR</Text>

                  {/* PROPERLY OPTIMIZED DEDICATED LOCATION SELECTOR BAR */}
                  <View style={styles.locationSelectorCard}>
                    <Pressable
                      style={styles.locationSelectorPressable}
                      onPress={() => setLocationModalVisible(true)}
                    >
                      <View style={styles.locationSelectorIconWrap}>
                        <Ionicons name="location-sharp" size={18} color={COLORS.accent} />
                      </View>
                      <View style={styles.locationSelectorInfo}>
                        <Text style={styles.locationSelectorEyebrow}>FLYOVER GROUND TARGET</Text>
                        <Text style={styles.locationSelectorTitle} numberOfLines={1}>
                          {targetLocation.name}
                        </Text>
                        <Text style={styles.locationSelectorCoords}>
                          {targetLocation.lat >= 0 ? `${targetLocation.lat.toFixed(2)}°N` : `${Math.abs(targetLocation.lat).toFixed(2)}°S`}, {targetLocation.lon >= 0 ? `${targetLocation.lon.toFixed(2)}°E` : `${Math.abs(targetLocation.lon).toFixed(2)}°W`}
                        </Text>
                      </View>
                      <View style={styles.locationChangeBtn}>
                        <Text style={styles.locationChangeBtnText}>Change</Text>
                        <Ionicons name="chevron-forward" size={13} color={COLORS.accent} />
                      </View>
                    </Pressable>
                  </View>

                  <View style={styles.flightMissionCard}>
                    {/* Proximity Beacon & Real-Time Distance Banner */}
                    <View style={styles.flightBeaconRow}>
                      <View style={styles.beaconLeft}>
                        <View
                          style={[
                            styles.beaconDot,
                            isOverheadNow ? styles.beaconGreen : isApproaching ? styles.beaconAmber : styles.beaconSky
                          ]}
                        />
                        <Text style={styles.beaconText}>
                          {isOverheadNow ? "OVERHEAD NOW 🚀" : isApproaching ? "APPROACHING TARGET 🛰️" : "ORBITING GLOBE 🌌"}
                        </Text>
                      </View>

                      {currentDistanceKm !== null ? (
                        <View style={styles.distanceBadge}>
                          <Ionicons name="radio" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                          <Text style={styles.beaconDistanceText}>
                            {isMetric
                              ? `${currentDistanceKm.toLocaleString()} km away`
                              : `${Math.round(currentDistanceKm * 0.621371).toLocaleString()} mi away`}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {passLoading ? (
                      <View style={styles.passLoadingBox}>
                        <ActivityIndicator size="small" color={COLORS.accent} />
                        <Text style={styles.passLoadingText}>Computing orbital flyover trajectories...</Text>
                      </View>
                    ) : nextPass ? (
                      <>
                        {/* Next Pass Hero Display with Live Digital Countdown */}
                        <View style={styles.nextPassHeroRow}>
                          <View>
                            <Text style={styles.nextPassLabel}>NEXT VISIBLE PASS</Text>
                            <Text style={styles.nextPassTimeText}>
                              {formatPassClock(nextPass.start)}{" "}
                              <Text style={styles.nextPassDateSub}>Today</Text>
                            </Text>
                          </View>

                          <View style={styles.relativeCountdownBadge}>
                            <Ionicons name="timer-outline" size={14} color={COLORS.accent} style={{ marginRight: 4 }} />
                            <Text style={styles.relativeCountdownText}>{formatTimeUntil(nextPass.start)}</Text>
                          </View>
                        </View>

                        {/* Structured Aerospace Flight Trajectory Row */}
                        <View style={styles.flightTrajectoryRow}>
                          <View style={styles.trajectoryItem}>
                            <Text style={styles.trajectoryLabel}>PEAK ELEVATION</Text>
                            <Text style={styles.trajectoryValue}>
                              {nextPass.max_elevation ? `${Math.round(nextPass.max_elevation)}° High` : "68° High"}
                            </Text>
                            <Text style={styles.trajectorySubRating}>
                              {nextPass.max_elevation > 50 ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐"}
                            </Text>
                          </View>

                          <View style={styles.trajectoryDivider} />

                          <View style={styles.trajectoryItem}>
                            <Text style={styles.trajectoryLabel}>DURATION</Text>
                            <Text style={styles.trajectoryValue}>
                              {nextPass.duration
                                ? `${Math.round(nextPass.duration / 60)}m ${nextPass.duration % 60}s`
                                : "5m 30s"}
                            </Text>
                            <Text style={styles.trajectorySubRating}>Flyover Window</Text>
                          </View>

                          <View style={styles.trajectoryDivider} />

                          <View style={styles.trajectoryItem}>
                            <Text style={styles.trajectoryLabel}>FLIGHT VECTOR</Text>
                            <Text style={styles.trajectoryValueSky}>NW 🧭 ➔ SE</Text>
                            <Text style={styles.trajectorySubRating}>Ascending Track</Text>
                          </View>
                        </View>

                        {/* PROPERLY OPTIMIZED STARGAZING SKY CONDITIONS (NO TRUNCATION) */}
                        <View style={styles.stargazingCard}>
                          <View style={styles.stargazingHeader}>
                            <View style={styles.stargazingHeaderLeft}>
                              <Ionicons name="telescope-outline" size={15} color={COLORS.accent} style={{ marginRight: 6 }} />
                              <Text style={styles.stargazingHeaderText}>SKY CONDITIONS AT PASS</Text>
                            </View>
                            {weatherLoading ? (
                              <ActivityIndicator size="small" color={COLORS.accent} />
                            ) : passWeather ? (
                              <View
                                style={[
                                  styles.stargazingRatingBadge,
                                  { borderColor: passWeather.ratingColor, backgroundColor: passWeather.ratingBg }
                                ]}
                              >
                                <Text style={[styles.stargazingRatingText, { color: passWeather.ratingColor }]}>
                                  {passWeather.shortRating}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {passWeather ? (
                            <View style={styles.stargazingBody}>
                              <View style={styles.stargazingMetricsRow}>
                                {/* Sky Status */}
                                <View style={styles.stargazingMetricItem}>
                                  <Text style={styles.stargazingMetricLabel}>SKY FORECAST</Text>
                                  <Text style={styles.stargazingMetricValue} numberOfLines={1}>{passWeather.status}</Text>
                                  <Text style={styles.stargazingMetricSub}>Atmospheric Model</Text>
                                </View>

                                <View style={styles.stargazingDivider} />

                                {/* Cloud Cover Bar */}
                                <View style={[styles.stargazingMetricItem, { flex: 1.2 }]}>
                                  <Text style={styles.stargazingMetricLabel}>CLOUD COVER</Text>
                                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                                    <Text style={styles.stargazingMetricValue}>
                                      {passWeather.cloudCover}%
                                    </Text>
                                    <Text style={styles.stargazingMetricUnit}>
                                      {passWeather.cloudCover <= 25 ? " (Low)" : passWeather.cloudCover <= 60 ? " (Fair)" : " (High)"}
                                    </Text>
                                  </View>
                                  <View style={styles.cloudMeterTrack}>
                                    <View
                                      style={[
                                        styles.cloudMeterFill,
                                        {
                                          width: `${Math.min(100, Math.max(6, passWeather.cloudCover))}%`,
                                          backgroundColor: passWeather.cloudCover <= 30 ? COLORS.emerald : passWeather.cloudCover <= 70 ? COLORS.amber : COLORS.danger
                                        }
                                      ]}
                                    />
                                  </View>
                                </View>

                                <View style={styles.stargazingDivider} />

                                {/* Ambient Temp & Visibility */}
                                <View style={styles.stargazingMetricItem}>
                                  <Text style={styles.stargazingMetricLabel}>TEMP & SIGHT</Text>
                                  <Text style={styles.stargazingMetricValue}>
                                    {isMetric ? `${passWeather.tempC}°C` : `${Math.round(passWeather.tempC * 9/5 + 32)}°F`}
                                  </Text>
                                  <Text style={styles.stargazingMetricSub}>{passWeather.visibilityKm} km visibility</Text>
                                </View>
                              </View>

                              <View style={styles.stargazingAdviceBox}>
                                <Ionicons name="information-circle-outline" size={13} color={COLORS.accent} style={{ marginRight: 5, marginTop: 1 }} />
                                <Text style={styles.stargazingAdviceText}>
                                  {passWeather.advice}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.weatherLoadingPlaceholder}>
                              <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 8 }} />
                              <Text style={styles.weatherLoadingText}>
                                Querying Open-Meteo atmospheric cloud forecast...
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Interactive Pass Reminder Alert Button */}
                        <Pressable
                          style={[styles.reminderBtn, alertSet && styles.reminderBtnActive]}
                          onPress={() => setAlertSet(!alertSet)}
                        >
                          <Ionicons
                            name={alertSet ? "notifications" : "notifications-outline"}
                            size={16}
                            color={alertSet ? "#05070E" : COLORS.accent}
                          />
                          <Text style={[styles.reminderBtnText, alertSet && styles.reminderBtnTextActive]}>
                            {alertSet ? "Pass Reminder Armed (10m Pre-Alert Active)" : "Set Overhead Pass Alert (10m Notification)"}
                          </Text>
                        </Pressable>

                        {/* Upcoming Pass Forecast List */}
                        {passData.length > 1 ? (
                          <View style={styles.upcomingPassesWrap}>
                            <Text style={styles.upcomingPassesTitle}>UPCOMING FLYOVER FORECAST</Text>
                            {passData.slice(1, 3).map((item, idx) => (
                              <View key={idx} style={styles.upcomingPassRow}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                  <Ionicons name="time-outline" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
                                  <Text style={styles.upcomingPassTime}>{formatPassClock(item.start)}</Text>
                                  <Text style={styles.upcomingPassElev}>• {Math.round(item.max_elevation)}° Elev</Text>
                                </View>
                                <View style={styles.upcomingPassTag}>
                                  <Text style={styles.upcomingPassTagText}>{item.visibility}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </>
                    ) : null}
                  </View>
                </View>
              </RevealView>
            );
          })()}

          {/* ============================================================ */}
          {/* SECTION 5: CREW IN SPACE ONBOARD EXPEDITION ROSTER */}
          {/* ============================================================ */}
          <RevealView delay={120}>
            <View style={styles.crewSection}>
              <View style={styles.crewSectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  CREW IN SPACE NOW {astrosData?.number ? `(${astrosData.number})` : ""}
                </Text>

                {/* Filter Tabs (All / ISS / Tiangong) */}
                <View style={styles.stationTabsContainer}>
                  <Pressable
                    style={[styles.stationTab, activeStationFilter === 'ALL' && styles.stationTabActive]}
                    onPress={() => setActiveStationFilter('ALL')}
                  >
                    <Text style={[styles.stationTabText, activeStationFilter === 'ALL' && styles.stationTabTextActive]}>
                      ALL
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.stationTab, activeStationFilter === 'ISS' && styles.stationTabActive]}
                    onPress={() => setActiveStationFilter('ISS')}
                  >
                    <Text style={[styles.stationTabText, activeStationFilter === 'ISS' && styles.stationTabTextActive]}>
                      ISS
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.stationTab, activeStationFilter === 'TIANGONG' && styles.stationTabActive]}
                    onPress={() => setActiveStationFilter('TIANGONG')}
                  >
                    <Text style={[styles.stationTabText, activeStationFilter === 'TIANGONG' && styles.stationTabTextActive]}>
                      TIANGONG
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.crewListCard}>
                {astrosData?.people ? (
                  filteredPeople.length > 0 ? (
                    filteredPeople.map((person, idx) => {
                      const bioDetails = getAstronautBio(person.name, person.craft);
                      const isLast = idx === filteredPeople.length - 1;

                      return (
                        <Pressable
                          key={idx}
                          style={[styles.crewListRow, !isLast && styles.rowBorderBottom]}
                          onPress={() => openAstronautDetails(person)}
                        >
                          <AstronautAvatar uri={bioDetails.avatar} name={person.name} size={46} />

                          <View style={styles.crewListInfo}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={styles.crewListName} numberOfLines={1}>{person.name}</Text>
                              <View style={styles.agencyTag}>
                                <Text style={styles.agencyTagText}>{bioDetails.agency} {bioDetails.flag || ""}</Text>
                              </View>
                            </View>

                            <Text style={styles.crewListRoleText} numberOfLines={1}>
                              {bioDetails.role}
                            </Text>

                            <View style={styles.craftBadgeRow}>
                              <Ionicons name="rocket-outline" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                              <Text style={styles.crewListCraftText}>
                                {person.craft} • {bioDetails.launches || "Orbital Station"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.crewChevronWrap}>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
                          </View>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={{ padding: 24, alignItems: "center" }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>No astronauts match this filter.</Text>
                    </View>
                  )
                ) : (
                  <View style={{ padding: 32, alignItems: "center" }}>
                    <ActivityIndicator color={COLORS.accent} />
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 10 }}>
                      Loading astronaut expedition roster...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </RevealView>
        </ScrollView>
      </LinearGradient>

      {/* ============================================================ */}
      {/* MODAL 1: FULLSCREEN ORBITAL MAP MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={fullMapVisible}
        animationType="slide"
        onRequestClose={() => setFullMapVisible(false)}
      >
        <View style={styles.fullMapContainer}>
          <SafeAreaView edges={["top"]} style={styles.fullMapHeader}>
            <Pressable style={styles.fullMapCloseBtn} onPress={() => setFullMapVisible(false)}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </Pressable>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.fullMapTitle}>FULLSCREEN ORBITAL MAP</Text>
              <Text style={styles.fullMapSubtitle}>
                {issData ? `${issData.latitude.toFixed(3)}°, ${issData.longitude.toFixed(3)}° • ${Math.round(issData.velocity)} km/h` : "Locating..."}
              </Text>
            </View>

            <Pressable
              style={styles.fullMapRecenterBtn}
              onPress={() => recenterMapOnISS(fullMapWebViewRef)}
            >
              <Ionicons name="locate" size={18} color={COLORS.accent} />
            </Pressable>
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

      {/* ============================================================ */}
      {/* MODAL: FULLSCREEN ISS HD LIVE VIDEO MODAL */}
      {/* ============================================================ */}
      {(() => {
        const fullCurrentChannel = VIDEO_CHANNELS.find((ch) => ch.id === activeVideoChannel) || VIDEO_CHANNELS[0];
        const isNight = issData?.visibility === "night";

        return (
          <Modal
            visible={fullVideoVisible}
            animationType="slide"
            onRequestClose={() => setFullVideoVisible(false)}
          >
            <View style={styles.fullVideoModalContainer}>
              <SafeAreaView edges={["top"]} style={styles.fullVideoHeader}>
                <Pressable style={styles.fullVideoCloseBtn} onPress={() => setFullVideoVisible(false)}>
                  <Ionicons name="close" size={20} color={COLORS.textPrimary} />
                </Pressable>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Animated.View
                      style={[
                        styles.videoLiveDot,
                        { transform: [{ scale: livePulseAnim }] }
                      ]}
                    />
                    <Text style={styles.fullVideoLiveTag}>LIVE HD STREAM</Text>
                  </View>
                  <Text style={styles.fullVideoTitleText} numberOfLines={1}>
                    {fullCurrentChannel.name}
                  </Text>
                </View>

                {/* Switch Channel Directly in Fullscreen or Watch on YouTube */}
                {VIDEO_CHANNELS.length > 1 ? (
                  <View style={styles.fullVideoHeaderSwitch}>
                    {VIDEO_CHANNELS.map((ch) => (
                      <Pressable
                        key={ch.id}
                        style={[
                          styles.fullVideoSwitchBtn,
                          activeVideoChannel === ch.id && styles.fullVideoSwitchBtnActive
                        ]}
                        onPress={() => setActiveVideoChannel(ch.id)}
                      >
                        <Ionicons
                          name={ch.icon}
                          size={13}
                          color={activeVideoChannel === ch.id ? COLORS.accent : COLORS.textMuted}
                        />
                        <Text
                          style={[
                            styles.fullVideoSwitchText,
                            activeVideoChannel === ch.id && styles.fullVideoSwitchTextActive
                          ]}
                        >
                          {ch.shortName}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Pressable
                    style={styles.fullVideoYoutubeBtn}
                    onPress={() => Linking.openURL(fullCurrentChannel.url || `https://www.youtube.com/live/${fullCurrentChannel.videoId}`)}
                  >
                    <Ionicons name="logo-youtube" size={14} color="#FF4D4D" style={{ marginRight: 5 }} />
                    <Text style={styles.fullVideoYoutubeBtnText}>Open in App</Text>
                  </Pressable>
                )}
              </SafeAreaView>

              {/* Main Fullscreen Video Viewport */}
              <View style={styles.fullVideoViewport}>
                <WebView
                  key={`fullscreen-stream-${fullCurrentChannel.id}`}
                  source={{ uri: getYouTubePlayerUri(fullCurrentChannel.videoId) }}
                  style={StyleSheet.absoluteFillObject}
                  originWhitelist={['*']}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  userAgent={YOUTUBE_DESKTOP_UA}
                />
              </View>

              {/* Telemetry HUD Footer */}
              <SafeAreaView edges={["bottom"]} style={styles.fullVideoFooter}>
                <View style={styles.fullVideoTelemetryRow}>
                  <View style={styles.fullVideoTelemetryItem}>
                    <Text style={styles.fullVideoTelemLabel}>ORBIT SPEED</Text>
                    <Text style={styles.fullVideoTelemVal}>
                      {issData ? `${Math.round(issData.velocity).toLocaleString()} km/h` : "27,600 km/h"}
                    </Text>
                  </View>

                  <View style={styles.fullVideoTelemDivider} />

                  <View style={styles.fullVideoTelemetryItem}>
                    <Text style={styles.fullVideoTelemLabel}>ALTITUDE</Text>
                    <Text style={styles.fullVideoTelemVal}>
                      {issData ? `${Math.round(issData.altitude)} km` : "420 km"}
                    </Text>
                  </View>

                  <View style={styles.fullVideoTelemDivider} />

                  <View style={styles.fullVideoTelemetryItem}>
                    <Text style={styles.fullVideoTelemLabel}>ORBITAL LIGHTING</Text>
                    <Text style={[styles.fullVideoTelemVal, { color: isNight ? COLORS.accent : COLORS.amber }]}>
                      {isNight ? "NIGHT SHADOW" : "DAYLIGHT SUN"}
                    </Text>
                  </View>
                </View>

                <View style={styles.fullVideoFooterNoteRow}>
                  <Ionicons name="information-circle" size={13} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.fullVideoFooterNote}>
                    Full HD live feed from NASA High Definition Earth-Viewing system. Turn phone horizontally for cinematic landscape.
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        );
      })()}

      {/* ============================================================ */}
      {/* MODAL 2: ASTRONAUT DOSSIER PROFILE MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={bioModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBioModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bioModalCardElevated}>
            <Pressable
              style={styles.modalCloseCircle}
              onPress={() => setBioModalVisible(false)}
            >
              <Ionicons name="close" size={18} color={COLORS.textPrimary} />
            </Pressable>

            {selectedAstros ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.bioHeaderCenter}>
                  <AstronautAvatar uri={selectedAstros.avatar} name={selectedAstros.name} size={78} />
                  <Text style={styles.bioNameText}>{selectedAstros.name}</Text>
                  
                  <View style={styles.agencyBadgePill}>
                    <Text style={styles.agencyBadgeText}>{selectedAstros.agency} {selectedAstros.flag || ""}</Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.bioDetailsGrid}>
                  <View style={styles.bioDetailPill}>
                    <Ionicons name="briefcase-outline" size={16} color={COLORS.accent} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.bioDetailLabel}>ROLE & ASSIGNMENT</Text>
                      <Text style={styles.bioDetailVal}>{selectedAstros.role}</Text>
                    </View>
                  </View>

                  <View style={styles.bioDetailPill}>
                    <Ionicons name="rocket-outline" size={16} color={COLORS.emerald} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.bioDetailLabel}>LAUNCH VEHICLE</Text>
                      <Text style={styles.bioDetailVal}>{selectedAstros.launches}</Text>
                    </View>
                  </View>

                  <View style={styles.bioDetailPill}>
                    <Ionicons name="time-outline" size={16} color={COLORS.amber} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.bioDetailLabel}>TIME IN SPACE</Text>
                      <Text style={styles.bioDetailVal}>{selectedAstros.totalSpaceTime}</Text>
                    </View>
                  </View>

                  <View style={styles.bioDetailPill}>
                    <Ionicons name="planet-outline" size={16} color={COLORS.accent} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.bioDetailLabel}>CURRENT CRAFT</Text>
                      <Text style={styles.bioDetailVal}>{selectedAstros.craft || "ISS"}</Text>
                    </View>
                  </View>
                </View>

                {/* Biography Narrative */}
                <View style={styles.bioTextSection}>
                  <Text style={styles.bioSectionTitle}>MISSION DOSSIER</Text>
                  <Text style={styles.bioBodyText}>{selectedAstros.bio}</Text>
                </View>

                {/* Wikipedia External Link */}
                {selectedAstros.wikiUrl ? (
                  <Pressable
                    style={styles.wikiLinkBtn}
                    onPress={() => Linking.openURL(selectedAstros.wikiUrl)}
                  >
                    <Ionicons name="book-outline" size={16} color="#05070E" />
                    <Text style={styles.wikiBtnText}>Open Complete Biography</Text>
                    <Ionicons name="open-outline" size={14} color="#05070E" />
                  </Pressable>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: TARGET LOCATION SELECTION & CITY SEARCH MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLocationModalVisible(false)}>
          <Pressable style={styles.locationModalCardElevated} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCardHeader}>
              <View>
                <Text style={styles.modalCardEyebrow}>FLYOVER TARGET</Text>
                <Text style={styles.modalCardTitle}>Select Ground Location</Text>
              </View>
              <Pressable style={styles.modalCloseCircle} onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            {/* Primary On-Device GPS Action Button */}
            <Pressable
              style={styles.gpsPrimaryBtn}
              onPress={fetchGpsLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#05070E" />
              ) : (
                <Ionicons name="navigate" size={17} color="#05070E" />
              )}
              <Text style={styles.gpsPrimaryBtnText}>
                {gpsLoading ? "Acquiring Device GPS..." : "Acquire On-Device GPS"}
              </Text>
            </Pressable>

            {/* Integrated City Search Bar */}
            <View style={styles.searchBarIntegrated}>
              <Ionicons name="search" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search worldwide city (e.g. Guwahati, Tokyo)..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {/* Results List */}
            <ScrollView style={{ maxHeight: 290, marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {isSearchingCity ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8 }}>Searching cities database...</Text>
                </View>
              ) : searchQuery.trim().length > 0 ? (
                searchResults.length > 0 ? (
                  <>
                    <Text style={styles.searchSubHeader}>SEARCH RESULTS</Text>
                    {searchResults.map((loc, idx) => (
                      <Pressable
                        key={`search-${idx}`}
                        style={styles.modalCityRow}
                        onPress={() => selectCityLocation(loc)}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.modalCityName}>{loc.name}</Text>
                          {loc.country ? <Text style={styles.modalCityCountry}>{loc.country}</Text> : null}
                          <Text style={styles.modalCityCoordsMonospace}>
                            {loc.lat >= 0 ? `${loc.lat.toFixed(2)}°N` : `${Math.abs(loc.lat).toFixed(2)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(2)}°E` : `${Math.abs(loc.lon).toFixed(2)}°W`}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={15} color={COLORS.accent} />
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <View style={{ padding: 22, alignItems: "center" }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>No cities found for "{searchQuery}"</Text>
                  </View>
                )
              ) : (
                <>
                  <Text style={styles.searchSubHeader}>PRESET & SAVED LOCATIONS</Text>
                  {cityList.map((loc, idx) => (
                    <Pressable
                      key={`city-${idx}`}
                      style={[styles.modalCityRow, targetLocation.name === loc.name && styles.modalCityRowActive]}
                      onPress={() => selectCityLocation(loc)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalCityName, targetLocation.name === loc.name && styles.modalCityNameActive]}>
                          {loc.name}
                        </Text>
                        <Text style={styles.modalCityCoordsMonospace}>
                          {loc.lat >= 0 ? `${loc.lat.toFixed(2)}°N` : `${Math.abs(loc.lat).toFixed(2)}°S`}, {loc.lon >= 0 ? `${loc.lon.toFixed(2)}°E` : `${Math.abs(loc.lon).toFixed(2)}°W`}
                        </Text>
                      </View>
                      {targetLocation.name === loc.name ? (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                      ) : null}
                    </Pressable>
                  ))}
                </>
              )}
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
    backgroundColor: "#05070E",
  },
  gradientCanvas: {
    flex: 1,
  },

  // Top Header (Matching EPIC, Asteroid, DONKI)
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
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
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  liveTelemetryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.35)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  liveDotPulsing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveDot,
    marginRight: 5,
  },
  liveText: {
    color: COLORS.liveDot,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Hero Card (Matching EPIC.js & Asteroid.js heroCard)
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  collectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143, 210, 255, 0.28)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  collectionBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statusPillDay: {
    backgroundColor: COLORS.amberSoft,
    borderColor: "rgba(255, 176, 103, 0.35)",
  },
  statusPillNight: {
    backgroundColor: COLORS.accentSoft,
    borderColor: "rgba(143, 210, 255, 0.3)",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  mainTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 3,
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  mapFrame: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    position: "relative",
    backgroundColor: "#05070E",
  },
  mapFloatingCoordsHud: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(5, 7, 14, 0.85)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    zIndex: 10,
  },
  mapCoordsText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mapRecenterHudBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(14, 24, 42, 0.9)",
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  mapFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  mapTrackStatusWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  mapFooterText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginLeft: 6,
    fontVariant: ["tabular-nums"],
  },
  expandMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expandMapText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  unitTogglePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  unitToggleOption: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  unitToggleOptionActive: {
    color: COLORS.accent,
  },
  unitToggleDivider: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.border,
  },

  // Telemetry 2x2 Cluster (Matching Asteroid.js summaryCard)
  summaryGrid: {
    gap: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  cardIconHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  summaryUnit: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "500",
  },
  summarySub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255, 122, 122, 0.3)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "600",
  },

  // Dedicated Target Location Selector Bar (Matching unifiedDateBar in Asteroid.js)
  locationSelectorCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  locationSelectorPressable: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  locationSelectorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  locationSelectorInfo: {
    flex: 1,
    marginRight: 8,
  },
  locationSelectorEyebrow: {
    color: COLORS.accent,
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "700",
  },
  locationSelectorTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
  },
  locationSelectorCoords: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  locationChangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 2,
  },
  locationChangeBtnText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
  },

  // Flight Card / Overhead Predictor
  predictorSection: {
    marginBottom: 20,
  },
  flightMissionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  flightBeaconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  beaconLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  beaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  beaconGreen: {
    backgroundColor: COLORS.emerald,
  },
  beaconAmber: {
    backgroundColor: COLORS.amber,
  },
  beaconSky: {
    backgroundColor: COLORS.accent,
  },
  beaconText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143, 210, 255, 0.25)",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  beaconDistanceText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  passLoadingBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  passLoadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  nextPassHeroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  nextPassLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
  },
  nextPassTimeText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  nextPassDateSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  relativeCountdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143, 210, 255, 0.3)",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  relativeCountdownText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  flightTrajectoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 12,
  },
  trajectoryItem: {
    flex: 1,
    alignItems: "center",
  },
  trajectoryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderSubtle,
  },
  trajectoryLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  trajectoryValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  trajectoryValueSky: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  trajectorySubRating: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  // Stargazing Sky & Cloud Cover Conditions Card
  stargazingCard: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stargazingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stargazingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stargazingHeaderText: {
    color: COLORS.accent,
    fontSize: 9,
    letterSpacing: 0.9,
    fontWeight: "700",
  },
  stargazingRatingBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
    flexShrink: 0,
  },
  stargazingRatingText: {
    fontSize: 9,
    fontWeight: "700",
  },
  stargazingBody: {
    marginTop: 2,
  },
  stargazingMetricsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stargazingMetricItem: {
    flex: 1,
  },
  stargazingDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderSubtle,
    marginHorizontal: 6,
  },
  stargazingMetricLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: "700",
    marginBottom: 2,
  },
  stargazingMetricValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  stargazingMetricUnit: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "500",
  },
  cloudMeterTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  cloudMeterFill: {
    height: "100%",
    borderRadius: 2,
  },
  stargazingMetricSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  stargazingAdviceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  stargazingAdviceText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  weatherLoadingPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  weatherLoadingText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  reminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 11,
    gap: 7,
  },
  reminderBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  reminderBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  reminderBtnTextActive: {
    color: "#05070E",
  },
  upcomingPassesWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  upcomingPassesTitle: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 0.9,
    fontWeight: "700",
    marginBottom: 6,
  },
  upcomingPassRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  upcomingPassTime: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  upcomingPassElev: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  upcomingPassTag: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  upcomingPassTagText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "600",
  },

  // Crew Roster
  crewSection: {
    marginBottom: 20,
  },
  crewSectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stationTabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 2,
  },
  stationTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stationTabActive: {
    backgroundColor: COLORS.accent,
  },
  stationTabText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  stationTabTextActive: {
    color: "#05070E",
  },
  crewListCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  crewListRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  avatarGlowRing: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1.5,
    borderColor: "rgba(143, 210, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  crewListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  crewListName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    maxWidth: SCREEN_WIDTH * 0.42,
  },
  agencyTag: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143, 210, 255, 0.25)",
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  agencyTagText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: "700",
  },
  crewListRoleText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  craftBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  crewListCraftText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "500",
  },
  crewChevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal Backdrop & Cards
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 7, 14, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bioModalCardElevated: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "84%",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    position: "relative",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  modalCloseCircle: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  bioHeaderCenter: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 6,
  },
  bioNameText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  agencyBadgePill: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143, 210, 255, 0.3)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  agencyBadgeText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  bioDetailsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  bioDetailPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    padding: 10,
  },
  bioDetailLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: "700",
  },
  bioDetailVal: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },
  bioTextSection: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bioSectionTitle: {
    color: COLORS.accent,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 6,
  },
  bioBodyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  wikiLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  wikiBtnText: {
    color: "#05070E",
    fontSize: 13,
    fontWeight: "700",
  },

  // Target Location Selection Modal
  locationModalCardElevated: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  modalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalCardEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  modalCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  gpsPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 7,
    marginBottom: 12,
  },
  gpsPrimaryBtnText: {
    color: "#05070E",
    fontSize: 13,
    fontWeight: "700",
  },
  searchBarIntegrated: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  searchTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  searchSubHeader: {
    color: COLORS.accent,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
  },
  modalCityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: COLORS.surface,
  },
  modalCityRowActive: {
    borderColor: COLORS.accent,
    borderWidth: 1,
    backgroundColor: COLORS.accentSoft,
  },
  modalCityName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  modalCityNameActive: {
    color: COLORS.accent,
  },
  modalCityCountry: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  modalCityCoordsMonospace: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },

  // Fullscreen Map Modal
  fullMapContainer: {
    flex: 1,
    backgroundColor: "#05070E",
  },
  fullMapHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(5, 7, 14, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  fullMapCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  fullMapRecenterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  fullMapTitle: {
    color: COLORS.accent,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  fullMapSubtitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // Live ISS HD Video Module Styles
  videoSectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  videoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  videoHeaderLeft: {
    flex: 1,
  },
  videoLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.35)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  videoLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveDot,
    marginRight: 5,
  },
  videoLiveBadgeText: {
    color: COLORS.liveDot,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  videoCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  videoHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  videoControlIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  videoControlIconBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  videoStreamMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(14, 24, 42, 0.7)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  videoMetaBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  videoMetaBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  videoQualityPill: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoQualityPillText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "700",
  },
  videoChannelTabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(14, 24, 42, 0.6)",
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 4,
  },
  videoChannelTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 9,
    position: "relative",
  },
  videoChannelTabActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoChannelTabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  videoChannelTabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  channelActiveIndicator: {
    position: "absolute",
    bottom: -1,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accent,
  },
  videoFrameWrapper: {
    width: "100%",
    height: (SCREEN_WIDTH - 64) * (9 / 16),
    minHeight: 180,
    maxHeight: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    position: "relative",
  },
  videoWebView: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoPausedCover: {
    flex: 1,
  },
  videoPausedGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  videoPausedCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  videoPausedTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  videoPausedDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 10,
    maxWidth: "85%",
  },
  videoResumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 5,
  },
  videoResumeBtnText: {
    color: "#05070E",
    fontSize: 12,
    fontWeight: "700",
  },
  videoAudioBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(5, 7, 14, 0.8)",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  videoAudioBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "500",
  },
  videoStatusFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 10,
  },
  videoStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  videoStatusLightText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  videoChannelDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  videoLosNoticeWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  videoLosNoticeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  openExternalYoutubeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 77, 77, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.35)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  openExternalYoutubeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },

  // Fullscreen Video Modal Styles
  fullVideoModalContainer: {
    flex: 1,
    backgroundColor: "#05070E",
  },
  fullVideoHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(5, 7, 14, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  fullVideoCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  fullVideoLiveTag: {
    color: COLORS.liveDot,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  fullVideoTitleText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  fullVideoHeaderSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(14, 24, 42, 0.8)",
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 3,
  },
  fullVideoSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  fullVideoSwitchBtnActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  fullVideoSwitchText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  fullVideoSwitchTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  fullVideoYoutubeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 77, 77, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.35)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  fullVideoYoutubeBtnText: {
    color: "#FF4D4D",
    fontSize: 11,
    fontWeight: "700",
  },
  fullVideoViewport: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullVideoFooter: {
    backgroundColor: "rgba(5, 7, 14, 0.95)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  fullVideoTelemetryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  fullVideoTelemetryItem: {
    alignItems: "center",
  },
  fullVideoTelemDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderSubtle,
  },
  fullVideoTelemLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  fullVideoTelemVal: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  fullVideoFooterNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  fullVideoFooterNote: {
    color: COLORS.textMuted,
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
});
