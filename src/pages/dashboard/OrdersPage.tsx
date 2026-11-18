/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  MapPin,
  MessageCircle,
  Phone,
  Store,
  Truck,
  User,
  Utensils,
  X,
} from 'lucide-react';
import { Order, SupportedLanguage } from '../../types';
import { trByLang } from '../../utils/i18n';
import { copyTextReliable, formatNumber, waLink } from '../../utils/storage';
import { surfaceCardStyle, useDashboard } from './DashboardContext';

function formatOrderDayAndTime(order: Order, locale: string): string {
  const rawTs = Number(order.at || 0);
  const parsedCreatedAt = !rawTs && order.createdAt ? Date.parse(order.createdAt) : NaN;
  const ts = rawTs > 0 ? rawTs : Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : 0;

  if (ts > 0) {
    const dt = new Date(ts);
    try {
      const dayPart = dt.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
      });
      const timePart = dt.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dayPart} • ${timePart}`;
    } catch {
      return `${dt.toLocaleDateString()} • ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  return order.createdAt || '—';
}

function getOrderTypeInfo(order: Order, lang: SupportedLanguage) {
  const rawType = order.type || order.cu?.orderType || 'delivery';
  const tableVal = String(order.table || order.cu?.table || '').trim();

  if (rawType === 'table') {
    const base = trByLang(lang, 'طاولة', 'مێز', 'Table');
    return {
      key: 'table' as const,
      label: tableVal ? `${base} (${tableVal})` : base,
      Icon: Utensils,
    };
  }
  if (rawType === 'pickup') {
    return {
      key: 'pickup' as const,
      label: trByLang(lang, 'استلام', 'وەرگرتن', 'Pickup'),
      Icon: Store,
    };
  }
  return {
    key: 'delivery' as const,
    label: trByLang(lang, 'توصيل', 'گەیاندن', 'Delivery'),
    Icon: Truck,
  };
}

function getOrderStatusOptions(lang: SupportedLanguage) {
  return [
    { value: 'new', text: trByLang(lang, 'جديد', 'نوێ', 'New'), bg: '#ea580c' },
    { value: 'preparing', text: trByLang(lang, 'قيد التجهيز', 'لە ئامادەکردندایە', 'Preparing'), bg: '#f59e0b' },
    { value: 'ready', text: trByLang(lang, 'جاهز', 'ئامادەیە', 'Ready'), bg: '#3b82f6' },
    { value: 'delivering', text: trByLang(lang, 'قيد التوصيل', 'لە ڕێگای گەیاندندایە', 'Delivering'), bg: '#8b5cf6' },
    { value: 'completed', text: trByLang(lang, 'مكتمل', 'تەواوبوو', 'Completed'), bg: '#10b981' },
    { value: 'cancelled', text: trByLang(lang, 'ملغي', 'هەڵوەشاوە', 'Cancelled'), bg: '#ef4444' },
  ] as const;
}

function getNormalizedOrderStatus(order: Order): string {
  const raw = String(order.st || order.status || 'new').toLowerCase();
  if (raw === 'pending' || raw === 'new') return 'new';
  if (raw === 'preparing') return 'preparing';
  if (raw === 'ready') return 'ready';
  if (raw === 'delivering') return 'delivering';
  if (raw === 'completed') return 'completed';
  return 'cancelled';
}

function getOrderStatusInfo(order: Order, lang: SupportedLanguage) {
  const opts = getOrderStatusOptions(lang);
  const key = getNormalizedOrderStatus(order);
  return opts.find((s) => s.value === key) || opts[0];
}

function getOrderDisplayNumber(order: Order): string {
  return order.orderSeq || order.seq
    ? `#${order.orderSeq || order.seq}`
    : `#${order.id.slice(-6).toUpperCase()}`;
}

