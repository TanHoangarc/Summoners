import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Grid,
  List,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ElementType, Monster, MonsterRole } from '../../types';
import { ELEMENT_COLORS, ROLE_LABELS } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';

interface MonsterManagerViewProps {
  monsters: Monster[];
  onAddMonster: () => void;
  onEditMonster: (monster: Monster) => void;
  onDeleteMonster: (monsterId: string) => void;
  onUpdateAvatarUrl: (monsterId: string, newUrl: string) => void;
  onSeedDefault?: () => void;
  isSyncing?: boolean;
}

export const MonsterManagerView: React.FC<MonsterManagerViewProps> = ({
  monsters,
  onAddMonster,
  onEditMonster,
  onDeleteMonster,
  onUpdateAvatarUrl,
  onSeedDefault,
  isSyncing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementType | 'all'>('all');
  const [selectedStars, setSelectedStars] = useState<number | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<MonsterRole | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');

  // Quick avatar updater modal state
  const [quickAvatarMonster, setQuickAvatarMonster] = useState<Monster | null>(null);
  const [quickAvatarInput, setQuickAvatarInput] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const handleOpenQuickAvatar = (monster: Monster) => {
    setQuickAvatarMonster(monster);
    setQuickAvatarInput(monster.avatarUrl || '');
  };

  const handleSaveQuickAvatar = () => {
    if (quickAvatarMonster) {
      onUpdateAvatarUrl(quickAvatarMonster.id, quickAvatarInput.trim());
      setQuickAvatarMonster(null);
    }
  };

  const [onlyDuplicates, setOnlyDuplicates] = useState(false);

  // Group monsters to detect duplicates (by base name + element, or exact name + element)
  const duplicateMap = useMemo(() => {
    const map = new Map<string, Monster[]>();
    for (const m of monsters) {
      const baseName = m.name.trim().toLowerCase().replace(/\s+#\d+$/, '');
      const key = `${baseName}_${m.element}`;
      const existing = map.get(key) || [];
      existing.push(m);
      map.set(key, existing);
    }
    return map;
  }, [monsters]);

  const duplicateMonsterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of duplicateMap.values()) {
      if (group.length > 1) {
        for (const m of group) {
          ids.add(m.id);
        }
      }
    }
    return ids;
  }, [duplicateMap]);

  const filteredMonsters = useMemo(() => {
    return monsters.filter((m) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        (m.awakenedName && m.awakenedName.toLowerCase().includes(term)) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(term))) ||
        (m.leaderSkill && m.leaderSkill.toLowerCase().includes(term));

      const matchElement = selectedElement === 'all' || m.element === selectedElement;
      const matchStars = selectedStars === 'all' || m.naturalStars === selectedStars;
      const matchRole = selectedRole === 'all' || m.role === selectedRole;
      const matchDuplicates = !onlyDuplicates || duplicateMonsterIds.has(m.id);

      return matchSearch && matchElement && matchStars && matchRole && matchDuplicates;
    });
  }, [monsters, searchTerm, selectedElement, selectedStars, selectedRole, onlyDuplicates, duplicateMonsterIds]);

  return (
    <div className="space-y-5">
      {/* Top Action Bar & Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                Danh Sách Pet
              </h2>
              {isSyncing ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 animate-pulse">
                  Đang đồng bộ Firebase...
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Firebase Cloud Sync
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {filteredMonsters.length} / {monsters.length} quái thú
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {onSeedDefault && (
            <button
              type="button"
              onClick={onSeedDefault}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Thêm danh sách quái thú mẫu Summoners War vào Firebase"
            >
              Nạp dữ liệu mặc định
            </button>
          )}

          <button
            type="button"
            onClick={onAddMonster}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Thêm Pet Mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Matches Screenshot 3 SWGT Style) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 shadow-lg">
        {/* Search row with View Mode toggler */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Monster Search: Tên pet, hệ, tags (vd: Oliver, Geldnir, Spd Lead, Stripper...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Lưới ảnh đầy đủ (Full Grid)"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Thẻ chi tiết (Cards View)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Element & Stars Selection Bar (Exact layout as Screenshot 3) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-800/60">
          
          {/* Element Selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Element:
            </span>
            <button
              type="button"
              onClick={() => setSelectedElement('all')}
              className={`px-3 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                selectedElement === 'all'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Tất cả ({monsters.length})
            </button>
            {(['water', 'fire', 'wind', 'light', 'dark'] as ElementType[]).map((elem) => {
              const info = ELEMENT_COLORS[elem];
              const count = monsters.filter((m) => m.element === elem).length;
              const active = selectedElement === elem;
              return (
                <button
                  key={elem}
                  type="button"
                  onClick={() => setSelectedElement(elem)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    active
                      ? `${info.badge} ring-1 ring-white/20 font-bold scale-105`
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={info.iconUrl} alt={elem} className="w-4 h-4 object-contain" />
                  <span className="font-medium">
                    {info.label}
                  </span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Natural Stars */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Natural Stars:</span>
            <button
              type="button"
              onClick={() => setSelectedStars('all')}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                selectedStars === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              All
            </button>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStars(star)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  selectedStars === star
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold scale-105'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {star}★
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Vai trò:</span>
            {(['all', 'attack', 'defense', 'hp', 'support'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  selectedRole === r
                    ? 'bg-slate-200 text-slate-950 border-white font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {r === 'all' ? 'All' : ROLE_LABELS[r].label}
              </button>
            ))}
          </div>

          {/* Duplicate Monsters Quick Filter */}
          {duplicateMonsterIds.size > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOnlyDuplicates(!onlyDuplicates)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  onlyDuplicates
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/40'
                }`}
                title="Lọc danh sách chỉ xem các quái thú trùng lặp hoặc bản sao"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Trùng lặp</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-[10px] font-bold">
                  {duplicateMonsterIds.size}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Count & Quick Hint */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <p>
          Hiển thị <strong className="text-teal-300">{filteredMonsters.length}</strong> quái thú
        </p>
        <p className="text-[11px] text-slate-500">
          💡 Bấm vào nút ảnh <ImageIcon className="inline w-3 h-3 text-teal-400" /> để đổi avatar bằng link nhanh
        </p>
      </div>

      {/* Monsters Display Area */}
      {filteredMonsters.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <p className="text-base font-semibold text-slate-300">Không tìm thấy quái thú nào</p>
          <p className="text-xs text-slate-500">
            Thử tìm với tên khác hoặc bấm "Thêm Pet Mới" để tạo pet theo ý bạn!
          </p>
          <button
            type="button"
            onClick={onAddMonster}
            className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400 cursor-pointer"
          >
            Thêm Pet Mới Ngay
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Full Grid Mode (Dense, exactly like Screenshot 3) */
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2.5">
            {filteredMonsters.map((monster) => (
              <div
                key={monster.id}
                className="group relative bg-slate-950/80 border border-slate-800 hover:border-teal-400/80 rounded-xl p-1.5 flex flex-col items-center gap-1 transition-all duration-150 hover:scale-105 hover:shadow-xl hover:z-20 cursor-pointer"
              >
                {duplicateMonsterIds.has(monster.id) && (
                  <span
                    className="absolute top-1 left-1 z-20 px-1 py-0.2 rounded bg-amber-500/90 text-slate-950 text-[8px] font-black uppercase tracking-wider shadow pointer-events-none"
                    title="Quái thú này có bản sao trong kho"
                  >
                    DUPE
                  </span>
                )}
                <div
                  onClick={() => onEditMonster(monster)}
                  className="w-full flex flex-col items-center"
                >
                  <MonsterAvatar
                    monster={monster}
                    size="md"
                    showStars={true}
                    showName={false}
                  />
                  <p className="text-[11px] font-bold text-slate-200 truncate w-full text-center mt-1 leading-tight group-hover:text-teal-300">
                    {monster.name}
                  </p>
                  <span className="text-[9px] text-slate-400 truncate w-full text-center leading-none">
                    {monster.awakenedName ? monster.awakenedName.split(' ')[0] : monster.element}
                  </span>
                </div>

                {/* Hover overlay quick action buttons */}
                <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-1 z-30 bg-slate-900 border border-slate-700 rounded-lg p-0.5 shadow-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenQuickAvatar(monster);
                    }}
                    className="p-1 hover:bg-teal-500/20 text-teal-300 rounded"
                    title="Đổi Avatar bằng link"
                  >
                    <ImageIcon className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMonster(monster);
                    }}
                    className="p-1 hover:bg-slate-700 text-slate-300 rounded"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Bạn có chắc muốn xóa ${monster.name}?`)) {
                        onDeleteMonster(monster.id);
                      }
                    }}
                    className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                    title="Xóa Pet"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Detailed Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMonsters.map((monster) => {
            const elementInfo = ELEMENT_COLORS[monster.element];
            const roleInfo = ROLE_LABELS[monster.role];

            return (
              <div
                key={monster.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg transition-all hover:shadow-xl"
              >
                <div className="flex items-start gap-3">
                  <MonsterAvatar
                    monster={monster}
                    size="lg"
                    showStars={true}
                    showName={false}
                    onClick={() => onEditMonster(monster)}
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-base font-bold text-white truncate">{monster.name}</h4>
                        {duplicateMonsterIds.has(monster.id) && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold flex items-center gap-0.5 shrink-0"
                            title="Quái thú này có bản sao trong kho"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" /> Dupe
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleInfo.color} font-medium shrink-0`}>
                        {roleInfo.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 truncate">
                      {monster.awakenedName || 'Summoners War Monster'}
                    </p>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] ${elementInfo.badge}`}>
                        <img src={elementInfo.iconUrl} alt={monster.element} className="w-3.5 h-3.5 object-contain" />
                        {elementInfo.label}
                      </span>
                      <span className="text-slate-400">
                        SPD: <strong className="text-teal-300">{monster.baseSpeed}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leader Skill */}
                {monster.leaderSkill && (
                  <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200 leading-tight">
                    👑 <strong>Leader:</strong> {monster.leaderSkill}
                  </div>
                )}

                {/* Description or Tags */}
                {monster.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {monster.description}
                  </p>
                )}

                {monster.tags && monster.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {monster.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenQuickAvatar(monster)}
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Đổi Avatar (Link)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditMonster(monster)}
                      className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa chi tiết"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa ${monster.name}?`)) {
                          onDeleteMonster(monster.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-950/50 text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Xóa Pet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Avatar URL Update Modal */}
      {quickAvatarMonster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white">
                  Đổi Avatar Link cho {quickAvatarMonster.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickAvatarMonster(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center py-2">
              <MonsterAvatar
                monster={{ ...quickAvatarMonster, avatarUrl: quickAvatarInput }}
                size="xl"
                showStars={true}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dán URL hình ảnh Avatar mới:
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={quickAvatarInput}
                onChange={(e) => setQuickAvatarInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ bất kỳ liên kết ảnh nào (.png, .jpg, .webp từ Swarfarm, Discord, Imgur, v.v.).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAvatarMonster(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveQuickAvatar}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
              >
                Cập nhật Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
