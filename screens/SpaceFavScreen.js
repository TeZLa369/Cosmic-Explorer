import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import ZoomableImageModal from '../components/ZoomableImageModal';
import RevealView from '../components/RevealView';
import BouncyPressable from '../components/BouncyPressable';

const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#D6E2F2",
  textMuted: "#A5B6D4",
  accent: "#8FD2FF",
  accentSoft: "rgba(143,210,255,0.18)",
  dangerSoft: "rgba(255,122,122,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  shadow: "rgba(0,0,0,0.34)",
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Unknown date";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "--";

  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
};

const EPICCard = ({ item, index, onPreview, onSave, onShare, onRemove }) => (
  <RevealView delay={120 + index * 70}>
  <View style={styles.cardContainer}>
    <View style={styles.topRow}>
      <View style={styles.nameColumn}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{String(item.mode || "natural").toUpperCase()}</Text>
        </View>
      </View>

      <Pressable style={styles.removeButton} onPress={() => onRemove(item.key)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.textPrimary} />
      </Pressable>
    </View>

    <BouncyPressable style={styles.imageCard} onPress={() => onPreview(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.imageStyle} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.86)"]} style={styles.imageShade} />
      <View style={styles.expandPill}>
        <Ionicons name="expand-outline" size={14} color={COLORS.textPrimary} />
      </View>
      <Text style={styles.overlayText}>{formatDate(item.selectedDate)}</Text>
    </BouncyPressable>

    <View style={styles.metricGrid}>
      <View style={styles.metricCard}>
        <Text style={styles.label}>Captured</Text>
        <Text style={styles.value}>{formatDateTime(item.date)} UTC</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.label}>Coordinates</Text>
        <Text style={styles.value}>{item.latitude}°, {item.longitude}°</Text>
      </View>
    </View>

    <View style={styles.captionCard}>
      <Text style={styles.captionLabel}>Observation</Text>
      <Text style={styles.captionText}>{item.caption}</Text>
    </View>

    <View style={styles.actionRow}>
      <BouncyPressable style={styles.actionButton} onPress={() => onSave(item.imageUrlPng || item.imageUrl)}>
        <Ionicons name="download-outline" size={19} color={COLORS.textPrimary} />
        <Text style={styles.actionText}>Download</Text>
      </BouncyPressable>
      <BouncyPressable style={styles.actionButton} onPress={() => onShare(item.imageUrlPng || item.imageUrl)}>
        <Ionicons name="share-outline" size={19} color={COLORS.textPrimary} />
        <Text style={styles.actionText}>Share</Text>
      </BouncyPressable>
    </View>
  </View>
  </RevealView>
);

const DONKICard = ({ item, index, onRemove }) => (
  <RevealView delay={120 + index * 70}>
  <View style={styles.cardContainer}>
    <View style={styles.topRow}>
      <View style={styles.nameColumn}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.eventType}</Text>
        </View>
      </View>

      <Pressable style={styles.removeButton} onPress={() => onRemove(item.storageKey)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.textPrimary} />
      </Pressable>
    </View>

    <View style={styles.metricGrid}>
      <View style={styles.metricCard}>
        <Text style={styles.label}>{item.primaryMetricLabel}</Text>
        <Text style={styles.value}>{item.primaryMetricValue}</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.label}>Event Time</Text>
        <Text style={styles.value}>{formatDateTime(item.time)} UTC</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.label}>{item.secondaryMetricLabel}</Text>
        <Text style={styles.value}>{item.secondaryMetricValue}</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.label}>{item.tertiaryMetricLabel}</Text>
        <Text style={styles.value}>{item.tertiaryMetricValue}</Text>
      </View>
    </View>

    <View style={styles.captionCard}>
      <Text style={styles.captionLabel}>Analyst Note</Text>
      <Text style={styles.captionText}>{item.description}</Text>
      <Text style={styles.instrumentText}>{item.instruments}</Text>
    </View>

    {item.link ? (
      <BouncyPressable style={styles.linkButton} onPress={() => Linking.openURL(item.link)}>
        <Text style={styles.linkButtonText}>Open NASA Event</Text>
        <Ionicons name="open-outline" size={16} color={COLORS.textPrimary} />
      </BouncyPressable>
    ) : null}
  </View>
  </RevealView>
);

