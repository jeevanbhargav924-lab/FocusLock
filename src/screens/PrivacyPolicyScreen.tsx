import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { spacing } from '../theme';
import { BackIcon } from '../utils/Icons';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Privacy Policy</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.documentTitle}>FocusLock Privacy Policy</Text>
          <Text style={styles.lastUpdatedText}>Last Updated: August 8, 2026</Text>

          <Text style={styles.paragraph}>
            FocusLock ("we", "our", or "the app") is a productivity application designed to help users improve focus and reduce distractions from their mobile devices.
          </Text>
          <Text style={styles.paragraph}>
            This Privacy Policy explains how FocusLock handles permissions and information when you use the application.
          </Text>

          {/* Section 1 */}
          <Text style={styles.sectionHeader}>1. Permissions We Request</Text>
          <Text style={styles.paragraph}>
            FocusLock may request the following Android permissions or system access:
          </Text>

          <Text style={styles.subHeader}>Accessibility Service</Text>
          <Text style={styles.paragraph}>
            FocusLock uses Android's Accessibility Service to detect when an application is opened during an active Focus Session. This access is used to help FocusLock prevent access to distracting applications while a Focus Session is active.
          </Text>
          <Text style={styles.highlightParagraph}>
            FocusLock does not use Accessibility Service to read, collect, or store your personal messages, passwords, keystrokes, photos, contacts, or other private content.
          </Text>

          <Text style={styles.subHeader}>Usage Access</Text>
          <Text style={styles.paragraph}>
            FocusLock may request Usage Access permission to obtain information about application usage. This permission helps FocusLock provide focus-related functionality and determine application usage during a Focus Session.
          </Text>
          <Text style={styles.paragraph}>
            Usage information is used only for the functionality provided by FocusLock and is not sold to third parties.
          </Text>

          <Text style={styles.subHeader}>Battery Optimization</Text>
          <Text style={styles.paragraph}>
            FocusLock may request permission to be excluded from Android battery optimization. This is necessary to help FocusLock keep an active Focus Session running reliably in the background and prevent Android from stopping the application's required background functionality.
          </Text>
          <Text style={styles.paragraph}>
            FocusLock does not use this permission to access personal information.
          </Text>

          <Text style={styles.subHeader}>Notifications</Text>
          <Text style={styles.paragraph}>
            FocusLock may request notification permission to provide notifications related to Focus Sessions. Notifications may include information such as Focus Session status, remaining session time, session completion, and important FocusLock alerts.
          </Text>
          <Text style={styles.paragraph}>
            You can disable notifications at any time through your Android device settings.
          </Text>

          {/* Section 2 */}
          <Text style={styles.sectionHeader}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            FocusLock is designed to minimize the information it requires. The permissions described above provide FocusLock with access to certain device-level functionality necessary for its core features.
          </Text>
          <Text style={styles.paragraph}>FocusLock does not intentionally collect:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Passwords</Text>
            <Text style={styles.bulletItem}>• Private messages</Text>
            <Text style={styles.bulletItem}>• Photos or videos</Text>
            <Text style={styles.bulletItem}>• Contacts</Text>
            <Text style={styles.bulletItem}>• Call recordings</Text>
            <Text style={styles.bulletItem}>• Keystrokes</Text>
            <Text style={styles.bulletItem}>• Personal conversations</Text>
          </View>
          <Text style={styles.highlightParagraph}>We do not sell your personal information to third parties.</Text>

          {/* Section 3 */}
          <Text style={styles.sectionHeader}>3. How Permissions Are Used</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Accessibility Service</Text>
              <Text style={styles.tableCol2}>Detect distracting apps during an active Focus Session</Text>
            </View>
            <View style={styles.tableDivider} />
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Usage Access</Text>
              <Text style={styles.tableCol2}>Monitor application usage required for focus functionality</Text>
            </View>
            <View style={styles.tableDivider} />
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Battery Optimization</Text>
              <Text style={styles.tableCol2}>Help active Focus Sessions continue running reliably</Text>
            </View>
            <View style={styles.tableDivider} />
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Notifications</Text>
              <Text style={styles.tableCol2}>Provide Focus Session notifications and status updates</Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            FocusLock only requests permissions that are necessary for its functionality.
          </Text>

          {/* Section 4 */}
          <Text style={styles.sectionHeader}>4. Data Sharing</Text>
          <Text style={styles.paragraph}>
            FocusLock does not sell, rent, or trade your personal information. Information accessed through the permissions described in this policy is not shared with advertisers or data brokers.
          </Text>
          <Text style={styles.paragraph}>
            If third-party services are introduced in future versions of FocusLock, this Privacy Policy will be updated to explain what information those services receive and why.
          </Text>

          {/* Section 5 */}
          <Text style={styles.sectionHeader}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We take reasonable measures to protect information handled by FocusLock. However, no application or electronic transmission can be guaranteed to be completely secure.
          </Text>

          {/* Section 6 */}
          <Text style={styles.sectionHeader}>6. Data Retention and Deletion</Text>
          <Text style={styles.paragraph}>
            FocusLock does not intentionally retain personal information obtained through Accessibility Service or Usage Access solely for advertising or profiling purposes.
          </Text>
          <Text style={styles.paragraph}>
            If future versions of FocusLock store additional user information, this Privacy Policy will be updated to explain the applicable retention and deletion practices.
          </Text>

          {/* Section 7 */}
          <Text style={styles.sectionHeader}>7. Your Choices</Text>
          <Text style={styles.paragraph}>
            You can manage or revoke FocusLock's permissions through your Android device settings. You may disable:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Accessibility Service</Text>
            <Text style={styles.bulletItem}>• Usage Access</Text>
            <Text style={styles.bulletItem}>• Battery Optimization exemption</Text>
            <Text style={styles.bulletItem}>• Notifications</Text>
          </View>
          <Text style={styles.paragraph}>
            Disabling these permissions may prevent some FocusLock features from working correctly.
          </Text>

          {/* Section 8 */}
          <Text style={styles.sectionHeader}>8. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            FocusLock is not specifically directed toward children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe that a child has provided personal information to FocusLock, please contact us so that appropriate action can be taken.
          </Text>

          {/* Section 9 */}
          <Text style={styles.sectionHeader}>9. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time as FocusLock's features and functionality evolve. When changes are made, the updated "Last Updated" date will be displayed at the beginning of this policy.
          </Text>

          {/* Section 10 */}
          <Text style={styles.sectionHeader}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions, concerns, or requests regarding this Privacy Policy or FocusLock's privacy practices, please contact us at:
          </Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactEmail}>Email: support@focuslock.app</Text>
          </View>

          <View style={styles.footerBrand}>
            <Text style={styles.footerBrandTitle}>FocusLock</Text>
            <Text style={styles.footerBrandSub}>
              Helping you stay focused, reduce distractions, and build better digital habits.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  topBar: {
    flexDirection: 'row',
    paddingTop:50,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    padding: spacing.xs,
  },
  topTitle: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  lastUpdatedText: {
    color: '#4ECCA3',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs + 2,
  },
  subHeader: {
    color: '#9DA9FF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  paragraph: {
    color: '#C9D1D9',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  highlightParagraph: {
    color: '#F0F6FC',
    backgroundColor: '#161B22',
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 13.5,
    lineHeight: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECCA3',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  bulletList: {
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  bulletItem: {
    color: '#8B949E',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 2,
  },
  tableCard: {
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  tableCol1: {
    width: '40%',
    color: '#4F8CFF',
    fontSize: 13,
    fontWeight: '700',
    paddingRight: 6,
  },
  tableCol2: {
    width: '60%',
    color: '#C9D1D9',
    fontSize: 12.5,
    lineHeight: 18,
  },
  tableDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.xs,
  },
  contactCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.2)',
    marginBottom: spacing.xl,
  },
  contactEmail: {
    color: '#4F8CFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerBrand: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerBrandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  footerBrandSub: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
