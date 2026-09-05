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
  Share,
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

  // Topic & Highlights
  liveDot: "#F43F5E",
  badgeBg: "rgba(14, 24, 42, 0.85)",
  danger: "#F87171",
  emerald: "#34D399",
  emeraldSoft: "rgba(52, 211, 153, 0.18)",
  amber: "#FBBF24",
};

const TOPIC_FILTERS = [
  { id: "all", label: "All News", icon: "newspaper" },
  { id: "nasa", label: "NASA", icon: "planet" },
  { id: "spacex", label: "SpaceX", icon: "flash" },
  { id: "deep-space", label: "Deep Space", icon: "telescope" },
  { id: "rocketry", label: "Rocketry", icon: "rocket" },
  { id: "commercial", label: "Commercial", icon: "business" },
];

const CACHE_STORAGE_KEY = "@nasa_api_space_news_cache_v1";
const FAVORITES_STORAGE_KEY = "@nasa_api_space_news_favs_v1";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

const formatArticleDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Seed fallback articles for offline and network resilience
const FALLBACK_ARTICLES = [
  {
    id: 1001,
    title: "NASA's James Webb Telescope Detects Atmospheric Carbon on Habitable Exoplanet Candidate",
    summary: "Astronomers using the James Webb Space Telescope have identified carbon-bearing molecules in the atmosphere of an exoplanet in the habitable zone of its host star.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    news_site: "NASA",
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    url: "https://science.nasa.gov",
  },
  {
    id: 1002,
    title: "SpaceX Prepares Starship Flight Test with Upgraded Raptor Engines and Heat Shield Upgrades",
    summary: "SpaceX is completing final propellant load tests at Starbase Boca Chica for the next integrated Starship test flight, focusing on controlled stage separation.",
    image_url: "https://images.unsplash.com/photo-1517976487507-5b3b4b45f912?w=800&q=80",
    news_site: "SpaceNews",
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    url: "https://spacenews.com",
  },
  {
    id: 1003,
    title: "European Space Agency's Euclid Space Telescope Unveils First Mosaic of the Cosmic Web",
    summary: "ESA's Euclid mission has released its first dazzling cosmic panorama, tracing the geometry of dark matter across billions of light-years.",
    image_url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&q=80",
    news_site: "ESA",
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    url: "https://www.esa.int",
  },
];

