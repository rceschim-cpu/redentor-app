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
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
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
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `group_materials/${groupId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  // uploadBytesResumable é mais robusto e reporta erros com mais detalhe
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    task.on(
      'state_changed',
      null,
      (err) => {
        // Traduz os erros mais comuns do Storage
        if (err.code === 'storage/unauthorized') {
          reject(new Error('Sem permissão para fazer upload. Verifique as regras do Firebase Storage.'));
        } else if (err.code === 'storage/canceled') {
          reject(new Error('Upload cancelado.'));
        } else {
          reject(new Error(`Erro no upload (${err.code}): ${err.message}`));
        }
      },
      () => resolve()
    );
  });

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
