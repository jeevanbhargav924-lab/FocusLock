import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface FocusTimerDisplayProps {
  secondsRemaining: number;
  totalSeconds: number;
  label?: string;
  isActive?: boolean;
}

export const FocusTimerDisplay: React.FC<FocusTimerDisplayProps> = ({
  secondsRemaining,
  totalSeconds,
  label = 'DEEP WORK SESSION',
  isActive = false,
}) => {
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(mins)}:${pad(secs)}`;
  };

  const progressPercent = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.outerRing, isActive && styles.outerRingActive]}>
        <View style={styles.innerCircle}>
          <Text style={[typography.labelCaps, { color: colors.primaryLight, marginBottom: spacing.xs }]}>
            {label}
          </Text>
          <Text style={[typography.timerLarge, { color: colors.textPrimary }]}>
            {formatTime(secondsRemaining)}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {`${Math.round(progressPercent)}% Remaining`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  outerRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
  },
  outerRingActive: {
    borderColor: colors.secondary,
  },
  innerCircle: {
    width: 216,
    height: 216,
    borderRadius: 108,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
});
