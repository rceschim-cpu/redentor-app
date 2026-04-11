import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { GroupMaterial } from '../types';

const COL = 'group_materials';

export async function getMaterials(groupId: string): Promise<GroupMaterial[]> {
  const q = query(
    collection(db, COL),
    where('groupId', '==', groupId),
    orderBy('uploadedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMaterial));
}

export async function uploadMaterial(
  groupId: string,
  file: File,
  title: string,
  description: string,
  uploadedBy: string,
  uploaderName: string
): Promise<GroupMaterial> {
  const path = `group_materials/${groupId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const fileURL = await getDownloadURL(storageRef);

  const data: Omit<GroupMaterial, 'id'> = {
    groupId,
    title: title.trim() || file.name,
    description: description.trim(),
    fileURL,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadedBy,
    uploaderName,
    uploadedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, COL), data);
  return { id: docRef.id, ...data };
}

export async function deleteMaterial(id: string, fileURL: string): Promise<void> {
  try {
    // Attempt to delete from Storage — may fail if URL is from a different path format
    const storageRef = ref(storage, fileURL);
    await deleteObject(storageRef);
  } catch {
    // Ignore storage errors; always remove the Firestore record
  }
  await deleteDoc(doc(db, COL, id));
}
