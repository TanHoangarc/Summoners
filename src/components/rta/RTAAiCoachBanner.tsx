import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Crown,
  ShieldAlert,
  Swords,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Award,
  Zap,
  Flame,
  Search,
} from 'lucide-react';
import { Monster, RTAAiCoachAnalysis, RTAAiRecommendation } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';

interface RTAAiCoachBannerProps {
  analysis: RTAAiCoachAnalysis | null;
  isLoading: boolean;
  allMonsters: Monster[];
  onApplyRecommendation: (monsterId: string, slotOrder: number) => void;
  onApplyAllRecommendations?: (recs: RTAAiRecommendation[]) => void;
  onApplyBan?: (monsterId: string) => void;
  onApplyLeader?: (monsterId: string) => void;
  onSwapMonster?: (monsterId: string, slotOrder: number) => void;
  onOpenCustomPicker?: (slotOrder: number) => void;
  onRefreshAnalysis: () => void;
  myPickedCount: number;
  enemyPickedCount: number;
}

export const RTAAiCoachBanner: React.FC<RTAAiCoachBannerProps> = ({
  analysis,
  isLoading,
  allMonsters,
  onApplyRecommendation,
  onApplyAllRecommendations,
  onApplyBan,
  onApplyLeader,
  onSwapMonster,
  onOpenCustomPicker,
  onRefreshAnalysis,
  myPickedCount,
  enemyPickedCount,
}) => {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl border bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 border-purple-500/50 shadow-xl shadow-purple-950/30 backdrop-blur-md animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/40">
            <Bot className="w-5 h-5 animate-spin text-purple-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                👑 AI HLV TOP 1 RTA ĐANG PHÂN TÍCH...
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Đang đọc vị chiến thuật đối thủ, phân tích khắc chế và tính toán tỷ lệ thắng cao nhất cho Team Tôi...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 rounded-2xl border bg-gradient-to-r from-purple-950/50 via-slate-900/90 to-slate-900/90 border-purple-500/30 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-black text-purple-200">
              CHẾ ĐỘ AI TUYỂN THỦ TOP 1 RTA ĐÃ SẴN SÀNG
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hãy chọn pet cho Team Địch hoặc nhấp "Phân tích lại" để nhận gợi ý khắc chế tỷ lệ thắng cao nhất!
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefreshAnalysis}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Phân tích ngay</span>
        </button>
      </div>
    );
  }

  const {
    enemyArchetype,
    analysisSummary,
    waitingMessage,
    predictedWinRate = 82,
    recommendations = [],
    alternatives = [],
    suggestedBan,
    suggestedLeader,
    stage,
  } = analysis;

  const isWaitingTurn = (stage === 'waiting_enemy' || stage === 'first_pick_self') || (recommendations.length === 0 && myPickedCount < 5);

  return (
    <div className="rounded-2xl sm:rounded-3xl border bg-gradient-to-b from-[#18112e] via-[#11162a] to-[#0f1424] border-purple-500/40 shadow-2xl overflow-hidden transition-all animate-in fade-in duration-200 space-y-0">
      {/* Top Banner Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-purple-950/90 via-slate-950/80 to-indigo-950/80 border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-purple-600 rounded-xl text-slate-950 shadow-md shadow-purple-500/20">
            <Crown className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black tracking-wide bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent uppercase">
                AI HLV TOP 1 RTA (SWC & G3 LEGEND)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PRO COACH ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-purple-300 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                {enemyArchetype}
              </span>
            </div>
          </div>
        </div>

        {/* Winrate prediction badge + Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 bg-slate-950/90 border border-teal-500/40 rounded-xl flex items-center gap-2 shadow-inner">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Tỷ lệ thắng:</span>
            <span className="text-xs sm:text-sm font-black text-teal-400">
              ~{predictedWinRate}%
            </span>
          </div>

          <button
            type="button"
            onClick={onRefreshAnalysis}
            className="p-1.5 text-slate-400 hover:text-purple-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer"
            title="AI phân tích lại tình huống hiện tại"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Waiting Step Notice Banner */}
        {isWaitingTurn && (
          <div className="p-4 rounded-2xl border bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-slate-900/80 border-purple-500/30 shadow-md space-y-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl mt-0.5">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-2">
                  <span>
                    {stage === 'first_pick_self'
                      ? '🎯 BẠN CÓ QUYỀN CHỌN ĐẦU (FIRST PICK #1)'
                      : '⏳ ĐANG THEO DÕI LƯỢT CHỌN CỦA TEAM ĐỊCH'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                  {waitingMessage || analysisSummary}
                </p>
                <p className="text-[11px] text-purple-300/80 italic pt-1">
                  💡 Chiến thuật Tuyển thủ Pro: AI chỉ gợi ý lần lượt sau khi đối thủ đã chọn quái thú ở từng lượt để đảm bảo khắc chế chuẩn xác nhất và tối đa tỷ lệ thắng!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pro Coach Summary Quote (When recommendations are available) */}
        {!isWaitingTurn && analysisSummary && (
          <div className="p-3 sm:p-3.5 bg-purple-950/30 border border-purple-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-purple-200 leading-relaxed font-sans shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="italic font-medium">{analysisSummary}</span>
          </div>
        )}

        {/* PICK PHASE: Recommended Monsters strictly for the current immediate turn */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>
                  GỢI Ý LƯỢT NÀY CHO TEAM TÔI ({recommendations.map((r) => `#${r.slotOrder}`).join(' & ')})
                </span>
              </span>

              {recommendations.length > 1 && onApplyAllRecommendations && (
                <button
                  type="button"
                  onClick={() => onApplyAllRecommendations(recommendations)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Áp dụng cả {recommendations.length} pet gợi ý</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recommendations.map((rec) => {
                const monster = getMonsterById(allMonsters, rec.monsterId);
                const isExpanded = Boolean(expandedDetails[rec.monsterId]);
                const slotAlts = rec.alternatives || [];

                return (
                  <div
                    key={`${rec.monsterId}-${rec.slotOrder}`}
                    className="p-3.5 bg-slate-950/70 border border-purple-500/35 rounded-2xl space-y-3 hover:border-purple-400/50 transition-all shadow-lg shadow-purple-950/20"
                  >
                    {/* Top Monster Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MonsterAvatar
                          monster={monster}
                          size="md"
                          showStars={false}
                          showName={false}
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-white">
                              {rec.monsterName}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Vị trí #{rec.slotOrder}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-300 block mt-0.5">
                            {rec.archetypeRole}
                          </span>
                        </div>
                      </div>

                      {/* Single Click Apply Button */}
                      <button
                        type="button"
                        onClick={() => onApplyRecommendation(rec.monsterId, rec.slotOrder)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1"
                        title={`Gán ${rec.monsterName} vào vị trí #${rec.slotOrder} của Team Tôi`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Chọn Slot #{rec.slotOrder}</span>
                      </button>
                    </div>

                    {/* Tactical Breakdown */}
                    <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11.5px]">
                      <div>
                        <strong className="text-purple-300 block font-semibold mb-0.5">
                          🎯 Tại sao pick (Khắc chế chiêu thức & Nội tại):
                        </strong>
                        <p className="text-slate-300 leading-relaxed font-sans">{rec.whyPick}</p>
                      </div>

                      {/* Expandable Pro Strategy & Risks */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in duration-150">
                          <div>
                            <strong className="text-teal-300 block font-semibold mb-0.5">
                              ⚔️ Chiến thuật vận hành (Turn Order & Combo):
                            </strong>
                            <p className="text-slate-300 leading-relaxed font-sans">
                              {rec.operationalStrategy}
                            </p>
                          </div>

                          <div>
                            <strong className="text-amber-300 block font-semibold mb-0.5">
                              ⚠️ Lưu ý đề phòng biến số (Will / Proc):
                            </strong>
                            <p className="text-slate-400 leading-relaxed font-sans">
                              {rec.riskNotes}
                            </p>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleDetails(rec.monsterId)}
                        className="flex items-center gap-1 text-[10.5px] font-bold text-slate-400 hover:text-purple-300 transition-colors pt-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Thu gọn chiến thuật' : 'Xem chi tiết cách đánh & lưu ý'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* ĐỔI PET NẾU TÔI KHÔNG CÓ PET ĐÓ (SWAP FEATURE) */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {onSwapMonster && (
                          <button
                            type="button"
                            onClick={() => onSwapMonster(rec.monsterId, rec.slotOrder)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                            title="Nếu bạn không có quái thú này, bấm để AI đổi sang pet khắc chế thay thế khác"
                          >
                            <RotateCw className="w-3 h-3 text-amber-400" />
                            <span>Đổi pet khác (Tôi không có pet này)</span>
                          </button>
                        )}

                        {onOpenCustomPicker && (
                          <button
                            type="button"
                            onClick={() => onOpenCustomPicker(rec.slotOrder)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-purple-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10.5px] font-semibold transition-all cursor-pointer"
                            title="Mở bảng chọn quái thú để tự chọn cho vị trí này"
                          >
                            <Search className="w-3 h-3" />
                            <span>Tự chọn từ kho</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Alternative Choices for this slot */}
                      {slotAlts.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            🔄 Quái thú thay thế khả dụng nếu không có {rec.monsterName}:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {slotAlts.map((alt) => (
                              <button
                                key={alt.monsterId}
                                type="button"
                                onClick={() => onApplyRecommendation(alt.monsterId, rec.slotOrder)}
                                className="px-2 py-1 bg-slate-900/90 hover:bg-purple-900/50 text-slate-200 hover:text-cyan-300 border border-slate-700/80 hover:border-purple-400 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
                                title={alt.reason}
                              >
                                <span className="text-cyan-400 font-bold">+</span>
                                <span>{alt.monsterName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5v5 LEAD & BAN PHASE RECOMMENDATIONS */}
        {(suggestedBan || suggestedLeader) && (myPickedCount >= 5 && enemyPickedCount >= 5) && (
          <div className="space-y-2 pt-1 border-t border-purple-500/20">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>GỢI Ý CẤM (BAN) & LEADER THEO PHÂN TÍCH CỦA TUYỂN THỦ</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Suggested Ban */}
              {suggestedBan && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">
                          NÊN CẤM PET ĐỊCH:
                        </span>
                        <strong className="text-xs font-black text-white">
                          {suggestedBan.monsterName}
                        </strong>
                      </div>
                    </div>

                    {onApplyBan && (
                      <button
                        type="button"
                        onClick={() => onApplyBan(suggestedBan.monsterId)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                      >
                        ⚡ Cấm Pet Này
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 italic font-sans leading-relaxed">
                    {suggestedBan.reason}
                  </p>
                </div>
              )}

              {/* Suggested Leader */}
              {suggestedLeader && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                          CHỌN LÀM LEADER:
                        </span>
                        <strong className="text-xs font-black text-white">
                          {suggestedLeader.monsterName}
                        </strong>
                      </div>
                    </div>

                    {onApplyLeader && (
                      <button
                        type="button"
                        onClick={() => onApplyLeader(suggestedLeader.monsterId)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                      >
                        ⚡ Chọn Leader
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 italic font-sans leading-relaxed">
                    {suggestedLeader.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Alternative Counter Choices */}
        {alternatives.length > 0 && recommendations.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-slate-400 font-bold">Lựa chọn thay thế khác:</span>
            {alternatives.map((alt) => (
              <button
                key={alt.monsterId}
                type="button"
                onClick={() => {
                  const targetOrder = recommendations[0]?.slotOrder || 1;
                  onApplyRecommendation(alt.monsterId, targetOrder);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-purple-300 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title={alt.reason}
              >
                + {alt.monsterName} ({alt.role})
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
