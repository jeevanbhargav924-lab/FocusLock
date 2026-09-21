import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
  Share,
} from 'react-native';
import { FloatingBubbles } from '../components/FloatingBubbles';
import {
  CheckmarkIcon,
  StopwatchIcon,
  BlockedIcon,
  PlayIcon,
  HourglassIcon,
  TargetDartBullseye,
  ShareIcon,
} from '../utils/Icons';
import { colors, fonts } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  calculateFocusScore,
  getTodayGoalProgress,
  TodayGoalProgress,
  ScoreBreakdown,
} from '../services/database';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';

interface SessionCompletedScreenProps {
  isManualEnd?: boolean;
  plannedMinutes?: number;
  completedMinutes?: number;
  remainingMinutes?: number;
  durationMinutes?: number;
  sessionTitle?: string;
  blockedAttempts?: number;
  topAttemptedApp?: string;
  emergencyUnlocks?: number;
  score?: number;
  timeSavedMinutes?: number;
  onStartAnotherSession?: () => void;
  onReturnHome: () => void;
}

export const SessionCompletedScreen: React.FC<SessionCompletedScreenProps> = ({
  isManualEnd = false,
  plannedMinutes,
  completedMinutes,
  remainingMinutes: _remainingMinutes = 0,
  durationMinutes = 25,
  sessionTitle = 'Deep Focus Session',
  blockedAttempts = 0,
  topAttemptedApp,
  emergencyUnlocks = 0,
  score,
  timeSavedMinutes: _timeSavedMinutes = 0,
  onStartAnotherSession,
  onReturnHome,
}) => {
  const insets = useSafeAreaInsets();
  const actualCompletedMins = completedMinutes ?? durationMinutes;
  const actualPlannedMins = plannedMinutes ?? durationMinutes;

  const [todayGoal, setTodayGoal] = useState<TodayGoalProgress | null>(null);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);

  // Compute deterministic score breakdown
  const scoreBreakdown: ScoreBreakdown = calculateFocusScore({
    plannedMinutes: actualPlannedMins,
    actualMinutes: actualCompletedMins,
    status: isManualEnd ? 'ended' : 'completed',
    distractionAttempts: blockedAttempts,
    emergencyUnlocks,
  });

  const finalScore = score !== undefined ? score : scoreBreakdown.totalScore;

  // Breathing animation refs for the top icon background
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    getTodayGoalProgress().then(setTodayGoal).catch(() => {});

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

  const handleShareFocusCard = async () => {
    try {
      const focusTimeStr = formatFocusTime(actualCompletedMins);
      const message =
        `🔥 FocusLock Session Complete!\n\n` +
        `🎯 Session: ${sessionTitle}\n` +
        `⏱️ Time Focused: ${focusTimeStr}\n` +
        `🛡️ Distractions Blocked: ${blockedAttempts}\n` +
        `✨ Focus Score: ${finalScore}/100\n` +
        (todayGoal?.isCompleted ? `🎯 Daily Focus Goal Reached!\n` : '') +
        `\nReclaim your attention with #FocusLock #DeepWork #Productivity`;

      await Share.share({
        title: 'FocusLock Session Achievement',
        message,
      });
    } catch {
      // User dismissed or share canceled
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Draggable & Floating Background Bubbles */}
      <FloatingBubbles />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Breathing Animated Header Icon */}
        <View style={styles.iconHeaderContainer}>
          <Animated.View
            style={[
              styles.breathingGlowRing,
              isManualEnd && styles.amberGlowRing,
              {
                transform: [{ scale: breatheAnim }],
                opacity: glowOpacity,
              },
            ]}
          />
          <View style={[styles.checkCircle, isManualEnd && styles.amberCircle]}>
            {isManualEnd ? (
              <StopwatchIcon color="#FFFFFF" width={28} height={28} />
            ) : (
              <CheckmarkIcon color={colors.background} width={28} height={28} />
            )}
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.titleText}>
          {isManualEnd ? 'Session Ended Early' : '🎉 Focus Complete'}
        </Text>
        <Text style={styles.sessionNameBanner}>{sessionTitle}</Text>
        <Text style={styles.subtitleText}>
          {isManualEnd
            ? `You focused for ${actualCompletedMins} minutes. Every step counts — building deep focus takes practice! Great effort.`
            : "You've successfully completed your focus session. Outstanding discipline."}
        </Text>

        {/* Daily Goal Status Banner if reached */}
        {todayGoal?.isCompleted && (
          <View style={styles.goalCompleteBanner}>
            <TargetDartBullseye color="#10B981" width={20} height={20} />
            <Text style={styles.goalCompleteBannerText}>
              🎯 Daily Goal Complete ({todayGoal.focusedMinutes} / {todayGoal.goalMinutes} min)
            </Text>
          </View>
        )}

        {/* Metrics Cards Grid */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Focus Score with tap-to-inspect */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowScoreModal(true)}
            style={[styles.metricCard, styles.scoreCardHighlight]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.scoreIconSmall}>✨</Text>
              <Text style={[styles.cardHeaderLabel, { color: '#C084FC' }]}>
                FOCUS SCORE (TAP FOR BREAKDOWN)
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.cardPrimaryValue, { color: '#C084FC' }]}>
                {finalScore}
              </Text>
              <Text style={styles.scoreScaleText}>/ 100</Text>
            </View>
            <Text style={styles.scoreHelpHint}>Tap to see how your score was calculated ›</Text>
          </TouchableOpacity>

          {/* Row of 2 cards: Time Focused & Daily Goal */}
          <View style={styles.twoColumnRow}>
            {/* Completed Time */}
            <View style={[styles.metricCard, { flex: 1 }]}>
              <View style={styles.cardHeaderRow}>
                <StopwatchIcon color="#8B949E" width={16} height={16} />
                <Text style={styles.cardHeaderLabel}>FOCUSED</Text>
              </View>
              <Text style={styles.cardCompactValue}>
                {formatFocusTime(actualCompletedMins)}
              </Text>
              {isManualEnd && (
                <Text style={styles.cardSubText}>
                  of {actualPlannedMins}m planned
                </Text>
              )}
            </View>

            {/* Goal Progress */}
            <View style={[styles.metricCard, { flex: 1 }]}>
              <View style={styles.cardHeaderRow}>
                <TargetDartBullseye color="#10B981" width={16} height={16} />
                <Text style={styles.cardHeaderLabel}>DAILY GOAL</Text>
              </View>
              <Text style={[styles.cardCompactValue, { color: '#10B981' }]}>
                {todayGoal ? `${todayGoal.focusedMinutes}/${todayGoal.goalMinutes}m` : `${actualCompletedMins}m`}
              </Text>
              <Text style={styles.cardSubText}>
                {todayGoal?.isCompleted ? 'Completed ✓' : `${todayGoal?.remainingMinutes ?? 0}m left`}
              </Text>
            </View>
          </View>

          {/* Row of 2 cards: Distractions Blocked & Emergency Unlocks */}
          <View style={styles.twoColumnRow}>
            {/* Blocked Attempts */}
            <View style={[styles.metricCard, { flex: 1 }]}>
              <View style={styles.cardHeaderRow}>
                <BlockedIcon color="#F87171" width={16} height={16} />
                <Text style={styles.cardHeaderLabel}>BLOCKED</Text>
              </View>
              <Text style={styles.cardCompactValue}>{blockedAttempts}</Text>
              <Text style={styles.cardSubText}>
                {topAppAttempt(topAttemptedApp, blockedAttempts)}
              </Text>
            </View>

            {/* Emergency Unlocks */}
            <View style={[styles.metricCard, { flex: 1 }]}>
              <View style={styles.cardHeaderRow}>
                <HourglassIcon color="#E5A84B" width={16} height={16} />
                <Text style={styles.cardHeaderLabel}>UNLOCKS</Text>
              </View>
              <Text style={[styles.cardCompactValue, { color: '#E5A84B' }]}>
                {emergencyUnlocks}
              </Text>
              <Text style={styles.cardSubText}>emergency used</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.primaryButton}
            onPress={onStartAnotherSession || onReturnHome}>
            <PlayIcon color="#1E1B4B" width={16} height={16} />
            <Text style={styles.primaryButtonText}>
              {isManualEnd ? 'Start New Session' : 'Start Another Session'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.shareButton}
            onPress={handleShareFocusCard}>
            <ShareIcon color="#C084FC" width={18} height={18} />
            <Text style={styles.shareButtonText}>Share Focus Achievement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.secondaryButton}
            onPress={onReturnHome}>
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Score Calculation Breakdown Modal */}
      <ScoreBreakdownModal
        visible={showScoreModal}
        score={finalScore}
        breakdown={scoreBreakdown}
        onClose={() => setShowScoreModal(false)}
      />
    </SafeAreaView>
  );
};

