import { Monster } from '../types';

export interface GenerateStrategyResult {
  turnOrder?: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Yêu cầu rune cao';
  strategy: string;
  source?: string;
}

/**
 * Calls backend Gemini AI endpoint to generate tactical strategy and kill order
 * for a Siege Defense vs Counter matchup.
 */
export async function fetchAICounterStrategy(
  defenseMonsters: Monster[],
  counterMonsters: Monster[]
): Promise<GenerateStrategyResult> {
  const payload = {
    defenseMonsters: defenseMonsters.map((m) => ({
      name: m.name,
      element: m.element,
      role: m.role,
      leaderSkill: m.leaderSkill,
      tags: m.tags,
      description: m.description,
    })),
    counterMonsters: counterMonsters.map((m) => ({
      name: m.name,
      element: m.element,
      role: m.role,
      leaderSkill: m.leaderSkill,
      tags: m.tags,
      description: m.description,
    })),
  };

  const response = await fetch('/api/ai-counter-strategy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Yêu cầu thất bại (mã ${response.status})`);
  }

  const data = await response.json();
  return {
    turnOrder: data.turnOrder || '',
    difficulty: data.difficulty || 'Trung bình',
    strategy: data.strategy || '',
    source: data.source,
  };
}
