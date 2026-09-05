import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  ImageBackground,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
  Animated,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BouncyPressable from '../components/BouncyPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Standard NASA-API Explorer Palette
const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#D2DCF0",
  textMuted: "#9CAEC8",
  accent: "#89D9FF",
  accentSoft: "rgba(137, 217, 255, 0.16)",
  surface: "rgba(255, 255, 255, 0.08)",
  surfaceSoft: "rgba(255, 255, 255, 0.12)",
  surfaceElevated: "#0E182A",
  border: "rgba(255, 255, 255, 0.16)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  shadow: "rgba(0, 0, 0, 0.35)",

  // Mission Status Colors
  goGreen: "#34D399",
  goGreenSoft: "rgba(52, 211, 153, 0.18)",
  amber: "#FBBF24",
  amberSoft: "rgba(251, 191, 36, 0.18)",
  danger: "#F87171",
  dangerSoft: "rgba(248, 113, 113, 0.18)",
  liveDot: "#F43F5E",
  rocketFlame: "#FF6B6B",
};

const AGENCIES = [
  { id: "all", label: "All Agencies", icon: "rocket" },
  { id: "spacex", label: "SpaceX", icon: "flash" },
  { id: "nasa", label: "NASA", icon: "planet" },
  { id: "rocket lab", label: "Rocket Lab", icon: "navigate" },
  { id: "isro", label: "ISRO", icon: "globe" },
  { id: "esa", label: "ESA", icon: "telescope" },
];

const CACHE_STORAGE_KEY = "@nasa_api_rocket_launches_cache_v1";
const FAVORITES_STORAGE_KEY = "@nasa_api_rocket_launches_favs_v1";

const cleanAgencyName = (name = "") => {
  if (!name) return "OPERATOR";
  const upper = name.toUpperCase();
  if (upper.includes("CHINA AEROSPACE") || upper.includes("CASC")) return "CASC";
  if (upper.includes("ROSCOSMOS") || upper.includes("RUSSIAN FEDERAL")) return "ROSCOSMOS";
  if (upper.includes("EUROPEAN SPACE") || upper.includes("ESA")) return "ESA";
  if (upper.includes("INDIAN SPACE") || upper.includes("ISRO")) return "ISRO";
  if (upper.includes("JAPAN AEROSPACE") || upper.includes("JAXA")) return "JAXA";
  if (upper.includes("NATIONAL AERONAUTICS") || upper.includes("NASA")) return "NASA";
  if (upper.includes("ARIANESPACE")) return "ARIANESPACE";
  if (upper.includes("ROCKET LAB")) return "ROCKET LAB";
  if (upper.includes("SPACEX")) return "SPACEX";
  if (upper.includes("UNITED LAUNCH ALLIANCE") || upper.includes("ULA")) return "ULA";
  if (upper.includes("BLUE ORIGIN")) return "BLUE ORIGIN";
  if (upper.includes("NORTHROP GRUMMAN")) return "NORTHROP";
  if (upper.includes("MITSUBISHI HEAVY")) return "MHI";
  return name.length > 16 ? `${name.slice(0, 14).trim()}…` : name;
};

const formatLaunchCountdown = (targetDateStr) => {
  if (!targetDateStr) return null;
  const targetEpoch = new Date(targetDateStr).getTime();
  if (isNaN(targetEpoch)) return null;

  const now = Date.now();
  const diff = targetEpoch - now;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  let formatted = "";
  if (days > 0) {
    formatted = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  } else {
    formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  return {
    isPast,
    text: isPast ? `T+ ${formatted}` : `T- ${formatted}`,
    days,
    hours,
    minutes,
    seconds,
  };
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return dateStr;
  }
};

// Isolated Ticking Countdown Badge Component (Never causes parent re-renders)
const LaunchCountdownBadge = memo(({ targetDate, isHero = false }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const countdown = useMemo(() => {
    return formatLaunchCountdown(targetDate);
  }, [targetDate, tick]);

  if (!countdown) return null;

  if (isHero) {
    return (
      <View style={styles.heroCountdownContainer}>
        <View style={styles.heroCountdownHeader}>
          <Ionicons name="timer-outline" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
          <Text style={styles.heroCountdownLabel}>T-MINUS LAUNCH COUNTDOWN</Text>
        </View>
        <Text style={styles.heroCountdownDigits}>
          {countdown.text}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.cardCountdownPill, countdown.isPast ? styles.countdownPillPast : styles.countdownPillFuture]}>
      <Ionicons
        name="time-outline"
        size={11}
        color={countdown.isPast ? COLORS.textMuted : COLORS.accent}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.cardCountdownText, { color: countdown.isPast ? COLORS.textMuted : COLORS.accent }]}>
        {countdown.text}
      </Text>
    </View>
  );
});

