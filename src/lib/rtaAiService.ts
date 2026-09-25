import { Monster, RTASlot, RTAAiCoachAnalysis } from '../types';

export interface RTAAiRequestPayload {
  firstPickSide: 'mine' | 'enemy';
  myTeam: Array<{
    pickOrder: number;
    monsterId: string | null;
    monsterName?: string;
    element?: string;
    role?: string;
  }>;
  enemyTeam: Array<{
    pickOrder: number;
    monsterId: string | null;
    monsterName?: string;
    element?: string;
    role?: string;
  }>;
  nextSlotOrders: number[];
  excludedMonsterIds?: string[];
  waitingMessage?: string;
  canPickNow?: boolean;
  availableMonsters: Array<{
    id: string;
    name: string;
    element: string;
    role: string;
    leaderSkill?: string;
  }>;
}

/**
 * Fetch AI Pro Coach analysis and recommendations for RTA draft
 */
export async function fetchRTAAiCoachAnalysis(
  payload: RTAAiRequestPayload
): Promise<RTAAiCoachAnalysis> {
  const response = await fetch('/api/ai-rta-pro-coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `Không thể kết nối đến máy chủ AI (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  return data.analysis as RTAAiCoachAnalysis;
}
