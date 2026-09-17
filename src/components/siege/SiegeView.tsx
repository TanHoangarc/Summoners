import React, { useState, useMemo } from 'react';
import {
  Shield,
  Swords,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  RotateCcw,
  Zap,
  CheckCircle,
  ThumbsUp,
  Award,
} from 'lucide-react';
import { Monster, SiegeCounterStrategy } from '../../types';
import { DEFAULT_SIEGE_COUNTERS } from '../../data/defaultCounters';
import { getMonsterById, generateDynamicCounters } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';
import { MonsterPickerModal } from '../common/MonsterPickerModal';

interface SiegeViewProps {
  allMonsters: Monster[];
  onOpenAddMonster: () => void;
}

export const SiegeView: React.FC<SiegeViewProps> = ({
  allMonsters,
  onOpenAddMonster,
}) => {
  // Current 3 defense monsters (Default to Geldnir + Ophilia + Theomars as in Screenshot 2!)
  const [defenseIds, setDefenseIds] = useState<[string | null, string | null, string | null]>([
    'geldnir',
    'ophilia',
    'theomars',
  ]);

  // Saved / user contributed counters
  const [countersDatabase, setCountersDatabase] = useState<SiegeCounterStrategy[]>(DEFAULT_SIEGE_COUNTERS);

  // Active slot being picked for defense (0, 1, or 2)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Expanded strategy IDs
  const [expandedStrategyIds, setExpandedStrategyIds] = useState<Record<string, boolean>>({
    'counter-g-o-t-1': true, // default first one expanded
  });

  // Contribute counter modal state
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contribSlots, setContribSlots] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [contribPickingIndex, setContribPickingIndex] = useState<number | null>(null);
  const [contribAuthor, setContribAuthor] = useState('Người chơi SW');
  const [contribTurnOrder, setContribTurnOrder] = useState('');
  const [contribStrategy, setContribStrategy] = useState('');

  // Selected defense monsters
  const defMonsters = defenseIds.map((id) => getMonsterById(allMonsters, id));

  // Determine Leader Skill from slot 1 or any monster with Guild Leader
  const leaderMonster = defMonsters.find((m) => m?.leaderSkill && m.leaderSkill.includes('Guild')) || defMonsters[0];

  // Match existing counters in database
  const matchingCounters = useMemo(() => {
    const validDefIds = defenseIds.filter((id): id is string => Boolean(id));
    if (validDefIds.length < 3) return [];

    // Find in countersDatabase
    const exactMatches = countersDatabase.filter((c) => {
      return (
        c.defenseMonsterIds.includes(validDefIds[0]) &&
        c.defenseMonsterIds.includes(validDefIds[1]) &&
        c.defenseMonsterIds.includes(validDefIds[2])
      );
    });

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // Generate dynamic algorithmic counters if no exact match
    return generateDynamicCounters(validDefIds, allMonsters);
  }, [defenseIds, countersDatabase, allMonsters]);

  const toggleExpand = (id: string) => {
    setExpandedStrategyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRateCounter = (id: string) => {
    setCountersDatabase((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ratingCount: c.ratingCount + 1 } : c))
    );
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribSlots[0] || !contribSlots[1] || !contribSlots[2]) {
      alert('Vui lòng chọn đủ 3 pet counter!');
      return;
    }
    if (!defenseIds[0] || !defenseIds[1] || !defenseIds[2]) {
      alert('Đội hình phòng thủ chưa đủ 3 pet!');
      return;
    }

    const newCounter: SiegeCounterStrategy = {
      id: `custom-counter-${Date.now()}`,
      defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]],
      counterMonsterIds: [contribSlots[0], contribSlots[1], contribSlots[2]],
      rating: 5.0,
      ratingCount: 1,
      author: contribAuthor.trim() || 'Người chơi SW',
      date: new Date().toLocaleDateString('en-US'),
      turnOrder: contribTurnOrder.trim() || undefined,
      strategy: contribStrategy.trim() || 'Tập trung dồn sát thương mục tiêu chủ lực, duy trì khiên và miễn nhiễm.',
    };

    setCountersDatabase([newCounter, ...countersDatabase]);
    setIsContributeModalOpen(false);
    setContribSlots([null, null, null]);
    setContribTurnOrder('');
    setContribStrategy('');
  };

  return (
    <div className="space-y-6">
      {/* DEFENSE SELECTION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-400">
              DEFENSE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDefenseIds([null, null, null])}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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

      {/* COUNTERS SECTION (Matches Screenshot 2 list of counters) */}
      <div className="space-y-4">
        {/* Counters Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-teal-400">{matchingCounters.length}</span> GỢI Ý COUNTERS
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsContributeModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Contribute (Đóng góp Counter)
          </button>
        </div>

        {/* Counter Cards List */}
        {matchingCounters.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <p className="text-base font-bold text-slate-300">
              Chưa có dữ liệu counter cho bộ ba này
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vui lòng chọn đủ 3 quái vật ở phần DEFENSE phía trên hoặc bấm "Contribute" để đóng góp bộ 3 counter đầu tiên!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {matchingCounters.map((counter) => {
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

                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {cMonsters.map((m) => m?.name || 'Unknown').join(' ')}
                        </h4>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => toggleExpand(counter.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        <span>Chi tiết Chiến thuật</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Strategy Body (Matches Screenshot 2 "View Details - 1 Strategy") */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-3 animate-in fade-in duration-150 text-xs">
                      {counter.turnOrder && (
                        <div className="flex items-center gap-2 text-teal-300 font-semibold">
                          <Zap className="w-4 h-4 text-teal-400" />
                          <span>Thứ tự lượt đi (Turn Order):</span>
                          <span className="px-2 py-0.5 rounded bg-teal-950 border border-teal-800/80 text-teal-200">
                            {counter.turnOrder}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <strong className="text-slate-300 block font-semibold">Hướng dẫn cách đánh & Khắc chế:</strong>
                        <p className="text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          {counter.strategy}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Độ khó thực thi: <strong className="text-amber-300">{counter.difficulty || 'Trung bình'}</strong></span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã kiểm chứng tỉ lệ thắng cao trong Siege War
                        </span>
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
        />
      )}

      {/* Contribute Counter Modal */}
      {isContributeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Đóng Góp Đội Hình Counter Mới</h3>
                <p className="text-xs text-slate-400">
                  Chia sẻ 3 pet khắc chế kèm hướng dẫn chi tiết cho cộng đồng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContributeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              {/* Pick 3 Counter Pets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Chọn 3 Pet Đội Hình Counter Của Bạn:
                </label>
                <div className="flex items-center justify-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  {contribSlots.map((id, idx) => {
                    const monster = getMonsterById(allMonsters, id);
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <MonsterAvatar
                          monster={monster}
                          size="lg"
                          showStars={true}
                          showName={true}
                          onClick={() => setContribPickingIndex(idx)}
                          emptyLabel={`Pet ${idx + 1}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Author & Turn Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên tác giả:
                  </label>
                  <input
                    type="text"
                    value={contribAuthor}
                    onChange={(e) => setContribAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Thứ tự lượt đi (Turn Order):
                  </label>
                  <input
                    type="text"
                    placeholder="Vd: Buff > Giảm giáp > Dồn dame"
                    value={contribTurnOrder}
                    onChange={(e) => setContribTurnOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Detailed Strategy */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mô tả chiến thuật & lưu ý rune:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Vd: Quái A xóa buff trước, quái B tank đòn hiểm, quái C xuyên giáp kết liễu..."
                  value={contribStrategy}
                  onChange={(e) => setContribStrategy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                >
                  Lưu Gợi Ý Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-picker inside Contribute Modal */}
      {contribPickingIndex !== null && (
        <MonsterPickerModal
          isOpen={contribPickingIndex !== null}
          onClose={() => setContribPickingIndex(null)}
          onSelectMonster={(monsterId) => {
            setContribSlots((prev) => {
              const next = [...prev] as [string | null, string | null, string | null];
              next[contribPickingIndex] = monsterId;
              return next;
            });
          }}
          allMonsters={allMonsters}
          currentMonsterId={contribSlots[contribPickingIndex]}
          title={`Chọn Pet Counter ${contribPickingIndex + 1}`}
          onOpenAddModal={onOpenAddMonster}
        />
      )}
    </div>
  );
};
