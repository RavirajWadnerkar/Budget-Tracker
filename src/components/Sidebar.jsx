import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Users,
  History,
  LogOut,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/budget', label: 'Budget', icon: PieChart },
  { to: '/household', label: 'Household', icon: Users },
  { to: '/activity', label: 'Activity', icon: History },
];

const Sidebar = ({ open, onClose }) => {
  const { signOut, displayName, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Signed out');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:sticky top-0 left-0 h-dvh w-72 z-40 bg-ink-50 dark:bg-ink-950 border-r border-ink-100 dark:border-ink-800 flex flex-col transition-transform lg:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink-900 dark:bg-accent-400 flex items-center justify-center">
              <span className="font-display font-semibold text-accent-300 dark:text-ink-950 text-lg leading-none">
                R
              </span>
            </div>
            <div>
              <div className="font-display text-lg leading-none">Ledger</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-400 dark:text-ink-500 mt-0.5">
                Household budget
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 mt-2">
          <WorkspaceSwitcher />
        </div>

        {/* Nav */}
        <nav className="px-3 mt-4 flex-1 overflow-y-auto scrollbar-thin">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-950'
                        : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800/50 hover:text-ink-900 dark:hover:text-ink-100'
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={1.75} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-ink-100 dark:border-ink-800 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800/50 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
            <Avatar name={displayName || user?.email} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-[11px] text-ink-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-ink-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
