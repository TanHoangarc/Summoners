import React, { useState } from 'react';
import { Ban, Crown, X } from 'lucide-react';
import { Monster } from '../../types';
import { ELEMENT_COLORS } from '../../utils/monsterHelpers';

interface MonsterAvatarProps {
  monster?: Monster | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isBanned?: boolean;
  isLeader?: boolean;
  pickOrder?: number | string;
  isFirstPick?: boolean;
  showStars?: boolean;
  showName?: boolean;
  className?: string;
  onClick?: () => void;
  onToggleBan?: () => void;
  onToggleLeader?: () => void;
  onClear?: () => void;
  emptyLabel?: string;
  selectable?: boolean;
  showQuickControls?: boolean;
  showTooltip?: boolean;
  killPriority?: number | null;
}

const SIZE_MAP = {
  xs: 'w-8 h-8 sm:w-9 sm:h-9 text-[10px]',
  sm: 'w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 sm:w-12 sm:h-12 text-xs',
  md: 'w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 sm:w-16 sm:h-16 text-sm',
  lg: 'w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 text-xs sm:text-base',
  xl: 'w-18 h-18 sm:w-20 sm:h-20 text-lg',
  '2xl': 'w-24 h-24 text-xl',
};

export const MonsterAvatar: React.FC<MonsterAvatarProps> = ({
  monster,
  size = 'md',
  isBanned = false,
  isLeader = false,
  pickOrder,
  isFirstPick = false,
  showStars = false,
  showName = false,
  className = '',
  onClick,
  onToggleBan,
  onToggleLeader,
  onClear,
  emptyLabel = '+',
  selectable = false,
  showQuickControls = false,
  showTooltip = false,
  killPriority,
}) => {
  const [imageError, setImageError] = useState(false);

  // If no monster is picked yet
  if (!monster) {
    return (
      <div className={`relative flex flex-col items-center select-none group ${className}`}>
        {isFirstPick && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 bg-blue-500 text-white font-black text-[8.5px] sm:text-[9.5px] px-1.5 py-0.5 rounded shadow-md uppercase tracking-wider leading-none pointer-events-none">
            1ST
          </div>
        )}
        <button
          type="button"
          onClick={onClick}
          className={`${SIZE_MAP[size]} rounded-2xl border-2 border-dashed border-slate-700 hover:border-teal-400/90 bg-slate-900/80 hover:bg-slate-800/90 transition-all duration-150 flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 cursor-pointer shadow-inner relative overflow-hidden`}
          title="Chọn Pet"
        >
          <span className="text-xl font-light group-hover:scale-110 transition-transform leading-none">+</span>
          {size !== 'xs' && size !== 'sm' && emptyLabel !== '+' && (
            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-teal-300 mt-0.5 truncate px-1">
              {emptyLabel}
            </span>
          )}

          {/* Pick Order Badge */}
          {pickOrder !== undefined && (
            <div className="absolute bottom-0.5 right-0.5 z-20 bg-black/90 text-white font-extrabold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shadow-md border border-black/50 leading-none pointer-events-none">
              {pickOrder}
            </div>
          )}
        </button>
      </div>
    );
  }

  const elementInfo = ELEMENT_COLORS[monster.element] || ELEMENT_COLORS.water;
  const isLightOrDark = monster.element === 'light' || monster.element === 'dark';

  return (
    <div className={`relative flex flex-col items-center select-none group ${className}`}>
      {/* Floating Name Tooltip on hover (only on desktop when showTooltip is true to avoid touch overlap bugs) */}
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/95 border border-slate-700/90 text-white rounded-lg shadow-2xl pointer-events-none z-50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 whitespace-nowrap hidden md:flex items-center gap-1.5 backdrop-blur-md">
          <img
            src={elementInfo.iconUrl}
            alt={monster.element}
            className="w-3 h-3 object-contain inline-block shrink-0"
          />
          <span className="text-xs font-bold tracking-wide">{monster.name}</span>
          {monster.awakenedName && (
            <span className="text-[9px] text-slate-400 font-normal">
              ({monster.awakenedName.split(' ')[0]})
            </span>
          )}
          {/* Caret arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95" />
        </div>
      )}

      {/* Main Avatar Card Container */}
      <div className="relative">
        {/* Kill Priority Target Badge: Top-left */}
        {killPriority !== undefined && killPriority !== null && (
          <div
            className={`absolute -top-2 -left-2 z-30 flex items-center gap-0.5 text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-lg border leading-none pointer-events-none ${
              killPriority === 1
                ? 'bg-rose-600 border-rose-400 ring-2 ring-rose-500/50 animate-pulse'
                : killPriority === 2
                ? 'bg-amber-500 border-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-800 border-slate-600 text-slate-200'
            }`}
            title={`Mục tiêu tiêu diệt #${killPriority}`}
          >
            <span className="text-[10px]">🎯</span>
            <span>#{killPriority}</span>
          </div>
        )}

        {/* 1ST Blue Pill Badge at the top */}
        {isFirstPick && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 bg-blue-500 text-white font-black text-[8.5px] sm:text-[9.5px] px-1.5 sm:px-2 py-0.5 rounded shadow-md uppercase tracking-wider leading-none pointer-events-none">
            1ST
          </div>
        )}

        {/* Delete / Clear button at top corner ('x' icon to remove pet image) */}
        {onClear && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Xóa quái thú để chọn mới"
            aria-label="Xóa quái thú để chọn mới"
            className="absolute -top-1.5 -right-1.5 z-30 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg border-2 border-[#141b2d] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            <X className="w-3 h-3 stroke-[3]" />
          </button>
        )}

        {/* Main Avatar Card - Square block showing ONLY the avatar */}
        <div
          onClick={onClick}
          title={monster.name}
          className={`relative ${SIZE_MAP[size]} rounded-2xl overflow-hidden transition-all duration-150 shadow-md select-none bg-slate-950
            ${onClick ? 'cursor-pointer' : 'cursor-default'}
            ${
              isLeader
                ? 'border-[2.5px] border-amber-400 ring-2 ring-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                : 'border-2 border-slate-700/90 hover:border-slate-400'
            }
            ${isBanned ? 'brightness-90' : 'hover:brightness-105'}
            ${selectable ? 'hover:ring-2 hover:ring-teal-400' : ''}
          `}
        >
          {/* Monster Avatar Image or Gradient Fallback */}
          {monster.avatarUrl && !imageError ? (
            <img
              src={monster.avatarUrl}
              alt={monster.name}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-1 bg-gradient-to-br ${elementInfo.gradient} text-slate-950 font-bold`}
            >
              <img
                src={elementInfo.iconUrl}
                alt={monster.element}
                className="w-5 h-5 object-contain drop-shadow-sm mb-0.5"
              />
              <span className="text-[9px] tracking-tighter uppercase font-extrabold truncate max-w-full px-0.5">
                {monster.name.slice(0, 4)}
              </span>
            </div>
          )}

          {/* Banned Overlay: Pink circle with diagonal slash (exact match with user image) */}
          {isBanned && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-950/30 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                <Ban className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400 stroke-[2.5]" />
              </div>
            </div>
          )}

          {/* Pick Order Badge: Black background with white number at bottom-right */}
          {pickOrder !== undefined && (
            <div className="absolute bottom-0.5 right-0.5 z-20 bg-black/90 text-white font-extrabold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded shadow-md border border-black/50 leading-none pointer-events-none">
              {pickOrder}
            </div>
          )}
        </div>
      </div>

      {/* Optional stars preview */}
      {showStars && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: monster.naturalStars }).map((_, i) => (
            <span
              key={i}
              className={`text-[9px] leading-none ${
                isLightOrDark ? 'text-purple-300 drop-shadow-[0_0_2px_rgba(216,180,254,0.8)]' : 'text-amber-400'
              }`}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Optional monster name */}
      {showName && (
        <div className="text-center max-w-[80px] mt-0.5">
          <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">
            {monster.name}
          </p>
        </div>
      )}
    </div>
  );
};
