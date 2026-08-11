import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
import { BackIcon } from '../utils/Icons';

interface AboutAppScreenProps {
  onBack: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTermsOfUse?: () => void;
}

export const AboutAppScreen: React.FC<AboutAppScreenProps> = ({
  onBack,
  onOpenPrivacyPolicy,
  onOpenTermsOfUse,
}) => {
  const features = [
    { icon: '🔒', title: 'Strict App Lock', desc: 'Unbreakable app blocking during active timers' },
    { icon: '⚡', title: 'Emergency Control', desc: 'Configurable daily overrides and PIN locks' },
    { icon: '🔥', title: 'Focus Streaks', desc: 'Gamified streak tracking and daily goals' },
    { icon: '📊', title: 'Local Privacy', desc: '100% of data is stored securely on device' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <BackIcon color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>About FocusLock</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Main Brand Card */}
          <View style={styles.brandCard}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/images/appIcon.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.brandName}>FocusLock</Text>
            <View style={styles.versionPill}>
              <Text style={styles.versionText}>Version 2.4.1 (Build 2410)</Text>
            </View>
            <Text style={styles.tagline}>
              Extreme Digital Wellbeing & Focus Lock for Android
            </Text>
          </View>

          {/* Mission Statement */}
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>OUR MISSION</Text>
            <Text style={styles.missionText}>
              In an era designed to capture your attention, FocusLock empowers you to reclaim your time, build deep focus habits, and achieve meaningful work.
            </Text>
          </View>

          {/* Feature Highlights Grid */}
          <Text style={styles.sectionTitle}>CORE PRODUCT FEATURES</Text>
          <View style={styles.featuresGrid}>
            {features.map((item, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Legal & Compliance Section */}
          <Text style={styles.sectionTitle}>LEGAL & COMPLIANCE</Text>
          <View style={styles.legalGroupCard}>
            {onOpenPrivacyPolicy && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.legalRow}
                onPress={onOpenPrivacyPolicy}>
                <Text style={styles.legalLabel}>Privacy Policy</Text>
                <Text style={styles.legalChevron}>›</Text>
              </TouchableOpacity>
            )}
            {onOpenPrivacyPolicy && <View style={styles.divider} />}

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.legalRow}
              onPress={onOpenTermsOfUse}>
              <Text style={styles.legalLabel}>Terms of Use</Text>
              <Text style={styles.legalChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Copyright Footer */}
          <View style={styles.copyrightContainer}>
            <Text style={styles.copyrightText}>
              © 2026 FocusLock App. All rights reserved.
            </Text>
            <Text style={styles.craftedText}>Handcrafted for deep focus & productivity.</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 12,
    borderColor: '#6B7280',
    borderWidth: 1,
    borderRadius: 50,
  },
  topTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  brandCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  brandName: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  versionPill: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  tagline: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  missionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missionTitle: {
    fontFamily: fonts.bold,
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  missionText: {
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 12,
  },
  legalGroupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  legalLabel: {
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  legalChevron: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  copyrightText: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  craftedText: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
  },
});
