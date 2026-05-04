import { toDate, startOfWeek, startOfMonth, toMonthKey } from './format';

// Build simple human-readable insights from expense data.
// Returns an array of { id, type: 'positive' | 'warning' | 'info', message }
export const generateInsights = (expenses, budgets = {}) => {
  if (!expenses || expenses.length === 0) return [];

  const insights = [];
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisMonthKey = toMonthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = toMonthKey(lastMonthDate);

  // Group helpers
  const sumBy = (items, fn) =>
    items.reduce((acc, item) => acc + Number(fn(item) || 0), 0);

  const inRange = (e, start, end) => {
    const d = toDate(e.date);
    return d && d >= start && (!end || d < end);
  };

  // === Week-over-week dining out ===
  const thisWeekDining = expenses.filter(
    (e) => e.category === 'Dining Out' && inRange(e, thisWeekStart, null),
  );
  const lastWeekDining = expenses.filter(
    (e) => e.category === 'Dining Out' && inRange(e, lastWeekStart, thisWeekStart),
  );
  const thisDining = sumBy(thisWeekDining, (e) => e.amount);
  const lastDining = sumBy(lastWeekDining, (e) => e.amount);
  if (lastDining > 0 && thisDining > lastDining * 1.2) {
    const pct = Math.round(((thisDining - lastDining) / lastDining) * 100);
    insights.push({
      id: 'dining-up',
      type: 'warning',
      message: `Dining out is up ${pct}% this week compared to last week.`,
    });
  } else if (thisDining > 0 && lastDining > 0 && thisDining < lastDining * 0.8) {
    insights.push({
      id: 'dining-down',
      type: 'positive',
      message: `Dining out is down compared to last week — nice work.`,
    });
  }

  // === Budget category status ===
  const monthExpenses = expenses.filter(
    (e) => toMonthKey(toDate(e.date)) === thisMonthKey,
  );
  Object.entries(budgets).forEach(([category, planned]) => {
    if (!planned || planned <= 0) return;
    const spent = sumBy(
      monthExpenses.filter((e) => e.category === category),
      (e) => e.amount,
    );
    if (spent > planned) {
      insights.push({
        id: `over-${category}`,
        type: 'warning',
        message: `You're over budget on ${category} this month.`,
      });
    } else if (spent < planned * 0.5 && now.getDate() > 20) {
      insights.push({
        id: `under-${category}`,
        type: 'positive',
        message: `You're well under budget for ${category} this month.`,
      });
    }
  });

  // === Joint vs personal trend ===
  const thisMonthJoint = sumBy(
    monthExpenses.filter((e) => e.workspaceType === 'joint'),
    (e) => e.amount,
  );
  const lastMonthJoint = sumBy(
    expenses.filter(
      (e) =>
        e.workspaceType === 'joint' && toMonthKey(toDate(e.date)) === lastMonthKey,
    ),
    (e) => e.amount,
  );
  if (lastMonthJoint > 0 && thisMonthJoint > lastMonthJoint * 1.15) {
    insights.push({
      id: 'joint-up',
      type: 'info',
      message: `Joint household spending is trending higher than last month.`,
    });
  }

  // === Top category this month ===
  const byCategory = {};
  monthExpenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
  });
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0 && sortedCats[0][1] > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const total = sortedCats.reduce((s, [, v]) => s + v, 0);
    const share = Math.round((topAmt / total) * 100);
    if (share >= 25) {
      insights.push({
        id: 'top-cat',
        type: 'info',
        message: `${topCat} is your biggest category this month (${share}% of spending).`,
      });
    }
  }

  return insights.slice(0, 5);
};
