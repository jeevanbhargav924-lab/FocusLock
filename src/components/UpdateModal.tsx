import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { colors, fonts } from '../theme';
import { UpdateInfo, openStoreUpdate, CURRENT_VERSION_NAME } from '../services/updateChecker';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateInfo,
  onDismiss,
}) => {
  if (!updateInfo) return null;

  const handleBackdropClose = () => {
    if (!updateInfo.isForced) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>
                v{CURRENT_VERSION_NAME} → v{updateInfo.latestVersion}
              </Text>
            </View>
            {updateInfo.isForced && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>MANDATORY</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{updateInfo.title}</Text>
          <Text style={styles.subtitle}>
            {updateInfo.isForced
              ? 'An important update is required to continue using FocusLock.'
              : 'A new version of FocusLock is available with improvements.'}
          </Text>

          {/* Release Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesHeader}>What’s New:</Text>
            <ScrollView
              style={styles.notesScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text style={styles.notesText}>{updateInfo.releaseNotes}</Text>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!updateInfo.isForced && (
              <TouchableOpacity
                style={styles.laterButton}
                activeOpacity={0.8}
                onPress={onDismiss}
              >
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.updateButton,
                updateInfo.isForced && styles.fullWidthButton,
              ]}
              activeOpacity={0.8}
              onPress={() => openStoreUpdate(updateInfo.updateUrl)}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#13161B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  versionBadge: {
    backgroundColor: 'rgba(92, 142, 242, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92, 142, 242, 0.3)',
  },
  versionBadgeText: {
    fontFamily: fonts.semiBold,
    color: '#8EAEFF',
    fontSize: 12,
  },
  requiredBadge: {
    backgroundColor: 'rgba(240, 111, 111, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(240, 111, 111, 0.3)',
  },
  requiredBadgeText: {
    fontFamily: fonts.semiBold,
    color: '#F06F6F',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 20,
  },
  notesContainer: {
    backgroundColor: '#101318',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 22,
    maxHeight: 140,
  },
  notesHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  notesScroll: {
    maxHeight: 100,
  },
  notesText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  updateButton: {
    flex: 1.3,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  updateButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
