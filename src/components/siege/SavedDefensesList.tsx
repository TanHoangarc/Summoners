import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Trash2,
  Edit2,
  BookmarkCheck,
  RotateCcw,
  Sparkles,
  X,
  Plus,
  LayoutGrid,
  List,
  Columns3,
  Filter,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Monster, SavedSiegeDefense, SiegeCounterStrategy } from '../../types';
import { getMonsterById, ELEMENT_COLORS } from '../../utils/monsterHelpers';
import { MonsterPickerModal } from '../common/MonsterPickerModal';
import { isSameMonsterTeam, findDuplicateSiegeDefense } from '../../lib/siegeDefenseService';

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

// Compact monster icon matching the game UI / screenshot exactly
const CompactMonsterIcon: React.FC<{ monster?: Monster | null; isLeader?: boolean }> = ({
  monster,
  isLeader = false,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const elementInfo = monster ? ELEMENT_COLORS[monster.element] || ELEMENT_COLORS.water : null;

  if (!monster) {
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
        ?
      </div>
    );
  }

  return (
    <div
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shrink-0 select-none shadow-sm relative bg-slate-950 transition-transform ${
        isLeader
          ? 'border-2 border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
          : 'border border-slate-700/90'
      }`}
      title={`${monster.name}${monster.awakenedName ? ` (${monster.awakenedName})` : ''}${
        isLeader ? ' [Leader]' : ''
      }`}
    >
      {monster.avatarUrl && !imgErr ? (
        <img
          src={monster.avatarUrl}
          alt={monster.name}
          onError={() => setImgErr(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <div
          className={`w-full h-full flex flex-col items-center justify-center p-0.5 bg-gradient-to-br ${
            elementInfo?.gradient || 'from-slate-700 to-slate-900'
          } text-white font-bold`}
        >
          {elementInfo?.iconUrl && (
            <img src={elementInfo.iconUrl} alt={monster.element} className="w-4 h-4 object-contain" />
          )}
          <span className="text-[8px] font-black truncate max-w-full leading-none mt-0.5">
            {monster.name.slice(0, 3)}
          </span>
        </div>
      )}
    </div>
  );
};

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
  // Search mode: 'name' (by text) or 'pet' (by picking monsters from roster)
  const [searchMode, setSearchMode] = useState<'name' | 'pet'>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPetIds, setFilterPetIds] = useState<string[]>([]);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'with_counters'>('all');
  const [layoutMode, setLayoutMode] = useState<'5_cols' | '4_cols' | 'single_column'>('5_cols');

  // Helper to check if a saved defense matches currently active defense
  const isDefenseActive = (def: SavedSiegeDefense) => {
    return (
      activeDefenseIds[0] === def.monsterIds[0] &&
      activeDefenseIds[1] === def.monsterIds[1] &&
      activeDefenseIds[2] === def.monsterIds[2]
    );
  };

  // Helper to check if defense contains the same 3 monsters regardless of order
  const isDefensePermutationMatch = (def: SavedSiegeDefense) => {
    return isSameMonsterTeam(activeDefenseIds, def.monsterIds);
  };

  // Active duplicate defense detected across savedDefenses (any order)
  const activeDuplicateDefense = useMemo(() => {
    return findDuplicateSiegeDefense(activeDefenseIds, savedDefenses);
  }, [activeDefenseIds, savedDefenses]);

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

  // Add / remove pet from filter
  const handleSelectFilterPet = (monsterId: string | null) => {
    if (!monsterId) return;
    if (!filterPetIds.includes(monsterId)) {
      if (filterPetIds.length >= 3) {
        setFilterPetIds([filterPetIds[1], filterPetIds[2], monsterId]);
      } else {
        setFilterPetIds([...filterPetIds, monsterId]);
      }
    }
    setIsPickerModalOpen(false);
  };

  const handleRemoveFilterPet = (monsterId: string) => {
    setFilterPetIds(filterPetIds.filter((id) => id !== monsterId));
  };

  // Helper to get sortable canonical name of a monster
  const getMonsterSortName = (monsterId?: string | null) => {
    if (!monsterId) return 'zzz';
    const m = getMonsterById(allMonsters, monsterId);
    return (m?.awakenedName || m?.name || monsterId).trim().toLowerCase();
  };

  // Filtered and smart-sorted defenses
  const filteredDefenses = useMemo(() => {
    const list = savedDefenses.filter((def) => {
      // Filter by text search
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

      // Filter by selected Pet(s) from roster
      if (filterPetIds.length > 0) {
        const hasAllSelectedPets = filterPetIds.every((filterId) =>
          def.monsterIds.includes(filterId)
        );
        if (!hasAllSelectedPets) return false;
      }

      // Filter Mode pills
      if (filterMode === 'active') {
        return isDefenseActive(def) || isDefensePermutationMatch(def);
      }
      if (filterMode === 'with_counters') {
        return getCountersCount(def.monsterIds) > 0;
      }

      return true;
    });

    // Sắp xếp:
    // 1. Cùng pet đầu (Slot 0 / Leader) xếp lại gần nhau.
    // 2. Trong cùng pet đầu, các đội hình có cùng pet giống (bộ đôi quái thú tiếp theo giống nhau) xếp liền kề nhau.
    // 3. Các đội hình có cùng bộ 3 quái thú (kể cả hoán đổi slot 2 & 3) đứng sát cạnh nhau.
    return list.sort((a, b) => {
      // 1. So sánh quái thú đầu tiên (Pet đầu / Slot 0)
      const leadA = getMonsterSortName(a.monsterIds[0]);
      const leadB = getMonsterSortName(b.monsterIds[0]);
      if (leadA !== leadB) {
        return leadA.localeCompare(leadB);
      }

      // 2. Cùng Pet đầu: So sánh 2 quái thú còn lại (đã chuẩn hóa sắp xếp để gom đội hình cùng pet giống)
      const restA = [
        getMonsterSortName(a.monsterIds[1]),
        getMonsterSortName(a.monsterIds[2]),
      ].sort();

      const restB = [
        getMonsterSortName(b.monsterIds[1]),
        getMonsterSortName(b.monsterIds[2]),
      ].sort();

      const cmpRest0 = restA[0].localeCompare(restB[0]);
      if (cmpRest0 !== 0) return cmpRest0;

      const cmpRest1 = restA[1].localeCompare(restB[1]);
      if (cmpRest1 !== 0) return cmpRest1;

      // 3. Nếu cùng các pet, so sánh vị trí slot 2 và slot 3 nguyên bản
      const p2A = getMonsterSortName(a.monsterIds[1]);
      const p2B = getMonsterSortName(b.monsterIds[1]);
      if (p2A !== p2B) return p2A.localeCompare(p2B);

      const p3A = getMonsterSortName(a.monsterIds[2]);
      const p3B = getMonsterSortName(b.monsterIds[2]);
      if (p3A !== p3B) return p3A.localeCompare(p3B);

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [
    savedDefenses,
    searchTerm,
    filterPetIds,
    filterMode,
    activeDefenseIds,
    countersDatabase,
    allMonsters,
  ]);

  // Nhóm các đội hình theo Pet đầu thành từng cụm cột dọc
  interface DefenseGroup {
    leadId: string;
    leadMonster?: Monster | null;
    defenses: SavedSiegeDefense[];
  }

  const groupedDefenses = useMemo(() => {
    const groups: DefenseGroup[] = [];
    filteredDefenses.forEach((def) => {
      const leadId = def.monsterIds[0];
      const existing = groups.find((g) => g.leadId === leadId);
      if (existing) {
        existing.defenses.push(def);
      } else {
        groups.push({
          leadId,
          leadMonster: getMonsterById(allMonsters, leadId),
          defenses: [def],
        });
      }
    });
    return groups;
  }, [filteredDefenses, allMonsters]);

  // Phân bổ các nhóm đội hình vào đúng 4 hoặc 5 cột thẳng hàng, cân đối chiều cao không bị lung tung
  const balancedColumns = useMemo(() => {
    const targetCols = layoutMode === '4_cols' ? 4 : 5;
    const cols: DefenseGroup[][] = Array.from({ length: targetCols }, () => []);
    const colWeights: number[] = new Array(targetCols).fill(0);

    groupedDefenses.forEach((group) => {
      // Tìm cột có tổng chiều cao / số đội hình nhỏ nhất để thêm nhóm vào
      let minIdx = 0;
      for (let i = 1; i < targetCols; i++) {
        if (colWeights[i] < colWeights[minIdx]) {
          minIdx = i;
        }
      }
      cols[minIdx].push(group);
      // Trọng số: 1 thẻ nhóm header (~0.8 đội) + số đội trong nhóm
      colWeights[minIdx] += 0.8 + group.defenses.length;
    });

    return {
      targetCols,
      columns: cols,
    };
  }, [groupedDefenses, layoutMode]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đội hình "${name}"?`)) {
      onDeleteDefense(id);
    }
  };

  // Render một hàng đội hình cực nhỏ gọn chuẩn theo ảnh mẫu
  const renderDefenseRow = (defense: SavedSiegeDefense) => {
    const m1 = getMonsterById(allMonsters, defense.monsterIds[0]);
    const m2 = getMonsterById(allMonsters, defense.monsterIds[1]);
    const m3 = getMonsterById(allMonsters, defense.monsterIds[2]);
    const active = isDefenseActive(defense);
    const sameTeam = isDefensePermutationMatch(defense);
    const counterCount = getCountersCount(defense.monsterIds);

    return (
      <div
        key={defense.id}
        className={`group relative flex items-center justify-between gap-1.5 p-1.5 rounded-xl border transition-all ${
          active
            ? 'bg-slate-950 border-teal-500/90 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/10'
            : sameTeam
            ? 'bg-slate-950 border-amber-500/80 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-slate-950/90 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
        title={
          active
            ? `Đang chọn chính xác: ${defense.name}`
            : sameTeam
            ? `Cùng 3 quái thú với Defense đang chọn (khác thứ tự): ${defense.name}`
            : undefined
        }
      >
        {/* 3 Monster Avatars side-by-side + Blue Search Button (EXACT MATCH with user screenshot) */}
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => onLoadDefense(defense)}
          title={`Nạp & xem counter cho: ${defense.name}`}
        >
          <CompactMonsterIcon
            monster={m1}
            isLeader={
              defense.leaderMonsterId
                ? defense.leaderMonsterId === defense.monsterIds[0]
                : true
            }
          />
          <CompactMonsterIcon
            monster={m2}
            isLeader={
              defense.leaderMonsterId ? defense.leaderMonsterId === defense.monsterIds[1] : false
            }
          />
          <CompactMonsterIcon
            monster={m3}
            isLeader={
              defense.leaderMonsterId ? defense.leaderMonsterId === defense.monsterIds[2] : false
            }
          />

          {/* The iconic Blue Square Button with White Search Magnifying Glass */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadDefense(defense);
            }}
            title={`Nạp đội hình & xem counter (${counterCount} counters có sẵn)`}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              active
                ? 'bg-teal-500 hover:bg-teal-400 ring-2 ring-teal-300 shadow-teal-500/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            <Search className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* Quick actions (Edit / Delete) discreetly visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditDefense(defense);
            }}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title={`Sửa tên / ghi chú (${defense.name})`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(defense.id, defense.name);
            }}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title={`Xóa đội hình "${defense.name}"`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              ĐỘI HÌNH DEFENSE ĐÃ LƯU
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-bold">
                {savedDefenses.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Bấm biểu tượng kính lúp xanh [ 🔍 ] để nạp đội hình và tra cứu Counter tức thì
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Layout mode switcher: 5 Cột (default), 4 Cột, or 1 Cột dọc */}
          <div className="flex items-center bg-slate-950 p-0.5 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setLayoutMode('5_cols')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layoutMode === '5_cols'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Phân bổ các nhóm thành 5 cột thẳng hàng cân đối"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>5 Cột</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('4_cols')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layoutMode === '4_cols'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Phân bổ các nhóm thành 4 cột thẳng hàng cân đối"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>4 Cột</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('single_column')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                layoutMode === 'single_column'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xếp 1 cột dọc thẳng từ trên xuống dưới chuẩn ảnh mẫu"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1 Cột dọc</span>
            </button>
          </div>

          {activeDuplicateDefense ? (
            <button
              type="button"
              onClick={onOpenSaveCurrent}
              title={`Đội hình 3 quái thú này đã tồn tại trong danh sách: "${activeDuplicateDefense.name}" (không phân biệt thứ tự). Nhấp để xem thông báo hoặc sửa.`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Đã Có Trong DS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSaveCurrent}
              disabled={!canSaveCurrent}
              title={
                canSaveCurrent
                  ? 'Lưu đội hình 3 quái thú hiện tại'
                  : 'Hãy chọn đủ 3 quái thú ở ô DEFENSE phía trên để lưu'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
                canSaveCurrent
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/10'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Lưu Hiện Tại</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS: Mode Switcher (Tìm theo tên VS Chọn Pet để lọc) */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-3">
        {/* Toggle between "Tìm theo tên" and "Chọn Pet để lọc" */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setSearchMode('name')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === 'name'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm theo tên</span>
              {searchTerm && (
                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('pet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === 'pet'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mở danh sách chọn Pet</span>
              {filterPetIds.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-teal-500 text-slate-950 rounded-full font-black">
                  {filterPetIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick status & filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({savedDefenses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === 'active'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đang chọn
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('with_counters')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === 'with_counters'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Có sẵn Counter
            </button>
          </div>
        </div>

        {/* MODE 1: Search by Text Name */}
        {searchMode === 'name' && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nhập tên đội hình hoặc quái thú (VD: Clara, Savannah, Theomars...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* MODE 2: Pick Monsters from Roster to Filter */}
        {searchMode === 'pet' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Mở bảng chọn Pet lọc</span>
              </button>

              {filterPetIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterPetIds([])}
                  className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa lọc Pet</span>
                </button>
              )}

              <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                {filterPetIds.length > 0
                  ? `Đang lọc đội hình chứa ${filterPetIds.length} quái thú đã chọn`
                  : 'Bấm chọn quái thú từ kho để lọc các đội hình chứa quái thú đó'}
              </span>
            </div>

            {/* Selected Pet Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {filterPetIds.map((petId) => {
                const pet = getMonsterById(allMonsters, petId);
                if (!pet) return null;
                const elem = ELEMENT_COLORS[pet.element];
                return (
                  <div
                    key={petId}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-900 border border-blue-500/50 rounded-xl shadow-sm text-xs text-white"
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-950">
                      {pet.avatarUrl ? (
                        <img
                          src={pet.avatarUrl}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${elem.gradient} text-[9px] font-bold`}
                        >
                          {pet.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-slate-200 text-xs">
                      {pet.name}
                      {pet.awakenedName && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({pet.awakenedName})
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFilterPet(petId)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer ml-1"
                      title="Bỏ quái thú này khỏi bộ lọc"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {filterPetIds.length === 0 && (
                <div
                  onClick={() => setIsPickerModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 text-slate-500 hover:text-slate-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Chưa chọn Pet nào - Bấm vào đây để chọn</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DEFENSES LIST CONTAINER */}
      {filteredDefenses.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <Shield className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            {searchTerm || filterPetIds.length > 0 || filterMode !== 'all'
              ? 'Không tìm thấy đội hình nào phù hợp với bộ lọc.'
              : 'Chưa có đội hình phòng thủ nào được lưu.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {(searchTerm || filterPetIds.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPetIds([]);
                  setFilterMode('all');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Xóa toàn bộ bộ lọc
              </button>
            )}
            {canSaveCurrent && (
              <button
                type="button"
                onClick={onOpenSaveCurrent}
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
              >
                + Lưu đội hình hiện tại
              </button>
            )}
          </div>
        </div>
      ) : layoutMode === '5_cols' || layoutMode === '4_cols' ? (
        /* PHÂN BỔ THEO NHÓM: Phân bổ đều vào 4-5 CỘT THẲNG HÀNG, cân đối chiều cao không lung tung */
        <div
          className={
            layoutMode === '5_cols'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-start'
              : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start'
          }
        >
          {balancedColumns.columns.map((colGroups, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-3 min-w-0">
              {colGroups.map((group) => (
                <div
                  key={group.leadId}
                  className="flex flex-col gap-1.5 p-2 bg-slate-950/90 border border-slate-800/90 rounded-2xl shadow-md w-full"
                >
                  {/* Tiêu đề Cột: Quái thú dẫn đầu (Pet đầu) */}
                  <div className="flex items-center justify-between gap-1.5 px-1 pb-1.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {group.leadMonster?.avatarUrl ? (
                        <img
                          src={group.leadMonster.avatarUrl}
                          alt={group.leadMonster.name}
                          className="w-4 h-4 rounded-md object-cover border border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 shrink-0"></span>
                      )}
                      <span className="text-xs font-black text-slate-200 truncate">
                        {group.leadMonster?.name || group.leadId}
                      </span>
                      {group.leadMonster?.awakenedName && (
                        <span className="text-[10px] text-slate-400 font-medium truncate hidden 2xl:inline">
                          ({group.leadMonster.awakenedName})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md font-bold shrink-0">
                      {group.defenses.length} đội
                    </span>
                  </div>

                  {/* Các đội hình gần giống nhau xếp dọc theo cột từ trên xuống dưới */}
                  <div className="flex flex-col gap-1.5">
                    {group.defenses.map((defense) => renderDefenseRow(defense))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* 1 CỘT DỌC ĐƠN: Chuẩn ảnh mẫu hiển thị toàn bộ theo 1 cột thẳng đứng */
        <div className="flex flex-col gap-1.5 w-fit max-w-full">
          {filteredDefenses.map((defense) => renderDefenseRow(defense))}
        </div>
      )}

      {/* Monster Picker Modal for filtering */}
      <MonsterPickerModal
        isOpen={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
        onSelectMonster={handleSelectFilterPet}
        allMonsters={allMonsters}
        title="Chọn Quái Thú Để Lọc Đội Hình Defense"
      />
    </div>
  );
};
