import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Fallback strategy generator when Gemini API is offline or key is missing
function generateRuleBasedStrategy(
  defenseMonsters: Array<{ name: string; element?: string }>,
  counterMonsters: Array<{ name: string; element?: string }>
) {
  const p1 = counterMonsters[0]?.name || "Pet Counter 1";
  const p2 = counterMonsters[1]?.name || "Pet Counter 2";
  const p3 = counterMonsters[2]?.name || "Pet Counter 3";

  const targetName = defenseMonsters[0]?.name || "mục tiêu nguy hiểm nhất";
  const defNames = defenseMonsters.map((m) => m.name).join(", ");

  let difficulty: "Dễ" | "Trung bình" | "Yêu cầu rune cao" = "Trung bình";
  if (
    defNames.toLowerCase().includes("savannah") ||
    defNames.toLowerCase().includes("clara") ||
    defNames.toLowerCase().includes("carcano") ||
    defNames.toLowerCase().includes("theomars")
  ) {
    difficulty = "Yêu cầu rune cao";
  }

  const strategy = `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- ${p1}: Khởi đầu dùng Skill 2 hoặc Skill 3 để xóa bùa Will/khiên team địch hoặc buff Tăng Công / Miễn Nhiễm cho đồng đội.
- ${p2}: Dùng Skill bẻ giáp (Defense Break) hoặc khống chế làm choáng/khóa skill nhắm thẳng vào ${targetName}.
- ${p3}: Kích hoạt Skill sát thương chủ lực (Skill 3 / Skill 2) để dồn sát thương kết liễu ngay ${targetName}.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- ${p1} yêu cầu (Atk: +500 ~ +800 | HP: +20.000 ~ +25.000 | SPD: +140 ~ +160)
- ${p2} yêu cầu (Atk: +700 ~ +1.000 | HP: +18.000 ~ +22.000 | SPD: +130 ~ +145)
- ${p3} yêu cầu (Atk: +1.500 ~ +1.900 | HP: +8.000 ~ +12.000 | SPD: +105 ~ +125)

3. Mục Tiêu Dứt Điểm (Kill Order) & Lưu Ý:
- Thứ tự hạ gục: Tập trung tiêu diệt ${targetName} trước tiên, sau đó lần lượt dọn dẹp các mục tiêu phụ.
- Đảm bảo toàn đội có ít nhất 1-2 bộ Will để tránh bị dính debuff/choáng ngay từ lượt mở màn của địch.`;

  return {
    difficulty,
    strategy,
  };
}

