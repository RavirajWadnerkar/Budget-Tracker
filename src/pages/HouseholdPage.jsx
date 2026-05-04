import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Mail,
  Crown,
  X,
  LogOut,
  Pencil,
  Check,
  Inbox,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  createJointHousehold,
  createInvite,
  cancelInvite,
  acceptInvite,
  rejectInvite,
  removeMember,
  leaveHousehold,
  renameHousehold,
  getMembersInfo,
} from '../services/workspaces';
import { useIncomingInvites, useHouseholdInvites } from '../hooks/useInvites';

import Avatar from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { EmptyState, Spinner } from '../components/States';
import { formatRelativeTime } from '../utils/format';

const HouseholdPage = () => {
  const { user } = useAuth();
  const {
    jointWorkspaces,
    activeWorkspace,
    setActiveWorkspace,
  } = useWorkspace();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected joint household (defaults to active if it's joint, else first joint)
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (activeWorkspace?.type === 'joint') {
      setSelectedId(activeWorkspace.id);
    } else if (jointWorkspaces.length > 0 && !selectedId) {
      setSelectedId(jointWorkspaces[0].id);
    } else if (jointWorkspaces.length === 0) {
      setSelectedId(null);
    }
  }, [activeWorkspace, jointWorkspaces, selectedId]);

  const selected = jointWorkspaces.find((w) => w.id === selectedId) || null;

  const { invites: incomingInvites } = useIncomingInvites(user?.email);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createJointHousehold(user, newName.trim());
      toast.success('Household created');
      setNewName('');
      setCreateOpen(false);
      setActiveWorkspace(id);
      setSelectedId(id);
    } catch (err) {
      toast.error(err.message || 'Could not create household');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-2">
            Collaboration
          </p>
          <h1 className="font-display text-3xl tracking-tight">Household</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Share a budget and expenses with another person.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary self-start sm:self-auto"
        >
          <Plus size={16} />
          New household
        </button>
      </div>

      {/* Incoming invites */}
      {incomingInvites.length > 0 && (
        <section className="card p-5 border-accent-200 dark:border-accent-900/40 bg-accent-50/40 dark:bg-accent-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Inbox size={16} className="text-accent-600 dark:text-accent-400" />
            <h2 className="font-display text-lg">
              Pending invitations ({incomingInvites.length})
            </h2>
          </div>
          <div className="space-y-2">
            {incomingInvites.map((inv) => (
              <IncomingInviteRow
                key={inv.id}
                invite={inv}
                user={user}
                onAfterAccept={(id) => {
                  setActiveWorkspace(id);
                  setSelectedId(id);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* No households yet */}
      {jointWorkspaces.length === 0 && incomingInvites.length === 0 && (
        <div className="card p-10">
          <EmptyState
            icon={Users}
            title="No household yet"
            description="Start a joint household to track shared rent, groceries, and bills with another person."
            action={
              <button
                onClick={() => setCreateOpen(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Create a household
              </button>
            }
          />
        </div>
      )}

      {/* Households list + selected detail */}
      {jointWorkspaces.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Households list */}
          <aside className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-500 px-1">
              Your households
            </p>
            {jointWorkspaces.map((w) => {
              const isOwner = w.ownerId === user?.uid;
              const isActive = w.id === selectedId;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className={
                    'w-full text-left card p-4 transition ' +
                    (isActive
                      ? 'ring-2 ring-accent-500/40 border-accent-300 dark:border-accent-700'
                      : 'hover:border-ink-300 dark:hover:border-ink-700')
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{w.name}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                        {w.memberIds?.length || 0} member
                        {(w.memberIds?.length || 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    {isOwner && (
                      <span className="badge !text-[10px] !px-1.5 !py-0.5 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
                        <Crown size={10} />
                        Owner
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Selected detail */}
          <div className="min-w-0">
            {selected ? (
              <HouseholdDetail
                key={selected.id}
                household={selected}
                user={user}
                onLeft={() => setSelectedId(null)}
              />
            ) : (
              <div className="card p-10">
                <EmptyState
                  icon={Users}
                  title="Select a household"
                  description="Pick one from the left to manage members."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create household modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a household"
        description="Pick a name for your shared budget. You can rename it later."
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Household name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. The Sunset House"
              className="input"
              autoFocus
              maxLength={60}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="btn btn-primary"
            >
              {creating ? <Spinner size={14} /> : <Plus size={14} />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Incoming invite row
// ──────────────────────────────────────────────────────────────────────
const IncomingInviteRow = ({ invite, user, onAfterAccept }) => {
  const [busy, setBusy] = useState(false);

  const handleAccept = async () => {
    setBusy(true);
    try {
      const householdId = await acceptInvite(invite.id, user);
      toast.success(`Joined ${invite.householdName || 'household'}`);
      onAfterAccept?.(householdId);
    } catch (err) {
      toast.error(err.message || 'Could not accept');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await rejectInvite(invite.id);
      toast.success('Invite declined');
    } catch (err) {
      toast.error(err.message || 'Could not decline');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-white dark:bg-ink-900 border border-ink-200/60 dark:border-ink-800"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">
          {invite.householdName || 'A household'}
        </p>
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
          Invited by {invite.invitedByName || 'someone'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReject}
          disabled={busy}
          className="btn btn-ghost"
        >
          <X size={14} />
          Decline
        </button>
        <button
          onClick={handleAccept}
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? <Spinner size={14} /> : <Check size={14} />}
          Accept
        </button>
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Household detail (members, invites, settings)
// ──────────────────────────────────────────────────────────────────────
const HouseholdDetail = ({ household, user, onLeft }) => {
  const isOwner = household.ownerId === user?.uid;
  const householdInvites = useHouseholdInvites(household.id, isOwner);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Rename
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(household.name);

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Confirm modals
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    let active = true;
    setMembersLoading(true);
    getMembersInfo(household.memberIds || []).then((list) => {
      if (active) {
        setMembers(list);
        setMembersLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [household.id, household.memberIds?.join(',')]); // eslint-disable-line

  useEffect(() => {
    setRenameValue(household.name);
    setRenaming(false);
  }, [household.id, household.name]);

  const handleRename = async () => {
    const next = renameValue.trim();
    if (!next || next === household.name) {
      setRenaming(false);
      return;
    }
    try {
      await renameHousehold(household.id, next, user);
      toast.success('Renamed');
      setRenaming(false);
    } catch (err) {
      toast.error(err.message || 'Could not rename');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (email === user.email?.toLowerCase()) {
      toast.error("You can't invite yourself");
      return;
    }
    if (
      members.some((m) => (m.email || '').toLowerCase() === email)
    ) {
      toast.error('Already a member');
      return;
    }
    if (
      householdInvites.some(
        (i) => (i.invitedEmail || '').toLowerCase() === email,
      )
    ) {
      toast.error('Invite already pending for this email');
      return;
    }
    setInviting(true);
    try {
      await createInvite(household.id, household.name, email, user);
      toast.success(`Invite sent to ${email}`);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.message || 'Could not send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setBusyAction(true);
    try {
      await removeMember(household.id, memberToRemove.id, user);
      toast.success('Member removed');
      setMemberToRemove(null);
    } catch (err) {
      toast.error(err.message || 'Could not remove member');
    } finally {
      setBusyAction(false);
    }
  };

  const handleLeave = async () => {
    setBusyAction(true);
    try {
      await leaveHousehold(household.id, user);
      toast.success(`Left ${household.name}`);
      setConfirmLeave(false);
      onLeft?.();
    } catch (err) {
      toast.error(err.message || 'Could not leave');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await cancelInvite(inviteId);
      toast.success('Invite cancelled');
    } catch (err) {
      toast.error(err.message || 'Could not cancel invite');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title row + rename */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-ink-400 dark:text-ink-500 mb-2">
              Household
            </p>
            {renaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="input font-display !text-2xl !py-1.5"
                  autoFocus
                  maxLength={60}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setRenameValue(household.name);
                      setRenaming(false);
                    }
                  }}
                />
                <button onClick={handleRename} className="btn-ghost !px-2.5">
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setRenameValue(household.name);
                    setRenaming(false);
                  }}
                  className="btn-ghost !px-2.5"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl tracking-tight truncate">
                  {household.name}
                </h2>
                {isOwner && (
                  <button
                    onClick={() => setRenaming(true)}
                    className="btn-ghost !px-2 !py-1 text-ink-500"
                    aria-label="Rename household"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
              {members.length} {members.length === 1 ? 'member' : 'members'}
              {householdInvites.length > 0 &&
                ` · ${householdInvites.length} pending`}
            </p>
          </div>
          {!isOwner && (
            <button
              onClick={() => setConfirmLeave(true)}
              className="btn btn-ghost text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 self-start"
            >
              <LogOut size={14} />
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Invite form (owner only) */}
      {isOwner && (
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={16} className="text-ink-500" />
            <h3 className="font-display text-lg">Invite a member</h3>
          </div>
          <form
            onSubmit={handleInvite}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="partner@example.com"
              className="input flex-1"
              required
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="btn btn-primary"
            >
              {inviting ? <Spinner size={14} /> : <Mail size={14} />}
              Send invite
            </button>
          </form>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
            They'll see the invite next time they sign in with this email.
          </p>
        </section>
      )}

      {/* Members */}
      <section className="card p-6">
        <h3 className="font-display text-lg mb-4">Members</h3>
        {membersLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <ul className="divide-y divide-ink-200/60 dark:divide-ink-800">
            {members.map((m) => {
              const memberIsOwner = m.id === household.ownerId;
              const isSelf = m.id === user?.uid;
              const name = m.displayName || m.email || 'Unknown';
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={name} size="md" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {name}
                        {isSelf && (
                          <span className="text-ink-500 dark:text-ink-400 font-normal">
                            {' '}
                            (you)
                          </span>
                        )}
                      </p>
                      {m.email && (
                        <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                          {m.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {memberIsOwner ? (
                      <span className="badge bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
                        <Crown size={10} />
                        Owner
                      </span>
                    ) : (
                      <span className="badge">Member</span>
                    )}
                    {isOwner && !memberIsOwner && (
                      <button
                        onClick={() => setMemberToRemove(m)}
                        className="btn-ghost !px-2 !py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        aria-label={`Remove ${name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Pending invites (owner-visible) */}
      {isOwner && (
        <section className="card p-6">
          <h3 className="font-display text-lg mb-4">Pending invites</h3>
          {householdInvites.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-400">
              No invites pending.
            </p>
          ) : (
            <ul className="divide-y divide-ink-200/60 dark:divide-ink-800">
              <AnimatePresence initial={false}>
                {householdInvites.map((inv) => (
                  <motion.li
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {inv.invitedEmail}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        Sent {formatRelativeTime(inv.createdAt) || 'recently'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="btn-ghost !px-2 !py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      aria-label="Cancel invite"
                    >
                      <X size={14} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      )}

      {/* Confirm modals */}
      <ConfirmModal
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove member?"
        description={`${
          memberToRemove?.displayName || memberToRemove?.email || 'This person'
        } will lose access to this household's expenses and budget.`}
        confirmLabel="Remove"
        destructive
        loading={busyAction}
      />
      <ConfirmModal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={handleLeave}
        title={`Leave ${household.name}?`}
        description="You'll lose access to this household's shared expenses and budget. The owner can invite you back later."
        confirmLabel="Leave household"
        destructive
        loading={busyAction}
      />
    </div>
  );
};

export default HouseholdPage;
