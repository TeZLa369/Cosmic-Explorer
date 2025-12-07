import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Animated,
  TouchableOpacity,
  ImageBackground
} from 'react-native';
import Constants from "expo-constants";
const NASA_KEY = Constants.expoConfig.extra?.nasaApiKey;
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { LinearGradient } from 'expo-linear-gradient';
import FullSkeleton from '../components/FullSkeleton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioBgm, pauseBgm } from "../components/audioBgm";


const HomeScreen = () => {
  const [calender, setcalender] = useState(false);
  const [selectedDate, setSelectedDate] = useState();
  const [monthDate, setmonthDate] = useState();
  const [readMorePressed, setReadMorePressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fav, setfav] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(true);
  const [firstTime, setfirstTime] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(6)).current;

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]


  function startFade() {
    setImageLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    Animated.timing(translateAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }

  async function fetchData(date) {
    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&date=${date}`);
      const data = await res.json();

      setApiData(data);

      if (await load(String(date)) === null) {
        setfav(false)
        // console.log("false")
      } else {
        setfav(true)
        // console.log("true")
      }
      setfirstTime(false);
    } catch (error) {
      console.log("Unable to fetch data: ", error)
    }
  }

  // useEffect(() => {
  //   if (firstTime) {
  //     setTimeout(() => {
  //       fetchData(formattedDate);
  //     }, 2000);
  //   }
  //   else {
  //     selectedDate ? fetchData(selectedDate) :
  //       fetchData(formattedDate);
  //   }
  // }, [])


  useEffect(() => {
    selectedDate ? fetchData(selectedDate) :
      fetchData(formattedDate);
  }, [])



  let expTxt;
  { apiData ? expTxt = apiData?.explanation : expTxt = "Loading..." }

  function apiDate() {
    if (!apiData || !apiData.date) return "Loading date...";
    const date = new Date(apiData?.date);


    const newDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    })
    return newDate;

  }

  function dateTxt() {
    const formatted = monthDate?.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
    return formatted;
  }

  // ! FAV Data
  const favData = {
    date: dateTxt() ? dateTxt() : apiDate(),
    title: apiData?.title,
    url: apiData?.url,
    explanation: expTxt,
  }

  async function saveData(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      console.log("Data is saved");
    } catch (error) {
      console.error("Can't add to fav: ", error);
    }
  }
  async function removeData(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log("Data is removed");
    } catch (error) {

      console.error("Can't remove from fav: ", error);
    }
  }


  async function load(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data;
    } catch (error) {
      console.log("Error while loading data: ", error);
    }
  }



  return (
    <SafeAreaView edges={["left", "right",]} style={styles.container}>


      <ImageBackground
        source={{ uri: apiData?.url }}

        blurRadius={25}
        fadeDuration={1000}
        style={styles.imgBackground}>

        <View style={[{
          backgroundColor: 'rgba(0,0,0,0.4)', alignItems: "center"
        }, StyleSheet.absoluteFillObject]} >

          {/* //! TITLE */}
          <Text style={[styles.mainTxt, { fontSize: 18 }]}>Astronomy Picture of the Day</Text>

          <View style={styles.dateMuteContainer}>
            {/* //! DATE */}
            <TouchableOpacity style={styles.dateStyle} onPress={() => {
              setcalender(true)
            }}>
              <Text style={[{ fontSize: 16, color: "#FFFFFF" }]}> 🗓️ {dateTxt() ? dateTxt() : apiDate()} ▼</Text>

              <DateTimePickerModal
                isVisible={calender}
                mode='date'
                minimumDate={new Date(1995, 5, 16)}
                maximumDate={new Date()}
                themeVariant='dark'
                date={monthDate}
                onCancel={() => { setcalender(false); }}
                onConfirm={(date) => {
                  const formattedDate = date.toISOString().split("T")[0];
                  setSelectedDate(formattedDate);
                  setmonthDate(date)
                  fetchData(formattedDate);
                  setcalender(false);
                }}
              />
            </TouchableOpacity>

            {/*//! MUTE BTN  */}
            <TouchableOpacity onPress={() => {
              setIsBgmPlaying(!isBgmPlaying);
              !isBgmPlaying ? audioBgm() : pauseBgm();

            }}>
              <Ionicons style={styles.muteBtn} name={isBgmPlaying ? "volume-high" : 'volume-mute'} size={20} color={"#ffffff"} />
            </TouchableOpacity>


          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {!imageLoaded && <FullSkeleton width="100%" imageHeight={250} />}

              <Animated.View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  opacity: fadeAnim,
                  transform: [{ translateY: translateAnim }],
                }}
              >
                {/* //! IMAGE */}

                <Image
                  source={apiData?.url ? { uri: apiData ? apiData.url : "" } : require("../assets/noPng3.png")}

                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                  onLoadEnd={() => startFade()}
                />

                {/* //! HEART */}
                <View style={styles.favoriteBtn}>
                  <TouchableOpacity onPress={() => {
                    setfav(!fav);
                    !fav ?
                      saveData(String(apiData.date), String(apiData.date)) : removeData(String(apiData.date));
                  }}>
                    {fav ?
                      (<Ionicons name='heart' size={24} color={"#DF0000FF"} />) :
                      (<Ionicons name='heart' color={"#D0D0D0FF"} size={24} />)
                    }

                  </TouchableOpacity>
                </View>


                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.gradient}
                />

                <Animated.Text
                  style={[
                    styles.subtitle,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateAnim }],
                    }
                  ]}
                >
                  {apiData ? apiData.title : "Loading Title..."}
                </Animated.Text>
              </Animated.View>
            </View>


            {/* //! EXPLANATION */}
            <View style={{
              marginTop: 14
            }}>
              {readMorePressed ? (<><Text style={styles.explanation} >{expTxt}</Text>
                <Pressable onPress={() => { setReadMorePressed(false) }}>
                  <Text style={[styles.explanation, { color: "#1E90FF", marginTop: 4, fontWeight: 500 }]}>See less</Text>
                </Pressable>
              </>
              ) : (
                <>{
                  expTxt?.length > 220 ? (
                    <><Text style={styles.explanation}>
                      {expTxt.substring(0, 220)}...
                    </Text><Pressable onPress={() => { setReadMorePressed(true); }}>
                        <Text style={{ color: "#1E90FF", marginTop: 4, fontWeight: 500 }}>Read more</Text>
                      </Pressable>
                    </>
                  ) : (<Text style={styles.explanation}>{expTxt}</Text>)
                }</>)}
            </View>
            <Text style={styles.credits}>© NASA APOD</Text>
          </ScrollView>   </View> </ImageBackground >
    </SafeAreaView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  dateMuteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly"
  },
  muteBtn: {
    backgroundColor: "#11111117",
    elevation: 8,
    padding: 8,
    borderRadius: 20
  },
  imgBackground: {
    resizeMode: "cover",
    flex: 1,
  },
  container: {
    backgroundColor: "#000000",
    flex: 1,
    paddingHorizontal: 0
  },
  dateStyle: {
    margin: 8,
    backgroundColor: "#11111117",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    width: "50%",
    elevation: 8
  },
  // mainTxt: {
  //   textAlign: "left",
  //   marginTop: "12%",
  //   fontSize: 20,
  //   color: "#dadada",
  //   paddingHorizontal: 12,
  // },
  mainTxt: {
    marginTop: "15%",
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 24,
  },
  imageContainer: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    height: 250,
    borderRadius: 12,
    shadowColor: "#ffff",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",

  },
  imageStyle: {
    resizeMode: "cover"
  },

  favoriteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 24
  },

  subtitle: {
    position: "absolute",
    bottom: 12,
    left: 12,
    fontSize: 18,
    color: "white",
    fontWeight: "600",
    textShadowColor: 'rgba(0,0,0,0.8)'
  },
  explanation: {
    marginTop: 12,
    color: "#C8C6C6FF",
    lineHeight: 22,
    textAlign: "justify",
  },
  credits: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10
  }

})