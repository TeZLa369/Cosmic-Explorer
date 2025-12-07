import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';

const { height: screen_height } = Dimensions.get("window");

// Extracted Component to isolate "Favorite" state per item
const RoverCard = memo(({ item, saveImage, shareImage, screenHeight }) => {
  const [isFav, setIsFav] = useState(false);

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

  const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });

  return (
    <View style={[styles.cardContainer, { height: screenHeight }]}>
      <Text style={styles.mainTxt}>Perseverance on Mars</Text>

      <View style={styles.picMetaDataContainer}>
        <Text style={styles.metaTxt}>{item.camera} • </Text>
        <Text style={styles.metaTxt}>Sol {item.sol} • </Text>
        <Text style={styles.metaTxt}>{formattedDate}</Text>
      </View>

      <View style={styles.imgContainer}>
        <Image
          style={styles.imgStyle}
          source={item.image}
          fadeDuration={1000}
        />
        <Text style={styles.caption}>{item.caption}</Text>
      </View>

      <View style={styles.btnContainer}>
        <TouchableOpacity onPress={toggleFav}>
          <View style={styles.btnIconContainer}>
            <Ionicons name='heart' size={20} color={!isFav ? "#D7D7D7FF" : "#DF0000FF"} />
            <Text style={styles.btnTxt}>Favorite</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => saveImage(item.image.uri)}>
          <View style={styles.btnIconContainer}>
            <Feather name='download' size={20} color={"#D7D7D7FF"} />
            <Text style={styles.btnTxt}>Download</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => shareImage(item.image.uri)}>
          <View style={styles.btnIconContainer}>
            <FontAwesome5 name='share' size={19} color={"#D7D7D7FF"} />
            <Text style={styles.btnTxt}>Share</Text>
          </View>
        </TouchableOpacity>
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

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });

  async function fetchData() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&page=${pageNo}&num=10`);
      const data = await res.json();

      setapiData(prev => [...prev, ...data.images]);
      setpageNo(prev => prev + 1);
    } catch (error) {
      console.log("Unable to fetch data: ", error);
    } finally {
      setLoading(false);
    }
  }

  function mappedData() {
    try {
      let mapData = apiData.map(obj => ({
        imageID: "rover" + obj?.imageid,
        sol: obj?.sol,
        image: { uri: obj?.image_files?.medium },
        camera: obj?.camera?.instrument,
        caption: obj?.caption,
        date: (obj?.date_taken_utc).split("T")[0]
      }));
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
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert("Permission needed to save images");
        return;
      }

      // Use unique name to prevent overwrite
      const filename = `mars_${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      const asset = await MediaLibrary.createAssetAsync(downloaded.uri);
      await MediaLibrary.createAlbumAsync("Download", asset, false);

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

  // Safety for background image
  const backgroundImage = marsData.length > 0 && marsData[activeIndex]
    ? marsData[activeIndex].image
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {marsData.length === 0 ? (
        <View style={{ justifyContent: "center", flex: 1, gap: 8 }}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.metaTxt}>Loading universe...</Text>
        </View>
      ) : (
        <ImageBackground
          source={backgroundImage}
          blurRadius={25}
          style={styles.imgBackground}>
          <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
            <FlatList
              data={marsData}
              renderItem={({ item }) => (
                <RoverCard
                  item={item}
                  saveImage={saveImage}
                  shareImage={shareImage}
                  screenHeight={screen_height}
                />
              )}
              pagingEnabled
              snapToInterval={screen_height}
              decelerationRate="fast"
              onViewableItemsChanged={onViewRef.current}
              viewabilityConfig={viewConfig.current}
              keyExtractor={(item) => item.imageID}
              ListFooterComponent={loading && <ActivityIndicator size="large" color="white" style={{ padding: 20 }} />}
              onEndReached={fetchData}
              onEndReachedThreshold={0.5}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </ImageBackground>
      )}
    </SafeAreaView>
  );
};

export default Mars_rover;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    flex: 1,
  },
  mainTxt: {
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 24,
    marginTop: "14%",
  },
  imgBackground: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  picMetaDataContainer: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "center"
  },
  metaTxt: {
    fontSize: 14,
    textAlign: "center",
    color: "#E8E6E6FF"
  },
  cardContainer: {
    paddingBottom: 20,
  },
  imgContainer: {
    marginTop: 20,
    gap: 12,
  },
  imgStyle: {
    width: "100%",
    height: 300,
    borderRadius: 20,
  },
  caption: {
    color: "#E8E6E6FF",
    textAlign: "justify",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: "6%",
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  btnIconContainer: {
    flexDirection: "row",
    backgroundColor: "#0000003B",
    padding: 8,
    gap: 8,
    borderRadius: 12
  },
  btnTxt: {
    color: "#D7D7D7FF"
  },
});