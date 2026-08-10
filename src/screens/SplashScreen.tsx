import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated, StatusBar, Dimensions } from 'react-native';

interface SplashScreenProps {
  onContinue: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Automatically close splash screen after 2.2 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onContinue, fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/images/splash.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  splashImage: {
    width: width,
    height: height,
  },
});
