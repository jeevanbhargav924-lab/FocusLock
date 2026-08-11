import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { spacing } from '../theme';

export type PermissionDisclosureType =
  | 'accessibility'
  | 'usage'
  | 'notification'
  | 'battery';

export interface PermissionDisclosureModalProps {
  visible: boolean;
  type: PermissionDisclosureType | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface DisclosureConfig {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  sections?: {
    header: string;
    bullets: string[];
    isPrivacy?: boolean;
  }[];
  footer?: string;
  secondaryBtnText: string;
  primaryBtnText: string;
}

const DISCLOSURE_CONFIGS: Record<PermissionDisclosureType, DisclosureConfig> = {
  accessibility: {
    icon: '🛡️',
    title: 'Accessibility Access',
    subtitle: 'Help FocusLock block distractions',
    description:
      'FocusLock uses Android\'s Accessibility Service during an active focus session to detect when a selected blocked app is opened. This helps FocusLock enforce your focus session and prevent distractions.',
    sections: [
      {
        header: 'How FocusLock uses this access',
        bullets: [
          'Detect when a selected blocked app is opened',
          'Enforce app blocking during an active focus session',
          'Help keep your focus session running as intended',
        ],
      },
      {
        header: 'Your privacy',
        isPrivacy: true,
        bullets: [
          'No messages or passwords are read',
          'No keystrokes are collected',
          'No screen recordings are made',
          'Accessibility data is not sent to external servers',
        ],
      },
    ],
    footer:
      'Accessibility access is used only for FocusLock\'s distraction-blocking feature. You can disable this access at any time from Android Settings.',
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'I Understand & Continue',
  },
  usage: {
    icon: '🔄',
    title: 'Usage Access',
    subtitle: 'Help FocusLock identify active apps',
    description:
      'FocusLock uses Usage Access during focus sessions to identify which app is currently active and help enforce your distraction-blocking settings.',
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'I Understand & Continue',
  },
  notification: {
    icon: '🔔',
    title: 'Allow Notifications',
    subtitle: 'Stay updated during your focus sessions',
    description:
      'FocusLock uses notifications for focus-session reminders, session status, and completion updates.',
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'Allow Notifications',
  },
  battery: {
    icon: '🔋',
    title: 'Keep Focus Sessions Running',
    subtitle: 'Improve background timer reliability',
    description:
      'Android battery optimization can stop background activity and interrupt your focus session. Allowing FocusLock to run without battery optimization helps your active focus timer continue reliably.',
    footer:
      'This setting is optional but recommended for reliable background sessions.',
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'Open Battery Settings',
  },
};

export const PermissionDisclosureModal: React.FC<
  PermissionDisclosureModalProps
> = ({ visible, type, onClose, onConfirm }) => {
  if (!type || !DISCLOSURE_CONFIGS[type]) {
    return null;
  }

  const config = DISCLOSURE_CONFIGS[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <SafeAreaView style={styles.safeAreaContainer}>
              <View style={styles.container}>
                {/* Header Icon */}
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{config.icon}</Text>
                </View>

                {/* Title & Subtitle */}
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.subtitle}>{config.subtitle}</Text>

                {/* Scrollable Content Container */}
                <ScrollView
                  style={styles.scrollContent}
                  contentContainerStyle={styles.scrollInner}
                  showsVerticalScrollIndicator={true}
                  bounces={false}>
                  <Text style={styles.description}>{config.description}</Text>

                  {/* Dynamic Sections (Bullets) */}
                  {config.sections?.map((sec, idx) => (
                    <View key={idx} style={styles.sectionBlock}>
                      <Text style={styles.sectionHeader}>{sec.header}</Text>
                      {sec.bullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text
                            style={[
                              styles.bulletIcon,
                              sec.isPrivacy && styles.bulletIconPrivacy,
                            ]}>
                            {sec.isPrivacy ? '✓' : '•'}
                          </Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  ))}

                  {/* Footer / Notice */}
                  {config.footer && (
                    <Text style={styles.footerText}>{config.footer}</Text>
                  )}
                </ScrollView>

                {/* Bottom Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.secondaryBtn}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel={config.secondaryBtnText}>
                    <Text style={styles.secondaryBtnText}>
                      {config.secondaryBtnText}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.primaryBtn}
                    onPress={onConfirm}
                    accessibilityRole="button"
                    accessibilityLabel={config.primaryBtnText}>
                    <Text style={styles.primaryBtnText}>
                      {config.primaryBtnText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  safeAreaContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#151A21',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#202632',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#4F8CFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    width: '100%',
    marginBottom: spacing.md,
  },
  scrollInner: {
    paddingVertical: 2,
  },
  description: {
    color: '#C9D1D9',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  sectionBlock: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletIcon: {
    color: '#4F8CFF',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
    lineHeight: 18,
  },
  bulletIconPrivacy: {
    color: '#3FB950',
  },
  bulletText: {
    flex: 1,
    color: '#8B949E',
    fontSize: 12.5,
    lineHeight: 18,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 11.5,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryBtnText: {
    color: '#C9D1D9',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.4,
    backgroundColor: '#4F8CFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
