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
import { spacing } from '../theme';

import {
  getCurrentUserProfile,
  getUserStats,
  getHistorySessions,
  SessionRecord,
} from '../services/database';
import { SettingsIcon } from '../utils/Icons';

interface HomeScreenProps {
  onStartSession: (minutes: number) => void;
  onNavigateToApps: () => void;
  isSessionActive: boolean;
  onOpenSettings?: () => void;
  onOpenActiveSession?: () => void;
  remainingTimeText?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSession,
  onNavigateToApps,
  isSessionActive,
  onOpenSettings,
  onOpenActiveSession,
  remainingTimeText = '00:00:00',
}) => {
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('Deep Focus Session');
  const [streakDays, setStreakDays] = useState<number>(0);
  const [todayFocusText, setTodayFocusText] = useState<string>('0h 0m');
  const [userName, setUserName] = useState<string>('User');
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);

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

      // Calculate today's total focus minutes
      const todayDate = new Date();
      const todayYear = todayDate.getFullYear();
      const todayMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
      const todayDay = String(todayDate.getDate()).padStart(2, '0');
      const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

      const todayMins = history
        .filter(s => {
          if (s.status !== 'completed') return false;
          const dateObj = new Date(s.created_at || Date.now());
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}` === todayStr;
        })
        .reduce((sum, s) => sum + (s.actual_minutes || s.planned_minutes || 0), 0);

      const hrs = Math.floor(todayMins / 60);
      const mins = todayMins % 60;
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
        } catch (e) {}
      }
    };

    fetchSessionMeta();
    const interval = setInterval(() => {
      fetchSessionMeta();
      loadHomeData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/images/appIcon.png')}
            style={styles.avatarLogo}
          />
          <Text style={styles.brandName}>FocusLock</Text>
        </View>
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>Welcome, {userName}</Text>
        <Text style={styles.greetingSubtitle}>Let's build some momentum today.</Text>
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
            onPress={onOpenActiveSession}>
            <Text style={styles.viewSessionBtnText}>View Running Session →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* KPI Cards Row (2 Columns) */}
      <View style={styles.kpiRow}>
        {/* Today's Focus Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.timerIcon}>⏱</Text>
            <Text style={styles.kpiLabelGreen}>TODAY'S FOCUS</Text>
          </View>
          <Text style={styles.kpiValue}>{todayFocusText}</Text>
        </View>

        {/* Current Streak Card */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.fireIcon}>🔥</Text>
            <Text style={styles.kpiLabelOrange}>CURRENT</Text>
          </View>
          <Text style={styles.kpiValue}>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</Text>
        </View>
      </View>

      {/* Large CTA Start / View Session Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.startSessionCta}
        onPress={() => {
          if (isSessionActive && onOpenActiveSession) {
            onOpenActiveSession();
          } else {
            onStartSession(25);
          }
        }}>
        <Text style={styles.playTriangle}>{isSessionActive ? '⏱' : '▶'}</Text>
        <Text style={styles.ctaText}>
          {isSessionActive ? 'View Active Session' : 'Start Focus Session'}
        </Text>
      </TouchableOpacity>

      {/* Recent Sessions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
      </View>

      {/* Session Item Cards */}
      {recentSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No Recent Sessions</Text>
          <Text style={styles.emptySub}>
            Start a focus session to block distractions and track your progress!
          </Text>
        </View>
      ) : (
        recentSessions.map(session => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionIconBox}>
                <Text style={styles.sessionIcon}>
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
                <Text style={styles.sessionTitle}>{session.title || 'Focus Session'}</Text>
                <Text style={styles.sessionTime}>
                  {session.start_time ? `${session.start_time} - ${session.end_time || ''}` : 'Today'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sessionDuration}>
                  {session.actual_minutes || session.planned_minutes || 0}m
                </Text>
                <Text
                  style={[
                    styles.sessionPts,
                    session.status === 'completed'
                      ? { color: '#4ECCA3' }
                      : { color: '#F87171' },
                  ]}>
                  {session.status === 'completed' ? '✓ Completed' : '✕ Ended'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: spacing.sm,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  gearIcon: {
    fontSize: 22,
  },
  greetingSection: {
    marginBottom: spacing.lg,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  greetingSubtitle: {
    color: '#8B949E',
    fontSize: 14,
    marginTop: 6,
  },
  activeBannerCard: {
    backgroundColor: '#183A2E',
    borderRadius: 16,
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#4ECCA3',
  },
  activeBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeBadge: {
    color: '#4ECCA3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTimerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activeBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeBannerSub: {
    color: '#8B949E',
    fontSize: 13,
    marginBottom: spacing.md,
  },
  viewSessionBtn: {
    backgroundColor: '#4ECCA3',
    borderRadius: 12,
    paddingVertical: spacing.xs + 4,
    alignItems: 'center',
  },
  viewSessionBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timerIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  fireIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  kpiLabelGreen: {
    color: '#4ECCA3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiLabelOrange: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  startSessionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161B22',
    borderRadius: 28,
    height: 58,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: '#4F8CFF',
    shadowColor: '#4F8CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  playTriangle: {
    color: '#9DA9FF',
    fontSize: 14,
    marginRight: spacing.xs + 2,
  },
  ctaText: {
    color: '#C3C7F4',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
  },
  sessionCard: {
    marginBottom: spacing.md,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sessionIcon: {
    fontSize: 20,
  },
  sessionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionTime: {
    color: '#8B949E',
    fontSize: 13,
    marginTop: 2,
  },
  sessionDuration: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sessionPts: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
