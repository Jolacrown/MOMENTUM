import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../styles/theme';
import { Check } from 'lucide-react-native';

interface CheckinCardProps {
  goalTitle: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export const CheckinCard: React.FC<CheckinCardProps> = ({
  goalTitle,
  isCompleted,
  onToggle,
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, isCompleted && styles.containerCompleted]} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {goalTitle}
        </Text>
        <Text style={styles.subtitle}>
          {isCompleted ? 'All caught up!' : 'Ready for your daily action?'}
        </Text>
      </View>
      
      <View style={[styles.checkbox, isCompleted && styles.checkboxActive]}>
        {isCompleted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    padding: spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderBase,
    marginBottom: spacing[12],
  },
  containerCompleted: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary200,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.textbase,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  titleCompleted: {
    color: colors.primary900,
  },
  subtitle: {
    fontSize: typography.size.textxs,
    color: colors.textMuted,
    marginTop: spacing[4],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.success500,
    borderColor: colors.success500,
  },
});