const SpaceFavScreen = ({ route, navigation }) => {
  const { pageName } = route.params;
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState({ uri: "", title: "", subtitle: "" });

  const prefix = pageName === "EPIC" ? "epic_" : "donki_";

  const loadSavedItems = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const favoriteKeys = keys.filter((key) => key.startsWith(prefix));

      if (favoriteKeys.length === 0) {
        setSavedItems([]);
        return;
      }

      const values = await AsyncStorage.multiGet(favoriteKeys);
      const parsed = values
        .map(([, value]) => (value ? JSON.parse(value) : null))
        .filter(Boolean)
        .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));

      setSavedItems(parsed);
    } catch (error) {
      console.log("Unable to load saved items:", error);
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedItems();
    }, [pageName])
  );

  const stats = useMemo(() => {
    if (pageName === "EPIC") {
      const enhanced = savedItems.filter((item) => item.mode === "enhanced").length;
      return {
        title: "EPIC Favorites",
        subtitle: "Saved Earth imagery from NASA's DSCOVR archive.",
        primaryLabel: "Saved",
        primaryValue: savedItems.length,
        secondaryLabel: "Enhanced",
        secondaryValue: enhanced,
      };
    }

    return {
      title: "DONKI Favorites",
      subtitle: "Saved solar events and space weather alerts.",
      primaryLabel: "Saved",
      primaryValue: savedItems.length,
      secondaryLabel: "Event Types",
      secondaryValue: new Set(savedItems.map((item) => item.eventType)).size,
    };
  }, [pageName, savedItems]);

  const backgroundImage = pageName === "EPIC" && savedItems[0]?.imageUrl
    ? { uri: savedItems[0].imageUrl }
    : require("../assets/black.png");

  const saveImage = async (uri) => {
    if (!uri) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (status !== "granted") {
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}saved_space_${Date.now()}.png`;
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
    } catch (error) {
      console.log("Unable to save image:", error);
    }
  };

  const shareImage = async (uri) => {
    if (!uri) return;

    try {
      const fileUri = `${FileSystem.cacheDirectory}saved_share_${Date.now()}.png`;
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      await Sharing.shareAsync(downloaded.uri);
    } catch (error) {
      console.log("Unable to share image:", error);
    }
  };

  const removeItem = async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      setSavedItems((prev) => prev.filter((item) => (item.key || item.storageKey) !== key));
    } catch (error) {
      console.log("Unable to remove favorite:", error);
    }
  };

  const openPreview = (item) => {
    setPreviewData({
      uri: item.imageUrlPng || item.imageUrl,
      title: item.title,
      subtitle: `${formatDate(item.selectedDate)} • ${String(item.mode).toUpperCase()}`,
    });
    setPreviewVisible(true);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundImage} blurRadius={pageName === "EPIC" ? 26 : 0} style={styles.background}>
        <LinearGradient
          colors={["rgba(5,8,14,0.64)", "rgba(7,12,23,0.9)", "rgba(5,8,14,0.98)"]}
          style={[styles.overlay, StyleSheet.absoluteFillObject, { paddingTop: insets.top }]}
        >
          {/* Header */}
          <View style={styles.topHeader}>
            <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Text style={styles.headerEyebrow}>SAVED COLLECTION</Text>
              <Text style={styles.headerTitle}>{stats.title}</Text>
            </View>
          </View>
          <FlatList
            data={savedItems}
            keyExtractor={(item) => item.key || item.storageKey}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <RevealView delay={40}>
                <View style={styles.heroCard}>
                  <Text style={styles.heroEyebrow}>SAVED COLLECTION</Text>
                  <Text style={styles.heroTitle}>{stats.title}</Text>
                  <Text style={styles.heroSubtitle}>{stats.subtitle}</Text>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>{stats.primaryLabel}</Text>
                      <Text style={styles.summaryValue}>{stats.primaryValue}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>{stats.secondaryLabel}</Text>
                      <Text style={styles.summaryValue}>{stats.secondaryValue}</Text>
                    </View>
                  </View>
                </View>
              </RevealView>
            }
            ListEmptyComponent={
              loading ? (
                <View style={styles.emptyCard}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.emptyTitle}>Loading favorites</Text>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name={pageName === "EPIC" ? "earth-outline" : "flash-outline"} size={44} color={COLORS.accent} />
                  <Text style={styles.emptyTitle}>No saved {pageName === "EPIC" ? "EPIC images" : "DONKI events"}</Text>
                  <Text style={styles.emptyText}>
                    Go back and save some from the {pageName === "EPIC" ? "Earth imagery" : "space weather"} screen.
                  </Text>
                </View>
              )
            }
            renderItem={({ item, index }) => (
              pageName === "EPIC" ? (
                <EPICCard
                  item={item}
                  index={index}
                  onPreview={openPreview}
                  onSave={saveImage}
                  onShare={shareImage}
                  onRemove={removeItem}
                />
              ) : (
                <DONKICard item={item} index={index} onRemove={removeItem} />
              )
            )}
            showsVerticalScrollIndicator={false}
          />
        </LinearGradient>
      </ImageBackground>

      <ZoomableImageModal
        visible={previewVisible}
        imageUri={previewData.uri}
        title={previewData.title}
        subtitle={previewData.subtitle}
        onClose={() => setPreviewVisible(false)}
        onDownload={() => saveImage(previewData.uri)}
        onShare={() => shareImage(previewData.uri)}
      />
    </View>
  );
};

export default SpaceFavScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04070C",
  },
  background: {
    flex: 1,
  },
  overlay: {
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
    paddingBottom: 36,
    flexGrow: 1,
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
    marginBottom: 14,
  },
  heroEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2.1,
  },
  heroTitle: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  heroSubtitle: {
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
  emptyCard: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
  emptyText: {
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
  cardTitle: {
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
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
  imageCard: {
    marginTop: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  imageStyle: {
    width: "100%",
    height: 250,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  expandPill: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overlayText: {
    position: "absolute",
    left: 16,
    bottom: 16,
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 15,
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
  captionCard: {
    marginTop: 6,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  captionLabel: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  captionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  instrumentText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  actionText: {
    color: COLORS.textPrimary,
    marginLeft: 8,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  linkButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginRight: 8,
  },
});
