import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'BUYER' | 'FARMER' | 'ADMIN';
  phone?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
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
    {
      name: 'gr_auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
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

// ── Cart count store (lightweight, no persistence) ────────────────────────
interface CartCountState {
  count: number;
  setCount: (n: number) => void;
}

export const useCartCountStore = create<CartCountState>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
}));

// ── Wishlist store (localStorage persisted) ────────────────────────
interface WishlistState {
  items: string[]; // product IDs
  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (id) => set((s) => ({ items: s.items.includes(id) ? s.items : [...s.items, id] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i !== id) })),
      has: (id) => get().items.includes(id),
      clear: () => set({ items: [] }),
    }),
    { name: 'gr_wishlist' },
  ),
);
