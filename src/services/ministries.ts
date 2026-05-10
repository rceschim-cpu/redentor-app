import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, addDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Ministry, MinistryMembership, MinistryType } from '../types';

const COL = 'ministries';

// ─── Ministérios ──────────────────────────────────────────────────────────────
export async function getMinistries(): Promise<Ministry[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ministry, 'id'>) }));
}

export async function getMinistry(id: string): Promise<Ministry | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Ministry, 'id'>) }) : null;
}

export async function createMinistry(
  data: Omit<Ministry, 'id' | 'createdAt' | 'memberCount'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    memberCount: 0,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateMinistry(
  id: string,
  patch: Partial<Omit<Ministry, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), patch as any);
}

export async function deleteMinistry(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// ─── Membros (subcoleção memberships) ─────────────────────────────────────────
export async function getMinistryMemberships(ministryId: string): Promise<MinistryMembership[]> {
  const snap = await getDocs(collection(db, COL, ministryId, 'memberships'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MinistryMembership, 'id'>) }));
}

export async function getMembershipsByMember(memberId: string): Promise<MinistryMembership[]> {
  // Busca por todas as ministries onde o memberId é membro
  // (Firestore não tem collection group sem index — fazemos um varredura linear pelos ministérios)
  const ministries = await getMinistries();
  const all: MinistryMembership[] = [];
  await Promise.all(
    ministries.map(async (m) => {
      const snap = await getDoc(doc(db, COL, m.id, 'memberships', memberId));
      if (snap.exists()) {
        all.push({ id: snap.id, ...(snap.data() as Omit<MinistryMembership, 'id'>) });
      }
    })
  );
  return all;
}

export async function joinMinistry(
  ministryId: string,
  memberId: string,
  memberName: string,
  termVersion: number
): Promise<void> {
  const now = new Date().toISOString();
  const membership: Omit<MinistryMembership, 'id'> = {
    ministryId,
    memberId,
    memberName,
    joinedAt: now,
    termVersion,
    termAcceptedAt: now,
    status: 'ativo',
    role: 'voluntario',
  };
  await setDoc(doc(db, COL, ministryId, 'memberships', memberId), membership);
  // Incrementa contador no ministério
  const ministry = await getMinistry(ministryId);
  if (ministry) {
    await updateDoc(doc(db, COL, ministryId), {
      memberCount: (ministry.memberCount ?? 0) + 1,
    });
  }
}

export async function leaveMinistry(ministryId: string, memberId: string): Promise<void> {
  await deleteDoc(doc(db, COL, ministryId, 'memberships', memberId));
  const ministry = await getMinistry(ministryId);
  if (ministry) {
    await updateDoc(doc(db, COL, ministryId), {
      memberCount: Math.max(0, (ministry.memberCount ?? 0) - 1),
    });
  }
}

// ─── Liderança ────────────────────────────────────────────────────────────────
export async function setLeaders(
  ministryId: string,
  leaderIds: string[],
  leaderNames: string[]
): Promise<void> {
  await updateDoc(doc(db, COL, ministryId), { leaderIds, leaderNames });
}

// ─── Seed inicial (chamado uma vez para popular ministérios padrão) ──────────
const DEFAULT_MINISTRIES: Array<Omit<Ministry, 'id' | 'createdAt' | 'memberCount'>> = [
  { name: 'Louvor',         type: 'louvor',       leaderIds: [], status: 'ativo', description: 'Equipe de música e adoração nos cultos.' },
  { name: 'Cultos',         type: 'cultos',       leaderIds: [], status: 'ativo', description: 'Apoio à condução dos cultos (multimídia, som, transmissão).' },
  { name: 'Recepção',       type: 'recepcao',     leaderIds: [], status: 'ativo', description: 'Acolhimento de membros e visitantes na entrada do templo.' },
  { name: 'Núcleo de PGs',  type: 'pgs',          leaderIds: [], status: 'ativo', description: 'Coordenação e apoio aos pequenos grupos.' },
  { name: 'Jovens',         type: 'jovens',       leaderIds: [], status: 'ativo', description: 'Ministério para jovens (a partir de 18 anos).' },
  { name: 'Adolescentes',   type: 'adolescentes', leaderIds: [], status: 'ativo', description: 'Ministério para adolescentes (12–17 anos).' },
  { name: 'Kids',           type: 'kids',         leaderIds: [], status: 'ativo', description: 'Ministério infantil (Redentor Kids).' },
];

export async function seedDefaultMinistries(): Promise<void> {
  const existing = await getMinistries();
  if (existing.length > 0) return; // já populado
  const batch = writeBatch(db);
  DEFAULT_MINISTRIES.forEach((m) => {
    const ref = doc(collection(db, COL));
    batch.set(ref, { ...m, memberCount: 0, createdAt: new Date().toISOString() });
  });
  await batch.commit();
}
