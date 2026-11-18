/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  GitBranch,
  Home,
  Palette,
  QrCode,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Tags,
  UtensilsCrossed,
} from 'lucide-react';
import {
  AvailabilitySchedule,
  Category,
  DaySchedule,
  MediaLibraryItem,
  MenuItem,
  MenuLayout,
  MenuThemeShape,
  Order,
  OrderStatus,
  PricingPlan,
  Restaurant,
  RestaurantAddons,
  Session,
  SiteSettings,
  WorkDayKey,
} from '../../types';
import {
  applyTheme,
  buildThemeForMode,
  compressImage,
  copyTextReliable,
  deleteItem,
  getCollection,
  getItem,
  getSite,
  getTheme,
  isSlugAvailable,
  putItem,
  putItemAndSync,
  resolveEffectiveThemeMode,
  syncFromServer,
  uid,
  waLink,
} from '../../utils/storage';
import {
  getIntlLocale,
  trByLang,
  translateServerError,
  useTranslation,
} from '../../utils/i18n';
import { getDashboardTabPath } from '../../utils/router';
import { AjaxDialogState, INITIAL_AJAX_DIALOG } from '../../components/AjaxConfirmModal';
import {
  ADDON_CATALOG,
  AddonCategoryFilter,
  AddonKey,
  AddonMetaItem,
  buildDefaultAddons,
  getLocalizedAddonCatalog,
} from '../../data/addonsCatalog';
import {
  MENU_SHAPES,
  getAddonRequiredPlanLabel,
  getAllowedLayoutsCount,
  getAllowedThemesForPlan,
  getLocalizedPlanName,
  getLocalizedThemeInfo,
  getMenuThemeById,
  getSeasonalPairedShape,
  getSeasonalPairedTheme,
  isAddonAllowedForPlan,
  resolveRestaurantPlan,
} from '../../utils/plans';
import {
  DEFAULT_MEDIA_ASSETS,
  ensureRestaurantDefaults,
  generateRandomMenuCode,
  getFullSubdomainUrl,
  getPublicMenuUrlPath,
  getSubdomainBaseDomain,
  getSupportWhatsapp,
  isReservedSlug,
  sanitizeSlug,
} from '../../utils/businessDefaults';
import { getBusinessTerms } from '../../utils/terminology';
import {
  DEFAULT_AVAILABILITY_SCHEDULE,
  normalizeAvailabilitySchedule,
  sanitizeAvailabilityScheduleForSave,
} from '../../utils/availability';
import type { SupportedLanguage } from '../../types';

export interface DashboardViewProps {
  session: Session;
  plans: PricingPlan[];
  site?: SiteSettings;
  initialSubTab?: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export type DashboardTab =
  | 'home'
  | 'cats'
  | 'menu'
  | 'orders'
  | 'stats'
  | 'appearance'
  | 'branches'
  | 'addons'
  | 'qr'
  | 'telegram'
  | 'set';

export type ItemEditorTab = 'info' | 'extras' | 'choices' | 'availability' | 'extraInfo' | 'badges';

export const LAYOUT_DEFINITIONS: Array<{
  id: MenuLayout;
  title: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'grid4',
    title: 'شبكة من 4 مربعات',
    desc: 'عرض المنتجات 4 بطاقات متساوية في كل صف بصور مستطيلة أفقية',
    icon: '⊞',
  },
  {
    id: 'grid3',
    title: 'شبكة من 3 مربعات',
    desc: 'عرض المنتجات 3 بطاقات متساوية في كل صف بصور مستطيلة أفقية',
    icon: '▦',
  },
  {
    id: 'grid',
    title: 'شبكة من مربعين (2×2)',
    desc: 'عرض المنتجات بطاقتين متساويتين في كل صف بصور مستطيلة أفقية',
    icon: '🍱',
  },
  {
    id: 'list',
    title: 'قائمة كلاسيكية أفقية',
    desc: 'بطاقات أفقية متناسقة بصورة مستطيلة جانبية والاسم والسعر وزر الإضافة',
    icon: '📑',
  },
];

export function getLocalizedLayoutDefinitions(lang: SupportedLanguage) {
  return [
    {
      id: 'grid4' as MenuLayout,
      title: trByLang(lang, 'شبكة من 4 مربعات', 'تۆڕی ٤ خانەیی', '4-Column Grid'),
      desc: trByLang(
        lang,
        'عرض المنتجات 4 بطاقات متساوية في كل صف بصور مستطيلة أفقية',
        'پیشاندانی بەرهەمەکان بە ٤ کارتی یەکسان لە هەر ڕیزێکدا لەگەڵ وێنەی ئاسۆیی',
        'Display 4 equal product cards per row with landscape thumbnails'
      ),
      icon: '⊞',
    },
    {
      id: 'grid3' as MenuLayout,
      title: trByLang(lang, 'شبكة من 3 مربعات', 'تۆڕی ٣ خانەیی', '3-Column Grid'),
      desc: trByLang(
        lang,
        'عرض المنتجات 3 بطاقات متساوية في كل صف بصور مستطيلة أفقية',
        'پیشاندانی بەرهەمەکان بە ٣ کارتی یەکسان لە هەر ڕیزێکدا لەگەڵ وێنەی ئاسۆیی',
        'Display 3 equal product cards per row with landscape thumbnails'
      ),
      icon: '▦',
    },
    {
      id: 'grid' as MenuLayout,
      title: trByLang(lang, 'شبكة من مربعين (2×2)', 'تۆڕی ٢ خانەیی (٢×٢)', '2-Column Grid (2×2)'),
      desc: trByLang(
        lang,
        'عرض المنتجات بطاقتين متساويتين في كل صف بصور مستطيلة أفقية',
        'پیشاندانی بەرهەمەکان بە ٢ کارتی یەکسان لە هەر ڕیزێکدا لەگەڵ وێنەی ئاسۆیی',
        'Display 2 balanced product cards per row with clean imagery'
      ),
      icon: '🍱',
    },
    {
      id: 'list' as MenuLayout,
      title: trByLang(lang, 'قائمة كلاسيكية أفقية', 'لیستی کلاسیکی ئاسۆیی', 'Classic Horizontal List'),
      desc: trByLang(
        lang,
        'بطاقات أفقية متناسقة بصورة مستطيلة جانبية والاسم والسعر وزر الإضافة',
        'کارتی ئاسۆیی هاوسەنگ بە وێنەی لاوەکی و ناو و نرخ و دوگمەی زیادکردن',
        'Clean horizontal rows with side image, title, price, and add button'
      ),
      icon: '📑',
    },
  ];
}

export const ANIMATED_EMOJIS = ['🍢', '🍔', '🍕', '🍟', '🌯', '🥗', '☕', '🥤', '🍰', '🍫', '🍗', '⚡', '🔥', '✨', '🍽️', '🎁'];

export const WEEK_DAYS_ORDER: Array<{ key: WorkDayKey; label: string }> = [
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الإثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
  { key: 'sat', label: 'السبت' },
];

export function getLocalizedWeekDaysOrder(lang: SupportedLanguage): Array<{ key: WorkDayKey; label: string }> {
  return [
    { key: 'sun', label: trByLang(lang, 'الأحد', 'یەکشەممە', 'Sunday') },
    { key: 'mon', label: trByLang(lang, 'الإثنين', 'دووشەممە', 'Monday') },
    { key: 'tue', label: trByLang(lang, 'الثلاثاء', 'سێشەممە', 'Tuesday') },
    { key: 'wed', label: trByLang(lang, 'الأربعاء', 'چوارشەممە', 'Wednesday') },
    { key: 'thu', label: trByLang(lang, 'الخميس', 'پێنجشەممە', 'Thursday') },
    { key: 'fri', label: trByLang(lang, 'الجمعة', 'هەینی', 'Friday') },
    { key: 'sat', label: trByLang(lang, 'السبت', 'شەممە', 'Saturday') },
  ];
}

export type DeliveryZoneDraft = {
  area: string;
  fee: number;
  cities: Array<{ name: string; fee: number }>;
};

function buildWeeklyHoursDraft(rest: Restaurant): Record<WorkDayKey, DaySchedule> {
  const fallbackFrom = rest.h?.f || '09:00';
  const fallbackTo = rest.h?.t || '23:59';
  const out = {} as Record<WorkDayKey, DaySchedule>;
  WEEK_DAYS_ORDER.forEach(({ key }) => {
    const existing = rest.weeklyHours?.[key];
    out[key] = {
      open: existing ? existing.open !== false : true,
      from: existing?.from || fallbackFrom,
      to: existing?.to || fallbackTo,
    };
  });
  return out;
}

function buildDeliveryZonesDraft(rest: Restaurant): DeliveryZoneDraft[] {
  const zones = rest.deliveryZones || [];
  const list: DeliveryZoneDraft[] = [];
  zones.forEach((z) => {
    const areaName = String(z.area || z.name || '').trim();
    const rawCities = Array.isArray(z.cities)
      ? z.cities
          .map((c) => ({
            name: String(c?.name || '').trim(),
            fee: Math.max(0, Number(c?.fee) || 0),
          }))
          .filter((c) => c.name)
      : [];

    if (rawCities.length > 0) {
      const isSingleSameAsArea = rawCities.length === 1 && (!areaName || rawCities[0].name === areaName);
      list.push({
        area: areaName || rawCities[0].name,
        fee: isSingleSameAsArea ? rawCities[0].fee : Math.max(0, Number(z.fee) || rawCities[0].fee || 0),
        cities: isSingleSameAsArea ? [] : rawCities,
      });
    } else if (areaName) {
      list.push({
        area: areaName,
        fee: Math.max(0, Number(z.fee) || 0),
        cities: [],
      });
    }
  });
  return list;
}

let sharedBellAudioCtx: AudioContext | null = null;
let pendingBellTone: 'chime' | 'bell' | 'alert' | null = null;

function getOrCreateBellAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedBellAudioCtx || sharedBellAudioCtx.state === 'closed') {
    sharedBellAudioCtx = new AudioCtx();
  }
  return sharedBellAudioCtx;
}

let lastBellTriggeredAt = 0;

function scheduleBellChime(ctx: AudioContext, tone: 'chime' | 'bell' | 'alert') {
  const nowMs = Date.now();
  if (nowMs - lastBellTriggeredAt < 250) return;
  lastBellTriggeredAt = nowMs;

  const baseNow = ctx.currentTime + 0.02;
  const repeatInterval = tone === 'chime' ? 0.95 : tone === 'alert' ? 0.8 : 0.85;
  const repeatCount = 3;

  const baseNotes: Array<{ freq: number; delay: number; duration: number; gain: number; shimmer?: number }> =
    tone === 'bell'
      ? [
          { freq: 987.77, delay: 0, duration: 0.48, gain: 0.11, shimmer: 1975.53 },
          { freq: 1318.51, delay: 0.13, duration: 0.68, gain: 0.125, shimmer: 2637.02 },
        ]
      : tone === 'alert'
      ? [
          { freq: 659.25, delay: 0, duration: 0.28, gain: 0.1, shimmer: 1318.51 },
          { freq: 880, delay: 0.14, duration: 0.42, gain: 0.115, shimmer: 1760 },
        ]
      : [
          { freq: 587.33, delay: 0, duration: 0.34, gain: 0.1 },
          { freq: 783.99, delay: 0.11, duration: 0.4, gain: 0.11 },
          { freq: 1046.5, delay: 0.22, duration: 0.56, gain: 0.105, shimmer: 2093 },
        ];

  for (let rep = 0; rep < repeatCount; rep++) {
    const repOffset = rep * repeatInterval;
    const isFinalRepeat = rep === repeatCount - 1;

    baseNotes.forEach(({ freq, delay, duration, gain: peakGain, shimmer }) => {
      const start = baseNow + repOffset + delay;
      const finalDur = isFinalRepeat ? duration * 1.25 : duration;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = tone === 'alert' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.014);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + finalDur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + finalDur + 0.03);

      if (shimmer) {
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(shimmer, start);
        shimmerGain.gain.setValueAtTime(0.0001, start);
        shimmerGain.gain.linearRampToValueAtTime(0.02, start + 0.012);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + finalDur * 0.72);
        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        shimmerOsc.start(start);
        shimmerOsc.stop(start + finalDur + 0.03);
      }
    });
  }
}

export function unlockBellAudio() {
  try {
    const ctx = getOrCreateBellAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (pendingBellTone && ctx.state === 'running') {
          const queued = pendingBellTone;
          pendingBellTone = null;
          scheduleBellChime(ctx, queued);
        }
      });
    } else if (pendingBellTone && ctx.state === 'running') {
      const queued = pendingBellTone;
      pendingBellTone = null;
      scheduleBellChime(ctx, queued);
    }
  } catch {
    // ignore browser audio restrictions
  }
}

export function playBellTone(tone: 'chime' | 'bell' | 'alert' = 'bell') {
  try {
    const ctx = getOrCreateBellAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      pendingBellTone = tone;
      void ctx
        .resume()
        .then(() => {
          if (ctx.state === 'running') {
            pendingBellTone = null;
            scheduleBellChime(ctx, tone);
          }
        })
        .catch(() => {});
      return;
    }
    pendingBellTone = null;
    scheduleBellChime(ctx, tone);
  } catch {
    // ignore audio autoplay restrictions
  }
}

export const SixDotDragHandle: React.FC = () => (
  <svg
    width="14"
    height="20"
    viewBox="0 0 14 20"
    fill="none"
    style={{ color: 'var(--muted)', flexShrink: 0, cursor: 'grab' }}
    aria-hidden="true"
  >
    <circle cx="4" cy="4" r="1.8" fill="currentColor" />
    <circle cx="10" cy="4" r="1.8" fill="currentColor" />
    <circle cx="4" cy="10" r="1.8" fill="currentColor" />
    <circle cx="10" cy="10" r="1.8" fill="currentColor" />
    <circle cx="4" cy="16" r="1.8" fill="currentColor" />
    <circle cx="10" cy="16" r="1.8" fill="currentColor" />
  </svg>
);

export const NAV_TABS = [
  { id: 'home' as const, label: 'الصفحة الرئيسية', Icon: Home },
  { id: 'cats' as const, label: 'الأقسام والتصنيفات', Icon: Tags },
  { id: 'menu' as const, label: 'العناصر والمنتجات', Icon: UtensilsCrossed },
  { id: 'orders' as const, label: 'الطلبات', Icon: ShoppingBag },
  { id: 'stats' as const, label: 'احصائيات احترافية', Icon: BarChart3 },
  { id: 'appearance' as const, label: 'المظهر', Icon: Palette },
  { id: 'branches' as const, label: 'عدة أفرع', Icon: GitBranch },
  { id: 'addons' as const, label: 'الإضافات', Icon: Sparkles },
  { id: 'qr' as const, label: 'كود QR ورابط المنيو', Icon: QrCode },
  { id: 'telegram' as const, label: 'إعداد التليجرام', Icon: Send },
  { id: 'set' as const, label: 'الإعدادات', Icon: Settings },
];

export function getLocalizedNavTabs(lang: SupportedLanguage) {
  return [
    { id: 'home' as const, label: trByLang(lang, 'الصفحة الرئيسية', 'سەرەتا', 'Overview'), Icon: Home },
    { id: 'cats' as const, label: trByLang(lang, 'الأقسام والتصنيفات', 'بەش و پۆلەکان', 'Categories'), Icon: Tags },
    { id: 'menu' as const, label: trByLang(lang, 'العناصر والمنتجات', 'بڕگە و بەرهەمەکان', 'Menu Items'), Icon: UtensilsCrossed },
    { id: 'orders' as const, label: trByLang(lang, 'الطلبات', 'داواکارییەکان', 'Orders'), Icon: ShoppingBag },
    { id: 'stats' as const, label: trByLang(lang, 'احصائيات احترافية', 'ئامارە پێشکەوتووەکان', 'Pro Analytics'), Icon: BarChart3 },
    { id: 'appearance' as const, label: trByLang(lang, 'المظهر', 'ڕووکار و شێواز', 'Appearance'), Icon: Palette },
    { id: 'branches' as const, label: trByLang(lang, 'عدة أفرع', 'چەندین لق', 'Branches'), Icon: GitBranch },
    { id: 'addons' as const, label: trByLang(lang, 'الإضافات', 'زیادکراوەکان', 'Add-ons'), Icon: Sparkles },
    { id: 'qr' as const, label: trByLang(lang, 'كود QR ورابط المنيو', 'کۆدی QR و بەستەری مینیۆ', 'QR Code & Link'), Icon: QrCode },
    { id: 'telegram' as const, label: trByLang(lang, 'إعداد التليجرام', 'ڕێکخستنی تێلێگرام', 'Telegram Setup'), Icon: Send },
    { id: 'set' as const, label: trByLang(lang, 'الإعدادات', 'ڕێکخستنەکان', 'Settings'), Icon: Settings },
  ];
}

