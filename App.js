import { StatusBar } from "expo-status-bar";
import TabNavigator from "./navigation/TabNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";
import { audioBgm, unloadBgm } from "./components/audioBgm";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { GestureHandlerRootView } from "react-native-gesture-handler";





export default function App() {

  async function requestPermission() {
    const { status } = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
    if (status !== "granted") {
      alert("Permission denied!");
    }
  }
  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    audioBgm();

    return () => {
      unloadBgm();
    };

  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <TabNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}


