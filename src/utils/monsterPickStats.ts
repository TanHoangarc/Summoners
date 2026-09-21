import { Monster, RTAMatchRecord, SavedSiegeDefense, SiegeCounterStrategy } from '../types';
import { STORAGE_KEY_SIEGE_DEFENSES, DEFAULT_SAVED_DEFENSES } from '../lib/siegeDefenseService';
import { STORAGE_KEY_SIEGE_COUNTERS } from '../lib/siegeCounterService';

export const MONSTER_PICK_STORAGE_KEY = 'sw_monster_pick_counts_v1';

// =========================================================================
// 1. ĐIỂM KHỞI ĐẦU CHUẨN META RTA (World Arena)
// =========================================================================
export const RTA_META_BASELINE: Record<string, number> = {
  // --- NƯỚC (WATER) ---
  moore: 130, // Striker Water - Top meta speed stripper cut turn
  shizuka: 125, // Onmyouji Water - Copy buff/debuff revive
  woosa: 115, // Pioneer Water - 3-turn immunity & shield
  miles: 112, // Sky Surfer Water - Pure damage speed scaling
  nana: 105, // Mage Water - Soul stone auto revive
  haegang: 100, // Art Master Water - Anti-strip ATB push
  theomars: 92, // Ifrit Water - Endure elemental advantage
  verad: 90, // Dragon Water - AoE Freeze zero ATB
  bastet: 88, // Desert Queen Water - ATB boost & Atk buff shield
  aaliyah: 84, // Totemist Water - Immunity def buff heal
  chandra: 82, // Beast Monk Water - Hug protect stun
  camilla: 80, // Valkyrja Water - Tank cleanse crit reduction
  belial: 72, // Demon Water - Self revive ignore def
  vigor: 70, // Werewolf Water 2A - Spd buff anti-crit def break
  tractor: 66, // Frankenstein Water - No def break provoke fire tank
  covenant: 62, // Sniper Mk.I Water - Ignore def nuker
  chilling: 60, // Jack-o'-lantern Water - Steal buffs
  ariel: 56, // Archangel Water - Massive heal
  songseol: 52, // String Master Water

  // --- LỬA (FIRE) ---
  karnal: 120, // Slayer Fire - AoE stun slow ATB steal tank
  vanessa: 118, // Valkyrja Fire - 33% spd lead passive revive
  douglas: 114, // Striker Fire - Glancing counter attack
  sekhmet: 108, // Desert Queen Fire - Reset cooltime steal buff
  juno: 104, // Oracle Fire - Passive cleanse heal on debuffs
  racuni: 98, // Harg Fire - Turn cycling cleanse heal
  masha: 94, // Beast Rider Fire - Immune to slow high speed nuker
  tomoe: 88, // Onmyouji Fire - Karma debuff spreader
  clara: 84, // Pierret Fire - Strip stun 100% HP
  carcano: 82, // Sniper Mk.I Fire - Target def break nuker
  ophilia: 78, // Paladin Fire - Threat state shield
  tesarion: 76, // Ifrit Fire - Oblivion disable passives
  chiwu: 74, // Pioneer Fire - 24% spd lead strip
  verdehile: 72, // Vampire Fire - 20% ATB boost on crits
  raki: 70, // Hell Lady Fire - Anti-revive def break
  laika: 68, // Dragon Knight Fire - Cannot be one shot no glancing
  bellenus: 65, // Druid Fire - AoE provoke def break stun
  rica: 62, // Occult Girl Fire - DoTs slow stun

  // --- GIÓ (WIND) ---
  oliver: 135, // Sky Surfer Wind - Top pick 33% spd lead infinite cycling
  savannah: 122, // Beast Rider Wind - AoE def break slow ATB drain
  cheongpung: 118, // Art Master Wind - Strip def break max cooltime
  seara: 112, // Oracle Wind - 24% spd lead bomb detonator
  sagar: 106, // Slayer Wind - Strip cooltime reset provoke all
  dominic: 102, // Weapon Master Wind - Pure damage vampire passive
  riley: 98, // Totemist Wind - Cleanse immunity atk buff continuous heal
  leo: 95, // Dragon Knight Wind - Speed cap passive first turn
  tiana: 92, // Polar Queen Wind - Irresistible strip 30% ATB boost
  jamire: 88, // Dragon Wind - Full cooldown refresh spd lead
  feng_yan: 86, // Panda Warrior Wind - Counter def scaling tank
  triana: 84, // Harp Magician Wind - Death prevention turn gain
  ethna: 82, // Hell Lady Wind - High base speed strip stun
  ganymede: 78, // Fairy King Wind - Ventilate reset cooltime
  diana: 75, // Unicorn Wind - Shield turn cycling infinite strikes
  charlotte: 70, // Occult Girl Wind - AoE ATB pushback glancing

  // --- ÁNH SÁNG (LIGHT) ---
  tian_lang: 128, // Panda Warrior Light - Anti-ATB boost cut turn
  veronica: 125, // Battle Angel Light - 24% spd lead strip cooltime up
  lucifer: 115, // Demon Light - Damage to ATB push cleave
  lora: 110, // Occult Girl Light - 24% spd lead strip def buff
  artamiel: 104, // Archangel Light - Counter attack on crits def scaling
  geldnir: 100, // Lightning Emperor Light - Passive continuous heal
  julianne: 96, // Vampire Light - Cannot die while allies alive
  isis: 92, // Desert Queen Light - AoE Oblivion and Silence
  pontos: 88, // Sea Emperor Light - 24% spd lead 3-turn immunity cleanse
  dova: 85, // Harg Light - 100% ATB boost to slowest ally
  leah: 82, // Mystic Witch Light 2A - Speed scaling AoE nuke
  shan: 80, // Chimera Light - Spd boost stun ATB push
  molly: 78, // Mermaid Light - Passive heal glancing shield
  eshir: 75, // Werewolf Light 2A - High base speed ATB boost heal
  fran: 72, // Fairy Queen Light - Atk buff immunity heal
  craig: 70, // Cannon Girl Light - 100% ATB boost HP reduction

  // --- BÓNG TỐI (DARK) ---
  ragdoll: 130, // Dragon Knight Dark - 15% ATB push on ally crits
  nephthys: 126, // Desert Queen Dark - Irresistible debuffs 24% spd lead
  maximillian: 122, // Weapon Master Dark - 24% spd lead AoE def break atk buff
  giana: 120, // Oracle Dark - Strip stun bomb 24% spd lead
  han: 112, // Ninja Dark - 30% spd lead single target turn cycling
  woonsa: 108, // Pioneer Dark - 118 base spd strip steal shield
  nicki: 104, // Occult Girl Dark - Cleanse heal 3-turn atk buff
  vivachel: 100, // Harp Magician Dark - HP bar swap sleep
  pater: 96, // Druid Dark - Provoke stun immune cleanse
  kiki: 92, // Mage Dark - Multi-debuff passive sustain
  betta: 86, // Mermaid Dark - Anti-crit immunity heal revive
  frigate: 82, // Pirate Captain Dark - 50% ATB boost cooldown reduction
  veromos: 78, // Ifrit Dark - Cleanse on turn stun def scaling
  miho: 74, // Martial Cat Dark 2A - Counter on crits survive fatal
};

