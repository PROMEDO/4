/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Eye,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { getLocalizedAddonCatalog } from '../../data/addonsCatalog';
import { formatNumber } from '../../utils/storage';
import { trByLang } from '../../utils/i18n';
import {
  getAddonRequiredPlanLabel,
  getAddonRequiredPlanTier,
  isAddonAllowedForPlan,
} from '../../utils/plans';
import { playBellTone, surfaceCardStyle, themedInputStyle, useDashboard } from './DashboardContext';

function formatHourLocalized(hour: number, lang: SupportedLanguage): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const hh24 = `${String(h).padStart(2, '0')}:00`;
  if (h === 0) return trByLang(lang, `12:00 منتصف الليل (${hh24})`, `١٢:٠٠ نیوەشەو (${hh24})`, `12:00 AM (${hh24})`);
  if (h < 12) return trByLang(lang, `${h}:00 صباحاً (${hh24})`, `${h}:٠٠ بەیانی (${hh24})`, `${h}:00 AM (${hh24})`);
  if (h === 12) return trByLang(lang, `12:00 ظهراً (${hh24})`, `١٢:٠٠ نیوەڕۆ (${hh24})`, `12:00 PM (${hh24})`);
  return trByLang(lang, `${h - 12}:00 مساءً (${hh24})`, `${h - 12}:٠٠ ئێوارە (${hh24})`, `${h - 12}:00 PM (${hh24})`);
}

