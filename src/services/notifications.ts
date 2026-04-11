import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  writeBatch,
  limit as fsLimit,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase';
import { AppNotification } from '../types';

const NOTIF_COL = (uid: string) => `notifications/${uid}/items`;

/** Write an in-app notification + optionally send Expo push */
export async function sendNotification(
  targetUid: string,
  title: string,
  body: string,
  type: AppNotification['type'],
  metadata?: AppNotification['metadata']
): Promise<void> {
  await addDoc(collection(db, NOTIF_COL(targetUid)), {
    title,
    body,
    type,
    read: false,
    createdAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  });

  // Best-effort Expo push (works from any platform to notify native devices)
  try {
    const userDoc = await getDoc(doc(db, 'users', targetUid));
    const token = userDoc.data()?.expoPushToken as string | undefined;
    if (token && token.startsWith('ExponentPushToken')) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: token, title, body, sound: 'default' }),
      });
    }
  } catch {
    // push is best-effort
  }
}

export async function getNotifications(uid: string): Promise<AppNotification[]> {
  const q = query(collection(db, NOTIF_COL(uid)), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function getUnreadCount(uid: string): Promise<number> {
  const q = query(collection(db, NOTIF_COL(uid)), where('read', '==', false));
  const snap = await getDocs(q);
  return snap.size;
}

export async function markAllRead(uid: string): Promise<void> {
  const q = query(collection(db, NOTIF_COL(uid)), where('read', '==', false));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function markOneRead(uid: string, notifId: string): Promise<void> {
  await updateDoc(doc(db, NOTIF_COL(uid), notifId), { read: true });
}

/** Register Expo push token for the current user (native only, best-effort) */
export async function registerExpoPushToken(uid: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // Dynamic import to avoid web build issues
    const Notifs = await import('expo-notifications');
    Notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    const { status } = await Notifs.requestPermissionsAsync();
    if (status !== 'granted') return;
    const tokenData = await Notifs.getExpoPushTokenAsync();
    await updateDoc(doc(db, 'users', uid), { expoPushToken: tokenData.data });
  } catch {
    // Non-critical — don't crash if expo-notifications isn't available
  }
}

/** Find a user UID by their memberId (reverse lookup for parking notifications) */
export async function findUserByMemberId(memberId: string): Promise<string | null> {
  try {
    const q = query(collection(db, 'users'), where('memberId', '==', memberId), fsLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
  } catch {
    return null;
  }
}
