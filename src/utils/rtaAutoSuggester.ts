import { Monster, RTAMatchRecord, RTASlot } from '../types';
import { getMonsterById } from './monsterHelpers';

export interface AutoSuggestionState {
  isActive: boolean;
  stage: 'pick_step' | 'lead_and_ban' | 'idle';
  stepDescription?: string;
  targetPickOrders: number[]; // e.g. [4, 5] or [8, 9] or [2, 3] or [6, 7] or [10]
  suggestedMonstersByOrder: { [pickOrder: number]: Monster };
  suggestedLeaderMonsterId: string | null;
  suggestedBanMonsterId: string | null;
  sourceMatchInfo?: string;
}

/**
 * Thuật toán phân tích và đưa ra gợi ý tự động (Chế độ Auto) cho RTA
 * Hỗ trợ 2 kịch bản theo đúng quy luật nháp đấu:
 * 
 * 1. Trường hợp Team Trái (First Pick = mine):
 *    - Chọn #1, #2, #3 -> Gợi ý #4, #5 dưới dạng mờ để chọn nhanh
 *    - Chọn #6, #7 -> Gợi ý #8, #9
 *    - Chọn #10 (Đủ 10 pet) -> Gợi ý Leader & Cấm theo lịch sử
 * 
 * 2. Trường hợp Team Phải (First Pick = enemy):
 *    - Chọn #1 -> Gợi ý #2, #3 dưới dạng mờ để chọn nhanh
 *    - Chọn #4, #5 -> Gợi ý #6, #7
 *    - Chọn #8, #9 -> Gợi ý #10
 *    - Đủ 10 pet -> Gợi ý Leader & Cấm theo lịch sử
 */
