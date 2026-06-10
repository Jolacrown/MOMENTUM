import React, { useState } from 'react';
import { WelcomeScreen } from './src/features/welcome/WelcomeScreen';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  const handleGetStarted = () => {
    setShowWelcome(false);
    // This will eventually navigate to onboarding/auth
    console.log('Navigating to Get Started...');
  };

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // Placeholder for the rest of the app
  return null;
}
