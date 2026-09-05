import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BouncyPressable from '../components/BouncyPressable';
import RevealView from '../components/RevealView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#64748B",
  accent: "#89D9FF",
  accentSoft: "rgba(137, 217, 255, 0.12)",
  surface: "rgba(255, 255, 255, 0.05)",
  surfaceElevated: "#0B1426",
  border: "rgba(255, 255, 255, 0.1)",
  borderActive: "#89D9FF",
  gold: "#FFB800",
  cyan: "#38BDF8",
  rose: "#FB7185",
  emerald: "#34D399",
  purple: "#C084FC",
  amber: "#FBBF24",
};

// 9 Tactical Space Exploration Modules
const MODULES = [
  {
    id: "SolarSystem",
    name: "Solar Odyssey",
    shortName: "Planets",
    sector: "DEEP SPACE • SECTOR 01",
    icon: "planet",
    color: COLORS.gold,
    tag: "3D REAL-TIME ORRERY",
    stats: "11 Worlds • 3D Models • Cosmic Audio",
    briefing:
      "Interactive 3D planetary observatory with genuine NASA photographic textures, real-time orbits, cosmic weight calculator, and space audio radio.",
    route: "SolarSystem",
  },
  {
    id: "ISSTracker",
    name: "ISS Live Tracker",
    shortName: "ISS Orbit",
    sector: "ORBITAL FLEET • SECTOR 02",
    icon: "navigate",
    color: COLORS.cyan,
    tag: "ORBITAL TELEMETRY",
    stats: "Altitude 418 km • Speed 27,600 km/h",
    briefing:
      "Real-time International Space Station orbital tracker with live map, active astronaut crew roster, astronaut bios, and overhead pass predictions.",
    route: "ISSTracker",
  },
  {
    id: "RocketLaunch",
    name: "Rocket Launches",
    shortName: "Rockets",
    sector: "FLIGHT SCHEDULE • SECTOR 03",
    icon: "rocket",
    color: COLORS.rose,
    tag: "T-MINUS COUNTDOWNS",
    stats: "Global Manifest • Launchpads • Live Feeds",
    briefing:
      "Worldwide flight launch manifests, booster telemetry, orbital payloads, spaceports, and live webcast streaming links.",
    route: "RocketLaunch",
  },
  {
    id: "SpaceNews",
    name: "Space News",
    shortName: "Dispatches",
    sector: "INTELLIGENCE • SECTOR 04",
    icon: "newspaper",
    color: COLORS.accent,
    tag: "LIVE WIRE",
    stats: "SNAPI v4 API • NASA • SpaceX • ESA",
    briefing:
      "Real-time breaking spaceflight news, astrophysics breakthroughs, agency mission dispatches, and commercial aerospace reports.",
    route: "SpaceNews",
  },
  {
    id: "Asteroid",
    name: "Asteroid Watch",
    shortName: "Asteroids",
    sector: "DEEP SPACE • SECTOR 05",
    icon: "radio",
    color: COLORS.purple,
    tag: "PROXIMITY RADAR",
    stats: "NASA NeoWs • Collision Hazard Monitor",
    briefing:
      "Near-Earth Object radar tracking closest approach distances, relative velocities, estimated diameters, and hazardous trajectory flags.",
    route: "Asteroid",
  },
  {
    id: "EPIC",
    name: "Earth Live",
    shortName: "Full Disk",
    sector: "TERRESTRIAL • SECTOR 06",
    icon: "earth",
    color: COLORS.cyan,
    tag: "DSCOVR SATELLITE",
    stats: "L1 Lagrange Point • 1,000,000 Miles",
    briefing:
      "NASA EPIC full-disk natural color imagery capturing the daily rotation of Planet Earth from deep space aboard the DSCOVR spacecraft.",
    route: "EPIC",
  },
  {
    id: "EONET",
    name: "Earth Events",
    shortName: "Hazards",
    sector: "TERRESTRIAL • SECTOR 07",
    icon: "leaf",
    color: COLORS.emerald,
    tag: "PLANETARY HAZARDS",
    stats: "Wildfires • Hurricanes • Volcanism",
    briefing:
      "Live global disaster monitoring map tracking active natural events, super typhoons, volcanic plumes, and wildfires across Earth.",
    route: "EONET",
  },
  {
    id: "DONKI",
    name: "Space Weather",
    shortName: "Solar",
    sector: "HELIOPHYSICS • SECTOR 08",
    icon: "flash",
    color: COLORS.amber,
    tag: "DONKI SENSOR NETWORK",
    stats: "Solar Flares • CMEs • Geomagnetic Storms",
    briefing:
      "NASA Space Weather Database Of Notifications, Knowledge, Information tracking coronal mass ejections, auroral activity, and solar radiation.",
    route: "DONKI",
  },
  {
    id: "Rover",
    name: "Mars Rover",
    shortName: "Rovers",
    sector: "SURFACE FLEET • SECTOR 09",
    icon: "planet-outline",
    color: COLORS.rose,
    tag: "RED PLANET ROVERS",
    stats: "Curiosity • Perseverance • Mastcam",
    briefing:
      "High-definition raw surface photographs beamed directly back to Earth from robotic explorers roving the desolate plains of Mars.",
    route: "Rover",
  },
];

