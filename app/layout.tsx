import type { Metadata } from 'next';
import { AuthInitializer } from '@/components/web/AuthInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Momentum - AI-Powered Accountability Coach',
  description: 'Africa\'s first emotionally intelligent AI accountability coach. Stay consistent, improve your skills, and reach your goals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PlusJakartaSans:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-base text-text-primary font-body">
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
