import React, { useState, useMemo, useEffect } from 'react';
import {
  Swords,
  Ban,
  Crown,
  RotateCcw,
  Trash2,
  History,
  X,
  Play,
  CheckCircle2,
  BookmarkCheck,
  AlertTriangle,
  Zap,
  Sparkles,
  Cloud,
  ListOrdered,
} from 'lucide-react';
import { Monster, RTAMatchRecord, RTASlot } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';
import { QuickPickSuggestions } from './QuickPickSuggestions';
import { KillOrderPanel } from './KillOrderPanel';
import { recordMonsterPick } from '../../utils/monsterPickStats';
import {
  computeRTAAutoSuggestions,
  AutoSuggestionState,
} from '../../utils/rtaAutoSuggester';
import {
  subscribeToRTAMatches,
  saveRTAMatchToFirestore,
  deleteRTAMatchFromFirestore,
  seedRTAMatchesToFirestore,
  subscribeToRTAFavorites,
  saveRTAFavoritesToFirestore,
  DEFAULT_SAMPLE_MATCHES,
} from '../../lib/rtaFirestoreService';

interface RTADraftViewProps {
  allMonsters: Monster[];
  onOpenAddMonster: () => void;
}

// Storage key for persistent RTA match history
const RTA_HISTORY_STORAGE_KEY = 'sw_rta_match_history_records_v1';

const DEFAULT_SAMPLE_HISTORY: RTAMatchRecord[] = [
  // Trận 1: Team Trái (Tôi) là 1st Pick -> Moore, Shizuka, Karnal, Savannah (Lead), Tractor (Cấm)
  {
    id: 'match-1',
    createdAt: Date.now() - 3 * 86400000,
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
  },
  // Trận 2: Team Phải (Địch) là 1st Pick -> Địch pick #1 Oliver, Tôi pick #2 Moore (Lead), #3 Shizuka...
  {
    id: 'match-2',
    createdAt: Date.now() - 2 * 86400000,
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
  },
  // Trận 3: Team Trái 1st Pick Oliver Speed Team
  {
    id: 'match-3',
    createdAt: Date.now() - 1 * 86400000,
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
  },
];

