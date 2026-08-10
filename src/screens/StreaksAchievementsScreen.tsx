import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { FocusCard } from '../components/FocusCard';

export const StreaksAchievementsScreen: React.FC = () => {
  const achievements = [
    { title: '7-Day Titan', desc: 'Maintained 7 consecutive focus days', icon: '🔥', unlocked: true },
    { title: 'Distraction Shield', desc: 'Blocked 50+ app distraction attempts', icon: '🛡️', unlocked: true },
    { title: 'Century Master', desc: 'Accumulated 100+ deep focus hours', icon: '💎', unlocked: false },
    { title: 'Night Owl', desc: 'Completed 5 late-night focus sessions', icon: '🦉', unlocked: true },
    { title: 'Unstoppable', desc: 'Reach a 30-day focus streak', icon: '⚡', unlocked: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[typography.bodySmall, { color: colors.textMuted }]}>GAMIFICATION & BADGES</Text>
        <Text style={[typography.displayMedium, { color: colors.textPrimary, marginTop: 4 }]}>
          Streaks & Achievements
        </Text>
      </View>

      {/* Main Flame Card */}
      <FocusCard style={styles.flameCard} active>
        <View style={styles.flameRow}>
          <Text style={styles.flameIcon}>🔥</Text>
          <View style={{ marginLeft: spacing.md }}>
            <Text style={[typography.labelCaps, { color: colors.tertiary }]}>ACTIVE STREAK</Text>
            <Text style={[typography.displayMedium, { color: colors.textPrimary }]}>7 Days</Text>
            <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>
              Keep focusing daily to keep the fire burning!
            </Text>
          </View>
        </View>
      </FocusCard>

      <Text style={[typography.headlineSmall, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        All Badges
      </Text>

      {achievements.map((item, index) => (
        <FocusCard key={index} style={[styles.badgeCard, !item.unlocked && styles.lockedCard]}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeIcon}>{item.icon}</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.headlineSmall, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>
                {item.desc}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text
                style={[
                  typography.bodySmall,
                  { color: item.unlocked ? colors.secondary : colors.textMuted },
                ]}>
                {item.unlocked ? 'Unlocked ✓' : 'Locked 🔒'}
              </Text>
            </View>
          </View>
        </FocusCard>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.containerMargin,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  flameCard: {
    marginBottom: spacing.lg,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameIcon: {
    fontSize: 48,
  },
  badgeCard: {
    marginBottom: spacing.sm,
  },
  lockedCard: {
    opacity: 0.6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 28,
  },
  statusPill: {
    backgroundColor: colors.surfaceHigh,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
  },
});
