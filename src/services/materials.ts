import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadToCloudinary } from './cloudinary';
import { GroupMaterial } from '../types';

const COL = 'group_materials';

export async function getMaterials(groupId: string): Promise<GroupMaterial[]> {
  // Ordenação no cliente para evitar índice composto no Firestore
  const q = query(collection(db, COL), where('groupId', '==', groupId));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMaterial));
  return docs.sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
}

export async function uploadMaterial(
  groupId: string,
  file: File,
  title: string,
  description: string,
  uploadedBy: string,
  uploaderName: string
): Promise<GroupMaterial> {
  // Upload via Cloudinary (gratuito, sem Firebase Storage)
  const { url: fileURL } = await uploadToCloudinary(file);

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

export async function deleteMaterial(id: string, _fileURL: string): Promise<void> {
  // Remove apenas o registro do Firestore; o arquivo no Cloudinary fica
  // (deleção pelo cliente exigiria API secret — não expor no app)
  await deleteDoc(doc(db, COL, id));
}
