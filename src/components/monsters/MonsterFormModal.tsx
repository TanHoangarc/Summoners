import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Wand2,
  AlertTriangle,
  Copy,
  ArrowRight,
  ShieldAlert,
  Check,
  Clipboard,
} from 'lucide-react';
import { ElementType, Monster, MonsterRole } from '../../types';
import { ELEMENT_COLORS, ROLE_LABELS } from '../../utils/monsterHelpers';
import { MonsterAvatar } from '../common/MonsterAvatar';
import {
  autoDetectMonsterFromUrl,
  AutoDetectedMonsterInfo,
  searchMonsterCatalog,
  SwgtMonsterEntry,
  getFamilySiblingsForMonster,
} from '../../utils/monsterAutoDetector';
import { MonsterFamilySwitcher } from './MonsterFamilySwitcher';

interface MonsterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMonster: (monster: Monster) => void;
  editingMonster?: Monster | null;
  allMonsters?: Monster[];
}

export const MonsterFormModal: React.FC<MonsterFormModalProps> = ({
  isOpen,
  onClose,
  onSaveMonster,
  editingMonster,
  allMonsters = [],
}) => {
  const [currentEditingMonster, setCurrentEditingMonster] = useState<Monster | null>(editingMonster || null);
  const [name, setName] = useState('');
  const [awakenedName, setAwakenedName] = useState('');
  const [element, setElement] = useState<ElementType>('water');
  const [naturalStars, setNaturalStars] = useState<number>(5);
  const [role, setRole] = useState<MonsterRole>('attack');
  const [leaderSkill, setLeaderSkill] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Duplicate warning & confirmation state
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [showDuplicateBlockedPrompt, setShowDuplicateBlockedPrompt] = useState(false);

  // Avatar testing status & auto-fill notification
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [testingImage, setTestingImage] = useState(false);
  const [autoFilledInfo, setAutoFilledInfo] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setCurrentEditingMonster(editingMonster || null);
    setAllowDuplicate(false);
    setShowDuplicateBlockedPrompt(false);
    if (editingMonster) {
      setName(editingMonster.name);
      setAwakenedName(editingMonster.awakenedName || '');
      setElement(editingMonster.element);
      setNaturalStars(editingMonster.naturalStars);
      setRole(editingMonster.role);
      setLeaderSkill(editingMonster.leaderSkill || '');
      setAvatarUrl(editingMonster.avatarUrl);
      setImageValid(null);
      setAutoFilledInfo(null);
    } else {
      setName('');
      setAwakenedName('');
      setElement('water');
      setNaturalStars(5);
      setRole('attack');
      setLeaderSkill('');
      setAvatarUrl('');
      setImageValid(null);
      setAutoFilledInfo(null);
    }
  }, [editingMonster, isOpen]);

  // Intelligent parser: auto-detect monster stats when URL is pasted
  const detectAndApplyMonsterData = (url: string, force: boolean = false) => {
    if (!url || (editingMonster && !force)) return;
    const detected: AutoDetectedMonsterInfo | null = autoDetectMonsterFromUrl(url, allMonsters);
    if (detected) {
      if (detected.name) setName(detected.name);
      if (detected.awakenedName) setAwakenedName(detected.awakenedName);
      if (detected.element) setElement(detected.element);
      if (detected.naturalStars) setNaturalStars(detected.naturalStars);
      if (detected.role) setRole(detected.role);
      if (detected.leaderSkill) setLeaderSkill(detected.leaderSkill);

      setAutoFilledInfo(
        `✓ Đã tự động nhận diện: ${detected.name || 'Pet'} • Hệ ${detected.element.toUpperCase()} • ${detected.naturalStars}★ • ${ROLE_LABELS[detected.role]?.label || detected.role}${detected.leaderSkill ? ` • Leader: ${detected.leaderSkill}` : ''}`
      );
    }
  };

  // Test avatar URL
  const testAvatarUrl = (urlToTest: string) => {
    if (!urlToTest) {
      setImageValid(null);
      return;
    }
    setTestingImage(true);
    const img = new Image();
    img.src = urlToTest;
    img.onload = () => {
      setImageValid(true);
      setTestingImage(false);
    };
    img.onerror = () => {
      setImageValid(false);
      setTestingImage(false);
    };
  };

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    testAvatarUrl(url);
    detectAndApplyMonsterData(url);
  };

  const handleCopyAvatarUrl = async () => {
    if (!avatarUrl) return;
    try {
      await navigator.clipboard.writeText(avatarUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = avatarUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePasteAvatarUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          handleAvatarChange(text.trim());
          return;
        }
      }
    } catch {
      // If clipboard permission is denied or unsupported, prompt fallback
      const text = window.prompt('Dán link ảnh avatar của bạn vào đây:');
      if (text && text.trim()) {
        handleAvatarChange(text.trim());
      }
    }
  };

  const handleManualAutoDetect = () => {
    detectAndApplyMonsterData(avatarUrl, true);
  };

  const handleSelectCatalogEntry = (entry: SwgtMonsterEntry) => {
    setName(entry.name);
    const formattedAwakened = entry.unawakened?.trim()
      ? `${entry.unawakened.trim()} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})`
      : (entry.name.includes('/') ? `${entry.name.split('/')[0].replace(/^(Water|Fire|Wind|Light|Dark)\s+/i, '').trim()} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})` : '');
    setAwakenedName(formattedAwakened);
    setElement(entry.element as ElementType);
    setNaturalStars(entry.naturalStars);
    setRole((entry.role as MonsterRole) || 'attack');
    setLeaderSkill(entry.leaderSkill || '');
    if (entry.iconUrl) {
      setAvatarUrl(entry.iconUrl);
      testAvatarUrl(entry.iconUrl);
    }
    setAutoFilledInfo(
      `✓ Đã tự động nhận diện: ${entry.name} • Hệ ${entry.element.toUpperCase()} • ${entry.naturalStars}★ • ${ROLE_LABELS[entry.role as MonsterRole]?.label || entry.role || 'Tấn công'}${entry.leaderSkill ? ` • Leader: ${entry.leaderSkill}` : ''}`
    );
  };

  // Duplicate check logic
  const duplicateInfo = useMemo(() => {
    const currentId = currentEditingMonster?.id;
    const cleanName = name.trim().toLowerCase();
    const baseName = cleanName.replace(/\s+#\d+$/, '').trim();
    const cleanAvatar = avatarUrl.trim().toLowerCase();

    if (!cleanName && !cleanAvatar) return null;

    // Extract icon filename e.g. "unit_icon_0027_4_1.png"
    const iconMatch = cleanAvatar.match(/unit_icon_[a-zA-Z0-9_]+\.png/i);
    const iconFilename = iconMatch ? iconMatch[0].toLowerCase() : null;

    for (const m of allMonsters) {
      if (currentId && m.id === currentId) continue;

      const mCleanName = m.name.trim().toLowerCase();
      const mBaseName = mCleanName.replace(/\s+#\d+$/, '').trim();
      const mCleanAvatar = (m.avatarUrl || '').trim().toLowerCase();
      const mIconMatch = mCleanAvatar.match(/unit_icon_[a-zA-Z0-9_]+\.png/i);
      const mIconFilename = mIconMatch ? mIconMatch[0].toLowerCase() : null;

      // 1. Same exact or base name AND same element -> TRUE DUPLICATE
      if (baseName && mBaseName === baseName && m.element === element) {
        return {
          matchedMonster: m,
          isDirectDuplicate: true,
          type: 'name_and_element' as const,
          message: `Quái thú "${m.name}" (${ELEMENT_COLORS[m.element].label}) đã có trong kho của bạn!`,
        };
      }

      // 2. Same Avatar icon filename or exact same Avatar URL (only valid non-empty links)
      if (
        (iconFilename && mIconFilename && iconFilename === mIconFilename && m.element === element) ||
        (cleanAvatar && mCleanAvatar && cleanAvatar === mCleanAvatar && cleanAvatar.startsWith('http'))
      ) {
        return {
          matchedMonster: m,
          isDirectDuplicate: true,
          type: 'avatar' as const,
          message: `Ảnh đại diện này đang trùng khớp với pet "${m.name}" (${ELEMENT_COLORS[m.element].label}) trong kho!`,
        };
      }

      // 3. Same base name but different element -> Helpful notice (NOT duplicate)
      if (baseName && mBaseName === baseName && m.element !== element) {
        return {
          matchedMonster: m,
          isDirectDuplicate: false,
          type: 'name_different_element' as const,
          message: `Lưu ý: Bạn đã có quái thú mang tên "${m.name}" hệ ${ELEMENT_COLORS[m.element].label.toUpperCase()} trong kho.`,
        };
      }
    }

    return null;
  }, [name, element, avatarUrl, allMonsters, currentEditingMonster]);

  const handleSwitchToEditExisting = (existing: Monster) => {
    setCurrentEditingMonster(existing);
    setName(existing.name);
    setAwakenedName(existing.awakenedName || '');
    setElement(existing.element);
    setNaturalStars(existing.naturalStars);
    setRole(existing.role);
    setLeaderSkill(existing.leaderSkill || '');
    setAvatarUrl(existing.avatarUrl || '');
    setImageValid(true);
    setAllowDuplicate(false);
    setShowDuplicateBlockedPrompt(false);
    setAutoFilledInfo(`✓ Đang chuyển sang chỉnh sửa quái thú có sẵn: ${existing.name}`);
  };

  const handleSwitchToCatalogSibling = (entry: SwgtMonsterEntry) => {
    // If sibling already exists in user's collection, switch directly to editing it
    const existing = allMonsters.find(
      (m) =>
        m.element === entry.element &&
        (m.name.trim().toLowerCase() === entry.name.toLowerCase() ||
          m.name.trim().toLowerCase().startsWith(entry.name.toLowerCase()))
    );
    if (existing) {
      handleSwitchToEditExisting(existing);
      return;
    }

    // Otherwise, populate template to create/add this sibling
    setCurrentEditingMonster(null);
    setName(entry.name);
    const formattedAwakened = entry.unawakened?.trim()
      ? `${entry.unawakened.trim()} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})`
      : (entry.name.includes('/')
          ? `${entry.name.split('/')[0].replace(/^(Water|Fire|Wind|Light|Dark)\s+/i, '').trim()} (${entry.element.charAt(0).toUpperCase() + entry.element.slice(1)})`
          : '');
    setAwakenedName(formattedAwakened);
    setElement(entry.element as ElementType);
    setNaturalStars(entry.naturalStars);
    setRole((entry.role as MonsterRole) || 'attack');
    setLeaderSkill(entry.leaderSkill || '');
    if (entry.iconUrl) {
      setAvatarUrl(entry.iconUrl);
      testAvatarUrl(entry.iconUrl);
    }
    setAllowDuplicate(false);
    setShowDuplicateBlockedPrompt(false);
    setAutoFilledInfo(
      `✓ Đã tải mẫu quái thú [${entry.name}] (${entry.element.toUpperCase()}) - Bấm "Lưu Quái Thú" để thêm vào kho!`
    );
  };

  const handleChangeElementOnly = (newElem: ElementType) => {
    setElement(newElem);
    setAutoFilledInfo(`✓ Đã đổi hệ sang ${ELEMENT_COLORS[newElem].label.toUpperCase()}`);
  };

  // Resolve 5 elemental siblings for quick element switching
  const familyGroup = useMemo(() => {
    if (!currentEditingMonster && !name.trim() && !avatarUrl.trim()) return null;

    return getFamilySiblingsForMonster(
      {
        id: currentEditingMonster?.id,
        name: name || currentEditingMonster?.name || '',
        awakenedName: awakenedName || currentEditingMonster?.awakenedName,
        element,
        avatarUrl: avatarUrl || currentEditingMonster?.avatarUrl,
      },
      allMonsters
    );
  }, [currentEditingMonster, name, awakenedName, element, avatarUrl, allMonsters]);

  const handleAutoRenameDupe = () => {
    if (!duplicateInfo) return;
    const baseName = duplicateInfo.matchedMonster.name.replace(/\s+#\d+$/, '');
    let num = 2;
    while (allMonsters.some((m) => m.name.trim().toLowerCase() === `${baseName.toLowerCase()} #${num}`)) {
      num++;
    }
    setName(`${baseName} #${num}`);
    setAllowDuplicate(true);
    setShowDuplicateBlockedPrompt(false);
  };

  const handleConfirmAndSaveDupe = () => {
    setAllowDuplicate(true);
    setShowDuplicateBlockedPrompt(false);

    const monsterData: Monster = {
      id: currentEditingMonster ? currentEditingMonster.id : `custom-${Date.now()}`,
      name: name.trim(),
      awakenedName: awakenedName.trim() || undefined,
      element,
      naturalStars,
      role,
      baseSpeed: currentEditingMonster?.baseSpeed || 100,
      leaderSkill: leaderSkill.trim() || undefined,
      avatarUrl: avatarUrl.trim(),
      description: currentEditingMonster?.description || undefined,
      tags: currentEditingMonster?.tags,
      isCustom: true,
    };

    onSaveMonster(monsterData);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Duplicate guard: If direct duplicate is detected and user hasn't confirmed
    if (duplicateInfo?.isDirectDuplicate && !allowDuplicate) {
      setShowDuplicateBlockedPrompt(true);
      return;
    }

    const monsterData: Monster = {
      id: currentEditingMonster ? currentEditingMonster.id : `custom-${Date.now()}`,
      name: name.trim(),
      awakenedName: awakenedName.trim() || undefined,
      element,
      naturalStars,
      role,
      baseSpeed: currentEditingMonster?.baseSpeed || 100,
      leaderSkill: leaderSkill.trim() || undefined,
      avatarUrl: avatarUrl.trim(),
      description: currentEditingMonster?.description || undefined,
      tags: currentEditingMonster?.tags,
      isCustom: true,
    };

    onSaveMonster(monsterData);
    onClose();
  };

  if (!isOpen) return null;

  const previewMonster: Monster = {
    id: 'preview',
    name: name || 'Tên Pet',
    awakenedName: awakenedName || 'Family',
    element,
    naturalStars,
    role,
    baseSpeed: editingMonster?.baseSpeed || 100,
    avatarUrl,
    leaderSkill,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[95dvh] sm:max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {currentEditingMonster ? 'Chỉnh sửa Pet' : 'Thêm Pet Mới'}
              </h3>
              {!currentEditingMonster && (
                <p className="text-[10px] sm:text-[11px] text-teal-400/90 font-medium">
                  Tự động điền Tên, Hệ, Sao, Leader & Vai trò khi dán link ảnh
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 custom-scrollbar flex-1">
          
          {/* Quick Element Switcher Bar (Chuyển nhanh qua hệ khác để sửa) */}
          {familyGroup && (
            <MonsterFamilySwitcher
              familyGroup={familyGroup}
              currentMonsterId={currentEditingMonster?.id}
              currentElement={element}
              onSwitchToExisting={handleSwitchToEditExisting}
              onSwitchToCatalogSibling={handleSwitchToCatalogSibling}
              onChangeElementOnly={handleChangeElementOnly}
            />
          )}

          {/* Avatar URL & Live Preview Section */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                Link ảnh Avatar (URL)
              </label>
              <div className="flex items-center gap-2 text-[10px]">
                {avatarUrl && (
                  <>
                    {testingImage ? (
                      <span className="text-amber-400">Đang kiểm tra...</span>
                    ) : imageValid === true ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Hợp lệ
                      </span>
                    ) : imageValid === false ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Lỗi link
                      </span>
                    ) : null}
                  </>
                )}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleManualAutoDetect}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 cursor-pointer font-medium"
                    title="Phân tích lại link ảnh và tự điền thông tin"
                  >
                    <Wand2 className="w-3 h-3" />
                    Tự điền lại
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 items-center">
              {/* Live Preview Box */}
              <div className="flex flex-col items-center shrink-0">
                <MonsterAvatar
                  monster={previewMonster}
                  size="md"
                  showStars={false}
                  showName={false}
                />
              </div>

              {/* URL Input with Quick Copy & Paste Buttons */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="url"
                      placeholder="Dán link ảnh Pet (vd: https://do9d4mpqk497d.cloudfront.net/.../unit_icon_0027_4_1.png hoặc Swarfarm)"
                      value={avatarUrl}
                      onChange={(e) => handleAvatarChange(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                    />
                  </div>

                  {/* Quick Paste Button (Icon only) */}
                  <button
                    type="button"
                    onClick={handlePasteAvatarUrl}
                    className="w-8 h-8 inline-flex items-center justify-center bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 text-teal-300 hover:text-teal-200 border border-teal-500/30 rounded-xl transition-all shrink-0 cursor-pointer"
                    title="Dán link ảnh (Paste từ clipboard)"
                    aria-label="Dán link ảnh"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>

                  {/* Quick Copy Button (Icon only) */}
                  <button
                    type="button"
                    onClick={handleCopyAvatarUrl}
                    disabled={!avatarUrl}
                    className="w-8 h-8 inline-flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 disabled:text-slate-600 border border-slate-700 disabled:border-slate-800 rounded-xl transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    title={copiedLink ? 'Đã sao chép link' : 'Sao chép link ảnh (Copy)'}
                    aria-label="Sao chép link ảnh"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in duration-150" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Auto-detected notification banner */}
            {autoFilledInfo && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] animate-in fade-in">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                <span className="truncate">{autoFilledInfo}</span>
              </div>
            )}
          </div>

          {/* Basic Info: Name & Awakened Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Tên Pet (Thức tỉnh) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Vd: Oliver, Shizuka, Geldnir, Rahul..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
              {name.trim().length >= 2 && !editingMonster && (
                (() => {
                  const suggestions = searchMonsterCatalog(name);
                  if (suggestions.length === 0) return null;
                  return (
                    <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-slate-400">Gợi ý từ dữ liệu:</span>
                      {suggestions.slice(0, 4).map((s) => (
                        <button
                          key={`${s.name}-${s.element}-${s.com2usId}`}
                          type="button"
                          onClick={() => handleSelectCatalogEntry(s)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-500/40 text-[10px] cursor-pointer transition-colors"
                        >
                          {s.iconUrl && (
                            <img src={s.iconUrl} alt={s.name} className="w-3.5 h-3.5 rounded object-cover" />
                          )}
                          <span>{s.name} ({s.element.toUpperCase()} {s.naturalStars}★)</span>
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Họ tộc / Tên gốc (Unawakened)
              </label>
              <input
                type="text"
                placeholder="Vd: Sky Surfer, Lightning Emperor..."
                value={awakenedName}
                onChange={(e) => setAwakenedName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Duplicate Monster Warning Section */}
          {duplicateInfo && (
            <div
              className={`rounded-xl p-3 border transition-all animate-in fade-in duration-200 ${
                duplicateInfo.isDirectDuplicate
                  ? showDuplicateBlockedPrompt
                    ? 'bg-rose-950/40 border-rose-500/80 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
                    : 'bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-950/30'
                  : 'bg-sky-950/25 border-sky-500/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    duplicateInfo.isDirectDuplicate
                      ? showDuplicateBlockedPrompt
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {duplicateInfo.isDirectDuplicate ? (
                    showDuplicateBlockedPrompt ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-bold ${
                        duplicateInfo.isDirectDuplicate
                          ? showDuplicateBlockedPrompt
                            ? 'text-rose-300'
                            : 'text-amber-300'
                          : 'text-sky-300'
                      }`}
                    >
                      {duplicateInfo.isDirectDuplicate
                        ? 'Cảnh báo: Phát hiện Quái Thú Trùng Lặp!'
                        : 'Thông tin quái thú tương tự'}
                    </p>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                        duplicateInfo.isDirectDuplicate
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {duplicateInfo.isDirectDuplicate ? 'Đã tồn tại' : 'Khác hệ'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {duplicateInfo.message}
                  </p>

                  {/* Existing Monster Preview Card */}
                  {duplicateInfo.isDirectDuplicate && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MonsterAvatar
                          monster={duplicateInfo.matchedMonster}
                          size="sm"
                          showStars={true}
                          showName={false}
                        />
                        <div className="min-w-0 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 truncate">
                              {duplicateInfo.matchedMonster.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                                ELEMENT_COLORS[duplicateInfo.matchedMonster.element].badge
                              }`}
                            >
                              {ELEMENT_COLORS[duplicateInfo.matchedMonster.element].label}
                            </span>
                            <span className="text-amber-400 font-bold text-[10px]">
                              {duplicateInfo.matchedMonster.naturalStars}★
                            </span>
                          </div>
                          <p className="text-slate-400 text-[10px] truncate mt-0.5">
                            {duplicateInfo.matchedMonster.awakenedName ||
                              ROLE_LABELS[duplicateInfo.matchedMonster.role]?.label}
                            {duplicateInfo.matchedMonster.leaderSkill
                              ? ` • ${duplicateInfo.matchedMonster.leaderSkill}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      {/* Switch to Edit button */}
                      <button
                        type="button"
                        onClick={() => handleSwitchToEditExisting(duplicateInfo.matchedMonster)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                        title="Mở quái thú có sẵn này để chỉnh sửa thay vì tạo mới"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Sửa pet có sẵn</span>
                      </button>
                    </div>
                  )}

                  {/* Quick Action Helpers */}
                  {duplicateInfo.isDirectDuplicate && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={handleAutoRenameDupe}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                        title="Tự động thêm hậu tố #2 để phân biệt bản sao"
                      >
                        <Copy className="w-3 h-3 text-amber-400" />
                        <span>Đổi tên thành {duplicateInfo.matchedMonster.name.replace(/\s+#\d+$/, '')} #2</span>
                      </button>

                      <label className="inline-flex items-center gap-1.5 text-[11px] text-amber-200/90 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowDuplicate}
                          onChange={(e) => {
                            setAllowDuplicate(e.target.checked);
                            setShowDuplicateBlockedPrompt(false);
                          }}
                          className="w-3.5 h-3.5 rounded border-amber-600 bg-slate-900 text-teal-500 focus:ring-teal-400 focus:ring-offset-slate-900 cursor-pointer"
                        />
                        <span>Tôi vẫn muốn thêm bản sao (Dupe)</span>
                      </label>
                    </div>
                  )}

                  {/* High visibility alert if user tried to submit without confirming */}
                  {showDuplicateBlockedPrompt && (
                    <div className="mt-2 p-2.5 rounded-lg bg-rose-950/90 border border-rose-500/80 text-[11px] text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="font-semibold">
                        ⚠️ Quái thú này đã có trong danh sách! Hãy chọn một cách xử lý:
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSwitchToEditExisting(duplicateInfo.matchedMonster)}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Sửa pet có sẵn
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoRenameDupe}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Đổi tên #2
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmAndSaveDupe}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium text-[10px] cursor-pointer"
                        >
                          Vẫn lưu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Element, Stars & Role (Compact Small Layout) */}
          <div className="space-y-2.5 p-2.5 sm:p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            {/* Nguyên tố (Hệ) - hiển thị nhỏ */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Nguyên tố (Hệ)
              </label>
              <div className="grid grid-cols-5 gap-1 sm:flex sm:flex-wrap sm:gap-1.5">
                {(['water', 'fire', 'wind', 'light', 'dark'] as ElementType[]).map((elem) => {
                  const info = ELEMENT_COLORS[elem];
                  const active = element === elem;
                  return (
                    <button
                      key={elem}
                      type="button"
                      onClick={() => setElement(elem)}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        active
                          ? `${info.badge} ring-1 ring-white/30 font-bold scale-102`
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={info.iconUrl} alt={elem} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" />
                      <span className="capitalize text-[10.5px] sm:text-xs font-medium truncate">
                        {info.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Số sao gốc (Natural Stars) - hiển thị nhỏ */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Số sao gốc (Natural Stars)
              </label>
              <div className="grid grid-cols-5 gap-1 sm:flex sm:items-center sm:gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNaturalStars(star)}
                    className={`py-1 sm:py-0.5 px-2 rounded-lg border text-center text-xs sm:text-[11px] transition-all cursor-pointer ${
                      naturalStars === star
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold scale-102'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{star}★</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vai trò (Role) - hiển thị nhỏ */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Vai trò (Role)
              </label>
              <div className="grid grid-cols-4 gap-1 sm:flex sm:flex-wrap sm:gap-1">
                {(['attack', 'defense', 'hp', 'support'] as MonsterRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1 sm:py-0.5 px-1.5 sm:px-2 rounded-lg border text-center text-[10px] min-[360px]:text-[10.5px] sm:text-[11px] transition-all cursor-pointer truncate ${
                      role === r
                        ? `${ROLE_LABELS[r].color} font-bold scale-102`
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ROLE_LABELS[r].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leader Skill */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Kỹ năng Đội trưởng (Leader Skill)
            </label>
            <input
              type="text"
              placeholder="Vd: Arena Spd 33%, Guild Def 33%..."
              value={leaderSkill}
              onChange={(e) => setLeaderSkill(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors cursor-pointer min-h-[36px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 sm:px-5 py-2 sm:py-1.5 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[36px] ${
                duplicateInfo?.isDirectDuplicate && !allowDuplicate
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950'
              }`}
            >
              {currentEditingMonster
                ? 'Lưu Thay Đổi'
                : duplicateInfo?.isDirectDuplicate
                ? allowDuplicate
                  ? 'Thêm Quái Thú (Bản sao)'
                  : 'Xác nhận Thêm Pet'
                : 'Thêm Quái Thú'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
