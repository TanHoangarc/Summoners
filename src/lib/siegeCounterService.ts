import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { SiegeCounterStrategy } from '../types';
import { DEFAULT_SIEGE_COUNTERS } from '../data/defaultCounters';

const COLLECTION_NAME = 'counters';
export const STORAGE_KEY_SIEGE_COUNTERS = 'sw_siege_counters_v1';

/**
 * Subscribe to realtime updates from Firestore counters collection
 */
export function subscribeToSiegeCounters(
  onUpdate: (counters: SiegeCounterStrategy[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: SiegeCounterStrategy[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SiegeCounterStrategy);
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.warn('Firestore counters subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a single counter strategy in Firestore
 */
export async function saveSiegeCounterToFirestore(
  counter: SiegeCounterStrategy
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, counter.id);
  const sanitized: Record<string, any> = { ...counter };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  sanitized.updatedAt = new Date().toISOString();
  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Delete a counter strategy from Firestore
 */
export async function deleteSiegeCounterFromFirestore(
  counterId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, counterId);
  await deleteDoc(docRef);
}

/**
 * Seed default counters to Firestore if none exist
 */
export async function seedDefaultCountersToFirestore(): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const counter of DEFAULT_SIEGE_COUNTERS) {
    const docRef = doc(db, COLLECTION_NAME, counter.id);
    const sanitized: Record<string, any> = { ...counter };
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === undefined) delete sanitized[key];
    });
    sanitized.updatedAt = new Date().toISOString();
    batch.set(docRef, sanitized, { merge: true });
    count++;
  }

  await batch.commit();
  return count;
}
