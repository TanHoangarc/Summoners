import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Swords,
  Shield,
  Pencil,
  List,
  Search,
  Image as ImageIcon,
  Check,
  Eye,
  Crosshair,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { Monster, SiegeCounterStrategy } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { recordMonsterPick } from '../../utils/monsterPickStats';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';
import { PetInfoImageModal } from './PetInfoImageModal';

interface SaveCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defenseIds: [string | null, string | null, string | null];
  allMonsters: Monster[];
  onSave: (counter: SiegeCounterStrategy) => void;
  editingCounter?: SiegeCounterStrategy | null;
  onOpenAddMonster?: () => void;
  existingCounters?: SiegeCounterStrategy[];
  initialPriorityTargetMonsterId?: string | null;
}

export const SaveCounterModal: React.FC<SaveCounterModalProps> = ({
  isOpen,
  onClose,
  defenseIds,
  allMonsters,
  onSave,
  editingCounter,
  onOpenAddMonster,
  existingCounters = [],
  initialPriorityTargetMonsterId,
}) => {
  // Defense monsters for display
  const def1 = getMonsterById(allMonsters, defenseIds[0]);
  const def2 = getMonsterById(allMonsters, defenseIds[1]);
  const def3 = getMonsterById(allMonsters, defenseIds[2]);

  // Priority Kill Target for Defense (pet ưu tiên tiêu diệt trước)
  const [priorityTargetMonsterId, setPriorityTargetMonsterId] = useState<string | null>(null);

  // Counter slots
  const [counterSlots, setCounterSlots] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Info images for each pet slot
  const [petImages, setPetImages] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [editingImageSlot, setEditingImageSlot] = useState<number | null>(null);

  // Quick team picker from existing counters
  const [isTeamPickerOpen, setIsTeamPickerOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Yêu cầu rune cao'>('Trung bình');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Tooltip hover state for pet image preview
  const [hoveredPetImageSlot, setHoveredPetImageSlot] = useState<{
    slotIdx: number;
    rect: DOMRect;
  } | null>(null);

  // Sync Existing History Image Modal State
  const [syncModalSlotIndex, setSyncModalSlotIndex] = useState<number | null>(null);
  const [previewingHistoryImageUrl, setPreviewingHistoryImageUrl] = useState<string | null>(null);
  const [showAllMonstersHistory, setShowAllMonstersHistory] = useState(false);

  // Helper to extract historical images for a specific monster across all existing counters
  const getMonsterHistoryImages = (monsterId?: string | null) => {
    if (!monsterId || !existingCounters || existingCounters.length === 0) return [];

    const list: {
      imageUrl: string;
      counterId: string;
      teamName: string;
      defenseTeamName?: string;
      date?: string;
      difficulty?: string;
    }[] = [];

    const seenUrls = new Set<string>();

    for (const c of existingCounters) {
      if (!c.counterMonsterIds || !c.petImages) continue;

      c.counterMonsterIds.forEach((id, sIdx) => {
        if (id === monsterId && c.petImages?.[sIdx]) {
          const url = c.petImages[sIdx];
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);

            const teamName = c.counterMonsterIds
              .map((mId) => getMonsterById(allMonsters, mId)?.name)
              .filter(Boolean)
              .join(' + ');

            const defTeamName = c.defenseMonsterIds
              ? c.defenseMonsterIds
                  .map((mId) => getMonsterById(allMonsters, mId)?.name)
                  .filter(Boolean)
                  .join(' • ')
              : undefined;

            list.push({
              imageUrl: url,
              counterId: c.id,
              teamName: teamName || 'Đội Counter',
              defenseTeamName: defTeamName ? `Khắc chế: ${defTeamName}` : undefined,
              date: c.date,
              difficulty: c.difficulty,
            });
          }
        }
      });
    }

    return list;
  };

  // Collect all historical images across all monsters for broad browsing
  const allHistoryImages = useMemo(() => {
    if (!existingCounters || existingCounters.length === 0) return [];
    const list: {
      imageUrl: string;
      monster?: Monster | null;
      counterId: string;
      teamName: string;
      defenseTeamName?: string;
      date?: string;
      difficulty?: string;
    }[] = [];
    const seen = new Set<string>();

    for (const c of existingCounters) {
      if (!c.counterMonsterIds || !c.petImages) continue;
      c.counterMonsterIds.forEach((id, sIdx) => {
        const url = c.petImages?.[sIdx];
        if (url && !seen.has(url)) {
          seen.add(url);

          const teamName = c.counterMonsterIds
            .map((mId) => getMonsterById(allMonsters, mId)?.name)
            .filter(Boolean)
            .join(' + ');

          const defTeamName = c.defenseMonsterIds
            ? c.defenseMonsterIds
                .map((mId) => getMonsterById(allMonsters, mId)?.name)
                .filter(Boolean)
                .join(' • ')
            : undefined;

          list.push({
            imageUrl: url,
            monster: getMonsterById(allMonsters, id),
            counterId: c.id,
            teamName: teamName || 'Đội Counter',
            defenseTeamName: defTeamName ? `Khắc chế: ${defTeamName}` : undefined,
            date: c.date,
            difficulty: c.difficulty,
          });
        }
      });
    }
    return list;
  }, [existingCounters, allMonsters]);

  const handleApplyHistoryImage = (imageUrl: string) => {
    if (syncModalSlotIndex === null) return;
    const nextImages = [...petImages] as [string | null, string | null, string | null];
    nextImages[syncModalSlotIndex] = imageUrl;
    setPetImages(nextImages);

    const mon = getMonsterById(allMonsters, counterSlots[syncModalSlotIndex]);
    setSyncModalSlotIndex(null);
    setPreviewingHistoryImageUrl(null);
    setSuccessNotice(`Đã đồng bộ ảnh thành công cho ${mon?.name || `Pet ${syncModalSlotIndex + 1}`}!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Extract unique 3-monster counter teams from existing counters
  const distinctTeams = useMemo(() => {
    if (!existingCounters || existingCounters.length === 0) return [];

    const map = new Map<
      string,
      {
        id: string;
        monsterIds: [string, string, string];
        monsters: (Monster | undefined)[];
        name: string;
        difficulty?: string;
        petImages?: [string | null, string | null, string | null];
      }
    >();

    for (const c of existingCounters) {
      if (!c.counterMonsterIds || c.counterMonsterIds.length < 3) continue;
      const [m1Id, m2Id, m3Id] = c.counterMonsterIds;
      if (!m1Id || !m2Id || !m3Id) continue;

      const sortedKey = [m1Id, m2Id, m3Id].sort().join('__');
      if (!map.has(sortedKey)) {
        const mon1 = getMonsterById(allMonsters, m1Id);
        const mon2 = getMonsterById(allMonsters, m2Id);
        const mon3 = getMonsterById(allMonsters, m3Id);
        const name = [mon1?.name, mon2?.name, mon3?.name].filter(Boolean).join(' + ');

        map.set(sortedKey, {
          id: c.id,
          monsterIds: [m1Id, m2Id, m3Id],
          monsters: [mon1, mon2, mon3],
          name: name || 'Team 3 quái thú',
          difficulty: c.difficulty,
          petImages: c.petImages,
        });
      }
    }

    return Array.from(map.values());
  }, [existingCounters, allMonsters]);

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return distinctTeams;
    const q = teamSearchQuery.toLowerCase().trim();
    return distinctTeams.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      return t.monsters.some((m) => m?.name?.toLowerCase().includes(q));
    });
  }, [distinctTeams, teamSearchQuery]);

  const handleSelectQuickTeam = (team: {
    monsterIds: [string, string, string];
    name: string;
    difficulty?: string;
    petImages?: [string | null, string | null, string | null];
  }) => {
    setCounterSlots([team.monsterIds[0], team.monsterIds[1], team.monsterIds[2]]);
    if (team.petImages) {
      setPetImages(team.petImages);
    }

    if (team.difficulty && ['Dễ', 'Trung bình', 'Yêu cầu rune cao'].includes(team.difficulty)) {
      setDifficulty(team.difficulty as 'Dễ' | 'Trung bình' | 'Yêu cầu rune cao');
    }

    setIsTeamPickerOpen(false);
    setSuccessNotice(`Đã chọn nhanh team: ${team.name}`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingCounter) {
        setCounterSlots([
          editingCounter.counterMonsterIds[0] || null,
          editingCounter.counterMonsterIds[1] || null,
          editingCounter.counterMonsterIds[2] || null,
        ]);
        setPetImages(editingCounter.petImages || [null, null, null]);
        setDifficulty(editingCounter.difficulty || 'Trung bình');
        setPriorityTargetMonsterId(
          editingCounter.priorityTargetMonsterId !== undefined
            ? editingCounter.priorityTargetMonsterId
            : initialPriorityTargetMonsterId || null
        );
      } else {
        setCounterSlots([null, null, null]);
        setPetImages([null, null, null]);
        setDifficulty('Trung bình');
        setPriorityTargetMonsterId(initialPriorityTargetMonsterId || null);
      }
      setError(null);
      setSuccessNotice(null);
      setActiveSlotIndex(null);
      setIsTeamPickerOpen(false);
      setTeamSearchQuery('');
      setEditingImageSlot(null);
      setHoveredPetImageSlot(null);
    }
  }, [isOpen, editingCounter, initialPriorityTargetMonsterId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!defenseIds[0] || !defenseIds[1] || !defenseIds[2]) {
      setError('Đội hình defense chưa đủ 3 quái thú!');
      return;
    }

    if (!counterSlots[0] || !counterSlots[1] || !counterSlots[2]) {
      setError('Vui lòng chọn đủ 3 quái thú cho đội hình counter!');
      return;
    }

    const savedCounter: SiegeCounterStrategy = {
      id: editingCounter ? editingCounter.id : `counter-custom-${Date.now()}`,
      defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]],
      counterMonsterIds: [counterSlots[0], counterSlots[1], counterSlots[2]],
      rating: editingCounter?.rating || 5.0,
      ratingCount: editingCounter ? editingCounter.ratingCount || 1 : 1,
      author: editingCounter?.author || '',
      date: editingCounter ? editingCounter.date : new Date().toLocaleDateString('vi-VN'),
      difficulty: difficulty,
      strategy: editingCounter?.strategy || '',
      isCustom: true,
      updatedAt: new Date().toISOString(),
      petImages: petImages,
      priorityTargetMonsterId: priorityTargetMonsterId || null,
    };

    onSave(savedCounter);
    onClose();
  };

  const currentEditingMonster =
    editingImageSlot !== null
      ? getMonsterById(allMonsters, counterSlots[editingImageSlot])
      : null;

  const currentEditingMonsterForSync =
    syncModalSlotIndex !== null
      ? getMonsterById(allMonsters, counterSlots[syncModalSlotIndex])
      : null;

  const currentSyncMonsterImages = currentEditingMonsterForSync
    ? getMonsterHistoryImages(currentEditingMonsterForSync.id)
    : [];

  const displaySyncImages = showAllMonstersHistory
    ? allHistoryImages
    : currentSyncMonsterImages;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-0 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-500/15 text-teal-400 rounded-xl border border-teal-500/25">
                {editingCounter ? <Pencil className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {editingCounter ? 'Chỉnh Sửa Đội Hình Counter' : 'Thêm & Lưu Đội Hình Counter'}
                </h3>
                <p className="text-xs text-slate-400">
                  Chọn 3 quái thú và dán ảnh thông tin/rune cho từng pet
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium">
                {error}
              </div>
            )}

            {successNotice && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Target Defense Display with Priority Kill Selection */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Đội hình Defense mục tiêu cần khắc chế:
                </span>
                {priorityTargetMonsterId ? (
                  <span className="text-[11px] font-bold text-red-400 flex items-center gap-1 bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/40 animate-pulse">
                    <X className="w-3.5 h-3.5 stroke-[3.5] text-red-400" />
                    Ưu tiên kill: {getMonsterById(allMonsters, priorityTargetMonsterId)?.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    (Nhấp chọn pet ưu tiên kill trước)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[def1, def2, def3].map((mon, idx) => {
                  const isPriority = Boolean(mon && priorityTargetMonsterId === mon.id);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (mon) {
                          setPriorityTargetMonsterId((prev) => (prev === mon.id ? null : mon.id));
                        }
                      }}
                      className={`relative flex flex-col items-center p-2.5 rounded-2xl transition-all cursor-pointer border ${
                        isPriority
                          ? 'bg-red-950/40 border-red-500/90 ring-2 ring-red-500/50 shadow-[0_0_14px_rgba(239,68,68,0.35)]'
                          : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-750'
                      }`}
                      title={
                        mon
                          ? isPriority
                            ? `Đang chọn ${mon.name} là mục tiêu ưu tiên kill trước. Nhấp để hủy.`
                            : `Nhấp để chọn ${mon.name} là mục tiêu ưu tiên kill trước`
                          : undefined
                      }
                    >
                      {/* Avatar with Red X overlay if priority */}
                      <div className="relative">
                        <MonsterAvatar
                          monster={mon}
                          size="md"
                          showStars={false}
                          showName={false}
                          isLeader={idx === 0}
                        />

                        {/* Prominent Red X overlay */}
                        {isPriority && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none rounded-xl bg-red-950/60 backdrop-blur-[0.5px]">
                            <X className="w-7 h-7 text-red-500 stroke-[4] drop-shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse" />
                            <span className="absolute -bottom-1 px-1.5 py-0 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-wider shadow-md border border-red-300">
                              KILL
                            </span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`mt-1.5 text-xs font-bold truncate max-w-full text-center ${
                          isPriority ? 'text-red-300 font-black' : 'text-slate-200'
                        }`}
                      >
                        {mon?.name || 'Trống'}
                      </span>

                      {/* Nút chọn pet ưu tiên kill trước */}
                      {mon && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPriorityTargetMonsterId((prev) => (prev === mon.id ? null : mon.id));
                          }}
                          className={`mt-2 w-full py-1 px-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                            isPriority
                              ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-md ring-1 ring-red-300'
                              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700 hover:border-red-400/50'
                          }`}
                        >
                          {isPriority ? (
                            <>
                              <X className="w-3 h-3 stroke-[3]" />
                              <span>Đang ưu tiên</span>
                            </>
                          ) : (
                            <>
                              <Crosshair className="w-3 h-3 text-red-400" />
                              <span>Ưu tiên kill</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                <Crosshair className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>
                  {priorityTargetMonsterId ? (
                    <>
                      Đã chọn pet <span className="font-bold text-red-400">{getMonsterById(allMonsters, priorityTargetMonsterId)?.name}</span>. Khi lưu, tại cột Counter sẽ hiển thị dấu X đỏ trực tiếp lên quái thú này!
                    </>
                  ) : (
                    'Bấm vào quái thú hoặc nút "Ưu tiên kill" để đánh dấu pet cần tiêu diệt trước.'
                  )}
                </span>
              </div>
            </div>

            {/* 3 Counter Monster Pickers */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Chọn 3 Quái Thú Counter Của Bạn:
                </label>
                <button
                  type="button"
                  onClick={() => setIsTeamPickerOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border shadow-sm ${
                    isTeamPickerOpen
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border-slate-700 hover:border-teal-500/50'
                  }`}
                  title="Hiện danh sách các team counter đã có để chọn nhanh"
                >
                  <List className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Team counter đã có ({distinctTeams.length})</span>
                </button>
              </div>

              {/* Quick Select Team Panel */}
              {isTeamPickerOpen && (
                <div className="p-3 bg-slate-900 border border-teal-500/40 rounded-2xl space-y-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Chọn nhanh từ các team counter đã có ({distinctTeams.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTeamPickerOpen(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Đóng"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search bar inside quick list */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên quái thú..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  {/* Scrollable list of teams */}
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {filteredTeams.length === 0 ? (
                      <div className="py-5 text-center text-xs text-slate-500">
                        {distinctTeams.length === 0
                          ? 'Chưa có đội hình counter nào được lưu trên hệ thống'
                          : 'Không tìm thấy team counter phù hợp từ khóa'}
                      </div>
                    ) : (
                      filteredTeams.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => handleSelectQuickTeam(team)}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center -space-x-2 shrink-0">
                              {team.monsters.map((mon, mIdx) => (
                                <div key={mIdx} className="relative ring-2 ring-slate-900 rounded-full">
                                  <MonsterAvatar monster={mon} size="sm" showStars={false} showName={false} />
                                </div>
                              ))}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors truncate">
                                {team.name}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 px-2 py-0.5 bg-teal-500/10 rounded-lg">
                            Chọn team này →
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 3 Counter Slots with Photo Edit & Hover Tooltip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-teal-500/20">
                {counterSlots.map((slotId, idx) => {
                  const monster = getMonsterById(allMonsters, slotId);
                  const hasImage = Boolean(petImages[idx]);

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 text-center relative group/slot">
                      <div
                        className="relative"
                        onMouseEnter={(e) => {
                          if (hasImage) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPetImageSlot({ slotIdx: idx, rect });
                          }
                        }}
                        onMouseLeave={() => setHoveredPetImageSlot(null)}
                      >
                        <MonsterAvatar
                          monster={monster}
                          size="md"
                          showStars={true}
                          showName={false}
                          isLeader={idx === 0}
                          onClick={() => {
                            setActiveSlotIndex(idx);
                          }}
                          emptyLabel={`Pet ${idx + 1}`}
                          onClear={
                            slotId
                              ? () => {
                                  const nextSlots = [...counterSlots] as [
                                    string | null,
                                    string | null,
                                    string | null
                                  ];
                                  nextSlots[idx] = null;
                                  setCounterSlots(nextSlots);

                                  const nextImages = [...petImages] as [
                                    string | null,
                                    string | null,
                                    string | null
                                  ];
                                  nextImages[idx] = null;
                                  setPetImages(nextImages);
                                }
                              : undefined
                          }
                        />

                        {/* Image Indicator / Quick Edit Icon on top of Pet */}
                        {monster && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImageSlot(idx);
                            }}
                            className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-lg border transition-all cursor-pointer ${
                              hasImage
                                ? 'bg-teal-500 text-slate-950 border-teal-300 hover:bg-teal-400 ring-2 ring-teal-400/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-600'
                            }`}
                            title={hasImage ? 'Xem & sửa ảnh thông tin Pet này' : 'Dán ảnh thông tin Pet này'}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="w-full">
                        <span className="text-xs font-bold text-white block truncate px-1">
                          {monster ? monster.name : `Chọn Pet ${idx + 1}`}
                        </span>

                        {monster ? (
                          <div className="mt-1 flex flex-wrap items-center justify-center gap-1 w-full px-0.5">
                            {/* Dán / Sửa ảnh */}
                            <button
                              type="button"
                              onClick={() => setEditingImageSlot(idx)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                hasImage
                                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title={hasImage ? 'Bấm để đổi hoặc xóa ảnh' : 'Bấm để dán ảnh mới từ clipboard hoặc tải lên'}
                            >
                              <ImageIcon className="w-3 h-3 text-teal-400" />
                              <span>{hasImage ? 'Ảnh' : 'Dán'}</span>
                            </button>

                            {/* Nút Đồng Bộ ảnh đã có */}
                            <button
                              type="button"
                              onClick={() => {
                                setSyncModalSlotIndex(idx);
                                setShowAllMonstersHistory(false);
                                setPreviewingHistoryImageUrl(null);
                              }}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                getMonsterHistoryImages(monster.id).length > 0
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                              }`}
                              title={`Đồng bộ ảnh đã có của ${monster.name} từ các lịch sử counter khác (${getMonsterHistoryImages(monster.id).length} ảnh)`}
                            >
                              <RefreshCw className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>
                                Đồng bộ
                                {getMonsterHistoryImages(monster.id).length > 0
                                  ? ` (${getMonsterHistoryImages(monster.id).length})`
                                  : ''}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveSlotIndex(idx)}
                            className="mt-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium underline underline-offset-2 cursor-pointer"
                          >
                            + Chọn ngay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Difficulty selector (simple & clean) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-300">
                Độ khó / Yêu cầu rune:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Dễ', 'Trung bình', 'Yêu cầu rune cao'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      difficulty === diff
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={!counterSlots[0] || !counterSlots[1] || !counterSlots[2]}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{editingCounter ? 'Cập Nhật Counter' : 'Lưu Đội Hình Counter'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Pet Image Tooltip on Hover */}
      {hoveredPetImageSlot !== null && petImages[hoveredPetImageSlot.slotIdx] && (
        <div
          className="fixed z-[70] pointer-events-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${Math.max(16, Math.min(hoveredPetImageSlot.rect.left - 80, window.innerWidth - 380))}px`,
            top: `${Math.max(16, Math.min(hoveredPetImageSlot.rect.bottom + 10, window.innerHeight - 380))}px`,
          }}
        >
          <div className="bg-slate-950/95 border-2 border-teal-500/80 rounded-2xl shadow-2xl p-2.5 max-w-[360px] backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  {getMonsterById(allMonsters, counterSlots[hoveredPetImageSlot.slotIdx])?.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  Ảnh thông tin Pet
                </span>
              </div>
            </div>
            <img
              src={petImages[hoveredPetImageSlot.slotIdx]!}
              alt="Thông tin quái thú"
              className="max-h-[280px] max-w-full rounded-xl object-contain border border-slate-700/80 mx-auto"
            />
          </div>
        </div>
      )}

      {/* Monster Picker Modal */}
      {activeSlotIndex !== null && (
        <MonsterPickerModal
          isOpen={activeSlotIndex !== null}
          onClose={() => setActiveSlotIndex(null)}
          onSelectMonster={(monsterId) => {
            if (monsterId) {
              recordMonsterPick(monsterId);
            }
            const next = [...counterSlots] as [string | null, string | null, string | null];
            next[activeSlotIndex] = monsterId;
            setCounterSlots(next);
            setActiveSlotIndex(null);
          }}
          allMonsters={allMonsters}
          currentMonsterId={counterSlots[activeSlotIndex]}
          title={`Chọn Pet Counter ${activeSlotIndex + 1}`}
          onOpenAddModal={onOpenAddMonster}
          mode="siege"
        />
      )}

      {/* Pet Info Image Edit Modal */}
      {editingImageSlot !== null && (
        <PetInfoImageModal
          isOpen={editingImageSlot !== null}
          onClose={() => setEditingImageSlot(null)}
          monster={currentEditingMonster}
          slotIndex={editingImageSlot}
          currentImageUrl={petImages[editingImageSlot]}
          onSaveImage={(url) => {
            const nextImages = [...petImages] as [string | null, string | null, string | null];
            nextImages[editingImageSlot] = url;
            setPetImages(nextImages);
            setSuccessNotice(
              url
                ? `Đã lưu ảnh thông tin cho ${currentEditingMonster?.name || `Pet ${editingImageSlot + 1}`}!`
                : `Đã gỡ ảnh thông tin của ${currentEditingMonster?.name || `Pet ${editingImageSlot + 1}`}!`
            );
            setTimeout(() => setSuccessNotice(null), 3000);
          }}
          teamTitle={counterSlots
            .map((id) => getMonsterById(allMonsters, id)?.name)
            .filter(Boolean)
            .join(' + ')}
        />
      )}

      {/* ======================================================================= */}
      {/* MODAL ĐỒNG BỘ ẢNH ĐÃ CÓ CHO PET TỪ LỊCH SỬ COUNTER */}
      {/* ======================================================================= */}
      {syncModalSlotIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-2">
                    <span>Đồng Bộ Ảnh Đã Có</span>
                    {currentEditingMonsterForSync && (
                      <span className="text-cyan-400 font-bold">• {currentEditingMonsterForSync.name}</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Chọn ảnh chỉ số / rune đã lưu từ lịch sử các đội counter để gán vào vị trí Pet {syncModalSlotIndex + 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSyncModalSlotIndex(null);
                  setPreviewingHistoryImageUrl(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Pet Preview Banner & Tabs */}
            <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <MonsterAvatar
                  monster={currentEditingMonsterForSync}
                  size="sm"
                  showStars={false}
                  showName={false}
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{currentEditingMonsterForSync?.name || `Pet ${syncModalSlotIndex + 1}`}</span>
                    <span className="text-[10px] text-slate-400">
                      (Vị trí {syncModalSlotIndex === 0 ? 'Leader' : `Pet ${syncModalSlotIndex + 1}`})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Trạng thái hiện tại:{' '}
                    {petImages[syncModalSlotIndex] ? (
                      <span className="text-teal-400 font-semibold">Đã có 1 ảnh được gán</span>
                    ) : (
                      <span className="text-amber-400/80 italic">Chưa có ảnh nào</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab switch button (Pet history vs All history) */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAllMonstersHistory(false)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    !showAllMonstersHistory
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ảnh của {currentEditingMonsterForSync?.name || 'Pet này'} (
                  {currentSyncMonsterImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllMonstersHistory(true)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    showAllMonstersHistory
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tất cả quái thú ({allHistoryImages.length})
                </button>
              </div>
            </div>

            {/* Body: Images Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-4">
              {displaySyncImages.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-300">
                      {!showAllMonstersHistory
                        ? `Chưa có ảnh nào được lưu trước đây cho "${currentEditingMonsterForSync?.name}"`
                        : 'Hệ thống chưa có ảnh nào được lưu trong các đội counter'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {!showAllMonstersHistory
                        ? 'Bạn có thể bấm "Tất cả quái thú" để chọn từ ảnh của các pet khác, hoặc dùng nút "Dán ảnh" để tải ảnh mới lên.'
                        : 'Hãy dán ảnh thông tin hoặc tải ảnh lên để xây dựng kho ảnh cho các lần sử dụng tiếp theo!'}
                    </p>
                  </div>
                  {!showAllMonstersHistory && allHistoryImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMonstersHistory(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all cursor-pointer"
                    >
                      <span>Xem ảnh của tất cả quái thú ({allHistoryImages.length})</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {displaySyncImages.map((item, i) => {
                    const isCurrentlyUsed = petImages[syncModalSlotIndex] === item.imageUrl;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isCurrentlyUsed
                            ? 'bg-teal-950/30 border-teal-500/70 ring-1 ring-teal-500/40'
                            : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                        }`}
                      >
                        {/* Thumbnail Container */}
                        <div
                          className="relative w-full h-40 sm:h-44 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group/thumb cursor-pointer flex items-center justify-center"
                          onClick={() => setPreviewingHistoryImageUrl(item.imageUrl)}
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.teamName}
                            className="w-full h-full object-contain object-center transition-transform group-hover/thumb:scale-105"
                            loading="lazy"
                          />

                          {/* Overlay Zoom Icon on hover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="p-2 rounded-full bg-slate-900/90 text-cyan-300 border border-cyan-400/50 shadow-lg">
                              <Eye className="w-5 h-5" />
                            </span>
                          </div>

                          {isCurrentlyUsed && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-teal-500 text-slate-950 text-[10px] font-black rounded-lg shadow-md border border-teal-300 flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" /> Đang chọn
                            </span>
                          )}
                        </div>

                        {/* Metadata Source Info */}
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            <Swords className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{item.teamName}</span>
                          </div>
                          {item.defenseTeamName && (
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{item.defenseTeamName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                            {item.date && <span>📅 {item.date}</span>}
                            {item.difficulty && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-semibold border border-slate-700">
                                {item.difficulty}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => setPreviewingHistoryImageUrl(item.imageUrl)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem lớn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyHistoryImage(item.imageUrl)}
                            disabled={isCurrentlyUsed}
                            className={`flex-1 py-1.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isCurrentlyUsed
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 cursor-default'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md hover:shadow-cyan-500/25 active:scale-95'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isCurrentlyUsed ? 'Đã gán cho pet' : 'Gán ảnh này'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                💡 Chọn ảnh giúp bạn tái sử dụng nhanh bảng rune đã lưu mà không cần chụp lại.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSyncModalSlotIndex(null);
                  setPreviewingHistoryImageUrl(null);
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* LIGHTBOX PHÓNG TO ẢNH TRONG KHO LỊCH SỬ */}
      {/* ======================================================================= */}
      {previewingHistoryImageUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setPreviewingHistoryImageUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Xem chi tiết ảnh</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingHistoryImageUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-950">
              <img
                src={previewingHistoryImageUrl}
                alt="Preview"
                className="max-w-full max-h-[72vh] object-contain rounded-lg"
              />
            </div>

            {syncModalSlotIndex !== null && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewingHistoryImageUrl(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyHistoryImage(previewingHistoryImageUrl)}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Gán ảnh này vào Pet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
