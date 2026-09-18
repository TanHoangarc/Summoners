import { SiegeCounterStrategy } from '../types';

export const DEFAULT_SIEGE_COUNTERS: SiegeCounterStrategy[] = [
  // Exact match: Geldnir + Ophilia + Theomars
  {
    id: 'counter-g-o-t-1',
    defenseMonsterIds: ['geldnir', 'ophilia', 'theomars'],
    counterMonsterIds: ['feng_yan', 'aaliyah', 'chilling'],
    rating: 5.0,
    ratingCount: 18,
    author: '',
    date: '07/08/2026',
    difficulty: 'Dễ',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (Feng Yan): Dùng Skill 2 tăng phòng thủ và hồi phục máu khi bị tấn công, dùng Skill 1 liên tục đánh bẻ giáp Theomars và Ophilia.
- Pet 2 (Aaliyah): Dùng Skill 3 buff Miễn Nhiễm + Tăng Thủ 3 lượt ngay đầu trận để Theomars địch không thể cắn trừ giáp.
- Pet 3 (Chilling): Dùng Skill 1 và nội tại liên tục xóa khiên, cướp buff Threat của Ophilia và cướp bùa Bất tử (Endure) của Theomars.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (Feng Yan) yêu cầu (Atk: +300 | HP: +18.000 | Def: +1.800 | SPD: +85 | Rune: Violent + Will/Destroy)
- Pet 2 (Aaliyah) yêu cầu (Atk: +250 | HP: +24.000 | Def: +1.200 | SPD: +135 | Rune: Violent + Will)
- Pet 3 (Chilling) yêu cầu (Atk: +650 | HP: +19.000 | Def: +600 | SPD: +140 | Rune: Swift/Violent + Will)`
  },
  {
    id: 'counter-g-o-t-2',
    defenseMonsterIds: ['geldnir', 'ophilia', 'theomars'],
    counterMonsterIds: ['ariel', 'belial', 'tractor'],
    rating: 4.8,
    ratingCount: 25,
    author: '',
    date: '12/25/2025',
    difficulty: 'Trung bình',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (Ariel): Dùng Skill 3 hồi máu diện rộng và tăng thanh tấn công, dùng Skill 2 giải trừ hiệu ứng xấu cho Tractor khi cần.
- Pet 2 (Belial): Dùng Skill 2 tấn công xuyên giáp kết liễu Geldnir hoặc Theomars; liên tục hồi sinh gây sát thương khi nằm xuống.
- Pet 3 (Tractor): Dùng Skill 1 và Skill 2 khiêu khích Ophilia và hút trọn đòn tấn công của Theomars mà không bao giờ bị trừ giáp.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (Ariel) yêu cầu (Atk: +300 | HP: +28.000 | Def: +1.400 | SPD: +115 | Rune: Nemesis/Violent + Will)
- Pet 2 (Belial) yêu cầu (Atk: +1.850 | HP: +6.000 | Def: +400 | SPD: +90 | Rune: Rage + Blade)
- Pet 3 (Tractor) yêu cầu (Atk: +400 | HP: +22.000 | Def: +1.600 | SPD: +80 | Rune: Vampire/Destroy + Revenge)`
  },
  {
    id: 'counter-g-o-t-3',
    defenseMonsterIds: ['geldnir', 'ophilia', 'theomars'],
    counterMonsterIds: ['covenant', 'songseol', 'dova'],
    rating: 4.7,
    ratingCount: 14,
    author: '',
    date: '04/15/2024',
    difficulty: 'Yêu cầu rune cao',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (Covenant): Nhận lượt từ Dova, dùng ngay Skill 3 (Snipe) bắn xuyên giáp 50.000+ sát thương tiêu diệt ngay Geldnir hoặc Theomars.
- Pet 2 (Songseol): Dùng Skill 3 gảy đàn làm chậm và giảm thời gian hồi chiêu của địch, hỗ trợ khống chế Ophilia.
- Pet 3 (Dova): Mở màn dùng Skill 2 kéo 100% thanh tấn công và tăng sức tấn công trực tiếp cho Covenant bắn mở màn.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (Covenant) yêu cầu (Atk: +1.950 | HP: +8.000 | Def: +450 | SPD: +60 | Rune: Rage + Will)
- Pet 2 (Songseol) yêu cầu (Atk: +500 | HP: +23.000 | Def: +800 | SPD: +145 | Rune: Despair + Will)
- Pet 3 (Dova) yêu cầu (Atk: +350 | HP: +20.000 | Def: +700 | SPD: +195 | Rune: Swift + Will)`
  },

  // Carcano + Vigor + Triana
  {
    id: 'counter-c-v-t-1',
    defenseMonsterIds: ['carcano', 'vigor', 'triana'],
    counterMonsterIds: ['tractor', 'aaliyah', 'feng_yan'],
    rating: 4.9,
    ratingCount: 32,
    author: '',
    date: '02/10/2026',
    difficulty: 'Dễ',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (Tractor): Dùng Skill 2 khiêu khích Triana, làm bao cát hút trọn hỏa lực của Carcano nhờ nội tại miễn nhiễm trừ giáp.
- Pet 2 (Aaliyah): Dùng Skill 3 buff Miễn Nhiễm và Tăng Thủ 3 lượt để ngăn Vigor bẻ giáp.
- Pet 3 (Feng Yan): Dùng Skill 2 hồi phục và phản đòn, dùng Skill 1 trừ giáp dứt điểm lần lượt Vigor rồi đến Triana.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (Tractor) yêu cầu (Atk: +400 | HP: +23.000 | Def: +1.650 | SPD: +80 | Rune: Vampire + Destroy)
- Pet 2 (Aaliyah) yêu cầu (Atk: +250 | HP: +25.000 | Def: +1.250 | SPD: +135 | Rune: Violent + Will)
- Pet 3 (Feng Yan) yêu cầu (Atk: +300 | HP: +19.000 | Def: +1.850 | SPD: +90 | Rune: Violent + Destroy)`
  },

  // Clara + Savannah + Theomars
  {
    id: 'counter-c-s-t-1',
    defenseMonsterIds: ['clara', 'savannah', 'theomars'],
    counterMonsterIds: ['leo', 'woosa', 'feng_yan'],
    rating: 4.9,
    ratingCount: 40,
    author: '',
    date: '01/18/2026',
    difficulty: 'Trung bình',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (Leo): Khởi đầu lượt với Skill 1 hoặc Skill 2 nhắm vào Savannah để giảm thanh tấn công, kéo toàn bộ tốc độ trận đấu về mức của Leo.
- Pet 2 (Woosa): Đi ngay sau Leo, dùng Skill 3 phủ khiên chắn dày và buff Miễn Nhiễm 3 lượt vô hiệu hóa toàn bộ choáng/trừ giáp từ Clara và Savannah.
- Pet 3 (Feng Yan): Bật Skill 2 phản đòn và hồi máu, sau đó dùng Skill 1 dứt điểm lần lượt Savannah rồi đến Theomars.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (Leo) yêu cầu (Atk: +1.200 | HP: +20.000 | Def: +800 | SPD: +0 | Rune: Vampire + Nemesis)
- Pet 2 (Woosa) yêu cầu (Atk: +400 | HP: +32.000 | Def: +900 | SPD: +150 | Rune: Swift/Violent + Will)
- Pet 3 (Feng Yan) yêu cầu (Atk: +300 | HP: +19.000 | Def: +1.800 | SPD: +85 | Rune: Violent + Will/Destroy)`
  },

  // Khmun + Bastet + Odin
  {
    id: 'counter-k-b-o-1',
    defenseMonsterIds: ['khmun', 'bastet', 'odin'],
    counterMonsterIds: ['covenant', 'dova', 'riley'],
    rating: 4.8,
    ratingCount: 22,
    author: '',
    date: '03/05/2026',
    difficulty: 'Trung bình',
    strategy: `1. Hướng Dẫn Sử Dụng Kỹ Năng (Skill):
- Pet 1 (Covenant): Được Dova đẩy lượt và tăng công, dùng ngay Skill 3 ngắm bắn xuyên giáp one-shot Odin ngay lập tức trước khi Odin tích đủ tri thức.
- Pet 2 (Dova): Tốc độ cao nhất đội hình, dùng Skill 2 đẩy 100% thanh tấn công + buff Tăng Công cho Covenant.
- Pet 3 (Riley): Dùng Skill 3 và Skill 4 liên tục hồi máu, tăng công và miễn nhiễm để dọn dẹp Khmun và Bastet còn lại.

2. Yêu Cầu Chỉ Số Chi Tiết Từng Pet:
- Pet 1 (Covenant) yêu cầu (Atk: +1.950 | HP: +8.000 | Def: +450 | SPD: +60 | Rune: Rage + Will)
- Pet 2 (Dova) yêu cầu (Atk: +350 | HP: +21.000 | Def: +750 | SPD: +198 | Rune: Swift + Will)
- Pet 3 (Riley) yêu cầu (Atk: +300 | HP: +28.000 | Def: +1.100 | SPD: +125 | Rune: Violent + Will)`
  }
];
