import { useEffect, useState } from 'react';
import Modal from './Modal';
import { CATEGORIES } from '../utils/categories';
import { toInputDate, toDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { getMembersInfo } from '../services/workspaces';
import { createExpense, updateExpense } from '../services/expenses';
import toast from 'react-hot-toast';

const ExpenseForm = ({ open, onClose, expense = null }) => {
  const { user, displayName } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const isEdit = Boolean(expense);

  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    date: toInputDate(new Date()),
    category: 'Groceries',
    subcategory: '',
    amount: '',
    notes: '',
    paidByUserId: user?.uid || '',
    paidByName: displayName || '',
  }));

  // Load members for "paid by" dropdown
  useEffect(() => {
    let active = true;
    if (activeWorkspace) {
      getMembersInfo(activeWorkspace.memberIds || []).then((m) => {
        if (active) setMembers(m);
      });
    }
    return () => {
      active = false;
    };
  }, [activeWorkspace]);

  // Reset form when opening / switching expense
  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        date: toInputDate(toDate(expense.date)),
        category: expense.category || 'Groceries',
        subcategory: expense.subcategory || '',
        amount: String(expense.amount ?? ''),
        notes: expense.notes || '',
        paidByUserId: expense.paidByUserId || user.uid,
        paidByName: expense.paidByName || displayName,
      });
    } else {
      setForm({
        date: toInputDate(new Date()),
        category: 'Groceries',
        subcategory: '',
        amount: '',
        notes: '',
        paidByUserId: user.uid,
        paidByName: displayName,
      });
    }
  }, [open, expense, user, displayName]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handlePaidByChange = (uid) => {
    const m = members.find((m) => m.id === uid);
    setForm((f) => ({
      ...f,
      paidByUserId: uid,
      paidByName: m?.displayName || m?.email || 'Unknown',
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!activeWorkspace) {
      toast.error('No workspace selected');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter an amount');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date).toISOString(),
        amount: Number(form.amount),
      };
      if (isEdit) {
        await updateExpense({
          workspace: activeWorkspace,
          expenseId: expense.id,
          data: payload,
          user,
          userDisplayName: displayName,
        });
        toast.success('Expense updated');
      } else {
        await createExpense({
          workspace: activeWorkspace,
          data: payload,
          user,
          userDisplayName: displayName,
        });
        toast.success('Expense added');
      }
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  // Group categories
  const grouped = CATEGORIES.reduce((acc, c) => {
    (acc[c.group] = acc[c.group] || []).push(c);
    return acc;
  }, {});

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit expense' : 'Add expense'}
      description={
        activeWorkspace
          ? `In ${activeWorkspace.name}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="input pl-7 font-mono text-lg"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="input"
          >
            {Object.entries(grouped).map(([group, cats]) => (
              <optgroup label={group} key={group}>
                {cats.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Subcategory (optional)</label>
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => handleChange('subcategory', e.target.value)}
              className="input"
              placeholder="e.g. Whole Foods"
            />
          </div>
          <div>
            <label className="label">Paid by</label>
            <select
              value={form.paidByUserId}
              onChange={(e) => handlePaidByChange(e.target.value)}
              className="input"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName || m.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            rows="2"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="input resize-none"
            placeholder="Anything worth remembering…"
          />
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseForm;
