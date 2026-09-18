import React, { useMemo } from 'react';
import {
  Target,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Crosshair,
} from 'lucide-react';
import { Monster, RTASlot } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';

interface KillOrderPanelProps {
  enemyTeam: RTASlot[];
  allMonsters: Monster[];
  killOrder: string[]; // Monster IDs in priority order (1st to kill is at index 0)
  onUpdateKillOrder: (newOrder: string[]) => void;
  onShowToast: (msg: string) => void;
}

// Tactical heuristic to rate enemy threat for auto-ordering
function evaluateMonsterThreatScore(monster: Monster): number {
  const nameLower = monster.name.toLowerCase();
  const tags = (monster.tags || []).map((t) => t.toLowerCase());

  // High threat nukers / turn cyclers / bomb units
  if (
    nameLower.includes('seara') ||
    nameLower.includes('oliver') ||
    nameLower.includes('savannah') ||
    nameLower.includes('dominic') ||
    nameLower.includes('miles') ||
    nameLower.includes('sonia') ||
    nameLower.includes('cheongpung') ||
    nameLower.includes('clara')
  ) {
    return 95;
  }

  // Dangerous nukers / defense breakers
  if (monster.role === 'attack' || tags.some((t) => t.includes('nuker') || t.includes('def break'))) {
    return 85;
  }

  // Key buffers / strippers / cleansers
  if (
    nameLower.includes('woosa') ||
    nameLower.includes('shizuka') ||
    nameLower.includes('aaliyah') ||
    nameLower.includes('riley') ||
    nameLower.includes('chiwu') ||
    nameLower.includes('tiana') ||
    nameLower.includes('moore')
  ) {
    return 70;
  }

  // Bruisers
  if (
    nameLower.includes('karnal') ||
    nameLower.includes('juno') ||
    nameLower.includes('feng_yan') ||
    nameLower.includes('douglas')
  ) {
    return 50;
  }

  // Passive tanks / counter units / stallers - leave for last
  if (
    nameLower.includes('tractor') ||
    nameLower.includes('geldnir') ||
    nameLower.includes('ophilia') ||
    nameLower.includes('camilla') ||
    nameLower.includes('rakan') ||
    tags.some((t) => t.includes('threat') || t.includes('passive heal'))
  ) {
    return 30;
  }

  return 60;
}

