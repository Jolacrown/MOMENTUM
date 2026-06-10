import React from 'react';
import { WelcomeScreen } from '../src/features/welcome/WelcomeScreen';
import { useRouter } from 'expo-router';

export default function Page() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/signup');
  };

  return <WelcomeScreen onGetStarted={handleGetStarted} />;
}
