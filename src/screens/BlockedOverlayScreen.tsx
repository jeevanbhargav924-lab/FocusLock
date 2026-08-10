import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { FocusButton } from '../components/FocusButton';
import { FocusCard } from '../components/FocusCard';

interface BlockedOverlayScreenProps {
  appName?: string;
  onDismiss: () => void;
}

export const BlockedOverlayScreen: React.FC<BlockedOverlayScreenProps> = ({
  appName = 'Instagram',
  onDismiss,
}) => {
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
      <Text
        style={[
          typography.bodyLarge,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, marginHorizontal: spacing.md },
        ]}>
        You have an active Focus Session running. Stay on track!
      </Text>

      <FocusCard style={styles.infoCard} variant="high">
        <Text style={[typography.headlineSmall, { color: colors.secondary, textAlign: 'center' }]}>
          21:45 Remaining
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
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  shieldIcon: {
    fontSize: 36,
  },
  infoCard: {
    width: '100%',
    marginVertical: spacing.xl,
    padding: spacing.lg,
  },
  returnButton: {
    width: '100%',
  },
});
