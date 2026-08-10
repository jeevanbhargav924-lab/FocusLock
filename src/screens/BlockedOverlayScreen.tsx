import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, fonts } from '../theme';
import { FocusButton } from '../components/FocusButton';
import { FocusCard } from '../components/FocusCard';
import { getRandomMotivationalQuote } from '../utils/quotes';

interface BlockedOverlayScreenProps {
  appName?: string;
  sessionTitle?: string;
  remainingTimeText?: string;
  onDismiss: () => void;
}

export const BlockedOverlayScreen: React.FC<BlockedOverlayScreenProps> = ({
  appName = 'Instagram',
  sessionTitle = 'Deep Focus Session',
  remainingTimeText = '21:45 Remaining',
  onDismiss,
}) => {
  const quote = useMemo(() => getRandomMotivationalQuote(), []);

  return (
    <View style={styles.container}>
      <View style={styles.shieldIconContainer}>
        <Text style={styles.shieldIcon}>🔒</Text>
      </View>

      <Text style={[typography.labelCaps, { color: colors.error, marginBottom: spacing.xs }]}>
        ACCESS RESTRICTED
      </Text>
      <Text style={[typography.displayLarge, { color: colors.textPrimary, textAlign: 'center' }]}>
        {appName} is Locked
      </Text>

      {/* Focus Goal Card */}
      <FocusCard style={styles.goalCard} variant="surface">
        <Text style={styles.cardHeaderLabel}>🎯 YOUR FOCUS GOAL</Text>
        <Text style={styles.goalTitle}>{sessionTitle || 'Deep Focus Session'}</Text>
      </FocusCard>

      {/* Motivational Quote / Quest Card */}
      <FocusCard style={styles.quoteCard} variant="high">
        <Text style={styles.quoteHeaderLabel}>💡 WHY IT'S BLOCKED</Text>
        <Text style={styles.quoteText}>"{quote}"</Text>
      </FocusCard>

      {/* Timer Info Card */}
      <FocusCard style={styles.infoCard} variant="high">
        <Text style={[typography.headlineSmall, { color: colors.secondary, textAlign: 'center' }]}>
          {remainingTimeText}
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
          ]}>
          Distraction blocked automatically by FocusLock
        </Text>
      </FocusCard>

      <FocusButton
        title="Return to Deep Work"
        variant="primary"
        size="large"
        onPress={onDismiss}
        style={styles.returnButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.containerMargin,
  },
  shieldIconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  shieldIcon: {
    fontSize: 32,
  },
  goalCard: {
    width: '100%',
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardHeaderLabel: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  goalTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  quoteCard: {
    width: '100%',
    marginTop: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  quoteHeaderLabel: {
    fontFamily: fonts.bold,
    color: colors.tertiary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  quoteText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoCard: {
    width: '100%',
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  returnButton: {
    width: '100%',
  },
});

