import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, fonts } from '../theme';
import { ScoreBreakdown } from '../services/database';

interface ScoreBreakdownModalProps {
  visible: boolean;
  score: number;
  breakdown?: ScoreBreakdown;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  visible,
  score,
  breakdown,
  onClose,
}) => {
  const completion = breakdown?.completionScore ?? Math.min(50, Math.round(score * 0.5));
  const distraction = breakdown?.distractionScore ?? Math.min(25, Math.round(score * 0.25));
  const duration = breakdown?.durationScore ?? Math.min(15, Math.round(score * 0.15));
  const discipline = breakdown?.disciplineScore ?? Math.min(10, Math.round(score * 0.1));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreLabel}>SCORE</Text>
            </View>
            <Text style={styles.title}>How Your Score Was Calculated</Text>
            <Text style={styles.subtitle}>
              Your Focus Score is an objective evaluation of discipline and focus quality.
            </Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Factor 1: Session Completion */}
            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>🎯 Session Completion</Text>
                <Text style={styles.factorPts}>{completion} / 50 pts</Text>
              </View>
              <Text style={styles.factorDesc}>
                Measures how much of your planned duration was achieved. Reaching your full session naturally awards maximum points.
              </Text>
            </View>

            {/* Factor 2: Distraction Resistance */}
            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>🛡️ Distraction Resistance</Text>
                <Text style={styles.factorPts}>{distraction} / 25 pts</Text>
              </View>
              <Text style={styles.factorDesc}>
                Rewards resisting the urge to open blocked apps. Zero distraction attempts grants full 25 points.
              </Text>
            </View>

            {/* Factor 3: Focus Duration Stamina */}
            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>⏳ Focus Duration</Text>
                <Text style={styles.factorPts}>{duration} / 15 pts</Text>
              </View>
              <Text style={styles.factorDesc}>
                Longer deep work blocks require sustained cognitive stamina and earn extra credit.
              </Text>
            </View>

            {/* Factor 4: Emergency Discipline */}
            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>🔒 Session Discipline</Text>
                <Text style={styles.factorPts}>{discipline} / 10 pts</Text>
              </View>
              <Text style={styles.factorDesc}>
                Avoiding emergency overrides and completing without early exits keeps discipline at 100%.
              </Text>
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.closeBtn}
            onPress={onClose}>
            <Text style={styles.closeBtnText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#161B22',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontFamily: fonts.bold,
    fontSize: 8,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  scroll: {
    marginVertical: 6,
  },
  factorCard: {
    backgroundColor: '#0E1420',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  factorPts: {
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  factorDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 16,
  },
  closeBtn: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
