import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#D6E0F2",
  textMuted: "#A7B6D2",
  accent: "#89D9FF",
  accentSoft: "rgba(137,217,255,0.18)",
  danger: "#FF7A7A",
  dangerSoft: "rgba(255,122,122,0.18)",
  safeSoft: "rgba(61,213,152,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  shadow: "rgba(0,0,0,0.34)",
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const AsteroidsFav = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const asteroidKeys = keys.filter(key => key.startsWith("nro"));

      if (asteroidKeys.length === 0) {
        setSavedData([]);
        return;
      }

      const result = await AsyncStorage.multiGet(asteroidKeys);
      const parsedData = result
        .map(([, value]) => (value ? JSON.parse(value) : undefined))
        .filter(Boolean);

      setSavedData(parsedData);
    } catch (e) {
      console.error("Error loading saved items", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavedData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedData();
  }, []);

  const removeFavorite = async (id) => {
    try {
      await AsyncStorage.removeItem("nro" + id);
      setSavedData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing item", error);
    }
  };

  const stats = useMemo(() => {
    if (savedData.length === 0) {
      return { total: 0, hazardous: 0 };
    }

    return {
      total: savedData.length,
      hazardous: savedData.filter(item => item.threat).length,
    };
  }, [savedData]);

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#04070C", "#0A1323", "#050913"]} style={[styles.gradientBg, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerEyebrow}>SAVED WATCHLIST</Text>
            <Text style={styles.headerTitle}>Asteroid Favorites</Text>
          </View>
        </View>
        <FlatList
          data={savedData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <View style={styles.heroCard}>
                <Text style={styles.heroEyebrow}>SAVED WATCHLIST</Text>
                <Text style={styles.mainTxt}>Asteroid Favorites</Text>
                <Text style={styles.subTxt}>
                  Revisit the near-Earth objects you marked to keep an eye on.
                </Text>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Saved</Text>
                    <Text style={styles.summaryValue}>{stats.total}</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Hazardous</Text>
                    <Text style={styles.summaryValue}>{stats.hazardous}</Text>
                  </View>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            loading && !refreshing ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.emptyHint}>Loading your watchlist...</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="planet-outline" size={52} color={COLORS.accent} />
                <Text style={styles.emptyTitle}>No saved asteroids</Text>
                <Text style={styles.emptyHint}>Go back and add some to your watchlist.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.topRow}>
                <View style={styles.nameColumn}>
                  <Text style={styles.asteroidName} numberOfLines={2}>
                    {item.asteroidName.replace(/[()]/g, '')}
                  </Text>
                  <View style={[styles.badge, item.threat ? styles.hazardBadge : styles.safeBadge]}>
                    <Text style={styles.badgeText}>
                      {item.threat ? "Potentially hazardous" : "Low threat"}
                    </Text>
                  </View>
                </View>

                <Pressable style={styles.removeButton} onPress={() => removeFavorite(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.textPrimary} />
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
                  <Text style={styles.label}>Saved Status</Text>
                  <Text style={styles.value}>Watching</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>NASA reference ID: {item.id}</Text>
                <Text style={styles.cardFooterAction}>Remove</Text>
              </View>
            </View>
          )}
        />
      </LinearGradient>
    </View>
  );
};

export default AsteroidsFav;

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
    flexGrow: 1,
  },
  headerWrap: {
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 28,
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
  },
  mainTxt: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  subTxt: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  summaryRow: {
    marginTop: 18,
    flexDirection: "row",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyCard: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyHint: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
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
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  hazardBadge: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: "rgba(255,122,122,0.26)",
  },
  safeBadge: {
    backgroundColor: COLORS.safeSoft,
    borderColor: "rgba(61,213,152,0.26)",
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,122,122,0.26)",
    justifyContent: "center",
    alignItems: "center",
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
  cardFooterAction: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 12,
  },
});
