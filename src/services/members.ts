import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Member } from '../types';

const COL = 'members';

export async function getMembers(): Promise<Member[]> {
  const q = query(collection(db, COL), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
}

export async function getMember(id: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Member;
}

export async function addMember(data: Omit<Member, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateMember(id: string, data: Partial<Omit<Member, 'id'>>): Promise<void> {
  // Firestore rejeita campos com valor undefined — remove antes de enviar
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await updateDoc(doc(db, COL, id), clean);
}

export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