// =========================================================================
// 2. ĐIỂM KHỞI ĐẦU CHUẨN META SIEGE (Guild Siege Battle - Thủ & Công)
// =========================================================================
export const SIEGE_META_BASELINE: Record<string, number> = {
  // --- NƯỚC (WATER) ---
  theomars: 135, // Ifrit Water - Vua thủ và công Siege mọi thời đại (Endure + Def break + Elemental Adv)
  aaliyah: 128, // Totemist Water - Engine phòng thủ và counter số 1 (Immunity, Def buff, Invincible)
  camilla: 125, // Valkyrja Water - Siêu tank thủ nhà 1vs3, giải debuff hồi máu giảm sát thương
  tractor: 122, // Frankenstein Water - Vua counter quái Phong/Hỏa (Savannah, Carcano, Douglas), không bị def break
  woosa: 118, // Pioneer Water - 3-turn immunity & khiên dày che chở team
  miles: 115, // Sky Surfer Water - Dame chuẩn theo tốc cực mạnh trong team 3 người
  vigor: 112, // Werewolf Water 2A - Trụ cột def 4* và công thành tốc độ cao (Spd buff, Heal, Def break, Anti-crit)
  chandra: 108, // Beast Monk Water - Kỹ năng Hug bảo vệ carry tối thượng
  belial: 105, // Demon Water - Chiến thần suicide ignore def diệt các team thủ trâu bò
  bastet: 102, // Desert Queen Water - Đẩy ATB, khiên, buff atk cho cleave team
  covenant: 98, // Sniper Mk.I Water - Xuyên giáp one-shot 50k+ xóa sổ mục tiêu then chốt
  shizuka: 95, // Onmyouji Water - Sao chép buff/debuff và hồi sinh
  moore: 92, // Striker Water - Tranh chấp lượt đầu và phá giáp
  chilling: 90, // Jack-o'-lantern Water - Khắc tinh của Woosa/Bastet, cướp buff liên tục
  verad: 86, // Dragon Water - Đóng băng khống chế hoàn toàn
  ariel: 80, // Archangel Water - Nemesis hồi máu lật kèo
  songseol: 72, // String Master Water - Đấu tiêu hao

  // --- LỬA (FIRE) ---
  carcano: 135, // Sniper Mk.I Fire - Vua Def Siege 4* và 5*, tự động ngắm bắn trừ giáp, sát thương dứt điểm cực khủng
  khmun: 130, // Anubis Fire - Vua tốc độ thủ bang hội 24% spd lead, tạo khiên bảo vệ đồng đội yếu máu
  ophilia: 125, // Paladin Fire - Trạng thái Threat State ép địch tấn công, khiên + miễn nhiễm
  clara: 122, // Pierret Fire - Đệ nhất mở combat def 4*, xóa toàn bộ hiệu ứng có lợi và làm choáng 100%
  douglas: 118, // Striker Fire - Đòn phản công liếc glancing cực gắt vào quái hệ Phong/Thủy
  tesarion: 115, // Ifrit Fire - Khóa sạch nội tại hiểm ác (Theo, Camilla, Perna, Savannah, Douglas)
  karnal: 112, // Slayer Fire - Lead 33% HP, làm chậm trừ thanh tấn công và choáng diện rộng
  masha: 108, // Beast Rider Fire - Miễn dịch làm chậm, tốc biến siêu nuker
  vanessa: 105, // Valkyrja Fire - 33% spd lead và hồi sinh bảo kê carry
  juno: 102, // Oracle Fire - Khắc chế các team rải debuff diện rộng, tự xóa và hồi máu cả đội
  racuni: 100, // Harg Fire - Hồi máu giải khống chế liên tục mỗi lượt, đẩy ATB đồng minh
  sekhmet: 96, // Desert Queen Fire - Khóa chiêu và cướp toàn bộ buff đối phương
  laika: 92, // Dragon Knight Fire - Không bị sốc sát thương chết, phản đòn làm choáng
  bellenus: 88, // Druid Fire - Trừ giáp, khiêu khích và làm choáng diện rộng
  chiwu: 84, // Pioneer Fire - 24% spd lead và xóa buff
  verdehile: 80, // Vampire Fire - Tăng 40% thanh tấn công mỗi đòn đánh
  raki: 76, // Hell Lady Fire - Diệt vĩnh viễn không cho hồi sinh
  rica: 72, // Occult Girl Fire - Rải độc thiêu đốt làm chậm

  // --- GIÓ (WIND) ---
  savannah: 132, // Beast Rider Wind - Top quái thú def & công áp đảo nhất Siege (Def break, Slow, Drain ATB)
  feng_yan: 130, // Panda Warrior Wind - Chiến thần thủ nhà và solo counter các team không có ignore def
  riley: 126, // Totemist Wind - Động cơ hồi máu, miễn nhiễm, buff công vô tận
  windy: 122, // Jack-o'-lantern Wind - Khắc tinh hàng đầu của Carcano, Savannah, Dominic (khiên ảo theo đòn đánh)
  skogul: 120, // Giant Warrior Wind - Ném đá sát thương chuẩn toàn đội, cực kỳ nguy hiểm trong team thủ
  leo: 116, // Dragon Knight Wind - Khóa trần tốc độ, biến mọi team đối thủ chạy nhanh thành vô dụng
  dominic: 112, // Weapon Master Wind - Sát thương nội tại xuyên trừ giáp và hút máu bền bỉ
  triana: 110, // Harp Magician Wind - Cứu chết đồng đội bị dồn dame, tự cướp lượt cắt chuỗi combo
  tiana: 106, // Polar Queen Wind - Xóa buff tuyệt đối không thể kháng, đẩy 30% ATB cho cleave công thành
  seara: 104, // Oracle Wind - 24% Spd lead, ném bom kích nổ dứt điểm đối phương
  cheongpung: 100, // Art Master Wind - Tẩy buff, trừ giáp và tăng tối đa thời gian hồi chiêu
  oliver: 98, // Sky Surfer Wind - Reset kỹ năng liên hoàn
  jamire: 94, // Dragon Wind - Làm mới toàn bộ thời gian hồi chiêu của cả đội
  ethna: 88, // Hell Lady Wind - Tốc độ cực nhanh, xóa buff và stun
  sagar: 85, // Slayer Wind - Trừ buff, reset chiêu và khiêu khích
  diana: 80, // Unicorn Wind - Đổi dạng hồi khiên và tấn công liên hoàn
  ganymede: 76, // Fairy King Wind - Thông gió và reset chiêu
  charlotte: 72, // Occult Girl Wind - Đẩy lùi thanh tấn công

  // --- ÁNH SÁNG (LIGHT) ---
  geldnir: 135, // Lightning Emperor Light - Vua thủ thành Nat5 số 1 thế giới (Hồi máu tự động mỗi khi bị đánh)
  artamiel: 118, // Archangel Light - Phản đòn khi bị bạo kích, dame thủ trâu bò
  julianne: 115, // Vampire Light - Không thể bị giết khi đồng đội còn sống, stun liên tục
  molly: 112, // Mermaid Light - Nội tại tạo khiên, glancing làm đối thủ không thể dồn sát thương
  eshir: 110, // Werewolf Light 2A - 115 spd cơ bản đẩy ATB, trừ giáp và hồi máu
  leah: 108, // Mystic Witch Light 2A - Tốc độ thành sát thương AoE thổi bay team địch
  tian_lang: 106, // Panda Warrior Light - Cắt lượt đẩy ATB
  shan: 102, // Chimera Light - Tăng tốc độ và làm choáng diện rộng
  veronica: 100, // Battle Angel Light - Xóa buff và tăng thời gian hồi chiêu
  dova: 96, // Harg Light - Kéo 100% ATB cho quái nuker chậm chạp
  lucifer: 94, // Demon Light - Đẩy ATB theo lượng sát thương gây ra
  lora: 90, // Occult Girl Light - Xóa buff và tăng phòng thủ
  fran: 88, // Fairy Queen Light - Buff công, miễn nhiễm và hồi máu
  isis: 85, // Desert Queen Light - AoE câm lặng và khóa nội tại
  craig: 82, // Cannon Girl Light - 100% ATB boost
  pontos: 80, // Sea Emperor Light - Miễn nhiễm 3 lượt và giải hiệu ứng

  // --- BÓNG TỐI (DARK) ---
  ragdoll: 128, // Dragon Knight Dark - Đẩy 15% ATB toàn đội mỗi khi dính đòn bạo kích
  maximillian: 124, // Weapon Master Dark - 24% Spd lead, trừ giáp và buff công cực mạnh
  giana: 120, // Oracle Dark - Choáng và ném bom khi đối phương có buff
  betta: 115, // Mermaid Dark - Kháng bạo kích, hồi sinh, miễn nhiễm và hồi máu
  frigate: 110, // Pirate Captain Dark - Đẩy 50% ATB và giảm 1 lượt hồi chiêu
  woonsa: 106, // Pioneer Dark - 118 tốc cơ bản xóa buff và tạo khiên theo máu
  nicki: 102, // Occult Girl Dark - Buff công 3 lượt, giải khống chế và hồi phục
  vivachel: 98, // Harp Magician Dark - Hoán đổi thanh máu và ru ngủ
  pater: 94, // Druid Dark - Giải khống chế và miễn nhiễm hoàn toàn
  kiki: 90, // Mage Dark - Rải đa hiệu ứng xấu và hồi máu thụ động
  miho: 86, // Martial Cat Dark 2A - Phản đòn khi bị chí mạng và sống sót với 1 HP
  veromos: 82, // Ifrit Dark - Giải 1 hiệu ứng xấu mỗi lượt và làm choáng theo giáp
  frigate_comp: 78, // Dark booster
};

