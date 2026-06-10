import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography, radius } from '../styles/theme';
import { Flame } from 'lucide-react-native';

interface StreakBadgeProps {
  count: number | string;
  status?: 'active' | 'at-risk' | 'broken';
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  count,
  status = 'active',
  size = 'md',
}) => {
  const getColors = () => {
    switch (status) {
      case 'active':
        return { bg: colors.primary50, text: colors.primary500, icon: colors.primary500 };
      case 'at-risk':
        return { bg: '#FEF9C3', text: colors.warning500, icon: colors.warning500 };
      case 'broken':
        return { bg: colors.bgElevated, text: colors.textMuted, icon: colors.textMuted };
      default:
        return { bg: colors.primary50, text: colors.primary500, icon: colors.primary500 };
    }
  };

  const { bg, text, icon } = getColors();

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      default: return 20;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }, size === 'sm' && styles.containerSm]}>
      <Flame size={getIconSize()} color={icon} fill={status === 'active' ? icon : 'transparent'} />
      <Text style={[styles.text, { color: text }, size === 'sm' && styles.textSm]}>
        {count === 0 ? '—' : count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    borderRadius: radius.full,
    gap: spacing[4],
  },
  containerSm: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
  },
  text: {
    fontSize: typography.size.textbase,
    fontWeight: '700',
  },
  textSm: {
    fontSize: typography.size.textxs,
  },
});
