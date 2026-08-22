import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppUserProfile, UserRole } from '../types';

const COL = 'users';

export async function getUserProfile(uid: string): Promise<AppUserProfile | null> {
  try {
    // Tenta buscar direto do servidor (ignora cache)
    const snap = await getDocFromServer(doc(db, COL, uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as AppUserProfile;
  } catch {
    // Fallback para cache local se servidor falhar (ex: regras, offline)
    const snap = await getDoc(doc(db, COL, uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as AppUserProfile;
  }
}

export async function createUserProfile(
  uid: string,
  data: Omit<AppUserProfile, 'uid' | 'createdAt'>
): Promise<void> {
  await setDoc(doc(db, COL, uid), {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<AppUserProfile, 'uid'>>
): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await updateDoc(doc(db, COL, uid), clean);
}

// Sem orderBy no Firestore: a cláusula exclui documentos sem o campo 'name',
// o que ocultava usuários recém-cadastrados que ainda não completaram o perfil
const byName = (a: AppUserProfile, b: AppUserProfile) =>
  (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR');

export async function getUsersByRole(role: UserRole): Promise<AppUserProfile[]> {
  const q = query(collection(db, COL), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUserProfile)).sort(byName);
}

export async function getAllUsers(): Promise<AppUserProfile[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUserProfile)).sort(byName);
}

export async function unlinkMemberFromUser(uid: string): Promise<void> {
  const { deleteField } = await import('firebase/firestore');
  await updateDoc(doc(db, COL, uid), { memberId: deleteField() });
}
