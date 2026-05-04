import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  UserPlus,
  UserMinus,
  LogOut,
  Home,
  Users,
} from 'lucide-react';

import { useWorkspace } from '../context/WorkspaceContext';
import { useActivityLog } from '../hooks/useActivityLog';
import { ACTIVITY_LABELS } from '../services/activity';

import Avatar from '../components/Avatar';
import { EmptyState, FullPageSpinner } from '../components/States';
import { formatRelativeTime, toDate } from '../utils/format';

// Map an action key to an icon + accent color
const ACTION_META = {
  expense_created: { Icon: Plus, tone: 'sage' },
  expense_updated: { Icon: Pencil, tone: 'accent' },
  expense_deleted: { Icon: Trash2, tone: 'rose' },
  budget_updated: { Icon: Wallet, tone: 'accent' },
  member_invited: { Icon: UserPlus, tone: 'accent' },
  member_joined: { Icon: UserPlus, tone: 'sage' },
  member_removed: { Icon: UserMinus, tone: 'rose' },
  member_left: { Icon: LogOut, tone: 'rose' },
  household_created: { Icon: Home, tone: 'accent' },
  household_renamed: { Icon: Pencil, tone: 'accent' },
};

const TONE_CLASSES = {
  sage: 'bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300',
  accent:
    'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  ink: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
};

const ActivityPage = () => {
  const { workspaces, loading: wsLoading } = useWorkspace();
  const [filterWorkspace, setFilterWorkspace] = useState('all');

  const workspaceIds = useMemo(
    () =>
      filterWorkspace === 'all'
        ? workspaces.map((w) => w.id)
        : [filterWorkspace],
    [workspaces, filterWorkspace],
  );

  const { logs, loading } = useActivityLog(workspaceIds, 200);

  // Workspace lookup map for showing names alongside logs
  const wsById = useMemo(() => {
    const m = {};
    workspaces.forEach((w) => (m[w.id] = w));
    return m;
  }, [workspaces]);

  // Group logs by date (Today / Yesterday / Date)
  const grouped = useMemo(() => {
    const groups = {};
    const now = new Date();
    const todayKey = now.toDateString();
    const yKey = new Date(now.getTime() - 86400000).toDateString();

    logs.forEach((log) => {
      const d = toDate(log.createdAt);
      if (!d) {
        (groups['—'] = groups['—'] || []).push(log);
        return;
      }
      const k = d.toDateString();
      let label;
      if (k === todayKey) label = 'Today';
      else if (k === yKey) label = 'Yesterday';
      else
        label = d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
      (groups[label] = groups[label] || []).push(log);
    });
    return Object.entries(groups);
  }, [logs]);

  if (wsLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-2">
            History
          </p>
          <h1 className="font-display text-3xl tracking-tight">Activity</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Every change made to your expenses, budgets, and households.
          </p>
        </div>

        {/* Workspace filter */}
        {workspaces.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-ink-500" />
            <select
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              className="input !py-2 !text-sm max-w-[220px]"
            >
              <option value="all">All workspaces</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.type === 'joint' ? '· Household' : '· Personal'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="card p-12">
          <FullPageSpinner />
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-10">
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="When you or a household member adds, edits, or deletes anything, it'll show up here."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([label, items]) => (
            <section key={label}>
              <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-3 px-1">
                {label}
              </p>
              <ol className="card p-2 sm:p-3 divide-y divide-ink-200/50 dark:divide-ink-800/60">
                {items.map((log, i) => (
                  <ActivityRow
                    key={log.id}
                    log={log}
                    workspace={wsById[log.workspaceId]}
                    showWorkspace={
                      filterWorkspace === 'all' && workspaces.length > 1
                    }
                    delay={i * 0.015}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const ActivityRow = ({ log, workspace, showWorkspace, delay = 0 }) => {
  const meta = ACTION_META[log.action] || { Icon: Activity, tone: 'ink' };
  const { Icon } = meta;
  const tone = TONE_CLASSES[meta.tone];
  const label = ACTIVITY_LABELS[log.action] || log.action;
  const userName = log.userName || 'Someone';

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-start gap-3 p-3"
    >
      <div
        className={
          'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ' + tone
        }
      >
        <Icon size={15} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="font-medium">{userName}</span>
          <span className="text-ink-600 dark:text-ink-400">{label}</span>
          {log.detail && log.action !== 'member_removed' && (
            <span className="text-ink-500 dark:text-ink-400 truncate">
              · <span className="text-ink-700 dark:text-ink-200">{log.detail}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 mt-0.5">
          <span>{formatRelativeTime(toDate(log.createdAt)) || 'just now'}</span>
          {showWorkspace && workspace && (
            <>
              <span className="text-ink-300 dark:text-ink-700">·</span>
              <span className="inline-flex items-center gap-1">
                {workspace.type === 'joint' ? (
                  <Users size={11} />
                ) : (
                  <Wallet size={11} />
                )}
                <span className="truncate max-w-[140px]">{workspace.name}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <Avatar name={userName} size="sm" className="shrink-0" />
    </motion.li>
  );
};

export default ActivityPage;
