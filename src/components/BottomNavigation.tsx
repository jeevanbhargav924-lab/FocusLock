import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { FocusIcon, HistoryIcon, HomeIcon, SettingsIcon, StatisticsIcon } from '../utils/Icons';
import { colors, fonts } from '../theme';

export type TabKey = 'home' | 'history' | 'focus' | 'stats' | 'settings';

interface BottomNavigationProps {
  activeTab: TabKey;
  onSelectTab?: (tab: TabKey) => void;
  onTabPress?: (tab: TabKey) => void;
  onCenterFabPress?: () => void;
  bottomInset?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onTabPress,
  onCenterFabPress,
  bottomInset,
}) => {
  const insets = useSafeAreaInsets();
  const rawBottom = bottomInset !== undefined ? bottomInset : insets.bottom;
  // Pad the bottom of the solid dock cleanly for gesture bar or 3-button navigation
  const bottomPadding = Math.max(10, rawBottom + (rawBottom > 0 ? 4 : 8));

  const handleTabSelect = (tab: TabKey) => {
    if (tab === 'focus' && onCenterFabPress) {
      onCenterFabPress();
    }
    if (onSelectTab) {
      onSelectTab(tab);
    }
    if (onTabPress) {
      onTabPress(tab);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactElement }[] = [
    { key: 'home', label: 'Home', icon: <HomeIcon /> },
    { key: 'history', label: 'History', icon: <HistoryIcon /> },
    { key: 'focus', label: 'Focus', icon: <FocusIcon /> },
    { key: 'stats', label: 'Stats', icon: <StatisticsIcon /> },
    { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <View style={styles.dockContainer} pointerEvents="box-none">
      {/* Top Gradient Scrim to dissolve scrolling content smoothly into the bar */}
      <View style={styles.scrimContainer} pointerEvents="none">
        <Svg height={28} width="100%">
          <Defs>
            <LinearGradient id="dockScrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.background} stopOpacity="0" />
              <Stop offset="1" stopColor={colors.background} stopOpacity="0.85" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={28} fill="url(#dockScrim)" />
        </Svg>
      </View>

      {/* Solid Grounded Dock Navigation Bar */}
      <View style={[styles.dockBar, { paddingBottom: bottomPadding }]}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const isFocusCenter = tab.key === 'focus';

          // Floating Elevated Center FAB (Focus)
          if (isFocusCenter) {
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => handleTabSelect(tab.key)}
                style={styles.centerFabContainer}>
                <View style={styles.centerFabGlowRing}>
                  <View style={styles.centerFabCircle}>
                    {React.cloneElement(tab.icon as React.ReactElement<any>, {
                      color: '#070A10',
                      fill: '#070A10',
                      width: 26,
                      height: 26,
                    })}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // Regular Tabs (Home, History, Stats, Settings)
          const activeColor = '#A855F7';
          const iconColor = isActive ? activeColor : colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => handleTabSelect(tab.key)}
              style={styles.tabItem}>
              <View style={[styles.tabIconWrapper, isActive && styles.activeTabIconWrapper]}>
                {React.cloneElement(tab.icon as React.ReactElement<any>, {
                  color: iconColor,
                  fill: iconColor,
                  width: 22,
                  height: 22,
                })}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? activeColor : colors.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  scrimContainer: {
    width: '100%',
    height: 28,
  },
  dockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#11141A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 20,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconWrapper: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderRadius:20,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A855F7',
    marginTop: 3,
  },

  /* Elevated Center Floating FAB */
  centerFabContainer: {
    top: -22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  centerFabGlowRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0, 230, 118, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  centerFabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
});


