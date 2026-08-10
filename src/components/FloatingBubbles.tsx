import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BubbleData {
  id: number;
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  opacity: number;
}

const BUBBLE_COLORS = [
  '#4ECCA3',
  '#2EA043',
  '#A855F7',
  '#38BDF8',
  '#10B981',
  '#6366F1',
  '#4ADE80',
];

const DraggableBubble: React.FC<{ bubble: BubbleData }> = ({ bubble }) => {
  const pan = useRef(new Animated.ValueXY({ x: bubble.initialX, y: bubble.initialY })).current;

  // Floating ambient movement animation loop
  useEffect(() => {
    const floatDistanceX = (Math.random() - 0.5) * 50;
    const floatDistanceY = (Math.random() - 0.5) * 50;
    const duration = 3000 + Math.random() * 4000;

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pan, {
          toValue: { x: bubble.initialX + floatDistanceX, y: bubble.initialY + floatDistanceY },
          duration: duration,
          useNativeDriver: false,
        }),
        Animated.timing(pan, {
          toValue: { x: bubble.initialX - floatDistanceX / 2, y: bubble.initialY - floatDistanceY / 2 },
          duration: duration * 1.2,
          useNativeDriver: false,
        }),
        Animated.timing(pan, {
          toValue: { x: bubble.initialX, y: bubble.initialY },
          duration: duration,
          useNativeDriver: false,
        }),
      ])
    );

    floatAnimation.start();
    return () => floatAnimation.stop();
  }, [bubble, pan]);

  // Touch & Drag Handler so bubbles can be freely moved around by user
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.bubble,
        {
          width: bubble.size,
          height: bubble.size,
          borderRadius: bubble.size / 2,
          backgroundColor: bubble.color,
          opacity: bubble.opacity,
          transform: pan.getTranslateTransform(),
        },
      ]}
    />
  );
};

export const FloatingBubbles: React.FC = () => {
  const bubbles = useRef<BubbleData[]>(
    Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 10) + 4, // 4px to 14px
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      initialX: Math.random() * (SCREEN_WIDTH - 20),
      initialY: Math.random() * (SCREEN_HEIGHT - 60),
      opacity: 0.25 + Math.random() * 0.55,
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {bubbles.map(bubble => (
        <DraggableBubble key={bubble.id} bubble={bubble} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    shadowColor: '#4ECCA3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
});
