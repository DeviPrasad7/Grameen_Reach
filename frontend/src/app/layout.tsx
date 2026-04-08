import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Grameen Reach – AP/TS Farmer Marketplace',
  description: 'Direct farm-to-city marketplace for Andhra Pradesh & Telangana. Buy fresh produce directly from verified farmers.',
  keywords: ['farmer', 'marketplace', 'Andhra Pradesh', 'Telangana', 'organic', 'fresh vegetables'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Telugu:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
