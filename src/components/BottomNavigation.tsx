import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FocusIcon, HistoryIcon, HomeIcon, SettingsIcon, StatisticsIcon } from '../utils/Icons';

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
                      color: '#1E1B4B',
                      width: 26,
                      height: 26,
                    })}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // Regular Tabs (Home, History, Stats, Settings)
          const iconColor = isActive ? '#4ECCA3' : '#6E7681';

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => handleTabSelect(tab.key)}
              style={[
                styles.tabItem,
                isActive && styles.activeTabPill,
              ]}>
              {React.cloneElement(tab.icon as React.ReactElement<any>, {
                color: iconColor,
                width: 20,
                height: 20,
              })}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? '#4ECCA3' : '#6E7681',
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}>
                {tab.label}
              </Text>
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
    bottom: 12,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F141C',
    borderRadius: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 24,
    gap: 6,
  },
  activeTabPill: {
    backgroundColor: '#0E3A2F',
    borderWidth: 1,
    borderColor: 'rgba(78, 204, 163, 0.3)',
  },
  tabLabel: {
    fontSize: 12,
  },

  /* Center Floating FAB Button Styles */
  centerFabContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  middleGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(78, 204, 163, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  centerFabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4ECCA3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECCA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
