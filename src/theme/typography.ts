import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  // Monolithic countdown timer (e.g. 25:00)
  timerLarge: {
    fontSize: 64,
    fontWeight: '300',
    letterSpacing: -1.5,
    lineHeight: 72,
  },
  
  // Display headers
  displayLarge: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  
  // Headlines
  headlineMedium: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  
  // Label / Caps
  labelCaps: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelButton: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
};
