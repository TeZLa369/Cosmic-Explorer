import { useCallback, useState } from 'react';
import { Dimensions, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RevealView from '../components/RevealView';
import BouncyPressable from '../components/BouncyPressable';
import NasaApiKeyModal from '../components/NasaApiKeyModal';
import { loadNasaApiKey, saveNasaApiKey } from '../components/nasaApiKeyStorage';

const { width } = Dimensions.get("window");

const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#D6E2F2",
  textMuted: "#A5B6D4",
  accent: "#8FD2FF",
  accentSoft: "rgba(143,210,255,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
  shadow: "rgba(0,0,0,0.34)",
};

const CARD_DATA = [
  {
    key: "APOD",
    title: "APOD",
    subtitle: "Saved astronomy stories and images",
    route: "CommonFavScreen",
    params: { pageName: "APOD" },
    image: require("../assets/favAPOD.jpg"),
    icon: "sparkles-outline",
  },
  {
    key: "ROVER",
    title: "Rover",
    subtitle: "Mars frames you bookmarked",
    route: "CommonFavScreen",
    params: { pageName: "ROVER" },
    image: require("../assets/rover2.webp"),
    icon: "planet-outline",
  },
  {
    key: "ASTEROID",
    title: "Asteroid",
    subtitle: "Your saved near-Earth watchlist",
    route: "AsteroidFav",
    image: require("../assets/asteroidfav.jpg"),
    icon: "radio-outline",
  },
  {
    key: "EPIC",
    title: "EPIC",
    subtitle: "Earth imagery you saved from DSCOVR",
    route: "SpaceFavScreen",
    params: { pageName: "EPIC" },
    image: require("../assets/headerImg.jpg"),
    icon: "earth-outline",
  },
  {
    key: "DONKI",
    title: "DONKI",
    subtitle: "Saved space weather events and alerts",
    route: "SpaceFavScreen",
    params: { pageName: "DONKI" },
    image: require("../assets/black.png"),
    icon: "flash-outline",
  },
];

const Favs = ({ navigation }) => {
  const [apiData, setApiData] = useState(null);
  const [counts, setCounts] = useState({ APOD: 0, ROVER: 0, ASTEROID: 0, EPIC: 0, DONKI: 0 });
  const [nasaApiKey, setNasaApiKey] = useState("");
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const fetchHeaderImage = async (keyValue) => {
    if (!keyValue) {
      setApiData(null);
      return;
    }

    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${keyValue}`);
      const data = await res.json();
      if (data?.url) {
        setApiData(data);
      }
    } catch (error) {
      console.log("Unable to fetch data: ", error);
    }
  };

  const loadCounts = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setCounts({
        APOD: keys.filter((key) => key.length === 10).length,
        ROVER: keys.filter((key) => key.startsWith("rover")).length,
        ASTEROID: keys.filter((key) => key.startsWith("nro")).length,
        EPIC: keys.filter((key) => key.startsWith("epic_")).length,
        DONKI: keys.filter((key) => key.startsWith("donki_")).length,
      });
    } catch (error) {
      console.log("Unable to load favorite counts: ", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const hydrate = async () => {
        const savedKey = await loadNasaApiKey();
        setNasaApiKey(savedKey || "");
        fetchHeaderImage(savedKey);
        loadCounts();
      };

      hydrate();
    }, [])
  );

  const handleSaveApiKey = async (value) => {
    const normalized = await saveNasaApiKey(value);
    if (!normalized) return;

    setNasaApiKey(normalized);
    setApiKeyModalVisible(false);
    fetchHeaderImage(normalized);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={apiData?.url ? { uri: apiData.url } : require("../assets/black.png")}
        resizeMode='cover'
        blurRadius={24}
        style={styles.headerBgImg}
      >
        <LinearGradient
          colors={["rgba(5,8,14,0.62)", "rgba(7,12,23,0.9)", "rgba(5,8,14,0.98)"]}
          style={[styles.headerSubContainer, StyleSheet.absoluteFillObject, { paddingTop: insets.top }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <RevealView delay={40}>
              <View style={styles.heroBlock}>
                <Text style={styles.heroEyebrow}>SAVED COLLECTION</Text>
                <Text style={styles.headertxt}>Favorites</Text>
                <Text style={styles.heroSubTxt}>
                  Your saved APOD entries, rover frames, Earth imagery, asteroid watchlist, and space weather events all in one place.
                </Text>

                <Pressable style={styles.keyButton} onPress={() => setApiKeyModalVisible(true)}>
                  <Ionicons name="key-outline" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.keyButtonText}>{nasaApiKey ? "Edit NASA API Key" : "Add NASA API Key"}</Text>
                </Pressable>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryGrid}>
                    {Object.entries(counts).map(([key, value]) => (
                      <View key={key} style={styles.summaryPill}>
                        <Text style={styles.summaryLabel}>{key}</Text>
                        <Text style={styles.summaryValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </RevealView>

            <View style={styles.cardsWrap}>
              {CARD_DATA.map((card, index) => (
                <RevealView key={card.key} delay={130 + index * 85}>
                  <BouncyPressable
                    onPress={() => navigation.navigate(card.route, card.params)}
                    style={styles.cardPressable}
                  >
                    <View style={styles.card}>
                      <Image source={card.image} style={styles.cardImg} />
                      <LinearGradient
                        colors={["rgba(4,8,15,0.1)", "rgba(4,8,15,0.42)", "rgba(4,8,15,0.94)"]}
                        style={styles.cardShade}
                      />

                      <View style={styles.cardTopRow}>
                        <View style={styles.cardIconWrap}>
                          <Ionicons name={card.icon} size={18} color={COLORS.textPrimary} />
                        </View>
                        <View style={styles.countPill}>
                          <Text style={styles.countPillText}>{counts[card.key]}</Text>
                        </View>
                      </View>

                      <View style={styles.cardContent}>
                        <Text style={styles.cardTxt}>{card.title}</Text>
                        <Text style={styles.cardSubTxt}>{card.subtitle}</Text>
                      </View>

                      <View style={styles.cardFooter}>
                        <Text style={styles.cardFooterTxt}>Open collection</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.textPrimary} />
                      </View>
                    </View>
                  </BouncyPressable>
                </RevealView>
              ))}
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
      <NasaApiKeyModal
        visible={apiKeyModalVisible}
        currentValue={nasaApiKey}
        onClose={() => setApiKeyModalVisible(false)}
        onSave={handleSaveApiKey}
      />
    </View>
  );
};

export default Favs;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    flex: 1,
  },
  headerBgImg: {
    flex: 1,
    width,
  },
  headerSubContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 36,
  },
  heroBlock: {
    alignItems: "center",
  },
  heroEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2.2,
  },
  headertxt: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "700",
  },
  heroSubTxt: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 330,
  },
  keyButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  keyButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginLeft: 8,
  },
  summaryCard: {
    marginTop: 18,
    width: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryPill: {
    width: "31%",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 10,
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
    marginTop: 6,
  },
  cardsWrap: {
    marginTop: 22,
  },
  cardPressable: {
    marginBottom: 14,
  },
  card: {
    height: 188,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardImg: {
    width: "100%",
    height: "100%",
  },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTopRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  countPill: {
    minWidth: 42,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  countPillText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  cardContent: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 52,
  },
  cardTxt: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 26,
  },
  cardSubTxt: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: "82%",
  },
  cardFooter: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFooterTxt: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
});
