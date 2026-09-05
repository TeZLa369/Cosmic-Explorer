import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Animated,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { LinearGradient } from 'expo-linear-gradient';
import FullSkeleton from '../components/FullSkeleton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioBgm, pauseBgm } from "../components/audioBgm";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import ZoomableImageModal from '../components/ZoomableImageModal';
import NasaApiKeyModal from '../components/NasaApiKeyModal';
import { loadNasaApiKey, saveNasaApiKey } from '../components/nasaApiKeyStorage';

const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#8FC7FF",
  accentSoft: "rgba(143,199,255,0.2)",
  surface: "rgba(255,255,255,0.09)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  blue: "#8FC7FF",
  shadow: "rgba(0,0,0,0.35)",
};



const formatLongDate = (dateValue) => {
  if (!dateValue) return "Loading date...";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const HomeScreen = () => {
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [pickerDate, setPickerDate] = useState(today);
  const [readMorePressed, setReadMorePressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fav, setFav] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [nasaApiKey, setNasaApiKey] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(10)).current;

  const minDateKey = "1995-06-16";
  const minDate = new Date(1995, 5, 16);
  const isToday = selectedDate === todayKey;
  const isMinDate = selectedDate === minDateKey;

  const changeDateByDays = (days) => {
    const parts = selectedDate.split("-");
    const current = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    current.setDate(current.getDate() + days);

    if (current < minDate) {
      current.setTime(minDate.getTime());
    }
    if (current > today) {
      current.setTime(today.getTime());
    }

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const newKey = `${year}-${month}-${day}`;

    if (newKey !== selectedDate) {
      setPickerDate(current);
      setSelectedDate(newKey);
    }
  };

  const goToPrevDay = () => changeDateByDays(-1);
  const goToNextDay = () => changeDateByDays(1);

  function startFade() {
    setImageLoaded(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function resetImageAnimation() {
    setImageLoaded(false);
    fadeAnim.setValue(0);
    translateAnim.setValue(10);
  }

  async function load(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.log("Error while loading data: ", error);
      return null;
    }
  }

  async function saveData(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Can't add to fav: ", error);
    }
  }

  async function removeData(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Can't remove from fav: ", error);
    }
  }

  async function fetchData(date) {
    setLoading(true);
    setFetchError("");
    setReadMorePressed(false);
    setApiData(null);
    setFav(false);
    resetImageAnimation();

    const apiKey = nasaApiKey || "DEMO_KEY";

    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${date}`);
      const data = await res.json();

      if (!res.ok || data?.code || data?.msg) {
        throw new Error(data?.msg || "Unable to load APOD.");
      }

      setApiData(data);
      setFav((await load(String(date))) !== null);
    } catch (error) {
      console.log("Unable to fetch data: ", error);
      setFetchError("We couldn't load today's APOD right now.");
    } finally {
      setLoading(false);
    }
  }

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

  const explanationText = apiData?.explanation || "Loading story...";
  const isImageMedia = apiData?.media_type === "image";
  const isVideoMedia = apiData?.media_type === "video";
  const hasPlayableMedia = isImageMedia || isVideoMedia;
  const displayDate = formatLongDate(apiData?.date || pickerDate);
  const backgroundSource = isImageMedia && apiData?.url
    ? { uri: apiData.url }
    : require("../assets/noPng3.png");

  const summaryText = explanationText?.length > 240 && !readMorePressed
    ? `${explanationText.substring(0, 240)}...`
    : explanationText;

  async function toggleFavorite() {
    if (!apiData?.date) return;

    const nextFav = !fav;
    setFav(nextFav);

    if (nextFav) {
      await saveData(String(apiData.date), String(apiData.date));
    } else {
      await removeData(String(apiData.date));
    }
  }

  async function downloadImage() {
    if (!isImageMedia || !apiData?.url) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (status !== "granted") {
        alert("Permission needed to save images");
        return;
      }

      const filename = `apod_${apiData.date || Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloaded = await FileSystem.downloadAsync(apiData.url, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);

      alert("Image has been saved!");
    } catch (error) {
      console.log("Download error:", error);
      alert("Unable to save image right now.");
    }
  }

  async function shareImage() {
    if (!isImageMedia || !apiData?.url) return;

    try {
      const filename = `apod_share_${apiData.date || Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;
      const { uri } = await FileSystem.downloadAsync(apiData.url, fileUri);
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log("Share error:", error);
    }
  }

  async function handleSaveApiKey(value) {
    const normalized = await saveNasaApiKey(value);
    if (!normalized) {
      Alert.alert("Invalid key", "Please enter a valid NASA API key.");
      return;
    }

    setNasaApiKey(normalized);
    setApiKeyModalVisible(false);
  }



  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundSource}
        blurRadius={28}
        fadeDuration={700}
        style={styles.imgBackground}
      >
        <LinearGradient
          colors={["rgba(6,10,20,0.52)", "rgba(7,12,23,0.86)", "rgba(5,8,14,0.97)"]}
          style={[styles.overlay, StyleSheet.absoluteFillObject, { paddingTop: insets.top }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text style={styles.heroEyebrow}>ASTRONOMY PICTURE OF THE DAY</Text>
              <Text style={styles.mainTxt}>A daily window into the universe.</Text>
              <Text style={styles.heroSubTxt}>
                Explore NASA's featured image with its story, date, and a softer glass look.
              </Text>

              <View style={styles.controlRow}>
                <View style={styles.unifiedDateControl}>
                  <Pressable
                    style={[styles.dateStepBtn, isMinDate && styles.dateStepDisabled]}
                    onPress={goToPrevDay}
                    disabled={isMinDate}
                    accessibilityLabel="Previous day"
                  >
                    <Ionicons name="chevron-back" size={16} color={isMinDate ? COLORS.textMuted : COLORS.blue} />
                  </Pressable>

                  <View style={styles.dateDivider} />

                  <Pressable style={styles.dateMainBtn} onPress={() => setCalendarVisible(true)}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.blue} />
                    <Text style={styles.dateText}>{displayDate}</Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
                  </Pressable>

                  <View style={styles.dateDivider} />

                  <Pressable
                    style={[styles.dateStepBtn, isToday && styles.dateStepDisabled]}
                    onPress={goToNextDay}
                    disabled={isToday}
                    accessibilityLabel="Next day"
                  >
                    <Ionicons name="chevron-forward" size={16} color={isToday ? COLORS.textMuted : COLORS.blue} />
                  </Pressable>
                </View>

                <Pressable
                  style={styles.iconButton}
                  onPress={() => {
                    setIsBgmPlaying(!isBgmPlaying);
                    !isBgmPlaying ? audioBgm() : pauseBgm();
                  }}
                >
                  <Ionicons
                    name={isBgmPlaying ? "volume-high" : "volume-mute"}
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => setApiKeyModalVisible(true)}
                >
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </Pressable>
              </View>
            </View>

            <DateTimePickerModal
              isVisible={calendarVisible}
              mode='date'
              minimumDate={new Date(1995, 5, 16)}
              maximumDate={new Date()}
              themeVariant='dark'
              date={pickerDate}
              onCancel={() => setCalendarVisible(false)}
              onConfirm={(date) => {
                setPickerDate(date);
                setSelectedDate(date.toISOString().split("T")[0]);
                setCalendarVisible(false);
              }}
            />

            <Pressable
              style={styles.imageContainer}
              disabled={!isImageMedia}
              onPress={() => {
                if (isImageMedia && apiData?.url) {
                  setPreviewVisible(true);
                }
              }}
            >
              {loading && !imageLoaded && hasPlayableMedia ? (
                <FullSkeleton width="100%" imageHeight={360} />
              ) : null}

              {fetchError ? (
                <View style={styles.stateCard}>
                  <Ionicons name="cloud-offline-outline" size={30} color={COLORS.accent} />
                  <Text style={styles.stateTitle}>Picture unavailable</Text>
                  <Text style={styles.stateSubtitle}>{fetchError}</Text>
                  <Pressable
                    style={styles.retryButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      fetchData(selectedDate);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </Pressable>
                </View>
              ) : isImageMedia && apiData?.url ? (
                <Animated.View
                  style={[
                    styles.imageFill,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateAnim }],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: apiData.url }}
                    style={styles.heroImage}
                    onLoadEnd={startFade}
                    onError={() => {
                      setImageLoaded(true);
                      setFetchError("We couldn't load this image.");
                    }}
                  />

                  <LinearGradient
                    colors={["transparent", "rgba(3,7,16,0.12)", "rgba(3,7,16,0.88)"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.gradient}
                  />

                  <View style={styles.imageMetaRow}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>IMAGE</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{displayDate}</Text>
                    </View>
                  </View>

                  <View style={styles.imageActions}>
                    <Pressable
                      style={[styles.favoriteButton, fav && styles.favoriteButtonActive]}
                      onPress={(event) => {
                        event.stopPropagation();
                        toggleFavorite();
                      }}
                    >
                      <Ionicons
                        name={fav ? "heart" : "heart-outline"}
                        size={20}
                        color={fav ? "#FF8A80" : COLORS.textPrimary}
                      />
                    </Pressable>

                    <Pressable
                      style={styles.favoriteButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        downloadImage();
                      }}
                    >
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color={COLORS.textPrimary}
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.subtitle}>
                    {apiData?.title || "Loading title..."}
                  </Text>
                </Animated.View>
              ) : isVideoMedia && apiData?.url ? (
                <Animated.View
                  style={[
                    styles.imageFill,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateAnim }],
                    },
                  ]}
                >
                  <WebView
                    source={{ uri: apiData.url }}
                    style={styles.heroVideo}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsFullscreenVideo
                    onLoadEnd={startFade}
                    onError={() => {
                      setImageLoaded(true);
                      setFetchError("We couldn't load this video.");
                    }}
                  />

                  <View pointerEvents="none" style={styles.imageMetaRow}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>VIDEO</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{displayDate}</Text>
                    </View>
                  </View>

                  <View style={styles.imageActions}>
                    <Pressable
                      style={[styles.favoriteButton, fav && styles.favoriteButtonActive]}
                      onPress={toggleFavorite}
                    >
                      <Ionicons
                        name={fav ? "heart" : "heart-outline"}
                        size={20}
                        color={fav ? "#FF8A80" : COLORS.textPrimary}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.floatingDateNav}>
                    <Pressable
                      style={[styles.floatingArrowBtn, isMinDate && styles.floatingArrowDisabled]}
                      onPress={(event) => {
                        event.stopPropagation();
                        goToPrevDay();
                      }}
                      disabled={isMinDate}
                      accessibilityLabel="Previous day"
                    >
                      <Ionicons name="chevron-back" size={18} color={isMinDate ? COLORS.textMuted : COLORS.textPrimary} />
                    </Pressable>

                    <Pressable
                      style={[styles.floatingArrowBtn, isToday && styles.floatingArrowDisabled]}
                      onPress={(event) => {
                        event.stopPropagation();
                        goToNextDay();
                      }}
                      disabled={isToday}
                      accessibilityLabel="Next day"
                    >
                      <Ionicons name="chevron-forward" size={18} color={isToday ? COLORS.textMuted : COLORS.textPrimary} />
                    </Pressable>
                  </View>
                </Animated.View>
              ) : apiData ? (
                <View style={styles.stateCard}>
                  <Ionicons name="play-circle-outline" size={34} color={COLORS.blue} />
                  <Text style={styles.stateTitle}>{apiData.title}</Text>
                  <Text style={styles.stateSubtitle}>
                    This APOD entry uses an unsupported media type, so the story is shown below.
                  </Text>
                </View>
              ) : (
                <View style={styles.stateCard}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.stateTitle}>Loading today's view</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Text style={styles.infoLabel}>MEDIA</Text>
                <Text style={styles.infoValue}>{apiData?.media_type?.toUpperCase() || "..."}</Text>
              </View>
              <View style={styles.infoChip}>
                <Text style={styles.infoLabel}>SOURCE</Text>
                <Text style={styles.infoValue}>NASA</Text>
              </View>
              <View style={styles.infoChip}>
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoValue}>{displayDate}</Text>
              </View>
            </View>

            <View style={styles.storyCard}>
              <Text style={styles.storyEyebrow}>STORY</Text>
              <Text style={styles.storyTitle}>
                {apiData?.title || "Astronomy Picture of the Day"}
              </Text>
              <Text style={styles.explanation}>{summaryText}</Text>

              {explanationText?.length > 240 ? (
                <Pressable onPress={() => setReadMorePressed(!readMorePressed)}>
                  <Text style={styles.readMoreText}>
                    {readMorePressed ? "See less" : "Read more"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.credits}>NASA APOD archive</Text>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>

      <ZoomableImageModal
        visible={previewVisible}
        imageUri={apiData?.url || ""}
        title={apiData?.title || "Astronomy Picture of the Day"}
        subtitle={displayDate}
        onClose={() => setPreviewVisible(false)}
        onDownload={downloadImage}
        onShare={shareImage}
      />
      <NasaApiKeyModal
        visible={apiKeyModalVisible}
        currentValue={nasaApiKey}
        onClose={() => setApiKeyModalVisible(false)}
        onSave={handleSaveApiKey}
      />

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#05080E",
    flex: 1,
  },
  imgBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 42,
  },
  headerBlock: {
    alignItems: "center",
  },
  iconButton: {
    width: 42,
    height: 42,
    marginLeft: 10,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  heroEyebrow: {
    marginTop: 4,
    color: COLORS.blue,
    fontSize: 11,
    letterSpacing: 2.1,
  },
  mainTxt: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "700",
    textAlign: "center",
  },
  heroSubTxt: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  controlRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  unifiedDateControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    height: 48,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: "hidden",
  },
  dateStepBtn: {
    width: 42,
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
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dateMainBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingHorizontal: 6,
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 6,
  },
  imageContainer: {
    marginTop: 18,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    minHeight: 360,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroVideo: {
    flex: 1,
    backgroundColor: "#05080E",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "56%",
  },
  imageMetaRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  swipeHintPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: "auto",
  },
  swipeHintText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  metaPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    marginRight: 8,
  },
  metaPillText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  imageActions: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  favoriteButtonActive: {
    backgroundColor: "rgba(255,138,128,0.2)",
    borderColor: "rgba(255,210,210,0.2)",
  },
  subtitle: {
    position: "absolute",
    left: 16,
    right: 108,
    bottom: 18,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  floatingDateNav: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 16, 28, 0.78)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 3,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  floatingArrowDisabled: {
    opacity: 0.3,
  },
  stateCard: {
    minHeight: 360,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
  stateSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(143,199,255,0.28)",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  infoRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.3,
  },
  infoValue: {
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  storyCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  storyEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2,
  },
  storyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    marginTop: 8,
  },
  explanation: {
    marginTop: 12,
    color: COLORS.textSecondary,
    lineHeight: 23,
    fontSize: 15,
  },
  readMoreText: {
    color: COLORS.blue,
    marginTop: 12,
    fontWeight: "700",
  },

  credits: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});
