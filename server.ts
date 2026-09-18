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
  const p1 = counterMonsters[0]?.name || "Pet 1";
  const p2 = counterMonsters[1]?.name || "Pet 2";
  const p3 = counterMonsters[2]?.name || "Pet 3";

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
- Pet 1 (${p1}): Khởi đầu dùng Skill 2 hoặc Skill 3 để xóa bùa Will/khiên team địch hoặc buff Tăng Công / Miễn Nhiễm cho đồng đội.
- Pet 2 (${p2}): Dùng Skill bẻ giáp (Defense Break) hoặc khống chế làm choáng/khóa skill nhắm thẳng vào ${targetName}.
- Pet 3 (${p3}): Kích hoạt Skill sát thương chủ lực (Skill 3 / Skill 2) để dồn sát thương kết liễu ngay ${targetName}.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (${p1}) yêu cầu (Atk: +500 ~ +800 | HP: +20.000 ~ +25.000 | SPD: +140 ~ +160)
- Pet 2 (${p2}) yêu cầu (Atk: +700 ~ +1.000 | HP: +18.000 ~ +22.000 | SPD: +130 ~ +145)
- Pet 3 (${p3}) yêu cầu (Atk: +1.500 ~ +1.900 | HP: +8.000 ~ +12.000 | SPD: +105 ~ +125)

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

    const prompt = `Bạn là một chuyên gia bậc thầy về chiến thuật Summoners War (Sky Arena) ở cấp độ Siege War Tournaments / G3.
Hãy phân tích kèo đối đầu chi tiết giữa:
- ĐỘI HÌNH PHÒNG THỦ (DEFENSE): ${defenseMonsters
      .map((m) => `${m.name} (${m.element || "Không rõ hệ"})`)
      .join(", ")}
- ĐỘI HÌNH KHẮC CHẾ (COUNTER):
  + Pet 1: ${counterMonsters[0]?.name} (${counterMonsters[0]?.element || "Không rõ hệ"})
  + Pet 2: ${counterMonsters[1]?.name} (${counterMonsters[1]?.element || "Không rõ hệ"})
  + Pet 3: ${counterMonsters[2]?.name} (${counterMonsters[2]?.element || "Không rõ hệ"})

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG CHIẾN THUẬT (TRONG TRƯỜNG "strategy"):
Phải tuân thủ chính xác cấu trúc dưới đây bằng tiếng Việt:

1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (${counterMonsters[0]?.name}): Sử dụng Skill ? (nêu rõ Skill 1, 2 hay 3, nhắm vào mục tiêu nào, mục đích gì)
- Pet 2 (${counterMonsters[1]?.name}): Sử dụng Skill ? (nêu rõ Skill 1, 2 hay 3, nhắm vào mục tiêu nào, mục đích gì)
- Pet 3 (${counterMonsters[2]?.name}): Sử dụng Skill ? (nêu rõ Skill 1, 2 hay 3, nhắm vào mục tiêu nào, mục đích gì)

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (${counterMonsters[0]?.name}) yêu cầu (Atk: +... | HP: +... | SPD: +...)
- Pet 2 (${counterMonsters[1]?.name}) yêu cầu (Atk: +... | HP: +... | SPD: +...)
- Pet 3 (${counterMonsters[2]?.name}) yêu cầu (Atk: +... | HP: +... | SPD: +...)

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
