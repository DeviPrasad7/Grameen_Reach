import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Grameen Reach – AP/TS Farm-to-City Marketplace',
  description: 'Direct farm-to-city marketplace for Andhra Pradesh & Telangana. Buy fresh produce directly from verified farmers. No middlemen, fair prices.',
  keywords: ['farmer', 'marketplace', 'Andhra Pradesh', 'Telangana', 'organic', 'fresh vegetables', 'farm to table', 'Telugu'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Telugu:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main>{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 500 },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
