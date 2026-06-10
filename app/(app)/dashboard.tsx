import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { colors, spacing, typography, radius } from '../../src/styles/theme';
import { StreakBadge } from '../../src/components/StreakBadge';
import { GoalCard } from '../../src/components/GoalCard';
import { CheckinCard } from '../../src/components/CheckinCard';
import { CoachMessageBubble } from '../../src/components/CoachMessageBubble';
import { Settings, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, TJ</Text>
          <Text style={styles.date}>Wednesday, 10 June</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/account/settings')}>
          <Settings stroke={colors.textSecondary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.streakSection}>
          <StreakBadge count={5} status="active" size="lg" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakTitle}>5-Day Streak!</Text>
            <Text style={styles.streakSubtitle}>Keep the momentum going.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.premiumCard} onPress={() => router.push('/upgrade')}>
          <View style={styles.premiumTextContainer}>
            <Text style={styles.premiumTitle}>Unlock Full Potential</Text>
            <Text style={styles.premiumSubtitle}>Get unlimited AI coaching and goals.</Text>
          </View>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>GO PREMIUM</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Check-in</Text>
            <Text style={styles.sectionAction}>View History</Text>
          </View>
          <CheckinCard 
            goalTitle="Learn UI/UX Design" 
            isCompleted={hasCheckedIn} 
            onToggle={() => setHasCheckedIn(!hasCheckedIn)} 
          />
        </View>

        <TouchableOpacity style={styles.section} onPress={() => router.push('/(app)/coach')}>
          <CoachMessageBubble 
            content="Great progress on your design goals! Consistency is more important than intensity. You're doing well by showing up today." 
          />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(app)/goals/new')}>
              <Plus stroke={colors.primary500} size={20} />
            </TouchableOpacity>
          </View>
          <GoalCard 
            title="Learn UI/UX Design" 
            progressPercent={25} 
            status="active" 
            streak={5}
            onPress={() => router.push('/(app)/goals/details')}
          />
          <TouchableOpacity style={styles.addGoalCard} onPress={() => router.push('/(app)/goals/new')}>
            <Plus stroke={colors.textMuted} size={24} />
            <Text style={styles.addGoalText}>Start a new goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[16],
  },
  greeting: {
    fontSize: typography.size.textxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  date: {
    fontSize: typography.size.textsm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[40],
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    padding: spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderBase,
    marginVertical: spacing[20],
    gap: spacing[16],
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: typography.size.textlg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakSubtitle: {
    fontSize: typography.size.textsm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing[32],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[16],
  },
  sectionTitle: {
    fontSize: typography.size.textlg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionAction: {
    fontSize: typography.size.textsm,
    color: colors.primary500,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary50,
    padding: spacing[8],
    borderRadius: radius.md,
  },
  addGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[20],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderBase,
    gap: spacing[12],
  },
  addGoalText: {
    fontSize: typography.size.textbase,
    fontWeight: '600',
    color: colors.textMuted,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    padding: spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary200,
    marginTop: spacing[12],
    gap: spacing[16],
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: typography.size.textbase,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  premiumSubtitle: {
    fontSize: typography.size.textxs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  premiumBadge: {
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.sm,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
