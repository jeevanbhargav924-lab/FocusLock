import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FocusIcon, HistoryIcon, HomeIcon, SettingsIcon, StatisticsIcon } from '../utils/Icons';
import { colors, fonts } from '../theme';

export type TabKey = 'home' | 'history' | 'focus' | 'stats' | 'settings';

interface BottomNavigationProps {
  activeTab: TabKey;
  onSelectTab?: (tab: TabKey) => void;
  onTabPress?: (tab: TabKey) => void;
  onCenterFabPress?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onTabPress,
  onCenterFabPress,
}) => {
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
    <View style={styles.navContainer}>
      <View style={styles.navBar}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const isFocusCenter = tab.key === 'focus';

          // Floating Center FAB Button (Focus)
          if (isFocusCenter) {
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => handleTabSelect(tab.key)}
                style={styles.centerFabContainer}>
                <View style={styles.middleGlow}>
                  <View style={styles.centerFabCircle}>
                    {React.cloneElement(tab.icon as React.ReactElement<any>, {
                      color: colors.onSecondary,
                      fill: colors.onSecondary,
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
              {React.cloneElement(tab.icon as React.ReactElement<any>, {
                color: iconColor,
                fill: iconColor,
                width: 22,
                height: 22,
              })}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? activeColor : colors.textMuted,
                  },
                ]}>
                {tab.label}
              </Text>
              {isActive && <View style={[styles.activeIndicatorLine, { backgroundColor: activeColor, shadowColor: activeColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#13161B',
    borderRadius: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 24,
    position: 'relative',
    gap: 4,
  },
  activeIndicatorLine: {
    position: 'absolute',
    bottom: -2,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },

  /* Center Floating FAB Button Styles */
  centerFabContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  middleGlow: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  centerFabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
});


