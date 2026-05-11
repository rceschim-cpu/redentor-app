import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, addDoc, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { MinistrySchedule, ScheduleAssignment } from '../types';

const COL = 'ministries';
const SUB = 'schedules';

function cleanData<T extends Record<string, any>>(data: T): Partial<T> {
  const out: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// ─── CRUD básico ──────────────────────────────────────────────────────────────
export async function getSchedules(ministryId: string): Promise<MinistrySchedule[]> {
  const snap = await getDocs(query(collection(db, COL, ministryId, SUB), orderBy('date', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MinistrySchedule, 'id'>) }));
}

export async function getSchedule(ministryId: string, scheduleId: string): Promise<MinistrySchedule | null> {
  const snap = await getDoc(doc(db, COL, ministryId, SUB, scheduleId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<MinistrySchedule, 'id'>) } : null;
}

export async function createSchedule(
  data: Omit<MinistrySchedule, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL, data.ministryId, SUB), cleanData({
    ...data,
    createdAt: new Date().toISOString(),
  }));
  return ref.id;
}

export async function updateSchedule(
  ministryId: string,
  scheduleId: string,
  patch: Partial<Omit<MinistrySchedule, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COL, ministryId, SUB, scheduleId), cleanData(patch) as any);
}

export async function deleteSchedule(ministryId: string, scheduleId: string): Promise<void> {
  await deleteDoc(doc(db, COL, ministryId, SUB, scheduleId));
}

// ─── Geração de série recorrente ──────────────────────────────────────────────
type Recurrence = 'unica' | 'semanal' | 'quinzenal' | 'mensal';

export async function createScheduleSeries(
  base: Omit<MinistrySchedule, 'id' | 'createdAt' | 'recurrenceParent'>,
  recurrence: Recurrence,
  occurrences: number
): Promise<string[]> {
  const dates = computeRecurrenceDates(base.date, recurrence, occurrences);
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const ids: string[] = [];

  // Cria o "pai" da série na primeira data
  const parentRef = doc(collection(db, COL, base.ministryId, SUB));
  ids.push(parentRef.id);
  batch.set(parentRef, cleanData({
    ...base,
    date: dates[0],
    createdAt: now,
  }));

  // Cria as ocorrências subsequentes apontando para o parent
  for (let i = 1; i < dates.length; i++) {
    const ref = doc(collection(db, COL, base.ministryId, SUB));
    ids.push(ref.id);
    batch.set(ref, cleanData({
      ...base,
      date: dates[i],
      recurrenceParent: parentRef.id,
      createdAt: now,
    }));
  }

  await batch.commit();
  return ids;
}

function computeRecurrenceDates(startDate: string, recurrence: Recurrence, count: number): string[] {
  if (recurrence === 'unica') return [startDate];
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    if (recurrence === 'semanal')    d.setDate(start.getDate() + i * 7);
    if (recurrence === 'quinzenal')  d.setDate(start.getDate() + i * 14);
    if (recurrence === 'mensal')     d.setMonth(start.getMonth() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
