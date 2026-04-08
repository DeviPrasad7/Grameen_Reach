'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const { t } = useLangStore();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: searchParams?.get('role') || 'BUYER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.accessToken, res.data.user);
      if (res.data.user.role === 'FARMER') router.push('/farmer/dashboard');
      else router.push('/buyer/browse');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t({ en: 'Registration failed.', te: 'నమోదు విఫలమైంది.' }));
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="text-4xl">🌾</Link>
        <h1 className="text-2xl font-bold text-primary-800 mt-2">{t({ en: 'Create Account', te: 'ఖాతా సృష్టించు' })}</h1>
        <p className="text-gray-500 text-sm mt-1">{t({ en: 'Join Grameen Reach', te: 'గ్రామీణ రీచ్‌లో చేరండి' })}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-primary-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'I am a', te: 'నేను' })}</label>
            <div className="flex gap-3">
              {['BUYER', 'FARMER'].map((r) => (
                <button key={r} type="button" onClick={() => set('role', r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.role === r ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
                  {r === 'BUYER' ? t({ en: 'Buyer', te: 'కొనుగోలుదారు' }) : t({ en: 'Farmer', te: 'రైతు' })}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Full Name', te: 'పూర్తి పేరు' })}</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder={t({ en: 'Your full name', te: 'మీ పూర్తి పేరు' })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Email', te: 'ఇమెయిల్' })}</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Phone (optional)', te: 'ఫోన్ (ఐచ్ఛికం)' })}</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder="9XXXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Password', te: 'పాస్‌వర్డ్' })}</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder={t({ en: 'Min 6 characters', te: 'కనీసం 6 అక్షరాలు' })} />
          </div>

          {form.role === 'FARMER' && (
            <div className="bg-saffron-50 border border-saffron-200 rounded-lg p-3 text-xs text-saffron-700">
              <strong>{t({ en: 'Farmer Note:', te: 'రైతు గమనిక:' })}</strong> {t({ en: 'After registering you will be at Level 0 (can browse & buy). To sell products, complete your farmer profile and upload verification documents for admin approval.', te: 'నమోదు తర్వాత మీరు స్థాయి 0లో ఉంటారు (చూడవచ్చు & కొనవచ్చు). ఉత్పత్తులను అమ్మడానికి, మీ రైతు ప్రొఫైల్‌ను పూర్తి చేయండి మరియు అడ్మిన్ ఆమోదం కోసం ధృవీకరణ పత్రాలను అప్‌లోడ్ చేయండి.' })}
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {loading ? t({ en: 'Creating account...', te: 'ఖాతా సృష్టిస్తోంది...' }) : t({ en: 'Create Account', te: 'ఖాతా సృష్టించు' })}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          {t({ en: 'Already have an account?', te: 'ఇప్పటికే ఖాతా ఉందా?' })}{' '}
          <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
            {t({ en: 'Sign in', te: 'సైన్ ఇన్' })}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
