import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Swords,
  Shield,
  CheckCircle,
  HelpCircle,
  Pencil,
  Sparkles,
  Loader2,
  FileText,
  List,
  Search,
  Zap,
  Sliders,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Monster, SiegeCounterStrategy } from '../../types';
import { getMonsterById } from '../../utils/monsterHelpers';
import { recordMonsterPick } from '../../utils/monsterPickStats';
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
  existingCounters?: SiegeCounterStrategy[];
}

const buildDefaultStrategyTemplate = (
  mon1Name?: string,
  mon2Name?: string,
  mon3Name?: string
) => {
  const p1 = mon1Name || 'Pet Counter 1';
  const p2 = mon2Name || 'Pet Counter 2';
  const p3 = mon3Name || 'Pet Counter 3';

  return `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- ${p1}: Sử dụng Skill ... vào mục tiêu ...
- ${p2}: Sử dụng Skill ... vào mục tiêu ...
- ${p3}: Sử dụng Skill ... vào mục tiêu ...

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- ${p1} yêu cầu (Atk: +... | HP: +... | SPD: +...)
- ${p2} yêu cầu (Atk: +... | HP: +... | SPD: +...)
- ${p3} yêu cầu (Atk: +... | HP: +... | SPD: +...)

3. Mục Tiêu Dứt Điểm (Kill Order) & Lưu Ý:
- Thứ tự hạ gục: ...
- Lưu ý phòng ngừa biến số: ...`;
};

// Định dạng chỉ số với dấu '+' phía trước
const formatStat = (val: string) => {
  const trimmed = val.trim();
  if (!trimmed) return '+...';
  if (trimmed.startsWith('+') || trimmed.startsWith('-')) return trimmed;
  return `+${trimmed}`;
};

// Trích xuất chỉ số Rune hiện có trong chiến thuật nếu có sẵn
const extractRuneStatsFromStrategy = (
  currentStrategy: string,
  monName: string,
  slotIdx: number
): { atk: string; hp: string; spd: string } => {
  const fallbackNames = [monName, `Pet Counter ${slotIdx + 1}`, `Pet ${slotIdx + 1}`];
  for (const name of fallbackNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `${escaped}[^\\n]*\\(Atk:\\s*([+|-\\d\\w.]+)\\s*\\|\\s*HP:\\s*([+|-\\d\\w.]+)\\s*\\|\\s*SPD:\\s*([+|-\\d\\w.]+)\\)`,
      'i'
    );
    const match = currentStrategy.match(regex);
    if (match) {
      const atk = match[1] === '+...' ? '' : match[1].replace(/^\+/, '');
      const hp = match[2] === '+...' ? '' : match[2].replace(/^\+/, '');
      const spd = match[3] === '+...' ? '' : match[3].replace(/^\+/, '');
      return { atk, hp, spd };
    }
  }
  return { atk: '', hp: '', spd: '' };
};

