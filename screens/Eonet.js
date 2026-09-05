import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Modal,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import RevealView from "../components/RevealView";
import BouncyPressable from "../components/BouncyPressable";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

  // Disaster Category Colors
  fire: "#FF5252",
  fireSoft: "rgba(255, 82, 82, 0.18)",
  storm: "#C084FC",
  stormSoft: "rgba(192, 132, 252, 0.18)",
  volcano: "#FB923C",
  volcanoSoft: "rgba(251, 146, 60, 0.18)",
  water: "#38BDF8",
  waterSoft: "rgba(56, 189, 248, 0.18)",
  liveDot: "#F43F5E",
};

const FILTERS = [
  { id: "all", label: "All Events", icon: "earth" },
  { id: "wildfires", label: "Wildfires", icon: "flame" },
  { id: "severeStorms", label: "Storms", icon: "thunderstorm" },
  { id: "volcanoes", label: "Volcanoes", icon: "triangle" },
  { id: "floods", label: "Floods & Ice", icon: "water" },
];

const EONET_MAP_HTML = `
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
    .leaflet-bar a {
      background: rgba(14, 24, 42, 0.9) !important;
      color: #8FD2FF !important;
      border: 1px solid rgba(143, 210, 255, 0.25) !important;
      border-radius: 8px !important;
    }
    .leaflet-control-layers {
      background: rgba(14, 24, 42, 0.94) !important;
      color: #F9F6F2 !important;
      border: 1px solid rgba(143, 210, 255, 0.3) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
      padding: 6px 10px !important;
      backdrop-filter: blur(8px);
    }
    .leaflet-control-layers label {
      font-size: 11px;
      font-weight: 600;
      color: #DCE3F4;
      margin-bottom: 3px;
      cursor: pointer;
    }
    .leaflet-control-layers-toggle {
      background-color: rgba(14, 24, 42, 0.9) !important;
      border: 1px solid rgba(143, 210, 255, 0.25) !important;
      border-radius: 8px !important;
    }
    .disaster-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 16px;
      position: relative;
    }
    .marker-fire {
      background: rgba(239, 68, 68, 0.28);
      border: 2px solid #EF4444;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.7);
    }
    .marker-storm {
      background: rgba(168, 85, 247, 0.28);
      border: 2px solid #C084FC;
      box-shadow: 0 0 14px rgba(168, 85, 247, 0.7);
    }
    .marker-volcano {
      background: rgba(249, 115, 22, 0.28);
      border: 2px solid #F97316;
      box-shadow: 0 0 14px rgba(249, 115, 22, 0.7);
    }
    .marker-flood {
      background: rgba(14, 165, 233, 0.28);
      border: 2px solid #38BDF8;
      box-shadow: 0 0 14px rgba(14, 165, 233, 0.7);
    }
    .marker-icon {
      font-size: 15px;
    }
    .leaflet-control-attribution {
      display: none !important;
    }
    .leaflet-popup-content-wrapper {
      background: rgba(14, 24, 42, 0.96) !important;
      color: #F8FAFC !important;
      border: 1px solid rgba(143, 210, 255, 0.3) !important;
      border-radius: 12px !important;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.7) !important;
      padding: 4px !important;
    }
    .leaflet-popup-tip {
      background: rgba(14, 24, 42, 0.96) !important;
    }
    .popup-title {
      font-weight: 700;
      font-size: 13px;
      color: #F8FAFC;
      margin-bottom: 4px;
    }
    .popup-meta {
      font-size: 11px;
      color: #8FD2FF;
      margin-bottom: 2px;
      font-weight: 600;
    }
    .popup-sub {
      font-size: 10px;
      color: #A8B4D0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      minZoom: 2,
      maxZoom: 14,
      attributionControl: false
    }).setView([20, 0], 2);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map Tile Layers with CartoDB API Key (matching ISS Tracker)
    var dark = L.layerGroup([
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]).addTo(map);

    var satellite = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }),
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=cb1_2xvo_1_b9722687c82adba24962c206', { maxZoom: 18, subdomains: 'abcd' })
    ]);

    L.control.layers({
      "🌙 Deep Space Dark": dark,
      "🛰️ Satellite Imagery": satellite
    }, null, { position: 'topleft', collapsed: true }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var tracksLayer = L.layerGroup().addTo(map);
    var markersMap = {};

    window.updateEvents = function(eventsJson) {
      try {
        var events = eventsJson;
        if (typeof events === 'string') {
          try { events = JSON.parse(events); } catch(e){}
        }
        if (typeof events === 'string') {
          try { events = JSON.parse(events); } catch(e){}
        }
        if (!Array.isArray(events)) return;

        markersLayer.clearLayers();
        tracksLayer.clearLayers();
        markersMap = {};

        events.forEach(function(ev) {
          if (!ev.geometry || ev.geometry.length === 0) return;

          var catId = ev.categories && ev.categories[0] ? ev.categories[0].id : 'other';
          var catClass = 'marker-fire';
          var catEmoji = '🔥';

          if (catId === 'severeStorms') {
            catClass = 'marker-storm';
            catEmoji = '🌀';
          } else if (catId === 'volcanoes') {
            catClass = 'marker-volcano';
            catEmoji = '🌋';
          } else if (catId === 'floods' || catId === 'seaLakeIce') {
            catClass = 'marker-flood';
            catEmoji = '🌊';
          }

          // Storm track lines for multi-point storms
          if (ev.geometry.length > 1) {
            var polyPoints = ev.geometry.map(function(g) {
              return [g.coordinates[1], g.coordinates[0]];
            });
            var trackColor = catId === 'severeStorms' ? '#C084FC' : '#EF4444';
            L.polyline(polyPoints, {
              color: trackColor,
              weight: 3,
              opacity: 0.8,
              dashArray: '4, 6'
            }).addTo(tracksLayer);
          }

          // Latest observation point
          var latestGeom = ev.geometry[ev.geometry.length - 1];
          var lat = latestGeom.coordinates[1];
          var lon = latestGeom.coordinates[0];

          var customIcon = L.divIcon({
            className: '',
            html: '<div class="disaster-marker ' + catClass + '"><span class="marker-icon">' + catEmoji + '</span></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });

          var magStr = latestGeom.magnitudeValue ? (latestGeom.magnitudeValue + ' ' + (latestGeom.magnitudeUnit || '')) : '';
          var popupContent = '<div class="popup-title">' + ev.title + '</div>' +
            '<div class="popup-meta">' + (ev.categories && ev.categories[0] ? ev.categories[0].title : 'Event') + (magStr ? ' • ' + magStr : '') + '</div>' +
            '<div class="popup-sub">Lat: ' + lat.toFixed(2) + '°, Lon: ' + lon.toFixed(2) + '°</div>';

          var m = L.marker([lat, lon], { icon: customIcon })
            .bindPopup(popupContent)
            .addTo(markersLayer);

          m.on('click', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EVENT_CLICK', eventId: ev.id }));
            }
          });

          markersMap[ev.id] = { marker: m, lat: lat, lon: lon };
        });
      } catch(e) {
        console.error("Failed to render events: ", e);
      }
    };

    window.flyToEvent = function(eventId) {
      if (markersMap[eventId]) {
        var item = markersMap[eventId];
        map.flyTo([item.lat, item.lon], 6, { duration: 1.2 });
        item.marker.openPopup();
      }
    };

    window.resetMapView = function() {
      map.flyTo([20, 0], 2, { duration: 1 });
    };

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    }
  </script>
</body>
</html>
`;

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "";
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const Eonet = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [focusedEventId, setFocusedEventId] = useState(null);
  const [fullMapVisible, setFullMapVisible] = useState(false);

  // Animations
  const livePulseAnim = useRef(new Animated.Value(1)).current;
  const mapWebViewRef = useRef(null);
  const fullMapWebViewRef = useRef(null);

  // Header Beacon Pulse
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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100");
      if (!response.ok) throw new Error("EONET is unavailable right now.");
      const payload = await response.json();
      const rawEvents = Array.isArray(payload?.events) ? payload.events : [];
      setEvents(rawEvents);
      if (rawEvents.length > 0) {
        setFocusedEventId(rawEvents[0].id);
      }
    } catch (requestError) {
      setError(requestError.message || "We couldn't load natural events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Push events to Leaflet WebViews
  const pushEventsToMap = (ref) => {
    if (ref?.current && events.length > 0) {
      const payload = JSON.stringify(events);
      ref.current.injectJavaScript(`
        if (typeof window.updateEvents === 'function') {
          window.updateEvents(${JSON.stringify(payload)});
        }
        true;
      `);
    }
  };

  useEffect(() => {
    if (events.length > 0) {
      pushEventsToMap(mapWebViewRef);
      pushEventsToMap(fullMapWebViewRef);
    }
  }, [events]);

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'EVENT_CLICK' && data.eventId) {
        setFocusedEventId(data.eventId);
      } else if (data.type === 'MAP_READY') {
        pushEventsToMap(mapWebViewRef);
        pushEventsToMap(fullMapWebViewRef);
      }
    } catch (e) {
      console.warn("WebView message parse error:", e);
    }
  };

  const locateEventOnMap = (eventId) => {
    setFocusedEventId(eventId);
    mapWebViewRef.current?.injectJavaScript(`window.flyToEvent("${eventId}"); true;`);
    fullMapWebViewRef.current?.injectJavaScript(`window.flyToEvent("${eventId}"); true;`);
  };

  // Metrics Category Counts
  const stats = useMemo(() => {
    let fires = 0;
    let storms = 0;
    let volcanoes = 0;
    let floods = 0;

    events.forEach((ev) => {
      const catId = ev.categories?.[0]?.id;
      if (catId === "wildfires") fires++;
      else if (catId === "severeStorms") storms++;
      else if (catId === "volcanoes") volcanoes++;
      else if (catId === "floods" || catId === "seaLakeIce") floods++;
    });

    return { total: events.length, fires, storms, volcanoes, floods };
  }, [events]);

  // Filtered and Searched Events List
  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        selectedFilter === "all" ||
        event.categories?.some((category) => category.id === selectedFilter) ||
        (selectedFilter === "floods" && event.categories?.some((cat) => cat.id === "seaLakeIce"));

      const matchesSearch =
        !searchQuery.trim() ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.categories?.[0]?.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [events, selectedFilter, searchQuery]);

  const focusedEvent = useMemo(() => {
    return events.find((ev) => ev.id === focusedEventId) || events[0];
  }, [events, focusedEventId]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#05070E", "#0A1122", "#070C18"]} style={[styles.gradient, { paddingTop: insets.top }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>GLOBAL DISASTER MONITOR</Text>
            <Text style={styles.headerTitle}>Earth Events</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable style={styles.refreshIconBtn} onPress={loadEvents} disabled={loading}>
              <Ionicons name="sync" size={17} color={COLORS.accent} />
            </Pressable>

            <View style={styles.liveTelemetryBadge}>
              <Animated.View
                style={[
                  styles.liveDotPulsing,
                  { transform: [{ scale: livePulseAnim }] }
                ]}
              />
              <Text style={styles.liveText}>LIVE SATELLITE</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ============================================================ */}
          {/* SECTION 1: GLOBAL DISASTER LEAFLET MAP MODULE */}
          {/* ============================================================ */}
          <RevealView delay={30}>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.collectionBadge}>
                  <Ionicons name="planet-outline" size={13} color={COLORS.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.collectionBadgeText}>NASA EARTH OBSERVATORY</Text>
                </View>

                <View style={styles.eventCountPill}>
                  <Text style={styles.eventCountPillText}>{stats.total} Active Hazards</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Live Planetary Hazard Tracker</Text>
              <Text style={styles.heroSubtitle}>
                Real-time satellite surveillance of open wildfires, tropical cyclones, volcanic eruptions, and flood zones.
              </Text>

              {/* Interactive Disaster Leaflet Map Frame */}
              <View style={styles.mapFrame}>
                <WebView
                  ref={mapWebViewRef}
                  source={{ html: EONET_MAP_HTML }}
                  style={StyleSheet.absoluteFillObject}
                  originWhitelist={['*']}
                  javaScriptEnabled
                  domStorageEnabled
                  onMessage={handleWebViewMessage}
                  onLoadEnd={() => pushEventsToMap(mapWebViewRef)}
                />

                {/* Floating Map Top HUD Controls */}
                <View style={styles.mapTopControls}>
                  <BouncyPressable
                    style={styles.mapHudBtn}
                    onPress={() => mapWebViewRef.current?.injectJavaScript(`window.resetMapView(); true;`)}
                    hitSlop={6}
                  >
                    <Ionicons name="globe-outline" size={16} color={COLORS.accent} />
                  </BouncyPressable>

                  <BouncyPressable
                    style={styles.mapFullscreenHudBtn}
                    onPress={() => setFullMapVisible(true)}
                    hitSlop={6}
                  >
                    <Ionicons name="expand-outline" size={13} color={COLORS.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.mapFullscreenHudText}>Fullscreen</Text>
                  </BouncyPressable>
                </View>
              </View>

              {/* Map Footer Bar */}
              <View style={styles.mapFooterRow}>
                <View style={styles.mapFooterLeft}>
                  <Ionicons name="radio-outline" size={14} color={COLORS.accent} style={{ marginRight: 5 }} />
                  <Text style={styles.mapFooterText}>
                    Live Feeds: MODIS, VIIRS, NOAA, USGS
                  </Text>
                </View>
              </View>
            </View>
          </RevealView>

          {/* ============================================================ */}
          {/* SECTION 2: GLOBAL ACTIVE HAZARD SUMMARY COUNTERS */}
          {/* ============================================================ */}
          <RevealView delay={60}>
            <View style={styles.statsGridRow}>
              {/* Fires */}
              <Pressable
                style={[styles.statCard, selectedFilter === "wildfires" && styles.statCardActive]}
                onPress={() => setSelectedFilter(selectedFilter === "wildfires" ? "all" : "wildfires")}
              >
                <View style={styles.statHeaderRow}>
                  <Text style={{ fontSize: 16 }}>🔥</Text>
                  <Text style={[styles.statCardLabel, { color: COLORS.fire }]}>FIRES</Text>
                </View>
                <Text style={styles.statCardValue}>{stats.fires}</Text>
                <Text style={styles.statCardSub}>Active</Text>
              </Pressable>

              {/* Storms */}
              <Pressable
                style={[styles.statCard, selectedFilter === "severeStorms" && styles.statCardActive]}
                onPress={() => setSelectedFilter(selectedFilter === "severeStorms" ? "all" : "severeStorms")}
              >
                <View style={styles.statHeaderRow}>
                  <Text style={{ fontSize: 16 }}>🌀</Text>
                  <Text style={[styles.statCardLabel, { color: COLORS.storm }]}>STORMS</Text>
                </View>
                <Text style={styles.statCardValue}>{stats.storms}</Text>
                <Text style={styles.statCardSub}>Tracked</Text>
              </Pressable>

              {/* Volcanoes */}
              <Pressable
                style={[styles.statCard, selectedFilter === "volcanoes" && styles.statCardActive]}
                onPress={() => setSelectedFilter(selectedFilter === "volcanoes" ? "all" : "volcanoes")}
              >
                <View style={styles.statHeaderRow}>
                  <Text style={{ fontSize: 16 }}>🌋</Text>
                  <Text style={[styles.statCardLabel, { color: COLORS.volcano }]}>VOLCANO</Text>
                </View>
                <Text style={styles.statCardValue}>{stats.volcanoes}</Text>
                <Text style={styles.statCardSub}>Eruptions</Text>
              </Pressable>

              {/* Floods & Ice */}
              <Pressable
                style={[styles.statCard, selectedFilter === "floods" && styles.statCardActive]}
                onPress={() => setSelectedFilter(selectedFilter === "floods" ? "all" : "floods")}
              >
                <View style={styles.statHeaderRow}>
                  <Text style={{ fontSize: 16 }}>🌊</Text>
                  <Text style={[styles.statCardLabel, { color: COLORS.water }]}>WATER</Text>
                </View>
                <Text style={styles.statCardValue}>{stats.floods}</Text>
                <Text style={styles.statCardSub}>Ice/Floods</Text>
              </Pressable>
            </View>
          </RevealView>

          {/* ============================================================ */}
          {/* SECTION 3: SEARCH & CATEGORY FILTER TABS */}
          {/* ============================================================ */}
          <RevealView delay={80}>
            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search events (e.g., Hurricane, Canada, Etna)..."
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

            {/* Horizontal Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => {
                const isActive = selectedFilter === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => setSelectedFilter(filter.id)}
                    style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={13}
                      color={isActive ? COLORS.accent : COLORS.textMuted}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </RevealView>

          {/* ============================================================ */}
          {/* SECTION 4: LIVE DISASTER EVENT FEED */}
          {/* ============================================================ */}
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.stateText}>Connecting to NASA EONET satellite network...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Ionicons name="cloud-offline-outline" size={30} color={COLORS.accent} />
              <Text style={styles.stateText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadEvents}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : visibleEvents.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="shield-checkmark-outline" size={32} color={COLORS.safe || "#3DD598"} />
              <Text style={styles.stateText}>No active events match your search or filter.</Text>
            </View>
          ) : (
            visibleEvents.map((event) => {
              const latestGeometry = event.geometry?.[event.geometry.length - 1];
              const sourceUrl = event.sources?.[0]?.url;
              const sourceId = event.sources?.[0]?.id || "NASA";
              const isFocused = focusedEventId === event.id;
              const category = event.categories?.[0];
              const catId = category?.id;

              const isFire = catId === "wildfires";
              const isStorm = catId === "severeStorms";
              const isVolcano = catId === "volcanoes";
              const catColor = isFire ? COLORS.fire : isStorm ? COLORS.storm : isVolcano ? COLORS.volcano : COLORS.water;
              const catEmoji = isFire ? "🔥" : isStorm ? "🌀" : isVolcano ? "🌋" : "🌊";

              const lat = latestGeometry?.coordinates?.[1];
              const lon = latestGeometry?.coordinates?.[0];
              const magVal = latestGeometry?.magnitudeValue;
              const magUnit = latestGeometry?.magnitudeUnit || "";

              return (
                <View
                  key={event.id}
                  style={[styles.eventCard, isFocused && styles.eventCardFocused]}
                >
                  {/* Top Bar: Category Pill & Observation Date */}
                  <View style={styles.eventTopRow}>
                    <View style={[styles.categoryPill, { borderColor: catColor }]}>
                      <Text style={{ fontSize: 11, marginRight: 4 }}>{catEmoji}</Text>
                      <Text style={[styles.categoryText, { color: catColor }]}>
                        {category?.title || "Natural Event"}
                      </Text>
                    </View>

                    <Text style={styles.dateText}>
                      {formatDate(latestGeometry?.date)} ({formatTimeAgo(latestGeometry?.date)})
                    </Text>
                  </View>

                  <Text style={styles.eventTitle}>{event.title}</Text>

                  {/* Magnitude & Trajectory Subtitle */}
                  <View style={styles.eventTelemetryRow}>
                    {magVal ? (
                      <View style={styles.magnitudePill}>
                        <Text style={styles.magnitudeLabel}>INTENSITY: </Text>
                        <Text style={styles.magnitudeVal}>{magVal} {magUnit}</Text>
                      </View>
                    ) : null}

                    {event.geometry?.length > 1 ? (
                      <View style={styles.trajectoryPill}>
                        <Ionicons name="git-commit-outline" size={12} color={COLORS.accent} style={{ marginRight: 3 }} />
                        <Text style={styles.trajectoryText}>{event.geometry.length} Coordinates Tracked</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Lat / Lon Coordinates */}
                  {lat != null && lon != null ? (
                    <Text style={styles.coordsText}>
                      📍 {lat >= 0 ? `${lat.toFixed(3)}°N` : `${Math.abs(lat).toFixed(3)}°S`}, {lon >= 0 ? `${lon.toFixed(3)}°E` : `${Math.abs(lon).toFixed(3)}°W`}
                    </Text>
                  ) : null}

                  {/* Action Buttons Row: Locate on Map & Source Link */}
                  <View style={styles.eventActionRow}>
                    <Pressable
                      style={styles.locateMapBtn}
                      onPress={() => locateEventOnMap(event.id)}
                    >
                      <Ionicons name="locate" size={13} color={COLORS.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.locateMapBtnText}>Locate on Map</Text>
                    </Pressable>

                    {sourceUrl ? (
                      <Pressable
                        onPress={() => Linking.openURL(sourceUrl)}
                        style={styles.sourceButton}
                        hitSlop={6}
                      >
                        <Text style={styles.sourceText}>{sourceId} Report</Text>
                        <Ionicons name="open-outline" size={12} color={COLORS.accent} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </LinearGradient>

      {/* ============================================================ */}
      {/* MODAL: FULLSCREEN GLOBAL DISASTER MAP */}
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
              <Text style={styles.fullMapTitle}>GLOBAL DISASTER RADAR</Text>
              <Text style={styles.fullMapSubtitle}>
                {stats.total} Active Hazards Worldwide
              </Text>
            </View>

            <Pressable
              style={styles.fullMapResetBtn}
              onPress={() => fullMapWebViewRef.current?.injectJavaScript(`window.resetMapView(); true;`)}
            >
              <Ionicons name="globe-outline" size={18} color={COLORS.accent} />
            </Pressable>
          </SafeAreaView>

          <WebView
            ref={fullMapWebViewRef}
            source={{ html: EONET_MAP_HTML }}
            style={StyleSheet.absoluteFillObject}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleWebViewMessage}
            onLoadEnd={() => pushEventsToMap(fullMapWebViewRef)}
          />
        </View>
      </Modal>
    </View>
  );
};

export default Eonet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070E",
  },
  gradient: {
    flex: 1,
  },

  // Top Header (Matching ISSTracker & EPIC)
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
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Hero Card with Map
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
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
  eventCountPill: {
    backgroundColor: "rgba(255, 82, 82, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 82, 82, 0.35)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  eventCountPillText: {
    color: COLORS.fire,
    fontSize: 10,
    fontWeight: "700",
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },

  // Map Frame
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
  mapTopControls: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  mapHudBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(14, 24, 42, 0.92)",
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  mapFullscreenHudBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 17,
    backgroundColor: "rgba(14, 24, 42, 0.92)",
    borderWidth: 1,
    borderColor: COLORS.accent,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  mapFullscreenHudText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  mapFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  mapFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapFooterText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // 4 Stats Grid Cards
  statsGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statCardActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.accent,
  },
  statHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  statCardValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statCardSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.7)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },

  // Filter Row
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Event Card
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  eventCardFocused: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(255, 255, 255, 0.11)",
  },
  eventTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "rgba(14, 24, 42, 0.6)",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 20,
  },
  eventTelemetryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  magnitudePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  magnitudeLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  magnitudeVal: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "700",
  },
  trajectoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(143, 210, 255, 0.1)",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  trajectoryText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "600",
  },
  coordsText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  eventActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  locateMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143, 210, 255, 0.3)",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  locateMapBtnText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sourceText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
  },

  // State Cards
  stateCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 8,
  },
  stateText: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: "rgba(255, 82, 82, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 82, 82, 0.35)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 12,
  },

  // Fullscreen Disaster Map Modal
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
  fullMapResetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
});
