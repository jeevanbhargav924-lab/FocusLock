import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  NativeModules,
} from 'react-native';
import { colors, spacing, fonts } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getCurrentUserProfile,
  getUserStats,
  getHistorySessions,
  getTodayGoalProgress,
  setDailyFocusGoal,
  TodayGoalProgress,
  SessionRecord,
} from '../services/database';
import {
  CardWaveGreen,
  CardWaveOrange,
  WatermarkClock,
  TargetDartBullseye,
  CompassTargetIcon,
  FlameIcon,
  RightArrowIcon,
  SparklesIcon,
} from '../utils/Icons';
import { DailyGoalModal } from '../components/DailyGoalModal';
import { ScoreBreakdownModal } from '../components/ScoreBreakdownModal';

interface HomeScreenProps {
  onStartSession: (minutes?: number) => void;
  onNavigateToApps: () => void;
  isSessionActive: boolean;
  onOpenSettings?: () => void;
  onOpenActiveSession?: () => void;
  onOpenHistory?: () => void;
  onOpenAchievements?: () => void;
  remainingTimeText?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSession,
  onNavigateToApps: _onNavigateToApps,
  isSessionActive,
  onOpenSettings: _onOpenSettings,
  onOpenActiveSession,
  onOpenHistory,
  onOpenAchievements,
  remainingTimeText = '00:00:00',
}) => {
  const insets = useSafeAreaInsets();
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('Deep Focus Session');
  const [streakDays, setStreakDays] = useState<number>(0);
  const [todayFocusText, setTodayFocusText] = useState<string>('0h 0m');
  const [userName, setUserName] = useState<string>('User');
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);
  const [goalProgress, setGoalProgress] = useState<TodayGoalProgress | null>(null);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const loadHomeData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile && profile.display_name) {
        const firstName = profile.display_name.split(' ')[0];
        setUserName(firstName);
      }

      const uid = profile?.uid || 'default_user';
      const stats = await getUserStats(uid);
      setStreakDays(stats.current_streak ?? 0);

      const history = await getHistorySessions(uid, 'all');
      setRecentSessions(history.slice(0, 4)); // Top 4 recent sessions

      // Fetch accurate daily goal progress
      const progress = await getTodayGoalProgress(uid);
      setGoalProgress(progress);

      const hrs = Math.floor(progress.focusedMinutes / 60);
      const mins = progress.focusedMinutes % 60;
      setTodayFocusText(`${hrs}h ${mins}m`);
    } catch (e) {
      console.warn('Error loading home screen dynamic data:', e);
    }
  };

  useEffect(() => {
    loadHomeData();

    const fetchSessionMeta = async () => {
      if (Platform.OS === 'android' && NativeModules.PermissionModule) {
        try {
          if (NativeModules.PermissionModule.getActiveSession) {
            const session = await NativeModules.PermissionModule.getActiveSession();
            if (session && session.title) {
              setActiveSessionTitle(session.title);
            }
          }
        } catch {}
      }
    };

    fetchSessionMeta();
    const interval = setInterval(() => {
      fetchSessionMeta();
      loadHomeData();
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleSaveGoal = async (minutes: number) => {
    await setDailyFocusGoal(minutes);
    await loadHomeData();
  };

  const renderInsightText = () => {
    if (!goalProgress || (goalProgress.focusedMinutes === 0 && recentSessions.length === 0)) {
      return 'Your focus journey starts here 🌱 Complete your first session to build activity.';
    }
    if (goalProgress.isCompleted) {
      return '🎯 Outstanding discipline! You reached your daily focus goal today. Excellent work!';
    }
    if (goalProgress.distractionsBlocked > 0) {
      return `🛡️ Distraction shield active! You blocked ${goalProgress.distractionsBlocked} distraction attempt(s) today.`;
    }
    if (goalProgress.percent >= 50) {
      return `You're ${goalProgress.percent}% toward your ${goalProgress.goalMinutes}m goal. More than halfway there!`;
    }
    return `Every session brings you closer to your goal. ${goalProgress.remainingMinutes}m remaining today.`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(140, insets.bottom + 120) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/images/appIcon.png')}
          style={styles.brandAppIcon}
        />
        <View style={styles.headerTextGroup}>
          <Text style={styles.greetingTitle}>Welcome back, {userName} 👋</Text>
          <Text style={styles.greetingSubtitle}>
            Let's build some momentum today.
          </Text>
        </View>
      </View>

      {/* Running Session Banner (Shown if session is active) */}
      {isSessionActive && (
        <View style={styles.activeBannerCard}>
          <View style={styles.activeBannerHeader}>
            <Text style={styles.activeBadge}>● LIVE SESSION</Text>
            <Text style={styles.activeTimerText}>{remainingTimeText}</Text>
          </View>
          <Text style={styles.activeBannerTitle}>{activeSessionTitle}</Text>
          <Text style={styles.activeBannerSub}>
            Distracting apps are currently blocked. Stay on track!
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.viewSessionBtn}
            onPress={onOpenActiveSession}
          >
            <Text style={styles.viewSessionBtnText}>
              View Running Session →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 1. DAILY FOCUS GOAL CARD */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeaderRow}>
          <View style={styles.goalHeaderLeft}>
            <View style={styles.targetIconBadge}>
              <TargetDartBullseye color={colors.secondary} width={18} height={18} />
            </View>
            <Text style={styles.goalCardLabel}>TODAY'S GOAL</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.adjustGoalBtn}
            onPress={() => setShowGoalModal(true)}>
            <Text style={styles.adjustGoalText}>Change Goal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalMetricRow}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.goalCurrentText}>
              {goalProgress?.focusedMinutes ?? 0}
            </Text>
            <Text style={styles.goalTargetText}>
              {' '}/ {goalProgress?.goalMinutes ?? 60} min
            </Text>
          </View>
          <View style={styles.goalPercentBadge}>
            <Text style={styles.goalPercentText}>
              {goalProgress?.percent ?? 0}%
            </Text>
          </View>
        </View>

        {/* High-contrast Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, goalProgress?.percent ?? 0))}%`,
                backgroundColor: goalProgress?.isCompleted ? '#10B981' : '#8B5CF6',
              },
            ]}
          />
        </View>

        {/* Goal Status Footer */}
        <View style={styles.goalFooterRow}>
          {goalProgress?.isCompleted ? (
            <Text style={styles.goalSuccessStatus}>
              🎯 Daily Goal Complete • Excellent work!
            </Text>
          ) : (
            <Text style={styles.goalRemainingStatus}>
              {goalProgress?.remainingMinutes ?? 60} min remaining today
            </Text>
          )}
        </View>
      </View>

      {/* KPI Cards Row (Today's Focus & Current Streak) */}
      <View style={styles.kpiRow}>
        {/* Today's Focus Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <View style={styles.greenIconCircle}>
              <CompassTargetIcon
                color={colors.secondary}
                width={16}
                height={16}
              />
            </View>
            <Text style={styles.kpiLabelGreen}>TODAY'S FOCUS</Text>
          </View>
          <Text style={styles.kpiValue}>{todayFocusText}</Text>
          <Text style={styles.kpiSubtext}>Keep it going!</Text>
          <View style={styles.cardWaveWrap}>
            <CardWaveGreen />
          </View>
        </View>

        {/* Current Streak Card */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={onOpenAchievements}
          style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <View style={styles.orangeIconCircle}>
              <FlameIcon color={colors.tertiary} width={16} height={16} />
            </View>
            <Text style={styles.kpiLabelOrange}>CURRENT STREAK</Text>
          </View>
          <Text style={styles.kpiValue}>
            {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
          </Text>
          <View style={styles.kpiStreakFooter}>
            <Text style={styles.kpiSubtext}>
              {streakDays > 0 ? 'Momentum active 🔥' : 'Start your streak'}
            </Text>
            <Text style={styles.kpiBadgeLink}>Badges ›</Text>
          </View>
          <View style={styles.cardWaveWrap}>
            <CardWaveOrange />
          </View>
        </TouchableOpacity>
      </View>

      {/* Large CTA Purple Start Session Card Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.startSessionCtaCard}
        onPress={() => {
          if (isSessionActive && onOpenActiveSession) {
            onOpenActiveSession();
          } else {
            onStartSession();
          }
        }}
      >
        <View style={styles.outerPlayRing}>
          <View style={styles.playWhiteCircle}>
            <Text style={styles.playIconTriangle}>
              {isSessionActive ? '⏱' : '▶'}
            </Text>
          </View>
        </View>

        <View style={styles.ctaTextContainer}>
          <Text style={styles.ctaCardTitle}>
            {isSessionActive ? 'View Active Session' : 'Start Focus Session'}
          </Text>
          <Text style={styles.ctaCardSub}>
            {isSessionActive
              ? `Remaining: ${remainingTimeText}`
              : 'Block distractions and achieve more.'}
          </Text>
        </View>

        <View style={styles.watermarkClockWrap}>
          <WatermarkClock
            width={76}
            height={76}
            color="rgba(255, 255, 255, 0.22)"
          />
        </View>
      </TouchableOpacity>

      {/* Quick Start Presets Row */}
      <View style={styles.quickStartSection}>
        <Text style={styles.quickStartLabel}>QUICK START</Text>
        <View style={styles.quickStartRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.quickStartPill}
            onPress={() => onStartSession(25)}>
            <Text style={styles.quickStartDuration}>25 min</Text>
            <Text style={styles.quickStartDesc}>Pomodoro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.quickStartPill}
            onPress={() => onStartSession(50)}>
            <Text style={styles.quickStartDuration}>50 min</Text>
            <Text style={styles.quickStartDesc}>Study</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.quickStartPill}
            onPress={() => onStartSession(90)}>
            <Text style={styles.quickStartDuration}>90 min</Text>
            <Text style={styles.quickStartDesc}>Deep Work</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Progress Summary */}
      <View style={styles.progressSummaryCard}>
        <Text style={styles.progressSummaryTitle}>Today's Progress</Text>
        <View style={styles.progressSummaryRow}>
          <View style={styles.progressSummaryItem}>
            <Text style={styles.progressSummaryIcon}>✓</Text>
            <Text style={styles.progressSummaryText}>
              {goalProgress?.focusedMinutes ?? 0}m focused
            </Text>
          </View>
          <View style={styles.progressSummaryItem}>
            <Text style={styles.progressSummaryIcon}>🛡️</Text>
            <Text style={styles.progressSummaryText}>
              {goalProgress?.distractionsBlocked ?? 0} blocked
            </Text>
          </View>
          <View style={styles.progressSummaryItem}>
            <Text style={styles.progressSummaryIcon}>
              {goalProgress?.isCompleted ? '🎯' : '○'}
            </Text>
            <Text style={styles.progressSummaryText}>
              {goalProgress?.isCompleted
                ? 'Goal complete'
                : `${goalProgress?.remainingMinutes ?? 60}m remaining`}
            </Text>
          </View>
        </View>
      </View>

      {/* Dynamic Insight Card */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeaderRow}>
          <SparklesIcon color="#A855F7" width={16} height={16} />
          <Text style={styles.insightTitle}>Today's Insight</Text>
        </View>
        <Text style={styles.insightBodyText}>{renderInsightText()}</Text>
      </View>

      {/* Recent Sessions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.viewAllBtnPill}
          onPress={() => {
            if (onOpenHistory) {
              onOpenHistory();
            } else if (onOpenActiveSession) {
              onOpenActiveSession();
            }
          }}
        >
          <Text style={styles.viewAllBtnText}>View All</Text>
          <RightArrowIcon
            color={colors.primaryLight}
            width={14}
            height={14}
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>
      </View>

      {/* Session Item Cards / Empty State */}
      {recentSessions.length === 0 ? (
        <View style={styles.emptyCardContainer}>
          <View style={styles.dashedClipboardRing}>
            <Text style={{ fontSize: 26 }}>📋</Text>
          </View>
          <Text style={styles.emptyCardTitle}>No Sessions Yet</Text>
          <Text style={styles.emptyCardSub}>
            Your focus journey starts now.{'\n'}Start your first session!
          </Text>
        </View>
      ) : (
        recentSessions.map(session => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionIconBox}>
                <Text style={styles.sessionIconEmoji}>
                  {session.category === 'coding'
                    ? '💻'
                    : session.category === 'reading'
                    ? '📖'
                    : session.category === 'journaling'
                    ? '✍️'
                    : '🎯'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle}>
                  {session.title || 'Focus Session'}
                </Text>
                <Text style={styles.sessionTime}>
                  {session.start_time
                    ? `${session.start_time} - ${session.end_time || ''}`
                    : 'Today'}
                  {session.blocked_attempts > 0 && ` • ${session.blocked_attempts} blocked`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sessionDuration}>
                  {session.actual_minutes || session.planned_minutes || 0}m
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedScore(session.score)}>
                  <Text
                    style={[
                      styles.sessionPts,
                      session.status === 'completed'
                        ? { color: colors.secondary }
                        : { color: '#F59E0B' },
                    ]}
                  >
                    {session.status === 'completed'
                      ? `✓ ${session.score} PTS`
                      : `⏱ ${session.score} PTS`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Daily Goal Configuration Modal */}
      <DailyGoalModal
        visible={showGoalModal}
        currentGoalMinutes={goalProgress?.goalMinutes ?? 60}
        onSaveGoal={handleSaveGoal}
        onClose={() => setShowGoalModal(false)}
      />

      {/* Score Explanation Modal */}
      <ScoreBreakdownModal
        visible={selectedScore !== null}
        score={selectedScore ?? 100}
        onClose={() => setSelectedScore(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandAppIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 14,
  },
  headerTextGroup: {
    flex: 1,
  },
  greetingTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    fontSize: 18
  },
  greetingSubtitle: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  activeBannerCard: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 20,
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  activeBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeBadge: {
    fontFamily: fonts.bold,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTimerText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activeBannerTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeBannerSub: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  viewSessionBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: spacing.xs + 4,
    alignItems: 'center',
  },
  viewSessionBtnText: {
    fontFamily: fonts.bold,
    color: colors.onSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 125,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  greenIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 14,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  orangeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tertiaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  kpiLabelGreen: {
    fontFamily: fonts.bold,
    color: colors.secondary,
    fontSize: 14,
    letterSpacing: 0.6,
  },
  kpiLabelOrange: {
    fontFamily: fonts.bold,
    color: colors.tertiary,
    fontSize: 14,
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 24,
    marginBottom: 2,
  },
  kpiSubtext: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 12,
    zIndex: 2,
  },
  kpiStreakFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    zIndex: 2,
  },
  kpiBadgeLink: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.tertiary,
    fontWeight: '700',
  },
  cardWaveWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
    opacity: 0.85,
  },
  startSessionCtaCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    height: 86,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  outerPlayRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  playWhiteCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playIconTriangle: {
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 3,
  },
  ctaTextContainer: {
    flex: 1,
    zIndex: 2,
  },
  ctaCardTitle: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 3,
  },
  ctaCardSub: {
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  watermarkClockWrap: {
    position: 'absolute',
    right: 12,
    alignSelf: 'center',
    opacity: 0.85,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 22,
  },
  viewAllBtnPill: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllBtnText: {
    fontFamily: fonts.semiBold,
    color: colors.primaryLight,
    fontSize: 12,
  },
  emptyCardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  /* Welcome Onboarding Card Styles */
  welcomeHelpsCard: {
    backgroundColor: '#13161B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeHelpsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
    marginLeft: 8,
  },
  welcomeFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  welcomeFeatureCol: {
    flex: 1,
    alignItems: 'center',
  },
  welcomeIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  purpleShieldBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  greenTargetBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  goldChartBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  welcomeFeatureTitle: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 16,
  },
  welcomeFeatureDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  welcomeQuoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  quoteMarkText: {
    color: '#A855F7',
    fontSize: 22,
    fontFamily: fonts.bold,
    marginHorizontal: 6,
  },
  welcomeQuoteText: {
    color: '#8B949E',
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  dashedTargetRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  dashedClipboardRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  emptyCardTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyCardSub: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sessionIconEmoji: {
    fontSize: 20,
  },
  sessionTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  sessionTime: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sessionDuration: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sessionPts: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: 2,
  },
  /* Goal Dashboard Styles */
  goalCard: {
    backgroundColor: '#161B22',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  goalCardLabel: {
    fontFamily: fonts.bold,
    color: '#E6EDF3',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  adjustGoalBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  adjustGoalText: {
    fontFamily: fonts.semiBold,
    color: '#A78BFA',
    fontSize: 12,
  },
  goalMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCurrentText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  goalTargetText: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#8B949E',
  },
  goalPercentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  goalPercentText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#0E1420',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalFooterRow: {
    marginTop: 2,
  },
  goalSuccessStatus: {
    fontFamily: fonts.semiBold,
    color: '#10B981',
    fontSize: 13,
  },
  goalRemainingStatus: {
    fontFamily: fonts.regular,
    color: '#8B949E',
    fontSize: 13,
  },
  /* Quick Start Styles */
  quickStartSection: {
    marginBottom: 20,
  },
  quickStartLabel: {
    fontFamily: fonts.bold,
    color: '#8B949E',
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  quickStartRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickStartPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStartDuration: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickStartDesc: {
    fontFamily: fonts.regular,
    color: '#8B949E',
    fontSize: 11,
  },
  /* Progress Summary Card */
  progressSummaryCard: {
    backgroundColor: '#121720',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressSummaryTitle: {
    fontFamily: fonts.bold,
    color: '#E6EDF3',
    fontSize: 14,
    marginBottom: 12,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSummaryIcon: {
    fontSize: 14,
    color: '#10B981',
  },
  progressSummaryText: {
    fontFamily: fonts.medium,
    color: '#8B949E',
    fontSize: 12.5,
  },
  /* Dynamic Insight Card */
  insightCard: {
    backgroundColor: '#151325',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  insightTitle: {
    fontFamily: fonts.bold,
    color: '#C084FC',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  insightBodyText: {
    fontFamily: fonts.regular,
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
});


