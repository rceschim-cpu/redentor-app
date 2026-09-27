import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { GroupRequest, GroupRequestStatus, ProposedGroup } from '../types';
import { createGroup } from './groups';
import { getUserProfile, updateUserProfile } from './userProfile';

const COL = 'group_requests';

// Sem orderBy: a cláusula exclui documentos que não têm o campo
const byNewest = (a: GroupRequest, b: GroupRequest) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

const mapDocs = (docs: any[]): GroupRequest[] =>
  docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<GroupRequest, 'id'>) }))
    .sort(byNewest);

export async function getGroupRequests(): Promise<GroupRequest[]> {
  const snap = await getDocs(collection(db, COL));
  return mapDocs(snap.docs);
}

export async function getPendingGroupRequests(): Promise<GroupRequest[]> {
  const snap = await getDocs(query(collection(db, COL), where('status', '==', 'pendente')));
  return mapDocs(snap.docs);
}

export async function getMyGroupRequests(uid: string): Promise<GroupRequest[]> {
  const snap = await getDocs(query(collection(db, COL), where('uid', '==', uid)));
  return mapDocs(snap.docs);
}

/** Já existe pedido em aberto? Evita fila de pedidos duplicados. */
export async function hasPendingGroupRequest(uid: string): Promise<boolean> {
  const mine = await getMyGroupRequests(uid);
  return mine.some((r) => r.status === 'pendente');
}

export async function createGroupRequest(data: {
  uid: string;
  userName: string;
  userEmail: string;
  group: ProposedGroup;
  justification?: string;
}): Promise<string> {
  if (await hasPendingGroupRequest(data.uid)) {
    throw new Error('Você já tem uma solicitação de grupo aguardando análise.');
  }
  const payload: Record<string, unknown> = {
    uid: data.uid,
    userName: data.userName,
    userEmail: data.userEmail,
    group: data.group,
    status: 'pendente' as GroupRequestStatus,
    createdAt: new Date().toISOString(),
  };
  if (data.justification?.trim()) payload.justification = data.justification.trim();

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

/**
 * Aprova o pedido: cria o grupo de verdade com quem pediu como líder.
 *
 * A criação do grupo vem primeiro — se falhar, o pedido continua pendente em
 * vez de ficar marcado como aprovado sem o grupo existir.
 *
 * Quem pediu também é promovido a 'lider' quando ainda é 'membro': sem isso a
 * pessoa lideraria um grupo que não tem permissão de editar.
 */
export async function approveGroupRequest(
  requestId: string,
  resolvedBy: string,
  resolvedByName: string
): Promise<string> {
  const snap = await getDoc(doc(db, COL, requestId));
  if (!snap.exists()) throw new Error('Solicitação não encontrada.');
  const req = snap.data() as Omit<GroupRequest, 'id'>;
  if (req.status !== 'pendente') throw new Error('Esta solicitação já foi resolvida.');

  const groupId = await createGroup(
    { ...req.group, leaderId: req.uid, leaderName: req.userName } as any,
    resolvedBy
  );

  // Promove a líder para que consiga administrar o próprio grupo
  try {
    const profile = await getUserProfile(req.uid);
    if (profile?.role === 'membro') {
      await updateUserProfile(req.uid, { role: 'lider' });
    }
  } catch {
    // O grupo já existe; a promoção pode ser feita à mão em Usuários
  }

  await updateDoc(doc(db, COL, requestId), {
    status: 'aprovado' as GroupRequestStatus,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolvedByName,
    createdGroupId: groupId,
  });

  return groupId;
}

export async function rejectGroupRequest(
  requestId: string,
  resolvedBy: string,
  resolvedByName: string,
  decisionReason: string
): Promise<void> {
  await updateDoc(doc(db, COL, requestId), {
    status: 'recusado' as GroupRequestStatus,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolvedByName,
    decisionReason,
  });
}

/** Cancelar o próprio pedido enquanto ainda está pendente. */
export async function cancelGroupRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, COL, requestId));
}
