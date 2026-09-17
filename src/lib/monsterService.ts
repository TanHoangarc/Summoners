import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Monster } from '../types';
import { DEFAULT_MONSTERS } from '../data/defaultMonsters';

const COLLECTION_NAME = 'monsters';

/**
 * Subscribe to realtime updates from Firestore monsters collection
 */
export function subscribeToMonsters(
  onUpdate: (monsters: Monster[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: Monster[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Monster);
        });
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firestore monsters subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a single monster to Firestore
 */
export async function saveMonsterToFirestore(monster: Monster): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, monster.id);
  // Remove undefined fields before sending to Firestore
  const sanitized: Record<string, any> = { ...monster };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  sanitized.updatedAt = new Date().toISOString();
  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Delete a monster from Firestore
 */
export async function deleteMonsterFromFirestore(monsterId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, monsterId);
  await deleteDoc(docRef);
}

/**
 * Seed all default monsters into Firestore
 */
export async function seedDefaultMonstersToFirestore(): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const m of DEFAULT_MONSTERS) {
    const docRef = doc(db, COLLECTION_NAME, m.id);
    const sanitized: Record<string, any> = { ...m };
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
