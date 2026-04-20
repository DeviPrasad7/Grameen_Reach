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
  Sparkles, TrendingUp, Clock,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, _hasHydrated } = useAuthStore();
  const { lang, toggle, t } = useLangStore();
  const { count: cartCount, setCount: setCartCount } = useCartCountStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [pathname]);

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load cart count
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
        { href: '/buyer/price-comparison', label: { en: 'Prices', te: 'ధరలు' }, icon: BarChart3 },
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
        { href: '/buyer/price-comparison', label: { en: 'Prices', te: 'ధరలు' }, icon: BarChart3 },
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
    <nav className={`glass border-b border-slate-200/60 sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Sprout className="w-7 h-7 text-primary-600 group-hover:text-primary-700 group-hover:scale-110 transition-all duration-200" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">
              Grameen <span className="gradient-text">Reach</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {user && navLinks.map((l) => {
              const Icon = l.icon;
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(l.label)}
                  {(l.href === '/buyer/cart') && cartCount > 0 && (
                    <span className="ml-0.5 bg-gradient-to-r from-primary-600 to-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm animate-scale-in">
                      {cartCount}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary-600 rounded-full"></span>
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
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all duration-200 active:scale-95"
              title={lang === 'en' ? 'Switch to Telugu' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'తెలుగు' : 'EN'}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${profileOpen ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-emerald-100 text-primary-700 flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white">
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
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 animate-scale-in z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <User className="w-4 h-4 text-slate-400" /> {t({ en: 'My Profile', te: 'నా ప్రొఫైల్' })}
                      </Link>
                      <Link href="/notifications" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <Bell className="w-4 h-4 text-slate-400" /> {t({ en: 'Notifications', te: 'నోటిఫికేషన్లు' })}
                      </Link>
                      {user.role !== 'ADMIN' && (
                        <>
                          <Link href="/buyer/basket-builder" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <Sparkles className="w-4 h-4 text-slate-400" /> {t({ en: 'AI Basket Builder', te: 'AI బాస్కెట్' })}
                          </Link>
                          <Link href="/buyer/recently-viewed" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <Clock className="w-4 h-4 text-slate-400" /> {t({ en: 'Recently Viewed', te: 'ఇటీవల చూసిన' })}
                          </Link>
                        </>
                      )}
                      {user.role === 'FARMER' && (
                        <Link href="/farmer/listings/new" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <Package className="w-4 h-4 text-slate-400" /> {t({ en: 'New Listing', te: 'కొత్త జాబితా' })}
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> {t({ en: 'Logout', te: 'లాగ్ అవుట్' })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-primary-700 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-slate-50">
                  {t({ en: 'Sign in', te: 'సైన్ ఇన్' })}
                </Link>
                <Link href="/auth/register" className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-emerald-600 text-white hover:from-primary-700 hover:to-emerald-700 shadow-md shadow-primary-600/20 transition-all duration-200 hover:shadow-lg active:scale-95">
                  {t({ en: 'Get Started', te: 'ప్రారంభించు' })}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden text-slate-500 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-all active:scale-90"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && user && (
          <div className="md:hidden border-t border-slate-100 py-2 pb-4 animate-slide-down">
            {navLinks.map((l, i) => {
              const Icon = l.icon;
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 px-4 py-3 text-sm rounded-xl mx-1 my-0.5 transition-all duration-200 ${
                    active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <Icon className="w-4 h-4" />
                  {t(l.label)}
                  {(l.href === '/buyer/cart') && cartCount > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-primary-600 to-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </nav>
  );
}
