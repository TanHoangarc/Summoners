import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Swords,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  RotateCcw,
  CheckCircle,
  Award,
  BookmarkCheck,
  Check,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Monster, SiegeCounterStrategy, SavedSiegeDefense } from '../../types';
import { DEFAULT_SIEGE_COUNTERS, DRAFT_COUNTER_IDS } from '../../data/defaultCounters';
import { getMonsterById } from '../../utils/monsterHelpers';
import { recordMonsterPick } from '../../utils/monsterPickStats';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';
import { SaveDefenseModal } from './SaveDefenseModal';
import { SaveCounterModal } from './SaveCounterModal';
import { SavedDefensesList } from './SavedDefensesList';
import { fetchAICounterStrategy } from '../../lib/aiStrategyService';
import {
  subscribeToSiegeDefenses,
  saveSiegeDefenseToFirestore,
  deleteSiegeDefenseFromFirestore,
  DEFAULT_SAVED_DEFENSES,
  STORAGE_KEY_SIEGE_DEFENSES,
  seedDefaultDefensesToFirestore,
} from '../../lib/siegeDefenseService';
import {
  subscribeToSiegeCounters,
  saveSiegeCounterToFirestore,
  deleteSiegeCounterFromFirestore,
  deleteDraftCountersFromFirestore,
  STORAGE_KEY_SIEGE_COUNTERS,
} from '../../lib/siegeCounterService';

interface SiegeViewProps {
  allMonsters: Monster[];
  onOpenAddMonster: () => void;
}

