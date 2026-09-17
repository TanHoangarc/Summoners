import React from 'react';
import { Swords, Shield, Users, Plus, Sparkles } from 'lucide-react';

export type ActiveTab = 'rta' | 'siege' | 'monsters';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  monsterCount: number;
  onOpenAddMonster: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  monsterCount,
  onOpenAddMonster,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur-xs opacity-50 group-hover:opacity-80 transition duration-300"></div>
              <div className="relative w-10 h-10 rounded-2xl bg-slate-900 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-md font-black text-lg tracking-wider">
                SW
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  SUMMONERS WAR
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    Tactics
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* 3 Main Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => onTabChange('rta')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'rta'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>RTA Draft</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('siege')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'siege'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Siege Counter</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('monsters')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'monsters'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Danh Sách Pet</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/90 text-teal-300 font-semibold border border-slate-700/50">
                {monsterCount}
              </span>
            </button>
          </nav>

          {/* Quick Add Monster Shortcut */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddMonster}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Load Avatar Pet Mới
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
