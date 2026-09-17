import { ElementType, Monster, MonsterRole } from '../types';
import swgtMonstersData from '../data/swgtMonstersMap.json';

export interface AutoDetectedMonsterInfo {
  name: string;
  awakenedName?: string;
  element: ElementType;
  naturalStars: number;
  role: MonsterRole;
  leaderSkill?: string;
  avatarUrl?: string;
  confidence: number;
}

export interface SwgtMonsterEntry {
  name: string;
  unawakened: string;
  element: string;
  naturalStars: number;
  iconUrl: string;
  com2usId: string;
  role?: string;
  leaderSkill?: string;
}

const swgtMonstersMap = swgtMonstersData as Record<string, SwgtMonsterEntry>;

/**
 * Swarfarm family mapping: unit_icon_XXXX_E_S.png
 * XXXX: family, E: element (0:fire, 1:water, 2:wind, 3:light, 4:dark)
 */
const SWARFARM_FAMILY_MAP: Record<
  string,
  {
    family: string;
    names: {
      fire?: { name: string; role?: MonsterRole; leaderSkill?: string };
      water?: { name: string; role?: MonsterRole; leaderSkill?: string };
      wind?: { name: string; role?: MonsterRole; leaderSkill?: string };
      light?: { name: string; role?: MonsterRole; leaderSkill?: string };
      dark?: { name: string; role?: MonsterRole; leaderSkill?: string };
    };
  }
