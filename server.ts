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
  const defNames = defenseMonsters.map((m) => m.name).join(", ");
  const cNames = counterMonsters.map((m) => m.name);
  const turnOrder = cNames.join(" > ");

  // Identify high-threat targets
  const targetName = defenseMonsters[0]?.name || "mục tiêu chủ lực";
  const defElements = defenseMonsters.map((m) => m.element || "");

  let difficulty: "Dễ" | "Trung bình" | "Yêu cầu rune cao" = "Trung bình";
  if (defNames.toLowerCase().includes("savannah") || defNames.toLowerCase().includes("clara") || defNames.toLowerCase().includes("carcano")) {
    difficulty = "Trung bình";
  }

  const strategy = `1. Mục tiêu ưu tiên (Kill Order):
- Tập trung dồn sát thương và kết liễu nhanh ${targetName} đầu tiên để phá vỡ thế trận đe dọa của đối thủ.
- Luôn giữ kỹ năng khống chế hoặc khiêu khích đối với quái phụ để tránh bị bạo kích (Violent proc) bất ngờ.

2. Cách đánh & Phối hợp kỹ năng:
- Bắt đầu lượt với ${cNames[0] || "quái tốc độ cao"} để mở giao tranh (bật bùa tăng công/tốc độ hoặc giải bùa lợi Will của team địch).
- Sử dụng ${cNames[1] || "quái hỗ trợ/debuff"} bẻ giáp (Defense Break) vào ${targetName}.
- Đưa ${cNames[2] || "quái dồn sát thương"} vào dứt điểm mục tiêu đã trúng debuff giáp.

3. Lưu ý rune & Biến số an toàn:
- Đảm bảo toàn đội có ít nhất 1-2 bộ Will để kháng choáng/phá giáp từ lượt đầu của team phòng thủ.
- Cân đối tốc độ (Speed Tuning) chuẩn xác để quái buff/strip luôn đi trước quái dứt điểm.`;

  return {
    turnOrder,
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
- ĐỘI HÌNH KHẮC CHẾ (COUNTER): ${counterMonsters
      .map((m) => `${m.name} (${m.element || "Không rõ hệ"})`)
      .join(", ")}

Yêu cầu đưa ra hướng dẫn chiến thuật đánh cụ thể, súc tích và thực chiến:
1. turnOrder: Thứ tự lượt đi tối ưu nhất giữa 3 pet counter (VD: "Chilling > Galleon > Julie").
2. difficulty: Độ khó ("Dễ" hoặc "Trung bình" hoặc "Yêu cầu rune cao").
3. strategy: Bản hướng dẫn chi tiết bao gồm:
   - Mục tiêu ưu tiên dứt điểm trước (Kill order)
   - Cách khống chế, giải buff Will/Bảo vệ hoặc kích hoạt kỹ năng khắc chế mấu chốt
   - Cách phòng ngừa biến số (Violent proc, quái thủ có phản đòn hoặc hồi sinh)
   - Lưu ý quan trọng về bộ rune (Will, Shield, Violent, Destroy...) và chỉ số cần thiết

Hãy trả về định dạng JSON thuần với cấu trúc:
{
  "turnOrder": "Tên Pet 1 > Tên Pet 2 > Tên Pet 3",
  "difficulty": "Dễ" | "Trung bình" | "Yêu cầu rune cao",
  "strategy": "nội dung hướng dẫn chi tiết..."
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
      turnOrder: parsed.turnOrder || counterMonsters.map((m: any) => m.name).join(" > "),
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
