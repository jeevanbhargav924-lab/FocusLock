import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
} from 'react-native';
import { spacing, radius, fonts } from '../theme';
import { PasscodeModal } from '../components/PasscodeModal';
import { BackIcon, SettingsIcon } from '../utils/Icons';

interface CreateSessionScreenProps {
  onStartCreatedSession?: (minutes: number, strictMode: boolean, sessionPin: string, sessionTitle?: string) => void;
  onStartSession?: (minutes: number, strictMode: boolean, sessionPin: string, sessionTitle?: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  onNavigateToAllowedApps?: () => void;
  allowedAppsCount?: number;
}

export const CreateSessionScreen: React.FC<CreateSessionScreenProps> = ({
  onStartCreatedSession,
  onStartSession,
  onCancel,
  onClose,
  onNavigateToAllowedApps,
  allowedAppsCount = 3,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [sessionName, setSessionName] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('Study');
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);

  const handleDismiss = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const handleStartSession = (mins: number, strict: boolean, pin: string) => {
    const title = sessionName.trim() || 'Deep Focus Session';
    if (onStartCreatedSession) {
      onStartCreatedSession(mins, strict, pin, title);
    }
    if (onStartSession) {
      onStartSession(mins, strict, pin, title);
    }
  };

  const durationOptions = [
    { label: '1m', value: 1 },
    { label: '5m', value: 5 },
    { label: '30m', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
    { label: '4h', value: 240 },
  ];

  const tags = ['Study', 'Coding', 'Reading'];

  const formatTimerDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hhStr = h < 10 ? `0${h}` : `${h}`;
    const mmStr = m < 10 ? `0${m}` : `${m}`;
    return `${hhStr}:${mmStr}`;
  };

  const handlePressStart = () => {
    setShowPasscodeModal(true);
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleDismiss} style={styles.backBtn}>
            <Text style={styles.backArrow}> <BackIcon/> </Text>
          </TouchableOpacity>
          <Text style={styles.brandTitle}>FocusLock</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Main Title & Subtitle */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Create Focus Session</Text>
          <Text style={styles.subtitle}>Configure your environment for deep work.</Text>
        </View>

        {/* Card 1: Duration Selector */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderLabel}>DURATION</Text>

          {/* Large Digital Clock Display */}
          <View style={styles.clockContainer}>
            <Text style={styles.clockText}>{formatTimerDisplay(durationMinutes)}</Text>
          </View>

          {/* Preset Badges Row */}
          <View style={styles.presetRow}>
            {durationOptions.map(opt => {
              const isSelected = durationMinutes === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.8}
                  onPress={() => setDurationMinutes(opt.value)}
                  style={[
                    styles.presetBadge,
                    isSelected && styles.presetBadgeSelected,
                  ]}>
                  <Text
                    style={[
                      styles.presetBadgeText,
                      isSelected && styles.presetBadgeTextSelected,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Session Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SESSION NAME</Text>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="What are you focusing on?"
              placeholderTextColor="#6E7681"
              value={sessionName}
              onChangeText={setSessionName}
            />
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>TAGS</Text>
          <View style={styles.tagsRow}>
            {tags.map(tag => {
              const isSelected = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTag(tag)}
                  style={[
                    styles.tagPill,
                    isSelected && styles.tagPillSelected,
                  ]}>
                  <Text
                    style={[
                      styles.tagPillText,
                      isSelected && styles.tagPillTextSelected,
                    ]}>
                    {isSelected ? `✓ ${tag}` : tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card 2: Environment Constraints */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderLabel}>ENVIRONMENT CONSTRAINTS</Text>

          {/* Item 1: Choose Allowed Apps */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.constraintRow}
            onPress={() => {
              if (onNavigateToAllowedApps) onNavigateToAllowedApps();
            }}>
            <View style={styles.constraintIconBox}>
              <Text style={styles.constraintIcon}>▦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.constraintTitle}>Choose Allowed Apps</Text>
              <Text style={styles.constraintSub}>
                {allowedAppsCount} apps currently selected
              </Text>
            </View>
            <Text style={styles.rightArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Item 2: Strict Mode */}
          <View style={styles.constraintRow}>
            <View style={styles.constraintIconBoxWarning}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.constraintTitle}>Strict Mode</Text>
              <Text style={styles.constraintSub}>
                requires PIN verification to end early
              </Text>
            </View>
            <Switch
              value={strictMode}
              onValueChange={setStrictMode}
              trackColor={{ false: '#262D38', true: '#5E6AD2' }}
              thumbColor={strictMode ? '#FFFFFF' : '#8E9BAC'}
            />
          </View>
        </View>

        {/* Start Focus Session Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.startBtn}
          onPress={handlePressStart}>
          <Text style={styles.startBtnIcon}>▶</Text>
          <Text style={styles.startBtnText}>Set PIN & Start Focus Session</Text>
        </TouchableOpacity>

        {/* PIN Code Creation Modal */}
        <PasscodeModal
          visible={showPasscodeModal}
          mode="setup"
          onSuccess={(createdPin?: string) => {
            setShowPasscodeModal(false);
            handleStartSession(durationMinutes, strictMode, createdPin || '');
          }}
          onCancel={() => setShowPasscodeModal(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop:30
  },
  backBtn: {
    padding: spacing.xs,
  },
  backArrow: {
    color: '#D0D7DE',
    fontSize: 22,
  },
  brandTitle: {
    fontFamily: fonts.bold,
    color: '#D0D7DE',
    fontSize: 20,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  gearIcon: {
    fontSize: 20,
  },
  header: {
    marginBottom: spacing.lg,
  },
  mainTitle: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    color: '#8B949E',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.md + 2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderLabel: {
    fontFamily: fonts.bold,
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  clockText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 2,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  presetBadge: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: '#21262D',
    paddingVertical: spacing.xs + 3,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetBadgeSelected: {
    backgroundColor: '#3A416F',
    borderColor: '#4F8CFF',
  },
  presetBadgeText: {
    fontFamily: fonts.semiBold,
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
  },
  presetBadgeTextSelected: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.xs + 2,
  },
  textInputWrapper: {
    backgroundColor: '#11151D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
  },
  textInput: {
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: '#21262D',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginRight: spacing.xs + 2,
  },
  tagPillSelected: {
    backgroundColor: '#183A2E',
    borderWidth: 1,
    borderColor: '#4ECCA3',
  },
  tagPillText: {
    fontFamily: fonts.medium,
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '500',
  },
  tagPillTextSelected: {
    fontFamily: fonts.bold,
    color: '#4ECCA3',
    fontWeight: '700',
  },
  constraintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  constraintIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  constraintIconBoxWarning: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  constraintIcon: {
    color: '#5E6AD2',
    fontSize: 18,
  },
  warningIcon: {
    fontSize: 16,
  },
  constraintTitle: {
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  constraintSub: {
    fontFamily: fonts.regular,
    color: '#8B949E',
    fontSize: 12,
    marginTop: 2,
  },
  rightArrow: {
    color: '#8B949E',
    fontSize: 22,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.sm,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9DA9FF',
    borderRadius: 16,
    height: 56,
    marginTop: spacing.sm,
  },
  startBtnIcon: {
    color: '#1E1B4B',
    fontSize: 14,
    marginRight: spacing.xs + 2,
  },
  startBtnText: {
    fontFamily: fonts.bold,
    color: '#1E1B4B',
    fontSize: 16,
    fontWeight: '700',
  },
});
