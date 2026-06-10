import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { colors, spacing, typography } from '../../src/styles/theme';
import { TextInput } from '../../src/components/TextInput';
import { Button } from '../../src/components/Button';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setIsLoading(true);
    // Mock signup delay
    setTimeout(() => {
      setIsLoading(false);
      router.push('/onboarding');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your consistency journey today.</Text>
          </View>

          <View style={styles.form}>
            <TextInput 
              label="Full Name" 
              placeholder="Enter your name" 
              value={name}
              onChangeText={setName}
            />
            <TextInput 
              label="Email Address" 
              placeholder="email@example.com" 
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput 
              label="Password" 
              placeholder="••••••••" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
            <Button 
              title="Sign Up" 
              onPress={handleSignup} 
              isLoading={isLoading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text 
              style={styles.link}
              onPress={() => router.push('/(auth)/login')}
            >
              Sign In
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[40],
  },
  header: {
    marginBottom: spacing[32],
  },
  title: {
    fontSize: typography.size.text2xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.textbase,
    color: colors.textSecondary,
    marginTop: spacing[8],
  },
  form: {
    flex: 1,
  },
  button: {
    marginTop: spacing[16],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[32],
  },
  footerText: {
    fontSize: typography.size.textsm,
    color: colors.textSecondary,
  },
  link: {
    fontSize: typography.size.textsm,
    color: colors.primary500,
    fontWeight: '600',
  },
});