// API endpoint: Generate AI Strategy for Siege Counter
app.post("/api/ai-counter-strategy", async (req, res) => {
  try {
    const { defenseMonsters, counterMonsters } = req.body;

    if (
      !Array.isArray(defenseMonsters) ||
      defenseMonsters.length === 0 ||
      !Array.isArray(counterMonsters) ||
      counterMonsters.length === 0
    ) {
      return res.status(400).json({
        error: "Vui lòng cung cấp danh sách quái thú Defense và Counter hợp lệ.",
      });
    }

    const ai = getGenAI();

    // If Gemini client is not initialized (no key), use algorithmic SW tactical generator
    if (!ai) {
      console.log("No GEMINI_API_KEY found, returning rule-based strategy.");
      const fallback = generateRuleBasedStrategy(defenseMonsters, counterMonsters);
      return res.json({
        success: true,
        source: "fallback",
        ...fallback,
      });
    }

    const c1Name = counterMonsters[0]?.name || "Pet Counter 1";
    const c2Name = counterMonsters[1]?.name || "Pet Counter 2";
    const c3Name = counterMonsters[2]?.name || "Pet Counter 3";

    const prompt = `Bạn là một chuyên gia bậc thầy về chiến thuật Summoners War (Sky Arena) ở cấp độ Siege War Tournaments / G3.
Hãy phân tích kèo đối đầu chi tiết giữa:
- ĐỘI HÌNH PHÒNG THỦ (DEFENSE): ${defenseMonsters
      .map((m) => `${m.name} (${m.element || "Không rõ hệ"})`)
      .join(", ")}
- ĐỘI HÌNH KHẮC CHẾ (COUNTER):
  + ${c1Name} (${counterMonsters[0]?.element || "Không rõ hệ"})
  + ${c2Name} (${counterMonsters[1]?.element || "Không rõ hệ"})
  + ${c3Name} (${counterMonsters[2]?.element || "Không rõ hệ"})

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG CHIẾN THUẬT (TRONG TRƯỜNG "strategy"):
Phải tuân thủ chính xác cấu trúc dưới đây bằng tiếng Việt. Chú ý: TUYỆT ĐỐI KHÔNG dùng chữ "Pet 1", "Pet 2", "Pet 3", mà PHẢI THAY THẾ BẰNG CHÍNH TÊN THẬT CỦA PET COUNTER (${c1Name}, ${c2Name}, ${c3Name}):

1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- ${c1Name}: Sử dụng Skill ? (nêu rõ Skill 1, 2 hay 3, nhắm vào mục tiêu nào, mục đích gì)
- ${c2Name}: Sử dụng Skill ? (nêu rõ Skill 1, 2 hay 3, nhắm vào mục tiêu nào, mục đích gì)
- ${c3Name}: Sử dụng Skill ? (nêu rõ Skill 1, 2 hay 3, nhắm vào mục tiêu nào, mục đích gì)

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- ${c1Name} yêu cầu (Atk: +... | HP: +... | SPD: +...)
- ${c2Name} yêu cầu (Atk: +... | HP: +... | SPD: +...)
- ${c3Name} yêu cầu (Atk: +... | HP: +... | SPD: +...)

3. Mục Tiêu Dứt Điểm (Kill Order) & Lưu Ý:
- Thứ tự hạ gục ưu tiên và lưu ý phòng chống rủi ro (Violent proc, khống chế, phản đòn).

Hãy trả về định dạng JSON thuần:
{
  "difficulty": "Dễ" | "Trung bình" | "Yêu cầu rune cao",
  "strategy": "Nội dung tuân thủ đúng 3 phần trên..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Clean possible code fences
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      source: "gemini-3.8-flash",
      difficulty: parsed.difficulty || "Trung bình",
      strategy: parsed.strategy || text,
    });
  } catch (error: any) {
    console.error("AI Counter Strategy generation error:", error);
    // Graceful fallback to avoid breaking the user experience
    const fallback = generateRuleBasedStrategy(
      req.body.defenseMonsters || [],
      req.body.counterMonsters || []
    );
    return res.json({
      success: true,
      source: "fallback-error",
      ...fallback,
    });
  }
});

// Helper: Rule-based RTA Pro Coach generator when Gemini is offline or fallback is needed
function generateRuleBasedRTAProCoach(payload: any) {
  const {
    firstPickSide,
    myTeam = [],
    enemyTeam = [],
    nextSlotOrders = [],
    excludedMonsterIds = [],
    waitingMessage,
    availableMonsters = [],
  } = payload;

  const myPicked = myTeam.filter((s: any) => Boolean(s.monsterId));
  const enemyPicked = enemyTeam.filter((s: any) => Boolean(s.monsterId));

  const pickedIds = new Set<string>();
  myPicked.forEach((s: any) => pickedIds.add(s.monsterId));
  enemyPicked.forEach((s: any) => pickedIds.add(s.monsterId));

  const excludedSet = new Set<string>(excludedMonsterIds);

  const enemyNames = enemyPicked.map((s: any) => s.monsterName || s.monsterId || "").join(", ").toLowerCase();

  // 1. Detect Enemy Archetype
  let enemyArchetype = "Đang chờ đối thủ lộ diện trường phái";
  if (enemyNames.includes("oliver") || enemyNames.includes("moore") || enemyNames.includes("cheongpung") || enemyNames.includes("chiwu")) {
    enemyArchetype = "⚡ Khống chế tốc độ Turn 1 & Đẩy lùi ATB (Control / Stripper)";
  } else if (enemyNames.includes("sonia") || enemyNames.includes("miles") || enemyNames.includes("ethna") || enemyNames.includes("sekhmet")) {
    enemyArchetype = "🎯 Snipe tốc độ cao dứt điểm đơn mục tiêu (Speed Snipe)";
  } else if (enemyNames.includes("bastet") || enemyNames.includes("lushen") || enemyNames.includes("leah") || enemyNames.includes("draco")) {
    enemyArchetype = "🔥 Tốc độ dồn sát thương hủy diệt (Speed Cleave)";
  } else if (enemyNames.includes("riley") || enemyNames.includes("karnal") || enemyNames.includes("woosa") || enemyNames.includes("feng yan")) {
    enemyArchetype = "🛡️ Đỡ đòn trâu bò & Hồi phục dài hơi (Bruiser Sustain)";
  } else if (enemyPicked.length > 0) {
    enemyArchetype = "⚔️ Đội hình Cân bằng / Linh hoạt Meta";
  }

  // Stage detection
  const isLeadBanStage = myPicked.length >= 5 && enemyPicked.length >= 5;

  // If waiting for enemy to pick and not in lead/ban stage
  if (!isLeadBanStage && nextSlotOrders.length === 0) {
    return {
      stage: 'waiting_enemy',
      enemyArchetype,
      analysisSummary: waitingMessage || 'Đang theo dõi lượt chọn của Team Địch. AI sẽ lập tức phân tích và đưa ra gợi ý khắc chế ngay khi đối thủ hoàn tất lượt pick!',
      waitingMessage: waitingMessage || 'Đang chờ Team Địch pick pet...',
      predictedWinRate: 75,
      recommendations: [],
      alternatives: [],
    };
  }

  // 2. Identify candidate monsters from available pool (excluding already picked and user-excluded monsters)
  const candidates = availableMonsters.filter((m: any) => !pickedIds.has(m.id) && !excludedSet.has(m.id));

  const enemyText = enemyNames;
  const myElementCounts: Record<string, number> = { fire: 0, water: 0, wind: 0, light: 0, dark: 0 };
  myPicked.forEach((s: any) => {
    const el = (s.element || "").toLowerCase();
    if (myElementCounts[el] !== undefined) myElementCounts[el]++;
  });

  const myHasSpeedLead = myPicked.some((s: any) => {
    const m = availableMonsters.find((am: any) => am.id === s.monsterId);
    return m?.leaderSkill && (m.leaderSkill.includes("Speed") || m.leaderSkill.includes("Tốc độ"));
  });

  const enemyHasSpeedLead = enemyPicked.some((s: any) => {
    const n = (s.monsterName || s.monsterId || "").toLowerCase();
    return n.includes("oliver") || n.includes("vanessa") || n.includes("chiwu") || n.includes("moore") || n.includes("seara") || n.includes("psamathe");
  });

  // Match optimal counter archetypes with deep SWC eSports drafting knowledge
  const getScore = (m: any) => {
    let score = 50;
    const name = (m.name || m.id || "").toLowerCase();
    const element = (m.element || "").toLowerCase();

    // 1. Heavy penalty for pure Siege/Guild defense units in RTA World Arena
    if (
      name.includes("tractor") ||
      name.includes("carcano") ||
      name.includes("geldnir") ||
      name.includes("ophilia") ||
      name.includes("belial") ||
      name.includes("songseol") ||
      name.includes("chilling") ||
      name.includes("khmun") ||
      name.includes("covenant")
    ) {
      score -= 50;
    }

    // 2. Base tier bonus for proven World Arena SSS / S Meta picks
    if (
      name.includes("haegang") ||
      name.includes("douglas") ||
      name.includes("juno") ||
      name.includes("abellio") ||
      name.includes("sonia") ||
      name.includes("camilla") ||
      name.includes("chandra") ||
      name.includes("josephine") ||
      name.includes("chiwu") ||
      name.includes("bolverk") ||
      name.includes("ethna") ||
      name.includes("sekhmet") ||
      name.includes("tesarion") ||
      name.includes("masha") ||
      name.includes("mo long") ||
      name.includes("verdehile") ||
      name.includes("leo") ||
      name.includes("oliver") ||
      name.includes("moore") ||
      name.includes("cheongpung") ||
      name.includes("shizuka") ||
      name.includes("vanessa") ||
      name.includes("dominic") ||
      name.includes("miles") ||
      name.includes("nana") ||
      name.includes("racuni")
    ) {
      score += 25;
    }

    // 3. Specific Direct Hard Counter Interactions
    // --- Counter Oliver (Wind Skill Reset & ATB absorb) ---
    if (enemyText.includes("oliver")) {
      if (name.includes("douglas")) score += 60; // Glancing on Wind -> S2 counter one-shot
      if (name.includes("masha")) score += 55; // Immune to ATB pushback + Fire speed ramping
      if (name.includes("juno")) score += 48; // Passive cleanses debuffs
      if (name.includes("haegang")) score += 45; // Punishes strip + pushes ATB
      if (name.includes("vanessa")) score += 40; // 33% Speed lead
      if (name.includes("tesarion")) score += 38; // Oblivion shuts down Oliver
      // Water units without passive immunity are weak against Oliver
      if (element === "water" && !name.includes("haegang") && !name.includes("camilla") && !name.includes("josephine") && !name.includes("abellio")) {
        score -= 25;
      }
    }

    // --- Counter Moore (Water Striker / Multi-hit AoE strip & invincibility) ---
    if (enemyText.includes("moore")) {
      if (name.includes("haegang")) score += 70; // Hardest counter in game: Moore S2 triggers 100% team ATB push
      if (name.includes("juno")) score += 52; // S1 revenge stun, passive heals team
      if (name.includes("josephine")) score += 48; // Shields team on stun
      if (name.includes("dominic")) score += 40; // Pure damage shreds Moore
      if (name.includes("sonia")) score += 42; // Fast Wind sniper
    }

    // --- Counter Chiwu / Strippers (Chiwu, Moore, CP, Praha) ---
    if (enemyText.includes("chiwu") || (enemyText.includes("moore") && enemyText.includes("cheongpung"))) {
      if (name.includes("haegang")) score += 65;
      if (name.includes("juno")) score += 55;
      if (name.includes("douglas")) score += 45;
    }

    // --- Counter Sonia / Miles / Ethna (Single Target High Speed Snipers) ---
    if (enemyText.includes("sonia") || enemyText.includes("miles") || enemyText.includes("ethna")) {
      if (name.includes("leo")) score += 75; // Eye of the storm ruins speed scaling
      if (name.includes("abellio")) score += 65; // Cuts turn at <40% HP, heals 30% and gives 50% ATB
      if (name.includes("camilla")) score += 55; // -50% crit damage taken, un-killable
      if (name.includes("chandra")) score += 50; // Hugs target, absorbs snipe damage
      if (name.includes("nana") || name.includes("vanessa") || name.includes("triana")) score += 42; // Revive safety net
      if (name.includes("douglas")) score += 40;
    }

    // --- Counter Woosa / Riley / Karnal / Feng Yan (Heavy Buffs & Sustain Bruisers) ---
    if (enemyText.includes("woosa") || enemyText.includes("riley") || enemyText.includes("karnal") || enemyText.includes("feng yan")) {
      if (name.includes("bolverk")) score += 75; // Passive absorbs buffs -> 50% true HP drain + 50% team heal
      if (name.includes("shizuka")) score += 58; // Copies all buffs to my team
      if (name.includes("tesarion")) score += 52; // Oblivions Feng Yan / Karnal / Riley passives
      if (name.includes("mo long")) score += 48; // 70% Reckless true damage ignores shields
      if (name.includes("praha")) score += 45; // AoE strip into continuous damage
      if (name.includes("dominic")) score += 45; // True damage ignores defense
      if (name.includes("cheongpung")) score += 42; // Cooldown max reset
    }

    // --- Counter Leo ---
    if (enemyText.includes("leo")) {
      if (name.includes("verdehile")) score += 70; // 40% ATB engine every hit
      if (name.includes("josephine")) score += 50;
      if (name.includes("dominic")) score += 45;
    }

    // --- Counter Speed Cleave (Bastet / Lushen / Leah) ---
    if (enemyText.includes("bastet") || enemyText.includes("lushen") || enemyText.includes("leah")) {
      if (name.includes("leo")) score += 75;
      if (name.includes("abellio")) score += 65;
      if (name.includes("douglas")) score += 50;
      if (name.includes("camilla")) score += 50;
    }

    // --- Counter Passive-Heavy Teams ---
    const enemyHasPassives =
      enemyText.includes("douglas") ||
      enemyText.includes("camilla") ||
      enemyText.includes("nana") ||
      enemyText.includes("leo") ||
      enemyText.includes("feng yan") ||
      enemyText.includes("abellio") ||
      enemyText.includes("theomars");
    if (enemyHasPassives) {
      if (name.includes("tesarion")) score += 55; // Oblivion breaks all passives
    }

    // 4. Speed Leader Contest Priority
    // If enemy has speed lead and we don't, we MUST prioritize a speed lead or Leo!
    if (enemyHasSpeedLead && !myHasSpeedLead) {
      if (name.includes("vanessa")) score += 50; // 33% Speed lead
      if (name.includes("oliver")) score += 45; // 33% Speed lead
      if (name.includes("chiwu")) score += 42; // 24% Speed lead + strip
      if (name.includes("moore")) score += 38; // 24% Speed lead
      if (name.includes("leo")) score += 50; // Hard speed equalizer
    }

    // 5. Elemental Balance Check (Avoid drafting 3+ of the same element)
    if (myElementCounts[element] >= 2) {
      score -= 30; // Penalize mono-element vulnerability
    } else if (myElementCounts[element] === 0 && (element === "fire" || element === "water" || element === "wind")) {
      score += 15; // Reward elemental triangle coverage
    }

    return score;
  };

  const sortedCandidates = [...candidates].sort((a, b) => getScore(b) - getScore(a));

  // Determine target orders strictly from nextSlotOrders
  const ordersToFill = nextSlotOrders;

  const recommendations: any[] = [];
  const usedIds = new Set<string>();

  ordersToFill.forEach((order: number, idx: number) => {
    const candidate = sortedCandidates.find((c) => !usedIds.has(c.id)) ||
      sortedCandidates[idx] ||
      availableMonsters.find((m: any) => !pickedIds.has(m.id) && !excludedSet.has(m.id));
    if (candidate) {
      usedIds.add(candidate.id);
      const cName = candidate.name;
      let roleDesc = "Khắc chế chủ lực & Tối ưu hóa lượt đấu";
      let why = `Tuyển thủ Top 1 RTA ưu tiên pick ${cName} ở vị trí #${order} vì đây là quân cờ khắc chế trực tiếp vào sơ hở của đối phương. Khi team địch triển khai ${enemyArchetype}, sự xuất hiện của ${cName} sẽ phá vỡ nhịp độ triển khai chiêu thức của họ và tạo thế chủ động cho Team Tôi.`;
      let strat = `Xếp thứ tự tốc độ hợp lý. Khởi đầu dùng kỹ năng khắc chế vào mục tiêu nguy hiểm nhất của team địch (${enemyPicked[0]?.monsterName || 'chủ lực địch'}), phối hợp cùng đồng đội dồn áp lực ngay từ Turn 1.`;
      let risk = "Đề phòng đối phương có rune Will hoặc proc Violent bất ngờ. Luôn giữ kỹ năng bảo hộ khi đối thủ chưa lộ hết chiêu.";

      if (cName.toLowerCase().includes("haegang")) {
        roleDesc = "Khắc chế Stripper / Xóa Buff & Kéo Lượt Tức Thì";
        why = "Khi đối thủ sở hữu các con bài mở màn xóa buff (Moore, Chiwu, CP...), nội tại của Haegang sẽ lập tức đẩy toàn bộ thanh ATB của Team Tôi lên và xóa sạch hiệu ứng bất lợi, biến lượt đánh của địch thành lợi thế phản công của ta.";
        strat = "Build Will/Despair hoặc Will/Nemesis để tối ưu phản đòn. Ngay khi được kéo ATB, dùng Skill 2 để xóa buff ngược lại team địch.";
        risk = "Cần cẩn thận nếu địch không dùng skill AoE strip mà chuyển sang đánh thường dồn sát thương.";
      } else if (cName.toLowerCase().includes("douglas")) {
        roleDesc = "Khắc Chế Cứng Pet Gió & Oliver / Phản Đòn Glancing";
        why = "Khắc chế số 1 trước Oliver, Savannah, Cheongpung. Nhờ nội tại Glancing Hit, mọi đòn đánh hệ Gió hoặc thiếu bạo kích vào Douglas đều bị giảm sát thương và kích hoạt đòn phản công cực nặng kết liễu chủ lực địch.";
        strat = "Build Vampire/Nemesis hoặc Vampire/Revenge. Dùng Skill 2 tự hồi phục và thanh tẩy, phản công dứt điểm ngay các nguồn sát thương mỏng manh của địch.";
        risk = "Tránh xa các pet hệ Nước có khả năng trừ giáp hoặc khống chế không thể glancing (như Miles, Moore).";
      } else if (cName.toLowerCase().includes("juno")) {
        roleDesc = "Khắc Chế Debuff & Đội Hình Kiểm Soát / Xóa Buff Diện Rộng";
        why = "Ác mộng của mọi đội hình dồn hiệu ứng bất lợi. Nếu dính từ 2 debuff trở lên, Juno tự động hóa giải toàn bộ và hồi máu liên tục cho cả đội mỗi lượt, đồng thời Skill 2 xóa buff và làm choáng.";
        strat = "Build Despair/Nemesis tốc độ cao. Dùng Skill 1 tăng thanh tấn công, Skill 2 xóa sạch Will/Shield của địch.";
        risk = "Yếu trước các đòn đánh dồn sát thương vật lý đơn mục tiêu thuần túy không gây debuff (Sonia, Kaki).";
      } else if (cName.toLowerCase().includes("leo")) {
        roleDesc = "Khóa Cứng Tốc Độ / Phá Vỡ Chiến Thuật Swift Cleave & Sonia";
        why = "Nội tại Eye of the Storm khóa toàn bộ tốc độ trận đấu bằng tốc độ của Leo. Triệt tiêu hoàn toàn dàn rune Swift +220 của đối thủ và vô hiệu hóa sát thương dựa trên tốc độ của Sonia, Miles.";
        strat = "Turn đầu tiên đánh thường đẩy lùi 10% ATB của con bài nguy hiểm nhất địch. Khi máu tụt dưới 30%, Skill 2 kích hoạt bỏ qua phòng thủ one-shot đối phương.";
        risk = "Cần có rune Will trên Leo để tránh bị khống chế ngay lượt đầu nếu địch có Despair/Nemesis phản đòn.";
      } else if (cName.toLowerCase().includes("abellio")) {
        roleDesc = "Cắt Lượt Siêu Tốc & Cứu Sống Đồng Đội Trước Sát Thương Burst";
        why = "Khi có đồng đội tụt dưới 40% máu, Abellio lập tức biến hình thú nhận 100% ATB, cắt đứt chuỗi combo của địch để hồi 30% HP, tăng 50% thanh ATB cả đội và stun đối thủ.";
        strat = "Lập tức dùng Skill 3 hồi máu và kéo 50% ATB cho toàn đội phản công, sau đó stun mục tiêu chủ lực địch bằng Skill 1.";
        risk = "Đề phòng hiệu ứng cấm hồi máu (Unrecoverable) từ team địch.";
      } else if (cName.toLowerCase().includes("sonia")) {
        roleDesc = "Sát Thủ Tốc Độ / Dứt Điểm Chủ Lực Bỏ Qua Phòng Thủ";
        why = "Sát thủ dứt điểm mục tiêu số 1 meta RTA hiện tại. Skill 2 bỏ qua phòng thủ dựa trên chênh lệch tốc độ, dễ dàng gây 50,000+ sát thương hạ gục ngay chủ lực đối phương từ Turn 1.";
        strat = "Tập trung one-shot ngay con bài then chốt nguy hiểm nhất của địch (như Oliver, Stripper hoặc Nuker). Tạo khiên bảo hộ sau khi tiêu diệt mục tiêu.";
        risk = "Rất sợ Leo khóa tốc độ hoặc các quái thú chống sốc sát thương như Abellio, Camilla, Douglas.";
      } else if (cName.toLowerCase().includes("camilla")) {
        roleDesc = "Đỡ Đòn Bất Tử / Khắc Chế Cứng Sát Thủ Tốc Độ & Sonia";
        why = "Nội tại giảm 50% sát thương chí mạng phải nhận, tự xóa sạch debuff và hồi máu mỗi lượt. Sonia hay các sniper tốc độ không thể one-shot được Camilla.";
        strat = "Dùng Skill 2 làm chậm và trừ giáp, Skill 1 kết liễu mục tiêu thấp máu. Camilla càng về late game càng bất tử.";
        risk = "Cần chú ý hiệu ứng Oblivion (Quên Lãng) từ Tesarion.";
      } else if (cName.toLowerCase().includes("bolverk")) {
        roleDesc = "Khắc Tinh Buff / Rút 50% Máu Tối Đa Không Thể Cản Phá";
        why = "Khắc tinh số 1 của Woosa, Riley và các đội hình nhiều buff. Tự động tích tri thức từ buff của đối thủ để rút 50% máu tối đa không thể giảm trừ và hồi 50% máu cho toàn đội.";
        strat = "Chờ đủ 5 tri thức, dùng Skill 3 rút thẳng vào con bài trâu bò nhất của địch (Mo Long, Woosa, Karnal) để đồng đội dứt điểm.";
        risk = "Không hiệu quả nếu đối thủ đánh đội hình không có bất kỳ buff nào.";
      } else if (cName.toLowerCase().includes("chandra")) {
        roleDesc = "Bảo Kê Tuyệt Đối / Ôm Đồng Đội & Phản Đòn Choáng";
        why = "Skill 2 Ôm (Defend) chuyển toàn bộ sát thương của đồng đội mỏng manh sang bản thân, đồng thời phản đòn choáng và đánh lan làm chậm toàn bộ đội hình đối phương.";
        strat = "Dùng Skill 2 bảo kê ngay chủ lực yếu máu nhất của ta (như Sonia, Oliver), Skill 3 làm chậm và tăng tốc độ cho cả đội.";
        risk = "Cần lượng HP cực lớn để chịu được sát thương thay cho đồng minh.";
      } else if (cName.toLowerCase().includes("josephine")) {
        roleDesc = "Khắc Chế Cứng Stun / Khiên Đội Hình & Lượt Đánh Tức Thì";
        why = "Mỗi khi có bất kỳ đồng đội nào bị choáng/đóng băng, Josephine lập tức tạo khiên cho toàn đội và cướp lượt đánh tức thì để khiêu khích, làm choáng ngược lại chủ lực địch.";
        strat = "Tập trung dùng Skill 2 khiêu khích và làm choáng con bài điều khiển nhịp độ của địch.";
        risk = "Chỉ phát huy tối đa sức mạnh khi đối phương có nhiều kỹ năng Stun/Freeze.";
      } else if (cName.toLowerCase().includes("chiwu")) {
        roleDesc = "Speed Leader 24% & Stripper Diện Rộng 100%";
        why = "Cung cấp Leader 24% Tốc độ then chốt trong RTA kết hợp khả năng xóa sạch toàn bộ buff (Will/Shield) của địch và đẩy lùi thanh tấn công đối thủ.";
        strat = "Đi đầu tiên, dùng Skill 3 xóa sạch Will và đẩy lùi ATB địch, mở đường cho toàn bộ đội hình ta dồn sát thương.";
        risk = "Cần rune Despair hoặc Swift có độ chính xác (Accuracy) cao để tránh bị kháng 15%.";
      } else if (cName.toLowerCase().includes("tesarion")) {
        roleDesc = "Khóa Nội Tại (Oblivion) / Phá Hủy Mọi Đội Hình Bất Tử";
        why = "Hiệu ứng Quên Lãng (Oblivion) của Tesarion vô hiệu hóa hoàn toàn nội tại của Douglas, Camilla, Leo, Nana, Abellio, Feng Yan, biến các siêu quái vật thành bia tập bắn.";
        strat = "Dùng Skill 2 trừ giáp và áp Oblivion vào con bài dựa vào nội tại của địch, sau đó dồn sát thương tiêu diệt.";
        risk = "Cần bảo vệ Tesarion trước các sát thủ dồn sát thương nhanh của địch.";
      } else if (cName.toLowerCase().includes("verdehile")) {
        roleDesc = "Cỗ Máy Kéo Thanh ATB 40% / Khắc Tinh Của Leo";
        why = "Mỗi đòn chí mạng kéo 20% thanh ATB cả đội (tối đa 40%/lượt). Khi đối đầu với Leo hoặc bị đánh lan, Verdehile liên tục kích hoạt phản đòn cướp lượt cho cả team.";
        strat = "Build Revenge x3 hoặc Violent/Revenge với 100% tỉ lệ chí mạng.";
        risk = "Dễ bị sốc sát thương nếu đối phương có trừ giáp chuẩn xác.";
      } else if (cName.toLowerCase().includes("oliver")) {
        roleDesc = "Speed Leader 33% / Vua Khống Chế & Hút Lượt Liên Hoàn";
        why = "Speed Leader 33% cao nhất RTA. Khả năng vừa tăng thời gian hồi chiêu địch vừa hút thanh tấn công, cho phép Oliver đánh liên tục không ngừng.";
        strat = "Tập trung reset chiêu thức con bài nguy hiểm nhất của đối thủ ngay lượt đầu tiên.";
        risk = "Rất ngại đối đầu với Douglas, Masha, Juno.";
      } else if (cName.toLowerCase().includes("vanessa")) {
        roleDesc = "Speed Leader 33% & Bảo Hiểm Hồi Sinh Cho Đội Hình";
        why = "Speed Leader 33% giúp toàn đội tranh chấp quyền đi trước, kèm nội tại tự động hồi sinh đồng đội khi bị dứt điểm bất ngờ.";
        strat = "Dùng Skill 2 trừ giáp mục tiêu chủ lực địch để đồng minh dứt điểm nhanh chóng.";
        risk = "Nội tại hồi sinh có thời gian hồi dài, cần tính toán cẩn thận.";
      } else if (cName.toLowerCase().includes("dominic")) {
        roleDesc = "Đấu Sĩ Sát Thương Chuẩn Bỏ Qua Phòng Thủ";
        why = "Nội tại gây sát thương chuẩn thuần túy không phụ thuộc vào phòng ngự đối phương, xé toạc các tanker trâu bò như Karnal, Feng Yan, Riley.";
        strat = "Dùng Skill 2 cấm hồi máu và dồn sát thương chuẩn hạ gục các pet hồi phục của địch.";
        risk = "Cần rune có nhiều tốc độ và độ bền để sống sót giao tranh dài hơi.";
      }

      // Slot-specific alternative suggestions if user does not own this monster
      const slotAlternatives = sortedCandidates
        .filter((c) => c.id !== candidate.id && !usedIds.has(c.id))
        .slice(0, 3)
        .map((c) => ({
          monsterId: c.id,
          monsterName: c.name,
          role: "Đối trọng thay thế",
          reason: `Phương án thay thế nếu bạn không có ${cName}. Vẫn đảm bảo khả năng đối phó với ${enemyArchetype}.`,
        }));

      recommendations.push({
        monsterId: candidate.id,
        monsterName: cName,
        slotOrder: order,
        winRateEstimate: Math.min(88, 72 + Math.floor(Math.random() * 14)),
        archetypeRole: roleDesc,
        whyPick: why,
        operationalStrategy: strat,
        riskNotes: risk,
        alternatives: slotAlternatives,
      });
    }
  });

  // Global alternatives
  const alternatives = sortedCandidates
    .filter((c) => !usedIds.has(c.id))
    .slice(0, 4)
    .map((c) => ({
      monsterId: c.id,
      monsterName: c.name,
      role: "Lựa chọn đối trọng phụ",
      reason: `Phương án thay thế chiến thuật vững chắc nếu bạn không có quái thú chính hoặc muốn đánh theo hướng khác đối phó ${enemyArchetype}.`,
    }));

  // Ban & Leader
  let suggestedBan: any = undefined;
  let suggestedLeader: any = undefined;

  if (enemyPicked.length > 0) {
    const highestThreatEnemy = enemyPicked.find((s: any) => {
      const n = (s.monsterName || "").toLowerCase();
      return n.includes("oliver") || n.includes("moore") || n.includes("leo") || n.includes("haegang") || n.includes("sonia");
    }) || enemyPicked[0];

    suggestedBan = {
      monsterId: highestThreatEnemy.monsterId,
      monsterName: highestThreatEnemy.monsterName || "Mục tiêu nguy hiểm nhất",
      reason: `Tuyển thủ Top 1 khuyên cấm ${highestThreatEnemy.monsterName || 'quân cờ này'} vì đây là linh hồn kích hoạt combo nguy hiểm nhất của team địch. Cấm đi sẽ triệt tiêu 70% sức ép từ đội hình đối phương.`,
    };
  }

  if (myPicked.length > 0) {
    const bestLeader = myPicked.find((s: any) => {
      const m = availableMonsters.find((am: any) => am.id === s.monsterId);
      return m?.leaderSkill && (m.leaderSkill.includes("Speed") || m.leaderSkill.includes("Tốc độ"));
    }) || myPicked.find((s: any) => {
      const m = availableMonsters.find((am: any) => am.id === s.monsterId);
      return m?.leaderSkill && (m.leaderSkill.includes("HP") || m.leaderSkill.includes("Máu"));
    }) || myPicked[0];

    const leadM = availableMonsters.find((am: any) => am.id === bestLeader.monsterId);

    suggestedLeader = {
      monsterId: bestLeader.monsterId,
      monsterName: bestLeader.monsterName || "Pet Leader",
      skillDesc: leadM?.leaderSkill || "Tăng chỉ số chiến đấu RTA",
      reason: `Kích hoạt Leader của ${bestLeader.monsterName || 'quái vật này'} mang lại lợi thế chỉ số then chốt (Tốc độ / HP) giúp toàn đội vượt qua ngưỡng an toàn trong giao tranh.`,
    };
  }

  return {
    stage: isLeadBanStage ? 'lead_and_ban' : (ordersToFill.length > 0 ? 'pick' : 'waiting_enemy'),
    enemyArchetype,
    analysisSummary: `Nhận định từ Tuyển thủ Top 1 RTA: Đối thủ đang có xu hướng xây dựng ${enemyArchetype}. Để tối ưu tỷ lệ thắng lên mức cao nhất, Team Tôi cần ưu tiên các quân bài có khả năng cắt lượt, hóa giải hiệu ứng và phản đòn ngay lập tức.`,
    predictedWinRate: 83,
    recommendations,
    alternatives,
    suggestedBan,
    suggestedLeader,
  };
}

