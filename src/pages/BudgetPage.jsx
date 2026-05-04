import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Save, RotateCcw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useExpenses } from '../hooks/useExpenses';
import { useBudgets } from '../hooks/useBudgets';
import { setBudget } from '../services/budgets';

import { CATEGORIES, getCategoryColor } from '../utils/categories';
import {
  formatCurrency,
  toDate,
  toMonthKey,
  monthKeyLabel,
} from '../utils/format';
import { FullPageSpinner, EmptyState } from '../components/States';

const BudgetPage = () => {
  const { user, displayName } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const workspaceIds = activeWorkspace ? [activeWorkspace.id] : [];

  const { expenses } = useExpenses(workspaceIds);
  const { budgets, loading } = useBudgets(activeWorkspace?.id);

  const [activeMonth, setActiveMonth] = useState(toMonthKey(new Date()));
  const [income, setIncome] = useState('');
  const [planned, setPlanned] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const monthBudget = budgets[activeMonth];

  // Sync local state when budget loads / month changes
  useEffect(() => {
    setIncome(monthBudget?.income ? String(monthBudget.income) : '');
    setPlanned({ ...(monthBudget?.categories || {}) });
    setDirty(false);
  }, [monthBudget, activeMonth]);

  // Actuals for this month
  const actuals = useMemo(() => {
    const map = {};
    expenses
      .filter((e) => toMonthKey(toDate(e.date)) === activeMonth)
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
      });
    return map;
  }, [expenses, activeMonth]);

  const totalPlanned = Object.values(planned).reduce(
    (s, v) => s + Number(v || 0),
    0,
  );
  const totalActual = Object.values(actuals).reduce(
    (s, v) => s + Number(v || 0),
    0,
  );

  const handlePlannedChange = (category, value) => {
    setPlanned((p) => ({ ...p, [category]: value === '' ? '' : Number(value) }));
    setDirty(true);
  };

  const goPrev = () => {
    const [y, m] = activeMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setActiveMonth(toMonthKey(d));
  };

  const goNext = () => {
    const [y, m] = activeMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setActiveMonth(toMonthKey(d));
  };

  const handleReset = () => {
    setPlanned({ ...(monthBudget?.categories || {}) });
    setIncome(monthBudget?.income ? String(monthBudget.income) : '');
    setDirty(false);
  };

  const handleSave = async () => {
    if (!activeWorkspace) return;
    setSaving(true);
    try {
      // Strip empty values
      const clean = {};
      Object.entries(planned).forEach(([k, v]) => {
        if (v !== '' && v != null && Number(v) > 0) clean[k] = Number(v);
      });
      await setBudget({
        workspace: activeWorkspace,
        monthKey: activeMonth,
        categories: clean,
        income: income === '' ? 0 : Number(income),
        user,
        userDisplayName: displayName,
      });
      toast.success('Budget saved');
      setDirty(false);
    } catch (err) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={Wallet}
        title="Select a workspace"
        description="Pick a workspace to plan its budget."
      />
    );
  }

  // Group categories
  const grouped = CATEGORIES.reduce((acc, c) => {
    (acc[c.group] = acc[c.group] || []).push(c);
    return acc;
  }, {});

  const isJoint = activeWorkspace.type === 'joint';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-2">
            Budget · {isJoint ? 'Household' : 'Personal'}
          </p>
          <h1 className="font-display text-3xl tracking-tight">
            Plan {monthKeyLabel(activeMonth)}
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            For {activeWorkspace.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="btn-ghost !px-2.5">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium tabular-nums px-2">
            {monthKeyLabel(activeMonth)}
          </span>
          <button onClick={goNext} className="btn-ghost !px-2.5">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
            Monthly income
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={income}
              onChange={(e) => {
                setIncome(e.target.value);
                setDirty(true);
              }}
              placeholder="0.00"
              className="input pl-7 font-display !text-2xl !py-2"
            />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
            Planned spending
          </div>
          <div className="font-display text-3xl tabular-nums">
            {formatCurrency(totalPlanned)}
          </div>
          {income !== '' && (
            <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
              {Number(income) > 0
                ? `${Math.round((totalPlanned / Number(income)) * 100)}% of income`
                : '—'}
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
            Actual so far
          </div>
          <div className="font-display text-3xl tabular-nums">
            {formatCurrency(totalActual)}
          </div>
          <div
            className={`text-xs mt-1 font-medium ${
              totalActual > totalPlanned ? 'text-rose-500' : 'text-sage-600 dark:text-sage-400'
            }`}
          >
            {totalPlanned > 0 && totalActual > totalPlanned
              ? `Over by ${formatCurrency(totalActual - totalPlanned)}`
              : totalPlanned > 0
                ? `${formatCurrency(totalPlanned - totalActual)} left`
                : 'No plan yet'}
          </div>
        </div>
      </div>

      {/* Save bar */}
      {dirty && (
        <div className="sticky top-3 z-10 card p-3 flex items-center justify-between gap-3 bg-accent-50/95 dark:bg-accent-500/10 backdrop-blur border-accent-200 dark:border-accent-500/30">
          <span className="text-sm text-accent-800 dark:text-accent-200">
            You have unsaved changes
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="btn-ghost">
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Category planning */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([group, cats]) => (
          <div key={group}>
            <h3 className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-3 px-1 font-medium">
              {group}
            </h3>
            <div className="card overflow-hidden">
              {cats.map((cat, idx) => {
                const plannedAmount = Number(planned[cat.name] ?? 0);
                const actual = actuals[cat.name] || 0;
                const hasPlan = plannedAmount > 0;
                const overBudget = hasPlan && actual > plannedAmount;
                const pct = hasPlan ? Math.min((actual / plannedAmount) * 100, 100) : 0;

                return (
                  <div
                    key={cat.name}
                    className={`flex items-center gap-3 sm:gap-4 px-4 py-3.5 ${
                      idx > 0 ? 'border-t border-ink-100 dark:border-ink-800' : ''
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cat.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{cat.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              overBudget
                                ? 'bg-rose-500'
                                : 'bg-sage-500 dark:bg-sage-400'
                            }`}
                            style={{
                              width: hasPlan
                                ? `${pct}%`
                                : actual > 0
                                  ? '100%'
                                  : '0%',
                              background:
                                !hasPlan && actual > 0 ? cat.color : undefined,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-ink-500 dark:text-ink-400 tabular-nums whitespace-nowrap">
                          {formatCurrency(actual)}
                          {hasPlan && ` / ${formatCurrency(plannedAmount)}`}
                        </span>
                      </div>
                    </div>
                    <div className="w-28 sm:w-32">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={planned[cat.name] ?? ''}
                          onChange={(e) =>
                            handlePlannedChange(cat.name, e.target.value)
                          }
                          placeholder="0"
                          className="input !pl-6 !py-1.5 text-sm font-mono tabular-nums text-right"
                        />
                      </div>
                      {hasPlan && (
                        <div
                          className={`text-[10px] mt-0.5 text-right tabular-nums ${
                            overBudget
                              ? 'text-rose-500'
                              : 'text-sage-600 dark:text-sage-400'
                          }`}
                        >
                          {overBudget
                            ? `+ ${formatCurrency(actual - plannedAmount)}`
                            : `− ${formatCurrency(plannedAmount - actual)}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetPage;
