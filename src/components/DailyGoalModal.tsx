import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { colors, fonts } from '../theme';
import { TargetDartBullseye } from '../utils/Icons';

interface DailyGoalModalProps {
  visible: boolean;
  currentGoalMinutes: number;
  onSaveGoal: (minutes: number) => void;
  onClose: () => void;
}

const PRESET_GOALS = [
  { label: '30 min', value: 30, desc: 'Light Focus' },
  { label: '60 min', value: 60, desc: 'Standard' },
  { label: '2 hours', value: 120, desc: 'Deep Work' },
  { label: '3 hours', value: 180, desc: 'High Output' },
  { label: '4 hours', value: 240, desc: 'Mastery' },
];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  visible,
  currentGoalMinutes,
  onSaveGoal,
  onClose,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(currentGoalMinutes);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setSelectedMinutes(currentGoalMinutes);
      const isPreset = PRESET_GOALS.some(p => p.value === currentGoalMinutes);
      if (!isPreset && currentGoalMinutes > 0) {
        setIsCustom(true);
        setCustomInput(currentGoalMinutes.toString());
      } else {
        setIsCustom(false);
        setCustomInput('');
      }
    }
  }, [visible, currentGoalMinutes]);

  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setIsCustom(false);
    setCustomInput('');
  };

  const handleCustomChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomInput(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedMinutes(num);
    }
  };

  const handleSave = () => {
    let finalMins = selectedMinutes;
    if (isCustom) {
      const num = parseInt(customInput, 10);
      if (!isNaN(num) && num > 0) {
        finalMins = num;
      } else {
        finalMins = 60;
      }
    }
    onSaveGoal(Math.max(5, finalMins));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Header Icon & Title */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <TargetDartBullseye color={colors.secondary} width={26} height={26} />
              </View>
              <Text style={styles.title}>Daily Focus Goal</Text>
              <Text style={styles.subtitle}>
                Set your daily target to build a consistent focus habit.
              </Text>
            </View>

            {/* Presets Grid */}
            <View style={styles.presetsGrid}>
              {PRESET_GOALS.map(item => {
                const isSelected = !isCustom && selectedMinutes === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.8}
                    onPress={() => handleSelectPreset(item.value)}
                    style={[
                      styles.presetItem,
                      isSelected && styles.presetItemSelected,
                    ]}>
                    <Text
                      style={[
                        styles.presetLabel,
                        isSelected && styles.presetLabelSelected,
                      ]}>
                      {item.label}
                    </Text>
                    <Text style={styles.presetDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom Option Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsCustom(true)}
                style={[
                  styles.presetItem,
                  isCustom && styles.presetItemSelected,
                ]}>
                <Text
                  style={[
                    styles.presetLabel,
                    isCustom && styles.presetLabelSelected,
                  ]}>
                  Custom
                </Text>
                <Text style={styles.presetDesc}>Your own pace</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Input Field */}
            {isCustom && (
              <View style={styles.customInputContainer}>
                <Text style={styles.customInputLabel}>Enter minutes per day:</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 45"
                    placeholderTextColor="#6E7681"
                    value={customInput}
                    onChangeText={handleCustomChange}
                    maxLength={4}
                    autoFocus
                  />
                  <Text style={styles.inputSuffix}>min</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.cancelButton}
                onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.saveButton}
                onPress={handleSave}>
                <Text style={styles.saveText}>Set Daily Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161B22',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  presetItem: {
    width: '31%',
    backgroundColor: '#0E1420',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  presetItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderColor: '#8B5CF6',
  },
  presetLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 2,
  },
  presetLabelSelected: {
    color: '#A78BFA',
  },
  presetDesc: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#6E7681',
  },
  customInputContainer: {
    backgroundColor: '#0E1420',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  customInputLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
    padding: 0,
  },
  inputSuffix: {
    color: '#8B949E',
    fontSize: 14,
    fontFamily: fonts.bold,
    marginLeft: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
  },
  saveButton: {
    flex: 1.6,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
