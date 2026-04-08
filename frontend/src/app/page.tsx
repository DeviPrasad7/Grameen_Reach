import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <span className="text-6xl">🌾</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-primary-800 mb-4">
              Grameen Reach
            </h1>
            <p className="text-xl text-primary-600 mb-2 font-semibold">
              గ్రామీణ రీచ్ – రైతు నుండి నేరుగా మీ ఇంటికి
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
              Direct farm-to-city marketplace for Andhra Pradesh &amp; Telangana.
              Fresh produce from verified farmers — no middlemen, fair prices.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/buyer/browse"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg"
              >
                🛒 Shop Fresh Produce
              </Link>
              <Link
                href="/auth/register?role=FARMER"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-xl bg-saffron-500 text-white hover:bg-saffron-600 transition-colors shadow-lg"
              >
                🌿 Sell as Farmer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
          Why Grameen Reach?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center p-6 rounded-2xl bg-white shadow-md border border-primary-100">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo login links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-primary-800 mb-2">Demo Accounts</h2>
          <p className="text-gray-600 mb-6 text-sm">Use these accounts to explore the platform</p>
          <div className="flex flex-wrap justify-center gap-3">
            {demoAccounts.map((a) => (
              <Link
                key={a.email}
                href={`/auth/login?email=${a.email}`}
                className="inline-block px-5 py-2 rounded-lg bg-white border border-primary-300 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
              >
                {a.icon} {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>Grameen Reach © 2026 — Empowering AP/TS Farmers</p>
        <p className="mt-1">
          <Link href="/api/docs" className="text-primary-600 hover:underline" target="_blank">
            API Docs (Swagger)
          </Link>
          {' · '}
          <Link href="/auth/login" className="text-primary-600 hover:underline">Login</Link>
          {' · '}
          <Link href="/auth/register" className="text-primary-600 hover:underline">Register</Link>
        </p>
      </footer>
    </main>
  );
}

const features = [
  { icon: '🥦', title: 'Fresh & Direct', desc: 'Buy directly from verified farmers in AP & TS. No middlemen, maximum freshness.' },
  { icon: '💰', title: 'Fair Prices', desc: 'Real-time mandi price comparison ensures farmers earn fairly and buyers pay right.' },
  { icon: '🤖', title: 'AI-Powered', desc: 'AI listing helper, price coach, and smart basket builder powered by Gemini & Groq.' },
  { icon: '✅', title: 'Verified Farmers', desc: 'Every seller is document-verified by our admin team before they can list products.' },
  { icon: '🌾', title: 'Telugu & English', desc: 'Full Telugu language support so farmers feel at home using the platform.' },
  { icon: '📦', title: 'Multi-Farmer Cart', desc: 'Buy from multiple farmers in one order. Transparent sub-orders per farmer.' },
];

const demoAccounts = [
  { email: 'admin@grameen.com',   label: 'Admin',            icon: '🔑' },
  { email: 'farmer1@grameen.com', label: 'Verified Farmer',  icon: '🌾' },
  { email: 'farmer2@grameen.com', label: 'Unverified Farmer',icon: '🌱' },
  { email: 'buyer1@grameen.com',  label: 'Buyer',            icon: '🛒' },
];