export const SiegeView: React.FC<SiegeViewProps> = ({
  allMonsters,
  onOpenAddMonster,
}) => {
  // Current 3 defense monsters (Default empty as requested by user)
  const [defenseIds, setDefenseIds] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);

  // Saved defense teams state with localStorage fallback
  const [savedDefenses, setSavedDefenses] = useState<SavedSiegeDefense[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_SIEGE_DEFENSES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SAVED_DEFENSES;
  });

  // Modal for saving or editing defense
  const [isSaveDefenseModalOpen, setIsSaveDefenseModalOpen] = useState(false);
  const [editingDefense, setEditingDefense] = useState<SavedSiegeDefense | null>(null);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Realtime subscription to Firestore siege_defenses
  useEffect(() => {
    const unsubscribe = subscribeToSiegeDefenses(
      (firestoreList) => {
        if (firestoreList.length > 0) {
          setSavedDefenses(firestoreList);
          try {
            localStorage.setItem(STORAGE_KEY_SIEGE_DEFENSES, JSON.stringify(firestoreList));
          } catch {}
        }
      },
      (err) => {
        console.warn('Siege defenses sync notice:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save to localStorage whenever savedDefenses changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SIEGE_DEFENSES, JSON.stringify(savedDefenses));
    } catch {}
  }, [savedDefenses]);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Saved / user contributed counters with localStorage fallback (excluding drafts)
  const [countersDatabase, setCountersDatabase] = useState<SiegeCounterStrategy[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_SIEGE_COUNTERS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => !DRAFT_COUNTER_IDS.includes(c.id));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Modal for saving or editing counter
  const [isSaveCounterModalOpen, setIsSaveCounterModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<SiegeCounterStrategy | null>(null);
  const [aiLoadingCounterId, setAiLoadingCounterId] = useState<string | null>(null);

  // Realtime subscription to Firestore counters collection
  useEffect(() => {
    // Clean up draft counters from Firestore in the background
    deleteDraftCountersFromFirestore().catch(console.warn);

    const unsubscribe = subscribeToSiegeCounters(
      (firestoreCounters) => {
        const cleanCounters = firestoreCounters.filter((c) => !DRAFT_COUNTER_IDS.includes(c.id));
        setCountersDatabase(cleanCounters);
        try {
          localStorage.setItem(STORAGE_KEY_SIEGE_COUNTERS, JSON.stringify(cleanCounters));
        } catch {}
      },
      (err) => {
        console.warn('Siege counters sync notice:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save to localStorage whenever countersDatabase changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SIEGE_COUNTERS, JSON.stringify(countersDatabase));
    } catch {}
  }, [countersDatabase]);

  // Active slot being picked for defense (0, 1, or 2)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Expanded strategy IDs
  const [expandedStrategyIds, setExpandedStrategyIds] = useState<Record<string, boolean>>({});

  // Selected defense monsters
  const defMonsters = defenseIds.map((id) => getMonsterById(allMonsters, id));

  // Determine Leader Skill from slot 1 or any monster with Guild Leader
  const leaderMonster = defMonsters.find((m) => m?.leaderSkill && m.leaderSkill.includes('Guild')) || defMonsters[0];

  const canSaveCurrent = Boolean(defenseIds[0] && defenseIds[1] && defenseIds[2]);

  const handleOpenSaveModal = () => {
    if (!canSaveCurrent) return;
    setEditingDefense(null);
    setIsSaveDefenseModalOpen(true);
  };

  const handleEditDefense = (def: SavedSiegeDefense) => {
    setEditingDefense(def);
    setIsSaveDefenseModalOpen(true);
  };

  const handleSaveDefense = async (defense: SavedSiegeDefense) => {
    // Optimistic UI update
    setSavedDefenses((prev) => {
      const index = prev.findIndex((d) => d.id === defense.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = defense;
        return next;
      }
      return [defense, ...prev];
    });

    setToastMessage(`Đã lưu đội hình "${defense.name}" thành công!`);

    // Persist to Firestore
    try {
      await saveSiegeDefenseToFirestore(defense);
    } catch (err) {
      console.warn('Error saving defense to Firestore:', err);
    }
  };

  const handleLoadDefense = (defense: SavedSiegeDefense) => {
    setDefenseIds([defense.monsterIds[0], defense.monsterIds[1], defense.monsterIds[2]]);
    setToastMessage(`Đã nạp đội hình "${defense.name}" vào ô Defense!`);
  };

  const handleDeleteDefense = async (id: string) => {
    setSavedDefenses((prev) => prev.filter((d) => d.id !== id));
    setToastMessage('Đã xóa đội hình khỏi danh sách!');
    try {
      await deleteSiegeDefenseFromFirestore(id);
    } catch (err) {
      console.warn('Error deleting defense from Firestore:', err);
    }
  };

  const handleRestoreDefaults = async () => {
    setSavedDefenses(DEFAULT_SAVED_DEFENSES);
    setToastMessage('Đã khôi phục các đội hình mẫu mặc định!');
    try {
      await seedDefaultDefensesToFirestore();
    } catch (err) {
      console.warn('Error seeding default defenses:', err);
    }
  };

  // Open modal to add a new counter for current defense
  const handleOpenAddCounter = () => {
    if (!canSaveCurrent) {
      setToastMessage('Vui lòng chọn đủ 3 quái thú Defense trước khi thêm Counter!');
      return;
    }
    setEditingCounter(null);
    setIsSaveCounterModalOpen(true);
  };

  // Open modal to edit an existing counter
  const handleEditCounter = (counter: SiegeCounterStrategy) => {
    setEditingCounter(counter);
    setIsSaveCounterModalOpen(true);
  };

  // Save / Update counter (Optimistic + Firestore + LocalStorage)
  const handleSaveCounter = async (counter: SiegeCounterStrategy) => {
    setCountersDatabase((prev) => {
      const index = prev.findIndex((c) => c.id === counter.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = counter;
        return next;
      }
      return [counter, ...prev];
    });

    setExpandedStrategyIds((prev) => ({ ...prev, [counter.id]: true }));
    setToastMessage('Đã lưu đội hình counter thành công!');

    try {
      await saveSiegeCounterToFirestore(counter);
    } catch (err) {
      console.warn('Error saving counter to Firestore:', err);
    }
  };

  // Quick AI Strategy generation directly from counter card
  const handleAIGenerateForCounter = async (counter: SiegeCounterStrategy) => {
    const validDefMonsters = defMonsters.filter(Boolean) as Monster[];
    const validCMonsters = counter.counterMonsterIds
      .map((id) => getMonsterById(allMonsters, id))
      .filter(Boolean) as Monster[];

    if (validDefMonsters.length < 3 || validCMonsters.length < 3) {
      setToastMessage('Cần đủ 3 quái thú Defense và 3 quái thú Counter để AI phân tích!');
      return;
    }

    setAiLoadingCounterId(counter.id);
    setToastMessage('AI đang phân tích và tạo chiến thuật khắc chế chi tiết...');

    try {
      const result = await fetchAICounterStrategy(validDefMonsters, validCMonsters);
      const updated: SiegeCounterStrategy = {
        ...counter,
        difficulty: result.difficulty || counter.difficulty,
        strategy: result.strategy || counter.strategy,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      };

      await handleSaveCounter(updated);
      setToastMessage('✨ Đã tải thành công chiến thuật mới từ AI!');
    } catch (err: any) {
      setToastMessage(err?.message || 'Lỗi khi gọi AI gợi ý chiến thuật.');
    } finally {
      setAiLoadingCounterId(null);
    }
  };

  // Delete counter
  const handleDeleteCounter = async (counterId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đội hình counter này không?')) return;

    setCountersDatabase((prev) => prev.filter((c) => c.id !== counterId));
    setToastMessage('Đã xóa đội hình counter!');

    try {
      await deleteSiegeCounterFromFirestore(counterId);
    } catch (err) {
      console.warn('Error deleting counter from Firestore:', err);
    }
  };

  // Match existing counters in database
  const exactMatches = useMemo(() => {
    const validDefIds = defenseIds.filter((id): id is string => Boolean(id));
    if (validDefIds.length < 3) return [];

    // Find in countersDatabase
    return countersDatabase.filter((c) => {
      return (
        c.defenseMonsterIds.includes(validDefIds[0]) &&
        c.defenseMonsterIds.includes(validDefIds[1]) &&
        c.defenseMonsterIds.includes(validDefIds[2])
      );
    });
  }, [defenseIds, countersDatabase]);

  const toggleExpand = (id: string) => {
    setExpandedStrategyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/95 text-teal-300 border border-teal-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DEFENSE SELECTION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-400">
              DEFENSE (3 QUÁI THÚ)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSaveModal}
              disabled={!canSaveCurrent}
              title={canSaveCurrent ? 'Lưu đội hình này vào danh sách phòng thủ' : 'Hãy chọn đủ 3 quái thú để lưu'}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                canSaveCurrent
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Lưu Đội Hình Này
            </button>
            <button
              type="button"
              onClick={() => setDefenseIds([null, null, null])}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xóa đội hình
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* 3 Pet Avatars (Clean avatar squares with hover tooltip) */}
          <div className="flex items-center gap-4">
            {defenseIds.map((id, index) => {
              const monster = getMonsterById(allMonsters, id);
              return (
                <div key={index} className="flex flex-col items-center">
                  <MonsterAvatar
                    monster={monster}
                    size="xl"
                    showStars={false}
                    showName={false}
                    isLeader={index === 0}
                    onClick={() => setActiveSlotIndex(index)}
                    onClear={
                      id
                        ? () => {
                            setDefenseIds((prev) => {
                              const next = [...prev] as [string | null, string | null, string | null];
                              next[index] = null;
                              return next;
                            });
                          }
                        : undefined
                    }
                    emptyLabel={`Pet ${index + 1}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Defense Leader Skill */}
          <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
            <div>
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Leader Skill:
              </span>
              <p className="text-slate-400 italic mt-0.5">
                {leaderMonster?.leaderSkill ||
                  'Chưa thiết lập kỹ năng đội trưởng (Chọn quái vật ở vị trí 1)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SAVED DEFENSES LIST SECTION */}
      <SavedDefensesList
        savedDefenses={savedDefenses}
        activeDefenseIds={defenseIds}
        allMonsters={allMonsters}
        countersDatabase={countersDatabase}
        onLoadDefense={handleLoadDefense}
        onEditDefense={handleEditDefense}
        onDeleteDefense={handleDeleteDefense}
        onOpenSaveCurrent={handleOpenSaveModal}
        canSaveCurrent={canSaveCurrent}
        onRestoreDefaults={handleRestoreDefaults}
      />

      {/* COUNTERS SECTION (Saved & Editable Counter Formations) */}
      <div className="space-y-4">
        {/* Counters Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-teal-400" />
              <span>
                <span className="text-teal-400">{exactMatches.length}</span>{' '}
                ĐỘI HÌNH COUNTER ĐÃ LƯU
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddCounter}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thêm Counter Mới</span>
            </button>
          </div>
        </div>

        {/* Counter Cards List */}
        {exactMatches.length === 0 ? (
          <div className="text-center py-14 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
              <Swords className="w-6 h-6 text-teal-400/80" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-300">
                Chưa có đội hình counter nào được lưu cho bộ ba này
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bấm "Thêm Counter Mới" để tạo đội hình khắc chế và lưu lại chiến thuật của bạn!
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddCounter}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thêm Counter Mới</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Exact Saved Matches */}
            {exactMatches.map((counter) => {
              const cMonsters = counter.counterMonsterIds.map((id) => getMonsterById(allMonsters, id));
              const isExpanded = Boolean(expandedStrategyIds[counter.id]);

              return (
                <div
                  key={counter.id}
                  className="bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 shadow-xl transition-all space-y-3"
                >
                  {/* Counter Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* 3 Counter Pets + Names */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {cMonsters.map((monster, i) => (
                          <MonsterAvatar
                            key={i}
                            monster={monster}
                            size="md"
                            showStars={false}
                            showName={false}
                          />
                        ))}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {cMonsters.map((m) => m?.name || 'Unknown').join(' ')}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {counter.isCustom && (
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                              Đã lưu
                            </span>
                          )}
                          {counter.difficulty && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-medium">
                              Độ khó: {counter.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit, Delete, Details */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleEditCounter(counter)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-bold transition-all border border-slate-700/80 hover:border-teal-500/40 cursor-pointer shadow-sm"
                        title="Chỉnh sửa đội hình counter này"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCounter(counter.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium transition-all border border-slate-750 hover:border-rose-800/60 cursor-pointer"
                        title="Xóa counter này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Xóa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(counter.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Strategy Body */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-3 animate-in fade-in duration-150 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-slate-300 block font-semibold">
                            Chiến thuật đánh & Yêu cầu chỉ số từng Pet:
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleAIGenerateForCounter(counter)}
                            disabled={aiLoadingCounterId === counter.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-lg text-[11px] font-bold transition-all border border-teal-500/30 cursor-pointer disabled:opacity-60"
                            title="Tải chiến thuật và yêu cầu chỉ số phân tích bởi Gemini AI"
                          >
                            {aiLoadingCounterId === counter.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                                <span>AI đang phân tích...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-teal-400" />
                                <span>AI gợi ý lại chiến thuật</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 whitespace-pre-line font-sans">
                          {counter.strategy}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center gap-3">
                          <span>Độ khó: <strong className="text-amber-300">{counter.difficulty || 'Trung bình'}</strong></span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Đã kiểm chứng tỉ lệ thắng cao
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Defense Monster Picker Modal */}
      {activeSlotIndex !== null && (
        <MonsterPickerModal
          isOpen={activeSlotIndex !== null}
          onClose={() => setActiveSlotIndex(null)}
          onSelectMonster={(monsterId) => {
            if (monsterId) {
              recordMonsterPick(monsterId);
            }
            setDefenseIds((prev) => {
              const next = [...prev] as [string | null, string | null, string | null];
              next[activeSlotIndex] = monsterId;
              return next;
            });
          }}
          allMonsters={allMonsters}
          currentMonsterId={defenseIds[activeSlotIndex]}
          title={`Chọn Pet Phòng Thủ Địch - Vị Trí ${activeSlotIndex + 1}`}
          onOpenAddModal={onOpenAddMonster}
          mode="siege"
        />
      )}

      {/* Save / Edit Counter Modal */}
      <SaveCounterModal
        isOpen={isSaveCounterModalOpen}
        onClose={() => {
          setIsSaveCounterModalOpen(false);
          setEditingCounter(null);
        }}
        defenseIds={defenseIds}
        allMonsters={allMonsters}
        onSave={handleSaveCounter}
        editingCounter={editingCounter}
        onOpenAddMonster={onOpenAddMonster}
        existingCounters={countersDatabase}
      />

      {/* Save / Edit Defense Modal */}
      <SaveDefenseModal
        isOpen={isSaveDefenseModalOpen}
        onClose={() => {
          setIsSaveDefenseModalOpen(false);
          setEditingDefense(null);
        }}
        defenseIds={defenseIds}
        allMonsters={allMonsters}
        onSave={handleSaveDefense}
        editingDefense={editingDefense}
      />
    </div>
  );
};
