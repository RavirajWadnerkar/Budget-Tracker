import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity } from './activity';

// Make sure each user has a personal workspace doc on first auth
export const ensurePersonalWorkspace = async (user, displayName) => {
  if (!user) return null;
  const q = query(
    collection(db, 'workspaces'),
    where('ownerId', '==', user.uid),
    where('type', '==', 'personal'),
  );
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

  const name =
    (displayName || user.displayName || user.email?.split('@')[0] || 'My') +
    ' (Personal)';
  const ref = await addDoc(collection(db, 'workspaces'), {
    name,
    type: 'personal',
    ownerId: user.uid,
    memberIds: [user.uid],
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name, type: 'personal', ownerId: user.uid };
};

// Create a joint household; the creator becomes the owner.
export const createJointHousehold = async (user, name) => {
  if (!user) throw new Error('Not signed in');
  const ref = await addDoc(collection(db, 'workspaces'), {
    name: name || 'Our Household',
    type: 'joint',
    ownerId: user.uid,
    memberIds: [user.uid],
    createdAt: serverTimestamp(),
  });
  await logActivity(ref.id, {
    action: 'household_created',
    userId: user.uid,
    userName: user.displayName || user.email,
    detail: name,
  });
  return ref.id;
};

export const renameHousehold = async (workspaceId, name, user) => {
  await updateDoc(doc(db, 'workspaces', workspaceId), { name });
  await logActivity(workspaceId, {
    action: 'household_renamed',
    userId: user.uid,
    userName: user.displayName || user.email,
    detail: name,
  });
};

export const removeMember = async (workspaceId, memberId, actor) => {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    memberIds: arrayRemove(memberId),
  });
  await logActivity(workspaceId, {
    action: 'member_removed',
    userId: actor.uid,
    userName: actor.displayName || actor.email,
    detail: memberId,
  });
};

export const leaveHousehold = async (workspaceId, user) => {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    memberIds: arrayRemove(user.uid),
  });
  await logActivity(workspaceId, {
    action: 'member_left',
    userId: user.uid,
    userName: user.displayName || user.email,
  });
};

export const deleteHousehold = async (workspaceId) => {
  // Note: in production you'd cascade-delete subcollections via a Cloud Function.
  await deleteDoc(doc(db, 'workspaces', workspaceId));
};

// === Invites ===
export const createInvite = async (workspaceId, workspaceName, email, user) => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error('Email required');
  const ref = await addDoc(collection(db, 'invites'), {
    householdId: workspaceId,
    householdName: workspaceName,
    invitedEmail: trimmed,
    invitedByUserId: user.uid,
    invitedByName: user.displayName || user.email,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await logActivity(workspaceId, {
    action: 'member_invited',
    userId: user.uid,
    userName: user.displayName || user.email,
    detail: trimmed,
  });
  return ref.id;
};

export const cancelInvite = async (inviteId) => {
  await deleteDoc(doc(db, 'invites', inviteId));
};

export const acceptInvite = async (inviteId, user) => {
  const inviteRef = doc(db, 'invites', inviteId);
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error('Invite not found');
  const invite = snap.data();
  if (invite.invitedEmail !== user.email?.toLowerCase()) {
    throw new Error('This invite was sent to a different email.');
  }
  if (invite.status !== 'pending') throw new Error('Invite already handled.');

  await updateDoc(doc(db, 'workspaces', invite.householdId), {
    memberIds: arrayUnion(user.uid),
  });
  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    acceptedByUserId: user.uid,
  });
  await logActivity(invite.householdId, {
    action: 'member_joined',
    userId: user.uid,
    userName: user.displayName || user.email,
  });
  return invite.householdId;
};

export const rejectInvite = async (inviteId) => {
  await updateDoc(doc(db, 'invites', inviteId), {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  });
};

export const getMembersInfo = async (memberIds = []) => {
  const results = [];
  for (const id of memberIds) {
    const snap = await getDoc(doc(db, 'users', id));
    if (snap.exists()) {
      results.push({ id, ...snap.data() });
    } else {
      results.push({ id, displayName: 'Unknown', email: '' });
    }
  }
  return results;
};
