import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  textPrimary: "#F9F6F2",
  textMuted: "#A8B4D0",
  surface: "rgba(255,255,255,0.1)",
  surfaceSoft: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.16)",
};

const MIN_SCALE = 1;
const MAX_SCALE = 3;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getDistance = (touchA, touchB) => {
  const dx = touchA.pageX - touchB.pageX;
  const dy = touchA.pageY - touchB.pageY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getCenter = (touchA, touchB) => ({
  x: (touchA.pageX + touchB.pageX) / 2,
  y: (touchA.pageY + touchB.pageY) / 2,
});

const ZoomableImageModal = ({
  visible,
  imageUri,
  title,
  subtitle,
  onClose,
  onDownload,
  onShare,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [zoomLevel, setZoomLevel] = useState(1);

  const lastScaleRef = useRef(1);
  const lastOffsetRef = useRef({ x: 0, y: 0 });
  const lastTouchCountRef = useRef(0);
  const gestureRef = useRef({
    mode: null,
    startPoint: null,
    initialDistance: 0,
    initialScale: 1,
    initialCenter: null,
    initialOffset: { x: 0, y: 0 },
  });

  const applyTransform = (nextScale, nextX, nextY) => {
    scaleAnim.setValue(nextScale);
    translateX.setValue(nextX);
    translateY.setValue(nextY);
    setZoomLevel(nextScale);
    lastScaleRef.current = nextScale;
    lastOffsetRef.current = { x: nextX, y: nextY };
  };

  const resetZoom = (animated = true) => {
    gestureRef.current = {
      mode: null,
      startPoint: null,
      initialDistance: 0,
      initialScale: 1,
      initialCenter: null,
      initialOffset: { x: 0, y: 0 },
    };
    lastTouchCountRef.current = 0;
    setZoomLevel(1);
    lastScaleRef.current = 1;
    lastOffsetRef.current = { x: 0, y: 0 };

    if (animated) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const beginPan = (touch) => {
    gestureRef.current = {
      mode: "pan",
      startPoint: { x: touch.pageX, y: touch.pageY },
      initialDistance: 0,
      initialScale: lastScaleRef.current,
      initialCenter: null,
      initialOffset: { ...lastOffsetRef.current },
    };
  };

  const beginPinch = (touches) => {
    const [touchA, touchB] = touches;
    gestureRef.current = {
      mode: "pinch",
      startPoint: null,
      initialDistance: getDistance(touchA, touchB) || 1,
      initialScale: lastScaleRef.current,
      initialCenter: getCenter(touchA, touchB),
      initialOffset: { ...lastOffsetRef.current },
    };
  };

  const handleTouchMove = (event) => {
    const touches = event.nativeEvent.touches || [];

    if (!touches.length) {
      return;
    }

    if (touches.length !== lastTouchCountRef.current) {
      if (touches.length >= 2) {
        beginPinch(touches);
      } else if (touches.length === 1 && lastScaleRef.current > 1) {
        beginPan(touches[0]);
      }
      lastTouchCountRef.current = touches.length;
    }

    if (touches.length >= 2) {
      const [touchA, touchB] = touches;
      const pinchDistance = getDistance(touchA, touchB) || 1;
      const pinchCenter = getCenter(touchA, touchB);
      const nextScale = clamp(
        gestureRef.current.initialScale * (pinchDistance / gestureRef.current.initialDistance),
        MIN_SCALE,
        MAX_SCALE
      );

      const nextX = gestureRef.current.initialOffset.x + (pinchCenter.x - gestureRef.current.initialCenter.x);
      const nextY = gestureRef.current.initialOffset.y + (pinchCenter.y - gestureRef.current.initialCenter.y);

      applyTransform(nextScale, nextX, nextY);
      return;
    }

    if (touches.length === 1 && lastScaleRef.current > 1 && gestureRef.current.mode === "pan") {
      const touch = touches[0];
      const nextX = gestureRef.current.initialOffset.x + (touch.pageX - gestureRef.current.startPoint.x);
      const nextY = gestureRef.current.initialOffset.y + (touch.pageY - gestureRef.current.startPoint.y);
      applyTransform(lastScaleRef.current, nextX, nextY);
    }
  };

  const handleTouchStart = (event) => {
    const touches = event.nativeEvent.touches || [];
    lastTouchCountRef.current = touches.length;

    if (touches.length >= 2) {
      beginPinch(touches);
      return;
    }

    if (touches.length === 1 && lastScaleRef.current > 1) {
      beginPan(touches[0]);
    }
  };

  const handleTouchEnd = () => {
    lastTouchCountRef.current = 0;

    if (lastScaleRef.current <= 1.02) {
      resetZoom();
    }
  };

  useEffect(() => {
    if (!visible) {
      resetZoom(false);
    }
  }, [visible, imageUri]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.previewOverlay}>
        <LinearGradient
          colors={["rgba(5,8,14,0.94)", "rgba(5,8,14,0.98)"]}
          style={styles.previewFill}
        >
          <View style={styles.previewHeader}>
            <Pressable style={styles.previewActionButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </Pressable>

            <View style={styles.previewHeaderActions}>
              <Pressable style={styles.previewActionButton} onPress={() => resetZoom()}>
                <Ionicons name="refresh" size={20} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View
            style={styles.imageViewport}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
            onResponderTerminate={handleTouchEnd}
          >
            {imageUri ? (
              <Animated.View
                style={[
                  styles.previewImageTransform,
                  {
                    transform: [
                      { translateX },
                      { translateY },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.previewFooter}>
            <View style={styles.previewTextWrap}>
              <Text style={styles.previewTitle}>{title}</Text>
              <Text style={styles.previewSubtitle}>{subtitle}</Text>
              <Text style={styles.previewHint}>
                Pinch to zoom. Drag after zooming in. Current zoom: {zoomLevel.toFixed(1)}x
              </Text>
            </View>

            <View style={styles.footerActions}>
              <Pressable style={styles.previewActionButton} onPress={onDownload}>
                <Ionicons name="download-outline" size={22} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable style={[styles.previewActionButton, styles.previewActionSpacing]} onPress={onShare}>
                <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default ZoomableImageModal;

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  previewFill: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewActionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  previewActionSpacing: {
    marginLeft: 10,
  },
  imageViewport: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 20,
    marginBottom: 16,
  },
  previewImageTransform: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewFooter: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  previewTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  previewTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  previewSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  previewHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
