import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import ZoomableImageModal from '../components/ZoomableImageModal';
import NasaApiKeyModal from '../components/NasaApiKeyModal';
import { loadNasaApiKey, saveNasaApiKey } from '../components/nasaApiKeyStorage';

const { height: screenHeight } = Dimensions.get("window");

const COLORS = {
  textPrimary: "#FCF6F2",
  textSecondary: "#D6E2F2",
  textMuted: "#A5B6D4",
  accent: "#8FD2FF",
  accentSoft: "rgba(143,210,255,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  dangerSoft: "rgba(255,122,122,0.18)",
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Unknown date";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const RoverFavoriteCard = ({ item, onRemove, onSave, onShare, onPreview, index, totalCount }) => (
  <View style={[styles.cardContainer, { minHeight: screenHeight - 12 }]}>
    <View style={styles.heroSection}>
      <View style={styles.topRow}>
        <View style={styles.missionBadge}>
          <Ionicons name="planet-outline" size={15} color={COLORS.accent} />
          <Text style={styles.missionBadgeText}>ROVER FAVORITE</Text>
        </View>
        <View style={styles.frameBadge}>
          <Text style={styles.frameBadgeText}>
            {String(index + 1).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
          </Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>MARS 2020 RAW IMAGE</Text>
      <Text style={styles.mainTxt}>Perseverance on Mars</Text>
      <Text style={styles.subTxt}>Saved from the rover feed for quick access later.</Text>

      <View style={styles.metaWrap}>
        <View style={styles.metaChip}>
          <Feather name="camera" size={14} color={COLORS.accent} />
          <Text style={styles.metaChipText}>{item.camera}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="navigate-circle-outline" size={16} color={COLORS.accent} />
          <Text style={styles.metaChipText}>Sol {item.sol}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={15} color={COLORS.accent} />
          <Text style={styles.metaChipText}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </View>

    <Pressable style={styles.imageCard} onPress={() => onPreview(item.image.uri, "Perseverance on Mars", formatDate(item.date))}>
      <Image source={item.image} style={[styles.imageStyle, { height: screenHeight > 760 ? 360 : 300 }]} />
      <LinearGradient colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.86)"]} style={styles.imageShade} />
      <View style={styles.expandPill}>
        <Ionicons name="expand-outline" size={14} color={COLORS.textPrimary} />
      </View>
    </Pressable>

    <View style={styles.captionCard}>
      <Text style={styles.captionLabel}>Mission Note</Text>
      <Text style={styles.captionText} numberOfLines={4}>{item.caption}</Text>
    </View>

    <View style={styles.actionRow}>
      <Pressable style={[styles.actionButton, styles.actionDanger]} onPress={() => onRemove(item.imageID)}>
        <Ionicons name="heart-dislike-outline" size={20} color={COLORS.textPrimary} />
        <Text style={styles.actionText}>Remove</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={() => onSave(item.image.uri)}>
        <Feather name="download" size={20} color={COLORS.textPrimary} />
        <Text style={styles.actionText}>Download</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={() => onShare(item.image.uri)}>
        <FontAwesome5 name="share" size={17} color={COLORS.textPrimary} />
        <Text style={styles.actionText}>Share</Text>
      </Pressable>
    </View>
  </View>
);

