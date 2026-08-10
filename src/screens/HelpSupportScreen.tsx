import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
  NativeModules,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { BackIcon } from '../utils/Icons';
import { Toast } from '../components/Toast';

interface HelpSupportScreenProps {
  onBack: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'permissions' | 'blocking';
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'general',
      question: 'How does Strict Focus Lock work?',
      answer:
        'Strict Mode prevents you from ending sessions early or unblocking apps until the timer finishes. It requires Android Usage Access and Device Admin permissions to ensure complete focus.',
    },
    {
      id: '2',
      category: 'blocking',
      question: 'Why are apps not blocking automatically on Xiaomi/Samsung?',
      answer:
        'Custom Android OS skins (like MIUI, One UI, Funtouch) aggressively kill background services. Please enable "Autostart" and set Battery Saver to "No Restrictions" for FocusLock in System Settings.',
    },
    {
      id: '3',
      category: 'permissions',
      question: 'What is the Emergency PIN and Daily Limit?',
      answer:
        'If you set an Emergency Limit, you can use your emergency PIN to override a blocked app a limited number of times per day. Setting it to 0 creates an unbreakable 100% strict lock.',
    },
    {
      id: '4',
      category: 'blocking',
      question: 'Can I change allowed apps during an active session?',
      answer:
        'No. Allowed apps must be configured BEFORE starting a focus session. Once a session begins, allowed apps cannot be edited until the timer expires.',
    },
    {
      id: '5',
      category: 'general',
      question: 'Is my personal app data or screen usage private?',
      answer:
        'Yes. 100% of your usage statistics and session logs are stored locally on your device. FocusLock never sells or uploads your personal app data to external cloud servers.',
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleContactEmail = () => {
    Linking.openURL('mailto:Jeevanbhargav286@gmail.com?subject=FocusLock%20Support%20Request').catch(
      () => {
        Toast.info(
          'Contact Email',
          'Write to us at Jeevanbhargav286@gmail.com',
        );
      },
    );
  };

  const handleOpenBatterySettings = () => {
    if (Platform.OS === 'android' && NativeModules.PermissionModule?.openUsageStatsSettings) {
      NativeModules.PermissionModule.openUsageStatsSettings();
    } else {
      Toast.info('System Settings', 'Please check Battery Optimization in your device Settings.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <BackIcon color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Help & Support</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>How can we help?</Text>
            <Text style={styles.headerSub}>
              Find answers to common questions or reach out to our team.
            </Text>
          </View>

          {/* Quick Troubleshooting Card */}
          <View style={styles.diagnosticCard}>
            <View style={styles.diagnosticHeader}>
              <Text style={styles.diagnosticIcon}>⚡</Text>
              <Text style={styles.diagnosticTitle}>App Not Blocking?</Text>
            </View>
            <Text style={styles.diagnosticSub}>
              If apps aren't blocking properly during active sessions, ensure
              battery optimization is disabled for FocusLock.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.diagnosticBtn}
              onPress={handleOpenBatterySettings}
            >
              <Text style={styles.diagnosticBtnText}>
                Fix Battery Settings →
              </Text>
            </TouchableOpacity>
          </View>

          {/* FAQ Accordion Section */}
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.faqList}>
            {faqs.map(item => {
              const isExpanded = expandedId === item.id;
              return (
                <View key={item.id} style={styles.faqCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.faqQuestionRow}
                    onPress={() => toggleExpand(item.id)}
                  >
                    <Text style={styles.faqQuestionText}>{item.question}</Text>
                    <Text style={styles.faqChevron}>
                      {isExpanded ? '−' : '+'}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Still Need Help / Contact Card */}
          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={styles.contactTitle}>Still need assistance?</Text>
            <Text style={styles.contactSub}>
              Our support team is available to assist with permission setup,
              custom feature requests, or technical issues.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.contactBtn}
              onPress={handleContactEmail}
            >
              <Text style={styles.contactBtnText}>
                Email Support (Jeevanbhargav286@gmail.com)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            FocusLock Support • Response time usually within 24 hours
          </Text>
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
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  diagnosticCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  diagnosticIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  diagnosticTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  diagnosticSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  diagnosticBtn: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  diagnosticBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  faqList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md + 2,
  },
  faqQuestionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    paddingRight: spacing.sm,
  },
  faqChevron: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  faqAnswerBox: {
    paddingHorizontal: spacing.md + 2,
    paddingBottom: spacing.md + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  faqAnswerText: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  contactIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  contactTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactSub: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  contactBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
