import { TextStyle } from 'react-native';
import { fonts } from './fonts';

export const typography: Record<string, TextStyle> = {
  // Monolithic countdown timer (e.g. 25:00)
  timerLarge: {
    fontFamily: fonts.medium,
    fontSize: 64,
    letterSpacing: -1.5,
    lineHeight: 72,
  },
  
  // Display headers
  displayLarge: {
    fontFamily: fonts.bold,
    fontSize: 36,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  displayMedium: {
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  
  // Headlines
  headlineMedium: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headlineSmall: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Label / Caps
  labelCaps: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelButton: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
};
