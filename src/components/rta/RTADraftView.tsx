import React, { useState } from 'react';
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
} from 'lucide-react';
import { Monster, RTAMatchRecord, RTASlot } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';

interface RTADraftViewProps {
  allMonsters: Monster[];
  onOpenAddMonster: () => void;
}

// Storage key for persistent RTA match history
const RTA_HISTORY_STORAGE_KEY = 'sw_rta_match_history_records_v1';

const DEFAULT_SAMPLE_HISTORY: RTAMatchRecord[] = [
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

// Initial teams matching the user's reference image
const INITIAL_MY_TEAM: RTASlot[] = [
  { monsterId: 'moore', isBanned: false, isLeader: false, pickOrder: 1 },
  { monsterId: 'shizuka', isBanned: false, isLeader: false, pickOrder: 4 },
  { monsterId: 'karnal', isBanned: false, isLeader: false, pickOrder: 5 },
  { monsterId: 'savannah', isBanned: false, isLeader: true, pickOrder: 8 },
  { monsterId: 'tractor', isBanned: true, isLeader: false, pickOrder: 9 },
];

const INITIAL_ENEMY_TEAM: RTASlot[] = [
  { monsterId: 'oliver', isBanned: true, isLeader: false, pickOrder: 2 },
  { monsterId: 'seara', isBanned: false, isLeader: false, pickOrder: 3 },
  { monsterId: 'woosa', isBanned: false, isLeader: false, pickOrder: 6 },
  { monsterId: 'miles', isBanned: false, isLeader: false, pickOrder: 7 },
  { monsterId: 'dominic', isBanned: false, isLeader: true, pickOrder: 10 },
];

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

  // Match History records with persistent local storage
  const [matchHistory, setMatchHistory] = useState<RTAMatchRecord[]>(getStoredHistory);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Handle monster selection
  const handleSelectMonster = (monsterId: string | null) => {
    if (!activePickerSlot) return;
    const { side, index } = activePickerSlot;

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
    }
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
      setEnemyTeam((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], monsterId: null, isBanned: false, isLeader: false };
        return next;
      });
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
  };

  // Lưu trực tiếp đội hình 5v5 từ bàn cờ ở trên vào lịch sử đấu (mặc định Victory)
  const handleSaveCurrentDraft = () => {
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
    showToast('Đã lưu đội hình vào lịch sử đấu!');
  };

  // Delete match
  const handleDeleteMatch = (id: string) => {
    const updated = matchHistory.filter((m) => m.id !== id);
    saveHistoryToStorage(updated);
    showToast('Đã xóa trận đấu khỏi lịch sử');
  };

  // Load match from history back onto the board for review/replay
  const handleLoadMatchToBoard = (record: RTAMatchRecord) => {
    setMyTeam([...record.myTeam]);
    setEnemyTeam([...record.enemyTeam]);
    const isMyFirst = record.myTeam.some((s) => s.pickOrder === 1);
    setFirstPickSide(isMyFirst ? 'mine' : 'enemy');
    showToast('Đã nạp đội hình trận đấu lên bàn cờ!');
  };

  // Picked IDs to avoid duplicates
  const allPickedIds = [
    ...myTeam.map((s) => s.monsterId),
    ...enemyTeam.map((s) => s.monsterId),
  ].filter((id): id is string => Boolean(id));

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

    return (
      <div
        key={`${side}-${index}`}
        className={`relative transition-transform ${
          isSelected ? 'ring-2 ring-teal-400 rounded-2xl scale-105' : ''
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
          showQuickControls={true}
          onClick={() => setActivePickerSlot({ side, index })}
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
      {/* Sleek Minimalist Controls Bar (No redundant text) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        {/* First Pick Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">1ST Pick:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => applyFirstPickOrders('mine')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                firstPickSide === 'enemy'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Team Phải (Địch)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleSaveCurrentDraft}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            title="Lưu trực tiếp đội hình 5v5 từ bàn cờ ở trên vào lịch sử"
          >
            <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
            Lưu Lịch Sử Đấu
          </button>
        </div>
      </div>

      {/* THE MAIN BATTLE BOARD - EXACT LAYOUT FROM USER'S IMAGE */}
      <div className="bg-[#141b2d] border border-slate-800/90 rounded-3xl px-5 py-8 sm:px-8 sm:py-10 shadow-2xl overflow-x-auto flex justify-center">
        <div className="min-w-fit flex items-center justify-center gap-4 sm:gap-6 md:gap-8 select-none pt-4 pb-2">
          
          {/* LEFT TEAM (5 MONSTERS) */}
          {firstPickSide === 'mine' ? (
            /* 1 - 2 - 2 (Team Tôi là 1st Pick) */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Standalone Slot 1 on outer flank */}
              <div className="flex items-center justify-center">
                {renderSlot('mine', getIndexByOrder(myTeam, 1), 'lg')}
              </div>

              {/* 2x2 Grid: Col 1 = [4, 5], Col 2 = [8, 9] */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
                {renderSlot('mine', getIndexByOrder(myTeam, 4), 'lg')}
                {renderSlot('mine', getIndexByOrder(myTeam, 8), 'lg')}
                {renderSlot('mine', getIndexByOrder(myTeam, 5), 'lg')}
                {renderSlot('mine', getIndexByOrder(myTeam, 9), 'lg')}
              </div>
            </div>
          ) : (
            /* 2 - 2 - 1 (Team Tôi là 2nd Pick) */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 2x2 Grid first: Col 1 = [2, 3], Col 2 = [6, 7] */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
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
          <div className="flex items-center justify-center px-1 shrink-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#1b253b] border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-inner">
              <Swords className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
          </div>

          {/* RIGHT TEAM (5 MONSTERS) */}
          {firstPickSide === 'mine' ? (
            /* 2 - 2 - 1 (Team Địch là 2nd Pick) */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 2x2 Grid first: Col 1 = [2, 3], Col 2 = [6, 7] */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
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
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Standalone Slot 1 near center */}
              <div className="flex items-center justify-center">
                {renderSlot('enemy', getIndexByOrder(enemyTeam, 1), 'lg')}
              </div>

              {/* 2x2 Grid after: Col 1 = [4, 5], Col 2 = [8, 9] */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
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
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl animate-in fade-in text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-semibold">
              Vị trí đang chọn: #{selectedSlot?.pickOrder} ({selectedSlotRef.side === 'mine' ? 'Team Tôi' : 'Team Địch'})
            </span>
            <span className="text-white font-bold">
              {selectedMonster ? selectedMonster.name : '(Chưa chọn pet)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePickerSlot(selectedSlotRef)}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Đổi Pet
            </button>
            <button
              type="button"
              onClick={() => toggleBan(selectedSlotRef.side, selectedSlotRef.index)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                selectedSlot?.isBanned
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
              }`}
            >
              <Ban className="w-3.5 h-3.5 stroke-[2.5]" />
              {selectedSlot?.isBanned ? 'Bỏ Cấm' : 'Cấm (Ban)'}
            </button>
            <button
              type="button"
              onClick={() => toggleLeader(selectedSlotRef.side, selectedSlotRef.index)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                selectedSlot?.isLeader
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              {selectedSlot?.isLeader ? 'Bỏ Lead' : 'Đặt Leader'}
            </button>
            <button
              type="button"
              onClick={() => clearSlot(selectedSlotRef.side, selectedSlotRef.index)}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Xóa slot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MATCH HISTORY CARDS (Rendered in the exact same authentic 5v5 layout) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
            <History className="w-4 h-4 text-teal-400" />
            <span>Lịch Sử Trận Đấu RTA</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
              {matchHistory.length} trận
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
                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 shrink-0">
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
                  onClick={() => handleDeleteMatch(record.id)}
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

      {/* Monster Picker Modal */}
      {activePickerSlot && (
        <MonsterPickerModal
          isOpen={Boolean(activePickerSlot)}
          onClose={() => setActivePickerSlot(null)}
          onSelectMonster={handleSelectMonster}
          allMonsters={allMonsters}
          currentMonsterId={
            activePickerSlot.side === 'mine'
              ? myTeam[activePickerSlot.index].monsterId
              : enemyTeam[activePickerSlot.index].monsterId
          }
          excludedMonsterIds={allPickedIds}
          title={`Chọn Pet cho ${
            activePickerSlot.side === 'mine' ? 'Team Trái' : 'Team Phải'
          } (Vị trí #${(activePickerSlot.side === 'mine' ? myTeam : enemyTeam)[activePickerSlot.index].pickOrder})`}
          onOpenAddModal={onOpenAddMonster}
        />
      )}
    </div>
  );
};
