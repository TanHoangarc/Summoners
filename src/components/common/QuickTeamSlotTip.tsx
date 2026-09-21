import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Monster, RTASlot } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { MonsterAvatar } from './MonsterAvatar';

interface QuickTeamSlotTipProps {
  monster: Monster;
  myTeam: RTASlot[];
  allMonsters: Monster[];
  anchorRect: DOMRect | null;
  onSelectSlot: (slotIndex: number, pickOrder: number) => void;
  onClose: () => void;
  activeSlotIndex?: number | null;
}

export const QuickTeamSlotTip: React.FC<QuickTeamSlotTipProps> = ({
  monster,
  myTeam,
  allMonsters,
  anchorRect,
  onSelectSlot,
  onClose,
  activeSlotIndex = null,
}) => {
  const tipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true,
  });

  // Tính toán vị trí popover bám theo anchorRect và không bị tràn màn hình
  useEffect(() => {
    if (!anchorRect) return;

    const tipWidth = 310;
    const tipHeight = 110;
    const padding = 10;

    let placeAbove = anchorRect.top >= tipHeight + 15;
    let top = placeAbove
      ? anchorRect.top - tipHeight - 6
      : anchorRect.bottom + 6;

    // Canh giữa theo anchorRect
    let left = anchorRect.left + anchorRect.width / 2 - tipWidth / 2;

    // Giữ trong giới hạn viewport
    if (left < padding) left = padding;
    if (left + tipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tipWidth - padding;
    }

    if (top < padding) top = padding;

    setPosition({ top, left, placeAbove });
  }, [anchorRect]);

  // Đóng khi ấn phím Escape hoặc click ra ngoài
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!anchorRect) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Invisible backdrop to capture outside clicks */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity animate-in fade-in duration-100"
        onClick={onClose}
      />

      {/* Popover Card */}
      <div
        ref={tipRef}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: '310px',
        }}
        className="fixed z-50 bg-[#0f172a] border border-teal-500/70 rounded-2xl shadow-2xl shadow-teal-950/60 p-2.5 text-slate-100 animate-in zoom-in-95 fade-in duration-150 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <MonsterAvatar
              monster={monster}
              size="xs"
              showTooltip={false}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                  {monster.name}
                </span>
                <span className="text-[9.5px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30 shrink-0">
                  Team Tôi
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Chọn số vị trí muốn thêm vào:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Đóng tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slot Numbers Row */}
        <div className="grid grid-cols-5 gap-1.5 pt-2">
          {myTeam.map((slot, index) => {
            const currentMon = slot.monsterId
              ? getMonsterById(allMonsters, slot.monsterId)
              : null;
            const isCurrentThisMonster = slot.monsterId === monster.id;
            const isTargeted = activeSlotIndex === index;

            return (
              <button
                key={`myteam-slot-${slot.pickOrder}-${index}`}
                type="button"
                onClick={() => {
                  onSelectSlot(index, slot.pickOrder);
                  onClose();
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border transition-all cursor-pointer select-none group ${
                  isCurrentThisMonster
                    ? 'bg-teal-500/25 border-teal-400 ring-2 ring-teal-400/50'
                    : isTargeted
                    ? 'bg-teal-950/60 border-teal-400/80 ring-1 ring-teal-400/40 hover:bg-teal-900/60'
                    : slot.monsterId
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-slate-500'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/50 hover:border-emerald-400 shadow-sm'
                }`}
                title={
                  slot.monsterId
                    ? `Vị trí #${slot.pickOrder}: ${currentMon?.name || 'Đã có quái'}. Bấm để thay thế.`
                    : `Vị trí #${slot.pickOrder}: Còn trống. Bấm để thêm.`
                }
              >
                {/* Number Badge */}
                <span
                  className={`text-xs font-black tracking-tight ${
                    isCurrentThisMonster
                      ? 'text-teal-300'
                      : slot.monsterId
                      ? 'text-slate-200'
                      : 'text-emerald-300 font-extrabold'
                  }`}
                >
                  #{slot.pickOrder}
                </span>

                {/* Subtext Status */}
                <span
                  className={`text-[8.5px] truncate max-w-full font-medium leading-none mt-0.5 ${
                    isCurrentThisMonster
                      ? 'text-teal-300'
                      : slot.monsterId
                      ? 'text-slate-400 group-hover:text-slate-200'
                      : 'text-emerald-400 font-bold'
                  }`}
                >
                  {isCurrentThisMonster
                    ? 'Hiện tại'
                    : currentMon
                    ? currentMon.name.split(' ')[0]
                    : 'Trống'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Helper Note */}
        <div className="pt-1.5 mt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400 px-0.5">
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-2.5 h-2.5 text-teal-400" />
            Nhấp số để thêm ngay vào vị trí
          </span>
          <span className="text-slate-500">ESC để tắt</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
