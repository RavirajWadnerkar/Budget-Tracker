import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Subscribe to all budget docs for a workspace, keyed by monthKey
export const useBudgets = (workspaceId) => {
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setBudgets({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'workspaces', workspaceId, 'budgets'),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setBudgets(map);
        setLoading(false);
      },
    );
    return unsub;
  }, [workspaceId]);

  return { budgets, loading };
};
