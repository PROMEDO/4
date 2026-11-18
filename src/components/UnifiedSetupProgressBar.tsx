/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

export type UnifiedSetupStage =
  | 'signup-form'
  | 'signup-verify'
  | 'onboard-info'
  | 'onboard-hours'
  | 'onboard-cats'
  | 'onboard-items'
  | 'onboard-ready';

interface UnifiedSetupProgressBarProps {
  stage: UnifiedSetupStage;
  onBackToSignupForm?: () => void;
  integrated?: boolean;
}

export const UnifiedSetupProgressBar: React.FC<UnifiedSetupProgressBarProps> = ({
  stage,
  onBackToSignupForm,
  integrated = true,
}) => {
  const { tr } = useTranslation();

  const UNIFIED_MILESTONES = [
    { id: 'account', label: tr('الحساب', 'هەژمار', 'Account') },
    { id: 'project', label: tr('المشروع', 'پڕۆژە', 'Business') },
    { id: 'hours', label: tr('الأوقات', 'کاتەکان', 'Hours') },
    { id: 'cats', label: tr('الأقسام', 'بەشەکان', 'Categories') },
    { id: 'items', label: tr('العناصر', 'بڕگەکان', 'Items') },
    { id: 'ready', label: tr('جاهز', 'ئامادە', 'Ready') },
  ] as const;

  const STAGE_META: Record<
    UnifiedSetupStage,
    { pct: number; activeIndex: number; title: string }
  > = {
    'signup-form': {
      pct: 16,
      activeIndex: 0,
      title: tr('إنشاء الحساب وتجهيز المنيو', 'دروستکردنی هەژمار و ئامادەکردنی مینیۆ', 'Create Account & Menu Setup'),
    },
    'signup-verify': {
      pct: 30,
      activeIndex: 0,
      title: tr('تأكيد الحساب لتجهيز المنيو', 'پشتڕاستکردنەوەی هەژمار بۆ مینیۆ', 'Verify Account for Menu Setup'),
    },
    'onboard-info': {
      pct: 46,
      activeIndex: 1,
      title: tr('بيانات المشروع الأساسية', 'زانیاری سەرەکی پڕۆژە', 'Basic Business Info'),
    },
    'onboard-hours': {
      pct: 62,
      activeIndex: 2,
      title: tr('ساعات التواجد والعمل', 'کاتژمێرەکانی کارکردن', 'Working Hours'),
    },
    'onboard-cats': {
      pct: 78,
      activeIndex: 3,
      title: tr('إضافة أقسام المنيو', 'زیادکردنی بەشەکانی مینیۆ', 'Add Menu Categories'),
    },
    'onboard-items': {
      pct: 92,
      activeIndex: 4,
      title: tr('إضافة العناصر والأصناف', 'زیادکردنی بڕگە و بەرهەمەکان', 'Add Menu Items'),
    },
    'onboard-ready': {
      pct: 100,
      activeIndex: 5,
      title: tr('المنيو جاهز للانطلاق', 'مینیۆ ئامادەیە بۆ دەستپێکردن', 'Your Menu Is Ready'),
    },
  };

  const meta = STAGE_META[stage];

  return (
    <div
      className={`aurora-progress-shell${integrated ? ' is-integrated' : ''}`}
      style={integrated ? undefined : { marginBottom: '20px' }}
    >
      <div className="aurora-progress-cloud-a" />
      <div className="aurora-progress-cloud-b" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <span className="aurora-icon-badge">
              <Sparkles size={13} />
            </span>
            <span className="aurora-title">
              {meta.title}
            </span>
          </div>

          <span dir="ltr" className="aurora-pct-pill">
            {meta.pct}%
          </span>
        </div>

        {/* Neon Aurora Track */}
        <div className="aurora-track" style={{ marginBottom: '13px' }}>
          <div className="aurora-fill" style={{ width: `${meta.pct}%` }}>
            <div className="aurora-fill-shimmer" />
            <div className="aurora-tip-orb" />
          </div>
        </div>

        {/* Unified 6-Stage Milestones */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: '4px',
            textAlign: 'center',
          }}
        >
          {UNIFIED_MILESTONES.map((m, idx) => {
            const isDone = meta.activeIndex > idx || stage === 'onboard-ready';
            const isCurrent = meta.activeIndex === idx && stage !== 'onboard-ready';
            const canClickAccount = idx === 0 && stage === 'signup-verify' && Boolean(onBackToSignupForm);
            const stateClass = isDone ? 'is-done' : isCurrent ? 'is-current' : '';

            return (
              <button
                key={m.id}
                type="button"
                disabled={!canClickAccount}
                onClick={() => {
                  if (canClickAccount && onBackToSignupForm) {
                    onBackToSignupForm();
                  }
                }}
                style={{
                  border: 0,
                  background: 'none',
                  padding: '2px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: canClickAccount ? 'pointer' : 'default',
                }}
              >
                <span className={`aurora-step-dot ${stateClass}`.trim()}>
                  {isDone ? <Check size={11} strokeWidth={3} /> : idx + 1}
                </span>

                <span className={`aurora-step-label ${stateClass}`.trim()}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