// API endpoint: AI RTA Pro Coach Recommendation
app.post("/api/ai-rta-pro-coach", async (req, res) => {
  try {
    const {
      firstPickSide,
      myTeam = [],
      enemyTeam = [],
      nextSlotOrders = [],
      excludedMonsterIds = [],
      waitingMessage,
      availableMonsters = [],
    } = req.body;

    const myPicked = myTeam.filter((s: any) => Boolean(s.monsterId));
    const enemyPicked = enemyTeam.filter((s: any) => Boolean(s.monsterId));
    const isLeadBanStage = myPicked.length >= 5 && enemyPicked.length >= 5;

    // If waiting for enemy to pick and not lead/ban, return immediately without calling LLM
    if (!isLeadBanStage && nextSlotOrders.length === 0) {
      const waitingResult = generateRuleBasedRTAProCoach(req.body);
      return res.json({
        success: true,
        source: "waiting-turn",
        analysis: waitingResult,
      });
    }

    const ai = getGenAI();

    // If Gemini client is not initialized, use rule-based SW pro draft engine
    if (!ai) {
      console.log("No GEMINI_API_KEY found, using rule-based RTA Pro Coach engine.");
      const fallback = generateRuleBasedRTAProCoach(req.body);
      return res.json({
        success: true,
        source: "pro-coach-fallback",
        analysis: fallback,
      });
    }

    const myPickedNames = myPicked.map((s: any) => s.monsterName || s.monsterId).join(", ") || "(Chưa pick pet nào)";
    const enemyPickedNames = enemyPicked.map((s: any) => s.monsterName || s.monsterId).join(", ") || "(Chưa pick pet nào)";
    const nextOrdersStr = nextSlotOrders.join(", ") || "Slot tiếp theo";

    // Filter available monsters by excluding user-unowned / swapped monsters
    const excludedSet = new Set<string>(excludedMonsterIds || []);
    const validAvailable = availableMonsters.filter((m: any) => !excludedSet.has(m.id));

    // Sort available monsters so premier RTA meta superstars always appear at the top
    const rtaPriorityRank = [
      "oliver", "moore", "haegang", "douglas", "juno", "abellio", "sonia", "camilla",
      "chandra", "josephine", "chiwu", "bolverk", "ethna", "sekhmet", "tesarion", "masha",
      "dominic", "miles", "vanessa", "cheongpung", "shizuka", "leo", "verdehile", "racuni",
      "mo long", "praha", "karnal", "savannah", "woosa", "nana", "triana", "verad", "bastet", "tiana"
    ];

    const sortedAvailable = [...validAvailable].sort((a: any, b: any) => {
      const aName = (a.name || a.id || "").toLowerCase();
      const bName = (b.name || b.id || "").toLowerCase();
      const aIdx = rtaPriorityRank.findIndex((r) => aName.includes(r));
      const bIdx = rtaPriorityRank.findIndex((r) => bName.includes(r));
      const aRank = aIdx !== -1 ? aIdx : 999;
      const bRank = bIdx !== -1 ? bIdx : 999;
      return aRank - bRank;
    });

    // Formulate Top Legend G3 Coach prompt
    const prompt = `Bạn là một tuyển thủ chuyên nghiệp eSports Summoners War (Sky Arena) hàng đầu thế giới, thuộc bậc xếp hạng Legend / Guardian 3 (G3) và từng thi đấu tại giải vô địch thế giới SWC (Summoners War World Arena Championship).
Bạn có tư duy ban/pick đỉnh cao, am hiểu sâu sắc meta RTA hiện tại (các trường phái Cleave, Turn 1 Control, Bruiser Sustain, Turn 2 Anti-Cleave, Speed Snipe, Passive Counter).

TÌNH HUỐNG DRAFT RTA ĐANG DIỄN RA:
- Quyền chọn trước (First Pick): ${firstPickSide === 'mine' ? 'Team Tôi (Team Trái)' : 'Team Địch (Team Phải)'}
- Team Địch đã pick (${enemyPicked.length}/5): ${enemyPickedNames}
- Team Tôi đã pick (${myPicked.length}/5): ${myPickedNames}
- Các vị trí (Slot Order) mà Team Tôi CẦN PICK TIẾP THEO ngay lúc này: [${nextOrdersStr}]
- Danh sách quái thú KHÔNG SỞ HỮU / LOẠI TRỪ (TUYỆT ĐỐI KHÔNG GỢI Ý NHỮNG CON NÀY): [${(excludedMonsterIds || []).join(", ") || "Không có"}]
- Danh sách quái thú khả dụng của người chơi: ${sortedAvailable.map((m: any) => `${m.name} (Hệ: ${m.element}, ID: ${m.id})`).join("; ")}

QUY TẮC DRAFT TUYỂN THỦ PRO TOP 1 (RẤT QUAN TRỌNG ĐỂ TỐI ĐA TỶ LỆ THẮNG):
1. ĐÂY LÀ ĐẤU TRƯỜNG ĐỈNH CAO RTA (WORLD ARENA), TUYỆT ĐỐI KHÔNG GỢI Ý CÁC QUÁI THÚ PURE SIEGE DEFENSE như Tractor, Ophilia, Geldnir, Carcano, Belial.
2. Ưu tiên hàng đầu các con bài meta SSS/S Tier: Oliver, Moore, Haegang, Douglas, Juno, Abellio, Sonia, Camilla, Chandra, Josephine, Chiwu, Bolverk, Ethna, Sekhmet, Tesarion, Masha, Dominic, Miles, Vanessa, Cheongpung, Shizuka, Leo, Verdehile.
3. Nguyên tắc khắc chế trực diện theo lựa chọn thực tế của đối thủ:
   - Nếu địch có Oliver (Wind Control): Douglas (glancing counter SSS), Masha (immune ATB pushback), Juno (cleanse), Haegang, Vanessa. Không pick Mo Long / Woosa vì dễ bị Oliver reset.
   - Nếu địch có Moore / Chiwu (AoE Stripper): Haegang (nội tại Moore S2 kéo 100% ATB cả team), Juno, Josephine, Douglas.
   - Nếu địch có Sonia / Miles / Ethna (Speed Snipe): Leo (khóa tốc độ), Abellio (cắt lượt hồi 30% máu + 50% ATB), Camilla (-50% crit dmg), Chandra (ôm bảo kê), Nana.
   - Nếu địch có Woosa / Riley (Buff nhiều): Bolverk (hút buff rút 50% máu tối đa), Shizuka, Praha, Tesarion, Cheongpung.
   - Nếu địch có Leo: Verdehile (phản đòn kéo 40% ATB).
   - Nếu địch có Passives mạnh: Tesarion (Oblivion khóa sạch).
4. Phải đảm bảo thế trận: có Speed Lead (hoặc Leo/Haegang), có sát thương dứt điểm (Dominic, Sonia, Miles, Theomars), và cân bằng nguyên tố (không pick 3-4 con cùng hệ).
5. Chỉ gợi ý CHÍNH XÁC DUY NHẤT cho các vị trí đang cần pick ngay lúc này (${nextOrdersStr}), KHÔNG gợi ý trước các lượt tương lai.

NHIỆM VỤ CỦA BẠN:
1. Nhận định Archetype của Team Địch (họ đang đánh Turn 1 Control, Speed Cleave, Snipe, hay Turn 2 Bruiser...).
2. Đưa ra gợi ý pick CHÍNH XÁC DUY NHẤT cho các slot tiếp theo của Team Tôi (${nextOrdersStr}) từ danh sách quái thú khả dụng ở trên (KHÔNG gợi ý pet đã bị pick hoặc trong danh sách loại trừ). KHÔNG gợi ý vượt các slot tương lai chưa đến lượt.
3. Mỗi gợi ý phải có phân tích sâu sắc theo phong cách tuyển thủ thi đấu:
   - "whyPick": Tại sao pick con này khắc chế cứng team địch (phân tích chiêu thức, nội tại).
   - "operationalStrategy": Hướng dẫn vận hành turn order, combo và mục tiêu dứt điểm.
   - "riskNotes": Đề phòng rủi ro gì (Rune Will, Despair stun, Violent proc).
   - "alternatives": 2-3 quái thú thay thế trực tiếp cho slot này nếu người chơi không có quái vật chính.
4. Nếu cả 2 bên đã đủ 5 quái thú (giai đoạn Ban/Leader), hãy chỉ rõ nên BAN con nào của địch nhất và chọn ai làm LEADER của team tôi.

HÃY TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON THEO ĐỊNH DẠNG:
{
  "stage": "pick" | "lead_and_ban" | "waiting_enemy",
  "enemyArchetype": "Chuẩn đoán ngắn gọn về trường phái đối thủ (vd: Turn 1 Khống chế tốc độ & Đẩy lùi ATB)",
  "analysisSummary": "Lời nhận định phân tích tổng quan của tuyển thủ Top 1 về thế trận draft hiện tại",
  "predictedWinRate": 85,
  "recommendations": [
    {
      "monsterId": "ID quái thú trong danh sách khả dụng",
      "monsterName": "Tên quái thú",
      "slotOrder": 2,
      "winRateEstimate": 86,
      "archetypeRole": "Vai trò chiến thuật (vd: Counter Cleave / Cắt Lượt)",
      "whyPick": "Phân tích vì sao pick...",
      "operationalStrategy": "Chiến thuật đánh...",
      "riskNotes": "Lưu ý...",
      "alternatives": [
        {
          "monsterId": "ID quái thú thay thế",
          "monsterName": "Tên quái thú",
          "role": "Vai trò thay thế",
          "reason": "Lý do thay thế nếu không có pet chính"
        }
      ]
    }
  ],
  "alternatives": [
    {
      "monsterId": "ID quái thú",
      "monsterName": "Tên quái thú",
      "role": "Vai trò thay thế",
      "reason": "Lý do chọn thay thế"
    }
  ],
  "suggestedBan": {
    "monsterId": "ID pet địch cần cấm",
    "monsterName": "Tên pet địch",
    "reason": "Lý do cấm..."
  },
  "suggestedLeader": {
    "monsterId": "ID pet team tôi làm lead",
    "monsterName": "Tên pet",
    "skillDesc": "Kỹ năng Leader",
    "reason": "Lý do chọn làm lead..."
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      source: "gemini-3.8-flash",
      analysis: parsed,
    });
  } catch (error: any) {
    console.error("AI RTA Pro Coach generation error:", error);
    const fallback = generateRuleBasedRTAProCoach(req.body);
    return res.json({
      success: true,
      source: "pro-coach-fallback-error",
      analysis: fallback,
    });
  }
});

// Vite middleware and static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