// =========================================================================
// THỐNG KÊ LƯỢT CHỌN TRỰC TIẾP TỪ LOCALSTORAGE
// =========================================================================
export function getStoredUserPickCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(MONSTER_PICK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading monster pick counts from storage:', e);
  }
  return {};
}

/**
 * Ghi nhận thêm lượt chọn cho pet (dùng chung cho cả RTA và Siege)
 */
export function recordMonsterPick(monsterId: string, count: number = 1): void {
  if (!monsterId) return;
  try {
    const current = getStoredUserPickCounts();
    const updated = {
      ...current,
      [monsterId]: (current[monsterId] || 0) + count,
    };
    localStorage.setItem(MONSTER_PICK_STORAGE_KEY, JSON.stringify(updated));

    // Bắn event để các component lắng nghe và sắp xếp lại
    window.dispatchEvent(
      new CustomEvent('sw_monster_picks_updated', {
        detail: { monsterId, updatedCounts: updated },
      })
    );
  } catch (e) {
    console.error('Error recording monster pick:', e);
  }
}

// =========================================================================
// 3. THỐNG KÊ LỊCH SỬ ĐẤU RTA
// =========================================================================
export function computeRTAPickCounts(matchHistory: RTAMatchRecord[] = []): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!Array.isArray(matchHistory) || matchHistory.length === 0) return counts;

  matchHistory.forEach((record) => {
    // Đếm quái thú Team Tôi (trọng số cao hơn vì là người dùng trực tiếp chọn)
    record.myTeam?.forEach((slot) => {
      if (slot.monsterId) {
        counts[slot.monsterId] = (counts[slot.monsterId] || 0) + 4;
      }
    });
    // Đếm quái thú Team Địch
    record.enemyTeam?.forEach((slot) => {
      if (slot.monsterId) {
        counts[slot.monsterId] = (counts[slot.monsterId] || 0) + 1.5;
      }
    });
  });

  return counts;
}

