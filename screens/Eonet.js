import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#8FD2FF",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "wildfires", label: "Fires" },
  { id: "severeStorms", label: "Storms" },
  { id: "volcanoes", label: "Volcanoes" },
  { id: "floods", label: "Floods" },
];

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Eonet = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100");
      if (!response.ok) throw new Error("EONET is unavailable right now.");
      const payload = await response.json();
      setEvents(Array.isArray(payload?.events) ? payload.events : []);
    } catch (requestError) {
      setError(requestError.message || "We couldn't load natural events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const visibleEvents = useMemo(() => events.filter((event) => (
    selectedFilter === "all" || event.categories?.some((category) => category.id === selectedFilter)
  )), [events, selectedFilter]);

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#04070C", "#0A1323", "#050913"]} style={[styles.gradient, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>NASA EONET</Text>
            <Text style={styles.headerTitle}>Earth Events</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Ionicons name="earth-outline" size={16} color={COLORS.accent} />
              <Text style={styles.badgeText}>NASA EONET</Text>
            </View>
            <Text style={styles.heroTitle}>Natural events, happening now.</Text>
            <Text style={styles.heroSubtitle}>
              Track open wildfires, storms, volcanoes, floods, and other events observed around Earth.
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                style={[styles.filterButton, selectedFilter === filter.id && styles.filterButtonActive]}
              >
                <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>{filter.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.stateCard}><ActivityIndicator color={COLORS.accent} size="large" /><Text style={styles.stateText}>Finding active events...</Text></View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Ionicons name="cloud-offline-outline" size={30} color={COLORS.accent} />
              <Text style={styles.stateText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={loadEvents}><Text style={styles.retryText}>Try again</Text></Pressable>
            </View>
          ) : visibleEvents.length === 0 ? (
            <View style={styles.stateCard}><Text style={styles.stateText}>No open events in this category right now.</Text></View>
          ) : visibleEvents.map((event) => {
            const latestGeometry = event.geometry?.[event.geometry.length - 1];
            const sourceUrl = event.sources?.[0]?.url;
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventTopRow}>
                  <View style={styles.categoryPill}><Text style={styles.categoryText}>{event.categories?.[0]?.title || "Natural event"}</Text></View>
                  <Text style={styles.dateText}>{formatDate(latestGeometry?.date)}</Text>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{event.geometry?.length || 0} observation{event.geometry?.length === 1 ? "" : "s"} · Open event</Text>
                {sourceUrl ? <Pressable onPress={() => Linking.openURL(sourceUrl)} style={styles.sourceButton}><Text style={styles.sourceText}>View source</Text><Ionicons name="open-outline" size={14} color={COLORS.accent} /></Pressable> : null}
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default Eonet;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#04070C" }, gradient: { flex: 1 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
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
  scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 36 },
  heroCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 28, padding: 18 },
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 11 },
  badgeText: { color: COLORS.textPrimary, fontWeight: "700", letterSpacing: 1.1, fontSize: 11, marginLeft: 7 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 29, lineHeight: 35, fontWeight: "700", marginTop: 16 },
  heroSubtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  filterRow: { paddingVertical: 18, paddingRight: 16 },
  filterButton: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, borderRadius: 18, paddingVertical: 9, paddingHorizontal: 13, marginRight: 8 },
  filterButtonActive: { backgroundColor: "rgba(143,210,255,0.22)", borderColor: "rgba(143,210,255,0.7)" },
  filterText: { color: COLORS.textMuted, fontWeight: "600" }, filterTextActive: { color: COLORS.textPrimary },
  eventCard: { backgroundColor: "rgba(11,17,28,0.94)", borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  eventTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  categoryPill: { backgroundColor: "rgba(143,210,255,0.14)", borderRadius: 99, paddingVertical: 5, paddingHorizontal: 9 },
  categoryText: { color: COLORS.accent, fontWeight: "700", fontSize: 11 }, dateText: { color: COLORS.textMuted, fontSize: 12 },
  eventTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 18, lineHeight: 24, marginTop: 13 },
  eventMeta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 7 },
  sourceButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", marginTop: 14 },
  sourceText: { color: COLORS.accent, fontWeight: "700", fontSize: 13, marginRight: 5 },
  stateCard: { minHeight: 180, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", padding: 22 },
  stateText: { color: COLORS.textSecondary, textAlign: "center", lineHeight: 21, marginTop: 12 },
  retryButton: { marginTop: 14, borderRadius: 14, backgroundColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 16 }, retryText: { color: "#07101E", fontWeight: "800" },
});
