import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  ActivityIndicator
} from 'react-native';
import { colors, spacing, typography, radius } from '../../src/styles/theme';
import { ArrowLeft, ExternalLink, GraduationCap, Users, BookOpen, Presentation } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getRecommendations, Recommendation } from '../../src/features/recommendations/recommendations.service';

export default function RecommendationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await getRecommendations();
      setRecommendations(data);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'mentor': return <Users size={20} color={colors.primary500} />;
      case 'course': return <GraduationCap size={20} color={colors.primary500} />;
      case 'resource': return <BookOpen size={20} color={colors.primary500} />;
      case 'workshop': return <Presentation size={20} color={colors.primary500} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary500} />
          <Text style={styles.loadingText}>Finding best resources for you...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionSubtitle}>
            Based on your goal "Learn UI/UX Design" and your skill level.
          </Text>

          {recommendations.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => Linking.openURL(item.url)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  {getIcon(item.type)}
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.tagsContainer}>
                  {item.tags.map(tag => (
                    <Text key={tag} style={styles.tag}>#{tag}</Text>
                  ))}
                </View>
                <ExternalLink size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    backgroundColor: colors.bgBase,
  },
  headerTitle: {
    fontSize: typography.size.textbase,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[16],
    color: colors.textSecondary,
    fontSize: typography.size.textsm,
  },
  scrollContent: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[40],
  },
  sectionSubtitle: {
    fontSize: typography.size.textsm,
    color: colors.textSecondary,
    marginBottom: spacing[24],
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing[20],
    marginBottom: spacing[16],
    borderWidth: 1,
    borderColor: colors.borderBase,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardTitle: {
    fontSize: typography.size.textlg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.size.textsm,
    color: colors.textSecondary,
    marginTop: spacing[4],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing[20],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  tag: {
    fontSize: 10,
    color: colors.primary500,
    fontWeight: '600',
  },
});