// =========================================================================
// 4. THỐNG KÊ DỮ LIỆU CÔNG THÀNH CHIẾN (SIEGE) ĐÃ LƯU TRỮ
// =========================================================================
export function computeSiegePickCounts(
  customDefenses?: SavedSiegeDefense[],
  customCounters?: SiegeCounterStrategy[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  // 1. Quét danh sách Đội Hình Phòng Thủ Siege đã lưu
  let defenses = customDefenses;
  if (!defenses) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SIEGE_DEFENSES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) defenses = parsed;
      }
    } catch {}
    if (!defenses) defenses = DEFAULT_SAVED_DEFENSES;
  }

  if (Array.isArray(defenses)) {
    defenses.forEach((def) => {
      def.monsterIds?.forEach((mId) => {
        if (mId) {
          counts[mId] = (counts[mId] || 0) + 6; // +6 điểm mỗi lần nằm trong đội hình thủ Siege
        }
      });
    });
  }

  // 2. Quét danh sách Đội Hình Counter Siege đã lưu
  let counters = customCounters;
  if (!counters) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SIEGE_COUNTERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) counters = parsed;
      }
    } catch {}
  }

  if (Array.isArray(counters)) {
    counters.forEach((strategy) => {
      // Quái thú công counter (+8 điểm - cực kỳ giá trị)
      strategy.counterMonsterIds?.forEach((cId) => {
        if (cId) {
          counts[cId] = (counts[cId] || 0) + 8;
        }
      });
      // Quái thú trong đội hình phòng thủ đối phương bị counter (+4 điểm)
      strategy.defenseMonsterIds?.forEach((dId) => {
        if (dId) {
          counts[dId] = (counts[dId] || 0) + 4;
        }
      });
    });
  }

  return counts;
}

