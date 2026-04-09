'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Sprout, Mail, Lock, LogIn, KeyRound, Loader2, ShieldCheck, Wheat, ShoppingCart } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();

  const [email, setEmail] = useState(searchParams?.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && user) {
      redirectByRole(user.role);
    }
  }, [_hasHydrated, user]);

  const redirectByRole = (role: string) => {
    if (role === 'ADMIN') router.push('/admin/farmers');
    else if (role === 'FARMER') router.push('/farmer/dashboard');
    else router.push('/buyer/browse');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.accessToken, res.data.user);
      toast.success(
        t({ en: 'Welcome back!', te: 'తిరిగి స్వాగతం!' })
      );
      redirectByRole(res.data.user.role);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(
        msg || t({ en: 'Login failed. Please check your credentials.', te: 'లాగిన్ విఫలమైంది. దయచేసి మీ ఆధారాలను తనిఖీ చేయండి.' })
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    toast.success(t({ en: 'Demo credentials filled', te: 'డెమో ఆధారాలు నింపబడ్డాయి' }));
  };

  const demoAccounts = [
    {
      label: { en: 'Admin', te: 'అడ్మిన్' },
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      email: 'admin@grameen.com',
      password: 'Admin@123',
    },
    {
      label: { en: 'Farmer (Verified)', te: 'రైతు (ధృవీకరించిన)' },
      icon: <Wheat className="w-3.5 h-3.5" />,
      email: 'farmer1@grameen.com',
      password: 'Farmer@123',
    },
    {
      label: { en: 'Farmer (Pending)', te: 'రైతు (పెండింగ్)' },
      icon: <Sprout className="w-3.5 h-3.5" />,
      email: 'farmer2@grameen.com',
      password: 'Farmer@123',
    },
    {
      label: { en: 'Buyer', te: 'కొనుగోలుదారు' },
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      email: 'buyer1@grameen.com',
      password: 'Buyer@123',
    },
  ];

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo & Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 mb-4 hover:bg-primary-200 transition-colors">
          <Sprout className="w-7 h-7" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Grameen Reach</h1>
        <p className="text-slate-500 text-sm mt-1">
          {t({ en: 'Sign in to your account', te: 'మీ ఖాతాలో సైన్ ఇన్ చేయండి' })}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 border border-slate-100 animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t({ en: 'Email', te: 'ఇమెయిల్' })}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm bg-slate-50 transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t({ en: 'Password', te: 'పాస్\u200Cవర్డ్' })}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm bg-slate-50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md shadow-primary-600/20 hover:shadow-primary-600/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t({ en: 'Signing in...', te: 'సైన్ ఇన్ అవుతోంది...' })}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {t({ en: 'Sign In', te: 'సైన్ ఇన్' })}
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-5 text-center text-sm text-slate-500">
          {t({ en: "Don't have an account?", te: 'ఖాతా లేదా?' })}{' '}
          <Link href="/auth/register" className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors">
            {t({ en: 'Register', te: 'నమోదు' })}
          </Link>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 justify-center mb-3">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              {t({ en: 'Quick demo login', te: 'త్వరిత డెమో లాగిన్' })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => fillDemo(d.email, d.password)}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all text-left"
              >
                <span className="text-primary-500">{d.icon}</span>
                <span className="font-medium">{t(d.label)}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
