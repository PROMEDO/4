/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Lightbulb,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { getLocalizedPlanName } from '../../utils/plans';
import { formatNumber } from '../../utils/storage';
import { DEFAULT_MEDIA_ASSETS } from '../../utils/businessDefaults';
import { Ml7Text } from '../../components/Ml7Text';
import { useDashboard } from './DashboardContext';

export const HomePage: React.FC = () => {
  const { t, isRtl, lang } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const {
    rest,
    resolvedPlan,
    terms,
    tr,
    allCategories,
    allItems,
    allOrders,
    currency,
    setActiveTab,
    activeRid,
    mainRid,
  } = useDashboard();

  const defaultMedia =
    terms.isStore ? DEFAULT_MEDIA_ASSETS.store : DEFAULT_MEDIA_ASSETS.restaurant;
  const hasCustomLogo = Boolean(rest.logo && rest.logo !== defaultMedia.logo);
  const hasCustomBanner = Boolean(rest.coverImages?.[0] && rest.coverImages[0] !== defaultMedia.banner);
  const hasRichBio = Boolean(rest.aboutText && rest.aboutText.trim().length >= 35);
  const hasSocialLinks = Boolean(
    rest.social?.instagram || rest.social?.tiktok || rest.social?.facebook || rest.mapUrl
  );
  const hasCustomSlugConfigured = Boolean(rest.slug || rest.subdomain);
  const itemsWithPhotoCount = allItems.filter((item) => Boolean(item.img && item.img.trim())).length;
  const hasItemsPhotos = allItems.length >= 3 && itemsWithPhotoCount >= Math.min(allItems.length, 3);
  const hasWhatsappConfigured = Boolean(
    (rest.ph && rest.ph.trim().length >= 8) ||
      (rest.social?.whatsapp && rest.social.whatsapp.trim().length >= 8)
  );
  const hasWorkHoursConfigured = Boolean(rest.weeklyHours && Object.keys(rest.weeklyHours).length > 0);
  const hasDeliveryZonesConfigured = Boolean(
    Array.isArray(rest.deliveryZones) && rest.deliveryZones.length > 0
  );
  const hasTelegramConnected = Boolean(rest.telegramChatId && String(rest.telegramChatId).trim());
  const hasMapLocation = Boolean(rest.mapUrl && rest.mapUrl.trim());

  interface MenuTip {
    id: string;
    done: boolean;
    label: string;
    targetTab: 'cats' | 'menu' | 'set' | 'qr' | 'appearance' | 'telegram';
  }

  const dynamicTips: MenuTip[] = [
    {
      id: 'cats',
      done: allCategories.length >= 3,
      label:
        allCategories.length >= 3
          ? tr(
              `الأقسام منظمة (${allCategories.length} أقسام)`,
              `بەشەکان ڕێکخراون (${allCategories.length} بەش)`,
              `Categories organized (${allCategories.length} categories)`
            )
          : tr(
              `أضف 3 أقسام على الأقل (${allCategories.length}/3)`,
              `لانیکەم ٣ بەش زیاد بکە (${allCategories.length}/3)`,
              `Add at least 3 categories (${allCategories.length}/3)`
            ),
      targetTab: 'cats',
    },
    {
      id: 'items',
      done: allItems.length >= 6,
      label:
        allItems.length >= 6
          ? tr(
              `${terms.itemsPlural} مكتملة (${allItems.length})`,
              `${terms.itemsPlural} تەواون (${allItems.length})`,
              `${terms.itemsPlural} complete (${allItems.length})`
            )
          : tr(
              `أضف 6 ${terms.itemsPlural} على الأقل (${allItems.length}/6)`,
              `لانیکەم ٦ ${terms.itemsPlural} زیاد بکە (${allItems.length}/6)`,
              `Add at least 6 ${terms.itemsPlural} (${allItems.length}/6)`
            ),
      targetTab: 'menu',
    },
    {
      id: 'itemImages',
      done: hasItemsPhotos,
      label: hasItemsPhotos
        ? tr('تمت إضافة صور واضحة للأصناف', 'وێنەی ڕوون بۆ بڕگەکان زیاد کراوە', 'Clear item photos added')
        : tr(
            `أضف صوراً للأصناف (${Math.min(itemsWithPhotoCount, 3)}/3)`,
            `وێنە بۆ بڕگەکان زیاد بکە (${Math.min(itemsWithPhotoCount, 3)}/3)`,
            `Add photos to items (${Math.min(itemsWithPhotoCount, 3)}/3)`
          ),
      targetTab: 'menu',
    },
    {
      id: 'whatsapp',
      done: hasWhatsappConfigured,
      label: hasWhatsappConfigured
        ? tr('رقم الواتساب لاستقبال الطلبات مفعّل', 'ژمارەی واتسئەپ بۆ وەرگرتنی داواکاری چالاکە', 'WhatsApp number enabled for orders')
        : tr('إضافة رقم واتساب لاستقبال الطلبات', 'ژمارەی واتسئەپ زیاد بکە بۆ وەرگرتنی داواکاری', 'Add WhatsApp number to receive orders'),
      targetTab: 'set',
    },
    {
      id: 'media',
      done: hasCustomLogo && hasCustomBanner,
      label:
        hasCustomLogo && hasCustomBanner
          ? tr('تم رفع الشعار والغلاف', 'لۆگۆ و وێنەی بەرگ بارکران', 'Logo & cover banner uploaded')
          : tr('رفع الشعار وصورة الغلاف', 'لۆگۆ و وێنەی بەرگ بار بکە', 'Upload logo & cover banner'),
      targetTab: 'set',
    },
    {
      id: 'hours',
      done: hasWorkHoursConfigured,
      label: hasWorkHoursConfigured
        ? tr('أوقات وساعات الدوام مضبوطة', 'کاتژمێرەکانی کارکردن ڕێکخراون', 'Opening hours configured')
        : tr('ضبط أوقات وساعات الدوام', 'کاتژمێرەکانی کارکردن ڕێک بخە', 'Set opening hours'),
      targetTab: 'set',
    },
    ...(rest.enabledOrderTypes?.delivery !== false
      ? [
          {
            id: 'deliveryZones',
            done: hasDeliveryZonesConfigured,
            label: hasDeliveryZonesConfigured
              ? tr('مناطق وأسعار التوصيل محددة', 'ناوچە و نرخی گەیاندن دیاریکراون', 'Delivery zones & fees configured')
              : tr('تحديد مناطق وأسعار التوصيل', 'ناوچە و نرخی گەیاندن دیاری بکە', 'Set delivery zones & fees'),
            targetTab: 'set' as const,
          },
        ]
      : []),
    {
      id: 'telegram',
      done: hasTelegramConnected,
      label: hasTelegramConnected
        ? tr('إشعارات بوت تيليجرام مفعّلة', 'ئاگادارکردنەوەی بۆتی تێلێگرام چالاکە', 'Telegram bot notifications enabled')
        : tr('ربط بوت تيليجرام لتنبيهات الطلبات', 'بۆتی تێلێگرام ببەستەرەوە بۆ ئاگادارکردنەوەی داواکاری', 'Connect Telegram bot for order alerts'),
      targetTab: 'telegram',
    },
    {
      id: 'mapLocation',
      done: hasMapLocation,
      label: hasMapLocation
        ? tr('تم تحديد الموقع على الخريطة', 'شوێن لەسەر نەخشە دیاریکراوە', 'Map location configured')
        : tr('إضافة رابط الموقع على الخريطة', 'لینکی شوێن لەسەر نەخشە زیاد بکە', 'Add map location link'),
      targetTab: 'set',
    },
    {
      id: 'bio',
      done: hasRichBio && hasSocialLinks,
      label:
        hasRichBio && hasSocialLinks
          ? tr('النبذة والروابط مكتملة', 'پوختە و لینکەکان تەواون', 'Bio & social links completed')
          : tr('إكمال النبذة وروابط التواصل', 'پوختە و لینکەکانی پەیوەندی تەواو بکە', 'Complete bio & social links'),
      targetTab: 'set',
    },
  ];

  if (resolvedPlan.perms.customSlug) {
    dynamicTips.push({
      id: 'slug',
      done: hasCustomSlugConfigured,
      label: hasCustomSlugConfigured
        ? tr('الرابط الفرعي المخصص مفعّل', 'بەستەری لاوەکی تایبەت چالاکە', 'Custom subdomain enabled')
        : tr('حجز الرابط الفرعي المخصص', 'بەستەری لاوەکی تایبەت تۆمار بکە', 'Reserve your custom subdomain'),
      targetTab: 'set',
    });
  }

  const orderedTips: MenuTip[] = [
    ...dynamicTips.filter((tip) => !tip.done),
    ...dynamicTips.filter((tip) => tip.done),
  ];

  const completedTipsCount = dynamicTips.filter((x) => x.done).length;
  const readinessPercent = Math.round((completedTipsCount / dynamicTips.length) * 100);
  const allTipsCompleted = completedTipsCount >= dynamicTips.length;

  const nowMs = Date.now();
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const validOrders = allOrders.filter(
    (o) => o.st !== 'cancelled' && o.status !== 'cancelled'
  );
  const netSalesAmount = validOrders.reduce(
    (sum, o) => sum + (Number(o.tot ?? o.total ?? 0) || 0),
    0
  );

  const currentOrders = validOrders.filter((o) => {
    const raw = o.at ?? o.createdAt;
    const ms = typeof raw === 'number' ? raw : raw ? new Date(raw).getTime() : 0;
    return ms > 0 && nowMs - ms <= windowMs;
  });
  const prevOrders = validOrders.filter((o) => {
    const raw = o.at ?? o.createdAt;
    const ms = typeof raw === 'number' ? raw : raw ? new Date(raw).getTime() : 0;
    return ms > 0 && nowMs - ms > windowMs && nowMs - ms <= windowMs * 2;
  });

  const currentSales = currentOrders.reduce(
    (sum, o) => sum + (Number(o.tot ?? o.total ?? 0) || 0),
    0
  );
  const prevSales = prevOrders.reduce(
    (sum, o) => sum + (Number(o.tot ?? o.total ?? 0) || 0),
    0
  );

  const calcChangePct = (curr: number, prev: number) => {
    if (prev > 0) return ((curr - prev) / prev) * 100;
    if (curr > 0) return 100;
    return 0;
  };

  const visitsCount = Math.max(0, Number(rest.v || 0));
  const prevVisitsCount = Math.max(0, Number((rest as { vPrev?: number }).vPrev || 0));
  const visitsPct = calcChangePct(visitsCount, prevVisitsCount);
  const ordersPct = calcChangePct(currentOrders.length, prevOrders.length);
  const salesPct = calcChangePct(currentSales, prevSales);

  const homeStats = [
    {
      id: 'visits',
      label: tr('عدد زيارات القائمة', 'ژمارەی سەردانەکانی مینیۆ', 'Menu Visits'),
      value: formatNumber(visitsCount),
      pct: visitsPct,
      Icon: Users,
    },
    {
      id: 'orders',
      label: tr('صافي الطلبات', 'کۆی داواکارییەکان', 'Net Orders'),
      value: formatNumber(validOrders.length),
      pct: ordersPct,
      Icon: ShoppingBag,
    },
    {
      id: 'sales',
      label: tr('صافي المبيعات', 'کۆی فرۆشتنەکان', 'Net Sales'),
      value: `${formatNumber(netSalesAmount)} ${currency}`,
      pct: salesPct,
      Icon: Banknote,
    },
  ];

  const activePlanName = getLocalizedPlanName(resolvedPlan.plan, lang);

  return (
    <div className="mp-home-wrap">
      {/* Floating Welcome Header (transparent to main grid background) */}
      <div className="mp-home-welcome">
        <img
          src={rest.logo}
          alt={rest.n}
          referrerPolicy="no-referrer"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            objectFit: 'cover',
            border: '2px solid var(--brand)',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          {activeRid !== mainRid && (
            <div style={{ fontSize: '12px', color: 'var(--brand-ink, #34D399)', fontWeight: 800, marginBottom: '2px' }}>
              {tr(`إدارة فرع: ${rest.branchName || rest.n}`, `بەڕێوەبردنی لق: ${rest.branchName || rest.n}`, `Managing branch: ${rest.branchName || rest.n}`)}
            </div>
          )}
          <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(19px, 3vw, 24px)', fontWeight: 900, color: 'var(--ink)' }}>
            {tr(`أهلاً بك في ${rest.n} 👋`, `بەخێربێیت بۆ ${rest.n} 👋`, `Welcome to ${rest.n} 👋`)}
          </h1>
          <div className="mp-home-welcome-meta">
            <span>
              {t.activePlanLabel}: <b style={{ color: 'var(--brand-ink, #34D399)' }}>{activePlanName}</b>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Organized Transparent KPI Rows */}
      <section className="mp-home-stats-section" aria-label={tr('ملخص الأداء', 'پوختەی کارایی', 'Performance Summary')}>
        <div className="mp-home-stats-list">
          {homeStats.map((stat, idx) => {
            const IconComp = stat.Icon;
            const isDown = stat.pct < 0;
            const TrendIcon = isDown ? TrendingDown : TrendingUp;
            const trendColor = isDown ? '#ef4444' : '#10b981';
            const formattedPct = `${Math.abs(stat.pct).toFixed(2)}%`;

            return (
              <motion.div
                key={stat.id}
                className="mp-home-stat-row"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.85,
                  delay: prefersReducedMotion ? 0 : 0.05 + idx * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="mp-home-stat-main">
                  <span className="mp-home-stat-icon" aria-hidden="true">
                    <IconComp size={20} strokeWidth={1.85} />
                  </span>
                  <div className="mp-home-stat-text">
                    <div className="mp-home-stat-value tabular-nums">{stat.value}</div>
                    <div className="mp-home-stat-label">{stat.label}</div>
                  </div>
                </div>

                <div className="mp-home-stat-trend tabular-nums" style={{ color: trendColor }}>
                  <span>{formattedPct}</span>
                  <TrendIcon size={15} strokeWidth={2.2} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Checklist Section: transparent & borderless */}
      <section className="mp-home-section">
        <div className="mp-home-section-head">
          <span
            className="mp-home-section-badge"
            style={{
              background: allTipsCompleted ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
              color: allTipsCompleted ? '#10b981' : '#f59e0b',
            }}
          >
            {allTipsCompleted ? <CheckCircle2 size={15} /> : <Lightbulb size={15} />}
            <span>{tr(`نسبة الاكتمال: ${readinessPercent}%`, `ڕێژەی تەواوبوون: ${readinessPercent}%`, `Readiness: ${readinessPercent}%`)}</span>
          </span>

          <h2 className="mp-home-section-title">
            <Ml7Text
              text={tr('خطوات استكمال جاهزية المنيو 💡', 'هەنگاوەکانی تەواوکردنی ئامادەیی مینیۆ 💡', 'Menu Readiness Checklist 💡')}
              mode="mount"
              delay={0.08}
              stagger={0.12}
              isRtl={isRtl}
            />
          </h2>

          <motion.p
            className="mp-home-section-sub"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {allTipsCompleted
              ? tr('جميع خطوات جاهزية المنيو مكتملة وجاهزة لاستقبال طلبات الزبائن.', 'هەموو هەنگاوەکانی ئامادەیی مینیۆ تەواون و ئامادەیە بۆ وەرگرتنی داواکاری کڕیاران.', 'All checklist steps are complete and your menu is ready for orders.')
              : t.tipsSectionTitle}
          </motion.p>
        </div>

        <div className="mp-home-tips-list">
          {orderedTips.map((tip, idx) => (
            <motion.div
              key={tip.id}
              className="mp-home-tip-row"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.85,
                delay: prefersReducedMotion ? 0 : Math.min(idx * 0.08, 0.4),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className="mp-home-tip-icon" aria-hidden="true">
                {tip.done ? (
                  <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                ) : (
                  <Sparkles size={20} style={{ color: '#f59e0b' }} />
                )}
              </span>

              <button
                type="button"
                onClick={() => setActiveTab(tip.targetTab)}
                className={`btn s mp-home-tip-btn ${tip.done ? 'is-done' : ''}`}
              >
                <span>{tip.label}</span>
                {!tip.done && <ArrowUpRight size={15} style={{ flexShrink: 0 }} />}
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
