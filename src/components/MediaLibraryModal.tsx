/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Plus, Upload, X } from 'lucide-react';
import { MediaLibraryItem } from '../types';
import { useTranslation } from '../utils/i18n';

interface MediaLibraryModalProps {
  isOpen: boolean;
  items: MediaLibraryItem[];
  currentUrl?: string;
  onSelect: (url: string) => void;
  onUploadFiles: (files: FileList) => Promise<MediaLibraryItem[]>;
  onDeleteItem: (mediaId: string) => void;
  onClose: () => void;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  items,
  currentUrl,
  onSelect,
  onUploadFiles,
  onDeleteItem,
  onClose,
}) => {
  const { tr } = useTranslation();
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentUrl || '');
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const added = await onUploadFiles(files);
      if (added.length > 0) {
        setSelectedUrl(added[0].url);
      }
    } finally {
      e.target.value = '';
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedUrl) return;
    onSelect(selectedUrl);
    onClose();
  };

  return (
    <>
      <div
        className="drawer-backdrop"
        style={{ zIndex: 100000 }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr('مكتبة الصور', 'کتێبخانەی وێنەکان', 'Media Library')}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(820px, 94vw)',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
          backdropFilter: 'blur(14px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
          border: '1px solid color-mix(in srgb, var(--line) 80%, transparent)',
          borderRadius: '20px',
          color: 'var(--ink)',
          zIndex: 100001,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 900, color: 'var(--ink)' }}>
              {tr('مكتبة الصور', 'کتێبخانەی وێنەکان', 'Media Library')}
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>
              {tr('يمكنك اختيار صورة واحدة', 'دەتوانیت یەک وێنە هەڵبژێریت', 'Select an image')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label
              className="btn s"
              style={{
                height: '38px',
                borderRadius: '10px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: uploading ? 'wait' : 'pointer',
              }}
            >
              <Upload size={15} />
              <span>
                {uploading
                  ? tr('جاري الرفع...', 'بارکردن...', 'Uploading...')
                  : tr('رفع صورة', 'بارکردنی وێنە', 'Upload Image')}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={uploading}
                onChange={(e) => void handleFilesChange(e)}
              />
            </label>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedUrl}
              className={selectedUrl ? 'btn p' : 'btn s'}
              style={{
                height: '38px',
                borderRadius: '10px',
                padding: '0 18px',
                fontSize: '13.5px',
                fontWeight: 800,
                opacity: selectedUrl ? 1 : 0.45,
                cursor: selectedUrl ? 'pointer' : 'not-allowed',
              }}
            >
              {tr('اختيار', 'هەڵبژاردن', 'Select')}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={tr('إغلاق', 'داخستن', 'Close')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {items.length === 0 ? (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '44px 20px',
                borderRadius: '16px',
                border: '1.5px dashed var(--line)',
                background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                textAlign: 'center',
                cursor: uploading ? 'wait' : 'pointer',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'var(--soft)',
                  color: 'var(--brand-ink, #34D399)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ImageIcon size={26} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                {tr('لا توجد صور مرفوعة بعد', 'هێشتا هیچ وێنەیەک بارنەکراوە', 'No uploaded images yet')}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                {tr(
                  'اضغط هنا لرفع صورة من جهازك وإضافتها إلى مكتبتك',
                  'کلیک لێرە بکە بۆ بارکردنی وێنە لە ئامێرەکەت و زیادکردنی بۆ کتێبخانەکەت',
                  'Click here to upload an image from your device to your library'
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={uploading}
                onChange={(e) => void handleFilesChange(e)}
              />
            </label>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Quick Upload Card */}
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '142px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1.5px dashed var(--line)',
                  background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                  color: 'var(--muted)',
                  cursor: uploading ? 'wait' : 'pointer',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--soft)',
                    color: 'var(--brand-ink, #34D399)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Plus size={18} />
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--ink)' }}>
                  {uploading
                    ? tr('جاري الرفع...', 'بارکردن...', 'Uploading...')
                    : tr('إضافة صورة جديدة', 'زیادکردنی وێنەی نوێ', 'Add new image')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={uploading}
                  onChange={(e) => void handleFilesChange(e)}
                />
              </label>

              {items.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedUrl(item.url)}
                    onDoubleClick={() => {
                      onSelect(item.url);
                      onClose();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedUrl(item.url);
                      }
                    }}
                    style={{
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      border: isSelected ? '2px solid var(--brand)' : '1px solid var(--line)',
                      borderRadius: '14px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'border-color 0.15s ease, transform 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      <button
                        type="button"
                        aria-label={tr(`حذف ${item.name}`, `سڕینەوەی ${item.name}`, `Delete ${item.name}`)}
                        title={tr('حذف الصورة', 'سڕینەوەی وێنە', 'Delete image')}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedUrl === item.url) {
                            setSelectedUrl('');
                          }
                          onDeleteItem(item.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          insetInlineStart: '6px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: '1.5px solid rgba(255,255,255,0.85)',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                        }}
                      >
                        <X size={13} strokeWidth={2.6} />
                      </button>

                      {isSelected && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            top: '6px',
                            insetInlineEnd: '6px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'var(--brand)',
                            color: 'var(--on-brand, #fff)',
                            display: 'grid',
                            placeItems: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Check size={13} strokeWidth={2.8} />
                        </span>
                      )}
                    </div>

                    <div
                      dir="auto"
                      title={item.name}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--brand-ink, #34D399)' : 'var(--muted)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '0 4px 2px',
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
