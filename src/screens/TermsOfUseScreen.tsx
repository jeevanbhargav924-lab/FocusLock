import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
import { BackIcon } from '../utils/Icons';

interface TermsOfUseScreenProps {
  onBack: () => void;
}

export const TermsOfUseScreen: React.FC<TermsOfUseScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <BackIcon color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Terms of Use</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.documentTitle}>FocusLock Terms of Use</Text>
          <Text style={styles.lastUpdatedText}>Last Updated: August 10, 2026</Text>

          <Text style={styles.paragraph}>
            Welcome to FocusLock ("the App"). By installing, accessing, or using FocusLock, you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use the App.
          </Text>
          <Text style={styles.paragraph}>
            These Terms govern your usage of FocusLock's mobile application, tools, and productivity features on your device.
          </Text>

          {/* Section 1 */}
          <Text style={styles.sectionHeader}>1. Acceptance & Eligibility</Text>
          <Text style={styles.paragraph}>
            By downloading or using FocusLock, you confirm that you are at least 13 years old (or the applicable age of digital consent in your jurisdiction) and capable of entering into a binding legal agreement.
          </Text>
          <Text style={styles.highlightParagraph}>
            Your continued use of FocusLock implies full acceptance of these Terms and any future updates.
          </Text>

          {/* Section 2 */}
          <Text style={styles.sectionHeader}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            FocusLock is an extreme digital wellbeing and productivity tool designed to help users block distracting mobile applications during active, user-configured focus sessions.
          </Text>
          <Text style={styles.paragraph}>
            Key functionality includes:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Custom & scheduled focus sessions</Text>
            <Text style={styles.bulletItem}>• Application blocking via system Accessibility and Usage Access</Text>
            <Text style={styles.bulletItem}>• Strict Mode lockouts with passcode protection</Text>
            <Text style={styles.bulletItem}>• Daily emergency override limits</Text>
            <Text style={styles.bulletItem}>• On-device focus statistics and streak tracking</Text>
          </View>

          {/* Section 3 */}
          <Text style={styles.sectionHeader}>3. Device Permissions & Restrictions</Text>
          <Text style={styles.paragraph}>
            To perform app blocking during active focus sessions, FocusLock requests specific Android system permissions:
          </Text>
          <Text style={styles.subHeader}>Accessibility Service Permission</Text>
          <Text style={styles.paragraph}>
            Used strictly to detect when a blocked application is brought to the foreground while a Focus Session is active, redirecting your device to the home screen or displaying a motivational blocking overlay.
          </Text>

          <Text style={styles.subHeader}>Usage Access & Battery Optimization</Text>
          <Text style={styles.paragraph}>
            Required to monitor background app states accurately and ensure active focus sessions are not killed prematurely by the operating system.
          </Text>
          <Text style={styles.highlightParagraph}>
            You acknowledge that revoking these permissions while a Strict Mode session is active will prevent FocusLock from executing its configured blocking rules.
          </Text>

          {/* Section 4 */}
          <Text style={styles.sectionHeader}>4. Strict Mode & Emergency Overrides</Text>
          <Text style={styles.paragraph}>
            FocusLock allows users to enable "Strict Mode" and set PIN passcodes or daily emergency limit counters to enforce deep work discipline.
          </Text>
          <Text style={styles.paragraph}>
            You understand and agree that:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• You voluntarily configure session durations and restriction rules.</Text>
            <Text style={styles.bulletItem}>• If emergency limits reach zero, session modifications will be strictly locked until the daily counter resets.</Text>
            <Text style={styles.bulletItem}>• You are responsible for keeping your PIN code safe.</Text>
          </View>

          {/* Section 5 */}
          <Text style={styles.sectionHeader}>5. User Responsibilities & Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to attempt to reverse engineer, decompile, modify, or exploit FocusLock's source code or bypass security mechanisms for malicious purposes.
          </Text>

          {/* Section 6 */}
          <Text style={styles.sectionHeader}>6. Intellectual Property Rights</Text>
          <Text style={styles.paragraph}>
            All intellectual property rights, trademarks, branding, user interfaces, design elements, and underlying code in FocusLock remain the exclusive property of FocusLock App.
          </Text>

          {/* Section 7 */}
          <Text style={styles.sectionHeader}>7. Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            FocusLock is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for maximum reliability, we do not warrant that app blocking will be 100% uninterrupted across all third-party operating systems or device updates.
          </Text>

          {/* Section 8 */}
          <Text style={styles.sectionHeader}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, FocusLock and its developers shall not be liable for any indirect, incidental, or consequential damages resulting from your use of or inability to access blocked applications during user-initiated focus sessions.
          </Text>

          {/* Section 9 */}
          <Text style={styles.sectionHeader}>9. Modifications to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. Any changes will be posted within the application with an updated "Last Updated" date.
          </Text>

          {/* Section 10 */}
          <Text style={styles.sectionHeader}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions or concerns regarding these Terms of Use, please contact us at:
          </Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactEmail}>📧 terms@focuslock.app</Text>
            <Text style={styles.contactSub}>FocusLock Support & Legal Team</Text>
          </View>

          {/* Bottom Space */}
          <View style={{ height: spacing.xl }} />
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
    paddingTop: 30,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
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
  documentTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  lastUpdatedText: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  subHeader: {
    fontFamily: fonts.semiBold,
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: 4,
  },
  paragraph: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  highlightParagraph: {
    fontFamily: fonts.medium,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: colors.surfaceHigh,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  bulletList: {
    marginVertical: spacing.xs,
    paddingLeft: spacing.sm,
    gap: 4,
  },
  bulletItem: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  contactEmail: {
    fontFamily: fonts.bold,
    color: colors.tertiary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  contactSub: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
  },
});
