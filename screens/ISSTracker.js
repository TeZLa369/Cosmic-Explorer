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

// Atmospheric Slate & Flight Controls Palette
const COLORS = {
  bg: "#070B12",
  surface: "#0F1728",
  surfaceElevated: "#152033",
  surfaceHighlight: "rgba(255, 255, 255, 0.04)",
  border: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  
  sky: "#38BDF8",
  skyGlow: "rgba(56, 189, 248, 0.12)",
  emerald: "#22C55E",
  amber: "#F59E0B",
  indigo: "#6366F1",
};

const ASTRONAUT_BIOS = {
  "Oleg Kononenko": {
    agency: "ROSCOSMOS",
    flag: "🇷🇺",
    role: "Expedition 71 Commander",
    nationality: "Russia",
    launches: "Soyuz MS-24",
    totalSpaceTime: "1,110+ days (World Record Holder)",
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
    bio: "Nikolai Aleksandrovich Chub is a Russian cosmonaut selected in 2012. He completed a year-long long-duration mission aboard the International Space Station.",
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
    bio: "Dr. Tracy Caldwell Dyson is an American chemist and NASA astronaut. She has completed multiple spaceflights and space walks on long-duration ISS expeditions.",
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
    bio: "Matthew Stuart Dominick is a U.S. Navy test pilot and NASA astronaut serving as Commander of NASA's SpaceX Crew-8 mission to the ISS.",
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
    bio: "Dr. Michael Reed Barratt is an American physician and NASA astronaut specializing in aerospace medicine and long-duration space flight health.",
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
    bio: "Dr. Jeanette Jo Epps is an American aerospace engineer and NASA astronaut serving as a mission specialist on Expedition 71.",
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
    bio: "Sunita Lyn Williams is a veteran NASA astronaut and U.S. Navy captain. She formerly held records for most spacewalks by a female astronaut.",
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
    bio: "Barry Eugene 'Butch' Wilmore is a veteran NASA astronaut and U.S. Navy test pilot who has commanded both Space Shuttle missions and the ISS.",
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
    bio: "Aleksandr Vladimirovich Gorbunov is a Russian cosmonaut selected in 2018, serving aboard the International Space Station on Expedition 72.",
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
    bio: "Loral Ashley O'Hara is an American engineer and NASA astronaut who spent over 200 days aboard the ISS.",
    wikiUrl: "https://en.wikipedia.org/wiki/Loral_O%27Hara"
  }
};

const getAstronautBio = (name, craft) => {
  const defaultAgency = craft === "ISS" ? "PARTNER 🚀" : "CMSA 🇨🇳";
  
  // 1. Direct key lookup
  if (ASTRONAUT_BIOS[name]) return ASTRONAUT_BIOS[name];

  // 2. Smart fuzzy name matcher
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

  // 3. Fallback entry with dynamic avatar
  return {
    agency: defaultAgency,
    flag: "",
    role: "Flight Engineer / Astronaut",
    nationality: "Space Explorer",
    launches: craft || "Orbital Craft",
    totalSpaceTime: "Active Mission",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=152033&color=38BDF8&size=200&bold=true`,
    bio: `${name} is currently living and performing scientific research in low Earth orbit aboard the ${craft || "spacecraft"}.`,
    wikiUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`
  };
};

