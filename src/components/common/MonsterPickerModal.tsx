import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Trash2, Plus, Sparkles, Filter, Check, ListOrdered } from 'lucide-react';
import { ElementType, Monster, MonsterRole, RTASlot } from '../../types';
import { ELEMENT_COLORS, ROLE_LABELS } from '../../utils/monsterHelpers';
import { MonsterAvatar } from './MonsterAvatar';
import { sortMonstersByPickFrequency, recordMonsterPick } from '../../utils/monsterPickStats';

interface MonsterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMonster: (monsterId: string | null) => void;
  onSelectMultipleMonsters?: (monsterIds: string[]) => void;
  allMonsters: Monster[];
  currentMonsterId?: string | null;
  excludedMonsterIds?: string[]; // IDs already picked elsewhere
  title?: string;
  onOpenAddModal?: () => void;
  myTeam?: RTASlot[];
  enemyTeam?: RTASlot[];
  activePickerSlot?: { side: 'mine' | 'enemy'; index: number } | null;
  onSelectMonsterToSlot?: (monsterId: string, slotIndex: number) => void;
  mode?: 'all' | 'rta' | 'siege';
  allowMultiSelect?: boolean;
}

export const MonsterPickerModal: React.FC<MonsterPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectMonster,
  onSelectMultipleMonsters,
  allMonsters,
  currentMonsterId,
  excludedMonsterIds = [],
  title = 'Chọn Pet (Monster)',
  onOpenAddModal,
  myTeam,
  enemyTeam,
  activePickerSlot,
  onSelectMonsterToSlot,
  mode,
  allowMultiSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementType | 'all'>('all');
  const [selectedStars, setSelectedStars] = useState<number | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<MonsterRole | 'all'>('all');

  // Chế độ chọn nhiều pet (đặc biệt hữu ích khi chọn Team Địch theo thứ tự)
  const isEnemySide = activePickerSlot?.side === 'enemy';
  const canMultiSelect = Boolean(
    allowMultiSelect !== false && onSelectMultipleMonsters && (isEnemySide || allowMultiSelect === true)
  );
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);

  // Khi mở modal, tự động bật multiSelectMode nếu được phép và reset thứ tự đã chọn
  useEffect(() => {
    if (isOpen) {
      setSelectedOrder([]);
      setMultiSelectMode(Boolean(canMultiSelect));
    }
  }, [isOpen, canMultiSelect]);

  // Xác định ngữ cảnh tính điểm ngầm (RTA, Siege hoặc Cả hai)
  const effectiveMode = useMemo((): 'all' | 'rta' | 'siege' => {
    if (mode) return mode;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('rta') || (myTeam && myTeam.length > 0)) {
      return 'rta';
    }
    if (
      lowerTitle.includes('defense') ||
      lowerTitle.includes('counter') ||
      lowerTitle.includes('phòng thủ') ||
      lowerTitle.includes('công thành')
    ) {
      return 'siege';
    }
    return 'all';
  }, [mode, title, myTeam]);

  const filteredMonsters = useMemo(() => {
    const list = allMonsters.filter((m) => {
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

    // Danh sách pet tại mỗi hệ sẽ sắp xếp hiển thị pet được chọn nhiều nhất lên trên
    // theo thuật toán tính điểm ngầm cả RTA và Siege (không hiển thị số điểm ra UI)
    return sortMonstersByPickFrequency(list, { mode: effectiveMode });
  }, [allMonsters, searchTerm, selectedElement, selectedStars, selectedRole, effectiveMode]);

  const handleMonsterClick = (e: React.MouseEvent, monster: Monster, isExcluded: boolean) => {
    if (isExcluded) return;

    // Chế độ chọn nhiều pet (dành cho Team Địch): Đánh số thứ tự 1 -> 2 -> 3...
    if (multiSelectMode && onSelectMultipleMonsters) {
      setSelectedOrder((prev) => {
        if (prev.includes(monster.id)) {
          // Bỏ chọn pet này, các pet còn lại tự dịch thứ tự
          return prev.filter((id) => id !== monster.id);
        } else {
          // Tối đa 5 quái thú cho 1 đội
          if (prev.length >= 5) {
            return prev;
          }
          return [...prev, monster.id];
        }
      });
      return;
    }

    // Chọn đơn lẻ: Gán đúng vào vị trí đang chọn, không hiện gợi ý vị trí
    recordMonsterPick(monster.id);
    onSelectMonster(monster.id);
    onClose();
  };

  const handleConfirmMultiSelect = () => {
    if (selectedOrder.length === 0 || !onSelectMultipleMonsters) return;
    onSelectMultipleMonsters(selectedOrder);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isEnemySide
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
            }`}>
              {isEnemySide ? <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">{title}</h3>
                {canMultiSelect && (
                  <button
                    type="button"
                    onClick={() => {
                      setMultiSelectMode(!multiSelectMode);
                      setSelectedOrder([]);
                    }}
                    className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all border cursor-pointer ${
                      multiSelectMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 ring-1 ring-amber-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title={multiSelectMode ? 'Đang bật chọn nhiều pet. Bấm để chuyển sang chọn từng con.' : 'Bật chế độ chọn nhiều pet cùng lúc'}
                  >
                    <span className={`w-2 h-2 rounded-full ${multiSelectMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>Chọn nhiều pet: {multiSelectMode ? 'BẬT' : 'TẮT'}</span>
                  </button>
                )}
              </div>
              <p className="text-[10.5px] sm:text-xs text-slate-400">
                Tìm thấy <span className="text-teal-400 font-semibold">{filteredMonsters.length}</span> / {allMonsters.length} quái thú
                {multiSelectMode && (
                  <span className="ml-2 text-amber-300 font-semibold">
                    (Đã chọn {selectedOrder.length}/5 pet theo thứ tự)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentMonsterId && !multiSelectMode && (
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
        <div className="p-3 sm:p-5 overflow-y-auto max-h-[56vh] sm:max-h-[58vh] custom-scrollbar">
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
                const orderIndex = selectedOrder.indexOf(monster.id) + 1;
                const isSelectedInMulti = orderIndex > 0;
                const isExcluded = excludedMonsterIds.includes(monster.id) && !isSelected && !isSelectedInMulti;

                return (
                  <div
                    key={monster.id}
                    onClick={(e) => handleMonsterClick(e, monster, isExcluded)}
                    className={`relative p-1.5 sm:p-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                      isSelectedInMulti
                        ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/80 shadow-xl'
                        : isSelected
                        ? 'bg-teal-950/70 border-teal-400 ring-2 ring-teal-400/50 shadow-lg'
                        : isExcluded
                        ? 'opacity-35 grayscale cursor-not-allowed border-slate-800/80 bg-slate-950/40'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 hover:border-teal-500/60'
                    }`}
                  >
                    {/* Badge số thứ tự khi chọn nhiều pet */}
                    {isSelectedInMulti && (
                      <div className="absolute -top-1.5 -left-1.5 z-30 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg border-2 border-slate-900 ring-2 ring-amber-400/50 animate-in zoom-in-75">
                        #{orderIndex}
                      </div>
                    )}

                    {/* Status Badges */}
                    {isExcluded && !isSelectedInMulti && (
                      <span className="absolute top-1 right-1 z-20 text-[8px] sm:text-[9px] bg-red-950/90 text-red-300 border border-red-800/80 px-1 py-0.2 rounded font-semibold shadow pointer-events-none">
                        Đã chọn
                      </span>
                    )}

                    {isSelected && !isSelectedInMulti && (
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

        {/* Thanh tác vụ xác nhận chọn nhiều pet (khi có ít nhất 1 pet được chọn trong multi mode) */}
        {multiSelectMode && canMultiSelect && selectedOrder.length > 0 && (
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-t border-amber-500/40 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 shadow-2xl shrink-0 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-full">
              <span className="text-[11px] sm:text-xs font-black text-amber-400 uppercase tracking-wide shrink-0 flex items-center gap-1">
                <ListOrdered className="w-3.5 h-3.5" />
                Thứ tự gán:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {selectedOrder.map((id, idx) => {
                  const m = allMonsters.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-800/90 border border-amber-500/40 text-slate-200 text-xs shrink-0"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs truncate max-w-[80px] sm:max-w-[100px]">
                        {m?.name || id}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder((prev) => prev.filter((item) => item !== id));
                        }}
                        className="text-slate-400 hover:text-red-400 p-0.5 cursor-pointer"
                        title="Bỏ pet này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setSelectedOrder([])}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Xóa chọn
              </button>
              <button
                type="button"
                onClick={handleConfirmMultiSelect}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                <span>Xác nhận gán ({selectedOrder.length} pet) theo thứ tự</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 shrink-0">
          <p className="text-[11px] sm:text-xs text-slate-400 truncate pr-2">
            {multiSelectMode
              ? '💡 Nhấp chọn các pet theo thứ tự 1 ➔ 2 ➔ 3... rồi bấm "Xác nhận gán"'
              : '💡 Nhấp vào quái thú để gán ngay vào vị trí đang chọn'}
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

