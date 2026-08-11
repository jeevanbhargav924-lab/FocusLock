import React, { useState, useEffect, useMemo } from 'react';
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
  getHistorySessions,
  UserStatsRecord,
  SessionRecord,
} from '../services/database';
import {
  FlameIcon,
  StopwatchIcon,
  CalendarIcon,
  TrophyIcon,
  SparklesIcon,
  StreakWaveChartGraphic,
  BarChartAscendingGraphic,
  StatisticsIcon,
} from '../utils/Icons';
import { colors, fonts, spacing } from '../theme';

interface StatsScreenProps {
  userId?: string;
  onOpenSettings?: () => void;
}

interface HeatmapCell {
  dateStr: string;
  formattedDate: string;
  minutes: number;
  isStreak: boolean;
  level: number; // 0..4
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  userId = 'default_user',
  onOpenSettings,
}) => {
  const [stats, setStats] = useState<UserStatsRecord | null>(null);
  const [historySessions, setHistorySessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    loadStatsData();
  }, [userId]);

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const [userStatsData, sessions] = await Promise.all([
        getUserStats(userId),
        getHistorySessions(userId, 'all'),
      ]);
      setStats(userStatsData);
      setHistorySessions(sessions);
    } catch (e) {
      console.warn('Error loading stats:', e);
    } finally {
      setLoading(false);
    }
  };

  // Process daily focus minutes map and streak dates set
  const { dailyMinsMap, streakDatesSet } = useMemo(() => {
    const minsMap: Record<string, number> = {};
    const streakSet = new Set<string>();

    // 1. Populate daily focus minutes from completed & ended sessions
    historySessions.forEach(session => {
      const timestamp = session.created_at || Date.now();
      const dateObj = new Date(timestamp);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const mins = session.actual_minutes || session.planned_minutes || 0;
      minsMap[dateKey] = (minsMap[dateKey] || 0) + mins;
    });

    // 2. Compute active streak dates leading up to today/yesterday
    const streakCount = stats?.current_streak ?? 0;
    if (streakCount > 0) {
      const today = new Date();
      let checkDate = new Date(today);

      const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      let dateStr = formatDate(checkDate);
      if (!minsMap[dateStr] || minsMap[dateStr] === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yestStr = formatDate(yesterday);
        if (minsMap[yestStr] && minsMap[yestStr] > 0) {
          checkDate = yesterday;
          dateStr = yestStr;
        }
      }

      let count = 0;
      while (count < streakCount) {
        streakSet.add(dateStr);
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = formatDate(checkDate);
      }
    }

    return { dailyMinsMap: minsMap, streakDatesSet: streakSet };
  }, [historySessions, stats]);

  // Construct dynamic 10-week matrix & 7 days of the week (Mon -> Sun)
  const { gridMatrix, monthLabels } = useMemo(() => {
    const totalCols = 10; // 10 columns to fit layout cleanly
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

    // Find Monday of the current week
    const currentMonday = new Date(today);
    const diffToMon = (currentDayOfWeek + 6) % 7;
    currentMonday.setDate(today.getDate() - diffToMon);

    const matrix: HeatmapCell[][] = Array.from({ length: 7 }, () => []);
    const monthsMap: { index: number; name: string }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Track months for col 1, 5, 9
    [1, 5, 9].forEach(colIndex => {
      const colDate = new Date(currentMonday);
      colDate.setDate(currentMonday.getDate() - (totalCols - 1 - colIndex) * 7);
      monthsMap.push({
        index: colIndex,
        name: monthNames[colDate.getMonth()],
      });
    });

    for (let col = 0; col < totalCols; col++) {
      const weekMonday = new Date(currentMonday);
      weekMonday.setDate(currentMonday.getDate() - (totalCols - 1 - col) * 7);

      for (let row = 0; row < 7; row++) {
        const dayOffset = row; // 0=Mon, 1=Tue... 6=Sun
        const cellDate = new Date(weekMonday);
        cellDate.setDate(weekMonday.getDate() + dayOffset);

        const y = cellDate.getFullYear();
        const m = String(cellDate.getMonth() + 1).padStart(2, '0');
        const d = String(cellDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const formattedDate = cellDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const mins = dailyMinsMap[dateStr] || 0;
        const isStreak = streakDatesSet.has(dateStr);

        let level = 0;
        if (isStreak) {
          level = 4;
        } else if (mins >= 90) {
          level = 4;
        } else if (mins >= 45) {
          level = 3;
        } else if (mins >= 20) {
          level = 2;
        } else if (mins > 0) {
          level = 1;
        }

        matrix[row].push({
          dateStr,
          formattedDate,
          minutes: mins,
          isStreak,
          level,
        });
      }
    }

    return { gridMatrix: matrix, monthLabels: monthsMap };
  }, [dailyMinsMap, streakDatesSet]);

  // Heatmap circle dot colors
  const colorLevels = ['#1C2128', '#0E4429', '#006D32', '#26A641', '#00E676'];

  // Render 7-day circular dot matrix heatmap
  const renderHeatmapGrid = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <View style={styles.heatmapWrapper}>
        <View style={styles.monthsRow}>
          {monthLabels.map((m, i) => (
            <Text key={i} style={styles.monthLabel}>
              {m.name}
            </Text>
          ))}
        </View>

        <View style={styles.gridBody}>
          {/* Day Labels Column */}
          <View style={styles.daysColumn}>
            {days.map((day, idx) => (
              <Text key={idx} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* 7-Row Circular Dots Matrix */}
          <View style={styles.squaresMatrix}>
            {gridMatrix.map((rowCells, rowIndex) => (
              <View key={rowIndex} style={styles.squaresRow}>
                {rowCells.map((cell, colIndex) => {
                  const circleColor = colorLevels[cell.level];
                  const isSelected = selectedCell?.dateStr === cell.dateStr;

                  return (
                    <TouchableOpacity
                      key={colIndex}
                      activeOpacity={0.7}
                      onPress={() => setSelectedCell(cell)}
                      style={[
                        styles.heatmapCircleDot,
                        { backgroundColor: circleColor },
                        cell.isStreak && styles.streakDotHighlight,
                        isSelected && styles.selectedDotBorder,
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Selected Day Info Badge */}
        {selectedCell && (
          <View style={styles.selectedDayBadge}>
            <Text style={styles.selectedDayText}>
              {selectedCell.isStreak ? '🔥 ' : '⏱️ '}
              <Text style={{ fontFamily: fonts.bold, color: colors.textPrimary }}>
                {selectedCell.formattedDate}:
              </Text>{' '}
              {selectedCell.minutes > 0 ? `${selectedCell.minutes} mins focus` : 'No focus sessions'}
              {selectedCell.isStreak ? ' (Streak Active!)' : ''}
            </Text>
          </View>
        )}

        {/* Bottom Legend Row */}
        <View style={styles.bottomLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1C2128' }]} />
            <Text style={styles.legendLabelText}>No Activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0E4429' }]} />
            <Text style={styles.legendLabelText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#006D32' }]} />
            <Text style={styles.legendLabelText}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00E676' }]} />
            <Text style={styles.legendLabelText}>High</Text>
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
        {/* Top Header Bar with App Logo */}
        <View style={styles.topBar}>
          <View style={styles.headerLeftGroup}>
            <Image
              source={require('../../assets/images/appIcon.png')}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.brandTitle}>Stats</Text>
              <Text style={styles.brandSubtitle}>Track your focus journey</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.calendarPillBtn}>
            <StatisticsIcon color="#10B981" width={18} height={18} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <>
            {/* Card 1: CURRENT STREAK Golden Card */}
            <View style={styles.goldenStreakCard}>
              <View style={styles.streakLeftGroup}>
                <View style={styles.outerFlameRing}>
                  <View style={styles.innerFlameCircle}>
                    <FlameIcon color="#F59E0B" width={44} height={44} />
                  </View>
                </View>
              </View>

              <View style={styles.streakRightText}>
                <Text style={styles.streakCardLabel}>CURRENT STREAK</Text>
                <Text style={styles.streakCardValue}>
                  {stats?.current_streak ?? 0} {stats?.current_streak === 1 ? 'Day' : 'Days'}
                </Text>
                <Text style={styles.streakBadgeHighlight}>You're on fire! 🔥</Text>
                <Text style={styles.streakCardSubtext}>
                  Keep up the momentum for continuous deep focus.
                </Text>
              </View>

              {/* Bottom Right Wave Chart Graphic */}
              <View style={styles.streakGraphicWrap}>
                <StreakWaveChartGraphic />
              </View>
            </View>

            {/* Card 2: Focus Activity Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardHeaderTitle}>Focus Activity</Text>
                  <Text style={styles.cardHeaderSub}>
                    🔥 {stats?.current_streak ?? 0} Day Streak Active
                  </Text>
                </View>
                <View style={styles.legendTopRow}>
                  <Text style={styles.legendTopText}>Less</Text>
                  <View style={[styles.legendTopSquare, { backgroundColor: '#0E4429' }]} />
                  <View style={[styles.legendTopSquare, { backgroundColor: '#006D32' }]} />
                  <View style={[styles.legendTopSquare, { backgroundColor: '#00E676' }]} />
                  <Text style={styles.legendTopText}>More</Text>
                </View>
              </View>

              {renderHeatmapGrid()}
            </View>

            {/* Card 3: Personal Bests Card */}
            <View style={styles.sectionCard}>
              <View style={styles.bestsHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Personal Bests</Text>
                <View style={styles.trophyBadgeCircle}>
                  <TrophyIcon color="#A855F7" width={18} height={18} />
                </View>
              </View>

              <View style={styles.personalBestsContainer}>
                {/* Metric 1: Longest Session */}
                <View style={styles.longestSessionCard}>
                  <View style={styles.greenIconCircle}>
                    <StopwatchIcon color="#10B981" width={20} height={20} />
                  </View>
                  <View style={styles.bestDetailsGroup}>
                    <Text style={styles.longestSessionTitle}>Longest Session</Text>
                    <Text style={styles.longestSessionValue}>
                      {stats?.longest_session_mins ?? 0} min
                    </Text>
                    <Text style={styles.bestSubtext}>Keep pushing your limits!</Text>
                  </View>
                </View>

                {/* Metric 2: Most Hours in a Day */}
                <View style={styles.mostHoursCard}>
                  <View style={styles.purpleIconCircle}>
                    <CalendarIcon color="#A855F7" width={20} height={20} />
                  </View>
                  <View style={styles.bestDetailsGroup}>
                    <Text style={styles.mostHoursTitle}>Most Hours in a Day</Text>
                    <Text style={styles.mostHoursValue}>
                      {stats?.most_hours_in_day ?? 0} hrs
                    </Text>
                    <Text style={styles.bestSubtext}>Every minute counts!</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card 4: Consistency Motivation Card */}
            <View style={styles.motivationCard}>
              <View style={styles.motivationLeft}>
                <View style={styles.sparkleTitleRow}>
                  <SparklesIcon color="#38BDF8" width={18} height={18} />
                  <Text style={styles.motivationTitle}>Consistency is the key</Text>
                </View>
                <Text style={styles.motivationSubtitle}>
                  Small steps today, big results tomorrow.
                </Text>
              </View>
              <BarChartAscendingGraphic />
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 14,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calendarPillBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#131815',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },

  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Golden Streak Card */
  goldenStreakCard: {
    backgroundColor: '#14110F',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  streakLeftGroup: {
    marginRight: 16,
  },
  outerFlameRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFlameCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRightText: {
    flex: 1,
    zIndex: 2,
  },
  streakCardLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  streakCardValue: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    marginVertical: 2,
  },
  streakBadgeHighlight: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#F59E0B',
    marginBottom: 4,
  },
  streakCardSubtext: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#94A3B8',
    lineHeight: 16,
  },
  streakGraphicWrap: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.8,
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: '#13161B',
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
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  cardHeaderSub: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#F59E0B',
    marginTop: 2,
  },
  legendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendTopText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#8B949E',
    marginHorizontal: 2,
  },
  legendTopSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  /* 7-Day Heatmap */
  heatmapWrapper: {
    marginTop: 4,
  },
  monthsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 36,
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 12,
    color: '#8B949E',
    fontFamily: fonts.medium,
  },
  gridBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysColumn: {
    width: 36,
    justifyContent: 'space-between',
    height: 175,
  },
  dayLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: fonts.regular,
  },
  squaresMatrix: {
    flex: 1,
    justifyContent: 'space-between',
    height: 175,
  },
  squaresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapCircleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  streakDotHighlight: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  selectedDotBorder: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedDayBadge: {
    marginTop: 14,
    backgroundColor: '#0D1117',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  selectedDayText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  bottomLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabelText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#8B949E',
  },

  /* Personal Bests */
  bestsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trophyBadgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalBestsContainer: {
    gap: 12,
  },
  longestSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1A14',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  greenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mostHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13101E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  purpleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bestDetailsGroup: {
    flex: 1,
  },
  longestSessionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#2DD4BF',
    marginBottom: 2,
  },
  mostHoursTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#C084FC',
    marginBottom: 2,
  },
  longestSessionValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  mostHoursValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  bestSubtext: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Consistency Motivation Banner */
  motivationCard: {
    backgroundColor: '#0F1613',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  motivationLeft: {
    flex: 1,
    marginRight: 12,
  },
  sparkleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  motivationTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  motivationSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#94A3B8',
  },
});
