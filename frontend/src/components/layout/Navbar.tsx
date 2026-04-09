'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useLangStore, useCartCountStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import {
  Menu, X, ShoppingCart, LogOut, User, LayoutDashboard,
  Package, Gavel, ClipboardList, Store, ShieldCheck,
  BarChart3, Bot, Globe, Sprout, ChevronDown, Bell, Heart,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, _hasHydrated } = useAuthStore();
  const { lang, toggle, t } = useLangStore();
  const { count: cartCount, setCount: setCartCount } = useCartCountStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [pathname]);

  // Load cart count for buyers and farmers
  useEffect(() => {
    if (_hasHydrated && user && (user.role === 'BUYER' || user.role === 'FARMER')) {
      cartApi.get().then((r) => setCartCount(r.data?.items?.length || 0)).catch(() => {});
    }
  }, [_hasHydrated, user]);

  const handleLogout = () => {
    logout();
    setCartCount(0);
    router.push('/');
  };

  const navLinks = user?.role === 'FARMER'
    ? [
        { href: '/farmer/dashboard', label: { en: 'Dashboard', te: 'డాష్\u200Cబోర్డ్' }, icon: LayoutDashboard },
        { href: '/farmer/listings', label: { en: 'Listings', te: 'జాబితాలు' }, icon: Package },
        { href: '/farmer/bids', label: { en: 'Bids', te: 'బిడ్లు' }, icon: Gavel },
        { href: '/farmer/orders', label: { en: 'Orders', te: 'ఆర్డర్లు' }, icon: ClipboardList },
        { href: '/buyer/browse', label: { en: 'Browse', te: 'చూడండి' }, icon: Store },
        { href: '/buyer/cart', label: { en: 'Cart', te: 'కార్ట్' }, icon: ShoppingCart },
      ]
    : user?.role === 'ADMIN'
    ? [
        { href: '/admin/farmers', label: { en: 'Farmers', te: 'రైతులు' }, icon: ShieldCheck },
        { href: '/admin/products', label: { en: 'Products', te: 'ఉత్పత్తులు' }, icon: Package },
        { href: '/admin/prices', label: { en: 'Prices', te: 'ధరలు' }, icon: BarChart3 },
        { href: '/admin/ai-logs', label: { en: 'AI Logs', te: 'AI లాగ్స్' }, icon: Bot },
      ]
    : [
        { href: '/buyer/browse', label: { en: 'Browse', te: 'చూడండి' }, icon: Store },
        { href: '/buyer/cart', label: { en: 'Cart', te: 'కార్ట్' }, icon: ShoppingCart },
        { href: '/buyer/orders', label: { en: 'Orders', te: 'ఆర్డర్లు' }, icon: ClipboardList },
        { href: '/buyer/bids', label: { en: 'My Bids', te: 'నా బిడ్లు' }, icon: Gavel },
        { href: '/buyer/wishlist', label: { en: 'Wishlist', te: 'విష్‌లిస్ట్' }, icon: Heart },
      ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  // SSR / pre-hydration skeleton
  if (!_hasHydrated) {
    return (
      <nav className="glass border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Sprout className="w-7 h-7 text-primary-600" />
              <span className="font-bold text-lg text-slate-800 tracking-tight">Grameen Reach</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="glass border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Sprout className="w-7 h-7 text-primary-600 group-hover:text-primary-700 transition-colors" />
            <span className="font-bold text-lg text-slate-800 tracking-tight">Grameen Reach</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {user && navLinks.map((l) => {
              const Icon = l.icon;
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(l.label)}
                  {(l.href === '/buyer/cart') && cartCount > 0 && (
                    <span className="ml-0.5 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              title={lang === 'en' ? 'Switch to Telugu' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'తెలుగు' : 'EN'}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-700 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {user.role === 'FARMER' ? t({ en: 'Farmer', te: 'రైతు' }) :
                       user.role === 'ADMIN' ? t({ en: 'Admin', te: 'అడ్మిన్' }) :
                       t({ en: 'Buyer', te: 'కొనుగోలుదారు' })}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-scale-in z-50">
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <User className="w-4 h-4" /> {t({ en: 'My Profile', te: 'నా ప్రొఫైల్' })}
                    </Link>
                    <Link href="/notifications" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Bell className="w-4 h-4" /> {t({ en: 'Notifications', te: 'నోటిఫికేషన్లు' })}
                    </Link>
                    {user.role !== 'ADMIN' && (
                      <Link href="/buyer/basket-builder" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Bot className="w-4 h-4" /> {t({ en: 'AI Basket Builder', te: 'AI బాస్కెట్' })}
                      </Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> {t({ en: 'Logout', te: 'లాగ్ అవుట్' })}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-primary-700 px-3 py-1.5 transition-colors">
                  {t({ en: 'Sign in', te: 'సైన్ ఇన్' })}
                </Link>
                <Link href="/auth/register" className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-all">
                  {t({ en: 'Get Started', te: 'ప్రారంభించు' })}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden text-slate-500 hover:text-slate-700 p-1"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && user && (
          <div className="md:hidden border-t border-slate-100 py-2 pb-3 animate-slide-down">
            {navLinks.map((l) => {
              const Icon = l.icon;
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg mx-1 ${
                    active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(l.label)}
                  {(l.href === '/buyer/cart') && cartCount > 0 && (
                    <span className="ml-auto bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside to close profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </nav>
  );
}
