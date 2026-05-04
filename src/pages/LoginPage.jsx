import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Mail, Lock, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/States';

const LoginPage = ({ mode = 'signin' }) => {
  const isSignup = mode === 'signup';
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password required');
      return;
    }
    if (isSignup && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(form.email, form.password, form.displayName || form.email.split('@')[0]);
        toast.success('Welcome to Ledger');
      } else {
        await signIn(form.email, form.password);
        toast.success('Welcome back');
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || err.message;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-950 grain-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Brand panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block relative"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-ink-900 dark:bg-accent-400 flex items-center justify-center">
              <span className="font-display font-semibold text-accent-300 dark:text-ink-950 text-xl leading-none">
                R
              </span>
            </div>
            <div>
              <div className="font-display text-2xl leading-none">Ledger</div>
              <div className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mt-1">
                Household budget
              </div>
            </div>
          </div>

          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05] tracking-tight text-balance mb-6">
            A quiet ledger for{' '}
            <em className="text-accent-500 not-italic font-normal">two people</em>{' '}
            and one shared life.
          </h1>
          <p className="text-ink-500 dark:text-ink-400 text-lg max-w-md leading-relaxed">
            Track personal expenses, plan the household budget together, and see where the
            money actually goes — beautifully, in real time.
          </p>

          {/* decorative receipt */}
          <div className="mt-12 relative">
            <div className="card p-6 max-w-sm transform rotate-[-1.5deg]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  Sat · Apr 27
                </span>
                <span className="badge bg-sage-100 text-sage-700 dark:bg-sage-500/20 dark:text-sage-300">
                  Joint
                </span>
              </div>
              <div className="font-display text-3xl mb-1">$84.21</div>
              <div className="text-sm text-ink-500">Groceries · Trader Joe's</div>
              <div className="border-t border-dashed border-ink-200 dark:border-ink-800 my-4" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400">Paid by Sam</span>
                <span className="text-sage-600 dark:text-sage-400">↓ 12% vs last week</span>
              </div>
            </div>
            <div className="absolute -bottom-4 right-8 card p-4 max-w-[200px] transform rotate-[2.5deg]">
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                This month
              </div>
              <div className="font-display text-2xl">$2,840</div>
              <div className="text-[11px] text-sage-600 dark:text-sage-400 mt-1">
                Under budget · $360 left
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-7 sm:p-9"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-ink-900 dark:bg-accent-400 flex items-center justify-center">
              <span className="font-display font-semibold text-accent-300 dark:text-ink-950 text-lg leading-none">
                R
              </span>
            </div>
            <div className="font-display text-xl">Ledger</div>
          </div>

          <h2 className="font-display text-3xl mb-1.5">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-7">
            {isSignup
              ? 'A few details and you’re in.'
              : 'Sign in to keep tracking your expenses.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="label">Display name</label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) =>
                      setForm({ ...form, displayName: e.target.value })
                    }
                    className="input pl-9"
                    placeholder="Sam"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pl-9 pr-10"
                  placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <Spinner size={16} />
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-ink-900 dark:text-accent-400 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link
                  to="/signup"
                  className="text-ink-900 dark:text-accent-400 font-medium hover:underline"
                >
                  Create an account
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
