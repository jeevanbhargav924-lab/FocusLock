import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  NativeModules,
  Platform,
  Alert,
} from 'react-native';
import { spacing } from '../theme';

interface PasscodeModalProps {
  visible: boolean;
  mode: 'setup' | 'verify';
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  visible,
  mode,
  title,
  subtitle,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canBiometric, setCanBiometric] = useState<boolean>(false);

  const prevVisible = useRef<boolean>(false);

  useEffect(() => {
    // Only reset state when modal transitions from hidden -> visible
    if (visible && !prevVisible.current) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setErrorMessage('');

      if (mode === 'verify' && Platform.OS === 'android' && NativeModules.PermissionModule?.canAuthenticateBiometric) {
        NativeModules.PermissionModule.canAuthenticateBiometric()
          .then((supported: boolean) => {
            setCanBiometric(supported);
            if (supported && NativeModules.PermissionModule?.authenticateBiometric) {
              NativeModules.PermissionModule.authenticateBiometric()
                .then((success: boolean) => {
                  if (success) {
                    onSuccess();
                  }
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
    }
    prevVisible.current = visible;
  }, [visible, mode, onSuccess]);

  const triggerFingerprintAuth = async () => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.authenticateBiometric) {
      try {
        const success = await NativeModules.PermissionModule.authenticateBiometric();
        if (success) {
          onSuccess();
        }
      } catch (e) {
        console.warn('Biometric auth error:', e);
      }
    }
  };

  const handleKeyPress = (num: string) => {
    setErrorMessage('');
    if (step === 'enter') {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          if (mode === 'setup') {
            setStep('confirm');
          } else {
            verifyEnteredPin(nextPin);
          }
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + num;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (pin === nextConfirm) {
            saveNewPin(pin);
          } else {
            setErrorMessage('PINs do not match. Try again.');
            setConfirmPin('');
            setPin('');
            setStep('enter');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMessage('');
    if (step === 'enter') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const verifyEnteredPin = async (enteredPin: string) => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.verifyPasscode) {
      try {
        const isValid = await NativeModules.PermissionModule.verifyPasscode(enteredPin);
        if (isValid) {
          onSuccess();
        } else {
          setErrorMessage('Incorrect passcode. Try again.');
          setPin('');
        }
      } catch (e) {
        onSuccess();
      }
    } else {
      onSuccess();
    }
  };

  const saveNewPin = async (newPin: string) => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.savePasscode) {
      try {
        await NativeModules.PermissionModule.savePasscode(newPin);
        Alert.alert('Passcode Saved 🔒', 'Your 4-digit security passcode is now active!');
        onSuccess();
      } catch (e) {
        onSuccess();
      }
    } else {
      onSuccess();
    }
  };

  const currentVal = step === 'enter' ? pin : confirmPin;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Title */}
          <Text style={styles.title}>
            {title || (mode === 'setup' ? (step === 'enter' ? 'Set Security Passcode' : 'Confirm Security Passcode') : 'Enter Security Passcode')}
          </Text>
          <Text style={styles.subtitle}>
            {subtitle || (mode === 'setup' ? (step === 'enter' ? 'Create a 4-digit PIN to protect your focus sessions' : 'Re-enter your 4-digit PIN to confirm') : 'Scan fingerprint or enter PIN to authorize action')}
          </Text>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(index => {
              const isFilled = currentVal.length > index;
              return (
                <View
                  key={index}
                  style={[styles.dot, isFilled && styles.dotFilled]}
                />
              );
            })}
          </View>

          {/* Error Message */}
          {Boolean(errorMessage) && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {/* Fingerprint Quick Scan Button (If Supported in Verify Mode) */}
          {mode === 'verify' && canBiometric && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fingerprintBannerBtn}
              onPress={triggerFingerprintAuth}>
              <Text style={styles.fingerprintBannerIcon}>🖐️</Text>
              <Text style={styles.fingerprintBannerText}>Scan Fingerprint to Unlock</Text>
            </TouchableOpacity>
          )}

          {/* Number Pad Grid */}
          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                style={styles.keyBtn}
                onPress={() => handleKeyPress(key)}>
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.keyBtnCancel}
              onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.keyBtn}
              onPress={() => handleKeyPress('0')}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.keyBtnDelete}
              onPress={handleDelete}>
              <Text style={styles.deleteText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  container: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#4F8CFF',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4F8CFF',
  },
  errorText: {
    color: '#F85149',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  fingerprintBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 140, 255, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#4F8CFF',
  },
  fingerprintBannerIcon: {
    fontSize: 18,
    marginRight: spacing.xs + 2,
  },
  fingerprintBannerText: {
    color: '#4F8CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: spacing.xs,
  },
  keyBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  keyBtnCancel: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
  },
  keyBtnDelete: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#8B949E',
    fontSize: 20,
  },
});
