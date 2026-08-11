import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeModules,
  Platform,
  AppState,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { spacing, radius, colors } from '../theme';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface PermissionSetupScreenProps {
  onCompletePermissions?: () => void;
  onComplete?: () => void;
}

export const PermissionSetupScreen: React.FC<PermissionSetupScreenProps> = ({
  onCompletePermissions,
  onComplete,
}) => {
  const handleFinishPermissions = () => {
    if (onCompletePermissions) onCompletePermissions();
    if (onComplete) onComplete();
  };

  const [accessibilityAccess, setAccessibilityAccess] = useState<boolean>(false);
  const [usageAccess, setUsageAccess] = useState<boolean>(false);
  const [notifAccess, setNotifAccess] = useState<boolean>(true);
  const [batteryAccess, setBatteryAccess] = useState<boolean>(false);

  const allPermissionsGranted = Boolean(accessibilityAccess && usageAccess && batteryAccess);

  const checkAllPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setAccessibilityAccess(true);
      setUsageAccess(true);
      setNotifAccess(true);
      setBatteryAccess(true);
      return;
    }

    // 1. Accessibility Service
    if (NativeModules.PermissionModule?.hasAccessibilityPermission) {
      try {
        const hasAccess = await NativeModules.PermissionModule.hasAccessibilityPermission();
        setAccessibilityAccess(Boolean(hasAccess));
      } catch (e) {
        console.warn('Error checking accessibility permission:', e);
      }
    }

    // 2. Usage Access
    if (NativeModules.PermissionModule?.hasUsagePermission) {
      try {
        const hasUsage = await NativeModules.PermissionModule.hasUsagePermission();
        setUsageAccess(Boolean(hasUsage));
      } catch (e) {
        console.warn('Error checking usage permission:', e);
      }
    }

    // 3. Notification Permission
    try {
      const permKey = (PERMISSIONS.ANDROID as any).POST_NOTIFICATIONS || 'android.permission.POST_NOTIFICATIONS';
      const res = await check(permKey);
      setNotifAccess(res === RESULTS.GRANTED);
    } catch (e) {
      setNotifAccess(true);
    }

    // 4. Battery Optimization
    if (NativeModules.PermissionModule?.hasBatteryOptimizationPermission) {
      try {
        const hasBattery = await NativeModules.PermissionModule.hasBatteryOptimizationPermission();
        setBatteryAccess(Boolean(hasBattery));
      } catch (e) {
        console.warn('Error checking battery permission:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Check if permission setup was previously completed by the user
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.isPermissionsCompleted) {
      NativeModules.PermissionModule.isPermissionsCompleted()
        .then((completed: boolean) => {
          if (completed) {
            handleFinishPermissions();
          }
        })
        .catch(() => {});
    }

    checkAllPermissions();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkAllPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAllPermissions, onCompletePermissions]);

  const requestAccessibilityPermission = () => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.openAccessibilitySettings) {
      NativeModules.PermissionModule.openAccessibilitySettings();
    } else {
      setAccessibilityAccess(true);
    }
  };

  const requestUsagePermission = () => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.openUsageAccessSettings) {
      NativeModules.PermissionModule.openUsageAccessSettings();
    } else {
      setUsageAccess(true);
    }
  };

  const toggleNotificationPermission = async (value: boolean) => {
    setNotifAccess(value);
    if (value && Platform.OS === 'android') {
      try {
        const permKey = (PERMISSIONS.ANDROID as any).POST_NOTIFICATIONS || 'android.permission.POST_NOTIFICATIONS';
        const result = await request(permKey);
        setNotifAccess(result === RESULTS.GRANTED);
      } catch (e) {
        setNotifAccess(true);
      }
    }
  };

  const requestBatteryPermission = () => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.openBatteryOptimizationSettings) {
      NativeModules.PermissionModule.openBatteryOptimizationSettings();
    } else {
      setBatteryAccess(true);
    }
  };

  const handleContinueSetup = () => {
    if (!allPermissionsGranted) return;
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.setPermissionsCompleted) {
      NativeModules.PermissionModule.setPermissionsCompleted(true);
    }
    handleFinishPermissions();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topShieldBadge}>
          <Text style={styles.topShieldIcon}>🛡️</Text>
        </View>
        <Text style={styles.topBarTitle}>FocusLock Setup</Text>
      </View>

      {/* Main Title & Subtitle */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Required Permissions</Text>
        <Text style={styles.subtitle}>
          To provide deep focus and block distractions, FocusLock needs access to the following system features.
        </Text>
      </View>

      {/* Card 1: Accessibility Service */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>🤺</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Accessibility Service</Text>
            <Text style={styles.cardDesc}>
              Required to detect when you open distracting apps and block them instantly.
            </Text>
          </View>
        </View>
        <View style={styles.cardButtonRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.allowButton,
              accessibilityAccess && styles.grantedButton,
            ]}
            onPress={requestAccessibilityPermission}
          >
            <Text style={styles.allowButtonText}>
              {accessibilityAccess ? 'ALLOWED ✓' : 'ALLOW ACCESS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card 2: Usage Access */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>🔄</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Usage Access</Text>
            <Text style={styles.cardDesc}>
              Allows us to determine which app is currently active on your screen.
            </Text>
          </View>
        </View>
        <View style={styles.cardButtonRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.allowButton, usageAccess && styles.grantedButton]}
            onPress={requestUsagePermission}
          >
            <Text style={styles.allowButtonText}>
              {usageAccess ? 'ALLOWED ✓' : 'ALLOW ACCESS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card 3: Notifications */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>🔔</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <Text style={styles.cardDesc}>
              Receive reminders when focus sessions start or end.
            </Text>
          </View>
          <Switch
            value={notifAccess}
            onValueChange={toggleNotificationPermission}
            trackColor={{ false: '#262D38', true: '#5E6AD2' }}
            thumbColor={notifAccess ? '#FFFFFF' : '#8E9BAC'}
          />
        </View>
      </View>

      {/* Card 4: Ignore Battery Optimization */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>🔋</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Ignore Battery Optimization</Text>
            <Text style={styles.cardDesc}>
              Ensures FocusLock keeps running reliably in the background during long sessions.
            </Text>
          </View>
        </View>
        <View style={styles.cardButtonRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.allowButton, batteryAccess && styles.grantedButton]}
            onPress={requestBatteryPermission}
          >
            <Text style={styles.allowButtonText}>
              {batteryAccess ? 'ALLOWED ✓' : 'ALLOW ACCESS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Action CTA */}
      <View style={styles.footerAction}>
        <TouchableOpacity
          activeOpacity={allPermissionsGranted ? 0.85 : 1}
          disabled={!allPermissionsGranted}
          style={[
            styles.continueButton,
            allPermissionsGranted ? styles.continueButtonActive : styles.continueButtonDisabled,
          ]}
          onPress={handleContinueSetup}
        >
          <Text
            style={[
              styles.continueButtonText,
              allPermissionsGranted ? styles.continueButtonTextActive : styles.continueButtonTextDisabled,
            ]}
          >
            {allPermissionsGranted ? 'Continue Setup ➔' : 'Grant All Permissions to Continue'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footerCaption, allPermissionsGranted && styles.footerCaptionActive]}>
          {allPermissionsGranted
            ? '✓ All required permissions granted! Ready to continue.'
            : 'Please grant Accessibility, Usage Access & Battery permissions above'}
        </Text>
      </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  topShieldBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(121, 134, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  topShieldIcon: {
    fontSize: 12,
  },
  topBarTitle: {
    color: '#D0D7DE',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#8B949E',
    fontSize: 13,
    lineHeight: 18,
  },
  cardButtonRow: {
    alignItems: 'flex-end',
    marginTop: spacing.sm + 2,
  },
  allowButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.pill,
  },
  grantedButton: {
    backgroundColor: '#00E676',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerAction: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md + 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
  },
  continueButtonDisabled: {
    backgroundColor: '#161B22',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  continueButtonActive: {
    backgroundColor: '#A855F7',
    borderColor: '#ad6ee8ff',
    shadowColor: '#ae74e4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#484F58',
  },
  continueButtonTextActive: {
    color: '#FFFFFF',
  },
  footerCaption: {
    color: '#6E7681',
    fontSize: 12,
    textAlign: 'center',
  },
  footerCaptionActive: {
    color: '#3FB950',
    fontWeight: '600',
  },
});
