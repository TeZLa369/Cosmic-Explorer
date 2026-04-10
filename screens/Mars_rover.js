import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, memo } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import ZoomableImageModal from '../components/ZoomableImageModal';

const { height: screenHeight } = Dimensions.get("window");

const COLORS = {
  textPrimary: "#FCF6F2",
  textSecondary: "#D2C5BD",
  textMuted: "#AA9B90",
  accent: "#F58C5E",
  accentSoft: "#784430",
  surface: "rgba(42, 24, 17, 0.82)",
  surfaceStrong: "rgba(26, 15, 11, 0.9)",
  border: "rgba(255,255,255,0.08)",
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Unknown date";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const RoverCard = memo(({ item, saveImage, shareImage, onPreview, screenHeight, index, totalCount }) => {
  const [isFav, setIsFav] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const hasLongCaption = (item.caption || "").length > 180;

  useEffect(() => {
    checkFav();
  }, [item.imageID]);

  const checkFav = async () => {
    try {
      const data = await AsyncStorage.getItem(item.imageID);
      setIsFav(data !== null);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFav = async () => {
    try {
      if (isFav) {
        await AsyncStorage.removeItem(item.imageID);
        setIsFav(false);
      } else {
        await AsyncStorage.setItem(item.imageID, "liked");
        setIsFav(true);
      }
    } catch (error) {
      console.error("Error toggling fav:", error);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.heroSection}>
        <View style={styles.topRow}>
          <View style={styles.missionBadge}>
            <Ionicons name="planet-outline" size={15} color={COLORS.accent} />
            <Text style={styles.missionBadgeText}>MARS 2020</Text>
          </View>
          <View style={styles.frameBadge}>
            <Text style={styles.frameBadgeText}>
              {String(index + 1).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
            </Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>RAW IMAGE FEED</Text>
        <Text style={styles.mainTxt}>Perseverance on Mars</Text>
        <Text style={styles.subTxt}>Live frames from NASA's rover as it explores Jezero Crater.</Text>

        <View style={styles.picMetaDataContainer}>
          <View style={styles.metaChip}>
            <Feather name="camera" size={14} color={COLORS.accent} />
            <Text style={styles.metaChipTxt}>{item.camera}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="navigate-circle-outline" size={16} color={COLORS.accent} />
            <Text style={styles.metaChipTxt}>Sol {item.sol}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.accent} />
            <Text style={styles.metaChipTxt}>{formatDate(item.date)}</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.imgContainer} onPress={() => onPreview(item)}>
        <Image
          style={[
            styles.imgStyle,
            { height: screenHeight > 760 ? 360 : 300 },
          ]}
          source={item.image}
          fadeDuration={500}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.7)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.imageShade}
        />
        <View style={styles.expandPill}>
          <Ionicons name="expand-outline" size={15} color={COLORS.textPrimary} />
        </View>
      </Pressable>

      <View style={styles.captionCard}>
        <Text style={styles.captionLabel}>Mission Note</Text>
        <Text style={styles.caption} numberOfLines={expandedCaption ? undefined : 4}>
          {item.caption}
        </Text>
        {hasLongCaption ? (
          <Pressable onPress={() => setExpandedCaption((prev) => !prev)}>
            <Text style={styles.readMoreText}>
              {expandedCaption ? "Read less" : "Read more"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.btnContainer}>
        <Pressable style={[styles.btnIconContainer, isFav && styles.btnIconContainerActive]} onPress={toggleFav}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "#FF7E72" : COLORS.textPrimary} />
          <Text style={[styles.btnTxt, isFav && styles.btnTxtActive]}>Favorite</Text>
        </Pressable>
        <Pressable style={styles.btnIconContainer} onPress={() => saveImage(item.image.uri)}>
          <Feather name='download' size={20} color={COLORS.textPrimary} />
          <Text style={styles.btnTxt}>Download</Text>
        </Pressable>
        <Pressable style={styles.btnIconContainer} onPress={() => shareImage(item.image.uri)}>
          <FontAwesome5 name='share' size={17} color={COLORS.textPrimary} />
          <Text style={styles.btnTxt}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
});

