import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Zap,
  Search,
  Settings2,
} from 'lucide-react';
import { Monster, RTASlot } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';

interface QuickPickSuggestionsProps {
  allMonsters: Monster[];
  myTeam: RTASlot[];
  enemyTeam: RTASlot[];
  selectedSlotRef: { side: 'mine' | 'enemy'; index: number } | null;
  onPickMonster: (monsterId: string) => void;
  onOpenAddMonster: () => void;
  onShowToast: (msg: string) => void;
}

const STORAGE_KEY_FAVORITES = 'sw_rta_favorite_picks_v3';

export const QuickPickSuggestions: React.FC<QuickPickSuggestionsProps> = ({
  allMonsters,
  myTeam,
  enemyTeam,
  selectedSlotRef,
  onPickMonster,
  onOpenAddMonster,
  onShowToast,
}) => {
  // Favorite monster IDs with local persistence - Default empty as requested by user
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isManageMode, setIsManageMode] = useState(false);
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);

  // Sync to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds]);

  // Set of all picked IDs in current draft
  const pickedIdsSet = useMemo(() => {
    const set = new Set<string>();
    myTeam.forEach((s) => s.monsterId && set.add(s.monsterId));
    enemyTeam.forEach((s) => s.monsterId && set.add(s.monsterId));
    return set;
  }, [myTeam, enemyTeam]);

  // Monsters list for favorites
  const favoriteMonsters = useMemo(() => {
    return favoriteIds
      .map((id) => getMonsterById(allMonsters, id))
      .filter((m): m is Monster => Boolean(m));
  }, [favoriteIds, allMonsters]);

  // Filtered monsters by name only
  const filteredMonsters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return favoriteMonsters;

    return favoriteMonsters.filter((m) => {
      const nameMatch = m.name.toLowerCase().includes(term);
      const awakenedMatch = m.awakenedName ? m.awakenedName.toLowerCase().includes(term) : false;
      return nameMatch || awakenedMatch;
    });
  }, [favoriteMonsters, searchTerm]);

  const handleAddFavorite = (monsterId: string | null) => {
    if (!monsterId) return;
    if (favoriteIds.includes(monsterId)) {
      onShowToast('Pet này đã có trong danh sách gợi ý!');
      return;
    }
    setFavoriteIds((prev) => [monsterId, ...prev]);
    onShowToast('Đã thêm pet vào danh sách gợi ý chọn nhanh!');
  };

  const handleRemoveFavorite = (e: React.MouseEvent, monsterId: string) => {
    e.stopPropagation();
    setFavoriteIds((prev) => prev.filter((id) => id !== monsterId));
    onShowToast('Đã xóa pet khỏi danh sách gợi ý');
  };

  const handleClearAllFavorites = () => {
    setFavoriteIds([]);
    onShowToast('Đã xóa tất cả pet trong danh sách');
  };

  const handleQuickClick = (monster: Monster) => {
    if (isManageMode) return;

    if (pickedIdsSet.has(monster.id)) {
      onShowToast(`${monster.name} đã được chọn trên bàn cờ!`);
      return;
    }

    onPickMonster(monster.id);
  };

  return (
    <div className="bg-[#141b2d]/95 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 leading-none">
              Pet Tôi Hay Pick
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                {favoriteMonsters.length}
              </span>
            </h3>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsManageMode(!isManageMode)}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              isManageMode
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isManageMode ? 'Hoàn tất chỉnh sửa' : 'Chỉnh sửa danh sách'}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsAddPickerOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
            title="Thêm quái vật vào danh sách gợi ý"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Quick Search - Chỉ cần ô nhập tìm theo tên */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên quái thú..."
          className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Avatars Grid - Compact & Smaller Avatar Size (xs) */}
      <div className="flex-1 overflow-y-auto max-h-[380px] lg:max-h-[460px] pr-1 space-y-2">
        {filteredMonsters.length === 0 ? (
          <div className="text-center py-10 px-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
            <p className="text-xs font-semibold text-slate-400">
              {searchTerm ? 'Không tìm thấy quái thú phù hợp' : 'Chưa có pet nào trong danh sách'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => setIsAddPickerOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Thêm Pet Hay Pick</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
            {filteredMonsters.map((monster) => {
              const isPicked = pickedIdsSet.has(monster.id);

              return (
                <div
                  key={monster.id}
                  onClick={() => handleQuickClick(monster)}
                  className={`relative group rounded-lg p-1 flex flex-col items-center justify-center transition-all ${
                    isPicked
                      ? 'opacity-40 pointer-events-none'
                      : 'hover:bg-slate-800/80 hover:scale-105 active:scale-95 cursor-pointer'
                  } ${isManageMode ? 'hover:bg-rose-950/40' : ''}`}
                >
                  {/* Delete overlay in manage mode */}
                  {isManageMode && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFavorite(e, monster.id)}
                      className="absolute -top-1 -right-1 z-30 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-pointer border border-slate-950"
                      title={`Xóa ${monster.name} khỏi gợi ý`}
                    >
                      <Trash2 className="w-2 h-2" />
                    </button>
                  )}

                  {/* Picked indicator overlay */}
                  {isPicked && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-lg">
                      <span className="text-[8px] font-black text-slate-300 bg-slate-900/90 px-1 py-0.2 rounded border border-slate-700 leading-none">
                        PICK
                      </span>
                    </div>
                  )}

                  <MonsterAvatar
                    monster={monster}
                    size="xs"
                    showTooltip={false}
                  />

                  {/* Monster Name */}
                  <span className="text-[9px] font-medium text-slate-300 text-center truncate max-w-full mt-0.5 leading-tight">
                    {monster.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info or helper */}
      {isManageMode && favoriteIds.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end text-[11px] text-slate-400">
          <button
            type="button"
            onClick={handleClearAllFavorites}
            className="text-rose-400 hover:underline font-medium shrink-0 cursor-pointer"
          >
            Xóa tất cả danh sách
          </button>
        </div>
      )}

      {/* Monster Picker Modal for adding new favorites */}
      {isAddPickerOpen && (
        <MonsterPickerModal
          isOpen={isAddPickerOpen}
          onClose={() => setIsAddPickerOpen(false)}
          onSelectMonster={handleAddFavorite}
          allMonsters={allMonsters}
          currentMonsterId={null}
          title="Thêm Quái Thú Vào Danh Sách Hay Pick"
          onOpenAddModal={onOpenAddMonster}
        />
      )}
    </div>
  );
};
