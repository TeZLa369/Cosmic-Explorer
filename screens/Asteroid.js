import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState, useRef } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { loadNasaApiKey } from '../components/nasaApiKeyStorage';
import BouncyPressable from '../components/BouncyPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#D6E0F2",
  textMuted: "#A7B6D2",
  accent: "#89D9FF",
  accentSoft: "rgba(137,217,255,0.18)",
  danger: "#FF7A7A",
  dangerSoft: "rgba(255,122,122,0.18)",
  safe: "#3DD598",
  safeSoft: "rgba(61,213,152,0.18)",
  amber: "#FFB067",
  amberSoft: "rgba(255,176,103,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  surfaceElevated: "#0E182A",
  border: "rgba(255,255,255,0.16)",
  borderSubtle: "rgba(255,255,255,0.08)",
  shadow: "rgba(0,0,0,0.34)",
  liveDot: "#F43F5E",
};

const LUNAR_DISTANCE_KM = 384400; // Average Earth-Moon distance

const formatNumber = (value) => Number(value || 0).toLocaleString();

const getSizeComparison = (meters) => {
  if (meters <= 15) return "🚗 Vehicle / Bus";
  if (meters <= 50) return "✈️ Airliner (B737)";
  if (meters <= 120) return "🏈 Football Field";
  if (meters <= 250) return "🏟️ Sports Stadium";
  if (meters <= 450) return "🗼 Eiffel Tower";
  if (meters <= 800) return "🏙️ Burj Khalifa";
  return "⛰️ Mountain Peak";
};

const formatCountdownTime = (epochMs) => {
  if (!epochMs) return null;
  const now = Date.now();
  const diff = epochMs - now;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  return {
    isPast,
    text: isPast ? `Passed ${formatted} ago` : `T-minus ${formatted}`,
  };
};

const CountdownBadge = ({ epochMs }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!epochMs) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [epochMs]);

  const countdownInfo = useMemo(() => {
    return epochMs ? formatCountdownTime(epochMs) : null;
  }, [epochMs, tick]);

  if (!countdownInfo) return null;

  return (
    <View style={[styles.countdownBadge, countdownInfo.isPast ? styles.countdownPast : styles.countdownUpcoming]}>
      <Ionicons
        name="timer-outline"
        size={12}
        color={countdownInfo.isPast ? COLORS.textMuted : COLORS.amber}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.countdownText, { color: countdownInfo.isPast ? COLORS.textMuted : COLORS.amber }]}>
        {countdownInfo.text}
      </Text>
    </View>
  );
};

