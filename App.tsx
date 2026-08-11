import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, StyleSheet, View, NativeModules, Platform, Alert, Modal } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import auth from '@react-native-firebase/auth';

import { BottomNavigation, TabKey } from './src/components/BottomNavigation';
import { ScreenLayout } from './src/components/ScreenLayout';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PermissionSetupScreen } from './src/screens/PermissionSetupScreen';

import { HomeScreen } from './src/screens/HomeScreen';
import { CreateSessionScreen } from './src/screens/CreateSessionScreen';
import { ActiveSessionScreen } from './src/screens/ActiveSessionScreen';
import { SessionCompletedScreen } from './src/screens/SessionCompletedScreen';

import { AllowedAppsScreen } from './src/screens/AllowedAppsScreen';
import { BlockedOverlayScreen } from './src/screens/BlockedOverlayScreen';
import { PasscodeModal } from './src/components/PasscodeModal';
import { EndSessionCountdownModal } from './src/components/EndSessionCountdownModal';

import { FocusHistoryScreen } from './src/screens/FocusHistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { initDatabase, saveSessionRecord } from './src/services/database';
import { Toast, ToastContainer } from './src/components/Toast';
import { colors } from './src/theme';

type AppFlowStep = 'splash' | 'onboarding' | 'auth' | 'permissions' | 'main';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ToastContainer />
      <MainAppController />
    </SafeAreaProvider>
  );
}

