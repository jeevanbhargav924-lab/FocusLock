import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { fonts } from '../theme';
import { MotivationalVideoPlayer } from '../components/MotivationalVideoPlayer';
import { getRandomMotivationalVideo } from '../utils/motivationalVideos';

interface BlockedOverlayScreenProps {
  appName?: string;
  sessionTitle?: string;
  remainingTimeText?: string;
  onDismiss: () => void;
}

export const BlockedOverlayScreen: React.FC<BlockedOverlayScreenProps> = ({
  appName = 'Google',
  sessionTitle = 'Study',
  remainingTimeText = '00:00:00',
  onDismiss,
}) => {
  const selectedVideo = useMemo(() => getRandomMotivationalVideo(), []);

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Header Title Bar */}
        <View style={styles.header}>
          <Text style={styles.accessRestrictedLabel}>ACCESS RESTRICTED</Text>
          <Text style={styles.appLockedTitle}>{appName} is Locked</Text>
          <View style={styles.goalChip}>
            <Text style={styles.goalChipText}>🎯 {sessionTitle || 'Deep Focus Session'}</Text>
          </View>
        </View>

        {/* Motivational Video Player with Hindi Audio and Subtitles */}
        <MotivationalVideoPlayer videoItem={selectedVideo} />

        {/* Remaining Session Time Section */}
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

        {/* Prominent Back to Focus Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.readyButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Back to Focus">
          <Text style={styles.readyButtonText}>🚀 BACK TO FOCUS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A10',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  accessRestrictedLabel: {
    color: '#FF5252',
    fontSize: 11.5,
    fontFamily: fonts.bold,
    letterSpacing: 1.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  appLockedTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  goalChip: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
  },
  goalChipText: {
    color: '#818CF8',
    fontSize: 12,
    fontFamily: fonts.bold,
  },

  /* Timer Section */
  timerSection: {
    alignItems: 'center',
    marginVertical: 14,
    width: '100%',
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
    fontSize: 38,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  redColon: {
    color: '#FF5252',
  },
  stayFocusedPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  stayFocusedPillText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontFamily: fonts.regular,
  },

  /* Bottom Button */
  readyButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    letterSpacing: 0.6,
  },
});
