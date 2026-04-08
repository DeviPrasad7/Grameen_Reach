'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'te'>('en');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = user?.role === 'FARMER'
    ? [
        { href: '/farmer/dashboard', label: { en: 'Dashboard', te: 'డాష్‌బోర్డ్' } },
        { href: '/farmer/listings', label: { en: 'My Listings', te: 'నా జాబితాలు' } },
        { href: '/farmer/bids', label: { en: 'Bids', te: 'వేలాలు' } },
        { href: '/farmer/orders', label: { en: 'Orders', te: 'ఆర్డర్లు' } },
      ]
    : user?.role === 'ADMIN'
    ? [
        { href: '/admin/farmers', label: { en: 'Farmers', te: 'రైతులు' } },
        { href: '/admin/products', label: { en: 'Products', te: 'ఉత్పత్తులు' } },
        { href: '/admin/prices', label: { en: 'Mandi Prices', te: 'ధరలు' } },
        { href: '/admin/ai-logs', label: { en: 'AI Logs', te: 'AI లాగ్స్' } },
      ]
    : [
        { href: '/buyer/browse', label: { en: 'Browse', te: 'చూడండి' } },
        { href: '/buyer/cart', label: { en: 'Cart', te: 'కార్ట్' } },
        { href: '/buyer/orders', label: { en: 'My Orders', te: 'నా ఆర్డర్లు' } },
      ];

  const t = (obj: { en: string; te: string }) => obj[lang];

  return (
    <nav className="bg-white border-b border-primary-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-primary-700 text-lg">
            🌾 <span>Grameen Reach</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {user && navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors"
              >
                {t(l.label)}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
              className="text-xs font-semibold px-2 py-1 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50"
            >
              {lang === 'en' ? 'తెలుగు' : 'English'}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  {lang === 'te' ? 'లాగ్ అవుట్' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-primary-700 hover:underline">
                  {lang === 'te' ? 'లాగిన్' : 'Login'}
                </Link>
                <Link href="/auth/register" className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  {lang === 'te' ? 'నమోదు' : 'Register'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
