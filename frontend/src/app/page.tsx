'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore, useLangStore } from '@/lib/store';
import { Sprout, ShieldCheck, BarChart3, Bot, Globe, Package, TrendingUp, ArrowRight, Star, Heart, Bell, Gavel, Ban, Phone, Leaf, Zap, Users, MapPin, Clock, Award, Sparkles, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();
  const [visibleStats, setVisibleStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisibleStats(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const primaryCTA = user
    ? user.role === 'FARMER'
      ? { href: '/farmer/dashboard', label: { en: 'Go to Dashboard', te: 'డాష్‌బోర్డ్‌కు వెళ్ళండి' } }
      : user.role === 'ADMIN'
      ? { href: '/admin/farmers', label: { en: 'Admin Panel', te: 'అడ్మిన్ ప్యానెల్' } }
      : { href: '/buyer/browse', label: { en: 'Browse Products', te: 'ఉత్పత్తులు చూడండి' } }
    : { href: '/buyer/browse', label: { en: 'Shop Fresh Produce', te: 'తాజా ఉత్పత్తులు కొనండి' } };

  const secondaryCTA = user
    ? user.role === 'FARMER'
      ? { href: '/farmer/listings/new', label: { en: 'Create Listing', te: 'జాబితా సృష్టించు' } }
      : user.role === 'ADMIN'
      ? { href: '/admin/products', label: { en: 'Manage Products', te: 'ఉత్పత్తులు నిర్వహించు' } }
      : { href: '/buyer/basket-builder', label: { en: 'AI Basket Builder', te: 'AI బాస్కెట్ బిల్డర్' } }
    : { href: '/auth/register?role=FARMER', label: { en: 'Sell as Farmer', te: 'రైతుగా అమ్మండి' } };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-emerald-50">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23166534\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        {/* Floating produce emojis */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-[8%] text-5xl animate-float opacity-20">🍅</div>
          <div className="absolute top-32 right-[12%] text-4xl animate-float-delayed opacity-15">🥬</div>
          <div className="absolute bottom-20 left-[15%] text-5xl animate-float opacity-15">🌾</div>
          <div className="absolute top-20 right-[30%] text-3xl animate-float-delayed opacity-10">🌶️</div>
          <div className="absolute bottom-32 right-[8%] text-4xl animate-float opacity-15">🥕</div>
          <div className="absolute top-48 left-[40%] text-3xl animate-float-delayed opacity-10">🍎</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-100/80 text-primary-700 text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm border border-primary-200/50">
              <Sparkles className="w-4 h-4 animate-pulse" />
              {t({ en: 'AP & Telangana\'s #1 Farmer Marketplace', te: 'AP & తెలంగాణ #1 రైతు మార్కెట్‌ప్లేస్' })}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
              <span className="gradient-text">{t({ en: 'From Farm', te: 'రైతు నుండి' })}</span>
              <br />
              <span className="text-slate-800">{t({ en: 'to Your Home', te: 'మీ ఇంటికి' })}</span>
              <span className="inline-block ml-3 animate-bounce-gentle">🌱</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              {t({
                en: 'Fresh produce directly from verified farmers. Zero middlemen. Fair prices. AI-powered smart shopping.',
                te: 'ధృవీకరించిన రైతుల నుండి నేరుగా తాజా ఉత్పత్తులు. మధ్యవర్తులు లేరు. న్యాయమైన ధరలు. AI ఆధారిత స్మార్ట్ షాపింగ్.',
              })}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
              <Link
                href={primaryCTA.href}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold rounded-2xl btn-primary"
              >
                {t(primaryCTA.label)}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={secondaryCTA.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl btn-secondary"
              >
                {user ? <Bot className="w-5 h-5" /> : <Sprout className="w-5 h-5" />}
                {t(secondaryCTA.label)}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-slate-500 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary-500" /> {t({ en: 'Verified Farmers', te: 'ధృవీకరించిన రైతులు' })}</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> {t({ en: 'AI-Powered', te: 'AI ఆధారిత' })}</span>
              <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-green-500" /> {t({ en: 'Organic Options', te: 'సేంద్రీయ ఎంపికలు' })}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> {t({ en: '26 Districts', te: '26 జిల్లాలు' })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="border-y border-slate-200 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 via-transparent to-emerald-50/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1,200+', label: { en: 'Verified Farmers', te: 'ధృవీకరించిన రైతులు' }, icon: Users, color: 'text-primary-600' },
              { value: '5,000+', label: { en: 'Products Listed', te: 'జాబితా ఉత్పత్తులు' }, icon: Package, color: 'text-blue-600' },
              { value: '26', label: { en: 'Districts Covered', te: 'జిల్లాలు' }, icon: MapPin, color: 'text-amber-600' },
              { value: '₹2Cr+', label: { en: 'Farmer Earnings', te: 'రైతుల ఆదాయం' }, icon: TrendingUp, color: 'text-emerald-600' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.value} className={`flex flex-col items-center transition-all duration-500 ${visibleStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3 ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-800 stat-number">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">{t(s.label)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {t({ en: 'Shop by Category', te: 'వర్గం ద్వారా షాపింగ్' })}
          </h2>
          <p className="text-slate-500 text-sm">{t({ en: 'Fresh produce across all categories', te: 'అన్ని వర్గాలలో తాజా ఉత్పత్తులు' })}</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 sm:gap-6">
          {[
            { name: { en: 'Vegetables', te: 'కూరగాయలు' }, emoji: '🥬', slug: 'Vegetables', color: 'from-green-50 to-emerald-50 border-green-200' },
            { name: { en: 'Fruits', te: 'పండ్లు' }, emoji: '🍎', slug: 'Fruits', color: 'from-red-50 to-orange-50 border-red-200' },
            { name: { en: 'Grains', te: 'ధాన్యాలు' }, emoji: '🌾', slug: 'Grains', color: 'from-amber-50 to-yellow-50 border-amber-200' },
            { name: { en: 'Pulses', te: 'పప్పులు' }, emoji: '🫘', slug: 'Pulses', color: 'from-orange-50 to-amber-50 border-orange-200' },
            { name: { en: 'Spices', te: 'మసాలాలు' }, emoji: '🌶️', slug: 'Spices', color: 'from-red-50 to-pink-50 border-red-200' },
            { name: { en: 'Dairy', te: 'పాలు' }, emoji: '🥛', slug: 'Dairy', color: 'from-blue-50 to-sky-50 border-blue-200' },
            { name: { en: 'Oils', te: 'నూనెలు' }, emoji: '🫒', slug: 'Oils', color: 'from-lime-50 to-green-50 border-lime-200' },
            { name: { en: 'Dry Fruits', te: 'డ్రై ఫ్రూట్స్' }, emoji: '🥜', slug: 'Dry Fruits', color: 'from-yellow-50 to-amber-50 border-yellow-200' },
          ].map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/buyer/browse?category=${encodeURIComponent(cat.slug)}`}
              className={`flex flex-col items-center gap-2 group animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${cat.color} border flex items-center justify-center text-2xl sm:text-3xl shadow-sm group-hover:shadow-lg group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300`}>
                {cat.emoji}
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-slate-600 group-hover:text-primary-700 transition-colors text-center">
                {t(cat.name)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Features Spotlight */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-4 backdrop-blur-sm border border-white/10">
              <Bot className="w-4 h-4" />
              {t({ en: 'Powered by AI', te: 'AI ఆధారిత' })}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              {t({ en: 'Smart Features for Smart Farming', te: 'స్మార్ట్ వ్యవసాయం కోసం స్మార్ట్ ఫీచర్లు' })}
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              {t({ en: 'AI-powered tools that help farmers earn more and buyers save more', te: 'రైతులు ఎక్కువ సంపాదించడానికి మరియు కొనుగోలుదారులు ఎక్కువ ఆదా చేయడానికి AI సాధనాలు' })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: { en: 'AI Listing Generator', te: 'AI జాబితా జనరేటర్' }, desc: { en: 'Describe your produce in 10 words — AI creates a full bilingual listing with price suggestions', te: '10 పదాలలో వివరించండి — AI ధర సూచనలతో పూర్తి ద్విభాషా జాబితా సృష్టిస్తుంది' }, color: 'from-purple-500/20 to-purple-600/10' },
              { icon: TrendingUp, title: { en: 'AI Price Coach', te: 'AI ధర కోచ్' }, desc: { en: 'Get real-time mandi price comparisons and AI-powered pricing advice for your produce', te: 'మీ ఉత్పత్తికి నిజ-సమయ మండి ధర పోలికలు మరియు AI ధర సలహా పొందండి' }, color: 'from-blue-500/20 to-blue-600/10' },
              { icon: Gavel, title: { en: 'Smart Counter-Offers', te: 'స్మార్ట్ కౌంటర్ ఆఫర్లు' }, desc: { en: 'AI analyzes market data to suggest fair counter-offer prices when buyers bid on your products', te: 'కొనుగోలుదారులు బిడ్ చేసినప్పుడు AI న్యాయమైన కౌంటర్ ఆఫర్ ధరలను సూచిస్తుంది' }, color: 'from-amber-500/20 to-amber-600/10' },
              { icon: Package, title: { en: 'AI Basket Builder', te: 'AI బాస్కెట్ బిల్డర్' }, desc: { en: 'Tell AI your budget and preferences — it builds a perfect basket of seasonal produce', te: 'మీ బడ్జెట్ చెప్పండి — AI సీజనల్ ఉత్పత్తుల పరిపూర్ణ బాస్కెట్ నిర్మిస్తుంది' }, color: 'from-emerald-500/20 to-emerald-600/10' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`bg-gradient-to-br ${f.color} backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group`}>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(f.title)}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{t(f.desc)}</p>
                </div>
              );
            })}
          </div>
          {!user && (
            <div className="text-center mt-10">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-800 font-semibold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t({ en: 'Try AI Features Free', te: 'AI ఫీచర్లను ఉచితంగా ప్రయత్నించండి' })}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">
            {t({ en: 'Why Grameen Reach?', te: 'గ్రామీణ రీచ్ ఎందుకు?' })}
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            {t({ en: 'Built for farmers and buyers in AP & Telangana with love and technology.', te: 'AP & తెలంగాణలోని రైతులు మరియు కొనుగోలుదారుల కోసం ప్రేమతో మరియు సాంకేతికతతో నిర్మించబడింది.' })}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className={`bg-white rounded-2xl p-6 border border-slate-200 card-hover group animate-slide-up`} style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'backwards' }}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t(f.title)}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t(f.desc)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              {t({ en: 'Farmer Success Stories', te: 'రైతుల విజయ గాథలు' })}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {t({ en: 'Real stories from farmers who transformed their business with Grameen Reach.', te: 'గ్రామీణ రీచ్‌తో తమ వ్యాపారాన్ని మార్చుకున్న రైతుల నిజమైన కథలు.' })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border border-slate-200 p-6 flex flex-col card-hover animate-slide-up`}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4 flex-1 italic">
                  &ldquo;{t(test.quote)}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center text-xl">
                    {test.crop}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t(test.name)}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t(test.district)}
                    </p>
                  </div>
                  {test.earnings && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-400">{t({ en: 'Earned', te: 'సంపాదన' })}</p>
                      <p className="text-sm font-bold text-emerald-600">{test.earnings}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-14">
            {t({ en: 'How It Works', te: 'ఇది ఎలా పని చేస్తుంది' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-emerald-200 to-primary-200"></div>
            {[
              { step: '1', title: { en: 'Browse & Discover', te: 'చూడండి' }, desc: { en: 'Explore 5000+ fresh produce listings from verified AP/TS farmers', te: 'ధృవీకరించిన రైతుల నుండి 5000+ తాజా ఉత్పత్తులు' }, emoji: '🔍', color: 'bg-primary-600' },
              { step: '2', title: { en: 'Bid or Buy', te: 'బిడ్ లేదా కొనండి' }, desc: { en: 'Fixed price, bid, or use AI Basket Builder for smart shopping', te: 'స్థిర ధర, బిడ్, లేదా AI బాస్కెట్ బిల్డర్ ఉపయోగించండి' }, emoji: '🛒', color: 'bg-emerald-600' },
              { step: '3', title: { en: 'Pay Securely', te: 'సురక్షితంగా చెల్లించండి' }, desc: { en: 'COD, UPI, or card — multiple payment options available', te: 'COD, UPI, లేదా కార్డ్ — బహుళ చెల్లింపు ఎంపికలు' }, emoji: '💳', color: 'bg-blue-600' },
              { step: '4', title: { en: 'Farm Fresh Delivery', te: 'తాజా డెలివరీ' }, desc: { en: 'Track your order — farm-fresh produce delivered to your doorstep', te: 'ఆర్డర్ ట్రాక్ చేయండి — తాజా ఉత్పత్తులు ఇంటికి డెలివరీ' }, emoji: '📦', color: 'bg-amber-600' },
            ].map((item, i) => (
              <div key={item.step} className={`text-center relative animate-slide-up`} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
                <div className="relative inline-block mb-4">
                  <div className={`w-20 h-20 rounded-2xl ${item.color} flex items-center justify-center text-3xl shadow-lg mx-auto relative z-10`}>
                    {item.emoji}
                  </div>
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${item.color} text-white font-bold text-sm flex items-center justify-center shadow-md z-20 ring-4 ring-white`}>
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t(item.title)}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t(item.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      {_hasHydrated && !user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-4">
              <Zap className="w-3 h-3" /> {t({ en: 'Quick Demo', te: 'త్వరిత డెమో' })}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {t({ en: 'Try It Out — No Sign Up Required', te: 'సైన్ అప్ లేకుండా ప్రయత్నించండి' })}
            </h2>
            <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
              {t({ en: 'Click any account below to instantly log in and explore all features', te: 'అన్ని ఫీచర్లను అన్వేషించడానికి క్రింద ఏదైనా ఖాతాపై క్లిక్ చేయండి' })}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {demoAccounts.map((a, i) => (
                <Link
                  key={a.email}
                  href={`/auth/login?email=${a.email}`}
                  className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl bg-white border-2 border-primary-200 text-sm font-medium text-slate-700 hover:border-primary-400 hover:shadow-lg transition-all duration-300 card-hover animate-slide-up`}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                >
                  <span className="text-3xl">{a.icon}</span>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-sm">{t(a.label)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.hint ? t(a.hint) : a.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Platform Highlights */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            {t({ en: 'Platform Highlights', te: 'ప్లాట్‌ఫారమ్ విశేషాలు' })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Ban, title: { en: 'Zero Commission', te: 'జీరో కమీషన్' }, desc: { en: 'No middlemen fees, ever', te: 'ఎప్పుడూ ఫీజులు లేవు' } },
              { icon: Clock, title: { en: 'Same-Day Fresh', te: 'అదే రోజు తాజా' }, desc: { en: 'Harvest-to-door freshness', te: 'కోత నుండి ఇంటికి తాజాదనం' } },
              { icon: BarChart3, title: { en: 'Govt Price Data', te: 'ప్రభుత్వ ధర డేటా' }, desc: { en: 'Real mandi prices for fair deals', te: 'న్యాయమైన మండి ధరలు' } },
              { icon: Globe, title: { en: 'Telugu + English', te: 'తెలుగు + ఆంగ్లం' }, desc: { en: 'Full bilingual support', te: 'పూర్తి ద్విభాషా మద్దతు' } },
            ].map((usp, i) => {
              const Icon = usp.icon;
              return (
                <div key={i} className="text-center flex flex-col items-center group">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{t(usp.title)}</h3>
                  <p className="text-sm text-white/70">{t(usp.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon on Mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-slate-50 to-primary-50 border border-slate-200 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center flex-shrink-0 animate-bounce-gentle">
            <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {t({ en: 'Coming Soon on Mobile', te: 'మొబైల్‌లో త్వరలో' })}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              {t({
                en: 'Native Android & iOS apps launching soon. Get notified when we launch!',
                te: 'Android & iOS యాప్‌లు త్వరలో. లాంచ్ అయినప్పుడు తెలియజేస్తాము!',
              })}
            </p>
          </div>
          <button
            onClick={() => toast.success(t({ en: 'We\'ll notify you when the app launches!', te: 'యాప్ లాంచ్ అయినప్పుడు తెలియజేస్తాము!' }))}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-primary flex-shrink-0"
          >
            <Bell className="w-4 h-4" />
            {t({ en: 'Notify Me', te: 'తెలియజేయండి' })}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Sprout className="w-6 h-6 text-primary-600" />
                <span className="font-bold text-lg text-slate-700">Grameen Reach</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                {t({ en: 'Empowering AP/TS farmers with direct market access, AI tools, and fair pricing. No middlemen, no commission.', te: 'AP/TS రైతులకు నేరుగా మార్కెట్ యాక్సెస్, AI సాధనాలు మరియు న్యాయమైన ధరలు. మధ్యవర్తులు లేరు, కమీషన్ లేదు.' })}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">{t({ en: 'Quick Links', te: 'త్వరిత లింక్‌లు' })}</h3>
              <div className="space-y-2">
                {[
                  { href: '/buyer/browse', label: { en: 'Browse Products', te: 'ఉత్పత్తులు' } },
                  { href: '/buyer/basket-builder', label: { en: 'AI Basket Builder', te: 'AI బాస్కెట్' } },
                  { href: '/auth/register?role=FARMER', label: { en: 'Become a Seller', te: 'విక్రేతగా మారండి' } },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {t(link.label)}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">{t({ en: 'Account', te: 'ఖాతా' })}</h3>
              <div className="space-y-2">
                {[
                  { href: '/auth/login', label: { en: 'Login', te: 'లాగిన్' } },
                  { href: '/auth/register', label: { en: 'Register', te: 'నమోదు' } },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {t(link.label)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-400">
              {t({ en: '2026 Grameen Reach. Built with love for AP/TS farmers.', te: '2026 గ్రామీణ రీచ్. AP/TS రైతుల కోసం ప్రేమతో నిర్మించబడింది.' })}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Leaf className="w-3 h-3 text-primary-500" />
              {t({ en: 'Zero Commission Platform', te: 'జీరో కమీషన్ ప్లాట్‌ఫారమ్' })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Sprout, bg: 'bg-green-50', color: 'text-green-600',
    title: { en: 'Farm Fresh & Direct', te: 'తాజా & నేరుగా' },
    desc: { en: 'Buy directly from verified farmers in AP & Telangana. No middlemen, maximum freshness.', te: 'AP & తెలంగాణలో ధృవీకరించిన రైతుల నుండి నేరుగా కొనండి. గరిష్ట తాజాదనం.' },
  },
  {
    icon: BarChart3, bg: 'bg-blue-50', color: 'text-blue-600',
    title: { en: 'Live Mandi Prices', te: 'ప్రత్యక్ష మండి ధరలు' },
    desc: { en: 'Real-time APMC market data ensures fair pricing for both farmers and buyers.', te: 'నిజ-సమయ APMC మార్కెట్ డేటా న్యాయమైన ధరలను నిర్ధారిస్తుంది.' },
  },
  {
    icon: Bot, bg: 'bg-purple-50', color: 'text-purple-600',
    title: { en: '5 AI-Powered Tools', te: '5 AI సాధనాలు' },
    desc: { en: 'Listing generator, price coach, counter-offer engine, basket builder, and moderation helper.', te: 'జాబితా జనరేటర్, ధర కోచ్, కౌంటర్-ఆఫర్ ఇంజిన్, బాస్కెట్ బిల్డర్, మోడరేషన్ హెల్పర్.' },
  },
  {
    icon: ShieldCheck, bg: 'bg-emerald-50', color: 'text-emerald-600',
    title: { en: 'Document Verified', te: 'పత్ర ధృవీకరణ' },
    desc: { en: 'Every farmer verified via Aadhaar, ration card, or land documents before they can sell.', te: 'ఆధార్, రేషన్ కార్డ్ లేదా భూమి పత్రాల ద్వారా ధృవీకరించబడతారు.' },
  },
  {
    icon: Gavel, bg: 'bg-amber-50', color: 'text-amber-600',
    title: { en: '3 Pricing Models', te: '3 ధర నమూనాలు' },
    desc: { en: 'Fixed price, auction bidding, or hybrid — flexible pricing that works for everyone.', te: 'స్థిర ధర, వేలం బిడ్డింగ్, లేదా హైబ్రిడ్ — అందరికీ అనువైన ధరలు.' },
  },
  {
    icon: Globe, bg: 'bg-orange-50', color: 'text-orange-600',
    title: { en: 'Telugu + English', te: 'తెలుగు + ఆంగ్లం' },
    desc: { en: 'Full bilingual support. Every label, listing, and AI response in both languages.', te: 'పూర్తి ద్విభాషా మద్దతు. ప్రతి లేబుల్, జాబితా, AI ప్రతిస్పందన రెండు భాషల్లో.' },
  },
  {
    icon: Package, bg: 'bg-rose-50', color: 'text-rose-600',
    title: { en: 'Multi-Farmer Cart', te: 'బహుళ-రైతు కార్ట్' },
    desc: { en: 'One order, multiple farmers. Auto-splits into sub-orders with per-farmer tracking.', te: 'ఒక ఆర్డర్, అనేక రైతులు. ఆటో-స్ప్లిట్ ఉప-ఆర్డర్లు.' },
  },
  {
    icon: Heart, bg: 'bg-pink-50', color: 'text-pink-600',
    title: { en: 'Wishlist & Favorites', te: 'విష్‌లిస్ట్ & ఇష్టం' },
    desc: { en: 'Save favorite products, track price changes, build your shopping list.', te: 'ఇష్టమైన ఉత్పత్తులను సేవ్ చేయండి, ధర మార్పులను ట్రాక్ చేయండి.' },
  },
  {
    icon: Award, bg: 'bg-indigo-50', color: 'text-indigo-600',
    title: { en: 'Quality Grading', te: 'నాణ్యత గ్రేడింగ్' },
    desc: { en: 'Every product graded A/B/C with organic certification. Know exactly what you\'re buying.', te: 'ప్రతి ఉత్పత్తి A/B/C గ్రేడ్ సేంద్రీయ సర్టిఫికేషన్. మీరు ఏమి కొంటున్నారో తెలుసుకోండి.' },
  },
];

const testimonials = [
  {
    name: { en: 'Ramesh Naidu', te: 'రమేష్ నాయుడు' },
    district: { en: 'Kurnool', te: 'కర్నూల్' },
    quote: { en: 'I sold my entire tomato harvest at 30% higher than mandi price! The AI price coach helped me time the market perfectly.', te: 'నేను నా మొత్తం టమాటా పంటను మండి ధర కంటే 30% ఎక్కువకు అమ్మాను! AI ధర కోచ్ మార్కెట్‌ను సరిగ్గా సమయానుకూలంగా సహాయపడింది.' },
    crop: '🍅',
    earnings: '₹1.2L',
  },
  {
    name: { en: 'Lakshmi Devi', te: 'లక్ష్మి దేవి' },
    district: { en: 'Guntur', te: 'గుంటూరు' },
    quote: { en: 'The AI listing generator saves me 2 hours daily. I just describe my chillies in Telugu and it creates beautiful listings!', te: 'AI జాబితా జనరేటర్ రోజూ 2 గంటలు ఆదా చేస్తుంది. నేను తెలుగులో వివరించగానే అందమైన జాబితాలు సృష్టిస్తుంది!' },
    crop: '🌶️',
    earnings: '₹85K',
  },
  {
    name: { en: 'Venkatesh Reddy', te: 'వెంకటేష్ రెడ్డి' },
    district: { en: 'Warangal', te: 'వరంగల్' },
    quote: { en: 'Zero commission means more money in my pocket. Direct buyers from Hyderabad contact me for bulk paddy orders now.', te: 'జీరో కమీషన్ అంటే నా జేబులో ఎక్కువ డబ్బు. హైదరాబాద్ నుండి నేరుగా కొనుగోలుదారులు బల్క్ ఆర్డర్లు కోసం సంప్రదిస్తారు.' },
    crop: '🌾',
    earnings: '₹2.1L',
  },
];

const demoAccounts = [
  { email: 'admin@grameen.com', label: { en: 'Admin', te: 'అడ్మిన్' }, icon: '🔑', hint: { en: 'Full platform access', te: 'పూర్తి ప్లాట్‌ఫారమ్ యాక్సెస్' } },
  { email: 'farmer1@grameen.com', label: { en: 'Verified Farmer', te: 'ధృవీకరించిన రైతు' }, icon: '🌾', hint: { en: 'AI tools + listings', te: 'AI సాధనాలు + జాబితాలు' } },
  { email: 'farmer2@grameen.com', label: { en: 'New Farmer', te: 'కొత్త రైతు' }, icon: '🌱', hint: { en: 'Pending verification', te: 'ధృవీకరణ పెండింగ్' } },
  { email: 'buyer1@grameen.com', label: { en: 'Buyer', te: 'కొనుగోలుదారు' }, icon: '🛒', hint: { en: 'Browse + order + bid', te: 'చూడండి + ఆర్డర్ + బిడ్' } },
];
