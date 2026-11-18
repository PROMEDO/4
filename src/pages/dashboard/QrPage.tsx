/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Copy, ExternalLink, Lock, Share2 } from 'lucide-react';
import {
  QR_BG_THEMES,
  QRCodeView,
  QrBgPreset,
  QrDotStyle,
  QrFramePreset,
  getLocalizedQrBgLabel,
} from '../../components/QRCodeView';
import { getLocalizedPlanName } from '../../utils/plans';
import { surfaceCardStyle, useDashboard } from './DashboardContext';

const QR_COLOR_SWATCHES = ['#0f172a', '#065f46', '#1e3a8a', '#7c2d12', '#581c87'];

export const QrPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    lang,
    tr,
    rest,
    resolvedPlan,
    liveMenuUrl,
    copyLink,
    openShareModal,
    openUpgradeModal,
    handleUpdateQrDesign,
    showToast,
    customTabLabel,
  } = useDashboard();

  const dotStyles: Array<{ id: QrDotStyle; label: string; symbol: string }> = [
    { id: 'square', label: tr('مربعات', 'چوارگۆشە', 'Squares'), symbol: '▪' },
    { id: 'rounded', label: tr('ناعم', 'نەرم', 'Rounded'), symbol: '▢' },
    { id: 'dots', label: tr('نقاط', 'خاڵەکان', 'Dots'), symbol: '●' },
    { id: 'diamond', label: tr('ماسي', 'ئەڵماس', 'Diamond'), symbol: '◆' },
  ];

  const frameStyles: Array<{ id: QrFramePreset; label: string; desc: string }> = [
    { id: 'minimal', label: tr('بسيط', 'سادە', 'Minimal'), desc: tr('كود واضح وصافي', 'کۆدی ڕوون و سادە', 'Clean crisp code') },
    { id: 'table', label: tr('كارت طاولة', 'کارتی مێز', 'Table Card'), desc: tr('مع الاسم والوصف', 'بە ناو و وەسفەوە', 'With name & subtitle') },
    { id: 'classic', label: tr('إطار كلاسيكي', 'چوارچێوەی کلاسیک', 'Classic Frame'), desc: tr('إطار مزدوج أنيق', 'چوارچێوەی جووتی جوان', 'Sleek double border') },
    { id: 'badge', label: tr('ستاند عصري', 'ستاندی مۆدێرن', 'Modern Stand'), desc: tr('شارة طلب سفليّة', 'نیشانەی داواکاری خوارەوە', 'Bottom scan CTA badge') },
  ];

  const [dotStyle, setDotStyle] = useState<QrDotStyle>(rest.qrDesign?.dotStyle || 'rounded');
  const [bgPreset, setBgPreset] = useState<QrBgPreset>(rest.qrDesign?.bgPreset || 'white');
  const [framePreset, setFramePreset] = useState<QrFramePreset>(rest.qrDesign?.framePreset || 'table');
  const [qrColor, setQrColor] = useState<string>(rest.qrDesign?.qrColor || '');
  const [showLogo, setShowLogo] = useState<boolean>(Boolean(rest.qrDesign?.showLogo));

  useEffect(() => {
    setDotStyle(rest.qrDesign?.dotStyle || 'rounded');
    setBgPreset(rest.qrDesign?.bgPreset || 'white');
    setFramePreset(rest.qrDesign?.framePreset || 'table');
    setQrColor(rest.qrDesign?.qrColor || '');
    setShowLogo(Boolean(rest.qrDesign?.showLogo));
  }, [rest.id]);

  const updateSetting = (patch: Partial<{ dotStyle: QrDotStyle; bgPreset: QrBgPreset; framePreset: QrFramePreset; qrColor: string; showLogo: boolean }>) => {
    if (patch.dotStyle !== undefined) setDotStyle(patch.dotStyle);
    if (patch.bgPreset !== undefined) setBgPreset(patch.bgPreset);
    if (patch.framePreset !== undefined) setFramePreset(patch.framePreset);
    if (patch.qrColor !== undefined) setQrColor(patch.qrColor);
    if (patch.showLogo !== undefined) setShowLogo(patch.showLogo);
    void handleUpdateQrDesign(patch);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <motion.div
        style={{ marginBottom: '20px', textAlign: 'center' }}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: 'var(--ink)' }}>
          {customTabLabel('qr', tr('كود الـ QR', 'کۆدی QR', 'QR Code'))}
        </h1>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
          {tr(
            'اختر شكل الكود، الخلفية، وتصميم الستاند ثم حمّل أو اطبع بدقة عالية.',
            'شێوەی کۆد، باکگراوند و دیزاینی ستاند هەڵبژێرە پاشان بە کوالێتی بەرز دایبەزێنە یان چاپی بکە.',
            'Customize your QR pattern, background, and stand frame, then download or print in high resolution.'
          )}
        </p>
      </motion.div>

      {!resolvedPlan.perms.qrCode ? (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
          style={{ ...surfaceCardStyle, padding: '36px 24px', borderRadius: '20px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Lock size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 900, marginBottom: '8px', color: 'var(--ink)' }}>
            {tr('ميزة كود الـ QR معطلة في باقتك الحالية', 'تایبەتمەندی کۆدی QR لە پاکێجی ئێستاتدا ناچالاکە', 'QR Code is unavailable on your current plan')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '18px', lineHeight: 1.6 }}>
            {tr(
              `يمكنك مشاركة رابط المنيو أو ترقية باقتك (${getLocalizedPlanName(resolvedPlan.plan, lang)}) لتفعيل تصميم وطباعة QR Code.`,
              `دەتوانیت لینکی مینیۆ هاوبەش بکەیت یان پاکێجەکەت (${getLocalizedPlanName(resolvedPlan.plan, lang)}) بەرز بکەیتەوە بۆ چالاککردنی دیزاین و چاپی QR Code.`,
              `You can still share your menu link or upgrade your plan (${getLocalizedPlanName(resolvedPlan.plan, lang)}) to unlock QR customization & printing.`
            )}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={openShareModal} className="btn p" style={{ fontWeight: 800 }}>
              <Share2 size={15} />
              <span>{tr('مشاركة المنيو', 'هاوبەشکردنی مینیۆ', 'Share Menu')}</span>
            </button>
            <button type="button" onClick={() => copyLink(liveMenuUrl)} className="btn" style={{ fontWeight: 800 }}>
              <Copy size={15} />
              <span>{tr('نسخ الرابط', 'کۆپیکردنی لینک', 'Copy Link')}</span>
            </button>
            <button type="button" onClick={() => openUpgradeModal('starter')} className="btn" style={{ fontWeight: 800 }}>
              <ExternalLink size={15} />
              <span>{tr('ترقية الباقة', 'بەرزکردنەوەی پاکێج', 'Upgrade Plan')}</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start"
          style={{ ...surfaceCardStyle, padding: '22px', borderRadius: '22px' }}
        >
          {/* Left: Clean Live Preview + Single Unified Actions Row */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeView
              url={liveMenuUrl}
              restaurantName={rest.n}
              logoUrl={rest.logo}
              size={200}
              dotStyle={dotStyle}
              bgPreset={bgPreset}
              framePreset={framePreset}
              qrColor={qrColor || undefined}
              showLogo={showLogo}
              onCopied={() => showToast(tr('تم نسخ رابط المنيو ✓', 'لینکی مینیۆ کۆپی کرا ✓', 'Menu link copied ✓'))}
            />
          </div>

          {/* Right: Ultra-Simple 3 Controls (Code Shape, Background, Card Design) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'start' }}>
            {/* 1. Code Shape & Color */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--ink)', marginBottom: '8px' }}>
                {tr('1. شكل الكود', '١. شێوەی کۆد', '1. Code Style')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {dotStyles.map((item) => {
                  const active = dotStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSetting({ dotStyle: item.id })}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '12px',
                        border: active ? '2px solid var(--brand)' : '1px solid var(--line)',
                        background: active ? 'color-mix(in srgb, var(--brand) 14%, var(--bg))' : 'var(--bg)',
                        color: active ? 'var(--brand-ink, var(--brand))' : 'var(--ink)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.symbol}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)' }}>
                    {tr('لون الكود:', 'ڕەنگی کۆد:', 'Code color:')}
                  </span>
                  {QR_COLOR_SWATCHES.map((hex) => {
                    const active = qrColor === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        aria-label={tr(`لون ${hex}`, `ڕەنگی ${hex}`, `Color ${hex}`)}
                        onClick={() => updateSetting({ qrColor: active ? '' : hex })}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: hex,
                          border: active ? '2.5px solid var(--brand)' : '1.5px solid rgba(255,255,255,0.3)',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => updateSetting({ showLogo: e.target.checked })}
                  />
                  <span>{tr('شعار بالمنتصف', 'لۆگۆ لە ناوەڕاست', 'Center Logo')}</span>
                </label>
              </div>
            </div>

            {/* 2. Background Style */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--ink)', marginBottom: '8px' }}>
                {tr('2. الخلفية', '٢. باکگراوند', '2. Background')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {(Object.keys(QR_BG_THEMES) as QrBgPreset[]).map((key) => {
                  const item = QR_BG_THEMES[key];
                  const active = bgPreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateSetting({ bgPreset: key })}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '12px',
                        border: active ? '2px solid var(--brand)' : '1px solid var(--line)',
                        background: active ? 'color-mix(in srgb, var(--brand) 12%, var(--bg))' : 'var(--bg)',
                        color: 'var(--ink)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: item.swatch,
                          border: '1px solid rgba(148,163,184,0.45)',
                        }}
                      />
                      <span>{getLocalizedQrBgLabel(key, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Design / Stand Layout */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--ink)', marginBottom: '8px' }}>
                {tr('3. شكل التصميم', '٣. شێوەی دیزاین', '3. Frame Layout')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {frameStyles.map((item) => {
                  const active = framePreset === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSetting({ framePreset: item.id })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: active ? '2px solid var(--brand)' : '1px solid var(--line)',
                        background: active ? 'color-mix(in srgb, var(--brand) 12%, var(--bg))' : 'var(--bg)',
                        color: 'var(--ink)',
                        textAlign: 'start',
                        cursor: 'pointer',
                      }}
                    >
                      <b style={{ display: 'block', fontSize: '12.5px', color: active ? 'var(--brand-ink, var(--brand))' : 'var(--ink)' }}>
                        {item.label}
                      </b>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
