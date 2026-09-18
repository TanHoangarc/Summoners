import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { RTAMatchRecord } from '../types';

export const MATCHES_COLLECTION = 'rta_matches';
export const SETTINGS_COLLECTION = 'rta_settings';
export const FAVORITES_DOC_ID = 'favorite_picks';

export const RTA_HISTORY_LOCAL_KEY = 'sw_rta_match_history_records_v1';
export const RTA_FAVORITES_LOCAL_KEY = 'sw_rta_favorite_picks_v3';

// 3 trận mẫu chuẩn meta RTA nếu hệ thống chưa có dữ liệu
export const DEFAULT_SAMPLE_MATCHES: RTAMatchRecord[] = [
  {
    id: 'match-sample-1',
    createdAt: 1718000000000,
    result: 'VICTORY',
    myTeam: [
      { monsterId: 'moore', isBanned: false, isLeader: false, pickOrder: 1 },
      { monsterId: 'shizuka', isBanned: false, isLeader: false, pickOrder: 4 },
      { monsterId: 'karnal', isBanned: false, isLeader: false, pickOrder: 5 },
      { monsterId: 'savannah', isBanned: false, isLeader: true, pickOrder: 8 },
      { monsterId: 'tractor', isBanned: true, isLeader: false, pickOrder: 9 },
    ],
    enemyTeam: [
      { monsterId: 'oliver', isBanned: true, isLeader: false, pickOrder: 2 },
      { monsterId: 'seara', isBanned: false, isLeader: false, pickOrder: 3 },
      { monsterId: 'woosa', isBanned: false, isLeader: false, pickOrder: 6 },
      { monsterId: 'miles', isBanned: false, isLeader: false, pickOrder: 7 },
      { monsterId: 'dominic', isBanned: false, isLeader: true, pickOrder: 10 },
    ],
    notes: 'Trận thắng áp đảo: Moore cướp lượt xóa buff, Savannah trừ giáp + giảm thanh.',
  },
  {
    id: 'match-sample-2',
    createdAt: 1718100000000,
    result: 'VICTORY',
    myTeam: [
      { monsterId: 'moore', isBanned: false, isLeader: true, pickOrder: 2 },
      { monsterId: 'shizuka', isBanned: false, isLeader: false, pickOrder: 3 },
      { monsterId: 'karnal', isBanned: false, isLeader: false, pickOrder: 6 },
      { monsterId: 'cheongpung', isBanned: false, isLeader: false, pickOrder: 7 },
      { monsterId: 'savannah', isBanned: false, isLeader: false, pickOrder: 10 },
    ],
    enemyTeam: [
      { monsterId: 'oliver', isBanned: true, isLeader: false, pickOrder: 1 },
      { monsterId: 'seara', isBanned: false, isLeader: true, pickOrder: 4 },
      { monsterId: 'woosa', isBanned: false, isLeader: false, pickOrder: 5 },
      { monsterId: 'dominic', isBanned: false, isLeader: false, pickOrder: 8 },
      { monsterId: 'miles', isBanned: false, isLeader: false, pickOrder: 9 },
    ],
    notes: 'Khắc chế team Oliver 1st pick: Ban Oliver, Moore lead tăng tốc, Shizuka phản đòn debuff.',
  },
  {
    id: 'match-sample-3',
    createdAt: 1718200000000,
    result: 'VICTORY',
    myTeam: [
      { monsterId: 'oliver', isBanned: false, isLeader: true, pickOrder: 1 },
      { monsterId: 'cheongpung', isBanned: false, isLeader: false, pickOrder: 4 },
      { monsterId: 'moore', isBanned: false, isLeader: false, pickOrder: 5 },
      { monsterId: 'savannah', isBanned: false, isLeader: false, pickOrder: 8 },
      { monsterId: 'sagar', isBanned: false, isLeader: false, pickOrder: 9 },
    ],
    enemyTeam: [
      { monsterId: 'vanessa', isBanned: false, isLeader: false, pickOrder: 2 },
      { monsterId: 'woosa', isBanned: false, isLeader: true, pickOrder: 3 },
      { monsterId: 'dominic', isBanned: true, isLeader: false, pickOrder: 6 },
      { monsterId: 'miles', isBanned: false, isLeader: false, pickOrder: 7 },
      { monsterId: 'douglas', isBanned: false, isLeader: false, pickOrder: 10 },
    ],
    notes: 'Speed Controll Team: Oliver reset kỹ năng liên tục.',
  },
];

/**
 * Đăng ký lắng nghe thời gian thực lịch sử trận đấu RTA từ Firestore
 */
export function subscribeToRTAMatches(
  onUpdate: (matches: RTAMatchRecord[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, MATCHES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: RTAMatchRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as RTAMatchRecord);
        });
        // Sắp xếp thời gian giảm dần (trận mới nhất lên đầu)
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onUpdate(list);
      }
    },
    (err) => {
      console.warn('Firestore rta_matches subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Lưu một trận đấu RTA lên Firestore
 */
export async function saveRTAMatchToFirestore(
  match: RTAMatchRecord
): Promise<void> {
  const docRef = doc(db, MATCHES_COLLECTION, match.id);
  const sanitized: Record<string, any> = { ...match };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  sanitized.updatedAt = new Date().toISOString();
  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Xóa một trận đấu RTA khỏi Firestore
 */
export async function deleteRTAMatchFromFirestore(matchId: string): Promise<void> {
  const docRef = doc(db, MATCHES_COLLECTION, matchId);
  await deleteDoc(docRef);
}

/**
 * Nạp danh sách trận đấu lên Firestore (cho khởi tạo ban đầu hoặc đồng bộ hàng loạt)
 */
export async function seedRTAMatchesToFirestore(matches: RTAMatchRecord[]): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const m of matches) {
    const docRef = doc(db, MATCHES_COLLECTION, m.id);
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

/**
 * Đăng ký lắng nghe thời gian thực danh sách "Pet Tôi Hay Pick" từ Firestore
 */
export function subscribeToRTAFavorites(
  onUpdate: (favoriteIds: string[]) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, FAVORITES_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.monsterIds)) {
          onUpdate(data.monsterIds);
          return;
        }
      }
      onUpdate([]);
    },
    (err) => {
      console.warn('Firestore rta_settings/favorite_picks subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Lưu danh sách "Pet Tôi Hay Pick" lên Firestore
 */
export async function saveRTAFavoritesToFirestore(
  favoriteIds: string[]
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, FAVORITES_DOC_ID);
  const data = {
    id: FAVORITES_DOC_ID,
    monsterIds: favoriteIds,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(docRef, data, { merge: true });
}

/**
 * Lấy danh sách favorites một lần (nếu cần kiểm tra trước khi ghi)
 */
export async function getRTAFavoritesFromFirestore(): Promise<string[] | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FAVORITES_DOC_ID);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.monsterIds)) {
        return data.monsterIds;
      }
    }
    return null;
  } catch (err) {
    console.warn('Lỗi khi tải rta_favorites từ Firestore:', err);
    return null;
  }
}