const Asteroid = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [objData, setObjData] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [nasaApiKey, setNasaApiKey] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(true);

  // Live Radar & Tracking States
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all' | 'hazardous' | 'closest' | 'saved'
  const [isLunarUnit, setIsLunarUnit] = useState(false); // false: KM | true: LD
  const [focusedAsteroidId, setFocusedAsteroidId] = useState(null);

  // Radar Sweep Animation
  const radarSweepAnim = useRef(new Animated.Value(0)).current;
  const livePulseAnim = useRef(new Animated.Value(1)).current;

  // Radar sweep animation
  useEffect(() => {
    const sweep = Animated.loop(
      Animated.timing(radarSweepAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    sweep.start();
    return () => sweep.stop();
  }, []);

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

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDisplayDate = () => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  const isToday = formatDateForAPI(selectedDate) === formatDateForAPI(new Date());

  const isAsteroidSaved = async (id) => {
    try {
      const item = await AsyncStorage.getItem("nro" + id);
      return item !== null;
    } catch {
      return false;
    }
  };

  const fetchData = async (dateObj) => {
    setLoading(true);
    setFetchError("");
    setObjData([]);

    const dateStr = formatDateForAPI(dateObj);
    const apiKey = nasaApiKey || "DEMO_KEY";

    try {
      const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${dateStr}&end_date=${dateStr}&api_key=${apiKey}`);
      const data = await res.json();

      if (!res.ok || data?.code || data?.error_message) {
        throw new Error(data?.error_message || "Unable to load asteroid data.");
      }

      const rawList = data.near_earth_objects?.[dateStr] || [];

      const processedData = await Promise.all(rawList.map(async (obj, index) => {
        const approach = obj.close_approach_data?.[0];
        const savedStatus = await isAsteroidSaved(obj.id);
        const diameterMin = Math.round(obj.estimated_diameter?.meters?.estimated_diameter_min || 0);
        const diameterMax = Math.round(obj.estimated_diameter?.meters?.estimated_diameter_max || 0);
        const avgDiameter = Math.round((diameterMin + diameterMax) / 2);
        const speed = Number.parseFloat(approach?.relative_velocity?.kilometers_per_second || 0);
        const distance = Number.parseFloat(approach?.miss_distance?.kilometers || 0);
        const lunarDistance = distance / LUNAR_DISTANCE_KM;
        const epochMs = approach?.epoch_date_close_approach ? Number(approach.epoch_date_close_approach) : null;

        // Angle for circular radar plotting based on hash/index
        const angleRad = (index * 137.5 * Math.PI) / 180; // golden angle spread

        return {
          id: obj.id,
          asteroidName: obj.name,
          sizeMin: diameterMin,
          sizeMax: diameterMax,
          avgSize: avgDiameter,
          sizeTag: getSizeComparison(avgDiameter),
          threat: obj.is_potentially_hazardous_asteroid,
          speed: speed.toFixed(2),
          speedKmH: Math.round(speed * 3600),
          machRating: (speed * 3600 / 1225).toFixed(1),
          distance: distance.toFixed(0),
          distanceRaw: distance,
          lunarDistance: lunarDistance.toFixed(2),
          lunarDistRaw: lunarDistance,
          orbitingBody: approach?.orbiting_body || "Earth",
          epochMs,
          approachTimeStr: approach?.close_approach_date_full || "",
          jplUrl: obj.nasa_jpl_url || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${obj.id}`,
          angleRad,
          saved: savedStatus,
        };
      }));

      // Sort by closest distance ascending
      processedData.sort((a, b) => a.distanceRaw - b.distanceRaw);

      setObjData(processedData);
      if (processedData.length > 0) {
        setFocusedAsteroidId(processedData[0].id);
      }
    } catch (error) {
      console.log("Unable to fetch data: ", error);
      setFetchError("We couldn't load asteroid data right now.");
      Alert.alert("Error", "Failed to fetch asteroid data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (item) => {
    setObjData(prev => prev.map(el =>
      el.id === item.id ? { ...el, saved: !el.saved } : el
    ));

    const key = "nro" + item.id;
    try {
      if (!item.saved) {
        await AsyncStorage.setItem(key, JSON.stringify({ ...item, saved: true }));
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Storage Error", error);
    }
  };

  useEffect(() => {
    const hydrateApiKey = async () => {
      const savedKey = await loadNasaApiKey();
      setNasaApiKey(savedKey || "");
      setApiKeyLoading(false);
    };

    hydrateApiKey();
  }, []);

  useEffect(() => {
    if (!apiKeyLoading) {
      fetchData(selectedDate);
    }
  }, [selectedDate, nasaApiKey, apiKeyLoading]);

  // Filtered List
  const filteredData = useMemo(() => {
    switch (selectedFilter) {
      case "hazardous":
        return objData.filter((item) => item.threat);
      case "closest":
        return objData.filter((item) => item.lunarDistRaw <= 15);
      case "saved":
        return objData.filter((item) => item.saved);
      default:
        return objData;
    }
  }, [objData, selectedFilter]);

  const stats = useMemo(() => {
    if (objData.length === 0) {
      return {
        total: 0,
        hazardous: 0,
        closestKm: "0",
        closestLD: "0",
        closestAsteroid: null,
      };
    }

    const hazardous = objData.filter((item) => item.threat).length;
    const closest = objData[0]; // Already sorted by distance

    return {
      total: objData.length,
      hazardous,
      closestKm: formatNumber(Math.round(closest?.distanceRaw || 0)),
      closestLD: closest?.lunarDistance || "0",
      closestAsteroid: closest,
    };
  }, [objData]);

  const focusedAsteroid = useMemo(() => {
    return objData.find((item) => item.id === focusedAsteroidId) || stats.closestAsteroid;
  }, [objData, focusedAsteroidId, stats.closestAsteroid]);

  const radarSweepRotate = radarSweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      {/* Hero Mission Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.collectionBadge}>
            <Ionicons name="radio-outline" size={13} color={COLORS.accent} style={{ marginRight: 6 }} />
            <Text style={styles.collectionBadgeText}>ORBITAL DEFENSE RADAR</Text>
          </View>

          <View style={styles.liveTelemetryBadge}>
            <Animated.View
              style={[
                styles.liveDotPulsing,
                { transform: [{ scale: livePulseAnim }] }
              ]}
            />
            <Text style={styles.liveText}>RADAR LIVE</Text>
          </View>
        </View>

        <Text style={styles.mainTxt}>Near-Earth Object Radar</Text>
        <Text style={styles.subTxt}>
          Real-time tracking of space rocks passing Earth. Observe proximity vectors, miss distances, and threat statuses.
        </Text>

        {/* Date Selector Row */}
        <View style={styles.controlsRow}>
          <View style={styles.unifiedDateBar}>
            <Pressable
              style={styles.dateStepBtn}
              onPress={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev);
              }}
              accessibilityLabel="Previous day"
            >
              <Ionicons name="chevron-back" size={17} color={COLORS.accent} />
            </Pressable>

            <View style={styles.dateDivider} />

            <Pressable style={styles.dateMainBtn} onPress={() => setCalendarVisible(true)}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.accent} />
              <Text style={styles.dateText}>{getDisplayDate()}</Text>
              <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
            </Pressable>

            <View style={styles.dateDivider} />

            <Pressable
              style={[styles.dateStepBtn, isToday && styles.dateStepDisabled]}
              disabled={isToday}
              onPress={() => {
                if (!isToday) {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }
              }}
              accessibilityLabel="Next day"
            >
              <Ionicons name="chevron-forward" size={17} color={isToday ? COLORS.textMuted : COLORS.accent} />
            </Pressable>
          </View>

          {/* Unit Toggle Switch (KM vs LD) */}
          <Pressable
            style={styles.unitToggleBtn}
            onPress={() => setIsLunarUnit(!isLunarUnit)}
          >
            <Text style={[styles.unitToggleText, !isLunarUnit && styles.unitToggleTextActive]}>KM</Text>
            <View style={styles.unitToggleDivider} />
            <Text style={[styles.unitToggleText, isLunarUnit && styles.unitToggleTextActive]}>LD</Text>
          </Pressable>
        </View>
      </View>

      {/* ============================================================ */}
      {/* SECTION: CLOSE-APPROACH PROXIMITY RADAR SCOPE */}
      {/* ============================================================ */}
      {objData.length > 0 ? (
        <View style={styles.radarCard}>
          <View style={styles.radarCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.radarCardEyebrow}>PROXIMITY RADAR SCOPE</Text>
              <Text style={styles.radarCardTitle}>
                {focusedAsteroid ? focusedAsteroid.asteroidName.replace(/[()]/g, '') : "Earth Orbit Perimeter"}
              </Text>
            </View>

            <CountdownBadge epochMs={focusedAsteroid?.epochMs} />
          </View>

            {/* Circular Radar Scope Display */}
            <View style={styles.radarScopeContainer}>
              {/* Outer Range Ring 15 LD */}
              <View style={[styles.radarRing, styles.radarRingOuter]}>
                <Text style={styles.radarRingLabel}>15 LD</Text>
              </View>

              {/* Middle Range Ring 5 LD */}
              <View style={[styles.radarRing, styles.radarRingMid]}>
                <Text style={styles.radarRingLabel}>5 LD</Text>
              </View>

              {/* Lunar Orbit Ring 1 LD (Moon Orbit) */}
              <View style={[styles.radarRing, styles.radarRingMoon]}>
                <View style={styles.moonMarker}>
                  <Text style={{ fontSize: 10 }}>🌕</Text>
                </View>
                <Text style={styles.radarMoonLabel}>MOON (1 LD)</Text>
              </View>

              {/* Center Earth Marker */}
              <View style={styles.earthCenterMarker}>
                <Text style={{ fontSize: 16 }}>🌍</Text>
                <Text style={styles.earthCenterLabel}>EARTH</Text>
              </View>

              {/* Rotating Radar Sweep Line */}
              <Animated.View
                style={[
                  styles.radarSweepLineWrap,
                  { transform: [{ rotate: radarSweepRotate }] }
                ]}
              >
                <LinearGradient
                  colors={["rgba(137, 217, 255, 0.4)", "transparent"]}
                  style={styles.radarSweepBeam}
                />
              </Animated.View>

              {/* Plotted Asteroid Blips */}
              {objData.slice(0, 14).map((item) => {
                const maxLd = 60;
                // Scale distance into pixel radius (between 28px and 110px)
                const clampedLD = Math.min(item.lunarDistRaw, maxLd);
                const r = 30 + (clampedLD / maxLd) * 75;
                const x = Math.cos(item.angleRad) * r;
                const y = Math.sin(item.angleRad) * r;
                const isFocused = focusedAsteroidId === item.id;

                return (
                  <Pressable
                    key={`blip-${item.id}`}
                    style={[
                      styles.asteroidBlip,
                      {
                        transform: [{ translateX: x }, { translateY: y }],
                        backgroundColor: item.threat ? COLORS.danger : COLORS.accent,
                        borderColor: isFocused ? "#FFF" : item.threat ? COLORS.danger : COLORS.accent,
                      },
                      isFocused && styles.asteroidBlipFocused,
                    ]}
                    onPress={() => setFocusedAsteroidId(item.id)}
                    hitSlop={8}
                  >
                    {isFocused ? (
                      <View style={styles.focusedBlipHalo} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Radar Scope Footer Legend */}
            <View style={styles.radarLegendRow}>
              <View style={styles.radarLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.legendText}>Hazardous Asteroid</Text>
              </View>
              <View style={styles.radarLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.legendText}>Safe Orbit</Text>
              </View>
              <View style={styles.radarLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#FFF", borderRadius: 1 }]} />
                <Text style={styles.legendText}>1 LD = 384,400 km</Text>
              </View>
            </View>

            {/* Focused Asteroid Telemetry Bar */}
            {focusedAsteroid ? (
              <View style={styles.focusedTelemetryBar}>
                <View style={styles.focusedTelemColumn}>
                  <Text style={styles.focusedTelemLabel}>MISS DISTANCE</Text>
                  <Text style={styles.focusedTelemValue}>
                    {isLunarUnit ? `${focusedAsteroid.lunarDistance} LD` : `${formatNumber(focusedAsteroid.distance)} km`}
                  </Text>
                </View>

                <View style={styles.focusedTelemDivider} />

                <View style={styles.focusedTelemColumn}>
                  <Text style={styles.focusedTelemLabel}>VELOCITY</Text>
                  <Text style={styles.focusedTelemValue}>
                    {focusedAsteroid.speed} km/s
                  </Text>
                  <Text style={styles.focusedTelemSub}>Mach ~{focusedAsteroid.machRating}</Text>
                </View>

                <View style={styles.focusedTelemDivider} />

                <View style={styles.focusedTelemColumn}>
                  <Text style={styles.focusedTelemLabel}>EST. SIZE</Text>
                  <Text style={styles.focusedTelemValue}>~{focusedAsteroid.avgSize}m</Text>
                  <Text style={styles.focusedTelemSub} numberOfLines={1}>{focusedAsteroid.sizeTag}</Text>
                </View>
              </View>
            ) : null}
          </View>
      ) : null}

      {/* Summary 3-Card Grid */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.cardIconRow}>
            <Ionicons name="scan-outline" size={16} color={COLORS.accent} />
            <Text style={styles.summaryLabel}>SCANNED</Text>
          </View>
          <Text style={styles.summaryValue}>{stats.total}</Text>
          <Text style={styles.summarySub}>Total Flybys</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.cardIconRow}>
            <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
            <Text style={styles.summaryLabel}>HAZARDOUS</Text>
          </View>
          <Text style={[styles.summaryValue, { color: stats.hazardous > 0 ? COLORS.danger : COLORS.safe }]}>
            {stats.hazardous}
          </Text>
          <Text style={styles.summarySub}>{stats.hazardous > 0 ? "Flagged Threat" : "Zero Alerts"}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.cardIconRow}>
            <Ionicons name="magnet-outline" size={16} color={COLORS.amber} />
            <Text style={styles.summaryLabel}>CLOSEST</Text>
          </View>
          <Text style={styles.summaryValue}>
            {isLunarUnit ? `${stats.closestLD} LD` : `${stats.closestKm}`}
          </Text>
          <Text style={styles.summarySub}>{isLunarUnit ? "Lunar Orbit" : "Kilometers"}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <Pressable
          style={[styles.filterTab, selectedFilter === "all" && styles.filterTabActive]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text style={[styles.filterTabText, selectedFilter === "all" && styles.filterTabTextActive]}>
            All ({objData.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, selectedFilter === "hazardous" && styles.filterTabActive]}
          onPress={() => setSelectedFilter("hazardous")}
        >
          <Ionicons
            name="warning"
            size={11}
            color={selectedFilter === "hazardous" ? COLORS.danger : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.filterTabText, selectedFilter === "hazardous" && styles.filterTabTextActive]}>
            Hazardous ({stats.hazardous})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, selectedFilter === "closest" && styles.filterTabActive]}
          onPress={() => setSelectedFilter("closest")}
        >
          <Text style={[styles.filterTabText, selectedFilter === "closest" && styles.filterTabTextActive]}>
            {"< 15 LD"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, selectedFilter === "saved" && styles.filterTabActive]}
          onPress={() => setSelectedFilter("saved")}
        >
          <Ionicons
            name="heart"
            size={11}
            color={selectedFilter === "saved" ? COLORS.danger : COLORS.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.filterTabText, selectedFilter === "saved" && styles.filterTabTextActive]}>
            Saved
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#05070E", "#0A1122", "#070C18"]}
        style={[styles.gradientBg, { paddingTop: insets.top }]}
      >
        {/* Top Header - Explorer Harmonized */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>ORBITAL DEFENSE RADAR</Text>
            <Text style={styles.headerTitle}>Asteroid Watch</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={styles.refreshIconBtn}
              onPress={() => fetchData(selectedDate)}
              disabled={loading}
            >
              <Ionicons name="sync" size={17} color={COLORS.accent} />
            </Pressable>
          </View>
        </View>

        <DateTimePickerModal
          isVisible={calendarVisible}
          mode="date"
          maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} // Allow up to 7 days in future
          themeVariant="dark"
          date={selectedDate}
          onConfirm={(date) => {
            setSelectedDate(date);
            setCalendarVisible(false);
          }}
          onCancel={() => setCalendarVisible(false)}
        />

        {loading && objData.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.loaderBadge}>
              <Ionicons name="planet-outline" size={26} color={COLORS.accent} />
            </View>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loaderTitle}>Scanning orbital traffic...</Text>
            <Text style={styles.loaderSubtitle}>Querying NASA JPL NeoWs radar database for {getDisplayDate()}.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons
                  name={fetchError ? "warning-outline" : "moon-outline"}
                  size={30}
                  color={fetchError ? COLORS.danger : COLORS.accent}
                />
                <Text style={styles.emptyTitle}>
                  {fetchError ? "Data unavailable" : "No asteroids match filter"}
                </Text>
                <Text style={styles.emptyText}>
                  {fetchError || "Try switching your filter tabs or selecting a different observation date."}
                </Text>
                {fetchError ? (
                  <Pressable style={styles.retryButton} onPress={() => fetchData(selectedDate)}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </Pressable>
                ) : null}
              </View>
            }
            ListFooterComponent={loading ? (
              <ActivityIndicator size="large" color={COLORS.accent} style={{ paddingVertical: 20 }} />
            ) : null}
            renderItem={({ item }) => {
              const isFocused = focusedAsteroidId === item.id;
              const countdown = item.epochMs ? formatCountdownTime(item.epochMs) : null;

              return (
                <Pressable
                  style={[
                    styles.cardContainer,
                    isFocused && styles.cardContainerFocused,
                  ]}
                  onPress={() => setFocusedAsteroidId(item.id)}
                >
                  {/* Top Bar: Name & Threat Badge */}
                  <View style={styles.topRow}>
                    <View style={styles.nameColumn}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={styles.asteroidName} numberOfLines={1}>
                          {item.asteroidName.replace(/[()]/g, '')}
                        </Text>
                        {isFocused ? (
                          <View style={styles.focusedPill}>
                            <Text style={styles.focusedPillText}>RADAR LOCKED</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Size Real-World Comparison Pill */}
                      <View style={styles.sizeComparisonBadge}>
                        <Ionicons name="shapes-outline" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                        <Text style={styles.sizeComparisonText}>{item.sizeTag} • ~{item.avgSize}m</Text>
                      </View>
                    </View>

                    <BouncyPressable
                      style={[styles.saveButton, item.saved && styles.saveButtonActive]}
                      onPress={() => toggleFavorite(item)}
                    >
                      <Ionicons
                        name={item.saved ? 'heart' : 'heart-outline'}
                        size={19}
                        color={item.saved ? COLORS.danger : COLORS.textPrimary}
                      />
                    </BouncyPressable>
                  </View>

                  {/* Status Banner */}
                  <View style={styles.cardStatusRow}>
                    <View style={[styles.statusBadge, item.threat ? styles.hazardBadge : styles.safeBadge]}>
                      <Ionicons
                        name={item.threat ? "alert-circle" : "shield-checkmark"}
                        size={12}
                        color={item.threat ? COLORS.danger : COLORS.safe}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.badgeStatusText, { color: item.threat ? COLORS.danger : COLORS.safe }]}>
                        {item.threat ? "POTENTIALLY HAZARDOUS ASTEROID" : "SAFE ORBITAL PASS"}
                      </Text>
                    </View>

                    {countdown ? (
                      <Text style={styles.countdownSmallText}>
                        {countdown.text}
                      </Text>
                    ) : null}
                  </View>

                  {/* Telemetry Metrics Grid */}
                  <View style={styles.metricGrid}>
                    {/* Metric 1: Miss Distance */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Ionicons name="navigate-circle-outline" size={14} color={COLORS.accent} />
                        <Text style={styles.label}>MISS DISTANCE</Text>
                      </View>
                      <Text style={styles.value}>
                        {isLunarUnit ? `${item.lunarDistance} LD` : `${formatNumber(item.distance)} km`}
                      </Text>
                      <Text style={styles.subMetric}>
                        {isLunarUnit ? `${formatNumber(item.distance)} km` : `${item.lunarDistance} Moon Distances`}
                      </Text>
                    </View>

                    {/* Metric 2: Relative Speed */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Ionicons name="speedometer-outline" size={14} color={COLORS.amber} />
                        <Text style={styles.label}>SPEED</Text>
                      </View>
                      <Text style={styles.value}>{item.speed} km/s</Text>
                      <Text style={styles.subMetric}>
                        Mach ~{item.machRating} • {formatNumber(item.speedKmH)} km/h
                      </Text>
                    </View>

                    {/* Metric 3: Estimated Diameter */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Ionicons name="resize-outline" size={14} color={COLORS.emerald || "#3DD598"} />
                        <Text style={styles.label}>DIAMETER RANGE</Text>
                      </View>
                      <Text style={styles.value}>{item.sizeMin}m - {item.sizeMax}m</Text>
                      <Text style={styles.subMetric}>Avg: ~{item.avgSize} meters</Text>
                    </View>

                    {/* Metric 4: Orbiting Body */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Ionicons name="planet-outline" size={14} color={COLORS.accent} />
                        <Text style={styles.label}>ORBIT BODY</Text>
                      </View>
                      <Text style={styles.value}>{item.orbitingBody}</Text>
                      <Text style={styles.subMetric}>H: {item.id ? `Ref #${item.id}` : "--"}</Text>
                    </View>
                  </View>

                  {/* Card Footer with JPL Link */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterText}>
                      Close approach: {item.approachTimeStr ? item.approachTimeStr.split(" ")[1] + " UTC" : "Today"}
                    </Text>

                    <Pressable
                      style={styles.jplLinkBtn}
                      onPress={() => Linking.openURL(item.jplUrl)}
                      hitSlop={6}
                    >
                      <Text style={styles.jplLinkText}>JPL Database</Text>
                      <Ionicons name="open-outline" size={12} color={COLORS.accent} style={{ marginLeft: 3 }} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </LinearGradient>
    </View>
  );
};

export default Asteroid;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#05070E",
    flex: 1,
  },
  gradientBg: {
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

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerWrap: {
    marginBottom: 10,
  },

  // Hero Card
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
    borderColor: "rgba(137, 217, 255, 0.28)",
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
  mainTxt: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subTxt: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unifiedDateBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.7)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 42,
    overflow: "hidden",
  },
  dateStepBtn: {
    width: 38,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dateStepDisabled: {
    opacity: 0.3,
  },
  dateDivider: {
    width: 1,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dateMainBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginHorizontal: 6,
  },
  unitToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.7)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 8,
  },
  unitToggleText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 5,
  },
  unitToggleTextActive: {
    color: COLORS.accent,
  },
  unitToggleDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.borderSubtle,
  },

  // Proximity Radar Card
  radarCard: {
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
  radarCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  radarCardEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  radarCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  countdownUpcoming: {
    backgroundColor: COLORS.amberSoft,
    borderColor: "rgba(255, 176, 103, 0.35)",
  },
  countdownPast: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: COLORS.borderSubtle,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  // Circular Radar Scope
  radarScopeContainer: {
    width: "100%",
    height: 230,
    borderRadius: 14,
    backgroundColor: "#060A14",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  radarRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(137, 217, 255, 0.18)",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  radarRingOuter: {
    width: 210,
    height: 210,
  },
  radarRingMid: {
    width: 140,
    height: 140,
  },
  radarRingMoon: {
    width: 75,
    height: 75,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  radarRingLabel: {
    color: "rgba(137, 217, 255, 0.4)",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },
  radarMoonLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "700",
    marginTop: 1,
  },
  moonMarker: {
    position: "absolute",
    right: -6,
    top: "40%",
  },
  earthCenterMarker: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  earthCenterLabel: {
    color: COLORS.accent,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: -2,
  },
  radarSweepLineWrap: {
    position: "absolute",
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  radarSweepBeam: {
    position: "absolute",
    top: 0,
    width: 2,
    height: 110,
    borderRadius: 1,
  },
  asteroidBlip: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    zIndex: 10,
  },
  asteroidBlipFocused: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFF",
    zIndex: 20,
  },
  focusedBlipHalo: {
    position: "absolute",
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    top: -5,
    left: -5,
  },

  // Radar Legend & Telemetry Bar
  radarLegendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  radarLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },
  focusedTelemetryBar: {
    flexDirection: "row",
    backgroundColor: "rgba(14, 24, 42, 0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "space-between",
  },
  focusedTelemColumn: {
    flex: 1,
    alignItems: "center",
  },
  focusedTelemDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.borderSubtle,
  },
  focusedTelemLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  focusedTelemValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  focusedTelemSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },

  // Summary Row (3 Cards)
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  summarySub: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },

  // Filter Tabs Row
  filterTabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(14, 24, 42, 0.6)",
    borderRadius: 12,
    padding: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  // Asteroid Card
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderColor: COLORS.border,
    borderWidth: 1,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardContainerFocused: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(255, 255, 255, 0.11)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nameColumn: {
    flex: 1,
    paddingRight: 10,
  },
  asteroidName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  focusedPill: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  focusedPillText: {
    color: COLORS.accent,
    fontSize: 8,
    fontWeight: "800",
  },
  sizeComparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  sizeComparisonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonActive: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(255,122,122,0.35)",
  },

  cardStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  badgeStatusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  hazardBadge: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(255,122,122,0.35)",
  },
  safeBadge: {
    backgroundColor: COLORS.safeSoft,
    borderColor: "rgba(61,213,152,0.3)",
  },
  countdownSmallText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: "rgba(14, 24, 42, 0.6)",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  metricHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  subMetric: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },

  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  cardFooterText: {
    color: COLORS.textMuted,
    fontSize: 11,
    flex: 1,
  },
  jplLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(137, 217, 255, 0.3)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  jplLinkText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "700",
  },

  // Loading & Empty States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  loaderBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loaderTitle: {
    marginTop: 16,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  loaderSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,122,122,0.28)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
});
