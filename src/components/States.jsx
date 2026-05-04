import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 18, className = '' }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);

export const FullPageSpinner = ({ label = 'Loading…' }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-ink-400 dark:text-ink-500">
    <Spinner size={28} />
    <span className="text-sm">{label}</span>
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div
    className={`bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 dark:from-ink-800 dark:via-ink-700 dark:to-ink-800 bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`}
  />
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12 px-6">
    {Icon && (
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 mb-4">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    )}
    <h3 className="font-display text-xl text-ink-900 dark:text-ink-50 mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
        {description}
      </p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
