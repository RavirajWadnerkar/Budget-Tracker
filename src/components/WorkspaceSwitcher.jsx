import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Home, User, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useNavigate } from 'react-router-dom';

const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!activeWorkspace) return null;

  const Icon = activeWorkspace.type === 'joint' ? Home : User;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700 transition-colors"
      >
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
            activeWorkspace.type === 'joint'
              ? 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300'
              : 'bg-sage-100 text-sage-700 dark:bg-sage-500/20 dark:text-sage-300'
          }`}
        >
          <Icon size={14} />
        </span>
        <span className="flex-1 text-left min-w-0">
          <span className="block text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium leading-tight">
            {activeWorkspace.type === 'joint' ? 'Household' : 'Personal'}
          </span>
          <span className="block text-sm font-medium text-ink-900 dark:text-ink-100 truncate">
            {activeWorkspace.name}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-30 card overflow-hidden"
          >
            <div className="py-1.5">
              {workspaces.map((w) => {
                const WIcon = w.type === 'joint' ? Home : User;
                const active = w.id === activeWorkspace.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorkspace(w.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors text-left"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                        w.type === 'joint'
                          ? 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300'
                          : 'bg-sage-100 text-sage-700 dark:bg-sage-500/20 dark:text-sage-300'
                      }`}
                    >
                      <WIcon size={14} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500 font-medium leading-tight">
                        {w.type === 'joint' ? 'Household' : 'Personal'}
                      </span>
                      <span className="block text-sm font-medium truncate">
                        {w.name}
                      </span>
                    </span>
                    {active && <Check size={14} className="text-accent-500" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-ink-100 dark:border-ink-800 p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/household');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors"
              >
                <Plus size={14} />
                Manage households
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSwitcher;
