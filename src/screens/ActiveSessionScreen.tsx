import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeModules, Platform } from 'react-native';
import { colors, typography, spacing } from '../theme';
import { FocusTimerDisplay } from '../components/FocusTimerDisplay';
import { FocusButton } from '../components/FocusButton';
import { FocusCard } from '../components/FocusCard';

interface ActiveSessionScreenProps {
  initialMinutes?: number;
  onEndSession: (elapsedSec: number, remainingSec: number, blockedCount: number) => void;
  onNaturalCompletion?: () => void;
  onTriggerBlockedAlert: () => void;
}

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({
  initialMinutes = 25,
  onEndSession,
  onNaturalCompletion,
  onTriggerBlockedAlert,
}) => {
  const [sessionTitle, setSessionTitle] = useState<string>('Deep Focus Session');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialMinutes * 60);
  const [totalSeconds, setTotalSeconds] = useState<number>(initialMinutes * 60);
  const [isStrict, setIsStrict] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [blockedCount, setBlockedCount] = useState<number>(0);

  useEffect(() => {
    const fetchNativeSession = async () => {
      if (Platform.OS === 'android' && NativeModules.PermissionModule?.getActiveSession) {
        try {
          const session = await NativeModules.PermissionModule.getActiveSession();
          if (session) {
            setSessionTitle(session.title || 'Deep Focus Session');
            setIsStrict(session.strictMode ?? true);
            const duration = (session.durationMinutes || initialMinutes) * 60;
            setTotalSeconds(duration);

            const now = Date.now();
            const end = session.endTime || (now + duration * 1000);
            const diffSec = Math.max(0, Math.floor((end - now) / 1000));
            setRemainingSeconds(diffSec);

            if (diffSec <= 0 && onNaturalCompletion) {
              onNaturalCompletion();
            }
          }
        } catch (e) {
          console.warn('Error fetching active session:', e);
        }
      }
    };

    fetchNativeSession();
    const interval = setInterval(fetchNativeSession, 1000);
    return () => clearInterval(interval);
  }, [initialMinutes, onNaturalCompletion]);

  const togglePause = () => {
    setIsRunning(prev => !prev);
  };

  const handleTestBlock = () => {
    setBlockedCount(prev => prev + 1);
    onTriggerBlockedAlert();
  };

  const handleManualEndTap = () => {
    const elapsedSec = Math.max(0, totalSeconds - remainingSeconds);
    onEndSession(elapsedSec, remainingSeconds, blockedCount);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Text style={styles.liveBadge}>● LIVE SESSION</Text>
          {isStrict && <Text style={styles.strictBadge}>STRICT MODE</Text>}
        </View>
        <Text style={styles.sessionTitleText}>{sessionTitle}</Text>
      </View>

      {/* Main Countdown Ring */}
      <FocusTimerDisplay
        secondsRemaining={remainingSeconds}
        totalSeconds={totalSeconds}
        isActive={isRunning}
      />

      {/* Action Controls */}
      <View style={styles.controlsRow}>
        
        <FocusButton
          title="End Session"
          variant="danger"
          onPress={handleManualEndTap}
          style={styles.controlBtn}
        />
      </View>

      {/* Session Metrics Card */}
      <FocusCard style={styles.metricsCard}>
        <View style={styles.metricItem}>
          <Text style={[typography.labelCaps, { color: colors.textMuted }]}>BLOCKED ATTEMPTS</Text>
          <Text style={[typography.headlineMedium, { color: colors.tertiary, marginTop: 4 }]}>
            {blockedCount} Distractions
          </Text>
        </View>
        <FocusButton
          title="Simulate Distraction Block"
          variant="outline"
          size="small"
          onPress={handleTestBlock}
          style={{ marginTop: spacing.sm }}
        />
      </FocusCard>

      {/* Motivational Quote */}
      <FocusCard style={styles.quoteCard} variant="high">
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, fontStyle: 'italic' }]}>
          "Focus is a muscle. The more you protect your attention, the stronger it becomes."
        </Text>
      </FocusCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.containerMargin,
    paddingBottom: 110,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  liveBadge: {
    color: '#4ECCA3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  strictBadge: {
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  sessionTitleText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.md,
    width: '100%',
  },
  controlBtn: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  metricsCard: {
    width: '100%',
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
  },
  quoteCard: {
    width: '100%',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
});
