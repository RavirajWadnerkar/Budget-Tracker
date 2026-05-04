import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Receipt,
  User,
  Home,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';
import { EmptyState, FullPageSpinner } from '../components/States';
import ExpenseForm from '../components/ExpenseForm';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useExpenses } from '../hooks/useExpenses';
import { useBudgets } from '../hooks/useBudgets';
import {
  formatCurrency,
  formatCompact,
  toDate,
  toMonthKey,
  startOfWeek,
  startOfMonth,
  monthKeyLabel,
} from '../utils/format';
import { generateInsights } from '../utils/insights';
import { CATEGORIES, getCategoryColor } from '../utils/categories';

const DashboardPage = () => {
  const { displayName } = useAuth();
  const { activeWorkspace, personalWorkspace, jointWorkspaces, loading: wsLoading } = useWorkspace();

  // Pull from all workspaces user belongs to so dashboard can show personal vs joint
  const allWorkspaceIds = useMemo(
    () => [
      personalWorkspace?.id,
      ...jointWorkspaces.map((w) => w.id),
    ].filter(Boolean),
    [personalWorkspace, jointWorkspaces],
  );

  const { expenses, loading: expLoading } = useExpenses(allWorkspaceIds);
  const { budgets } = useBudgets(activeWorkspace?.id);

  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();
  const thisMonthKey = toMonthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = toMonthKey(lastMonthDate);

  const monthBudget = budgets[thisMonthKey];
  const monthIncome = monthBudget?.income || 0;
  const plannedCategories = monthBudget?.categories || {};

  // === Aggregates ===
  const stats = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => toMonthKey(toDate(e.date)) === thisMonthKey,
    );
    const lastMonthExpenses = expenses.filter(
      (e) => toMonthKey(toDate(e.date)) === lastMonthKey,
    );
    const totalThisMonth = monthExpenses.reduce(
      (s, e) => s + Number(e.amount || 0),
      0,
    );
    const totalLastMonth = lastMonthExpenses.reduce(
      (s, e) => s + Number(e.amount || 0),
      0,
    );
    const personalTotal = monthExpenses
      .filter((e) => e.workspaceType === 'personal')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const jointTotal = monthExpenses
      .filter((e) => e.workspaceType === 'joint')
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const remaining = monthIncome - totalThisMonth;
    const savings = Math.max(remaining, 0);

    // % delta vs last month
    const monthDelta =
      totalLastMonth > 0
        ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
        : null;

    return {
      totalThisMonth,
      totalLastMonth,
      personalTotal,
      jointTotal,
      remaining,
      savings,
      monthDelta,
      monthExpenses,
    };
  }, [expenses, thisMonthKey, lastMonthKey, monthIncome]);

  // === Category breakdown ===
  const categoryData = useMemo(() => {
    const map = {};
    stats.monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats.monthExpenses]);

  // === Weekly spending (last 8 weeks) ===
  const weeklyData = useMemo(() => {
    const buckets = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(startOfWeek(now));
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const total = expenses
        .filter((e) => {
          const d = toDate(e.date);
          return d && d >= start && d < end;
        })
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      buckets.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        total: Math.round(total),
      });
    }
    return buckets;
  }, [expenses, now]);

  // === Monthly trend (last 6 months) ===
  const monthlyData = useMemo(() => {
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = toMonthKey(d);
      const total = expenses
        .filter((e) => toMonthKey(toDate(e.date)) === key)
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      const personal = expenses
        .filter(
          (e) =>
            toMonthKey(toDate(e.date)) === key && e.workspaceType === 'personal',
        )
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      const joint = expenses
        .filter(
          (e) => toMonthKey(toDate(e.date)) === key && e.workspaceType === 'joint',
        )
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      buckets.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total: Math.round(total),
        personal: Math.round(personal),
        joint: Math.round(joint),
      });
    }
    return buckets;
  }, [expenses, now]);

  const insights = useMemo(
    () => generateInsights(expenses, plannedCategories),
    [expenses, plannedCategories],
  );

  if (wsLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-2">
            {monthKeyLabel(thisMonthKey)} · Overview
          </p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-balance">
            Hello, {displayName?.split(' ')[0] || 'there'}.
          </h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary self-start sm:self-auto">
          <Plus size={16} />
          Add expense
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Income"
          value={formatCurrency(monthIncome)}
          icon={Wallet}
          accent="default"
          index={0}
        />
        <StatCard
          label="Spent"
          value={formatCurrency(stats.totalThisMonth)}
          icon={TrendingDown}
          accent="rose"
          delta={stats.monthDelta}
          index={1}
        />
        <StatCard
          label="Remaining"
          value={formatCurrency(stats.remaining)}
          icon={Receipt}
          accent={stats.remaining < 0 ? 'rose' : 'sage'}
          index={2}
        />
        <StatCard
          label="Savings"
          value={formatCurrency(stats.savings)}
          icon={PiggyBank}
          accent="accent"
          index={3}
        />
      </div>

      {/* Personal vs Joint split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <SplitCard
          icon={User}
          label="Personal"
          amount={stats.personalTotal}
          tone="sage"
        />
        <SplitCard
          icon={Home}
          label="Joint"
          amount={stats.jointTotal}
          tone="accent"
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-accent-500" />
            <h3 className="font-display text-lg">Insights</h3>
          </div>
          <ul className="space-y-2">
            {insights.map((i) => {
              const Icon =
                i.type === 'warning'
                  ? AlertTriangle
                  : i.type === 'positive'
                    ? CheckCircle2
                    : Info;
              const tone =
                i.type === 'warning'
                  ? 'text-accent-600 dark:text-accent-400'
                  : i.type === 'positive'
                    ? 'text-sage-600 dark:text-sage-400'
                    : 'text-ink-500 dark:text-ink-400';
              return (
                <li key={i.id} className="flex items-start gap-2.5 text-sm">
                  <Icon size={15} className={`mt-0.5 ${tone} flex-shrink-0`} />
                  <span className="text-ink-700 dark:text-ink-200">{i.message}</span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly spending chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg">Weekly spending</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">Last 8 weeks</p>
            </div>
          </div>
          {expenses.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-200 dark:text-ink-800" vertical={false} />
                <XAxis dataKey="label" stroke="currentColor" className="text-ink-400 text-xs" tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" className="text-ink-400 text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip
                  cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                  contentStyle={{
                    background: 'var(--tooltip-bg, #fff)',
                    border: '1px solid #e8e8e3',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatCurrency(v), 'Spent']}
                />
                <Bar dataKey="total" fill="#e88110" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg">By category</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">This month</p>
            </div>
          </div>
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-400 text-center">
              Add expenses to see your breakdown
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e8e8e3',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 mt-2 max-h-32 overflow-y-auto scrollbar-thin">
                {categoryData.slice(0, 5).map((c) => (
                  <li key={c.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: c.color }}
                    />
                    <span className="flex-1 truncate text-ink-600 dark:text-ink-300">
                      {c.name}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(c.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg">Monthly trend</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">Personal vs joint over the last 6 months</p>
          </div>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Add your first expense to start seeing trends here."
            action={
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Add expense
              </button>
            }
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-200 dark:text-ink-800" vertical={false} />
              <XAxis dataKey="label" stroke="currentColor" className="text-ink-400 text-xs" tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-ink-400 text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e8e8e3',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => formatCurrency(v)}
              />
              <Line type="monotone" dataKey="personal" stroke="#577b5d" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Personal" />
              <Line type="monotone" dataKey="joint" stroke="#e88110" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Joint" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ExpenseForm open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

const SplitCard = ({ icon: Icon, label, amount, tone = 'sage' }) => {
  const tones = {
    sage: 'bg-sage-100 text-sage-700 dark:bg-sage-500/20 dark:text-sage-300',
    accent: 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-5 flex items-center gap-4"
    >
      <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-medium">
          {label} this month
        </div>
        <div className="font-display text-2xl tabular-nums">{formatCurrency(amount)}</div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