function MainAppController(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [flowStep, setFlowStep] = useState<AppFlowStep>('splash');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(true);

  // Session & Protection States
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('Deep Focus Session');
  const [remainingTimeText, setRemainingTimeText] = useState<string>('00:00:00');
  const [allowedAppsCount, setAllowedAppsCount] = useState<number>(3);
  const [customBlockedPkgs, setCustomBlockedPkgs] = useState<string[]>([]);
  const [customAllowedPkgs, setCustomAllowedPkgs] = useState<string[]>([]);

  // Overlay / Modal Visibility
  const [showCreateSession, setShowCreateSession] = useState<boolean>(false);
  const [showSessionCompleted, setShowSessionCompleted] = useState<boolean>(false);
  const [showAllowedApps, setShowAllowedApps] = useState<boolean>(false);
  const [showBlockedOverlay, setShowBlockedOverlay] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [pendingTarget, setPendingTarget] = useState<'createSession' | 'allowedApps' | null>(null);

  // Security Passcode Modal State
  const [passcodeModalVisible, setPasscodeModalVisible] = useState<boolean>(false);
  const [passcodeMode, setPasscodeMode] = useState<'setup' | 'verify'>('verify');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // 10-Second Reflection Countdown Modal State
  const [showReflectionCountdown, setShowReflectionCountdown] = useState<boolean>(false);

  // Pending Manual End Data (elapsedSec, remainingSec, blockedCount)
  const [pendingManualEndData, setPendingManualEndData] = useState<{
    elapsedSec: number;
    remainingSec: number;
    blockedCount: number;
  }>({ elapsedSec: 0, remainingSec: 0, blockedCount: 0 });

  // Completion Screen Meta state
  const [completionMeta, setCompletionMeta] = useState<{
    isManualEnd: boolean;
    plannedMinutes: number;
    completedMinutes: number;
    remainingMinutes: number;
    blockedAttempts: number;
  }>({
    isManualEnd: false,
    plannedMinutes: 25,
    completedMinutes: 25,
    remainingMinutes: 0,
    blockedAttempts: 0,
  });

  // Check Onboarding & User Authentication State on Mount
  useEffect(() => {
    initDatabase();

    const checkInitialState = async () => {
      try {
        // 1. Check Onboarding Status
        const seen = await AsyncStorage.getItem('@has_seen_onboarding');
        if (seen === 'true') {
          setHasSeenOnboarding(true);
        }

        // 2. Local Mode Initialized
        setIsGuest(true);
      } catch (e) {
        console.warn('Error checking initial app state:', e);
      }
    };

    checkInitialState();
  }, []);

  // Sync active native session on launch & periodic timer update
  const syncNativeSession = useCallback(async () => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule) {
      try {
        const session = await NativeModules.PermissionModule.getActiveSession();
        if (session && session.isActive) {
          setIsSessionActive(true);
          if (session.title) {
            setActiveSessionTitle(session.title);
          }
          const time = await NativeModules.PermissionModule.getRemainingTime();
          setRemainingTimeText(time || '00:00:00');
        } else {
          setIsSessionActive(false);
          setRemainingTimeText('00:00:00');
        }
      } catch (e) {
        setIsSessionActive(false);
      }
    }
  }, []);

  useEffect(() => {
    syncNativeSession();
    const interval = setInterval(syncNativeSession, 1000);
    return () => clearInterval(interval);
  }, [syncNativeSession]);

  // Handle Splash Screen Finish (Automatic after 2 sec)
  const handleSplashFinish = () => {
    if (!hasSeenOnboarding) {
      setFlowStep('onboarding');
    } else {
      setFlowStep('main');
    }
  };

  // Handle Onboarding Completion (Only runs on first install)
  const handleCompleteOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
      setHasSeenOnboarding(true);
    } catch (e) {}
    setFlowStep('permissions');
  };

  // Handle Login Success
  const handleLoginSuccess = () => {
    setIsGuest(false);
    setFlowStep('main');
  };

  // Handle Sign Out / Logout
  const handleSignOut = async () => {
    try {
      if (auth().currentUser) {
        await auth().signOut();
      }
    } catch (e) {}
    setIsGuest(true);
    setFlowStep('main');
  };

  // Helper to verify if Android Usage Access and Accessibility permissions are active
  const checkRequiredPermissionsGranted = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    if (NativeModules.PermissionModule) {
      try {
        let hasUsage = true;
        let hasAccessibility = true;

        if (typeof NativeModules.PermissionModule.hasUsagePermission === 'function') {
          hasUsage = await NativeModules.PermissionModule.hasUsagePermission();
        }
        if (typeof NativeModules.PermissionModule.hasAccessibilityPermission === 'function') {
          hasAccessibility = await NativeModules.PermissionModule.hasAccessibilityPermission();
        }

        return Boolean(hasUsage && hasAccessibility);
      } catch (e) {
        console.warn('Error checking permissions:', e);
        return true;
      }
    }
    return true;
  };

  const handleOpenCreateSession = () => {
    setActiveTab('focus');
  };

  const handleOpenAllowedApps = () => {
    setShowAllowedApps(true);
  };

  const handleStartActiveSession = async (
    minutes: number,
    strictMode: boolean,
    sessionPin: string = '',
    sessionTitle: string = 'Deep Focus Session'
  ) => {
    const hasPerms = await checkRequiredPermissionsGranted();
    if (!hasPerms) {
      Toast.warning(
        'Permissions Required 🔒',
        'Please grant Usage Access and Accessibility permissions to activate app blocking.'
      );
      setPendingTarget('createSession');
      setShowCreateSession(false);
      setFlowStep('permissions');
      return;
    }

    const finalTitle = sessionTitle.trim() || 'Deep Focus Session';
    setSessionMinutes(minutes);
    setActiveSessionTitle(finalTitle);
    setIsSessionActive(true);
    setShowCreateSession(false);
    setShowAllowedApps(false);
    setActiveTab('focus');

    if (Platform.OS === 'android' && NativeModules.PermissionModule?.startFocusSession) {
      try {
        const defaultBlocked = [
          'com.instagram.android',
          'com.google.android.youtube',
          'com.reddit.frontpage',
          'com.zhiliaoapp.musically',
          'com.facebook.katana',
          'com.facebook.orca',
          'com.twitter.android',
          'com.android.chrome',
          'com.chrome.beta',
          'com.google.android.apps.chrome',
          'com.snapchat.android',
        ];

        const finalBlocked = customBlockedPkgs.length > 0 ? customBlockedPkgs : defaultBlocked;

        await NativeModules.PermissionModule.startFocusSession(
          finalTitle,
          minutes,
          strictMode,
          finalBlocked,
          customAllowedPkgs,
          sessionPin
        );
      } catch (e) {
        console.warn('Error starting native focus session:', e);
      }
    }
  };

  // Perform Security Authorization (PIN Verification & Daily Limit Check)
  const authorizeActionWithDailyLimit = async (actionCallback: () => void) => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.getDailyChangesRemaining) {
      try {
        const remaining = await NativeModules.PermissionModule.getDailyChangesRemaining();

        if (remaining <= 0) {
          Toast.warning(
            'Daily Limit Reached! 🚫',
            'You have used all allowed emergency session ends for today. Stay focused!'
          );
          Alert.alert(
            'Daily Limit Reached 🚫',
            'You have used all allowed emergency session ends for today. You cannot end this session early. Stay focused!'
          );
          return;
        }

        const hasPin = await NativeModules.PermissionModule.hasPasscode();
        if (hasPin) {
          setPendingAction(() => actionCallback);
          setPasscodeMode('verify');
          setPasscodeModalVisible(true);
        } else {
          actionCallback();
        }
      } catch (e) {
        actionCallback();
      }
    } else {
      actionCallback();
    }
  };

  const handleEndSessionRequested = (
    elapsedSec: number = 0,
    remainingSec: number = 0,
    blockedCount: number = 0
  ) => {
    authorizeActionWithDailyLimit(() => {
      setPendingManualEndData({ elapsedSec, remainingSec, blockedCount });
      setShowReflectionCountdown(true);
    });
  };

  const handleConfirmEndSession = async () => {
    setShowReflectionCountdown(false);

    const elapsedSec = pendingManualEndData.elapsedSec || 0;
    const remainingSec = pendingManualEndData.remainingSec || 0;
    const blockedCount = pendingManualEndData.blockedCount || 0;

    const completedMins = Math.max(1, Math.floor(elapsedSec / 60));
    const remainingMins = Math.max(0, Math.ceil(remainingSec / 60));

    // 1. Record daily limit change on Android
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.recordDailyChange) {
      try {
        const success = await NativeModules.PermissionModule.recordDailyChange();
        if (!success) {
          Toast.warning(
            'Daily Limit Reached! 🚫',
            'You have used all allowed emergency changes for today.'
          );
          return;
        }
      } catch (e) {}
    }

    // 2. Mark active session stopped in Native Android SQLite DB & Service
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.stopFocusSession) {
      try {
        await NativeModules.PermissionModule.stopFocusSession();
      } catch (e) {}
    }

    // 3. Save completed session record into JS SQLite database with status 'ended'
    const now = new Date();
    const startTimeStr = new Date(now.getTime() - elapsedSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentUid = isGuest ? 'guest_user' : (auth().currentUser?.uid || 'default_user');

    await saveSessionRecord(
      {
        title: activeSessionTitle || 'Deep Focus Session',
        category: 'coding',
        start_time: startTimeStr,
        end_time: endTimeStr,
        planned_minutes: sessionMinutes,
        actual_minutes: completedMins,
        status: 'ended', // Manual end is marked as 'ended'
        score: Math.round((completedMins / Math.max(1, sessionMinutes)) * 100),
        blocked_attempts: blockedCount,
      },
      currentUid
    );

    // Display remaining emergency ends toast if applicable
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.getDailyChangesRemaining) {
      try {
        const remaining = await NativeModules.PermissionModule.getDailyChangesRemaining();
        if (remaining < 9990) {
          Toast.info('Emergency End Used ⏱', `${remaining} emergency session end(s) remaining today.`);
        }
      } catch (e) {}
    }

    // 4. Configure completionMeta for manual end screen
    setCompletionMeta({
      isManualEnd: true,
      plannedMinutes: sessionMinutes,
      completedMinutes: completedMins,
      remainingMinutes: remainingMins,
      blockedAttempts: blockedCount,
    });

    setIsSessionActive(false);
    setShowSessionCompleted(true);
  };

  const handleNaturalSessionCompletion = async () => {
    // 1. Mark active session completed in Native Android SQLite DB & Service
    if (Platform.OS === 'android') {
      try {
        if (NativeModules.PermissionModule?.completeFocusSession) {
          await NativeModules.PermissionModule.completeFocusSession();
        } else if (NativeModules.PermissionModule?.stopFocusSession) {
          await NativeModules.PermissionModule.stopFocusSession();
        }
      } catch (e) {}
    }

    // 2. Save completed session record into database with status 'completed'
    const now = new Date();
    const startTimeStr = new Date(now.getTime() - sessionMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentUid = isGuest ? 'guest_user' : (auth().currentUser?.uid || 'default_user');

    await saveSessionRecord(
      {
        title: activeSessionTitle || 'Deep Focus Session',
        category: 'coding',
        start_time: startTimeStr,
        end_time: endTimeStr,
        planned_minutes: sessionMinutes,
        actual_minutes: sessionMinutes,
        status: 'completed', // Full duration completed naturally
        score: 100,
        blocked_attempts: 0,
      },
      currentUid
    );

    // 3. Configure completionMeta for natural completion screen
    setCompletionMeta({
      isManualEnd: false,
      plannedMinutes: sessionMinutes,
      completedMinutes: sessionMinutes,
      remainingMinutes: 0,
      blockedAttempts: 0,
    });

    setIsSessionActive(false);
    setShowSessionCompleted(true);
  };

  // Render Initial App Intro/Auth Flow Steps
  if (flowStep === 'splash') {
    return <SplashScreen onContinue={handleSplashFinish} />;
  }

  if (flowStep === 'onboarding') {
    return <OnboardingScreen onCompleteOnboarding={handleCompleteOnboarding} />;
  }



  const handleCompletePermissions = () => {
    setFlowStep('main');
    if (pendingTarget === 'allowedApps') {
      setShowAllowedApps(true);
      setPendingTarget(null);
    } else if (pendingTarget === 'createSession') {
      setShowCreateSession(true);
      setPendingTarget(null);
    }
  };

  if (flowStep === 'permissions') {
    return (
      <PermissionSetupScreen
        onComplete={handleCompletePermissions}
        onCompletePermissions={handleCompletePermissions}
      />
    );
  }

  // Main App Content Switcher
  const renderTabContent = () => {

    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onStartSession={handleOpenCreateSession}
            onNavigateToApps={handleOpenAllowedApps}
            isSessionActive={isSessionActive}
            onOpenActiveSession={() => setActiveTab('focus')}
            onOpenHistory={() => setActiveTab('history')}
            remainingTimeText={remainingTimeText}
          />
        );
      case 'focus':
        return isSessionActive ? (
          <ActiveSessionScreen
            onEndSession={handleEndSessionRequested}
            onNaturalCompletion={handleNaturalSessionCompletion}
            onTriggerBlockedAlert={() => setShowBlockedOverlay(true)}
          />
        ) : (
          <CreateSessionScreen
            onCancel={() => setActiveTab('home')}
            onStartCreatedSession={handleStartActiveSession}
            onNavigateToAllowedApps={handleOpenAllowedApps}
            allowedAppsCount={allowedAppsCount}
          />
        );

      case 'history':
        return <FocusHistoryScreen onNavigateToStats={() => setActiveTab('stats')} />;
      case 'stats':
        return <StatsScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => setActiveTab('home')}
            isGuest={isGuest}
          />
        );
      default:
        return (
          <HomeScreen
            onStartSession={handleOpenCreateSession}
            onNavigateToApps={() => setShowAllowedApps(true)}
            isSessionActive={isSessionActive}
            onOpenActiveSession={() => setActiveTab('focus')}
            onOpenHistory={() => setActiveTab('history')}
            remainingTimeText={remainingTimeText}
          />
        );
    }
  };

  return (
    <ScreenLayout edges={['top', 'left', 'right']} backgroundColor={colors.background}>
      <View style={styles.mainContent}>{renderTabContent()}</View>

      {/* Floating Bottom Navigation Bar */}
      {!showCreateSession &&
        !showSessionCompleted &&
        !showAllowedApps &&
        !showBlockedOverlay && (
          <View style={{ paddingBottom: insets.bottom }}>
            <BottomNavigation
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />
          </View>
        )}

      {/* Full-Screen Overlays */}
      <Modal
        visible={showCreateSession}
        animationType="slide"
        onRequestClose={() => setShowCreateSession(false)}>
        <View style={styles.fullModalContainer}>
          <CreateSessionScreen
            onCancel={() => setShowCreateSession(false)}
            onStartCreatedSession={handleStartActiveSession}
            onNavigateToAllowedApps={handleOpenAllowedApps}
            allowedAppsCount={allowedAppsCount}
          />
        </View>
      </Modal>

      <Modal
        visible={showSessionCompleted}
        animationType="slide"
        onRequestClose={() => setShowSessionCompleted(false)}>
        <View style={styles.fullModalContainer}>
          <SessionCompletedScreen
            isManualEnd={completionMeta.isManualEnd}
            plannedMinutes={completionMeta.plannedMinutes}
            completedMinutes={completionMeta.completedMinutes}
            remainingMinutes={completionMeta.remainingMinutes}
            durationMinutes={sessionMinutes}
            blockedAttempts={completionMeta.blockedAttempts}
            timeSavedMinutes={Math.round(sessionMinutes * 0.8)}
            onStartAnotherSession={() => {
              setShowSessionCompleted(false);
              setShowCreateSession(true);
            }}
            onReturnHome={() => {
              setShowSessionCompleted(false);
              setActiveTab('home');
            }}
          />
        </View>
      </Modal>

      <Modal
        visible={showAllowedApps}
        animationType="slide"
        onRequestClose={() => setShowAllowedApps(false)}>
        <View style={styles.fullModalContainer}>
          <AllowedAppsScreen
            onBack={() => setShowAllowedApps(false)}
            onSaveAllowedApps={(count, blocked, allowed) => {
              setAllowedAppsCount(count);
              setCustomBlockedPkgs(blocked);
              setCustomAllowedPkgs(allowed);
              setShowAllowedApps(false);
            }}
          />
        </View>
      </Modal>

      <Modal
        visible={showBlockedOverlay}
        animationType="slide"
        onRequestClose={() => setShowBlockedOverlay(false)}>
        <View style={styles.fullModalContainer}>
          <BlockedOverlayScreen
            appName="Instagram"
            sessionTitle={activeSessionTitle}
            remainingTimeText={remainingTimeText}
            onDismiss={() => setShowBlockedOverlay(false)}
          />
        </View>
      </Modal>

      {/* Passcode Protection Verification Modal */}
      <PasscodeModal
        visible={passcodeModalVisible}
        mode={passcodeMode}
        onSuccess={() => {
          setPasscodeModalVisible(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        onCancel={() => {
          setPasscodeModalVisible(false);
          setPendingAction(null);
        }}
      />

      {/* 10-Second Reflection Countdown Modal */}
      <EndSessionCountdownModal
        visible={showReflectionCountdown}
        onConfirmEnd={handleConfirmEndSession}
        onCountdownComplete={handleConfirmEndSession}
        onCancel={() => setShowReflectionCountdown(false)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
  },
  fullModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