const APODFavoriteCard = ({ item, onRemove, onSave, onShare, onPreview, index, totalCount }) => {
  const isImage = item.media_type === "image";
  const imageSource = isImage && item.url ? { uri: item.url } : require("../assets/noPng3.png");

  return (
    <View style={styles.apodCardContainer}>
      <View style={styles.heroSection}>
        <View style={[styles.topRow, styles.topRowAlignEnd]}>
          <View style={styles.frameBadge}>
            <Text style={styles.frameBadgeText}>
              {String(index + 1).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
            </Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>ASTRONOMY PICTURE OF THE DAY</Text>
        <Text style={styles.apodTitle}>{item.title || "Astronomy Picture of the Day"}</Text>
        <Text style={styles.subTxt}>Saved from the APOD archive for revisiting later.</Text>

        <View style={styles.metaWrap}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.accent} />
            <Text style={styles.metaChipText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name={isImage ? "image-outline" : "play-circle-outline"} size={15} color={COLORS.accent} />
            <Text style={styles.metaChipText}>{item.media_type?.toUpperCase() || "MEDIA"}</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.imageCard}
        onPress={() => {
          if (isImage) {
            onPreview(item.url, item.title || "Astronomy Picture of the Day", formatDate(item.date));
          }
        }}
      >
        <Image source={imageSource} style={[styles.imageStyle, { height: screenHeight > 760 ? 360 : 300 }]} />
        <LinearGradient colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.86)"]} style={styles.imageShade} />
        <Text style={styles.overlayTitle}>{item.title}</Text>
        {isImage ? (
          <View style={styles.expandPill}>
            <Ionicons name="expand-outline" size={14} color={COLORS.textPrimary} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.captionCard}>
        <View style={styles.captionHeader}>
          <Text style={styles.captionLabel}>Story</Text>
          <Text style={styles.captionHint}>Full description</Text>
        </View>
        <Text style={styles.captionText}>{item.explanation}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionButton, styles.actionDanger]} onPress={() => onRemove(item.date)}>
          <Ionicons name="heart-dislike-outline" size={20} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>Remove</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, !isImage && styles.actionDisabled]} onPress={() => isImage && onSave(item.url)}>
          <Feather name="download" size={20} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>Download</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => onShare(item.url)}>
          <FontAwesome5 name="share" size={17} color={COLORS.textPrimary} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
};

