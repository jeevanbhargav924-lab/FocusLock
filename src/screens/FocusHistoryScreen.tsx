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
  getHistorySessions,
  SessionRecord,
} from '../services/database';
import {
  BookIcon,
  CodeIcon,
  JournalIcon,
  StopwatchIcon,
  CheckmarkIcon,
  BlockedIcon,
  CalendarIcon,
} from '../utils/Icons';
import { colors, fonts, spacing } from '../theme';

interface FocusHistoryScreenProps {
  userId?: string;
  onOpenSettings?: () => void;
  onNavigateToStats?: () => void;
}

export const FocusHistoryScreen: React.FC<FocusHistoryScreenProps> = ({
  userId = 'default_user',
  onOpenSettings,
  onNavigateToStats,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'interrupted'>('all');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSessions();
  }, [filter, userId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getHistorySessions(userId, filter);
      setSessions(data);
    } catch (e) {
      console.warn('Error loading history sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  // Category Icon Resolver
  const renderCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'reading':
        return <BookIcon color="#6366F1" width={22} height={22} />;
      case 'coding':
        return <CodeIcon color="#38BDF8" width={22} height={22} />;
      case 'journaling':
        return <JournalIcon color="#A855F7" width={22} height={22} />;
      default:
        return <StopwatchIcon color="#4ECCA3" width={22} height={22} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/appIcon.png')}
              style={styles.headerAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>Session History</Text>
              <Text style={styles.greetingSubtitle}>
                Review your focus patterns and performance.
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('all')}
            style={[
              styles.filterPill,
              filter === 'all' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('completed')}
            style={[
              styles.filterPill,
              filter === 'completed' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'completed' && styles.filterPillTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('interrupted')}
            style={[
              styles.filterPill,
              filter === 'interrupted' && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'interrupted' && styles.filterPillTextActive,
              ]}
            >
              Interrupted
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Timeline Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateHeaderLeft}>
                <CalendarIcon color="#8B949E" width={16} height={16} />
                <Text style={styles.dateHeaderLabel}>Today, May 12</Text>
              </View>
             
            </View>

            {sessions.map((item, index) => {
              const isCompleted = item.status === 'completed';
              return (
                <View key={item.id || index} style={styles.historyCard}>
                  <View style={styles.cardMainRow}>
                    {/* Icon Container */}
                    <View style={styles.categoryIconBox}>
                      {renderCategoryIcon(item.category)}
                    </View>

                    {/* Title & Duration */}
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionTitle}>{item.title}</Text>
                      <Text style={styles.sessionMetaTime}>
                        {item.start_time || '10:00 AM'} –{' '}
                        {item.end_time || '10:45 AM'} •{' '}
                        {isCompleted
                          ? `${item.actual_minutes}m`
                          : `${item.actual_minutes}m / ${item.planned_minutes}m`}
                      </Text>
                    </View>
                  </View>

                  {/* Status & Score Row */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.statusBadgeRow}>
                      {isCompleted ? (
                        <>
                          <View style={styles.greenCheckCircle}>
                            <CheckmarkIcon
                              color="#10B981"
                              width={14}
                              height={14}
                            />
                          </View>
                          <Text style={styles.statusCompletedText}>
                            Completed
                          </Text>
                        </>
                      ) : (
                        <>
                          <View style={styles.amberDot}>
                            <BlockedIcon
                              color="#F59E0B"
                              width={14}
                              height={14}
                            />
                          </View>
                          <Text style={styles.statusEndedText}>
                            Early Ended
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Score Circle Badge */}
                    <View style={styles.scoreCircleBadge}>
                      <Text style={styles.scoreValueText}>
                        {item.score || 100}
                      </Text>
                      <Text style={styles.scoreLabelText}>SCORE</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Today's Summary Card */}
            <View style={styles.todaySummaryCard}>
              <View style={styles.summaryHeaderRow}>
                <View style={styles.summaryTitleGroup}>
                  <View style={styles.summaryIconBadge}>
                    <StopwatchIcon color="#A855F7" width={18} height={18} />
                  </View>
                  <Text style={styles.summaryCardTitle}>Today's Summary</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (onNavigateToStats) {
                      onNavigateToStats();
                    } else if (onOpenSettings) {
                      onOpenSettings();
                    }
                  }}
                  style={styles.viewStatsPill}>
                  <Text style={styles.viewStatsText}>View Stats ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryMetricsGrid}>
                {/* Metric 1: Sessions */}
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.metricIconEmoji}>🕒</Text>
                  <Text style={styles.metricBigVal}>{sessions.length }</Text>
                  <Text style={styles.metricSubLabel}>Sessions</Text>
                </View>

                {/* Metric 2: Total Focus */}
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.metricIconEmoji}>🎯</Text>
                  <Text style={styles.metricBigVal}>
                    {sessions.reduce((acc, s) => acc + (s.actual_minutes || 0), 0) } min
                  </Text>
                  <Text style={styles.metricSubLabel}>Total Focus</Text>
                </View>

                {/* Metric 3: Completion */}
                <View style={styles.summaryMetricCol}>
                  <Text style={styles.metricIconEmoji}>✓</Text>
                  <Text style={styles.metricBigVal}>100%</Text>
                  <Text style={styles.metricSubLabel}>Completion</Text>
                </View>

            
              </View>
            </View>
          </View>
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
  avatarLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: spacing.sm,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 14,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  greetingTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    fontSize: 24,
  },
  greetingSubtitle: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  gearIcon: {
    fontSize: 22,
  },
  /* Page Title Section */
  titleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#8B949E',
  },

  /* Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#8B949E',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  /* Date Header Row */
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateHeaderLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#8B949E',
  },
  filterSlidersBtn: {
    padding: 4,
  },

  /* Timeline List */
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  timelineContainer: {
    gap: 14,
  },

  /* Session Card */
  historyCard: {
    backgroundColor: '#13161B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F141C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sessionMetaTime: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  /* Card Footer Row */
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amberDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCompletedText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#10B981',
  },
  statusInterruptedText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#F87171',
  },
  statusEndedText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#F59E0B',
  },

  /* Score Circle Badge */
  scoreCircleBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F141C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  scoreValueText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  scoreLabelText: {
    fontSize: 8,
    fontFamily: fonts.bold,
    color: '#6E7681',
    letterSpacing: 0.5,
  },

  /* Today's Summary Card */
  todaySummaryCard: {
    backgroundColor: '#161329',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  viewStatsPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewStatsText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#C084FC',
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  summaryMetricCol: {
    alignItems: 'center',
  },
  metricIconEmoji: {
    fontSize: 16,
    marginBottom: 4,
    color:'green'
  },
  metricBigVal: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metricSubLabel: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#8B949E',
  },
});
