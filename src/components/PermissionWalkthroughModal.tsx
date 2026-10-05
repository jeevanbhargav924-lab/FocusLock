import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { spacing, radius, colors } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type WalkthroughType = 'accessibility' | 'usage' | 'battery';

interface PermissionWalkthroughModalProps {
  visible: boolean;
  initialType?: WalkthroughType;
  onClose: () => void;
  onOpenSettings?: (type: WalkthroughType) => void;
}

interface StepItem {
  title: string;
  desc: string;
  tip?: string;
  image: any;
}

interface WalkthroughSection {
  type: WalkthroughType;
  title: string;
  badge: string;
  icon: string;
  steps: StepItem[];
}

const SECTIONS: Record<WalkthroughType, WalkthroughSection> = {
  accessibility: {
    type: 'accessibility',
    title: 'Accessibility Service',
    badge: 'Step-by-Step Guide',
    icon: '🛡️',
    steps: [
      {
        title: '1. Scroll to "Downloaded apps"',
        desc: 'Android opens the main Accessibility page. Scroll down towards the bottom past system controls until you see "Downloaded apps" (or "Installed services").',
        tip: '💡 On Samsung, Xiaomi, Realme, and Pixel devices, Focus Lock is listed under Downloaded apps.',
        image: require('../../assets/images/guide_accessibility_step1.png'),
      },
      {
        title: '2. Select "Focus Lock" & Turn ON',
        desc: 'Tap "Focus Lock" in the list and toggle the switch at the top to ON.',
        tip: '💡 Focus Lock only uses this locally to detect blocked apps during active sessions.',
        image: require('../../assets/images/guide_accessibility_step2.png'),
      },
      {
        title: '3. Tap "Allow" to Confirm',
        desc: 'Android will show a confirmation dialog asking to allow Focus Lock. Tap "Allow" to finish setup.',
        tip: '🔒 Focus Lock works 100% offline. Zero messages, passwords, or personal data are ever read or collected.',
        image: require('../../assets/images/guide_accessibility_step3.png'),
      },
    ],
  },
  usage: {
    type: 'usage',
    title: 'Usage Access',
    badge: 'Apps List Guide',
    icon: '🔄',
    steps: [
      {
        title: 'Find Focus Lock & Turn ON',
        desc: 'In the Usage Access settings, scroll through the list of apps until you find "Focus Lock". Tap it and turn ON "Permit usage access".',
        tip: '💡 This allows Focus Lock to measure your productive focus session time locally.',
        image: require('../../assets/images/guide_usage_clean.png'),
      },
    ],
  },
  battery: {
    type: 'battery',
    title: 'Battery Optimization',
    badge: 'Background Timer',
    icon: '🔋',
    steps: [
      {
        title: 'Select "Unrestricted"',
        desc: 'Under "Allow background usage", select "Unrestricted" so Android battery saver does not stop your focus timer in the background.',
        tip: '💡 Setting this ensures your focus session timer runs without interruption when screen is off.',
        image: require('../../assets/images/guide_battery_clean.png'),
      },
    ],
  },
};

export const PermissionWalkthroughModal: React.FC<
  PermissionWalkthroughModalProps
