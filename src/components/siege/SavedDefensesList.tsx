import React, { useState, useMemo, useEffect } from 'react';
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
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Swords,
  CheckCircle,
  Pencil,
  Loader2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Monster, SavedSiegeDefense, SiegeCounterStrategy } from '../../types';
import { getMonsterById, ELEMENT_COLORS } from '../../utils/monsterHelpers';
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
  // Column 3 Counter interactions
  onOpenAddCounter: (defense: SavedSiegeDefense) => void;
  onEditCounter: (counter: SiegeCounterStrategy) => void;
  onDeleteCounter: (counterId: string) => void;
  onAIGenerateForCounter: (counter: SiegeCounterStrategy) => void;
  aiLoadingCounterId?: string | null;
}

// Compact monster icon matching the game UI / screenshot exactly
const CompactMonsterIcon: React.FC<{
  monster?: Monster | null;
  isLeader?: boolean;
  size?: 'sm' | 'md';
}> = ({ monster, isLeader = false, size = 'md' }) => {
  const [imgErr, setImgErr] = useState(false);
  const elementInfo = monster ? ELEMENT_COLORS[monster.element] || ELEMENT_COLORS.water : null;

  const dimClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : 'w-10 h-10 sm:w-11 sm:h-11 rounded-lg';

  if (!monster) {
    return (
      <div
        className={`${dimClasses} bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0`}
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={`${dimClasses} overflow-hidden shrink-0 select-none shadow-sm relative bg-slate-950 transition-transform ${
        isLeader
          ? 'border-2 border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
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
  onOpenAddCounter,
  onEditCounter,
  onDeleteCounter,
  onAIGenerateForCounter,
  aiLoadingCounterId,
}) => {
  // Cột 1: Quick leader search input
  const [leaderSearchTerm, setLeaderSearchTerm] = useState('');

  // Cột 1: Selection & Expand/Collapse state
  // When a leader is clicked, Column 2 ONLY shows defenses of that leader
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [viewAllLeaders, setViewAllLeaders] = useState(false);
  const [isLeaderCollapsed, setIsLeaderCollapsed] = useState(false);
  // Selected Defense in Cột 2 (shows counters in Cột 3)
  const [selectedDefenseId, setSelectedDefenseId] = useState<string | null>(null);
  // Expanded strategies in Column 3
  const [expandedStrategyIds, setExpandedStrategyIds] = useState<Record<string, boolean>>({});

  // Mobile / small screen tab switcher: 'column1' | 'column2' | 'column3'
  const [mobileTab, setMobileTab] = useState<'column1' | 'column2' | 'column3'>('column1');

  // Helper to check if a saved defense matches currently active defense in top bar
  const isDefenseActive = (def: SavedSiegeDefense) => {
    return (
      activeDefenseIds[0] === def.monsterIds[0] &&
      activeDefenseIds[1] === def.monsterIds[1] &&
      activeDefenseIds[2] === def.monsterIds[2]
    );
  };

  const isDefensePermutationMatch = (def: SavedSiegeDefense) => {
    return isSameMonsterTeam(activeDefenseIds, def.monsterIds);
  };

  // Active duplicate defense detected across savedDefenses
  const activeDuplicateDefense = useMemo(() => {
    return findDuplicateSiegeDefense(activeDefenseIds, savedDefenses);
  }, [activeDefenseIds, savedDefenses]);

  // Helper to get counters for a defense
  const getDefenseCounters = (monsterIds: [string, string, string]) => {
    return countersDatabase.filter((c) => {
      return (
        c.defenseMonsterIds.includes(monsterIds[0]) &&
        c.defenseMonsterIds.includes(monsterIds[1]) &&
        c.defenseMonsterIds.includes(monsterIds[2])
      );
    });
  };

  // Helper to count known exact counters in database
  const getCountersCount = (monsterIds: [string, string, string]) => {
    return getDefenseCounters(monsterIds).length;
  };

  // Helper to get sortable canonical name of a monster
  const getMonsterSortName = (monsterId?: string | null) => {
    if (!monsterId) return 'zzz';
    const m = getMonsterById(allMonsters, monsterId);
    return (m?.awakenedName || m?.name || monsterId).trim().toLowerCase();
  };

  // Smart-sorted defenses by Leader and companions
  const sortedDefenses = useMemo(() => {
    const list = [...savedDefenses];
    return list.sort((a, b) => {
      const leadA = getMonsterSortName(a.monsterIds[0]);
      const leadB = getMonsterSortName(b.monsterIds[0]);
      if (leadA !== leadB) {
        return leadA.localeCompare(leadB);
      }

      const restA = [
        getMonsterSortName(a.monsterIds[1]),
        getMonsterSortName(a.monsterIds[2]),
      ].sort();

      const restB = [
        getMonsterSortName(b.monsterIds[1]),
        getMonsterSortName(b.monsterIds[2]),
      ].sort();

      const cmp0 = restA[0].localeCompare(restB[0]);
      if (cmp0 !== 0) return cmp0;

      const cmp1 = restA[1].localeCompare(restB[1]);
      if (cmp1 !== 0) return cmp1;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [savedDefenses, allMonsters]);

  // Group defenses by Leader monster (Pet 1 / Slot 0)
  interface DefenseGroup {
    leadId: string;
    leadMonster?: Monster | null;
    defenses: SavedSiegeDefense[];
  }

  const groupedDefenses = useMemo(() => {
    const groups: DefenseGroup[] = [];
    sortedDefenses.forEach((def) => {
      const leadId = def.leaderMonsterId || def.monsterIds[0];
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

    // Filter leaders by leaderSearchTerm if provided
    if (leaderSearchTerm.trim()) {
      const q = leaderSearchTerm.toLowerCase();
      return groups.filter((g) => {
        const m = g.leadMonster;
        return (
          m?.name.toLowerCase().includes(q) ||
          m?.awakenedName?.toLowerCase().includes(q) ||
          m?.element.toLowerCase().includes(q)
        );
      });
    }

    return groups;
  }, [sortedDefenses, allMonsters, leaderSearchTerm]);

  // Set default selected leader on initial load
  useEffect(() => {
    if (groupedDefenses.length > 0 && !selectedLeaderId) {
      setSelectedLeaderId(groupedDefenses[0].leadId);
    }
  }, [groupedDefenses, selectedLeaderId]);

  // Auto-select initial defense if none selected
  useEffect(() => {
    if (!selectedDefenseId && sortedDefenses.length > 0) {
      // If there is an active defense from props, select it
      const match = sortedDefenses.find((d) => isDefenseActive(d));
      if (match) {
        setSelectedDefenseId(match.id);
      } else {
        setSelectedDefenseId(sortedDefenses[0].id);
      }
    }
  }, [sortedDefenses, selectedDefenseId]);

  // The currently selected defense object for Column 3
  const currentSelectedDefense = useMemo(() => {
    if (!selectedDefenseId) return null;
    return savedDefenses.find((d) => d.id === selectedDefenseId) || null;
  }, [selectedDefenseId, savedDefenses]);

  // Counters for the selected defense
  const currentCounters = useMemo(() => {
    if (!currentSelectedDefense) return [];
    return getDefenseCounters(currentSelectedDefense.monsterIds);
  }, [currentSelectedDefense, countersDatabase]);

  // When clicking on a leader in Column 1:
  // "khi click vào Leader nào thì chỉ hiện đội hình liên quan đến leader đó thôi không hiện các đội của leader khác"
  const handleSelectLeader = (leadId: string) => {
    setSelectedLeaderId(leadId);
    setViewAllLeaders(false);
    setIsLeaderCollapsed(false);

    // Auto-select the first defense of this newly selected leader for Column 3
    const targetGroup = groupedDefenses.find((g) => g.leadId === leadId);
    if (targetGroup && targetGroup.defenses.length > 0) {
      const isAlreadyInGroup = targetGroup.defenses.some((d) => d.id === selectedDefenseId);
      if (!isAlreadyInGroup) {
        const firstDef = targetGroup.defenses[0];
        setSelectedDefenseId(firstDef.id);
        onLoadDefense(firstDef);
      }
    }

    // Switch to Column 2 on mobile
    setMobileTab('column2');
  };

  // Toggle single leader expansion / collapse
  const handleToggleLeader = (leadId: string) => {
    if (selectedLeaderId === leadId && !viewAllLeaders) {
      // If this leader is currently active, toggle collapse
      setIsLeaderCollapsed((prev) => !prev);
    } else {
      // If a different leader was clicked, select it exclusively
      handleSelectLeader(leadId);
    }
  };

  // Select a defense team (loads into active defense and shows counters in Column 3)
  const handleSelectDefense = (defense: SavedSiegeDefense) => {
    setSelectedDefenseId(defense.id);
    onLoadDefense(defense);
    setMobileTab('column3');
  };

  // Defenses to display in Column 2:
  // EXCLUSIVELY SHOWS ONLY THE SELECTED LEADER'S DEFENSES unless viewAllLeaders is true!
  const displayedDefensesInColumn2 = useMemo(() => {
    if (isLeaderCollapsed && !viewAllLeaders) {
      return [];
    }
    if (viewAllLeaders) {
      return groupedDefenses;
    }
    if (selectedLeaderId) {
      const match = groupedDefenses.filter((g) => g.leadId === selectedLeaderId);
      if (match.length > 0) return match;
    }
    return groupedDefenses.length > 0 ? [groupedDefenses[0]] : [];
  }, [groupedDefenses, selectedLeaderId, viewAllLeaders, isLeaderCollapsed]);

  const activeLeaderGroup = useMemo(() => {
    return (
      groupedDefenses.find((g) => g.leadId === selectedLeaderId) ||
      (groupedDefenses.length > 0 ? groupedDefenses[0] : null)
    );
  }, [groupedDefenses, selectedLeaderId]);

  const totalExpandedDefensesCount = useMemo(() => {
    return displayedDefensesInColumn2.reduce((acc, g) => acc + g.defenses.length, 0);
  }, [displayedDefensesInColumn2]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đội hình "${name}"?`)) {
      onDeleteDefense(id);
      if (selectedDefenseId === id) {
        setSelectedDefenseId(null);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              Quản lý danh sách
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-bold">
                {savedDefenses.length} đội hình
              </span>
            </h3>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {activeDuplicateDefense ? (
            <button
              type="button"
              onClick={onOpenSaveCurrent}
              title={`Đội hình 3 quái thú này đã tồn tại: "${activeDuplicateDefense.name}"`}
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

          <button
            type="button"
            onClick={onRestoreDefaults}
            title="Khôi phục lại danh sách các đội hình mẫu ban đầu"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1 border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Khôi phục mẫu</span>
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE TABS: Switches between Column 1, 2, and 3 on small screens */}
      <div className="flex lg:hidden items-center bg-slate-950 p-1 border border-slate-800 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('column1')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'column1'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Leader ({groupedDefenses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('column2')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'column2'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Đội hình ({totalExpandedDefensesCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('column3')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'column3'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Counter ({currentCounters.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3-COLUMN LAYOUT CONTAINER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ======================================================================= */}
        {/* CỘT 1: LEADER (BÊN TRÁI) */}
        {/* ======================================================================= */}
        <div
          className={`lg:col-span-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-3 flex flex-col ${
            mobileTab === 'column1' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Cột 1 Header & Controls */}
          <div className="space-y-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Leader
                </h4>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {groupedDefenses.length} Leader
              </span>
            </div>

            {/* Quick Leader Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Lọc tên Leader..."
                value={leaderSearchTerm}
                onChange={(e) => setLeaderSearchTerm(e.target.value)}
                className="w-full pl-8 pr-6 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {leaderSearchTerm && (
                <button
                  type="button"
                  onClick={() => setLeaderSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Leaders List in Column 1 */}
          <div className="space-y-1.5 overflow-y-auto max-h-[640px] pr-1 scrollbar-thin">
            {groupedDefenses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Không có Leader nào phù hợp với bộ lọc
              </div>
            ) : (
              groupedDefenses.map((group) => {
                const isSelected = selectedLeaderId === group.leadId && !viewAllLeaders;
                const isExpanded = isSelected ? !isLeaderCollapsed : false;

                return (
                  <div
                    key={group.leadId}
                    className={`group/leader relative rounded-xl border transition-all cursor-pointer select-none p-1.5 ${
                      isSelected
                        ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/50 shadow-md'
                        : 'bg-slate-950/90 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                    onClick={() => handleSelectLeader(group.leadId)}
                    title={
                      isSelected
                        ? `Đang chỉ hiển thị các đội của ${group.leadMonster?.name || group.leadId} ở Cột 2`
                        : `Nhấp để chỉ hiển thị các đội của ${group.leadMonster?.name || group.leadId} ở Cột 2`
                    }
                  >
                    {/* Leader Header Row - EXACT MATCH with red box in image.png */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Leader Avatar */}
                        <div className="shrink-0">
                          <CompactMonsterIcon
                            monster={group.leadMonster}
                            isLeader={true}
                            size="sm"
                          />
                        </div>

                        {/* Leader Name + Awakened Name */}
                        <div className="min-w-0 flex flex-col justify-center">
                          <span
                            className={`text-xs font-black truncate flex items-center gap-1 ${
                              isSelected ? 'text-blue-200' : 'text-slate-100'
                            }`}
                          >
                            {group.leadMonster?.name || group.leadId}
                          </span>
                          {group.leadMonster?.awakenedName && (
                            <span className="text-[10px] text-slate-400 truncate">
                              ({group.leadMonster.awakenedName})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side: 'X đội' badge + Collapse/Expand button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/20 text-teal-300 font-extrabold rounded border border-teal-500/40">
                            Đang xem
                          </span>
                        )}

                        {/* Exact badge: 'X đội' (Blue background, border, matching screenshot) */}
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                            isSelected
                              ? 'bg-blue-600 text-white font-black shadow-sm'
                              : 'bg-blue-950/90 text-blue-300 border border-blue-600/40'
                          }`}
                        >
                          {group.defenses.length} đội
                        </span>

                        {/* Nút thu gọn / mở rộng */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLeader(group.leadId);
                          }}
                          className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-blue-600/30 text-blue-200 hover:bg-blue-600/40'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                          }`}
                          title={
                            isExpanded
                              ? 'Thu gọn danh sách đội hình này'
                              : 'Mở rộng danh sách đội hình này ở Cột 2'
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT 2: DANH SÁCH ĐỘI HÌNH DEFENSE (Ở GIỮA) */}
        {/* ======================================================================= */}
        <div
          className={`lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-3 flex flex-col ${
            mobileTab === 'column2' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Cột 2 Header */}
          <div className="space-y-1.5 border-b border-slate-800 pb-2.5">
            {!viewAllLeaders && activeLeaderGroup ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CompactMonsterIcon
                    monster={activeLeaderGroup.leadMonster}
                    isLeader={true}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 truncate">
                      {activeLeaderGroup.leadMonster?.name || activeLeaderGroup.leadId}
                      {activeLeaderGroup.leadMonster?.awakenedName && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({activeLeaderGroup.leadMonster.awakenedName})
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewAllLeaders(true)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-slate-800 transition-colors cursor-pointer"
                    title="Xem tất cả các đội hình"
                  >
                    Xem tất cả
                  </button>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {activeLeaderGroup.defenses.length} đội
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Đội hình
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedLeaderId && (
                    <button
                      type="button"
                      onClick={() => setViewAllLeaders(false)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Chỉ xem Leader đã chọn
                    </button>
                  )}
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {totalExpandedDefensesCount} đội
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Defense List Body */}
          <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1 scrollbar-thin">
            {displayedDefensesInColumn2.length === 0 ? (
              <div className="p-6 text-center space-y-2 bg-slate-900/50 rounded-xl border border-slate-800/80">
                <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {isLeaderCollapsed
                    ? 'Danh sách đội hình của Leader này đang được thu gọn.'
                    : 'Chưa có Leader nào được chọn.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsLeaderCollapsed(false);
                    if (!selectedLeaderId && groupedDefenses.length > 0) {
                      handleSelectLeader(groupedDefenses[0].leadId);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                >
                  Mở rộng danh sách đội hình
                </button>
              </div>
            ) : (
              displayedDefensesInColumn2.map((group) => {
                return (
                  <div
                    key={group.leadId}
                    className="p-2.5 bg-slate-900/80 border border-slate-800/90 rounded-2xl space-y-2 shadow-sm"
                  >
                    {/* Sub-header for this leader group */}
                    <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {group.leadMonster?.avatarUrl ? (
                          <img
                            src={group.leadMonster.avatarUrl}
                            alt={group.leadMonster.name}
                            className="w-4 h-4 rounded-md object-cover border border-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        )}
                        <span className="text-xs font-black text-slate-200 truncate">
                          {group.leadMonster?.name || group.leadId}
                        </span>
                        {group.leadMonster?.awakenedName && (
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            ({group.leadMonster.awakenedName})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md font-bold shrink-0">
                          {group.defenses.length} đội
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleLeader(group.leadId)}
                          className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                          title="Thu gọn nhóm Leader này"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Defenses under this leader */}
                    <div className="space-y-1.5">
                      {group.defenses.map((defense) => {
                        const m1 = getMonsterById(allMonsters, defense.monsterIds[0]);
                        const m2 = getMonsterById(allMonsters, defense.monsterIds[1]);
                        const m3 = getMonsterById(allMonsters, defense.monsterIds[2]);
                        const isCurrentActive = isDefenseActive(defense);
                        const isSelectedInCol2 = selectedDefenseId === defense.id;
                        const counterCount = getCountersCount(defense.monsterIds);

                        return (
                          <div
                            key={defense.id}
                            onClick={() => handleSelectDefense(defense)}
                            className={`group relative flex items-center justify-between gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSelectedInCol2
                                ? 'bg-slate-950 border-teal-500 ring-2 ring-teal-500/50 shadow-lg shadow-teal-500/20'
                                : isCurrentActive
                                ? 'bg-slate-950 border-teal-600/70 ring-1 ring-teal-500/30'
                                : 'bg-slate-950/90 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                            title={`Xem danh sách counter cho: ${defense.name}`}
                          >
                            {/* 3 Monster Avatars + Iconic Blue Search Button [🔍] (EXACT MATCH) */}
                            <div className="flex items-center gap-1">
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
                                  defense.leaderMonsterId
                                    ? defense.leaderMonsterId === defense.monsterIds[1]
                                    : false
                                }
                              />
                              <CompactMonsterIcon
                                monster={m3}
                                isLeader={
                                  defense.leaderMonsterId
                                    ? defense.leaderMonsterId === defense.monsterIds[2]
                                    : false
                                }
                              />

                              {/* Iconic Blue Square Search Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectDefense(defense);
                                }}
                                title={`Xem ${counterCount} counter của đội này`}
                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-white transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
                                  isSelectedInCol2
                                    ? 'bg-teal-500 hover:bg-teal-400 ring-2 ring-teal-300 shadow-teal-500/40'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                                }`}
                              >
                                <Search className="w-5 h-5 text-white stroke-[2.5]" />
                              </button>
                            </div>

                            {/* Center info: Counter count badge */}
                            <div className="min-w-0 flex flex-col items-end pr-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  counterCount > 0
                                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                    : 'bg-slate-800/80 text-slate-400'
                                }`}
                              >
                                {counterCount > 0 ? `${counterCount} counter` : '0 counter'}
                              </span>

                              {isSelectedInCol2 && (
                                <span className="text-[9px] text-teal-400 font-extrabold flex items-center gap-0.5 mt-0.5">
                                  <span>Đang xem</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>

                            {/* Actions (Edit / Delete) visible on hover */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditDefense(defense);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                title={`Sửa "${defense.name}"`}
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
                                title={`Xóa "${defense.name}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT 3: DANH SÁCH COUNTER (BÊN PHẢI) */}
        {/* ======================================================================= */}
        <div
          className={`lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-3 flex flex-col ${
            mobileTab === 'column3' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Cột 3 Header */}
          <div className="space-y-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Counter
                </h4>
              </div>

              {currentSelectedDefense && (
                <button
                  type="button"
                  onClick={() => onOpenAddCounter(currentSelectedDefense)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-lg text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Thêm Counter</span>
                </button>
              )}
            </div>

            {/* Selected Defense Banner */}
            {currentSelectedDefense ? (
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 border border-teal-500/40 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <CompactMonsterIcon
                      monster={getMonsterById(allMonsters, currentSelectedDefense.monsterIds[0])}
                      isLeader={true}
                      size="sm"
                    />
                    <CompactMonsterIcon
                      monster={getMonsterById(allMonsters, currentSelectedDefense.monsterIds[1])}
                      size="sm"
                    />
                    <CompactMonsterIcon
                      monster={getMonsterById(allMonsters, currentSelectedDefense.monsterIds[2])}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {currentSelectedDefense.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Đang xem counter ({currentCounters.length} đội khắc chế)
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
                  {currentCounters.length} Counter
                </span>
              </div>
            ) : (
              <div className="p-2.5 text-xs text-slate-400 italic bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                👈 Chọn một đội hình ở Cột 2 để xem danh sách counter
              </div>
            )}
          </div>

          {/* Counters List Body */}
          <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1 scrollbar-thin">
            {!currentSelectedDefense ? (
              <div className="p-8 text-center space-y-2 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <Swords className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  Hãy nhấp chọn một đội hình phòng thủ ở Cột 2 (Giữa) để tra cứu các đội hình khắc chế.
                </p>
              </div>
            ) : currentCounters.length === 0 ? (
              <div className="p-6 text-center space-y-3 bg-slate-900/50 rounded-xl border border-slate-800/90">
                <Swords className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-300">
                    Chưa có đội hình counter nào được lưu cho bộ 3 này
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bấm "Thêm Counter Mới" để lưu chiến thuật và chia sẻ kinh nghiệm đánh thắng!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAddCounter(currentSelectedDefense)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Thêm Counter Mới</span>
                </button>
              </div>
            ) : (
              currentCounters.map((counter) => {
                const c1 = getMonsterById(allMonsters, counter.counterMonsterIds[0]);
                const c2 = getMonsterById(allMonsters, counter.counterMonsterIds[1]);
                const c3 = getMonsterById(allMonsters, counter.counterMonsterIds[2]);
                const isExpanded = Boolean(expandedStrategyIds[counter.id]);

                return (
                  <div
                    key={counter.id}
                    className="p-3 bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl space-y-2.5 shadow-md transition-all"
                  >
                    {/* Counter Header: 3 Pet Avatars + Names + Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* 3 Counter avatars */}
                        <div className="flex items-center gap-1">
                          <CompactMonsterIcon monster={c1} isLeader={true} size="sm" />
                          <CompactMonsterIcon monster={c2} size="sm" />
                          <CompactMonsterIcon monster={c3} size="sm" />
                        </div>

                        {/* Names & Difficulty */}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {[c1?.name, c2?.name, c3?.name].filter(Boolean).join(' + ')}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            {counter.difficulty && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 font-semibold">
                                {counter.difficulty}
                              </span>
                            )}
                            {counter.isCustom && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">
                                Tự lưu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Edit, Delete, Details) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditCounter(counter)}
                          className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Sửa chiến thuật counter này"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCounter(counter.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Xóa counter này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedStrategyIds((prev) => ({
                              ...prev,
                              [counter.id]: !prev[counter.id],
                            }))
                          }
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Strategy Details */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in duration-150 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-300">
                            Chiến thuật đánh & Chỉ số yêu cầu:
                          </span>
                          <button
                            type="button"
                            onClick={() => onAIGenerateForCounter(counter)}
                            disabled={aiLoadingCounterId === counter.id}
                            className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-md text-[10px] font-bold transition-all border border-teal-500/30 cursor-pointer disabled:opacity-60"
                            title="Nhờ Gemini AI phân tích lại chiến thuật"
                          >
                            {aiLoadingCounterId === counter.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                                <span>Đang phân tích...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-teal-400" />
                                <span>AI gợi ý lại</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-300 whitespace-pre-line text-[11.5px] leading-relaxed font-sans">
                          {counter.strategy}
                        </div>

                        {counter.turnOrder && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span className="font-semibold text-slate-300">Thứ tự đánh:</span>
                            <span className="text-teal-300">{counter.turnOrder}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
