// Currency formatting
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrency = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '$0.00';
  return currencyFormatter.format(Number(n));
};

export const formatCompact = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '$0';
  return compactFormatter.format(Number(n));
};

// Dates
const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

export const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (!isValidDate(d)) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (!isValidDate(d)) return '';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (!isValidDate(d)) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(d);
};

// Convert Firestore Timestamp / Date / string to a Date safely
export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isValidDate(d) ? d : null;
  }
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return isValidDate(d) ? d : null;
  }
  if (value?.seconds) {
    const d = new Date(value.seconds * 1000);
    return isValidDate(d) ? d : null;
  }
  const d = new Date(value);
  return isValidDate(d) ? d : null;
};

// Format a Date to YYYY-MM-DD for <input type="date">
export const toInputDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (!isValidDate(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Year-month key e.g. "2026-05"
export const toMonthKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (!isValidDate(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthKeyLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// Start/end of period helpers
export const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
};

export const startOfMonth = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const startOfYear = (date = new Date()) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
};

// initials for avatar
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
};
