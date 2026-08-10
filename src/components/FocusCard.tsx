import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface FocusCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[] | any;
  variant?: 'surface' | 'high' | 'bright';
  active?: boolean;
}

export const FocusCard: React.FC<FocusCardProps> = ({
  children,
  style,
  variant = 'surface',
  active = false,
}) => {
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'high':
        return colors.surfaceHigh;
      case 'bright':
        return colors.surfaceBright;
      case 'surface':
      default:
        return colors.surface;
    }
  };

  return (
    <View
      style={[
        styles.cardBase,
        { backgroundColor: getBackgroundColor() },
        active && styles.activeBorder,
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeBorder: {
    borderColor: colors.borderActive,
  },
});