export function computeRTAAutoSuggestions(
  firstPickSide: 'mine' | 'enemy',
  myTeam: RTASlot[],
  enemyTeam: RTASlot[],
  matchHistory: RTAMatchRecord[],
  allMonsters: Monster[],
  favoriteIds: string[] = []
): AutoSuggestionState {
  // Bản đồ các vị trí đã chọn (1 -> 10)
  const pickMap: { [order: number]: string | null } = {};
  for (let i = 1; i <= 10; i++) {
    pickMap[i] = null;
  }

  myTeam.forEach((s) => {
    pickMap[s.pickOrder] = s.monsterId;
  });
  enemyTeam.forEach((s) => {
    pickMap[s.pickOrder] = s.monsterId;
  });

  // Tập hợp các quái thú đã có trên bàn cờ (để không gợi ý trùng lặp)
  const pickedIds = new Set<string>();
  Object.values(pickMap).forEach((id) => {
    if (id) pickedIds.add(id);
  });

  const enemyPickedCount = enemyTeam.filter((s) => Boolean(s.monsterId)).length;
  const myPickedCount = myTeam.filter((s) => Boolean(s.monsterId)).length;

  const allTenPicked =
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((o) => Boolean(pickMap[o])) ||
    (myPickedCount === 5 && enemyPickedCount === 5);

  // Luôn tính toán sẵn Leader và Ban tối ưu theo lịch sử đấu hiện tại
  const {
    suggestedLeadId,
    suggestedBanId,
    matchInfo: leadBanMatchInfo,
  } = computeLeadAndBan(myTeam, enemyTeam, matchHistory, allMonsters);

  // =========================================================================
  // GIAI ĐOẠN ĐỦ 10 QUÁI THÚ: GỢI Ý LEAD VÀ CẤM (LEADER & BAN)
  // =========================================================================
  if (allTenPicked) {
    return {
      isActive: true,
      stage: 'lead_and_ban',
      stepDescription: 'Đã chọn đủ 10 Pet. Gợi ý Leader cho Team Tôi và Cấm Pet nguy hiểm nhất Team Địch theo lịch sử!',
      targetPickOrders: [],
      suggestedMonstersByOrder: {},
      suggestedLeaderMonsterId: suggestedLeadId,
      suggestedBanMonsterId: suggestedBanId,
      sourceMatchInfo: leadBanMatchInfo,
    };
  }

  // =========================================================================
  // GIAI ĐOẠN CHỌN PET (PICK PHASE): TÙY THEO TEAM TRÁI HAY TEAM PHẢI
  // =========================================================================
  let targetOrders: number[] = [];
  let stepDescription = '';

  if (firstPickSide === 'mine') {
    // --- KỊCH BẢN TEAM TRÁI (Mine là 1st Pick: Mine = [1, 4, 5, 8, 9], Enemy = [2, 3, 6, 7, 10]) ---
    
    // Bước 2: #1, #2, #3, #4, #5, #6, #7 đã chọn -> Gợi ý #8, #9
    if (
      pickMap[1] &&
      pickMap[2] &&
      pickMap[3] &&
      pickMap[4] &&
      pickMap[5] &&
      pickMap[6] &&
      pickMap[7] &&
      (!pickMap[8] || !pickMap[9])
    ) {
      targetOrders = [8, 9].filter((o) => !pickMap[o]);
      stepDescription = 'Gợi ý chọn nhanh Pet #8 & #9 theo lịch sử đấu';
    }
    // Bước 1: #1, #2, #3 đã chọn -> Gợi ý #4, #5
    else if (
      pickMap[1] &&
      pickMap[2] &&
      pickMap[3] &&
      (!pickMap[4] || !pickMap[5])
    ) {
      targetOrders = [4, 5].filter((o) => !pickMap[o]);
      stepDescription = 'Gợi ý chọn nhanh Pet #4 & #5 theo lịch sử đấu';
    }
  } else {
    // --- KỊCH BẢN TEAM PHẢI (Enemy là 1st Pick: Enemy = [1, 4, 5, 8, 9], Mine = [2, 3, 6, 7, 10]) ---

    // Bước 3: #1..#9 đã chọn -> Gợi ý #10
    if (
      pickMap[1] &&
      pickMap[2] &&
      pickMap[3] &&
      pickMap[4] &&
      pickMap[5] &&
      pickMap[6] &&
      pickMap[7] &&
      pickMap[8] &&
      pickMap[9] &&
      !pickMap[10]
    ) {
      targetOrders = [10];
      stepDescription = 'Gợi ý chọn nhanh Pet #10 theo lịch sử đấu';
    }
    // Bước 2: #1, #2, #3, #4, #5 đã chọn -> Gợi ý #6, #7
    else if (
      pickMap[1] &&
      pickMap[2] &&
      pickMap[3] &&
      pickMap[4] &&
      pickMap[5] &&
      (!pickMap[6] || !pickMap[7])
    ) {
      targetOrders = [6, 7].filter((o) => !pickMap[o]);
      stepDescription = 'Gợi ý chọn nhanh Pet #6 & #7 theo lịch sử đấu';
    }
    // Bước 1: #1 đã chọn -> Gợi ý #2, #3
    else if (pickMap[1] && (!pickMap[2] || !pickMap[3])) {
      targetOrders = [2, 3].filter((o) => !pickMap[o]);
      stepDescription = 'Gợi ý chọn nhanh Pet #2 & #3 theo lịch sử đấu';
    }
  }

  // Nếu không rơi vào các thời điểm gợi ý (chưa đến lượt hoặc đối thủ chưa pick xong)
  if (targetOrders.length === 0) {
    return {
      isActive: false,
      stage: 'idle',
      targetPickOrders: [],
      suggestedMonstersByOrder: {},
      suggestedLeaderMonsterId: suggestedLeadId,
      suggestedBanMonsterId: suggestedBanId,
      sourceMatchInfo: leadBanMatchInfo,
    };
  }

  // Tìm các quái thú gợi ý tốt nhất cho targetOrders
  const { suggestedMonsters, matchInfo } = pickBestMonstersForOrders(
    targetOrders,
    firstPickSide,
    pickMap,
    pickedIds,
    matchHistory,
    allMonsters,
    favoriteIds
  );

  return {
    isActive: true,
    stage: 'pick_step',
    stepDescription,
    targetPickOrders: targetOrders,
    suggestedMonstersByOrder: suggestedMonsters,
    suggestedLeaderMonsterId: suggestedLeadId,
    suggestedBanMonsterId: suggestedBanId,
    sourceMatchInfo: matchInfo,
  };
}

