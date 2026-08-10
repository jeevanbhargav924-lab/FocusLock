import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

type ToastListener = (toast: ToastMessage) => void;

class ToastManager {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(title: string, message?: string, type: ToastType = 'error') {
    const toast: ToastMessage = {
      id: Math.random().toString(),
      title,
      message,
      type,
    };
    this.listeners.forEach(l => l(toast));
  }

  error(title: string, message?: string) {
    this.show(title, message, 'error');
  }

  success(title: string, message?: string) {
    this.show(title, message, 'success');
  }

  info(title: string, message?: string) {
    this.show(title, message, 'info');
  }

  warning(title: string, message?: string) {
    this.show(title, message, 'warning');
  }
}

export const Toast = new ToastManager();

export const ToastContainer: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = Toast.subscribe(toast => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setCurrentToast(toast);

      // Slide in from top
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3.5 seconds
      timerRef.current = setTimeout(() => {
        hideToast();
      }, 3500);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [translateY, opacity]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
    });
  };

  if (!currentToast) return null;

  const getTypeStyles = () => {
    switch (currentToast.type) {
      case 'error':
        return {
          borderColor: '#FF6B6B',
          bgGlow: 'rgba(255, 107, 107, 0.12)',
          icon: '⚠️',
          accentColor: '#FF6B6B',
        };
      case 'success':
        return {
          borderColor: '#4ECCA3',
          bgGlow: 'rgba(78, 204, 163, 0.12)',
          icon: '✓',
          accentColor: '#4ECCA3',
        };
      case 'warning':
        return {
          borderColor: '#F59E0B',
          bgGlow: 'rgba(245, 158, 11, 0.12)',
          icon: '🔔',
          accentColor: '#F59E0B',
        };
      case 'info':
      default:
        return {
          borderColor: '#7986FF',
          bgGlow: 'rgba(121, 134, 255, 0.12)',
          icon: 'ℹ️',
          accentColor: '#7986FF',
        };
    }
  };

  const styleConfig = getTypeStyles();

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <Animated.View
        style={[
          styles.toastCard,
          {
            borderColor: styleConfig.borderColor,
            backgroundColor: '#161B22',
            transform: [{ translateY }],
            opacity,
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={hideToast}
          style={styles.toastInner}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: styleConfig.bgGlow },
            ]}>
            <Text style={[styles.iconText, { color: styleConfig.accentColor }]}>
              {styleConfig.icon}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{currentToast.title}</Text>
            {currentToast.message ? (
              <Text style={styles.messageText}>{currentToast.message}</Text>
            ) : null}
          </View>

          <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 36,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '800',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  messageText: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#6E7681',
    fontSize: 14,
    fontWeight: '600',
  },
});
