'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Sprout, ShoppingCart, Mail, Lock, User, Phone, Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const { t } = useLangStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: searchParams?.get('role') || 'BUYER',
  });
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.data.accessToken, res.data.user);
      toast.success(
        t({ en: 'Account created successfully!', te: 'ఖాతా విజయవంతంగా సృష్టించబడింది!' })
      );
      if (res.data.user.role === 'FARMER') router.push('/farmer/dashboard');
      else router.push('/buyer/browse');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || t({ en: 'Registration failed.', te: 'నమోదు విఫలమైంది.' })
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'BUYER',
      label: { en: 'Buyer', te: 'కొనుగోలుదారు' },
      desc: { en: 'Browse & buy fresh produce', te: 'తాజా ఉత్పత్తులు చూడండి & కొనండి' },
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      value: 'FARMER',
      label: { en: 'Farmer', te: 'రైతు' },
      desc: { en: 'Sell your farm produce', te: 'మీ రైతు ఉత్పత్తులు అమ్మండి' },
      icon: <Sprout className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Logo & Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 mb-4 hover:bg-primary-200 transition-colors">
          <Sprout className="w-7 h-7" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">
          {t({ en: 'Create Account', te: 'ఖాతా సృష్టించు' })}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t({ en: 'Join Grameen Reach', te: 'గ్రామీణ రీచ్\u200Cలో చేరండి' })}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 border border-slate-100 animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t({ en: 'I am a', te: 'నేను' })}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('role', r.value)}
                  className={`relative flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.role === r.value
                      ? 'bg-primary-50 text-primary-700 border-primary-500 shadow-sm shadow-primary-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className={form.role === r.value ? 'text-primary-600' : 'text-slate-400'}>
                    {r.icon}
                  </span>
                  <span>{t(r.label)}</span>
                  <span className={`text-[10px] font-normal ${form.role === r.value ? 'text-primary-500' : 'text-slate-400'}`}>
                    {t(r.desc)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t({ en: 'Full Name', te: 'పూర్తి పేరు' })}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm bg-slate-50 transition-colors"
                placeholder={t({ en: 'Your full name', te: 'మీ పూర్తి పేరు' })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t({ en: 'Email', te: 'ఇమెయిల్' })}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm bg-slate-50 transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t({ en: 'Phone (optional)', te: 'ఫోన్ (ఐచ్ఛికం)' })}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm bg-slate-50 transition-colors"
                placeholder="9XXXXXXXXX"
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
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm bg-slate-50 transition-colors"
                placeholder={t({ en: 'Min 6 characters', te: 'కనీసం 6 అక్షరాలు' })}
              />
            </div>
          </div>

          {/* Farmer Note */}
          {form.role === 'FARMER' && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 leading-relaxed">
                <strong className="font-semibold">{t({ en: 'Farmer Note:', te: 'రైతు గమనిక:' })}</strong>{' '}
                {t({
                  en: 'After registering you will be at Level 0 (can browse & buy). To sell products, complete your farmer profile and upload verification documents for admin approval.',
                  te: 'నమోదు తర్వాత మీరు స్థాయి 0లో ఉంటారు (చూడవచ్చు & కొనవచ్చు). ఉత్పత్తులను అమ్మడానికి, మీ రైతు ప్రొఫైల్\u200Cను పూర్తి చేయండి మరియు అడ్మిన్ ఆమోదం కోసం ధృవీకరణ పత్రాలను అప్\u200Cలోడ్ చేయండి.',
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md shadow-primary-600/20 hover:shadow-primary-600/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t({ en: 'Creating account...', te: 'ఖాతా సృష్టిస్తోంది...' })}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {t({ en: 'Create Account', te: 'ఖాతా సృష్టించు' })}
              </>
            )}
          </button>
        </form>

        {/* Sign in link */}
        <div className="mt-5 text-center text-sm text-slate-500">
          {t({ en: 'Already have an account?', te: 'ఇప్పటికే ఖాతా ఉందా?' })}{' '}
          <Link href="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors">
            {t({ en: 'Sign in', te: 'సైన్ ఇన్' })}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
        <RegisterForm />
      </Suspense>
    </div>
  );
}
