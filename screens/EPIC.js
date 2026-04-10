import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ZoomableImageModal from '../components/ZoomableImageModal';

const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#8FD2FF",
  accentSoft: "rgba(143,210,255,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  shadow: "rgba(0,0,0,0.34)",
};

const EMPTY_PREVIEW = {
  uri: "",
  title: "",
  subtitle: "",
};

const normalizeAvailableDates = (payload) => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (typeof item === "string") return item.slice(0, 10);
      if (item?.date) return String(item.date).slice(0, 10);
      if (item?.identifier) return String(item.identifier).slice(0, 10);
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => String(b).localeCompare(String(a)));
};

const buildEpicImageUrl = (mode, dateString, imageName, imageType = "jpg") => {
  const [year, month, day] = String(dateString).split("-");
  return `https://epic.gsfc.nasa.gov/archive/${mode}/${year}/${month}/${day}/${imageType}/${imageName}.${imageType}`;
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "Loading date...";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatCaptureTime = (dateValue) => {
  if (!dateValue) return "--";

  return new Date(dateValue.replace(" ", "T")).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
};

const findClosestDate = (targetDate, dates) => {
  if (!dates.length) return null;

  const targetKey = targetDate.toISOString().split("T")[0];
  const exact = dates.find((item) => item === targetKey);
  if (exact) return exact;

  const nearestPast = dates.find((item) => item <= targetKey);
  return nearestPast || dates[dates.length - 1];
};

const getEpicFavoriteKey = (frame, mode, selectedDate) => {
  if (!frame) return "";
  return `epic_${mode}_${selectedDate}_${frame.identifier}`;
};

const EPIC = () => {
  const [mode, setMode] = useState("natural");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [frames, setFrames] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshingFrames, setRefreshingFrames] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(EMPTY_PREVIEW);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadFrames = async (nextMode, nextDate, showLoader = false) => {
    if (!nextDate) return;

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshingFrames(true);
    }

    setFetchError("");

    try {
      const res = await fetch(`https://epic.gsfc.nasa.gov/api/${nextMode}/date/${nextDate}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        throw new Error("No imagery available for this date.");
      }

      const mappedFrames = data.map((item, index) => {
        const latitude = item?.centroid_coordinates?.lat ?? item?.coords?.centroid_coordinates?.lat;
        const longitude = item?.centroid_coordinates?.lon ?? item?.coords?.centroid_coordinates?.lon;

        return {
          id: `${nextMode}-${nextDate}-${item.identifier || item.image || index}`,
          title: item.caption || `EPIC ${nextMode === "natural" ? "natural color" : "enhanced color"} frame`,
          imageUrl: buildEpicImageUrl(nextMode, nextDate, item.image, "jpg"),
          imageUrlPng: buildEpicImageUrl(nextMode, nextDate, item.image, "png"),
          caption: item.caption || "No caption was published for this observation.",
          date: item.date,
          latitude: latitude !== undefined ? Number(latitude).toFixed(2) : "--",
          longitude: longitude !== undefined ? Number(longitude).toFixed(2) : "--",
          identifier: item.identifier || "--",
        };
      });

      setFrames(mappedFrames);
      setSelectedDate(nextDate);
      setPickerDate(new Date(nextDate));
      setActiveIndex(0);
    } catch (error) {
      console.log("EPIC frame fetch error:", error);
      setFrames([]);
      setFetchError("We couldn't load EPIC imagery for that date.");
    } finally {
      setLoading(false);
      setRefreshingFrames(false);
    }
  };

  const loadModeData = async (nextMode) => {
    setLoading(true);
    setFetchError("");

    try {
      const datesRes = await fetch(`https://epic.gsfc.nasa.gov/api/${nextMode}/available`);
      const datesPayload = await datesRes.json();

      if (!datesRes.ok) {
        throw new Error("Unable to load available EPIC dates.");
      }

      const dates = normalizeAvailableDates(datesPayload);

      if (dates.length === 0) {
        throw new Error("No EPIC dates found.");
      }

      setAvailableDates(dates);
      await loadFrames(nextMode, dates[0], true);
    } catch (error) {
      console.log("EPIC date fetch error:", error);
      setAvailableDates([]);
      setFrames([]);
      setFetchError("We couldn't connect to NASA's EPIC feed right now.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModeData(mode);
  }, [mode]);

  const activeFrame = frames[activeIndex] || null;
  const activeFavoriteKey = getEpicFavoriteKey(activeFrame, mode, selectedDate);
  const heroBackground = activeFrame?.imageUrl
    ? { uri: activeFrame.imageUrl }
    : require("../assets/black.png");

  const stats = useMemo(() => {
    if (!activeFrame) {
      return {
        frameCount: 0,
        latitude: "--",
        longitude: "--",
        captured: "--",
      };
    }

    return {
      frameCount: frames.length,
      latitude: `${activeFrame.latitude}°`,
      longitude: `${activeFrame.longitude}°`,
      captured: formatCaptureTime(activeFrame.date),
    };
  }, [activeFrame, frames.length]);

  useEffect(() => {
    const loadFavoriteState = async () => {
      if (!activeFavoriteKey) {
        setIsFavorite(false);
        return;
      }

      try {
        const saved = await AsyncStorage.getItem(activeFavoriteKey);
        setIsFavorite(saved !== null);
      } catch (error) {
        console.log("Unable to load EPIC favorite state:", error);
        setIsFavorite(false);
      }
    };

    loadFavoriteState();
  }, [activeFavoriteKey]);

  const changeDateByOffset = (offset) => {
    const currentIndex = availableDates.findIndex((item) => item === selectedDate);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= availableDates.length) return;

    loadFrames(mode, availableDates[nextIndex]);
  };

  const handlePickDate = (dateValue) => {
    const nearestDate = findClosestDate(dateValue, availableDates);
    setCalendarVisible(false);

    if (!nearestDate) return;

    setPickerDate(dateValue);
    if (nearestDate !== dateValue.toISOString().split("T")[0]) {
      Alert.alert("Nearest EPIC date", `Showing imagery from ${formatDisplayDate(nearestDate)} because that is the closest available date.`);
    }

    loadFrames(mode, nearestDate);
  };

  const openPreview = () => {
    if (!activeFrame?.imageUrl) return;

    setPreviewData({
      uri: activeFrame.imageUrlPng || activeFrame.imageUrl,
      title: activeFrame.title,
      subtitle: `${formatDisplayDate(selectedDate)} • ${stats.captured} UTC`,
    });
    setPreviewVisible(true);
  };

  const toggleFavorite = async () => {
    if (!activeFrame || !activeFavoriteKey) return;

    try {
      if (isFavorite) {
        await AsyncStorage.removeItem(activeFavoriteKey);
        setIsFavorite(false);
        return;
      }

      const payload = {
        favoriteType: "EPIC",
        key: activeFavoriteKey,
        id: activeFrame.id,
        mode,
        selectedDate,
        title: activeFrame.title,
        imageUrl: activeFrame.imageUrl,
        imageUrlPng: activeFrame.imageUrlPng,
        caption: activeFrame.caption,
        latitude: activeFrame.latitude,
        longitude: activeFrame.longitude,
        identifier: activeFrame.identifier,
        date: activeFrame.date,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(activeFavoriteKey, JSON.stringify(payload));
      setIsFavorite(true);
    } catch (error) {
      console.log("Unable to update EPIC favorite:", error);
    }
  };

  const downloadImage = async (uri) => {
    if (!uri) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (status !== "granted") {
        Alert.alert("Permission needed", "We need photo access to save EPIC imagery.");
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}epic_${Date.now()}.png`;
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      Alert.alert("Saved", "EPIC image saved to your gallery.");
    } catch (error) {
      console.log("EPIC download error:", error);
      Alert.alert("Save failed", "Unable to save this EPIC image right now.");
    }
  };

  const shareImage = async (uri) => {
    if (!uri) return;

    try {
      const fileUri = `${FileSystem.cacheDirectory}epic_share_${Date.now()}.png`;
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      await Sharing.shareAsync(downloaded.uri);
    } catch (error) {
      console.log("EPIC share error:", error);
    }
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <ImageBackground
        source={heroBackground}
        blurRadius={24}
        fadeDuration={700}
        style={styles.background}
      >
        <LinearGradient
          colors={["rgba(5,11,18,0.5)", "rgba(5,10,17,0.84)", "rgba(4,8,13,0.97)"]}
          style={[styles.overlay, StyleSheet.absoluteFillObject]}
        >
          <DateTimePickerModal
            isVisible={calendarVisible}
            mode="date"
            date={pickerDate}
            maximumDate={new Date()}
            minimumDate={new Date(2015, 5, 13)}
            themeVariant="dark"
            onConfirm={handlePickDate}
            onCancel={() => setCalendarVisible(false)}
          />

          {loading ? (
            <View style={styles.centerState}>
              <View style={styles.loaderOrb}>
                <ActivityIndicator size="large" color={COLORS.accent} />
              </View>
              <Text style={styles.centerTitle}>Loading EPIC Earth imagery</Text>
              <Text style={styles.centerSubtitle}>Pulling the latest full-disk view from DSCOVR.</Text>
            </View>
          ) : fetchError && frames.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="cloud-offline-outline" size={44} color={COLORS.accent} />
              <Text style={styles.centerTitle}>EPIC feed unavailable</Text>
              <Text style={styles.centerSubtitle}>{fetchError}</Text>
              <Pressable style={styles.retryButton} onPress={() => loadModeData(mode)}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.collectionBadge}>
                    <Ionicons name="earth-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.collectionBadgeText}>DSCOVR EPIC</Text>
                  </View>

                  <View style={styles.modeSwitch}>
                    <Pressable
                      style={[styles.modeChip, mode === "natural" && styles.modeChipActive]}
                      onPress={() => setMode("natural")}
                    >
                      <Text style={[styles.modeChipText, mode === "natural" && styles.modeChipTextActive]}>
                        Natural
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.modeChip, mode === "enhanced" && styles.modeChipActive]}
                      onPress={() => setMode("enhanced")}
                    >
                      <Text style={[styles.modeChipText, mode === "enhanced" && styles.modeChipTextActive]}>
                        Enhanced
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.mainTitle}>Earth from a million miles away.</Text>
                <Text style={styles.heroSubtitle}>
                  Browse the latest sunlit views from NASA's EPIC camera aboard DSCOVR.
                </Text>

                <View style={styles.controlRow}>
                  <Pressable style={styles.dateControl} onPress={() => setCalendarVisible(true)}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                    <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                  </Pressable>

                  <View style={styles.frameCountChip}>
                    <Text style={styles.frameCountLabel}>FRAMES</Text>
                    <Text style={styles.frameCountValue}>{stats.frameCount}</Text>
                  </View>
                </View>

                <View style={styles.datePager}>
                  <Pressable
                    style={[styles.pagerButton, selectedDate === availableDates[availableDates.length - 1] && styles.pagerButtonDisabled]}
                    onPress={() => changeDateByOffset(1)}
                    disabled={selectedDate === availableDates[availableDates.length - 1]}
                  >
                    <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
                    <Text style={styles.pagerText}>Older</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.pagerButton, selectedDate === availableDates[0] && styles.pagerButtonDisabled]}
                    onPress={() => changeDateByOffset(-1)}
                    disabled={selectedDate === availableDates[0]}
                  >
                    <Text style={styles.pagerText}>Newer</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.imageCard} onPress={openPreview}>
                {activeFrame?.imageUrl ? (
                  <>
                    <Image source={{ uri: activeFrame.imageUrl }} style={styles.heroImage} />
                    <LinearGradient
                      colors={["transparent", "rgba(6,10,16,0.18)", "rgba(6,10,16,0.88)"]}
                      style={styles.imageShade}
                    />

                    <View style={styles.imageHeaderPills}>
                      <View style={styles.overlayPill}>
                        <Text style={styles.overlayPillText}>{mode === "natural" ? "NATURAL COLOR" : "ENHANCED COLOR"}</Text>
                      </View>
                      <View style={styles.overlayPill}>
                        <Ionicons name="expand-outline" size={14} color={COLORS.textPrimary} />
                      </View>
                    </View>

                    <View style={styles.imageActions}>
                      <Pressable style={[styles.imageActionButton, isFavorite && styles.imageActionButtonActive]} onPress={(event) => {
                        event.stopPropagation();
                        toggleFavorite();
                      }}>
                        <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#FF9A92" : COLORS.textPrimary} />
                      </Pressable>
                      <Pressable style={styles.imageActionButton} onPress={(event) => {
                        event.stopPropagation();
                        downloadImage(activeFrame.imageUrlPng || activeFrame.imageUrl);
                      }}>
                        <Ionicons name="download-outline" size={20} color={COLORS.textPrimary} />
                      </Pressable>
                      <Pressable style={styles.imageActionButton} onPress={(event) => {
                        event.stopPropagation();
                        shareImage(activeFrame.imageUrlPng || activeFrame.imageUrl);
                      }}>
                        <Ionicons name="share-outline" size={20} color={COLORS.textPrimary} />
                      </Pressable>
                    </View>

                    <Text style={styles.imageTitle}>{activeFrame.title}</Text>
                  </>
                ) : null}
              </Pressable>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>CAPTURED</Text>
                  <Text style={styles.statValue}>{stats.captured} UTC</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>LATITUDE</Text>
                  <Text style={styles.statValue}>{stats.latitude}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>LONGITUDE</Text>
                  <Text style={styles.statValue}>{stats.longitude}</Text>
                </View>
              </View>

              <View style={styles.storyCard}>
                <Text style={styles.storyEyebrow}>OBSERVATION</Text>
                <Text style={styles.storyTitle}>{activeFrame?.title || "EPIC Earth View"}</Text>
                <Text style={styles.storyText}>
                  {activeFrame?.caption || "A full-disk Earth observation from NASA's Earth Polychromatic Imaging Camera."}
                </Text>

                <View style={styles.identifierRow}>
                  <View style={styles.identifierChip}>
                    <Text style={styles.identifierLabel}>IDENTIFIER</Text>
                    <Text style={styles.identifierValue}>{activeFrame?.identifier || "--"}</Text>
                  </View>
                  <View style={styles.identifierChip}>
                    <Text style={styles.identifierLabel}>COLLECTION</Text>
                    <Text style={styles.identifierValue}>{mode === "natural" ? "Natural" : "Enhanced"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.thumbnailSection}>
                <View style={styles.thumbnailHeader}>
                  <Text style={styles.thumbnailTitle}>Daily Frames</Text>
                  <Text style={styles.thumbnailSubtitle}>
                    {refreshingFrames ? "Refreshing..." : `${frames.length} views for ${formatDisplayDate(selectedDate)}`}
                  </Text>
                </View>

                <FlatList
                  horizontal
                  data={frames}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailList}
                  renderItem={({ item, index }) => (
                    <Pressable
                      style={[styles.thumbCard, activeIndex === index && styles.thumbCardActive]}
                      onPress={() => setActiveIndex(index)}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} />
                      <LinearGradient
                        colors={["transparent", "rgba(6,10,16,0.82)"]}
                        style={styles.thumbShade}
                      />
                      <Text style={styles.thumbTime}>{formatCaptureTime(item.date)} UTC</Text>
                    </Pressable>
                  )}
                />
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </ImageBackground>

      <ZoomableImageModal
        visible={previewVisible}
        imageUri={previewData.uri}
        title={previewData.title}
        subtitle={previewData.subtitle}
        onClose={() => setPreviewVisible(false)}
        onDownload={() => downloadImage(previewData.uri)}
        onShare={() => shareImage(previewData.uri)}
      />
    </SafeAreaView>
  );
};

export default EPIC;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04080D",
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  loaderOrb: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  centerTitle: {
    marginTop: 18,
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  centerSubtitle: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  collectionBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  modeChipActive: {
    backgroundColor: COLORS.accentSoft,
  },
  modeChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  modeChipTextActive: {
    color: COLORS.textPrimary,
  },
  mainTitle: {
    marginTop: 16,
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  heroSubtitle: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  controlRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  dateControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  frameCountChip: {
    marginLeft: 10,
    minWidth: 84,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  frameCountLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  frameCountValue: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 4,
  },
  datePager: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pagerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pagerButtonDisabled: {
    opacity: 0.45,
  },
  pagerText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginHorizontal: 4,
  },
  imageCard: {
    marginTop: 18,
    minHeight: 360,
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  heroImage: {
    width: "100%",
    height: 360,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  imageHeaderPills: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  overlayPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    marginRight: 8,
  },
  overlayPillText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
  },
  imageActions: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  imageActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageActionButtonActive: {
    backgroundColor: "rgba(255,154,146,0.18)",
    borderColor: "rgba(255,154,146,0.28)",
  },
  imageTitle: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    color: COLORS.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  statsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },
  storyCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  storyEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2.1,
  },
  storyTitle: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  storyText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  identifierRow: {
    marginTop: 16,
    flexDirection: "row",
  },
  identifierChip: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  identifierLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  identifierValue: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  thumbnailSection: {
    marginTop: 16,
  },
  thumbnailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  thumbnailTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  thumbnailSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  thumbnailList: {
    paddingTop: 14,
    paddingBottom: 6,
  },
  thumbCard: {
    width: 122,
    height: 150,
    marginRight: 12,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: COLORS.surface,
  },
  thumbCardActive: {
    borderColor: "rgba(143,210,255,0.55)",
    transform: [{ translateY: -2 }],
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbShade: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbTime: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
