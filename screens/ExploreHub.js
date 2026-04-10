import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RevealView from '../components/RevealView';
import BouncyPressable from '../components/BouncyPressable';

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

const EXPLORE_ITEMS = [
  {
    id: "EPIC",
    title: "Earth Live",
    subtitle: "Browse NASA EPIC full-disk Earth imagery from DSCOVR.",
    icon: "earth-outline",
    colors: ["rgba(112,201,255,0.24)", "rgba(143,210,255,0.08)"],
    route: "EPIC",
  },
  {
    id: "DONKI",
    title: "Space Weather",
    subtitle: "Track flares, CMEs, storms, and particle activity with DONKI.",
    icon: "flash-outline",
    colors: ["rgba(255,176,103,0.22)", "rgba(255,255,255,0.06)"],
    route: "DONKI",
  },
  {
    id: "Asteroid",
    title: "Asteroid Watch",
    subtitle: "Scan near-Earth objects, distances, and hazard flags.",
    icon: "radio-outline",
    colors: ["rgba(164,146,255,0.18)", "rgba(255,255,255,0.06)"],
    route: "Asteroid",
  },
];

const ExploreHub = ({ navigation }) => {
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <LinearGradient
        colors={["#04070C", "#0A1323", "#050913"]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <RevealView delay={40}>
            <View style={styles.heroCard}>
              <View style={styles.badge}>
                <Ionicons name="compass-outline" size={16} color={COLORS.accent} />
                <Text style={styles.badgeText}>EXPLORE</Text>
              </View>

              <Text style={styles.heroTitle}>Choose a space data feed.</Text>
              <Text style={styles.heroSubtitle}>
                Earth imagery, space weather, and asteroid tracking now live in one cleaner section.
              </Text>
            </View>
          </RevealView>

          {EXPLORE_ITEMS.map((item, index) => (
            <RevealView key={item.id} delay={140 + index * 90}>
              <BouncyPressable
                style={styles.cardWrap}
                onPress={() => navigation.navigate(item.route)}
              >
                <LinearGradient colors={item.colors} style={styles.cardGlow}>
                  <View style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.iconWrap}>
                        <Ionicons name={item.icon} size={24} color={COLORS.textPrimary} />
                      </View>
                      <Ionicons name="arrow-forward-outline" size={20} color={COLORS.textMuted} />
                    </View>

                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </LinearGradient>
              </BouncyPressable>
            </RevealView>
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default ExploreHub;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04070C",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36,
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
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  heroTitle: {
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
  cardWrap: {
    marginTop: 16,
    borderRadius: 28,
    overflow: "hidden",
  },
  cardGlow: {
    padding: 1,
    borderRadius: 28,
  },
  card: {
    backgroundColor: "rgba(11,17,28,0.94)",
    borderRadius: 27,
    padding: 18,
    minHeight: 154,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    marginTop: 18,
    color: COLORS.textPrimary,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "700",
  },
  cardSubtitle: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
