/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AvailabilitySchedule, MenuItem } from '../../types';
import { formatNumber } from '../../utils/storage';
import { AvailabilityScheduleEditor } from '../../components/AvailabilityScheduleEditor';
import { MediaLibraryModal } from '../../components/MediaLibraryModal';
import {
  DEFAULT_AVAILABILITY_SCHEDULE,
  normalizeAvailabilitySchedule,
} from '../../utils/availability';
import {
  SixDotDragHandle,
  surfaceCardStyle,
  themedInputStyle,
  useDashboard,
} from './DashboardContext';

export const ItemsPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    tr,
    isRtl,
    resolvedPlan,
    customTabLabel,
    currency,
    allCategories,
    allItems,
    filteredItems,
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
    mediaLibraryItems,
    uploadImagesToLibrary,
    removeMediaLibraryItem,
  } = useDashboard();

  const [quickPriceItemId, setQuickPriceItemId] = useState<string | null>(null);
  const [quickPriceDraft, setQuickPriceDraft] = useState<string>('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [scheduleModalItem, setScheduleModalItem] = useState<MenuItem | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<AvailabilitySchedule>(() =>
    normalizeAvailabilitySchedule(DEFAULT_AVAILABILITY_SCHEDULE)
  );

  // Smooth touch + mouse pointer-drag reordering via the 6-dot handle
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragSessionRef = useRef<{
    itemId: string;
    startClientY: number;
    initialCenterY: number;
    slotCenters: number[];
    draftOrder: string[];
    originalOrder: string[];
  } | null>(null);

  const canReorder = !searchItemQuery.trim() && filteredItems.length > 1;

  const displayItems = dragOrder
    ? dragOrder
        .map((id) => filteredItems.find((it) => it.id === id))
        .filter((it): it is MenuItem => Boolean(it))
    : filteredItems;

  useEffect(() => {
    const handlePointerMove = (ev: PointerEvent) => {
      const st = dragSessionRef.current;
      if (!st) return;
      ev.preventDefault();

      const currentCenterY = st.initialCenterY + (ev.clientY - st.startClientY);
      let bestIdx = 0;
      let bestDist = Infinity;
      st.slotCenters.forEach((sc, idx) => {
        const dist = Math.abs(currentCenterY - sc);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      const currentIdx = st.draftOrder.indexOf(st.itemId);
      if (currentIdx !== -1 && bestIdx !== currentIdx) {
        const nextOrder = [...st.draftOrder];
        const [moved] = nextOrder.splice(currentIdx, 1);
        nextOrder.splice(bestIdx, 0, moved);
        st.draftOrder = nextOrder;
        setDragOrder([...nextOrder]);
      }

      setDragOffsetY(currentCenterY - st.slotCenters[bestIdx]);
    };

    const finishDrag = () => {
      const st = dragSessionRef.current;
      if (!st) return;
      const changed = st.draftOrder.some((id, idx) => id !== st.originalOrder[idx]);
      const finalOrder = [...st.draftOrder];
      dragSessionRef.current = null;
      setDraggingItemId(null);
      setDragOffsetY(0);
      setDragOrder(null);
      if (changed) {
        handleReorderItems(finalOrder);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [handleReorderItems]);

  const startHandleDrag = (e: React.PointerEvent<HTMLButtonElement>, itemId: string) => {
    if (!canReorder) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if browser declines pointer capture
    }

    const originalOrder = filteredItems.map((it) => it.id);
    const slotCenters = originalOrder.map((id) => {
      const el = rowRefs.current.get(id);
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    const initialIdx = originalOrder.indexOf(itemId);
    if (initialIdx === -1 || slotCenters.some((v) => v === 0)) return;

    dragSessionRef.current = {
      itemId,
      startClientY: e.clientY,
      initialCenterY: slotCenters[initialIdx],
      slotCenters,
      draftOrder: [...originalOrder],
      originalOrder,
    };
    setDraggingItemId(itemId);
    setDragOffsetY(0);
    setDragOrder([...originalOrder]);
  };

  const openScheduleModal = (item: MenuItem) => {
    setScheduleModalItem(item);
    setScheduleDraft(normalizeAvailabilitySchedule(item.availabilitySchedule));
  };

  const handleSaveScheduleModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalItem) return;
    handleSaveItemSchedule(scheduleModalItem, scheduleDraft);
    setScheduleModalItem(null);
  };

  const atItemLimit = resolvedPlan.maxItems !== -1 && allItems.length >= resolvedPlan.maxItems;
  const itemLimitText =
    resolvedPlan.maxItems === -1
      ? `${allItems.length}/∞`
      : `${allItems.length}/${resolvedPlan.maxItems}`;
  const canDiscount = resolvedPlan.perms.itemDiscounts;

  if (isItemEditorOpen) {
    return (
      <motion.div
        style={{ maxWidth: '880px', margin: '0 auto' }}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top Editor Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          {!editingItemId ? (
            <button
              type="button"
              onClick={() => {
                setIsItemEditorOpen(false);
                openBatchModal();
              }}
              style={{
                ...surfaceCardStyle,
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={15} style={{ color: 'var(--brand-ink, #34D399)' }} />
              <span>{tr('إضافة سريعة بالجملة', 'زیادکردنی خێرای بە کۆمەڵ', 'Quick Bulk Add')}</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => setIsItemEditorOpen(false)}
            style={{
              ...surfaceCardStyle,
              borderRadius: '10px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            {isRtl ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            <span>{tr('العودة للعناصر', 'گەڕانەوە بۆ بڕگەکان', 'Back to Items')}</span>
          </button>
        </div>

        {/* Horizontal Top Underline Tabs */}
        <div className="item-editor-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={itemEditorTab === 'info'}
            className={`item-editor-tab ${itemEditorTab === 'info' ? 'active' : ''}`}
            onClick={() => setItemEditorTab('info')}
          >
            <span>{tr('المعلومات', 'زانیاری', 'Info')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={itemEditorTab === 'extras'}
            className={`item-editor-tab ${itemEditorTab === 'extras' ? 'active' : ''}`}
            onClick={() => setItemEditorTab('extras')}
          >
            <span>{tr('الإضافات', 'زیادکراوەکان', 'Add-ons')}</span>
            {hasExtras && (
              <span className="item-editor-tab-badge tabular-nums">
                {formExtras.filter((x) => x.n.trim()).length || tr('مفعّل', 'چالاکە', 'On')}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={itemEditorTab === 'choices'}
            className={`item-editor-tab ${itemEditorTab === 'choices' ? 'active' : ''}`}
            onClick={() => setItemEditorTab('choices')}
          >
            <span>{tr('الخيارات', 'بژاردەکان', 'Options')}</span>
            {hasChoices && (
              <span className="item-editor-tab-badge tabular-nums">
                {formChoices.filter((c) => c.trim()).length || tr('مفعّل', 'چالاکە', 'On')}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={itemEditorTab === 'extraInfo'}
            className={`item-editor-tab ${itemEditorTab === 'extraInfo' ? 'active' : ''}`}
            onClick={() => setItemEditorTab('extraInfo')}
          >
            <span>{tr('معلومات إضافية', 'زانیاری زیادە', 'Extra Info')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={itemEditorTab === 'badges'}
            className={`item-editor-tab ${itemEditorTab === 'badges' ? 'active' : ''}`}
            onClick={() => setItemEditorTab('badges')}
          >
            <span>{tr('البادجات', 'نیشانەکان', 'Badges')}</span>
            {formBadgeText.trim() && (
              <span className="item-editor-tab-badge">1</span>
            )}
          </button>
        </div>

        {/* Dedicated Editor Card Container */}
        <form onSubmit={handleSaveItem}>
          <motion.div
            key={itemEditorTab}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...surfaceCardStyle,
              borderRadius: '18px',
              padding: '22px',
              boxShadow: 'var(--sh)',
            }}
          >
            {/* TAB 1 */}
            {itemEditorTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowMediaLibrary(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowMediaLibrary(true);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: formImage ? '16px' : '24px 16px',
                    borderRadius: '14px',
                    border: '1.5px dashed color-mix(in srgb, var(--line) 85%, transparent)',
                    background: 'color-mix(in srgb, var(--ink) 3%, transparent)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {formImage ? (
                    <>
                      <img
                        src={formImage}
                        alt={formName || tr('صورة العنصر', 'وێنەی بڕگە', 'Item photo')}
                        referrerPolicy="no-referrer"
                        style={{
                          width: '86px',
                          height: '86px',
                          borderRadius: '14px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-ink, #34D399)' }}>
                        {tr('اضغط لتغيير الصورة من مكتبة الصور', 'کرتە بکە بۆ گۆڕینی وێنە لە گەلەری وێنەکان', 'Click to change image from Media Library')}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormImage('');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {tr('إزالة الصورة', 'لابردنی وێنە', 'Remove image')}
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={30} strokeWidth={1.7} style={{ color: 'var(--muted)' }} />
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink)' }}>
                        {tr('اضف صورة للعنصر (اختياري)', 'وێنە بۆ بڕگەکە زیاد بکە (ئارەزوومەندانە)', 'Add item photo (optional)')}
                      </div>
                      <div dir="auto" style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                        {tr('مقاس الصورة المفضل 180 × 180، نقبل jpg, png, jpeg', 'قەبارەی پێشنیارکراو ١٨٠ × ١٨٠، jpg, png, jpeg قبوڵ دەکرێت', 'Recommended size 180 × 180 px, accepts jpg, png, jpeg')}
                      </div>
                    </>
                  )}
                </div>

                <label className="f" style={{ marginBottom: 0 }}>
                  {tr('اسم العنصر *', 'ناوی بڕگە *', 'Item Name *')}
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={tr('مثال: ريزو، كاب سماش برجر، بيبسي...', 'نموونە: ڕیزۆ، سماش بەرگەر، پیپسی...', 'e.g. Classic Smash Burger, Iced Latte...')}
                    style={themedInputStyle}
                    required
                  />
                </label>

                <label className="f" style={{ marginBottom: 0 }}>
                  {tr('قسم العنصر *', 'بەشی بڕگە *', 'Category *')}
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    style={themedInputStyle}
                    required
                  >
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.n}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="f" style={{ marginBottom: 0 }}>
                  {tr('وصف العنصر ( الوصف والمكونات )', 'وەسفی بڕگە (پێکهاتە و زانیاری)', 'Description & Ingredients')}
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder={tr('اكتب مكونات الوجبة أو وصف المنتج بشكل واضح للزبون...', 'پێکهاتەی خواردن یان وەسفی بەرهەم بە ڕوونی بۆ کڕیار بنووسە...', 'Write clear ingredients or product details for customers...')}
                    rows={4}
                    style={themedInputStyle}
                  />
                </label>

                <label className="f" style={{ marginBottom: 0 }}>
                  {tr('المدة لتجهيز العنصر بالدقائق ( اختياري )', 'کاتی ئامادەکردنی بڕگە بە خولەک (ئارەزوومەندانە)', 'Preparation time in minutes (optional)')}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={formPrepTime}
                      onChange={(e) => setFormPrepTime(e.target.value)}
                      placeholder={tr('مثال: 15', 'نموونە: 15', 'e.g. 15')}
                      style={themedInputStyle}
                    />
                  </div>
                </label>

                {/* Pricing Section */}
                <div
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderTop: '1px solid var(--line)',
                    borderRadius: 0,
                    padding: '16px 0 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink)' }}>
                        {tr('أسعار متغيرة (أكثر من حجم)', 'نرخی جیاواز (زیاتر لە قەبارەیەک)', 'Variable Pricing (Multiple Sizes)')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {tr('فعّل هذا الخيار لتحديد عدة أحجام وبجوار كل حجم سعره الخاص', 'ئەمە چالاک بکە بۆ دیاریکردنی چەند قەبارەیەک و نرخی هەریەکەیان', 'Enable to add multiple sizes with individual prices')}
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasVariableSizes}
                      aria-label={tr('تفعيل أسعار متغيرة بأكثر من حجم', 'چالاککردنی نرخی جیاواز بۆ چەند قەبارەیەک', 'Toggle multiple sizes pricing')}
                      onClick={() => {
                        setHasVariableSizes((prev) => {
                          const next = !prev;
                          if (next && formSizes.length === 0) {
                            setFormSizes([
                              { n: tr('سنجل', 'سینگڵ', 'Single'), p: formPrice !== '' ? Number(formPrice) : '' },
                              { n: tr('دبل', 'دەبڵ', 'Double'), p: '' },
                            ]);
                          }
                          return next;
                        });
                      }}
                      className={`ios-switch ${hasVariableSizes ? 'on' : 'off'}`}
                    >
                      <span className="ios-switch-thumb" />
                    </button>
                  </div>

                  {!hasVariableSizes ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                      <label className="f" style={{ marginBottom: 0 }}>
                        {tr(`السعر (${currency}) *`, `نرخ (${currency}) *`, `Price (${currency}) *`)}
                        <input
                          type="number"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="6000"
                          style={{ ...themedInputStyle, background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
                        />
                      </label>
                      <label className="f" style={{ marginBottom: 0 }}>
                        <span>
                          {tr('السعر قبل الخصم (اختياري)', 'نرخ پێش داشکاندن (ئارەزوومەندانە)', 'Compare-at Price (optional)')}
                          {!canDiscount && (
                            <span style={{ color: '#f59e0b', fontSize: '11px', marginInlineStart: '6px' }}>
                              🔒 {tr('متاح في الباقة الاحترافية وباقة الاعمال الشاملة', 'لە پاکێجی پڕۆفیشناڵ و بزنس تەواو بەردەستە', 'Available on Pro & VIP Business plans')}
                            </span>
                          )}
                        </span>
                        <input
                          type="number"
                          value={canDiscount ? formBeforePrice : ''}
                          disabled={!canDiscount}
                          onChange={(e) => setFormBeforePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={canDiscount ? '7500' : tr('مقفل في باقتك الحالية', 'لە پاکێجەکەت داخراوە', 'Locked on your current plan')}
                          style={{
                            ...themedInputStyle,
                            background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                            opacity: canDiscount ? 1 : 0.6,
                            cursor: canDiscount ? 'text' : 'not-allowed',
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                        {formSizes.map((sz, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(0, 1.5fr) minmax(110px, 1fr) auto',
                              gap: '8px',
                              alignItems: 'center',
                            }}
                          >
                            <input
                              type="text"
                              value={sz.n}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormSizes((prev) => prev.map((row, i) => (i === idx ? { ...row, n: val } : row)));
                              }}
                              placeholder={tr(`اسم الحجم #${idx + 1} (مثال: سنجل / دبل / كبير)`, `ناوی قەبارە #${idx + 1} (نموونە: سینگڵ / دەبڵ / گەورە)`, `Size #${idx + 1} (e.g. Small / Medium / Large)`)}
                              style={{ ...themedInputStyle, background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
                            />
                            <input
                              type="number"
                              value={sz.p}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setFormSizes((prev) => prev.map((row, i) => (i === idx ? { ...row, p: val } : row)));
                              }}
                              placeholder={tr(`السعر (${currency})`, `نرخ (${currency})`, `Price (${currency})`)}
                              style={{ ...themedInputStyle, background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
                            />
                            <button
                              type="button"
                              aria-label={tr('حذف الحجم', 'سڕینەوەی قەبارە', 'Delete size')}
                              onClick={() => {
                                if (formSizes.length === 1) {
                                  setFormSizes([{ n: '', p: '' }]);
                                } else {
                                  setFormSizes((prev) => prev.filter((_, i) => i !== idx));
                                }
                              }}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn s"
                          onClick={() => setFormSizes((prev) => [...prev, { n: '', p: '' }])}
                          style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Plus size={15} />
                          <span>{tr('إضافة حجم جديد', 'زیادکردنی قەبارەی نوێ', 'Add New Size')}</span>
                        </button>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn s"
                            onClick={() =>
                              setFormSizes([
                                { n: tr('سنجل', 'سینگڵ', 'Single'), p: formSizes[0]?.p || 6000 },
                                { n: tr('دبل', 'دەبڵ', 'Double'), p: 8500 },
                                { n: tr('تربل', 'ترێپڵ', 'Triple'), p: 11000 },
                              ])
                            }
                            style={{ fontSize: '11.5px', color: 'var(--muted)' }}
                          >
                            {tr('قالب: سنجل / دبل / تربل', 'قاڵب: سینگڵ / دەبڵ / ترێپڵ', 'Preset: Single / Double / Triple')}
                          </button>
                          <button
                            type="button"
                            className="btn s"
                            onClick={() =>
                              setFormSizes([
                                { n: tr('صغير', 'بچووک', 'Small'), p: formSizes[0]?.p || 5000 },
                                { n: tr('وسط', 'مامناوەند', 'Medium'), p: 7000 },
                                { n: tr('كبير', 'گەورە', 'Large'), p: 9000 },
                              ])
                            }
                            style={{ fontSize: '11.5px', color: 'var(--muted)' }}
                          >
                            {tr('قالب: صغير / وسط / كبير', 'قاڵب: بچووک / مامناوەند / گەورە', 'Preset: Small / Medium / Large')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2 */}
            {itemEditorTab === 'extras' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    paddingBottom: '16px',
                    marginBottom: '18px',
                    borderBottom: '1px solid var(--line)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 900, color: 'var(--ink)' }}>
                      {tr('إضافات العنصر (مدفوعة)', 'زیادکراوەکانی بڕگە (بە نرخ)', 'Paid Item Add-ons')}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                      {tr(
                        `أضف صوصات أو إضافات مدفوعة (مثال: صوص جبن بسعر 500 ${currency}) يحددها الزبون مع الطبق.`,
                        `سۆس یان زیادکراوی بە نرخ زیاد بکە (نموونە: سۆسی پەنیر بە 500 ${currency}) کە کڕیار هەڵیبژێرێت.`,
                        `Add paid extras or sauces (e.g. Cheese Sauce 500 ${currency}) for customers to pick.`
                      )}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: hasExtras ? '#10b981' : 'var(--muted)' }}>
                      {hasExtras ? tr('مفعّل', 'چالاکە', 'Enabled') : tr('مطفأ', 'ناچالاکە', 'Off')}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasExtras}
                      aria-label={tr('تشغيل أو إطفاء الإضافات', 'چالاککردن یان ناچالاککردنی زیادکراوەکان', 'Toggle paid add-ons')}
                      onClick={() => {
                        setHasExtras((prev) => {
                          const next = !prev;
                          if (next && formExtras.length === 0) {
                            setFormExtras([{ n: '', p: '' }]);
                          }
                          return next;
                        });
                      }}
                      className={`ios-switch ${hasExtras ? 'on' : 'off'}`}
                    >
                      <span className="ios-switch-thumb" />
                    </button>
                  </div>
                </div>

                {!hasExtras ? (
                  <div
                    style={{
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      backdropFilter: 'blur(14px) saturate(1.25)',
                      WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                      border: 0,
                      borderRadius: '14px',
                      padding: '28px 20px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>
                      {tr('الإضافات غير مفعلة لهذا العنصر حالياً.', 'زیادکراوەکان بۆ ئەم بڕگەیە ئێستا ناچالاکن.', 'Paid add-ons are currently disabled for this item.')}
                    </p>
                    <button
                      type="button"
                      className="btn p s"
                      onClick={() => {
                        setHasExtras(true);
                        if (formExtras.length === 0) setFormExtras([{ n: '', p: '' }]);
                      }}
                    >
                      {tr('تشغيل وإضافة خيارات مدفوعة', 'چالاککردن و زیادکردنی بژاردەی بە نرخ', 'Enable & Add Paid Add-ons')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {formExtras.map((ex, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(120px, 1fr) auto',
                            gap: '10px',
                            alignItems: 'center',
                            background: 'transparent',
                            border: 0,
                            borderBottom: '1px solid var(--line)',
                            borderRadius: 0,
                            padding: '8px 0',
                          }}
                        >
                          <input
                            type="text"
                            value={ex.n}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormExtras((prev) => prev.map((row, i) => (i === idx ? { ...row, n: val } : row)));
                            }}
                            placeholder={tr('اسم الإضافة (مثال: صوص جبن)', 'ناوی زیادکراو (نموونە: سۆسی پەنیر)', 'Add-on name (e.g. Cheese Sauce)')}
                            style={{ ...themedInputStyle, background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
                          />
                          <input
                            type="number"
                            value={ex.p}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setFormExtras((prev) => prev.map((row, i) => (i === idx ? { ...row, p: val } : row)));
                            }}
                            placeholder={tr(`السعر (${currency}) مثال: 500`, `نرخ (${currency}) نموونە: 500`, `Price (${currency}) e.g. 500`)}
                            style={{ ...themedInputStyle, background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
                          />
                          <button
                            type="button"
                            aria-label={tr('حذف الإضافة', 'سڕینەوەی زیادکراو', 'Delete add-on')}
                            onClick={() => {
                              if (formExtras.length === 1) {
                                setFormExtras([{ n: '', p: '' }]);
                              } else {
                                setFormExtras((prev) => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn s"
                        onClick={() => setFormExtras((prev) => [...prev, { n: '', p: '' }])}
                        style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={15} />
                        <span>{tr('إضافة جديدة', 'زیادکراوی نوێ', 'New Add-on')}</span>
                      </button>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { n: tr('صوص جبن', 'سۆسی پەنیر', 'Cheese Sauce'), p: 500 },
                          { n: tr('شريحة جبن شيدر', 'پارچە پەنیری چێدەر', 'Cheddar Slice'), p: 1000 },
                          { n: tr('فلفل هلابينو', 'بیبەری هالاپینۆ', 'Jalapeños'), p: 500 },
                          { n: tr('بيكون مدخن', 'بەیکۆنی دووکەڵکراو', 'Smoked Bacon'), p: 2000 },
                        ].map((preset) => (
                          <button
                            key={preset.n}
                            type="button"
                            className="btn s"
                            style={{ fontSize: '11.5px', color: 'var(--muted)' }}
                            onClick={() =>
                              setFormExtras((prev) => {
                                const filtered = prev.filter((x) => x.n.trim() !== '');
                                if (filtered.some((x) => x.n === preset.n)) return prev;
                                return [...filtered, preset];
                              })
                            }
                          >
                            + {preset.n} ({preset.p})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3 */}
            {itemEditorTab === 'choices' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    paddingBottom: '16px',
                    marginBottom: '18px',
                    borderBottom: '1px solid var(--line)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 900, color: 'var(--ink)' }}>
                      {tr('اختيارات العنصر (مجانية بدون سعر)', 'بژاردەکانی بڕگە (بێبەرامبەر)', 'Free Item Choices')}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                      {tr(
                        'خيارات مجانية يحددها الزبون مع الطبق مثل نوع الخبز أو مستوى الحرارة بدون سعر إضافي.',
                        'بژاردەی بێبەرامبەر کە کڕیار لەگەڵ خواردنەکە هەڵیدەبژێرێت وەک جۆری نان یان تیژی.',
                        'Free choices customers select with their order like bread type or spice level.'
                      )}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: hasChoices ? '#10b981' : 'var(--muted)' }}>
                      {hasChoices ? tr('مفعّل', 'چالاکە', 'Enabled') : tr('مطفأ', 'ناچالاکە', 'Off')}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasChoices}
                      aria-label={tr('تشغيل أو إطفاء الاختيارات المجانية', 'چالاککردن یان ناچالاککردنی بژاردە بێبەرامبەرەکان', 'Toggle free choices')}
                      onClick={() => {
                        setHasChoices((prev) => {
                          const next = !prev;
                          if (next && formChoices.length === 0) {
                            setFormChoices(['']);
                          }
                          return next;
                        });
                      }}
                      className={`ios-switch ${hasChoices ? 'on' : 'off'}`}
                    >
                      <span className="ios-switch-thumb" />
                    </button>
                  </div>
                </div>

                {!hasChoices ? (
                  <div
                    style={{
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      backdropFilter: 'blur(14px) saturate(1.25)',
                      WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                      border: 0,
                      borderRadius: '14px',
                      padding: '28px 20px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>
                      {tr('الاختيارات المجانية غير مفعلة لهذا العنصر حالياً.', 'بژاردە بێبەرامبەرەکان بۆ ئەم بڕگەیە ئێستا ناچالاکن.', 'Free choices are currently disabled for this item.')}
                    </p>
                    <button
                      type="button"
                      className="btn p s"
                      onClick={() => {
                        setHasChoices(true);
                        if (formChoices.length === 0) setFormChoices(['']);
                      }}
                    >
                      {tr('تشغيل وإضافة اختيارات مجانية', 'چالاککردن و زیادکردنی بژاردەی بێبەرامبەر', 'Enable & Add Free Choices')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="f" style={{ maxWidth: '300px', marginBottom: '14px' }}>
                      {tr('عدد الاختيارات المسموح للزبون تحديدها', 'ژمارەی بژاردەی ڕێگەپێدراو بۆ کڕیار', 'Max choices customer can pick')}
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={formMaxChoices}
                        onChange={(e) => setFormMaxChoices(Math.max(1, Number(e.target.value) || 1))}
                        style={themedInputStyle}
                      />
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {formChoices.map((ch, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) auto',
                            gap: '10px',
                            alignItems: 'center',
                            background: 'transparent',
                            border: 0,
                            borderBottom: '1px solid var(--line)',
                            borderRadius: 0,
                            padding: '8px 0',
                          }}
                        >
                          <input
                            type="text"
                            value={ch}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormChoices((prev) => prev.map((row, i) => (i === idx ? val : row)));
                            }}
                            placeholder={tr(`اسم الخيار المجاني #${idx + 1} (مثال: خبز بريوش ذهبي / سبايسي حار)`, `ناوی بژاردەی بێبەرامبەر #${idx + 1} (نموونە: نانی بریۆش / تیژ)`, `Choice #${idx + 1} (e.g. Brioche Bun / Spicy)`)}
                            style={{ ...themedInputStyle, background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
                          />
                          <button
                            type="button"
                            aria-label={tr('حذف الخيار', 'سڕینەوەی بژاردە', 'Delete option')}
                            onClick={() => {
                              if (formChoices.length === 1) {
                                setFormChoices(['']);
                              } else {
                                setFormChoices((prev) => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn s"
                        onClick={() => setFormChoices((prev) => [...prev, ''])}
                        style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={15} />
                        <span>{tr('إضافة خيار جديد', 'زیادکردنی بژاردەی نوێ', 'Add Option')}</span>
                      </button>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn s"
                          style={{ fontSize: '11.5px', color: 'var(--muted)' }}
                          onClick={() => setFormChoices([tr('خبز بريوش ذهبي', 'نانی بریۆش', 'Brioche Bun'), tr('خبز بطاطا طري', 'نانی پەتاتەی نەرم', 'Potato Bun')])}
                        >
                          {tr('قالب: نوع الخبز', 'قاڵب: جۆری نان', 'Preset: Bread Type')}
                        </button>
                        <button
                          type="button"
                          className="btn s"
                          style={{ fontSize: '11.5px', color: 'var(--muted)' }}
                          onClick={() => setFormChoices([tr('عادي (بارد)', 'ئاسایی (بێ تیژی)', 'Regular (Mild)'), tr('سبايسي حار 🔥', 'تیژ 🔥', 'Spicy 🔥')])}
                        >
                          {tr('قالب: عادي / سبايسي', 'قاڵب: ئاسایی / تیژ', 'Preset: Regular / Spicy')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4 */}
            {itemEditorTab === 'extraInfo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    backdropFilter: 'blur(14px) saturate(1.25)',
                    WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                    border: 0,
                    borderRadius: '14px',
                    padding: '14px 16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink)' }}>
                      {tr('ظهور العنصر في المنيو', 'دەرکەوتنی بڕگە لە مینیۆ', 'Show item in menu')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {tr('عند الإطفاء يختفي العنصر مؤقتاً من قائمة الزبائن دون حذفه', 'کاتێک ناچالاکە، بڕگەکە بە کاتی لە مینیۆی کڕیار دەشاردرێتەوە بێ سڕینەوە', 'When off, this item is temporarily hidden from customers without deleting it')}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formPublished}
                    onClick={() => setFormPublished((p) => !p)}
                    className={`ios-switch ${formPublished ? 'on' : 'off'}`}
                  >
                    <span className="ios-switch-thumb" />
                  </button>
                </div>

                <label className="f" style={{ marginBottom: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                    <span>{tr('مسببات الحساسية (اختياري)', 'هەستیاری و حەساسییەت (ئارەزوومەندانە)', 'Allergens (optional)')}</span>
                  </span>
                  <textarea
                    rows={3}
                    value={formAllergens}
                    onChange={(e) => setFormAllergens(e.target.value)}
                    placeholder={tr('مثال: يحتوي على الجلوتين، الألبان، السمسم...', 'نموونە: گلوتین، شیرەمەنی، کونجی تێدایە...', 'e.g. Contains gluten, dairy, sesame...')}
                    style={themedInputStyle}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      backdropFilter: 'blur(14px) saturate(1.25)',
                      WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                      border: 0,
                      borderRadius: '12px',
                      padding: '12px 14px',
                    }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
                      {tr('متاح لطلبات التوصيل', 'بەردەستە بۆ گەیاندن', 'Available for delivery')}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!formNoDelivery}
                      onClick={() => setFormNoDelivery((p) => !p)}
                      className={`ios-switch ${!formNoDelivery ? 'on' : 'off'}`}
                    >
                      <span className="ios-switch-thumb" />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      backdropFilter: 'blur(14px) saturate(1.25)',
                      WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
                      border: 0,
                      borderRadius: '12px',
                      padding: '12px 14px',
                    }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>
                      {tr('متاح للاستلام من الفرع', 'بەردەستە بۆ وەرگرتن لە لق', 'Available for branch pickup')}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!formNoPickup}
                      onClick={() => setFormNoPickup((p) => !p)}
                      className={`ios-switch ${!formNoPickup ? 'on' : 'off'}`}
                    >
                      <span className="ios-switch-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5 */}
            {itemEditorTab === 'badges' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
                    {tr('اختر شارة جاهزة أو اكتب نصاً مخصصاً', 'نیشانەیەکی ئامادە هەڵبژێرە یان دەقێکی تایبەت بنووسە', 'Choose a preset badge or enter custom text')}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { text: tr('الأكثر طلباً', 'زۆرترین داواکاری', 'Best Seller'), type: 'red' as const },
                      { text: tr('جديد', 'نوێ', 'New'), type: 'green' as const },
                      { text: tr('توقيع الشيف', 'پێشنیاری شێف', "Chef's Pick"), type: 'gold' as const },
                      { text: tr('مميز', 'تایبەت', 'Featured'), type: 'accent' as const },
                      { text: tr('مقرمش 🔥', 'قرچاو 🔥', 'Crispy 🔥'), type: 'red' as const },
                    ].map((b) => (
                      <button
                        key={b.text}
                        type="button"
                        className={`btn s ${formBadgeText === b.text ? 'p' : ''}`}
                        onClick={() => {
                          setFormBadgeText(b.text);
                          setFormBadgeType(b.type);
                        }}
                      >
                        {b.text}
                      </button>
                    ))}
                    {formBadgeText && (
                      <button
                        type="button"
                        className="btn s d"
                        onClick={() => setFormBadgeText('')}
                      >
                        {tr('إزالة الشارة', 'لابردنی نیشانە', 'Clear Badge')}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                  <label className="f" style={{ marginBottom: 0 }}>
                    {tr('نص البادج (اختياري)', 'دەقی نیشانە (ئارەزوومەندانە)', 'Badge Text (optional)')}
                    <input
                      type="text"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      placeholder={tr('مثال: الأكثر طلباً', 'نموونە: زۆرترین داواکاری', 'e.g. Best Seller')}
                      style={themedInputStyle}
                    />
                  </label>

                  <label className="f" style={{ marginBottom: 0 }}>
                    {tr('لون الشارة', 'ڕەنگی نیشانە', 'Badge Color')}
                    <select
                      value={formBadgeType}
                      onChange={(e) => setFormBadgeType(e.target.value as 'red' | 'gold' | 'green' | 'accent')}
                      style={themedInputStyle}
                    >
                      <option value="accent">{tr('لون البراند الأساسي', 'ڕەنگی سەرەکی براند', 'Primary Brand Color')}</option>
                      <option value="red">{tr('أحمر بارز', 'سووری دیار', 'Bold Red')}</option>
                      <option value="gold">{tr('ذهبي', 'زێڕین', 'Gold')}</option>
                      <option value="green">{tr('أخضر', 'سەوز', 'Green')}</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </motion.div>

          {/* Centered Save Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            <button
              type="submit"
              className="btn p"
              style={{
                minWidth: '180px',
                height: '44px',
                borderRadius: '12px',
                padding: '0 26px',
                fontSize: '14.5px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {editingItemId ? tr('حفظ التعديلات', 'پاشەکەوتکردنی گۆڕانکارییەکان', 'Save Changes') : tr('إضافة عنصر', 'زیادکردنی بڕگە', 'Add Item')}
            </button>
          </div>
        </form>

        <MediaLibraryModal
          isOpen={showMediaLibrary}
          items={mediaLibraryItems}
          currentUrl={formImage}
          onSelect={(url) => setFormImage(url)}
          onUploadFiles={uploadImagesToLibrary}
          onDeleteItem={(mediaId) => {
            const target = mediaLibraryItems.find((m) => m.id === mediaId);
            if (target && target.url === formImage) {
              setFormImage('');
            }
            removeMediaLibraryItem(mediaId);
          }}
          onClose={() => setShowMediaLibrary(false)}
        />
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <motion.div
        className="mp-items-toolbar"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          onClick={openNewItemEditor}
          className={`${atItemLimit ? 'btn s' : 'btn p'} mp-items-add-btn`}
        >
          <span>{atItemLimit ? tr('الحد مكتمل 🔒', 'سنوور پڕبووە 🔒', 'Limit reached 🔒') : tr('إضافة عنصر', 'زیادکردنی بڕگە', 'Add Item')}</span>
          <Plus size={17} />
        </button>

        <div
          className={`mp-items-count-box ${atItemLimit ? 'is-limit' : ''}`}
          aria-label={tr(`عدد العناصر ${itemLimitText}`, `ژمارەی بڕگەکان ${itemLimitText}`, `Items count ${itemLimitText}`)}
        >
          <span className="mp-items-count-label">{tr('عدد العناصر', 'ژمارەی بڕگەکان', 'Items')}</span>
          <span className="mp-items-count-divider" aria-hidden="true" />
          <span dir="ltr" className="mp-items-count-num tabular-nums">
            {itemLimitText}
          </span>
        </div>
      </motion.div>

      <motion.div
        className="mp-items-cats-bar"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.88, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          className="mp-items-cats-arrow"
          onClick={() => scrollCategoryPills('right')}
          title={tr('السابق', 'پێشوو', 'Previous')}
          aria-label={tr('السابق', 'پێشوو', 'Previous')}
        >
          {isRtl ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        <div ref={categoryScrollRef} className="mp-items-cats-scroll" role="tablist" aria-label={tr('الأقسام', 'بەشەکان', 'Categories')}>
          <button
            type="button"
            role="tab"
            aria-selected={filterCatId === 'all'}
            className={`mp-items-cat-tab ${filterCatId === 'all' ? 'is-active' : ''}`}
            onClick={(e) => {
              setFilterCatId('all');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }}
          >
            <span>{tr('الكل', 'هەمووی', 'All')}</span>
            <span className="mp-items-cat-count tabular-nums">({allItems.length})</span>
          </button>

          {allCategories.map((c) => {
            const count = allItems.filter((it) => it.cat === c.id).length;
            const isSelected = filterCatId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`mp-items-cat-tab ${isSelected ? 'is-active' : ''}`}
                onClick={(e) => {
                  setFilterCatId(c.id);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
              >
                <span>{c.n}</span>
                <span className="mp-items-cat-count tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="mp-items-cats-arrow"
          onClick={() => scrollCategoryPills('left')}
          title={tr('التالي', 'دواتر', 'Next')}
          aria-label={tr('التالي', 'دواتر', 'Next')}
        >
          {isRtl ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </motion.div>

      <motion.div
        className="mp-items-list"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
        {displayItems.map((item) => {
          const catObj = allCategories.find((c) => c.id === item.cat);
          const isItemVisible = item.published !== false && item.available !== false;
          const isDragging = draggingItemId === item.id;
          const hasSchedule = Boolean(item.availabilitySchedule?.enabled);
          const sizesCount = (item.sizes || []).length;
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) {
                  rowRefs.current.set(item.id, el);
                } else {
                  rowRefs.current.delete(item.id);
                }
              }}
              className={`mp-item-card ${!isItemVisible ? 'is-hidden-item' : ''}`}
              style={{
                zIndex: isDragging ? 40 : 1,
                transform: isDragging ? `translateY(${dragOffsetY}px) scale(1.015)` : 'none',
                border: isDragging ? '1.5px solid var(--brand)' : undefined,
                boxShadow: isDragging ? '0 14px 32px rgba(0, 0, 0, 0.35)' : undefined,
                transition: isDragging
                  ? 'box-shadow 0.15s ease, border-color 0.15s ease'
                  : 'transform 0.18s ease, opacity 0.15s ease',
                userSelect: draggingItemId ? 'none' : undefined,
              }}
            >
              <div className="mp-item-main">
                {canReorder && (
                  <button
                    type="button"
                    className="mp-item-drag-btn"
                    onPointerDown={(e) => startHandleDrag(e, item.id)}
                    title={tr('اسحب لتحريك العنصر للأعلى أو للأسفل', 'ڕابکێشە بۆ جوڵاندنی بڕگەکە بۆ سەرەوە یان خوارەوە', 'Drag to reorder item')}
                    aria-label={tr(`تحريك عنصر ${item.n}`, `جوڵاندنی بڕگەی ${item.n}`, `Move item ${item.n}`)}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  >
                    <SixDotDragHandle />
                  </button>
                )}

                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.n}
                    referrerPolicy="no-referrer"
                    className="mp-item-thumb"
                  />
                ) : (
                  <div className="mp-item-thumb-placeholder" aria-hidden="true">
                    <ImageIcon size={20} strokeWidth={1.7} />
                  </div>
                )}

                <div className="mp-item-info">
                  <div className="mp-item-title">{item.n}</div>

                  {quickPriceItemId === item.id ? (
                    <div
                      className="mp-item-quick-price"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        min={0}
                        step={250}
                        dir="ltr"
                        autoFocus
                        value={quickPriceDraft}
                        onChange={(e) => setQuickPriceDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (handleQuickUpdateItemPrice(item, Number(quickPriceDraft))) {
                              setQuickPriceItemId(null);
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setQuickPriceItemId(null);
                          }
                        }}
                        aria-label={tr(`تعديل سريع لسعر ${item.n}`, `دەستکاری خێرای نرخی ${item.n}`, `Quick edit price for ${item.n}`)}
                      />
                      <button
                        type="button"
                        className="mp-item-quick-save"
                        onClick={() => {
                          if (handleQuickUpdateItemPrice(item, Number(quickPriceDraft))) {
                            setQuickPriceItemId(null);
                          }
                        }}
                        title={tr('حفظ السعر', 'پاشەکەوتکردنی نرخ', 'Save Price')}
                      >
                        <Check size={13} />
                        <span>{tr('حفظ', 'پاشەکەوت', 'Save')}</span>
                      </button>
                      <button
                        type="button"
                        className="mp-item-quick-cancel"
                        onClick={() => setQuickPriceItemId(null)}
                        title={tr('إلغاء', 'پاشگەزبوونەوە', 'Cancel')}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mp-item-price-btn"
                      onClick={() => {
                        setQuickPriceItemId(item.id);
                        setQuickPriceDraft(String(item.pr ?? 0));
                      }}
                      title={tr('اضغط للتعديل السريع على السعر', 'کرتە بکە بۆ گۆڕینی خێرای نرخ', 'Click to quick-edit price')}
                    >
                      <span className="tabular-nums">
                        {sizesCount > 0 ? `${tr('من', 'لە', 'From')} ${formatNumber(item.pr)} ${currency}` : `${formatNumber(item.pr)} ${currency}`}
                      </span>
                      <Edit size={12} style={{ opacity: 0.8, flexShrink: 0 }} />
                    </button>
                  )}
                </div>
              </div>

              <div className="desktop-inline-only mp-item-cat-col">
                {catObj?.n || tr('بدون قسم', 'بێ بەش', 'Uncategorized')}
              </div>

              <div className="mp-item-actions">
                <div className="mp-item-visibility-wrap">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isItemVisible}
                    aria-label={isItemVisible ? tr('إطفاء وإخفاء العنصر', 'شاردنەوەی بڕگە', 'Hide item') : tr('تشغيل وإظهار العنصر', 'پیشاندانی بڕگە', 'Show item')}
                    title={isItemVisible ? tr('ظاهر في المنيو — اضغط للإطفاء', 'لە مینیۆ دیارە — کرتە بکە بۆ شاردنەوە', 'Visible in menu — click to hide') : tr('مخفي من المنيو — اضغط للتشغيل', 'لە مینیۆ شاراوەیە — کرتە بکە بۆ پیشاندان', 'Hidden from menu — click to show')}
                    onClick={() => handleToggleItemVisibility(item)}
                    className={`ios-switch ${isItemVisible ? 'on' : 'off'}`}
                  >
                    <span className="ios-switch-thumb" />
                  </button>
                  <span className={`mp-item-visibility-label ${isItemVisible ? 'is-visible' : ''}`}>
                    {isItemVisible ? tr('ظاهر', 'دیارە', 'Visible') : tr('مخفي', 'شاراوە', 'Hidden')}
                  </span>
                </div>

                <div className="mp-item-action-btns">
                  <button
                    type="button"
                    className={`mp-item-icon-btn ${hasSchedule ? 'is-scheduled' : ''}`}
                    onClick={() => openScheduleModal(item)}
                    title={tr('تعيين وقت توفر العنصر', 'دیاریکردنی کاتی بەردەستبوونی بڕگە', 'Set item availability schedule')}
                    aria-label={tr('تعيين وقت توفر العنصر', 'دیاریکردنی کاتی بەردەستبوونی بڕگە', 'Set item availability schedule')}
                  >
                    <Clock size={15} />
                  </button>

                  <button
                    type="button"
                    className="mp-item-icon-btn"
                    onClick={() => handleEditItem(item)}
                    title={tr('تعديل العنصر', 'دەستکاریکردنی بڕگە', 'Edit item')}
                    aria-label={tr(`تعديل ${item.n}`, `دەستکاری ${item.n}`, `Edit ${item.n}`)}
                  >
                    <Edit size={15} />
                  </button>

                  <button
                    type="button"
                    className="mp-item-icon-btn"
                    onClick={() => handleDeleteItem(item)}
                    title={tr('حذف العنصر', 'سڕینەوەی بڕگە', 'Delete item')}
                    aria-label={tr(`حذف ${item.n}`, `سڕینەوەی ${item.n}`, `Delete ${item.n}`)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Dedicated Schedule / Timer Modal opened from the row Clock button */}
      {scheduleModalItem && (
        <>
          <div className="drawer-backdrop" onClick={() => setScheduleModalItem(null)} />
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(480px, 94vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              ...surfaceCardStyle,
              borderRadius: '20px',
              padding: '18px 16px 20px',
              zIndex: 99999,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--ink)' }}>
                {tr(`توقيت توفر: ${scheduleModalItem.n}`, `کاتی بەردەستبوون: ${scheduleModalItem.n}`, `Availability: ${scheduleModalItem.n}`)}
              </h3>
              <button
                type="button"
                onClick={() => setScheduleModalItem(null)}
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
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveScheduleModal}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <AvailabilityScheduleEditor
                value={scheduleDraft}
                onChange={setScheduleDraft}
                targetLabel={tr('العنصر', 'بڕگەکە', 'Item')}
                inputStyle={themedInputStyle}
                flat
              />

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                <button
                  type="submit"
                  className="btn p"
                  style={{
                    minWidth: '180px',
                    height: '44px',
                    borderRadius: '12px',
                    padding: '0 26px',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tr('حفظ التوقيت', 'پاشەکەوتکردنی کات', 'Save Schedule')}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}

      {showBatchModal && (
        <>
          <div className="drawer-backdrop" onClick={() => setShowBatchModal(false)} />
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(480px, 92vw)',
              ...surfaceCardStyle,
              borderRadius: '20px',
              padding: '24px',
              zIndex: 99999,
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-ink, #34D399)', margin: 0 }}>
                {tr('إضافة عناصر سريعة بالجملة ✨', 'زیادکردنی خێرای بڕگە بە کۆمەڵ ✨', 'Quick Bulk Add Items ✨')}
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px' }}>
              {tr('أدخل كل عنصر في سطر منفصل بصيغة: ', 'هەر بڕگەیەک لە دێڕێکی جیاوازدا بنووسە بە شێوەی: ', 'Enter each item on a separate line as: ')}
              <b>{tr('الاسم - السعر - الوصف', 'ناو - نرخ - وەسف', 'Name - Price - Description')}</b>
            </p>

            <label className="f">
              {tr('قائمة العناصر', 'لیستی بڕگەکان', 'Items List')}
              <textarea
                value={batchLinesInput}
                onChange={(e) => setBatchLinesInput(e.target.value)}
                placeholder={tr(
                  'برجر دبل تشيز - 8500 - لحم طازج مع جبنة شيدر\nبيتزا مارجريتا - 9000 - عجينة إيطالية وموتزاريلا',
                  'دەبڵ چیز بەرگەر - 8500 - گۆشتی تازە لەگەڵ پەنیری چێدەر\nپیتزا مارگێریتا - 9000 - هەویری ئیتاڵی و مۆزارێلا',
                  'Double Cheeseburger - 8500 - Fresh beef with cheddar cheese\nMargherita Pizza - 9000 - Italian dough & mozzarella'
                )}
                rows={5}
                style={themedInputStyle}
              />
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn" onClick={() => setShowBatchModal(false)}>
                {tr('إلغاء', 'پاشگەزبوونەوە', 'Cancel')}
              </button>
              <button type="button" className="btn p" onClick={handleBatchAddItems} style={{ fontWeight: 800 }}>
                {tr('إضافة العناصر للمنيو', 'زیادکردنی بڕگەکان بۆ مینیۆ', 'Add Items to Menu')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};
