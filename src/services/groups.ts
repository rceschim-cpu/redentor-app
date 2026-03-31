import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
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
