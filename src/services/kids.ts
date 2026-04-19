import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Child, ChildAttendance, KidsAgeGroup, KidsModule } from '../types';

const CHILDREN_COL   = 'children';
const ATTENDANCE_COL = 'children_attendance';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calcAgeGroup(birthDate: string): KidsAgeGroup {
  // birthDate: DD/MM/YYYY
  const [d, m, y] = birthDate.split('/').map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  if (age <= 3)  return '0-3';
  if (age <= 6)  return '4-6';
  if (age <= 9)  return '7-9';
  return '10-12';
}

export function calcModule(ageGroup: KidsAgeGroup): KidsModule {
  return ageGroup === '10-12' ? 'ponte' : 'kids';
}

export function calcAge(birthDate: string): number {
  const [d, m, y] = birthDate.split('/').map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

// Extrai IDs de membros vinculados aos responsáveis
function extractGuardianMemberIds(guardians: Child['guardians']): string[] {
  return guardians.flatMap((g) => g.memberId ? [g.memberId] : []);
}

// ── CRUD Crianças ──────────────────────────────────────────────────────────────

export async function getChildren(module?: KidsModule): Promise<Child[]> {
  const q = module
    ? query(collection(db, CHILDREN_COL), where('module', '==', module))
    : query(collection(db, CHILDREN_COL));
  const snap = await getDocs(q);
  const children = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
  return children.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getChild(id: string): Promise<Child | null> {
  const snap = await getDoc(doc(db, CHILDREN_COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Child) : null;
}

export async function addChild(data: Omit<Child, 'id'>): Promise<Child> {
  const ageGroup = calcAgeGroup(data.birthDate);
  const module   = calcModule(ageGroup);
  const guardianMemberIds = extractGuardianMemberIds(data.guardians ?? []);
  const docRef = await addDoc(collection(db, CHILDREN_COL), {
    ...data,
    ageGroup,
    module,
    status: 'ativo',
    createdAt: new Date().toISOString(),
    ...(guardianMemberIds.length > 0 ? { guardianMemberIds } : {}),
  });
  return { id: docRef.id, ...data, ageGroup, module, status: 'ativo', guardianMemberIds };
}

export async function updateChild(id: string, data: Partial<Child>): Promise<void> {
  const patch: any = { ...data };
  if (data.birthDate) {
    patch.ageGroup = calcAgeGroup(data.birthDate);
    patch.module   = calcModule(patch.ageGroup);
  }
  if (data.guardians) {
    const ids = extractGuardianMemberIds(data.guardians);
    patch.guardianMemberIds = ids.length > 0 ? ids : [];
  }
  await updateDoc(doc(db, CHILDREN_COL, id), patch);
}

export async function deleteChild(id: string): Promise<void> {
  await deleteDoc(doc(db, CHILDREN_COL, id));
}

// Busca crianças vinculadas a um membro como responsável
export async function getChildrenByGuardianMember(memberId: string): Promise<Child[]> {
  const q = query(
    collection(db, CHILDREN_COL),
    where('guardianMemberIds', 'array-contains', memberId),
  );
  const snap = await getDocs(q);
  const children = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
  return children.sort((a, b) => a.name.localeCompare(b.name));
}

// Inativa crianças sem presença há mais de 1 ano
export async function checkAndInactivateChildren(): Promise<void> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const snap = await getDocs(query(collection(db, CHILDREN_COL), where('status', '==', 'ativo')));
  const updates: Promise<void>[] = [];
  snap.docs.forEach((d) => {
    const child = d.data() as Child;
    const last = child.lastAttendance ? new Date(child.lastAttendance) : new Date(child.createdAt);
    if (last < oneYearAgo) {
      updates.push(updateDoc(d.ref, { status: 'inativo' }));
    }
  });
  await Promise.all(updates);
}

// Atualiza faixa etária de todas as crianças (rodar periodicamente)
export async function syncAgeGroups(): Promise<void> {
  const snap = await getDocs(collection(db, CHILDREN_COL));
  const updates: Promise<void>[] = [];
  snap.docs.forEach((d) => {
    const child = d.data() as Child;
    const newGroup  = calcAgeGroup(child.birthDate);
    const newModule = calcModule(newGroup);
    if (newGroup !== child.ageGroup || newModule !== child.module) {
      updates.push(updateDoc(d.ref, { ageGroup: newGroup, module: newModule }));
    }
  });
  await Promise.all(updates);
}

// ── Presença ───────────────────────────────────────────────────────────────────

export async function getAttendance(date: string, module?: KidsModule): Promise<ChildAttendance[]> {
  const constraints: any[] = [where('date', '==', date)];
  if (module) constraints.push(where('module', '==', module));
  const q = query(collection(db, ATTENDANCE_COL), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChildAttendance));
}

export async function getChildAttendanceHistory(childId: string): Promise<ChildAttendance[]> {
  const q = query(
    collection(db, ATTENDANCE_COL),
    where('childId', '==', childId),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChildAttendance));
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function markAttendance(
  child: Child,
  registeredByUid: string,
  registeredByName: string,
  method: 'manual' | 'qrcode' = 'manual',
): Promise<ChildAttendance> {
  const today = new Date().toISOString().split('T')[0];

  // Verifica se já tem presença hoje
  const existing = await getAttendance(today);
  if (existing.find((a) => a.childId === child.id)) {
    throw new Error(`${child.name} já tem presença registrada hoje.`);
  }

  const data: Omit<ChildAttendance, 'id'> = {
    childId: child.id,
    childName: child.name,
    date: today,
    module: child.module,
    ageGroup: child.ageGroup,
    registeredBy: method,
    registeredByUid,
    registeredByName,
    createdAt: new Date().toISOString(),
  };

  const ref = await addDoc(collection(db, ATTENDANCE_COL), data);
  await updateDoc(doc(db, CHILDREN_COL, child.id), { lastAttendance: new Date().toISOString() });
  return { id: ref.id, ...data };
}

export async function removeAttendance(attendanceId: string): Promise<void> {
  await deleteDoc(doc(db, ATTENDANCE_COL, attendanceId));
}

// ── Relatório mensal ───────────────────────────────────────────────────────────
export interface AttendanceReportRow {
  childId: string;
  childName: string;
  ageGroup: KidsAgeGroup;
  module: KidsModule;
  dates: string[];
  total: number;
}

export async function getMonthlyReport(year: number, month: number, module?: KidsModule): Promise<AttendanceReportRow[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const snap = await getDocs(query(collection(db, ATTENDANCE_COL)));
  const all = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ChildAttendance))
    .filter((a) => a.date.startsWith(prefix) && (!module || a.module === module));

  const map: Record<string, AttendanceReportRow> = {};
  all.forEach((a) => {
    if (!map[a.childId]) {
      map[a.childId] = { childId: a.childId, childName: a.childName, ageGroup: a.ageGroup, module: a.module, dates: [], total: 0 };
    }
    map[a.childId].dates.push(a.date);
    map[a.childId].total++;
  });

  return Object.values(map).sort((a, b) => a.childName.localeCompare(b.childName));
}

