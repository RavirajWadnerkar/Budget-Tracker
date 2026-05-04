import { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toDate } from '../utils/format';

export const useActivityLog = (workspaceIds = [], maxItems = 100) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = workspaceIds.join(',');

  useEffect(() => {
    if (workspaceIds.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cache = {};
    const unsubs = workspaceIds.map((wid) => {
      const q = query(
        collection(db, 'workspaces', wid, 'activityLogs'),
        orderBy('createdAt', 'desc'),
        limit(maxItems),
      );
      return onSnapshot(
        q,
        (snap) => {
          cache[wid] = snap.docs.map((d) => ({
            id: d.id,
            workspaceId: wid,
            ...d.data(),
          }));
          const merged = Object.values(cache)
            .flat()
            .sort((a, b) => {
              const da = toDate(a.createdAt)?.getTime() || 0;
              const db_ = toDate(b.createdAt)?.getTime() || 0;
              return db_ - da;
            })
            .slice(0, maxItems);
          setLogs(merged);
          setLoading(false);
        },
        (error) => {
          // eslint-disable-next-line no-console
          console.error('[useActivityLog] snapshot error:', error);
          setLogs([]);
          setLoading(false);
        },
      );
    });
    return () => unsubs.forEach((u) => u && u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, maxItems]);

  return { logs, loading };
};
