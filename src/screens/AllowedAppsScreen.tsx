import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  NativeModules,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { spacing, colors } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon } from '../utils/Icons';

export interface TopDistractionDef {
  id: string;
  name: string;
  defaultPackage: string;
  iconText: string;
  brandColor: string;
  category: string;
  packagePatterns: string[];
  namePatterns: string[];
}

export const TOP_5_DISTRACTIONS: TopDistractionDef[] = [
  {
    id: 'top_instagram',
    name: 'Instagram',
    defaultPackage: 'com.instagram.android',
    iconText: '📷',
    brandColor: '#E1306C',
    category: 'Social Media',
    packagePatterns: ['instagram'],
    namePatterns: ['instagram', 'insta'],
  },
  {
    id: 'top_snapchat',
    name: 'Snapchat',
    defaultPackage: 'com.snapchat.android',
    iconText: '👻',
    brandColor: '#E5A84B',
    category: 'Social Media',
    packagePatterns: ['snapchat'],
    namePatterns: ['snapchat', 'snap'],
  },
  {
    id: 'top_chrome',
    name: 'Google Chrome',
    defaultPackage: 'com.android.chrome',
    iconText: '🌐',
    brandColor: '#4285F4',
    category: 'Web Browser',
    packagePatterns: [
      'com.android.chrome',
      'chrome.beta',
      'chrome.dev',
      'chrome.canary',
      'apps.chrome',
    ],
    namePatterns: ['chrome'],
  },
  {
    id: 'top_facebook',
    name: 'Facebook',
    defaultPackage: 'com.facebook.katana',
    iconText: '👥',
    brandColor: '#1877F2',
    category: 'Social Media',
    packagePatterns: [
      'facebook.katana',
      'facebook.orca',
      'facebook.lite',
      'com.facebook',
    ],
    namePatterns: ['facebook', 'meta'],
  },
  {
    id: 'top_youtube',
    name: 'YouTube',
    defaultPackage: 'com.google.android.youtube',
    iconText: '▶️',
    brandColor: '#FF0000',
    category: 'Video & Entertainment',
    packagePatterns: ['android.youtube'],
    namePatterns: ['youtube'],
  },
];

export interface AppItem {
  id: string;
  name: string;
  packageName?: string;
  iconText: string;
  isBlocked: boolean;
  isTop5?: boolean;
  brandColor?: string;
  category?: string;
  isInstalled?: boolean;
}

interface AllowedAppsScreenProps {
  initialAllowedPkgs?: string[];
  initialBlockedPkgs?: string[];
  initialMode?: 'blocklist' | 'allowlist';
  onBack?: () => void;
  onClose?: () => void;
  onSaveAllowedApps?: (
    count: number,
    blockedPkgs: string[],
    allowedPkgs: string[],
    mode?: 'blocklist' | 'allowlist',
  ) => void;
  onUpdateAllowedApps?: (
    count: number,
    blockedPkgs: string[],
    allowedPkgs: string[],
    mode?: 'blocklist' | 'allowlist',
  ) => void;
}

const SYSTEM_EXCLUDED = [
  'com.google.android.googlequicksearchbox',
  'com.android.systemui',
  'com.android.settings',
  'com.google.android.apps.nexuslauncher',
  'com.sec.android.app.launcher',
  'com.android.launcher',
  'com.android.launcher3',
  'com.google.android.dialer',
  'com.android.dialer',
  'com.android.phone',
  'com.android.server.telecom',
];

