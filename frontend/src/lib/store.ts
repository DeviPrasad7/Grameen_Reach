import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'BUYER' | 'FARMER' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('gr_token', token);
        }
        set({ token, user });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gr_token');
        }
        set({ token: null, user: null });
      },
      isLoggedIn: () => !!get().token,
    }),
    { name: 'gr_auth' },
  ),
);

// Sync token on module load (handles page refresh)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('gr_auth');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      if (token) {
        localStorage.setItem('gr_token', token);
      }
    } catch {}
  }
}

// ── Language store ─────────────────────────────────────────────────────────
type Lang = 'en' | 'te';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (obj: { en: string; te: string }) => string;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === 'en' ? 'te' : 'en' }),
      t: (obj) => obj[get().lang],
    }),
    { name: 'gr_lang' },
  ),
);
