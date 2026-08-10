import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { FloatingBubbles } from '../components/FloatingBubbles';
import {
  CheckmarkIcon,
  StopwatchIcon,
  BlockedIcon,
  TrendingUpIcon,
  PlayIcon,
} from '../utils/Icons';

interface SessionCompletedScreenProps {
  durationMinutes?: number;
  blockedAttempts?: number;
  timeSavedMinutes?: number;
  onStartAnotherSession?: () => void;
  onReturnHome: () => void;
}

export const SessionCompletedScreen: React.FC<SessionCompletedScreenProps> = ({
  durationMinutes = 90,
  blockedAttempts = 8,
  timeSavedMinutes = 22,
  onStartAnotherSession,
  onReturnHome,
}) => {
  // Breathing animation refs for the top checkmark icon background
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.28,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1.0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.85,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [breatheAnim, glowOpacity]);

  // Format duration (e.g. 90 -> "1h 30m", 25 -> "25m")
  const formatFocusTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Draggable & Floating Background Bubbles */}
      <FloatingBubbles />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Breathing Animated Checkmark Icon Header */}
        <View style={styles.iconHeaderContainer}>
          <Animated.View
            style={[
              styles.breathingGlowRing,
              {
                transform: [{ scale: breatheAnim }],
                opacity: glowOpacity,
              },
            ]}
          />
          <View style={styles.checkCircle}>
            <CheckmarkIcon color="#0D1117" width={28} height={28} />
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.titleText}>Congratulations!</Text>
        <Text style={styles.subtitleText}>
          You've successfully completed your focus session. Outstanding discipline.
        </Text>

        {/* Metrics Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Focus Time */}
          <View style={styles.metricCard}>
            <View style={styles.cardHeaderRow}>
              <StopwatchIcon color="#8B949E" width={18} height={18} />
              <Text style={styles.cardHeaderLabel}>FOCUS TIME</Text>
            </View>
            <Text style={styles.cardPrimaryValue}>
              {formatFocusTime(durationMinutes)}
            </Text>
          </View>

          {/* Card 2: Blocked Attempts */}
          <View style={styles.metricCard}>
            <View style={styles.cardHeaderRow}>
              <BlockedIcon color="#F87171" width={18} height={18} />
              <Text style={styles.cardHeaderLabel}>Blocked Attempts</Text>
            </View>
            <Text style={styles.cardPrimaryValue}>{blockedAttempts}</Text>
          </View>

          {/* Card 3: Time Saved */}
          <View style={styles.metricCard}>
            <View style={styles.cardHeaderRow}>
              <TrendingUpIcon color="#4ECCA3" width={18} height={18} />
              <Text style={styles.cardHeaderLabel}>Time Saved</Text>
            </View>
            <Text style={[styles.cardPrimaryValue, { color: '#4ECCA3' }]}>
              {timeSavedMinutes}m
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.primaryButton}
            onPress={onStartAnotherSession || onReturnHome}>
            <PlayIcon color="#1E1B4B" width={16} height={16} />
            <Text style={styles.primaryButtonText}>Start Another Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.secondaryButton}
            onPress={onReturnHome}>
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },

  /* Icon Breathing Glow Header */
  iconHeaderContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  breathingGlowRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(78, 204, 163, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(78, 204, 163, 0.4)',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4ECCA3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ECCA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },

  /* Typography */
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#8B949E',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 28,
  },

  /* Metrics Cards Stack */
  cardsContainer: {
    width: '100%',
    gap: 14,
    marginBottom: 32,
  },
  metricCard: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardPrimaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  /* Action Buttons */
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#B4C6FF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#B4C6FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#161B22',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
