import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  writeBatch,
  limit,
  increment,
} from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
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
  // Bloqueia duplicata: não permite entrar num grupo em que já é membro ou tem solicitação pendente
  const existing = await getUserMembership(groupId, userId);
  if (existing) {
    if (existing.status === 'aprovado') throw new Error('Você já é membro deste grupo.');
    if (existing.status === 'pendente') throw new Error('Você já tem uma solicitação pendente para este grupo.');
  }

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
  resolvedBy: string,
  memberUserId?: string
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

  // Se aprovado, atualiza groupId no documento do membro
  if (status === 'aprovado' && memberUserId) {
    try {
      const userSnap = await getDoc(doc(db, 'users', memberUserId));
      if (userSnap.exists()) {
        const memberId = userSnap.data().memberId as string | undefined;
        if (memberId) {
          await updateDoc(doc(db, 'members', memberId), { groupId });
        }
      }
    } catch {
      // Não-crítico: não falha a operação principal
    }
  }
}

export async function removeMember(
  groupId: string,
  membershipId: string,
  memberUserId?: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, MEMBERSHIPS(groupId), membershipId));
  batch.update(doc(db, 'groups', groupId), { memberCount: increment(-1) });
  await batch.commit();

  // Remove groupId do documento do membro se o userId foi fornecido
  if (memberUserId) {
    try {
      const userSnap = await getDoc(doc(db, 'users', memberUserId));
      if (userSnap.exists()) {
        const memberId = userSnap.data().memberId as string | undefined;
        if (memberId) {
          const { deleteField } = await import('firebase/firestore');
          await updateDoc(doc(db, 'members', memberId), { groupId: deleteField() });
        }
      }
    } catch { /* não-crítico */ }
  }
}

/**
 * Transfere um membro aprovado de um grupo para outro diretamente (ação de líder/admin).
 * O membro entra como aprovado no grupo destino sem precisar de solicitação.
 */
export async function transferMember(
  fromGroupId: string,
  membershipId: string,
  userId: string,
  userName: string,
  userEmail: string,
  toGroupId: string
): Promise<void> {
  // Bloqueia se já existe membership ativa no grupo destino
  const existing = await getUserMembership(toGroupId, userId);
  if (existing && existing.status !== 'rejeitado') {
    throw new Error('Este membro já pertence ao grupo de destino.');
  }

  const batch = writeBatch(db);

  // Remove do grupo atual
  batch.delete(doc(db, MEMBERSHIPS(fromGroupId), membershipId));
  batch.update(doc(db, 'groups', fromGroupId), { memberCount: increment(-1) });

  // Adiciona diretamente como aprovado no grupo destino
  const newMembershipRef = doc(collection(db, MEMBERSHIPS(toGroupId)));
  batch.set(newMembershipRef, {
    groupId: toGroupId,
    userId,
    userName,
    userEmail,
    status: 'aprovado',
    requestedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
  });
  batch.update(doc(db, 'groups', toGroupId), { memberCount: increment(1) });

  await batch.commit();

  // Atualiza groupId no documento do membro
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      const memberId = userSnap.data().memberId as string | undefined;
      if (memberId) {
        await updateDoc(doc(db, 'members', memberId), { groupId: toGroupId });
      }
    }
  } catch { /* não-crítico */ }
}