// Cập nhật hoặc chèn kỹ năng (Skill 1, 2, 3, 4) vào Mục 1 trong mẫu chiến thuật
const applySkillToStrategy = (
  currentStrategy: string,
  slotIdx: number,
  monster: Monster,
  skillName: string,
  allSlots: [string | null, string | null, string | null],
  allMonstersList: Monster[]
): string => {
  const m1 = getMonsterById(allMonstersList, allSlots[0]);
  const m2 = getMonsterById(allMonstersList, allSlots[1]);
  const m3 = getMonsterById(allMonstersList, allSlots[2]);
  let strat = currentStrategy || buildDefaultStrategyTemplate(m1?.name, m2?.name, m3?.name);

  const monName = monster.name;
  const fallbackNames = [monName, `Pet Counter ${slotIdx + 1}`, `Pet ${slotIdx + 1}`];

  const lines = strat.split('\n');
  let matched = false;

  let inSection1 = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('1. Hướng Dẫn Sử Dụng Kỹ Năng') || line.includes('Hướng Dẫn Sử Dụng Kỹ Năng')) {
      inSection1 = true;
      continue;
    }
    if (line.includes('2. Yêu Cầu Chỉ Số Chi Tiết') || line.includes('Yêu Cầu Chỉ Số')) {
      inSection1 = false;
      break;
    }

    if (inSection1) {
      for (const name of fallbackNames) {
        if (line.includes(name)) {
          if (line.includes('Sử dụng Skill ...')) {
            lines[i] = line.replace('Sử dụng Skill ...', `Sử dụng ${skillName}`);
          } else if (/Sử dụng Skill \d/i.test(line)) {
            lines[i] = line.replace(/Sử dụng Skill \d/i, `Sử dụng ${skillName}`);
          } else if (line.includes('Sử dụng ...')) {
            lines[i] = line.replace('Sử dụng ...', `Sử dụng ${skillName}`);
          } else {
            lines[i] = `- ${monName}: Sử dụng ${skillName} vào mục tiêu ...`;
          }
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  if (!matched) {
    for (let i = 0; i < lines.length; i++) {
      for (const name of fallbackNames) {
        if (lines[i].includes(name) && lines[i].includes('Sử dụng')) {
          lines[i] = lines[i]
            .replace(/Sử dụng Skill [^ ]+/i, `Sử dụng ${skillName}`)
            .replace(/Sử dụng Skill \.\.\./i, `Sử dụng ${skillName}`)
            .replace(/Sử dụng \.\.\./i, `Sử dụng ${skillName}`);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  if (!matched) {
    const sec1Idx = lines.findIndex(
      (l) => l.includes('1. Hướng Dẫn Sử Dụng Kỹ Năng') || l.includes('Kỹ Năng')
    );
    if (sec1Idx !== -1) {
      lines.splice(sec1Idx + 1, 0, `- ${monName}: Sử dụng ${skillName} vào mục tiêu ...`);
    } else {
      lines.unshift(`- ${monName}: Sử dụng ${skillName} vào mục tiêu ...`);
    }
  }

  return lines.join('\n');
};

// Cập nhật hoặc thay thế chỉ số Rune (ATK, HP, SPD) vào Mục 2 trong mẫu chiến thuật
const applyRuneToStrategy = (
  currentStrategy: string,
  slotIdx: number,
  monster: Monster,
  atk: string,
  hp: string,
  spd: string,
  allSlots: [string | null, string | null, string | null],
  allMonstersList: Monster[]
): string => {
  const m1 = getMonsterById(allMonstersList, allSlots[0]);
  const m2 = getMonsterById(allMonstersList, allSlots[1]);
  const m3 = getMonsterById(allMonstersList, allSlots[2]);
  let strat = currentStrategy || buildDefaultStrategyTemplate(m1?.name, m2?.name, m3?.name);

  const monName = monster.name;
  const fallbackNames = [monName, `Pet Counter ${slotIdx + 1}`, `Pet ${slotIdx + 1}`];

  const formattedAtk = formatStat(atk);
  const formattedHp = formatStat(hp);
  const formattedSpd = formatStat(spd);
  const runeLine = `- ${monName} yêu cầu (Atk: ${formattedAtk} | HP: ${formattedHp} | SPD: ${formattedSpd})`;

  const lines = strat.split('\n');
  let matched = false;

  let inSection2 = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('2. Yêu Cầu Chỉ Số Chi Tiết') || line.includes('Yêu Cầu Chỉ Số')) {
      inSection2 = true;
      continue;
    }
    if (line.includes('3. Mục Tiêu Dứt Điểm') || line.includes('Mục Tiêu Dứt Điểm')) {
      inSection2 = false;
      break;
    }

    if (inSection2) {
      for (const name of fallbackNames) {
        if (
          line.includes(name) &&
          (line.includes('yêu cầu') || line.includes('Atk:') || line.includes('HP:'))
        ) {
          lines[i] = runeLine;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  if (!matched) {
    for (let i = 0; i < lines.length; i++) {
      for (const name of fallbackNames) {
        if (
          lines[i].includes(name) &&
          (lines[i].includes('Atk:') || lines[i].includes('SPD:') || lines[i].includes('yêu cầu'))
        ) {
          lines[i] = runeLine;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  if (!matched) {
    const sec2Idx = lines.findIndex(
      (l) => l.includes('2. Yêu Cầu Chỉ Số Chi Tiết') || l.includes('Yêu Cầu Chỉ Số')
    );
    if (sec2Idx !== -1) {
      lines.splice(sec2Idx + 1, 0, runeLine);
    } else {
      lines.push('', runeLine);
    }
  }

  return lines.join('\n');
};

const updateStrategyForMonsterSlot = (
  currentStrategy: string,
  slotIdx: number,
  oldMonsterName: string | undefined,
  newMonsterName: string | undefined,
  allSlots: [string | null, string | null, string | null],
  allMonstersList: Monster[]
) => {
  if (!currentStrategy) {
    const m1 = getMonsterById(allMonstersList, allSlots[0]);
    const m2 = getMonsterById(allMonstersList, allSlots[1]);
    const m3 = getMonsterById(allMonstersList, allSlots[2]);
    return buildDefaultStrategyTemplate(m1?.name, m2?.name, m3?.name);
  }

  const fallbackOld = oldMonsterName || `Pet Counter ${slotIdx + 1}`;
  const targetNew = newMonsterName || `Pet Counter ${slotIdx + 1}`;

  let updated = currentStrategy;
  if (oldMonsterName && updated.includes(oldMonsterName)) {
    updated = updated.split(oldMonsterName).join(targetNew);
  } else if (updated.includes(fallbackOld)) {
    updated = updated.split(fallbackOld).join(targetNew);
  } else if (updated.includes(`Pet ${slotIdx + 1} (Tên Pet ${slotIdx + 1})`)) {
    updated = updated.split(`Pet ${slotIdx + 1} (Tên Pet ${slotIdx + 1})`).join(targetNew);
  } else if (updated.includes(`Pet ${slotIdx + 1}`)) {
    updated = updated.split(`Pet ${slotIdx + 1}`).join(targetNew);
  } else if (updated.includes(`Tên Pet ${slotIdx + 1}`)) {
    updated = updated.split(`Tên Pet ${slotIdx + 1}`).join(targetNew);
  }

  return updated;
};

export const SaveCounterModal: React.FC<SaveCounterModalProps> = ({
  isOpen,
  onClose,
  defenseIds,
  allMonsters,
  onSave,
  editingCounter,
  onOpenAddMonster,
  existingCounters = [],
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

  // Quick team picker from existing counters
  const [isTeamPickerOpen, setIsTeamPickerOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  const [strategy, setStrategy] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Yêu cầu rune cao'>('Trung bình');
  const [error, setError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessNotice, setAiSuccessNotice] = useState<string | null>(null);

  // Tips for selected monster slot: Skill and Rune
  const [activeTipSlot, setActiveTipSlot] = useState<number | null>(null);
  const [hoveredSkillSlot, setHoveredSkillSlot] = useState<number | null>(null);

  // Rune Popup Modal state: 3 rows (ATK, HP, SPD)
  const [activeRuneSlot, setActiveRuneSlot] = useState<number | null>(null);
  const [runeAtk, setRuneAtk] = useState('');
  const [runeHp, setRuneHp] = useState('');
  const [runeSpd, setRuneSpd] = useState('');

  // Extract unique 3-monster counter teams from existing counters
  const distinctTeams = useMemo(() => {
    if (!existingCounters || existingCounters.length === 0) return [];

    const map = new Map<
      string,
      {
        id: string;
        monsterIds: [string, string, string];
        monsters: (Monster | undefined)[];
        name: string;
        difficulty?: string;
        strategy?: string;
      }
    >();

    for (const c of existingCounters) {
      if (!c.counterMonsterIds || c.counterMonsterIds.length < 3) continue;
      const [m1Id, m2Id, m3Id] = c.counterMonsterIds;
      if (!m1Id || !m2Id || !m3Id) continue;

      const sortedKey = [m1Id, m2Id, m3Id].sort().join('__');
      if (!map.has(sortedKey)) {
        const mon1 = getMonsterById(allMonsters, m1Id);
        const mon2 = getMonsterById(allMonsters, m2Id);
        const mon3 = getMonsterById(allMonsters, m3Id);
        const name = [mon1?.name, mon2?.name, mon3?.name].filter(Boolean).join(' + ');

        map.set(sortedKey, {
          id: c.id,
          monsterIds: [m1Id, m2Id, m3Id],
          monsters: [mon1, mon2, mon3],
          name: name || 'Team 3 quái thú',
          difficulty: c.difficulty,
          strategy: c.strategy,
        });
      }
    }

    return Array.from(map.values());
  }, [existingCounters, allMonsters]);

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return distinctTeams;
    const q = teamSearchQuery.toLowerCase().trim();
    return distinctTeams.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      return t.monsters.some((m) => m?.name?.toLowerCase().includes(q));
    });
  }, [distinctTeams, teamSearchQuery]);

  const handleSelectQuickTeam = (team: {
    monsterIds: [string, string, string];
    name: string;
    difficulty?: string;
    strategy?: string;
  }) => {
    const nextSlots: [string | null, string | null, string | null] = [
      team.monsterIds[0],
      team.monsterIds[1],
      team.monsterIds[2],
    ];
    setCounterSlots(nextSlots);

    const m1 = getMonsterById(allMonsters, team.monsterIds[0]);
    const m2 = getMonsterById(allMonsters, team.monsterIds[1]);
    const m3 = getMonsterById(allMonsters, team.monsterIds[2]);

    if (team.strategy && team.strategy.trim().length > 20) {
      setStrategy(team.strategy);
    } else {
      setStrategy(buildDefaultStrategyTemplate(m1?.name, m2?.name, m3?.name));
    }

    if (team.difficulty && ['Dễ', 'Trung bình', 'Yêu cầu rune cao'].includes(team.difficulty)) {
      setDifficulty(team.difficulty as 'Dễ' | 'Trung bình' | 'Yêu cầu rune cao');
    }

    setIsTeamPickerOpen(false);
    setAiSuccessNotice(`Đã chọn nhanh team: ${team.name}`);
    setTimeout(() => setAiSuccessNotice(null), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingCounter) {
        setCounterSlots([
          editingCounter.counterMonsterIds[0] || null,
          editingCounter.counterMonsterIds[1] || null,
          editingCounter.counterMonsterIds[2] || null,
        ]);
        const m1 = getMonsterById(allMonsters, editingCounter.counterMonsterIds[0]);
        const m2 = getMonsterById(allMonsters, editingCounter.counterMonsterIds[1]);
        const m3 = getMonsterById(allMonsters, editingCounter.counterMonsterIds[2]);
        setStrategy(editingCounter.strategy || buildDefaultStrategyTemplate(m1?.name, m2?.name, m3?.name));
        setDifficulty(editingCounter.difficulty || 'Trung bình');
      } else {
        setCounterSlots([null, null, null]);
        // Default-fill the template so user can directly edit/complete it
        setStrategy(buildDefaultStrategyTemplate());
        setDifficulty('Trung bình');
      }
      setError(null);
      setAiSuccessNotice(null);
      setIsAiLoading(false);
      setActiveSlotIndex(null);
      setIsTeamPickerOpen(false);
      setTeamSearchQuery('');
      setActiveTipSlot(null);
      setHoveredSkillSlot(null);
      setActiveRuneSlot(null);
    }
  }, [isOpen, editingCounter, allMonsters]);

  if (!isOpen) return null;

  const c1 = getMonsterById(allMonsters, counterSlots[0]);
  const c2 = getMonsterById(allMonsters, counterSlots[1]);
  const c3 = getMonsterById(allMonsters, counterSlots[2]);

  // Handler khi chọn Skill từ tip mở rộng
  const handleSelectSkill = (slotIdx: number, monster: Monster, skillName: string) => {
    const updatedStrategy = applySkillToStrategy(
      strategy,
      slotIdx,
      monster,
      skillName,
      counterSlots,
      allMonsters
    );
    setStrategy(updatedStrategy);
    setActiveTipSlot(null);
    setHoveredSkillSlot(null);
    setAiSuccessNotice(`✅ Đã ghi ${skillName} của ${monster.name} vào mẫu chiến thuật!`);
    setTimeout(() => setAiSuccessNotice(null), 3000);
  };

  // Handler khi click vào Rune: mở popup nhỏ 3 hàng thông tin
  const handleOpenRuneModal = (slotIdx: number, monster: Monster) => {
    const existingStats = extractRuneStatsFromStrategy(strategy, monster.name, slotIdx);
    setRuneAtk(existingStats.atk);
    setRuneHp(existingStats.hp);
    setRuneSpd(existingStats.spd);
    setActiveRuneSlot(slotIdx);
    setActiveTipSlot(null);
    setHoveredSkillSlot(null);
  };

  // Handler khi xác nhận lưu chỉ số Rune từ popup
  const handleApplyRune = () => {
    if (activeRuneSlot === null) return;
    const monster = getMonsterById(allMonsters, counterSlots[activeRuneSlot]);
    if (!monster) return;

    const updatedStrategy = applyRuneToStrategy(
      strategy,
      activeRuneSlot,
      monster,
      runeAtk,
      runeHp,
      runeSpd,
      counterSlots,
      allMonsters
    );
    setStrategy(updatedStrategy);
    setActiveRuneSlot(null);
    setAiSuccessNotice(`✅ Đã cập nhật chỉ số Rune của ${monster.name} vào mẫu chiến thuật!`);
    setTimeout(() => setAiSuccessNotice(null), 3000);
  };

  const handleFillTemplate = () => {
    setStrategy(buildDefaultStrategyTemplate(c1?.name, c2?.name, c3?.name));
    setAiSuccessNotice('Đã điền sẵn khung nội dung chiến thuật mẫu!');
    setTimeout(() => setAiSuccessNotice(null), 3000);
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
      if (result.difficulty) {
        setDifficulty(result.difficulty);
      }

      setAiSuccessNotice('Đã tải chiến thuật và yêu cầu chỉ số từng Pet từ AI thành công!');
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
      rating: editingCounter?.rating || 5.0,
      ratingCount: editingCounter ? editingCounter.ratingCount || 1 : 1,
      author: editingCounter?.author || '',
      date: editingCounter ? editingCounter.date : new Date().toLocaleDateString('vi-VN'),
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
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Chọn 3 Quái Thú Counter Của Bạn:
                </label>
                <button
                  type="button"
                  onClick={() => setIsTeamPickerOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border shadow-sm ${
                    isTeamPickerOpen
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white border-slate-700 hover:border-teal-500/50'
                  }`}
                  title="Hiện danh sách các team counter đã có để chọn nhanh"
                >
                  <List className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Team counter đã có ({distinctTeams.length})</span>
                </button>
              </div>

              {/* Quick Select Team Panel */}
              {isTeamPickerOpen && (
                <div className="p-3 bg-slate-900 border border-teal-500/40 rounded-2xl space-y-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Chọn nhanh từ các team counter đã có ({distinctTeams.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTeamPickerOpen(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Đóng"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search bar inside quick list */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên quái thú..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  {/* Scrollable list of teams */}
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {filteredTeams.length === 0 ? (
                      <div className="py-5 text-center text-xs text-slate-500">
                        {distinctTeams.length === 0
                          ? 'Chưa có đội hình counter nào được lưu trên hệ thống'
                          : 'Không tìm thấy team counter phù hợp từ khóa'}
                      </div>
                    ) : (
                      filteredTeams.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => handleSelectQuickTeam(team)}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center -space-x-2 shrink-0">
                              {team.monsters.map((mon, mIdx) => (
                                <div key={mIdx} className="relative ring-2 ring-slate-900 rounded-full">
                                  <MonsterAvatar monster={mon} size="sm" showStars={false} showName={false} />
                                </div>
                              ))}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors truncate">
                                {team.name}
                              </p>
                              {team.difficulty && (
                                <p className="text-[10px] text-amber-400/90 font-medium">
                                  Độ khó: {team.difficulty}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 px-2 py-0.5 bg-teal-500/10 rounded-lg">
                            Chọn team này →
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-teal-500/20 relative">
                {/* Backdrop để đóng tip khi click ra ngoài */}
                {activeTipSlot !== null && (
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                      setActiveTipSlot(null);
                      setHoveredSkillSlot(null);
                    }}
                  />
                )}

                {counterSlots.map((slotId, idx) => {
                  const monster = getMonsterById(allMonsters, slotId);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 text-center relative">
                      <div className="relative group">
                        <MonsterAvatar
                          monster={monster}
                          size="md"
                          showStars={true}
                          showName={false}
                          onClick={() => {
                            if (!monster) {
                              setActiveSlotIndex(idx);
                            } else {
                              setActiveTipSlot((prev) => (prev === idx ? null : idx));
                            }
                          }}
                          emptyLabel={`Pet ${idx + 1}`}
                          onClear={
                            slotId
                              ? () => {
                                  const oldMon = getMonsterById(allMonsters, counterSlots[idx]);
                                  const next = [...counterSlots] as [string | null, string | null, string | null];
                                  next[idx] = null;
                                  setCounterSlots(next);
                                  if (activeTipSlot === idx) setActiveTipSlot(null);
                                  if (activeRuneSlot === idx) setActiveRuneSlot(null);
                                  setStrategy((prev) =>
                                    updateStrategyForMonsterSlot(
                                      prev,
                                      idx,
                                      oldMon?.name,
                                      undefined,
                                      next,
                                      allMonsters
                                    )
                                  );
                                }
                              : undefined
                          }
                        />

                        {/* Tip nhỏ Skill & Rune khi đã có pet */}
                        {activeTipSlot === idx && monster && (
                          <div
                            className={`absolute z-50 top-16 ${
                              idx === 2 ? 'right-0' : idx === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                            } bg-slate-900/95 border border-teal-500/50 rounded-2xl shadow-2xl p-1.5 backdrop-blur-md flex flex-col gap-1 min-w-[135px] animate-in fade-in zoom-in-95 duration-150 select-none text-left`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header tip nhỏ */}
                            <div className="px-2 py-1 text-[10px] font-black text-slate-400 border-b border-slate-800 flex items-center justify-between">
                              <span className="truncate max-w-[85px] text-teal-300 font-bold">{monster.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTipSlot(null);
                                  setHoveredSkillSlot(null);
                                }}
                                className="text-slate-500 hover:text-white p-0.5 rounded cursor-pointer"
                                title="Đóng"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Tip 1: Skill (di chuột mở rộng skill 1, 2, 3, 4) */}
                            <div
                              className="relative group/skill"
                              onMouseEnter={() => setHoveredSkillSlot(idx)}
                              onMouseLeave={() => setHoveredSkillSlot(null)}
                            >
                              <button
                                type="button"
                                onClick={() => setHoveredSkillSlot((prev) => (prev === idx ? null : idx))}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 rounded-xl transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                                  <span>Skill</span>
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-amber-400/70" />
                              </button>

                              {/* Mở rộng danh sách skill 1, 2, 3, 4 */}
                              {hoveredSkillSlot === idx && (
                                <div
                                  className={`absolute top-0 ${
                                    idx === 2 ? 'right-full mr-1.5' : 'left-full ml-1.5'
                                  } z-50 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-1.5 min-w-[140px] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100`}
                                >
                                  <div className="px-2 py-1 text-[9px] font-extrabold text-amber-400 uppercase tracking-wider border-b border-slate-800">
                                    Ghi vào chiến thuật:
                                  </div>
                                  {(['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4'] as const).map((skillName, sIdx) => (
                                    <button
                                      key={skillName}
                                      type="button"
                                      onClick={() => handleSelectSkill(idx, monster, skillName)}
                                      className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:text-amber-300 hover:bg-amber-500/20 rounded-xl transition-colors flex items-center justify-between cursor-pointer group/btn"
                                      title={`Ghi ${skillName} vào Mục 1`}
                                    >
                                      <span>{skillName}</span>
                                      <span className="text-[10px] text-slate-500 group-hover/btn:text-amber-400/80 font-medium">
                                        {sIdx === 0 ? 'Chiêu 1' : sIdx === 1 ? 'Chiêu 2' : sIdx === 2 ? 'Chiêu 3' : 'Nội tại'}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Tip 2: Rune (mở popup nhỏ 3 hàng ATK, HP, SPD) */}
                            <button
                              type="button"
                              onClick={() => handleOpenRuneModal(idx, monster)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20 rounded-xl transition-colors cursor-pointer"
                              title="Mở popup nhập ATK, HP, SPD để thay thế vào Mục 2"
                            >
                              <span className="flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                                <span>Rune</span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-teal-400/70" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="w-full">
                        <span className="text-xs font-bold text-white block truncate px-1">
                          {monster ? monster.name : `Chọn Pet ${idx + 1}`}
                        </span>
                        {monster ? (
                          <div className="mt-1 flex flex-col items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setActiveTipSlot((prev) => (prev === idx ? null : idx))}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                activeTipSlot === idx
                                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-800 text-teal-300 border-teal-500/30'
                              }`}
                              title="Nhấp để mở mẹo Skill & Rune"
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              <span>Skill & Rune</span>
                            </button>
                            <span className="text-[9px] text-slate-500">Xóa ✕ góc để chọn lại</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveSlotIndex(idx)}
                            className="mt-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium underline underline-offset-2 cursor-pointer"
                          >
                            + Chọn ngay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy / Tactics */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-slate-200">
                    Chiến thuật đánh & Yêu cầu chỉ số từng Pet:
                  </label>
                  <span className="text-[10px] text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-800/60 font-semibold">
                    Đã điền sẵn khung
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillTemplate}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                    title="Khôi phục lại khung nội dung mẫu để bạn tự bổ sung"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>Điền lại mẫu</span>
                  </button>
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
                        <span>Đang tạo AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                        <span>✨ AI Gợi ý</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiSuccessNotice && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{aiSuccessNotice}</span>
                </div>
              )}

              <textarea
                rows={9}
                required
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder={`1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- ${c1?.name || 'Pet Counter 1'}: Sử dụng Skill ... vào mục tiêu ...
- ${c2?.name || 'Pet Counter 2'}: Sử dụng Skill ... vào mục tiêu ...
- ${c3?.name || 'Pet Counter 3'}: Sử dụng Skill ... vào mục tiêu ...

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- ${c1?.name || 'Pet Counter 1'} yêu cầu (Atk: +... | HP: +... | SPD: +...)
- ${c2?.name || 'Pet Counter 2'} yêu cầu (Atk: +... | HP: +... | SPD: +...)
- ${c3?.name || 'Pet Counter 3'} yêu cầu (Atk: +... | HP: +... | SPD: +...)

3. Mục Tiêu Dứt Điểm (Kill Order) & Lưu Ý:
- Thứ tự hạ gục: ...
- Lưu ý phòng ngừa biến số: ...`}
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
            if (monsterId) {
              recordMonsterPick(monsterId);
            }
            const oldMon = getMonsterById(allMonsters, counterSlots[activeSlotIndex]);
            const newMon = getMonsterById(allMonsters, monsterId);
            const next = [...counterSlots] as [string | null, string | null, string | null];
            next[activeSlotIndex] = monsterId;
            setCounterSlots(next);

            setStrategy((prev) =>
              updateStrategyForMonsterSlot(
                prev,
                activeSlotIndex,
                oldMon?.name,
                newMon?.name,
                next,
                allMonsters
              )
            );
            setActiveSlotIndex(null);
          }}
          allMonsters={allMonsters}
          currentMonsterId={counterSlots[activeSlotIndex]}
          title={`Chọn Quái Thú Counter - Vị trí ${activeSlotIndex + 1}`}
          onOpenAddModal={onOpenAddMonster}
          mode="siege"
        />
      )}

      {/* Popup nhỏ 3 hàng thông tin ATK, HP, SPD của Rune */}
      {activeRuneSlot !== null && counterSlots[activeRuneSlot] && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveRuneSlot(null)}
        >
          <div
            className="bg-slate-900 border border-teal-500/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header popup */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const mon = getMonsterById(allMonsters, counterSlots[activeRuneSlot]);
                  return mon ? (
                    <MonsterAvatar monster={mon} size="xs" showStars={false} showName={false} />
                  ) : null;
                })()}
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    Chỉ Số Rune Yêu Cầu
                  </h4>
                  <p className="text-[11px] text-teal-300 font-bold">
                    {getMonsterById(allMonsters, counterSlots[activeRuneSlot])?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRuneSlot(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nhập 3 hàng thông tin bên dưới để tự động thay thế vào <strong className="text-slate-200">Mục 2</strong> trong Mẫu Chiến Thuật:
            </p>

            {/* 3 Hàng thông tin: ATK, HP, SPD */}
            <div className="space-y-3.5">
              {/* Hàng 1: ATK */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    ATK (Tấn Công):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Chỉ số rune cộng</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">+</span>
                  <input
                    type="text"
                    value={runeAtk}
                    onChange={(e) => setRuneAtk(e.target.value.replace(/^\+/, ''))}
                    placeholder="vd: 1200 hoặc ..."
                    className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-750 focus:border-teal-400 rounded-xl text-xs text-white font-bold placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                  <span className="text-[9px] text-slate-500">Nhanh:</span>
                  {['600', '1000', '1400', '1800'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRuneAtk(val)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hàng 2: HP */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    HP (Lượng Máu):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Chỉ số rune cộng</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">+</span>
                  <input
                    type="text"
                    value={runeHp}
                    onChange={(e) => setRuneHp(e.target.value.replace(/^\+/, ''))}
                    placeholder="vd: 15000 hoặc ..."
                    className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-750 focus:border-teal-400 rounded-xl text-xs text-white font-bold placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                  <span className="text-[9px] text-slate-500">Nhanh:</span>
                  {['10000', '15000', '20000', '25000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRuneHp(val)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hàng 3: SPD */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    SPD (Tốc Độ):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Chỉ số rune cộng</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400">+</span>
                  <input
                    type="text"
                    value={runeSpd}
                    onChange={(e) => setRuneSpd(e.target.value.replace(/^\+/, ''))}
                    placeholder="vd: 130 hoặc ..."
                    className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-750 focus:border-teal-400 rounded-xl text-xs text-white font-bold placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                  <span className="text-[9px] text-slate-500">Nhanh:</span>
                  {['90', '120', '145', '175'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRuneSpd(val)}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono cursor-pointer transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Xem trước dòng thay thế */}
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono">
              <span className="text-slate-500 text-[10px] block mb-0.5 font-sans font-bold">Dòng sẽ thay thế vào Mục 2:</span>
              <span className="text-teal-300 font-semibold break-all">
                - {getMonsterById(allMonsters, counterSlots[activeRuneSlot])?.name} yêu cầu (Atk: {formatStat(runeAtk)} | HP: {formatStat(runeHp)} | SPD: {formatStat(runeSpd)})
              </span>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveRuneSlot(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyRune}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-teal-500/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Thay Thế Vào Chiến Thuật</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
