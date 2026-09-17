import React, { useState } from 'react';
import { ElementType, Monster } from '../../types';
import {
  FamilySibling,
  MonsterFamilyGroup,
  SwgtMonsterEntry,
} from '../../utils/monsterAutoDetector';
import { ELEMENT_COLORS } from '../../utils/monsterHelpers';
import { ArrowRightLeft, Check, Sparkles, Plus, ShieldAlert } from 'lucide-react';

interface MonsterFamilySwitcherProps {
  familyGroup: MonsterFamilyGroup;
  currentMonsterId?: string;
  currentElement: ElementType;
  onSwitchToExisting: (monster: Monster) => void;
  onSwitchToCatalogSibling: (entry: SwgtMonsterEntry) => void;
  onChangeElementOnly: (element: ElementType) => void;
}

const ALL_ELEMENTS: ElementType[] = ['water', 'fire', 'wind', 'light', 'dark'];

export const MonsterFamilySwitcher: React.FC<MonsterFamilySwitcherProps> = ({
  familyGroup,
  currentMonsterId,
  currentElement,
  onSwitchToExisting,
  onSwitchToCatalogSibling,
  onChangeElementOnly,
}) => {
  const [selectedSiblingWithMulti, setSelectedSiblingWithMulti] = useState<FamilySibling | null>(null);

  return (
    <div
      id="monster-family-switcher"
      className="p-2 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-sm space-y-2 sm:space-y-2.5"
    >
      {/* Top Header: Family name & Count in Storage */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
            <ArrowRightLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="min-w-0 flex items-center gap-1">
            <span className="text-[11px] sm:text-[12px] font-bold text-slate-200 shrink-0">
              Chuyển hệ:
            </span>
            <span className="text-teal-300 font-semibold px-1.5 py-0.2 rounded bg-teal-950/60 border border-teal-500/30 text-[10.5px] sm:text-[11px] truncate max-w-[120px] sm:max-w-none">
              {familyGroup.familyName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 whitespace-nowrap">
            Có <strong className="text-emerald-400">{familyGroup.totalInStorage}</strong>/5 hệ
          </span>
        </div>
      </div>

      {/* 5 Element Sibling Cards */}
      <div className="grid grid-cols-5 gap-1 min-[400px]:gap-1.5 sm:gap-2">
        {ALL_ELEMENTS.map((elem) => {
          const sibling = familyGroup.siblings[elem];
          if (!sibling) return null;

          const colors = ELEMENT_COLORS[elem];
          const isCurrent = sibling.isCurrent;
          const hasInStorage = sibling.existingMonsters.length > 0;
          const multiCount = sibling.existingMonsters.length;

          const handleClick = () => {
            if (isCurrent) return;

            if (hasInStorage) {
              if (multiCount === 1) {
                onSwitchToExisting(sibling.existingMonsters[0]);
              } else {
                // Toggle multi-copy selector
                setSelectedSiblingWithMulti(
                  selectedSiblingWithMulti?.element === elem ? null : sibling
                );
              }
            } else if (sibling.catalogEntry) {
              onSwitchToCatalogSibling(sibling.catalogEntry);
            } else {
              onChangeElementOnly(elem);
            }
          };

          return (
            <div
              key={elem}
              onClick={handleClick}
              id={`sibling-card-${elem}`}
              title={
                isCurrent
                  ? `Đang chỉnh sửa ${sibling.displayName}`
                  : hasInStorage
                  ? `Bấm để chuyển sang sửa ${sibling.displayName} (có trong kho)`
                  : `Bấm để tải mẫu ${sibling.displayName} hoặc thêm vào kho`
              }
              className={`relative flex flex-col items-center justify-between p-1 min-[375px]:p-1.5 sm:p-2 rounded-xl border text-center transition-all cursor-pointer select-none min-h-[92px] min-[375px]:min-h-[100px] sm:min-h-[108px] ${
                isCurrent
                  ? 'bg-slate-900/95 border-teal-400 ring-1.5 sm:ring-2 ring-teal-400/50 shadow-md shadow-teal-950/60 cursor-default'
                  : hasInStorage
                  ? 'bg-slate-900/60 border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800/80 hover:shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/40 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Avatar with Element Icon positioned at corner */}
              <div className="relative mt-0.5 sm:mt-1 mb-0.5 sm:mb-1">
                <div
                  className={`w-9 h-9 min-[360px]:w-10 min-[360px]:h-10 min-[400px]:w-11 min-[400px]:h-11 sm:w-13 sm:h-13 rounded-lg sm:rounded-xl overflow-hidden border bg-slate-950 flex items-center justify-center shadow-inner ${
                    isCurrent
                      ? 'border-teal-400 ring-1 ring-teal-400/40 shadow-sm'
                      : hasInStorage
                      ? `${colors.border} ring-1 ring-emerald-500/30`
                      : 'border-slate-800 grayscale-[35%]'
                  }`}
                >
                  {sibling.avatarUrl ? (
                    <img
                      src={sibling.avatarUrl}
                      alt={sibling.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <img
                        src={colors.iconUrl}
                        alt={elem}
                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain opacity-50"
                      />
                    </div>
                  )}
                </div>

                {/* Element icon at the top-left corner of the avatar */}
                <div
                  className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5 rounded-full bg-slate-950 border border-slate-700/90 flex items-center justify-center p-0.5 shadow-md z-10"
                  title={`Hệ ${colors.label}`}
                >
                  <img
                    src={colors.iconUrl}
                    alt={elem}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Storage Checkmark Indicator (bottom-right corner) */}
                {hasInStorage && !isCurrent && (
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-4.5 sm:h-4.5 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] min-[360px]:text-[9px] sm:text-[10px] text-white font-bold border sm:border-2 border-slate-950 shadow-sm z-10"
                    title="Đã có trong kho"
                  >
                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  </span>
                )}
              </div>

              {/* Sibling Name */}
              <p
                className={`text-[8.5px] min-[360px]:text-[9.5px] sm:text-[11px] font-semibold leading-tight line-clamp-1 w-full mt-0.5 sm:mt-1 text-center px-0.5 ${
                  isCurrent
                    ? 'text-teal-300 font-bold'
                    : hasInStorage
                    ? 'text-slate-100'
                    : 'text-slate-400'
                }`}
                title={sibling.displayName}
              >
                {sibling.displayName}
              </p>

              {/* Bottom State Pill */}
              <div className="mt-0.5 sm:mt-1 w-full">
                {isCurrent ? (
                  <span className="block text-[7.5px] min-[360px]:text-[8px] sm:text-[9px] font-bold py-0.5 px-0.5 sm:px-1 rounded bg-teal-500/20 text-teal-300 border border-teal-400/40 truncate text-center">
                    Đang sửa
                  </span>
                ) : hasInStorage ? (
                  <span className="block text-[7.5px] min-[360px]:text-[8px] sm:text-[9px] font-semibold py-0.5 px-0.5 sm:px-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 truncate hover:bg-emerald-500/25 text-center">
                    {multiCount > 1 ? (
                      `Có (${multiCount})`
                    ) : (
                      <>
                        <span className="hidden sm:inline">Sửa pet</span>
                        <span className="sm:hidden">Có</span>
                      </>
                    )}
                  </span>
                ) : (
                  <span className="block text-[7.5px] min-[360px]:text-[8px] sm:text-[9px] font-normal py-0.5 px-0.5 sm:px-1 rounded bg-slate-800/50 text-slate-400 border border-slate-700/40 truncate hover:text-slate-300 text-center">
                    + Thêm
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multiple Copies Picker (if user owns multiple copies of a sibling) */}
      {selectedSiblingWithMulti && selectedSiblingWithMulti.existingMonsters.length > 1 && (
        <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/40 text-xs animate-in fade-in space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
              <span>Bạn có {selectedSiblingWithMulti.existingMonsters.length} bản sao [{selectedSiblingWithMulti.displayName}]:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedSiblingWithMulti(null)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              Đóng
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedSiblingWithMulti.existingMonsters.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSwitchToExisting(m);
                  setSelectedSiblingWithMulti(null);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 border border-slate-700 hover:border-teal-500/40 text-[11px] cursor-pointer transition-colors"
              >
                {m.avatarUrl && (
                  <img src={m.avatarUrl} alt={m.name} className="w-3.5 h-3.5 rounded object-cover" />
                )}
                <span>{m.name}</span>
                <span className="text-[9px] text-slate-400">({m.naturalStars}★)</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
