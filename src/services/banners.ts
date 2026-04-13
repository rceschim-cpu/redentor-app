import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface BannerData {
  imageURL?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const COL = 'banners';

export async function getBannerData(bannerId: string): Promise<BannerData> {
  const snap = await getDoc(doc(db, COL, bannerId));
  return snap.exists() ? (snap.data() as BannerData) : {};
}

export async function getAllBanners(): Promise<Record<string, BannerData>> {
  const ids = ['1', '2', '3', '4'];
  const results = await Promise.all(ids.map((id) => getBannerData(id)));
  return Object.fromEntries(ids.map((id, i) => [id, results[i]]));
}

export async function updateBannerImage(
  bannerId: string,
  imageURL: string,
  updatedBy: string
): Promise<void> {
  await setDoc(doc(db, COL, bannerId), {
    imageURL,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
}
