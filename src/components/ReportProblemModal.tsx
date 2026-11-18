/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ImagePlus, Loader2, Send, Store, Trash2, X } from 'lucide-react';
import { ProblemReport, Restaurant, Session } from '../types';
import { compressImage, putItemAndSync, uid } from '../utils/storage';
import { useTranslation } from '../utils/i18n';
import { surfaceCardStyle, themedInputStyle } from '../pages/dashboard/DashboardContext';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  rest: Restaurant;
  session: Session;
  showToast: (msg: string) => void;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  rest,
  session,
  showToast,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { isRtl, tr } = useTranslation();
  const [message, setMessage] = useState('');
  const [imageData, setImageData] = useState('');
  const [imageName, setImageName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setErrorMsg('');
    onClose();
  };

  const handleImageFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg(
        tr(
          'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP...)',
          'تکایە فایلی وێنەیەکی دروست هەڵبژێرە (PNG, JPG, WebP...)',
          'Please select a valid image file (PNG, JPG, WebP...)'
        )
      );
      return;
    }
    setErrorMsg('');
    setCompressing(true);
    try {
      const compressed = await compressImage(file, 'banner');
      setImageData(compressed);
      setImageName(file.name || tr('صورة مرفقة', 'وێنەی هاوپێچ', 'Attached image'));
    } catch {
      setErrorMsg(
        tr(
          'تعذر قراءة الصورة، يرجى تجربة صورة أخرى',
          'نەتوانرا وێنەکە بخوێنرێتەوە، تکایە وێنەیەکی تر تاقی بکەرەوە',
          'Failed to read image, please try another one'
        )
      );
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setErrorMsg(
        tr(
          'يرجى كتابة وصف المشكلة قبل الإرسال',
          'تکایە پێش ناردن وەسفی کێشەکە بنووسە',
          'Please describe the problem before submitting'
        )
      );
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const reportId = `rep_${uid()}`;
      const nowTs = Date.now();
      const payload: ProblemReport = {
        id: reportId,
        rid: rest.id,
        restaurantName: rest.n || tr('متجر', 'فرۆشگا', 'Store'),
        restaurantSlug: rest.slug || rest.subdomain || '',
        ownerName: String(rest.ow || session.name || session.u || '').trim(),
        phone: String(rest.ph || session.phone || '').trim(),
        email: String(session.email || '').trim(),
        message: cleanMessage,
        ...(imageData ? { image: imageData } : {}),
        status: 'new',
        st: 'new',
        at: nowTs,
        createdAt: new Date(nowTs).toISOString(),
        updatedAt: nowTs,
      };
      await putItemAndSync<ProblemReport>(`reports/${reportId}`, payload);
      setMessage('');
      setImageData('');
      setImageName('');
      showToast(
        tr(
          'تم إرسال البلاغ للإدارة بنجاح ✓',
          'ڕاپۆرتەکە بە سەرکەوتوویی بۆ بەڕێوەبەرایەتی نێردرا ✓',
          'Report sent to administration successfully ✓'
        )
      );
      onClose();
    } catch {
      setErrorMsg(
        tr(
          'حدث خطأ أثناء إرسال البلاغ، حاول مرة أخرى',
          'هەڵەیەک لە ناردنی ڕاپۆرتەکە ڕوویدا، دووبارە هەوڵبدەرەوە',
          'Failed to send report, please try again'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="mp-order-modal-overlay"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={resetAndClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={tr('إبلاغ عن مشكلة', 'ئاگادارکردنەوەی کێشە', 'Report a Problem')}
        onClick={(e) => e.stopPropagation()}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 'min(520px, 100%)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          ...surfaceCardStyle,
          borderRadius: '20px',
          padding: '18px 18px 20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            paddingBottom: '12px',
            marginBottom: '14px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.36)',
                color: '#f59e0b',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--ink)' }}>
                {tr('إبلاغ عن مشكلة', 'ئاگادارکردنەوەی کێشە', 'Report a Problem')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--muted)' }}>
                {tr(
                  'أرسل تفاصيل المشكلة مع صورة توضيحية لتصل مباشرة إلى لوحة الإدارة',
                  'وردەکاری کێشەکە لەگەڵ وێنەی ڕوونکەرەوە بنێرە بۆ ئەوەی ڕاستەوخۆ بگاتە پانێڵی بەڕێوەبەر',
                  'Send problem details with an image directly to the admin panel'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            aria-label={tr('إغلاق', 'داخستن', 'Close')}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '9px',
              width: '32px',
              height: '32px',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} noValidate>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '9px 12px',
              borderRadius: '12px',
              background: 'color-mix(in srgb, var(--panel) 40%, transparent)',
              border: '1px solid color-mix(in srgb, var(--line) 65%, transparent)',
              fontSize: '12px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--ink)' }}>
              <Store size={14} style={{ color: 'var(--brand-ink, #34D399)' }} />
              <span>{rest.n || tr('المتجر', 'فرۆشگا', 'Store')}</span>
            </span>
            {(rest.ph || session.phone) && (
              <span dir="ltr" className="tabular-nums" style={{ color: 'var(--muted)', fontWeight: 600 }}>
                {rest.ph || session.phone}
              </span>
            )}
          </div>

          <label className="f" style={{ margin: 0 }}>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink)' }}>
              {tr('تفاصيل المشكلة *', 'وردەکاری کێشەکە *', 'Problem Details *')}
            </span>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onPaste={handlePaste}
              rows={4}
              placeholder={tr(
                'اكتب المشكلة التي واجهتها هنا بالتفصيل (يمكنك أيضاً لصق صورة مباشرة)...',
                'کێشەکەی تووشی بوویت بە وردی لێرە بنووسە (دەتوانیت ڕاستەوخۆ وێنەش لێبدەیت)...',
                'Describe the issue in detail (you can also paste a screenshot directly)...'
              )}
              style={{
                ...themedInputStyle,
                resize: 'vertical',
                minHeight: '110px',
                lineHeight: 1.7,
                fontSize: '13.5px',
              }}
            />
          </label>

          <div>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink)' }}>
              {tr('إرفاق صورة للمشكلة (اختياري)', 'هاوپێچکردنی وێنەی کێشەکە (دڵخوازانە)', 'Attach Screenshot (optional)')}
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                void handleImageFile(e.target.files?.[0]);
              }}
            />

            {!imageData ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                style={{
                  width: '100%',
                  padding: '18px 14px',
                  borderRadius: '14px',
                  border: '1.5px dashed color-mix(in srgb, var(--brand) 48%, var(--line))',
                  background: 'color-mix(in srgb, var(--panel) 40%, transparent)',
                  color: 'var(--ink)',
                  cursor: compressing ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
              >
                {compressing ? (
                  <>
                    <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand-ink, #34D399)' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                      {tr('جاري تجهيز الصورة...', 'ئامادەکردنی وێنەکە...', 'Processing image...')}
                    </span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={22} style={{ color: 'var(--brand-ink, #34D399)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>
                      {tr('اضغط لاختيار صورة من جهازك', 'کلیک بکە بۆ هەڵبژاردنی وێنە لە ئامێرەکەت', 'Click to choose an image')}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {tr('لقطة شاشة أو صورة توضيحية للمشكلة', 'وێنەی شاشە یان وێنەی ڕوونکەرەوەی کێشەکە', 'Screenshot or clarifying photo')}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  background: 'color-mix(in srgb, var(--panel) 40%, transparent)',
                }}
              >
                <img
                  src={imageData}
                  alt={imageName || tr('صورة المشكلة', 'وێنەی کێشە', 'Problem image')}
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    objectFit: 'contain',
                    display: 'block',
                    background: 'rgba(0, 0, 0, 0.15)',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '8px 12px',
                    borderTop: '1px solid var(--line)',
                    fontSize: '12px',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {imageName || tr('صورة مرفقة', 'وێنەی هاوپێچ', 'Attached image')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '11.5px', minHeight: '28px', padding: '3px 9px' }}
                    >
                      {tr('تغيير الصورة', 'گۆڕینی وێنە', 'Change image')}
                    </button>
                    <button
                      type="button"
                      className="btn s d"
                      onClick={() => {
                        setImageData('');
                        setImageName('');
                      }}
                      aria-label={tr('حذف الصورة', 'سڕینەوەی وێنە', 'Remove image')}
                      style={{ fontSize: '11.5px', minHeight: '28px', padding: '3px 9px', gap: '4px' }}
                    >
                      <Trash2 size={12} />
                      <span>{tr('إزالة', 'لابردن', 'Remove')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
            <button
              type="button"
              className="btn s"
              onClick={resetAndClose}
              disabled={submitting}
              style={{ minWidth: '88px', justifyContent: 'center' }}
            >
              {tr('إلغاء', 'هەڵوەشاندنەوە', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn p"
              disabled={submitting || compressing}
              style={{ minWidth: '130px', justifyContent: 'center', gap: '6px' }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>
                {submitting
                  ? tr('جاري الإرسال...', 'ناردن...', 'Sending...')
                  : tr('إرسال البلاغ', 'ناردنی ڕاپۆرت', 'Submit Report')}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
