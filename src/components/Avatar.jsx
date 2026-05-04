import { getInitials } from '../utils/format';

// Simple deterministic color from name
const colorFromName = (name = '') => {
  const colors = [
    'bg-sage-200 text-sage-800',
    'bg-accent-200 text-accent-800',
    'bg-ink-200 text-ink-800',
    'bg-rose-400/30 text-rose-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return colors[hash % colors.length];
};

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

const Avatar = ({ name = '', size = 'md', className = '' }) => {
  const initials = getInitials(name) || '?';
  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full select-none ${sizes[size]} ${colorFromName(name)} dark:opacity-90 ${className}`}
      title={name}
    >
      {initials}
    </span>
  );
};

export default Avatar;
