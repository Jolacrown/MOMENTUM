import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, StatusBar } from 'react-native';
import { colors, spacing, typography } from '../../styles/theme';
import { Button } from '../../components/Button';

export const WelcomeScreen: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={require('../../../assets/welcome_illustration.png')} 
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Momentum</Text>
          <Text style={styles.subtitle}>
            Africa's first emotionally intelligent AI accountability coach.
          </Text>
          <Text style={styles.description}>
            Stay consistent, improve your skills, and reach your goals with a companion that understands your journey.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Get Started" 
            onPress={onGetStarted} 
            size="lg"
            style={styles.button}
          />
          <Text style={styles.footerText}>
            Join thousands of others building better habits today.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[24],
    justifyContent: 'space-between',
    paddingVertical: spacing[40],
  },
  imageContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.text4xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing[12],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.textlg,
    fontWeight: '600',
    color: colors.primary500,
    textAlign: 'center',
    marginBottom: spacing[16],
  },
  description: {
    fontSize: typography.size.textbase,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.size.textbase,
  },
  footer: {
    paddingBottom: spacing[24],
  },
  button: {
    width: '100%',
    marginBottom: spacing[16],
  },
  footerText: {
    fontSize: typography.size.textxs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
