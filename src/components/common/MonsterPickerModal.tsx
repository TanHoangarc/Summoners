import React, { useState, useMemo } from 'react';
import { Search, X, Trash2, Plus, Sparkles, Filter } from 'lucide-react';
import { ElementType, Monster, MonsterRole } from '../../types';
import { ELEMENT_COLORS, ROLE_LABELS } from '../../utils/monsterHelpers';
import { MonsterAvatar } from './MonsterAvatar';

interface MonsterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMonster: (monsterId: string | null) => void;
  allMonsters: Monster[];
  currentMonsterId?: string | null;
  excludedMonsterIds?: string[]; // IDs already picked elsewhere
  title?: string;
  onOpenAddModal?: () => void;
}

export const MonsterPickerModal: React.FC<MonsterPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectMonster,
  allMonsters,
  currentMonsterId,
  excludedMonsterIds = [],
  title = 'Chọn Pet (Monster)',
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementType | 'all'>('all');
  const [selectedStars, setSelectedStars] = useState<number | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<MonsterRole | 'all'>('all');

  const filteredMonsters = useMemo(() => {
    return allMonsters.filter((m) => {
      // Search term
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        (m.awakenedName && m.awakenedName.toLowerCase().includes(term)) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(term)));

      // Element
      const matchElement = selectedElement === 'all' || m.element === selectedElement;

      // Stars
      const matchStars = selectedStars === 'all' || m.naturalStars === selectedStars;

      // Role
      const matchRole = selectedRole === 'all' || m.role === selectedRole;

      return matchSearch && matchElement && matchStars && matchRole;
    });
  }, [allMonsters, searchTerm, selectedElement, selectedStars, selectedRole]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">{title}</h3>
              <p className="text-[10.5px] sm:text-xs text-slate-400">
                Tìm thấy <span className="text-teal-400 font-semibold">{filteredMonsters.length}</span> / {allMonsters.length} quái thú
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentMonsterId && (
              <button
                type="button"
                onClick={() => {
                  onSelectMonster(null);
                  onClose();
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bỏ chọn</span>
              </button>
            )}

            {onOpenAddModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-teal-300 bg-teal-950/50 hover:bg-teal-900/60 border border-teal-700/60 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Pet</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800/80 bg-slate-950/40 space-y-2.5 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên pet (vd: Oliver, Shizuka, Moore, Savannah...)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters: Element & Stars & Role */}
          <div className="space-y-2 text-xs">
            {/* Element Buttons with horizontal scrollbar if needed */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-slate-400 font-medium text-[11px] sm:text-xs shrink-0 flex items-center gap-1 mr-0.5">
                <Filter className="w-3 h-3 text-teal-400" /> Hệ:
              </span>
              <button
                type="button"
                onClick={() => setSelectedElement('all')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedElement === 'all'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Tất cả
              </button>
              {(['water', 'fire', 'wind', 'light', 'dark'] as ElementType[]).map((elem) => {
                const info = ELEMENT_COLORS[elem];
                const active = selectedElement === elem;
                return (
                  <button
                    key={elem}
                    type="button"
                    onClick={() => setSelectedElement(elem)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer shrink-0 ${
                      active
                        ? `${info.badge} ring-1 ring-white/20 font-bold`
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={info.iconUrl} alt={elem} className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain" />
                    <span className="capitalize">{info.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Stars & Role Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              {/* Stars Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs mr-0.5">Sao:</span>
                <button
                  type="button"
                  onClick={() => setSelectedStars('all')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border text-[10.5px] sm:text-xs font-medium transition-colors cursor-pointer ${
                    selectedStars === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  All
                </button>
                {[5, 4, 3, 2].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStars(star)}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border text-[10.5px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                      selectedStars === star
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {star}★
                  </button>
                ))}
              </div>

              {/* Roles */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs mr-0.5">Vai trò:</span>
                {(['all', 'attack', 'defense', 'hp', 'support'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border transition-colors cursor-pointer ${
                      selectedRole === r
                        ? 'bg-slate-200 text-slate-950 border-white font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r === 'all' ? 'All' : ROLE_LABELS[r].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monster Grid */}
        <div className="p-3 sm:p-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {filteredMonsters.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <p className="text-base font-medium">Không tìm thấy pet nào phù hợp</p>
              <p className="text-xs text-slate-500">
                Hãy thử đổi từ khóa tìm kiếm hoặc bấm "Thêm Pet" để tự tạo pet mới với link ảnh avatar của bạn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-2.5">
              {filteredMonsters.map((monster) => {
                const isSelected = monster.id === currentMonsterId;
                const isExcluded = excludedMonsterIds.includes(monster.id) && !isSelected;

                return (
                  <div
                    key={monster.id}
                    onClick={() => {
                      if (isExcluded) return;
                      onSelectMonster(monster.id);
                      onClose();
                    }}
                    className={`relative p-1.5 sm:p-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-teal-950/70 border-teal-400 ring-2 ring-teal-400/50 shadow-lg'
                        : isExcluded
                        ? 'opacity-35 grayscale cursor-not-allowed border-slate-800/80 bg-slate-950/40'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 hover:border-teal-500/60'
                    }`}
                  >
                    {/* Status Badges positioned without covering the monster's face */}
                    {isExcluded && (
                      <span className="absolute top-1 right-1 z-20 text-[8px] sm:text-[9px] bg-red-950/90 text-red-300 border border-red-800/80 px-1 py-0.2 rounded font-semibold shadow pointer-events-none">
                        Đã chọn
                      </span>
                    )}

                    {isSelected && (
                      <span className="absolute top-1 right-1 z-20 text-[8px] sm:text-[9px] bg-teal-500 text-slate-950 font-bold px-1 py-0.2 rounded shadow pointer-events-none">
                        Hiện tại
                      </span>
                    )}

                    <MonsterAvatar
                      monster={monster}
                      size="sm"
                      showStars={true}
                      showName={false}
                      showTooltip={false}
                    />

                    <div className="text-center w-full px-0.5 min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-200 truncate leading-tight">
                        {monster.name}
                      </p>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-400 truncate leading-none mt-0.5">
                        {monster.awakenedName ? monster.awakenedName.split(' ')[0] : monster.element}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 shrink-0">
          <p className="text-[11px] sm:text-xs text-slate-400 truncate pr-2">
            💡 Nhấp vào quái thú để chọn vào vị trí đội hình
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors cursor-pointer shrink-0 text-xs"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