// Fallback seed launches for offline & rate-limit resilience
const FALLBACK_LAUNCHES = [
  {
    id: "falcon9-starlink-fallback",
    name: "Falcon 9 Block 5 | Starlink Group 12-8",
    provider: "SpaceX",
    rocketName: "Falcon 9 Block 5",
    net: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    status: "Go for Launch",
    statusAbbrev: "Go",
    orbit: "Low Earth Orbit",
    missionType: "Communications",
    missionDesc: "A batch of Starlink v2 Mini satellites launching to low Earth orbit to expand high-speed global satellite broadband internet.",
    padName: "Space Launch Complex 40",
    location: "Cape Canaveral SFS, FL, USA",
    image: "https://images.unsplash.com/photo-1517976487507-5b3b4b45f912?w=800&q=80",
    webcastUrl: "https://www.youtube.com/@SpaceX",
    saved: false,
  },
  {
    id: "electron-fallback",
    name: "Electron | Return of the Space Jam",
    provider: "Rocket Lab",
    rocketName: "Electron",
    net: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: "Go for Launch",
    statusAbbrev: "Go",
    orbit: "Sun-Synchronous Orbit",
    missionType: "Earth Observation",
    missionDesc: "Dedicated rideshare mission carrying Earth-imaging satellites into sun-synchronous orbit using the Rutherford 3D-printed engine stage.",
    padName: "Launch Complex 1A",
    location: "Māhia Peninsula, New Zealand",
    image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&q=80",
    webcastUrl: "https://www.youtube.com/@RocketLabNZ",
    saved: false,
  },
  {
    id: "soyuz-progress-fallback",
    name: "Soyuz 2.1a | Progress MS-30 (95P)",
    provider: "ROSCOSMOS",
    rocketName: "Soyuz 2.1a",
    net: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    status: "Go for Launch",
    statusAbbrev: "Go",
    orbit: "Low Earth Orbit (ISS)",
    missionType: "Resupply",
    missionDesc: "Automated uncrewed cargo resupply mission delivering food, fuel, oxygen, and scientific hardware to the International Space Station.",
    padName: "Site 31/6",
    location: "Baikonur Cosmodrome, Kazakhstan",
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800&q=80",
    webcastUrl: null,
    saved: false,
  },
];