export default function ExploreHub({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const activeModule = MODULES[selectedModuleIndex];

  const handleLaunch = (mod = activeModule) => {
    navigation.navigate(mod.route);
  };

  const handleSelect = (index) => {
    if (selectedModuleIndex === index) {
      handleLaunch(MODULES[index]);
    } else {
      setSelectedModuleIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02050D", "#050D1D", "#030814"]}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Futuristic HUD Status Header */}
          <View style={styles.hudBar}>
            <View style={styles.hudStatusLeft}>
              <View style={styles.pulseDot} />
              <Text style={styles.hudStatusText}>SYSTEMS ONLINE</Text>
              <Text style={styles.hudDivider}>|</Text>
              <Text style={styles.hudCoordText}>PORTAL DECK</Text>
            </View>

            <View style={styles.hudModuleCount}>
              <Text style={styles.hudCountText}>09 MODULES</Text>
            </View>
          </View>

          {/* Holographic Mission Viewport (Top Console) */}
          <RevealView delay={30}>
            <View style={styles.viewportFrame}>
              {/* Sci-Fi Corner Reticles */}
              <View style={[styles.reticle, styles.reticleTL]} />
              <View style={[styles.reticle, styles.reticleTR]} />
              <View style={[styles.reticle, styles.reticleBL]} />
              <View style={[styles.reticle, styles.reticleBR]} />

              <LinearGradient
                colors={[`${activeModule.color}22`, "rgba(8, 16, 32, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.viewportContent}
              >
                {/* Sector & Tag Header */}
                <View style={styles.viewportTopRow}>
                  <Text style={[styles.viewportSector, { color: activeModule.color }]}>
                    {activeModule.sector}
                  </Text>
                  <View style={[styles.viewportTagPill, { borderColor: `${activeModule.color}40` }]}>
                    <Text style={[styles.viewportTagText, { color: activeModule.color }]}>
                      {activeModule.tag}
                    </Text>
                  </View>
                </View>

                {/* Big Title & Icon */}
                <View style={styles.viewportTitleRow}>
                  <View style={styles.viewportTitleWrap}>
                    <Text style={styles.viewportTitle}>{activeModule.name}</Text>
                    <Text style={styles.viewportStats}>{activeModule.stats}</Text>
                  </View>
                  <View
                    style={[
                      styles.viewportIconSphere,
                      { backgroundColor: `${activeModule.color}18`, borderColor: `${activeModule.color}50` },
                    ]}
                  >
                    <Ionicons name={activeModule.icon} size={28} color={activeModule.color} />
                  </View>
                </View>

                {/* Briefing Summary */}
                <Text style={styles.viewportBriefing} numberOfLines={3}>
                  {activeModule.briefing}
                </Text>

                {/* Action Button */}
                <BouncyPressable
                  style={[styles.launchBtn, { backgroundColor: activeModule.color }]}
                  onPress={() => handleLaunch(activeModule)}
                >
                  <Text style={styles.launchBtnText}>LAUNCH MODULE</Text>
                  <Ionicons name="arrow-forward" size={16} color="#020617" />
                </BouncyPressable>
              </LinearGradient>
            </View>
          </RevealView>

          {/* Dock Selection Prompt */}
          <View style={styles.dockHeaderRow}>
            <Ionicons name="grid-outline" size={13} color={COLORS.accent} />
            <Text style={styles.dockHeaderText}>TAP TO PREVIEW • DOUBLE TAP TO ENTER</Text>
          </View>

          {/* 3x3 Tactile Space Module Grid (Fits Screen Perfectly) */}
          <View style={styles.gridContainer}>
            {MODULES.map((mod, index) => {
              const isSelected = selectedModuleIndex === index;
              return (
                <BouncyPressable
                  key={mod.id}
                  style={[
                    styles.gridTile,
                    isSelected && {
                      borderColor: mod.color,
                      backgroundColor: `${mod.color}18`,
                    },
                  ]}
                  onPress={() => handleSelect(index)}
                >
                  {/* Glowing Active Indicator */}
                  {isSelected && (
                    <View style={[styles.activeAccentDot, { backgroundColor: mod.color }]} />
                  )}

                  {/* Module Icon */}
                  <View
                    style={[
                      styles.tileIconCircle,
                      { backgroundColor: `${mod.color}18` },
                      isSelected && { backgroundColor: `${mod.color}35` },
                    ]}
                  >
                    <Ionicons
                      name={mod.icon}
                      size={22}
                      color={isSelected ? mod.color : COLORS.textSecondary}
                    />
                  </View>

                  {/* Short Label */}
                  <Text
                    style={[
                      styles.tileLabel,
                      isSelected && { color: COLORS.textPrimary, fontWeight: "800" },
                    ]}
                    numberOfLines={1}
                  >
                    {mod.shortName}
                  </Text>
                </BouncyPressable>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02050D",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    minHeight: SCREEN_HEIGHT - 100,
    justifyContent: "space-between",
  },

  // HUD Bar
  hudBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  hudStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  hudStatusText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hudDivider: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 10,
  },
  hudCoordText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  hudModuleCount: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  hudCountText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // Holographic Viewport Frame
  viewportFrame: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: 14,
  },
  viewportContent: {
    padding: 18,
    minHeight: 220,
    justifyContent: "space-between",
  },

  // Reticles
  reticle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: COLORS.accent,
    zIndex: 10,
  },
  reticleTL: {
    top: 6,
    left: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  reticleTR: {
    top: 6,
    right: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  reticleBL: {
    bottom: 6,
    left: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  reticleBR: {
    bottom: 6,
    right: 6,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  viewportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewportSector: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  viewportTagPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  viewportTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  viewportTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  viewportTitleWrap: {
    flex: 1,
  },
  viewportTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  viewportStats: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
    marginTop: 2,
  },
  viewportIconSphere: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  viewportBriefing: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: 12,
  },

  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  launchBtnText: {
    color: "#020617",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Dock Header
  dockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginVertical: 8,
  },
  dockHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // 3x3 Grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  gridTile: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: (SCREEN_WIDTH - 52) / 3 * 0.92,
    backgroundColor: "rgba(12, 20, 36, 0.75)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeAccentDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
