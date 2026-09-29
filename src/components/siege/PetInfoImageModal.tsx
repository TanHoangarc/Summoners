import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Trash2,
  Check,
  Clipboard,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Monster } from '../../types';
import { MonsterAvatar } from '../common/MonsterAvatar';

interface PetInfoImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  monster?: Monster | null;
  slotIndex: number;
  currentImageUrl?: string | null;
  onSaveImage: (imageUrl: string | null) => void;
  teamTitle?: string;
}

export const PetInfoImageModal: React.FC<PetInfoImageModalProps> = ({
  isOpen,
  onClose,
  monster,
  slotIndex,
  currentImageUrl,
  onSaveImage,
  teamTitle,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'url'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setImageUrl(currentImageUrl || '');
      setUrlInput(currentImageUrl && !currentImageUrl.startsWith('data:') ? currentImageUrl : '');
      setStatusMessage(null);
      setErrorMessage(null);
      setActiveTab('paste');
    }
  }, [isOpen, currentImageUrl]);

  // Global paste handler when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              const result = loadEvent.target?.result as string;
              if (result) {
                setImageUrl(result);
                setStatusMessage('✅ Đã dán ảnh từ clipboard thành công!');
                setErrorMessage(null);
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }

      // Check if text was pasted that is an image URL
      const text = e.clipboardData?.getData('text');
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
        setImageUrl(text.trim());
        setUrlInput(text.trim());
        setStatusMessage('✅ Đã dán link ảnh từ clipboard!');
        setErrorMessage(null);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP)!');
      return;
    }

    // Limit to reasonable size ~5MB for base64 storage
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Dung lượng ảnh vượt quá 5MB. Vui lòng nén hoặc chọn ảnh nhỏ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setStatusMessage('✅ Đã tải ảnh lên thành công!');
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập đường dẫn URL ảnh.');
      return;
    }
    setImageUrl(trimmed);
    setStatusMessage('✅ Đã áp dụng link ảnh!');
    setErrorMessage(null);
  };

  const handleSave = () => {
    onSaveImage(imageUrl.trim() || null);
    onClose();
  };

  const handleClearImage = () => {
    setImageUrl('');
    setUrlInput('');
    setStatusMessage('Đã gỡ ảnh. Hãy bấm Lưu để xác nhận.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-teal-500/15 text-teal-400 rounded-xl border border-teal-500/25 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                Ảnh Thông Tin Pet: {monster?.name || `Pet ${slotIndex + 1}`}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {teamTitle ? `Đội hình: ${teamTitle}` : `Vị trí Pet ${slotIndex + 1} trong đội Counter`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex-1">
          {/* Pet Info Banner */}
          <div className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <MonsterAvatar monster={monster} size="md" showStars={true} showName={false} isLeader={slotIndex === 0} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{monster?.name || `Pet ${slotIndex + 1}`}</span>
                {slotIndex === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Leader
                  </span>
                )}
              </div>
              {monster?.awakenedName && (
                <div className="text-xs text-slate-400 font-medium">{monster.awakenedName}</div>
              )}
              <div className="text-[11px] text-teal-400 font-medium mt-0.5">
                Khi di chuột vào Pet này trong danh sách Counter, ảnh sẽ hiển thị ngay dạng tooltip!
              </div>
            </div>
          </div>

          {/* Messages */}
          {statusMessage && (
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'paste' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Dán ảnh (Ctrl+V)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'upload' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'url' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Dán link URL</span>
            </button>
          </div>

          {/* Tab 1: Paste from Clipboard */}
          {activeTab === 'paste' && (
            <div
              ref={pasteAreaRef}
              tabIndex={0}
              className="p-5 border-2 border-dashed border-teal-500/40 hover:border-teal-400 focus:border-teal-400 focus:outline-none rounded-2xl bg-teal-500/5 text-center space-y-2 cursor-pointer transition-all"
              onClick={() => {
                setStatusMessage('💡 Nhấn phím Ctrl + V (hoặc Cmd + V trên Mac) để dán ảnh đã copy!');
              }}
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                <Clipboard className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">
                Chụp màn hình rune/chỉ số rồi bấm <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-300 font-mono">Ctrl + V</kbd>
              </div>
              <p className="text-[11px] text-slate-400">
                Hệ thống tự động nhận ảnh chụp trực tiếp từ bộ nhớ tạm mà không cần lưu file ra máy.
              </p>
            </div>
          )}

          {/* Tab 2: Upload file */}
          {activeTab === 'upload' && (
            <div className="p-4 border border-slate-800 rounded-2xl bg-slate-950/70 text-center space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-300">
                Chọn file ảnh từ thiết bị của bạn (hỗ trợ JPG, PNG, WebP)
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn ảnh từ máy</span>
              </button>
            </div>
          )}

          {/* Tab 3: URL input */}
          {activeTab === 'url' && (
            <div className="p-3.5 border border-slate-800 rounded-2xl bg-slate-950/70 space-y-2.5">
              <label className="block text-xs font-bold text-slate-300">
                Nhập địa chỉ URL của ảnh:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/pet-rune-info.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}

          {/* Live Preview of Attached Image */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                Xem trước ảnh thông tin:
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa ảnh này</span>
                </button>
              )}
            </div>

            <div className="min-h-[160px] max-h-[260px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2 relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Thông tin quái thú"
                  className="max-h-[240px] max-w-full object-contain rounded-xl shadow-lg border border-slate-700/80"
                  onError={() => {
                    setErrorMessage('Không tải được ảnh từ đường dẫn này. Vui lòng kiểm tra lại link hoặc dán ảnh trực tiếp.');
                  }}
                />
              ) : (
                <div className="text-center text-slate-500 p-4 space-y-1">
                  <ImageIcon className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                  <p className="text-xs">Chưa có ảnh nào được chọn</p>
                  <p className="text-[11px] text-slate-600">
                    Hãy nhấn Ctrl+V hoặc tải ảnh lên để xem trước tại đây
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Lưu Ảnh Cho Pet Này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
