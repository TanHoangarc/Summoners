import { RTASlot } from '../types';

export interface AiTurnSchedule {
  nextSlotOrders: number[];
  canPickNow: boolean;
  waitingMessage: string | null;
  stage: 'first_pick_self' | 'waiting_enemy' | 'ready_to_pick' | 'lead_and_ban';
}

/**
 * Calculates strictly sequential RTA pick turn requirements:
 * 1. If 'mine' picks first: slot 1 is picked by user without AI suggestion.
 * 2. Only after enemy picks their slots, AI suggests the corresponding response slots for 'mine'.
 *    - Enemy picks 2, 3 -> Mine suggests 4, 5 (NEVER 8, 9).
 *    - Enemy picks 6, 7 -> Mine suggests 8, 9.
 * 3. If 'enemy' picks first:
 *    - Enemy picks 1 -> Mine suggests 2, 3 (NEVER 6, 7 or 10).
 *    - Enemy picks 4, 5 -> Mine suggests 6, 7.
 *    - Enemy picks 8, 9 -> Mine suggests 10.
 */
export function computeAiTurnSchedule(
  firstPickSide: 'mine' | 'enemy',
  myTeam: RTASlot[],
  enemyTeam: RTASlot[]
): AiTurnSchedule {
  const isMySlotFilled = (pickOrder: number) =>
    Boolean(myTeam.find((s) => s.pickOrder === pickOrder)?.monsterId);

  const isEnemySlotFilled = (pickOrder: number) =>
    Boolean(enemyTeam.find((s) => s.pickOrder === pickOrder)?.monsterId);

  const myFilledCount = myTeam.filter((s) => Boolean(s.monsterId)).length;
  const enemyFilledCount = enemyTeam.filter((s) => Boolean(s.monsterId)).length;

  // Lead & Ban Phase
  if (myFilledCount >= 5 && enemyFilledCount >= 5) {
    return {
      nextSlotOrders: [],
      canPickNow: false,
      waitingMessage: null,
      stage: 'lead_and_ban',
    };
  }

  if (firstPickSide === 'mine') {
    // Phase 1: Slot 1 (Mine picks first)
    if (!isMySlotFilled(1)) {
      return {
        nextSlotOrders: [],
        canPickNow: true,
        waitingMessage:
          'Bạn có quyền Chọn trước (First Pick #1). Hãy tự chọn quái thú mở màn ưa thích của bạn. Sau khi Team Địch chọn vị trí #2 và #3, AI sẽ phân tích và gợi ý các quái thú khắc chế tiếp theo.',
        stage: 'first_pick_self',
      };
    }

    // Phase 2: Mine needs to pick [4, 5]
    if (!isMySlotFilled(4) || !isMySlotFilled(5)) {
      // Must wait for enemy to pick BOTH 2 and 3!
      const enemyHasBoth2And3 = isEnemySlotFilled(2) && isEnemySlotFilled(3);
      if (!enemyHasBoth2And3) {
        const hasOne = isEnemySlotFilled(2) || isEnemySlotFilled(3);
        const filledSlot = isEnemySlotFilled(2) ? '2' : '3';
        const missingSlot = isEnemySlotFilled(2) ? '3' : '2';
        return {
          nextSlotOrders: [],
          canPickNow: false,
          waitingMessage: hasOne
            ? `Team Địch đã pick vị trí #${filledSlot}. Đang chờ Team Địch pick tiếp vị trí #${missingSlot} để AI phân tích cặp quái thú khắc chế cho vị trí #4 và #5...`
            : 'Đang chờ Team Địch pick vị trí #2 và #3 để AI phân tích quái thú khắc chế cho vị trí #4 và #5...',
          stage: 'waiting_enemy',
        };
      }
      // Enemy has picked both 2 and 3! Suggest empty slots in [4, 5] ONLY (never 8, 9)
      const orders = [4, 5].filter((order) => !isMySlotFilled(order));
      return {
        nextSlotOrders: orders,
        canPickNow: true,
        waitingMessage: null,
        stage: 'ready_to_pick',
      };
    }

    // Phase 3: Mine needs to pick [8, 9]
    if (!isMySlotFilled(8) || !isMySlotFilled(9)) {
      // Must wait for enemy to pick BOTH 6 and 7!
      const enemyHasBoth6And7 = isEnemySlotFilled(6) && isEnemySlotFilled(7);
      if (!enemyHasBoth6And7) {
        const hasOne = isEnemySlotFilled(6) || isEnemySlotFilled(7);
        const filledSlot = isEnemySlotFilled(6) ? '6' : '7';
        const missingSlot = isEnemySlotFilled(6) ? '7' : '6';
        return {
          nextSlotOrders: [],
          canPickNow: false,
          waitingMessage: hasOne
            ? `Team Địch đã pick vị trí #${filledSlot}. Đang chờ Team Địch pick tiếp vị trí #${missingSlot} để AI phân tích quái thú khắc chế cho vị trí #8 và #9...`
            : 'Đang chờ Team Địch pick vị trí #6 và #7 để AI phân tích quái thú khắc chế cho vị trí #8 và #9...',
          stage: 'waiting_enemy',
        };
      }
      // Enemy has picked both 6 and 7! Suggest empty slots in [8, 9] ONLY
      const orders = [8, 9].filter((order) => !isMySlotFilled(order));
      return {
        nextSlotOrders: orders,
        canPickNow: true,
        waitingMessage: null,
        stage: 'ready_to_pick',
      };
    }

    // Mine has picked all 5, waiting for enemy last pick (10)
    return {
      nextSlotOrders: [],
      canPickNow: false,
      waitingMessage:
        'Đang chờ Team Địch chọn quái thú cuối cùng (#10) để bước vào giai đoạn Cấm & Leader...',
      stage: 'waiting_enemy',
    };
  }

  // firstPickSide === 'enemy'
  // Phase 1: Enemy picks Slot 1 -> Mine picks [2, 3]
  if (!isMySlotFilled(2) || !isMySlotFilled(3)) {
    if (!isEnemySlotFilled(1)) {
      return {
        nextSlotOrders: [],
        canPickNow: false,
        waitingMessage:
          'Đang chờ Team Địch First Pick vị trí #1 để AI bắt đầu phân tích đội hình khắc chế...',
        stage: 'waiting_enemy',
      };
    }
    const orders = [2, 3].filter((order) => !isMySlotFilled(order));
    return {
      nextSlotOrders: orders,
      canPickNow: true,
      waitingMessage: null,
      stage: 'ready_to_pick',
    };
  }

  // Phase 2: Enemy picks [4, 5] -> Mine picks [6, 7]
  if (!isMySlotFilled(6) || !isMySlotFilled(7)) {
    const enemyHasBoth4And5 = isEnemySlotFilled(4) && isEnemySlotFilled(5);
    if (!enemyHasBoth4And5) {
      const hasOne = isEnemySlotFilled(4) || isEnemySlotFilled(5);
      const filledSlot = isEnemySlotFilled(4) ? '4' : '5';
      const missingSlot = isEnemySlotFilled(4) ? '5' : '4';
      return {
        nextSlotOrders: [],
        canPickNow: false,
        waitingMessage: hasOne
          ? `Team Địch đã pick vị trí #${filledSlot}. Đang chờ Team Địch pick tiếp vị trí #${missingSlot} để AI phân tích cặp khắc chế cho #6 và #7...`
          : 'Đang chờ Team Địch pick vị trí #4 và #5 để AI phân tích khắc chế cho vị trí #6 và #7...',
        stage: 'waiting_enemy',
      };
    }
    const orders = [6, 7].filter((order) => !isMySlotFilled(order));
    return {
      nextSlotOrders: orders,
      canPickNow: true,
      waitingMessage: null,
      stage: 'ready_to_pick',
    };
  }

  // Phase 3: Enemy picks [8, 9] -> Mine picks [10]
  if (!isMySlotFilled(10)) {
    const enemyHasBoth8And9 = isEnemySlotFilled(8) && isEnemySlotFilled(9);
    if (!enemyHasBoth8And9) {
      const hasOne = isEnemySlotFilled(8) || isEnemySlotFilled(9);
      const filledSlot = isEnemySlotFilled(8) ? '8' : '9';
      const missingSlot = isEnemySlotFilled(8) ? '9' : '8';
      return {
        nextSlotOrders: [],
        canPickNow: false,
        waitingMessage: hasOne
          ? `Team Địch đã pick vị trí #${filledSlot}. Đang chờ Team Địch pick tiếp vị trí #${missingSlot} để AI phân tích quân bài chốt hạ (#10)...`
          : 'Đang chờ Team Địch pick vị trí #8 và #9 để AI phân tích quân bài chốt hạ (#10)...',
        stage: 'waiting_enemy',
      };
    }
    return {
      nextSlotOrders: [10],
      canPickNow: true,
      waitingMessage: null,
      stage: 'ready_to_pick',
    };
  }

  return {
    nextSlotOrders: [],
    canPickNow: false,
    waitingMessage: null,
    stage: 'lead_and_ban',
  };
}
