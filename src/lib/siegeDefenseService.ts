import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { SavedSiegeDefense } from '../types';

const COLLECTION_NAME = 'siege_defenses';
export const STORAGE_KEY_SIEGE_DEFENSES = 'sw_siege_defenses_v1';

export const DEFAULT_SAVED_DEFENSES: SavedSiegeDefense[] = [
  {
    id: 'def-geldnir-ophilia-theomars',
    name: 'Geldnir • Ophilia • Theomars',
    monsterIds: ['geldnir', 'ophilia', 'theomars'],
    leaderMonsterId: 'theomars',
    notes: 'Def meta Nat5 siêu trâu, kháng shock damage cực mạnh với Geldnir và Threat state của Ophilia.',
    createdAt: 1718000000000,
  },
  {
    id: 'def-carcano-vigor-triana',
    name: 'Carcano • Vigor • Triana',
    monsterIds: ['carcano', 'vigor', 'triana'],
    leaderMonsterId: 'carcano',
    notes: 'Def 4 sao chuẩn meta: Carcano trừ giáp snipe mục tiêu, Triana bảo kê cứu chết, Vigor hồi máu & chống bạo.',
    createdAt: 1718100000000,
  },
  {
    id: 'def-clara-savannah-theomars',
    name: 'Clara • Savannah • Theomars',
    monsterIds: ['clara', 'savannah', 'theomars'],
    leaderMonsterId: 'savannah',
    notes: 'Def đánh phủ đầu tốc độ cao: Clara cướp lượt xóa buff stun, Savannah đẩy lùi ATB + trừ giáp, Theomars dứt điểm.',
    createdAt: 1718200000000,
  },
  {
    id: 'def-khmun-bastet-odin',
    name: 'Khmun • Bastet • Odin',
    monsterIds: ['khmun', 'bastet', 'odin'],
    leaderMonsterId: 'khmun',
    notes: 'Bastet đẩy ATB và buff 2 lượt, Odin nhận đủ 5 tri thức bắn xuyên giáp 60k+ one-shot ngay lượt 1.',
    createdAt: 1718300000000,
  },
];

/**
 * Subscribe to realtime updates from Firestore siege_defenses collection
 */
export function subscribeToSiegeDefenses(
  onUpdate: (defenses: SavedSiegeDefense[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: SavedSiegeDefense[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SavedSiegeDefense);
        });
        // Sort by createdAt descending
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onUpdate(list);
      }
    },
    (err) => {
      console.warn('Firestore siege_defenses subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a single defense to Firestore
 */
export async function saveSiegeDefenseToFirestore(
  defense: SavedSiegeDefense
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, defense.id);
  const sanitized: Record<string, any> = { ...defense };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  sanitized.updatedAt = new Date().toISOString();
  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Delete a defense from Firestore
 */
export async function deleteSiegeDefenseFromFirestore(
  defenseId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, defenseId);
  await deleteDoc(docRef);
}

/**
 * Seed default defenses to Firestore
 */
export async function seedDefaultDefensesToFirestore(): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const def of DEFAULT_SAVED_DEFENSES) {
    const docRef = doc(db, COLLECTION_NAME, def.id);
    const sanitized: Record<string, any> = { ...def };
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

/**
 * Helper to check if two sets of 3 monster IDs are identical, regardless of order.
 */
export function isSameMonsterTeam(
  teamA: (string | null | undefined)[],
  teamB: (string | null | undefined)[]
): boolean {
  if (!teamA || !teamB || teamA.length < 3 || teamB.length < 3) return false;
  const validA = teamA.filter(Boolean) as string[];
  const validB = teamB.filter(Boolean) as string[];
  if (validA.length !== 3 || validB.length !== 3) return false;

  const sortedA = [...validA].sort();
  const sortedB = [...validB].sort();

  return (
    sortedA[0] === sortedB[0] &&
    sortedA[1] === sortedB[1] &&
    sortedA[2] === sortedB[2]
  );
}

/**
 * Check if 3 monster IDs match any existing defense regardless of ordering
 */
export function findDuplicateSiegeDefense(
  candidateMonsterIds: (string | null | undefined)[],
  savedDefenses: SavedSiegeDefense[],
  excludeDefenseId?: string | null
): SavedSiegeDefense | null {
  if (!candidateMonsterIds || candidateMonsterIds.length < 3) return null;
  const validIds = candidateMonsterIds.filter(Boolean) as string[];
  if (validIds.length !== 3) return null;

  const sortedCandidates = [...validIds].sort();

  for (const def of savedDefenses) {
    if (excludeDefenseId && def.id === excludeDefenseId) continue;
    if (!def.monsterIds || def.monsterIds.length < 3) continue;

    const sortedDef = [...def.monsterIds].sort();
    if (
      sortedDef[0] === sortedCandidates[0] &&
      sortedDef[1] === sortedCandidates[1] &&
      sortedDef[2] === sortedCandidates[2]
    ) {
      return def;
    }
  }

  return null;
}