// ── Notificar responsável pelo telefone ───────────────────────────────────────
// Busca membro pelo telefone → acha uid vinculado → envia notificação in-app + push
export async function notifyGuardianByPhone(
  guardianPhone: string,
  childName: string,
  message: string,
): Promise<'sent' | 'no_account'> {
  const digits = guardianPhone.replace(/\D/g, '');

  const snap = await getDocs(collection(db, 'members'));
  const match = snap.docs.find((d) => {
    const phone = (d.data().phone ?? '').replace(/\D/g, '');
    return phone === digits || phone.endsWith(digits) || digits.endsWith(phone);
  });

  if (!match) return 'no_account';

  const userSnap = await getDocs(query(
    collection(db, 'users'),
    where('memberId', '==', match.id),
  ));

  if (userSnap.empty) return 'no_account';

  const targetUid = userSnap.docs[0].id;
  const { sendNotification } = await import('./notifications');
  await sendNotification(targetUid, `Redentor Kids — ${childName}`, message, 'general');

  return 'sent';
}

// ── Notificar responsável vinculado ao membro ─────────────────────────────────
export async function notifyGuardianByMemberId(
  memberId: string,
  childName: string,
  message: string,
): Promise<'sent' | 'no_account'> {
  const userSnap = await getDocs(query(
    collection(db, 'users'),
    where('memberId', '==', memberId),
  ));

  if (userSnap.empty) return 'no_account';

  const targetUid = userSnap.docs[0].id;
  const { sendNotification } = await import('./notifications');
  await sendNotification(targetUid, `Redentor Kids — ${childName}`, message, 'general');

  return 'sent';
}

// ── Crianças que fazem aniversário hoje ───────────────────────────────────────
export async function getTodayBirthdays(): Promise<Child[]> {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const snap = await getDocs(query(collection(db, CHILDREN_COL), where('status', '==', 'ativo')));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Child))
    .filter((c) => c.birthDate?.startsWith(`${dd}/${mm}`));
}
