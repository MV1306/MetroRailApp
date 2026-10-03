export function toTitleCase(str: string): string {
  if (!str) return str;
  const lower = str.toLowerCase();
  // words to keep lowercase unless first word
  const minors = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return lower.split(' ').map((word, i) => {
    if (!word) return word;
    if (i > 0 && minors.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export interface RecentSearch {
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  timestamp: number;
}

const RECENT_KEY = 'cmrl_recent_searches';
const MAX_RECENT = 5;

export function getRecentSearches(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch { return []; }
}

export function saveRecentSearch(search: Omit<RecentSearch, 'timestamp'>) {
  const existing = getRecentSearches().filter(
    r => !(r.fromId === search.fromId && r.toId === search.toId)
  );
  const updated = [{ ...search, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}
