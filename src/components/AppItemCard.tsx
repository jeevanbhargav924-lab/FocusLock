import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface AppItemCardProps {
  name: string;
  category: string;
  iconText: string;
  isAllowed: boolean;
  onToggle: (newValue: boolean) => void;
}

export const AppItemCard: React.FC<AppItemCardProps> = ({
  name,
  category,
  iconText,
  isAllowed,
  onToggle,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{iconText}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={[typography.headlineSmall, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[typography.bodySmall, { color: colors.textMuted }]}>{category}</Text>
      </View>
      <Switch
        value={isAllowed}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceHigh, true: colors.primaryContainer }}
        thumbColor={isAllowed ? colors.primary : colors.textMuted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
  },
});
