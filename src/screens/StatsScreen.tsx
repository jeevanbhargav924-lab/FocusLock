import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  getUserStats,
  UserStatsRecord,
} from '../services/database';
import {
  FlameIcon,
  StopwatchIcon,
  CalendarIcon,
  SettingsIcon,
} from '../utils/Icons';
import { spacing } from '../theme';

interface StatsScreenProps {
  userId?: string;
  onOpenSettings?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  userId = 'default_user',
  onOpenSettings,
}) => {
  const [stats, setStats] = useState<UserStatsRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStatsData();
  }, [userId]);

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const userStatsData = await getUserStats(userId);
      setStats(userStatsData);
    } catch (e) {
      console.warn('Error loading stats:', e);
    } finally {
      setLoading(false);
    }
  };

  // Render 3-month focus activity heatmap grid matrix
  const renderHeatmapGrid = () => {
    const days = ['Mon', 'Wed', 'Fri'];
    const colorLevels = ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'];

    return (
      <View style={styles.heatmapWrapper}>
        <View style={styles.monthsRow}>
          <Text style={styles.monthLabel}>Jan</Text>
          <Text style={styles.monthLabel}>Feb</Text>
          <Text style={styles.monthLabel}>Mar</Text>
        </View>

        <View style={styles.gridBody}>
          <View style={styles.daysColumn}>
            {days.map((day, idx) => (
              <Text key={idx} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.squaresMatrix}>
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <View key={rowIndex} style={styles.squaresRow}>
                {Array.from({ length: 12 }).map((_, colIndex) => {
                  const levelIndex = (rowIndex * 3 + colIndex * 2 + 1) % 5;
                  const squareColor = colorLevels[levelIndex];
                  return (
                    <View
                      key={colIndex}
                      style={[styles.heatmapSquare, { backgroundColor: squareColor }]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/appIcon.png')}
              style={styles.headerAvatar}
            />
            <Text style={styles.brandName}>FocusLock</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ECCA3" />
          </View>
        ) : (
          <>
            {/* Dynamic Streak Banner */}
            <View style={styles.streakBannerContainer}>
              <View style={styles.fireBadgeCircle}>
                <FlameIcon color="#F59E0B" width={42} height={42} />
              </View>
              <Text style={styles.streakTitle}>
                {stats?.current_streak ?? 0} Day Streak
              </Text>
              <Text style={styles.streakSubtitle}>
                {(stats?.current_streak ?? 0) > 0
                  ? "You're on fire! Keep up the momentum for continuous deep focus."
                  : 'Start a focus session today to build your streak!'}
              </Text>
            </View>

            {/* Focus Activity Heatmap Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Focus Activity</Text>
                <View style={styles.legendRow}>
                  <Text style={styles.legendText}>Less</Text>
                  <View style={[styles.legendSquare, { backgroundColor: '#161B22' }]} />
                  <View style={[styles.legendSquare, { backgroundColor: '#0E4429' }]} />
                  <View style={[styles.legendSquare, { backgroundColor: '#006D32' }]} />
                  <View style={[styles.legendSquare, { backgroundColor: '#39D353' }]} />
                  <Text style={styles.legendText}>More</Text>
                </View>
              </View>

              {renderHeatmapGrid()}
            </View>

            {/* Personal Bests Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Personal Bests</Text>
              <View style={styles.personalBestsContainer}>
                {/* Metric 1 */}
                <View style={styles.bestItemCard}>
                  <View style={styles.bestIconCircle}>
                    <StopwatchIcon color="#10B981" width={18} height={18} />
                  </View>
                  <View style={styles.bestTextDetails}>
                    <Text style={styles.bestLabel}>Longest Session</Text>
                    <Text style={styles.bestValue}>
                      {stats?.longest_session_mins ?? 0} min
                    </Text>
                  </View>
                </View>

                {/* Metric 2 */}
                <View style={styles.bestItemCard}>
                  <View style={styles.bestIconCircle}>
                    <CalendarIcon color="#6366F1" width={18} height={18} />
                  </View>
                  <View style={styles.bestTextDetails}>
                    <Text style={styles.bestLabel}>Most Hours in a Day</Text>
                    <Text style={styles.bestValue}>
                      {stats?.most_hours_in_day ?? 0} hrs
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
  },
  avatarLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },

  /* Header */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  gearIcon: {
    fontSize: 22,
  },

  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Streak Banner */
  streakBannerContainer: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fireBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  streakSubtitle: {
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  legendText: {
    fontSize: 11,
    color: '#8B949E',
    marginHorizontal: 4,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  /* Heatmap */
  heatmapWrapper: {
    marginTop: 4,
  },
  monthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 32,
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  gridBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysColumn: {
    width: 32,
    justifyContent: 'space-between',
    height: 64,
  },
  dayLabel: {
    fontSize: 11,
    color: '#8B949E',
  },
  squaresMatrix: {
    flex: 1,
    justifyContent: 'space-between',
    height: 64,
  },
  squaresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapSquare: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },

  /* Personal Bests */
  personalBestsContainer: {
    gap: 12,
    marginTop: 4,
  },
  bestItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F141C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  bestIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161B22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bestTextDetails: {
    flex: 1,
  },
  bestLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 2,
  },
  bestValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
