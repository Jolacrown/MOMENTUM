import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../styles/theme';

interface CoachMessageBubbleProps {
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export const CoachMessageBubble: React.FC<CoachMessageBubbleProps> = ({
  content,
  timestamp,
  isStreaming = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.content}>{content}</Text>
        {isStreaming && (
          <View style={styles.streamingIndicator}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        )}
      </View>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[16],
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  bubble: {
    backgroundColor: colors.bgSurface,
    padding: spacing[16],
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    fontSize: typography.size.textbase,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing[4],
    marginLeft: spacing[4],
  },
  streamingIndicator: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing[8],
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary300,
  },
});
