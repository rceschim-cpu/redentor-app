import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { RoleRequest, RoleRequestStatus, UserRole } from '../types';
import { updateUserProfile } from './userProfile';

const COL = 'role_requests';

// Sem orderBy: a cláusula exclui documentos que não têm o campo
const byNewest = (a: RoleRequest, b: RoleRequest) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

export async function getRoleRequests(): Promise<RoleRequest[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RoleRequest, 'id'>) }))
    .sort(byNewest);
}

export async function getPendingRoleRequests(): Promise<RoleRequest[]> {
  const q = query(collection(db, COL), where('status', '==', 'pendente'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RoleRequest, 'id'>) }))
    .sort(byNewest);
}

export async function getMyRoleRequests(uid: string): Promise<RoleRequest[]> {
  const q = query(collection(db, COL), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RoleRequest, 'id'>) }))
    .sort(byNewest);
}

/** Já existe pedido em aberto? Evita fila de pedidos duplicados. */
export async function hasPendingRequest(uid: string): Promise<boolean> {
  const mine = await getMyRoleRequests(uid);
  return mine.some((r) => r.status === 'pendente');
}

export async function createRoleRequest(data: {
  uid: string;
  userName: string;
  userEmail: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  justification: string;
}): Promise<string> {
  if (await hasPendingRequest(data.uid)) {
    throw new Error('Você já tem uma solicitação aguardando análise.');
  }
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: 'pendente' as RoleRequestStatus,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

/**
 * Aprova o pedido e aplica o novo perfil no usuário.
 *
 * A gravação do perfil vem primeiro: se ela falhar, o pedido continua
 * pendente em vez de ficar marcado como aprovado sem ter surtido efeito.
 */
export async function approveRoleRequest(
  requestId: string,
  resolvedBy: string,
  resolvedByName: string
): Promise<void> {
  const snap = await getDoc(doc(db, COL, requestId));
  if (!snap.exists()) throw new Error('Solicitação não encontrada.');
  const req = snap.data() as Omit<RoleRequest, 'id'>;
  if (req.status !== 'pendente') throw new Error('Esta solicitação já foi resolvida.');

  await updateUserProfile(req.uid, { role: req.requestedRole });
  await updateDoc(doc(db, COL, requestId), {
    status: 'aprovado' as RoleRequestStatus,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolvedByName,
  });
}

export async function rejectRoleRequest(
  requestId: string,
  resolvedBy: string,
  resolvedByName: string,
  decisionReason: string
): Promise<void> {
  await updateDoc(doc(db, COL, requestId), {
    status: 'recusado' as RoleRequestStatus,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolvedByName,
    decisionReason,
  });
}
