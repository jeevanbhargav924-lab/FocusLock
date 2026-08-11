import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  useWindowDimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { FocusButton } from '../components/FocusButton';

interface OnboardingScreenProps {
  onCompleteOnboarding: () => void;
}

const SLIDE_DURATION = 3500; // 3.5 seconds timeout per slide

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onCompleteOnboarding,
}) => {
  const [step, setStep] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const slideWidth = screenWidth - spacing.containerMargin * 2;

  const slides = [
    {
      id: '1',
      title: 'Take Back Control',
      subtitle:
        'Stop wasting hours on distracting apps and take control of your digital life.',
      image: require('../../assets/images/onboardImage1.png'),
      buttonText: 'Next →',
    },
    {
      id: '2',
      title: 'Stay Focused',
      subtitle:
        'Lock distracting apps while still using essential apps like Phone, Messages, and Clock.',
      image: require('../../assets/images/onboardImage2.png'),
      buttonText: 'Next →',
    },
    {
      id: '3',
      title: 'Achieve More',
      subtitle:
        'Build better habits, improve productivity, and maintain your focus every day.',
      image: require('../../assets/images/onboardImage3.png'),
      buttonText: 'GET STARTED →',
    },
  ];

  // Start animated timeout fill whenever active step changes
  useEffect(() => {
    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: SLIDE_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        if (step < slides.length - 1) {
          const nextStep = step + 1;
          setStep(nextStep);
          flatListRef.current?.scrollToIndex({
            index: nextStep,
            animated: true,
          });
        }
      }
    });

    return () => animation.stop();
  }, [step, slides.length, progressAnim]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offset / slideWidth);
    if (pageIndex !== step && pageIndex >= 0 && pageIndex < slides.length) {
      setStep(pageIndex);
    }
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      flatListRef.current?.scrollToIndex({
        index: nextStep,
        animated: true,
      });
    } else {
      onCompleteOnboarding();
    }
  };

  // Interpolate progress width from 0% to 100%
  const activeDotWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* FlatList for Smooth Horizontal Paging */}
      <View style={{ height: 420 }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={slideWidth}
          snapToAlignment="center"
          decelerationRate="fast"
          keyExtractor={item => item.id}
          getItemLayout={(_, index) => ({
            length: slideWidth,
            offset: slideWidth * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={[styles.slidePage, { width: slideWidth }]}>
              {/* Hero Image Card */}
              <View style={styles.heroCard}>
                <Image source={item.image} resizeMode='cover' style={styles.heroImage} />
              </View>

              {/* Copy Section */}
              <View style={styles.copySection}>
                <Text style={[typography.displayMedium, styles.title]}>
                  {item.title}
                </Text>
                <Text style={[typography.bodyLarge, styles.subtitle]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Progress Fill Dots (Fills dynamically according to slide timeout) */}
      <View style={styles.dotsRow}>
        {slides.map((_, index) => {
          let isCompleted = index < step;
          let isActive = index === step;

          return (
            <View key={index} style={styles.dotTrack}>
              {isCompleted ? (
                <View style={styles.dotFilled} />
              ) : isActive ? (
                <Animated.View
                  style={[styles.dotFilled, { width: activeDotWidth }]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Bottom Button */}
      <FocusButton
        title={slides[step].buttonText}
        variant="primary"
        size="large"
        onPress={handleNext}
        style={styles.actionBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.containerMargin,
    justifyContent: 'space-between',
  },
  slidePage: {
    alignItems: 'center',
  },
  heroCard: {
    height: 260,
    width: '100%',
    marginTop: 60,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  copySection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dotTrack: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceHighest,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  dotFilled: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 2,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  actionBtn: {
    marginBottom: spacing.lg,
    width: '100%',
    backgroundColor: '#A855F7',
  },
});
