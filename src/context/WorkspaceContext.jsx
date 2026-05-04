import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('activeWorkspaceId')
      : null,
  );
  const [loading, setLoading] = useState(true);

  // Listen to workspaces where the current user is a member
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'workspaces'),
      where('memberIds', 'array-contains', user.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Personal first, then joint
        list.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'personal' ? -1 : 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setWorkspaces(list);
        setLoading(false);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('[WorkspaceContext] onSnapshot failed:', error);
        setWorkspaces([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  // Default to personal workspace if nothing selected or selection invalid
  useEffect(() => {
    if (workspaces.length === 0) return;
    const valid = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!valid) {
      const personal = workspaces.find((w) => w.type === 'personal');
      const next = personal || workspaces[0];
      setActiveWorkspaceId(next.id);
      localStorage.setItem('activeWorkspaceId', next.id);
    }
  }, [workspaces, activeWorkspaceId]);

  const setActiveWorkspace = (id) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('activeWorkspaceId', id);
  };

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId],
  );

  const personalWorkspace = useMemo(
    () => workspaces.find((w) => w.type === 'personal') || null,
    [workspaces],
  );

  const jointWorkspaces = useMemo(
    () => workspaces.filter((w) => w.type === 'joint'),
    [workspaces],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId: activeWorkspace?.id || null,
        setActiveWorkspace,
        personalWorkspace,
        jointWorkspaces,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
