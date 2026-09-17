import { SiegeCounterStrategy } from '../types';

export const DEFAULT_SIEGE_COUNTERS: SiegeCounterStrategy[] = [
  // Exact match from Screenshot 2: Geldnir + Ophilia + Theomars
  {
    id: 'counter-g-o-t-1',
    defenseMonsterIds: ['geldnir', 'ophilia', 'theomars'],
    counterMonsterIds: ['feng_yan', 'aaliyah', 'chilling'],
    rating: 5.0,
    ratingCount: 18,
    author: 'Ludio',
    date: '07/08/2026',
    turnOrder: 'Chilling > Aaliyah > Feng Yan',
    difficulty: 'Dễ',
    strategy: 'Chilling liên tục cướp khiên và trạng thái Threat của Ophilia cũng như bùa Bất tử (Endure) của Theomars. Aaliyah buff Miễn nhiễm + Tăng thủ liên tục khiến Theomars không thể cắn trừ giáp. Feng Yan solo dọn dẹp sạch sẽ.'
  },
  {
    id: 'counter-g-o-t-2',
    defenseMonsterIds: ['geldnir', 'ophilia', 'theomars'],
    counterMonsterIds: ['ariel', 'belial', 'tractor'],
    rating: 4.8,
    ratingCount: 25,
    author: 'xpto',
    date: '12/25/2025',
    turnOrder: 'Ariel > Tractor > Belial',
    difficulty: 'Trung bình',
    strategy: 'Tractor là quái nước không thể bị Def Break (trừ giáp), hút đòn đánh từ cả Theomars và khiêu khích Ophilia cực kỳ an toàn. Belial liên tục hồi sinh và đâm chiêu 2 xuyên giáp tiêu diệt Geldnir / Theo. Ariel giữ máu cho Tractor.'
  },
  {
    id: 'counter-g-o-t-3',
    defenseMonsterIds: ['geldnir', 'ophilia', 'theomars'],
    counterMonsterIds: ['covenant', 'songseol', 'dova'],
    rating: 4.7,
    ratingCount: 14,
    author: 'Janfy',
    date: '04/15/2024',
    turnOrder: 'Dova (Swift) > Covenant > Songseol',
    difficulty: 'Yêu cầu rune cao',
    strategy: 'Dova tốc độ cao đẩy 100% ATB cho Covenant. Covenant dùng kỹ năng 3 ngắm bắn xuyên giáp 50k+ sốc chết Theomars hoặc Geldnir ngay trước khi Ophilia kịp buff khiên. Songseol gảy đàn giảm hồi chiêu và sát thương địch.'
  },

  // Carcano + Vigor + Triana
  {
    id: 'counter-c-v-t-1',
    defenseMonsterIds: ['carcano', 'vigor', 'triana'],
    counterMonsterIds: ['tractor', 'aaliyah', 'feng_yan'],
    rating: 4.9,
    ratingCount: 32,
    author: 'Tomato',
    date: '02/10/2026',
    turnOrder: 'Aaliyah > Tractor > Feng Yan',
    difficulty: 'Dễ',
    strategy: 'Tractor bait toàn bộ sát thương của Carcano vì Carcano luôn ưu tiên bắn mục tiêu có def break hoặc khắc hệ, nhưng Tractor miễn nhiễm def break! Aaliyah giữ khiên và miễn nhiễm, Feng Yan xử lý Vigor rồi Triana.'
  },

  // Clara + Savannah + Theomars
  {
    id: 'counter-c-s-t-1',
    defenseMonsterIds: ['clara', 'savannah', 'theomars'],
    counterMonsterIds: ['leo', 'woosa', 'feng_yan'],
    rating: 4.9,
    ratingCount: 40,
    author: 'HowtoplaySW',
    date: '01/18/2026',
    turnOrder: 'Leo > Woosa > Feng Yan',
    difficulty: 'Trung bình',
    strategy: 'Leo triệt tiêu lợi thế tốc độ của Clara và Savannah. Woosa đi ngay sau đó bọc khiên và miễn nhiễm 3 lượt vô hiệu hóa hoàn toàn stun/def break. Feng Yan dọn dẹp từng con một.'
  },

  // Khmun + Bastet + Odin
  {
    id: 'counter-k-b-o-1',
    defenseMonsterIds: ['khmun', 'bastet', 'odin'],
    counterMonsterIds: ['covenant', 'dova', 'riley'],
    rating: 4.8,
    ratingCount: 22,
    author: 'FoxySW',
    date: '03/05/2026',
    turnOrder: 'Dova > Covenant > Riley',
    difficulty: 'Trung bình',
    strategy: 'Dova kéo Covenant lên one-shot Odin ngay lập tức trước khi Odin tích đủ 5 tri thức để bắn. Sau khi Odin nằm xuống, Khmun và Bastet không có đủ sát thương đe dọa.'
  }
];
