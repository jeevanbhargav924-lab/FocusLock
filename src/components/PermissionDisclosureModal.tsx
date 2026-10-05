import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  SafeAreaView,
  Image,
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
  onOpenWalkthrough?: (type: PermissionDisclosureType) => void;
}

interface StepInstruction {
  num: number;
  title: string;
  tip?: string;
}

interface DisclosureConfig {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  steps?: StepInstruction[];
  previewImage?: any;
  previewCaption?: string;
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
    steps: [
      {
        num: 1,
        title: 'Scroll down to "Downloaded apps" (or Installed services)',
        tip: 'Android puts Focus Lock at the bottom of the list',
      },
      {
        num: 2,
        title: 'Tap "Focus Lock" and switch the toggle to ON',
      },
      {
        num: 3,
        title: 'Tap "Allow" on the system confirmation prompt',
      },
    ],
    previewImage: require('../../assets/images/guide_accessibility_step1.png'),
    previewCaption: 'Find "Downloaded apps" at the bottom of Accessibility settings',
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
        header: 'Your privacy (100% Offline)',
        isPrivacy: true,
        bullets: [
          'No messages or passwords are read',
          'No keystrokes are collected',
          'No screen recordings are made',
          'Zero data sent to external servers',
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
    steps: [
      {
        num: 1,
        title: 'Find "Focus Lock" in the alphabetical app list',
      },
      {
        num: 2,
        title: 'Tap it and switch "Permit usage access" to ON',
      },
    ],
    previewImage: require('../../assets/images/guide_usage_clean.png'),
    previewCaption: 'Toggle ON "Permit usage access" in Android Settings',
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'I Understand & Continue',
  },
  notification: {
    icon: '🔔',
    title: 'Allow Notifications',
    subtitle: 'Stay updated during your focus sessions',
    description:
      'FocusLock uses notifications for focus-session reminders, session status, and completion updates.',
    steps: [
      {
        num: 1,
        title: 'Tap "Allow" on the notification permission prompt',
      },
    ],
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'Allow Notifications',
  },
  battery: {
    icon: '🔋',
    title: 'Keep Focus Sessions Running',
    subtitle: 'Improve background timer reliability',
    description:
      'Android battery optimization can stop background activity and interrupt your focus session. Allowing FocusLock to run without battery optimization helps your active focus timer continue reliably.',
    steps: [
      {
        num: 1,
        title: 'In background usage settings, select "Unrestricted"',
        tip: 'Prevents Android from stopping your timer when the screen turns off',
      },
    ],
    previewImage: require('../../assets/images/guide_battery_clean.png'),
    previewCaption: 'Select "Unrestricted" in Allow background usage',
    footer:
      'This setting is optional but recommended for reliable background sessions.',
    secondaryBtnText: 'Not Now',
    primaryBtnText: 'Open Battery Settings',
  },
};

export const PermissionDisclosureModal: React.FC<
  PermissionDisclosureModalProps
> = ({ visible, type, onClose, onConfirm, onOpenWalkthrough }) => {
  const [showScreenshot, setShowScreenshot] = useState<boolean>(false);

  if (!type || !DISCLOSURE_CONFIGS[type]) {
    return null;
  }

  const config = DISCLOSURE_CONFIGS[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
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

                  {/* Step-by-Step Guidance Box */}
                  {config.steps && config.steps.length > 0 && (
                    <View style={styles.stepsCard}>
                      <View style={styles.stepsHeaderRow}>
                        <Text style={styles.stepsHeaderTitle}>
                          👉 What to do in Android Settings:
                        </Text>
                        {onOpenWalkthrough && type !== 'notification' && (
                          <TouchableOpacity
                            onPress={() => {
                              onClose();
                              onOpenWalkthrough(type);
                            }}
                            activeOpacity={0.7}
                            style={styles.viewGuideBadge}>
                            <Text style={styles.viewGuideBadgeText}>
                              📺 Visual Guide
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {config.steps.map(step => (
                        <View key={step.num} style={styles.stepItemRow}>
                          <View style={styles.stepNumCircle}>
                            <Text style={styles.stepNumText}>{step.num}</Text>
                          </View>
                          <View style={styles.stepContent}>
                            <Text style={styles.stepItemTitle}>{step.title}</Text>
                            {step.tip && (
                              <Text style={styles.stepItemTip}>{step.tip}</Text>
                            )}
                          </View>
                        </View>
                      ))}

                      {/* Expandable Screenshot Preview Button */}
                      {config.previewImage && (
                        <View style={styles.previewContainer}>
                          <TouchableOpacity
                            style={styles.togglePreviewBtn}
                            activeOpacity={0.7}
                            onPress={() => setShowScreenshot(!showScreenshot)}>
                            <Text style={styles.togglePreviewBtnText}>
                              {showScreenshot
                                ? '▲ Hide Settings Screenshot'
                                : '📸 Show Settings Screenshot Preview'}
                            </Text>
                          </TouchableOpacity>

                          {showScreenshot && (
                            <View style={styles.previewImageBox}>
                              <Image
                                source={config.previewImage}
                                style={styles.previewImage}
                                resizeMode="contain"
                              />
                              {config.previewCaption && (
                                <Text style={styles.previewCaptionText}>
                                  {config.previewCaption}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    maxWidth: 410,
    maxHeight: '88%',
    backgroundColor: '#151A21',
    borderRadius: 24,
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md + 4,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#202632',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#5C8EF2',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm + 2,
  },
  scrollContent: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  scrollInner: {
    paddingVertical: 2,
  },
  description: {
    color: '#C9D1D9',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  stepsCard: {
    backgroundColor: 'rgba(92, 142, 242, 0.07)',
    borderRadius: 14,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(92, 142, 242, 0.22)',
  },
  stepsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepsHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  viewGuideBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  viewGuideBadgeText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  stepNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5C8EF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepItemTitle: {
    color: '#F0F6FC',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  stepItemTip: {
    color: '#8B949E',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  previewContainer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  togglePreviewBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  togglePreviewBtnText: {
    color: '#8EAEFF',
    fontSize: 12,
    fontWeight: '600',
  },
  previewImageBox: {
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
  },
  previewCaptionText: {
    color: '#8B949E',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
    lineHeight: 17,
  },
  bulletIconPrivacy: {
    color: '#3FB950',
  },
  bulletText: {
    flex: 1,
    color: '#8B949E',
    fontSize: 12,
    lineHeight: 17,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginTop: spacing.xs,
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
    backgroundColor: '#5C8EF2',
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