const Mars_rover = () => {
  const [apiData, setapiData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageNo, setpageNo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marsData, setmarsData] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState({ uri: "", title: "", subtitle: "" });

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });

  async function fetchData() {
    if (loading) return;
    setLoading(true);
    setFetchError("");

    try {
      const res = await fetch(`https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&page=${pageNo}&num=10`);
      const data = await res.json();

      setapiData(prev => [...prev, ...data.images]);
      setpageNo(prev => prev + 1);
    } catch (error) {
      console.log("Unable to fetch data: ", error);
      setFetchError("We couldn't load the rover feed right now.");
    } finally {
      setLoading(false);
    }
  }

  function mappedData() {
    try {
      let mapData = apiData
        .map(obj => {
          const imageUri = obj?.image_files?.medium || obj?.image_files?.full_res;

          if (!imageUri) return null;

          return {
            imageID: "rover" + obj?.imageid,
            sol: obj?.sol ?? "--",
            image: { uri: imageUri },
            camera: obj?.camera?.instrument || "Unknown camera",
            caption: obj?.caption?.trim() || "No caption was published for this frame.",
            date: obj?.date_taken_utc?.split("T")[0]
          };
        })
        .filter(Boolean);
      setmarsData(mapData);
    } catch (error) {
      console.log("Unable to map data: ", error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (apiData.length > 0) mappedData();
  }, [apiData]);

  async function saveImage(uri) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (status !== 'granted') {
        alert("Permission needed to save images");
        return;
      }

      const filename = `mars_${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);

      alert("Image has been saved!");
    } catch (e) {
      console.log(e);
    }
  }

  async function shareImage(url) {
    try {
      const filename = `share_${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log("Share error:", error);
    }
  }

  function openPreview(item) {
    if (!item?.image?.uri) return;

    setPreviewData({
      uri: item.image.uri,
      title: "Perseverance on Mars",
      subtitle: `${item.camera} • Sol ${item.sol} • ${formatDate(item.date)}`,
    });
    setPreviewVisible(true);
  }

  // Safety for background image
  const backgroundImage = marsData.length > 0 && marsData[activeIndex]
    ? marsData[activeIndex].image
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {marsData.length === 0 ? (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderBadge}>
            <Ionicons name="rocket-outline" size={24} color={COLORS.accent} />
          </View>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderTitle}>
            {fetchError ? "Rover feed unavailable" : "Syncing Perseverance"}
          </Text>
          <Text style={styles.loaderSubtitle}>
            {fetchError || "Pulling the latest raw images from the Mars 2020 mission."}
          </Text>
          {fetchError ? (
            <Pressable style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ImageBackground
          source={backgroundImage}
          blurRadius={25}
          style={styles.imgBackground}>
          <LinearGradient
            colors={["rgba(11,7,5,0.5)", "rgba(18,10,7,0.86)", "rgba(8,5,4,0.96)"]}
            style={[styles.overlay, StyleSheet.absoluteFillObject]}
          >
            <FlatList
              data={marsData}
              renderItem={({ item, index }) => (
                <RoverCard
                  item={item}
                  saveImage={saveImage}
                  shareImage={shareImage}
                  onPreview={openPreview}
                  screenHeight={screenHeight}
                  index={index}
                  totalCount={marsData.length}
                />
              )}
              onViewableItemsChanged={onViewRef.current}
              viewabilityConfig={viewConfig.current}
              keyExtractor={(item) => item.imageID}
              ListFooterComponent={loading && <ActivityIndicator size="large" color={COLORS.accent} style={{ padding: 20 }} />}
              onEndReached={fetchData}
              onEndReachedThreshold={0.7}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
            <View style={styles.progressDock}>
              <Text style={styles.progressLabel}>Now viewing</Text>
              <Text style={styles.progressValue}>
                {String(activeIndex + 1).padStart(2, "0")} of {String(marsData.length).padStart(2, "0")}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      )}

      <ZoomableImageModal
        visible={previewVisible}
        imageUri={previewData.uri}
        title={previewData.title}
        subtitle={previewData.subtitle}
        onClose={() => setPreviewVisible(false)}
        onDownload={() => saveImage(previewData.uri)}
        onShare={() => shareImage(previewData.uri)}
      />
    </SafeAreaView>
  );
};

export default Mars_rover;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#090504",
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: "rgba(245,140,94,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,140,94,0.28)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 96,
  },
  mainTxt: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    fontSize: 32,
    lineHeight: 38,
  },
  imgBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  picMetaDataContainer: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  metaChipTxt: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  cardContainer: {
    paddingBottom: 28,
  },
  heroSection: {
    marginTop: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  missionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  missionBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  frameBadge: {
    backgroundColor: "rgba(245,140,94,0.14)",
    borderColor: "rgba(245,140,94,0.28)",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  frameBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2.4,
    marginBottom: 8,
  },
  subTxt: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  imgContainer: {
    marginTop: 24,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceStrong,
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  imgStyle: {
    width: "100%",
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  expandPill: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  captionCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  captionLabel: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  caption: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  readMoreText: {
    marginTop: 12,
    color: COLORS.accent,
    fontWeight: "700",
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  btnIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    flex: 1,
    marginHorizontal: 4,
  },
  btnIconContainerActive: {
    backgroundColor: "rgba(245,140,94,0.16)",
    borderColor: "rgba(245,140,94,0.32)",
  },
  btnTxt: {
    color: COLORS.textPrimary,
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 13,
  },
  btnTxtActive: {
    color: "#FFD3C3",
  },
  progressDock: {
    position: "absolute",
    right: 20,
    bottom: 18,
    backgroundColor: "rgba(13,9,7,0.76)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  progressValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
});