const RocketLaunch = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  // Header Beacon Pulse Animation
  const livePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
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
    pulse.start();
    return () => pulse.stop();
  }, [livePulseAnim]);

  // Load Saved Favorites
  const loadSavedFavorites = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedIds(new Set(parsed));
      }
    } catch (e) {
      console.warn("Failed to load launch favorites:", e);
    }
  };

  const toggleFavorite = async (launchId) => {
    try {
      const updated = new Set(savedIds);
      if (updated.has(launchId)) {
        updated.delete(launchId);
      } else {
        updated.add(launchId);
      }
      setSavedIds(updated);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(updated)));
    } catch (e) {
      console.warn("Failed to save launch favorite:", e);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Fetch Launch Data from Launch Library 2 with Cache & Fallback
  const fetchLaunches = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      // First try loading cache if initial load
      if (!isManualRefresh) {
        const cachedRaw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
        if (cachedRaw) {
          const cachedList = JSON.parse(cachedRaw);
          if (Array.isArray(cachedList) && cachedList.length > 0) {
            setLaunches(cachedList);
            setLoading(false);
          }
        }
      }

      // Fetch live schedule (limit 25)
      const res = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=25");
      if (!res.ok) {
        throw new Error(`Schedule service returned status ${res.status}`);
      }

      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      if (results.length === 0) {
        throw new Error("No upcoming launches scheduled right now.");
      }

      const mapped = results.map((item) => {
        const video = Array.isArray(item.vidURLs) && item.vidURLs.length > 0 ? item.vidURLs[0]?.url : null;
        return {
          id: item.id,
          name: item.name || "Orbital Launch Mission",
          provider: item.launch_service_provider?.name || "Spacecraft Operator",
          rocketName: item.rocket?.configuration?.name || "Rocket Vehicle",
          net: item.net,
          status: item.status?.name || "Scheduled",
          statusAbbrev: item.status?.abbrev || "TBD",
          orbit: item.mission?.orbit?.name || "Orbital Target",
          missionType: item.mission?.type || "General Mission",
          missionDesc: item.mission?.description || "Payload integration and orbital insertion parameters are currently being finalized by the launch provider.",
          padName: item.pad?.name || "Launch Complex",
          location: item.pad?.location?.name || "Global Spaceport",
          image: item.image || "https://images.unsplash.com/photo-1517976487507-5b3b4b45f912?w=800&q=80",
          webcastUrl: video || (item.webcast_live ? "https://www.youtube.com" : null),
        };
      });

      setLaunches(mapped);
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(mapped));
    } catch (err) {
      console.warn("Launch fetch error:", err);
      // If we don't have launches, use high-quality seed fallbacks
      setLaunches((current) => {
        if (current.length > 0) return current;
        return FALLBACK_LAUNCHES;
      });
      setError("Using stored orbital manifest while telemetry reconnects.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSavedFavorites();
    fetchLaunches();
  }, [fetchLaunches]);

  // Filter and Search Logic
  const filteredLaunches = useMemo(() => {
    return launches.filter((item) => {
      // Agency Filter
      let matchesAgency = true;
      if (selectedAgency !== "all") {
        const prov = (item.provider || "").toLowerCase();
        const rkt = (item.rocketName || "").toLowerCase();
        if (selectedAgency === "spacex") matchesAgency = prov.includes("spacex") || rkt.includes("falcon") || rkt.includes("starship");
        else if (selectedAgency === "nasa") matchesAgency = prov.includes("nasa") || rkt.includes("sls") || rkt.includes("artemis");
        else if (selectedAgency === "rocket lab") matchesAgency = prov.includes("rocket lab") || rkt.includes("electron");
        else if (selectedAgency === "isro") matchesAgency = prov.includes("isro") || rkt.includes("pslv") || rkt.includes("lvm");
        else if (selectedAgency === "esa") matchesAgency = prov.includes("esa") || prov.includes("arianespace") || rkt.includes("ariane") || rkt.includes("vega");
      }

      // Search Filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        matchesSearch =
          (item.name || "").toLowerCase().includes(query) ||
          (item.provider || "").toLowerCase().includes(query) ||
          (item.rocketName || "").toLowerCase().includes(query) ||
          (item.location || "").toLowerCase().includes(query) ||
          (item.missionType || "").toLowerCase().includes(query);
      }

      return matchesAgency && matchesSearch;
    });
  }, [launches, selectedAgency, searchQuery]);

  const nextHeroLaunch = useMemo(() => {
    return launches.length > 0 ? launches[0] : null;
  }, [launches]);

  // List Header Component
  const renderHeader = useMemo(() => {
    return (
      <View style={styles.headerContainer}>
        {/* Next Major Launch Hero Card */}
        {nextHeroLaunch ? (
          <View style={styles.heroCard}>
            <ImageBackground
              source={{ uri: nextHeroLaunch.image }}
              style={styles.heroCardBg}
              imageStyle={styles.heroCardBgImg}
            >
              <LinearGradient
                colors={["rgba(5, 7, 14, 0.4)", "rgba(5, 7, 14, 0.85)", "#05070E"]}
                style={styles.heroGradientOverlay}
              >
                {/* Hero Top Bar */}
                <View style={styles.heroTopBar}>
                  <View style={styles.heroAgencyBadge}>
                    <Ionicons name="rocket-outline" size={12} color={COLORS.accent} style={{ marginRight: 5 }} />
                    <Text style={styles.heroAgencyText} numberOfLines={1}>
                      {cleanAgencyName(nextHeroLaunch.provider).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.heroStatusPill}>
                    <View style={styles.heroStatusDot} />
                    <Text style={styles.heroStatusText}>{nextHeroLaunch.status}</Text>
                  </View>
                </View>

                {/* Hero Title & Vehicle */}
                <Text style={styles.heroMissionName} numberOfLines={2}>
                  {nextHeroLaunch.name}
                </Text>

                <View style={styles.heroMetaRow}>
                  <View style={styles.heroMetaPill}>
                    <Ionicons name="navigate-outline" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.heroMetaPillText}>{nextHeroLaunch.rocketName}</Text>
                  </View>

                  <View style={styles.heroMetaPill}>
                    <Ionicons name="earth-outline" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.heroMetaPillText}>{nextHeroLaunch.orbit}</Text>
                  </View>
                </View>

                {/* Live T-Minus Countdown Ticker */}
                <LaunchCountdownBadge targetDate={nextHeroLaunch.net} isHero={true} />

                {/* Spaceport Location & Webcast Action */}
                <View style={styles.heroActionFooter}>
                  <View style={styles.heroSpaceportCol}>
                    <Text style={styles.heroSpaceportLabel}>SPACEPORT</Text>
                    <Text style={styles.heroSpaceportText} numberOfLines={1}>
                      📍 {nextHeroLaunch.padName}, {nextHeroLaunch.location}
                    </Text>
                  </View>

                  {nextHeroLaunch.webcastUrl ? (
                    <BouncyPressable
                      style={styles.heroWebcastBtn}
                      onPress={() => Linking.openURL(nextHeroLaunch.webcastUrl)}
                    >
                      <Ionicons name="logo-youtube" size={14} color="#FFF" style={{ marginRight: 5 }} />
                      <Text style={styles.heroWebcastBtnText}>Watch Live</Text>
                    </BouncyPressable>
                  ) : null}
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        ) : null}

        {/* Agency Quick Filter ScrollRow */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agencyFilterRow}
          >
            {AGENCIES.map((agency) => {
              const active = selectedAgency === agency.id;
              return (
                <Pressable
                  key={agency.id}
                  style={[styles.agencyFilterPill, active && styles.agencyFilterPillActive]}
                  onPress={() => setSelectedAgency(agency.id)}
                >
                  <Ionicons
                    name={agency.icon}
                    size={13}
                    color={active ? COLORS.accent : COLORS.textMuted}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.agencyFilterText, active && styles.agencyFilterTextActive]}>
                    {agency.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search missions, vehicles, spaceports..."
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

          {/* Section Subtitle Counter */}
          <View style={styles.scheduleHeaderRow}>
            <View style={styles.scheduleHeaderLeft}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
              <Text style={styles.scheduleHeaderTitle}>FLIGHT MANIFEST SCHEDULE</Text>
            </View>
            <Text style={styles.scheduleHeaderCount}>
              {filteredLaunches.length} {filteredLaunches.length === 1 ? "Mission" : "Missions"}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [nextHeroLaunch, selectedAgency, searchQuery, filteredLaunches.length]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#05070E", "#0A1122", "#070C18"]} style={[styles.gradient, { paddingTop: insets.top }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>GLOBAL ORBITAL SCHEDULE</Text>
            <Text style={styles.headerTitle}>Rocket Launches</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable style={styles.refreshIconBtn} onPress={() => fetchLaunches(true)} disabled={loading || refreshing}>
              <Ionicons name="sync" size={17} color={COLORS.accent} />
            </Pressable>

            <View style={styles.liveTelemetryBadge}>
              <Animated.View
                style={[
                  styles.liveDotPulsing,
                  { transform: [{ scale: livePulseAnim }] }
                ]}
              />
              <Text style={styles.liveText}>LIVE RADAR</Text>
            </View>
          </View>
        </View>

        {/* Main Launches Feed */}
        {loading && launches.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loaderText}>Querying spaceflight launch library manifest...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLaunches}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchLaunches(true)}
                tintColor={COLORS.accent}
                colors={[COLORS.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="rocket-outline" size={32} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>No Launches Found</Text>
                <Text style={styles.emptyText}>
                  No scheduled launches match your selected agency filter or search keyword.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSaved = savedIds.has(item.id);
              const isExpanded = expandedIds.has(item.id);

              return (
                <View style={styles.launchCard}>
                  {/* Top Row: Provider Badge, Countdown Pill & Favorite */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.providerBadge}>
                      <Text style={styles.providerText} numberOfLines={1} ellipsizeMode="tail">
                        {cleanAgencyName(item.provider).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderRight}>
                      <LaunchCountdownBadge targetDate={item.net} />
                      <BouncyPressable
                        style={[styles.favBtn, isSaved && styles.favBtnActive]}
                        onPress={() => toggleFavorite(item.id)}
                        hitSlop={6}
                      >
                        <Ionicons
                          name={isSaved ? "heart" : "heart-outline"}
                          size={17}
                          color={isSaved ? COLORS.danger : COLORS.textMuted}
                        />
                      </BouncyPressable>
                    </View>
                  </View>

                  {/* Mission Title */}
                  <Text style={styles.cardMissionTitle}>{item.name}</Text>

                  {/* Telemetry Row: Rocket Vehicle & Target Orbit */}
                  <View style={styles.cardTelemetryRow}>
                    <View style={styles.cardTelemPill}>
                      <Ionicons name="navigate-outline" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.cardTelemPillText}>{item.rocketName}</Text>
                    </View>

                    <View style={styles.cardTelemPill}>
                      <Ionicons name="planet-outline" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.cardTelemPillText}>{item.orbit}</Text>
                    </View>

                    <View style={[styles.cardStatusBadge, item.statusAbbrev === "Go" ? styles.statusGo : styles.statusTbd]}>
                      <Text style={[styles.cardStatusText, { color: item.statusAbbrev === "Go" ? COLORS.goGreen : COLORS.amber }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Launch Date & Spaceport Location */}
                  <View style={styles.locationContainer}>
                    <Text style={styles.launchDateText}>
                      🗓️ {formatDisplayDate(item.net)}
                    </Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      📍 {item.padName}, {item.location}
                    </Text>
                  </View>

                  {/* Mission Description with Expand/Collapse */}
                  <Text
                    style={styles.missionDescription}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {item.missionDesc}
                  </Text>

                  {item.missionDesc.length > 90 ? (
                    <Pressable onPress={() => toggleExpand(item.id)} style={styles.expandTextBtn}>
                      <Text style={styles.expandTextBtnLabel}>
                        {isExpanded ? "Show Less" : "Read Full Mission Briefing"}
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={12}
                        color={COLORS.accent}
                      />
                    </Pressable>
                  ) : null}

                  {/* Webcast Link Bar if Available */}
                  {item.webcastUrl ? (
                    <BouncyPressable
                      style={styles.cardWebcastBar}
                      onPress={() => Linking.openURL(item.webcastUrl)}
                    >
                      <Ionicons name="logo-youtube" size={15} color="#FF4D4D" style={{ marginRight: 6 }} />
                      <Text style={styles.cardWebcastText}>Watch Official Launch Webcast</Text>
                      <Ionicons name="open-outline" size={13} color={COLORS.accent} style={{ marginLeft: "auto" }} />
                    </BouncyPressable>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </LinearGradient>
    </View>
  );
};

export default RocketLaunch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070E",
  },
  gradient: {
    flex: 1,
  },

  // Top Header (Standard Explorer Pattern)
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

  // List & Content
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 36,
  },
  headerContainer: {
    marginBottom: 10,
  },

  // Hero Card (Next Major Launch)
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    backgroundColor: "#060A14",
  },
  heroCardBg: {
    width: "100%",
    minHeight: 330,
    justifyContent: "flex-end",
  },
  heroCardBgImg: {
    opacity: 0.85,
  },
  heroGradientOverlay: {
    padding: 16,
    justifyContent: "flex-end",
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroAgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.9)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  heroAgencyText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.goGreenSoft,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.goGreen,
    marginRight: 5,
  },
  heroStatusText: {
    color: COLORS.goGreen,
    fontSize: 10,
    fontWeight: "700",
  },
  heroMissionName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 8,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.8)",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  heroMetaPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  // Hero Countdown Box
  heroCountdownContainer: {
    backgroundColor: "rgba(14, 24, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(137, 217, 255, 0.35)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  heroCountdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  heroCountdownLabel: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroCountdownDigits: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },

  // Hero Action Footer
  heroActionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 10,
  },
  heroSpaceportCol: {
    flex: 1,
    marginRight: 10,
  },
  heroSpaceportLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroSpaceportText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  heroWebcastBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E50914",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  heroWebcastBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Agency Filter Section
  filterSection: {
    marginBottom: 6,
  },
  agencyFilterRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 10,
  },
  agencyFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  agencyFilterPillActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.accent,
  },
  agencyFilterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  agencyFilterTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Search Input Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.7)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },

  // Schedule Header Row
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  scheduleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleHeaderTitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  scheduleHeaderCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  // Launch Cards Feed
  launchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  providerBadge: {
    backgroundColor: "rgba(14, 24, 42, 0.8)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    maxWidth: 130,
    flexShrink: 1,
  },
  providerText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  cardCountdownPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 0,
  },
  countdownPillFuture: {
    backgroundColor: "rgba(137, 217, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(137, 217, 255, 0.28)",
  },
  countdownPillPast: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardCountdownText: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  favBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  favBtnActive: {
    borderColor: COLORS.danger,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
  },

  cardMissionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 22,
  },

  cardTelemetryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  cardTelemPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.6)",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  cardTelemPillText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  cardStatusBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusGo: {
    backgroundColor: COLORS.goGreenSoft,
  },
  statusTbd: {
    backgroundColor: COLORS.amberSoft,
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  locationContainer: {
    backgroundColor: "rgba(14, 24, 42, 0.4)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  launchDateText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  locationText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  missionDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  expandTextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  expandTextBtnLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
  },

  cardWebcastBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(229, 9, 20, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(229, 9, 20, 0.3)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  cardWebcastText: {
    color: "#FF8585",
    fontSize: 11,
    fontWeight: "700",
  },

  // State Card & Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loaderText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 14,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
