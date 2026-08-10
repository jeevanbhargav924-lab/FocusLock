import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { spacing } from '../theme';

interface EndSessionCountdownModalProps {
  visible: boolean;
  onCountdownComplete?: () => void;
  onConfirmEnd?: () => void;
  onCancel: () => void;
}

export const EndSessionCountdownModal: React.FC<EndSessionCountdownModalProps> = ({
  visible,
  onCountdownComplete,
  onConfirmEnd,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(10);

  const handleFinish = () => {
    if (onConfirmEnd) onConfirmEnd();
    if (onCountdownComplete) onCountdownComplete();
  };

  const onCompleteRef = useRef(handleFinish);

  useEffect(() => {
    onCompleteRef.current = handleFinish;
  }, [onConfirmEnd, onCountdownComplete]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (visible) {
      setSecondsLeft(10);
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            setTimeout(() => {
              if (onCompleteRef.current) {
                onCompleteRef.current();
              }
            }, 50);
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

  if (!visible) return null;

  const progressPercent = (secondsLeft / 10) * 100;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.badgeText}>⏳ REFLECTION COUNTDOWN</Text>
          <Text style={styles.titleText}>Ending Focus Session</Text>
          <Text style={styles.subtitleText}>
            Take 10 seconds to pause and reconsider before breaking your focus streak.
          </Text>

          {/* Countdown Ring Circle */}
          <View style={styles.circleContainer}>
            <View style={styles.circleInner}>
              <Text style={styles.counterText}>{secondsLeft}</Text>
              <Text style={styles.secondsLabel}>SECONDS</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Stay Focused Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.stayFocusedBtn}
            onPress={onCancel}>
            <Text style={styles.stayFocusedBtnText}>⚡ Never Mind, Stay Focused</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
  badgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  circleContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  circleInner: {
    alignItems: 'center',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
  },
  secondsLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: -4,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  stayFocusedBtn: {
    width: '100%',
    backgroundColor: '#1F6FEB',
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  stayFocusedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
