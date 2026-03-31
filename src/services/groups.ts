import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Group } from '../types';

const COL = 'groups';

export async function getGroups(): Promise<Group[]> {
  const q = query(collection(db, COL), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
}

export async function getGroup(id: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Group;
}

export async function getGroupsByLeader(leaderId: string): Promise<Group[]> {
  const q = query(collection(db, COL), where('leaderId', '==', leaderId), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
}

export async function createGroup(
  data: Omit<Group, 'id'>,
  createdBy: string
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    memberCount: 0,
    pendingCount: 0,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateGroup(id: string, data: Partial<Group>): Promise<void> {
  await updateDoc(doc(db, COL, id), data as Record<string, unknown>);
}