const topAppAttempt = (topApp?: string, count: number = 0): string => {
  if (count === 0) return '0 distractions';
  if (topApp) return `${topApp} attempted`;
  return `${count} distractions`;
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
  amberGlowRing: {
    backgroundColor: 'rgba(229, 168, 75, 0.25)',
    borderColor: 'rgba(229, 168, 75, 0.4)',
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
  amberCircle: {
    backgroundColor: '#E5A84B',
    shadowColor: '#E5A84B',
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
    marginBottom: 20,
  },
  sessionNameBanner: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 6,
  },
  goalCompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 8,
  },
  goalCompleteBannerText: {
    fontFamily: fonts.bold,
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Metrics Cards Stack */
  cardsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  metricCard: {
    backgroundColor: '#161B22',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreCardHighlight: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: '#171426',
    paddingVertical: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreScaleText: {
    fontFamily: fonts.semiBold,
    color: '#8B949E',
    fontSize: 18,
  },
  scoreIconSmall: {
    fontSize: 14,
  },
  scoreHelpHint: {
    fontFamily: fonts.medium,
    color: '#A78BFA',
    fontSize: 12,
    marginTop: 6,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: fonts.bold,
  },
  cardPrimaryValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: fonts.bold,
  },
  cardCompactValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  cardSubText: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: fonts.regular,
    marginTop: 2,
    textAlign: 'center',
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.semiBold,
  },
  shareButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D8B4FE',
    fontFamily: fonts.semiBold,
  },
});