> = {
  '0006': {
    family: 'Dragon',
    names: {
      fire: { name: 'Zaiross', role: 'attack', leaderSkill: 'Tăng 33% Tấn công trong Đấu trường (Arena Atk 33%)' },
      water: { name: 'Verad', role: 'defense', leaderSkill: 'Tăng 33% Phòng thủ trong Đấu trường (Arena Def 33%)' },
      wind: { name: 'Jamire', role: 'support', leaderSkill: 'Tăng 24% Tốc độ mọi nơi (Universal Spd 24%)' },
      light: { name: 'Zerath', role: 'hp', leaderSkill: 'Tăng 50% Máu quái Ánh sáng (Light HP 50%)' },
      dark: { name: 'Grogen', role: 'attack', leaderSkill: 'Tăng 33% Tỉ lệ chí mạng trong Đấu trường (Arena CR 33%)' },
    },
  },
  '0007': {
    family: 'Archangel',
    names: {
      fire: { name: 'Velajuel', role: 'defense', leaderSkill: 'Tăng 50% Phòng thủ quái Lửa (Fire Def 50%)' },
      water: { name: 'Ariel', role: 'support', leaderSkill: 'Tăng 50% Máu quái Nước (Water HP 50%)' },
      wind: { name: 'Eladriel', role: 'support', leaderSkill: 'Tăng 50% Máu quái Gió (Wind HP 50%)' },
      light: { name: 'Artamiel', role: 'defense', leaderSkill: 'Tăng 33% Phòng thủ trong Đấu trường (Arena Def 33%)' },
      dark: { name: 'Fermion', role: 'defense', leaderSkill: 'Tăng 33% Phòng thủ mọi nơi (Universal Def 33%)' },
    },
  },
  '0014': {
    family: 'Phoenix',
    names: {
      fire: { name: 'Perna', role: 'attack', leaderSkill: 'Tăng 44% Tấn công trong Ngục tối (Dungeon Atk 44%)' },
      water: { name: 'Sigmarus', role: 'attack', leaderSkill: 'Tăng 44% Máu trong Ngục tối (Dungeon HP 44%)' },
      wind: { name: 'Teshar', role: 'attack', leaderSkill: 'Tăng 33% Tỉ lệ chí mạng trong Ngục tối (Dungeon CR 33%)' },
      light: { name: 'Eludia', role: 'attack', leaderSkill: 'Tăng 21% Tỉ lệ chí mạng mọi nơi (Universal CR 21%)' },
      dark: { name: 'Jaara', role: 'attack', leaderSkill: 'Tăng 33% Tấn công trong Đấu trường (Arena Atk 33%)' },
    },
  },
  '0016': {
    family: 'Chimera',
    names: {
      fire: { name: 'Rakan', role: 'hp', leaderSkill: 'Tăng 50% Máu quái Lửa (Fire HP 50%)' },
      water: { name: 'Taor', role: 'attack', leaderSkill: 'Tăng 50% Máu quái Nước (Water HP 50%)' },
      wind: { name: 'Lagmaron', role: 'attack', leaderSkill: 'Tăng 50% Máu quái Gió (Wind HP 50%)' },
      light: { name: 'Shan', role: 'hp', leaderSkill: 'Tăng 50% Máu quái Ánh sáng (Light HP 50%)' },
      dark: { name: 'Zeratu', role: 'attack', leaderSkill: 'Tăng 50% Kháng quái Bóng tối (Dark Res 50%)' },
    },
  },
  '0017': {
    family: 'Valkyrja',
    names: {
      fire: { name: 'Vanessa', role: 'support', leaderSkill: 'Tăng 33% Tốc độ trong Đấu trường (Arena Spd 33%)' },
      water: { name: 'Camilla', role: 'hp', leaderSkill: 'Tăng 33% Tỉ lệ chí mạng trong Đấu trường (Arena CR 33%)' },
      wind: { name: 'Katarina', role: 'attack', leaderSkill: 'Tăng 55% Kháng trong Đấu trường (Arena Res 55%)' },
      light: { name: 'Akroma', role: 'defense', leaderSkill: 'Tăng 44% Máu trong Đấu trường (Arena HP 44%)' },
      dark: { name: 'Trinity', role: 'hp', leaderSkill: 'Tăng 33% Tốc độ trong Đấu trường (Arena Spd 33%)' },
    },
  },
  '0020': {
    family: 'Oracle',
    names: {
      fire: { name: 'Juno', role: 'attack', leaderSkill: 'Tăng 24% Tỉ lệ chí mạng trong Đấu trường (Arena CR 24%)' },
      water: { name: 'Praha', role: 'support', leaderSkill: 'Tăng 41% Kháng trong Đấu trường (Arena Res 41%)' },
      wind: { name: 'Seara', role: 'attack', leaderSkill: 'Tăng 24% Tốc độ mọi nơi (Universal Spd 24%)' },
      light: { name: 'Laima', role: 'support', leaderSkill: 'Tăng 24% Tỉ lệ chí mạng mọi nơi (Universal CR 24%)' },
      dark: { name: 'Giana', role: 'attack', leaderSkill: 'Tăng 41% Kháng trong Đấu trường (Arena Res 41%)' },
    },
  },
  '0022': {
    family: 'Beast Monk',
    names: {
      fire: { name: 'Kumar', role: 'hp', leaderSkill: 'Tăng 33% Tỉ lệ chí mạng trong Ngục tối (Dungeon CR 33%)' },
      water: { name: 'Chandra', role: 'hp', leaderSkill: 'Tăng 50% Kháng quái Nước (Water Res 50%)' },
      wind: { name: 'Ritesh', role: 'hp', leaderSkill: 'Tăng 33% Tỉ lệ chí mạng trong Ngục tối (Dungeon CR 33%)' },
      light: { name: 'Shazam', role: 'hp', leaderSkill: 'Tăng 33% Máu trong Bang hội (Guild HP 33%)' },
      dark: { name: 'Rahul', role: 'hp', leaderSkill: 'Tăng 33% Tốc độ trong Bang hội (Guild Spd 33%)' },
    },
  },
  '0024': {
    family: 'Dragon Knight',
    names: {
      fire: { name: 'Laika', role: 'attack', leaderSkill: 'Tăng 50% Phòng thủ quái Lửa (Fire Def 50%)' },
      water: { name: 'Chow', role: 'hp', leaderSkill: 'Tăng 50% Máu quái Nước (Water HP 50%)' },
      wind: { name: 'Leo', role: 'hp', leaderSkill: 'Tăng 50% Phòng thủ quái Gió (Wind Def 50%)' },
      light: { name: 'Jager', role: 'attack', leaderSkill: 'Tăng 50% Tấn công quái Ánh sáng (Light Atk 50%)' },
      dark: { name: 'Ragdoll', role: 'hp', leaderSkill: 'Tăng 50% Kháng quái Bóng tối (Dark Res 50%)' },
    },
  },
  '0027': {
    family: 'Polar Queen',
    names: {
      fire: { name: 'Brandia', role: 'attack', leaderSkill: 'Tăng 44% Tấn công trong Đấu trường (Arena Atk 44%)' },
      water: { name: 'Alicia', role: 'attack', leaderSkill: 'Tăng 44% Tấn công trong Đấu trường (Arena Atk 44%)' },
      wind: { name: 'Tiana', role: 'support', leaderSkill: 'Tăng 44% Phòng thủ trong Đấu trường (Arena Def 44%)' },
      light: { name: 'Elenoa', role: 'support', leaderSkill: 'Tăng 44% Máu trong Đấu trường (Arena HP 44%)' },
      dark: { name: 'Lydia', role: 'attack', leaderSkill: 'Tăng 44% Tấn công trong Đấu trường (Arena Atk 44%)' },
    },
  },
  '0028': {
    family: 'Ifrit',
    names: {
      fire: { name: 'Tesarion', role: 'support', leaderSkill: 'Tăng 33% Kháng mọi nơi (Universal Res 33%)' },
      water: { name: 'Theomars', role: 'attack', leaderSkill: 'Tăng 24% Tỉ lệ bạo kích mọi nơi (All Crit Rate 24%)' },
      wind: { name: 'Akhamamir', role: 'attack', leaderSkill: 'Tăng 33% Máu trong Bang hội (Guild HP 33%)' },
      light: { name: 'Elsharion', role: 'attack', leaderSkill: 'Tăng 21% Tỉ lệ chí mạng mọi nơi (Universal CR 21%)' },
      dark: { name: 'Veromos', role: 'hp', leaderSkill: 'Tăng 33% Máu mọi nơi (Universal HP 33%)' },
    },
  },
  '0038': {
    family: 'Panda Warrior',
    names: {
      fire: { name: 'Xiong Fei', role: 'defense', leaderSkill: 'Tăng 33% Phòng thủ trong Bang hội (Guild Def 33%)' },
      water: { name: 'Mo Long', role: 'hp', leaderSkill: 'Tăng 33% Máu trong Đấu trường (Arena HP 33%)' },
      wind: { name: 'Feng Yan', role: 'defense', leaderSkill: 'Tăng 33% Phòng thủ trong Bang hội (Guild Def 33%)' },
      light: { name: 'Tian Lang', role: 'hp', leaderSkill: 'Tăng 33% Máu trong Bang hội (Guild HP 33%)' },
      dark: { name: 'Mi Ying', role: 'attack', leaderSkill: 'Tăng 33% Tấn công trong Bang hội (Guild Atk 33%)' },
    },
  },
  '0046': {
    family: 'Paladin',
    names: {
      fire: { name: 'Ophilia', role: 'hp', leaderSkill: 'Tăng 44% Máu đồng minh trong Đấu trường (Arena HP 44%)' },
      water: { name: 'Josephine', role: 'hp', leaderSkill: 'Tăng 44% Kháng trong Đấu trường (Arena Res 44%)' },
      wind: { name: 'Louise', role: 'hp', leaderSkill: 'Tăng 44% Máu trong Bang hội (Guild HP 44%)' },
      light: { name: 'Jeanne', role: 'hp', leaderSkill: 'Tăng 33% Kháng trong Bang hội (Guild Res 33%)' },
      dark: { name: 'Leona', role: 'defense', leaderSkill: 'Tăng 44% Phòng thủ trong Bang hội (Guild Def 44%)' },
    },
  },
  '0049': {
    family: 'Lightning Emperor',
    names: {
      fire: { name: 'Bael', role: 'attack', leaderSkill: 'Tăng 33% Tấn công trong Đấu trường (Arena Atk 33%)' },
      water: { name: 'Bolverk', role: 'hp', leaderSkill: 'Tăng 33% Máu trong Đấu trường (Arena HP 33%)' },
      wind: { name: 'Odin', role: 'attack', leaderSkill: 'Tăng 33% Tấn công trong Bang hội (Guild Atk 33%)' },
      light: { name: 'Geldnir', role: 'support', leaderSkill: 'Tăng 33% Tốc độ đánh trong Bang hội (Guild Spd 33%)' },
      dark: { name: 'Herteit', role: 'attack', leaderSkill: 'Tăng 33% Phòng thủ trong Bang hội (Guild Def 33%)' },
    },
  },
  '0054': {
    family: 'Slayer / Striker',
    names: {
      fire: { name: 'Karnal', role: 'hp', leaderSkill: 'Tăng 33% Máu trong Đấu trường (Arena HP 33%)' },
      water: { name: 'Borgnine', role: 'hp', leaderSkill: 'Tăng 33% Máu trong Bang hội (Guild HP 33%)' },
      wind: { name: 'Sagar', role: 'support', leaderSkill: 'Tăng 33% Tấn công trong Đấu trường (Arena Atk 33%)' },
      light: { name: 'Craig', role: 'support', leaderSkill: 'Tăng 33% Tấn công trong Bang hội (Guild Atk 33%)' },
      dark: { name: 'Gurkha', role: 'hp', leaderSkill: 'Tăng 33% Phòng thủ trong Bang hội (Guild Def 33%)' },
    },
  },
  '0057': {
    family: 'Sky Surfer',
    names: {
      fire: { name: 'John', role: 'attack', leaderSkill: 'Tăng 24% Tốc độ trong Bang hội (Guild Spd 24%)' },
      water: { name: 'Miles', role: 'attack', leaderSkill: 'Tăng 24% Tốc độ trong Đấu trường (Arena Spd 24%)' },
      wind: { name: 'Oliver', role: 'support', leaderSkill: 'Tăng 24% Tốc độ trong Đấu trường (Arena Spd 24%)' },
      light: { name: 'Daniel', role: 'support', leaderSkill: 'Tăng 24% Tốc độ trong Bang hội (Guild Spd 24%)' },
      dark: { name: 'Jackson', role: 'support', leaderSkill: 'Tăng 24% Tốc độ mọi nơi (Universal Spd 24%)' },
    },
  },
  '0058': {
    family: 'Totemist',
    names: {
      fire: { name: 'Nora', role: 'support', leaderSkill: 'Tăng 38% Máu quái Lửa (Fire HP 38%)' },
      water: { name: 'Aaliyah', role: 'support', leaderSkill: 'Tăng 38% Kháng hiệu ứng đồng minh hệ Nước (Water Resistance 38%)' },
      wind: { name: 'Riley', role: 'support', leaderSkill: 'Tăng 38% Kháng quái Gió (Wind Res 38%)' },
      light: { name: 'Ella', role: 'support', leaderSkill: 'Tăng 38% Kháng quái Ánh sáng (Light Res 38%)' },
      dark: { name: 'Maya', role: 'defense', leaderSkill: 'Tăng 38% Phòng thủ quái Bóng tối (Dark Def 38%)' },
    },
  },
};