/**
 * Tìm kiếm các quái thú tối ưu từ lịch sử đấu hoặc từ danh sách yêu thích
 */
function pickBestMonstersForOrders(
  targetOrders: number[],
  firstPickSide: 'mine' | 'enemy',
  currentPickMap: { [order: number]: string | null },
  pickedIds: Set<string>,
  matchHistory: RTAMatchRecord[],
  allMonsters: Monster[],
  favoriteIds: string[]
): {
  suggestedMonsters: { [order: number]: Monster };
  matchInfo?: string;
} {
  const result: { [order: number]: Monster } = {};
  const assignedIds = new Set<string>(pickedIds);

  // 1. Chấm điểm các trận trong lịch sử đấu tương đồng với bàn cờ hiện tại
  interface ScoredMatch {
    match: RTAMatchRecord;
    score: number;
    matchingMy: number;
    matchingEnemy: number;
  }

  const scoredMatches: ScoredMatch[] = [];

  matchHistory.forEach((record) => {
    let score = 0;
    let matchingMy = 0;
    let matchingEnemy = 0;

    // Ưu tiên trận thắng
    if (record.result === 'VICTORY') score += 15;

    // Kiểm tra tương đồng lượt pick đầu
    const recordFirstIsMine = record.myTeam.some((s) => s.pickOrder === 1);
    if ((firstPickSide === 'mine') === recordFirstIsMine) {
      score += 10;
    }

    // Tương đồng quái thú Team Tôi
    record.myTeam.forEach((slot) => {
      if (slot.monsterId && pickedIds.has(slot.monsterId)) {
        matchingMy++;
        score += 20;
      }
    });

    // Tương đồng quái thú Team Địch
    record.enemyTeam.forEach((slot) => {
      if (slot.monsterId && pickedIds.has(slot.monsterId)) {
        matchingEnemy++;
        score += 15;
      }
    });

    if (score > 0) {
      scoredMatches.push({ match: record, score, matchingMy, matchingEnemy });
    }
  });

  scoredMatches.sort((a, b) => b.score - a.score);

  let matchInfo: string | undefined = undefined;

  // 2. Tìm quái thú từ các trận đấu điểm cao nhất
  for (const targetOrder of targetOrders) {
    let chosenMonster: Monster | null = null;

    for (const sm of scoredMatches) {
      // Tìm vị trí tương ứng trong trận lịch sử
      const targetSlot = sm.match.myTeam.find((s) => s.pickOrder === targetOrder);
      if (targetSlot && targetSlot.monsterId && !assignedIds.has(targetSlot.monsterId)) {
        const found = getMonsterById(allMonsters, targetSlot.monsterId);
        if (found) {
          chosenMonster = found;
          if (!matchInfo) {
            matchInfo = `Khớp từ trận ${sm.match.result === 'VICTORY' ? 'Thắng' : 'Đấu'} với ${sm.matchingMy} pet đồng minh`;
          }
          break;
        }
      }

      // Nếu không khớp chính xác pickOrder, lấy quái thú bất kỳ trong myTeam của trận đó mà chưa được pick
      for (const slot of sm.match.myTeam) {
        if (slot.monsterId && !assignedIds.has(slot.monsterId)) {
          const found = getMonsterById(allMonsters, slot.monsterId);
          if (found) {
            chosenMonster = found;
            break;
          }
        }
      }
      if (chosenMonster) break;
    }

    // 3. Nếu lịch sử chưa có hoặc hết pet, dùng danh sách Pet Hay Pick (Favorites)
    if (!chosenMonster) {
      for (const favId of favoriteIds) {
        if (!assignedIds.has(favId)) {
          const found = getMonsterById(allMonsters, favId);
          if (found) {
            chosenMonster = found;
            if (!matchInfo) matchInfo = 'Được gợi ý từ danh sách Pet Hay Pick';
            break;
          }
        }
      }
    }

    // 4. Dự phòng: Lấy quái vật meta nat 5 hàng đầu trong hệ thống chưa pick
    if (!chosenMonster) {
      const META_DEFAULTS = [
        'moore',
        'oliver',
        'shizuka',
        'savannah',
        'karnal',
        'woosa',
        'miles',
        'dominic',
        'cheongpung',
        'vanessa',
        'haegang',
        'seara',
        'sagar',
        'charlotte',
        'giou',
      ];
      for (const metaId of META_DEFAULTS) {
        if (!assignedIds.has(metaId)) {
          const found = getMonsterById(allMonsters, metaId);
          if (found) {
            chosenMonster = found;
            break;
          }
        }
      }
    }

    // Gán kết quả nếu tìm thấy
    if (chosenMonster) {
      result[targetOrder] = chosenMonster;
      assignedIds.add(chosenMonster.id);
    }
  }

  return { suggestedMonsters: result, matchInfo };
}

