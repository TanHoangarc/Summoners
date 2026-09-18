import { ElementType, Monster, MonsterRole, SiegeCounterStrategy } from '../types';

export const ELEMENT_COLORS: Record<ElementType, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  gradient: string;
  label: string;
  icon: string;
  iconUrl: string;
}> = {
  water: {
    bg: 'bg-blue-950/60',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    gradient: 'from-blue-600 to-cyan-500',
    label: 'Water',
    icon: '💧',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/water.png',
  },
  fire: {
    bg: 'bg-red-950/60',
    border: 'border-red-500/50',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-400/40',
    gradient: 'from-red-600 to-orange-500',
    label: 'Fire',
    icon: '🔥',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/fire.png',
  },
  wind: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    gradient: 'from-emerald-600 to-teal-500',
    label: 'Wind',
    icon: '🍃',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/wind.png',
  },
  light: {
    bg: 'bg-amber-950/60',
    border: 'border-amber-400/50',
    text: 'text-amber-300',
    badge: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
    gradient: 'from-amber-400 to-yellow-200',
    label: 'Sáng',
    icon: '⚡',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/light.png',
  },
  dark: {
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    gradient: 'from-purple-600 to-violet-400',
    label: 'Tối',
    icon: '🌙',
    iconUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/dark.png',
  },
};

