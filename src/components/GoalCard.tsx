import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../styles/theme';
import { GoalStatus } from '../types';

interface GoalCardProps {
  title: string;
  progressPercent: number;
  status: GoalStatus;
  streak: number;
  onPress?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  progressPercent,
  status,
  streak,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: status === 'active' ? colors.success500 : colors.textMuted }]} />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
        <Text style={styles.streakText}>🔥 {streak} day streak</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${Math.max(progressPercent, 5)}%` } // min 5% for visibility
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progressPercent === 0 ? 'Just getting started' : `${progressPercent}% complete`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing[16],
    marginBottom: spacing[16],
    borderWidth: 1,
    borderColor: colors.borderBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[12],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.sm,
    gap: spacing[4],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary500,
  },
  title: {
    fontSize: typography.size.textlg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[16],
  },
  progressSection: {
    gap: spacing[8],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary500,
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.size.textxs,
    color: colors.textMuted,
  },
});
