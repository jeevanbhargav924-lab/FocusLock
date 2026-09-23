import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, StyleSheet, View, NativeModules, Platform, Alert, Modal, BackHandler } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigation, TabKey } from './src/components/BottomNavigation';
import { ScreenLayout } from './src/components/ScreenLayout';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PermissionSetupScreen } from './src/screens/PermissionSetupScreen';

import { HomeScreen } from './src/screens/HomeScreen';
import { CreateSessionScreen } from './src/screens/CreateSessionScreen';
import { ActiveSessionScreen } from './src/screens/ActiveSessionScreen';
import { SessionCompletedScreen } from './src/screens/SessionCompletedScreen';

import { AllowedAppsScreen } from './src/screens/AllowedAppsScreen';
import { BlockedOverlayScreen } from './src/screens/BlockedOverlayScreen';
import { PasscodeModal } from './src/components/PasscodeModal';
import { EndSessionCountdownModal } from './src/components/EndSessionCountdownModal';
import { UpdateModal } from './src/components/UpdateModal';
import { checkForAppUpdate, UpdateInfo } from './src/services/updateChecker';

import { FocusHistoryScreen } from './src/screens/FocusHistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { StreaksAchievementsScreen } from './src/screens/StreaksAchievementsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { initDatabase, saveSessionRecord, calculateFocusScore } from './src/services/database';
import { Toast, ToastContainer } from './src/components/Toast';
import { colors } from './src/theme';

