import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { loadNasaApiKey } from '../components/nasaApiKeyStorage';

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
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  shadow: "rgba(0,0,0,0.34)",
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const Asteroid = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [objData, setObjData] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [nasaApiKey, setNasaApiKey] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(true);

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
    } catch (e) {
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

      const processedData = await Promise.all(rawList.map(async (obj) => {
        const approach = obj.close_approach_data?.[0];
        const savedStatus = await isAsteroidSaved(obj.id);
        const diameterMin = Math.round(obj.estimated_diameter?.meters?.estimated_diameter_min || 0);
        const diameterMax = Math.round(obj.estimated_diameter?.meters?.estimated_diameter_max || 0);
        const speed = Number.parseFloat(approach?.relative_velocity?.kilometers_per_second || 0);
        const distance = Number.parseFloat(approach?.miss_distance?.kilometers || 0);

        return {
          id: obj.id,
          asteroidName: obj.name,
          sizeMin: diameterMin,
          sizeMax: diameterMax,
          threat: obj.is_potentially_hazardous_asteroid,
          speed: speed.toFixed(2),
          distance: distance.toFixed(0),
          speedRaw: speed,
          distanceRaw: distance,
          orbitingBody: approach?.orbiting_body || "Earth",
          saved: savedStatus,
        };
      }));

      setObjData(processedData);
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

  const stats = useMemo(() => {
    if (objData.length === 0) {
      return {
        total: 0,
        hazardous: 0,
        closestKm: "0",
      };
    }

    const hazardous = objData.filter((item) => item.threat).length;
    const closestDistance = Math.min(...objData.map((item) => Number(item.distanceRaw || 0)));

    return {
      total: objData.length,
      hazardous,
      closestKm: formatNumber(Math.round(closestDistance)),
    };
  }, [objData]);

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>NEAR-EARTH OBJECT FEED</Text>
        <Text style={styles.mainTxt}>Asteroid traffic around Earth, one day at a time.</Text>
        <Text style={styles.subTxt}>
          Pick a date, scan the closest objects, and save the ones you want to revisit.
        </Text>

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
              <Ionicons name="chevron-back" size={18} color={COLORS.accent} />
            </Pressable>

            <View style={styles.dateDivider} />

            <Pressable style={styles.dateMainBtn} onPress={() => setCalendarVisible(true)}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.accent} />
              <Text style={styles.dateText}>{getDisplayDate()}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
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
              <Ionicons name="chevron-forward" size={18} color={isToday ? COLORS.textMuted : COLORS.accent} />
            </Pressable>
          </View>

          <View style={styles.countChip}>
            <Text style={styles.countChipLabel}>OBJECTS</Text>
            <Text style={styles.countChipValue}>{stats.total}</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
          <Text style={styles.summaryLabel}>Hazardous</Text>
          <Text style={styles.summaryValue}>{stats.hazardous}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="planet-outline" size={18} color={COLORS.accent} />
          <Text style={styles.summaryLabel}>Closest Miss</Text>
          <Text style={styles.summaryValue}>{stats.closestKm} km</Text>
        </View>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#04070C", "#0A1323", "#050913"]}
        style={[styles.gradientBg, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>NEAR EARTH OBJECTS</Text>
            <Text style={styles.headerTitle}>Asteroid Watch</Text>
          </View>
        </View>
        <DateTimePickerModal
          isVisible={calendarVisible}
          mode='date'
          maximumDate={new Date()}
          themeVariant='dark'
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
            <Text style={styles.loaderTitle}>Scanning orbital traffic</Text>
            <Text style={styles.loaderSubtitle}>Pulling NASA NEO data for {getDisplayDate()}.</Text>
          </View>
        ) : (
          <FlatList
            data={objData}
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
                  {fetchError ? "Data unavailable" : "No asteroids found"}
                </Text>
                <Text style={styles.emptyText}>
                  {fetchError || "NASA returned an empty list for this day."}
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
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <View style={styles.topRow}>
                  <View style={styles.nameColumn}>
                    <Text style={styles.asteroidName} numberOfLines={2}>
                      {item.asteroidName.replace(/[()]/g, '')}
                    </Text>
                    <View style={[styles.statusBadge, item.threat ? styles.hazardBadge : styles.safeBadge]}>
                      <Text style={styles.badgeStatusText}>
                        {item.threat ? "Potentially hazardous" : "Low threat"}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.saveButton, item.saved && styles.saveButtonActive]}
                    onPress={() => toggleFavorite(item)}
                  >
                    <Ionicons
                      name={item.saved ? 'heart' : 'heart-outline'}
                      size={20}
                      color={item.saved ? COLORS.danger : COLORS.textPrimary}
                    />
                  </Pressable>
                </View>

                <View style={styles.metricGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.label}>Diameter</Text>
                    <Text style={styles.value}>{item.sizeMin}m - {item.sizeMax}m</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.label}>Speed</Text>
                    <Text style={styles.value}>{item.speed} km/s</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.label}>Miss Distance</Text>
                    <Text style={styles.value}>{formatNumber(item.distance)} km</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.label}>Orbiting</Text>
                    <Text style={styles.value}>{item.orbitingBody}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    NASA reference ID: {item.id}
                  </Text>
                  <Text style={styles.cardFooterSaved}>
                    {item.saved ? "Saved" : "Tap the heart to save"}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </LinearGradient>
    </View>
  );
};

export default Asteroid;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#04070C",
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerWrap: {
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2.1,
    marginTop: 16,
  },
  mainTxt: {
    color: COLORS.textPrimary,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "700",
    marginTop: 8,
  },
  subTxt: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  controlsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  unifiedDateBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    height: 48,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: "hidden",
  },
  dateStepBtn: {
    width: 44,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dateStepDisabled: {
    opacity: 0.3,
  },
  dateDivider: {
    width: 1,
    height: "46%",
    backgroundColor: "rgba(255,255,255,0.16)",
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
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginHorizontal: 6,
  },
  countChip: {
    width: 82,
    marginLeft: 8,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  countChipLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  countChipValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 10,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  loaderBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  loaderTitle: {
    marginTop: 18,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  loaderSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,122,122,0.28)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 18,
    marginVertical: 8,
    borderColor: COLORS.border,
    borderWidth: 1,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameColumn: {
    flex: 1,
    paddingRight: 12,
  },
  asteroidName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  badgeStatusText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  hazardBadge: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,122,122,0.26)",
  },
  safeBadge: {
    backgroundColor: COLORS.safeSoft,
    borderWidth: 1,
    borderColor: "rgba(61,213,152,0.26)",
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonActive: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(255,122,122,0.26)",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  cardFooterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    flex: 1,
  },
  cardFooterSaved: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 12,
  },
});
