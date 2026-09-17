import React, { useState, useEffect } from 'react';
import { X, BookmarkPlus, Award, FileText } from 'lucide-react';
import { Monster, SavedSiegeDefense } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';

interface SaveDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defenseIds: [string | null, string | null, string | null];
  allMonsters: Monster[];
  onSave: (defense: SavedSiegeDefense) => void;
  editingDefense?: SavedSiegeDefense | null;
}

export const SaveDefenseModal: React.FC<SaveDefenseModalProps> = ({
  isOpen,
  onClose,
  defenseIds,
  allMonsters,
  onSave,
  editingDefense,
}) => {
  // Determine monsters
  const currentMonsterIds: [string, string, string] = editingDefense
    ? editingDefense.monsterIds
    : [
        defenseIds[0] || '',
        defenseIds[1] || '',
        defenseIds[2] || '',
      ];

  const m1 = getMonsterById(allMonsters, currentMonsterIds[0]);
  const m2 = getMonsterById(allMonsters, currentMonsterIds[1]);
  const m3 = getMonsterById(allMonsters, currentMonsterIds[2]);

  const defaultName = editingDefense
    ? editingDefense.name
    : [m1?.name, m2?.name, m3?.name].filter(Boolean).join(' • ') || 'Đội hình phòng thủ mới';

  const [name, setName] = useState(defaultName);
  const [leaderId, setLeaderId] = useState<string>(
    editingDefense?.leaderMonsterId || currentMonsterIds[0] || ''
  );
  const [notes, setNotes] = useState(editingDefense?.notes || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initName = editingDefense
        ? editingDefense.name
        : [m1?.name, m2?.name, m3?.name].filter(Boolean).join(' • ') || 'Đội hình phòng thủ mới';
      setName(initName);
      setLeaderId(editingDefense?.leaderMonsterId || currentMonsterIds[0] || '');
      setNotes(editingDefense?.notes || '');
      setError(null);
    }
  }, [isOpen, editingDefense, defenseIds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cho đội hình defense');
      return;
    }

    if (!currentMonsterIds[0] || !currentMonsterIds[1] || !currentMonsterIds[2]) {
      setError('Đội hình phải có đầy đủ 3 quái thú');
      return;
    }

    const savedRecord: SavedSiegeDefense = {
      id: editingDefense ? editingDefense.id : `defense-${Date.now()}`,
      name: name.trim(),
      monsterIds: [currentMonsterIds[0], currentMonsterIds[1], currentMonsterIds[2]],
      leaderMonsterId: leaderId || currentMonsterIds[0],
      notes: notes.trim() || undefined,
      createdAt: editingDefense ? editingDefense.createdAt : Date.now(),
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {editingDefense ? 'Chỉnh Sửa Đội Hình Defense' : 'Lưu Đội Hình Defense Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                Lưu vào danh sách phòng thủ Siege để dễ dàng tra cứu counter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* 3 Monster Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              3 Quái Thú Phòng Thủ
            </label>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-around gap-2">
              {[m1, m2, m3].map((monster, idx) => {
                const monsterId = currentMonsterIds[idx];
                const isLeader = leaderId === monsterId;
                return (
                  <div
                    key={idx}
                    onClick={() => setLeaderId(monsterId)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                      isLeader
                        ? 'bg-amber-500/10 border border-amber-500/40 shadow-sm'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                    title="Bấm để chọn làm Leader"
                  >
                    <div className="relative">
                      <MonsterAvatar
                        monster={monster}
                        size="md"
                        showStars={false}
                        showName={false}
                        isLeader={isLeader}
                      />
                      {isLeader && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
                          <Award className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 max-w-[80px] text-center truncate">
                      {monster?.name || `Slot ${idx + 1}`}
                    </span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                        isLeader
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isLeader ? 'Leader' : 'Slot ' + (idx + 1)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              Nhấp vào quái vật để chọn quái vật có Leader Skill
            </p>
          </div>

          {/* Defense Team Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-teal-400" />
              Tên Đội Hình
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vd: Geldnir • Ophilia • Theomars hoặc Def Tháp 4 Sao..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50"
            />
          </div>

          {/* Notes / Strategies */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi Chú Chiến Thuật / Yêu Cầu Rune (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vd: Theomars cần rune Will để tránh reset cooldown, Ophilia tốc độ trên 280..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              {editingDefense ? 'Lưu Thay Đổi' : 'Lưu Đội Hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}