const CommonFavScreen = ({ route, navigation }) => {
  const { pageName } = route.params;
  const [roverData, setRoverData] = useState([]);
  const [apodData, setApodData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState({ uri: "", title: "", subtitle: "" });
  const [nasaApiKey, setNasaApiKey] = useState("");
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 70 });

  const getAllKeys = async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.log("Unable to load keys:", error);
      return [];
    }
  };

  const loadRoverFavorites = async () => {
    const keys = await getAllKeys();
    const roverKeys = keys.filter((key) => key.startsWith("rover"));

    if (roverKeys.length === 0) {
      setRoverData([]);
      return;
    }

    try {
      const pages = [0, 1, 2, 3, 4];
      const responses = await Promise.all(
        pages.map((page) =>
          fetch(`https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&page=${page}&num=25`)
            .then((res) => res.json())
            .catch(() => ({ images: [] }))
        )
      );

      const seen = new Set();
      const allImages = responses.flatMap((result) => result.images || []).filter((item) => {
        const key = String(item.imageid);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const mapped = allImages
        .filter((obj) => roverKeys.includes("rover" + obj.imageid))
        .map((obj) => ({
          imageID: "rover" + obj.imageid,
          sol: obj.sol ?? "--",
          image: { uri: obj.image_files?.medium || obj.image_files?.full_res },
          camera: obj.camera?.instrument || "Unknown camera",
          caption: obj.caption?.trim() || "No caption was published for this frame.",
          date: obj.date_taken_utc?.split("T")[0],
        }))
        .filter((item) => item.image?.uri);

      setRoverData(mapped);
    } catch (error) {
      console.log("Fetch rover error:", error);
      setRoverData([]);
    }
  };

  const loadAPODFavorites = async () => {
    const keys = await getAllKeys();
    const dateKeys = keys.filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key));

    if (dateKeys.length === 0) {
      setApodData([]);
      return;
    }

    const apiKey = nasaApiKey || "DEMO_KEY";

    try {
      const responses = await Promise.all(
        dateKeys.map(async (dateKey) => {
          try {
            const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${dateKey}`);
            const data = await res.json();
            return !res.ok || data?.code ? null : data;
          } catch {
            return null;
          }
        })
      );

      const cleaned = responses.filter(Boolean).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      setApodData(cleaned);
    } catch (error) {
      console.log("APOD fav load error:", error);
      setApodData([]);
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

  const loadFavorites = async () => {
    setLoading(true);
    setActiveIndex(0);

    if (pageName === "ROVER") {
      await loadRoverFavorites();
    } else {
      await loadAPODFavorites();
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!apiKeyLoading) {
      loadFavorites();
    }
  }, [pageName, nasaApiKey, apiKeyLoading]);

  const handleSaveApiKey = async (value) => {
    const normalized = await saveNasaApiKey(value);
    if (!normalized) {
      Alert.alert("Invalid key", "Please enter a valid NASA API key.");
      return;
    }

    setNasaApiKey(normalized);
    setApiKeyModalVisible(false);
  };

  const removeFavorite = async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      if (pageName === "ROVER") {
        setRoverData((prev) => prev.filter((item) => item.imageID !== key));
      } else {
        setApodData((prev) => prev.filter((item) => item.date !== key));
      }
    } catch (error) {
      console.log("Unable to remove favorite:", error);
    }
  };

  const saveImage = async (uri) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (status !== "granted") {
        alert("Permission needed to save images");
        return;
      }

      const filename = `favorite_${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      alert("Image has been saved!");
    } catch (error) {
      console.log("Save error:", error);
    }
  };

  const shareImage = async (uri) => {
    try {
      const fileUri = FileSystem.cacheDirectory + `shared_${Date.now()}.jpg`;
      const { uri: localUri } = await FileSystem.downloadAsync(uri, fileUri);
      await Sharing.shareAsync(localUri);
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const openPreview = (uri, title, subtitle) => {
    if (!uri) return;
    setPreviewData({ uri, title, subtitle });
    setPreviewVisible(true);
  };

  const activeData = pageName === "ROVER" ? roverData : apodData;
  const bgImg = activeData[pageName === "ROVER" ? activeIndex : 0]
    ? (pageName === "ROVER"
      ? activeData[activeIndex].image
      : (activeData[0].media_type === "image" ? { uri: activeData[0].url } : require("../assets/noPng3.png")))
    : require("../assets/black.png");

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#04070C", "#0A1323", "#050913"]} style={[styles.centerView, { paddingTop: insets.top }]}>
          <View style={styles.topHeaderLoading}>
            <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.centerTitle}>Loading favorites</Text>
          <Text style={styles.centerSubtitle}>Bringing your saved collection into view.</Text>
        </LinearGradient>
      </View>
    );
  }

  if (activeData.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#04070C", "#0A1323", "#050913"]} style={[styles.centerView, { paddingTop: insets.top }]}>
          <View style={styles.topHeaderLoading}>
            <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>
          <Ionicons name="heart-dislike-outline" size={52} color={COLORS.accent} />
          <Text style={styles.centerTitle}>No favorites found</Text>
          <Text style={styles.centerSubtitle}>Go back and add some to this collection.</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={bgImg} blurRadius={36} style={styles.imgBackground}>
        <LinearGradient
          colors={["rgba(6,10,20,0.64)", "rgba(7,12,23,0.9)", "rgba(5,8,14,0.98)"]}
          style={[styles.overlay, StyleSheet.absoluteFillObject, { paddingTop: insets.top }]}
        >
          {/* Header */}
          <View style={styles.topHeader}>
            <Pressable style={styles.backButton} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </Pressable>
            <View style={styles.titleWrap}>
              <Text style={styles.headerEyebrow}>SAVED COLLECTION</Text>
              <Text style={styles.headerTitle}>{pageName === "ROVER" ? "Rover Favorites" : "APOD Favorites"}</Text>
            </View>
          </View>
          {pageName === "ROVER" ? (
            <FlatList
              data={activeData}
              renderItem={({ item, index }) => (
                <RoverFavoriteCard
                  item={item}
                  index={index}
                  totalCount={activeData.length}
                  onRemove={removeFavorite}
                  onSave={saveImage}
                  onShare={shareImage}
                  onPreview={openPreview}
                />
              )}
              pagingEnabled
              snapToInterval={screenHeight}
              decelerationRate="fast"
              onViewableItemsChanged={({ viewableItems }) => {
                if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                  setActiveIndex(viewableItems[0].index);
                }
              }}
              viewabilityConfig={viewConfig.current}
              keyExtractor={(item) => item.imageID}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={activeData}
              renderItem={({ item, index }) => (
                <APODFavoriteCard
                  item={item}
                  index={index}
                  totalCount={activeData.length}
                  onRemove={removeFavorite}
                  onSave={saveImage}
                  onShare={shareImage}
                  onPreview={openPreview}
                />
              )}
              keyExtractor={(item) => item.date}
              contentContainerStyle={styles.apodListContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {pageName === "ROVER" ? (
            <View style={styles.progressDock}>
              <Text style={styles.progressLabel}>Saved Rover Frames</Text>
              <Text style={styles.progressValue}>
                {String(activeIndex + 1).padStart(2, "0")} of {String(activeData.length).padStart(2, "0")}
              </Text>
            </View>
          ) : null}
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
      <NasaApiKeyModal
        visible={apiKeyModalVisible}
        currentValue={nasaApiKey}
        onClose={() => setApiKeyModalVisible(false)}
        onSave={handleSaveApiKey}
      />
    </View>
  );
};

export default CommonFavScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#000", flex: 1 },
  topHeaderLoading: {
    position: "absolute",
    top: 14,
    left: 16,
    zIndex: 10,
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
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  centerTitle: { marginTop: 16, color: COLORS.textPrimary, fontSize: 26, fontWeight: "700" },
  centerSubtitle: { marginTop: 8, color: COLORS.textMuted, fontSize: 14, textAlign: "center", lineHeight: 21 },
  keyActionButton: {
    marginTop: 18,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  keyActionButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  imgBackground: { flex: 1 },
  overlay: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingBottom: 54 },
  apodListContent: { paddingHorizontal: 14, paddingTop: 22, paddingBottom: 40 },
  cardContainer: { justifyContent: "space-between", paddingTop: 28, paddingBottom: 26 },
  apodCardContainer: { paddingTop: 22, paddingBottom: 12 },
  heroSection: { marginTop: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  topRowAlignEnd: { justifyContent: "flex-end" },
  missionBadge: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  missionBadgeText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "700", letterSpacing: 1.2, marginLeft: 6 },
  frameBadge: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.border, borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  frameBadgeText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  eyebrow: { color: COLORS.accent, fontSize: 11, letterSpacing: 2.4, marginBottom: 8 },
  mainTxt: { fontWeight: "700", color: COLORS.textPrimary, fontSize: 32, lineHeight: 38 },
  apodTitle: { fontWeight: "700", color: COLORS.textPrimary, fontSize: 28, lineHeight: 34 },
  subTxt: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  metaWrap: { marginTop: 18, flexDirection: "row", flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, marginRight: 10, marginBottom: 10 },
  metaChipText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 8 },
  imageCard: { marginTop: 24, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, shadowColor: "#000000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 16 },
  imageStyle: { width: "100%" },
  imageShade: { ...StyleSheet.absoluteFillObject },
  expandPill: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTitle: { position: "absolute", left: 16, right: 16, bottom: 18, color: COLORS.textPrimary, fontSize: 22, lineHeight: 28, fontWeight: "700" },
  captionCard: { marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 16 },
  captionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  captionLabel: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.8, marginBottom: 8 },
  captionHint: { color: COLORS.textMuted, fontSize: 12 },
  captionText: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 24 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 18, marginHorizontal: 4 },
  actionDanger: { backgroundColor: COLORS.dangerSoft, borderColor: "rgba(255,122,122,0.26)" },
  actionDisabled: { opacity: 0.55 },
  actionText: { color: COLORS.textPrimary, marginLeft: 8, fontWeight: "600", fontSize: 13 },
  progressDock: { position: "absolute", right: 20, bottom: 18, backgroundColor: "rgba(12,16,28,0.76)", borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  progressLabel: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.2 },
  progressValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 2 },
});
