/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Eye, GitBranch, LogOut, MessageCircle, Share2, Store, X } from 'lucide-react';
import { AppLogo } from '../../components/AppLogo';
import { AjaxConfirmModal } from '../../components/AjaxConfirmModal';
import { PlanPurchaseModal } from '../../components/PlanPurchaseModal';
import { ShareMenuModal } from '../../components/ShareMenuModal';
import { ReportProblemModal } from '../../components/ReportProblemModal';
import { LanguageSelector } from '../../components/LanguageSelector';
import { DEFAULT_SITE } from '../../utils/storage';
import { getLocalizedPlanName } from '../../utils/plans';
import {
  DashboardProvider,
  DashboardTab,
  DashboardViewProps,
  useDashboard,
} from './DashboardContext';
import { HomePage } from './HomePage';
import { StatsPage } from './StatsPage';
import { CategoriesPage } from './CategoriesPage';
import { ItemsPage } from './ItemsPage';
import { AddonsPage } from './AddonsPage';
import { AppearancePage } from './AppearancePage';
import { BranchesPage } from './BranchesPage';
import { OrdersPage } from './OrdersPage';
import { QrPage } from './QrPage';
import { SettingsPage } from './SettingsPage';
import { TelegramPage } from './TelegramPage';

const DashboardShell: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const {
    session,
    lang,
    setLang,
    isRtl,
    tr,
    navTabs,
    site,
    mainRid,
    activeRid,
    mainRest,
    rest,
    branchesList,
    switchActiveBranch,
    resolvedPlan,
    purchaseModalPlan,
    setPurchaseModalPlan,
    customTabLabel,
    supportWaHref,
    publicPath,
    liveMenuUrl,
    shareModalOpen,
    setShareModalOpen,
    openShareModal,
    activeTab,
    setActiveTab,
    drawerOpen,
    setDrawerOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    setIsItemEditorOpen,
    newOrdersCount,
    ajaxDialog,
    setAjaxDialog,
    flushPendingAppearanceSave,
    onNavigate,
    onLogout,
    showToast,
  } = useDashboard();

  const isTabLocked = (tabId: DashboardTab): boolean => {
    if (tabId === 'stats') return !resolvedPlan.perms.analytics;
    if (tabId === 'branches') return resolvedPlan.maxBranches === 0;
    if (tabId === 'qr') return !resolvedPlan.perms.qrCode;
    return false;
  };

  // Respect admin site?.dashboardTabOrder when defined, otherwise keep home -> unlocked -> locked -> set
  const orderedTabs = (() => {
    const customOrder = site?.dashboardTabOrder;
    if (Array.isArray(customOrder) && customOrder.length > 0) {
      const rank = new Map<string, number>();
      customOrder.forEach((id, idx) => {
        rank.set(id === 'items' ? 'menu' : id === 'ord' ? 'orders' : id, idx);
      });
      return [...navTabs].sort((a, b) => {
        const ra = rank.has(a.id) ? rank.get(a.id)! : 999;
        const rb = rank.has(b.id) ? rank.get(b.id)! : 999;
        return ra - rb;
      });
    }
    const homeTab = navTabs.find((t) => t.id === 'home');
    const settingsTab = navTabs.find((t) => t.id === 'set');
    const middle = navTabs.filter((t) => t.id !== 'home' && t.id !== 'set');
    const unlockedMiddle = middle.filter((t) => !isTabLocked(t.id));
    const lockedMiddle = middle.filter((t) => isTabLocked(t.id));
    return [
      ...(homeTab ? [homeTab] : []),
      ...unlockedMiddle,
      ...lockedMiddle,
      ...(settingsTab ? [settingsTab] : []),
    ];
  })();

  const activeNavTab = navTabs.find((t) => t.id === activeTab);
  const activeTabTitle = activeNavTab
    ? customTabLabel(activeNavTab.id, activeNavTab.label)
    : tr('لوحة التحكم', 'داشبۆرد', 'Dashboard');
  useEffect(() => {
    document.title = `${activeTabTitle} | ${rest.n || tr('منيو بلس', 'مینیۆ پڵەس', 'Menu+')}`;
  }, [activeTabTitle, rest.n, lang]);

  const localizedPlanTitle = getLocalizedPlanName(resolvedPlan.plan, lang);
  const lockedTooltip = tr('متاح في الباقات الأعلى', 'لە پاکێجە باڵاکاندا بەردەستە', 'Available on higher plans');

  const renderBranchSwitcher = () => {
    if (branchesList.length === 0) return null;
    return (
      <div style={{ marginTop: '10px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--muted)',
            marginBottom: '4px',
          }}
        >
          <GitBranch size={12} style={{ color: 'var(--brand-ink, #34D399)' }} />
          <span>{tr('الفرع النشط:', 'لقی چالاک:', 'Active Branch:')}</span>
        </label>
        <select
          value={activeRid}
          onChange={(e) => switchActiveBranch(e.target.value)}
          style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 10px',
            minHeight: '34px',
            borderRadius: '9px',
            background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
        >
          <option value={mainRid}>
            {mainRest.n} ({tr('الرئيسي', 'سەرەکی', 'Main')})
          </option>
          {branchesList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName || b.n}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderNavFooter = (closeDrawer?: boolean) => (
    <>
      <div className="sb-nav-divider" />

      <div className="sb-footer-inline">
        <button
          type="button"
          className="sb-footer-item"
          onClick={() => {
            if (closeDrawer) setDrawerOpen(false);
            setReportModalOpen(true);
          }}
        >
          <AlertTriangle size={17} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span>{tr('إبلاغ عن مشكلة', 'ئاگادارکردنەوەی کێشە', 'Report a Problem')}</span>
        </button>

        <a
          href={supportWaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="sb-footer-item"
          onClick={() => {
            if (closeDrawer) setDrawerOpen(false);
          }}
        >
          <MessageCircle size={17} style={{ color: '#25D366', flexShrink: 0 }} />
          <span>{tr('احصل على مساعدة', 'یارمەتی وەربگرە', 'Get Help')}</span>
        </a>

        <button
          type="button"
          className="sb-footer-item is-danger"
          onClick={() => {
            if (closeDrawer) setDrawerOpen(false);
            onLogout();
          }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          <span>{tr('تسجيل الخروج', 'چوونەدەرەوە', 'Log Out')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`shell customer-shell ${sidebarCollapsed ? 'collapsed' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* SLIDE-OVER DRAWER (Mobile Hamburger Menu) */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer-panel" style={{ zIndex: 9999 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onNavigate('/');
                }}
                style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title={tr('الصفحة الرئيسية للموقع', 'پەڕەی سەرەکی ماڵپەڕ', 'Platform Homepage')}
              >
                <AppLogo size={32} />
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={tr('إغلاق القائمة', 'داخستنی لیست', 'Close menu')}
                style={{ background: 'none', border: '1px solid var(--line)', borderRadius: '9px', width: '32px', height: '32px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '10px 10px 16px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  padding: '7px 10px',
                  background: 'var(--soft)',
                  borderRadius: '9px',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  color: 'var(--brand-ink, #34D399)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Store size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rest.n}
                  </span>
                </span>
                <span style={{ fontSize: '10.5px', opacity: 0.85, flexShrink: 0 }}>
                  {localizedPlanTitle}
                </span>
              </div>

              {branchesList.length > 0 && (
                <div style={{ marginBottom: '10px' }}>{renderBranchSwitcher()}</div>
              )}

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {orderedTabs.map((tab) => {
                  const IconComp = tab.Icon;
                  const isActive = activeTab === tab.id;
                  const isLocked = isTabLocked(tab.id);
                  const label = customTabLabel(tab.id, tab.label);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsItemEditorOpen(false);
                        setDrawerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 11px',
                        borderRadius: '10px',
                        background: isActive ? 'var(--soft)' : 'transparent',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--brand-ink, #34D399)' : 'var(--ink)',
                        opacity: isLocked ? 0.62 : 1,
                        border: 0,
                        width: '100%',
                        textAlign: 'start',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <IconComp size={17} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                      </span>
                      {tab.id === 'orders' && newOrdersCount > 0 && (
                        <span className="bd">{newOrdersCount}</span>
                      )}
                      {isLocked && (
                        <span style={{ fontSize: '11px', flexShrink: 0 }} title={lockedTooltip}>
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}

                {renderNavFooter(true)}
              </nav>
            </div>
          </aside>
        </>
      )}

      {/* DESKTOP SIDEBAR (Matches Admin Sidebar Design) */}
      <aside className="sb desktop-only">
        <div className="lg">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title={tr('العودة للصفحة الرئيسية', 'گەڕانەوە بۆ پەڕەی سەرەکی', 'Back to Homepage')}
          >
            <AppLogo size={36} />
          </button>

          <div
            style={{
              marginTop: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '16px',
              background: 'var(--soft)',
              color: 'var(--brand-ink, #34D399)',
              fontSize: '12px',
              fontWeight: 'bold',
              maxWidth: '100%',
            }}
          >
            <Store size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rest.n}
            </span>
          </div>
          <small style={{ marginTop: '4px', paddingInlineStart: '2px' }}>
            {localizedPlanTitle}
          </small>

          {renderBranchSwitcher()}
        </div>

        <nav>
          {orderedTabs.map((tab) => {
            const IconComp = tab.Icon;
            const isActive = activeTab === tab.id;
            const isLocked = isTabLocked(tab.id);
            const label = customTabLabel(tab.id, tab.label);
            return (
              <button
                key={tab.id}
                type="button"
                className={isActive ? 'on' : ''}
                style={isLocked ? { opacity: 0.62 } : undefined}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsItemEditorOpen(false);
                }}
              >
                <IconComp size={17} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                {tab.id === 'orders' && newOrdersCount > 0 && (
                  <span className="bd">{newOrdersCount}</span>
                )}
                {isLocked && (
                  <span style={{ fontSize: '11px', flexShrink: 0 }} title={lockedTooltip}>
                    🔒
                  </span>
                )}
              </button>
            );
          })}

          {renderNavFooter(false)}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="mn">
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => {
                if (window.innerWidth <= 900) {
                  setDrawerOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              title={
                sidebarCollapsed
                  ? tr('إظهار القائمة الجانبية', 'پیشاندانی لیستی لاوەکی', 'Show Sidebar')
                  : tr('إخفاء / إظهار القائمة', 'شاردنەوە / پیشاندانی لیست', 'Toggle Sidebar')
              }
              aria-label={tr('القائمة', 'لیست', 'Menu')}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeTabTitle}
            </span>

            {branchesList.length > 0 && (
              <div className="mp-topbar-branch-switch" title={tr('تبديل الفرع للتعديل', 'گۆڕینی لق بۆ دەستکاریکردن', 'Switch branch to edit')}>
                <GitBranch size={13} style={{ color: 'var(--brand-ink, #34D399)', flexShrink: 0 }} />
                <select
                  aria-label={tr('تبديل الفرع', 'گۆڕینی لق', 'Switch branch')}
                  value={activeRid}
                  onChange={(e) => switchActiveBranch(e.target.value)}
                >
                  <option value={mainRid}>{tr('الفرع الرئيسي', 'لقی سەرەکی', 'Main Branch')}</option>
                  {branchesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branchName || b.n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mp-dash-topbar-actions">
            <LanguageSelector currentLang={lang} onChange={setLang} compact />

            <button
              type="button"
              className="mp-dash-topbar-btn"
              onClick={openShareModal}
              aria-label={tr('مشاركة المنيو', 'هاوبەشکردنی مینیۆ', 'Share Menu')}
              title={tr('مشاركة المنيو', 'هاوبەشکردنی مینیۆ', 'Share Menu')}
            >
              <Share2 size={18} />
              <span className="mp-dash-topbar-label">{tr('مشاركة المنيو', 'هاوبەشکردنی مینیۆ', 'Share Menu')}</span>
            </button>

            <button
              type="button"
              className="mp-dash-topbar-btn is-primary"
              onClick={() => {
                void flushPendingAppearanceSave();
                onNavigate(publicPath);
              }}
              aria-label={tr('معاينة المنيو', 'پێشبینینی مینیۆ', 'Preview Menu')}
              title={tr('معاينة المنيو', 'پێشبینینی مینیۆ', 'Preview Menu')}
            >
              <Eye size={18} />
              <span className="mp-dash-topbar-label">{tr('معاينة المنيو', 'پێشبینینی مینیۆ', 'Preview Menu')}</span>
            </button>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'home' && <HomePage />}
          {activeTab === 'cats' && <CategoriesPage />}
          {activeTab === 'menu' && <ItemsPage />}
          {activeTab === 'orders' && <OrdersPage />}
          {activeTab === 'stats' && <StatsPage />}
          {activeTab === 'appearance' && <AppearancePage />}
          {activeTab === 'branches' && <BranchesPage />}
          {activeTab === 'addons' && <AddonsPage />}
          {activeTab === 'qr' && <QrPage />}
          {activeTab === 'telegram' && <TelegramPage />}
          {activeTab === 'set' && <SettingsPage />}
        </motion.div>
      </main>

      <AjaxConfirmModal
        dialog={ajaxDialog}
        onClose={() => setAjaxDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <PlanPurchaseModal
        isOpen={Boolean(purchaseModalPlan)}
        plan={purchaseModalPlan}
        site={site || DEFAULT_SITE}
        restaurantName={mainRest.n}
        onClose={() => setPurchaseModalPlan(null)}
      />

      <ShareMenuModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        menuName={rest.n}
        menuUrl={liveMenuUrl}
        description={rest.tagline}
        onCopied={showToast}
      />

      <ReportProblemModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        rest={rest}
        session={session}
        showToast={showToast}
      />
    </div>
  );
};

export const DashboardPage: React.FC<DashboardViewProps> = (props) => (
  <DashboardProvider valueProps={props}>
    <DashboardShell />
  </DashboardProvider>
);

export const DashboardView = DashboardPage;
