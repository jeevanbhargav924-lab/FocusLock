import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { spacing } from '../theme';
import { getCurrentUserProfile, saveUserProfile, getUserStats, getHistorySessions } from '../services/database';
import { Toast } from '../components/Toast';
import { SettingsIcon } from '../utils/Icons';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';

interface UserProfileScreenProps {
  onOpenSettings?: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onOpenSettings,
}) => {
  const [userName, setUserName] = useState<string>('Focus User');
  const [userUid, setUserUid] = useState<string>('guest_user');
  const [sessionsCount, setSessionsCount] = useState<number>(0);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [totalHours, setTotalHours] = useState<number>(0);
  
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile && profile.display_name) {
        setUserName(profile.display_name);
        setUserUid(profile.uid || 'guest_user');
      }

      const uid = 'guest_user';
      const history = await getHistorySessions(uid);
      setSessionsCount(history.length);

      const stats = await getUserStats(uid);
      setStreakDays(stats.current_streak ?? 0);
      setTotalHours(stats.total_focus_hours || 0);
    } catch (e) {
      console.warn('Error loading user profile:', e);
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = tempName.trim();

    if (!trimmedName) {
      Toast.error('Invalid Input', 'Full name cannot be empty.');
      return;
    }

    setUserName(trimmedName);
    setEditModalVisible(false);

    try {
      await saveUserProfile({
        uid: userUid || 'guest_user',
        email: 'local@focuslock.app',
        display_name: trimmedName,
        photo_url: '',
        created_at: Date.now(),
      });
      Toast.success('Profile Saved', 'Your profile has been updated.');
    } catch (e) {
      console.warn('Error saving profile:', e);
    }
  };

  const handleExportData = () => {
    Toast.info('Export Focus Data', 'Preparing CSV dump of all completed focus sessions.');
  };

  const handlePrivacy = () => {
    setPrivacyModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/images/appIcon.png')}
            style={styles.headerAvatar}
          />
          <Text style={styles.brandName}>FocusLock</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={onOpenSettings}>
          <Text style={styles.gearIcon}> <SettingsIcon/> </Text>
        </TouchableOpacity>
      </View>

      {/* Main Profile Header Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarRing}>
          <Image
            source={require('../../assets/images/appIcon.png')}
            style={styles.profileAvatar}
          />
        </View>
        <Text style={styles.nameText}>{userName}</Text>
        <Text style={styles.emailText}>Local Offline Mode</Text>
      </View>

      {/* KPI Stats Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Sessions Card */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabelMuted}>SESSIONS</Text>
          <Text style={styles.kpiValueText}>{sessionsCount}</Text>
        </View>

        {/* Streak Card */}
        <View style={styles.kpiCardStreak}>
          <View style={styles.streakBadgeRow}>
            <Text style={styles.streakFlameIcon}>🔥</Text>
            <Text style={styles.streakLabelText}>STREAK</Text>
          </View>
          <Text style={styles.streakValueText}>{streakDays}<Text style={styles.streakUnit}>d</Text></Text>
        </View>

        {/* Hours Card */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabelMuted}>HOURS</Text>
          <Text style={styles.kpiValueText}>{totalHours}</Text>
        </View>
      </View>

      {/* Menu Action Cards Container */}
      <View style={styles.menuContainer}>
        {/* Edit Profile */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItemRow}
          onPress={() => {
            setTempName(userName);
            setEditModalVisible(true);
          }}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuLabel}>Edit Profile</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Export Data */}
        {/* <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItemRow}
          onPress={handleExportData}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>📥</Text>
            <Text style={styles.menuLabel}>Export Data</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity> */}
        <View style={styles.divider} />

        {/* Privacy Policy */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItemRow}
          onPress={handlePrivacy}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={tempName}
              onChangeText={setTempName}
              placeholderTextColor="#8B949E"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}>
        <PrivacyPolicyScreen onBack={() => setPrivacyModalVisible(false)} />
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
    marginBottom: spacing.lg,
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
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#4F8CFF',
    padding: 3,
    marginBottom: spacing.sm,
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  emailText: {
    color: '#4ECCA3',
    fontSize: 13,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  kpiCardStreak: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  kpiLabelMuted: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValueText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  streakBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakFlameIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  streakLabelText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  streakValueText: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: '800',
  },
  streakUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuLabel: {
    color: '#F0F6FC',
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    color: '#8B949E',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 12,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#C9D1D9',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#238636',
    borderRadius: 12,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
