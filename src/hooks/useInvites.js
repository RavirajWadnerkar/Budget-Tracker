import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Pending invites addressed to the user's email
export const useIncomingInvites = (email) => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setInvites([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'invites'),
      where('invitedEmail', '==', email.toLowerCase()),
      where('status', '==', 'pending'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('[useIncomingInvites] snapshot error:', error);
        setInvites([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [email]);

  return { invites, loading };
};

// Pending invites for a given household (so owner can see them)
export const useHouseholdInvites = (workspaceId, enabled = true) => {
  const [invites, setInvites] = useState([]);
  useEffect(() => {
    if (!workspaceId || !enabled) {
      setInvites([]);
      return;
    }
    const q = query(
      collection(db, 'invites'),
      where('householdId', '==', workspaceId),
      where('status', '==', 'pending'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('[useHouseholdInvites] snapshot error:', error);
        setInvites([]);
      },
    );
    return unsub;
  }, [workspaceId, enabled]);
  return invites;
};
