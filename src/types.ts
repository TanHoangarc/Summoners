export type ElementType = 'water' | 'fire' | 'wind' | 'light' | 'dark';

export type MonsterRole = 'attack' | 'defense' | 'hp' | 'support';

export interface Monster {
  id: string;
  name: string;
  awakenedName?: string;
  element: ElementType;
  naturalStars: number;
  avatarUrl: string;
  role: MonsterRole;
  baseSpeed: number;
  leaderSkill?: string;
  tags?: string[];
  description?: string;
  isCustom?: boolean;
}

export interface RTASlot {
  monsterId: string | null;
  isBanned: boolean;
  isLeader: boolean;
  pickOrder: number; // 1 to 10
}

export interface RTAMatchRecord {
  id: string;
  createdAt: number;
  myScore?: number;
  enemyScore?: number;
  myPlayerName?: string;
  enemyPlayerName?: string;
  result: 'VICTORY' | 'DEFEAT';
  myTeam: RTASlot[];
  enemyTeam: RTASlot[];
  notes?: string;
}

export interface SiegeCounterStrategy {
  id: string;
  defenseMonsterIds: [string, string, string];
  counterMonsterIds: [string, string, string];
  rating?: number;
  ratingCount?: number;
  author?: string;
  date: string;
  strategy: string;
  turnOrder?: string;
  difficulty?: 'Dễ' | 'Trung bình' | 'Yêu cầu rune cao';
  isCustom?: boolean;
  updatedAt?: string;
}

export interface SavedSiegeDefense {
  id: string;
  name: string;
  monsterIds: [string, string, string];
  leaderMonsterId?: string;
  notes?: string;
  createdAt: number;
}