export const AddonsPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    lang,
    isRtl,
    tr,
    rest,
    resolvedPlan,
    currency,
    allItems,
    addonsState,
    editingAddonKey,
    setEditingAddonKey,
    addonDraft,
    setAddonDraft,
    addonEditIntent,
    setAddonEditIntent,
    addonEditError,
    setAddonEditError,
    addonSaving,
    showPopupPreview,
    setShowPopupPreview,
    handleToggleAddon,
    handleOpenAddonEdit,
    handleSaveAddonEdit,
    handleDeviceImageUpload,
    openUpgradeModal,
  } = useDashboard();

  const localizedCatalog = getLocalizedAddonCatalog(lang);
  const allowedAddonsCount = localizedCatalog.filter((a) => isAddonAllowedForPlan(a.key, resolvedPlan)).length;
  const enabledCount = localizedCatalog.filter(
    (a) =>
      isAddonAllowedForPlan(a.key, resolvedPlan) &&
      Boolean((addonsState[a.key] as Record<string, any> | undefined)?.enabled)
  ).length;
  const visibleAddons = localizedCatalog;
  const addonsLimitText = `${enabledCount}/${allowedAddonsCount}`;

  const updateDraft = (updater: (prev: Record<string, any>) => Record<string, any>) => {
    if (addonEditError) setAddonEditError('');
    setAddonDraft(updater);
  };

  const closeEditModal = () => {
    setEditingAddonKey(null);
    setAddonEditError('');
    setAddonEditIntent('edit');
  };

  const activeMeta = editingAddonKey ? localizedCatalog.find((a) => a.key === editingAddonKey) : null;
  const activeSavedCfg = editingAddonKey
    ? ((addonsState[editingAddonKey] || {}) as Record<string, any>)
    : {};
  const requiresInitialSetup = addonEditIntent === 'enable' || !activeSavedCfg.configured;
  const currentLocalHour = new Date().getHours();

  const waTargetPhone = String(rest.social?.whatsapp || rest.ph || '').trim();

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <motion.div
        className="mp-items-toolbar"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: '10px' }}
      >
        <div
          className={`mp-items-count-box ${allowedAddonsCount === 0 ? 'is-limit' : ''}`}
          aria-label={tr(`صلاحيتك بالإضافات ${addonsLimitText}`, `بەشی زیادکراوەکانت ${addonsLimitText}`, `Add-ons allowance ${addonsLimitText}`)}
        >
          <span className="mp-items-count-label">{tr('صلاحيتك بالإضافات', 'مافی زیادکراوەکانت', 'Add-ons Allowance')}</span>
          <span className="mp-items-count-divider" aria-hidden="true" />
          <span dir="ltr" className="mp-items-count-num tabular-nums">
            {addonsLimitText}
          </span>
        </div>
      </motion.div>

      <div className="mp-addons-grid">
        {visibleAddons.map((addon, idx) => {
          const allowed = isAddonAllowedForPlan(addon.key, resolvedPlan);
          const reqLabel = getAddonRequiredPlanLabel(addon.key, lang);
          const cfg = (addonsState[addon.key] || {}) as Record<string, any>;
          const isEnabled = allowed && Boolean(cfg.enabled);
          const isConfigured = Boolean(cfg.configured || cfg.enabled);
          const targetUpgradeTier = getAddonRequiredPlanTier(addon.key);

          return (
            <motion.div
              key={addon.key}
              className={`mp-addon-square-card ${isEnabled ? 'is-enabled' : ''} ${!allowed ? 'is-locked' : ''}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: allowed ? 1 : 0.72, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{
                duration: 0.82,
                delay: prefersReducedMotion ? 0 : Math.min((idx % 8) * 0.06, 0.38),
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            >
              {/* Top Row: Icon + Status Pill */}
              <div className="mp-addon-card-head">
                <div className={`mp-addon-card-icon ${isEnabled ? 'is-enabled' : ''}`}>
                  <span>{addon.icon}</span>
                </div>
                <span
                  className={`mp-addon-status-pill ${
                    !allowed ? 'is-locked' : isEnabled ? 'is-enabled' : !isConfigured ? 'is-setup' : 'is-off'
                  }`}
                >
                  {!allowed
                    ? `🔒 ${tr('مقفل', 'قفڵکراوە', 'Locked')}`
                    : isEnabled
                    ? tr('يعمل', 'چالاکە', 'Active')
                    : !isConfigured
                    ? tr('يتطلب إعداد', 'پێویستی بە ڕێکخستنە', 'Needs Setup')
                    : tr('متوقف', 'وەستاوە', 'Off')}
                </span>
              </div>

              {/* Center: Title + Summary */}
              <div className="mp-addon-card-body">
                <b className="mp-addon-card-title">{addon.title}</b>
                <p className="mp-addon-card-desc">{addon.desc}</p>
                {addon.key === 'freeDeliveryProgress' && (
                  <div className="mp-addon-card-meta" style={{ color: isEnabled ? 'var(--brand)' : 'var(--muted)' }}>
                    {tr('الحد الأدنى:', 'کەمترین بڕ:', 'Minimum:')} {formatNumber(Number(cfg.minAmount ?? 25000))} {currency}
                  </div>
                )}
              </div>

              {/* Bottom Action Row */}
              <div className="mp-addon-card-actions">
                {allowed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleAddon(addon)}
                      className={`mp-addon-btn-toggle ${isEnabled ? 'is-stop' : 'is-start'}`}
                    >
                      <span className={`mp-addon-dot ${isEnabled ? 'is-on' : ''}`} />
                      <span>{isEnabled ? tr('إيقاف', 'وەستاندن', 'Turn Off') : tr('تشغيل', 'کارپێکردن', 'Turn On')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddonEdit(addon.key)}
                      className="mp-addon-btn-edit"
                    >
                      <Edit size={12} />
                      <span>{tr('تعديل', 'دەستکاری', 'Edit')}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openUpgradeModal(targetUpgradeTier)}
                    className="mp-addon-btn-upgrade"
                  >
                    <span>🔒 {reqLabel}</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FIXED CENTERED EDIT / SETUP ADDON POPUP MODAL */}
      {editingAddonKey && activeMeta && (
        <div className="mp-addon-modal-overlay" dir={isRtl ? 'rtl' : 'ltr'} onClick={closeEditModal}>
          <motion.div
            className="mp-addon-modal-card"
            onClick={(e) => e.stopPropagation()}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={surfaceCardStyle}
          >
            <form onSubmit={handleSaveAddonEdit} className="mp-addon-modal-form" noValidate>
              {/* Sticky Header */}
              <div className="mp-addon-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div className="mp-addon-modal-icon">{activeMeta.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'var(--ink)' }}>
                      {addonEditIntent === 'enable'
                        ? tr('إعداد وتفعيل:', 'ڕێکخستن و چالاککردن:', 'Setup & Enable:')
                        : tr('تعديل:', 'دەستکاری:', 'Edit:')}{' '}
                      {activeMeta.title}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--muted)' }}>
                      {activeMeta.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  aria-label={tr('إغلاق', 'داخستن', 'Close')}
                  className="mp-addon-modal-close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="mp-addon-modal-body">
                {requiresInitialSetup ? (
                  <div className="mp-addon-setup-banner">
                    <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      {tr(
                        'لتعمل هذه الإضافة بشكل صحيح في المنيو، راجع الحقول أدناه وعدّلها بما يناسبك ثم اضغط على ',
                        'بۆ ئەوەی ئەم زیادکراوە بە دروستی لە مینیۆدا کاربکات، خانەکانی خوارەوە بپشکنە و دواتر کلیک لەسەر ',
                        'To configure this add-on properly, review the fields below and click '
                      )}
                      <b>"{tr('حفظ وتفعيل الإضافة', 'پاشەکەوت و چالاککردنی زیادکراو', 'Save & Enable Add-on')}"</b>.
                    </span>
                  </div>
                ) : (
                  <label className="mp-addon-enable-switch">
                    <div>
                      <span style={{ display: 'block', fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)' }}>
                        {tr('حالة الميزة في المنيو', 'دۆخی تایبەتمەندی لە مینیۆ', 'Feature Status on Menu')}
                      </span>
                      <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--muted)' }}>
                        {addonDraft.enabled
                          ? tr('مفعّلة وتظهر للزبائن الآن', 'چالاکە و ئێستا بۆ کڕیاران دەردەکەوێت', 'Active and visible to customers')
                          : tr('مضبوطة ولكن متوقفة مؤقتاً', 'ڕێکخراوە بەڵام بە شێوەی کاتی وەستێنراوە', 'Configured but currently paused')}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(addonDraft.enabled)}
                      onChange={(e) => updateDraft((p) => ({ ...p, enabled: e.target.checked }))}
                    />
                  </label>
                )}

                {addonEditError && (
                  <div className="mp-addon-error-banner" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{addonEditError}</span>
                  </div>
                )}

                {editingAddonKey === 'offerPopup' && (
                  <>
                    <label className="f">
                      {tr('عنوان النافذة المنبثقة *', 'ناونیشانی پەنجەرەی ئۆفەر *', 'Popup Title *')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      {tr('تفاصيل العرض', 'وردەکاری ئۆفەر', 'Offer Details')}
                      <textarea
                        rows={2}
                        value={addonDraft.subtitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, subtitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div className="f">
                      <span>{tr('صورة العرض (رابط أو رفع من الجهاز)', 'وێنەی ئۆفەر (لینک یان بارکردن)', 'Offer Image (URL or Upload)')}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          dir="ltr"
                          value={addonDraft.image || ''}
                          onChange={(e) => updateDraft((p) => ({ ...p, image: e.target.value }))}
                          placeholder="https://..."
                          style={{ ...themedInputStyle, flex: 1 }}
                        />
                        <label
                          className="btn s"
                          style={{ cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Upload size={13} />
                          <span>{tr('رفع صورة', 'بارکردنی وێنە', 'Upload Image')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              void handleDeviceImageUpload(
                                e,
                                (url) => updateDraft((p) => ({ ...p, image: url })),
                                tr('تم رفع صورة الإعلان', 'وێنەی ڕێکلامەکە بارکرا', 'Offer image uploaded'),
                                'item'
                              )
                            }
                          />
                        </label>
                      </div>
                      {addonDraft.image && (
                        <div style={{ marginTop: '8px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)', height: '110px' }}>
                          <img
                            src={addonDraft.image}
                            alt={tr('معاينة صورة البوب اب', 'پێشبینینی وێنەی پۆپئاپ', 'Popup image preview')}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      )}
                    </div>
                    <label className="f">
                      {tr('نص الزر', 'دەقی دوگمە', 'Button Label')}
                      <input
                        type="text"
                        value={addonDraft.buttonText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, buttonText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => setShowPopupPreview(true)}
                      style={{ marginBottom: '6px' }}
                    >
                      <Eye size={14} />
                      <span>{tr('معاينة شكل البوب اب للزبون', 'پێشبینینی پۆپئاپ بۆ کڕیار', 'Preview Popup for Customer')}</span>
                    </button>
                  </>
                )}

                {editingAddonKey === 'announcementBar' && (
                  <>
                    <div
                      style={{
                        borderRadius: '10px',
                        padding: '9px 12px',
                        marginBottom: '12px',
                        background: addonDraft.bgColor || '#C2410C',
                        color: addonDraft.textColor || '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                      }}
                    >
                      {addonDraft.text || tr('معاينة شريط الإعلانات أعلى المنيو', 'پێشبینینی شریتی ڕاگەیاندنی سەرەوەی مینیۆ', 'Top Announcement Bar Preview')}
                    </div>
                    <label className="f">
                      {tr('نص الشريط الإعلاني *', 'دەقی شریتی ڕاگەیاندن *', 'Announcement Text *')}
                      <input
                        type="text"
                        value={addonDraft.text || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, text: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label className="f">
                        {tr('لون خلفية الشريط', 'ڕەنگی باکگراوندی شریت', 'Background Color')}
                        <input
                          type="color"
                          value={addonDraft.bgColor || '#C2410C'}
                          onChange={(e) => updateDraft((p) => ({ ...p, bgColor: e.target.value }))}
                          style={{ width: '100%', height: '40px', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </label>
                      <label className="f">
                        {tr('لون النص', 'ڕەنگی نووسین', 'Text Color')}
                        <input
                          type="color"
                          value={addonDraft.textColor || '#ffffff'}
                          onChange={(e) => updateDraft((p) => ({ ...p, textColor: e.target.value }))}
                          style={{ width: '100%', height: '40px', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                  </>
                )}

                {editingAddonKey === 'countdownTimer' && (
                  <>
                    <label className="f">
                      {tr('عنوان العرض التنازلي', 'ناونیشانی ئۆفەری کاتژمێر', 'Countdown Offer Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <label className="f">
                        {tr('نوع الخصم الفعلي على المنيو', 'جۆری داشکاندن لەسەر مینیۆ', 'Menu Discount Type')}
                        <select
                          value={addonDraft.discountType || 'percent'}
                          onChange={(e) => updateDraft((p) => ({ ...p, discountType: e.target.value }))}
                          style={themedInputStyle}
                        >
                          <option value="percent">{tr('نسبة مئوية (%)', 'ڕێژەی سەدی (%)', 'Percentage (%)')}</option>
                          <option value="fixed">{tr(`مبلغ ثابت (${currency})`, `بڕی جێگیر (${currency})`, `Fixed Amount (${currency})`)}</option>
                        </select>
                      </label>
                      <label className="f">
                        {tr('قيمة الخصم (تخصم تلقائياً من الأسعار)', 'بڕی داشکاندن (خۆکار لە نرخەکان دەردەکرێت)', 'Discount Value (auto-applied)')}
                        <input
                          type="number"
                          min={0}
                          value={addonDraft.discountValue ?? 15}
                          onChange={(e) =>
                            updateDraft((p) => ({
                              ...p,
                              discountValue: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                            }))
                          }
                          style={themedInputStyle}
                        />
                      </label>
                    </div>
                    <label className="f">
                      {tr('نص التنبيه الظاهر في الشريط', 'دەقی ئاگاداری ناو شریتەکە', 'Banner Notice Text')}
                      <input
                        type="text"
                        value={addonDraft.discountText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('ساعة انتهاء العرض اليومية', 'کاتژمێری کۆتاییهاتنی ئۆفەر', 'Daily End Hour')}
                      <select
                        value={Number(addonDraft.endHour ?? 23)}
                        onChange={(e) => updateDraft((p) => ({ ...p, endHour: Number(e.target.value) }))}
                        style={themedInputStyle}
                      >
                        {Array.from({ length: 24 }).map((_, hr) => (
                          <option key={hr} value={hr}>
                            {formatHourLocalized(hr, lang)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {editingAddonKey === 'promoCoupons' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                      <b style={{ fontSize: '13px', color: 'var(--ink)' }}>{tr('قائمة الكوبونات الفعالة (تظهر نهاية السلة)', 'لیستی کۆپۆنە چالاکەکان (لە کۆتایی سەبەتە دەردەکەوێت)', 'Active Coupons List (shown at cart checkout)')}</b>
                      <button
                        type="button"
                        className="btn s"
                        onClick={() =>
                          updateDraft((p) => ({
                            ...p,
                            couponsList: [
                              ...(Array.isArray(p.couponsList) ? p.couponsList : []),
                              {
                                code: `SAVE${(p.couponsList?.length || 0) + 15}`,
                                discountType: 'percent',
                                discountValue: 15,
                                minSubtotal: 0,
                              },
                            ],
                          }))
                        }
                      >
                        <Plus size={14} />
                        <span>{tr('إضافة كوبون', 'زیادکردنی کۆپۆن', 'Add Coupon')}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(Array.isArray(addonDraft.couponsList) ? addonDraft.couponsList : []).map((cp: any, idx: number) => (
                        <div key={idx} style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)', backdropFilter: 'blur(14px) saturate(1.25)', WebkitBackdropFilter: 'blur(14px) saturate(1.25)', border: '1px solid var(--line)', borderRadius: '12px', padding: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <input
                              type="text"
                              dir="ltr"
                              placeholder={tr('الكود (PLUS10)', 'کۆد (PLUS10)', 'Code (PLUS10)')}
                              value={cp.code || ''}
                              onChange={(e) => {
                                const next = [...(addonDraft.couponsList || [])];
                                next[idx] = { ...next[idx], code: e.target.value.toUpperCase() };
                                updateDraft((p) => ({ ...p, couponsList: next }));
                              }}
                              style={{ ...themedInputStyle, fontWeight: 800 }}
                              required
                            />
                            <select
                              value={cp.discountType || 'percent'}
                              onChange={(e) => {
                                const next = [...(addonDraft.couponsList || [])];
                                next[idx] = { ...next[idx], discountType: e.target.value };
                                updateDraft((p) => ({ ...p, couponsList: next }));
                              }}
                              style={themedInputStyle}
                            >
                              <option value="percent">{tr('نسبة مئوية (%)', 'ڕێژەی سەدی (%)', 'Percentage (%)')}</option>
                              <option value="fixed">{tr(`مبلغ ثابت (${currency})`, `بڕی جێگیر (${currency})`, `Fixed Amount (${currency})`)}</option>
                            </select>
                            {(addonDraft.couponsList?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (addonDraft.couponsList || []).filter((_: any, i: number) => i !== idx);
                                  updateDraft((p) => ({ ...p, couponsList: next }));
                                }}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  background: 'rgba(239,68,68,0.1)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <label className="f" style={{ margin: 0, fontSize: '12px' }}>
                              {tr('قيمة الخصم', 'بڕی داشکاندن', 'Discount Value')}
                              <input
                                type="number"
                                min={1}
                                value={cp.discountValue ?? 10}
                                onChange={(e) => {
                                  const next = [...(addonDraft.couponsList || [])];
                                  next[idx] = { ...next[idx], discountValue: Number(e.target.value) };
                                  updateDraft((p) => ({ ...p, couponsList: next }));
                                }}
                                style={themedInputStyle}
                              />
                            </label>
                            <label className="f" style={{ margin: 0, fontSize: '12px' }}>
                              {tr(`الحد الأدنى للطلب (${currency})`, `کەمترین نرخی داواکاری (${currency})`, `Min Order (${currency})`)}
                              <input
                                type="number"
                                min={0}
                                value={cp.minSubtotal ?? 0}
                                onChange={(e) => {
                                  const next = [...(addonDraft.couponsList || [])];
                                  next[idx] = { ...next[idx], minSubtotal: Number(e.target.value) };
                                  updateDraft((p) => ({ ...p, couponsList: next }));
                                }}
                                style={themedInputStyle}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingAddonKey === 'customerReviews' && (
                  <>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.showOnMenu !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, showOnMenu: e.target.checked }))}
                      />
                      <span>{tr('عرض تقييمات الزبائن في صفحة المنيو', 'پیشاندانی هەڵسەنگاندنی کڕیاران لە مینیۆ', 'Show customer reviews on menu page')}</span>
                    </label>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.allowSubmit !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, allowSubmit: e.target.checked }))}
                      />
                      <span>{tr('السماح للزبائن بإرسال تقييم جديد', 'ڕێگەدان بە کڕیاران بۆ ناردنی هەڵسەنگاندنی نوێ', 'Allow customers to submit new reviews')}</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'minOrder' && (
                  <>
                    <label className="f">
                      {tr(`الحد الأدنى لمبلغ الطلب (${currency}) *`, `کەمترین بڕی داواکاری (${currency}) *`, `Minimum Order Amount (${currency}) *`)}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.amount ?? 10000}
                        onChange={(e) => updateDraft((p) => ({ ...p, amount: Number(e.target.value) }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      {tr('رسالة التنبيه للزبون', 'پەیامی ئاگادارکردنەوە بۆ کڕیار', 'Alert Message for Customer')}
                      <input
                        type="text"
                        value={addonDraft.message || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, message: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'serviceFee' && (
                  <>
                    <label className="f">
                      {tr('تسمية الرسوم في الفاتورة *', 'ناوی کرێ لە وەسڵدا *', 'Fee Label on Invoice *')}
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      {tr(`مبلغ الرسوم (${currency}) *`, `بڕی کرێ (${currency}) *`, `Fee Amount (${currency}) *`)}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.amount ?? 1000}
                        onChange={(e) => updateDraft((p) => ({ ...p, amount: Number(e.target.value) }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'tableService' && (
                  <>
                    <label className="f">
                      {tr('عدد الطاولات المتوفرة في الصالة *', 'ژمارەی مێزە بەردەستەکان لە هۆڵ *', 'Number of Tables *')}
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={addonDraft.tablesCount ?? 12}
                        onChange={(e) => updateDraft((p) => ({ ...p, tablesCount: Number(e.target.value) }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.allowWaiterCall !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, allowWaiterCall: e.target.checked }))}
                      />
                      <span>{tr('تفعيل زر نداء النادل للطاولة', 'چالاککردنی دوگمەی بانگکردنی گارسۆن بۆ مێز', 'Enable Waiter Call button per table')}</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'healthNotices' && (
                  <label className="f">
                    {tr('العبارات الصحية والتغذوية (سطر لكل عبارة)', 'ڕێنمایی تەندروستی و خۆراک (هەر دێڕێک ڕێنماییەک)', 'Health & Dietary Notices (one per line)')}
                    <textarea
                      rows={4}
                      value={addonDraft.noticesText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, noticesText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'audioBell' && (
                  <>
                    <label className="f">
                      {tr('نغمة التنبيه الصوتي للطلبات', 'ئاوازی زەنگی ئاگادارکردنەوەی داواکاری', 'Order Alert Sound')}
                      <select
                        value={addonDraft.tone || 'bell'}
                        onChange={(e) => updateDraft((p) => ({ ...p, tone: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="bell">{tr('جرس الكاشير الكلاسيكي', 'زەنگی کاشێری کلاسیک', 'Classic Cashier Bell')}</option>
                        <option value="chime">{tr('رنين ناعم ثلاثي (Chime)', 'زەنگی نەرمی سێ قۆناغی (Chime)', 'Soft Triple Chime')}</option>
                        <option value="alert">{tr('تنبيه سريع', 'ئاگادارکردنەوەی خێرا', 'Quick Alert Tone')}</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => playBellTone(addonDraft.tone || 'bell')}
                      style={{ marginBottom: '6px' }}
                    >
                      <Volume2 size={15} />
                      <span>{tr('اختبار صوت التنبيه الآن', 'تاقیکردنەوەی دەنگ ئێستا', 'Test Alert Sound Now')}</span>
                    </button>
                  </>
                )}

                {editingAddonKey === 'prepBadge' && (
                  <>
                    <label className="f">
                      {tr('عنوان الشارة (مثال: التحضير السريع)', 'ناونیشانی نیشانە (نموونە: ئامادەکردنی خێرا)', 'Badge Label (e.g., Fast Prep)')}
                      <input
                        type="text"
                        value={addonDraft.text || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, text: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('الوقت المتوقع (مثال: 20 - 30 دقيقة)', 'کاتی چاوەڕوانکراو (نموونە: ٢٠ - ٣٠ خولەک)', 'Estimated Time (e.g., 20 - 30 mins)')}
                      <input
                        type="text"
                        value={addonDraft.etaText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, etaText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'closedNotice' && (
                  <>
                    <label className="f">
                      {tr('نص إشعار الطلب المسبق عند الإغلاق', 'دەقی ئاگاداری داواکاری پێشوەختە لە کاتی داخستندا', 'Closed Pre-Order Notice Text')}
                      <textarea
                        rows={3}
                        value={addonDraft.message || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, message: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {tr(
                        'يظهر هذا التنبيه تلقائياً للزبائن عندما يكون المتجر مغلقاً خارج أوقات الدوام أو مع تفعيل الطلب المسبق.',
                        'ئەم ئاگادارکردنەوەیە خۆکار بۆ کڕیاران دەردەکەوێت کاتێک فرۆشگا دەرەوەی کاتی کار داخرابێت.',
                        'Shown automatically when the store is closed outside business hours with pre-orders enabled.'
                      )}
                    </div>
                  </>
                )}

                {editingAddonKey === 'happyHour' && (
                  <>
                    <label className="f">
                      {tr('عنوان عرض ساعة السعادة', 'ناونیشانی کاتژمێری دڵخۆشی', 'Happy Hour Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label className="f">
                        {tr('من الساعة', 'لە کاتژمێر', 'Start Hour')}
                        <select
                          value={Number(addonDraft.startHour ?? 14)}
                          onChange={(e) => updateDraft((p) => ({ ...p, startHour: Number(e.target.value) }))}
                          style={themedInputStyle}
                        >
                          {Array.from({ length: 24 }).map((_, hr) => (
                            <option key={hr} value={hr}>
                              {formatHourLocalized(hr, lang)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="f">
                        {tr('إلى الساعة', 'بۆ کاتژمێر', 'End Hour')}
                        <select
                          value={Number(addonDraft.endHour ?? 17)}
                          onChange={(e) => updateDraft((p) => ({ ...p, endHour: Number(e.target.value) }))}
                          style={themedInputStyle}
                        >
                          {Array.from({ length: 24 }).map((_, hr) => (
                            <option key={hr} value={hr}>
                              {formatHourLocalized(hr, lang)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="f">
                      {tr('نسبة الخصم التلقائي (%)', 'ڕێژەی داشکاندنی خۆکار (%)', 'Auto Discount (%)')}
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={addonDraft.discountPercent ?? 15}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    {(() => {
                      const s = Number(addonDraft.startHour ?? 14);
                      const en = Number(addonDraft.endHour ?? 17);
                      const activeNow = s <= en ? currentLocalHour >= s && currentLocalHour < en : currentLocalHour >= s || currentLocalHour < en;
                      return (
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: activeNow ? '#10b981' : 'var(--muted)' }}>
                          {activeNow
                            ? tr('✓ الوقت الحالي يقع ضمن ساعة السعادة وسيطبق الخصم فوراً عند التفعيل.', '✓ کاتی ئێستا لە ناو کاتژمێری دڵخۆشیدایە و داشکاندن یەکسەر جێبەجێ دەبێت.', '✓ Current time falls within Happy Hour and applies immediately when active.')
                            : tr(`الخصم سيتفعل تلقائياً يومياً من ${formatHourLocalized(s, lang)} إلى ${formatHourLocalized(en, lang)}.`, `داشکاندن ڕۆژانە خۆکار لە ${formatHourLocalized(s, lang)} تا ${formatHourLocalized(en, lang)} چالاک دەبێت.`, `Discount triggers automatically daily from ${formatHourLocalized(s, lang)} to ${formatHourLocalized(en, lang)}.`)}
                        </div>
                      );
                    })()}
                  </>
                )}

                {editingAddonKey === 'freeGiftThreshold' && (
                  <>
                    <label className="f">
                      {tr(`الحد الأدنى للطلب للحصول على الهدية (${currency})`, `کەمترین نرخی داواکاری بۆ وەرگرتنی دیاری (${currency})`, `Minimum Spend for Free Gift (${currency})`)}
                      <input
                        type="number"
                        min={0}
                        value={addonDraft.minAmount ?? 25000}
                        onChange={(e) => updateDraft((p) => ({ ...p, minAmount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('اسم الهدية المجانية *', 'ناوی دیاری بێبەرامبەر *', 'Free Gift Name *')}
                      <input
                        type="text"
                        value={addonDraft.giftName || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, giftName: e.target.value }))}
                        style={themedInputStyle}
                        required
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'cartUpsell' && (
                  <>
                    <label className="f">
                      {tr('عنوان قسم المقترحات في السلة', 'ناونیشانی بەشی پێشنیارەکان لە سەبەتە', 'Cart Upsell Section Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('عدد الأصناف المقترحة داخل السلة (1 - 8)', 'ژمارەی بەرهەمە پێشنیارکراوەکان لە سەبەتە (١ - ٨)', 'Max Suggested Items in Cart (1 - 8)')}
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={addonDraft.maxItems ?? 4}
                        onChange={(e) => updateDraft((p) => ({ ...p, maxItems: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'dailySpecialBanner' && (
                  <>
                    <label className="f">
                      {tr('عنوان بطاقة طبق اليوم', 'ناونیشانی کارتی خواردنی ڕۆژ', 'Daily Special Card Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('الوصف المختصر', 'کورتە وەسف', 'Short Subtitle')}
                      <input
                        type="text"
                        value={addonDraft.subtitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, subtitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('نص الشارة (مثال: الأكثر طلباً اليوم)', 'دەقی نیشانە (نموونە: پڕداواکارترین ئەمڕۆ)', 'Badge Text (e.g., Most Popular Today)')}
                      <input
                        type="text"
                        value={addonDraft.badgeText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, badgeText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('اختر الطبق المميز من المنيو', 'خواردنی تایبەت لە مینیۆ هەڵبژێرە', 'Select Featured Dish from Menu')}
                      <select
                        value={addonDraft.itemId || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, itemId: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="">{tr('تلقائي (أول طبق متاح)', 'خۆکار (یەکەم خواردنی بەردەست)', 'Auto (first available dish)')}</option>
                        {allItems.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.n} — {formatNumber(it.pr)} {currency}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {editingAddonKey === 'spinWheelPromo' && (
                  <>
                    <label className="f">
                      {tr('عنوان نافذة عجلة الحظ', 'ناونیشانی پەنجەرەی چەرخی بەخت', 'Spin Wheel Popup Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr(
                        'الجوائز المتاحة (سطر لكل جائزة — أمثلة: خصم 5%، خصم 10%، توصيل مجاني)',
                        'خەڵاتە بەردەستەکان (هەر دێڕێک خەڵاتێک — نموونە: داشکاندنی ٥٪، گەیاندنی بێبەرامبەر)',
                        'Available Prizes (one per line — e.g., 5% Off, 10% Off, Free Delivery)'
                      )}
                      <textarea
                        rows={4}
                        value={addonDraft.prizesText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, prizesText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'loyaltyPoints' && (
                  <>
                    <label className="f">
                      {tr(`عدد النقاط لكل 1,000 ${currency}`, `ژمارەی خاڵ بۆ هەر ١,٠٠٠ ${currency}`, `Points per 1,000 ${currency}`)}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.pointsPerThousand ?? 1}
                        onChange={(e) => updateDraft((p) => ({ ...p, pointsPerThousand: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('رسالة تشجيع النقاط للزبون', 'پەیامی هاندانی خاڵ بۆ کڕیار', 'Customer Loyalty Message')}
                      <input
                        type="text"
                        value={addonDraft.rewardNote || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, rewardNote: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'socialProofBadge' && (
                  <>
                    <label className="f">
                      {tr('عدد المتصفحين الحاليين الظاهر', 'ژمارەی سەردانیکەرانی ئێستا کە دەردەکەوێت', 'Displayed Active Browsers Count')}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.visitorsCount ?? 18}
                        onChange={(e) => updateDraft((p) => ({ ...p, visitorsCount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('نص عدد الطلبات اليومية', 'دەقی ژمارەی داواکارییەکانی ئەمڕۆ', 'Daily Orders Label')}
                      <input
                        type="text"
                        value={addonDraft.ordersTodayText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, ordersTodayText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'chefPicksFilter' && (
                  <>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.showPopular !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, showPopular: e.target.checked }))}
                      />
                      <span>{tr('تفعيل فلتر "الأكثر طلباً"', 'چالاککردنی فلتەری "پڕداواکارترین"', 'Enable "Most Popular" filter')}</span>
                    </label>
                    <label className="mp-addon-check-row">
                      <input
                        type="checkbox"
                        checked={addonDraft.showOffers !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, showOffers: e.target.checked }))}
                      />
                      <span>{tr('تفعيل فلتر "العروض المخفضة"', 'چالاککردنی فلتەری "ئۆفەرە داشکێنراوەکان"', 'Enable "Discounted Offers" filter')}</span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'quickReorder' && (
                  <label className="f">
                    {tr('نص زر إعادة الطلب السريع', 'دەقی دوگمەی دووبارە داواکردنەوەی خێرا', 'Quick Reorder Button Text')}
                    <input
                      type="text"
                      value={addonDraft.buttonText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, buttonText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'savedFavorites' && (
                  <label className="f">
                    {tr('تسمية تبويب المفضلة', 'ناوی تابی دڵخوازەکان', 'Favorites Tab Label')}
                    <input
                      type="text"
                      value={addonDraft.label || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'cutleryOption' && (
                  <label className="f">
                    {tr('نص سؤال أدوات الطعام داخل السلة', 'دەقی پرسیاری کەوچک و کلێنس لە سەبەتە', 'Cutlery & Napkins Prompt')}
                    <input
                      type="text"
                      value={addonDraft.label || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'deliveryEtaTracker' && (
                  <label className="f">
                    {tr('وقت التوصيل المتوقع الظاهر للزبون', 'کاتی گەیاندنی چاوەڕوانکراو بۆ کڕیار', 'Estimated Delivery Time Display')}
                    <input
                      type="text"
                      value={addonDraft.etaText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, etaText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'scheduledOrder' && (
                  <>
                    <label className="f">
                      {tr('عنوان اختيار الوقت', 'ناونیشانی هەڵبژاردنی کات', 'Time Slot Picker Label')}
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('المواعيد المتاحة للجدولة (سطر لكل موعد)', 'کاتە بەردەستەکان (هەر دێڕێک کاتێک)', 'Available Time Slots (one per line)')}
                      <textarea
                        rows={4}
                        value={addonDraft.slotsText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, slotsText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'firstOrderDiscount' && (
                  <>
                    <label className="f">
                      {tr('نسبة خصم الطلب الأول (%)', 'ڕێژەی داشکاندنی یەکەم داواکاری (%)', 'First Order Discount (%)')}
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={addonDraft.discountPercent ?? 10}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('عنوان الخصم الترحيبي', 'ناونیشانی داشکاندنی پێشوازی', 'Welcome Discount Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'freeDeliveryProgress' && (
                  <>
                    <label className="f">
                      {tr(`الحد الأدنى للتوصيل المجاني (${currency}) *`, `کەمترین بڕ بۆ گەیاندنی بێبەرامبەر (${currency}) *`, `Free Delivery Threshold (${currency}) *`)}
                      <input
                        type="number"
                        min={1}
                        value={addonDraft.minAmount ?? 25000}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            minAmount: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                          }))
                        }
                        placeholder="25000"
                        style={themedInputStyle}
                        required
                      />
                    </label>
                    <label className="f">
                      {tr('عنوان شريط التوصيل المجاني التحفيزي', 'ناونیشانی شریتی گەیاندنی بێبەرامبەر', 'Free Delivery Bar Title')}
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'whatsappSupportFloat' && (
                  <>
                    <label className="f">
                      {tr('نص زر الدعم العائم', 'دەقی دوگمەی یارمەتی سەرئاوکەوتوو', 'Floating Support Button Text')}
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('الرسالة التلقائية عند فتح الواتساب', 'پەیامی خۆکار لە کاتی کردنەوەی واتسئاپ', 'Prefilled WhatsApp Message')}
                      <input
                        type="text"
                        value={addonDraft.prefillText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, prefillText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: waTargetPhone ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.12)',
                        color: waTargetPhone ? '#10b981' : '#f59e0b',
                        border: waTargetPhone ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      {waTargetPhone
                        ? tr(`سيتم توجيه الزبون إلى رقم الواتساب: ${waTargetPhone}`, `کڕیار ئاڕاستەی ئەم ژمارە واتسئاپە دەکرێت: ${waTargetPhone}`, `Customers will be routed to WhatsApp: ${waTargetPhone}`)
                        : tr('تنبيه: يرجى التأكد من إضافة رقم واتساب المتجر في قسم "الإعدادات" ليظهر الزر للزبائن.', 'ئاگاداری: تکایە دڵنیابە لە دانانی ژمارەی واتسئاپ لە بەشی "ڕێکخستنەکان" تا دوگمەکە دەربکەوێت.', 'Note: Add a WhatsApp number in Settings so the button appears for customers.')}
                    </div>
                  </>
                )}

                {editingAddonKey === 'groupOrderBillSplit' && (
                  <label className="f">
                    {tr('أقصى عدد للأشخاص في حاسبة تقسيم الفاتورة', 'زۆرترین ژمارەی کەسەکان لە هەژمارکەری وەسڵ', 'Max People in Bill Splitter')}
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={addonDraft.maxPeople ?? 10}
                      onChange={(e) => updateDraft((p) => ({ ...p, maxPeople: Number(e.target.value) }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'flashTipOption' && (
                  <label className="f">
                    {tr('مبالغ الإكرامية السريعة (افصل بينها بفاصلة: 1000,2000,5000)', 'بڕەکانی بەخشیشی خێرا (بە فاریزە جیای بکەرەوە: 1000,2000,5000)', 'Quick Tip Presets (comma-separated: 1000,2000,5000)')}
                    <input
                      type="text"
                      dir="ltr"
                      value={addonDraft.presetsText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, presetsText: e.target.value }))}
                      style={{ ...themedInputStyle, textAlign: 'left' }}
                    />
                  </label>
                )}

                {editingAddonKey === 'mysteryBoxOffer' && (
                  <>
                    <label className="f">
                      {tr('اسم صندوق المفاجآت', 'ناوی سندووقی سوپرایز', 'Mystery Box Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('وصف المحتويات والمفاجأة', 'وەسفی ناوەڕۆک و سوپرایز', 'Contents & Surprise Description')}
                      <input
                        type="text"
                        value={addonDraft.subtitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, subtitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div className="mp-grid-2">
                      <label className="f">
                        {tr(`سعر الصندوق (${currency})`, `نرخی سندووق (${currency})`, `Box Price (${currency})`)}
                        <input
                          type="number"
                          min={500}
                          value={addonDraft.price ?? 8000}
                          onChange={(e) => updateDraft((p) => ({ ...p, price: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                      <label className="f">
                        {tr('القيمة الحقيقية قبل الخصم', 'نرخی ڕاستەقینە پێش داشکاندن', 'Original Value Before Discount')}
                        <input
                          type="number"
                          min={500}
                          value={addonDraft.originalPrice ?? 16000}
                          onChange={(e) => updateDraft((p) => ({ ...p, originalPrice: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                    </div>
                    <label className="f">
                      {tr('الكمية المتبقية المعروضة للزبائن', 'بڕی ماوەی پیشاندراو بۆ کڕیاران', 'Displayed Remaining Quantity')}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={addonDraft.remainingCount ?? 5}
                        onChange={(e) => updateDraft((p) => ({ ...p, remainingCount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'bogoDealEngine' && (
                  <>
                    <label className="f">
                      {tr('عنوان عرض القطعة الثانية', 'ناونیشانی ئۆفەری پارچەی دووەم', 'Second-Item Deal Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('نسبة الخصم على القطعة الأقل سعراً (%)', 'ڕێژەی داشکاندن لەسەر هەرزانترینیان (%)', 'Discount on Lower-Priced Item (%)')}
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={addonDraft.secondItemDiscountPercent ?? 50}
                        onChange={(e) => updateDraft((p) => ({ ...p, secondItemDiscountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'vipSecretMenuLock' && (
                  <>
                    <label className="f">
                      {tr('الرمز السري لفتح الطبق المخفي', 'کۆدی نهێنی بۆ کردنەوەی خواردنی شاراوە', 'Secret Code to Unlock Dish')}
                      <input
                        type="text"
                        dir="ltr"
                        value={addonDraft.secretCode || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, secretCode: e.target.value }))}
                        style={{ ...themedInputStyle, textAlign: 'left' }}
                      />
                    </label>
                    <label className="f">
                      {tr('اسم الطبق السري الخاص بكبار الشخصيات', 'ناوی خواردنی نهێنی VIP', 'VIP Secret Dish Name')}
                      <input
                        type="text"
                        value={addonDraft.dishName || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, dishName: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('وصف الطبق السري', 'وەسفی خواردنی نهێنی', 'Secret Dish Description')}
                      <input
                        type="text"
                        value={addonDraft.dishDesc || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, dishDesc: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr(`سعر الطبق السري (${currency})`, `نرخی خواردنی نهێنی (${currency})`, `Secret Dish Price (${currency})`)}
                      <input
                        type="number"
                        min={500}
                        value={addonDraft.dishPrice ?? 12000}
                        onChange={(e) => updateDraft((p) => ({ ...p, dishPrice: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'pickupInstantDiscount' && (
                  <>
                    <label className="f">
                      {tr('عنوان خصم الاستلام من المتجر', 'ناونیشانی داشکاندنی وەرگرتن لە لق', 'Self-Pickup Discount Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('نسبة الخصم الفوري عند اختيار الاستلام (%)', 'ڕێژەی داشکاندنی خێرا لە کاتی وەرگرتن (%)', 'Instant Pickup Discount (%)')}
                      <input
                        type="number"
                        min={2}
                        max={60}
                        value={addonDraft.discountPercent ?? 10}
                        onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'birthdayVipTreat' && (
                  <>
                    <label className="f">
                      {tr('عنوان خيار عيد الميلاد في السلة', 'ناونیشانی بژاردەی جەژنی لەدایکبوون لە سەبەتە', 'Birthday Option Label')}
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('ملاحظة الهدية المجانية (حلى / شمعة / تهنئة)', 'تێبینی دیاری بێبەرامبەر (شیرینی / مۆم / پیرۆزبایی)', 'Complimentary Treat Note (dessert / candle / card)')}
                      <input
                        type="text"
                        value={addonDraft.freeTreatNote || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, freeTreatNote: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'buildYourOwnCombo' && (
                  <>
                    <label className="f">
                      {tr('عنوان عرض صمّم وجبتك', 'ناونیشانی ئۆفەری ژەمەکەت دیزاین بکە', 'Build-Your-Own Combo Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <div className="mp-grid-2">
                      <label className="f">
                        {tr('أقل عدد أصناف في السلة', 'کەمترین ژمارەی بەرهەم لە سەبەتە', 'Minimum Items Required')}
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={addonDraft.requiredCount ?? 3}
                          onChange={(e) => updateDraft((p) => ({ ...p, requiredCount: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                      <label className="f">
                        {tr('نسبة خصم الكومبو (%)', 'ڕێژەی داشکاندنی کۆمبۆ (%)', 'Combo Discount (%)')}
                        <input
                          type="number"
                          min={2}
                          max={60}
                          value={addonDraft.discountPercent ?? 12}
                          onChange={(e) => updateDraft((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                          style={themedInputStyle}
                        />
                      </label>
                    </div>
                  </>
                )}

                {editingAddonKey === 'flashQuantityScarcity' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      {tr('نص شارة الكمية المحدودة', 'دەقی نیشانەی بڕی سنووردار', 'Scarcity Badge Prefix')}
                      <input
                        type="text"
                        value={addonDraft.badgePrefix || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, badgePrefix: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('الحد الأقصى للعدد المعروض', 'زۆرترین ژمارەی پیشاندراو', 'Max Displayed Remaining Count')}
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={addonDraft.defaultRemaining ?? 4}
                        onChange={(e) => updateDraft((p) => ({ ...p, defaultRemaining: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'streakRewardsCard' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      {tr('عدد الطلبات لفتح المكافأة', 'ژمارەی داواکاری بۆ کردنەوەی خەڵات', 'Orders Target for Reward')}
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={addonDraft.targetOrders ?? 5}
                        onChange={(e) => updateDraft((p) => ({ ...p, targetOrders: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('المكافأة عند اكتمال السلسلة', 'خەڵات دوای تەواوبوونی زنجیرە', 'Reward Upon Completion')}
                      <input
                        type="text"
                        value={addonDraft.rewardTitle || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, rewardTitle: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'smartPairingSuggest' && (
                  <>
                    <label className="f">
                      {tr('عنوان قسم التكميل الذكي داخل نافذة الصنف', 'ناونیشانی بەشی تەواوکەری زیرەک لە ناو پەنجەرەی بەرهەم', 'Smart Pairing Section Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('كلمة مفتاحية لقسم المشروبات أو الإضافات (مثال: مشروب)', 'وشەی سەرەکی بۆ بەشی خواردنەوە یان زیادکراو (نموونە: خواردنەوە)', 'Drinks/Sides Category Keyword (e.g., drink)')}
                      <input
                        type="text"
                        value={addonDraft.categoryKeyword || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, categoryKeyword: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'luxuryGiftPackaging' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      {tr('وصف خيار تغليف الهدايا الفاخر', 'وەسفی بژاردەی پاکەتی دیاری فەخم', 'Luxury Packaging Label')}
                      <input
                        type="text"
                        value={addonDraft.label || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr(`رسوم التغليف (${currency})`, `کرێی پاکەتکردن (${currency})`, `Packaging Fee (${currency})`)}
                      <input
                        type="number"
                        min={0}
                        value={addonDraft.feeAmount ?? 2000}
                        onChange={(e) => updateDraft((p) => ({ ...p, feeAmount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'moodMealFinder' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      {tr('عنوان نافذة اختيار المزاج', 'ناونیشانی پەنجەرەی هەڵبژاردنی مەزاج', 'Mood Finder Modal Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr('نص زر مكتشف المزاج في المنيو', 'دەقی دوگمەی دۆزەرەوەی مەزاج لە مینیۆ', 'Mood Finder Button Text')}
                      <input
                        type="text"
                        value={addonDraft.buttonText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, buttonText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'voiceSearchOrder' && (
                  <>
                    <label className="f">
                      {tr('لغة التعرف الصوتي الافتراضية', 'زمانی بنەڕەتی ناسینەوەی دەنگ', 'Default Speech Recognition Language')}
                      <select
                        value={addonDraft.lang || 'ar-IQ'}
                        onChange={(e) => updateDraft((p) => ({ ...p, lang: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="ar-IQ">{tr('العربية - العراق (ar-IQ)', 'عەرەبی - عێراق (ar-IQ)', 'Arabic - Iraq (ar-IQ)')}</option>
                        <option value="ar-SA">{tr('العربية - الخليج والسعودية (ar-SA)', 'عەرەبی - کەنداو و سعودیە (ar-SA)', 'Arabic - Gulf (ar-SA)')}</option>
                        <option value="en-US">{tr('الإنجليزية (en-US)', 'ئینگلیزی (en-US)', 'English (en-US)')}</option>
                      </select>
                    </label>
                    <label className="f">
                      {tr('النص التوضيحي بجانب المايكروفون', 'دەقی ڕوونکردنەوە لە تەنیشت مایکرۆفۆن', 'Microphone Helper Hint')}
                      <input
                        type="text"
                        value={addonDraft.hintText || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, hintText: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'dietaryAllergyRadar' && (
                  <label className="f">
                    {tr('رسالة التنبيه عند وجود مكونات حساسية في الصنف', 'پەیامی ئاگادارکردنەوە لە کاتی بوونی پێکهاتەی هەستیاری', 'Allergen Warning Message')}
                    <input
                      type="text"
                      value={addonDraft.warningText || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, warningText: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'calorieMacroBudget' && (
                  <label className="f">
                    {tr('حد السعرات الحرارية المستهدف للوجبة (kcal)', 'ئامانجی کالۆری بۆ ژەمەکە (kcal)', 'Target Meal Calorie Budget (kcal)')}
                    <input
                      type="number"
                      min={200}
                      max={4000}
                      value={addonDraft.targetCalories ?? 800}
                      onChange={(e) => updateDraft((p) => ({ ...p, targetCalories: Number(e.target.value) }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'multiCurrencySwitch' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      {tr('رمز العملة البديلة (مثال: $)', 'هێمای دراوی جێگرەوە (نموونە: $)', 'Secondary Currency Symbol (e.g., $)')}
                      <input
                        type="text"
                        dir="ltr"
                        value={addonDraft.altSymbol || '$'}
                        onChange={(e) => updateDraft((p) => ({ ...p, altSymbol: e.target.value }))}
                        style={{ ...themedInputStyle, textAlign: 'left' }}
                      />
                    </label>
                    <label className="f">
                      {tr('سعر الصرف (كم وحدة تساوي 1 عملة بديلة)', 'نرخی ئاڵوگۆڕ (چەند یەکە یەکسانە بە ١ دراوی جێگرەوە)', 'Exchange Rate (units per 1 alt currency)')}
                      <input
                        type="number"
                        min={1}
                        step="any"
                        value={addonDraft.exchangeRate ?? 1500}
                        onChange={(e) => updateDraft((p) => ({ ...p, exchangeRate: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'dishCompareDrawer' && (
                  <label className="f">
                    {tr('أقصى عدد أطباق للمقارنة في نفس الوقت', 'زۆرترین ژمارەی خواردن بۆ بەراوردکردن لە هەمان کاتدا', 'Max Dishes to Compare Side-by-Side')}
                    <input
                      type="number"
                      min={2}
                      max={4}
                      value={addonDraft.maxCompare ?? 2}
                      onChange={(e) => updateDraft((p) => ({ ...p, maxCompare: Number(e.target.value) }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}

                {editingAddonKey === 'charityMealRoundup' && (
                  <div className="mp-grid-2">
                    <label className="f">
                      {tr('عنوان التبرع الخيري في السلة', 'ناونیشانی بەخشینی خێرخوازی لە سەبەتە', 'Charity Donation Title')}
                      <input
                        type="text"
                        value={addonDraft.title || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, title: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label className="f">
                      {tr(`مبلغ المساهمة (${currency})`, `بڕی بەشداری (${currency})`, `Contribution Amount (${currency})`)}
                      <input
                        type="number"
                        min={100}
                        value={addonDraft.donationAmount ?? 500}
                        onChange={(e) => updateDraft((p) => ({ ...p, donationAmount: Number(e.target.value) }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </div>
                )}

                {editingAddonKey === 'curbsidePickupCar' && (
                  <>
                    <label className="f">
                      {tr('تعليمات الاستلام من السيارة للزبون', 'ڕێنمایی وەرگرتن لە ناو ئۆتۆمبێل بۆ کڕیار', 'Curbside Pickup Instructions')}
                      <input
                        type="text"
                        value={addonDraft.instructions || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, instructions: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: 'var(--ink)' }}>
                      <input
                        type="checkbox"
                        checked={addonDraft.allowArrivedPing !== false}
                        onChange={(e) => updateDraft((p) => ({ ...p, allowArrivedPing: e.target.checked }))}
                      />
                      <span>
                        {tr(
                          'تفعيل زر "وصلت أمام المطعم" لإرسال إشعار فوري عبر واتساب',
                          'چالاککردنی دوگمەی "گەیشتمە بەردەم چێشتخانە" بۆ ناردنی ئاگاداری خێرا لە واتسئاپ',
                          'Enable "I Have Arrived" button for instant WhatsApp arrival ping'
                        )}
                      </span>
                    </label>
                  </>
                )}

                {editingAddonKey === 'liveKitchenLoad' && (
                  <>
                    <label className="f">
                      {tr('حالة ضغط المطبخ الحالية', 'دۆخی فشاری چێشتخانە لە ئێستادا', 'Current Kitchen Load Level')}
                      <select
                        value={addonDraft.level || 'moderate'}
                        onChange={(e) => updateDraft((p) => ({ ...p, level: e.target.value }))}
                        style={themedInputStyle}
                      >
                        <option value="calm">{tr('هادئ (تجهيز سريع ⚡)', 'ئارام (ئامادەکردنی خێرا ⚡)', 'Calm (Fast Prep ⚡)')}</option>
                        <option value="moderate">{tr('متوسط (الوقت الاعتيادي ⏱️)', 'مامناوەند (کاتی ئاسایی ⏱️)', 'Moderate (Normal Time ⏱️)')}</option>
                        <option value="busy">{tr('مزدحم (ضغط طلبات عالي 🔥)', 'قەرەباڵغ (فشاری زۆری داواکاری 🔥)', 'Busy (High Demand 🔥)')}</option>
                      </select>
                    </label>
                    <label className="f">
                      {tr('ملاحظة إضافية تظهر بجانب الشارة', 'تێبینی زیادە لە تەنیشت نیشانەکە', 'Optional Status Note')}
                      <input
                        type="text"
                        value={addonDraft.customNote || ''}
                        onChange={(e) => updateDraft((p) => ({ ...p, customNote: e.target.value }))}
                        style={themedInputStyle}
                      />
                    </label>
                  </>
                )}

                {editingAddonKey === 'silentDropoffOption' && (
                  <label className="f">
                    {tr('نص خيار التوصيل الصامت بدون طرق الباب', 'دەقی بژاردەی گەیاندنی بێدەنگ بەبێ زەنگ لێدان', 'Silent Drop-off Option Label')}
                    <input
                      type="text"
                      value={addonDraft.label || ''}
                      onChange={(e) => updateDraft((p) => ({ ...p, label: e.target.value }))}
                      style={themedInputStyle}
                    />
                  </label>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="mp-addon-modal-footer">
                <button type="button" className="btn" onClick={closeEditModal} disabled={addonSaving}>
                  {tr('إلغاء', 'هەڵوەشاندنەوە', 'Cancel')}
                </button>
                <button type="submit" className="btn p" disabled={addonSaving} style={{ fontWeight: 800 }}>
                  {addonEditIntent === 'enable' ? <CheckCircle2 size={15} /> : <Save size={15} />}
                  <span>
                    {addonSaving
                      ? tr('جاري الحفظ...', 'پاشەکەوت دەکرێت...', 'Saving...')
                      : addonEditIntent === 'enable'
                      ? tr('حفظ وتفعيل الإضافة', 'پاشەکەوت و چالاککردنی زیادکراو', 'Save & Enable Add-on')
                      : tr('حفظ التعديلات', 'پاشەکەوتکردنی گۆڕانکارییەکان', 'Save Changes')}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CENTERED OFFER POPUP PREVIEW */}
      {showPopupPreview && (
        <div
          className="mp-addon-modal-overlay"
          dir={isRtl ? 'rtl' : 'ltr'}
          style={{ zIndex: 100100 }}
          onClick={() => setShowPopupPreview(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: 'min(420px, 92vw)',
              ...surfaceCardStyle,
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setShowPopupPreview(false)}
              aria-label={tr('إغلاق', 'داخستن', 'Close')}
              style={{
                position: 'absolute',
                top: '12px',
                insetInlineEnd: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                backdropFilter: 'blur(12px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink)',
                zIndex: 10,
              }}
            >
              ✕
            </button>

            {(addonDraft.image || addonsState.offerPopup?.image) && (
              <img
                src={addonDraft.image || addonsState.offerPopup?.image}
                alt={tr('صورة الإعلان', 'وێنەی ڕێکلام', 'Promo image')}
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              />
            )}

            <div style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--ink)', margin: '0 0 8px' }}>
                {addonDraft.title || addonsState.offerPopup?.title}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
                {addonDraft.subtitle || addonsState.offerPopup?.subtitle}
              </p>
              <button
                type="button"
                onClick={() => setShowPopupPreview(false)}
                className="btn p b"
                style={{ fontWeight: 800 }}
              >
                {addonDraft.buttonText || addonsState.offerPopup?.buttonText || tr('تصفح المنيو', 'مینیۆ ببینە', 'Browse Menu')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