export const ROLE_LABELS: Record<MonsterRole, { label: string; color: string }> = {
  attack: { label: 'Tấn công', color: 'text-red-400 bg-red-900/30 border-red-500/30' },
  defense: { label: 'Phòng thủ', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30' },
  hp: { label: 'Máu', color: 'text-amber-400 bg-amber-900/30 border-amber-500/30' },
  support: { label: 'Hỗ trợ', color: 'text-sky-400 bg-sky-900/30 border-sky-500/30' },
};

export function getMonsterById(monsters: Monster[], id: string | null | undefined): Monster | undefined {
  if (!id) return undefined;
  return monsters.find((m) => m.id === id);
}

// Generate smart algorithmic counter when no exact pre-recorded composition exists
export function generateDynamicCounters(
  defenseIds: string[],
  allMonsters: Monster[]
): SiegeCounterStrategy[] {
  const defMonsters = defenseIds
    .map((id) => allMonsters.find((m) => m.id === id))
    .filter((m): m is Monster => Boolean(m));

  if (defMonsters.length < 3) return [];

  // Check element weaknesses
  const defElements = defMonsters.map((m) => m.element);
  const defTags = defMonsters.flatMap((m) => m.tags || []);

  const hasFire = defElements.includes('fire');
  const hasWind = defElements.includes('wind');
  const hasWater = defElements.includes('water');
  const hasLightDark = defElements.includes('light') || defElements.includes('dark');
  const hasImmunityOrShield = defTags.some((t) => t.includes('Immunity') || t.includes('Shield') || t.includes('Endure'));
  const hasSpeedLead = defMonsters.some((m) => m.leaderSkill?.includes('Spd'));

  const suggestions: SiegeCounterStrategy[] = [];

  // Strategy 1: Bruiser / Sustain approach
  let bruiserComp: [string, string, string] = ['feng_yan', 'aaliyah', 'tractor'];
  let bruiserStrat = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Feng Yan: Dùng Skill 2 tăng thủ + hồi phục, sau đó dùng Skill 1 đánh bẻ giáp mục tiêu chủ lực.
- Aaliyah: Bật Skill 3 tăng thủ và miễn nhiễm 3 lượt bảo vệ toàn đội.
- Tractor: Dùng Skill 1 & 2 khiêu khích và làm bao cát hút đòn không sợ trừ giáp.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Feng Yan yêu cầu (Atk: +300 | HP: +18.000 | SPD: +85)
- Aaliyah yêu cầu (Atk: +250 | HP: +24.000 | SPD: +135)
- Tractor yêu cầu (Atk: +400 | HP: +22.000 | SPD: +80)`;
  
  if (hasFire && !hasWind) {
    bruiserComp = ['tractor', 'aaliyah', 'theomars'];
    bruiserStrat = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Tractor: Hút sát thương quái Lửa nhờ nội tại miễn trừ giáp, dùng Skill 2 khiêu khích.
- Aaliyah: Dùng Skill 3 buff Miễn Nhiễm + Tăng Thủ 3 lượt cho toàn đội.
- Theomars: Dùng Skill 2 trừ giáp và Skill 1 dứt điểm đối thủ.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Tractor yêu cầu (Atk: +400 | HP: +22.000 | SPD: +80)
- Aaliyah yêu cầu (Atk: +250 | HP: +24.000 | SPD: +135)
- Theomars yêu cầu (Atk: +1.400 | HP: +10.000 | SPD: +110)`;
  } else if (hasWater && !hasFire) {
    bruiserComp = ['feng_yan', 'riley', 'dominic'];
    bruiserStrat = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Feng Yan: Dùng Skill 2 phản đòn, Skill 1 liên tục trừ giáp đối thủ hệ Nước.
- Riley: Dùng Skill 3 & 4 liên tục buff Tăng Công, hồi máu và miễn nhiễm.
- Dominic: Dùng Skill 2 & 1 xả sát thương chuẩn áp đảo quái đối phương.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Feng Yan yêu cầu (Atk: +300 | HP: +19.000 | SPD: +90)
- Riley yêu cầu (Atk: +300 | HP: +26.000 | SPD: +125)
- Dominic yêu cầu (Atk: +1.600 | HP: +12.000 | SPD: +115)`;
  }

  suggestions.push({
    id: `dyn-counter-1-${defenseIds.join('-')}`,
    defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]] as [string, string, string],
    counterMonsterIds: bruiserComp,
    rating: 5.0,
    ratingCount: 1,
    author: '',
    date: 'Hôm nay',
    difficulty: 'Dễ',
    strategy: bruiserStrat,
  });

  // Strategy 2: Snipe / Fast Cleave approach
  let snipeComp: [string, string, string] = ['covenant', 'dova', 'belial'];
  let snipeStrat = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Covenant: Được Dova đẩy lượt, dùng ngay Skill 3 ngắm bắn xuyên giáp dứt điểm chủ lực địch.
- Dova: Dùng Skill 2 đẩy 100% thanh tấn công + buff Tăng Công trực tiếp cho Covenant.
- Belial: Dùng Skill 2 đánh xuyên giáp và liên tục hồi sinh quấy phá đối thủ.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Covenant yêu cầu (Atk: +1.950 | HP: +8.000 | SPD: +60)
- Dova yêu cầu (Atk: +350 | HP: +21.000 | SPD: +195)
- Belial yêu cầu (Atk: +1.800 | HP: +6.000 | SPD: +90)`;

  if (hasSpeedLead) {
    snipeComp = ['leo', 'woosa', 'feng_yan'];
    snipeStrat = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Leo: Dùng Skill 1/Skill 2 giảm thanh tấn công quái nhanh nhất bên địch, khống chế tốc độ trận đấu.
- Woosa: Đi ngay sau Leo, dùng Skill 3 phủ khiên + Miễn Nhiễm 3 lượt toàn đội.
- Feng Yan: Dùng Skill 2 hồi phục, sau đó dùng Skill 1 dứt điểm từng mục tiêu.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Leo yêu cầu (Atk: +1.200 | HP: +20.000 | SPD: +0)
- Woosa yêu cầu (Atk: +400 | HP: +32.000 | SPD: +150)
- Feng Yan yêu cầu (Atk: +300 | HP: +19.000 | SPD: +85)`;
  } else if (hasImmunityOrShield) {
    snipeComp = ['chilling', 'feng_yan', 'aaliyah'];
    snipeStrat = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Chilling: Dùng Skill 1 và nội tại liên tục xóa bùa Will/khiên của đối thủ.
- Feng Yan: Dùng Skill 2 phản đòn, Skill 1 bẻ giáp khi mục tiêu mất bùa Will.
- Aaliyah: Dùng Skill 3 buff Miễn Nhiễm + Tăng Thủ bảo đảm an toàn.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Chilling yêu cầu (Atk: +650 | HP: +19.000 | SPD: +140)
- Feng Yan yêu cầu (Atk: +300 | HP: +18.000 | SPD: +85)
- Aaliyah yêu cầu (Atk: +250 | HP: +24.000 | SPD: +135)`;
  }

  suggestions.push({
    id: `dyn-counter-2-${defenseIds.join('-')}`,
    defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]] as [string, string, string],
    counterMonsterIds: snipeComp,
    rating: 5.0,
    ratingCount: 1,
    author: '',
    date: 'Hôm nay',
    difficulty: 'Trung bình',
    strategy: snipeStrat,
  });

  // Strategy 3: Control & Immunity approach
  const controlComp: [string, string, string] = ['woosa', 'cheongpung', 'dominic'];
  suggestions.push({
    id: `dyn-counter-3-${defenseIds.join('-')}`,
    defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]] as [string, string, string],
    counterMonsterIds: controlComp,
    rating: 5.0,
    ratingCount: 1,
    author: '',
    date: 'Hôm nay',
    difficulty: 'Trung bình',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Woosa: Dùng Skill 3 phủ khiên chắn và miễn nhiễm 3 lượt ngay lượt đầu tiên.
- Cheongpung: Dùng Skill 3 xóa buff + giảm thanh tấn công + reset hồi chiêu toàn bộ địch, sau đó Skill 2 trừ giáp.
- Dominic: Dùng Skill 2 và Skill 1 dồn sát thương chuẩn kết liễu mục tiêu đã bị khống chế.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Woosa yêu cầu (Atk: +400 | HP: +32.000 | SPD: +150)
- Cheongpung yêu cầu (Atk: +800 | HP: +18.000 | SPD: +140)
- Dominic yêu cầu (Atk: +1.600 | HP: +12.000 | SPD: +115)`,
  });

  return suggestions;
}