export const surfaceCardStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
  backdropFilter: 'blur(14px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
  border: '1px solid color-mix(in srgb, var(--line) 72%, transparent)',
  color: 'var(--ink)',
};

export const themedInputStyle: React.CSSProperties = {
  color: 'var(--ink)',
  background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
  border: '1.5px solid var(--line)',
  borderRadius: '11px',
  padding: '10px 13px',
  width: '100%',
};

export const modalSectionStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--line)',
  borderRadius: 0,
  padding: '0 0 14px',
  marginBottom: '14px',
};

function resolveTabFromSub(sub?: string): DashboardTab {
  if (sub === 'lay' || sub === 'appearance' || sub === 'theme') return 'appearance';
  if (sub === 'branches') return 'branches';
  if (sub === 'categories') return 'cats';
  if (sub === 'items') return 'menu';
  if (sub === 'settings') return 'set';
  if (sub === 'home' || sub === 'overview') return 'home';
  if (
    sub &&
    ['home', 'cats', 'menu', 'orders', 'stats', 'appearance', 'branches', 'addons', 'qr', 'telegram', 'set'].includes(sub)
  ) {
    return sub as DashboardTab;
  }
  return 'home';
}

function useDashboardController({
  session,
  plans,
  site,
  initialSubTab,
  onNavigate,
  onLogout,
  onRefresh,
  showToast,
}: DashboardViewProps) {
  const { lang, setLang, isRtl, locale, tr } = useTranslation();
  const mainRid = session.rid || 'demo';
  const [activeRid, setActiveRidState] = useState<string>(() => {
    try {
      const saved = window.sessionStorage.getItem(`mp_active_branch_${mainRid}`);
      if (saved) return saved;
    } catch {
      // ignore storage errors
    }
    return mainRid;
  });

  const setActiveRid = (nextRid: string) => {
    setActiveRidState(nextRid);
    try {
      window.sessionStorage.setItem(`mp_active_branch_${mainRid}`, nextRid);
    } catch {
      // ignore storage errors
    }
  };

  // Reset active branch when logged account changes
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(`mp_active_branch_${mainRid}`);
      setActiveRidState(saved || mainRid);
    } catch {
      setActiveRidState(mainRid);
    }
  }, [mainRid]);

  const branchesList = getCollection<Restaurant>('restaurants').filter(
    (r) => r.parentRid === mainRid
  );

  // Fallback to mainRid if active branch no longer exists
  const rid =
    activeRid === mainRid || branchesList.some((b) => b.id === activeRid)
      ? activeRid
      : mainRid;

  const rawMainRest: Restaurant = getItem<Restaurant>(`restaurants/${mainRid}`) || {
    id: mainRid,
    n: 'كاب برجر',
    p: 'باقة الاعمال الشاملة',
    planId: 'vip',
    e: '2030-01-01',
    a: 1,
    o: 0,
    v: 0,
    ow: '07711448594',
    ph: '07724799679',
    lay: 'list',
    color: '#0F766E',
    currency: 'د.ع',
    country: 'العراق',
    region: 'بغداد',
    language: 'ar',
    projectType: 'restaurant',
    isPaid: true,
    done: 1,
  };
  const mainRest = ensureRestaurantDefaults(rawMainRest);

  const rawActiveRest = getItem<Restaurant>(`restaurants/${rid}`) || mainRest;
  const rest = ensureRestaurantDefaults(rawActiveRest);

  // Plan tier is always governed by the primary account
  const resolvedPlan = resolveRestaurantPlan(mainRest, plans);
  const localizedPlanName = getLocalizedPlanName(resolvedPlan.plan, lang);
  const terms = getBusinessTerms(rest.projectType, lang);
  const baseDomain = getSubdomainBaseDomain(site);
  const subdomainEnabled = site?.subdomainRules?.enabled === true;
  const supportPhone = getSupportWhatsapp(site);
  const supportWaHref = waLink(
    supportPhone,
    tr(
      `مرحباً فريق الدعم، أستفسر عن مشروعي "${mainRest.n}" (الباقة: ${localizedPlanName})`,
      `سڵاو تیمی پشتگیری، پرسیارم هەیە دەربارەی پڕۆژەکەم "${mainRest.n}" (پاکێج: ${localizedPlanName})`,
      `Hello Support Team, I have an inquiry about my store "${mainRest.n}" (Plan: ${localizedPlanName})`
    )
  );

  const STOCK_DEFAULT_TAB_LABELS: Record<string, string[]> = {
    home: ['الصفحة الرئيسية', 'الرئيسية'],
    cats: ['الأقسام والتصنيفات', 'الأقسام'],
    menu: ['العناصر والمنتجات', 'المنتجات', 'الأصناف'],
    orders: ['الطلبات'],
    stats: ['احصائيات احترافية', 'الإحصائيات'],
    appearance: ['المظهر'],
    branches: ['عدة أفرع', 'الأفرع'],
    addons: ['الإضافات'],
    qr: ['كود QR ورابط المنيو', 'كود QR'],
    telegram: ['إعداد التليجرام', 'التليجرام'],
    set: ['الإعدادات'],
  };

  const customTabLabel = (id: string, fallback: string) => {
    const labels = site?.dashboardTabLabels;
    const direct =
      labels?.[id]?.trim() ||
      (id === 'menu' ? labels?.items?.trim() : '') ||
      (id === 'orders' ? labels?.ord?.trim() : '');
    if (direct) {
      if (lang === 'ar') return direct;
      const defaultsForTab = STOCK_DEFAULT_TAB_LABELS[id] || [];
      if (!defaultsForTab.includes(direct)) return direct;
    }
    return fallback;
  };

  const allowedLayoutsCount = getAllowedLayoutsCount(resolvedPlan);
  const isLayoutAllowed = (layId: MenuLayout): boolean => {
    if (allowedLayoutsCount >= 3) return true;
    if (allowedLayoutsCount === 2) return layId === 'list' || layId === 'grid';
    return layId === 'list';
  };
  const currency = rest.currency || 'د.ع';

  const [activeTab, setActiveTabState] = useState<DashboardTab>(() => resolveTabFromSub(initialSubTab));

  useEffect(() => {
    if (!initialSubTab) return;
    setActiveTabState(resolveTabFromSub(initialSubTab));
  }, [initialSubTab]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('mp_last_dash_path', getDashboardTabPath(activeTab));
    } catch {
      // ignore storage errors
    }
  }, [activeTab]);

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    onNavigate(getDashboardTabPath(tab));
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [purchaseModalPlan, setPurchaseModalPlan] = useState<PricingPlan | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const openShareModal = () => setShareModalOpen(true);

  const openUpgradeModal = (minPlanId?: string) => {
    const paidPlans = plans.filter((p) => Number(p.pr || 0) > 0);
    const target =
      (minPlanId ? plans.find((p) => p.id === minPlanId) : undefined) ||
      paidPlans.find((p) => p.id === 'pro') ||
      paidPlans[0] ||
      plans[plans.length - 1] ||
      null;
    if (target) {
      setPurchaseModalPlan(target);
    } else {
      showToast(tr('تواصل مع الدعم الفني عبر الواتساب للترقية', 'بۆ بەرزکردنەوە لە ڕێگەی واتساپەوە پەیوەندی بە پشتگیریی تەکنیکی بکە', 'Contact support via WhatsApp to upgrade'));
    }
  };

  // Force onboarding completion if primary store info is incomplete
  useEffect(() => {
    if (!session.admin && mainRid !== 'demo') {
      const currentRest = getItem<Restaurant>(`restaurants/${mainRid}`);
      if (!currentRest || currentRest.done !== 1) {
        showToast(
          tr(
            'يجب إكمال معلومات وإعداد متجرك أولاً لتفعيل لوحة التحكم 🚀',
            'سەرەتا دەبێت زانیاری و ڕێکخستنی فرۆشگاکەت تەواو بکەیت بۆ چالاککردنی داشبۆرد 🚀',
            'Please complete your store setup first to activate the dashboard 🚀'
          )
        );
        onNavigate('/onboard');
      }
    }
  }, [mainRid, session.admin, onNavigate, showToast, lang]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // AJAX Confirmation Modal State
  const [ajaxDialog, setAjaxDialog] = useState<AjaxDialogState>(INITIAL_AJAX_DIALOG);
  const triggerAjaxConfirm = (
    title: string,
    message: string,
    type: 'warn' | 'danger' | 'info',
    confirmLabel: string,
    action: () => void | Promise<void>,
    successMessage: string
  ) => {
    setAjaxDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmLabel,
      isCompleted: false,
      successMessage,
      onConfirm: async () => {
        await action();
        setAjaxDialog((prev) => ({ ...prev, isCompleted: true }));
        setTimeout(() => {
          setAjaxDialog((prev) => ({ ...prev, isOpen: false, isCompleted: false }));
        }, 1200);
      },
    });
  };

  // Collections for currently active branch (`rid`)
  const allCategories = getCollection<Category>('cats')
    .filter((c) => c.rid === rid)
    .sort((a, b) => (a.o || 0) - (b.o || 0));
  const allItems = getCollection<MenuItem>('items')
    .filter((i) => i.rid === rid)
    .sort((a, b) => (a.o || 0) - (b.o || 0));
  const allOrders = getCollection<Order>('orders')
    .filter((o) => o.rid === rid)
    .sort((a, b) => (b.at || 0) - (a.at || 0));

  const newOrdersCount = allOrders.filter((o) => o.st === 'new' || o.status === 'pending').length;

  // MULTI-BRANCH ACTIONS
  const switchActiveBranch = (targetRid: string) => {
    setActiveRid(targetRid);
    setIsItemEditorOpen(false);
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const cloneCatsAndItemsFromMain = (targetBranchRid: string) => {
    const mainCats = getCollection<Category>('cats')
      .filter((c) => c.rid === mainRid)
      .sort((a, b) => (a.o || 0) - (b.o || 0));
    const mainItems = getCollection<MenuItem>('items')
      .filter((i) => i.rid === mainRid)
      .sort((a, b) => (a.o || 0) - (b.o || 0));

    // Remove existing items/categories of target branch when replacing via explicit clone
    const existingBranchCats = getCollection<Category>('cats').filter((c) => c.rid === targetBranchRid);
    const existingBranchItems = getCollection<MenuItem>('items').filter((i) => i.rid === targetBranchRid);
    existingBranchCats.forEach((c) => deleteItem(`cats/${c.id}`));
    existingBranchItems.forEach((i) => deleteItem(`items/${i.id}`));

    const catMap = new Map<string, string>();
    mainCats.forEach((c, idx) => {
      const newCatId = 'cat_' + uid();
      catMap.set(c.id, newCatId);
      putItem<Category>(`cats/${newCatId}`, {
        ...c,
        id: newCatId,
        rid: targetBranchRid,
        o: idx,
      });
    });

    mainItems.forEach((it, idx) => {
      const newItemId = 'item_' + uid();
      const mappedCat = catMap.get(it.cat) || it.cat;
      putItem<MenuItem>(`items/${newItemId}`, {
        ...it,
        id: newItemId,
        rid: targetBranchRid,
        cat: mappedCat,
        o: idx,
      });
    });
  };

  const createBranch = (
    branchNameRaw: string,
    branchPhoneRaw: string,
    branchAddressRaw: string,
    cloneMainMenu: boolean
  ) => {
    const cleanName = branchNameRaw.trim();
    if (!cleanName) {
      showToast(tr('يرجى كتابة اسم الفرع الجديد', 'تکایە ناوی لقە نوێیەکە بنووسە', 'Please enter the new branch name'));
      return false;
    }
    const maxB = resolvedPlan.maxBranches;
    if (maxB === 0) {
      showToast(
        tr(
          'ميزة عدة أفرع متاحة في الباقة الاحترافية وباقة الاعمال الشاملة 🔒',
          'تایبەتمەندی چەندین لق لە پاکێجی پڕۆ و بیزنسی گشتگیردا بەردەستە 🔒',
          'Multi-branch support is available on Pro and VIP plans 🔒'
        )
      );
      return false;
    }
    if (maxB !== -1 && branchesList.length >= maxB) {
      showToast(
        tr(
          `وصلت للحد الأقصى للأفرع في باقتك (${maxB} فرع) 🔒`,
          `گەیشتیتە ئەوپەڕی ژمارەی لقەکان لە پاکێجەکەتدا (${maxB} لق) 🔒`,
          `You have reached your plan's branch limit (${maxB} branches) 🔒`
        )
      );
      return false;
    }

    const newBranchId = 'branch_' + uid();
    const baseSlug = sanitizeSlug(mainRest.slug || '');
    const branchSlugCandidate = resolvedPlan.perms.customSlug && baseSlug
      ? sanitizeSlug(`${baseSlug}-${branchesList.length + 2}`)
      : '';
    const validBranchSlug =
      branchSlugCandidate && isSlugAvailable(branchSlugCandidate) && !isReservedSlug(branchSlugCandidate)
        ? branchSlugCandidate
        : generateRandomMenuCode();

    const branchRecord: Restaurant = ensureRestaurantDefaults({
      ...mainRest,
      id: newBranchId,
      parentRid: mainRid,
      isBranch: true,
      branchName: cleanName,
      n: `${mainRest.n} — ${cleanName}`,
      ph: branchPhoneRaw.trim() || mainRest.ph,
      address: branchAddressRaw.trim() || mainRest.address,
      slug: validBranchSlug,
      subdomain: subdomainEnabled && resolvedPlan.perms.customSlug ? validBranchSlug : '',
      social: {
        ...(mainRest.social || {}),
        whatsapp: branchPhoneRaw.trim() || mainRest.social?.whatsapp || mainRest.ph,
      },
      done: 1,
      a: 1,
      o: 0,
      v: 0,
    });

    putItem<Restaurant>(`restaurants/${newBranchId}`, branchRecord);
    if (cloneMainMenu !== false) {
      cloneCatsAndItemsFromMain(newBranchId);
    }
    setActiveRid(newBranchId);
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
    return true;
  };

  const cloneMainMenuToBranch = (branchRid: string, branchLabel: string) => {
    triggerAjaxConfirm(
      tr(
        `نسخ منيو الفرع الرئيسي إلى ${branchLabel}`,
        `کۆپیکردنی مینیۆی لقی سەرەکی بۆ ${branchLabel}`,
        `Copy main branch menu to ${branchLabel}`
      ),
      tr(
        'سيتم استبدال أقسام ومنتجات هذا الفرع بنسخة مطابقة كاملة من الفرع الرئيسي (يمكنك تعديلها بحرية بعد النسخ دون التأثير على الفرع الرئيسي).',
        'بەش و بەرهەمەکانی ئەم لقە بە کۆپییەکی تەواوی لقی سەرەکی جێگۆڕکێیان پێ دەکرێت (دواتر دەتوانیت بە ئازادی دەستکارییان بکەیت بەبێ کاریگەری لەسەر لقی سەرەکی).',
        'This branch’s categories and items will be replaced with a copy from the main branch (you can freely edit them afterwards).'
      ),
      'warn',
      tr('تأكيد النسخ', 'دڵنیاکردنەوەی کۆپیکردن', 'Confirm Copy'),
      () => {
        cloneCatsAndItemsFromMain(branchRid);
        onRefresh();
      },
      tr(
        `تم نسخ منيو الفرع الرئيسي إلى "${branchLabel}" بنجاح ✓`,
        `مینیۆی لقی سەرەکی بە سەرکەوتوویی بۆ "${branchLabel}" کۆپی کرا ✓`,
        `Main branch menu copied to "${branchLabel}" ✓`
      )
    );
  };

  const deleteBranch = (branchRid: string, branchLabel: string) => {
    triggerAjaxConfirm(
      tr(`حذف فرع: ${branchLabel}`, `سڕینەوەی لق: ${branchLabel}`, `Delete branch: ${branchLabel}`),
      tr(
        `هل أنت متأكد من حذف "${branchLabel}" وجميع أقسامه ومنتجاته نهائياً؟`,
        `دڵنیایت لە سڕینەوەی هەمیشەیی "${branchLabel}" و هەموو بەش و بەرهەمەکانی؟`,
        `Are you sure you want to permanently delete "${branchLabel}" and all its categories and items?`
      ),
      'danger',
      tr('تأكيد الحذف', 'دڵنیاکردنەوەی سڕینەوە', 'Confirm Delete'),
      () => {
        getCollection<Category>('cats')
          .filter((c) => c.rid === branchRid)
          .forEach((c) => deleteItem(`cats/${c.id}`));
        getCollection<MenuItem>('items')
          .filter((i) => i.rid === branchRid)
          .forEach((i) => deleteItem(`items/${i.id}`));
        deleteItem(`restaurants/${branchRid}`);
        if (activeRid === branchRid) {
          setActiveRid(mainRid);
        }
        onRefresh();
      },
      tr(`تم حذف "${branchLabel}" بنجاح`, `"${branchLabel}" بە سەرکەوتوویی سڕایەوە`, `"${branchLabel}" deleted successfully`)
    );
  };

  // Addons state synchronized with Restaurant object
  const [addonsState, setAddonsState] = useState<RestaurantAddons>(() => buildDefaultAddons(rest, lang));
  const [addonCategoryFilter, setAddonCategoryFilter] = useState<AddonCategoryFilter>('all');
  const [addonSearchQuery, setAddonSearchQuery] = useState('');
  const [editingAddonKey, setEditingAddonKey] = useState<AddonKey | null>(null);
  const [addonDraft, setAddonDraft] = useState<Record<string, any>>({});
  const [addonEditIntent, setAddonEditIntent] = useState<'edit' | 'enable'>('edit');
  const [addonEditError, setAddonEditError] = useState<string>('');
  const [addonSaving, setAddonSaving] = useState<boolean>(false);
  const [showPopupPreview, setShowPopupPreview] = useState(false);

  // Unlock browser WebAudio cleanly on first interaction inside the dashboard
  useEffect(() => {
    const handleUnlock = () => unlockBellAudio();
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });
    window.addEventListener('touchstart', handleUnlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
  }, []);

  // Poll server database lightly while dashboard is open so newly registered website orders arrive in real time
  useEffect(() => {
    let active = true;
    let syncing = false;

    const getSnapshotSig = () => {
      const ordersSig = getCollection<Order>('orders')
        .filter((o) => o.rid === rid)
        .map((o) => `${o.id}:${o.st || ''}:${o.status || ''}:${o.at || 0}`)
        .sort()
        .join('|');
      const restSig = JSON.stringify(getItem<Restaurant>(`restaurants/${rid}`) || null);
      return `${ordersSig}##${restSig}`;
    };

    const pollOrders = async () => {
      if (!active || syncing || document.visibilityState === 'hidden') return;
      syncing = true;
      try {
        const beforeSig = getSnapshotSig();
        const ok = await syncFromServer();
        if (!active || !ok) return;
        const afterSig = getSnapshotSig();
        if (afterSig !== beforeSig) {
          onRefresh();
        }
      } catch {
        // ignore transient background poll errors
      } finally {
        syncing = false;
      }
    };

    const handleWake = () => {
      if (document.visibilityState !== 'hidden') {
        void pollOrders();
      }
    };

    const timer = window.setInterval(() => {
      void pollOrders();
    }, 4000);
    window.addEventListener('focus', handleWake);
    document.addEventListener('visibilitychange', handleWake);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', handleWake);
      document.removeEventListener('visibilitychange', handleWake);
    };
  }, [rid, onRefresh]);

  // Play a gentle bell notification sound whenever a genuinely new order registers for this store
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const seenOrdersRidRef = useRef<string>('');
  useEffect(() => {
    if (seenOrdersRidRef.current !== rid) {
      seenOrdersRidRef.current = rid;
      seenOrderIdsRef.current = new Set(allOrders.map((o) => o.id));
      return;
    }

    const newlyArrived = allOrders.filter((o) => !seenOrderIdsRef.current.has(o.id));
    allOrders.forEach((o) => seenOrderIdsRef.current.add(o.id));

    if (newlyArrived.length > 0) {
      const bellAllowed = !addonsState.audioBell?.mutedByUser && addonsState.audioBell?.enabled !== false;
      if (bellAllowed) {
        playBellTone(addonsState.audioBell?.tone || 'bell');
      }
      const latest = newlyArrived[0];
      const seqVal = latest?.orderSeq || latest?.seq;
      const seqLabel = seqVal ? `#${seqVal}` : `#${String(latest?.id || '').slice(-6).toUpperCase()}`;
      showToast(
        newlyArrived.length === 1
          ? tr(`وصل طلب جديد (${seqLabel})`, `داواکارییەکی نوێ گەیشت (${seqLabel})`, `New order received (${seqLabel})`)
          : tr(`وصلت ${newlyArrived.length} طلبات جديدة`, `${newlyArrived.length} داواکاری نوێ گەیشتن`, `${newlyArrived.length} new orders received`)
      );
    }
  }, [rid, allOrders, addonsState.audioBell?.enabled, addonsState.audioBell?.mutedByUser, addonsState.audioBell?.tone, showToast, lang]);

  // CATEGORIES STATE
  const [searchCatQuery, setSearchCatQuery] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catSubtitleInput, setCatSubtitleInput] = useState('');
  const [catEmojiInput, setCatEmojiInput] = useState('');
  const [catImageInput, setCatImageInput] = useState('');
  const [catPublishedInput, setCatPublishedInput] = useState(true);
  const [catScheduleInput, setCatScheduleInput] = useState<AvailabilitySchedule>(() =>
    normalizeAvailabilitySchedule(DEFAULT_AVAILABILITY_SCHEDULE)
  );

  // MENU ITEMS STATE & FULL-PAGE ITEM EDITOR
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [filterCatId, setFilterCatId] = useState('all');
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [itemEditorTab, setItemEditorTab] = useState<ItemEditorTab>('info');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const [formCat, setFormCat] = useState('');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formBeforePrice, setFormBeforePrice] = useState<number | ''>('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formBadgeType, setFormBadgeType] = useState<'red' | 'gold' | 'green' | 'accent'>('accent');
  const [formAllergens, setFormAllergens] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formNoDelivery, setFormNoDelivery] = useState(false);
  const [formNoPickup, setFormNoPickup] = useState(false);
  const [formSchedule, setFormSchedule] = useState<AvailabilitySchedule>(() =>
    normalizeAvailabilitySchedule(DEFAULT_AVAILABILITY_SCHEDULE)
  );

  const [hasVariableSizes, setHasVariableSizes] = useState(false);
  const [formSizes, setFormSizes] = useState<Array<{ n: string; p: number | '' }>>([
    { n: '', p: '' },
  ]);

  const [hasExtras, setHasExtras] = useState(false);
  const [formExtras, setFormExtras] = useState<Array<{ n: string; p: number | '' }>>([
    { n: '', p: '' },
  ]);

  const [hasChoices, setHasChoices] = useState(false);
  const [formMaxChoices, setFormMaxChoices] = useState<number>(1);
  const [formChoices, setFormChoices] = useState<string[]>(['']);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchLinesInput, setBatchLinesInput] = useState('');

  // APPEARANCE STATE
  const normalizeLayoutChoice = (raw?: string): MenuLayout =>
    raw === 'grid4' || raw === 'cards'
      ? 'grid4'
      : raw === 'grid3'
      ? 'grid3'
      : raw === 'grid'
      ? 'grid'
      : 'list';
  const [selectedLayout, setSelectedLayout] = useState<MenuLayout>(() => {
    const candidate = normalizeLayoutChoice(rest.lay);
    return isLayoutAllowed(candidate) ? candidate : 'list';
  });
  const [menuThemeMode, setMenuThemeMode] = useState<'dark' | 'light' | 'auto'>(() =>
    rest.themeMode === 'dark' || rest.themeMode === 'auto' ? rest.themeMode : 'light'
  );
  const resolveDashboardPref = (r?: Restaurant | null): 'dark' | 'light' | 'auto' => {
    if (r?.dashboardThemeMode === 'dark' || r?.dashboardThemeMode === 'light' || r?.dashboardThemeMode === 'auto') {
      return r.dashboardThemeMode;
    }
    const sitePref = getSite().dashboardThemeMode;
    return sitePref === 'dark' || sitePref === 'auto' ? sitePref : 'light';
  };
  const [dashboardThemeMode, setDashboardThemeMode] = useState<'dark' | 'light' | 'auto'>(() =>
    resolveDashboardPref(rest)
  );
  const normalizeShapeChoice = (raw?: string): MenuThemeShape =>
    raw === 'glass' ||
    raw === 'cartoon' ||
    raw === 'dreamy' ||
    raw === 'pill' ||
    raw === 'sharp' ||
    raw === 'bordered' ||
    raw === 'soft' ||
    raw === 'ramadan' ||
    raw === 'eid' ||
    raw === 'newyear'
      ? raw
      : 'modern';
  const [menuThemePreset, setMenuThemePreset] = useState<string>(() =>
    rest.themePreset || (rest.themeMode === 'dark' ? 'emerald-dark' : 'clean-light')
  );
  const [menuThemeShape, setMenuThemeShape] = useState<MenuThemeShape>(() =>
    normalizeShapeChoice(rest.themeShape)
  );
  const [restColor, setRestColor] = useState<string>(() => rest.color || '#059669');
  const [restBgColor, setRestBgColor] = useState<string>(() => rest.bgColor || '');
  const [coverUrlInput, setCoverUrlInput] = useState(rest.coverImages?.[0] || '');
  const [logoUrlInput, setLogoUrlInput] = useState(rest.logo || '');
  const [aboutTextInput, setAboutTextInput] = useState(rest.aboutText || '');
  const [taxNoteInput, setTaxNoteInput] = useState(rest.taxNote || '');
  const [showLogoUrlField, setShowLogoUrlField] = useState(false);
  const [showBannerUrlField, setShowBannerUrlField] = useState(false);

  // CUSTOM SUBDOMAIN / SLUG STATE
  const [restSlug, setRestSlug] = useState(() => sanitizeSlug(rest.slug || rest.subdomain || ''));
  const [slugCheckState, setSlugCheckState] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    fullUrl?: string;
  }>({ checking: false, available: null, message: '' });

  // ORDERS FILTER
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'completed'>('all');

  // SETTINGS STATE
  const [restProjectType, setRestProjectType] = useState<'restaurant' | 'store'>(
    (rest.projectType as any) === 'store' ? 'store' : 'restaurant'
  );
  const [restName, setRestName] = useState(rest.n || '');
  const [restTagline, setRestTagline] = useState(rest.tagline || '');
  const [restCurrency, setRestCurrency] = useState(rest.currency || 'د.ع');
  const [restActive, setRestActive] = useState(rest.a !== 0);
  const [allowDelivery, setAllowDelivery] = useState(rest.enabledOrderTypes?.delivery !== false);
  const [allowPickup, setAllowPickup] = useState(rest.enabledOrderTypes?.pickup !== false);
  const [allowTable, setAllowTable] = useState(Boolean(rest.enabledOrderTypes?.table));
  const [acceptClosedOrders, setAcceptClosedOrders] = useState(Boolean(rest.acceptOrdersWhenClosed));
  const [orderChannel, setOrderChannel] = useState<'both' | 'telegram' | 'whatsapp'>(() =>
    rest.orderChannel === 'both' || rest.orderChannel === 'telegram' || rest.orderChannel === 'whatsapp'
      ? rest.orderChannel
      : rest.telegramNotificationsEnabled === false
      ? 'whatsapp'
      : 'both'
  );
  const [restPhone, setRestPhone] = useState(rest.ph || '');
  const [restWa, setRestWa] = useState(rest.social?.whatsapp || rest.ph || '');
  const [restAddress, setRestAddress] = useState(rest.address || 'العراق، بغداد');
  const [restInstagram, setRestInstagram] = useState(rest.social?.instagram || '');
  const [restMapUrl, setRestMapUrl] = useState(rest.mapUrl || '');
  const [restGoogleReviewUrl, setRestGoogleReviewUrl] = useState(rest.googleReviewUrl || '');
  const [restFacebook, setRestFacebook] = useState(rest.social?.facebook || '');
  const [restTiktok, setRestTiktok] = useState(rest.social?.tiktok || '');
  const [workMode, setWorkMode] = useState<'24' | 'c'>(rest.h?.m === 'c' ? 'c' : '24');
  const [workFrom, setWorkFrom] = useState(rest.h?.f || '09:00');
  const [workTo, setWorkTo] = useState(rest.h?.t || '23:59');
  const [weeklyHours, setWeeklyHours] = useState<Record<WorkDayKey, DaySchedule>>(() =>
    buildWeeklyHoursDraft(rest)
  );
  const [deliveryZonesState, setDeliveryZonesState] = useState<DeliveryZoneDraft[]>(() =>
    buildDeliveryZonesDraft(rest)
  );

  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const colorSyncTimerRef = useRef<number | null>(null);
  const appearanceDraftRef = useRef<{
    lay: MenuLayout;
    themeMode: 'dark' | 'light' | 'auto';
    themePreset: string;
    themeShape: MenuThemeShape;
    color: string;
    bgColor: string;
  }>({
    lay: isLayoutAllowed(normalizeLayoutChoice(rest.lay)) ? normalizeLayoutChoice(rest.lay) : 'list',
    themeMode: rest.themeMode === 'dark' || rest.themeMode === 'auto' ? rest.themeMode : 'light',
    themePreset: rest.themePreset || (rest.themeMode === 'dark' ? 'emerald-dark' : 'clean-light'),
    themeShape: normalizeShapeChoice(rest.themeShape),
    color: rest.color || '#059669',
    bgColor: rest.bgColor || '',
  });

  const buildRestSignature = (rObj: Restaurant, targetRid: string, activeLang: SupportedLanguage = lang) =>
    `${activeLang}|${targetRid}|${rObj.planId || ''}|${rObj.slug || ''}|${rObj.lay || ''}|${rObj.themeMode || ''}|${rObj.dashboardThemeMode || ''}|${rObj.themePreset || ''}|${rObj.themeShape || ''}|${rObj.color || ''}|${rObj.bgColor || ''}|${rObj.currency || ''}|${rObj.logo || ''}|${rObj.coverImages?.[0] || ''}|${rObj.n || ''}|${rObj.orderChannel || ''}|${rObj.telegramNotificationsEnabled === false ? '0' : '1'}`;

  // Synchronize dashboard form state when switching branch, language, or syncing remote DB
  const syncedRestRef = useRef<string>('');
  useEffect(() => {
    const sig = buildRestSignature(rest, rid, lang);
    if (syncedRestRef.current === sig) return;
    syncedRestRef.current = sig;
    setAddonsState(buildDefaultAddons(rest, lang));
    if (colorSyncTimerRef.current === null) {
      const candidateLay = normalizeLayoutChoice(rest.lay);
      const safeLay = isLayoutAllowed(candidateLay) ? candidateLay : 'list';
      const safeMode: 'dark' | 'light' | 'auto' =
        rest.themeMode === 'dark' || rest.themeMode === 'auto' ? rest.themeMode : 'light';
      const safePreset =
        rest.themePreset === 'custom'
          ? 'custom'
          : rest.themePreset || (safeMode === 'dark' ? 'emerald-dark' : 'clean-light');
      const safeShape = normalizeShapeChoice(rest.themeShape);
      const safeColor = rest.color || '#059669';
      const safeBg = rest.bgColor || '';
      appearanceDraftRef.current = {
        lay: safeLay,
        themeMode: safeMode,
        themePreset: safePreset,
        themeShape: safeShape,
        color: safeColor,
        bgColor: safeBg,
      };
      setSelectedLayout(safeLay);
      setMenuThemeMode(safeMode);
      setMenuThemePreset(safePreset);
      setMenuThemeShape(safeShape);
      setRestColor(safeColor);
      setRestBgColor(safeBg);
    }
    setDashboardThemeMode(resolveDashboardPref(rest));
    setCoverUrlInput(rest.coverImages?.[0] || '');
    setLogoUrlInput(rest.logo || '');
    setAboutTextInput(rest.aboutText || '');
    setTaxNoteInput(rest.taxNote || '');
    setRestSlug(sanitizeSlug(rest.slug || rest.subdomain || ''));
    setSlugCheckState({ checking: false, available: null, message: '' });
    setRestProjectType((rest.projectType as any) === 'store' ? 'store' : 'restaurant');
    setRestName(rest.n || '');
    setRestTagline(rest.tagline || '');
    setRestCurrency(rest.currency || 'د.ع');
    setRestActive(rest.a !== 0);
    setAllowDelivery(rest.enabledOrderTypes?.delivery !== false);
    setAllowPickup(rest.enabledOrderTypes?.pickup !== false);
    setAllowTable(Boolean(rest.enabledOrderTypes?.table));
    setAcceptClosedOrders(Boolean(rest.acceptOrdersWhenClosed));
    setOrderChannel(
      rest.orderChannel === 'both' || rest.orderChannel === 'telegram' || rest.orderChannel === 'whatsapp'
        ? rest.orderChannel
        : rest.telegramNotificationsEnabled === false
        ? 'whatsapp'
        : 'both'
    );
    setRestPhone(rest.ph || '');
    setRestWa(rest.social?.whatsapp || rest.ph || '');
    setRestAddress(rest.address || 'العراق، بغداد');
    setRestInstagram(rest.social?.instagram || '');
    setRestMapUrl(rest.mapUrl || '');
    setRestGoogleReviewUrl(rest.googleReviewUrl || '');
    setRestFacebook(rest.social?.facebook || '');
    setRestTiktok(rest.social?.tiktok || '');
    setWorkMode(rest.h?.m === 'c' ? 'c' : '24');
    setWorkFrom(rest.h?.f || '09:00');
    setWorkTo(rest.h?.t || '23:59');
    setWeeklyHours(buildWeeklyHoursDraft(rest));
    setDeliveryZonesState(buildDeliveryZonesDraft(rest));
  }, [rid, rest, lang]);

  const checkSubdomainAvailability = async (candidateRaw: string) => {
    const clean = sanitizeSlug(candidateRaw);
    if (!clean) {
      setSlugCheckState({ checking: false, available: null, message: '' });
      return;
    }
    if (!resolvedPlan.perms.customSlug) {
      setSlugCheckState({
        checking: false,
        available: false,
        message: tr(
          'الرابط والدومين الفرعي المخصص متاحان في الباقات المدفوعة فقط.',
          'بەستەر و سەبدۆمەینی تایبەت تەنها لە پاکێجە پارەدارەکاندا بەردەستە.',
          'Custom link & subdomain are available on paid plans only.'
        ),
      });
      return;
    }
    if (clean.length < 3) {
      setSlugCheckState({
        checking: false,
        available: false,
        message: tr(
          'يجب أن يتكون من 3 أحرف إنجليزية على الأقل.',
          'دەبێت لانیکەم لە ٣ پیتی ئینگلیزی پێکهاتبێت.',
          'Must be at least 3 English characters.'
        ),
      });
      return;
    }
    if (isReservedSlug(clean)) {
      setSlugCheckState({
        checking: false,
        available: false,
        message: tr(
          'هذا الاسم محجوز للنظام، يرجى اختيار اسم آخر.',
          'ئەم ناوە بۆ سیستەم پارێزراوە، تکایە ناوێکی تر هەڵبژێرە.',
          'This name is reserved by the system, please choose another.'
        ),
      });
      return;
    }
    if (!isSlugAvailable(clean, rid)) {
      setSlugCheckState({
        checking: false,
        available: false,
        message: tr(
          'هذا الرابط مستخدم بالفعل من قِبل مشروع آخر.',
          'ئەم بەستەرە پێشتر لەلایەن پڕۆژەیەکی ترەوە بەکارهێنراوە.',
          'This link is already taken by another business.'
        ),
      });
      return;
    }

    setSlugCheckState({
      checking: true,
      available: null,
      message: tr('جاري التحقق من التوفر...', 'پشکنینی بەردەستبوون...', 'Checking availability...'),
    });
    try {
      const qs = new URLSearchParams({
        slug: clean,
        rid,
        planId: resolvedPlan.plan.id,
      });
      const res = await fetch(`/api/subdomains/check?${qs.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as {
          available?: boolean;
          message?: string;
          fullUrl?: string;
        };
        setSlugCheckState({
          checking: false,
          available: Boolean(data.available),
          message: data.message
            ? translateServerError(data.message, lang)
            : data.available
            ? tr('الرابط متاح للتفعيل!', 'بەستەرەکە بەردەستە بۆ چالاککردن!', 'Link is available!')
            : tr('غير متاح', 'بەردەست نییە', 'Unavailable'),
          fullUrl: data.fullUrl,
        });
        return;
      }
    } catch {
      // Fallback to local verification
    }
    setSlugCheckState({
      checking: false,
      available: true,
      message: tr('الرابط متاح وجاهز للحفظ ✓', 'بەستەرەکە بەردەستە و ئامادەیە بۆ پاشەکەوتکردن ✓', 'Link is available & ready to save ✓'),
      fullUrl: subdomainEnabled ? `https://${clean}.${baseDomain}` : `https://${baseDomain}/${clean}`,
    });
  };

  const copyLink = (text: string) => {
    void copyTextReliable(text).then((ok) => {
      showToast(
        ok
          ? tr('تم نسخ الرابط بنجاح ✓', 'بەستەرەکە بە سەرکەوتوویی کۆپی کرا ✓', 'Link copied successfully ✓')
          : tr('تعذر النسخ', 'کۆپیکردن سەرکەوتوو نەبوو', 'Failed to copy')
      );
    });
  };

  const scrollCategoryPills = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const persistAddons = async (nextAddons: RestaurantAddons) => {
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    const healthLines = (nextAddons.healthNotices?.noticesText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const freeDeliveryEnabled = Boolean(nextAddons.freeDeliveryProgress?.enabled);
    const freeDeliveryThreshold = freeDeliveryEnabled
      ? Math.max(0, Number(nextAddons.freeDeliveryProgress?.minAmount ?? 0) || 0)
      : 0;

    await putItemAndSync<Restaurant>(`restaurants/${rid}`, {
      ...latestRest,
      addons: nextAddons,
      freeDeliveryMin: freeDeliveryThreshold,
      offerPopup: {
        ...(latestRest.offerPopup || {}),
        enabled: Boolean(nextAddons.offerPopup?.enabled),
        title: nextAddons.offerPopup?.title || '',
        subtitle: nextAddons.offerPopup?.subtitle || '',
        image: nextAddons.offerPopup?.image || '',
        buttonText:
          nextAddons.offerPopup?.buttonText ||
          tr('تصفح المنيو واطلب الآن', 'مینیۆ بگەڕێ و ئێستا داوا بکە', 'Browse Menu & Order Now'),
      },
      showHealthInfoPopup: Boolean(nextAddons.healthNotices?.enabled),
      healthNotices: healthLines.length > 0 ? healthLines : latestRest.healthNotices,
    });
    setAddonsState(nextAddons);
    onRefresh();
  };

  const handleToggleAddon = (addonMeta: AddonMetaItem) => {
    const localizedTitle =
      getLocalizedAddonCatalog(lang).find((a) => a.key === addonMeta.key)?.title || addonMeta.title;
    if (!isAddonAllowedForPlan(addonMeta.key, resolvedPlan)) {
      const reqLabel = getAddonRequiredPlanLabel(addonMeta.key, lang);
      showToast(
        tr(
          `هذه الميزة متاحة في ${reqLabel} 🔒`,
          `ئەم تایبەتمەندییە لە ${reqLabel} بەردەستە 🔒`,
          `This feature is available on ${reqLabel} 🔒`
        )
      );
      return;
    }
    const current = (addonsState[addonMeta.key] || {}) as Record<string, any>;
    const isCurrentlyEnabled = Boolean(current.enabled);

    // Do NOT allow enabling directly — always open the setup/edit popup first!
    if (!isCurrentlyEnabled) {
      handleOpenAddonEdit(addonMeta.key, { enableOnSave: true });
      return;
    }

    triggerAjaxConfirm(
      tr(`إيقاف: ${localizedTitle}`, `ناچالاککردن: ${localizedTitle}`, `Disable: ${localizedTitle}`),
      tr(
        `هل تريد إيقاف ميزة "${localizedTitle}" مؤقتاً في المنيو؟`,
        `دەتەوێت تایبەتمەندیی "${localizedTitle}" بە شێوەی کاتی لە مینیۆدا ڕابگریت؟`,
        `Temporarily disable "${localizedTitle}" on your menu?`
      ),
      'warn',
      tr('تأكيد الإيقاف', 'دڵنیاکردنەوەی ناچالاککردن', 'Confirm Disable'),
      async () => {
        const nextAddons: RestaurantAddons = {
          ...addonsState,
          [addonMeta.key]: {
            ...current,
            configured: true,
            enabled: false,
            ...(addonMeta.key === 'audioBell' ? { mutedByUser: true } : {}),
          },
        };
        await persistAddons(nextAddons);
      },
      tr(
        `تم إيقاف "${localizedTitle}" بنجاح`,
        `"${localizedTitle}" بە سەرکەوتوویی ناچالاک کرا`,
        `"${localizedTitle}" disabled successfully`
      )
    );
  };

  const handleOpenAddonEdit = (key: AddonKey, options?: { enableOnSave?: boolean }) => {
    if (!isAddonAllowedForPlan(key, resolvedPlan)) {
      const reqLabel = getAddonRequiredPlanLabel(key, lang);
      showToast(
        tr(
          `تعديل هذه الميزة متاح في ${reqLabel} 🔒`,
          `دەستکاریکردنی ئەم تایبەتمەندییە لە ${reqLabel} بەردەستە 🔒`,
          `Editing this feature is available on ${reqLabel} 🔒`
        )
      );
      return;
    }
    const defaults = (buildDefaultAddons(rest, lang)[key] || {}) as Record<string, any>;
    const current = {
      ...defaults,
      ...((addonsState[key] || {}) as Record<string, any>),
    };
    if (key === 'promoCoupons') {
      const existingList =
        Array.isArray(current.couponsList) && current.couponsList.length > 0
          ? current.couponsList
          : [
              {
                code: current.code || 'PLUS10',
                discountType: current.discountType || 'percent',
                discountValue: Number(current.discountValue ?? 10),
                minSubtotal: Number(current.minSubtotal ?? 10000),
              },
            ];
      setAddonDraft({ ...current, couponsList: existingList.map((c: any) => ({ ...c })) });
    } else {
      setAddonDraft({ ...current });
    }
    setAddonEditIntent(options?.enableOnSave ? 'enable' : 'edit');
    setAddonEditError('');
    setEditingAddonKey(key);
  };

  const handleSaveAddonEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddonKey || addonSaving) return;
    const meta = getLocalizedAddonCatalog(lang).find((a) => a.key === editingAddonKey);
    const keySnapshot = editingAddonKey;
    const currentExisting = (addonsState[keySnapshot] || {}) as Record<string, any>;
    const shouldEnable =
      addonEditIntent === 'enable' ? true : Boolean(addonDraft.enabled);

    let draftSnapshot: Record<string, any> = {
      ...addonDraft,
      configured: true,
      enabled: shouldEnable,
    };

    // Per-addon validation so every enabled addon works reliably
    if (keySnapshot === 'offerPopup') {
      const title = String(draftSnapshot.title || '').trim();
      if (!title) {
        setAddonEditError(tr('يرجى إدخال عنوان النافذة المنبثقة.', 'تکایە ناونیشانی پۆپئەپ بنووسە.', 'Please enter the popup title.'));
        return;
      }
      draftSnapshot.title = title;
      draftSnapshot.subtitle = String(draftSnapshot.subtitle || '').trim();
      draftSnapshot.image = String(draftSnapshot.image || '').trim();
      draftSnapshot.buttonText = String(draftSnapshot.buttonText || tr('تصفح المنيو واطلب الآن', 'مینیۆ بگەڕێ و ئێستا داوا بکە', 'Browse Menu & Order Now')).trim();
    }

    if (keySnapshot === 'announcementBar') {
      const text = String(draftSnapshot.text || '').trim();
      if (!text) {
        setAddonEditError(tr('يرجى إدخال نص الشريط الإعلاني.', 'تکایە دەقی شریتی ڕاگەیاندن بنووسە.', 'Please enter the announcement text.'));
        return;
      }
      draftSnapshot.text = text;
      draftSnapshot.bgColor = draftSnapshot.bgColor || '#C2410C';
      draftSnapshot.textColor = draftSnapshot.textColor || '#ffffff';
    }

    if (keySnapshot === 'countdownTimer') {
      const discountValue = Math.max(0, Number(draftSnapshot.discountValue ?? 0) || 0);
      const endHour = Math.min(23, Math.max(0, Math.floor(Number(draftSnapshot.endHour ?? 23))));
      if (draftSnapshot.discountType !== 'fixed' && discountValue > 95) {
        setAddonEditError(tr('نسبة الخصم يجب أن لا تتجاوز 95%.', 'ڕێژەی داشکاندن نابێت لە ٩٥٪ زیاتر بێت.', 'Discount percentage cannot exceed 95%.'));
        return;
      }
      draftSnapshot.title = String(draftSnapshot.title || tr('عرض الساعة الذهبية', 'ئۆفەری کاتژمێری زێڕین', 'Golden Hour Offer')).trim();
      draftSnapshot.discountValue = discountValue;
      draftSnapshot.endHour = endHour;
    }

    if (keySnapshot === 'promoCoupons') {
      const rawList = Array.isArray(draftSnapshot.couponsList) ? draftSnapshot.couponsList : [];
      const cleanList = rawList
        .map((c: any) => ({
          code: String(c.code || '').trim().toUpperCase(),
          discountType: c.discountType === 'fixed' ? ('fixed' as const) : ('percent' as const),
          discountValue: Math.max(0, Number(c.discountValue) || 0),
          minSubtotal: Math.max(0, Number(c.minSubtotal) || 0),
        }))
        .filter((c: any) => c.code && c.discountValue > 0);
      if (cleanList.length === 0) {
        setAddonEditError(tr('يرجى إضافة كود كوبون صحيح وقيمة خصم أكبر من صفر.', 'تکایە کۆدێکی کۆپۆنی دروست و بەهای داشکاندنی زیاتر لە سفر زیاد بکە.', 'Please add a valid coupon code and discount greater than zero.'));
        return;
      }
      const first = cleanList[0];
      draftSnapshot = {
        ...draftSnapshot,
        couponsList: cleanList,
        code: first.code,
        discountType: first.discountType,
        discountValue: first.discountValue,
        minSubtotal: first.minSubtotal,
      };
    }

    if (keySnapshot === 'freeDeliveryProgress') {
      const minAmount = Math.max(0, Number(draftSnapshot.minAmount ?? 0) || 0);
      if (shouldEnable && minAmount <= 0) {
        setAddonEditError(tr('يجب تحديد مبلغ أكبر من صفر للحد الأدنى للتوصيل المجاني.', 'بڕی کەمترین بۆ گەیاندنی خۆڕایی دەبێت لە سفر زیاتر بێت.', 'Minimum amount for free delivery must be greater than zero.'));
        return;
      }
      draftSnapshot.minAmount = minAmount;
      draftSnapshot.label = String(draftSnapshot.label || tr('شريط التوصيل المجاني', 'شریتی گەیاندنی خۆڕایی', 'Free Delivery Bar')).trim();
    }

    if (keySnapshot === 'minOrder') {
      const amount = Math.max(0, Number(draftSnapshot.amount ?? 0) || 0);
      if (shouldEnable && amount <= 0) {
        setAddonEditError(tr('يجب تحديد مبلغ أكبر من صفر للحد الأدنى للطلب.', 'کەمترین بڕی داواکاری دەبێت لە سفر زیاتر بێت.', 'Minimum order amount must be greater than zero.'));
        return;
      }
      draftSnapshot.amount = amount;
      draftSnapshot.message = String(draftSnapshot.message || tr('الحد الأدنى للطلب هو', 'کەمترین بڕی داواکاری', 'Minimum order is')).trim();
    }

    if (keySnapshot === 'serviceFee') {
      const label = String(draftSnapshot.label || '').trim();
      const amount = Math.max(0, Number(draftSnapshot.amount ?? 0) || 0);
      if (!label || (shouldEnable && amount <= 0)) {
        setAddonEditError(tr('يرجى كتابة تسمية الرسوم وتحديد مبلغ أكبر من صفر.', 'تکایە ناوی کرێ و بڕەکەی (زیاتر لە سفر) بنووسە.', 'Please enter the fee label and an amount greater than zero.'));
        return;
      }
      draftSnapshot.label = label;
      draftSnapshot.amount = amount;
    }

    if (keySnapshot === 'freeGiftThreshold') {
      const giftName = String(draftSnapshot.giftName || '').trim();
      if (!giftName) {
        setAddonEditError(tr('يرجى إدخال اسم الهدية المجانية.', 'تکایە ناوی دیارییە خۆڕاییەکە بنووسە.', 'Please enter the free gift name.'));
        return;
      }
      draftSnapshot.giftName = giftName;
      draftSnapshot.minAmount = Math.max(0, Number(draftSnapshot.minAmount ?? 0) || 0);
    }

    if (keySnapshot === 'happyHour') {
      const pct = Math.min(90, Math.max(1, Number(draftSnapshot.discountPercent ?? 15) || 15));
      const startHour = Math.min(23, Math.max(0, Math.floor(Number(draftSnapshot.startHour ?? 14))));
      const endHour = Math.min(23, Math.max(0, Math.floor(Number(draftSnapshot.endHour ?? 17))));
      if (startHour === endHour) {
        setAddonEditError(tr('ساعة البداية والنهاية لا يمكن أن تكونا متطابقتين.', 'کاتژمێری دەستپێک و کۆتایی نابێت وەک یەک بن.', 'Start hour and end hour cannot be the same.'));
        return;
      }
      draftSnapshot.title = String(draftSnapshot.title || tr('ساعة السعادة الذهبية', 'کاتژمێری خۆشبەختیی زێڕین', 'Golden Happy Hour')).trim();
      draftSnapshot.startHour = startHour;
      draftSnapshot.endHour = endHour;
      draftSnapshot.discountPercent = pct;
    }

    if (keySnapshot === 'tableService') {
      const tablesCount = Math.min(200, Math.max(1, Math.floor(Number(draftSnapshot.tablesCount ?? 12) || 12)));
      draftSnapshot.tablesCount = tablesCount;
    }

    if (keySnapshot === 'spinWheelPromo') {
      const prizes = String(draftSnapshot.prizesText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (prizes.length < 2) {
        setAddonEditError(tr('يرجى إدخال جائزتين على الأقل (كل جائزة في سطر).', 'تکایە لانیکەم ٢ خەڵات بنووسە (هەر خەڵاتێک لە دێڕێکدا).', 'Please enter at least 2 prizes (one per line).'));
        return;
      }
      draftSnapshot.title = String(draftSnapshot.title || tr('جرّب حظك واربح خصماً فورياً!', 'بەختی خۆت تاقی بکەرەوە و داشکاندنی خێرا ببەوە!', 'Spin & Win an Instant Discount!')).trim();
      draftSnapshot.prizesText = prizes.join('\n');
    }

    if (keySnapshot === 'scheduledOrder') {
      const slots = String(draftSnapshot.slotsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slots.length === 0) {
        setAddonEditError(tr('يرجى إدخال موعد واحد على الأقل للجدولة.', 'تکایە لانیکەم یەک کات بنووسە بۆ خشتەبەندی.', 'Please enter at least one scheduled time slot.'));
        return;
      }
      draftSnapshot.label = String(draftSnapshot.label || tr('اختر موعد التوصيل أو الاستلام', 'کاتی گەیاندن یان وەرگرتن هەڵبژێرە', 'Choose delivery or pickup time')).trim();
      draftSnapshot.slotsText = slots.join('\n');
    }

    if (keySnapshot === 'flashTipOption') {
      const presets = String(draftSnapshot.presetsText || '')
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (presets.length === 0) {
        setAddonEditError(tr('يرجى إدخال مبالغ صحيحة مفصولة بفاصلة مثل: 1000,2000,5000', 'تکایە بڕی دروست بنووسە بە کۆما جیاکرابنەوە وەک: 1000,2000,5000', 'Please enter valid amounts separated by commas, e.g. 1000,2000,5000'));
        return;
      }
      draftSnapshot.presetsText = presets.join(',');
    }

    if (keySnapshot === 'audioBell') {
      draftSnapshot.tone = draftSnapshot.tone || 'bell';
      draftSnapshot.mutedByUser = !shouldEnable;
    }

    if (keySnapshot === 'mysteryBoxOffer') {
      const title = String(draftSnapshot.title || '').trim();
      const price = Math.max(0, Number(draftSnapshot.price ?? 0) || 0);
      const originalPrice = Math.max(price, Number(draftSnapshot.originalPrice ?? price) || price);
      if (!title || (shouldEnable && price <= 0)) {
        setAddonEditError(tr('يرجى إدخال عنوان الصندوق وسعر بيع أكبر من صفر.', 'تکایە ناونیشانی سندوق و نرخی فرۆشتن (زیاتر لە سفر) بنووسە.', 'Please enter a box title and a selling price greater than zero.'));
        return;
      }
      draftSnapshot.title = title;
      draftSnapshot.subtitle = String(draftSnapshot.subtitle || '').trim();
      draftSnapshot.price = price;
      draftSnapshot.originalPrice = originalPrice;
      draftSnapshot.remainingCount = Math.max(1, Math.floor(Number(draftSnapshot.remainingCount ?? 5) || 5));
    }

    if (keySnapshot === 'bogoDealEngine') {
      const title = String(draftSnapshot.title || tr('اطلب قطعتين واحصل على خصم للثانية', '٢ دانە داوا بکە و داشکاندن لەسەر دووەم وەربگرە', 'Order 2 items & get discount on the 2nd')).trim();
      const pct = Math.min(100, Math.max(5, Math.floor(Number(draftSnapshot.secondItemDiscountPercent ?? 50) || 50)));
      draftSnapshot.title = title;
      draftSnapshot.secondItemDiscountPercent = pct;
    }

    if (keySnapshot === 'vipSecretMenuLock') {
      const code = String(draftSnapshot.secretCode || '').trim().toUpperCase();
      const dishName = String(draftSnapshot.dishName || '').trim();
      const dishPrice = Math.max(0, Number(draftSnapshot.dishPrice ?? 0) || 0);
      if (!code || !dishName || (shouldEnable && dishPrice <= 0)) {
        setAddonEditError(tr('يرجى إدخال الرمز السري واسم الطبق الحصري وسعر أكبر من صفر.', 'تکایە کۆدی نهێنی، ناوی خواردنی تایبەت و نرخ (زیاتر لە سفر) بنووسە.', 'Please enter secret code, exclusive dish name, and price greater than zero.'));
        return;
      }
      draftSnapshot.secretCode = code;
      draftSnapshot.dishName = dishName;
      draftSnapshot.dishDesc = String(draftSnapshot.dishDesc || '').trim();
      draftSnapshot.dishPrice = dishPrice;
    }

    if (keySnapshot === 'pickupInstantDiscount') {
      draftSnapshot.title = String(draftSnapshot.title || tr('خصم الاستلام الذاتي', 'داشکاندنی وەرگرتنی خۆیی', 'Self-Pickup Discount')).trim();
      draftSnapshot.discountPercent = Math.min(90, Math.max(1, Number(draftSnapshot.discountPercent ?? 10) || 10));
    }

    if (keySnapshot === 'birthdayVipTreat') {
      const label = String(draftSnapshot.label || '').trim();
      if (!label) {
        setAddonEditError(tr('يرجى إدخال تسمية خيار المناسبة.', 'تکایە ناوی هەڵبژاردنی بۆنەکە بنووسە.', 'Please enter the occasion option label.'));
        return;
      }
      draftSnapshot.label = label;
      draftSnapshot.freeTreatNote = String(draftSnapshot.freeTreatNote || '').trim();
    }

    if (keySnapshot === 'buildYourOwnCombo') {
      draftSnapshot.title = String(draftSnapshot.title || tr('خصم الكومبو التلقائي', 'داشکاندنی کۆمبۆی خۆکار', 'Auto Combo Discount')).trim();
      draftSnapshot.requiredCount = Math.min(10, Math.max(2, Math.floor(Number(draftSnapshot.requiredCount ?? 3) || 3)));
      draftSnapshot.discountPercent = Math.min(80, Math.max(1, Number(draftSnapshot.discountPercent ?? 12) || 12));
    }

    if (keySnapshot === 'flashQuantityScarcity') {
      draftSnapshot.badgePrefix = String(draftSnapshot.badgePrefix || tr('متبقي اليوم', 'ماوە بۆ ئەمڕۆ', 'Left today')).trim();
      draftSnapshot.defaultRemaining = Math.min(25, Math.max(1, Math.floor(Number(draftSnapshot.defaultRemaining ?? 4) || 4)));
    }

    if (keySnapshot === 'streakRewardsCard') {
      const rewardTitle = String(draftSnapshot.rewardTitle || '').trim();
      if (!rewardTitle) {
        setAddonEditError(tr('يرجى كتابة اسم المكافأة عند اكتمال الأختام.', 'تکایە ناوی خەڵاتەکە بنووسە کاتێک مۆرەکان تەواو دەبن.', 'Please enter the reward name upon completing stamps.'));
        return;
      }
      draftSnapshot.targetOrders = Math.min(20, Math.max(2, Math.floor(Number(draftSnapshot.targetOrders ?? 5) || 5)));
      draftSnapshot.rewardTitle = rewardTitle;
    }

    if (keySnapshot === 'smartPairingSuggest') {
      draftSnapshot.title = String(draftSnapshot.title || tr('يناسب طبقك بشكل مثالي', 'لەگەڵ خواردنەکەت زۆر گونجاوە', 'Pairs perfectly with your meal')).trim();
      draftSnapshot.categoryKeyword = String(draftSnapshot.categoryKeyword || tr('مشروب', 'خواردنەوە', 'Drink')).trim();
    }

    if (keySnapshot === 'luxuryGiftPackaging') {
      const label = String(draftSnapshot.label || '').trim();
      const feeAmount = Math.max(0, Number(draftSnapshot.feeAmount ?? 0) || 0);
      if (!label || (shouldEnable && feeAmount <= 0)) {
        setAddonEditError(tr('يرجى كتابة تسمية التغليف وسعر أكبر من صفر.', 'تکایە ناوی پاکەتکردن و نرخ (زیاتر لە سفر) بنووسە.', 'Please enter gift wrap label and price greater than zero.'));
        return;
      }
      draftSnapshot.label = label;
      draftSnapshot.feeAmount = feeAmount;
    }

    if (keySnapshot === 'moodMealFinder') {
      draftSnapshot.title = String(draftSnapshot.title || tr('مستشار المزاج والوجبة الذكي', 'ڕاوێژکاری زیرەکی مەزاج و خواردن', 'Smart Mood Meal Advisor')).trim();
      draftSnapshot.buttonText = String(draftSnapshot.buttonText || tr('اختر لي وجبة حسب مزاجي ✨', 'بەپێی مەزاجم خواردنێکم بۆ هەڵبژێرە ✨', 'Pick a meal for my mood ✨')).trim();
    }

    if (keySnapshot === 'voiceSearchOrder') {
      draftSnapshot.lang = draftSnapshot.lang || 'ar-IQ';
      draftSnapshot.hintText = String(draftSnapshot.hintText || tr('تحدث الآن واذكر اسم الطبق...', 'ئێستا قسە بکە و ناوی خواردنەکە بڵێ...', 'Speak now and mention the dish name...')).trim();
    }

    if (keySnapshot === 'dietaryAllergyRadar') {
      draftSnapshot.warningText = String(draftSnapshot.warningText || tr('قد يحتوي هذا الطبق على مكونات مستبعدة في فلتر صحتك', 'ڕەنگە ئەم خواردنە پێکهاتەی دوورخراوە لە فلتەری تەندروستیتدا لەخۆبگرێت', 'This dish may contain ingredients excluded in your health filter')).trim();
    }

    if (keySnapshot === 'calorieMacroBudget') {
      draftSnapshot.targetCalories = Math.min(5000, Math.max(200, Math.floor(Number(draftSnapshot.targetCalories ?? 900) || 900)));
    }

    if (keySnapshot === 'multiCurrencySwitch') {
      const altSymbol = String(draftSnapshot.altSymbol || '$').trim();
      const exchangeRate = Number(draftSnapshot.exchangeRate ?? 1500) || 0;
      if (!altSymbol || exchangeRate <= 0) {
        setAddonEditError(tr('يرجى إدخال رمز العملة البديلة وسعر صرف أكبر من صفر.', 'تکایە هێمای دراوی دووەم و نرخی گۆڕینەوەی زیاتر لە سفر بنووسە.', 'Please enter alternate currency symbol and exchange rate greater than zero.'));
        return;
      }
      draftSnapshot.altSymbol = altSymbol;
      draftSnapshot.exchangeRate = exchangeRate;
    }

    if (keySnapshot === 'dishCompareDrawer') {
      draftSnapshot.maxCompare = Math.min(4, Math.max(2, Math.floor(Number(draftSnapshot.maxCompare ?? 3) || 3)));
    }

    if (keySnapshot === 'charityMealRoundup') {
      const title = String(draftSnapshot.title || '').trim();
      const donationAmount = Math.max(0, Number(draftSnapshot.donationAmount ?? 0) || 0);
      if (!title || (shouldEnable && donationAmount <= 0)) {
        setAddonEditError(tr('يرجى إدخال عنوان المبادرة ومبلغ مساهمة أكبر من صفر.', 'تکایە ناونیشانی دەستپێشخەری و بڕی بەشداری (زیاتر لە سفر) بنووسە.', 'Please enter initiative title and contribution amount greater than zero.'));
        return;
      }
      draftSnapshot.title = title;
      draftSnapshot.donationAmount = donationAmount;
    }

    if (keySnapshot === 'curbsidePickupCar') {
      draftSnapshot.instructions = String(draftSnapshot.instructions || tr('اركن سيارتك أمام البوابة واضغط وصلت', 'ئۆتۆمبێلەکەت لەبەردەم دەرگا ڕابگرە و دوگمەی گەیشتم دابگرە', 'Park outside and tap I Have Arrived')).trim();
      draftSnapshot.allowArrivedPing = draftSnapshot.allowArrivedPing !== false;
    }

    if (keySnapshot === 'liveKitchenLoad') {
      draftSnapshot.level = draftSnapshot.level || 'calm';
      draftSnapshot.customNote = String(draftSnapshot.customNote || '').trim();
    }

    if (keySnapshot === 'silentDropoffOption') {
      const label = String(draftSnapshot.label || '').trim();
      if (!label) {
        setAddonEditError(tr('يرجى كتابة نص خيار التوصيل الصامت.', 'تکایە دەقی هەڵبژاردەی گەیاندنی بێدەنگ بنووسە.', 'Please enter the silent drop-off option label.'));
        return;
      }
      draftSnapshot.label = label;
    }

    setAddonEditError('');
    setAddonSaving(true);
    try {
      const nextAddons: RestaurantAddons = {
        ...addonsState,
        [keySnapshot]: {
          ...currentExisting,
          ...draftSnapshot,
          configured: true,
          enabled: shouldEnable,
        },
      };
      await persistAddons(nextAddons);
      setEditingAddonKey(null);
      setAddonEditIntent('edit');
      const fallbackAddonName = tr('الإضافة', 'زیادکراوە', 'Add-on');
      const addonTitle = meta?.title || fallbackAddonName;
      showToast(
        shouldEnable
          ? tr(`تم حفظ وتفعيل "${addonTitle}" بنجاح ✓`, `"${addonTitle}" بە سەرکەوتوویی پاشەکەوت و چالاک کرا ✓`, `"${addonTitle}" saved and enabled ✓`)
          : tr(`تم حفظ إعدادات "${addonTitle}" بنجاح`, `ڕێکخستنەکانی "${addonTitle}" بە سەرکەوتوویی پاشەکەوت کران`, `"${addonTitle}" settings saved`)
      );
    } finally {
      setAddonSaving(false);
    }
  };

  const mediaLibraryItems: MediaLibraryItem[] = (() => {
    if (Array.isArray(rest.mediaLibrary)) {
      return rest.mediaLibrary;
    }
    const defaultsSet = new Set<string>([
      DEFAULT_MEDIA_ASSETS.restaurant.logo,
      DEFAULT_MEDIA_ASSETS.restaurant.banner,
      DEFAULT_MEDIA_ASSETS.store.logo,
      DEFAULT_MEDIA_ASSETS.store.banner,
    ]);
    const seen = new Set<string>();
    const seeded: MediaLibraryItem[] = [];
    allCategories.forEach((c) => {
      const url = String(c.img || '').trim();
      if (url && !defaultsSet.has(url) && !seen.has(url)) {
        seen.add(url);
        seeded.push({ id: `media_cat_${c.id}`, name: c.n || tr('صورة قسم', 'وێنەی بەش', 'Category image'), url });
      }
    });
    allItems.forEach((it) => {
      const url = String(it.img || '').trim();
      if (url && !defaultsSet.has(url) && !seen.has(url)) {
        seen.add(url);
        seeded.push({ id: `media_item_${it.id}`, name: it.n || tr('صورة صنف', 'وێنەی بڕگە', 'Item image'), url });
      }
    });
    return seeded;
  })();

  const appendToMediaLibrary = (entries: MediaLibraryItem[]) => {
    if (entries.length === 0) return;
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    const baseList = Array.isArray(latestRest.mediaLibrary)
      ? latestRest.mediaLibrary
      : mediaLibraryItems;
    const existingUrls = new Set(baseList.map((m) => m.url));
    const uniqueNew = entries.filter((entry) => !existingUrls.has(entry.url));
    if (uniqueNew.length === 0) return;
    const nextList = [...uniqueNew, ...baseList];
    putItem<Restaurant>(`restaurants/${rid}`, {
      ...latestRest,
      mediaLibrary: nextList,
    });
    onRefresh();
  };

  const uploadImagesToLibrary = async (files: FileList): Promise<MediaLibraryItem[]> => {
    const added: MediaLibraryItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 'item');
        added.push({
          id: 'media_' + uid(),
          name: file.name || 'image.jpg',
          url: compressed,
          createdAt: Date.now(),
        });
      } catch {
        // skip unreadable file
      }
    }
    if (added.length > 0) {
      appendToMediaLibrary(added);
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
    } else {
      showToast(tr('تعذر قراءة الصورة، جرب صورة أخرى', 'نەتوانرا وێنەکە بخوێنرێتەوە، وێنەیەکی تر تاقی بکەرەوە', 'Could not read image, try another one'));
    }
    return added;
  };

  const removeMediaLibraryItem = (mediaId: string) => {
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    const baseList = Array.isArray(latestRest.mediaLibrary)
      ? latestRest.mediaLibrary
      : mediaLibraryItems;
    const nextList = baseList.filter((m) => m.id !== mediaId);
    putItem<Restaurant>(`restaurants/${rid}`, {
      ...latestRest,
      mediaLibrary: nextList,
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleDeviceImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onResult: (dataUrl: string) => void,
    _successLabel = tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'),
    variant: 'logo' | 'banner' | 'item' = 'item'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImage(file, variant);
      appendToMediaLibrary([
        {
          id: 'media_' + uid(),
          name: file.name || 'image.jpg',
          url: compressed,
          createdAt: Date.now(),
        },
      ]);
      onResult(compressed);
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
    } catch {
      showToast(tr('تعذر قراءة الصورة، جرب صورة أخرى', 'نەتوانرا وێنەکە بخوێنرێتەوە، وێنەیەکی تر تاقی بکەرەوە', 'Could not read image, try another one'));
    }
  };

  const handleReorderCategories = (nextOrderedIds: string[]) => {
    const byId = new Map<string, Category>(allCategories.map((c) => [c.id, c]));
    nextOrderedIds.forEach((catId, index) => {
      const cat = byId.get(catId);
      if (cat && (cat.o ?? -1) !== index) {
        putItem<Category>(`cats/${cat.id}`, { ...cat, o: index });
      }
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleToggleCategoryVisibility = (cat: Category) => {
    const currentlyOn = cat.published !== false;
    const nextOn = !currentlyOn;
    putItem<Category>(`cats/${cat.id}`, {
      ...cat,
      published: nextOn,
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSaveCategorySchedule = (cat: Category, schedule: AvailabilitySchedule) => {
    putItem<Category>(`cats/${cat.id}`, {
      ...cat,
      availabilitySchedule: sanitizeAvailabilityScheduleForSave(schedule),
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleToggleItemVisibility = (item: MenuItem) => {
    const currentlyOn = item.published !== false && item.available !== false;
    const nextOn = !currentlyOn;
    putItem<MenuItem>(`items/${item.id}`, {
      ...item,
      published: nextOn,
      available: nextOn,
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleReorderItems = (nextOrderedSubsetIds: string[]) => {
    if (nextOrderedSubsetIds.length === 0) return;
    const byId = new Map<string, MenuItem>(allItems.map((it) => [it.id, it]));
    const subsetSet = new Set(nextOrderedSubsetIds);
    const reorderedSubset = nextOrderedSubsetIds
      .map((id) => byId.get(id))
      .filter((it): it is MenuItem => Boolean(it));

    let subPtr = 0;
    const finalItems = allItems.map((it) =>
      subsetSet.has(it.id) && subPtr < reorderedSubset.length ? reorderedSubset[subPtr++] : it
    );

    finalItems.forEach((it, index) => {
      if ((it.o ?? -1) !== index) {
        putItem<MenuItem>(`items/${it.id}`, { ...it, o: index });
      }
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSaveItemSchedule = (item: MenuItem, schedule: AvailabilitySchedule) => {
    putItem<MenuItem>(`items/${item.id}`, {
      ...item,
      availabilitySchedule: sanitizeAvailabilityScheduleForSave(schedule),
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const openNewCategoryModal = () => {
    if (resolvedPlan.maxCats !== -1 && allCategories.length >= resolvedPlan.maxCats) {
      showToast(
        tr(
          `وصلت للحد الأقصى للأقسام في باقتك (${resolvedPlan.maxCats} أقسام). يمكنك الترقية لباقة أعلى.`,
          `گەیشتیتە ئەوپەڕی بەشەکان لە پاکێجەکەتدا (${resolvedPlan.maxCats} بەش). دەتوانیت بەرزبکەیتەوە بۆ پاکێجی باڵاتر.`,
          `You have reached your plan's category limit (${resolvedPlan.maxCats}). Upgrade to add more.`
        )
      );
      return;
    }
    setEditingCatId(null);
    setCatNameInput('');
    setCatSubtitleInput('');
    setCatEmojiInput('');
    setCatImageInput('');
    setCatPublishedInput(true);
    setCatScheduleInput(normalizeAvailabilitySchedule(DEFAULT_AVAILABILITY_SCHEDULE));
    setShowCatModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) {
      showToast(tr('يرجى كتابة اسم القسم', 'تکایە ناوی بەشەکە بنووسە', 'Please enter category name'));
      return;
    }
    const cleanName = catNameInput.trim();
    const isEdit = Boolean(editingCatId);
    if (!isEdit && resolvedPlan.maxCats !== -1 && allCategories.length >= resolvedPlan.maxCats) {
      showToast(
        tr(
          `وصلت للحد الأقصى للأقسام في باقتك (${resolvedPlan.maxCats} أقسام)`,
          `گەیشتیتە ئەوپەڕی بەشەکان لە پاکێجەکەتدا (${resolvedPlan.maxCats} بەش)`,
          `Reached category limit (${resolvedPlan.maxCats})`
        )
      );
      return;
    }

    triggerAjaxConfirm(
      isEdit ? tr('حفظ تعديل القسم', 'پاشەکەوتکردنی دەستکاریی بەش', 'Save Category Edit') : tr('إضافة قسم جديد', 'زیادکردنی بەشی نوێ', 'Add New Category'),
      isEdit
        ? tr(`هل أنت متأكد من حفظ التعديلات على قسم "${cleanName}"؟`, `دڵنیایت لە پاشەکەوتکردنی گۆڕانکارییەکانی بەشی "${cleanName}"؟`, `Save changes to category "${cleanName}"?`)
        : tr(`هل أنت متأكد من إضافة قسم "${cleanName}"؟`, `دڵنیایت لە زیادکردنی بەشی "${cleanName}"؟`, `Add category "${cleanName}"?`),
      'info',
      tr('تأكيد الحفظ', 'دڵنیاکردنەوەی پاشەکەوتکردن', 'Confirm Save'),
      () => {
        const catId = editingCatId || 'cat_' + uid();
        const existing = allCategories.find((c) => c.id === catId);

        putItem<Category>(`cats/${catId}`, {
          ...(existing || {}),
          id: catId,
          rid,
          n: cleanName,
          subtitle: catSubtitleInput.trim() || undefined,
          emoji: catEmojiInput.trim() || undefined,
          img: catImageInput.trim() || undefined,
          date: existing?.date || new Date().toLocaleDateString(locale),
          published: existing ? existing.published !== false : catPublishedInput,
          availabilitySchedule: sanitizeAvailabilityScheduleForSave(catScheduleInput),
          o: existing ? existing.o : allCategories.length,
        });

        setShowCatModal(false);
        setEditingCatId(null);
        setCatNameInput('');
        setCatSubtitleInput('');
        setCatEmojiInput('');
        setCatImageInput('');
        setCatScheduleInput(normalizeAvailabilitySchedule(DEFAULT_AVAILABILITY_SCHEDULE));
        onRefresh();
      },
      isEdit
        ? tr('تم حفظ تعديل القسم بنجاح', 'دەستکاریی بەش بە سەرکەوتوویی پاشەکەوت کرا', 'Category updated successfully')
        : tr('تمت إضافة القسم بنجاح', 'بەش بە سەرکەوتوویی زیاد کرا', 'Category added successfully')
    );
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatNameInput(cat.n);
    setCatSubtitleInput(cat.subtitle || '');
    setCatEmojiInput(cat.emoji || '');
    setCatImageInput(cat.img || '');
    setCatPublishedInput(cat.published !== false);
    setCatScheduleInput(normalizeAvailabilitySchedule(cat.availabilitySchedule));
    setShowCatModal(true);
  };

  const handleDeleteCategory = (cat: Category) => {
    triggerAjaxConfirm(
      tr('تأكيد حذف القسم', 'دڵنیاکردنەوەی سڕینەوەی بەش', 'Confirm Delete Category'),
      tr(
        `هل أنت متأكد من حذف القسم "${cat.n}"؟ لا يمكن التراجع عن هذا الإجراء.`,
        `دڵنیایت لە سڕینەوەی بەشی "${cat.n}"؟ ئەم کردارە ناگەڕێتەوە.`,
        `Delete category "${cat.n}"? This action cannot be undone.`
      ),
      'danger',
      tr('تأكيد الحذف', 'دڵنیاکردنەوەی سڕینەوە', 'Confirm Delete'),
      () => {
        deleteItem(`cats/${cat.id}`);
        onRefresh();
      },
      tr('تم الحذف بنجاح', 'بە سەرکەوتوویی سڕایەوە', 'Deleted successfully')
    );
  };

  const openNewItemEditor = () => {
    if (resolvedPlan.maxItems !== -1 && allItems.length >= resolvedPlan.maxItems) {
      showToast(
        tr(
          `وصلت للحد الأقصى للعناصر في باقتك (${resolvedPlan.maxItems} عنصر). يمكنك الترقية لباقة أعلى.`,
          `گەیشتیتە ئەوپەڕی بڕگەکان لە پاکێجەکەتدا (${resolvedPlan.maxItems} بڕگە). دەتوانیت بەرزبکەیتەوە بۆ پاکێجی باڵاتر.`,
          `You have reached your plan's item limit (${resolvedPlan.maxItems}). Upgrade to add more.`
        )
      );
      return;
    }
    setEditingItemId(null);
    setItemEditorTab('info');
    setFormName('');
    setFormCat(allCategories[0]?.id || '');
    setFormPrice('');
    setFormBeforePrice('');
    setFormDesc('');
    setFormImage('');
    setFormPrepTime('');
    setFormBadgeText('');
    setFormBadgeType('accent');
    setFormAllergens('');
    setFormPublished(true);
    setFormNoDelivery(false);
    setFormNoPickup(false);
    setFormSchedule(normalizeAvailabilitySchedule(DEFAULT_AVAILABILITY_SCHEDULE));
    setHasVariableSizes(false);
    setFormSizes([
      { n: tr('سنجل', 'سینگڵ', 'Single'), p: '' },
      { n: tr('دبل', 'دەبڵ', 'Double'), p: '' },
    ]);
    setHasExtras(false);
    setFormExtras([{ n: '', p: '' }]);
    setHasChoices(false);
    setFormMaxChoices(1);
    setFormChoices(['']);
    setIsItemEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openBatchModal = () => {
    if (resolvedPlan.maxItems !== -1 && allItems.length >= resolvedPlan.maxItems) {
      showToast(
        tr(
          `وصلت للحد الأقصى للعناصر في باقتك (${resolvedPlan.maxItems} عنصر)`,
          `گەیشتیتە ئەوپەڕی بڕگەکان لە پاکێجەکەتدا (${resolvedPlan.maxItems} بڕگە)`,
          `Reached item limit (${resolvedPlan.maxItems})`
        )
      );
      return;
    }
    setShowBatchModal(true);
  };

  const handleSaveItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resolvedPlan.perms.priceProductControl) {
      showToast(tr('التحكم بالأسعار والمنتجات غير مفعل في باقتك الحالية', 'کۆنترۆڵکردنی نرخ و بەرهەمەکان لە پاکێجەکەتدا چالاک نییە', 'Price & product control is not enabled on your current plan'));
      return;
    }
    if (!editingItemId && resolvedPlan.maxItems !== -1 && allItems.length >= resolvedPlan.maxItems) {
      showToast(
        tr(
          `وصلت للحد الأقصى للعناصر في باقتك (${resolvedPlan.maxItems} عنصر)`,
          `گەیشتیتە ئەوپەڕی بڕگەکان لە پاکێجەکەتدا (${resolvedPlan.maxItems} بڕگە)`,
          `Reached item limit (${resolvedPlan.maxItems})`
        )
      );
      return;
    }
    if (!formName.trim()) {
      setItemEditorTab('info');
      showToast(tr('يرجى إدخال اسم العنصر أولاً', 'تکایە سەرەتا ناوی بڕگەکە بنووسە', 'Please enter the item name first'));
      return;
    }

    const cleanSizes = hasVariableSizes
      ? formSizes
          .map((s) => ({ n: s.n.trim(), p: Number(s.p) || 0 }))
          .filter((s) => s.n)
      : [];

    if (hasVariableSizes && cleanSizes.length === 0) {
      setItemEditorTab('info');
      showToast(
        tr(
          'يرجى إضافة حجم واحد على الأقل مع السعر، أو إطفاء خيار الأسعار المتغيرة',
          'تکایە لانیکەم یەک قەبارە لەگەڵ نرخەکەی زیاد بکە، یان نرخی فرەقەبارە ناچالاک بکە',
          'Please add at least one size with price, or turn off variable sizes'
        )
      );
      return;
    }

    if (!hasVariableSizes && formPrice === '') {
      setItemEditorTab('info');
      showToast(tr('يرجى إدخال سعر العنصر', 'تکایە نرخی بڕگەکە بنووسە', 'Please enter item price'));
      return;
    }

    const cleanExtras = hasExtras
      ? formExtras
          .map((ex) => ({ n: ex.n.trim(), p: Number(ex.p) || 0 }))
          .filter((ex) => ex.n)
      : [];

    const cleanChoices = hasChoices
      ? formChoices.map((ch) => ch.trim()).filter(Boolean)
      : [];

    const cleanName = formName.trim();
    const isEdit = Boolean(editingItemId);
    const computedBasePrice = hasVariableSizes
      ? Math.min(...cleanSizes.map((s) => s.p))
      : Number(formPrice) || 0;

    triggerAjaxConfirm(
      isEdit ? tr('حفظ تعديل العنصر', 'پاشەکەوتکردنی دەستکاریی بڕگە', 'Save Item Edit') : tr('إضافة عنصر جديد', 'زیادکردنی بڕگەی نوێ', 'Add New Item'),
      isEdit
        ? tr(`هل أنت متأكد من حفظ التعديلات على "${cleanName}"؟`, `دڵنیایت لە پاشەکەوتکردنی گۆڕانکارییەکانی "${cleanName}"؟`, `Save changes to "${cleanName}"?`)
        : tr(`هل أنت متأكد من إضافة "${cleanName}"؟`, `دڵنیایت لە زیادکردنی "${cleanName}"؟`, `Add "${cleanName}"?`),
      'info',
      tr('تأكيد الحفظ', 'دڵنیاکردنەوەی پاشەکەوتکردن', 'Confirm Save'),
      () => {
        const catToUse = formCat || allCategories[0]?.id || 'default_cat';
        const itemId = editingItemId || 'item_' + uid();
        const existing = allItems.find((i) => i.id === itemId);

        const itemPayload: MenuItem = {
          ...(existing || {}),
          id: itemId,
          rid,
          cat: catToUse,
          n: cleanName,
          pr: computedBasePrice,
          beforePrice: resolvedPlan.perms.itemDiscounts && formBeforePrice ? Number(formBeforePrice) : undefined,
          d: formDesc.trim(),
          img:
            formImage.trim() ||
            'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
          sizes: cleanSizes.length > 0 ? cleanSizes : [],
          extras: cleanExtras.length > 0 ? cleanExtras : [],
          choices: cleanChoices.length > 0 ? cleanChoices : [],
          maxChoices: cleanChoices.length > 0 ? Math.max(1, Number(formMaxChoices) || 1) : undefined,
          allergens: formAllergens.trim() || undefined,
          available: formPublished,
          published: formPublished,
          availabilitySchedule: sanitizeAvailabilityScheduleForSave(formSchedule),
          noDelivery: formNoDelivery || undefined,
          noPickup: formNoPickup || undefined,
          prepTime: formPrepTime ? `${formPrepTime} ${tr('دقيقة', 'خولەک', 'min')}` : undefined,
          badges: formBadgeText.trim() ? [{ type: formBadgeType, text: formBadgeText.trim() }] : [],
          date: existing?.date || new Date().toLocaleDateString(locale),
          o: existing ? existing.o : allItems.length,
        };

        putItem<MenuItem>(`items/${itemId}`, itemPayload);
        setIsItemEditorOpen(false);
        setEditingItemId(null);
        onRefresh();
      },
      isEdit
        ? tr('تم حفظ تعديل العنصر بنجاح', 'دەستکاریی بڕگە بە سەرکەوتوویی پاشەکەوت کرا', 'Item updated successfully')
        : tr('تمت إضافة العنصر بنجاح', 'بڕگە بە سەرکەوتوویی زیاد کرا', 'Item added successfully')
    );
  };

  const handleQuickUpdateItemPrice = (item: MenuItem, rawPrice: number): boolean => {
    if (!resolvedPlan.perms.priceProductControl) {
      showToast(tr('التحكم بالأسعار والمنتجات غير مفعل في باقتك الحالية', 'کۆنترۆڵکردنی نرخ و بەرهەمەکان لە پاکێجەکەتدا چالاک نییە', 'Price & product control is not enabled on your current plan'));
      return false;
    }
    if (!Number.isFinite(rawPrice) || rawPrice < 0) {
      showToast(tr('يرجى إدخال سعر صحيح (0 أو أكبر)', 'تکایە نرخێکی دروست بنووسە (٠ یان زیاتر)', 'Please enter a valid price (0 or greater)'));
      return false;
    }
    const cleanPrice = Math.max(0, Math.round(rawPrice));
    const nextSizes =
      Array.isArray(item.sizes) && item.sizes.length > 0
        ? (() => {
            const minSizePrice = Math.min(...item.sizes.map((s) => Number(s.p) || 0));
            let updatedOnce = false;
            return item.sizes.map((s) => {
              if (!updatedOnce && (Number(s.p) || 0) === minSizePrice) {
                updatedOnce = true;
                return { ...s, p: cleanPrice };
              }
              return s;
            });
          })()
        : item.sizes;

    putItem<MenuItem>(`items/${item.id}`, {
      ...item,
      pr: cleanPrice,
      ...(nextSizes ? { sizes: nextSizes } : {}),
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
    return true;
  };

  const handleDeleteItem = (item: MenuItem) => {
    triggerAjaxConfirm(
      tr('تأكيد حذف العنصر', 'دڵنیاکردنەوەی سڕینەوەی بڕگە', 'Confirm Delete Item'),
      tr(
        `هل أنت متأكد من حذف العنصر "${item.n}" نهائياً من القائمة؟`,
        `دڵنیایت لە سڕینەوەی هەمیشەیی "${item.n}" لە لیستەکە؟`,
        `Permanently delete "${item.n}" from the menu?`
      ),
      'danger',
      tr('تأكيد الحذف', 'دڵنیاکردنەوەی سڕینەوە', 'Confirm Delete'),
      () => {
        deleteItem(`items/${item.id}`);
        onRefresh();
      },
      tr('تم الحذف بنجاح', 'بە سەرکەوتوویی سڕایەوە', 'Deleted successfully')
    );
  };

  const handleBatchAddItems = () => {
    const lines = batchLinesInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      showToast(tr('يرجى إدخال سطر واحد على الأقل بصيغة: الاسم - السعر', 'تکایە لانیکەم یەک دێڕ بنووسە بە شێوازی: ناو - نرخ', 'Please enter at least one line in format: Name - Price'));
      return;
    }
    if (resolvedPlan.maxItems !== -1 && allItems.length + lines.length > resolvedPlan.maxItems) {
      const remaining = Math.max(0, resolvedPlan.maxItems - allItems.length);
      showToast(
        tr(
          `يتجاوز العدد المتاح في باقتك (${remaining} عنصر متبقي من أصل ${resolvedPlan.maxItems})`,
          `لە ژمارەی ڕێپێدراوی پاکێجەکەت زیاترە (${remaining} بڕگە ماوە لە کۆی ${resolvedPlan.maxItems})`,
          `Exceeds your plan limit (${remaining} items remaining out of ${resolvedPlan.maxItems})`
        )
      );
      return;
    }
    const targetCat = allCategories[0]?.id || 'default_cat';
    triggerAjaxConfirm(
      tr('إضافة مجموعة عناصر', 'زیادکردنی کۆمەڵە بڕگە', 'Batch Add Items'),
      tr(
        `هل أنت متأكد من إضافة ${lines.length} عنصر إلى المنيو دفعة واحدة؟`,
        `دڵنیایت لە زیادکردنی ${lines.length} بڕگە بە یەکجار بۆ مینیۆ؟`,
        `Add ${lines.length} items to your menu at once?`
      ),
      'info',
      tr('تأكيد الإضافة', 'دڵنیاکردنەوەی زیادکردن', 'Confirm Add'),
      () => {
        lines.forEach((line, idx) => {
          const parts = line.split(/[-–|,]/).map((s) => s.trim());
          const name = parts[0] || tr(`طبق ${idx + 1}`, `خواردن ${idx + 1}`, `Item ${idx + 1}`);
          const priceNum = Number(String(parts[1] || '5000').replace(/\D/g, '')) || 5000;
          const desc = parts[2] || '';
          const itemId = 'item_' + uid();
          putItem<MenuItem>(`items/${itemId}`, {
            id: itemId,
            rid,
            cat: targetCat,
            n: name,
            pr: priceNum,
            d: desc,
            available: true,
            published: true,
            o: allItems.length + idx,
          });
        });
        setBatchLinesInput('');
        setShowBatchModal(false);
        onRefresh();
      },
      tr(`تمت إضافة ${lines.length} عنصر بنجاح`, `${lines.length} بڕگە بە سەرکەوتوویی زیاد کران`, `${lines.length} items added successfully`)
    );
  };

  const handleEditItem = (item: MenuItem) => {
    const existingSizes = (item.sizes || [])
      .map((s: any) => ({
        n: String(s?.n || s?.label || s?.name || '').trim(),
        p: Number(s?.p ?? s?.pr ?? s?.price ?? 0) as number | '',
      }))
      .filter((s) => s.n);

    const existingExtras = (item.extras || [])
      .map((ex: any) => ({
        n: String(ex?.n || ex?.label || ex?.name || '').trim(),
        p: Number(ex?.p ?? ex?.pr ?? ex?.price ?? 0) as number | '',
      }))
      .filter((ex) => ex.n);

    const existingChoices = (item.choices || [])
      .map((ch: any) => (typeof ch === 'string' ? ch.trim() : String(ch?.n || ch?.label || ch?.name || '').trim()))
      .filter(Boolean);

    setEditingItemId(item.id);
    setItemEditorTab('info');
    setFormName(item.n);
    setFormCat(item.cat);
    setFormPrice(item.pr);
    setFormBeforePrice(item.beforePrice || '');
    setFormDesc(item.d || '');
    setFormImage(item.img || '');
    setFormPrepTime(item.prepTime ? String(item.prepTime).replace(/\D/g, '') : '');
    setFormBadgeText(item.badges?.[0]?.text || '');
    setFormBadgeType((item.badges?.[0]?.type as 'red' | 'gold' | 'green' | 'accent') || 'accent');
    setFormAllergens(Array.isArray(item.allergens) ? item.allergens.join('، ') : item.allergens || '');
    setFormPublished(item.published !== false && item.available !== false);
    setFormNoDelivery(Boolean(item.noDelivery));
    setFormNoPickup(Boolean(item.noPickup));
    setFormSchedule(normalizeAvailabilitySchedule(item.availabilitySchedule));

    setHasVariableSizes(existingSizes.length > 0);
    setFormSizes(
      existingSizes.length > 0
        ? existingSizes
        : [
            { n: tr('سنجل', 'سینگڵ', 'Single'), p: '' },
            { n: tr('دبل', 'دەبڵ', 'Double'), p: '' },
          ]
    );

    setHasExtras(existingExtras.length > 0);
    setFormExtras(existingExtras.length > 0 ? existingExtras : [{ n: '', p: '' }]);

    setHasChoices(existingChoices.length > 0);
    setFormMaxChoices(Math.max(1, Number(item.maxChoices) || 1));
    setFormChoices(existingChoices.length > 0 ? existingChoices : ['']);

    setIsItemEditorOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const commitAppearanceDraft = async (
    patch: Partial<{
      lay: MenuLayout;
      themeMode: 'dark' | 'light' | 'auto';
      themePreset: string;
      themeShape: MenuThemeShape;
      color: string;
      bgColor: string;
    }>
  ) => {
    const merged = { ...appearanceDraftRef.current, ...patch };
    appearanceDraftRef.current = merged;
    if (colorSyncTimerRef.current !== null) {
      window.clearTimeout(colorSyncTimerRef.current);
      colorSyncTimerRef.current = null;
    }
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    const isCustom = merged.themePreset === 'custom' && resolvedPlan.perms.customColors;
    const nextPayload: Restaurant = {
      ...latestRest,
      lay: merged.lay,
      themeMode: merged.themeMode,
      themePreset: merged.themePreset,
      themeShape: merged.themeShape,
      color: merged.color,
      bgColor: isCustom ? (merged.bgColor.trim() || undefined) : undefined,
    };
    syncedRestRef.current = buildRestSignature(ensureRestaurantDefaults(nextPayload), rid);
    await putItemAndSync<Restaurant>(`restaurants/${rid}`, nextPayload);
  };

  const flushPendingAppearanceSave = async () => {
    if (colorSyncTimerRef.current !== null) {
      window.clearTimeout(colorSyncTimerRef.current);
      colorSyncTimerRef.current = null;
      await commitAppearanceDraft({});
    }
  };

  useEffect(() => {
    return () => {
      if (colorSyncTimerRef.current !== null) {
        window.clearTimeout(colorSyncTimerRef.current);
        colorSyncTimerRef.current = null;
        const merged = appearanceDraftRef.current;
        const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
        const isCustom = merged.themePreset === 'custom' && resolvedPlan.perms.customColors;
        putItem<Restaurant>(`restaurants/${rid}`, {
          ...latestRest,
          lay: merged.lay,
          themeMode: merged.themeMode,
          themePreset: merged.themePreset,
          themeShape: merged.themeShape,
          color: merged.color,
          bgColor: isCustom ? (merged.bgColor.trim() || undefined) : undefined,
        });
      }
    };
  }, [rid]);

  const handleInstantLayoutSelect = (layId: MenuLayout) => {
    if (!isLayoutAllowed(layId)) {
      showToast(tr('هذا النمط متاح في الباقات الأعلى 🔒', 'ئەم شێوازە لە پاکێجە باڵاکاندا بەردەستە 🔒', 'This layout is available on higher plans 🔒'));
      return;
    }
    setSelectedLayout(layId);
    void commitAppearanceDraft({ lay: layId });
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSelectThemeMode = (mode: 'dark' | 'light' | 'auto') => {
    if (!resolvedPlan.perms.lightDarkMode) {
      showToast(tr('تغيير المظهر الفاتح/الغامق غير متاح في باقتك الحالية 🔒', 'گۆڕینی دۆخی ڕووناک/تاریک لە پاکێجی ئێستاتدا بەردەست نییە 🔒', 'Light/dark mode switching is not available on your current plan 🔒'));
      return;
    }
    const effectiveMode = resolveEffectiveThemeMode(mode);
    const curPreset = appearanceDraftRef.current.themePreset;
    const isCustom = curPreset === 'custom' && resolvedPlan.perms.customColors;
    const allowed = getAllowedThemesForPlan(resolvedPlan);
    const nextPreset = isCustom
      ? 'custom'
      : allowed.some((t) => t.id === curPreset)
      ? curPreset
      : allowed[0]?.id || (effectiveMode === 'light' ? 'clean-light' : 'emerald-dark');
    const chosenTheme = getMenuThemeById(nextPreset === 'custom' ? undefined : nextPreset, effectiveMode);
    const resolvedPreset = isCustom ? 'custom' : chosenTheme.id;
    const resolvedColor = isCustom ? appearanceDraftRef.current.color : chosenTheme.brand;
    const resolvedBg = isCustom ? appearanceDraftRef.current.bgColor : '';
    setMenuThemeMode(mode);
    setMenuThemePreset(resolvedPreset);
    if (!isCustom) {
      setRestColor(resolvedColor);
      setRestBgColor('');
    }
    void commitAppearanceDraft({
      themeMode: mode,
      themePreset: resolvedPreset,
      color: resolvedColor,
      bgColor: resolvedBg,
    });
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSelectDashboardThemeMode = async (mode: 'dark' | 'light' | 'auto') => {
    setDashboardThemeMode(mode);
    applyTheme(buildThemeForMode(mode, getTheme()), { silent: true });
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    await putItemAndSync<Restaurant>(`restaurants/${rid}`, {
      ...latestRest,
      dashboardThemeMode: mode,
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSelectMenuTheme = (presetId: string) => {
    if (presetId === 'custom') {
      if (!resolvedPlan.perms.customColors) {
        openUpgradeModal('vip');
        return;
      }
      const nextBrand = (appearanceDraftRef.current.color || restColor).trim() || '#10B981';
      const nextBg = (appearanceDraftRef.current.bgColor || restBgColor).trim();
      setMenuThemePreset('custom');
      setRestColor(nextBrand);
      void commitAppearanceDraft({
        themePreset: 'custom',
        color: nextBrand,
        bgColor: nextBg,
      });
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
      return;
    }

    const allowed = getAllowedThemesForPlan(resolvedPlan);
    if (!allowed.some((t) => t.id === presetId)) {
      showToast(tr('هذا المظهر متاح في الباقات الأعلى 🔒', 'ئەم ڕووکارە لە پاکێجە باڵاکاندا بەردەستە 🔒', 'This theme is available on higher plans 🔒'));
      return;
    }
    const effectiveMode = resolveEffectiveThemeMode(appearanceDraftRef.current.themeMode);
    const chosenTheme = getMenuThemeById(presetId, effectiveMode);
    const themeLabel = getLocalizedThemeInfo(chosenTheme, lang).name;
    const pairedShape = getSeasonalPairedShape(chosenTheme.id);
    setMenuThemePreset(chosenTheme.id);
    setRestColor(chosenTheme.brand);
    setRestBgColor('');
    if (pairedShape) {
      setMenuThemeShape(pairedShape);
    }
    void commitAppearanceDraft({
      themePreset: chosenTheme.id,
      color: chosenTheme.brand,
      bgColor: '',
      ...(pairedShape ? { themeShape: pairedShape } : {}),
    });
    showToast(
      pairedShape
        ? tr(
            `تم تفعيل ${themeLabel} بكامل أشكاله وأنيميشنه ✓`,
            `${themeLabel} بە هەموو شێواز و ئەنیمەیشنەکانیەوە چالاک کرا ✓`,
            `${themeLabel} activated with full seasonal effects ✓`
          )
        : tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied')
    );
  };

  const handleUpdateCustomColors = (nextBrand?: string, nextBg?: string) => {
    if (!resolvedPlan.perms.customColors) {
      openUpgradeModal('vip');
      return;
    }
    const curDraft = appearanceDraftRef.current;
    const resolvedBrand = (nextBrand !== undefined ? nextBrand : curDraft.color).trim() || '#10B981';
    const resolvedBg = nextBg !== undefined ? nextBg.trim() : curDraft.bgColor.trim();
    appearanceDraftRef.current = {
      ...curDraft,
      themePreset: 'custom',
      color: resolvedBrand,
      bgColor: resolvedBg,
    };
    setMenuThemePreset('custom');
    if (nextBrand !== undefined) setRestColor(resolvedBrand);
    if (nextBg !== undefined) setRestBgColor(resolvedBg);
    if (colorSyncTimerRef.current !== null) {
      window.clearTimeout(colorSyncTimerRef.current);
    }
    colorSyncTimerRef.current = window.setTimeout(() => {
      colorSyncTimerRef.current = null;
      void commitAppearanceDraft({});
    }, 180);
  };

  const handleSelectThemeShape = (shapeId: MenuThemeShape) => {
    const pairedThemeId = getSeasonalPairedTheme(shapeId);
    setMenuThemeShape(shapeId);
    if (pairedThemeId) {
      const effectiveMode = resolveEffectiveThemeMode(appearanceDraftRef.current.themeMode);
      const chosenTheme = getMenuThemeById(pairedThemeId, effectiveMode);
      const themeLabel = getLocalizedThemeInfo(chosenTheme, lang).name;
      setMenuThemePreset(chosenTheme.id);
      setRestColor(chosenTheme.brand);
      setRestBgColor('');
      void commitAppearanceDraft({
        themeShape: shapeId,
        themePreset: chosenTheme.id,
        color: chosenTheme.brand,
        bgColor: '',
      });
      showToast(
        tr(
          `تم تفعيل ${themeLabel} مع الأشكال والأنيميشن ✓`,
          `${themeLabel} لەگەڵ شێواز و ئەنیمەیشنەکان چالاک کرا ✓`,
          `${themeLabel} activated with shapes & animations ✓`
        )
      );
      return;
    }
    void commitAppearanceDraft({ themeShape: shapeId });
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSaveAppearance = async () => {
    if (appearanceSaving) return;
    setAppearanceSaving(true);
    try {
      await commitAppearanceDraft({});
      onRefresh();
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
    } finally {
      setAppearanceSaving(false);
    }
  };

  const handleUpdateQrDesign = async (patch: Partial<NonNullable<Restaurant['qrDesign']>>) => {
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    const nextQrDesign = { ...(latestRest.qrDesign || {}), ...patch };
    await putItemAndSync<Restaurant>(`restaurants/${rid}`, {
      ...latestRest,
      qrDesign: nextQrDesign,
    });
    onRefresh();
  };

  const handleCurrencyChange = (nextCurrency: string) => {
    setRestCurrency(nextCurrency);
    const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
    putItem<Restaurant>(`restaurants/${rid}`, {
      ...latestRest,
      currency: nextCurrency,
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const applyTimeToOpenDays = (fromTime: string, toTime: string) => {
    setWeeklyHours((prev) => {
      const next = { ...prev };
      WEEK_DAYS_ORDER.forEach(({ key }) => {
        if (next[key]?.open) {
          next[key] = { ...next[key], from: fromTime, to: toTime };
        }
      });
      return next;
    });
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const handleSaveSettings = () => {
    const cleanSlug = sanitizeSlug(restSlug);
    if (resolvedPlan.perms.customSlug && cleanSlug) {
      if (cleanSlug.length < 3 || isReservedSlug(cleanSlug)) {
        showToast(
          tr(
            'الرابط المخصص يجب أن يتكون من 3 أحرف على الأقل وألا يكون اسماً محجوزاً',
            'بەستەری تایبەت دەبێت لانیکەم لە ٣ پیت پێکهاتبێت و ناوێکی پارێزراو نەبێت',
            'Custom link must be at least 3 characters and not reserved'
          )
        );
        return;
      }
      if (!isSlugAvailable(cleanSlug, rid)) {
        showToast(
          tr(
            'الرابط المخصص مستخدم بالفعل من قِبل مشروع آخر، اختر اسماً مختلفاً',
            'بەستەری تایبەت پێشتر لەلایەن پڕۆژەیەکی ترەوە بەکارهێنراوە، ناوێکی تر هەڵبژێرە',
            'Custom link is already taken by another business, choose another name'
          )
        );
        return;
      }
    }

    if (orderChannel !== 'telegram' && !restWa.trim() && !restPhone.trim()) {
      showToast(
        tr(
          'يرجى إدخال رقم الواتساب لاستقبال الطلبات أو اختيار قناة تيليجرام فقط',
          'تکایە ژمارەی واتساپ بنووسە بۆ وەرگرتنی داواکاری یان تەنها کەناڵی تێلێگرام هەڵبژێرە',
          'Please enter a WhatsApp number for orders or select Telegram-only channel'
        )
      );
      return;
    }

    triggerAjaxConfirm(
      tr('حفظ إعدادات المشروع والمنيو', 'پاشەکەوتکردنی ڕێکخستنەکانی پڕۆژە و مینیۆ', 'Save Store & Menu Settings'),
      tr(
        'هل أنت متأكد من حفظ جميع الإعدادات وتطبيقها مباشرة؟',
        'دڵنیایت لە پاشەکەوتکردن و جێبەجێکردنی ڕاستەوخۆی هەموو ڕێکخستنەکان؟',
        'Save and apply all settings live?'
      ),
      'info',
      tr('تأكيد الحفظ', 'دڵنیاکردنەوەی پاشەکەوتکردن', 'Confirm Save'),
      async () => {
        const latestRest = getItem<Restaurant>(`restaurants/${rid}`) || rest;
        const cleanZones = deliveryZonesState
          .filter((z) => z.area.trim())
          .map((z) => {
            const areaLabel = z.area.trim();
            const baseFee = Math.max(0, Number(z.fee) || 0);
            const nestedCities = (z.cities || [])
              .map((c) => ({
                name: c.name.trim(),
                fee: Math.max(0, Number(c.fee) || 0),
              }))
              .filter((c) => c.name);
            return {
              area: areaLabel,
              fee: baseFee,
              cities: nestedCities.length > 0 ? nestedCities : [{ name: areaLabel, fee: baseFee }],
            };
          });
        const isCustomTheme = menuThemePreset === 'custom' && resolvedPlan.perms.customColors;
        const chosenTheme = getMenuThemeById(isCustomTheme ? undefined : menuThemePreset, menuThemeMode);
        const firstOpenDay = WEEK_DAYS_ORDER.map((d) => weeklyHours[d.key]).find((d) => d?.open);
        const updatedPayload: Restaurant = {
          ...latestRest,
          projectType: restProjectType,
          lay: isLayoutAllowed(selectedLayout) ? selectedLayout : 'list',
          themeMode: menuThemeMode,
          ...(latestRest.dashboardThemeMode ? { dashboardThemeMode } : {}),
          themePreset: isCustomTheme ? 'custom' : chosenTheme.id,
          themeShape: menuThemeShape,
          color: isCustomTheme ? (restColor.trim() || chosenTheme.brand) : chosenTheme.brand,
          bgColor: isCustomTheme ? (restBgColor.trim() || undefined) : undefined,
          n: restName.trim() || latestRest.n,
          tagline: restTagline.trim(),
          aboutText: aboutTextInput.trim(),
          taxNote: taxNoteInput.trim(),
          currency: restCurrency || 'د.ع',
          a: restActive ? 1 : 0,
          ...(resolvedPlan.perms.customSlug
            ? {
                slug: cleanSlug || latestRest.slug || generateRandomMenuCode(),
                subdomain: subdomainEnabled ? (cleanSlug || '') : '',
              }
            : {
                slug: latestRest.slug || generateRandomMenuCode(),
                subdomain: '',
              }),
          enabledOrderTypes: {
            ...(latestRest.enabledOrderTypes || {}),
            delivery: resolvedPlan.perms.deliveryOrders ? allowDelivery : false,
            pickup: resolvedPlan.perms.pickupOrders ? allowPickup : false,
            table: resolvedPlan.perms.tableOrders ? allowTable : false,
          },
          acceptOrdersWhenClosed: acceptClosedOrders,
          orderChannel,
          telegramNotificationsEnabled: orderChannel !== 'whatsapp',
          ph: restPhone.trim() || latestRest.ph,
          address: restAddress.trim(),
          mapUrl: restMapUrl.trim(),
          googleReviewUrl: restGoogleReviewUrl.trim(),
          logo: logoUrlInput.trim() || undefined,
          coverImages: coverUrlInput.trim() ? [coverUrlInput.trim()] : [],
          h: {
            m: workMode,
            f: firstOpenDay?.from || workFrom,
            t: firstOpenDay?.to || workTo,
          },
          weeklyHours,
          deliveryZones: cleanZones,
          social: {
            ...latestRest.social,
            whatsapp: restWa.trim() || restPhone.trim() || latestRest.ph,
            instagram: restInstagram.trim(),
            facebook: restFacebook.trim(),
            tiktok: restTiktok.trim(),
          },
        };

        await putItemAndSync<Restaurant>(`restaurants/${rid}`, updatedPayload);
        onRefresh();
      },
      tr(
        'تم حفظ وتفعيل جميع الإعدادات على الخادم بنجاح ✓',
        'هەموو ڕێکخستنەکان بە سەرکەوتوویی لەسەر سێرڤەر پاشەکەوت و چالاک کران ✓',
        'All settings saved and activated on the server ✓'
      )
    );
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: string) => {
    const target = allOrders.find((x) => x.id === orderId);
    if (!target) return;
    const normalizedStatus = nextStatus === 'new' ? 'pending' : nextStatus;
    putItem<Order>(`orders/${orderId}`, {
      ...target,
      st: nextStatus,
      status: normalizedStatus as OrderStatus,
    });
    onRefresh();
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان جێبەجێ کران', 'Changes applied'));
  };

  const filteredCategories = allCategories.filter((c) => {
    if (!searchCatQuery.trim()) return true;
    return (
      c.n.toLowerCase().includes(searchCatQuery.trim().toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchCatQuery.trim().toLowerCase()))
    );
  });

  const filteredItems = allItems.filter((i) => {
    const matchesCat = filterCatId === 'all' || i.cat === filterCatId;
    const matchesQuery =
      !searchItemQuery.trim() ||
      i.n.toLowerCase().includes(searchItemQuery.trim().toLowerCase()) ||
      (i.d && i.d.toLowerCase().includes(searchItemQuery.trim().toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const filteredOrders = allOrders.filter((o) => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'new') return o.st === 'new' || o.status === 'pending';
    return o.st === orderFilter || o.status === orderFilter;
  });

  const fullSubdomainUrl = getFullSubdomainUrl(rest, site, resolvedPlan);
  const publicPath = getPublicMenuUrlPath(rest, resolvedPlan);
  const liveMenuUrl = fullSubdomainUrl || `${window.location.origin}${publicPath}`;

  return {
    session,
    lang,
    setLang,
    isRtl,
    locale,
    tr,
    navTabs: getLocalizedNavTabs(lang),
    layoutDefinitions: getLocalizedLayoutDefinitions(lang),
    weekDaysOrder: getLocalizedWeekDaysOrder(lang),
    site,
    baseDomain,
    supportPhone,
    supportWaHref,
    customTabLabel,
    mainRid,
    activeRid,
    rid,
    mainRest,
    rest,
    branchesList,
    switchActiveBranch,
    createBranch,
    cloneMainMenuToBranch,
    deleteBranch,
    resolvedPlan,
    plans,
    purchaseModalPlan,
    setPurchaseModalPlan,
    openUpgradeModal,
    terms,
    isLayoutAllowed,
    currency,
    activeTab,
    setActiveTab,
    drawerOpen,
    setDrawerOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    ajaxDialog,
    setAjaxDialog,
    allCategories,
    allItems,
    allOrders,
    newOrdersCount,
    filteredCategories,
    filteredItems,
    filteredOrders,
    fullSubdomainUrl,
    subdomainEnabled,
    publicPath,
    liveMenuUrl,
    copyLink,
    shareModalOpen,
    setShareModalOpen,
    openShareModal,
    onNavigate,
    onLogout,
    onRefresh,
    showToast,
    // Custom Subdomain
    restSlug,
    setRestSlug,
    slugCheckState,
    checkSubdomainAvailability,
    // Addons
    addonsState,
    addonCategoryFilter,
    setAddonCategoryFilter,
    addonSearchQuery,
    setAddonSearchQuery,
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
    // Categories
    searchCatQuery,
    setSearchCatQuery,
    showCatModal,
    setShowCatModal,
    editingCatId,
    setEditingCatId,
    catNameInput,
    setCatNameInput,
    catSubtitleInput,
    setCatSubtitleInput,
    catEmojiInput,
    setCatEmojiInput,
    catImageInput,
    setCatImageInput,
    catPublishedInput,
    setCatPublishedInput,
    catScheduleInput,
    setCatScheduleInput,
    openNewCategoryModal,
    handleToggleCategoryVisibility,
    handleSaveCategory,
    handleOpenEditCategory,
    handleDeleteCategory,
    handleReorderCategories,
    handleSaveCategorySchedule,
    // Items
    searchItemQuery,
    setSearchItemQuery,
    filterCatId,
    setFilterCatId,
    isItemEditorOpen,
    setIsItemEditorOpen,
    itemEditorTab,
    setItemEditorTab,
    editingItemId,
    categoryScrollRef,
    scrollCategoryPills,
    formCat,
    setFormCat,
    formName,
    setFormName,
    formPrice,
    setFormPrice,
    formBeforePrice,
    setFormBeforePrice,
    formDesc,
    setFormDesc,
    formImage,
    setFormImage,
    formPrepTime,
    setFormPrepTime,
    formBadgeText,
    setFormBadgeText,
    formBadgeType,
    setFormBadgeType,
    formAllergens,
    setFormAllergens,
    formPublished,
    setFormPublished,
    formNoDelivery,
    setFormNoDelivery,
    formNoPickup,
    setFormNoPickup,
    formSchedule,
    setFormSchedule,
    hasVariableSizes,
    setHasVariableSizes,
    formSizes,
    setFormSizes,
    hasExtras,
    setHasExtras,
    formExtras,
    setFormExtras,
    hasChoices,
    setHasChoices,
    formMaxChoices,
    setFormMaxChoices,
    formChoices,
    setFormChoices,
    showBatchModal,
    setShowBatchModal,
    batchLinesInput,
    setBatchLinesInput,
    openNewItemEditor,
    openBatchModal,
    handleSaveItem,
    handleQuickUpdateItemPrice,
    handleDeleteItem,
    handleBatchAddItems,
    handleEditItem,
    handleToggleItemVisibility,
    handleReorderItems,
    handleSaveItemSchedule,
    handleDeviceImageUpload,
    mediaLibraryItems,
    uploadImagesToLibrary,
    removeMediaLibraryItem,
    // Appearance & Settings
    selectedLayout,
    menuThemeMode,
    handleSelectThemeMode,
    dashboardThemeMode,
    handleSelectDashboardThemeMode,
    menuThemePreset,
    handleSelectMenuTheme,
    handleUpdateCustomColors,
    menuThemeShape,
    handleSelectThemeShape,
    restColor,
    setRestColor,
    restBgColor,
    setRestBgColor,
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
    handleInstantLayoutSelect,
    handleSaveAppearance,
    flushPendingAppearanceSave,
    appearanceSaving,
    handleUpdateQrDesign,
    handleCurrencyChange,
    handleSaveSettings,
    orderFilter,
    setOrderFilter,
    handleUpdateOrderStatus,
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
  };
}

export type DashboardContextValue = ReturnType<typeof useDashboardController>;

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider: React.FC<{
  valueProps: DashboardViewProps;
  children: React.ReactNode;
}> = ({ valueProps, children }) => {
  const controller = useDashboardController(valueProps);
  return <DashboardContext.Provider value={controller}>{children}</DashboardContext.Provider>;
};

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return ctx;
}
