import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={["rgba(5,8,14,0.96)", "rgba(5,8,14,0.99)"]}
          style={styles.card}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>NASA ACCESS</Text>
              <Text style={styles.title}>Add your NASA API key</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            This key is stored locally on the device and used across APOD, asteroid, and saved APOD views.
          </Text>

          <View style={styles.inputWrap}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Paste your NASA API key"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => onSave(value)}>
              <Text style={styles.primaryButtonText}>Save key</Text>
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
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2,
  },
  title: {
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  inputWrap: {
    marginTop: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  input: {
    height: 52,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 14,
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