type AppFlowStep = 'splash' | 'onboarding' | 'permissions' | 'main';

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
  const [tabHistory, setTabHistory] = useState<TabKey[]>(['home']);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);

  const tabHistoryRef = useRef<TabKey[]>(['home']);
  const activeTabRef = useRef<TabKey>('home');
  const flowStepRef = useRef<AppFlowStep>('splash');

  const showReflectionCountdownRef = useRef(false);
  const passcodeModalVisibleRef = useRef(false);
  const showCreateSessionRef = useRef(false);
  const showAllowedAppsRef = useRef(false);
  const showSessionCompletedRef = useRef(false);
  const showBlockedOverlayRef = useRef(false);
  const showAchievementsModalRef = useRef(false);
  const showUpdateModalRef = useRef(false);
  const updateInfoRef = useRef<UpdateInfo | null>(null);

  // Session & Protection States
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isStrictModeActive, setIsStrictModeActive] = useState<boolean>(false);
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('Deep Focus Session');
  const [remainingTimeText, setRemainingTimeText] = useState<string>('00:00:00');
  const [allowedAppsCount, setAllowedAppsCount] = useState<number>(0);
  const [customBlockedPkgs, setCustomBlockedPkgs] = useState<string[]>([]);
  const [customAllowedPkgs, setCustomAllowedPkgs] = useState<string[]>([]);

  // Overlay / Modal Visibility
  const [showCreateSession, setShowCreateSession] = useState<boolean>(false);
  const [showSessionCompleted, setShowSessionCompleted] = useState<boolean>(false);
  const [showAllowedApps, setShowAllowedApps] = useState<boolean>(false);
  const [showBlockedOverlay, setShowBlockedOverlay] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
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
    sessionTitle?: string;
    emergencyUnlocks?: number;
    score?: number;
    topAttemptedApp?: string;
  }>({
    isManualEnd: false,
    plannedMinutes: 25,
    completedMinutes: 25,
    remainingMinutes: 0,
    blockedAttempts: 0,
    sessionTitle: 'Deep Focus Session',
    emergencyUnlocks: 0,
    score: 100,
  });

  // Keep navigation and modal refs in sync
  useEffect(() => { tabHistoryRef.current = tabHistory; }, [tabHistory]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { flowStepRef.current = flowStep; }, [flowStep]);
  useEffect(() => { showReflectionCountdownRef.current = showReflectionCountdown; }, [showReflectionCountdown]);
  useEffect(() => { passcodeModalVisibleRef.current = passcodeModalVisible; }, [passcodeModalVisible]);
  useEffect(() => { showCreateSessionRef.current = showCreateSession; }, [showCreateSession]);
  useEffect(() => { showAllowedAppsRef.current = showAllowedApps; }, [showAllowedApps]);
  useEffect(() => { showSessionCompletedRef.current = showSessionCompleted; }, [showSessionCompleted]);
  useEffect(() => { showBlockedOverlayRef.current = showBlockedOverlay; }, [showBlockedOverlay]);
  useEffect(() => { showAchievementsModalRef.current = showAchievementsModal; }, [showAchievementsModal]);
  useEffect(() => { showUpdateModalRef.current = showUpdateModal; }, [showUpdateModal]);
  useEffect(() => { updateInfoRef.current = updateInfo; }, [updateInfo]);

  // Navigate to tab and update history stack
  const navigateToTab = useCallback((targetTab: TabKey) => {
    setActiveTab(currentTab => {
      if (currentTab === targetTab) return currentTab;

      if (targetTab === 'home') {
        tabHistoryRef.current = ['home'];
        setTabHistory(['home']);
        return targetTab;
      }

      const existingIndex = tabHistoryRef.current.indexOf(targetTab);
      let nextHistory: TabKey[];
      if (existingIndex !== -1) {
        nextHistory = tabHistoryRef.current.slice(0, existingIndex + 1);
      } else {
        nextHistory = [...tabHistoryRef.current, targetTab];
      }
      tabHistoryRef.current = nextHistory;
      setTabHistory(nextHistory);
      return targetTab;
    });
  }, []);

  // Back action: modals -> previous tabs -> exit on home
  const handleGoBack = useCallback(() => {
    if (showUpdateModalRef.current) {
      if (!updateInfoRef.current?.isForced) {
        setShowUpdateModal(false);
      }
      return true;
    }
    if (showReflectionCountdownRef.current) {
      setShowReflectionCountdown(false);
      return true;
    }
    if (passcodeModalVisibleRef.current) {
      setPasscodeModalVisible(false);
      setPendingAction(null);
      return true;
    }
    if (showAchievementsModalRef.current) {
      setShowAchievementsModal(false);
      return true;
    }
    if (showCreateSessionRef.current) {
      setShowCreateSession(false);
      return true;
    }
    if (showAllowedAppsRef.current) {
      setShowAllowedApps(false);
      return true;
    }
    if (showSessionCompletedRef.current) {
      setShowSessionCompleted(false);
      navigateToTab('home');
      return true;
    }
    if (showBlockedOverlayRef.current) {
      return true;
    }

    if (tabHistoryRef.current.length > 1) {
      const nextHistory = [...tabHistoryRef.current];
      nextHistory.pop();
      const previousTab = nextHistory[nextHistory.length - 1];
      tabHistoryRef.current = nextHistory;
      setTabHistory(nextHistory);
      setActiveTab(previousTab);
      return true;
    }

    if (activeTabRef.current !== 'home') {
      tabHistoryRef.current = ['home'];
      setTabHistory(['home']);
      setActiveTab('home');
      return true;
    }

    return false;
  }, [navigateToTab]);

  // Intercept Android hardware / gesture back button
  useEffect(() => {
    const onBackPress = () => {
      if (flowStepRef.current !== 'main') {
        return false;
      }
      return handleGoBack();
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [handleGoBack]);

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

        // 2. Restore Saved Allowed & Blocked Packages
        const savedAllowed = await AsyncStorage.getItem('@focuslock_allowed_pkgs');
        const savedBlocked = await AsyncStorage.getItem('@focuslock_blocked_pkgs');
        if (savedAllowed) {
          try {
            const parsedAllowed: string[] = JSON.parse(savedAllowed);
            if (Array.isArray(parsedAllowed)) {
              setCustomAllowedPkgs(parsedAllowed);
              setAllowedAppsCount(parsedAllowed.length);
            }
          } catch (_) {}
        }
        if (savedBlocked) {
          try {
            const parsedBlocked: string[] = JSON.parse(savedBlocked);
            if (Array.isArray(parsedBlocked)) {
              setCustomBlockedPkgs(parsedBlocked);
            }
          } catch (_) {}
        }

        // Local Mode Initialized
      } catch (e) {
        console.warn('Error checking initial app state:', e);
      }
    };

    checkInitialState();

    // Check for remote app updates asynchronously
    checkForAppUpdate().then(async info => {
      if (info && info.hasUpdate) {
        if (!info.isForced) {
          try {
            const lastDismissed = await AsyncStorage.getItem('@last_update_dismissed_time');
            if (lastDismissed) {
              const elapsed = Date.now() - parseInt(lastDismissed, 10);
              // Snooze optional update prompt for 24 hours after user taps "Later"
              if (elapsed < 24 * 60 * 60 * 1000) {
                return;
              }
            }
          } catch {}
        }
        setUpdateInfo(info);
        setShowUpdateModal(true);
      }
    });
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

  const handleOpenCreateSession = (minutes?: number) => {
    if (typeof minutes === 'number' && minutes > 0) {
      setSessionMinutes(minutes);
    }
    navigateToTab('focus');
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
    setIsStrictModeActive(strictMode);
    setIsSessionActive(true);
    setShowCreateSession(false);
    setShowAllowedApps(false);
    navigateToTab('focus');

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

        let finalBlocked = customBlockedPkgs;
        if (finalBlocked.length === 0 && Platform.OS === 'android' && NativeModules.PermissionModule?.getInstalledApps) {
          try {
            const rawApps: any[] = await NativeModules.PermissionModule.getInstalledApps();
            if (Array.isArray(rawApps) && rawApps.length > 0) {
              finalBlocked = rawApps
                .map(a => a.packageName)
                .filter(Boolean);
            }
          } catch (_) {}
        }
        if (finalBlocked.length === 0) {
          finalBlocked = defaultBlocked;
        }

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
      } catch {}
    }

    // 2. Fetch real-time distraction metrics from native layer
    let blockedAttempts = pendingManualEndData.blockedCount || 0;
    let topAttemptedApp = '';
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.getActiveSessionDistractions) {
      try {
        const distData = await NativeModules.PermissionModule.getActiveSessionDistractions();
        if (distData && typeof distData.totalCount === 'number') {
          blockedAttempts = Math.max(blockedAttempts, distData.totalCount);
          topAttemptedApp = distData.topApp || '';
        }
      } catch {}
    }

    // 3. Compute deterministic focus score
    const scoreBreakdown = calculateFocusScore({
      plannedMinutes: sessionMinutes,
      actualMinutes: completedMins,
      status: 'ended',
      distractionAttempts: blockedAttempts,
      emergencyUnlocks: 1,
      strictMode: isStrictModeActive,
    });
    const computedScore = scoreBreakdown.totalScore;

    // 4. Mark active session stopped in Native Android SQLite DB & Service with metrics
    if (Platform.OS === 'android') {
      try {
        if (NativeModules.PermissionModule?.stopFocusSessionWithMetrics) {
          await NativeModules.PermissionModule.stopFocusSessionWithMetrics(completedMins, computedScore, blockedAttempts);
        } else if (NativeModules.PermissionModule?.stopFocusSession) {
          await NativeModules.PermissionModule.stopFocusSession();
        }
      } catch {}
    }

    // 5. Save completed session record into JS SQLite database with status 'ended'
    const now = new Date();
    const startTimeStr = new Date(now.getTime() - elapsedSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentUid = 'local_user';

    await saveSessionRecord(
      {
        title: activeSessionTitle || 'Deep Focus Session',
        category: 'coding',
        start_time: startTimeStr,
        end_time: endTimeStr,
        planned_minutes: sessionMinutes,
        actual_minutes: completedMins,
        status: 'ended', // Manual end is marked as 'ended'
        score: computedScore,
        blocked_attempts: blockedAttempts,
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
      } catch {}
    }

    // 6. Configure completionMeta for manual end screen
    setCompletionMeta({
      isManualEnd: true,
      plannedMinutes: sessionMinutes,
      completedMinutes: completedMins,
      remainingMinutes: remainingMins,
      blockedAttempts: blockedAttempts,
      sessionTitle: activeSessionTitle || 'Deep Focus Session',
      emergencyUnlocks: 1,
      score: computedScore,
      topAttemptedApp,
    });

    setIsSessionActive(false);
    setShowSessionCompleted(true);
  };

  const handleNaturalSessionCompletion = async () => {
    // 1. Fetch real-time distraction metrics from native layer
    let blockedAttempts = 0;
    let topAttemptedApp = '';
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.getActiveSessionDistractions) {
      try {
        const distData = await NativeModules.PermissionModule.getActiveSessionDistractions();
        if (distData && typeof distData.totalCount === 'number') {
          blockedAttempts = distData.totalCount;
          topAttemptedApp = distData.topApp || '';
        }
      } catch {}
    }

    // 2. Compute deterministic focus score
    const scoreBreakdown = calculateFocusScore({
      plannedMinutes: sessionMinutes,
      actualMinutes: sessionMinutes,
      status: 'completed',
      distractionAttempts: blockedAttempts,
      emergencyUnlocks: 0,
      strictMode: isStrictModeActive,
    });
    const computedScore = scoreBreakdown.totalScore;

    // 3. Mark active session completed in Native Android SQLite DB & Service
    if (Platform.OS === 'android') {
      try {
        if (NativeModules.PermissionModule?.completeFocusSessionWithMetrics) {
          await NativeModules.PermissionModule.completeFocusSessionWithMetrics(computedScore, blockedAttempts);
        } else if (NativeModules.PermissionModule?.completeFocusSession) {
          await NativeModules.PermissionModule.completeFocusSession();
        } else if (NativeModules.PermissionModule?.stopFocusSession) {
          await NativeModules.PermissionModule.stopFocusSession();
        }
      } catch {}
    }

    // 4. Save completed session record into database with status 'completed'
    const now = new Date();
    const startTimeStr = new Date(now.getTime() - sessionMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentUid = 'local_user';

    await saveSessionRecord(
      {
        title: activeSessionTitle || 'Deep Focus Session',
        category: 'coding',
        start_time: startTimeStr,
        end_time: endTimeStr,
        planned_minutes: sessionMinutes,
        actual_minutes: sessionMinutes,
        status: 'completed', // Full duration completed naturally
        score: computedScore,
        blocked_attempts: blockedAttempts,
      },
      currentUid
    );

    // 5. Configure completionMeta for natural completion screen
    setCompletionMeta({
      isManualEnd: false,
      plannedMinutes: sessionMinutes,
      completedMinutes: sessionMinutes,
      remainingMinutes: 0,
      blockedAttempts: blockedAttempts,
      sessionTitle: activeSessionTitle || 'Deep Focus Session',
      emergencyUnlocks: 0,
      score: computedScore,
      topAttemptedApp,
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
            onOpenActiveSession={() => navigateToTab('focus')}
            onOpenHistory={() => navigateToTab('history')}
            onOpenAchievements={() => setShowAchievementsModal(true)}
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
            onCancel={handleGoBack}
            onStartCreatedSession={handleStartActiveSession}
            onNavigateToAllowedApps={handleOpenAllowedApps}
            allowedAppsCount={allowedAppsCount}
          />
        );

      case 'history':
        return <FocusHistoryScreen onNavigateToStats={() => navigateToTab('stats')} />;
      case 'stats':
        return (
          <StatsScreen
            onOpenAchievements={() => setShowAchievementsModal(true)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={handleGoBack}
          />
        );
      default:
        return (
          <HomeScreen
            onStartSession={handleOpenCreateSession}
            onNavigateToApps={handleOpenAllowedApps}
            isSessionActive={isSessionActive}
            onOpenActiveSession={() => navigateToTab('focus')}
            onOpenHistory={() => navigateToTab('history')}
            onOpenAchievements={() => setShowAchievementsModal(true)}
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
        !showBlockedOverlay &&
        !showAchievementsModal && (
          <BottomNavigation
            activeTab={activeTab}
            onSelectTab={navigateToTab}
          />
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
            sessionTitle={completionMeta.sessionTitle}
            blockedAttempts={completionMeta.blockedAttempts}
            topAttemptedApp={completionMeta.topAttemptedApp}
            emergencyUnlocks={completionMeta.emergencyUnlocks}
            score={completionMeta.score}
            timeSavedMinutes={Math.round(completionMeta.completedMinutes * 0.8)}
            onStartAnotherSession={() => {
              setShowSessionCompleted(false);
              setShowCreateSession(true);
            }}
            onReturnHome={() => {
              setShowSessionCompleted(false);
              navigateToTab('home');
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
            initialAllowedPkgs={customAllowedPkgs}
            onBack={() => setShowAllowedApps(false)}
            onSaveAllowedApps={(count, blocked, allowed) => {
              setAllowedAppsCount(count);
              setCustomBlockedPkgs(blocked);
              setCustomAllowedPkgs(allowed);
              AsyncStorage.setItem('@focuslock_allowed_pkgs', JSON.stringify(allowed)).catch(() => {});
              AsyncStorage.setItem('@focuslock_blocked_pkgs', JSON.stringify(blocked)).catch(() => {});
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

      {/* Gamification Hub: Streaks & Achievements Modal */}
      <Modal
        visible={showAchievementsModal}
        animationType="slide"
        onRequestClose={() => setShowAchievementsModal(false)}>
        <View style={styles.fullModalContainer}>
          <StreaksAchievementsScreen
            onClose={() => setShowAchievementsModal(false)}
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

      {/* App Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onDismiss={async () => {
          setShowUpdateModal(false);
          try {
            await AsyncStorage.setItem('@last_update_dismissed_time', Date.now().toString());
          } catch {}
        }}
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
