import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, fonts } from '../theme';

interface FocusButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'inverted';
  size?: 'normal' | 'large' | 'small';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const FocusButton: React.FC<FocusButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'normal',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'inverted':
        return {
          backgroundColor: colors.textPrimary,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: '#8B98FF',
        };
      case 'danger':
        return {
          backgroundColor: colors.errorContainer,
          borderWidth: 1,
          borderColor: colors.error,
        };
      case 'primary':
      default:
        return {
          backgroundColor: '#9DA9FF', // Soft light lavender-periwinkle
          borderColor: 'transparent',
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'secondary':
        return colors.textPrimary;
      case 'inverted':
        return colors.background;
      case 'outline':
        return '#9DA9FF';
      case 'danger':
        return colors.error;
      case 'primary':
      default:
        return '#1E1B4B'; // Deep dark navy indigo text
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { height: 42, paddingHorizontal: spacing.md };
      case 'large':
        return { height: 58, paddingHorizontal: spacing.xl };
      case 'normal':
      default:
        return { height: 50, paddingHorizontal: spacing.lg };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        getButtonStyle(),
        getSizeStyle(),
        variant === 'primary' && styles.primaryGlowShadow,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.buttonText,
              { color: getTextColor() },
              icon ? { marginLeft: spacing.xs } : null,
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 18, // Rounded rectangle matching Stitch design image
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryGlowShadow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
