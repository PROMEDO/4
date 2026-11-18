/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  Monitor,
  Moon,
  Plus,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Store,
  Sun,
  Trash2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react';
import { LanguageSelector } from '../../components/LanguageSelector';
import { sanitizeSlug } from '../../utils/businessDefaults';
import { getLocalizedPlanName } from '../../utils/plans';
import {
  getLocalizedWeekDaysOrder,
  surfaceCardStyle,
  themedInputStyle,
  useDashboard,
} from './DashboardContext';

export const SettingsPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    lang,
    setLang,
    isRtl,
    tr,
    showToast,
    resolvedPlan,
    openUpgradeModal,
    menuThemeMode,
    handleSelectThemeMode,
    dashboardThemeMode,
    handleSelectDashboardThemeMode,
    customTabLabel,
    baseDomain,
    fullSubdomainUrl,
    subdomainEnabled,
    publicPath,
    liveMenuUrl,
    onNavigate,
    copyLink,
    openShareModal,
    restSlug,
    setRestSlug,
    slugCheckState,
    checkSubdomainAvailability,
    coverUrlInput,
    setCoverUrlInput,
    logoUrlInput,
    setLogoUrlInput,
    aboutTextInput,
    setAboutTextInput,
    taxNoteInput,
    setTaxNoteInput,
    showLogoUrlField,
    setShowLogoUrlField,
    showBannerUrlField,
    setShowBannerUrlField,
    handleCurrencyChange,
    handleSaveSettings,
    handleDeviceImageUpload,
    restProjectType,
    setRestProjectType,
    restName,
    setRestName,
    restTagline,
    setRestTagline,
    restCurrency,
    restActive,
    setRestActive,
    allowDelivery,
    setAllowDelivery,
    allowPickup,
    setAllowPickup,
    allowTable,
    setAllowTable,
    rest,
    setActiveTab,
    acceptClosedOrders,
    setAcceptClosedOrders,
    orderChannel,
    setOrderChannel,
    restPhone,
    setRestPhone,
    restWa,
    setRestWa,
    restAddress,
    setRestAddress,
    restInstagram,
    setRestInstagram,
    restMapUrl,
    setRestMapUrl,
    restGoogleReviewUrl,
    setRestGoogleReviewUrl,
    restFacebook,
    setRestFacebook,
    restTiktok,
    setRestTiktok,
    workMode,
    setWorkMode,
    workFrom,
    setWorkFrom,
    workTo,
    setWorkTo,
    weeklyHours,
    setWeeklyHours,
    applyTimeToOpenDays,
    deliveryZonesState,
    setDeliveryZonesState,
  } = useDashboard();

  const weekDaysOrder = getLocalizedWeekDaysOrder(lang);

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const previewSubdomainHost = subdomainEnabled
    ? `${restSlug || 'your-store'}.${baseDomain}`
    : `${baseDomain}/${restSlug || 'your-store'}`;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '23px', fontWeight: 900, color: 'var(--ink)' }}>
            {customTabLabel('set', tr('إعدادات المشروع والرابط المخصص ⚙️', 'ڕێکخستنەکانی پرۆژە و لینکی تایبەت ⚙️', 'Business & Custom Link Settings ⚙️'))}
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
            {tr(
              'تحكم باللغة، العملة، الدومين الفرعي، الشعار والغلاف، الدوام الأسبوعي، وأسعار التوصيل.',
              'کۆنترۆڵی زمان، دراو، سەب-دۆمەین، لۆگۆ و بەرگ، کاتی کارکردنی هەفتانە و نرخی گەیاندن بکە.',
              'Manage language, currency, custom link, branding media, weekly hours, and delivery zones.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          className="btn p"
          style={{ fontWeight: 800 }}
        >
          <Save size={16} />
          <span>{tr('حفظ جميع الإعدادات', 'پاشەکەوتکردنی هەموو ڕێکخستنەکان', 'Save All Settings')}</span>
        </button>
      </motion.div>

      {/* Continuous Section Quick Jump Strip */}
      <motion.div
        className="mp-jump-strip"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        {[
          { id: 'sec-lang', label: tr('1. اللغة والعملة والتشغيل', '١. زمان، دراو و کارکردن', '1. Language, Currency & Status') },
          { id: 'sec-slug', label: tr('2. الرابط والدومين', '٢. لینک و دۆمەین', '2. Link & Subdomain') },
          { id: 'sec-media', label: tr('3. الشعار والغلاف', '٣. لۆگۆ و بەرگ', '3. Logo & Cover') },
          { id: 'sec-identity', label: tr('4. الهوية والتواصل', '٤. ناسنامە و پەیوەندی', '4. Identity & Contact') },
          { id: 'sec-delivery', label: tr('5. الدوام والتوصيل', '٥. کاتی کار و گەیاندن', '5. Hours & Delivery') },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            className="mp-jump-btn"
            onClick={() => jumpTo(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </motion.div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveSettings();
        }}
        className="mp-settings-sections"
      >
        {/* SECTION 1: اللغة والعملة وحالة التشغيل وطرق الطلب */}
        <motion.section
          id="sec-lang"
          className="mp-set-sec"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.06 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mp-set-sec-head">
            <h2 className="mp-set-sec-title">
              <span className="mp-set-sec-num">1</span>
              <span>{tr('اللغة والعملة وحالة المنيو وطرق الطلب', 'زمان، دراو، دۆخی مینیۆ و شێوازەکانی داواکاری', 'Language, Currency, Status & Order Types')}</span>
            </h2>
          </div>

          <div className="mp-set-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--soft)',
                    color: 'var(--brand-ink, #34D399)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 2px' }}>
                    {tr('لغة لوحة التحكم والمنيو', 'زمانی کۆنتڕۆڵ پانێڵ و مینیۆ', 'Dashboard & Menu Language')}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>
                    {tr('اختر اللغة المفضلة لعرض واجهة لوحة التحكم والمنيو.', 'زمانی دڵخواز هەڵبژێرە بۆ پیشاندانی ڕووکاری پانێڵ و مینیۆ.', 'Choose your preferred language for the dashboard and menu.')}
                  </p>
                </div>
              </div>

              <LanguageSelector
                currentLang={lang}
                onChange={(newLang) => {
                  setLang(newLang);
                  showToast(tr('تم تطبيق التغييرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
                }}
                buttonBg="var(--bg)"
                buttonBorder="1px solid var(--line)"
                buttonTextColor="var(--ink)"
              />
            </div>

            <div style={{ height: '1px', background: 'var(--line)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--soft)',
                    color: 'var(--brand-ink, #34D399)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Coins size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 2px' }}>
                    {tr('اختيار العملة', 'هەڵبژاردنی دراو', 'Display Currency')}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>
                    {tr('تُعرض بها أسعار الأطباق والفواتير في المنيو ولوحة التحكم.', 'نرخی خواردن و وەسڵەکان لە مینیۆ و پانێڵدا بەم دراوە پیشان دەدرێن.', 'Used to display item prices and receipts across your menu and dashboard.')}
                  </p>
                </div>
              </div>

              <select
                value={restCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                style={{
                  ...themedInputStyle,
                  width: 'auto',
                  minWidth: '210px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <option value="د.ع">{tr('د.ع — دينار عراقي (IQD)', 'د.ع — دیناری عێراقی (IQD)', 'IQD (د.ع) — Iraqi Dinar')}</option>
                <option value="$">{tr('$ — دولار أمريكي (USD)', '$ — دۆلاری ئەمریکی (USD)', '$ — US Dollar (USD)')}</option>
                <option value="ر.س">{tr('ر.س — ريال سعودي (SAR)', 'ر.س — ڕیاڵی سعودی (SAR)', 'SAR — Saudi Riyal')}</option>
                <option value="د.إ">{tr('د.إ — درهم إماراتي (AED)', 'د.إ — درهەمی ئیماراتی (AED)', 'AED — UAE Dirham')}</option>
                <option value="د.ك">{tr('د.ك — دينار كويتي (KWD)', 'د.ك — دیناری کوەیتی (KWD)', 'KWD — Kuwaiti Dinar')}</option>
                <option value="د.أ">{tr('د.أ — دينار أردني (JOD)', 'د.أ — دیناری ئوردنی (JOD)', 'JOD — Jordanian Dinar')}</option>
                <option value="ر.ق">{tr('ر.ق — ريال قطري (QAR)', 'ر.ق — ڕیاڵی قەتەری (QAR)', 'QAR — Qatari Riyal')}</option>
                <option value="د.ب">{tr('د.ب — دينار بحريني (BHD)', 'د.ب — دیناری بەحرەینی (BHD)', 'BHD — Bahraini Dinar')}</option>
                <option value="ر.ع">{tr('ر.ع — ريال عماني (OMR)', 'ر.ع — ڕیاڵی عومانی (OMR)', 'OMR — Omani Rial')}</option>
                <option value="ج.م">{tr('ج.م — جنيه مصري (EGP)', 'ج.م — پاوەندی میسری (EGP)', 'EGP — Egyptian Pound')}</option>
                <option value="ل.ل">{tr('ل.ل — ليرة لبنانية (LBP)', 'ل.ل — لیرەی لوبنانی (LBP)', 'LBP — Lebanese Pound')}</option>
                <option value="€">{tr('€ — يورو (EUR)', '€ — یۆرۆ (EUR)', '€ — Euro (EUR)')}</option>
              </select>
            </div>

            <div style={{ height: '1px', background: 'var(--line)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--soft)',
                    color: 'var(--brand-ink, #34D399)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {menuThemeMode === 'light' ? (
                    <Sun size={20} />
                  ) : menuThemeMode === 'auto' ? (
                    <Monitor size={20} />
                  ) : (
                    <Moon size={20} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 2px' }}>
                    {tr('مظهر المنيو', 'ڕووکاری مینیۆ', 'Menu Theme Mode')}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>
                    {tr('فاتح أو غامق أو حسب جهاز الزبون', 'ڕووناک، تاریک یان بەپێی ئامێری کڕیار', 'Light, dark, or match customer device')}
                  </p>
                </div>
              </div>

              <div className="mp-theme-icon-switch" role="group" aria-label={tr('مظهر المنيو', 'ڕووکاری مینیۆ', 'Menu Theme Mode')}>
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('light')}
                  className={`mp-theme-icon-btn${menuThemeMode === 'light' ? ' is-active' : ''}`}
                  aria-label={tr('الوضع الفاتح', 'دۆخی ڕووناک', 'Light mode')}
                  title={tr('فاتح', 'ڕووناک', 'Light')}
                >
                  <Sun size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('dark')}
                  className={`mp-theme-icon-btn${menuThemeMode === 'dark' ? ' is-active' : ''}`}
                  aria-label={tr('الوضع الغامق', 'دۆخی تاریک', 'Dark mode')}
                  title={tr('غامق', 'تاریک', 'Dark')}
                >
                  <Moon size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('auto')}
                  className={`mp-theme-icon-btn${menuThemeMode === 'auto' ? ' is-active' : ''}`}
                  aria-label={tr('حسب جهاز الزبون تلقائياً', 'بەپێی ئامێری کڕیار خۆکارانە', 'Automatic based on device')}
                  title={tr('حسب جهاز الزبون', 'بەپێی ئامێری کڕیار', 'System')}
                >
                  <Monitor size={17} />
                </button>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--line)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--soft)',
                    color: 'var(--brand-ink, #34D399)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {dashboardThemeMode === 'light' ? (
                    <Sun size={20} />
                  ) : dashboardThemeMode === 'auto' ? (
                    <Monitor size={20} />
                  ) : (
                    <Moon size={20} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 2px' }}>
                    {tr('مظهر لوحة التحكم', 'ڕووکاری کۆنتڕۆڵ پانێڵ', 'Dashboard Theme Mode')}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>
                    {tr('فاتح أو داكن أو حسب جهازك', 'ڕووناک، تاریک یان بەپێی ئامێرەکەت', 'Light, dark, or match your device')}
                  </p>
                </div>
              </div>

              <div className="mp-theme-icon-switch" role="group" aria-label={tr('مظهر لوحة التحكم', 'ڕووکاری کۆنتڕۆڵ پانێڵ', 'Dashboard Theme Mode')}>
                <button
                  type="button"
                  onClick={() => void handleSelectDashboardThemeMode('light')}
                  className={`mp-theme-icon-btn${dashboardThemeMode === 'light' ? ' is-active' : ''}`}
                  aria-label={tr('الوضع الفاتح', 'دۆخی ڕووناک', 'Light mode')}
                  title={tr('فاتح', 'ڕووناک', 'Light')}
                >
                  <Sun size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleSelectDashboardThemeMode('dark')}
                  className={`mp-theme-icon-btn${dashboardThemeMode === 'dark' ? ' is-active' : ''}`}
                  aria-label={tr('الوضع الداكن', 'دۆخی تاریک', 'Dark mode')}
                  title={tr('داكن', 'تاریک', 'Dark')}
                >
                  <Moon size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleSelectDashboardThemeMode('auto')}
                  className={`mp-theme-icon-btn${dashboardThemeMode === 'auto' ? ' is-active' : ''}`}
                  aria-label={tr('حسب جهازك تلقائياً', 'بەپێی ئامێرەکەت خۆکارانە', 'Automatic based on device')}
                  title={tr('حسب جهازك', 'بەپێی ئامێرەکەت', 'System')}
                >
                  <Monitor size={17} />
                </button>
              </div>
            </div>
            <div className="mp-section-divider" />

            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: 900, color: 'var(--ink)', margin: '0 0 10px' }}>
                {tr('التحكم بحالة المنيو وطرق الطلب', 'کۆنترۆڵی دۆخی مینیۆ و شێوازەکانی داواکاری', 'Menu Visibility & Order Channels')}
              </h3>

              <div style={{ borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 2px', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <b style={{ fontSize: '14px', color: 'var(--ink)', display: 'block' }}>{tr('حالة المنيو للزبائن', 'دۆخی مینیۆ بۆ کڕیاران', 'Public Menu Status')}</b>
                    <span style={{ fontSize: '12px', color: restActive ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {restActive
                        ? tr('مفعّل — يظهر المنيو ويستقبل الزبائن', 'چالاکە — مینیۆ پیشان دەدرێت و کڕیار وەردەگرێت', 'Active — Menu is visible and accepting customers')
                        : tr('متوقف مؤقتاً — يظهر تنبيه إيقاف مؤقت للزوار', 'بە شێوەی کاتی ڕاگیراوە — ئاگادارکردنەوە پیشان دەدرێت', 'Paused — Visitors see a temporary pause notice')}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={restActive}
                    onClick={() => setRestActive((v) => !v)}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '999px',
                      border: 0,
                      padding: '3px',
                      cursor: 'pointer',
                      background: restActive ? '#10b981' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: restActive ? 'flex-start' : 'flex-end',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', cursor: resolvedPlan.perms.deliveryOrders ? 'pointer' : 'not-allowed', opacity: resolvedPlan.perms.deliveryOrders ? 1 : 0.6, fontWeight: 700, fontSize: '13px' }}>
                    <span>🚚 {tr('طلبات التوصيل', 'داواکاری گەیاندن', 'Delivery Orders')} {!resolvedPlan.perms.deliveryOrders && '🔒'}</span>
                    <input
                      type="checkbox"
                      disabled={!resolvedPlan.perms.deliveryOrders}
                      checked={resolvedPlan.perms.deliveryOrders && allowDelivery}
                      onChange={(e) => setAllowDelivery(e.target.checked)}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', cursor: resolvedPlan.perms.pickupOrders ? 'pointer' : 'not-allowed', opacity: resolvedPlan.perms.pickupOrders ? 1 : 0.6, fontWeight: 700, fontSize: '13px' }}>
                    <span>🏪 {tr('الحجز / الاستلام', 'حیجزکردن / وەرگرتن لە لق', 'Pickup / Takeaway')} {!resolvedPlan.perms.pickupOrders && '🔒'}</span>
                    <input
                      type="checkbox"
                      disabled={!resolvedPlan.perms.pickupOrders}
                      checked={resolvedPlan.perms.pickupOrders && allowPickup}
                      onChange={(e) => setAllowPickup(e.target.checked)}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', cursor: resolvedPlan.perms.tableOrders ? 'pointer' : 'not-allowed', opacity: resolvedPlan.perms.tableOrders ? 1 : 0.6, fontWeight: 700, fontSize: '13px' }}>
                    <span>
                      🍽️ {tr('طلبات الطاولات', 'داواکاری مێزەکان', 'Dine-In / Table Orders')}
                      {!resolvedPlan.perms.tableOrders && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                          🔒 {tr('متاح في الباقة الاحترافية فأعلى', 'لە پاکێجی پڕۆفیشناڵ و سەرووتر بەردەستە', 'Available on Pro plan & above')}
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      disabled={!resolvedPlan.perms.tableOrders}
                      checked={resolvedPlan.perms.tableOrders && allowTable}
                      onChange={(e) => setAllowTable(e.target.checked)}
                    />
                  </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 2px 4px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                  <span>🌙 {tr('استقبال الطلبات المسبقة حتى عند إغلاق المطعم خارج ساعات الدوام', 'وەرگرتنی داواکاری پێشوەختە تەنانەت لە دەرەوەی کاتی کارکردن', 'Accept pre-orders even when closed outside business hours')}</span>
                  <input
                    type="checkbox"
                    checked={acceptClosedOrders}
                    onChange={(e) => setAcceptClosedOrders(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="mp-section-divider" />

            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: 900, color: 'var(--ink)', margin: '0 0 4px' }}>
                {tr('قناة إرسال واستقبال الطلبات (تيليجرام / واتساب)', 'کەناڵی ناردن و وەرگرتنی داواکاری (تێلیگرام / واتسئاپ)', 'Order Delivery Channel (Telegram / WhatsApp)')}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
                {tr(
                  'اختر كيف تصل طلبات الزبائن من المنيو: عبر التليجرام والواتساب معاً، أو عبر التليجرام فقط دون فتح واتساب، أو عبر الواتساب فقط.',
                  'شێوازی گەیشتنی داواکارییەکانی کڕیار هەڵبژێرە: تێلیگرام و واتسئاپ پێکەوە، تەنها تێلیگرام بێ کردنەوەی واتسئاپ، یان تەنها واتسئاپ.',
                  'Choose how customer orders arrive: Telegram & WhatsApp together, Telegram only (no WhatsApp redirect), or WhatsApp only.'
                )}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {[
                  {
                    id: 'both' as const,
                    title: tr('تفعيل الاثنين معاً', 'چالاککردنی هەردووکی پێکەوە', 'Both Channels Active'),
                    desc: tr(
                      'إشعار فوري على تيليجرام + تحويل الزبون لتأكيد الطلب عبر واتساب',
                      'ئاگادارکردنەوەی خێرا لە تێلیگرام + گواستنەوەی کڕیار بۆ واتسئاپ بۆ دڵنیاکردنەوە',
                      'Instant Telegram alert + redirect customer to confirm via WhatsApp'
                    ),
                    accent: '#10b981',
                    Icon: CheckCircle2,
                  },
                  {
                    id: 'telegram' as const,
                    title: tr('عبر التليجرام فقط', 'تەنها لە ڕێگەی تێلیگرامەوە', 'Telegram Only'),
                    desc: tr(
                      'إرسال الطلب مباشرة للوحة التحكم وبوت تيليجرام بدون تحويل لواتساب',
                      'ناردنی داواکاری ڕاستەوخۆ بۆ پانێڵ و بۆتی تێلیگرام بێ گواستنەوە بۆ واتسئاپ',
                      'Send orders straight to dashboard & Telegram bot without opening WhatsApp'
                    ),
                    accent: '#0088cc',
                    Icon: Send,
                  },
                  {
                    id: 'whatsapp' as const,
                    title: tr('عبر الواتساب فقط', 'تەنها لە ڕێگەی واتسئاپەوە', 'WhatsApp Only'),
                    desc: tr(
                      'إرسال الطلب عبر محادثة واتساب فقط مع إيقاف إشعارات تيليجرام',
                      'ناردنی داواکاری تەنها لە ڕێگەی واتسئاپەوە لەگەڵ ڕاگرتنی ئاگادارکردنەوەی تێلیگرام',
                      'Send orders via WhatsApp chat only with Telegram notifications off'
                    ),
                    accent: '#16a34a',
                    Icon: MessageCircle,
                  },
                ].map((opt) => {
                  const selected = orderChannel === opt.id;
                  const OptIcon = opt.Icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrderChannel(opt.id)}
                      style={{
                        textAlign: 'start',
                        borderRadius: '14px',
                        padding: '13px 14px',
                        cursor: 'pointer',
                        border: selected
                          ? `2px solid ${opt.accent}`
                          : '1px solid var(--line)',
                        background: selected
                          ? `color-mix(in srgb, ${opt.accent} 10%, var(--surface))`
                          : 'var(--bg)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: selected ? opt.accent : 'var(--soft)',
                          color: selected ? '#ffffff' : 'var(--muted)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <OptIcon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)', marginBottom: '3px' }}>
                          {opt.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {orderChannel !== 'whatsapp' && !rest.telegramChatId && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink)', fontWeight: 700 }}>
                    <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span>{tr('لم يتم ربط حساب التليجرام لهذا المتجر بعد — يجب مشاركة رقمك مع البوت لتصل الطلبات.', 'هێشتا هەژماری تێلیگرام بەم فرۆشگایەوە نەبەستراوەتەوە — پێویستە ژمارەکەت لەگەڵ بۆتەکە هاوبەش بکەیت.', 'Telegram is not linked for this store yet — link your number with the bot to receive orders.')}</span>
                  </div>
                  <button
                    type="button"
                    className="btn s"
                    onClick={() => setActiveTab('telegram')}
                    style={{ fontWeight: 800, fontSize: '12px' }}
                  >
                    <Send size={13} />
                    <span>{tr('الذهاب إلى إعداد التليجرام', 'بڕۆ بۆ ڕێکخستنی تێلیگرام', 'Go to Telegram Setup')}</span>
                  </button>
                </div>
              )}

              {orderChannel !== 'telegram' && !restWa.trim() && !restPhone.trim() && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: '#ef4444',
                    fontWeight: 700,
                  }}
                >
                  <span>{tr('يرجى إدخال رقم الواتساب في القسم الرابع أدناه لاستقبال طلبات الواتساب.', 'تکایە ژمارەی واتسئاپ لە بەشی چوارەمدا بنووسە بۆ وەرگرتنی داواکارییەکان.', 'Please enter your WhatsApp number in Section 4 below to receive WhatsApp orders.')}</span>
                  <button
                    type="button"
                    className="btn s"
                    onClick={() => jumpTo('sec-identity')}
                    style={{ fontSize: '12px' }}
                  >
                    {tr('إدخال الرقم الآن', 'ئێستا ژمارە بنووسە', 'Enter Number Now')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* SECTION 2: رابط المنيو المخصص باسم حسابك */}
        <motion.section
          id="sec-slug"
          className="mp-set-sec"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.06 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mp-set-sec-head">
            <h2 className="mp-set-sec-title">
              <span className="mp-set-sec-num">2</span>
              <span>
                {subdomainEnabled
                  ? tr('الرابط المخصص والدومين الفرعي باسم مشروعك', 'لینکی تایبەت و سەب-دۆمەین بە ناوی پرۆژەکەت', 'Custom Link & Subdomain')
                  : tr('رابط المنيو المخصص باسم حسابك', 'لینکی مینیۆی تایبەت بە ناوی هەژمارەکەت', 'Custom Menu Link')}
              </span>
            </h2>
          </div>

          <div className="mp-set-card" style={{ gap: '12px' }}>
            {!resolvedPlan.perms.customSlug ? (
              <>
                <div
                  style={{
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {tr('رابط منيو مشروعك الحالي (كود تلقائي من 6 خانات):', 'لینکی مینیۆی ئێستای پرۆژەکەت (کۆدی خۆکاری ٦ خانەیی):', 'Current menu link (auto 6-character code):')}
                    </div>
                    <b dir="ltr" style={{ fontSize: '13.5px', color: 'var(--brand-ink, #34D399)', wordBreak: 'break-all' }}>
                      {liveMenuUrl}
                    </b>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn s" onClick={openShareModal}>
                      <Share2 size={13} />
                      <span>{tr('مشاركة المنيو', 'هاوبەشکردنی مینیۆ', 'Share Menu')}</span>
                    </button>
                    <button type="button" className="btn s" onClick={() => copyLink(liveMenuUrl)}>
                      <Copy size={13} />
                      <span>{tr('نسخ الرابط', 'کۆپیکردنی لینک', 'Copy Link')}</span>
                    </button>
                    <button type="button" className="btn s" onClick={() => onNavigate(publicPath)}>
                      <ExternalLink size={13} />
                      <span>{tr('معاينة المنيو', 'بینینی مینیۆ', 'Preview Menu')}</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: 0,
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                    <Lock size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <b style={{ fontSize: '13.5px', color: 'var(--ink)', display: 'block' }}>
                        {tr('اختيار اسم حساب مخصص للرابط', 'هەڵبژاردنی ناوی تایبەت بۆ لینک', 'Custom handle link')} (<span dir="ltr">{baseDomain}/user</span>) {tr('متاح للباقات المدفوعة فقط', 'تەنها بۆ پاکێجە پارەدارەکان بەردەستە', 'is available on paid plans only')}
                      </b>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {tr('قم بتفعيل أو ترقية باقتك إلى', 'پاکێجەکەت بەرز بکەرەوە بۆ', 'Upgrade your plan to')}{' '}
                        <b>{getLocalizedPlanName('starter', lang)}</b>{' '}
                        {tr('أو أعلى لتخصيص رابط مباشر باسم مشروعك.', 'یان سەرووتر بۆ دانانی لینکی ڕاستەوخۆ بە ناوی پرۆژەکەت.', 'or higher to claim a custom link for your brand.')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUpgradeModal('starter')}
                    className="btn p s"
                    style={{ fontWeight: 800 }}
                  >
                    {tr('ترقية الباقة الآن', 'ئێستا پاکێج بەرز بکەرەوە', 'Upgrade Now')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {tr(
                    'اختر اسم حساب إنجليزياً فريداً غير مكرر لمشروعك ليُحفظ ويُفعّل فوراً',
                    'ناوێکی ئینگلیزی بێوێنە بۆ پرۆژەکەت هەڵبژێرە تا دەستبەجێ چالاک ببێت',
                    'Pick a unique English slug for your business to activate immediately'
                  )}{' '}
                  (<code dir="ltr">{baseDomain}/user</code>):
                </p>

                <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', flexWrap: 'wrap' }}>
                  <div
                    dir="ltr"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: '1 1 240px',
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      backdropFilter: 'blur(12px) saturate(1.2)',
                      WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
                      border: '1.5px solid rgba(52, 211, 153, 0.34)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    {!subdomainEnabled && (
                      <span
                        style={{
                          padding: '0 12px',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          color: 'var(--brand-ink, #34D399)',
                          borderInlineEnd: '1px solid var(--line)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        https://{baseDomain}/
                      </span>
                    )}
                    <input
                      type="text"
                      dir="ltr"
                      value={restSlug}
                      onChange={(e) => setRestSlug(sanitizeSlug(e.target.value))}
                      placeholder="your-restaurant"
                      style={{
                        border: 0,
                        background: 'transparent',
                        outline: 'none',
                        padding: '10px 12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        flex: 1,
                        minHeight: '42px',
                      }}
                    />
                    {subdomainEnabled && (
                      <span
                        style={{
                          padding: '0 12px',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          color: 'var(--brand-ink, #34D399)',
                          borderInlineStart: '1px solid var(--line)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        .{baseDomain}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn s"
                    disabled={slugCheckState.checking || !restSlug}
                    onClick={() => void checkSubdomainAvailability(restSlug)}
                    style={{ fontWeight: 800, minHeight: '44px' }}
                  >
                    <ShieldCheck size={15} />
                    <span>{slugCheckState.checking ? tr('جاري الفحص...', 'دەپشکنرێت...', 'Checking...') : tr('فحص التوفر', 'پشکنینی بەردەستبوون', 'Check Availability')}</span>
                  </button>
                </div>

                {slugCheckState.message && (
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: slugCheckState.available ? '#10b981' : '#ef4444',
                    }}
                  >
                    {slugCheckState.message}
                  </div>
                )}

                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {tr('الرابط المباشر الحالي:', 'لینکی ڕاستەوخۆی ئێستا:', 'Current Direct Link:')}
                    </div>
                    <b dir="ltr" style={{ fontSize: '13px', color: 'var(--brand-ink, #34D399)', wordBreak: 'break-all' }}>
                      {restSlug ? `https://${previewSubdomainHost}` : liveMenuUrl}
                    </b>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn s" onClick={openShareModal}>
                      <Share2 size={13} />
                      <span>{tr('مشاركة المنيو', 'هاوبەشکردنی مینیۆ', 'Share Menu')}</span>
                    </button>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => copyLink(restSlug ? `https://${previewSubdomainHost}` : liveMenuUrl)}
                    >
                      <Copy size={13} />
                      <span>{tr('نسخ', 'کۆپی', 'Copy')}</span>
                    </button>
                    {fullSubdomainUrl ? (
                      <a
                        href={fullSubdomainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn s"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} />
                        <span>{tr('فتح الدومين', 'کردنەوەی دۆمەین', 'Open Domain')}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn s"
                        onClick={() => onNavigate(publicPath)}
                      >
                        <ExternalLink size={13} />
                        <span>{tr('معاينة المنيو', 'بینینی مینیۆ', 'Preview Menu')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.section>

        {/* SECTION 3: شعار المنيو وصورة الغلاف */}
        <motion.section
          id="sec-media"
          className="mp-set-sec"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.06 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mp-set-sec-head">
            <h2 className="mp-set-sec-title">
              <span className="mp-set-sec-num">3</span>
              <span>{tr('شعار المشروع وصورة البانر (الغلاف)', 'لۆگۆی پرۆژە و وێنەی بەرگ (بانەر)', 'Logo & Cover Banner')}</span>
            </h2>
            <button
              type="button"
              className="btn p s"
              onClick={handleSaveSettings}
              style={{ fontWeight: 800 }}
            >
              <Save size={14} />
              <span>{tr('حفظ الصور', 'پاشەکەوتکردنی وێنەکان', 'Save Media')}</span>
            </button>
          </div>

          <div className="mp-set-card">
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>
              {tr('تظهر صورة الشعار والغلاف مباشرة أعلى المنيو الإلكتروني أمام الزبائن.', 'وێنەی لۆگۆ و بەرگ ڕاستەوخۆ لە سەرەوەی مینیۆکە بۆ کڕیاران پیشان دەدرێن.', 'Your logo and cover banner appear at the top of your public menu.')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {/* Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)' }}>{tr('شعار المشروع (Logo)', 'لۆگۆی پرۆژە (Logo)', 'Business Logo')}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>{tr('مربع 1:1', 'چوارگۆشە ١:١', '1:1 Square')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '78px',
                      height: '78px',
                      borderRadius: '50%',
                      border: '2px solid var(--line)',
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      overflow: 'hidden',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {logoUrlInput ? (
                      <img src={logoUrlInput} alt={tr('شعار المنيو', 'لۆگۆی مینیۆ', 'Menu logo')} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={24} style={{ color: 'var(--muted)' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '10px',
                        background: 'var(--brand)',
                        color: 'var(--on-brand)',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        width: 'fit-content',
                      }}
                    >
                      <Upload size={14} />
                      <span>{tr('رفع من الجهاز', 'بارکردن لە ئامێرەوە', 'Upload from Device')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          void handleDeviceImageUpload(
                            e,
                            setLogoUrlInput,
                            tr(
                              'تم اختيار الشعار — اضغط حفظ لتثبيته في المنيو',
                              'لۆگۆ هەڵبژێردرا — پاشەکەوت داگرە بۆ جێگیرکردنی لە مینیۆدا',
                              'Logo selected — click Save to apply it to your menu'
                            ),
                            'logo'
                          )
                        }
                      />
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setShowLogoUrlField((v) => !v)}
                        style={{
                          background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Link2 size={12} />
                        <span>{showLogoUrlField ? tr('إخفاء الرابط', 'شاردنەوەی لینک', 'Hide URL') : tr('إدخال رابط', 'دانانی لینک', 'Enter URL')}</span>
                      </button>
                      {logoUrlInput && (
                        <button
                          type="button"
                          onClick={() => setLogoUrlInput('')}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tr('إزالة', 'لابردن', 'Remove')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {showLogoUrlField && (
                  <input
                    type="text"
                    dir="ltr"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    style={{ ...themedInputStyle, textAlign: 'left', fontSize: '12.5px' }}
                  />
                )}
              </div>

              {/* Banner */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)' }}>{tr('صورة الغلاف (Banner)', 'وێنەی بەرگ (Banner)', 'Cover Banner')}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>{tr('عريض 16:9', 'پان ١٦:٩', '16:9 Wide')}</span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '94px',
                    borderRadius: '12px',
                    border: 0,
                    background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {coverUrlInput ? (
                    <img src={coverUrlInput} alt={tr('بانر المنيو', 'بانەری مینیۆ', 'Menu banner')} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--muted)' }}>
                      <ImageIcon size={22} />
                      <span style={{ fontSize: '11.5px' }}>{tr('لم يتم اختيار صورة غلاف', 'وێنەی بەرگ هەڵنەبژێردراوە', 'No cover banner selected')}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: 'var(--brand)',
                      color: 'var(--on-brand)',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={14} />
                    <span>{tr('رفع من الجهاز', 'بارکردن لە ئامێرەوە', 'Upload from Device')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        void handleDeviceImageUpload(
                          e,
                          setCoverUrlInput,
                          tr(
                            'تم اختيار صورة الغلاف — اضغط حفظ لتثبيتها في المنيو',
                            'وێنەی بەرگ هەڵبژێردرا — پاشەکەوت داگرە بۆ جێگیرکردنی لە مینیۆدا',
                            'Cover banner selected — click Save to apply it to your menu'
                          ),
                          'banner'
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBannerUrlField((v) => !v)}
                    style={{
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Link2 size={12} />
                    <span>{showBannerUrlField ? tr('إخفاء الرابط', 'شاردنەوەی لینک', 'Hide URL') : tr('إدخال رابط', 'دانانی لینک', 'Enter URL')}</span>
                  </button>
                  {coverUrlInput && (
                    <button
                      type="button"
                      onClick={() => setCoverUrlInput('')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {tr('إزالة', 'لابردن', 'Remove')}
                    </button>
                  )}
                </div>

                {showBannerUrlField && (
                  <input
                    type="text"
                    dir="ltr"
                    value={coverUrlInput}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    style={{ ...themedInputStyle, textAlign: 'left', fontSize: '12.5px' }}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 4: هوية المشروع، نبذة عن المشروع، والتواصل */}
        <motion.section
          id="sec-identity"
          className="mp-set-sec"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.06 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mp-set-sec-head">
            <h2 className="mp-set-sec-title">
              <span className="mp-set-sec-num">4</span>
              <span>{tr('هوية المشروع، النبذة، والتواصل', 'ناسنامەی پرۆژە، زانیاری و پەیوەندی', 'Business Identity, Bio & Contact')}</span>
            </h2>
          </div>

          <div className="mp-set-card" style={{ gap: '18px' }}>
          <div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, marginBottom: '8px', color: 'var(--ink)' }}>
                {tr('نوع النشاط التجاري (لتخصيص المصطلحات وسلة الطلبات)', 'جۆری کار (بۆ گونجاندنی ناونیشان و سەبەتەی داواکاری)', 'Business Type (adapts menu & cart terminology)')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div
                  onClick={() => setRestProjectType('restaurant')}
                  style={{
                    border: restProjectType === 'restaurant' ? '2px solid #10b981' : '1px solid var(--line)',
                    background: restProjectType === 'restaurant' ? 'rgba(16, 185, 129, 0.14)' : 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    backdropFilter: 'blur(14px) saturate(1.25)',
                    WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#059669',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UtensilsCrossed size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)' }}>{tr('مطعم أو مقهى', 'چێشتخانە یان کافێ', 'Restaurant or Café')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{tr('أطعمة، وجبات، وكافيه', 'خواردن، ژەمەکان و کافێ', 'Food, meals & beverages')}</div>
                  </div>
                  {restProjectType === 'restaurant' && <CheckCircle2 size={18} color="#10b981" />}
                </div>

                <div
                  onClick={() => setRestProjectType('store')}
                  style={{
                    border: restProjectType === 'store' ? '2px solid #10b981' : '1px solid var(--line)',
                    background: restProjectType === 'store' ? 'rgba(16, 185, 129, 0.14)' : 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    backdropFilter: 'blur(14px) saturate(1.25)',
                    WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#0ea5e9',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Store size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)' }}>{tr('متجر أو محل تجاري', 'فرۆشگا یان دووکان', 'Retail Store or Shop')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{tr('منتجات، مبيعات، ومتاجر', 'بەرهەم، فرۆشتن و فرۆشگا', 'Products, retail & catalogs')}</div>
                  </div>
                  {restProjectType === 'store' && <CheckCircle2 size={18} color="#10b981" />}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '12px' }}>
              <label className="f" style={{ marginBottom: 0 }}>
                {tr('اسم المشروع *', 'ناوی پرۆژە *', 'Business Name *')}
                <input
                  type="text"
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  style={themedInputStyle}
                  required
                />
              </label>

              <label className="f" style={{ marginBottom: 0 }}>
                {tr('الوصف المختصر أسفل الاسم (Tagline)', 'وەسفی کورت لە ژێر ناودا (Tagline)', 'Short Tagline Under Name')}
                <input
                  type="text"
                  value={restTagline}
                  onChange={(e) => setRestTagline(e.target.value)}
                  placeholder={tr('مثال: برجر سماش طازج • بطاطا مقرمشة • مشروبات باردة', 'نموونە: سماش بەرگری تازە • فرایزی تەق • خواردنەوەی سارد', 'e.g. Fresh smashed burgers • Crispy fries • Cold drinks')}
                  style={themedInputStyle}
                />
              </label>
            </div>

            <label className="f">
              {tr('نبذة عن المشروع (تظهر في نافذة "نبذة عنا" للزبائن)', 'دەربارەی پرۆژە (لە پەنجەرەی "دەربارەی ئێمە" پیشان دەدرێت)', 'About Your Business (shown in About modal)')}
              <textarea
                rows={2}
                value={aboutTextInput}
                onChange={(e) => setAboutTextInput(e.target.value)}
                placeholder={tr('اكتب قصة مشروعك، جودة المنتجات، وساعات الخدمة...', 'چیرۆکی پرۆژەکەت، کوالێتی بەرهەمەکان و کاتی خزمەتگوزاری بنووسە...', 'Describe your brand story, quality standards, and service...')}
                style={themedInputStyle}
              />
            </label>

            <label className="f" style={{ marginBottom: 0 }}>
              {tr('ملاحظة الضريبة أو الفاتورة أسفل المنيو', 'تێبینی باج یان وەسڵ لە خوارەوەی مینیۆ', 'Tax / Receipt Footer Note')}
              <input
                type="text"
                value={taxNoteInput}
                onChange={(e) => setTaxNoteInput(e.target.value)}
                placeholder={tr('مثال: جميع الأسعار شاملة الضريبة', 'نموونە: هەموو نرخەکان باجیان لەسەرە', 'e.g. All prices include VAT')}
                style={themedInputStyle}
              />
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--line)' }} />

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--ink)', margin: '0 0 12px' }}>
              {tr('التواصل والواتساب والسوشيال ميديا 📱', 'پەیوەندی، واتسئاپ و سۆشیال میدیا 📱', 'Contact, WhatsApp & Social Media 📱')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <label className="f">
                {tr('رقم هاتف الاتصال', 'ژمارەی مۆبایل بۆ پەیوەندی', 'Phone Number')}
                <input
                  type="tel"
                  dir="ltr"
                  value={restPhone}
                  onChange={(e) => setRestPhone(e.target.value)}
                  placeholder="07701234567"
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>

              <label className="f">
                {tr('رقم الواتساب لاستقبال الطلبات', 'ژمارەی واتسئاپ بۆ وەرگرتنی داواکاری', 'WhatsApp Number for Orders')}{' '}
                {orderChannel === 'telegram' ? tr('(اختياري عند اختيار تيليجرام فقط)', '(ئارەزوومەندانەیە کاتێک تەنها تێلیگرام هەڵبژێردراوە)', '(optional for Telegram-only)') : '*'}
                <input
                  type="tel"
                  dir="ltr"
                  value={restWa}
                  onChange={(e) => setRestWa(e.target.value)}
                  placeholder="07711448594"
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                  required={orderChannel !== 'telegram'}
                />
              </label>
            </div>

            <label className="f">
              {tr('عنوان ومقر المشروع بالتفصيل', 'ناونیشانی وردی شوێنی پرۆژە', 'Full Business Address')}
              <input
                type="text"
                value={restAddress}
                onChange={(e) => setRestAddress(e.target.value)}
                placeholder={tr('بغداد، الكرادة...', 'بەغدا، کەڕادە...', 'Baghdad, Karrada...')}
                style={themedInputStyle}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <label className="f">
                {tr('رابط موقع المشروع على خرائط جوجل', 'لینکی شوێن لە Google Maps', 'Google Maps Location URL')}
                <input
                  type="text"
                  dir="ltr"
                  value={restMapUrl}
                  onChange={(e) => setRestMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>

              <label className="f">
                {tr('رابط تقييمات Google Maps (اختياري)', 'لینکی هەڵسەنگاندنی Google Maps (ئارەزوومەندانە)', 'Google Maps Reviews URL (optional)')}
                <input
                  type="text"
                  dir="ltr"
                  value={restGoogleReviewUrl}
                  onChange={(e) => setRestGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/..."
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <label className="f" style={{ marginBottom: 0 }}>
                {tr('حساب الانستقرام', 'هەژماری ئینستاگرام', 'Instagram URL')}
                <input
                  type="text"
                  dir="ltr"
                  value={restInstagram}
                  onChange={(e) => setRestInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>

              <label className="f" style={{ marginBottom: 0 }}>
                {tr('صفحة الفيسبوك', 'پەڕەی فەیسبووک', 'Facebook Page URL')}
                <input
                  type="text"
                  dir="ltr"
                  value={restFacebook}
                  onChange={(e) => setRestFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>

              <label className="f" style={{ marginBottom: 0 }}>
                {tr('حساب التيك توك', 'هەژماری تیکتۆک', 'TikTok Profile URL')}
                <input
                  type="text"
                  dir="ltr"
                  value={restTiktok}
                  onChange={(e) => setRestTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>
            </div>
          </div>
          </div>
        </motion.section>

        {/* SECTION 5: ساعات العمل ومناطق التوصيل */}
        <motion.section
          id="sec-delivery"
          className="mp-set-sec"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.06 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mp-set-sec-head">
            <h2 className="mp-set-sec-title">
              <span className="mp-set-sec-num">5</span>
              <span>{tr('ساعات العمل الأسبوعية وأسعار ومناطق التوصيل', 'کاتی کارکردنی هەفتانە و نرخ و ناوچەکانی گەیاندن', 'Weekly Working Hours & Delivery Zones')}</span>
            </h2>
          </div>

          <div className="mp-set-card">
            <div>
              <label className="f" style={{ marginBottom: '8px' }}>
                {tr('نظام أوقات وساعات فتح المتجر', 'سیستەمی کاتی کارکردنی فرۆشگا', 'Store Operating Hours Mode')}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={workMode === '24' ? 'btn p s' : 'btn s'}
                    onClick={() => setWorkMode('24')}
                  >
                    {tr('مفتوح 24 ساعة (طوال الأسبوع)', '٢٤ کاتژمێر کراوەیە (بە درێژایی هەفتە)', 'Open 24 Hours (All Week)')}
                  </button>
                  <button
                    type="button"
                    className={workMode === 'c' ? 'btn p s' : 'btn s'}
                    onClick={() => setWorkMode('c')}
                  >
                    {tr('جدول أيام أسبوعي مخصص (يبدأ بالأحد)', 'خشتەی هەفتانەی تایبەت (لە یەکشەممەوە)', 'Custom Weekly Schedule (Sun–Sat)')}
                  </button>
                </div>
              </label>

              {workMode === 'c' && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 0 0',
                    borderRadius: 0,
                    background: 'transparent',
                    border: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)' }}>{tr('التوقيت الموحد السريع:', 'کاتی یەکگرتووی خێرا:', 'Quick Unified Hours:')}</span>
                      <input
                        type="time"
                        value={workFrom}
                        onChange={(e) => setWorkFrom(e.target.value)}
                        style={{ ...themedInputStyle, width: 'auto', padding: '5px 8px', fontSize: '12.5px' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{tr('إلى', 'بۆ', 'to')}</span>
                      <input
                        type="time"
                        value={workTo}
                        onChange={(e) => setWorkTo(e.target.value)}
                        style={{ ...themedInputStyle, width: 'auto', padding: '5px 8px', fontSize: '12.5px' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => applyTimeToOpenDays(workFrom, workTo)}
                      style={{ fontSize: '12px', fontWeight: 800 }}
                    >
                      {tr('تطبيق على كل الأيام المفتوحة', 'جێبەجێکردن بۆ هەموو ڕۆژە کراوەکان', 'Apply to All Open Days')}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {weekDaysOrder.map(({ key, label }) => {
                      const dayCfg = weeklyHours[key] || { open: true, from: workFrom, to: workTo };
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '8px 2px',
                            borderRadius: 0,
                            background: 'transparent',
                            border: 0,
                            borderBottom: '1px solid var(--line)',
                            opacity: dayCfg.open ? 1 : 0.68,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={dayCfg.open}
                              aria-label={`${label} ${dayCfg.open ? tr('مفتوح', 'کراوە', 'Open') : tr('مغلق', 'داخراو', 'Closed')}`}
                              onClick={() =>
                                setWeeklyHours((prev) => ({
                                  ...prev,
                                  [key]: { ...dayCfg, open: !dayCfg.open },
                                }))
                              }
                              className={`ios-switch ${dayCfg.open ? 'on' : 'off'}`}
                            >
                              <span className="ios-switch-thumb" />
                            </button>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ink)' }}>{label}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: dayCfg.open ? '#10b981' : '#ef4444' }}>
                              {dayCfg.open ? tr('مفتوح', 'کراوە', 'Open') : tr('مغلق', 'داخراو', 'Closed')}
                            </span>
                          </div>

                          {dayCfg.open && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <input
                                type="time"
                                value={dayCfg.from || workFrom}
                                onChange={(e) =>
                                  setWeeklyHours((prev) => ({
                                    ...prev,
                                    [key]: { ...dayCfg, from: e.target.value },
                                  }))
                                }
                                style={{ ...themedInputStyle, width: 'auto', padding: '5px 8px', fontSize: '12.5px' }}
                              />
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>—</span>
                              <input
                                type="time"
                                value={dayCfg.to || workTo}
                                onChange={(e) =>
                                  setWeeklyHours((prev) => ({
                                    ...prev,
                                    [key]: { ...dayCfg, to: e.target.value },
                                  }))
                                }
                                style={{ ...themedInputStyle, width: 'auto', padding: '5px 8px', fontSize: '12.5px' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} style={{ color: 'var(--brand-ink, #34D399)' }} />
                  <b style={{ fontSize: '14px', color: 'var(--ink)' }}>{tr('أسعار التوصيل حسب المحافظة والمنطقة / القضاء', 'نرخی گەیاندن بەپێی پارێزگا و ناوچە / قەزا', 'Delivery Fees by Governorate, Area & District')}</b>
                </div>
                <button
                  type="button"
                  className="btn s"
                  onClick={() =>
                    setDeliveryZonesState((prev) => [...prev, { area: '', fee: 2000, cities: [] }])
                  }
                >
                  <Plus size={14} />
                  <span>{tr('إضافة محافظة / منطقة', 'زیادکردنی پارێزگا / ناوچە', 'Add Region / Area')}</span>
                </button>
              </div>

              {deliveryZonesState.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>
                  {tr(
                    'لم تُضف مناطق توصيل بعد. يمكنك إضافة منطقة بسعر مباشر، أو محافظة وتحتها عدة أقضية/مناطق بأسعار مختلفة لتظهر في سلة الزبون.',
                    'هێشتا ناوچەی گەیاندن زیاد نەکراوە. دەتوانیت ناوچەیەک بە نرخی ڕاستەوخۆ یان پارێزگایەک بە چەند گەڕەکێکی جیاواز زیاد بکەیت.',
                    'No delivery zones added yet. Add a region with a flat fee or nest sub-districts with custom delivery prices for checkout.'
                  )}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {deliveryZonesState.map((zone, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--line)',
                        borderRadius: 0,
                        padding: '12px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 1fr) 115px auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={zone.area}
                          onChange={(e) =>
                            setDeliveryZonesState((prev) =>
                              prev.map((z, i) => (i === idx ? { ...z, area: e.target.value } : z))
                            )
                          }
                          placeholder={tr('المحافظة أو المنطقة (مثال: بغداد / الكرادة)', 'پارێزگا یان ناوچە (نموونە: هەولێر / عەنکاوە)', 'City or area (e.g. Baghdad / Karrada)')}
                          style={themedInputStyle}
                        />
                        <input
                          type="number"
                          min={0}
                          value={zone.fee}
                          onChange={(e) =>
                            setDeliveryZonesState((prev) =>
                              prev.map((z, i) => (i === idx ? { ...z, fee: Number(e.target.value) || 0 } : z))
                            )
                          }
                          placeholder={`${tr('الأجرة', 'کرێ', 'Fee')} (${restCurrency})`}
                          style={themedInputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => setDeliveryZonesState((prev) => prev.filter((_, i) => i !== idx))}
                          title={tr('حذف المحافظة / المنطقة', 'سڕینەوەی ناوچە', 'Delete region')}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {zone.cities && zone.cities.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingInlineStart: '12px', borderInlineStart: '2px solid var(--line)' }}>
                          {zone.cities.map((city, cIdx) => (
                            <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 1fr) 100px auto', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={city.name}
                                onChange={(e) =>
                                  setDeliveryZonesState((prev) =>
                                    prev.map((z, i) =>
                                      i === idx
                                        ? {
                                            ...z,
                                            cities: z.cities.map((c, j) => (j === cIdx ? { ...c, name: e.target.value } : c)),
                                          }
                                        : z
                                    )
                                  )
                                }
                                placeholder={tr('اسم القضاء / الحي (مثال: المنصور)', 'ناوی قەزا / گەڕەک', 'District / neighborhood')}
                                style={{ ...themedInputStyle, padding: '7px 10px', fontSize: '12.5px' }}
                              />
                              <input
                                type="number"
                                min={0}
                                value={city.fee}
                                onChange={(e) =>
                                  setDeliveryZonesState((prev) =>
                                    prev.map((z, i) =>
                                      i === idx
                                        ? {
                                            ...z,
                                            cities: z.cities.map((c, j) => (j === cIdx ? { ...c, fee: Number(e.target.value) || 0 } : c)),
                                          }
                                        : z
                                    )
                                  )
                                }
                                placeholder={tr('الأجرة', 'کرێ', 'Fee')}
                                style={{ ...themedInputStyle, padding: '7px 10px', fontSize: '12.5px' }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setDeliveryZonesState((prev) =>
                                    prev.map((z, i) =>
                                      i === idx ? { ...z, cities: z.cities.filter((_, j) => j !== cIdx) } : z
                                    )
                                  )
                                }
                                title={tr('حذف الحي الفرعي', 'سڕینەوەی گەڕەک', 'Remove district')}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  color: '#ef4444',
                                  display: 'grid',
                                  placeItems: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setDeliveryZonesState((prev) =>
                              prev.map((z, i) =>
                                i === idx
                                  ? { ...z, cities: [...(z.cities || []), { name: '', fee: z.fee || 2000 }] }
                                  : z
                              )
                            )
                          }
                          style={{
                            background: 'var(--soft)',
                            color: 'var(--brand-ink, #34D399)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          + {tr('إضافة قضاء / حي فرعي لهذه المنطقة', 'زیادکردنی قەزا / گەڕەکی لاوەکی بۆ ئەم ناوچەیە', 'Add Sub-District / Neighborhood')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-end' : 'flex-end' }}>
          <button type="submit" className="btn p" style={{ fontWeight: 800, padding: '13px 28px', fontSize: '15px' }}>
            <Save size={17} />
            <span>{tr('حفظ جميع الإعدادات', 'پاشەکەوتکردنی هەموو ڕێکخستنەکان', 'Save All Settings')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
