import { motion } from 'framer-motion';

const StatCard = ({
  label,
  value,
  delta,
  icon: Icon,
  accent = 'default',
  index = 0,
}) => {
  const accents = {
    default: 'text-ink-900 dark:text-ink-50',
    accent: 'text-accent-600 dark:text-accent-400',
    sage: 'text-sage-600 dark:text-sage-400',
    rose: 'text-rose-500',
  };
  const iconBg = {
    default: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
    accent: 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300',
    sage: 'bg-sage-100 text-sage-700 dark:bg-sage-500/20 dark:text-sage-300',
    rose: 'bg-rose-500/10 text-rose-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="card p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400 font-medium">
          {label}
        </span>
        {Icon && (
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${iconBg[accent]}`}
          >
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className={`font-display text-2xl sm:text-3xl ${accents[accent]} tabular-nums`}>
        {value}
      </div>
      {delta !== undefined && delta !== null && (
        <div
          className={`text-xs mt-1.5 font-medium ${
            delta > 0
              ? 'text-rose-500'
              : delta < 0
                ? 'text-sage-600 dark:text-sage-400'
                : 'text-ink-400'
          }`}
        >
          {delta > 0 ? '↑' : delta < 0 ? '↓' : '·'} {Math.abs(delta).toFixed(0)}% vs last month
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
