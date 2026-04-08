'use client';
import Link from 'next/link';
import { useLangStore } from '@/lib/store';

export default function HomePage() {
  const { t } = useLangStore();

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary-800 mb-4">
              Grameen Reach
            </h1>
            <p className="text-xl text-primary-600 mb-2 font-semibold">
              {t({ en: 'From Farm to Your Home, Directly', te: 'రైతు నుండి నేరుగా మీ ఇంటికి' })}
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
              {t({
                en: 'Direct farm-to-city marketplace for Andhra Pradesh & Telangana. Fresh produce from verified farmers — no middlemen, fair prices.',
                te: 'ఆంధ్రప్రదేశ్ & తెలంగాణ కోసం రైతు నుండి నేరుగా మార్కెట్‌ప్లేస్. ధృవీకరించిన రైతుల నుండి తాజా ఉత్పత్తులు — మధ్యవర్తులు లేరు, న్యాయమైన ధరలు.',
              })}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/buyer/browse"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg"
              >
                {t({ en: 'Shop Fresh Produce', te: 'తాజా ఉత్పత్తులు కొనండి' })}
              </Link>
              <Link
                href="/auth/register?role=FARMER"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-xl bg-saffron-500 text-white hover:bg-saffron-600 transition-colors shadow-lg"
              >
                {t({ en: 'Sell as Farmer', te: 'రైతుగా అమ్మండి' })}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
          {t({ en: 'Why Grameen Reach?', te: 'గ్రామీణ రీచ్ ఎందుకు?' })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-white shadow-md border border-primary-100">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(f.title)}</h3>
              <p className="text-gray-600 text-sm">{t(f.desc)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo login links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-primary-800 mb-2">
            {t({ en: 'Demo Accounts', te: 'డెమో ఖాతాలు' })}
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            {t({ en: 'Use these accounts to explore the platform', te: 'ప్లాట్‌ఫారమ్‌ను అన్వేషించడానికి ఈ ఖాతాలను ఉపయోగించండి' })}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {demoAccounts.map((a) => (
              <Link
                key={a.email}
                href={`/auth/login?email=${a.email}`}
                className="inline-block px-5 py-2 rounded-lg bg-white border border-primary-300 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
              >
                {a.icon} {t(a.label)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>{t({ en: 'Grameen Reach - Empowering AP/TS Farmers', te: 'గ్రామీణ రీచ్ - AP/TS రైతులకు సహాయం' })}</p>
        <p className="mt-1">
          <Link href="/auth/login" className="text-primary-600 hover:underline">
            {t({ en: 'Login', te: 'లాగిన్' })}
          </Link>
          {' · '}
          <Link href="/auth/register" className="text-primary-600 hover:underline">
            {t({ en: 'Register', te: 'నమోదు' })}
          </Link>
        </p>
      </footer>
    </main>
  );
}

const features = [
  { icon: '🥦', title: { en: 'Fresh & Direct', te: 'తాజా & నేరుగా' }, desc: { en: 'Buy directly from verified farmers in AP & TS. No middlemen, maximum freshness.', te: 'AP & TS లో ధృవీకరించిన రైతుల నుండి నేరుగా కొనండి. మధ్యవర్తులు లేరు, గరిష్ట తాజాదనం.' } },
  { icon: '💰', title: { en: 'Fair Prices', te: 'న్యాయమైన ధరలు' }, desc: { en: 'Real-time mandi price comparison ensures farmers earn fairly and buyers pay right.', te: 'నిజ-సమయ మండి ధర పోలిక రైతులకు న్యాయంగా సంపాదించడం, కొనుగోలుదారులు సరైన ధర చెల్లించడం నిర్ధారిస్తుంది.' } },
  { icon: '🤖', title: { en: 'AI-Powered', te: 'AI ఆధారిత' }, desc: { en: 'AI listing helper, price coach, and smart basket builder powered by Gemini.', te: 'AI జాబితా సహాయకుడు, ధర కోచ్ మరియు స్మార్ట్ బాస్కెట్ బిల్డర్ Gemini ద్వారా.' } },
  { icon: '✅', title: { en: 'Verified Farmers', te: 'ధృవీకరించిన రైతులు' }, desc: { en: 'Every seller is document-verified by our admin team before they can list products.', te: 'ప్రతి అమ్మకందారుడు ఉత్పత్తులను జాబితా చేయడానికి ముందు మా అడ్మిన్ బృందంచే ధృవీకరించబడతాడు.' } },
  { icon: '🌾', title: { en: 'Telugu & English', te: 'తెలుగు & ఆంగ్లం' }, desc: { en: 'Full Telugu language support so farmers feel at home using the platform.', te: 'రైతులు ప్లాట్‌ఫారమ్ ఉపయోగించడంలో సౌకర్యంగా ఉండేందుకు పూర్తి తెలుగు భాషా మద్దతు.' } },
  { icon: '📦', title: { en: 'Multi-Farmer Cart', te: 'బహుళ-రైతు కార్ట్' }, desc: { en: 'Buy from multiple farmers in one order. Transparent sub-orders per farmer.', te: 'ఒక ఆర్డర్‌లో అనేక రైతుల నుండి కొనండి. రైతుకు పారదర్శక ఉప-ఆర్డర్లు.' } },
];

const demoAccounts = [
  { email: 'admin@grameen.com',   label: { en: 'Admin', te: 'అడ్మిన్' },              icon: '🔑' },
  { email: 'farmer1@grameen.com', label: { en: 'Verified Farmer', te: 'ధృవీకరించిన రైతు' },  icon: '🌾' },
  { email: 'farmer2@grameen.com', label: { en: 'Unverified Farmer', te: 'ధృవీకరించని రైతు' }, icon: '🌱' },
  { email: 'buyer1@grameen.com',  label: { en: 'Buyer', te: 'కొనుగోలుదారు' },            icon: '🛒' },
];
