import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  Filter,
  Receipt,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import ExpenseForm from '../components/ExpenseForm';
import ConfirmModal from '../components/ConfirmModal';
import Avatar from '../components/Avatar';
import { EmptyState, Skeleton } from '../components/States';

import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useExpenses } from '../hooks/useExpenses';
import { deleteExpense } from '../services/expenses';
import { getMembersInfo } from '../services/workspaces';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  toDate,
  toMonthKey,
  monthKeyLabel,
} from '../utils/format';
import { exportExpensesToCSV } from '../utils/csv';
import { CATEGORIES, getCategoryColor } from '../utils/categories';

const ExpensesPage = () => {
  const { user, displayName } = useAuth();
  const { activeWorkspace, personalWorkspace, jointWorkspaces } = useWorkspace();

  const allWorkspaceIds = useMemo(
    () => [personalWorkspace?.id, ...jointWorkspaces.map((w) => w.id)].filter(Boolean),
    [personalWorkspace, jointWorkspaces],
  );

  const { expenses, loading } = useExpenses(allWorkspaceIds);

  // Filters
  const [scope, setScope] = useState('all'); // all | personal | joint | <workspaceId>
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState('all');
  const [paidBy, setPaidBy] = useState('all');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modals
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Members for paid-by filter
  const [allMembers, setAllMembers] = useState([]);
  useEffect(() => {
    const loadAll = async () => {
      const ids = new Set();
      [personalWorkspace, ...jointWorkspaces].filter(Boolean).forEach((w) => {
        (w.memberIds || []).forEach((id) => ids.add(id));
      });
      const members = await getMembersInfo(Array.from(ids));
      setAllMembers(members);
    };
    loadAll();
  }, [personalWorkspace, jointWorkspaces]);

  // Available month keys from data
  const months = useMemo(() => {
    const set = new Set();
    expenses.forEach((e) => set.add(toMonthKey(toDate(e.date))));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (scope === 'personal' && e.workspaceType !== 'personal') return false;
      if (scope === 'joint' && e.workspaceType !== 'joint') return false;
      if (scope !== 'all' && scope !== 'personal' && scope !== 'joint' && e.workspaceId !== scope) return false;
      if (category !== 'all' && e.category !== category) return false;
      if (month !== 'all' && toMonthKey(toDate(e.date)) !== month) return false;
      if (paidBy !== 'all' && e.paidByUserId !== paidBy) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${e.category} ${e.subcategory} ${e.notes} ${e.paidByName} ${e.createdByName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, scope, category, month, paidBy, search]);

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      const workspace =
        deletingExpense.workspaceId === personalWorkspace?.id
          ? personalWorkspace
          : jointWorkspaces.find((w) => w.id === deletingExpense.workspaceId) ||
            activeWorkspace;
      await deleteExpense({
        workspace,
        expense: deletingExpense,
        user,
        userDisplayName: displayName,
      });
      toast.success('Expense deleted');
      setDeletingExpense(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    exportExpensesToCSV(filtered, `expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${filtered.length} expenses`);
  };

  const clearFilters = () => {
    setScope('all');
    setCategory('all');
    setMonth('all');
    setPaidBy('all');
    setSearch('');
  };

  const hasFilters =
    scope !== 'all' ||
    category !== 'all' ||
    month !== 'all' ||
    paidBy !== 'all' ||
    search.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-2">
            Expenses
          </p>
          <h1 className="font-display text-3xl tracking-tight">All transactions</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            {filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'} · {formatCurrency(totalFiltered)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary" title="Export to CSV">
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus size={16} />
            Add expense
          </button>
        </div>
      </div>

      {/* Search + filter button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories, notes, people…"
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={`btn-secondary ${hasFilters ? '!bg-accent-100 !text-accent-800 dark:!bg-accent-500/20 dark:!text-accent-300' : ''}`}
        >
          <Filter size={15} />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && (
            <span className="badge bg-accent-500 text-white !px-1.5 !py-0">·</span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="label">Scope</label>
                <select className="input" value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="all">All workspaces</option>
                  <option value="personal">Personal only</option>
                  <option value="joint">Joint only</option>
                  {jointWorkspaces.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
                  <option value="all">All time</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{monthKeyLabel(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Paid by</label>
                <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                  <option value="all">Anyone</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.displayName || m.email}</option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-ghost col-span-2 lg:col-span-4 justify-self-start"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title={hasFilters ? 'No expenses match your filters' : 'No expenses yet'}
            description={
              hasFilters
                ? 'Try clearing filters or adding new expenses.'
                : 'Track your first expense to see it here.'
            }
            action={
              !hasFilters && (
                <button onClick={() => setAdding(true)} className="btn-primary">
                  <Plus size={16} /> Add expense
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-900/50 text-left text-[11px] uppercase tracking-wider text-ink-500 dark:text-ink-400">
                <tr>
                  <th className="font-medium px-5 py-3">Date</th>
                  <th className="font-medium px-3 py-3">Category</th>
                  <th className="font-medium px-3 py-3">Notes</th>
                  <th className="font-medium px-3 py-3">Paid by</th>
                  <th className="font-medium px-3 py-3">Edited</th>
                  <th className="font-medium px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filtered.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    onEdit={() => setEditing(e)}
                    onDelete={() => setDeletingExpense(e)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                onEdit={() => setEditing(e)}
                onDelete={() => setDeletingExpense(e)}
              />
            ))}
          </div>
        </>
      )}

      <ExpenseForm open={adding} onClose={() => setAdding(false)} />
      <ExpenseForm
        open={!!editing}
        onClose={() => setEditing(null)}
        expense={editing}
      />
      <ConfirmModal
        open={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDelete}
        title="Delete this expense?"
        confirmLabel="Delete"
        destructive
        loading={deleteLoading}
      />
    </div>
  );
};

const ExpenseRow = ({ expense, onEdit, onDelete }) => {
  const dotColor = getCategoryColor(expense.category);
  const wasEdited =
    expense.updatedAt &&
    expense.createdAt &&
    toDate(expense.updatedAt)?.getTime() !==
      toDate(expense.createdAt)?.getTime();

  return (
    <tr className="hover:bg-ink-50/50 dark:hover:bg-ink-900/30 transition-colors group">
      <td className="px-5 py-3 whitespace-nowrap text-ink-700 dark:text-ink-300">
        {formatDate(toDate(expense.date))}
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
          <span className="font-medium">{expense.category}</span>
          {expense.workspaceType === 'joint' && (
            <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300">
              Joint
            </span>
          )}
        </span>
        {expense.subcategory && (
          <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            {expense.subcategory}
          </div>
        )}
      </td>
      <td className="px-3 py-3 max-w-[200px]">
        <div className="text-sm text-ink-600 dark:text-ink-300 truncate" title={expense.notes}>
          {expense.notes || <span className="text-ink-400">—</span>}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={expense.paidByName} size="xs" />
          <span className="text-ink-600 dark:text-ink-300 truncate max-w-[120px]">
            {expense.paidByName}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-ink-500 dark:text-ink-400 whitespace-nowrap">
        {wasEdited ? (
          <>
            By {expense.updatedByName}
            <div className="text-[10px] text-ink-400">
              {formatRelativeTime(toDate(expense.updatedAt))}
            </div>
          </>
        ) : (
          <>
            By {expense.createdByName}
            <div className="text-[10px] text-ink-400">
              {formatRelativeTime(toDate(expense.createdAt))}
            </div>
          </>
        )}
      </td>
      <td className="px-3 py-3 text-right font-mono tabular-nums font-medium">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-500 hover:text-rose-500 hover:bg-rose-500/10"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const dotColor = getCategoryColor(expense.category);
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
            <span className="font-medium text-sm">{expense.category}</span>
            {expense.workspaceType === 'joint' && (
              <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300">
                Joint
              </span>
            )}
          </div>
          <div className="text-xs text-ink-500 dark:text-ink-400">
            {formatDate(toDate(expense.date))} · {expense.paidByName}
          </div>
          {expense.notes && (
            <div className="text-xs text-ink-600 dark:text-ink-300 mt-1.5 line-clamp-2">
              {expense.notes}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono tabular-nums font-medium">
            {formatCurrency(expense.amount)}
          </div>
          <div className="flex items-center gap-1 mt-1.5 justify-end">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-ink-500 hover:text-rose-500 hover:bg-rose-500/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