> = ({ visible, initialType = 'accessibility', onClose, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<WalkthroughType>(initialType);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (visible && initialType) {
      setActiveTab(initialType);
      setCurrentStepIndex(0);
    }
  }, [visible, initialType]);

  const handleTabChange = (type: WalkthroughType) => {
    setActiveTab(type);
    setCurrentStepIndex(0);
  };

  const currentSection = SECTIONS[activeTab] || SECTIONS.accessibility;
  const currentStep = currentSection.steps[currentStepIndex] || currentSection.steps[0];
  const totalSteps = currentSection.steps.length;

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.modalRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
        <View style={styles.container}>
          {/* Top Bar Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Text style={styles.headerIconText}>📺</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Settings Visual Guide</Text>
                <Text style={styles.headerSubtitle}>
                  Device walkthrough & instructions
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close guide">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'accessibility' && styles.tabBtnActive]}
              onPress={() => handleTabChange('accessibility')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'accessibility' && styles.tabBtnTextActive,
                ]}>
                🛡️ Accessibility
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'usage' && styles.tabBtnActive]}
              onPress={() => handleTabChange('usage')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'usage' && styles.tabBtnTextActive,
                ]}>
                🔄 Usage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'battery' && styles.tabBtnActive]}
              onPress={() => handleTabChange('battery')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'battery' && styles.tabBtnTextActive,
                ]}>
                🔋 Battery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Indicator (if more than 1 step) */}
          {totalSteps > 1 && (
            <View style={styles.stepperContainer}>
              {currentSection.steps.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.stepPill,
                    currentStepIndex === idx && styles.stepPillActive,
                  ]}
                  onPress={() => setCurrentStepIndex(idx)}>
                  <Text
                    style={[
                      styles.stepPillText,
                      currentStepIndex === idx && styles.stepPillTextActive,
                    ]}>
                    Step {idx + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Scrollable Main Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Step Card */}
            <View style={styles.stepInfoCard}>
              <View style={styles.stepBadgeRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>
                    {totalSteps > 1 ? `Step ${currentStepIndex + 1} of ${totalSteps}` : 'Quick Guide'}
                  </Text>
                </View>
                <Text style={styles.sectionBadgeText}>{currentSection.badge}</Text>
              </View>

              <Text style={styles.stepTitle}>{currentStep.title}</Text>
              <Text style={styles.stepDesc}>{currentStep.desc}</Text>

              {currentStep.tip && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>{currentStep.tip}</Text>
                </View>
              )}
            </View>

            {/* Screenshot Frame */}
            <View style={styles.screenshotFrame}>
              <View style={styles.screenshotMockupHeader}>
                <View style={styles.mockupCameraDot} />
                <Text style={styles.mockupLabel}>Android Settings Preview</Text>
              </View>
              <Image
                source={currentStep.image}
                style={styles.screenshotImage}
                resizeMode="contain"
              />
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footerContainer}>
            {totalSteps > 1 && (
              <View style={styles.stepNavRow}>
                <TouchableOpacity
                  style={[
                    styles.stepNavBtn,
                    currentStepIndex === 0 && styles.stepNavBtnDisabled,
                  ]}
                  disabled={currentStepIndex === 0}
                  onPress={handlePrevStep}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.stepNavBtnText,
                      currentStepIndex === 0 && styles.stepNavBtnTextDisabled,
                    ]}>
                    ← Previous Step
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.stepNavBtn,
                    currentStepIndex === totalSteps - 1 && styles.stepNavBtnDisabled,
                  ]}
                  disabled={currentStepIndex === totalSteps - 1}
                  onPress={handleNextStep}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.stepNavBtnText,
                      currentStepIndex === totalSteps - 1 && styles.stepNavBtnTextDisabled,
                    ]}>
                    Next Step →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {onOpenSettings && (
              <TouchableOpacity
                style={styles.openSettingsBtn}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onOpenSettings(activeTab);
                }}>
                <Text style={styles.openSettingsBtnText}>
                  Open {currentSection.title} Settings ➔
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingTop: 8,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E2530',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIconText: {
    fontSize: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8B949E',
    fontSize: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnText: {
    color: '#C9D1D9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#A855F7',
  },
  tabBtnText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs + 4,
    gap: 8,
    backgroundColor: '#11151C',
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#1C2128',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepPillActive: {
    backgroundColor: '#A855F7',
    borderColor: '#C084FC',
  },
  stepPillText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '600',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  stepInfoCard: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  stepNumberBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  stepNumberText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionBadgeText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '500',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  stepDesc: {
    color: '#C9D1D9',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: spacing.xs + 2,
  },
  tipBox: {
    backgroundColor: 'rgba(79, 140, 255, 0.08)',
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.2)',
    marginTop: 6,
  },
  tipText: {
    color: '#79B8FF',
    fontSize: 12,
    lineHeight: 17,
  },
  screenshotFrame: {
    width: Math.min(SCREEN_WIDTH - 32, 340),
    backgroundColor: '#000000',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#30363D',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  mockupCameraDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30363D',
    marginRight: 6,
  },
  mockupLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '600',
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 6,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  screenshotMockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 7,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  screenshotImage: {
    width: Math.min(SCREEN_WIDTH - 36, 336),
    height: Math.min((SCREEN_WIDTH - 36) * 1.75, 480),
    backgroundColor: '#FFFFFF',
  },
  footerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs + 4,
    paddingBottom: spacing.md,
    backgroundColor: '#161B22',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  stepNavRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNavBtn: {
    flex: 1,
    backgroundColor: '#21262D',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepNavBtnDisabled: {
    opacity: 0.4,
  },
  stepNavBtnText: {
    color: '#C9D1D9',
    fontSize: 12.5,
    fontWeight: '700',
  },
  stepNavBtnTextDisabled: {
    color: '#484F58',
  },
  openSettingsBtn: {
    backgroundColor: '#A855F7',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  openSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