/**
 * Tính toán gợi ý Leader cho Team Tôi và Cấm (Ban) cho Team Địch
 * Ưu tiên TUYỆT ĐỐI theo dữ liệu thực tế trong Lịch Sử Đấu (matchHistory):
 * 1. Khớp đội hình đối đầu (Match-up Similarity): Tìm trận đấu trong lịch sử có đội hình Địch (và Ta) giống nhất.
 *    -> Quái vật địch ĐÃ BỊ CẤM trong trận đấu đó sẽ nhận điểm số áp đảo (+1000 đến +500 điểm).
 * 2. Tần suất bị cấm trong toàn bộ lịch sử (Historical Ban Rate):
 *    -> Quái vật địch nào càng bị cấm nhiều lần trong các trận gặp mặt thì càng được ưu tiên cấm.
 * 3. Chỉ dự phòng theo Heuristic (Lead Tốc độ/Disruptor) khi KHÔNG có bất kỳ dữ liệu cấm nào trong lịch sử.
 */
function computeLeadAndBan(
  myTeam: RTASlot[],
  enemyTeam: RTASlot[],
  matchHistory: RTAMatchRecord[],
  allMonsters: Monster[]
): {
  suggestedLeadId: string | null;
  suggestedBanId: string | null;
  matchInfo?: string;
} {
  const myMonIds = myTeam.map((s) => s.monsterId).filter((id): id is string => Boolean(id));
  const enemyMonIds = enemyTeam.map((s) => s.monsterId).filter((id): id is string => Boolean(id));

  // --- 1. TÌM SUGGESTED BAN (CẤM ĐỊCH DỰA THEO LỊCH SỬ ĐẤU) ---
  interface BanCandidateScore {
    id: string;
    totalScore: number;
    historyBanCount: number;
    historyFacedCount: number;
    bestOverlapCount: number;
    reason: string;
  }

  const banScores: { [id: string]: BanCandidateScore } = {};
  enemyMonIds.forEach((id) => {
    banScores[id] = {
      id,
      totalScore: 0,
      historyBanCount: 0,
      historyFacedCount: 0,
      bestOverlapCount: 0,
      reason: '',
    };
  });

  const enemySet = new Set(enemyMonIds);
  const mySet = new Set(myMonIds);

  // Quét qua từng trận đấu trong lịch sử
  matchHistory.forEach((record) => {
    const isVictory = record.result === 'VICTORY';

    // Tìm quái thú địch bị cấm trong trận lịch sử này
    const bannedEnemySlot = record.enemyTeam.find((s) => s.isBanned && s.monsterId);
    const bannedMonsterId = bannedEnemySlot?.monsterId;

    // Đếm mức độ trùng khớp giữa trận lịch sử và bàn cờ hiện tại
    let enemyOverlap = 0;
    record.enemyTeam.forEach((s) => {
      if (s.monsterId && enemySet.has(s.monsterId)) {
        enemyOverlap++;
      }
    });

    let myOverlap = 0;
    record.myTeam.forEach((s) => {
      if (s.monsterId && mySet.has(s.monsterId)) {
        myOverlap++;
      }
    });

    // Cập nhật số lần gặp đối đầu
    record.enemyTeam.forEach((s) => {
      if (s.monsterId && banScores[s.monsterId]) {
        banScores[s.monsterId].historyFacedCount++;
      }
    });

    // Nếu quái bị cấm trong trận lịch sử này đang có mặt trên bàn cờ địch hiện tại
    if (bannedMonsterId && banScores[bannedMonsterId]) {
      const candidate = banScores[bannedMonsterId];
      candidate.historyBanCount++;

      // Trọng số cực lớn dựa trên mức độ tương đồng đội hình
      let matchPoints = 0;
      if (enemyOverlap === 5) {
        matchPoints = 1200; // Trận đối đầu trùng khớp chính xác 100% (5/5 pet địch)
      } else if (enemyOverlap === 4) {
        matchPoints = 700;  // Trùng 4/5 pet địch
      } else if (enemyOverlap === 3) {
        matchPoints = 400;  // Trùng 3/5 pet địch
      } else if (enemyOverlap === 2) {
        matchPoints = 200;  // Trùng 2/5 pet địch
      } else {
        matchPoints = 90;   // Trùng 1 pet địch
      }

      // Thưởng thêm nếu đội hình phe ta cũng tương đồng
      matchPoints += myOverlap * 35;

      // Ưu tiên trận thắng (chiến lược cấm đã chứng minh hiệu quả)
      if (isVictory) {
        matchPoints += 120;
      }

      candidate.totalScore += matchPoints;

      if (enemyOverlap > candidate.bestOverlapCount) {
        candidate.bestOverlapCount = enemyOverlap;
        candidate.reason = `Đã cấm trong trận ${isVictory ? 'Thắng' : 'Đấu'} (khớp ${enemyOverlap}/${enemyMonIds.length} pet địch)`;
      }
    }

    // Nếu trong trận lịch sử này có cả candidate A và candidate B, nhưng player ĐÃ CẤM candidate B (không cấm A)
    // -> Có nghĩa candidate A ít nguy hiểm hơn candidate B trong kèo này
    if (bannedMonsterId && enemySet.has(bannedMonsterId)) {
      record.enemyTeam.forEach((s) => {
        if (s.monsterId && s.monsterId !== bannedMonsterId && banScores[s.monsterId]) {
          banScores[s.monsterId].totalScore -= 20;
        }
      });
    }
  });

  // Cộng thêm điểm tỷ lệ cấm tổng quát từ lịch sử
  enemyMonIds.forEach((id) => {
    const c = banScores[id];
    if (c.historyBanCount > 0) {
      const banRate = c.historyBanCount / Math.max(1, c.historyFacedCount);
      c.totalScore += Math.round(banRate * 60);
      c.totalScore += c.historyBanCount * 30;
      if (!c.reason) {
        c.reason = `Bị cấm ${c.historyBanCount} lần trong lịch sử`;
      }
    }
  });

  // Kiểm tra xem có pet địch nào có dữ liệu cấm trong lịch sử không
  const hasAnyHistoryBan = Object.values(banScores).some((c) => c.historyBanCount > 0);

  // NẾU HOÀN TOÀN KHÔNG CÓ DỮ LIỆU CẤM TRONG LỊCH SỬ CHO BẤT KỲ QUÁI ĐỊCH NÀO:
  // Lúc này mới áp dụng Heuristic dự phòng (điểm nhỏ 5 - 15 điểm, không bao giờ lấn át lịch sử)
  if (!hasAnyHistoryBan) {
    const DANGEROUS_TARGETS = [
      'oliver', 'moore', 'savannah', 'cheongpung', 'dominic', 'miles', 'seara',
      'shizuka', 'vanessa', 'karnal', 'veronica', 'douglas', 'leo',
    ];
    enemyMonIds.forEach((id) => {
      const mon = getMonsterById(allMonsters, id);
      if (DANGEROUS_TARGETS.includes(id)) {
        banScores[id].totalScore += 8;
        if (!banScores[id].reason) banScores[id].reason = 'Quái vật khống chế/sát thương cao';
      }
      if (mon?.leaderSkill && mon.leaderSkill.toLowerCase().includes('tốc độ')) {
        banScores[id].totalScore += 10;
        if (!banScores[id].reason) banScores[id].reason = 'Leader tăng Tốc độ nguy hiểm';
      }
    });
  }

  let suggestedBanId: string | null = null;
  let maxBanScore = -Infinity;
  let bestBanReason = '';

  Object.values(banScores).forEach((c) => {
    if (c.totalScore > maxBanScore) {
      maxBanScore = c.totalScore;
      suggestedBanId = c.id;
      bestBanReason = c.reason;
    }
  });

  // --- 2. TÌM SUGGESTED LEADER (LEAD CHO TEAM TÔI DỰA THEO LỊCH SỬ) ---
  interface LeadCandidateScore {
    id: string;
    totalScore: number;
    historyLeadCount: number;
    reason: string;
  }

  const leadScores: { [id: string]: LeadCandidateScore } = {};
  myMonIds.forEach((id) => {
    leadScores[id] = {
      id,
      totalScore: 0,
      historyLeadCount: 0,
      reason: '',
    };
  });

  matchHistory.forEach((record) => {
    const isVictory = record.result === 'VICTORY';
    const leaderSlot = record.myTeam.find((s) => s.isLeader && s.monsterId);
    const leaderMonId = leaderSlot?.monsterId;

    let myOverlap = 0;
    record.myTeam.forEach((s) => {
      if (s.monsterId && mySet.has(s.monsterId)) myOverlap++;
    });

    let enemyOverlap = 0;
    record.enemyTeam.forEach((s) => {
      if (s.monsterId && enemySet.has(s.monsterId)) enemyOverlap++;
    });

    if (leaderMonId && leadScores[leaderMonId]) {
      const candidate = leadScores[leaderMonId];
      candidate.historyLeadCount++;

      let leadPoints = 0;
      if (myOverlap === 5) leadPoints = 800;
      else if (myOverlap === 4) leadPoints = 500;
      else if (myOverlap === 3) leadPoints = 300;
      else if (myOverlap === 2) leadPoints = 150;
      else leadPoints = 60;

      leadPoints += enemyOverlap * 25;
      if (isVictory) leadPoints += 100;

      candidate.totalScore += leadPoints;
      candidate.reason = `Làm Leader trong trận ${isVictory ? 'Thắng' : 'Đấu'} (khớp ${myOverlap}/5 pet ta)`;
    }
  });

  const hasAnyHistoryLead = Object.values(leadScores).some((c) => c.historyLeadCount > 0);

  // Leader Skill tự nhiên (đặc biệt là Tốc độ)
  myMonIds.forEach((id) => {
    const mon = getMonsterById(allMonsters, id);
    if (mon?.leaderSkill) {
      const skillText = mon.leaderSkill.toLowerCase();
      if (skillText.includes('tốc độ') || skillText.includes('speed') || skillText.includes('spd')) {
        leadScores[id].totalScore += hasAnyHistoryLead ? 30 : 15;
        if (skillText.includes('33%') || skillText.includes('24%')) {
          leadScores[id].totalScore += 20;
        }
      } else if (skillText.includes('máu') || skillText.includes('hp')) {
        leadScores[id].totalScore += 10;
      } else {
        leadScores[id].totalScore += 5;
      }
    }
  });

  let suggestedLeadId: string | null = null;
  let maxLeadScore = -Infinity;
  let bestLeadReason = '';

  Object.values(leadScores).forEach((c) => {
    if (c.totalScore > maxLeadScore) {
      maxLeadScore = c.totalScore;
      suggestedLeadId = c.id;
      bestLeadReason = c.reason;
    }
  });

  // Tổng hợp mô tả gợi ý
  let matchInfo = '';
  const banMon = suggestedBanId ? getMonsterById(allMonsters, suggestedBanId) : null;
  const leadMon = suggestedLeadId ? getMonsterById(allMonsters, suggestedLeadId) : null;

  if (suggestedBanId && banMon) {
    matchInfo = `Gợi ý Cấm: ${banMon.name} (${bestBanReason || 'theo lịch sử'})`;
  }
  if (suggestedLeadId && leadMon) {
    matchInfo += (matchInfo ? ' • ' : '') + `Lead: ${leadMon.name} (${bestLeadReason || leadMon.leaderSkill || 'Leader'})`;
  }

  return {
    suggestedLeadId,
    suggestedBanId,
    matchInfo: matchInfo || 'Gợi ý Lead và Cấm theo lịch sử đối đầu',
  };
}
