import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useWorkspace } from '../context/WorkspaceContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-950 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-20 bg-ink-50/80 dark:bg-ink-950/80 backdrop-blur border-b border-ink-100 dark:border-ink-800 flex items-center px-4 py-3 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <Menu size={20} />
          </button>
          <div className="font-display text-lg leading-none">Ledger</div>
          {activeWorkspace && (
            <span className="ml-auto text-xs text-ink-500 truncate max-w-[40%]">
              {activeWorkspace.name}
            </span>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