function extractOrderLinks(
  order: Order,
  restName: string,
  lang: SupportedLanguage
): Array<{ label: string; url: string; kind: 'whatsapp' | 'map' | 'web' }> {
  const links: Array<{ label: string; url: string; kind: 'whatsapp' | 'map' | 'web' }> = [];
  const seen = new Set<string>();

  const addLink = (label: string, url: string, kind: 'whatsapp' | 'map' | 'web') => {
    const clean = String(url || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    links.push({ label, url: clean, kind });
  };

  const ordName = order.name || order.cu?.n || '';
  const ordPhone = order.phone || order.cu?.ph || '';
  if (ordPhone) {
    addLink(
      trByLang(lang, 'مراسلة الزبون عبر واتساب', 'پەیوەندیکردن بە کڕیار لە واتسئەپ', 'Message customer on WhatsApp'),
      waLink(
        ordPhone,
        trByLang(
          lang,
          `مرحباً ${ordName}، بخصوص طلبك ${getOrderDisplayNumber(order)} من ${restName}:`,
          `سڵاو ${ordName}، سەبارەت بە داواکارییەکەت ${getOrderDisplayNumber(order)} لە ${restName}:`,
          `Hello ${ordName}, regarding your order ${getOrderDisplayNumber(order)} from ${restName}:`
        )
      ),
      'whatsapp'
    );
  }

  const lat = order.lat ?? order.cu?.lat;
  const lng = order.lng ?? order.cu?.lng;
  if (lat && lng) {
    addLink(
      trByLang(lang, 'موقع الزبون على خرائط Google', 'شوێنی کڕیار لەسەر نەخشەی Google', 'Customer location on Google Maps'),
      `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`,
      'map'
    );
  }

  const directMap = order.mapUrl || order.locationUrl || order.cu?.mapUrl || order.cu?.locationUrl;
  if (typeof directMap === 'string' && /^https?:\/\//i.test(directMap.trim())) {
    addLink(trByLang(lang, 'رابط الموقع المرفق', 'بەستەری شوێنی هاوپێچ', 'Attached location link'), directMap.trim(), 'map');
  }

  const textPool = [
    order.address,
    order.cu?.address,
    order.notes,
    order.cu?.nt,
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ');

  const urlMatches = textPool.match(/https?:\/\/[^\s]+/gi) || [];
  urlMatches.forEach((rawUrl, idx) => {
    const cleanUrl = rawUrl.replace(/[),.;]+$/, '');
    const isMap = /maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(cleanUrl);
    addLink(
      isMap
        ? trByLang(lang, 'رابط خرائط Google', 'بەستەری نەخشەی Google', 'Google Maps Link')
        : trByLang(lang, `رابط مرفق #${idx + 1}`, `بەستەری هاوپێچ #${idx + 1}`, `Attached Link #${idx + 1}`),
      cleanUrl,
      isMap ? 'map' : 'web'
    );
  });

  return links;
}

export const OrdersPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    rest,
    lang,
    isRtl,
    locale,
    tr,
    currency,
    allOrders,
    filteredOrders,
    newOrdersCount,
    orderFilter,
    setOrderFilter,
    handleUpdateOrderStatus,
    showToast,
  } = useDashboard();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusPickerOrderId, setStatusPickerOrderId] = useState<string | null>(null);
  const selectedOrder = selectedOrderId
    ? allOrders.find((o) => o.id === selectedOrderId) || null
    : null;
  const statusPickerOrder = statusPickerOrderId
    ? allOrders.find((o) => o.id === statusPickerOrderId) || null
    : null;

  const completedOrdersCount = allOrders.filter(
    (o) => o.st === 'completed' || o.status === 'completed'
  ).length;

  const statusOptions = getOrderStatusOptions(lang);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <motion.div
        className="mp-orders-toolbar"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mp-orders-tabs" role="tablist" aria-label={tr('تصفية الطلبات', 'فلتەرکردنی داواکارییەکان', 'Filter orders')}>
          <button
            type="button"
            role="tab"
            aria-selected={orderFilter === 'all'}
            className={`mp-orders-tab ${orderFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setOrderFilter('all')}
          >
            <span>{tr('الكل', 'هەمووی', 'All')}</span>
            <span className="mp-orders-tab-count tabular-nums">({allOrders.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={orderFilter === 'new'}
            className={`mp-orders-tab ${orderFilter === 'new' ? 'is-active' : ''}`}
            onClick={() => setOrderFilter('new')}
          >
            <span>{tr('جديد', 'نوێ', 'New')}</span>
            <span className="mp-orders-tab-count tabular-nums">({newOrdersCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={orderFilter === 'completed'}
            className={`mp-orders-tab ${orderFilter === 'completed' ? 'is-active' : ''}`}
            onClick={() => setOrderFilter('completed')}
          >
            <span>{tr('مكتمل', 'تەواوبوو', 'Completed')}</span>
            <span className="mp-orders-tab-count tabular-nums">({completedOrdersCount})</span>
          </button>
        </div>
      </motion.div>

      {filteredOrders.length === 0 ? (
        <div style={{ ...surfaceCardStyle, padding: '40px 20px', textAlign: 'center', borderRadius: '18px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>📦</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink)' }}>
            {tr('لا توجد طلبات في هذا التصنيف حالياً', 'ئێستا هیچ داواکارییەک لەم بەشەدا نییە', 'No orders in this filter yet')}
          </h3>
          <p style={{ fontSize: '13.5px', margin: 0, color: 'var(--muted)' }}>
            {tr('عندما يقوم الزبائن بالطلب عبر المنيو ستظهر طلباتهم هنا فوراً.', 'کاتێک کڕیاران لە مینیۆ داواکاری دەنێرن، دەستبەجێ لێرە دەردەکەوێت.', 'Incoming customer orders from your menu will appear here immediately.')}
          </p>
        </div>
      ) : (
        <div className="mp-orders-list">
          {filteredOrders.map((order, idx) => {
            const ordName = order.name || order.cu?.n || '';
            const ordPhone = order.phone || order.cu?.ph || '';
            const typeInfo = getOrderTypeInfo(order, lang);
            const TypeIcon = typeInfo.Icon;
            const statusInfo = getOrderStatusInfo(order, lang);
            const displayOrderNum = getOrderDisplayNumber(order);
            const dateTimeLabel = formatOrderDayAndTime(order, locale);
            const totalAmount = formatNumber(order.tot || order.total || 0);

            return (
              <motion.div
                key={order.id}
                className="mp-order-row"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.82, delay: prefersReducedMotion ? 0 : Math.min(idx * 0.06, 0.36), ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mp-order-top-line">
                  <div className="mp-order-meta-group">
                    <span className="mp-order-num tabular-nums">
                      {displayOrderNum}
                    </span>

                    <span className="mp-order-type-chip">
                      <TypeIcon size={12} style={{ color: 'var(--brand-ink, #34D399)', flexShrink: 0 }} />
                      <span>{typeInfo.label}</span>
                    </span>
                  </div>

                  <div className="mp-order-end-group">
                    <span className="mp-order-price tabular-nums">
                      {totalAmount} {currency}
                    </span>

                    <button
                      type="button"
                      className="mp-order-status-btn"
                      onClick={() => setStatusPickerOrderId(order.id)}
                      aria-label={tr(`تغيير حالة الطلب ${displayOrderNum}`, `گۆڕینی دۆخی داواکاری ${displayOrderNum}`, `Change status for order ${displayOrderNum}`)}
                      title={tr('تغيير حالة الطلب', 'گۆڕینی دۆخی داواکاری', 'Change order status')}
                      style={{
                        background: statusInfo.bg,
                        borderColor: statusInfo.bg,
                        color: '#ffffff',
                      }}
                    >
                      <span>{statusInfo.text}</span>
                      <ChevronDown size={11} style={{ flexShrink: 0, opacity: 0.9 }} aria-hidden="true" />
                    </button>

                    {ordPhone && (
                      <a
                        href={waLink(
                          ordPhone,
                          tr(
                            `مرحباً ${ordName}، بخصوص طلبك ${displayOrderNum} من ${rest.n}:`,
                            `سڵاو ${ordName}، سەبارەت بە داواکارییەکەت ${displayOrderNum} لە ${rest.n}:`,
                            `Hello ${ordName}, regarding your order ${displayOrderNum} from ${rest.n}:`
                          )
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mp-order-icon-btn is-wa"
                        title={tr('مراسلة الزبون عبر واتساب', 'پەیوەندیکردن بە کڕیار لە واتسئەپ', 'Message customer on WhatsApp')}
                        aria-label={tr(`مراسلة الزبون عبر واتساب للطلب ${displayOrderNum}`, `واتسئەپی کڕیار بۆ داواکاری ${displayOrderNum}`, `Message customer on WhatsApp for order ${displayOrderNum}`)}
                      >
                        <MessageCircle size={15} />
                      </a>
                    )}

                    <button
                      type="button"
                      className="mp-order-icon-btn"
                      onClick={() => setSelectedOrderId(order.id)}
                      title={tr('تفاصيل الطلب', 'وردەکاری داواکاری', 'Order details')}
                      aria-label={tr(`تفاصيل الطلب ${displayOrderNum}`, `وردەکاری داواکاری ${displayOrderNum}`, `Order details ${displayOrderNum}`)}
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>

                <div className="mp-order-bottom-line">
                  <span className="mp-order-datetime tabular-nums">
                    <CalendarClock size={12} style={{ flexShrink: 0, opacity: 0.8 }} />
                    <span>{dateTimeLabel}</span>
                  </span>

                  <span className="mp-order-customer-mini">
                    {ordName || tr('زبون', 'کڕیار', 'Customer')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedOrder && (() => {
        const ordName = selectedOrder.name || selectedOrder.cu?.n || '';
        const ordPhone = selectedOrder.phone || selectedOrder.cu?.ph || '';
        const ordAddr = selectedOrder.address || selectedOrder.cu?.address || '';
        const ordNotes = selectedOrder.notes || selectedOrder.cu?.nt || '';
        const ordArea = selectedOrder.cu?.area || selectedOrder.area || '';
        const ordCity = selectedOrder.cu?.city || selectedOrder.city || '';
        const ordTable = selectedOrder.table || selectedOrder.cu?.table || '';
        const deliveryFee = Number(selectedOrder.cu?.deliveryFee ?? selectedOrder.deliveryFee ?? 0);
        const typeInfo = getOrderTypeInfo(selectedOrder, lang);
        const TypeIcon = typeInfo.Icon;
        const statusInfo = getOrderStatusInfo(selectedOrder, lang);
        const displayOrderNum = getOrderDisplayNumber(selectedOrder);
        const dateTimeLabel = formatOrderDayAndTime(selectedOrder, locale);
        const orderLinks = extractOrderLinks(selectedOrder, rest.n, lang);

        const modalContent = (
          <div
            className="mp-order-modal-overlay"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={() => setSelectedOrderId(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={tr(`تفاصيل الطلب ${displayOrderNum}`, `وردەکاری داواکاری ${displayOrderNum}`, `Order details ${displayOrderNum}`)}
              onClick={(e) => e.stopPropagation()}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: 'min(560px, 100%)',
                maxHeight: '90dvh',
                overflowY: 'auto',
                ...surfaceCardStyle,
                borderRadius: '20px',
                padding: '18px 18px 20px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              }}
            >
              {/* Modal Header */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--ink)' }} className="tabular-nums">
                    {tr(`تفاصيل الطلب ${displayOrderNum}`, `وردەکاری داواکاری ${displayOrderNum}`, `Order ${displayOrderNum}`)}
                  </h3>
                  <span
                    className="mp-order-status-dot"
                    style={{ background: statusInfo.bg }}
                  >
                    {statusInfo.text}
                  </span>
                  <span className="mp-order-type-chip">
                    <TypeIcon size={13} style={{ color: 'var(--brand-ink, #34D399)' }} />
                    <span>{typeInfo.label}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Customer & Order Info */}
                <div className="mp-order-modal-section">
                  <h4 className="mp-order-modal-section-title">
                    <User size={14} />
                    <span>{tr('معلومات الطلب والزبون', 'زانیاری داواکاری و کڕیار', 'Customer & Order Info')}</span>
                  </h4>

                  <div className="mp-order-info-grid">
                    <div className="mp-order-info-item">
                      <span className="mp-order-info-label">{tr('تاريخ ووقت الطلب', 'بەروار و کاتی داواکاری', 'Date & Time')}</span>
                      <span className="mp-order-info-val tabular-nums">{dateTimeLabel}</span>
                    </div>

                    <div className="mp-order-info-item">
                      <span className="mp-order-info-label">{tr('نوع الطلب', 'جۆری داواکاری', 'Order Type')}</span>
                      <span className="mp-order-info-val">{typeInfo.label}</span>
                    </div>

                    {ordName && (
                      <div className="mp-order-info-item">
                        <span className="mp-order-info-label">{tr('اسم الزبون', 'ناوی کڕیار', 'Customer Name')}</span>
                        <span className="mp-order-info-val">{ordName}</span>
                      </div>
                    )}

                    {ordPhone && (
                      <div className="mp-order-info-item">
                        <span className="mp-order-info-label">{tr('رقم الهاتف', 'ژمارەی مۆبایل', 'Phone')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a
                            href={`tel:${ordPhone}`}
                            dir="ltr"
                            className="mp-order-info-val tabular-nums"
                            style={{ color: 'var(--brand-ink, #34D399)', textDecoration: 'none' }}
                          >
                            {ordPhone}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              void copyTextReliable(ordPhone).then((ok) => {
                                showToast(
                                  ok
                                    ? tr('تم نسخ رقم الهاتف ✓', 'ژمارەی مۆبایل کۆپی کرا ✓', 'Phone number copied ✓')
                                    : tr('تعذر النسخ', 'کۆپیکردن سەرکەوتوو نەبوو', 'Failed to copy')
                                );
                              });
                            }}
                            title={tr('نسخ الرقم', 'کۆپیکردنی ژمارە', 'Copy number')}
                            aria-label={tr('نسخ رقم الهاتف', 'کۆپیکردنی ژمارەی مۆبایل', 'Copy phone number')}
                            style={{
                              border: '1px solid var(--line)',
                              background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                              color: 'var(--muted)',
                              borderRadius: '7px',
                              width: '26px',
                              height: '26px',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {(ordArea || ordCity) && (
                      <div className="mp-order-info-item">
                        <span className="mp-order-info-label">{tr('المنطقة / المدينة', 'ناوچە / شار', 'Area / City')}</span>
                        <span className="mp-order-info-val">
                          {[ordArea, ordCity].filter(Boolean).join(' — ')}
                        </span>
                      </div>
                    )}

                    {ordTable && (
                      <div className="mp-order-info-item">
                        <span className="mp-order-info-label">{tr('رقم الطاولة', 'ژمارەی مێز', 'Table Number')}</span>
                        <span className="mp-order-info-val">{ordTable}</span>
                      </div>
                    )}

                    {selectedOrder.scheduledSlot && (
                      <div className="mp-order-info-item">
                        <span className="mp-order-info-label">{tr('الوقت المحدد', 'کاتی دیاریکراو', 'Scheduled Time')}</span>
                        <span className="mp-order-info-val">{selectedOrder.scheduledSlot}</span>
                      </div>
                    )}

                    {typeof selectedOrder.needCutlery === 'boolean' && (
                      <div className="mp-order-info-item">
                        <span className="mp-order-info-label">{tr('أدوات الطعام', 'کەرەستەی خواردن', 'Cutlery')}</span>
                        <span className="mp-order-info-val">
                          {selectedOrder.needCutlery ? tr('نعم (مطلوبة)', 'بەڵێ (پێویستە)', 'Yes (requested)') : tr('لا حاجة', 'پێویست نییە', 'Not needed')}
                        </span>
                      </div>
                    )}

                    {ordAddr && (
                      <div className="mp-order-info-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="mp-order-info-label">{tr('العنوان', 'ناونیشان', 'Address')}</span>
                        <span className="mp-order-info-val">{ordAddr}</span>
                      </div>
                    )}

                    {ordNotes && (
                      <div className="mp-order-info-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="mp-order-info-label">{tr('ملاحظات الزبون', 'تێبینییەکانی کڕیار', 'Customer Notes')}</span>
                        <span className="mp-order-info-val">{ordNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Links */}
                {(orderLinks.length > 0 || ordPhone) && (
                  <div className="mp-order-modal-section">
                    <h4 className="mp-order-modal-section-title">
                      <Link2 size={14} />
                      <span>{tr('الروابط والتواصل المباشر', 'لینکەکان و پەیوەندی ڕاستەوخۆ', 'Direct Links & Contact')}</span>
                    </h4>

                    <div className="mp-order-links-list">
                      {orderLinks.map((lk, idx) => (
                        <a
                          key={idx}
                          href={lk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mp-order-link-pill"
                          style={
                            lk.kind === 'whatsapp'
                              ? {
                                  background: '#25D366',
                                  borderColor: '#25D366',
                                  color: '#ffffff',
                                }
                              : undefined
                          }
                        >
                          {lk.kind === 'whatsapp' ? (
                            <MessageCircle size={14} />
                          ) : lk.kind === 'map' ? (
                            <MapPin size={14} />
                          ) : (
                            <ExternalLink size={14} />
                          )}
                          <span>{lk.label}</span>
                        </a>
                      ))}

                      {ordPhone && (
                        <a href={`tel:${ordPhone}`} className="mp-order-link-pill">
                          <Phone size={14} />
                          <span>{tr('اتصال هاتفي بالزبون', 'پەیوەندی تەلەفۆنی بە کڕیار', 'Call Customer')}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items & Invoice Breakdown */}
                <div className="mp-order-modal-section">
                  <h4 className="mp-order-modal-section-title">
                    <FileText size={14} />
                    <span>{tr('تفاصيل الطلب والفاتورة', 'وردەکاری داواکاری و وەسڵ', 'Items & Invoice Breakdown')}</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedOrder.items || []).map((it, idx) => {
                      const extrasList = Array.isArray(it.extras)
                        ? it.extras
                            .map((ex: any) => (typeof ex === 'string' ? ex : ex?.n || ''))
                            .filter(Boolean)
                        : [];
                      const choicesList = Array.isArray(it.choices) ? it.choices.filter(Boolean) : [];
                      const detailsParts = [it.size, ...choicesList, ...extrasList].filter(Boolean);

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '10px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid color-mix(in srgb, var(--line) 45%, transparent)',
                            fontSize: '13px',
                            color: 'var(--ink)',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>
                              {it.n} <span style={{ color: 'var(--muted)' }}>× {it.q}</span>
                            </div>
                            {detailsParts.length > 0 && (
                              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                                {detailsParts.join(' • ')}
                              </div>
                            )}
                            {it.notes && (
                              <div style={{ fontSize: '11.5px', color: 'var(--brand-ink, #34D399)', marginTop: '2px' }}>
                                {tr('ملاحظة:', 'تێبینی:', 'Note:')} {it.notes}
                              </div>
                            )}
                          </div>
                          <span className="tabular-nums" style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {formatNumber((it.pr || it.p || 0) * it.q)} {currency}
                          </span>
                        </div>
                      );
                    })}

                    {deliveryFee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' }}>
                        <span>{tr('رسوم التوصيل', 'کرێی گەیاندن', 'Delivery Fee')}</span>
                        <span className="tabular-nums">{formatNumber(deliveryFee)} {currency}</span>
                      </div>
                    )}

                    {Number(selectedOrder.serviceFee || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' }}>
                        <span>{tr('رسوم التغليف والخدمة', 'کرێی پاکەتکردن و خزمەتگوزاری', 'Packaging & Service Fee')}</span>
                        <span className="tabular-nums">{formatNumber(selectedOrder.serviceFee)} {currency}</span>
                      </div>
                    )}

                    {Number(selectedOrder.tipAmount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' }}>
                        <span>{tr('إكرامية', 'بەخشیش', 'Tip')}</span>
                        <span className="tabular-nums">{formatNumber(selectedOrder.tipAmount)} {currency}</span>
                      </div>
                    )}

                    {Number(selectedOrder.discount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#10b981' }}>
                        <span>{tr('خصم', 'داشکاندن', 'Discount')} {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                        <span className="tabular-nums">-{formatNumber(selectedOrder.discount)} {currency}</span>
                      </div>
                    )}

                    {Number(selectedOrder.firstOrderDiscount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#10b981' }}>
                        <span>{tr('خصم الطلب الأول', 'داشکاندنی یەکەم داواکاری', 'First-Order Discount')}</span>
                        <span className="tabular-nums">-{formatNumber(selectedOrder.firstOrderDiscount)} {currency}</span>
                      </div>
                    )}

                    {Number(selectedOrder.spinDiscount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#10b981' }}>
                        <span>{tr('خصم عجلة الحظ', 'داشکاندنی چەرخی بەخت', 'Spin-Wheel Discount')} {selectedOrder.spinRewardLabel ? `(${selectedOrder.spinRewardLabel})` : ''}</span>
                        <span className="tabular-nums">-{formatNumber(selectedOrder.spinDiscount)} {currency}</span>
                      </div>
                    )}

                    {selectedOrder.freeGiftName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--brand-ink, #34D399)', fontWeight: 700 }}>
                        <span>{tr('هدية مجانية', 'دیاری بێبەرامبەر', 'Free Gift')}</span>
                        <span>{selectedOrder.freeGiftName}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        marginTop: '2px',
                        borderTop: '1px solid var(--line)',
                        fontSize: '15px',
                        fontWeight: 900,
                        color: 'var(--ink)',
                      }}
                    >
                      <span>{tr('الإجمالي النهائي', 'کۆی گشتی کۆتایی', 'Grand Total')}</span>
                      <span className="tabular-nums" style={{ color: 'var(--brand-ink, #34D399)' }}>
                        {formatNumber(selectedOrder.tot || selectedOrder.total || 0)} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="mp-order-modal-section">
                  <h4 className="mp-order-modal-section-title">
                    <Check size={14} />
                    <span>{tr('تغيير حالة الطلب', 'گۆڕینی دۆخی داواکاری', 'Update Order Status')}</span>
                  </h4>
                  <div className="mp-order-status-pills-grid">
                    {statusOptions.map((opt) => {
                      const active = statusInfo.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, opt.value)}
                          className={`mp-order-modal-status-btn ${active ? 'is-active' : ''}`}
                          style={
                            active
                              ? {
                                  background: opt.bg,
                                  borderColor: opt.bg,
                                  color: '#ffffff',
                                }
                              : {
                                  borderColor: `color-mix(in srgb, ${opt.bg} 32%, var(--line))`,
                                }
                          }
                        >
                          <span
                            className="mp-order-status-circle"
                            style={{ background: active ? '#ffffff' : opt.bg }}
                            aria-hidden="true"
                          />
                          <span>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );

        return typeof document !== 'undefined'
          ? createPortal(modalContent, document.body)
          : modalContent;
      })()}

      {statusPickerOrder && (() => {
        const currentStatus = getOrderStatusInfo(statusPickerOrder, lang);
        const displayNum = getOrderDisplayNumber(statusPickerOrder);
        const pickerModal = (
          <div
            className="mp-order-modal-overlay"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={() => setStatusPickerOrderId(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={tr(`تغيير حالة الطلب ${displayNum}`, `گۆڕینی دۆخی داواکاری ${displayNum}`, `Change status for ${displayNum}`)}
              className="mp-status-picker-card"
              onClick={(e) => e.stopPropagation()}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={surfaceCardStyle}
            >
              <div className="mp-status-picker-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <h4 className="mp-status-picker-title tabular-nums">
                    {tr(`حالة الطلب ${displayNum}`, `دۆخی داواکاری ${displayNum}`, `Order Status ${displayNum}`)}
                  </h4>
                  <span
                    className="mp-order-status-dot"
                    style={{ background: currentStatus.bg }}
                  >
                    {currentStatus.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusPickerOrderId(null)}
                  aria-label={tr('إغلاق', 'داخستن', 'Close')}
                  className="mp-status-picker-close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="mp-status-picker-list">
                {statusOptions.map((opt) => {
                  const isActive = currentStatus.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleUpdateOrderStatus(statusPickerOrder.id, opt.value);
                        setStatusPickerOrderId(null);
                      }}
                      className={`mp-status-picker-option ${isActive ? 'is-active' : ''}`}
                      style={
                        isActive
                          ? {
                              background: opt.bg,
                              borderColor: opt.bg,
                              color: '#ffffff',
                            }
                          : {
                              borderColor: `color-mix(in srgb, ${opt.bg} 34%, var(--line))`,
                              background: `color-mix(in srgb, ${opt.bg} 9%, var(--bg))`,
                            }
                      }
                    >
                      <span className="mp-status-picker-opt-main">
                        <span
                          className="mp-order-status-circle"
                          style={{ background: isActive ? '#ffffff' : opt.bg }}
                          aria-hidden="true"
                        />
                        <span>{opt.text}</span>
                      </span>
                      {isActive && <Check size={14} strokeWidth={2.75} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        );

        return typeof document !== 'undefined'
          ? createPortal(pickerModal, document.body)
          : pickerModal;
      })()}
    </div>
  );
};