/**
 * Intelligent parser that extracts monster details from avatar URL or existing monster dataset
 */
export function autoDetectMonsterFromUrl(
  url: string,
  existingMonsters: Monster[] = []
): AutoDetectedMonsterInfo | null {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();

  // 1. Direct match in user existing monsters
  const directMatch = existingMonsters.find(
    (m) => m.avatarUrl && m.avatarUrl.trim().toLowerCase() === cleanUrl.toLowerCase()
  );
  if (directMatch) {
    return {
      name: directMatch.name,
      awakenedName: directMatch.awakenedName,
      element: directMatch.element,
      naturalStars: directMatch.naturalStars,
      role: directMatch.role,
      leaderSkill: directMatch.leaderSkill,
      avatarUrl: directMatch.avatarUrl,
      confidence: 1.0,
    };
  }

  // 2. Official 940-monster SWGT cloudfront map
  // Checks unit_icon_XXXX_E_A.png patterns in URL (e.g. unit_icon_0027_4_1.png)
  const fileMatch = cleanUrl.match(/(unit_icon_[a-zA-Z0-9_]+\.png)/i);
  const matchedFilename = fileMatch
    ? fileMatch[1].toLowerCase()
    : cleanUrl.split(/[?#]/)[0].split('/').pop()?.toLowerCase();

  if (matchedFilename) {
    for (const [key, entry] of Object.entries(swgtMonstersMap)) {
      if (key.toLowerCase() === matchedFilename) {
        return {
          name: entry.name,
          awakenedName: `${entry.unawakened} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})`,
          element: entry.element as ElementType,
          naturalStars: entry.naturalStars,
          role: (entry.role as MonsterRole) || 'attack',
          leaderSkill: entry.leaderSkill || undefined,
          avatarUrl: cleanUrl,
          confidence: 1.0,
        };
      }
    }
  }

  // 3. Check Com2uS ID in query string (e.g., com2usID=17415)
  const idMatch = cleanUrl.match(/com2us(?:monster)?id[=:](\d+)/i);
  if (idMatch) {
    const targetId = idMatch[1];
    for (const entry of Object.values(swgtMonstersMap)) {
      if (entry.com2usId === targetId) {
        return {
          name: entry.name,
          awakenedName: `${entry.unawakened} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})`,
          element: entry.element as ElementType,
          naturalStars: entry.naturalStars,
          role: (entry.role as MonsterRole) || 'attack',
          leaderSkill: entry.leaderSkill || undefined,
          avatarUrl: entry.iconUrl,
          confidence: 0.98,
        };
      }
    }
  }

  // 4. Check if monster name is contained in the URL filename or path
  const lowerUrl = cleanUrl.toLowerCase();
  for (const entry of Object.values(swgtMonstersMap)) {
    const rawName = entry.name.toLowerCase();
    if (
      rawName.length >= 3 &&
      (lowerUrl.includes(`/${rawName}.`) ||
        lowerUrl.includes(`/${rawName}_`) ||
        lowerUrl.includes(`-${rawName}.`) ||
        lowerUrl.includes(`_${rawName}.`) ||
        lowerUrl.includes(`/${rawName}/`))
    ) {
      return {
        name: entry.name,
        awakenedName: `${entry.unawakened} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})`,
        element: entry.element as ElementType,
        naturalStars: entry.naturalStars,
        role: (entry.role as MonsterRole) || 'attack',
        leaderSkill: entry.leaderSkill || undefined,
        avatarUrl: cleanUrl,
        confidence: 0.95,
      };
    }
  }

  // 5. Check if URL matches existing monster names
  for (const m of existingMonsters) {
    const rawName = m.name.toLowerCase();
    if (
      rawName.length >= 3 &&
      (lowerUrl.includes(`/${rawName}.`) ||
        lowerUrl.includes(`/${rawName}_`) ||
        lowerUrl.includes(`-${rawName}.`))
    ) {
      return {
        name: m.name,
        awakenedName: m.awakenedName,
        element: m.element,
        naturalStars: m.naturalStars,
        role: m.role,
        leaderSkill: m.leaderSkill,
        avatarUrl: m.avatarUrl,
        confidence: 0.9,
      };
    }
  }

  // 6. Generic pattern extraction: unit_icon_XXXX_E_S.png (e.g. Swarfarm)
  const legacyMatch = cleanUrl.match(/unit_icon_(\d{4})_(\d)_(\d)/i);
  if (legacyMatch) {
    const familyCode = legacyMatch[1];
    const elemCode = parseInt(legacyMatch[2], 10);
    const starGrade = parseInt(legacyMatch[3], 10) || 5;

    const elemMap: Record<number, ElementType> = {
      0: 'fire',
      1: 'water',
      2: 'wind',
      3: 'light',
      4: 'dark',
    };
    const detectedElement = elemMap[elemCode] || 'water';

    const familyData = SWARFARM_FAMILY_MAP[familyCode];
    if (familyData && familyData.names[detectedElement]) {
      const monsterInfo = familyData.names[detectedElement]!;
      return {
        name: monsterInfo.name,
        awakenedName: `${familyData.family} (${detectedElement.charAt(0).toUpperCase() + detectedElement.slice(1)})`,
        element: detectedElement,
        naturalStars: starGrade,
        role: monsterInfo.role || 'attack',
        leaderSkill: monsterInfo.leaderSkill,
        avatarUrl: cleanUrl,
        confidence: 0.95,
      };
    }

    return {
      name: '',
      element: detectedElement,
      naturalStars: starGrade,
      role: 'attack',
      avatarUrl: cleanUrl,
      confidence: 0.6,
    };
  }

  return null;
}

/**
 * Search the 940-monster database by name or family for instant suggestion and auto-complete
 */
export function searchMonsterCatalog(query: string): SwgtMonsterEntry[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: SwgtMonsterEntry[] = [];
  const seen = new Set<string>();

  for (const entry of Object.values(swgtMonstersMap)) {
    if (seen.has(entry.name)) continue;
    if (
      entry.name.toLowerCase().startsWith(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.unawakened.toLowerCase().includes(q)
    ) {
      seen.add(entry.name);
      results.push(entry);
      if (results.length >= 8) break;
    }
  }

  return results;
}
