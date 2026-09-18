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
import { DEFAULT_SIEGE_COUNTERS, DRAFT_COUNTER_IDS } from '../data/defaultCounters';

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
          const item = docSnap.data() as SiegeCounterStrategy;
          // Filter out draft / sample counters
          if (!DRAFT_COUNTER_IDS.includes(item.id)) {
            list.push(item);
          }
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
 * Delete any previously seeded draft counters from Firestore
 */
export async function deleteDraftCountersFromFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const id of DRAFT_COUNTER_IDS) {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (err) {
    console.warn('Draft counters cleanup warning:', err);
  }
}

/**
 * Seed default counters to Firestore if none exist
 */
export async function seedDefaultCountersToFirestore(): Promise<number> {
  if (!DEFAULT_SIEGE_COUNTERS.length) return 0;
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

