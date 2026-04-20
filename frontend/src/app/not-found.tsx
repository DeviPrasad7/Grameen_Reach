import Link from 'next/link';
import { Sprout, Home, Store } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <Sprout className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <p className="text-5xl font-bold text-slate-800 mb-1">404</p>
        <p className="text-sm text-slate-500 mb-6">Page not found</p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link
            href="/buyer/browse"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <Store className="w-4 h-4" /> Browse
          </Link>
        </div>
      </div>
    </div>
  );
}