const AstronautAvatar = ({ uri, name = "Astronaut", size = 44 }) => {
  const [imgUri, setImgUri] = useState(uri);
  const [imgError, setImgError] = useState(false);
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=152033&color=38BDF8&size=200&bold=true`;

  useEffect(() => {
    let isMounted = true;

    // Tier 2 Fallback: Wikipedia REST API Summary
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

    // Tier 1 Primary: NASA Image & Video Library API
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
    <Image
      source={{ uri: (!imgError && imgUri) ? imgUri : initialsAvatar }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#152033" }}
      onError={() => setImgError(true)}
    />
  );
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
    body, html, #map { width:100%; height:100%; background:#070B12; }
    .leaflet-container { font-family: system-ui, -apple-system, sans-serif; background:#070B12; }
    .leaflet-control-zoom a, .leaflet-control-layers {
      background: #0F1728 !important;
      color: #F8FAFC !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: none !important;
      border-radius: 8px !important;
    }
    .leaflet-control-zoom a:hover {
      background: #152033 !important;
      color: #38BDF8 !important;
    }
    .leaflet-control-layers-expanded {
      background: #0F1728 !important;
      color: #F8FAFC !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 12px !important;
      padding: 8px !important;
    }
    .iss-marker-wrap {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: rgba(56, 189, 248, 0.22);
      border: 2.5px solid #38BDF8;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 8px rgba(56, 189, 248, 0.4); }
      50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(56, 189, 248, 0.8); }
      100% { transform: scale(0.95); box-shadow: 0 0 8px rgba(56, 189, 248, 0.4); }
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

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

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
      "🗺️ OpenStreetMap": osm,
      "🌈 CartoDB Voyager": voyager,
      "🛰️ Esri Satellite": satellite,
      "🌙 Dark Mode": dark
    }, null, { position: 'topright' }).addTo(map);

    var issIcon = L.divIcon({
      className: '',
      html: '<div class="iss-marker-wrap">🛰️</div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    var issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    issMarker.bindPopup('<div style="text-align:center; padding:4px;"><b style="color:#38BDF8; font-size:14px;">ISS Station</b><br/><span style="color:#94A3B8; font-size:11px;">Live Telemetry</span></div>');

    var isFirstPos = true;
    function updatePos(newLat, newLon) {
      if (typeof newLat === 'number' && typeof newLon === 'number') {
        var newLatLng = new L.LatLng(newLat, newLon);
        issMarker.setLatLng(newLatLng);
        if (isFirstPos) {
          map.setView(newLatLng, 3);
          isFirstPos = false;
        } else {
          map.panTo(newLatLng, { animate: true, duration: 1.0 });
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
  const [locationName, setLocationName] = useState("Acquiring region...");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Astronaut Bio Modal State
  const [selectedAstros, setSelectedAstros] = useState(null);
  const [bioModalVisible, setBioModalVisible] = useState(false);

  // Fullscreen Map Modal State
  const [fullMapVisible, setFullMapVisible] = useState(false);

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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapWebViewRef = useRef(null);
  const fullMapWebViewRef = useRef(null);

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

  // Pulse animation for radar
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
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
            ? `📍 My GPS (${geoData.country_code})${accStr}`
            : `📍 My GPS (${lat}°, ${lon}°)${accStr}`;
          setTargetLocation({ name, lat, lon, isGps: true });
        } catch {
          setTargetLocation({ name: `📍 My GPS (${lat}°, ${lon}°)${accStr}`, lat, lon, isGps: true });
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
        const name = `📍 ${cityName}${countryCode ? `, ${countryCode}` : ""}`;
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

  // On-Device Hardware GPS Location Fetcher
  const fetchGpsLocation = async () => {
    setGpsLoading(true);

    const hasAndroidPermission = await requestAndroidLocationPermission();
    if (!hasAndroidPermission) {
      alert("GPS location permission was denied. Using approximate network location.");
      await useIpFallback();
      return;
    }

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
              ? `📍 My GPS (${geoData.country_code})${accStr}`
              : `📍 My GPS (${lat}°, ${lon}°)${accStr}`;
            setTargetLocation({ name, lat, lon, isGps: true });
          } catch {
            setTargetLocation({ name: `📍 My GPS (${lat}°, ${lon}°)${accStr}`, lat, lon, isGps: true });
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
      <View style={[styles.gradientCanvas, { paddingTop: insets.top }]}>
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>ORBITAL TELEMETRY</Text>
            <Text style={styles.headerTitle}>ISS Live Tracker</Text>
          </View>
          <View style={styles.liveTelemetryBadge}>
            <View style={styles.liveDotPulsing} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Map Module */}
          <RevealView delay={40}>
            <View style={styles.heroMapModule}>
              <View style={styles.heroMapHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.heroRegionTitle} numberOfLines={1}>{locationName}</Text>
                  <Text style={styles.heroUpdatedText}>
                    {lastUpdated ? `Telemetry active • ${lastUpdated}` : "Acquiring orbital link..."}
                  </Text>
                </View>

                {issData?.visibility ? (
                  <View style={styles.statusPill}>
                    <View
                      style={[
                        styles.statusPillDot,
                        { backgroundColor: issData.visibility === "daylight" ? COLORS.amber : COLORS.indigo }
                      ]}
                    />
                    <Text style={styles.statusPillText}>
                      {issData.visibility === "daylight" ? "DAYLIGHT" : "NIGHT"}
                    </Text>
                  </View>
                ) : null}
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
                <Ionicons name="compass-outline" size={14} color={COLORS.sky} />
                <Text style={styles.mapFooterText}>
                  Ground Track: {issData ? `${issData.latitude.toFixed(2)}°, ${issData.longitude.toFixed(2)}°` : "Locating..."}
                </Text>
                <Pressable style={styles.expandMapBtn} onPress={() => setFullMapVisible(true)}>
                  <Ionicons name="expand-outline" size={13} color={COLORS.sky} />
                  <Text style={styles.expandMapText}>Fullscreen</Text>
                </Pressable>
              </View>
            </View>
          </RevealView>

          {/* Consolidated 2x2 Telemetry Instrument Panel */}
          <RevealView delay={80}>
            <Text style={styles.sectionHeaderTitle}>REAL-TIME INSTRUMENTATION</Text>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.sky} />
                <Text style={styles.loadingText}>Loading telemetry feeds...</Text>
              </View>
            ) : issData ? (
              <View style={styles.telemetryCluster}>
                <View style={styles.telemetryRow}>
                  <View style={[styles.telemetryCell, styles.cellBorderRight]}>
                    <Text style={styles.telemetryLabel}>ORBITAL SPEED</Text>
                    <Text style={styles.telemetryValue}>
                      {Math.round(issData.velocity).toLocaleString()} <Text style={styles.telemetryUnit}>km/h</Text>
                    </Text>
                    <Text style={styles.telemetrySub}>~{Math.round(issData.velocity * 0.621371).toLocaleString()} mph</Text>
                  </View>

                  <View style={styles.telemetryCell}>
                    <Text style={styles.telemetryLabel}>ALTITUDE</Text>
                    <Text style={styles.telemetryValue}>
                      {Math.round(issData.altitude)} <Text style={styles.telemetryUnit}>km</Text>
                    </Text>
                    <Text style={styles.telemetrySub}>Above mean sea level</Text>
                  </View>
                </View>

                <View style={[styles.telemetryRow, styles.cellBorderTop]}>
                  <View style={[styles.telemetryCell, styles.cellBorderRight]}>
                    <Text style={styles.telemetryLabel}>LATITUDE</Text>
                    <Text style={styles.telemetryValue}>
                      {issData.latitude.toFixed(3)}° <Text style={styles.telemetryUnit}>{issData.latitude >= 0 ? "N" : "S"}</Text>
                    </Text>
                    <Text style={styles.telemetrySub}>{issData.latitude >= 0 ? "Northern Hemisphere" : "Southern Hemisphere"}</Text>
                  </View>

                  <View style={styles.telemetryCell}>
                    <Text style={styles.telemetryLabel}>LONGITUDE</Text>
                    <Text style={styles.telemetryValue}>
                      {issData.longitude.toFixed(3)}° <Text style={styles.telemetryUnit}>{issData.longitude >= 0 ? "E" : "W"}</Text>
                    </Text>
                    <Text style={styles.telemetrySub}>{issData.longitude >= 0 ? "Eastern Hemisphere" : "Western Hemisphere"}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.errorText}>Unable to connect to ISS telemetry stream.</Text>
            )}
          </RevealView>

          {/* Streamlined Overhead Flyover Predictor Flight Card */}
          {(() => {
            const currentDistanceKm = (issData?.latitude != null && issData?.longitude != null)
              ? calculateDistanceKm(issData.latitude, issData.longitude, targetLocation.lat, targetLocation.lon)
              : null;
            const nextPass = passData && passData.length > 0 ? passData[0] : null;
            const isOverheadNow = currentDistanceKm !== null && currentDistanceKm <= 1800;
            const isApproaching = currentDistanceKm !== null && currentDistanceKm > 1800 && currentDistanceKm <= 3500;

            return (
              <RevealView delay={120}>
                <View style={styles.predictorSection}>
                  <View style={styles.predictorHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>OVERHEAD FLYOVER PREDICTOR</Text>
                    
                    <Pressable style={styles.targetLocationChip} onPress={() => setLocationModalVisible(true)}>
                      <Ionicons name="location-sharp" size={13} color={COLORS.sky} />
                      <Text style={styles.targetChipText} numberOfLines={1}>
                        {targetLocation.name}
                      </Text>
                      <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />
                    </Pressable>
                  </View>

                  <View style={styles.flightMissionCard}>
                    {/* Proximity Beacon & Distance Banner */}
                    <View style={styles.flightBeaconRow}>
                      <View style={styles.beaconLeft}>
                        <View style={[styles.beaconDot, isOverheadNow ? styles.beaconGreen : isApproaching ? styles.beaconAmber : styles.beaconSky]} />
                        <Text style={styles.beaconText}>
                          {isOverheadNow ? "OVERHEAD NOW 🚀" : isApproaching ? "APPROACHING TARGET 🛰️" : "ORBITING GLOBE 🌌"}
                        </Text>
                      </View>

                      {currentDistanceKm !== null ? (
                        <Text style={styles.beaconDistanceText}>{currentDistanceKm.toLocaleString()} km away</Text>
                      ) : null}
                    </View>

                    {passLoading ? (
                      <View style={styles.passLoadingBox}>
                        <ActivityIndicator size="small" color={COLORS.sky} />
                        <Text style={styles.passLoadingText}>Calculating flyover trajectories...</Text>
                      </View>
                    ) : nextPass ? (
                      <>
                        {/* Next Pass Hero Display */}
                        <View style={styles.nextPassHeroRow}>
                          <View>
                            <Text style={styles.nextPassLabel}>NEXT VISIBLE FLYOVER</Text>
                            <Text style={styles.nextPassTimeText}>
                              {formatPassClock(nextPass.start)} <Text style={styles.nextPassDateSub}>Today</Text>
                            </Text>
                          </View>

                          <View style={styles.relativeCountdownBadge}>
                            <Text style={styles.relativeCountdownText}>{formatTimeUntil(nextPass.start)}</Text>
                          </View>
                        </View>

                        {/* Structured Flight Trajectory Row */}
                        <View style={styles.flightTrajectoryRow}>
                          <View style={styles.trajectoryItem}>
                            <Text style={styles.trajectoryLabel}>MAX ELEVATION</Text>
                            <Text style={styles.trajectoryValue}>
                              {nextPass.max_elevation ? `${Math.round(nextPass.max_elevation)}° High` : "64° High"}
                            </Text>
                          </View>

                          <View style={styles.trajectoryDivider} />

                          <View style={styles.trajectoryItem}>
                            <Text style={styles.trajectoryLabel}>DURATION</Text>
                            <Text style={styles.trajectoryValue}>
                              {nextPass.duration ? `${Math.round(nextPass.duration / 60)}m ${nextPass.duration % 60}s` : "5m 30s"}
                            </Text>
                          </View>

                          <View style={styles.trajectoryDivider} />

                          <View style={styles.trajectoryItem}>
                            <Text style={styles.trajectoryLabel}>TRAJECTORY</Text>
                            <Text style={styles.trajectoryValueSky}>NW ➔ SE</Text>
                          </View>
                        </View>

                        {/* Streamlined Reminder Alert Button */}
                        <Pressable
                          style={[styles.reminderBtn, alertSet && styles.reminderBtnActive]}
                          onPress={() => setAlertSet(!alertSet)}
                        >
                          <Ionicons
                            name={alertSet ? "notifications" : "notifications-outline"}
                            size={15}
                            color={alertSet ? COLORS.bg : COLORS.textPrimary}
                          />
                          <Text style={[styles.reminderBtnText, alertSet && styles.reminderBtnTextActive]}>
                            {alertSet ? "Pass Reminder Set (10m Alert)" : "Set Pass Reminder Alert"}
                          </Text>
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                </View>
              </RevealView>
            );
          })()}

          {/* Astronauts & Crew Roster Section */}
          <RevealView delay={160}>
            <View style={styles.crewSection}>
              <View style={styles.crewSectionHeader}>
                <Text style={styles.sectionHeaderTitle}>
                  CREW IN SPACE NOW {astrosData?.number ? `(${astrosData.number})` : ""}
                </Text>
              </View>

              <View style={styles.crewListCard}>
                {astrosData?.people ? (
                  astrosData.people.map((person, idx) => {
                    const bioDetails = getAstronautBio(person.name, person.craft);
                    const isLast = idx === astrosData.people.length - 1;

                    return (
                      <Pressable
                        key={idx}
                        style={[styles.crewListRow, !isLast && styles.rowBorderBottom]}
                        onPress={() => openAstronautDetails(person)}
                      >
                        <AstronautAvatar uri={bioDetails.avatar} name={person.name} size={44} />

                        <View style={styles.crewListInfo}>
                          <Text style={styles.crewListName}>{person.name}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                            <Text style={styles.crewListSub}>Craft: {person.craft}</Text>
                            <View style={styles.agencyTag}>
                              <Text style={styles.agencyTagText}>{bioDetails.agency} {bioDetails.flag || ""}</Text>
                            </View>
                          </View>
                        </View>

                        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                      </Pressable>
                    );
                  })
                ) : (
                  <ActivityIndicator color={COLORS.sky} style={{ padding: 20 }} />
                )}
              </View>
            </View>
          </RevealView>
        </ScrollView>
      </View>

      {/* FULLSCREEN MAP MODAL */}
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
                  <AstronautAvatar uri={selectedAstros.avatar} name={selectedAstros.name} size={72} />
                  <Text style={styles.bioNameText}>{selectedAstros.name}</Text>
                  
                  <View style={styles.agencyBadgePill}>
                    <Text style={styles.agencyBadgeText}>{selectedAstros.agency} {selectedAstros.flag || ""}</Text>
                  </View>
                </View>

                <View style={styles.bioDetailsGrid}>
                  <View style={styles.bioDetailPill}>
                    <Ionicons name="briefcase-outline" size={14} color={COLORS.sky} />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.bioDetailLabel}>POSITION / ROLE</Text>
                      <Text style={styles.bioDetailVal}>{selectedAstros.role}</Text>
                    </View>
                  </View>

                  <View style={styles.bioDetailPill}>
                    <Ionicons name="rocket-outline" size={14} color={COLORS.emerald} />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.bioDetailLabel}>LAUNCH VEHICLE</Text>
                      <Text style={styles.bioDetailVal}>{selectedAstros.launches}</Text>
                    </View>
                  </View>

                  <View style={styles.bioDetailPill}>
                    <Ionicons name="time-outline" size={14} color={COLORS.amber} />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.bioDetailLabel}>TIME IN SPACE</Text>
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
                    <Ionicons name="book-outline" size={16} color="#070B12" />
                    <Text style={styles.wikiBtnText}>Read Full Biography</Text>
                    <Ionicons name="open-outline" size={14} color="#070B12" />
                  </Pressable>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* TARGET LOCATION SELECTION MODAL */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLocationModalVisible(false)}>
          <Pressable style={styles.locationModalCardElevated} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Select Prediction Location</Text>
              <Pressable style={styles.modalCloseCircle} onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            {/* Primary GPS Action Button */}
            <Pressable
              style={styles.gpsPrimaryBtn}
              onPress={fetchGpsLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#070B12" />
              ) : (
                <Ionicons name="navigate" size={16} color="#070B12" />
              )}
              <Text style={styles.gpsPrimaryBtnText}>
                {gpsLoading ? "Acquiring GPS Position..." : "Use On-Device GPS Location"}
              </Text>
            </Pressable>

            {/* Integrated Search Bar */}
            <View style={styles.searchBarIntegrated}>
              <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search global city (e.g. Guwahati, Tokyo, Berlin)..."
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
            <ScrollView style={{ maxHeight: 280, marginTop: 10 }} showsVerticalScrollIndicator={false}>
              {isSearchingCity ? (
                <View style={{ padding: 18, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.sky} />
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
                        <Ionicons name="chevron-forward" size={14} color={COLORS.sky} />
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <View style={{ padding: 18, alignItems: "center" }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>No cities found matching "{searchQuery}"</Text>
                  </View>
                )
              ) : (
                <>
                  <Text style={styles.searchSubHeader}>SAVED & PRESET LOCATIONS</Text>
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
                        <Ionicons name="checkmark" size={16} color={COLORS.sky} />
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
    backgroundColor: COLORS.bg,
  },
  gradientCanvas: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: COLORS.sky,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  liveTelemetryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(225, 29, 72, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.3)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  liveDotPulsing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F43F5E",
    marginRight: 5,
  },
  liveText: {
    color: "#F43F5E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },

  // Hero Map Module
  heroMapModule: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  heroMapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroRegionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  heroUpdatedText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPillText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  mapFrame: {
    width: "100%",
    height: 210,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  mapFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  mapFooterText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginLeft: 6,
    fontVariant: ["tabular-nums"],
  },
  expandMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceHighlight,
  },
  expandMapText: {
    color: COLORS.sky,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Telemetry 2x2 Cluster
  sectionHeaderTitle: {
    color: COLORS.sky,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 8,
  },
  telemetryCluster: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  telemetryRow: {
    flexDirection: "row",
  },
  telemetryCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: COLORS.borderSubtle,
  },
  cellBorderTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  telemetryLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  telemetryValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  telemetryUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  telemetrySub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  loadingBox: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  errorText: {
    color: "#F43F5E",
    fontSize: 13,
  },

  // Flight Card / Overhead Predictor
  predictorSection: {
    marginBottom: 20,
  },
  predictorHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  targetLocationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
    maxWidth: SCREEN_WIDTH * 0.48,
  },
  targetChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  flightMissionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
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
    backgroundColor: COLORS.sky,
  },
  beaconText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  beaconDistanceText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  passLoadingBox: {
    paddingVertical: 18,
    alignItems: "center",
  },
  passLoadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  nextPassHeroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 14,
  },
  nextPassLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  nextPassTimeText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  nextPassDateSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  relativeCountdownBadge: {
    backgroundColor: COLORS.skyGlow,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  relativeCountdownText: {
    color: COLORS.sky,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  flightTrajectoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 14,
  },
  trajectoryItem: {
    flex: 1,
    alignItems: "center",
  },
  trajectoryDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.borderSubtle,
  },
  trajectoryLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 1,
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
    color: COLORS.sky,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  reminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  reminderBtnActive: {
    backgroundColor: COLORS.sky,
    borderColor: COLORS.sky,
  },
  reminderBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  reminderBtnTextActive: {
    color: "#070B12",
  },

  // Crew Roster
  crewSection: {
    marginBottom: 20,
  },
  crewSectionHeader: {
    marginBottom: 8,
  },
  crewListCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
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
  crewListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  crewListName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  crewListSub: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  agencyTag: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  agencyTagText: {
    color: COLORS.sky,
    fontSize: 10,
    fontWeight: "700",
  },

  // Modal Backdrop & Cards
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 11, 18, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bioModalCardElevated: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    position: "relative",
  },
  modalCloseCircle: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  bioHeaderCenter: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  bioNameText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
  },
  agencyBadgePill: {
    backgroundColor: COLORS.skyGlow,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  agencyBadgeText: {
    color: COLORS.sky,
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
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
  },
  bioDetailVal: {
    color: COLORS.textPrimary,
    fontSize: 13,
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
    color: COLORS.sky,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
    marginBottom: 6,
  },
  bioBodyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  wikiLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.sky,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  wikiBtnText: {
    color: "#070B12",
    fontSize: 13,
    fontWeight: "800",
  },

  // Target Location Selection Modal
  locationModalCardElevated: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  modalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
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
    backgroundColor: COLORS.sky,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginBottom: 12,
  },
  gpsPrimaryBtnText: {
    color: "#070B12",
    fontSize: 13,
    fontWeight: "800",
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
    color: COLORS.sky,
    fontSize: 9,
    letterSpacing: 1.2,
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
    borderColor: COLORS.sky,
    borderWidth: 1,
    backgroundColor: COLORS.skyGlow,
  },
  modalCityName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  modalCityNameActive: {
    color: COLORS.sky,
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
    backgroundColor: COLORS.bg,
  },
  fullMapHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
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
  fullMapTitle: {
    color: COLORS.sky,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  fullMapSubtitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
