/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { AvailabilitySchedule } from '../types';
import {
  formatScheduleLabel,
  getAvailabilityDays,
  getAvailabilityPresets,
  getScheduleWindows,
  isWithinAvailabilitySchedule,
  normalizeAvailabilitySchedule,
} from '../utils/availability';
import { useTranslation } from '../utils/i18n';

interface AvailabilityScheduleEditorProps {
  value: AvailabilitySchedule;
  onChange: (next: AvailabilitySchedule) => void;
  targetLabel?: string;
  inputStyle?: React.CSSProperties;
  flat?: boolean;
}

export const AvailabilityScheduleEditor: React.FC<AvailabilityScheduleEditorProps> = ({
  value,
  onChange,
  targetLabel,
  inputStyle,
  flat = false,
}) => {
  const { lang, tr } = useTranslation();
  const effectiveTarget = targetLabel || tr('العنصر', 'بڕگەکە', 'item');
  const presets = getAvailabilityPresets(lang);
  const days = getAvailabilityDays(lang);
  const sched = normalizeAvailabilitySchedule(value);
  const windows = getScheduleWindows(sched);
  const selectedDays = sched.days || [];
  const allDaysSelected = selectedDays.length === 0 || selectedDays.length === 7;
  const activeNow = sched.enabled ? isWithinAvailabilitySchedule(sched) : true;
  const scheduleSummary = sched.enabled ? formatScheduleLabel(sched, lang) : '';

  const updateWindows = (nextWindows: Array<{ from: string; to: string }>) => {
    const clean = nextWindows.length > 0 ? nextWindows : [{ from: '08:00', to: '12:00' }];
    onChange({
      ...sched,
      enabled: true,
      from: clean[0].from,
      to: clean[0].to,
      windows: clean,
    });
  };

  const toggleDay = (dayKey: string) => {
    const cur = new Set(selectedDays);
    if (cur.has(dayKey)) {
      cur.delete(dayKey);
    } else {
      cur.add(dayKey);
    }
    const arr = Array.from(cur);
    onChange({
      ...sched,
      days: arr.length === 7 ? [] : arr,
    });
  };

  const timeInputStyle: React.CSSProperties = {
    ...(inputStyle || {}),
    width: '100%',
    minWidth: 0,
    height: '40px',
    padding: '0 10px',
    borderRadius: '10px',
    border: '1px solid var(--line)',
    background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
    color: 'var(--ink)',
    fontSize: '13px',
    fontWeight: 800,
    textAlign: 'center',
    boxSizing: 'border-box',
    marginTop: 0,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 800,
    color: 'var(--muted)',
    marginBottom: '8px',
  };

  return (
    <div
      style={
        flat
          ? {
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid color-mix(in srgb, var(--line) 65%, transparent)',
              borderRadius: 0,
              padding: '14px 0 2px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }
          : {
              background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
              backdropFilter: 'blur(14px) saturate(1.25)',
              WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }
      }
    >
      {/* Header + Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
          <Clock
            size={17}
            style={{
              color: sched.enabled ? 'var(--brand-ink, #34D399)' : 'var(--muted)',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3 }}>
              {tr('متوفر بأوقات محددة', 'بە کاتە دیاریکراوەکان بەردەستە', 'Available at specific times')}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.35 }}>
              {tr(
                `حدد ساعات وأيام توفر ${effectiveTarget}`,
                `کاتژمێر و ڕۆژەکانی بەردەستبوونی ${effectiveTarget} دیاری بکە`,
                `Set available hours and days for this ${effectiveTarget}`
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: sched.enabled ? '#10b981' : 'var(--muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {sched.enabled
              ? tr('مفعّل', 'چالاککراوە', 'Enabled')
              : tr('متوفر دائماً', 'هەمیشە بەردەستە', 'Always available')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={sched.enabled}
            aria-label={tr(
              `تفعيل أوقات التوفر المحددة لـ ${effectiveTarget}`,
              `چالاککردنی کاتە دیاریکراوەکانی بەردەستبوون بۆ ${effectiveTarget}`,
              `Toggle scheduled availability for ${effectiveTarget}`
            )}
            onClick={() =>
              onChange({
                ...sched,
                enabled: !sched.enabled,
              })
            }
            className={`ios-switch ${sched.enabled ? 'on' : 'off'}`}
          >
            <span className="ios-switch-thumb" />
          </button>
        </div>
      </div>

      {sched.enabled && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line)',
          }}
        >
          {/* Quick Presets (2x2 clean grid) */}
          <div>
            <div style={sectionLabelStyle}>
              {tr('أوقات سريعة', 'کاتی خێرا', 'Quick presets')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '7px',
              }}
            >
              {presets.map((preset) => {
                const isSelected =
                  windows.length === 1 &&
                  windows[0].from === preset.from &&
                  windows[0].to === preset.to;
                return (
                  <button
                    key={preset.from + preset.to}
                    type="button"
                    onClick={() => updateWindows([{ from: preset.from, to: preset.to }])}
                    style={{
                      minHeight: '36px',
                      padding: '6px 8px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid var(--brand)' : '1px solid var(--line)',
                      background: isSelected
                        ? 'color-mix(in srgb, var(--brand) 16%, transparent)'
                        : 'var(--surface)',
                      color: isSelected ? 'var(--brand-ink, #34D399)' : 'var(--ink)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Windows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)' }}>
                {tr('ساعات التوفر اليومية', 'کاتژمێرەکانی بەردەستبوونی ڕۆژانە', 'Daily availability hours')}
              </span>
              {windows.length < 3 && (
                <button
                  type="button"
                  onClick={() => updateWindows([...windows, { from: '18:00', to: '23:00' }])}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    color: 'var(--ink)',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>{tr('فترة إضافية', 'ماوەی زیادە', 'Add window')}</span>
                </button>
              )}
            </div>

            {windows.map((win, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    windows.length > 1 ? 'minmax(0, 1fr) minmax(0, 1fr) 38px' : 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '8px',
                  alignItems: 'end',
                  background: 'color-mix(in srgb, var(--ink) 3%, transparent)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                <label className="f" style={{ marginBottom: 0, gap: '5px', minWidth: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                    {windows.length > 1
                      ? tr(`من (#${idx + 1})`, `لە (#${idx + 1})`, `From (#${idx + 1})`)
                      : tr('من الساعة', 'لە کاتژمێر', 'From')}
                  </span>
                  <input
                    type="time"
                    dir="ltr"
                    value={win.from}
                    onChange={(e) => {
                      const val = e.target.value || '08:00';
                      updateWindows(windows.map((row, i) => (i === idx ? { ...row, from: val } : row)));
                    }}
                    style={timeInputStyle}
                  />
                </label>

                <label className="f" style={{ marginBottom: 0, gap: '5px', minWidth: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                    {tr('إلى الساعة', 'بۆ کاتژمێر', 'To')}
                  </span>
                  <input
                    type="time"
                    dir="ltr"
                    value={win.to}
                    onChange={(e) => {
                      const val = e.target.value || '12:00';
                      updateWindows(windows.map((row, i) => (i === idx ? { ...row, to: val } : row)));
                    }}
                    style={timeInputStyle}
                  />
                </label>

                {windows.length > 1 && (
                  <button
                    type="button"
                    aria-label={tr('حذف الفترة', 'سڕینەوەی ماوە', 'Remove window')}
                    onClick={() => updateWindows(windows.filter((_, i) => i !== idx))}
                    style={{
                      width: '38px',
                      height: '40px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                      color: 'var(--ink)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Days Selector */}
          <div>
            <div style={sectionLabelStyle}>
              {tr('الأيام المتاحة', 'ڕۆژە بەردەستەکان', 'Available days')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => onChange({ ...sched, days: [] })}
                style={{
                  height: '36px',
                  padding: '0 4px',
                  borderRadius: '9px',
                  border: allDaysSelected ? '1px solid var(--brand)' : '1px solid var(--line)',
                  background: allDaysSelected
                    ? 'color-mix(in srgb, var(--brand) 18%, transparent)'
                    : 'var(--surface)',
                  color: allDaysSelected ? 'var(--brand-ink, #34D399)' : 'var(--ink)',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {tr('كل الأيام', 'هەموو ڕۆژەکان', 'All days')}
              </button>
              {days.map((day) => {
                const isSelected = !allDaysSelected && selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    style={{
                      height: '36px',
                      padding: '0 4px',
                      borderRadius: '9px',
                      border: isSelected ? '1px solid var(--brand)' : '1px solid var(--line)',
                      background: isSelected ? 'var(--brand)' : 'var(--surface)',
                      color: isSelected ? 'var(--on-brand, #fff)' : 'var(--ink)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Behavior Outside Hours */}
          <div>
            <div style={sectionLabelStyle}>
              {tr('خارج أوقات التوفر', 'لە دەرەوەی کاتە بەردەستەکان', 'Outside available hours')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '7px' }}>
              {[
                {
                  key: 'badge' as const,
                  active: sched.behavior !== 'hide',
                  title: tr('يظهر مع تنبيه الوقت', 'پیشاندان لەگەڵ ئاگادارکردنەوەی کات', 'Show with time notice'),
                  desc: tr(
                    `يظهر ${effectiveTarget} في المنيو مع تنبيه عدم توفره حالياً`,
                    `${effectiveTarget} لە مینیۆدا پیشان دەدرێت لەگەڵ ئاگاداریی بەردەستنەبوون`,
                    `Shows this ${effectiveTarget} on the menu with an unavailable badge`
                  ),
                },
                {
                  key: 'hide' as const,
                  active: sched.behavior === 'hide',
                  title: tr('إخفاء تلقائي خارج الوقت', 'شاردنەوەی خۆکار لە دەرەوەی کات', 'Auto-hide outside hours'),
                  desc: tr(
                    `يختفي ${effectiveTarget} تلقائياً خارج الساعات المحددة`,
                    `${effectiveTarget} بە شێوەیەکی خۆکار لە دەرەوەی کاتە دیاریکراوەکان دەشاردرێتەوە`,
                    `Automatically hides this ${effectiveTarget} outside scheduled hours`
                  ),
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChange({ ...sched, behavior: opt.key })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'start',
                    padding: '10px 12px',
                    borderRadius: '11px',
                    border: opt.active ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                    background: opt.active
                      ? 'color-mix(in srgb, var(--brand) 10%, var(--surface))'
                      : 'var(--surface)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: opt.active ? '5px solid var(--brand)' : '1.5px solid var(--muted)',
                      background: opt.active ? '#fff' : 'transparent',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, lineHeight: 1.3 }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.35 }}>
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Status Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '9px 12px',
              borderRadius: '10px',
              background: activeNow ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.12)',
              border: activeNow
                ? '1px solid rgba(16, 185, 129, 0.28)'
                : '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '11.5px',
              fontWeight: 700,
              color: activeNow ? '#10b981' : '#f59e0b',
            }}
          >
            <span>
              {activeNow
                ? tr('متاح حالياً حسب التوقيت الآن', 'ئێستا بەپێی کات بەردەستە', 'Currently available now')
                : sched.behavior === 'hide'
                ? tr('خارج الوقت الآن — مخفي من المنيو', 'ئێستا لە دەرەوەی کاتە — لە مینیۆ شاردراوەتەوە', 'Outside hours now — hidden from menu')
                : tr('خارج الوقت الآن — يظهر كغير متاح', 'ئێستا لە دەرەوەی کاتە — وەک بەردەستنییە پیشان دەدرێت', 'Outside hours now — shown as unavailable')}
            </span>
            {scheduleSummary && (
              <span style={{ color: 'var(--ink)', fontSize: '11.5px', fontWeight: 800 }}>
                {scheduleSummary}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
