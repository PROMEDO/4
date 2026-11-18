/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  GitBranch,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { getCollection } from '../../utils/storage';
import { Category, MenuItem } from '../../types';
import { getFullSubdomainUrl, getPublicMenuUrlPath } from '../../utils/businessDefaults';
import { surfaceCardStyle, themedInputStyle, useDashboard } from './DashboardContext';

export const BranchesPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const {
    tr,
    mainRid,
    activeRid,
    mainRest,
    branchesList,
    resolvedPlan,
    site,
    switchActiveBranch,
    createBranch,
    cloneMainMenuToBranch,
    deleteBranch,
    copyLink,
    onNavigate,
    openUpgradeModal,
    showToast,
  } = useDashboard();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [cloneOnCreate, setCloneOnCreate] = useState(true);

  const maxB = resolvedPlan.maxBranches;
  const isLocked = maxB === 0;
  const atLimit = maxB !== -1 && branchesList.length >= maxB;

  const allCats = getCollection<Category>('cats');
  const allItems = getCollection<MenuItem>('items');

  const getBranchUrl = (r: typeof mainRest) => {
    const sub = getFullSubdomainUrl(r, site, resolvedPlan);
    if (sub) return sub;
    return `${window.location.origin}${getPublicMenuUrlPath(r, resolvedPlan)}`;
  };

  const handleOpenCreateModal = () => {
    if (isLocked) {
      openUpgradeModal('pro');
      return;
    }
    if (atLimit) {
      showToast(
        tr(
          `وصلت للحد الأقصى للأفرع في باقتك (${maxB} فرع) 🔒`,
          `گەیشتوویتە سنووری زۆرترین لق لە پاکێجەکەت (${maxB} لق) 🔒`,
          `You reached the maximum branches in your plan (${maxB}) 🔒`
        )
      );
      openUpgradeModal('vip');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = createBranch(newBranchName, newBranchPhone, newBranchAddress, cloneOnCreate);
    if (ok) {
      setNewBranchName('');
      setNewBranchPhone('');
      setNewBranchAddress('');
      setShowCreateModal(false);
    }
  };

  return (
    <>
      {branchesList.length === 0 ? (
        <div
          style={{
            minHeight: 'calc(100dvh - 150px)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn p"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            style={{
              height: '46px',
              padding: '0 24px',
              borderRadius: '14px',
              fontSize: '14.5px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 28px color-mix(in srgb, var(--brand) 28%, transparent)',
            }}
          >
            <Plus size={18} />
            <span>{tr('إضافة فرع جديد', 'زیادکردنی لقی نوێ', 'Add New Branch')}</span>
          </motion.button>
        </div>
      ) : (
        <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <motion.button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn p"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              style={{
                height: '44px',
                padding: '0 22px',
                borderRadius: '13px',
                fontSize: '14px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={17} />
              <span>{tr('إضافة فرع جديد', 'زیادکردنی لقی نوێ', 'Add New Branch')}</span>
            </motion.button>
          </div>

          {/* Main Branch + Child Branches List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const isManagingMain = activeRid === mainRid;
              const mainCatsCount = allCats.filter((c) => c.rid === mainRid).length;
              const mainItemsCount = allItems.filter((i) => i.rid === mainRid).length;
              const mainUrl = getBranchUrl(mainRest);

              return (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    ...surfaceCardStyle,
                    borderRadius: '18px',
                    padding: '18px 20px',
                    border: isManagingMain ? '2px solid var(--brand)' : '1px solid var(--line)',
                    background: isManagingMain ? 'var(--soft)' : 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <GitBranch size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <b style={{ fontSize: '16px', color: 'var(--ink)' }}>
                          {mainRest.n} ({tr('الفرع الرئيسي', 'لقی سەرەکی', 'Main Branch')})
                        </b>
                        {isManagingMain && (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.16)', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> {tr('نشط الآن في اللوحة', 'ئێستا لە پانێڵ چالاکە', 'Active in Dashboard')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '3px' }}>
                        {mainCatsCount} {tr('أقسام', 'بەش', 'categories')} • {mainItemsCount} {tr('عنصر', 'بڕگە', 'items')} • {mainRest.address || tr('العنوان الرئيسي', 'ناونیشانی سەرەکی', 'Main Address')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!isManagingMain && (
                      <button
                        type="button"
                        onClick={() => switchActiveBranch(mainRid)}
                        className="btn p s"
                        style={{ fontWeight: 800 }}
                      >
                        {tr('إدارة الرئيسي الآن', 'بەڕێوەبردنی سەرەکی ئێستا', 'Manage Main Branch')}
                      </button>
                    )}
                    <button type="button" onClick={() => copyLink(mainUrl)} className="btn s">
                      <Copy size={14} />
                      <span>{tr('نسخ الرابط', 'کۆپیکردنی بەستەر', 'Copy Link')}</span>
                    </button>
                    {getFullSubdomainUrl(mainRest, site, resolvedPlan) ? (
                      <a
                        href={mainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn s"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} />
                        <span>{tr('فتح المنيو', 'کردنەوەی مینیۆ', 'Open Menu')}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate(getPublicMenuUrlPath(mainRest, resolvedPlan))}
                        className="btn s"
                      >
                        <ExternalLink size={14} />
                        <span>{tr('فتح المنيو', 'کردنەوەی مینیۆ', 'Open Menu')}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {branchesList.map((branch, idx) => {
              const isManagingThis = activeRid === branch.id;
              const branchLabel = branch.branchName || branch.n;
              const branchCats = allCats.filter((c) => c.rid === branch.id).length;
              const branchItems = allItems.filter((i) => i.rid === branch.id).length;
              const branchUrl = getBranchUrl(branch);

              return (
                <motion.div
                  key={branch.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.82, delay: prefersReducedMotion ? 0 : Math.min(idx * 0.07, 0.35), ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    ...surfaceCardStyle,
                    borderRadius: '18px',
                    padding: '18px 20px',
                    border: isManagingThis ? '2px solid var(--brand)' : '1px solid var(--line)',
                    background: isManagingThis ? 'var(--soft)' : 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <b style={{ fontSize: '15.5px', color: 'var(--ink)' }}>🏢 {branchLabel}</b>
                      {isManagingThis && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.16)', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> {tr('قيد الإدارة الآن', 'ئێستا لە بەڕێوەبردندایە', 'Currently Managing')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '3px' }}>
                      {branchCats} {tr('أقسام', 'بەش', 'categories')} • {branchItems} {tr('عنصر', 'بڕگە', 'items')} • 📞 {branch.ph || mainRest.ph}
                      {branch.address ? ` • 📍 ${branch.address}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!isManagingThis && (
                      <button
                        type="button"
                        onClick={() => switchActiveBranch(branch.id)}
                        className="btn p s"
                        style={{ fontWeight: 800 }}
                      >
                        {tr('إدارة منيو هذا الفرع', 'بەڕێوەبردنی مینیۆی ئەم لقە', 'Manage Branch Menu')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cloneMainMenuToBranch(branch.id, branchLabel)}
                      className="btn s"
                      title={tr('استيراد نسخة من منيو الفرع الرئيسي', 'هاوردەکردنی کۆپییەک لە مینیۆی لقی سەرەکی', 'Copy main branch menu here')}
                    >
                      <RefreshCw size={14} />
                      <span>{tr('نسخ منيو الرئيسي هنا', 'کۆپیکردنی مینیۆی سەرەکی بۆ ئێرە', 'Sync Main Menu')}</span>
                    </button>
                    <button type="button" onClick={() => copyLink(branchUrl)} className="btn s">
                      <Copy size={14} />
                      <span>{tr('الرابط', 'بەستەر', 'Link')}</span>
                    </button>
                    {getFullSubdomainUrl(branch, site, resolvedPlan) ? (
                      <a
                        href={branchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn s"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} />
                        <span>{tr('فتح', 'کردنەوە', 'Open')}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate(getPublicMenuUrlPath(branch, resolvedPlan))}
                        className="btn s"
                      >
                        <ExternalLink size={14} />
                        <span>{tr('فتح', 'کردنەوە', 'Open')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteBranch(branch.id, branchLabel)}
                      className="btn s d"
                      title={tr('حذف الفرع', 'سڕینەوەی لق', 'Delete Branch')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Branch Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.55 }}
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.58)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.form
              onSubmit={handleCreate}
              onClick={(e) => e.stopPropagation()}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                ...surfaceCardStyle,
                width: '100%',
                maxWidth: '480px',
                borderRadius: '20px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
                    <Plus size={18} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 900, color: 'var(--ink)' }}>
                    {tr('إضافة فرع جديد', 'زیادکردنی لقی نوێ', 'Add New Branch')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  aria-label={tr('إغلاق', 'داخستن', 'Close')}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    color: 'var(--muted)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <label className="f" style={{ margin: 0 }}>
                {tr('اسم الفرع * (مثال: فرع المنصور)', 'ناوی لق * (نموونە: لقی مەنسوور)', 'Branch Name * (e.g. Downtown Branch)')}
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder={tr('مثال: فرع المنصور', 'نموونە: لقی مەنسوور', 'e.g. Mansour Branch')}
                  style={themedInputStyle}
                />
              </label>

              <label className="f" style={{ margin: 0 }}>
                {tr('رقم هاتف / واتساب الفرع (اختياري)', 'ژمارەی تەلەفۆن / واتسئەپی لق (ئارەزوومەندانە)', 'Branch Phone / WhatsApp (optional)')}
                <input
                  type="tel"
                  dir="ltr"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder={mainRest.ph || '07701234567'}
                  style={{ ...themedInputStyle, textAlign: 'left' }}
                />
              </label>

              <label className="f" style={{ margin: 0 }}>
                {tr('عنوان الفرع (اختياري)', 'ناونیشانی لق (ئارەزوومەندانە)', 'Branch Address (optional)')}
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder={tr('مثال: بغداد - المنصور شارع 14 رمضان', 'نموونە: هەولێر - شەقامی ١٠٠ مەتری', 'e.g. 14th Ramadan St, Mansour')}
                  style={themedInputStyle}
                />
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                <input
                  type="checkbox"
                  checked={cloneOnCreate}
                  onChange={(e) => setCloneOnCreate(e.target.checked)}
                />
                <span>{tr('نسخ منيو الفرع الرئيسي (الأقسام والأصناف) إلى هذا الفرع تلقائياً', 'کۆپیکردنی مینیۆی لقی سەرەکی (بەش و بڕگەکان) بۆ ئەم لقە بە شێوەی خۆکار', 'Automatically copy main menu (categories & items) to this branch')}</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn s"
                >
                  {tr('إلغاء', 'پاشگەزبوونەوە', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn p"
                  style={{ fontWeight: 800 }}
                >
                  <Plus size={16} />
                  <span>{tr('إنشاء الفرع وتفعيله', 'دروستکردن و چالاککردنی لق', 'Create & Activate Branch')}</span>
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