const SpaceNews = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  // Load Saved Bookmarks
  const loadSavedBookmarks = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedIds(new Set(parsed));
      }
    } catch (e) {
      console.warn("Failed to load news bookmarks:", e);
    }
  };

  const toggleBookmark = async (articleId) => {
    try {
      const updated = new Set(savedIds);
      if (updated.has(articleId)) {
        updated.delete(articleId);
      } else {
        updated.add(articleId);
      }
      setSavedIds(updated);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(updated)));
    } catch (e) {
      console.warn("Failed to toggle news bookmark:", e);
    }
  };

  const shareArticle = async (article) => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead more via NASA-API: ${article.url}`,
        url: article.url,
      });
    } catch (e) {
      console.warn("Share error:", e);
    }
  };

  // Fetch News from Spaceflight News API (SNAPI v4)
  const fetchNews = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      // First check local cache if initial load
      if (!isManualRefresh) {
        const cachedRaw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached) && cached.length > 0) {
            setArticles(cached);
            setLoading(false);
          }
        }
      }

      const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=30");
      if (!res.ok) {
        throw new Error(`News server returned status ${res.status}`);
      }

      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      if (results.length === 0) {
        throw new Error("No space news articles found.");
      }

      setArticles(results);
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(results));
    } catch (err) {
      console.warn("Space news fetch error:", err);
      setArticles((current) => {
        if (current.length > 0) return current;
        return FALLBACK_ARTICLES;
      });
      setError("Displaying cached dispatches while telemetry reconnects.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSavedBookmarks();
    fetchNews();
  }, [fetchNews]);

  // Topic and Search Filtering Logic
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      // Topic Filter
      let matchesTopic = true;
      if (selectedTopic !== "all") {
        const textToMatch = `${item.title} ${item.summary} ${item.news_site}`.toLowerCase();
        if (selectedTopic === "nasa") matchesTopic = textToMatch.includes("nasa") || textToMatch.includes("artemis") || textToMatch.includes("webb");
        else if (selectedTopic === "spacex") matchesTopic = textToMatch.includes("spacex") || textToMatch.includes("falcon") || textToMatch.includes("starship");
        else if (selectedTopic === "deep-space") matchesTopic = textToMatch.includes("telescope") || textToMatch.includes("galaxy") || textToMatch.includes("exoplanet") || textToMatch.includes("astronomy");
        else if (selectedTopic === "rocketry") matchesTopic = textToMatch.includes("rocket") || textToMatch.includes("launch") || textToMatch.includes("booster") || textToMatch.includes("engine");
        else if (selectedTopic === "commercial") matchesTopic = textToMatch.includes("commercial") || textToMatch.includes("blue origin") || textToMatch.includes("rocket lab") || textToMatch.includes("satellite");
      }

      // Keyword Search Filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        matchesSearch =
          (item.title || "").toLowerCase().includes(query) ||
          (item.summary || "").toLowerCase().includes(query) ||
          (item.news_site || "").toLowerCase().includes(query);
      }

      return matchesTopic && matchesSearch;
    });
  }, [articles, selectedTopic, searchQuery]);

  const heroArticle = useMemo(() => {
    return articles.length > 0 ? articles[0] : null;
  }, [articles]);

  // Header Component (Hero Headline + Filter Pills + Search Bar)
  const renderHeader = useMemo(() => {
    return (
      <View style={styles.headerContainer}>
        {/* Top Featured Breaking Headline Hero Card */}
        {heroArticle ? (
          <Pressable
            style={styles.heroCard}
            onPress={() => Linking.openURL(heroArticle.url)}
          >
            <ImageBackground
              source={{ uri: heroArticle.image_url }}
              style={styles.heroCardBg}
              imageStyle={styles.heroCardBgImg}
            >
              <LinearGradient
                colors={["rgba(5, 7, 14, 0.3)", "rgba(5, 7, 14, 0.8)", "#05070E"]}
                style={styles.heroGradientOverlay}
              >
                {/* Hero Top Tag Row */}
                <View style={styles.heroTopBar}>
                  <View style={styles.heroSourceBadge}>
                    <Ionicons name="sparkles" size={11} color={COLORS.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.heroSourceText}>{heroArticle.news_site.toUpperCase()}</Text>
                  </View>

                  <View style={styles.heroTimePill}>
                    <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.heroTimeText}>{formatTimeAgo(heroArticle.published_at)}</Text>
                  </View>
                </View>

                {/* Hero Headline */}
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {heroArticle.title}
                </Text>

                {/* Hero Excerpt */}
                <Text style={styles.heroExcerpt} numberOfLines={2}>
                  {heroArticle.summary}
                </Text>

                {/* Action Row */}
                <View style={styles.heroActionRow}>
                  <View style={styles.heroReadBtn}>
                    <Text style={styles.heroReadBtnText}>Read Full Dispatch</Text>
                    <Ionicons name="arrow-forward" size={13} color="#05070E" style={{ marginLeft: 4 }} />
                  </View>

                  <BouncyPressable
                    style={styles.heroShareBtn}
                    onPress={() => shareArticle(heroArticle)}
                    hitSlop={8}
                  >
                    <Ionicons name="share-outline" size={16} color={COLORS.textPrimary} />
                  </BouncyPressable>
                </View>
              </LinearGradient>
            </ImageBackground>
          </Pressable>
        ) : null}

        {/* Topic Quick Filter ScrollRow */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicFilterRow}
          >
            {TOPIC_FILTERS.map((topic) => {
              const active = selectedTopic === topic.id;
              return (
                <Pressable
                  key={topic.id}
                  style={[styles.topicFilterPill, active && styles.topicFilterPillActive]}
                  onPress={() => setSelectedTopic(topic.id)}
                >
                  <Ionicons
                    name={topic.icon}
                    size={13}
                    color={active ? COLORS.accent : COLORS.textMuted}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.topicFilterText, active && styles.topicFilterTextActive]}>
                    {topic.label}
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
              placeholder="Search space news, rockets, exoplanets..."
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

          {/* Feed Header Count Row */}
          <View style={styles.feedHeaderRow}>
            <View style={styles.feedHeaderLeft}>
              <Ionicons name="newspaper-outline" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
              <Text style={styles.feedHeaderTitle}>COSMIC DISPATCHES</Text>
            </View>
            <Text style={styles.feedHeaderCount}>
              {filteredArticles.length} {filteredArticles.length === 1 ? "Article" : "Articles"}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [heroArticle, selectedTopic, searchQuery, filteredArticles.length]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#05070E", "#0A1122", "#070C18"]} style={[styles.gradient, { paddingTop: insets.top }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>GLOBAL SPACE DISPATCHES</Text>
            <Text style={styles.headerTitle}>Space News</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable style={styles.refreshIconBtn} onPress={() => fetchNews(true)} disabled={loading || refreshing}>
              <Ionicons name="sync" size={17} color={COLORS.accent} />
            </Pressable>

            <View style={styles.liveTelemetryBadge}>
              <Animated.View
                style={[
                  styles.liveDotPulsing,
                  { transform: [{ scale: livePulseAnim }] }
                ]}
              />
              <Text style={styles.liveText}>LIVE WIRE</Text>
            </View>
          </View>
        </View>

        {/* Main News Articles Feed */}
        {loading && articles.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loaderText}>Receiving planetary news broadcasts...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredArticles}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchNews(true)}
                tintColor={COLORS.accent}
                colors={[COLORS.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="newspaper-outline" size={32} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>No Articles Found</Text>
                <Text style={styles.emptyText}>
                  No stories match your selected topic filter or search keyword.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSaved = savedIds.has(item.id);

              return (
                <Pressable
                  style={styles.newsCard}
                  onPress={() => Linking.openURL(item.url)}
                >
                  {/* Article Thumbnail Image */}
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.cardThumbnail}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Card Content Area */}
                  <View style={styles.cardContent}>
                    {/* Top Meta Bar: Source Badge, Time & Action Icons */}
                    <View style={styles.cardMetaRow}>
                      <View style={styles.sourcePill}>
                        <Text style={styles.sourceText} numberOfLines={1}>{item.news_site}</Text>
                      </View>

                      <Text style={styles.timeAgoText}>{formatTimeAgo(item.published_at)}</Text>

                      <View style={styles.cardActionsRight}>
                        <BouncyPressable
                          style={[styles.actionIconBtn, isSaved && styles.actionIconBtnActive]}
                          onPress={() => toggleBookmark(item.id)}
                          hitSlop={6}
                        >
                          <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={16}
                            color={isSaved ? COLORS.accent : COLORS.textMuted}
                          />
                        </BouncyPressable>

                        <BouncyPressable
                          style={styles.actionIconBtn}
                          onPress={() => shareArticle(item)}
                          hitSlop={6}
                        >
                          <Ionicons
                            name="share-social-outline"
                            size={16}
                            color={COLORS.textMuted}
                          />
                        </BouncyPressable>
                      </View>
                    </View>

                    {/* Headline */}
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    {/* Excerpt */}
                    <Text style={styles.cardSummary} numberOfLines={2}>
                      {item.summary}
                    </Text>

                    {/* Footer Row: Full Date & Read Link */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardDate}>{formatArticleDate(item.published_at)}</Text>
                      <View style={styles.readMoreRow}>
                        <Text style={styles.readMoreText}>Read Story</Text>
                        <Ionicons name="open-outline" size={12} color={COLORS.accent} />
                      </View>
                    </View>
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

export default SpaceNews;

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

  // Hero Card (Top Breaking Story)
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    backgroundColor: "#060A14",
  },
  heroCardBg: {
    width: "100%",
    minHeight: 280,
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
    marginBottom: 10,
  },
  heroSourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.9)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  heroSourceText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTimePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 24, 42, 0.8)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  heroTimeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 8,
  },
  heroExcerpt: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  heroActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 12,
  },
  heroReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  heroReadBtnText: {
    color: "#05070E",
    fontSize: 11,
    fontWeight: "800",
  },
  heroShareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(14, 24, 42, 0.85)",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  // Topic Filters
  filterSection: {
    marginBottom: 6,
  },
  topicFilterRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 10,
  },
  topicFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  topicFilterPillActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.accent,
  },
  topicFilterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  topicFilterTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  // Search Bar
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

  // Feed Header Row
  feedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  feedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedHeaderTitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  feedHeaderCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  // Article Feed Cards
  newsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardThumbnail: {
    width: "100%",
    height: 160,
    backgroundColor: "#060A14",
  },
  cardContent: {
    padding: 14,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  sourcePill: {
    backgroundColor: "rgba(14, 24, 42, 0.85)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
    maxWidth: 140,
  },
  sourceText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timeAgoText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  cardActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 6,
  },
  cardSummary: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 8,
  },
  cardDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },

  // Loader & Empty States
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
