import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { spacing, colors } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon} from '../utils/Icons';

export interface AppItem {
  id: string;
  name: string;
  packageName?: string;
  iconText: string;
  isAllowed: boolean;
}

interface AllowedAppsScreenProps {
  onBack?: () => void;
  onClose?: () => void;
  onSaveAllowedApps?: (
    count: number,
    blockedPkgs: string[],
    allowedPkgs: string[],
  ) => void;
  onUpdateAllowedApps?: (
    count: number,
    blockedPkgs: string[],
    allowedPkgs: string[],
  ) => void;
}

export const AllowedAppsScreen: React.FC<AllowedAppsScreenProps> = ({
  onBack,
  onClose,
  onSaveAllowedApps,
  onUpdateAllowedApps,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppItem[]>([]);

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

  const loadRealInstalledApps = async () => {
    if (
      Platform.OS === 'android' &&
      NativeModules.PermissionModule?.getInstalledApps
    ) {
      try {
        const rawApps: any[] =
          await NativeModules.PermissionModule.getInstalledApps();
        if (Array.isArray(rawApps) && rawApps.length > 0) {
          const parsedApps: AppItem[] = rawApps.map((a, idx) => ({
            id: a.packageName || String(idx),
            name: a.appName || a.name || a.packageName || 'App',
            packageName: a.packageName,
            iconText: getIconForAppName(a.appName || a.name || ''),
            isAllowed: Boolean(a.isAllowed),
          }));
          setApps(parsedApps);
        }
      } catch (e) {
        console.warn('Error loading installed apps:', e);
      }
    }
  };

  const getIconForAppName = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('phone') || lower.includes('dialer')) return '📞';
    if (lower.includes('map')) return '🗺️';
    if (lower.includes('calc')) return '𝧮';
    if (lower.includes('insta')) return '📷';
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

  const handleDismiss = () => {
    if (onClose) onClose();
    if (onBack) onBack();
  };

  const toggleApp = (id: string) => {
    setApps(prev =>
      prev.map(app =>
        app.id === id ? { ...app, isAllowed: !app.isAllowed } : app,
      ),
    );
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const allowedApps = filteredApps.filter(app => app.isAllowed);
  const blockedApps = filteredApps.filter(app => !app.isAllowed);

  const handleSave = () => {
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

    const allowed = apps
      .filter(a => a.isAllowed)
      .map(a => a.packageName || a.id);
    const blocked = apps
      .filter(a => !a.isAllowed)
      .map(a => a.packageName || a.id)
      .filter(pkg => {
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
      });

    if (onSaveAllowedApps) {
      onSaveAllowedApps(allowed.length, blocked, allowed);
    }
    if (onUpdateAllowedApps) {
      onUpdateAllowedApps(allowed.length, blocked, allowed);
    }
    handleDismiss();
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleDismiss} style={styles.backBtn}>
            <Text style={styles.backArrow}>
              {' '}
              <BackIcon />{' '}
            </Text>
          </TouchableOpacity>
          <Text style={styles.brandTitle}>FocusLock</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Main Title & Subtitle */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Select Allowed Apps</Text>
          <Text style={styles.subtitle}>
            Choose which apps remain accessible during your focus session.
            Everything else will be blocked.
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search installed apps..."
            placeholderTextColor="#8B949E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4ECCA3"
            style={{ marginVertical: 30 }}
          />
        ) : (
          <>
            {/* Section 1: Allowed Apps */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabelGreen}>
                  ALLOWED APPS ({allowedApps.length})
                </Text>
              </View>

              {allowedApps.map(app => (
                <View key={app.id} style={styles.appRow}>
                  <View style={styles.appIconBadgeAllowed}>
                    <Text style={styles.appIconText}>{app.iconText}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appSubText}>Accessible in session</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleApp(app.id)}
                    style={styles.removePill}
                  >
                    <Text style={styles.removePillText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Section 2: Blocked Apps */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabelRed}>
                  BLOCKED APPS ({blockedApps.length})
                </Text>
              </View>

              {blockedApps.map(app => (
                <View key={app.id} style={styles.appRow}>
                  <View style={styles.appIconBadgeBlocked}>
                    <Text style={styles.appIconText}>{app.iconText}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appSubText}>Distraction • Blocked</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleApp(app.id)}
                    style={styles.addPill}
                  >
                    <Text style={styles.addPillText}>+ Allow</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Save Action */}
      <View
        style={[
          styles.fixedBottomContainer,
          { paddingBottom: Math.max(spacing.md, insets.bottom + 10) },
        ]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.saveBtn}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Allowed Apps</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: 30,
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
    fontSize: 20,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  gearIcon: {
    fontSize: 20,
  },
  header: {
    marginBottom: spacing.lg,
  },
  mainTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    marginBottom: spacing.sm,
  },
  sectionLabelGreen: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionLabelRed: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
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
  appIconBadgeAllowed: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconBadgeBlocked: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 18,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  appSubText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  removePill: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  removePillText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  addPill: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addPillText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  fixedBottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