// =========================================================================
// 5. THUẬT TOÁN TÍNH ĐIỂM NGẦM TỔNG HỢP CẢ RTA VÀ SIEGE
// =========================================================================
export interface PickScoreOptions {
  mode?: 'all' | 'rta' | 'siege'; // Chế độ đánh giá
  matchHistory?: RTAMatchRecord[]; // Dữ liệu trận RTA
  savedDefenses?: SavedSiegeDefense[]; // Dữ liệu thủ Siege
  savedCounters?: SiegeCounterStrategy[]; // Dữ liệu counter Siege
  userCounts?: Record<string, number>; // Lượt chọn từ người dùng
}

/**
 * Tính điểm ngầm (Implicit Pick Score) cho một quái thú.
 * Kết hợp đa tầng:
 * - Meta Baseline RTA (World Arena)
 * - Meta Baseline Siege (Guild Siege)
 * - Lịch sử các trận đấu RTA đã đánh
 * - Các đội hình phòng thủ và đội hình counter Siege đã lưu trữ
 * - Số lượt click chọn trực tiếp của người dùng
 *
 * KHÔNG HIỂN THỊ SỐ ĐIỂM RA GIAO DIỆN theo yêu cầu người dùng.
 */
export function getMonsterPickScore(
  monsterId: string,
  options?: PickScoreOptions
): number {
  if (!monsterId) return 0;

  const mode = options?.mode || 'all';
  const rtaBaseline = RTA_META_BASELINE[monsterId] || 0;
  const siegeBaseline = SIEGE_META_BASELINE[monsterId] || 0;
  const userDirect = (options?.userCounts || getStoredUserPickCounts())[monsterId] || 0;

  // Điểm từ lịch sử RTA
  const rtaHistoryCounts = computeRTAPickCounts(options?.matchHistory);
  const rtaHistoryScore = rtaHistoryCounts[monsterId] || 0;

  // Điểm từ dữ liệu Siege
  const siegeCounts = computeSiegePickCounts(options?.savedDefenses, options?.savedCounters);
  const siegeActivityScore = siegeCounts[monsterId] || 0;

  // Tính toán theo từng ngữ cảnh
  if (mode === 'rta') {
    // Ưu tiên RTA: 100% RTA + 40% Siege + Dữ liệu thực tế
    return (
      rtaBaseline * 1.0 +
      siegeBaseline * 0.4 +
      rtaHistoryScore * 1.2 +
      siegeActivityScore * 0.4 +
      userDirect * 6
    );
  } else if (mode === 'siege') {
    // Ưu tiên Siege: 100% Siege + 40% RTA + Dữ liệu thực tế
    return (
      siegeBaseline * 1.0 +
      rtaBaseline * 0.4 +
      siegeActivityScore * 1.2 +
      rtaHistoryScore * 0.4 +
      userDirect * 6
    );
  }

  // Chế độ 'all' (Mặc định tổng hợp cân bằng cả hai):
  // 70% RTA Baseline + 70% Siege Baseline + Tất cả điểm thực tế tích lũy
  return (
    rtaBaseline * 0.7 +
    siegeBaseline * 0.7 +
    rtaHistoryScore +
    siegeActivityScore +
    userDirect * 5
  );
}

