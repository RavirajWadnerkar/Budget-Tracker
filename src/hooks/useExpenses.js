import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toDate } from '../utils/format';

// Subscribe to expenses for an array of workspace IDs and merge them.
export const useExpenses = (workspaceIds = []) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = workspaceIds.join(',');

  useEffect(() => {
    if (workspaceIds.length === 0) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cache = {}; // workspaceId -> [expenses]
    const unsubs = workspaceIds.map((wid) => {
      const q = query(
        collection(db, 'workspaces', wid, 'expenses'),
        orderBy('date', 'desc'),
      );
      return onSnapshot(q, (snap) => {
        cache[wid] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const merged = Object.values(cache)
          .flat()
          .sort((a, b) => {
            const da = toDate(a.date)?.getTime() || 0;
            const db_ = toDate(b.date)?.getTime() || 0;
            return db_ - da;
          });
        setExpenses(merged);
        setLoading(false);
      });
    });

    return () => unsubs.forEach((u) => u && u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { expenses, loading };
};
