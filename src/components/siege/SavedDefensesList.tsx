import React, { useState, useMemo } from 'react';
import {
  Shield,
  Bookmark,
  BookmarkCheck,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { Monster, SavedSiegeDefense, SiegeCounterStrategy } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';

interface SavedDefensesListProps {
  savedDefenses: SavedSiegeDefense[];
  activeDefenseIds: [string | null, string | null, string | null];
  allMonsters: Monster[];
  countersDatabase: SiegeCounterStrategy[];
  onLoadDefense: (defense: SavedSiegeDefense) => void;
  onEditDefense: (defense: SavedSiegeDefense) => void;
  onDeleteDefense: (id: string) => void;
  onOpenSaveCurrent: () => void;
  canSaveCurrent: boolean;
  onRestoreDefaults: () => void;
}

export const SavedDefensesList: React.FC<SavedDefensesListProps> = ({
  savedDefenses,
  activeDefenseIds,
  allMonsters,
  countersDatabase,
  onLoadDefense,
  onEditDefense,
  onDeleteDefense,
  onOpenSaveCurrent,
  canSaveCurrent,
  onRestoreDefaults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'with_counters'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper to check if a saved defense matches currently active defense
  const isDefenseActive = (def: SavedSiegeDefense) => {
    return (
      activeDefenseIds[0] === def.monsterIds[0] &&
      activeDefenseIds[1] === def.monsterIds[1] &&
      activeDefenseIds[2] === def.monsterIds[2]
    );
  };

  // Helper to count known exact counters in database
  const getCountersCount = (monsterIds: [string, string, string]) => {
    return countersDatabase.filter((c) => {
      return (
        c.defenseMonsterIds.includes(monsterIds[0]) &&
        c.defenseMonsterIds.includes(monsterIds[1]) &&
        c.defenseMonsterIds.includes(monsterIds[2])
      );
    }).length;
  };

  // Filtered defenses
  const filteredDefenses = useMemo(() => {
    return savedDefenses.filter((def) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = def.name.toLowerCase().includes(query);
        const matchesMonsters = def.monsterIds.some((id) => {
          const m = getMonsterById(allMonsters, id);
          return (
            m?.name.toLowerCase().includes(query) ||
            m?.awakenedName?.toLowerCase().includes(query)
          );
        });
        const matchesNotes = def.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesMonsters && !matchesNotes) return false;
      }

      // Filter Mode
      if (filterMode === 'active') {
        return isDefenseActive(def);
      }
      if (filterMode === 'with_counters') {
        return getCountersCount(def.monsterIds) > 0;
      }

      return true;
    });
  }, [savedDefenses, searchTerm, filterMode, activeDefenseIds, countersDatabase, allMonsters]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đội hình "${name}"?`)) {
      onDeleteDefense(id);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              ĐỘI HÌNH DEFENSE ĐÃ LƯU
              <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold">
                {savedDefenses.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Quản lý nhiều đội hình phòng thủ Siege và chuyển đổi nhanh chỉ với 1 cú nhấp chuột
            </p>
          </div>
        </div>

        {/* Action Button: Save Current Defense */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSaveCurrent}
            disabled={!canSaveCurrent}
            title={canSaveCurrent ? 'Lưu đội hình 3 quái thú hiện tại' : 'Hãy chọn đủ 3 quái thú ở ô DEFENSE phía trên để lưu'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              canSaveCurrent
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/10'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            Lưu Đội Hình Hiện Tại
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên đội hình hoặc quái thú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Tất cả ({savedDefenses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'active'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Đang chọn
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('with_counters')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'with_counters'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Có sẵn Counter
          </button>
        </div>
      </div>

      {/* Grid of Saved Defenses */}
      {filteredDefenses.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <Shield className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            {searchTerm || filterMode !== 'all'
              ? 'Không tìm thấy đội hình nào phù hợp với bộ lọc.'
              : 'Chưa có đội hình phòng thủ nào được lưu.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {canSaveCurrent && (
              <button
                type="button"
                onClick={onOpenSaveCurrent}
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
              >
                + Lưu đội hình hiện tại
              </button>
            )}
            <button
              type="button"
              onClick={onRestoreDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nạp các đội hình Meta mẫu
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredDefenses.map((defense) => {
            const m1 = getMonsterById(allMonsters, defense.monsterIds[0]);
            const m2 = getMonsterById(allMonsters, defense.monsterIds[1]);
            const m3 = getMonsterById(allMonsters, defense.monsterIds[2]);
            const monsters = [m1, m2, m3];
            const active = isDefenseActive(defense);
            const counterCount = getCountersCount(defense.monsterIds);

            return (
              <div
                key={defense.id}
                className={`relative rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between gap-3 ${
                  active
                    ? 'bg-slate-950/90 border-teal-500/60 ring-1 ring-teal-500/40 shadow-lg shadow-teal-500/5'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {/* Top Row: Name & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-white truncate" title={defense.name}>
                        {defense.name}
                      </h4>
                      {active && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    {defense.notes && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic" title={defense.notes}>
                        {defense.notes}
                      </p>
                    )}
                  </div>

                  {/* Edit / Delete Icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditDefense(defense)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa tên / ghi chú"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(defense.id, defense.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa đội hình này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle: 3 Avatars Row */}
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    {monsters.map((m, idx) => {
                      const isLeader =
                        (defense.leaderMonsterId && defense.leaderMonsterId === defense.monsterIds[idx]) ||
                        (!defense.leaderMonsterId && idx === 0);
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <MonsterAvatar
                            monster={m}
                            size="sm"
                            showStars={false}
                            showName={false}
                            isLeader={isLeader}
                          />
                          <span className="text-[10px] text-slate-300 max-w-[64px] truncate text-center mt-1 font-medium">
                            {m?.name || `Pet ${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Counter count tag */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                        counterCount > 0
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                      }`}
                    >
                      {counterCount > 0 ? `${counterCount} counters` : 'Counter AI'}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Load Action Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500">
                    {new Date(defense.createdAt).toLocaleDateString('vi-VN')}
                  </span>

                  <button
                    type="button"
                    onClick={() => onLoadDefense(defense)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      active
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-indigo-500/20'
                    }`}
                  >
                    {active ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Đang chọn
                      </>
                    ) : (
                      <>
                        Nạp Đội Hình
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
