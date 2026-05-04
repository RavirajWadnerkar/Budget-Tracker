import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity } from './activity';

// Budget doc id is the month key, e.g. "2026-05".
// Stored as { categories: { Rent: 2000, Groceries: 600 }, income: 5000, ... }

export const setBudget = async ({
  workspace,
  monthKey,
  categories,
  income,
  user,
  userDisplayName,
}) => {
  await setDoc(
    doc(db, 'workspaces', workspace.id, 'budgets', monthKey),
    {
      monthKey,
      categories: categories || {},
      income: Number(income) || 0,
      updatedByUserId: user.uid,
      updatedByName: userDisplayName,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await logActivity(workspace.id, {
    action: 'budget_updated',
    userId: user.uid,
    userName: userDisplayName,
    detail: monthKey,
  });
};
