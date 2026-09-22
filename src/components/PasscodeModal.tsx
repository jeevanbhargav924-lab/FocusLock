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
  onSuccess: (pin?: string) => void;
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
          onSuccess(enteredPin);
        } else {
          setErrorMessage('Incorrect passcode. Try again.');
          setPin('');
        }
      } catch (e) {
        onSuccess(enteredPin);
      }
    } else {
      onSuccess(enteredPin);
    }
  };

  const saveNewPin = async (newPin: string) => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.savePasscode) {
      try {
        await NativeModules.PermissionModule.savePasscode(newPin);
        onSuccess(newPin);
      } catch (e) {
        onSuccess(newPin);
      }
    } else {
      onSuccess(newPin);
    }
  };

  const currentVal = step === 'enter' ? pin : confirmPin;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top-Right Close Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.closeBtn}
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Header Security Icon Badge */}
          <View style={styles.iconBadgeContainer}>
            <Text style={styles.iconBadgeText}>🔒</Text>
          </View>

          {/* Header Title & Subtitle */}
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

          {/* Error Message Banner */}
          {Boolean(errorMessage) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
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

          {/* Number Pad Grid (3-Column Standard Layout) */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['empty', '0', 'delete'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map(item => {
                  if (item === 'empty') {
                    return <View key="empty" style={styles.keyBtnAux} />;
                  }
                  if (item === 'delete') {
                    return (
                      <TouchableOpacity
                        key="delete"
                        activeOpacity={0.7}
                        style={styles.keyBtnAux}
                        onPress={handleDelete}>
                        <Text style={styles.deleteText}>⌫</Text>
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.75}
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress(item)}>
                      <Text style={styles.keyText}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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
    maxWidth: 340,
    backgroundColor: '#161B22',
    borderRadius: 28,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#8B949E',
    fontSize: 16,
    fontWeight: '600',
  },
  iconBadgeContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(79, 140, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.3)',
  },
  iconBadgeText: {
    fontSize: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#4F8CFF',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4F8CFF',
    shadowColor: '#4F8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 81, 73, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.3)',
  },
  errorText: {
    color: '#F85149',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
    width: '100%',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.xs,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 280,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  keyBtnAux: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
  },
  cancelText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteText: {
    color: '#8B949E',
    fontSize: 22,
  },
});
