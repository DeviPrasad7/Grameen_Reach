'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, user } = useAuthStore();
  const { t } = useLangStore();

  const [email, setEmail] = useState(searchParams?.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) redirectByRole(user.role);
  }, [user]);

  const redirectByRole = (role: string) => {
    if (role === 'ADMIN') router.push('/admin/farmers');
    else if (role === 'FARMER') router.push('/farmer/dashboard');
    else router.push('/buyer/browse');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.accessToken, res.data.user);
      redirectByRole(res.data.user.role);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t({ en: 'Login failed. Please check your credentials.', te: 'లాగిన్ విఫలమైంది. దయచేసి మీ ఆధారాలను తనిఖీ చేయండి.' }));
    } finally { setLoading(false); }
  };

  const fillDemo = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="text-4xl">🌾</Link>
        <h1 className="text-2xl font-bold text-primary-800 mt-2">Grameen Reach</h1>
        <p className="text-gray-500 text-sm mt-1">{t({ en: 'Sign in to your account', te: 'మీ ఖాతాలో సైన్ ఇన్ చేయండి' })}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-primary-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Email', te: 'ఇమెయిల్' })}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Password', te: 'పాస్‌వర్డ్' })}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              placeholder="••••••••" />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {loading ? t({ en: 'Signing in...', te: 'సైన్ ఇన్ అవుతోంది...' }) : t({ en: 'Sign In', te: 'సైన్ ఇన్' })}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          {t({ en: "Don't have an account?", te: 'ఖాతా లేదా?' })}{' '}
          <Link href="/auth/register" className="text-primary-600 font-medium hover:underline">
            {t({ en: 'Register', te: 'నమోదు' })}
          </Link>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 text-center mb-3">{t({ en: 'Quick demo login', te: 'త్వరిత డెమో లాగిన్' })}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: { en: '🔑 Admin', te: '🔑 అడ్మిన్' }, e: 'admin@grameen.com', p: 'Admin@123' },
              { label: { en: '🌾 Farmer (Verified)', te: '🌾 రైతు (ధృవీకరించిన)' }, e: 'farmer1@grameen.com', p: 'Farmer@123' },
              { label: { en: '🌱 Farmer (Pending)', te: '🌱 రైతు (పెండింగ్)' }, e: 'farmer2@grameen.com', p: 'Farmer@123' },
              { label: { en: '🛒 Buyer', te: '🛒 కొనుగోలుదారు' }, e: 'buyer1@grameen.com', p: 'Buyer@123' },
            ].map((d) => (
              <button key={d.e} type="button" onClick={() => fillDemo(d.e, d.p)}
                className="text-xs px-2 py-1.5 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50 text-left">
                {t(d.label)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
