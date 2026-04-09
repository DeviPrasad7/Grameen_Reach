'use client';
import Link from 'next/link';
import { useAuthStore, useLangStore } from '@/lib/store';
import { Sprout, ShieldCheck, BarChart3, Bot, Globe, Package, TrendingUp, ArrowRight, Star, Heart, Bell, Gavel, Share2, Ban, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();

  // Context-aware CTAs based on login state
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
      : { href: '/buyer/cart', label: { en: 'View Cart', te: 'కార్ట్ చూడండి' } }
    : { href: '/auth/register?role=FARMER', label: { en: 'Sell as Farmer', te: 'రైతుగా అమ్మండి' } };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-emerald-50">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23166534\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
              <Sprout className="w-4 h-4" />
              {t({ en: 'AP & Telangana\'s Farmer Marketplace', te: 'AP & తెలంగాణ రైతు మార్కెట్‌ప్లేస్' })}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 animate-slide-up">
              <span className="gradient-text">{t({ en: 'From Farm to Home', te: 'రైతు నుండి ఇంటికి' })}</span>
              <br />
              <span className="text-slate-800">{t({ en: 'Directly.', te: 'నేరుగా.' })}</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed animate-slide-up">
              {t({
                en: 'Buy fresh produce directly from verified farmers in Andhra Pradesh & Telangana. No middlemen. Fair prices. AI-powered marketplace.',
                te: 'ఆంధ్రప్రదేశ్ & తెలంగాణలో ధృవీకరించిన రైతుల నుండి నేరుగా తాజా ఉత్పత్తులు కొనండి. మధ్యవర్తులు లేరు. న్యాయమైన ధరలు. AI ఆధారిత మార్కెట్‌ప్లేస్.',
              })}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
              <Link
                href={primaryCTA.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
              >
                {t(primaryCTA.label)}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={secondaryCTA.href}
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl bg-white text-slate-700 border-2 border-slate-200 hover:border-primary-300 hover:text-primary-700 transition-all shadow-sm"
              >
                {t(secondaryCTA.label)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '1,200+', label: { en: 'Verified Farmers', te: 'ధృవీకరించిన రైతులు' }, icon: ShieldCheck },
              { value: '5,000+', label: { en: 'Products Listed', te: 'జాబితా చేసిన ఉత్పత్తులు' }, icon: Package },
              { value: '26', label: { en: 'Districts Covered', te: 'జిల్లాలు' }, icon: Globe },
              { value: '₹2Cr+', label: { en: 'Farmer Earnings', te: 'రైతుల ఆదాయం' }, icon: TrendingUp },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.value} className="flex flex-col items-center">
                  <Icon className="w-5 h-5 text-primary-600 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-slate-800">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{t(s.label)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
          {t({ en: 'Popular Categories', te: 'ప్రముఖ వర్గాలు' })}
        </h2>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {[
            { name: { en: 'Vegetables', te: 'కూరగాయలు' }, emoji: '🥬', slug: 'Vegetables' },
            { name: { en: 'Fruits', te: 'పండ్లు' }, emoji: '🍎', slug: 'Fruits' },
            { name: { en: 'Grains', te: 'ధాన్యాలు' }, emoji: '🌾', slug: 'Grains' },
            { name: { en: 'Pulses', te: 'పప్పులు' }, emoji: '🫘', slug: 'Pulses' },
            { name: { en: 'Spices', te: 'మసాలాలు' }, emoji: '🌶️', slug: 'Spices' },
            { name: { en: 'Dairy', te: 'పాల ఉత్పత్తులు' }, emoji: '🥛', slug: 'Dairy' },
            { name: { en: 'Oils', te: 'నూనెలు' }, emoji: '🫒', slug: 'Oils' },
            { name: { en: 'Dry Fruits', te: 'డ్రై ఫ్రూట్స్' }, emoji: '🥜', slug: 'Dry Fruits' },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/buyer/browse?category=${encodeURIComponent(cat.slug)}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-2xl sm:text-3xl shadow-sm group-hover:border-primary-400 group-hover:shadow-md group-hover:scale-110 transition-all">
                {cat.emoji}
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-primary-700 transition-colors">
                {t(cat.name)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
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
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 card-hover group">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t(f.title)}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{t(f.desc)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Farmers Love Us */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              {t({ en: 'Why Farmers Love Us', te: 'రైతులు మమ్మల్ని ఎందుకు ఇష్టపడతారు' })}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {t({ en: 'Hear from farmers who transformed their selling experience with Grameen Reach.', te: 'గ్రామీణ రీచ్‌తో తమ అమ్మకపు అనుభవాన్ని మార్చుకున్న రైతుల మాటలు వినండి.' })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: { en: 'Ramesh', te: 'రమేష్' },
                district: { en: 'Kurnool', te: 'కర్నూల్' },
                quote: { en: 'I sold my tomatoes at 30% higher than mandi price!', te: 'నేను నా టమాటాలను మండి ధర కంటే 30% ఎక్కువకు అమ్మాను!' },
                crop: '🍅',
              },
              {
                name: { en: 'Lakshmi', te: 'లక్ష్మి' },
                district: { en: 'Guntur', te: 'గుంటూరు' },
                quote: { en: 'The AI listing generator saves me so much time', te: 'AI జాబితా జనరేటర్ నాకు చాలా సమయాన్ని ఆదా చేస్తుంది' },
                crop: '🌶️',
              },
              {
                name: { en: 'Venkatesh', te: 'వెంకటేష్' },
                district: { en: 'Warangal', te: 'వరంగల్' },
                quote: { en: 'Direct buyers mean no commission to middlemen', te: 'నేరుగా కొనుగోలుదారులు అంటే మధ్యవర్తులకు కమీషన్ లేదు' },
                crop: '🌾',
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col card-hover"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4 flex-1 italic">
                  &ldquo;{t(testimonial.quote)}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-xl">
                    {testimonial.crop}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t(testimonial.name)}</p>
                    <p className="text-xs text-slate-400">{t(testimonial.district)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-14">
            {t({ en: 'How It Works', te: 'ఇది ఎలా పని చేస్తుంది' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: { en: 'Browse & Select', te: 'చూడండి & ఎంచుకోండి' }, desc: { en: 'Explore fresh produce from verified farmers. Filter by category, location, and price.', te: 'ధృవీకరించిన రైతుల నుండి తాజా ఉత్పత్తులను అన్వేషించండి. వర్గం, ప్రాంతం మరియు ధర ద్వారా ఫిల్టర్ చేయండి.' }, emoji: '🛒' },
              { step: '2', title: { en: 'Order & Pay', te: 'ఆర్డర్ & చెల్లించు' }, desc: { en: 'Add to cart, choose delivery address, and pay via COD or card. Bid on auction items.', te: 'కార్ట్‌కు జోడించండి, డెలివరీ చిరునామా ఎంచుకోండి, COD లేదా కార్డ్ ద్వారా చెల్లించండి.' }, emoji: '💳' },
              { step: '3', title: { en: 'Fresh Delivery', te: 'తాజా డెలివరీ' }, desc: { en: 'Track your order in real-time. Fresh produce delivered from farm to your doorstep.', te: 'మీ ఆర్డర్‌ను నిజ-సమయంలో ట్రాక్ చేయండి. రైతు నుండి మీ ఇంటి వాకిలి వరకు తాజా ఉత్పత్తులు.' }, emoji: '📦' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm mb-3">
                  {item.step}
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
          <div className="bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-200 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-4">
              <Star className="w-3 h-3" /> {t({ en: 'Try the Demo', te: 'డెమో ప్రయత్నించండి' })}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {t({ en: 'Explore with Demo Accounts', te: 'డెమో ఖాతాలతో అన్వేషించండి' })}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {t({ en: 'Click any account below to auto-fill login credentials', te: 'లాగిన్ ఆధారాలను ఆటో-ఫిల్ చేయడానికి క్రింద ఏదైనా ఖాతాపై క్లిక్ చేయండి' })}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {demoAccounts.map((a) => (
                <Link
                  key={a.email}
                  href={`/auth/login?email=${a.email}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-primary-200 text-sm font-medium text-slate-700 hover:border-primary-400 hover:shadow-md transition-all card-hover"
                >
                  <span className="text-lg">{a.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{t(a.label)}</p>
                    <p className="text-[10px] text-slate-400">{a.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Platform Highlights / USP Banner */}
      <section className="bg-gradient-to-br from-primary-700 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            {t({ en: 'Platform Highlights', te: 'ప్లాట్‌ఫారమ్ విశేషాలు' })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Ban,
                title: { en: 'Zero Commission', te: 'జీరో కమీషన్' },
                desc: { en: 'No middlemen fees, ever', te: 'ఎప్పుడూ మధ్యవర్తి ఫీజులు లేవు' },
              },
              {
                icon: Bot,
                title: { en: 'AI-Powered', te: 'AI ఆధారిత' },
                desc: { en: 'Smart pricing, listings & recommendations', te: 'స్మార్ట్ ధరలు, జాబితాలు & సిఫార్సులు' },
              },
              {
                icon: BarChart3,
                title: { en: 'Govt Price Data', te: 'ప్రభుత్వ ధర డేటా' },
                desc: { en: 'Real mandi prices for fair deals', te: 'న్యాయమైన ఒప్పందాల కోసం నిజమైన మండి ధరలు' },
              },
              {
                icon: Globe,
                title: { en: 'Bilingual', te: 'ద్విభాషా' },
                desc: { en: 'Full Telugu & English support', te: 'పూర్తి తెలుగు & ఆంగ్ల మద్దతు' },
              },
            ].map((usp, i) => {
              const Icon = usp.icon;
              return (
                <div key={i} className="text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{t(usp.title)}</h3>
                  <p className="text-sm text-white/80">{t(usp.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon on Mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-slate-50 to-primary-50 border border-slate-200 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {t({ en: 'Coming Soon on Mobile', te: 'మొబైల్‌లో త్వరలో' })}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              {t({
                en: 'We are building native Android & iOS apps so you can buy and sell fresh produce on the go. Get notified when we launch!',
                te: 'మీరు ప్రయాణంలో తాజా ఉత్పత్తులను కొనుగోలు చేయడానికి మరియు అమ్మడానికి మేము స్థానిక Android & iOS యాప్‌లను నిర్మిస్తున్నాము. మేము లాంచ్ చేసినప్పుడు తెలియజేయండి!',
              })}
            </p>
          </div>
          <button
            onClick={() => toast.success(t({ en: 'We\'ll notify you when the app launches!', te: 'యాప్ లాంచ్ అయినప్పుడు మేము మీకు తెలియజేస్తాము!' }))}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 flex-shrink-0"
          >
            <Bell className="w-4 h-4" />
            {t({ en: 'Get Notified', te: 'తెలియజేయండి' })}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-primary-600" />
              <span className="font-bold text-slate-700">Grameen Reach</span>
              <span className="text-slate-400 text-sm">
                — {t({ en: 'Empowering AP/TS Farmers', te: 'AP/TS రైతులకు సాధికారత' })}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/auth/login" className="text-slate-500 hover:text-primary-600 transition-colors">
                {t({ en: 'Login', te: 'లాగిన్' })}
              </Link>
              <Link href="/auth/register" className="text-slate-500 hover:text-primary-600 transition-colors">
                {t({ en: 'Register', te: 'నమోదు' })}
              </Link>
              <Link href="/buyer/browse" className="text-slate-500 hover:text-primary-600 transition-colors">
                {t({ en: 'Browse', te: 'చూడండి' })}
              </Link>
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
    desc: { en: 'Buy directly from verified farmers in AP & Telangana. No middlemen, maximum freshness, transparent sourcing.', te: 'AP & తెలంగాణలో ధృవీకరించిన రైతుల నుండి నేరుగా కొనండి. మధ్యవర్తులు లేరు, గరిష్ట తాజాదనం.' },
  },
  {
    icon: BarChart3, bg: 'bg-blue-50', color: 'text-blue-600',
    title: { en: 'Fair Mandi Prices', te: 'న్యాయమైన మండి ధరలు' },
    desc: { en: 'Real-time government mandi price data ensures farmers earn fair value and buyers pay the right price.', te: 'నిజ-సమయ ప్రభుత్వ మండి ధర డేటా రైతులకు న్యాయమైన విలువ మరియు కొనుగోలుదారులకు సరైన ధర నిర్ధారిస్తుంది.' },
  },
  {
    icon: Bot, bg: 'bg-purple-50', color: 'text-purple-600',
    title: { en: 'AI-Powered Tools', te: 'AI ఆధారిత పరికరాలు' },
    desc: { en: 'AI listing generator, smart price coach, counter-offer assistant, and basket builder powered by Gemini.', te: 'AI జాబితా జనరేటర్, స్మార్ట్ ప్రైస్ కోచ్, కౌంటర్-ఆఫర్ అసిస్టెంట్ మరియు బాస్కెట్ బిల్డర్.' },
  },
  {
    icon: ShieldCheck, bg: 'bg-emerald-50', color: 'text-emerald-600',
    title: { en: 'Verified Sellers', te: 'ధృవీకరించిన విక్రేతలు' },
    desc: { en: 'Every farmer is document-verified by our admin team before they can list products for sale.', te: 'ప్రతి రైతు ఉత్పత్తులను అమ్మడానికి ముందు మా అడ్మిన్ బృందంచే పత్రాల ద్వారా ధృవీకరించబడతారు.' },
  },
  {
    icon: Globe, bg: 'bg-orange-50', color: 'text-orange-600',
    title: { en: 'Telugu & English', te: 'తెలుగు & ఆంగ్లం' },
    desc: { en: 'Full bilingual support in Telugu and English so every farmer and buyer feels at home.', te: 'ప్రతి రైతు మరియు కొనుగోలుదారు సౌకర్యంగా ఉండేందుకు తెలుగు మరియు ఆంగ్లంలో పూర్తి ద్విభాషా మద్దతు.' },
  },
  {
    icon: Package, bg: 'bg-rose-50', color: 'text-rose-600',
    title: { en: 'Multi-Farmer Cart', te: 'బహుళ-రైతు కార్ట్' },
    desc: { en: 'Buy from multiple farmers in one order with transparent sub-orders, delivery tracking, and fair pricing.', te: 'ఒక ఆర్డర్‌లో అనేక రైతుల నుండి కొనండి. పారదర్శక ఉప-ఆర్డర్లు, డెలివరీ ట్రాకింగ్.' },
  },
  {
    icon: Gavel, bg: 'bg-amber-50', color: 'text-amber-600',
    title: { en: 'Bidding System', te: 'బిడ్డింగ్ వ్యవస్థ' },
    desc: { en: 'Place bids on produce, get counter-offers, and negotiate fair prices directly with farmers.', te: 'ఉత్పత్తులపై బిడ్లు పెట్టండి, కౌంటర్-ఆఫర్లు పొందండి, రైతులతో నేరుగా న్యాయమైన ధరలు చర్చించండి.' },
  },
  {
    icon: Heart, bg: 'bg-pink-50', color: 'text-pink-600',
    title: { en: 'Wishlist & Favorites', te: 'విష్‌లిస్ట్ & ఇష్టమైనవి' },
    desc: { en: 'Save your favorite products for later. Build your perfect shopping list with the wishlist feature.', te: 'మీ ఇష్టమైన ఉత్పత్తులను తర్వాత కోసం సేవ్ చేయండి. విష్‌లిస్ట్ ఫీచర్‌తో మీ ఖచ్చితమైన షాపింగ్ జాబితాను రూపొందించండి.' },
  },
  {
    icon: Bell, bg: 'bg-indigo-50', color: 'text-indigo-600',
    title: { en: 'Real-time Updates', te: 'నిజ-సమయ అప్‌డేట్‌లు' },
    desc: { en: 'Get instant notifications on orders, bids, and deliveries. Never miss an update on your transactions.', te: 'ఆర్డర్లు, బిడ్లు మరియు డెలివరీలపై తక్షణ నోటిఫికేషన్లు పొందండి.' },
  },
];

const demoAccounts = [
  { email: 'admin@grameen.com', label: { en: 'Admin', te: 'అడ్మిన్' }, icon: '🔑' },
  { email: 'farmer1@grameen.com', label: { en: 'Verified Farmer', te: 'ధృవీకరించిన రైతు' }, icon: '🌾' },
  { email: 'farmer2@grameen.com', label: { en: 'New Farmer', te: 'కొత్త రైతు' }, icon: '🌱' },
  { email: 'buyer1@grameen.com', label: { en: 'Buyer', te: 'కొనుగోలుదారు' }, icon: '🛒' },
];
