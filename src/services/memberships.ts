import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  writeBatch,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { GroupMembership, MembershipStatus } from '../types';

const MEMBERSHIPS = (groupId: string) => `groups/${groupId}/memberships`;

export async function getMemberships(groupId: string): Promise<GroupMembership[]> {
  const q = query(
    collection(db, MEMBERSHIPS(groupId)),
    where('status', '==', 'aprovado')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as GroupMembership))
    .sort((a, b) => a.userName.localeCompare(b.userName));
}

export async function getPendingRequests(groupId: string): Promise<GroupMembership[]> {
  const q = query(
    collection(db, MEMBERSHIPS(groupId)),
    where('status', '==', 'pendente')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as GroupMembership))
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

export async function getUserMembership(
  groupId: string,
  userId: string
): Promise<GroupMembership | null> {
  const q = query(
    collection(db, MEMBERSHIPS(groupId)),
    where('userId', '==', userId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as GroupMembership;
}

export async function requestToJoin(
  groupId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<string> {
  const ref = await addDoc(collection(db, MEMBERSHIPS(groupId)), {
    groupId,
    userId,
    userName,
    userEmail,
    status: 'pendente' as MembershipStatus,
    requestedAt: new Date().toISOString(),
  });
  // Incrementa pendingCount no grupo
  await updateDoc(doc(db, 'groups', groupId), {
    pendingCount: increment(1),
  });
  return ref.id;
}

export async function respondToRequest(
  groupId: string,
  membershipId: string,
  status: 'aprovado' | 'rejeitado',
  resolvedBy: string
): Promise<void> {
  const batch = writeBatch(db);
  const membershipRef = doc(db, MEMBERSHIPS(groupId), membershipId);
  const groupRef = doc(db, 'groups', groupId);
  batch.update(membershipRef, {
    status,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
  });

  // Ajusta contadores: -1 pendente, +1 membro se aprovado
  if (status === 'aprovado') {
    batch.update(groupRef, {
      pendingCount: increment(-1),
      memberCount: increment(1),
    });
  } else {
    batch.update(groupRef, { pendingCount: increment(-1) });
  }

  await batch.commit();
}

export async function removeMember(
  groupId: string,
  membershipId: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, MEMBERSHIPS(groupId), membershipId), { status: 'rejeitado' });
  batch.update(doc(db, 'groups', groupId), { memberCount: increment(-1) });
  await batch.commit();
}
