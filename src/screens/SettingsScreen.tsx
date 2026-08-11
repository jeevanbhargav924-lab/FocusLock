import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Image,
  Alert,
  NativeModules,
  Platform,
  Modal,
} from 'react-native';
import { spacing, fonts, colors } from '../theme';
import { PasscodeModal } from '../components/PasscodeModal';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { TermsOfUseScreen } from './TermsOfUseScreen';
import { HelpSupportScreen } from './HelpSupportScreen';
import { AboutAppScreen } from './AboutAppScreen';

import { Toast } from '../components/Toast';
import { AboutIcon, EmergencyLimitIcon, EmergencyPinIcon, HelpAndSupportIcon, PrivacyPolicyIcon, SettingsIcon, TermAndConditionIcon } from '../utils/Icons';

interface SettingsScreenProps {
  onBack?: () => void;
  onSignOut?: () => void;
  onLogin?: () => void;
  isGuest?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onSignOut,
  onLogin,
  isGuest = false,
}) => {
  // const [darkMode, setDarkMode] = useState<boolean>(true);
  // const [biometricUnlock, setBiometricUnlock] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [dailyLimit, setDailyLimit] = useState<number>(5);
  const [dailyRemaining, setDailyRemaining] = useState<number>(5);
  const [isLimitLocked, setIsLimitLocked] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [passcodeMode, setPasscodeMode] = useState<'setup' | 'verify'>('verify');

  useEffect(() => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule) {
      if (NativeModules.PermissionModule.getMaxDailyChanges) {
        NativeModules.PermissionModule.getMaxDailyChanges()
          .then((max: number) => {
            setDailyLimit(max);
          })
          .catch(() => {});
      }
      if (NativeModules.PermissionModule.getDailyChangesRemaining) {
        NativeModules.PermissionModule.getDailyChangesRemaining()
          .then((rem: number) => {
            setDailyRemaining(rem);
          })
          .catch(() => {});
      }
      if (NativeModules.PermissionModule.isDailyLimitLocked) {
        NativeModules.PermissionModule.isDailyLimitLocked()
          .then((locked: boolean) => {
            setIsLimitLocked(locked);
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleChangeDailyLimit = () => {
    if (isLimitLocked) {
      Toast.warning('Limit Locked 🔒', 'Your Daily Emergency Limit is locked and cannot be changed.');
      return;
    }

    Alert.alert(
      'Daily Emergency Limit ⚙️',
      'Select maximum allowed session ends / rule changes per day:',
      [
        {
          text: '0 (Strict 0 Limits)',
          onPress: () => confirmAndLockLimit(0),
        },
        {
          text: '3 Changes / Day',
          onPress: () => confirmAndLockLimit(3),
        },
        {
          text: '5 Changes / Day',
          onPress: () => confirmAndLockLimit(5),
        },
        {
          text: 'No Limit (Unlimited)',
          onPress: () => confirmAndLockLimit(-1),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmAndLockLimit = (selectedLimit: number) => {
    let limitLabel = `${selectedLimit} Changes / Day`;
    if (selectedLimit === 0) limitLabel = '0 (Strict 0 Limits)';
    if (selectedLimit === -1) limitLabel = 'No Limit (Unlimited)';

    Alert.alert(
      'Lock Daily Emergency Limit 🔒',
      `Are you sure you want to set your daily limit to "${limitLabel}"?\n\nONCE CONFIRMED, THIS LIMIT CANNOT BE EDITED OR CHANGED!`,
      [
        { text: 'Edit / Cancel', style: 'cancel' },
        {
          text: 'Confirm & Lock',
          style: 'destructive',
          onPress: async () => {
            setDailyLimit(selectedLimit);
            setIsLimitLocked(true);
            Toast.success('Limit Locked 🔒', `Daily emergency limit set to ${limitLabel}`);
            if (Platform.OS === 'android' && NativeModules.PermissionModule?.setMaxDailyChanges) {
              try {
                await NativeModules.PermissionModule.setMaxDailyChanges(selectedLimit, true);
              } catch (e) {
                console.warn('Error saving locked limit:', e);
              }
            }
          },
        },
      ]
    );
  };

 

  const handleEmergencyUnlock = () => {
    setPasscodeMode('verify');
    setShowPasscodeModal(true);
  };

  const handleHelpSupport = () => {
    setShowSupportModal(true);
  };

  const handleAbout = () => {
    setShowAboutModal(true);
  };

  // const handleConfirmSignOut = () => {
  //   Alert.alert(
  //     'Sign Out',
  //     'Are you sure you want to sign out?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Sign Out',
  //         style: 'destructive',
  //         onPress: () => {
  //           if (onSignOut) onSignOut();
  //         },
  //       },
  //     ]
  //   );
  // };

  const renderLimitLabel = () => {
    if (dailyLimit === -1) return isLimitLocked ? '🔒 Locked (No Limit)' : 'No Limit';
    if (dailyLimit === 0) return isLimitLocked ? '🔒 Locked (0 Limits Allowed)' : '0 (Strict 0 Limits)';
    const text = `${dailyLimit} / Day (${dailyRemaining} left today)`;
    return isLimitLocked ? `🔒 Locked (${text})` : text;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar with App Logo */}
      <View style={styles.topBar}>
        <View style={styles.headerLeftGroup}>
          <Image
            source={require('../../assets/images/appIcon.png')}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.brandTitle}>Settings</Text>
            <Text style={styles.brandSubtitle}>Manage your app preferences and security.</Text>
          </View>
        </View>
      </View>

      {/* SECURITY & PROTECTION SECTION */}
      <Text style={styles.sectionHeaderLabel}>SECURITY & PROTECTION</Text>
      <View style={styles.groupCard}>
        {/* Daily Emergency Limit */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleChangeDailyLimit}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconBadge, { backgroundColor: '#24152F' }]}>
              <EmergencyLimitIcon color="#C084FC" width={20} height={20} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Daily Emergency Limit</Text>
              <Text style={styles.lockedValText}>
                {isLimitLocked ? `🔒 Locked (${dailyLimit} / Day)` : `${dailyLimit} / Day`}
              </Text>
              <Text style={styles.subtextLabel}>
                {dailyRemaining} left today
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Emergency PIN Unlock */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleEmergencyUnlock}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconBadge, { backgroundColor: '#151C2E' }]}>
              <EmergencyPinIcon color="#60A5FA" width={20} height={20} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Emergency PIN Unlock</Text>
              <Text style={styles.subtextLabel}>Set or change your PIN</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ABOUT & SUPPORT SECTION */}
      <Text style={styles.sectionHeaderLabel}>ABOUT & SUPPORT</Text>
      <View style={styles.groupCard}>
        {/* Help & Support */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleHelpSupport}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconBadge, { backgroundColor: '#102E23' }]}>
              <HelpAndSupportIcon color="#10B981" width={20} height={20} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.subtextLabel}>Get help and answers</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* About FocusLock */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleAbout}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconBadge, { backgroundColor: '#122238' }]}>
              <AboutIcon color="#3B82F6" width={20} height={20} />
            </View>
            <View>
              <Text style={styles.settingLabel}>About FocusLock</Text>
              <Text style={styles.subtextLabel}>Learn more about us</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Privacy Policy */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={() => setShowPrivacyModal(true)}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconBadge, { backgroundColor: '#24152F' }]}>
              <PrivacyPolicyIcon color="#A855F7" width={20} height={20} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.subtextLabel}>How we protect your data</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Terms of Use */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={() => setShowTermsModal(true)}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconBadge, { backgroundColor: '#2B2312' }]}>
              <TermAndConditionIcon color="#F59E0B" width={20} height={20} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Terms of Use</Text>
              <Text style={styles.subtextLabel}>Read our terms and conditions</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Passcode Authorization Modal */}
      <PasscodeModal
        visible={showPasscodeModal}
        mode={passcodeMode}
        onSuccess={() => {
          setShowPasscodeModal(false);
          Alert.alert(
            'Emergency Validation Passed',
            'Emergency session override unlocked.',
          );
        }}
        onCancel={() => setShowPasscodeModal(false)}
      />

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <PrivacyPolicyScreen onBack={() => setShowPrivacyModal(false)} />
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showSupportModal}
        animationType="slide"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <HelpSupportScreen onBack={() => setShowSupportModal(false)} />
      </Modal>

      {/* About FocusLock Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <AboutAppScreen
          onBack={() => setShowAboutModal(false)}
          onOpenPrivacyPolicy={() => {
            setShowAboutModal(false);
            setShowPrivacyModal(true);
          }}
          onOpenTermsOfUse={() => {
            setShowAboutModal(false);
            setShowTermsModal(true);
          }}
        />
      </Modal>

      {/* Terms of Use Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <TermsOfUseScreen onBack={() => setShowTermsModal(false)} />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 14,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderLabel: {
    fontFamily: fonts.bold,
    color: '#8B949E',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: spacing.md,
  },
  groupCard: {
    backgroundColor: '#13161B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  lockedValText: {
    fontFamily: fonts.bold,
    color: '#EF4444',
    fontSize: 13,
    marginTop: 1,
  },
  subtextLabel: {
    fontFamily: fonts.regular,
    color: '#8B949E',
    fontSize: 12,
    marginTop: 1,
  },
  chevron: {
    color: '#8B949E',
    fontSize: 18,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: spacing.lg,
  },
  loginBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 204, 163, 0.12)',
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(78, 204, 163, 0.3)',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: 8,
  },
  loginIcon: {
    fontSize: 18,
  },
  loginBtnText: {
    fontFamily: fonts.bold,
    color: '#4ECCA3',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: 8,
  },
  signOutIcon: {
    fontSize: 18,
  },
  signOutBtnText: {
    fontFamily: fonts.bold,
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
});
