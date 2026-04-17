import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

const COL = 'users';

/**
 * Finds the uid of the user account linked to a given memberId.
 * Returns null if no user account is linked.
 */
export async function findUserByMemberId(memberId: string): Promise<string | null> {
  const q = query(collection(db, COL), where('memberId', '==', memberId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}
