import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  textPrimary: "#F9F6F2",
  textSecondary: "#DCE3F4",
  textMuted: "#A8B4D0",
  accent: "#8FD2FF",
  accentSoft: "rgba(143,210,255,0.18)",
  surface: "rgba(255,255,255,0.08)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
};

const NasaApiKeyModal = ({ visible, currentValue, onClose, onSave }) => {
  const [value, setValue] = useState(currentValue || "");

  useEffect(() => {
    if (visible) {
      setValue(currentValue || "");
    }
  }, [visible, currentValue]);

  const handleOpenNasaSite = async () => {
    try {
      await Linking.openURL("https://api.nasa.gov/");
    } catch (error) {
      console.log("Unable to open NASA website:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={["rgba(9,14,26,0.98)", "rgba(5,8,14,0.99)"]}
          style={styles.card}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.eyebrow}>NASA ACCESS</Text>
              <Text style={styles.title}>NASA API Key Setup</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.instructionsCard}>
              <Text style={styles.sectionHeading}>How to get and use your key:</Text>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Tap the button below to visit <Text style={styles.highlightText}>api.nasa.gov</Text>.
                </Text>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Fill in your First Name, Last Name, and Email on the NASA form, then tap <Text style={styles.highlightText}>Generate Key</Text>.
                </Text>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Copy your key, paste it in the field below, and tap <Text style={styles.highlightText}>Save Key</Text>.
                </Text>
              </View>

              <Pressable style={styles.urlButton} onPress={handleOpenNasaSite}>
                <Ionicons name="open-outline" size={18} color={COLORS.accent} />
                <Text style={styles.urlButtonText}>Open api.nasa.gov</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>YOUR NASA API KEY</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="Paste your NASA API key here"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => onSave(value)}>
              <Text style={styles.primaryButtonText}>Save Key</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default NasaApiKeyModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    maxHeight: "85%",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 12,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
  },
  title: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  scrollArea: {
    marginVertical: 4,
  },
  instructionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  stepBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  highlightText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  urlButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  urlButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
    marginRight: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});
