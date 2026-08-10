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
  SettingsGearIcon,
  SettingsIcon,
} from '../utils/Icons';
import { spacing } from '../theme';

interface FocusHistoryScreenProps {
  userId?: string;
  onOpenSettings?: () => void;
}

export const FocusHistoryScreen: React.FC<FocusHistoryScreenProps> = ({
  userId = 'default_user',
  onOpenSettings,
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
        showsVerticalScrollIndicator={false}>
             <View style={styles.topBar}>
               <View style={styles.brandRow}>
                 <Image
                   source={require('../../assets/images/appIcon.png')}
                   style={styles.headerAvatar}
                 />
                 <Text style={styles.brandName}>FocusLock</Text>
               </View>
             </View>

        {/* Page Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Session History</Text>
          <Text style={styles.pageSubtitle}>
            Review your focus patterns and performance.
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('all')}
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}>
            <Text
              style={[
                styles.filterPillText,
                filter === 'all' && styles.filterPillTextActive,
              ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('completed')}
            style={[
              styles.filterPill,
              filter === 'completed' && styles.filterPillActive,
            ]}>
            <Text
              style={[
                styles.filterPillText,
                filter === 'completed' && styles.filterPillTextActive,
              ]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('interrupted')}
            style={[
              styles.filterPill,
              filter === 'interrupted' && styles.filterPillActive,
            ]}>
            <Text
              style={[
                styles.filterPillText,
                filter === 'interrupted' && styles.filterPillTextActive,
              ]}>
              Interrupted
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Timeline Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ECCA3" />
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            <Text style={styles.dateHeaderLabel}>TODAY, MAY 12</Text>

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
                        {item.start_time || '10:00 AM'} - {item.end_time || '10:45 AM'} •{' '}
                        {isCompleted
                          ? `${item.actual_minutes}m`
                          : `${item.actual_minutes}m / ${item.planned_minutes}m`}
                      </Text>
                    </View>
                  </View>

                  {/* Status & Score Row */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.statusGroup}>
                      <Text style={styles.statusLabel}>STATUS</Text>
                      <View style={styles.statusBadgeRow}>
                        {isCompleted ? (
                          <>
                            <View style={styles.greenDot}>
                              <CheckmarkIcon color="#10B981" width={12} height={12} />
                            </View>
                            <Text style={styles.statusCompletedText}>Completed</Text>
                          </>
                        ) : (
                          <>
                            <View style={styles.redDot}>
                              <BlockedIcon color="#F87171" width={12} height={12} />
                            </View>
                            <Text style={styles.statusInterruptedText}>Interrupted</Text>
                          </>
                        )}
                      </View>
                    </View>

                    {/* Score Circle Badge */}
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreValueText}>{item.score || 85}</Text>
                      <Text style={styles.scoreLabelText}>SCORE</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0B0E14',
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
    marginBottom: 28,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B949E',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Timeline List */
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  timelineContainer: {
    gap: 14,
  },
  dateHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B949E',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  /* Session Card */
  historyCard: {
    backgroundColor: '#161B22',
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
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sessionMetaTime: {
    fontSize: 13,
    color: '#8B949E',
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
  statusGroup: {},
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6E7681',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCompletedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  statusInterruptedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
  },

  /* Score Circle Badge */
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F141C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scoreValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6E7681',
    letterSpacing: 0.5,
  },
});
