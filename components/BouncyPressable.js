import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

const BouncyPressable = ({ children, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue) => {
    Animated.spring(scale, {
      toValue,
      damping: 14,
      stiffness: 220,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default BouncyPressable;
