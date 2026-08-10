import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { spacing } from '../theme';

interface CountdownModalProps {
  visible: boolean;
  onConfirmEnd: () => void;
  onCancelKeepFocusing: () => void;
}

export const CountdownModal: React.FC<CountdownModalProps> = ({
  visible,
  onConfirmEnd,
  onCancelKeepFocusing,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(10);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible) {
      setSecondsLeft(10);
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.iconHeader}>⏳</Text>
          <Text style={styles.title}>Final Cool-Down Confirmation</Text>
          <Text style={styles.subtitle}>
            Reflect for 10 seconds. Are you sure you want to break your focus streak?
          </Text>

          {/* 10-Second Timer Circle */}
          <View style={styles.timerCircle}>
            <Text style={styles.timerNumber}>{secondsLeft}</Text>
            <Text style={styles.timerUnit}>seconds</Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.keepFocusingBtn}
            onPress={onCancelKeepFocusing}>
            <Text style={styles.keepFocusingText}>💪 Keep Focusing (Cancel)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={secondsLeft > 0}
            style={[
              styles.confirmEndBtn,
              secondsLeft > 0 && styles.confirmEndBtnDisabled,
            ]}
            onPress={onConfirmEnd}>
            <Text
              style={[
                styles.confirmEndText,
                secondsLeft > 0 && styles.confirmEndTextDisabled,
              ]}>
              {secondsLeft > 0 ? `Wait ${secondsLeft}s to Confirm` : 'Confirm & End Session 🛑'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
  iconHeader: {
    fontSize: 40,
    marginBottom: spacing.xs,
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
    paddingHorizontal: spacing.sm,
  },
  timerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  timerNumber: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  timerUnit: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  keepFocusingBtn: {
    width: '100%',
    backgroundColor: '#1F6FEB',
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  keepFocusingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmEndBtn: {
    width: '100%',
    backgroundColor: '#DA3633',
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmEndBtnDisabled: {
    backgroundColor: '#21262D',
  },
  confirmEndText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmEndTextDisabled: {
    color: '#8B949E',
  },
});
