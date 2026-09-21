import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';
import { BackIcon, FlameIcon, SparklesIcon, TargetDartBullseye } from '../utils/Icons';
import {
  getUserAchievements,
  UserAchievementsData,
  BadgeItem,
} from '../services/database';

interface StreaksAchievementsScreenProps {
  onClose?: () => void;
  userId?: string;
}

export const StreaksAchievementsScreen: React.FC<StreaksAchievementsScreenProps> = ({
  onClose,
  userId = 'default_user',
}) => {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<UserAchievementsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const result = await getUserAchievements(userId);
      setData(result);
    } catch (e) {
      console.warn('Error loading achievements:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    try {
      await Share.share({
        message: `🔥 I'm on a ${data.stats.current_streak}-day focus streak on FocusLock!\n⭐ Level ${data.levelInfo.level}: ${data.levelInfo.rankTitle} (${data.levelInfo.totalXp} XP)\n🏆 Unlocked ${data.unlockedCount}/${data.totalCount} Badges\n\nReclaim your attention with #FocusLock #DeepWork #GamifyFocus`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const filteredBadges = (data?.badges || []).filter(b => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.backButton}>
            <BackIcon width={20} height={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Streaks & Badges</Text>
          <Text style={styles.headerSubtitle}>Your Focus Achievements</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleShare}
          style={styles.shareButton}>
          <Text style={styles.shareIconText}>📤</Text>
          <Text style={styles.shareLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {loading || !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Calculating achievements...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(120, insets.bottom + 100) },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Level & Rank Hero Banner */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeaderRow}>
              <View style={styles.levelBadge}>
                <SparklesIcon color="#A855F7" width={14} height={14} />
                <Text style={styles.levelBadgeText}>LEVEL {data.levelInfo.level}</Text>
              </View>
              <Text style={styles.totalXpText}>{data.levelInfo.totalXp} XP</Text>
            </View>

            <Text style={styles.rankTitle}>{data.levelInfo.rankTitle}</Text>
            <Text style={styles.rankSubtitle}>
              Earn XP by completing focused minutes and maintaining streaks.
            </Text>

            {/* Level XP Progress Bar */}
            <View style={styles.xpBarTrack}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${Math.round(data.levelInfo.progress * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.xpMetaRow}>
              <Text style={styles.xpMetaLeft}>
                {data.levelInfo.currentLevelXp} XP in tier
              </Text>
              <Text style={styles.xpMetaRight}>
                Next Rank: {data.levelInfo.xpForNextLevel} XP
              </Text>
            </View>
          </View>

          {/* Flame Streak Card */}
          <View style={styles.streakCard}>
            <View style={styles.streakRow}>
              <View style={styles.flameCircle}>
                <FlameIcon color="#FF9500" width={28} height={28} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.streakLabel}>ACTIVE FOCUS STREAK</Text>
                <Text style={styles.streakValue}>
                  {data.stats.current_streak}{' '}
                  {data.stats.current_streak === 1 ? 'Day' : 'Days'}
                </Text>
                <Text style={styles.streakTip}>
                  {data.stats.current_streak > 0
                    ? 'Momentum is burning! 🔥 Complete today’s session to keep it.'
                    : 'Start your first session today to ignite your streak!'}
                </Text>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilter('all')}
              style={[
                styles.filterPill,
                filter === 'all' && styles.filterPillActive,
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  filter === 'all' && styles.filterPillTextActive,
                ]}>
                All ({data.totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilter('unlocked')}
              style={[
                styles.filterPill,
                filter === 'unlocked' && styles.filterPillActive,
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  filter === 'unlocked' && styles.filterPillTextActive,
                ]}>
                Unlocked ({data.unlockedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilter('locked')}
              style={[
                styles.filterPill,
                filter === 'locked' && styles.filterPillActive,
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  filter === 'locked' && styles.filterPillTextActive,
                ]}>
                In Progress ({data.totalCount - data.unlockedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Badges List */}
          {filteredBadges.map(badge => (
            <View
              key={badge.id}
              style={[
                styles.badgeCard,
                !badge.unlocked && styles.badgeCardLocked,
              ]}>
              <View style={styles.badgeTopRow}>
                <View
                  style={[
                    styles.badgeIconCircle,
                    {
                      backgroundColor: badge.unlocked
                        ? `${badge.color}22`
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: badge.unlocked
                        ? `${badge.color}66`
                        : 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeDescription}>{badge.description}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    badge.unlocked
                      ? styles.statusBadgeUnlocked
                      : styles.statusBadgeLocked,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      badge.unlocked
                        ? styles.statusBadgeTextUnlocked
                        : styles.statusBadgeTextLocked,
                    ]}>
                    {badge.unlocked ? 'Unlocked ✓' : 'Locked 🔒'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar under Badge */}
              <View style={styles.badgeProgressSection}>
                <View style={styles.badgeProgressBar}>
                  <View
                    style={[
                      styles.badgeProgressFill,
                      {
                        width: `${Math.round(badge.progress * 100)}%`,
                        backgroundColor: badge.unlocked ? badge.color : '#8B949E',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.badgeProgressLabel}>
                  {badge.currentValue} / {badge.targetValue} {badge.unit}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  shareIconText: {
    fontSize: 14,
  },
  shareLabel: {
    color: '#A855F7',
    fontSize: 12,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    fontFamily: fonts.regular,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  /* Level Card */
  levelCard: {
    backgroundColor: '#13161F',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 16,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  levelBadgeText: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: fonts.bold,
  },
  totalXpText: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  rankTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.bold,
  },
  rankSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  xpBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 4,
  },
  xpMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xpMetaLeft: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  xpMetaRight: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },

  /* Streak Card */
  streakCard: {
    backgroundColor: '#161922',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    marginBottom: 18,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  streakLabel: {
    color: '#FF9500',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  streakValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  streakTip: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 4,
    lineHeight: 16,
  },

  /* Filter Pills */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#A855F7',
  },
  filterPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Badge Cards */
  badgeCard: {
    backgroundColor: '#13161F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  badgeCardLocked: {
    opacity: 0.72,
    backgroundColor: '#0F1218',
  },
  badgeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  badgeDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeUnlocked: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  statusBadgeLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextUnlocked: {
    color: '#00E676',
  },
  statusBadgeTextLocked: {
    color: '#8B949E',
  },
  badgeProgressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    gap: 10,
  },
  badgeProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeProgressLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
});
