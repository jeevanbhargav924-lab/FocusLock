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
import { spacing } from '../theme';
import { PasscodeModal } from '../components/PasscodeModal';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';

import { Toast } from '../components/Toast';
import { SettingsIcon } from '../utils/Icons';

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
  const [isLimitLocked, setIsLimitLocked] = useState<boolean>(false);

  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
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

  const handleNotificationsPress = () => {
    Toast.info('Notifications Enabled 🔔', 'Daily streak reminders and completion alerts are active.');
  };

  const handleLanguagePress = () => {
    Alert.alert(
      'Select Language 🌐',
      'Choose your preferred app language:',
      [
        { text: 'English', onPress: () => { setSelectedLanguage('English'); Toast.info('Language Set', 'English'); } },
        { text: 'Spanish', onPress: () => { setSelectedLanguage('Spanish'); Toast.info('Language Set', 'Spanish'); } },
        { text: 'French', onPress: () => { setSelectedLanguage('French'); Toast.info('Language Set', 'French'); } },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEmergencyUnlock = () => {
    setPasscodeMode('verify');
    setShowPasscodeModal(true);
  };

  const handleHelpSupport = () => {
    Toast.info('Help & Support ❓', 'Contact: support@focuslock.app');
  };

  const handleAbout = () => {
    Toast.info('About FocusLock ℹ️', 'FocusLock v2.4.1 — Extreme Productivity & Focus');
  };

  const handleConfirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            if (onSignOut) onSignOut();
          },
        },
      ]
    );
  };

  const renderLimitLabel = () => {
    let text = `${dailyLimit} / Day`;
    if (dailyLimit === 0) text = '0 (Strict 0 Limits)';
    if (dailyLimit === -1) text = 'No Limit';
    return isLimitLocked ? `🔒 Locked (${text})` : text;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/images/appIcon.png')}
            style={styles.headerAvatar}
          />
          <Text style={styles.brandName}>FocusLock</Text>
        </View>
      </View>

      {/* Main Screen Title */}
      <Text style={styles.pageTitle}>Settings</Text>

      {/* SECURITY & RULES SECTION */}
      <Text style={styles.sectionHeaderLabel}>SECURITY & PROTECTION</Text>
      <View style={styles.groupCard}>
        {/* Daily Emergency Limit */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleChangeDailyLimit}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⚡</Text>
            <Text style={styles.settingLabel}>Daily Emergency Limit</Text>
          </View>
          <View style={styles.settingRightVal}>
            <Text style={[styles.valText, isLimitLocked && styles.lockedText]}>
              {renderLimitLabel()}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Emergency PIN Unlock */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleEmergencyUnlock}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔑</Text>
            <Text style={styles.settingLabel}>Emergency PIN Unlock</Text>
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
          onPress={handleHelpSupport}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingLabel}>Help & Support</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* About */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={handleAbout}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <Text style={styles.settingLabel}>About FocusLock</Text>
          </View>
          <View style={styles.settingRightVal}>
            <Text style={styles.valText}>v2.4.1</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Privacy Policy */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingRow}
          onPress={() => setShowPrivacyModal(true)}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
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
          Alert.alert('Emergency Validation Passed', 'Emergency session override unlocked.');
        }}
        onCancel={() => setShowPasscodeModal(false)}
      />

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}>
        <PrivacyPolicyScreen onBack={() => setShowPrivacyModal(false)} />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
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
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  gearIcon: {
    fontSize: 22,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  sectionHeaderLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  groupCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 18,
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  settingRightVal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valText: {
    color: '#8B949E',
    fontSize: 13,
  },
  lockedText: {
    color: '#F85149',
    fontWeight: '700',
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
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
});
