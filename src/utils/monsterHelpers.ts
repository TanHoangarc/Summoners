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
  let bruiserStrat = 'Đội hình trâu bò bền vững (Bruiser Sustain). Khắc chế sát thương sốc bằng tăng phòng thủ và miễn nhiễm dồi dào, kéo dài trận đấu để đối phương hết chiêu.';
  
  if (hasFire && !hasWind) {
    bruiserComp = ['tractor', 'aaliyah', 'theomars'];
    bruiserStrat = 'Tận dụng Tractor hút sát thương hệ Lửa an toàn không lo dính trừ giáp, Theomars và Aaliyah hồi phục dứt điểm kẻ địch.';
  } else if (hasWater && !hasFire) {
    bruiserComp = ['feng_yan', 'riley', 'dominic'];
    bruiserStrat = 'Bộ 3 hệ Gió áp đảo hệ Nước hoàn toàn, Feng Yan trừ giáp liên tục kết hợp sát thương chuẩn của Dominic.';
  }

  suggestions.push({
    id: `dyn-counter-1-${defenseIds.join('-')}`,
    defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]] as [string, string, string],
    counterMonsterIds: bruiserComp,
    rating: 4.8,
    ratingCount: 12,
    author: 'AI Siege Tactician',
    date: 'Hôm nay',
    turnOrder: 'Hỗ trợ buff Miễn nhiễm > Giảm giáp / Khống chế > Dồn sát thương',
    difficulty: 'Dễ',
    strategy: bruiserStrat,
  });

  // Strategy 2: Snipe / Fast Cleave approach
  let snipeComp: [string, string, string] = ['covenant', 'dova', 'belial'];
  let snipeStrat = 'Chiến thuật Snipe 1-shot: Dova kéo lượt cho Covenant xuyên giáp kết liễu chủ lực nguy hiểm nhất ngay tắp lự. Belial dọn dẹp tanker còn lại.';
  if (hasSpeedLead) {
    snipeComp = ['leo', 'woosa', 'feng_yan'];
    snipeStrat = 'Đối thủ có Spd Lead: Dùng Leo khóa cứng thanh tốc độ của toàn bộ team địch xuống bằng Leo, Woosa lập tức đi kế tiếp buff khiên + miễn nhiễm 3 lượt.';
  } else if (hasImmunityOrShield) {
    snipeComp = ['chilling', 'feng_yan', 'aaliyah'];
    snipeStrat = 'Đối thủ có nhiều bùa lợi/khiên chắn: Chilling liên tục xóa và cướp buff của đối thủ, tạo điều kiện cho đồng minh phản đòn an toàn.';
  }

  suggestions.push({
    id: `dyn-counter-2-${defenseIds.join('-')}`,
    defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]] as [string, string, string],
    counterMonsterIds: snipeComp,
    rating: 4.7,
    ratingCount: 9,
    author: 'Top G1 Guild Lead',
    date: 'Hôm nay',
    turnOrder: 'Kéo lượt / Tước buff > Bắn tỉa mục tiêu máu thấp > Kiểm soát thế trận',
    difficulty: 'Trung bình',
    strategy: snipeStrat,
  });

  // Strategy 3: Control & Immunity approach
  const controlComp: [string, string, string] = ['woosa', 'cheongpung', 'dominic'];
  suggestions.push({
    id: `dyn-counter-3-${defenseIds.join('-')}`,
    defenseMonsterIds: [defenseIds[0], defenseIds[1], defenseIds[2]] as [string, string, string],
    counterMonsterIds: controlComp,
    rating: 4.6,
    ratingCount: 7,
    author: 'Legend Tactician',
    date: 'Hôm nay',
    turnOrder: 'Woosa (S3 Khiên + Miễn nhiễm) > Cheongpung (S3 Xóa buff + Reset hồi chiêu) > Dominic (Dồn sát thương)',
    difficulty: 'Trung bình',
    strategy: 'Đội hình toàn diện vừa có khiên miễn nhiễm 3 lượt từ Woosa, vừa có Cheongpung xóa buff + trừ giáp + đẩy lùi thanh tấn công, Dominic tung sát thương chuẩn không sợ khắc hệ.',
  });

  return suggestions;
}