export const AllowedAppsScreen: React.FC<AllowedAppsScreenProps> = ({
  initialAllowedPkgs,
  initialBlockedPkgs,
  initialMode = 'blocklist',
  onBack,
  onClose,
  onSaveAllowedApps,
  onUpdateAllowedApps,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android'
    ? Math.max(StatusBar.currentHeight || 0, insets.top, 38)
    : Math.max(insets.top, 16);
  const [mode, setMode] = useState<'blocklist' | 'allowlist'>(initialMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [top5Apps, setTop5Apps] = useState<AppItem[]>([]);
  const [otherApps, setOtherApps] = useState<AppItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'blocked' | 'allowed'>('all');

  useEffect(() => {
    let isMounted = true;

    const fetchApps = async () => {
      setLoading(true);
      try {
        await loadRealInstalledApps();
      } catch (e) {
        console.warn('Error fetching installed apps:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchApps();

    return () => {
      isMounted = false;
    };
  }, []);

  const getIconForAppName = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('phone') || lower.includes('dialer')) return '📞';
    if (lower.includes('map')) return '🗺️';
    if (lower.includes('calc')) return '𝧮';
    if (lower.includes('insta')) return '📷';
    if (lower.includes('snap')) return '👻';
    if (lower.includes('tube') || lower.includes('video')) return '▶️';
    if (
      lower.includes('chat') ||
      lower.includes('messag') ||
      lower.includes('what')
    )
      return '💬';
    if (lower.includes('browser') || lower.includes('chrome')) return '🌐';
    if (lower.includes('game') || lower.includes('play')) return '🎮';
    if (lower.includes('mail') || lower.includes('gmail')) return '✉️';
    if (lower.includes('clock') || lower.includes('alarm')) return '⏱️';
    if (lower.includes('setting')) return '⚙️';
    if (lower.includes('music') || lower.includes('spotify')) return '🎵';
    if (lower.includes('camera') || lower.includes('photo')) return '📸';
    return '📱';
  };

  const loadRealInstalledApps = async () => {
    let rawApps: any[] = [];

    if (
      Platform.OS === 'android' &&
      NativeModules.PermissionModule?.getInstalledApps
    ) {
      try {
        const result = await NativeModules.PermissionModule.getInstalledApps();
        if (Array.isArray(result)) {
          rawApps = result;
        }
      } catch (e) {
        console.warn('Error loading installed apps from native:', e);
      }
    }

    // Determine initial blocked packages
    const hasCustomBlocked =
      Array.isArray(initialBlockedPkgs) && initialBlockedPkgs.length > 0;
    const hasCustomAllowed =
      Array.isArray(initialAllowedPkgs) && initialAllowedPkgs.length > 0;

    // Track which raw apps matched our top 5 definitions
    const matchedRawPkgSet = new Set<string>();

    // 1. Build the Top 5 list (Instagram, Snapchat, Chrome, Facebook, YouTube)
    const top5List: AppItem[] = TOP_5_DISTRACTIONS.map(def => {
      // Find matching installed app
      const matched = rawApps.find(a => {
        const p = (a.packageName || '').toLowerCase();
        const n = (a.appName || a.name || '').toLowerCase();
        const pkgMatch = def.packagePatterns.some(pattern => p.includes(pattern));
        const nameMatch = def.namePatterns.some(pattern => n.includes(pattern));
        return pkgMatch || nameMatch;
      });

      const pkg = matched?.packageName || def.defaultPackage;
      if (matched?.packageName) {
        matchedRawPkgSet.add(matched.packageName);
      }

      // Blocking logic:
      // In blocklist mode:
      // If user had custom saved blocked apps, use that.
      // If not, default to TRUE for top 5 distractions!
      let isBlocked = true;
      if (hasCustomBlocked) {
        isBlocked = initialBlockedPkgs!.includes(pkg);
      } else if (mode === 'allowlist' && hasCustomAllowed) {
        isBlocked = !initialAllowedPkgs!.includes(pkg);
      }

      return {
        id: def.id,
        name: matched?.appName || matched?.name || def.name,
        packageName: pkg,
        iconText: def.iconText,
        brandColor: def.brandColor,
        category: def.category,
        isInstalled: Boolean(matched),
        isTop5: true,
        isBlocked,
      };
    });

    // 2. Build the rest of the installed apps
    const remainingList: AppItem[] = rawApps
      .filter(a => {
        const pkg = (a.packageName || '').toLowerCase();
        if (matchedRawPkgSet.has(a.packageName)) return false;
        if (SYSTEM_EXCLUDED.includes(pkg)) return false;
        if (
          pkg.includes('launcher') ||
          pkg.includes('home') ||
          pkg.includes('systemui') ||
          pkg.includes('quicksearchbox') ||
          pkg.includes('dialer') ||
          pkg.includes('telecom')
        ) {
          return false;
        }
        return true;
      })
      .map((a, idx) => {
        const pkg = a.packageName || `app_${idx}`;
        let isBlocked = false;

        if (hasCustomBlocked) {
          isBlocked = initialBlockedPkgs!.includes(pkg);
        } else if (mode === 'allowlist') {
          isBlocked = hasCustomAllowed
            ? !initialAllowedPkgs!.includes(pkg)
            : true;
        }

        return {
          id: pkg,
          name: a.appName || a.name || pkg || 'App',
          packageName: pkg,
          iconText: getIconForAppName(a.appName || a.name || ''),
          category: a.isSystem ? 'System Tool' : 'Application',
          isInstalled: true,
          isTop5: false,
          isBlocked,
        };
      });

    setTop5Apps(top5List);
    setOtherApps(remainingList);
  };

  const handleDismiss = () => {
    if (onClose) onClose();
    if (onBack) onBack();
  };

  const toggleTop5App = (id: string) => {
    setTop5Apps(prev =>
      prev.map(app =>
        app.id === id ? { ...app, isBlocked: !app.isBlocked } : app,
      ),
    );
  };

  const toggleOtherApp = (id: string) => {
    setOtherApps(prev =>
      prev.map(app =>
        app.id === id ? { ...app, isBlocked: !app.isBlocked } : app,
      ),
    );
  };

  const setAllTop5Blocked = (blocked: boolean) => {
    setTop5Apps(prev => prev.map(app => ({ ...app, isBlocked: blocked })));
  };

  const handleSave = () => {
    const allApps = [...top5Apps, ...otherApps];

    const cleanFilter = (pkg: string) => {
      const pLower = pkg.toLowerCase();
      if (SYSTEM_EXCLUDED.includes(pLower)) return false;
      if (
        pLower.includes('launcher') ||
        pLower.includes('home') ||
        pLower.includes('systemui') ||
        pLower.includes('quicksearchbox') ||
        pLower.includes('dialer') ||
        pLower.includes('telecom')
      ) {
        return false;
      }
      return true;
    };

    const blockedList = allApps
      .filter(a => a.isBlocked)
      .map(a => a.packageName || a.id)
      .filter(cleanFilter);

    const allowedList = allApps
      .filter(a => !a.isBlocked)
      .map(a => a.packageName || a.id)
      .filter(cleanFilter);

    if (mode === 'blocklist') {
      // In blocklist mode:
      // Only the selected blockedList will be passed to native engine.
      // allowedList passed is EMPTY so that all non-blocked apps stay unblocked by default!
      const count = blockedList.length;
      if (onSaveAllowedApps) {
        onSaveAllowedApps(count, blockedList, [], 'blocklist');
      }
      if (onUpdateAllowedApps) {
        onUpdateAllowedApps(count, blockedList, [], 'blocklist');
      }
    } else {
      // In allowlist mode: Whitelist enforcement
      const count = allowedList.length;
      if (onSaveAllowedApps) {
        onSaveAllowedApps(count, blockedList, allowedList, 'allowlist');
      }
      if (onUpdateAllowedApps) {
        onUpdateAllowedApps(count, blockedList, allowedList, 'allowlist');
      }
    }

    handleDismiss();
  };

  // Filtered lists for search and tabs
  const filteredTop5 = useMemo(() => {
    if (!searchQuery.trim()) return top5Apps;
    const query = searchQuery.toLowerCase();
    return top5Apps.filter(
      app =>
        app.name.toLowerCase().includes(query) ||
        (app.packageName && app.packageName.toLowerCase().includes(query)),
    );
  }, [top5Apps, searchQuery]);

  const filteredOtherApps = useMemo(() => {
    let list = otherApps;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        app =>
          app.name.toLowerCase().includes(query) ||
          (app.packageName && app.packageName.toLowerCase().includes(query)),
      );
    }
    if (activeFilter === 'blocked') {
      list = list.filter(a => a.isBlocked);
    } else if (activeFilter === 'allowed') {
      list = list.filter(a => !a.isBlocked);
    }
    return list;
  }, [otherApps, searchQuery, activeFilter]);

  const totalBlocked =
    top5Apps.filter(a => a.isBlocked).length +
    otherApps.filter(a => a.isBlocked).length;

  const totalAllowed =
    top5Apps.filter(a => !a.isBlocked).length +
    otherApps.filter(a => !a.isBlocked).length;

  const allTop5Blocked = top5Apps.every(a => a.isBlocked);

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Top Header Bar */}
      <View style={[styles.topBar, { paddingTop: topInset + 10 }]}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>
            <BackIcon />
          </Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>FocusLock</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Selector Segmented Tabs */}
        <View style={styles.modeTabsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMode('blocklist')}
            style={[
              styles.modeTab,
              mode === 'blocklist' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'blocklist' && styles.modeTabTextActive,
              ]}
            >
              🚫 Blocklist Flow
            </Text>
            {mode === 'blocklist' && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMode('allowlist')}
            style={[
              styles.modeTab,
              mode === 'allowlist' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'allowlist' && styles.modeTabTextActive,
              ]}
            >
              🛡️ Whitelist Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Title & Dynamic Explanation */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>
            {mode === 'blocklist' ? 'Block Distraction Apps' : 'Select Allowed Apps'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'blocklist'
              ? 'Select apps to block during your focus session. All other apps remain allowed by default.'
              : 'Choose which apps remain accessible. Everything else will be blocked.'}
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              mode === 'blocklist'
                ? 'Search apps to block...'
                : 'Search apps to allow...'
            }
            placeholderTextColor="#8B949E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#A855F7"
            style={{ marginVertical: 40 }}
          />
        ) : (
          <>
            {/* SECTION 1: TOP 5 DISTRACTIONS (Instagram, Snapchat, Chrome, Facebook, YouTube) */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.fireEmoji}>🔥</Text>
                  <Text style={styles.sectionTitle}>
                    TOP DISTRACTIONS TO BLOCK
                  </Text>
                  <View style={styles.top5Pill}>
                    <Text style={styles.top5PillText}>TOP 5</Text>
                  </View>
                </View>

                {mode === 'blocklist' && (
                  <TouchableOpacity
                    onPress={() => setAllTop5Blocked(!allTop5Blocked)}
                    style={styles.quickActionButton}
                  >
                    <Text style={styles.quickActionText}>
                      {allTop5Blocked ? 'Unblock All' : 'Block All 5'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.sectionSub}>
                The most common apps for procrastination. Selected apps will be
                blocked when your focus timer starts.
              </Text>

              {filteredTop5.map(app => {
                const isBlocked = app.isBlocked;
                return (
                  <TouchableOpacity
                    key={app.id}
                    activeOpacity={0.7}
                    onPress={() => toggleTop5App(app.id)}
                    style={[
                      styles.topAppCard,
                      isBlocked && styles.topAppCardBlocked,
                    ]}
                  >
                    {/* App Icon Badge with brand accent */}
                    <View
                      style={[
                        styles.topAppIconBadge,
                        { borderColor: app.brandColor || colors.border },
                      ]}
                    >
                      <Text style={styles.topAppIconText}>{app.iconText}</Text>
                    </View>

                    {/* App Info */}
                    <View style={styles.appInfo}>
                      <View style={styles.appNameRow}>
                        <Text style={styles.topAppName}>{app.name}</Text>
                        {app.isInstalled && (
                          <View style={styles.installedBadge}>
                            <Text style={styles.installedBadgeText}>
                              Installed
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.topAppCategory}>
                        {app.category || 'High Distraction'}
                      </Text>
                    </View>

                    {/* Action Status Pill */}
                    {mode === 'blocklist' ? (
                      <View
                        style={[
                          styles.actionPill,
                          isBlocked
                            ? styles.pillBlocked
                            : styles.pillAllowedDefault,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionPillText,
                            isBlocked
                              ? styles.pillBlockedText
                              : styles.pillAllowedDefaultText,
                          ]}
                        >
                          {isBlocked ? '🚫 Blocked' : '✓ Allowed'}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.actionPill,
                          !isBlocked
                            ? styles.pillAllowed
                            : styles.pillBlockedDefault,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionPillText,
                            !isBlocked
                              ? styles.pillAllowedText
                              : styles.pillBlockedDefaultText,
                          ]}
                        >
                          {!isBlocked ? '✓ Allowed' : '🔒 Blocked'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION 2: ALL OTHER INSTALLED APPS */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionTitle}>OTHER INSTALLED APPS</Text>
                  <Text style={styles.countBadgeText}>
                    ({otherApps.length})
                  </Text>
                </View>

                {/* Filter Pills */}
                <View style={styles.filterPillsRow}>
                  <TouchableOpacity
                    onPress={() => setActiveFilter('all')}
                    style={[
                      styles.filterMiniPill,
                      activeFilter === 'all' && styles.filterMiniPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterMiniPillText,
                        activeFilter === 'all' &&
                          styles.filterMiniPillTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveFilter('blocked')}
                    style={[
                      styles.filterMiniPill,
                      activeFilter === 'blocked' && styles.filterMiniPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterMiniPillText,
                        activeFilter === 'blocked' &&
                          styles.filterMiniPillTextActive,
                      ]}
                    >
                      Blocked
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveFilter('allowed')}
                    style={[
                      styles.filterMiniPill,
                      activeFilter === 'allowed' && styles.filterMiniPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterMiniPillText,
                        activeFilter === 'allowed' &&
                          styles.filterMiniPillTextActive,
                      ]}
                    >
                      Allowed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {filteredOtherApps.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? 'No matching apps found'
                      : activeFilter === 'blocked'
                      ? 'No additional apps blocked'
                      : 'No apps found'}
                  </Text>
                </View>
              ) : (
                filteredOtherApps.map(app => {
                  const isBlocked = app.isBlocked;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      activeOpacity={0.7}
                      onPress={() => toggleOtherApp(app.id)}
                      style={styles.appRow}
                    >
                      <View
                        style={[
                          styles.appIconBadge,
                          isBlocked
                            ? styles.appIconBadgeBlocked
                            : styles.appIconBadgeAllowed,
                        ]}
                      >
                        <Text style={styles.appIconText}>{app.iconText}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.appName} numberOfLines={1}>
                          {app.name}
                        </Text>
                        <Text style={styles.appSubText} numberOfLines={1}>
                          {mode === 'blocklist'
                            ? isBlocked
                              ? 'Distraction • Blocked in session'
                              : 'Allowed by default'
                            : isBlocked
                            ? 'Blocked in session'
                            : 'Allowed • Accessible'}
                        </Text>
                      </View>

                      {mode === 'blocklist' ? (
                        <View
                          style={[
                            styles.smallTogglePill,
                            isBlocked
                              ? styles.pillBlocked
                              : styles.pillNeutral,
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallToggleText,
                              isBlocked
                                ? styles.pillBlockedText
                                : styles.pillNeutralText,
                            ]}
                          >
                            {isBlocked ? '🚫 Blocked' : '+ Block'}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.smallTogglePill,
                            !isBlocked
                              ? styles.pillAllowed
                              : styles.pillNeutral,
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallToggleText,
                              !isBlocked
                                ? styles.pillAllowedText
                                : styles.pillNeutralText,
                            ]}
                          >
                            {!isBlocked ? '✓ Allowed' : '+ Allow'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Save Action */}
      <View
        style={[
          styles.fixedBottomContainer,
          { paddingBottom: Math.max(spacing.md, insets.bottom + 10) },
        ]}
      >
        <View style={styles.summaryBar}>
          <Text style={styles.summaryCount}>
            {mode === 'blocklist'
              ? `${totalBlocked} ${totalBlocked === 1 ? 'app' : 'apps'} blocked`
              : `${totalAllowed} ${totalAllowed === 1 ? 'app' : 'apps'} allowed`}
          </Text>
          <Text style={styles.summarySub}>
            {mode === 'blocklist'
              ? 'All remaining apps are allowed by default'
              : 'All unselected apps will be blocked'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.saveBtn}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {mode === 'blocklist'
              ? `Save Blocklist (${totalBlocked} Blocked)`
              : `Save Whitelist (${totalAllowed} Allowed)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backArrow: {
    color: colors.textPrimary,
    fontSize: 22,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 100,
  },
  modeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  modeTabActive: {
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: spacing.md,
  },
  mainTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  clearSearch: {
    color: colors.textMuted,
    fontSize: 16,
    paddingHorizontal: 6,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fireEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  top5Pill: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  top5PillText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  countBadgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  quickActionButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  quickActionText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
  },
  topAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  topAppCardBlocked: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  topAppIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  topAppIconText: {
    fontSize: 22,
  },
  appInfo: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topAppName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  installedBadge: {
    backgroundColor: 'rgba(84, 198, 154, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  installedBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  topAppCategory: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 84,
    alignItems: 'center',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  pillBlockedText: {
    color: '#EF4444',
  },
  pillAllowedDefault: {
    backgroundColor: 'rgba(84, 198, 154, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(84, 198, 154, 0.25)',
  },
  pillAllowedDefaultText: {
    color: colors.secondary,
  },
  pillAllowed: {
    backgroundColor: 'rgba(84, 198, 154, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(84, 198, 154, 0.4)',
  },
  pillAllowedText: {
    color: colors.secondary,
  },
  pillBlockedDefault: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  pillBlockedDefaultText: {
    color: '#EF4444',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  filterMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  filterMiniPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterMiniPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterMiniPillTextActive: {
    color: colors.textPrimary,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  appIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconBadgeBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  appIconBadgeAllowed: {
    backgroundColor: 'rgba(84, 198, 154, 0.12)',
  },
  appIconText: {
    fontSize: 17,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  appSubText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  smallTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillNeutral: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillNeutralText: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(10, 12, 16, 0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryCount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  summarySub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  saveBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
