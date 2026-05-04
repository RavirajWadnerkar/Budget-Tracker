import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity } from './activity';

// Create an expense in a workspace.
export const createExpense = async ({
  workspace,
  data,
  user,
  userDisplayName,
}) => {
  if (!workspace) throw new Error('No active workspace');
  const payload = {
    workspaceId: workspace.id,
    workspaceType: workspace.type,
    date: data.date, // ISO string
    category: data.category,
    subcategory: data.subcategory || '',
    amount: Number(data.amount) || 0,
    notes: data.notes || '',
    paidByUserId: data.paidByUserId || user.uid,
    paidByName: data.paidByName || userDisplayName,
    createdByUserId: user.uid,
    createdByName: userDisplayName,
    createdAt: serverTimestamp(),
    updatedByUserId: user.uid,
    updatedByName: userDisplayName,
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(
    collection(db, 'workspaces', workspace.id, 'expenses'),
    payload,
  );
  await logActivity(workspace.id, {
    action: 'expense_created',
    userId: user.uid,
    userName: userDisplayName,
    detail: `${data.category} · $${Number(data.amount).toFixed(2)}`,
    expenseId: ref.id,
  });
  return ref.id;
};

export const updateExpense = async ({
  workspace,
  expenseId,
  data,
  user,
  userDisplayName,
}) => {
  await updateDoc(doc(db, 'workspaces', workspace.id, 'expenses', expenseId), {
    date: data.date,
    category: data.category,
    subcategory: data.subcategory || '',
    amount: Number(data.amount) || 0,
    notes: data.notes || '',
    paidByUserId: data.paidByUserId,
    paidByName: data.paidByName,
    updatedByUserId: user.uid,
    updatedByName: userDisplayName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(workspace.id, {
    action: 'expense_updated',
    userId: user.uid,
    userName: userDisplayName,
    detail: `${data.category} · $${Number(data.amount).toFixed(2)}`,
    expenseId,
  });
};

export const deleteExpense = async ({
  workspace,
  expense,
  user,
  userDisplayName,
}) => {
  await deleteDoc(doc(db, 'workspaces', workspace.id, 'expenses', expense.id));
  await logActivity(workspace.id, {
    action: 'expense_deleted',
    userId: user.uid,
    userName: userDisplayName,
    detail: `${expense.category} · $${Number(expense.amount).toFixed(2)}`,
    expenseId: expense.id,
  });
};
