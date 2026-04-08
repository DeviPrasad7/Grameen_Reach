'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useLangStore } from '@/lib/store';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { lang, toggle, t } = useLangStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = user?.role === 'FARMER'
    ? [
        { href: '/farmer/dashboard', label: { en: 'Dashboard', te: 'డాష్\u200Cబోర్డ్' } },
        { href: '/farmer/listings', label: { en: 'My Listings', te: 'నా జాబితాలు' } },
        { href: '/farmer/bids', label: { en: 'Bids', te: 'బిడ్లు' } },
        { href: '/farmer/orders', label: { en: 'Orders', te: 'ఆర్డర్లు' } },
      ]
    : user?.role === 'ADMIN'
    ? [
        { href: '/admin/farmers', label: { en: 'Farmers', te: 'రైతులు' } },
        { href: '/admin/products', label: { en: 'Products', te: 'ఉత్పత్తులు' } },
        { href: '/admin/prices', label: { en: 'Mandi Prices', te: 'మండి ధరలు' } },
        { href: '/admin/ai-logs', label: { en: 'AI Logs', te: 'AI లాగ్స్' } },
      ]
    : [
        { href: '/buyer/browse', label: { en: 'Browse', te: 'చూడండి' } },
        { href: '/buyer/cart', label: { en: 'Cart', te: 'కార్ట్' } },
        { href: '/buyer/orders', label: { en: 'My Orders', te: 'నా ఆర్డర్లు' } },
      ];

  if (!mounted) {
    return (
      <nav className="bg-white border-b border-primary-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary-700 text-lg">
              <span>Grameen Reach</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-primary-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary-700 text-lg">
            <span>Grameen Reach</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {user && navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-primary-700 font-semibold' : 'text-gray-600 hover:text-primary-700'}`}
              >
                {t(l.label)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2 py-1 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50"
            >
              {lang === 'en' ? 'తెలుగు' : 'English'}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.name}
                  <span className="text-xs text-gray-400 ml-1">({user.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  {t({ en: 'Logout', te: 'లాగ్ అవుట్' })}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-primary-700 hover:underline">
                  {t({ en: 'Login', te: 'లాగిన్' })}
                </Link>
                <Link href="/auth/register" className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  {t({ en: 'Register', te: 'నమోదు' })}
                </Link>
              </div>
            )}

            {user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden text-gray-600 hover:text-primary-700 ml-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {menuOpen && user && (
          <div className="md:hidden border-t border-gray-100 py-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block px-3 py-2 text-sm rounded-lg ${pathname === l.href ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t(l.label)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
