import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Animated, 
  Dimensions 
} from 'react-native';
import { colors, spacing, typography, radius } from '../../src/styles/theme';
import { Button } from '../../src/components/Button';
import { TextInput } from '../../src/components/TextInput';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    goal: '',
    skillLevel: '',
    learningStyle: '',
    dailyTime: '',
    reminderTime: '08:00',
    consent: false,
  });
  const router = useRouter();

  const nextStep = () => {
    if (step < 7) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Navigate to dashboard
    router.replace('/(app)/dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <TextInput 
              label="Full Name" 
              placeholder="Enter your name" 
              value={data.name}
              onChangeText={(v) => setData({ ...data, name: v })}
              autoFocus
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What do you want to achieve?</Text>
            <TextInput 
              label="Your Goal" 
              placeholder="e.g. Learn UI/UX Design" 
              value={data.goal}
              onChangeText={(v) => setData({ ...data, goal: v })}
              autoFocus
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your current level?</Text>
            <View style={styles.buttonGroup}>
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <Button 
                  key={level}
                  title={level} 
                  variant={data.skillLevel === level ? 'primary' : 'secondary'}
                  onPress={() => setData({ ...data, skillLevel: level })}
                  style={styles.choiceButton}
                />
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Preferred learning style?</Text>
            <View style={styles.buttonGroup}>
              {['Visual', 'Reading', 'Hands-on'].map((style) => (
                <Button 
                  key={style}
                  title={style} 
                  variant={data.learningStyle === style ? 'primary' : 'secondary'}
                  onPress={() => setData({ ...data, learningStyle: style })}
                  style={styles.choiceButton}
                />
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Daily time commitment?</Text>
            <View style={styles.chipsContainer}>
              {['5min', '15min', '30min', '1hr+'].map((time) => (
                <Button 
                  key={time}
                  title={time} 
                  variant={data.dailyTime === time ? 'primary' : 'secondary'}
                  onPress={() => setData({ ...data, dailyTime: time })}
                  style={styles.chipButton}
                />
              ))}
            </View>
          </View>
        );
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>When should we remind you?</Text>
            <Text style={styles.stepSubtitle}>Consistency is key. Pick a time for your daily check-in.</Text>
            <TextInput 
              label="Reminder Time" 
              placeholder="08:00 AM" 
              value={data.reminderTime}
              onChangeText={(v) => setData({ ...data, reminderTime: v })}
            />
            <Text style={styles.almostDone}>Almost done! 🚀</Text>
          </View>
        );
      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Ready to start?</Text>
            <Text style={styles.consentText}>
              By clicking "Continue", you agree to our Terms of Service and Privacy Policy. We use your data to personalize your AI coach.
            </Text>
            <Button 
              title={data.consent ? "I Agree ✓" : "Tap to Agree"} 
              variant={data.consent ? 'primary' : 'secondary'}
              onPress={() => setData({ ...data, consent: !data.consent })}
              style={styles.consentButton}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !data.name;
      case 2: return !data.goal;
      case 3: return !data.skillLevel;
      case 4: return !data.learningStyle;
      case 5: return !data.dailyTime;
      case 7: return !data.consent;
      default: return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i < step ? styles.dotCompleted : i === step ? styles.dotActive : styles.dotInactive
              ]} 
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {renderStep()}
      </View>

      <View style={styles.footer}>
        <View style={styles.navButtons}>
          {step > 1 && (
            <Button 
              title="Back" 
              variant="ghost" 
              onPress={prevStep} 
              style={styles.backButton}
            />
          )}
          <Button 
            title={step === 7 ? "Complete" : "Continue"} 
            onPress={nextStep} 
            disabled={isNextDisabled()}
            style={[styles.nextButton, step === 1 && { width: '100%' }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[20],
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[8],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary500,
    width: 20,
  },
  dotCompleted: {
    backgroundColor: colors.primary500,
  },
  dotInactive: {
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[40],
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.size.text2xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing[24],
  },
  stepSubtitle: {
    fontSize: typography.size.textbase,
    color: colors.textSecondary,
    marginBottom: spacing[24],
  },
  buttonGroup: {
    gap: spacing[12],
  },
  choiceButton: {
    width: '100%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[12],
  },
  chipButton: {
    flexGrow: 1,
    minWidth: '40%',
  },
  almostDone: {
    fontSize: typography.size.textlg,
    fontWeight: '600',
    color: colors.primary500,
    marginTop: spacing[24],
    textAlign: 'center',
  },
  consentText: {
    fontSize: typography.size.textsm,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing[24],
  },
  consentButton: {
    width: '100%',
  },
  footer: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[40],
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: '30%',
  },
  nextButton: {
    flex: 1,
  },
});
