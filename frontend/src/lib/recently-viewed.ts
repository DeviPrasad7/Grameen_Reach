const STORAGE_KEY = 'gr_recently_viewed';
const MAX_ITEMS = 20;

export function addRecentlyViewed(productId: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
    const updated = [productId, ...stored.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch { return []; }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function removeRecentlyViewed(productId: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.filter((id) => id !== productId)));
  } catch {}
}
