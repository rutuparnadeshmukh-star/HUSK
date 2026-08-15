export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('husk_theme', theme);
}

export function getInitialTheme() {
  const saved = localStorage.getItem('husk_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Health', 'Travel', 'Education', 'Other'];

export const PRODUCT_CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Books'];

export const CATEGORY_COLORS = {
  'Food': '#f97316',
  'Transport': '#3b82f6',
  'Shopping': '#8b5cf6',
  'Bills & Utilities': '#06b6d4',
  'Entertainment': '#ec4899',
  'Health': '#10b981',
  'Travel': '#eab308',
  'Education': '#6366f1',
  'Other': '#64748b'
};
