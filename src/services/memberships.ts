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
import { sendNotification } from './notifications';

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

/** Pedidos que o líder precisa aprovar. Convites não entram: quem responde a eles é o convidado. */
export async function getPendingRequests(groupId: string): Promise<GroupMembership[]> {
  const q = query(
    collection(db, MEMBERSHIPS(groupId)),
    where('status', '==', 'pendente')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as GroupMembership))
    .filter((m) => m.origin !== 'convite')
    .sort((a, b) => (a.requestedAt ?? '').localeCompare(b.requestedAt ?? ''));
}

/** Convites já enviados e ainda sem resposta — mostrados ao líder como "aguardando". */
export async function getPendingInvites(groupId: string): Promise<GroupMembership[]> {
  const q = query(
    collection(db, MEMBERSHIPS(groupId)),
    where('status', '==', 'pendente')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as GroupMembership))
    .filter((m) => m.origin === 'convite')
    .sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? '', 'pt-BR'));
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

  // Notify the group leader
  try {
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    if (groupSnap.exists()) {
      const groupData = groupSnap.data();
      const leaderId = groupData.leaderId as string | undefined;
      const groupName = groupData.name as string | undefined;
      if (leaderId) {
        const { sendNotification } = await import('./notifications');
        await sendNotification(
          leaderId,
          'Nova solicitação de ingresso',
          `${userName} quer entrar no grupo "${groupName ?? ''}"`,
          'join_request',
          { groupId, groupName }
        );
      }
    }
  } catch {
    // Non-critical
  }

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


// ─── Convites: o líder chama, a pessoa decide ─────────────────────────────────
//
// O caminho inverso do pedido. O vínculo nasce 'pendente' com origin 'convite'
// e só vira 'aprovado' quando o convidado aceita — ninguém entra num grupo sem
// ter dito sim.
//
// pendingCount NÃO é tocado aqui: esse contador conta o que o líder precisa
// resolver, e um convite espera pelo convidado, não por ele.

export async function inviteToGroup(
  groupId: string,
  groupName: string,
  target: { userId: string; userName: string; userEmail: string },
  invitedBy: string,
  invitedByName: string
): Promise<string> {
  const existing = await getUserMembership(groupId, target.userId);
  if (existing) {
    if (existing.status === 'aprovado') throw new Error(`${target.userName} já está neste grupo.`);
    if (existing.status === 'pendente') {
      throw new Error(
        existing.origin === 'convite'
          ? `${target.userName} já tem um convite deste grupo aguardando resposta.`
          : `${target.userName} já pediu para entrar neste grupo — aprove a solicitação.`
      );
    }
  }

  const ref = await addDoc(collection(db, MEMBERSHIPS(groupId)), {
    groupId,
    groupName,
    userId: target.userId,
    userName: target.userName,
    userEmail: target.userEmail,
    status: 'pendente' as MembershipStatus,
    origin: 'convite',
    invitedBy,
    invitedByName,
    requestedAt: new Date().toISOString(),
  });

  // Best-effort: o convite já existe e aparece no app mesmo sem a notificação
  try {
    await sendNotification(
      target.userId,
      'Convite para um pequeno grupo',
      `${invitedByName} convidou você para o grupo ${groupName}.`,
      'group_invite',
      { groupId, groupName, membershipId: ref.id }
    );
  } catch {
    // silencioso
  }

  return ref.id;
}

/**
 * Convites pendentes de uma pessoa, em todos os grupos.
 *
 * Varredura linear pelos grupos: a comunidade tem poucas dezenas deles, e uma
 * consulta por collection group exigiria um índice composto no Firestore.
 */
export async function getMyInvites(userId: string): Promise<GroupMembership[]> {
  const groupsSnap = await getDocs(collection(db, 'groups'));
  const found: GroupMembership[] = [];

  await Promise.all(
    groupsSnap.docs.map(async (g) => {
      try {
        const q = query(
          collection(db, MEMBERSHIPS(g.id)),
          where('userId', '==', userId),
          where('status', '==', 'pendente')
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          const m = { id: d.id, ...d.data() } as GroupMembership;
          if (m.origin === 'convite') {
            found.push({ ...m, groupId: g.id, groupName: m.groupName ?? g.data().name });
          }
        });
      } catch {
        // um grupo ilegível não derruba os demais
      }
    })
  );

  return found.sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''));
}

export async function acceptInvite(
  groupId: string,
  membershipId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, MEMBERSHIPS(groupId), membershipId), {
    status: 'aprovado' as MembershipStatus,
    resolvedAt: new Date().toISOString(),
    resolvedBy: userId,
  });
  batch.update(doc(db, 'groups', groupId), { memberCount: increment(1) });
  await batch.commit();

  // Espelha o vínculo no cadastro de membro, como faz a aprovação de pedido
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      const memberId = userSnap.data().memberId as string | undefined;
      if (memberId) await updateDoc(doc(db, 'members', memberId), { groupId });
    }
  } catch {
    // não-crítico
  }
}

/** Recusar apaga o convite: sem registro pendente, o líder pode convidar de novo. */
export async function declineInvite(groupId: string, membershipId: string): Promise<void> {
  await deleteDoc(doc(db, MEMBERSHIPS(groupId), membershipId));
}

/** O líder desiste de um convite ainda sem resposta. */
export async function cancelInvite(groupId: string, membershipId: string): Promise<void> {
  await deleteDoc(doc(db, MEMBERSHIPS(groupId), membershipId));
}