export const KillOrderPanel: React.FC<KillOrderPanelProps> = ({
  enemyTeam,
  allMonsters,
  killOrder,
  onUpdateKillOrder,
  onShowToast,
}) => {
  // Get active picked enemy monsters (loại bỏ pet đã bị cấm - isBanned)
  const pickedEnemyMonsters = useMemo(() => {
    return enemyTeam
      .filter((slot) => !slot.isBanned)
      .map((slot) => (slot.monsterId ? getMonsterById(allMonsters, slot.monsterId) : null))
      .filter((m): m is Monster => Boolean(m));
  }, [enemyTeam, allMonsters]);

  // Ensure killOrder contains all currently unbanned picked enemy monsters
  const activeOrderedMonsters = useMemo(() => {
    const pickedIds = pickedEnemyMonsters.map((m) => m.id);
    // Keep existing order for monsters still picked and unbanned
    const ordered = killOrder.filter((id) => pickedIds.includes(id));
    // Append any newly picked monsters that aren't in killOrder yet
    pickedIds.forEach((id) => {
      if (!ordered.includes(id)) {
        ordered.push(id);
      }
    });

    return ordered
      .map((id) => getMonsterById(allMonsters, id))
      .filter((m): m is Monster => Boolean(m));
  }, [pickedEnemyMonsters, killOrder, allMonsters]);

  // Move a monster up in priority (closer to target #1)
  const moveUp = (index: number) => {
    if (index <= 0) return;
    const currentIds = activeOrderedMonsters.map((m) => m.id);
    const temp = currentIds[index];
    currentIds[index] = currentIds[index - 1];
    currentIds[index - 1] = temp;
    onUpdateKillOrder(currentIds);
  };

  // Move a monster down in priority
  const moveDown = (index: number) => {
    if (index >= activeOrderedMonsters.length - 1) return;
    const currentIds = activeOrderedMonsters.map((m) => m.id);
    const temp = currentIds[index];
    currentIds[index] = currentIds[index + 1];
    currentIds[index + 1] = temp;
    onUpdateKillOrder(currentIds);
  };

  // Direct set to rank #1
  const setAsFirstPriority = (monsterId: string) => {
    const currentIds = activeOrderedMonsters.map((m) => m.id);
    const filtered = currentIds.filter((id) => id !== monsterId);
    onUpdateKillOrder([monsterId, ...filtered]);
    onShowToast('Đã đặt làm Mục tiêu số 1 (Target #1)!');
  };

  // Auto-sort by threat heuristic (AI recommended kill order)
  const handleAutoRecommend = () => {
    if (activeOrderedMonsters.length === 0) {
      onShowToast('Chưa có quái địch nào để sắp xếp!');
      return;
    }

    const sorted = [...activeOrderedMonsters].sort((a, b) => {
      const aThreat = evaluateMonsterThreatScore(a);
      const bThreat = evaluateMonsterThreatScore(b);
      return bThreat - aThreat;
    });

    onUpdateKillOrder(sorted.map((m) => m.id));
    onShowToast('✨ Đã tự động sắp xếp thứ tự tiêu diệt tối ưu!');
  };

  // Reset order to current draft pick order
  const handleResetOrder = () => {
    const defaultIds = pickedEnemyMonsters.map((m) => m.id);
    onUpdateKillOrder(defaultIds);
    onShowToast('Đã đặt lại thứ tự theo lượt pick');
  };

  return (
    <div className="bg-[#141b2d]/95 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Target className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 leading-none">
              Thứ Tự Cần Giết
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {activeOrderedMonsters.length}
              </span>
            </h3>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleAutoRecommend}
            disabled={activeOrderedMonsters.length === 0}
            className="flex items-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 disabled:bg-slate-900 text-rose-300 disabled:text-slate-600 border border-rose-500/30 disabled:border-slate-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Tự động tính toán thứ tự diệt tối ưu"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span className="hidden min-[400px]:inline">Gợi ý diệt</span>
          </button>
          <button
            type="button"
            onClick={handleResetOrder}
            disabled={activeOrderedMonsters.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Làm mới thứ tự"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Area - Chỉ hiển thị số thứ tự và avatar pet team địch */}
      <div className="flex-1 overflow-y-auto max-h-[380px] lg:max-h-[460px] pr-1 space-y-2">
        {activeOrderedMonsters.length === 0 ? (
          <div className="text-center py-10 px-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Crosshair className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400">Chưa có quái địch trên bàn cờ</p>
          </div>
        ) : (
          activeOrderedMonsters.map((monster, index) => {
            const priorityNumber = index + 1;

            return (
              <div
                key={monster.id}
                className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-between gap-2.5 ${
                  priorityNumber === 1
                    ? 'bg-rose-950/30 border-rose-500/40 shadow-rose-950/20'
                    : priorityNumber === 2
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Số thứ tự và Avatar pet team địch */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Số thứ tự */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow leading-none ${
                      priorityNumber === 1
                        ? 'bg-rose-600 text-white shadow-rose-600/40'
                        : priorityNumber === 2
                        ? 'bg-amber-500 text-slate-950'
                        : priorityNumber === 3
                        ? 'bg-yellow-600/80 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title={`Thứ tự diệt #${priorityNumber}`}
                  >
                    #{priorityNumber}
                  </div>

                  {/* Avatar pet địch */}
                  <div className="shrink-0">
                    <MonsterAvatar monster={monster} size="sm" showTooltip={false} />
                  </div>

                  {/* Tên ngắn gọn */}
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {monster.name}
                  </span>
                </div>

                {/* Nút điều chỉnh thứ tự Lên / Xuống */}
                <div className="flex items-center gap-1 shrink-0">
                  {priorityNumber !== 1 && (
                    <button
                      type="button"
                      onClick={() => setAsFirstPriority(monster.id)}
                      className="px-1.5 py-1 bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 rounded text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer"
                      title="Đặt lên đầu (#1)"
                    >
                      #1
                    </button>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                      className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Đẩy lên"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === activeOrderedMonsters.length - 1}
                      onClick={() => moveDown(index)}
                      className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Hạ xuống"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      {activeOrderedMonsters.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end text-[11px] text-slate-400">
          <span className="text-rose-400 font-semibold">
            {activeOrderedMonsters[0]?.name ? `Ưu tiên: ${activeOrderedMonsters[0].name}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};
