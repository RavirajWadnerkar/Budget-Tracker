import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const logActivity = async (workspaceId, payload) => {
  if (!workspaceId) return;
  try {
    await addDoc(collection(db, 'workspaces', workspaceId, 'activityLogs'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to log activity', err);
  }
};

export const ACTIVITY_LABELS = {
  expense_created: 'added an expense',
  expense_updated: 'edited an expense',
  expense_deleted: 'deleted an expense',
  budget_updated: 'updated a budget',
  member_invited: 'invited a member',
  member_joined: 'joined the household',
  member_removed: 'removed a member',
  member_left: 'left the household',
  household_created: 'created the household',
  household_renamed: 'renamed the household',
};
