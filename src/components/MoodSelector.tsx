import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../styles/theme';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

interface MoodSelectorProps {
  selectedMood: number | null;
  onSelect: (value: number) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>How are you feeling today?</Text>
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            onPress={() => onSelect(mood.value)}
            style={[
              styles.moodItem,
              selectedMood === mood.value && styles.moodItemActive,
            ]}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[
              styles.moodLabel,
              selectedMood === mood.value && styles.moodLabelActive,
            ]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[16],
  },
  label: {
    fontSize: typography.size.textsm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[12],
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    padding: spacing[8],
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    width: '18%',
  },
  moodItemActive: {
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary300,
  },
  emoji: {
    fontSize: 24,
    marginBottom: spacing[4],
  },
  moodLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  moodLabelActive: {
    color: colors.primary500,
    fontWeight: '700',
  },
});
