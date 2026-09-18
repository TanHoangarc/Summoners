import React, { useState, useEffect } from 'react';
import {
  X,
  Swords,
  Shield,
  Zap,
  Star,
  CheckCircle,
  HelpCircle,
  Pencil,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Monster, SiegeCounterStrategy } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';
import { fetchAICounterStrategy } from '../../lib/aiStrategyService';

interface SaveCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defenseIds: [string | null, string | null, string | null];
  allMonsters: Monster[];
  onSave: (counter: SiegeCounterStrategy) => void;
  editingCounter?: SiegeCounterStrategy | null;
  onOpenAddMonster?: () => void;
}

export const SaveCounterModal: React.FC<SaveCounterModalProps> = ({
  isOpen,
  onClose,
  defenseIds,
  allMonsters,
  onSave,
  editingCounter,
  onOpenAddMonster,
}) => {
  // Defense monsters for display
  const def1 = getMonsterById(allMonsters, defenseIds[0]);
  const def2 = getMonsterById(allMonsters, defenseIds[1]);
  const def3 = getMonsterById(allMonsters, defenseIds[2]);

  // Counter slots
  const [counterSlots, setCounterSlots] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const [turnOrder, setTurnOrder] = useState('');
  const [strategy, setStrategy] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Yêu cầu rune cao'>('Trung bình');
  const [author, setAuthor] = useState('Chỉ huy SW');
  const [rating, setRating] = useState<number>(5.0);
  const [error, setError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessNotice, setAiSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingCounter) {
        setCounterSlots([
          editingCounter.counterMonsterIds[0] || null,
          editingCounter.counterMonsterIds[1] || null,
          editingCounter.counterMonsterIds[2] || null,
        ]);
        setTurnOrder(editingCounter.turnOrder || '');
        setStrategy(editingCounter.strategy || '');
        setDifficulty(editingCounter.difficulty || 'Trung bình');
        setAuthor(editingCounter.author || 'Chỉ huy SW');
        setRating(editingCounter.rating || 5.0);
      } else {
        setCounterSlots([null, null, null]);
        setTurnOrder('');
        setStrategy('');
        setDifficulty('Trung bình');
        setAuthor('Chỉ huy SW');
        setRating(5.0);
      }
      setError(null);
      setAiSuccessNotice(null);
      setIsAiLoading(false);
      setActiveSlotIndex(null);
    }
  }, [isOpen, editingCounter]);

  if (!isOpen) return null;

  const c1 = getMonsterById(allMonsters, counterSlots[0]);
  const c2 = getMonsterById(allMonsters, counterSlots[1]);
  const c3 = getMonsterById(allMonsters, counterSlots[2]);

  const handleAutoFillTurnOrder = () => {
    const names = [c1?.name, c2?.name, c3?.name].filter(Boolean);
    if (names.length > 0) {
      setTurnOrder(names.join(' > '));
    }
  };

  const handleAIGenerateStrategy = async () => {
    if (!def1 || !def2 || !def3) {
      setError('Đội hình phòng thủ (Defense) chưa chọn đủ 3 quái thú!');
      return;
    }

    if (!c1 || !c2 || !c3) {
      setError('Vui lòng chọn đủ 3 quái thú Counter phía trên trước khi yêu cầu AI gợi ý chiến thuật!');
      return;
    }

    setIsAiLoading(true);
    setError(null);
    setAiSuccessNotice(null);

    try {
      const result = await fetchAICounterStrategy([def1, def2, def3], [c1, c2, c3]);

      if (result.strategy) {
        setStrategy(result.strategy);
      }
      if (result.turnOrder) {
        setTurnOrder(result.turnOrder);
      }
      if (result.difficulty) {
        setDifficulty(result.difficulty);
      }

      setAiSuccessNotice('Đã tải chiến thuật và thứ tự lượt đi từ AI thành công!');
      setTimeout(() => setAiSuccessNotice(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo gợi ý từ AI. Vui lòng thử lại!');
    } finally {
      setIsAiLoading(false);
    }
  };

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

    if (!strategy.trim()) {
      setError('Vui lòng nhập hướng dẫn chiến thuật hoặc lưu ý cách đánh!');
      return;
    }

    const savedCounter: SiegeCounterStrategy = {
      id: editingCounter ? editingCounter.id : `counter-custom-${Date.now()}`,
      defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]],
      counterMonsterIds: [counterSlots[0], counterSlots[1], counterSlots[2]],
      rating: rating,
      ratingCount: editingCounter ? editingCounter.ratingCount || 1 : 1,
      author: author.trim() || 'Chỉ huy SW',
      date: editingCounter ? editingCounter.date : new Date().toLocaleDateString('vi-VN'),
      turnOrder: turnOrder.trim() || undefined,
      difficulty: difficulty,
      strategy: strategy.trim(),
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    onSave(savedCounter);
    onClose();
  };

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
                  Lưu trữ lâu dài và áp dụng tức thì cho đội hình phòng thủ đã chọn
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
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

            {/* Target Defense Display */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Đội hình Defense mục tiêu cần khắc chế:
                </span>
                <span className="text-[11px] text-amber-400/90 font-medium">3 Pet đã nạp</span>
              </div>
              <div className="flex items-center gap-3">
                {[def1, def2, def3].map((mon, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <MonsterAvatar monster={mon} size="sm" showStars={false} showName={false} />
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[90px]">
                      {mon?.name || 'Trống'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Counter Monster Pickers */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-300 uppercase tracking-wider">
                Chọn 3 Quái Thú Counter Của Bạn:
              </label>
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-teal-500/20">
                {counterSlots.map((slotId, idx) => {
                  const monster = getMonsterById(allMonsters, slotId);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 text-center">
                      <div className="relative group">
                        <MonsterAvatar
                          monster={monster}
                          size="md"
                          showStars={true}
                          showName={false}
                          onClick={() => setActiveSlotIndex(idx)}
                          emptyLabel={`Pet ${idx + 1}`}
                          onClear={
                            slotId
                              ? () => {
                                  setCounterSlots((prev) => {
                                    const next = [...prev] as [string | null, string | null, string | null];
                                    next[idx] = null;
                                    return next;
                                  });
                                }
                              : undefined
                          }
                        />
                      </div>
                      <div className="w-full">
                        <span className="text-xs font-bold text-white block truncate px-1">
                          {monster ? monster.name : `Chọn Pet ${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSlotIndex(idx)}
                          className="mt-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium underline underline-offset-2 cursor-pointer"
                        >
                          {monster ? 'Thay đổi' : '+ Chọn ngay'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Turn Order */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  Thứ tự lượt đi (Turn Order):
                </label>
                {(c1 || c2 || c3) && (
                  <button
                    type="button"
                    onClick={handleAutoFillTurnOrder}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
                  >
                    Gợi ý nhanh từ 3 pet
                  </button>
                )}
              </div>
              <input
                type="text"
                value={turnOrder}
                onChange={(e) => setTurnOrder(e.target.value)}
                placeholder="Vd: Chilling > Aaliyah > Feng Yan"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Strategy / Tactics */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-300">
                  Hướng dẫn cách đánh & Khắc chế chi tiết:
                </label>
                <button
                  type="button"
                  onClick={handleAIGenerateStrategy}
                  disabled={isAiLoading || !counterSlots[0] || !counterSlots[1] || !counterSlots[2]}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 hover:from-teal-400 hover:to-emerald-300 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed border border-teal-400/30 disabled:border-slate-700"
                  title="Sử dụng Gemini AI để phân tích matchup và tự động điền chiến thuật"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Đang tạo chiến thuật AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                      <span>✨ AI Gợi ý nhanh chiến thuật</span>
                    </>
                  )}
                </button>
              </div>

              {aiSuccessNotice && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{aiSuccessNotice}</span>
                </div>
              )}

              <textarea
                rows={6}
                required
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Mô tả mục tiêu ưu tiên, cách xử lý bùa lợi nguy hiểm, lưu ý chỉ số rune (Will, Shield, Violent, Despair...)... hoặc bấm '✨ AI Gợi ý nhanh chiến thuật' để tải tự động."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 leading-relaxed font-sans"
              />
            </div>

            {/* Difficulty Level Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Độ khó thực thi:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Dễ', 'Trung bình', 'Yêu cầu rune cao'] as const).map((level) => {
                  const isSelected = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? level === 'Dễ'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm'
                            : level === 'Trung bình'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Author & Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tên người đóng góp / tác giả:
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Đánh giá hiệu quả (Sao):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value) || 5.0)}
                    className="w-24 px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 text-center font-bold"
                  />
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          starIdx <= Math.round(rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{editingCounter ? 'Cập Nhật Counter' : 'Lưu Đội Hình Counter'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub Monster Picker Modal */}
      {activeSlotIndex !== null && (
        <MonsterPickerModal
          isOpen={activeSlotIndex !== null}
          onClose={() => setActiveSlotIndex(null)}
          onSelectMonster={(monsterId) => {
            setCounterSlots((prev) => {
              const next = [...prev] as [string | null, string | null, string | null];
              next[activeSlotIndex] = monsterId;
              return next;
            });
            setActiveSlotIndex(null);
          }}
          allMonsters={allMonsters}
          currentMonsterId={counterSlots[activeSlotIndex]}
          title={`Chọn Quái Thú Counter - Vị trí ${activeSlotIndex + 1}`}
          onOpenAddModal={onOpenAddMonster}
        />
      )}
    </>
  );
};
