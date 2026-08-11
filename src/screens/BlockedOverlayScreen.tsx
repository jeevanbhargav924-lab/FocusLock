import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts } from '../theme';
import { getRandomMotivationalQuote } from '../utils/quotes';

interface BlockedOverlayScreenProps {
  appName?: string;
  sessionTitle?: string;
  remainingTimeText?: string;
  onDismiss: () => void;
}

export const BlockedOverlayScreen: React.FC<BlockedOverlayScreenProps> = ({
  appName = 'Google',
  sessionTitle = 'Study',
  remainingTimeText = '00:00:02',
  onDismiss,
}) => {
  const quote = useMemo(() => getRandomMotivationalQuote(), []);

  // Format timer text to render red colons matching reference design
  const renderFormattedTimer = (timeStr: string) => {
    const cleaned = timeStr.replace(/[^0-9:]/g, '').trim();
    const parts = cleaned.split(':');
    if (parts.length === 3) {
      return (
        <Text style={styles.timerText}>
          {parts[0]}
          <Text style={styles.redColon}>:</Text>
          {parts[1]}
          <Text style={styles.redColon}>:</Text>
          {parts[2]}
        </Text>
      );
    } else if (parts.length === 2) {
      return (
        <Text style={styles.timerText}>
          00
          <Text style={styles.redColon}>:</Text>
          {parts[0]}
          <Text style={styles.redColon}>:</Text>
          {parts[1]}
        </Text>
      );
    }
    return <Text style={styles.timerText}>{cleaned || '00:00:00'}</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070A10" />

      <View style={styles.content}>
        {/* Glowing Lock Circles Graphic */}
        <View style={styles.lockGraphicContainer}>
          <View style={styles.outerRing3}>
            <View style={styles.outerRing2}>
              <View style={styles.glowingRedRing}>
                <View style={styles.innerDarkCircle}>
                  <Text style={styles.lockEmoji}>🔒</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Access Restricted Header */}
        <Text style={styles.accessRestrictedLabel}>ACCESS RESTRICTED</Text>
        <Text style={styles.appLockedTitle}>{appName} is Locked</Text>

        {/* Focus Goal Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.goalHeaderLabel}>🎯 YOUR FOCUS GOAL</Text>
          <Text style={styles.goalTitleText}>
            {sessionTitle || 'Deep Focus Session'}
          </Text>
        </View>

        {/* Why It's Blocked Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.whyHeaderLabel}>💡 WHY IT'S BLOCKED</Text>
          <Text style={styles.quoteBodyText}>
            "{quote || 'You are in control of your attention. Stay focused and finish strong!'}"
          </Text>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
          <Text style={styles.remainingTimeLabel}>REMAINING SESSION TIME</Text>
          {renderFormattedTimer(remainingTimeText)}

          {/* Stay Focused Pill Badge */}
          <View style={styles.stayFocusedPill}>
            <Text style={styles.stayFocusedPillText}>
              ⏱ Stay focused. You've got this!
            </Text>
          </View>
        </View>

        {/* Bottom CTA Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.readyButton}
          onPress={onDismiss}>
          <Text style={styles.readyButtonText}>🚀 I'M READY TO FOCUS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A10',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Lock Graphic Circles */
  lockGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  outerRing3: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing2: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowingRedRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3.5,
    borderColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  innerDarkCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0E1420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 48,
  },

  /* Header Labels */
  accessRestrictedLabel: {
    color: '#FF5252',
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 1.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  appLockedTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 20,
  },

  /* Cards */
  cardContainer: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  goalHeaderLabel: {
    color: '#818CF8',
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'center',
  },
  goalTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  whyHeaderLabel: {
    color: '#F59E0B',
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'center',
  },
  quoteBodyText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Timer Section */
  timerSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  remainingTimeLabel: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  redColon: {
    color: '#FF5252',
  },
  stayFocusedPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
  },
  stayFocusedPillText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontFamily: fonts.regular,
  },

  /* Bottom Button */
  readyButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  readyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
});