// =========================================================================
// 6. SẮP XẾP QUÁI THÚ THEO THUẬT TOÁN TÍNH ĐIỂM NGẦM
// =========================================================================
/**
 * Sắp xếp danh sách pet: Các pet được chọn nhiều nhất cả RTA & Siege lên trên cùng.
 * Thứ tự ưu tiên:
 * 1. Tổng điểm ngầm cao hơn (RTA + Siege + Lượt dùng thực tế)
 * 2. Số sao tự nhiên cao hơn (5★ > 4★ > 3★ > 2★)
 * 3. Tên bảng chữ cái A-Z
 */
export function sortMonstersByPickFrequency(
  monsters: Monster[],
  optionsOrHistory?: RTAMatchRecord[] | PickScoreOptions
): Monster[] {
  if (!Array.isArray(monsters) || monsters.length <= 1) {
    return monsters;
  }

  // Chuẩn hóa tham số đầu vào (hỗ trợ cả cú pháp cũ matchHistory[])
  let options: PickScoreOptions;
  if (Array.isArray(optionsOrHistory)) {
    options = { matchHistory: optionsOrHistory, mode: 'all' };
  } else {
    options = optionsOrHistory || { mode: 'all' };
  }

  const mode = options.mode || 'all';
  const userCounts = options.userCounts || getStoredUserPickCounts();
  const rtaHistoryCounts = computeRTAPickCounts(options.matchHistory);
  const siegeCounts = computeSiegePickCounts(options.savedDefenses, options.savedCounters);

  // Pre-calculate score map for speed
  const scoreMap = new Map<string, number>();
  monsters.forEach((m) => {
    const rtaBase = RTA_META_BASELINE[m.id] || 0;
    const siegeBase = SIEGE_META_BASELINE[m.id] || 0;
    const user = userCounts[m.id] || 0;
    const rtaHist = rtaHistoryCounts[m.id] || 0;
    const siegeAct = siegeCounts[m.id] || 0;

    let total = 0;
    if (mode === 'rta') {
      total = rtaBase * 1.0 + siegeBase * 0.4 + rtaHist * 1.2 + siegeAct * 0.4 + user * 6;
    } else if (mode === 'siege') {
      total = siegeBase * 1.0 + rtaBase * 0.4 + siegeAct * 1.2 + rtaHist * 0.4 + user * 6;
    } else {
      total = rtaBase * 0.7 + siegeBase * 0.7 + rtaHist + siegeAct + user * 5;
    }

    scoreMap.set(m.id, total);
  });

  return [...monsters].sort((a, b) => {
    const scoreA = scoreMap.get(a.id) ?? 0;
    const scoreB = scoreMap.get(b.id) ?? 0;

    // 1. Quái thú có điểm ngầm cao hơn được ưu tiên lên trước
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // 2. Ưu tiên số sao gốc (Nat 5 > Nat 4 > Nat 3)
    if (b.naturalStars !== a.naturalStars) {
      return b.naturalStars - a.naturalStars;
    }

    // 3. Tên chữ cái
    return a.name.localeCompare(b.name);
  });
}
