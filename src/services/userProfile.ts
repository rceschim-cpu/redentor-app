import {
  doc,
  getDoc,
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
  const snap = await getDoc(doc(db, COL, uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUserProfile;
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
  await updateDoc(doc(db, COL, uid), data as Record<string, unknown>);
}

export async function getUsersByRole(role: UserRole): Promise<AppUserProfile[]> {
  const q = query(collection(db, COL), where('role', '==', role), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUserProfile));
}

export async function getAllUsers(): Promise<AppUserProfile[]> {
  const q = query(collection(db, COL), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUserProfile));
}
