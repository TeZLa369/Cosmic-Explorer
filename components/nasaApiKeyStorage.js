import AsyncStorage from '@react-native-async-storage/async-storage';

export const NASA_API_KEY_STORAGE = "user_nasa_api_key";

export const loadNasaApiKey = async () => {
  try {
    return await AsyncStorage.getItem(NASA_API_KEY_STORAGE);
  } catch (error) {
    console.log("Unable to load NASA API key:", error);
    return null;
  }
};

export const saveNasaApiKey = async (keyValue) => {
  try {
    const normalized = String(keyValue || "").trim();
    if (!normalized) {
      return null;
    }

    await AsyncStorage.setItem(NASA_API_KEY_STORAGE, normalized);
    return normalized;
  } catch (error) {
    console.log("Unable to save NASA API key:", error);
    return null;
  }
};
