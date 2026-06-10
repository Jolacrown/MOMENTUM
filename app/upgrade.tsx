import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors, spacing, typography, radius } from '../src/styles/theme';
import { ArrowLeft, Check, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { initiatePayment } from '../src/lib/payments/flutterwave';
import { Button } from '../src/components/Button';

const PREMIUM_FEATURES = [
  'Unlimited daily goals (vs 1 free)',
  'Unlimited AI coaching messages',
  'Advanced progress analytics',
  'Exclusive mentorship opportunities',
  'Priority notification settings',
];

export default function UpgradeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const result = await initiatePayment({
        tx_ref: `momentum_${Date.now()}`,
        amount: 5000, // ₦5,000 monthly
        currency: 'NGN',
        customer: {
          email: 'tj@example.com',
          name: 'TJ',
        },
        customizations: {
          title: 'Momentum Premium',
          description: 'Unlock your full potential with unlimited accountability.',
          logo: 'https://momentum.app/logo.png',
        }
      });

      if (result.status === 'success') {
        Alert.alert(
          "Payment Initiated",
          "In a production app, this would open the Flutterwave payment gateway. Since this is a demo, we'll simulate a successful upgrade.",
          [
            { 
              text: "Simulate Success", 
              onPress: () => {
                // In real app, wait for webhook or redirect verify
                router.replace('/(app)/dashboard');
              } 
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.zapIcon}>
            <Zap fill={colors.primary500} color={colors.primary500} size={32} />
          </View>
          <Text style={styles.heroTitle}>Level Up Your Momentum</Text>
          <Text style={styles.heroSubtitle}>
            ₦5,000 / month
          </Text>
        </View>

        <View style={styles.featuresList}>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.checkContainer}>
                <Check color={colors.success500} size={16} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Button 
            title="Upgrade Now" 
            onPress={handleUpgrade} 
            isLoading={isLoading}
            style={styles.upgradeButton}
          />
          <Text style={styles.guaranteeText}>
            Secure payment via Flutterwave. Cancel anytime.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
  },
  headerTitle: {
    fontSize: typography.size.textbase,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[40],
  },
  hero: {
    alignItems: 'center',
    marginVertical: spacing[40],
  },
  zapIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[20],
  },
  heroTitle: {
    fontSize: typography.size.text2xl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.size.textlg,
    fontWeight: '600',
    color: colors.primary500,
    marginTop: spacing[8],
  },
  featuresList: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing[24],
    borderWidth: 1,
    borderColor: colors.borderBase,
    gap: spacing[16],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: typography.size.textbase,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    marginTop: spacing[40],
  },
  upgradeButton: {
    width: '100%',
  },
  guaranteeText: {
    fontSize: typography.size.textxs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing[16],
  },
});