const getStoredHistory = (): RTAMatchRecord[] => {
  try {
    const saved = localStorage.getItem(RTA_HISTORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SAMPLE_HISTORY;
};

// RTA mặc định để trống hoàn toàn, không thêm pet sẵn theo yêu cầu người dùng
const createEmptyRTATeam = (orders: number[]): RTASlot[] => {
  return orders.map((order) => ({
    monsterId: null,
    isBanned: false,
    isLeader: false,
    pickOrder: order,
  }));
};

const INITIAL_MY_TEAM: RTASlot[] = createEmptyRTATeam([1, 4, 5, 8, 9]);
const INITIAL_ENEMY_TEAM: RTASlot[] = createEmptyRTATeam([2, 3, 6, 7, 10]);

export const RTADraftView: React.FC<RTADraftViewProps> = ({
  allMonsters,
  onOpenAddMonster,
}) => {
  const [firstPickSide, setFirstPickSide] = useState<'mine' | 'enemy'>('mine');
  const [myTeam, setMyTeam] = useState<RTASlot[]>(INITIAL_MY_TEAM);
  const [enemyTeam, setEnemyTeam] = useState<RTASlot[]>(INITIAL_ENEMY_TEAM);

  // Selected slot for quick control bar
  const [selectedSlotRef, setSelectedSlotRef] = useState<{
    side: 'mine' | 'enemy';
    index: number;
  } | null>(null);

  // Active slot picker modal
  const [activePickerSlot, setActivePickerSlot] = useState<{
    side: 'mine' | 'enemy';
    index: number;
  } | null>(null);

  // Kill order for enemy team (array of enemy monster IDs in priority order 1st -> 5th)
  const [killOrder, setKillOrder] = useState<string[]>([]);

  // Match History records with persistent local storage
  const [matchHistory, setMatchHistory] = useState<RTAMatchRecord[]>(getStoredHistory);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<RTAMatchRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const saveHistoryToStorage = (updated: RTAMatchRecord[]) => {
    setMatchHistory(updated);
    try {
      localStorage.setItem(RTA_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Recalculate pick orders when first pick side toggles
  const applyFirstPickOrders = (side: 'mine' | 'enemy') => {
    setFirstPickSide(side);
    if (side === 'mine') {
      const myOrders = [1, 4, 5, 8, 9];
      const enemyOrders = [2, 3, 6, 7, 10];
      setMyTeam((prev) => prev.map((s, idx) => ({ ...s, pickOrder: myOrders[idx] })));
      setEnemyTeam((prev) => prev.map((s, idx) => ({ ...s, pickOrder: enemyOrders[idx] })));
    } else {
      const enemyOrders = [1, 4, 5, 8, 9];
      const myOrders = [2, 3, 6, 7, 10];
      setMyTeam((prev) => prev.map((s, idx) => ({ ...s, pickOrder: myOrders[idx] })));
      setEnemyTeam((prev) => prev.map((s, idx) => ({ ...s, pickOrder: enemyOrders[idx] })));
    }
  };

  // Công tắc bật tắt chế độ Auto Gợi ý (Màu xanh = Bật, Màu đỏ = Tắt)
  const [isAutoSuggest, setIsAutoSuggest] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sw_rta_auto_mode');
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return true; // Mặc định BẬT để hỗ trợ người dùng ngay lập tức
  });

  // Đồng bộ danh sách Pet Tôi Hay Pick với QuickPickSuggestions
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sw_rta_favorite_picks_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Trạng thái kết nối Firebase
  const [isFirebaseMatchesSynced, setIsFirebaseMatchesSynced] = useState(false);
  const [isFirebaseFavoritesSynced, setIsFirebaseFavoritesSynced] = useState(false);

  // Realtime sync Lịch Sử Trận Đấu RTA từ Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToRTAMatches(
      async (firestoreMatches) => {
        if (!isMounted) return;
        if (firestoreMatches.length > 0) {
          setMatchHistory(firestoreMatches);
          try {
            localStorage.setItem(RTA_HISTORY_STORAGE_KEY, JSON.stringify(firestoreMatches));
          } catch (e) {
            console.error(e);
          }
        } else {
          // Nếu Firestore chưa có dữ liệu, khởi tạo nạp các trận mẫu hiện có lên Firestore
          const localHistory = getStoredHistory();
          const initialMatches = localHistory.length > 0 ? localHistory : DEFAULT_SAMPLE_MATCHES;
          setMatchHistory(initialMatches);
          try {
            await seedRTAMatchesToFirestore(initialMatches);
          } catch (err) {
            console.warn('Lỗi khi seed trận mẫu RTA lên Firebase:', err);
          }
        }
        setIsFirebaseMatchesSynced(true);
      },
      (err) => {
        console.warn('Lỗi kết nối Firebase RTA Matches:', err);
        setIsFirebaseMatchesSynced(true);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Realtime sync Pet Tôi Hay Pick từ Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToRTAFavorites(
      async (firestoreFavs) => {
        if (!isMounted) return;
        if (firestoreFavs.length > 0) {
          setFavoriteIds(firestoreFavs);
          try {
            localStorage.setItem('sw_rta_favorite_picks_v3', JSON.stringify(firestoreFavs));
          } catch (e) {
            console.error(e);
          }
        } else {
          // Nếu Firestore trống nhưng localStorage đang có danh sách favorites
          try {
            const saved = localStorage.getItem('sw_rta_favorite_picks_v3');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFavoriteIds(parsed);
                await saveRTAFavoritesToFirestore(parsed);
              }
            }
          } catch (err) {
            console.warn('Lỗi đồng bộ ban đầu favorites lên Firebase:', err);
          }
        }
        setIsFirebaseFavoritesSynced(true);
      },
      (err) => {
        console.warn('Lỗi kết nối Firebase RTA Favorites:', err);
        setIsFirebaseFavoritesSynced(true);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Handler cập nhật Pet Tôi Hay Pick và đồng bộ tức thì lên Firebase Firestore
  const handleUpdateFavoriteIds = (newIds: string[]) => {
    setFavoriteIds(newIds);
    try {
      localStorage.setItem('sw_rta_favorite_picks_v3', JSON.stringify(newIds));
    } catch (e) {
      console.error(e);
    }
    // Ghi lên Firebase Firestore để đồng bộ giữa tất cả các máy
    saveRTAFavoritesToFirestore(newIds).catch((err) => {
      console.warn('Lỗi khi lưu Pet Hay Pick lên Firebase:', err);
    });
  };

  // Lưu trạng thái công tắc auto vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sw_rta_auto_mode', JSON.stringify(isAutoSuggest));
    } catch (e) {
      console.error(e);
    }
  }, [isAutoSuggest]);

  // Tính toán gợi ý tự động dựa trên trình tự pick và lịch sử thi đấu
  const autoSuggestions = useMemo<AutoSuggestionState>(() => {
    if (!isAutoSuggest) {
      return {
        isActive: false,
        stage: 'idle',
        targetPickOrders: [],
        suggestedMonstersByOrder: {},
        suggestedLeaderMonsterId: null,
        suggestedBanMonsterId: null,
      };
    }
    return computeRTAAutoSuggestions(
      firstPickSide,
      myTeam,
      enemyTeam,
      matchHistory,
      allMonsters,
      favoriteIds
    );
  }, [isAutoSuggest, firstPickSide, myTeam, enemyTeam, matchHistory, allMonsters, favoriteIds]);

  // Chấp nhận chọn nhanh quái thú gợi ý mờ vào ô cờ
  const handleAcceptSuggestedPick = (pickOrder: number) => {
    const monster = autoSuggestions.suggestedMonstersByOrder[pickOrder];
    if (!monster) return;

    const myIdx = myTeam.findIndex((s) => s.pickOrder === pickOrder);
    if (myIdx !== -1) {
      setMyTeam((prev) => {
        const next = [...prev];
        next[myIdx] = { ...next[myIdx], monsterId: monster.id };
        return next;
      });
      showToast(`⚡ Auto: Đã chọn nhanh ${monster.name} vào vị trí #${pickOrder}`);
      return;
    }

    const enemyIdx = enemyTeam.findIndex((s) => s.pickOrder === pickOrder);
    if (enemyIdx !== -1) {
      setEnemyTeam((prev) => {
        const next = [...prev];
        next[enemyIdx] = { ...next[enemyIdx], monsterId: monster.id };
        return next;
      });
      if (!killOrder.includes(monster.id)) {
        setKillOrder((prev) => [...prev, monster.id]);
      }
      showToast(`⚡ Auto: Đã chọn nhanh ${monster.name} vào vị trí #${pickOrder}`);
    }
  };

  // Áp dụng tất cả các quái thú gợi ý hiện tại của đợt pick
  const handleAcceptAllCurrentSuggestions = () => {
    const orders = autoSuggestions.targetPickOrders;
    if (orders.length === 0) return;
    const names: string[] = [];

    orders.forEach((order) => {
      const monster = autoSuggestions.suggestedMonstersByOrder[order];
      if (monster) {
        names.push(monster.name);
        const myIdx = myTeam.findIndex((s) => s.pickOrder === order);
        if (myIdx !== -1) {
          setMyTeam((prev) => {
            const next = [...prev];
            next[myIdx] = { ...next[myIdx], monsterId: monster.id };
            return next;
          });
        }
        const enemyIdx = enemyTeam.findIndex((s) => s.pickOrder === order);
        if (enemyIdx !== -1) {
          setEnemyTeam((prev) => {
            const next = [...prev];
            next[enemyIdx] = { ...next[enemyIdx], monsterId: monster.id };
            return next;
          });
          if (!killOrder.includes(monster.id)) {
            setKillOrder((prev) => [...prev, monster.id]);
          }
        }
      }
    });

    if (names.length > 0) {
      showToast(`⚡ Auto: Đã áp dụng gợi ý chọn ${names.join(' & ')}!`);
    }
  };

  // Chọn Leader gợi ý theo lịch sử
  const handleAcceptSuggestedLeader = (monsterId: string) => {
    setMyTeam((prev) =>
      prev.map((s) => ({
        ...s,
        isLeader: s.monsterId === monsterId,
      }))
    );
    const mon = getMonsterById(allMonsters, monsterId);
    showToast(`👑 Đã đặt ${mon?.name || monsterId} làm Leader!`);
  };

  // Chọn Cấm gợi ý theo lịch sử
  const handleAcceptSuggestedBan = (monsterId: string) => {
    setEnemyTeam((prev) =>
      prev.map((s) => ({
        ...s,
        isBanned: s.monsterId === monsterId,
      }))
    );
    const mon = getMonsterById(allMonsters, monsterId);
    showToast(`🚫 Đã cấm ${mon?.name || monsterId} của Team Địch!`);
  };

  // Áp dụng cả gợi ý Leader và Cấm sau khi pick đủ 10 quái thú
  const handleAcceptSuggestedLeadAndBan = () => {
    if (autoSuggestions.suggestedLeaderMonsterId) {
      handleAcceptSuggestedLeader(autoSuggestions.suggestedLeaderMonsterId);
    }
    if (autoSuggestions.suggestedBanMonsterId) {
      handleAcceptSuggestedBan(autoSuggestions.suggestedBanMonsterId);
    }
    showToast('⚡ Auto: Đã áp dụng Leader & Cấm theo lịch sử!');
  };

  // Quick pick monster handler from suggestions panel
  const handleQuickPickMonster = (monsterId: string) => {
    recordMonsterPick(monsterId);

    // If user has actively selected a slot in Team Tôi
    if (selectedSlotRef && selectedSlotRef.side === 'mine') {
      const idx = selectedSlotRef.index;
      setMyTeam((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], monsterId };
        return next;
      });
      showToast(`Đã chọn vào vị trí #${myTeam[idx].pickOrder}`);
      return;
    }

    // Otherwise, pick into the first empty slot in myTeam
    const emptyIndex = myTeam.findIndex((s) => !s.monsterId);
    if (emptyIndex !== -1) {
      setMyTeam((prev) => {
        const next = [...prev];
        next[emptyIndex] = { ...next[emptyIndex], monsterId };
        return next;
      });
      showToast(`Đã chọn vào vị trí #${myTeam[emptyIndex].pickOrder}`);
      return;
    }

    showToast('Team Tôi đã đủ 5 quái thú. Hãy nhấp chọn 1 vị trí trên bàn cờ để thay thế!');
  };

  // Handle pick monster directly into a chosen slot of Team Tôi (từ tip số vị trí)
  const handlePickMonsterToSlot = (monsterId: string, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= myTeam.length) return;
    recordMonsterPick(monsterId);
    setMyTeam((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], monsterId };
      return next;
    });
    setSelectedSlotRef({ side: 'mine', index: slotIndex });
  };

  // Handle monster selection from picker modal
  const handleSelectMonster = (monsterId: string | null) => {
    if (!activePickerSlot) return;
    const { side, index } = activePickerSlot;

    if (monsterId) {
      recordMonsterPick(monsterId);
    }

    if (side === 'mine') {
      setMyTeam((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], monsterId };
        return next;
      });
    } else {
      setEnemyTeam((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], monsterId };
        return next;
      });
      if (monsterId && !killOrder.includes(monsterId)) {
        setKillOrder((prev) => [...prev, monsterId]);
      }
    }
  };

  // Xử lý chọn nhiều quái thú cho Team Địch và gán vào đúng theo thứ tự chọn
  const handleSelectMultipleMonsters = (monsterIds: string[]) => {
    if (!monsterIds || monsterIds.length === 0) return;

    // Ghi nhận tần suất pick
    monsterIds.forEach((id) => recordMonsterPick(id));

    setEnemyTeam((prev) => {
      const next = [...prev];
      let idIndex = 0;

      // Xác định vị trí bắt đầu gán
      let startIndex = activePickerSlot?.side === 'enemy' ? activePickerSlot.index : -1;
      if (startIndex < 0 || startIndex >= next.length) {
        startIndex = next.findIndex((s) => !s.monsterId);
        if (startIndex === -1) startIndex = 0;
      }

      // 1. Gán vào vị trí xuất phát
      if (idIndex < monsterIds.length) {
        next[startIndex] = { ...next[startIndex], monsterId: monsterIds[idIndex] };
        idIndex++;
      }

      // 2. Điền lần lượt vào các slot TRỐNG tiếp theo sau startIndex
      for (let i = startIndex + 1; i < next.length && idIndex < monsterIds.length; i++) {
        if (!next[i].monsterId) {
          next[i] = { ...next[i], monsterId: monsterIds[idIndex] };
          idIndex++;
        }
      }

      // 3. Nếu vẫn còn pet, điền vào các slot TRỐNG phía trước startIndex
      for (let i = 0; i < startIndex && idIndex < monsterIds.length; i++) {
        if (!next[i].monsterId) {
          next[i] = { ...next[i], monsterId: monsterIds[idIndex] };
          idIndex++;
        }
      }

      // 4. Nếu vẫn còn pet (hết slot trống), ghi đè lần lượt các slot từ startIndex + 1 trở đi
      for (let i = startIndex + 1; i < next.length && idIndex < monsterIds.length; i++) {
        next[i] = { ...next[i], monsterId: monsterIds[idIndex] };
        idIndex++;
      }

      // 5. Nếu vẫn còn, ghi đè các slot trước startIndex
      for (let i = 0; i < startIndex && idIndex < monsterIds.length; i++) {
        next[i] = { ...next[i], monsterId: monsterIds[idIndex] };
        idIndex++;
      }

      return next;
    });

    // Tự động bổ sung vào thứ tự cần tiêu diệt (kill order) theo đúng thứ tự pick
    setKillOrder((prev) => {
      const updated = [...prev];
      monsterIds.forEach((id) => {
        if (!updated.includes(id)) {
          updated.push(id);
        }
      });
      return updated;
    });

    showToast(`Đã gán ${monsterIds.length} quái thú vào Team Địch theo đúng thứ tự chọn!`);
    setActivePickerSlot(null);
  };

  // Mở nhanh modal chọn nhiều pet cho Team Địch
  const handleOpenEnemyBatchPicker = () => {
    const firstEmptyIdx = enemyTeam.findIndex((s) => !s.monsterId);
    setActivePickerSlot({
      side: 'enemy',
      index: firstEmptyIdx !== -1 ? firstEmptyIdx : 0,
    });
  };

  // Toggle Ban on a slot (bans 1 monster per team)
  const toggleBan = (side: 'mine' | 'enemy', index: number) => {
    if (side === 'mine') {
      setMyTeam((prev) => {
        const currentlyBanned = prev[index].isBanned;
        return prev.map((slot, i) => ({
          ...slot,
          isBanned: i === index ? !currentlyBanned : false,
        }));
      });
    } else {
      setEnemyTeam((prev) => {
        const currentlyBanned = prev[index].isBanned;
        return prev.map((slot, i) => ({
          ...slot,
          isBanned: i === index ? !currentlyBanned : false,
        }));
      });
    }
  };

  // Toggle Leader
  const toggleLeader = (side: 'mine' | 'enemy', index: number) => {
    if (side === 'mine') {
      setMyTeam((prev) => {
        const currentlyLead = prev[index].isLeader;
        return prev.map((slot, i) => ({
          ...slot,
          isLeader: i === index ? !currentlyLead : false,
        }));
      });
    } else {
      setEnemyTeam((prev) => {
        const currentlyLead = prev[index].isLeader;
        return prev.map((slot, i) => ({
          ...slot,
          isLeader: i === index ? !currentlyLead : false,
        }));
      });
    }
  };

  // Clear a slot
  const clearSlot = (side: 'mine' | 'enemy', index: number) => {
    if (side === 'mine') {
      setMyTeam((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], monsterId: null, isBanned: false, isLeader: false };
        return next;
      });
    } else {
      const removedId = enemyTeam[index]?.monsterId;
      setEnemyTeam((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], monsterId: null, isBanned: false, isLeader: false };
        return next;
      });
      if (removedId) {
        setKillOrder((prev) => prev.filter((id) => id !== removedId));
      }
    }
  };

  // Reset entire draft
  const handleResetDraft = () => {
    setMyTeam((prev) =>
      prev.map((s) => ({ ...s, monsterId: null, isBanned: false, isLeader: false }))
    );
    setEnemyTeam((prev) =>
      prev.map((s) => ({ ...s, monsterId: null, isBanned: false, isLeader: false }))
    );
    setSelectedSlotRef(null);
    setKillOrder([]);
    showToast('Đã làm mới toàn bộ bàn cờ RTA');
  };

  // Lưu trực tiếp đội hình 5v5 từ bàn cờ ở trên vào lịch sử đấu (mặc định Victory)
  const handleSaveCurrentDraft = async () => {
    const hasMonsters =
      myTeam.some((s) => Boolean(s.monsterId)) ||
      enemyTeam.some((s) => Boolean(s.monsterId));

    if (!hasMonsters) {
      showToast('Bàn cờ chưa có quái vật. Vui lòng chọn đội hình trước khi lưu!');
      return;
    }

    const newRecord: RTAMatchRecord = {
      id: `match-${Date.now()}`,
      createdAt: Date.now(),
      result: 'VICTORY',
      myTeam: myTeam.map((s) => ({ ...s })),
      enemyTeam: enemyTeam.map((s) => ({ ...s })),
    };
    saveHistoryToStorage([newRecord, ...matchHistory]);
    try {
      await saveRTAMatchToFirestore(newRecord);
      showToast('Đã lưu & đồng bộ trận đấu lên Firebase!');
    } catch (err) {
      console.warn('Lỗi lưu trận đấu lên Firebase:', err);
      showToast('Đã lưu đội hình vào lịch sử đấu!');
    }
  };

  // Delete match
  const handleDeleteMatch = async (id: string) => {
    const updated = matchHistory.filter((m) => m.id !== id);
    saveHistoryToStorage(updated);
    try {
      await deleteRTAMatchFromFirestore(id);
      showToast('Đã xóa trận đấu (đồng bộ Firebase)');
    } catch (err) {
      console.warn('Lỗi xóa trận đấu khỏi Firebase:', err);
      showToast('Đã xóa trận đấu khỏi lịch sử');
    }
  };

  // Load match from history back onto the board for review/replay
  const handleLoadMatchToBoard = (record: RTAMatchRecord) => {
    setMyTeam([...record.myTeam]);
    setEnemyTeam([...record.enemyTeam]);
    const isMyFirst = record.myTeam.some((s) => s.pickOrder === 1);
    setFirstPickSide(isMyFirst ? 'mine' : 'enemy');
    const enemyMonIds = record.enemyTeam
      .map((s) => s.monsterId)
      .filter((id): id is string => Boolean(id));
    setKillOrder(enemyMonIds);
    showToast('Đã nạp đội hình trận đấu lên bàn cờ!');
  };

  // Picked IDs to avoid duplicates
  const allPickedIds = [
    ...myTeam.map((s) => s.monsterId),
    ...enemyTeam.map((s) => s.monsterId),
  ].filter((id): id is string => Boolean(id));

  // Danh sách thứ tự cần giết chỉ áp dụng cho pet địch KHÔNG BỊ CẤM (!isBanned)
  const activeUnbannedKillOrder = useMemo(() => {
    const unbannedEnemyMonIds = new Set(
      enemyTeam
        .filter((s) => !s.isBanned && s.monsterId)
        .map((s) => s.monsterId as string)
    );
    return killOrder.filter((id) => unbannedEnemyMonIds.has(id));
  }, [enemyTeam, killOrder]);

  // Helper to render an avatar slot with handlers
  const renderSlot = (
    side: 'mine' | 'enemy',
    index: number,
    size: 'md' | 'lg' = 'lg'
  ) => {
    const team = side === 'mine' ? myTeam : enemyTeam;
    const slot = team[index];
    if (!slot) return null;

    const monster = getMonsterById(allMonsters, slot.monsterId);
    const isSelected =
      selectedSlotRef?.side === side && selectedSlotRef?.index === index;

    // Calculate kill priority if this is an enemy slot with a monster (bỏ pet đã bị cấm)
    const killPriority =
      side === 'enemy' &&
      !slot.isBanned &&
      slot.monsterId &&
      activeUnbannedKillOrder.includes(slot.monsterId)
        ? activeUnbannedKillOrder.indexOf(slot.monsterId) + 1
        : undefined;

    // Gợi ý quái thú dạng mờ (Ghost suggestion) cho ô cờ này nếu đang trống
    const ghostMonster = !slot.monsterId
      ? autoSuggestions.suggestedMonstersByOrder[slot.pickOrder] || null
      : null;

    // Kiểm tra gợi ý Leader (Team Tôi) và Gợi ý Cấm (Team Địch)
    const enemyPickedCount = enemyTeam.filter((s) => Boolean(s.monsterId)).length;
    const myPickedCount = myTeam.filter((s) => Boolean(s.monsterId)).length;

    const isSuggestedLeader =
      Boolean(slot.monsterId) &&
      side === 'mine' &&
      isAutoSuggest &&
      (autoSuggestions.stage === 'lead_and_ban' || myPickedCount >= 4) &&
      slot.monsterId === autoSuggestions.suggestedLeaderMonsterId;

    const isSuggestedBan =
      Boolean(slot.monsterId) &&
      side === 'enemy' &&
      isAutoSuggest &&
      (autoSuggestions.stage === 'lead_and_ban' || enemyPickedCount >= 3) &&
      slot.monsterId === autoSuggestions.suggestedBanMonsterId;

    return (
      <div
        key={`${side}-${index}`}
        className={`relative transition-all rounded-2xl ${
          isSelected
            ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-[#141b2d] z-10'
            : 'hover:ring-1 hover:ring-slate-600'
        }`}
        onClick={() => setSelectedSlotRef({ side, index })}
      >
        <MonsterAvatar
          monster={monster}
          size={size}
          isFirstPick={slot.pickOrder === 1}
          pickOrder={slot.pickOrder}
          isLeader={slot.isLeader}
          isBanned={slot.isBanned}
          killPriority={killPriority}
          showQuickControls={true}
          showTooltip={false}
          ghostMonster={ghostMonster}
          onAcceptGhost={() => handleAcceptSuggestedPick(slot.pickOrder)}
          isSuggestedLeader={isSuggestedLeader}
          isSuggestedBan={isSuggestedBan}
          onAcceptSuggestedLeader={() => {
            if (slot.monsterId) handleAcceptSuggestedLeader(slot.monsterId);
          }}
          onAcceptSuggestedBan={() => {
            if (slot.monsterId) handleAcceptSuggestedBan(slot.monsterId);
          }}
          onClick={
            monster
              ? undefined
              : () => setActivePickerSlot({ side, index })
          }
          onClear={() => clearSlot(side, index)}
          onToggleBan={() => toggleBan(side, index)}
          onToggleLeader={() => toggleLeader(side, index)}
          emptyLabel={`#${slot.pickOrder}`}
        />
      </div>
    );
  };

  // Find slot indices by pick order for accurate geometric positioning
  const getIndexByOrder = (team: RTASlot[], order: number) => {
    return team.findIndex((s) => s.pickOrder === order);
  };

  const selectedSlot =
    selectedSlotRef !== null
      ? (selectedSlotRef.side === 'mine' ? myTeam : enemyTeam)[selectedSlotRef.index]
      : null;
  const selectedMonster = selectedSlot
    ? getMonsterById(allMonsters, selectedSlot.monsterId)
    : null;

  return (
    <div className="space-y-6">
      {/* 3-Column Layout: Left Quick Picks + Center Battle Board + Right Kill Order */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-start">
        {/* Left Column: Pet Tôi Hay Pick (Desktop Left empty space) */}
        <div className="lg:col-span-3 xl:col-span-3 order-2 lg:order-1">
          <QuickPickSuggestions
            allMonsters={allMonsters}
            myTeam={myTeam}
            enemyTeam={enemyTeam}
            selectedSlotRef={selectedSlotRef}
            onPickMonster={handleQuickPickMonster}
            onPickMonsterToSlot={handlePickMonsterToSlot}
            onOpenAddMonster={onOpenAddMonster}
            onShowToast={showToast}
            favoriteIds={favoriteIds}
            onUpdateFavoriteIds={handleUpdateFavoriteIds}
          />
        </div>

        {/* Center Column: Controls Bar + Battle Board + Quick Slot Toolbar */}
        <div className="lg:col-span-6 xl:col-span-6 order-1 lg:order-2 space-y-4 min-w-0">
          {/* Sleek Minimalist Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
            {/* First Pick Toggle & Auto Mode Switch */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">1ST Pick:</span>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => applyFirstPickOrders('mine')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      firstPickSide === 'mine'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Team Trái (Tôi)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFirstPickOrders('enemy')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      firstPickSide === 'enemy'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Team Phải (Địch)
                  </button>
                </div>
              </div>

              {/* Công tắc Bật/Tắt Chế Độ Auto Gợi Ý (Xanh lá = Bật, Đỏ = Tắt) */}
              <button
                type="button"
                onClick={() => {
                  setIsAutoSuggest((prev) => {
                    const next = !prev;
                    showToast(next ? '⚡ Đã BẬT Chế độ Auto Gợi ý (Màu Xanh)' : '🛑 Đã TẮT Chế độ Auto Gợi ý (Màu Đỏ)');
                    return next;
                  });
                }}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold text-xs shadow-md select-none ${
                  isAutoSuggest
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/30 hover:bg-emerald-900/90'
                    : 'bg-rose-950/80 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/30 hover:bg-rose-900/90'
                }`}
                title={
                  isAutoSuggest
                    ? 'Chế độ Auto Gợi ý đang BẬT (Màu Xanh Lá). Bấm để Tắt.'
                    : 'Chế độ Auto Gợi ý đang TẮT (Màu Đỏ). Bấm để Bật.'
                }
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAutoSuggest ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-extrabold tracking-wide uppercase text-[11px]">AUTO:</span>
                </div>

                {/* Switch Track (Màu Xanh khi bật, Màu Đỏ khi tắt) */}
                <div
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shadow-inner ${
                    isAutoSuggest ? 'bg-emerald-500 justify-end' : 'bg-rose-600 justify-start'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                </div>

                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    isAutoSuggest ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {isAutoSuggest ? 'Bật' : 'Tắt'}
                </span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenEnemyBatchPicker}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40 transition-all cursor-pointer hover:border-amber-400 active:scale-95"
                title="Chọn nhiều pet cho Team Địch và tự động gán vào đúng theo thứ tự chọn"
              >
                <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                <span>Chọn nhiều Pet Địch</span>
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentDraft}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                title="Lưu trực tiếp đội hình 5v5 từ bàn cờ ở trên vào lịch sử"
              >
                <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Lưu Lịch Sử Đấu</span>
              </button>
            </div>
          </div>

          {/* Auto Suggestions Smart Banner - Hiển thị hướng dẫn và nút thao tác nhanh trong giai đoạn chọn quái (giai đoạn lead_and_ban đã có nút trực tiếp trên từng avatar nên ẩn banner để giao diện gọn gàng) */}
          {isAutoSuggest && autoSuggestions.isActive && autoSuggestions.stage === 'pick_step' && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-900/90 border-emerald-500/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-black tracking-wide flex items-center gap-1.5 flex-wrap">
                    <span className="text-emerald-400 uppercase">
                      ⚡ AUTO GỢI Ý:
                    </span>
                    <span className="text-slate-200 font-medium">
                      {autoSuggestions.stepDescription}
                    </span>
                  </div>
                  {autoSuggestions.sourceMatchInfo && (
                    <div className="text-[11px] text-slate-300 font-normal mt-0.5 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">✦</span>
                      <span className="truncate">{autoSuggestions.sourceMatchInfo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action button inside banner */}
              <div className="flex items-center gap-2 shrink-0">
                {autoSuggestions.targetPickOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAcceptAllCurrentSuggestions}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Áp dụng gợi ý</span>
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* THE MAIN BATTLE BOARD - EXACT LAYOUT FROM USER'S IMAGE */}
          <div className="bg-[#141b2d] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-2xl overflow-x-auto">
            <div className="w-max min-w-full flex items-center justify-center gap-2 min-[420px]:gap-3 sm:gap-4 md:gap-6 select-none py-2 px-1">
              
              {/* LEFT TEAM (5 MONSTERS) */}
              {firstPickSide === 'mine' ? (
                /* 1 - 2 - 2 (Team Tôi là 1st Pick) */
                <div className="flex items-center gap-1.5 min-[400px]:gap-2 sm:gap-3">
                  {/* Standalone Slot 1 on outer flank */}
                  <div className="flex items-center justify-center">
                    {renderSlot('mine', getIndexByOrder(myTeam, 1), 'lg')}
                  </div>

                  {/* 2x2 Grid: Col 1 = [4, 5], Col 2 = [8, 9] */}
                  <div className="grid grid-cols-2 grid-rows-2 gap-1.5 min-[400px]:gap-2 sm:gap-3">
                    {renderSlot('mine', getIndexByOrder(myTeam, 4), 'lg')}
                    {renderSlot('mine', getIndexByOrder(myTeam, 8), 'lg')}
                    {renderSlot('mine', getIndexByOrder(myTeam, 5), 'lg')}
                    {renderSlot('mine', getIndexByOrder(myTeam, 9), 'lg')}
                  </div>
                </div>
              ) : (
                /* 2 - 2 - 1 (Team Tôi là 2nd Pick) */
                <div className="flex items-center gap-1.5 min-[400px]:gap-2 sm:gap-3">
                  {/* 2x2 Grid first: Col 1 = [2, 3], Col 2 = [6, 7] */}
                  <div className="grid grid-cols-2 grid-rows-2 gap-1.5 min-[400px]:gap-2 sm:gap-3">
                    {renderSlot('mine', getIndexByOrder(myTeam, 2), 'lg')}
                    {renderSlot('mine', getIndexByOrder(myTeam, 6), 'lg')}
                    {renderSlot('mine', getIndexByOrder(myTeam, 3), 'lg')}
                    {renderSlot('mine', getIndexByOrder(myTeam, 7), 'lg')}
                  </div>

                  {/* Standalone Slot 10 near center */}
                  <div className="flex items-center justify-center">
                    {renderSlot('mine', getIndexByOrder(myTeam, 10), 'lg')}
                  </div>
                </div>
              )}

              {/* CENTER: Crossed Swords Circle */}
              <div className="flex items-center justify-center px-0.5 sm:px-1 shrink-0">
                <div className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-[#1b253b] border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <Swords className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[2]" />
                </div>
              </div>

              {/* RIGHT TEAM (5 MONSTERS) */}
              {firstPickSide === 'mine' ? (
                /* 2 - 2 - 1 (Team Địch là 2nd Pick) */
                <div className="flex items-center gap-1.5 min-[400px]:gap-2 sm:gap-3">
                  {/* 2x2 Grid first: Col 1 = [2, 3], Col 2 = [6, 7] */}
                  <div className="grid grid-cols-2 grid-rows-2 gap-1.5 min-[400px]:gap-2 sm:gap-3">
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 2), 'lg')}
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 6), 'lg')}
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 3), 'lg')}
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 7), 'lg')}
                  </div>

                  {/* Standalone Slot 10 on outer flank */}
                  <div className="flex items-center justify-center">
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 10), 'lg')}
                  </div>
                </div>
              ) : (
                /* 1 - 2 - 2 (Team Địch là 1st Pick) */
                <div className="flex items-center gap-1.5 min-[400px]:gap-2 sm:gap-3">
                  {/* Standalone Slot 1 near center */}
                  <div className="flex items-center justify-center">
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 1), 'lg')}
                  </div>

                  {/* 2x2 Grid after: Col 1 = [4, 5], Col 2 = [8, 9] */}
                  <div className="grid grid-cols-2 grid-rows-2 gap-1.5 min-[400px]:gap-2 sm:gap-3">
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 4), 'lg')}
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 8), 'lg')}
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 5), 'lg')}
                    {renderSlot('enemy', getIndexByOrder(enemyTeam, 9), 'lg')}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* QUICK SLOT TOOLBAR (Appears when clicking any slot to easily edit/ban/leader) */}
          {selectedSlotRef && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl animate-in fade-in text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px] sm:text-xs">
                    Vị trí #{selectedSlot?.pickOrder} ({selectedSlotRef.side === 'mine' ? 'Team Tôi' : 'Team Địch'}):
                  </span>
                  <span className="text-teal-300 font-bold text-xs sm:text-sm">
                    {selectedMonster ? selectedMonster.name : '(Chưa chọn pet)'}
                  </span>
                </div>
                {/* Close button for mobile inside header row */}
                <button
                  type="button"
                  onClick={() => setSelectedSlotRef(null)}
                  className="sm:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActivePickerSlot(selectedSlotRef)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl cursor-pointer text-center text-xs"
                >
                  {selectedMonster ? 'Đổi Pet' : 'Chọn Pet'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleBan(selectedSlotRef.side, selectedSlotRef.index)}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                    selectedSlot?.isBanned
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
                  {selectedSlot?.isBanned ? 'Bỏ Cấm' : 'Cấm'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLeader(selectedSlotRef.side, selectedSlotRef.index)}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                    selectedSlot?.isLeader
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  {selectedSlot?.isLeader ? 'Bỏ Lead' : 'Đặt Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => clearSlot(selectedSlotRef.side, selectedSlotRef.index)}
                  className="px-2 py-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer text-xs"
                  title="Xóa slot"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlotRef(null)}
                  className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Thứ Tự Cần Giết (Desktop Right empty space) */}
        <div className="lg:col-span-3 xl:col-span-3 order-3">
          <KillOrderPanel
            enemyTeam={enemyTeam}
            allMonsters={allMonsters}
            killOrder={killOrder}
            onUpdateKillOrder={setKillOrder}
            onShowToast={showToast}
          />
        </div>
      </div>

      {/* MATCH HISTORY CARDS (Rendered in the exact same authentic 5v5 layout) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-wrap items-center gap-2 text-slate-300 font-bold text-sm">
            <History className="w-4 h-4 text-teal-400" />
            <span>Lịch Sử Trận Đấu RTA</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
              {matchHistory.length} trận
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
              <Cloud className="w-3 h-3" />
              {isFirebaseMatchesSynced ? 'Đồng bộ Firebase' : 'Đang kết nối...'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveCurrentDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Lưu đội hình ở trên vào lịch sử"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lưu từ đội hình trên</span>
          </button>
        </div>

        <div className="space-y-3">
          {matchHistory.length === 0 ? (
            <div className="p-8 text-center bg-[#141b2d] border border-slate-800/80 rounded-2xl text-slate-400 space-y-2">
              <p className="text-sm font-medium">Chưa có trận đấu nào trong lịch sử.</p>
              <button
                type="button"
                onClick={handleSaveCurrentDraft}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                Lưu đội hình hiện tại
              </button>
            </div>
          ) : (
            matchHistory.map((record) => (
              <div
                key={record.id}
                className="p-3 sm:p-4 rounded-2xl border transition-all shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-[#141b2d] border-slate-800/80 hover:border-slate-700/80"
              >
                {/* Result tag: clean Victory badge, no player/opponent names */}
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-xs font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    VICTORY
                  </span>
                </div>

              {/* Exact geometric 5v5 battle layout in history - no horizontal scrollbar */}
              {(() => {
                const isMyFirst = record.myTeam.some((s) => s.pickOrder === 1);
                const getHistorySlot = (team: RTASlot[], order: number) => {
                  return team.find((s) => s.pickOrder === order) || team[0];
                };

                return (
                  <div className="w-full md:w-auto overflow-x-auto flex items-center justify-center gap-2 sm:gap-3 py-1 shrink-0">
                    {/* Left team */}
                    {isMyFirst ? (
                      /* 1 - 2 - 2 */
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <MonsterAvatar
                          monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 1).monsterId)}
                          size="xs"
                          isFirstPick={true}
                          pickOrder={1}
                          isLeader={getHistorySlot(record.myTeam, 1).isLeader}
                          isBanned={getHistorySlot(record.myTeam, 1).isBanned}
                        />
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 sm:gap-1.5">
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 4).monsterId)}
                            size="xs"
                            pickOrder={4}
                            isLeader={getHistorySlot(record.myTeam, 4).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 4).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 8).monsterId)}
                            size="xs"
                            pickOrder={8}
                            isLeader={getHistorySlot(record.myTeam, 8).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 8).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 5).monsterId)}
                            size="xs"
                            pickOrder={5}
                            isLeader={getHistorySlot(record.myTeam, 5).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 5).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 9).monsterId)}
                            size="xs"
                            pickOrder={9}
                            isLeader={getHistorySlot(record.myTeam, 9).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 9).isBanned}
                          />
                        </div>
                      </div>
                    ) : (
                      /* 2 - 2 - 1 */
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 sm:gap-1.5">
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 2).monsterId)}
                            size="xs"
                            pickOrder={2}
                            isLeader={getHistorySlot(record.myTeam, 2).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 2).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 6).monsterId)}
                            size="xs"
                            pickOrder={6}
                            isLeader={getHistorySlot(record.myTeam, 6).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 6).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 3).monsterId)}
                            size="xs"
                            pickOrder={3}
                            isLeader={getHistorySlot(record.myTeam, 3).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 3).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 7).monsterId)}
                            size="xs"
                            pickOrder={7}
                            isLeader={getHistorySlot(record.myTeam, 7).isLeader}
                            isBanned={getHistorySlot(record.myTeam, 7).isBanned}
                          />
                        </div>
                        <MonsterAvatar
                          monster={getMonsterById(allMonsters, getHistorySlot(record.myTeam, 10).monsterId)}
                          size="xs"
                          pickOrder={10}
                          isLeader={getHistorySlot(record.myTeam, 10).isLeader}
                          isBanned={getHistorySlot(record.myTeam, 10).isBanned}
                        />
                      </div>
                    )}

                    {/* Center icon */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>

                    {/* Right team */}
                    {isMyFirst ? (
                      /* 2 - 2 - 1 */
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 sm:gap-1.5">
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 2).monsterId)}
                            size="xs"
                            pickOrder={2}
                            isLeader={getHistorySlot(record.enemyTeam, 2).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 2).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 6).monsterId)}
                            size="xs"
                            pickOrder={6}
                            isLeader={getHistorySlot(record.enemyTeam, 6).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 6).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 3).monsterId)}
                            size="xs"
                            pickOrder={3}
                            isLeader={getHistorySlot(record.enemyTeam, 3).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 3).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 7).monsterId)}
                            size="xs"
                            pickOrder={7}
                            isLeader={getHistorySlot(record.enemyTeam, 7).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 7).isBanned}
                          />
                        </div>
                        <MonsterAvatar
                          monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 10).monsterId)}
                          size="xs"
                          pickOrder={10}
                          isLeader={getHistorySlot(record.enemyTeam, 10).isLeader}
                          isBanned={getHistorySlot(record.enemyTeam, 10).isBanned}
                        />
                      </div>
                    ) : (
                      /* 1 - 2 - 2 */
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <MonsterAvatar
                          monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 1).monsterId)}
                          size="xs"
                          isFirstPick={true}
                          pickOrder={1}
                          isLeader={getHistorySlot(record.enemyTeam, 1).isLeader}
                          isBanned={getHistorySlot(record.enemyTeam, 1).isBanned}
                        />
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 sm:gap-1.5">
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 4).monsterId)}
                            size="xs"
                            pickOrder={4}
                            isLeader={getHistorySlot(record.enemyTeam, 4).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 4).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 8).monsterId)}
                            size="xs"
                            pickOrder={8}
                            isLeader={getHistorySlot(record.enemyTeam, 8).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 8).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 5).monsterId)}
                            size="xs"
                            pickOrder={5}
                            isLeader={getHistorySlot(record.enemyTeam, 5).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 5).isBanned}
                          />
                          <MonsterAvatar
                            monster={getMonsterById(allMonsters, getHistorySlot(record.enemyTeam, 9).monsterId)}
                            size="xs"
                            pickOrder={9}
                            isLeader={getHistorySlot(record.enemyTeam, 9).isLeader}
                            isBanned={getHistorySlot(record.enemyTeam, 9).isBanned}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions: Load to board & Delete */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLoadMatchToBoard(record)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Nạp đội hình này lên bàn cờ 5v5 để xem / phân tích"
                >
                  <Play className="w-3 h-3 fill-current text-teal-400" />
                  <span className="hidden sm:inline">Nạp lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMatchToDelete(record)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Xóa trận đấu khỏi lịch sử"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Match Confirmation Modal (Yes / No) */}
      {matchToDelete && (
        <div
          id="delete-match-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setMatchToDelete(null)}
        >
          <div
            id="delete-match-modal"
            className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Xóa Lịch Sử Trận Đấu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bạn có chắc chắn muốn xóa trận đấu này khỏi lịch sử?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMatchToDelete(null)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>{matchToDelete.title || 'Trận đấu RTA'}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {new Date(matchToDelete.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ghi chú: {matchToDelete.notes || 'Không có ghi chú'}
              </p>
            </div>

            {/* Yes / No Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                id="btn-confirm-delete-match-no"
                type="button"
                onClick={() => setMatchToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Không (No)</span>
              </button>
              <button
                id="btn-confirm-delete-match-yes"
                type="button"
                onClick={() => {
                  handleDeleteMatch(matchToDelete.id);
                  setMatchToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Có, Xóa (Yes)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monster Picker Modal */}
      {activePickerSlot && (
        <MonsterPickerModal
          isOpen={Boolean(activePickerSlot)}
          onClose={() => setActivePickerSlot(null)}
          onSelectMonster={handleSelectMonster}
          onSelectMultipleMonsters={handleSelectMultipleMonsters}
          onSelectMonsterToSlot={handlePickMonsterToSlot}
          myTeam={myTeam}
          enemyTeam={enemyTeam}
          activePickerSlot={activePickerSlot}
          allMonsters={allMonsters}
          currentMonsterId={
            activePickerSlot.side === 'mine'
              ? myTeam[activePickerSlot.index].monsterId
              : enemyTeam[activePickerSlot.index].monsterId
          }
          excludedMonsterIds={allPickedIds}
          title={
            activePickerSlot.side === 'mine'
              ? `Chọn Pet Team Tôi (Vị trí #${myTeam[activePickerSlot.index].pickOrder})`
              : `Chọn Pet Team Địch (Vị trí #${enemyTeam[activePickerSlot.index].pickOrder})`
          }
          onOpenAddModal={onOpenAddMonster}
          mode="rta"
          allowMultiSelect={activePickerSlot.side === 'enemy'}
        />
      )}
    </div>
  );
};
