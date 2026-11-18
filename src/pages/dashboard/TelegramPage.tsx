/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { useDashboard, surfaceCardStyle, themedInputStyle } from './DashboardContext';
import { copyTextReliable, syncFromServer } from '../../utils/storage';
import { translateServerError } from '../../utils/i18n';
import {
  DashboardTelegramStatus,
  fetchDashboardTelegramStatusApi,
  linkDashboardTelegramApi,
  testDashboardTelegramApi,
  toggleDashboardTelegramApi,
  unlinkDashboardTelegramApi,
  verifyDashboardTelegramApi,
} from '../../utils/adminApi';

const DEFAULT_TELEGRAM_PROXY_URL =
  'https://t.me/proxy?server=heremit.larval.nonce.rubricate.textbook.watchpinoyteleserye.com&port=1250&secret=eeeaa279236535275f4071a1279335415773332e616d617a6f6e6177732e636f6d&bot=@mtpro_xyz_bot&channel=@mtpro_xyz';

const CUSTOM_PROXY_STORAGE_KEY = 'menuplus_custom_telegram_proxy';

function sanitizeTelegramProxyLink(raw: string): string {
  const clean = String(raw || '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, '')
    .trim();
  if (!clean) return '';
  if (/^tg:\/\/proxy\?/i.test(clean)) {
    const query = clean.slice('tg://proxy?'.length);
    const params = new URLSearchParams(query);
    return params.get('server')?.trim() ? `tg://proxy?${query}` : '';
  }
  try {
    const candidate = /^t\.me\/proxy\?/i.test(clean) ? `https://${clean}` : clean;
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    const host = parsed.hostname.toLowerCase();
    if (host !== 't.me' && host !== 'telegram.me') return '';
    if (!parsed.pathname.toLowerCase().startsWith('/proxy')) return '';
    if (!parsed.searchParams.get('server')?.trim()) return '';
    parsed.protocol = 'https:';
    return parsed.toString();
  } catch {
    return '';
  }
}

export const TelegramPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { lang, tr, rid, rest, showToast, onRefresh, setActiveTab } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DashboardTelegramStatus | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>(() => rest.telegramPhone || rest.ph || '');
  const [awaitingShare, setAwaitingShare] = useState(false);
  const [botUrl, setBotUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [customProxyUrl, setCustomProxyUrl] = useState<string>(() => {
    try {
      const saved = window.localStorage.getItem(CUSTOM_PROXY_STORAGE_KEY) || '';
      return sanitizeTelegramProxyLink(saved);
    } catch {
      return '';
    }
  });
  const [showCustomProxyForm, setShowCustomProxyForm] = useState(false);
  const [proxyDraft, setProxyDraft] = useState<string>(() => {
    try {
      return window.localStorage.getItem(CUSTOM_PROXY_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [proxyError, setProxyError] = useState('');

  const loadStatus = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetchDashboardTelegramStatusApi(rid);
        setStatus(res);
        if (res.telegramPhone && !awaitingShare) {
          setPhoneInput((prev) => prev || res.telegramPhone);
        }
        if (res.linked) {
          setAwaitingShare(false);
          setBotUrl('');
        }
      } catch (err: unknown) {
        if (!silent) {
          setError(
            err instanceof Error
              ? translateServerError(err.message, lang)
              : tr('تعذر تحميل حالة الربط مع تيليجرام.', 'بارکردنی دۆخی بەستنەوەی تێلیگرام سەرکەوتوو نەبوو.', 'Unable to load Telegram connection status.')
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [rid, awaitingShare, lang]
  );

  useEffect(() => {
    void loadStatus(false);
  }, [rid]);

  // Poll automatically while waiting for owner to share their phone contact in the bot
  useEffect(() => {
    if (!awaitingShare || status?.linked) return;
    let active = true;

    const checkNow = async () => {
      try {
        const res = await fetchDashboardTelegramStatusApi(rid);
        if (!active) return;
        setStatus(res);
        if (res.linked) {
          setAwaitingShare(false);
          setBotUrl('');
          setInfoMsg(tr('تم ربط رقمك مع بوت تيليجرام بنجاح! ستصلك طلبات متجرك فوراً ✓', 'ژمارەکەت بە سەرکەوتوویی بە بۆتی تێلیگرام بەسترایەوە! داواکارییەکان یەکسەر دەگەن ✓', 'Your number is now linked to the Telegram bot! New orders will arrive here instantly ✓'));
          showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
          await syncFromServer();
          onRefresh();
        }
      } catch {
        // ignore transient poll errors
      }
    };

    const handleWake = () => {
      if (document.visibilityState !== 'hidden') {
        void checkNow();
      }
    };
    window.addEventListener('focus', handleWake);
    document.addEventListener('visibilitychange', handleWake);
    const timer = window.setInterval(checkNow, 2500);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', handleWake);
      document.removeEventListener('visibilitychange', handleWake);
    };
  }, [awaitingShare, status?.linked, rid, showToast, onRefresh]);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 7) {
      setError(tr('يرجى إدخال رقم هاتف صحيح أولاً.', 'تکایە سەرەتا ژمارەی مۆبایلی دروست بنووسە.', 'Please enter a valid phone number first.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await linkDashboardTelegramApi(rid, cleanPhone);
      if (!res.ok) {
        setError(res.message ? translateServerError(res.message, lang) : tr('تعذر بدء ربط تيليجرام.', 'دەستپێکردنی بەستنەوەی تێلیگرام سەرکەوتوو نەبوو.', 'Unable to initiate Telegram linking.'));
        return;
      }
      setBotUrl(res.botUrl || '');
      if (res.linked) {
        setAwaitingShare(false);
        setInfoMsg(tr('تم ربط رقمك بنجاح ✓', 'ژمارەکەت بە سەرکەوتوویی بەسترایەوە ✓', 'Phone number linked successfully ✓'));
        showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
        await syncFromServer();
        onRefresh();
        await loadStatus(true);
      } else {
        setAwaitingShare(true);
        setInfoMsg(tr('افتح البوت وشارك رقم هاتفك لتفعيل استلام الطلبات.', 'بۆتەکە بکەرەوە و ژمارەی مۆبایلەکەت هاوبەش بکە بۆ چالاککردن.', 'Open the bot and share your phone contact to activate order alerts.'));
      }
    } catch {
      setError(tr('حدث خطأ أثناء الاتصال بالخادم.', 'هەڵە لە پەیوەندیکردن بە سێرڤەر ڕوویدا.', 'Server connection error.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (nextEnabled: boolean) => {
    setError('');
    setToggling(true);
    try {
      await toggleDashboardTelegramApi(rid, nextEnabled);
      await syncFromServer();
      onRefresh();
      await loadStatus(true);
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? translateServerError(err.message, lang)
          : tr('تعذر تحديث الإعداد.', 'نوێکردنەوەی ڕێکخستن سەرکەوتوو نەبوو.', 'Unable to update setting.')
      );
    } finally {
      setToggling(false);
    }
  };

  const handleSendTestOrder = async () => {
    setError('');
    setInfoMsg('');
    setTesting(true);
    try {
      const res = await testDashboardTelegramApi(rid);
      if (res.ok) {
        setInfoMsg(tr('تم إرسال طلب تجريبي إلى حسابك في تيليجرام ✓', 'داواکاری تاقیکردنەوە بۆ هەژماری تێلیگرامەکەت نێردرا ✓', 'Test order sent to your Telegram ✓'));
        showToast(tr('تم إرسال الطلب التجريبي إلى تيليجرام ✓', 'داواکاری تاقیکردنەوە نێردرا بۆ تێلیگرام ✓', 'Test order sent to Telegram ✓'));
      } else {
        setError(res.message ? translateServerError(res.message, lang) : tr('تعذر إرسال الطلب التجريبي.', 'ناردنی داواکاری تاقیکردنەوە سەرکەوتوو نەبوو.', 'Unable to send test order.'));
      }
    } catch {
      setError(tr('تعذر الاتصال بالخادم لإرسال الطلب التجريبي.', 'پەیوەندی بە سێرڤەر نەکرا بۆ ناردنی تاقیکردنەوە.', 'Server connection failed while sending test order.'));
    } finally {
      setTesting(false);
    }
  };

  const handleUnlink = async () => {
    setError('');
    setInfoMsg('');
    setUnlinking(true);
    try {
      await unlinkDashboardTelegramApi(rid);
      await syncFromServer();
      onRefresh();
      setAwaitingShare(false);
      setBotUrl('');
      setStatus((prev) =>
        prev ? { ...prev, linked: false, telegramUsername: '', telegramSendReady: false } : prev
      );
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? translateServerError(err.message, lang)
          : tr('تعذر فك الربط.', 'لابردنی بەستنەوە سەرکەوتوو نەبوو.', 'Unable to unlink account.')
      );
    } finally {
      setUnlinking(false);
    }
  };

  const handleVerifyBot = async () => {
    setError('');
    setInfoMsg('');
    setVerifying(true);
    try {
      const res = await verifyDashboardTelegramApi(rid);
      if (res.status) {
        setStatus(res.status);
      }
      if (res.ok) {
        const msg = res.diagnosticMessage
          ? translateServerError(res.diagnosticMessage, lang)
          : tr('اتصال البوت بالخادم سليم ✓', 'پەیوەندی بۆت بە سێرڤەرەوە سەلامەتە ✓', 'Bot connection is healthy ✓');
        setInfoMsg(msg);
        showToast(tr('اتصال البوت سليم ✓', 'پەیوەندی بۆت سەلامەتە ✓', 'Bot connected ✓'));
      } else {
        const msg = res.diagnosticMessage
          ? translateServerError(res.diagnosticMessage, lang)
          : tr('تعذر التحقق من اتصال البوت.', 'پشکنینی پەیوەندی بۆت سەرکەوتوو نەبوو.', 'Unable to verify bot connection.');
        setError(msg);
        showToast(tr('توجد مشكلة في اتصال البوت', 'کێشە لە پەیوەندی بۆتدا هەیە', 'Bot connection issue'));
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? translateServerError(err.message, lang)
          : tr('تعذر فحص اتصال البوت بالخادم.', 'پشکنینی پەیوەندی بۆت بە سێرڤەر سەرکەوتوو نەبوو.', 'Unable to verify bot connection.')
      );
    } finally {
      setVerifying(false);
    }
  };

  const botTokenRejected = Boolean(status?.botConfigured && status?.botTokenValid === false);
  const botUnavailable = status && (!status.botConfigured || !status.botEnabled || botTokenRejected);
  const channelLabel =
    status?.orderChannel === 'telegram'
      ? tr('عبر التليجرام فقط', 'تەنها لە ڕێگەی تێلیگرامەوە', 'Telegram only')
      : status?.orderChannel === 'whatsapp'
      ? tr('عبر الواتساب فقط (تيليجرام متوقف)', 'تەنها لە ڕێگەی واتسئاپەوە (تێلیگرام وەستاوە)', 'WhatsApp only (Telegram paused)')
      : tr('الاثنين معاً (تيليجرام + واتساب)', 'هەردووکیان پێکەوە (تێلیگرام + واتسئاپ)', 'Both (Telegram + WhatsApp)');

  const platformProxyUrl = sanitizeTelegramProxyLink(status?.proxyUrl || '') || DEFAULT_TELEGRAM_PROXY_URL;
  const effectiveProxyUrl = customProxyUrl || platformProxyUrl;

  const handleSaveCustomProxy = (e: React.FormEvent) => {
    e.preventDefault();
    setProxyError('');
    const trimmed = proxyDraft.trim();
    if (!trimmed) {
      setCustomProxyUrl('');
      try {
        window.localStorage.removeItem(CUSTOM_PROXY_STORAGE_KEY);
      } catch {
        // ignore storage error
      }
      setShowCustomProxyForm(false);
      showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
      return;
    }
    const valid = sanitizeTelegramProxyLink(trimmed);
    if (!valid) {
      setProxyError(
        tr(
          'الرابط غير صالح — يرجى لصق رابط بروكسي تيليجرام يبدأ بـ https://t.me/proxy? أو tg://proxy?',
          'لینکەکە نادروستە — تکایە لینکی پرۆکسی تێلیگرام بنووسە کە بە https://t.me/proxy? یان tg://proxy? دەست پێبکات',
          'Invalid link — paste a Telegram proxy URL starting with https://t.me/proxy? or tg://proxy?'
        )
      );
      return;
    }
    setCustomProxyUrl(valid);
    setProxyDraft(valid);
    try {
      window.localStorage.setItem(CUSTOM_PROXY_STORAGE_KEY, valid);
    } catch {
      // ignore storage error
    }
    setShowCustomProxyForm(false);
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
  };

  const handleResetDefaultProxy = () => {
    setCustomProxyUrl('');
    setProxyDraft('');
    setProxyError('');
    try {
      window.localStorage.removeItem(CUSTOM_PROXY_STORAGE_KEY);
    } catch {
      // ignore storage error
    }
    showToast(tr('تم تطبيق التغيرات', 'گۆڕانکارییەکان پاشەکەوت کران ✓', 'Changes saved'));
  };

  const handleCopyProxyLink = () => {
    void copyTextReliable(effectiveProxyUrl).then((ok) => {
      showToast(
        ok
          ? tr('تم نسخ رابط البروكسي ✓', 'لینکی پرۆکسی کۆپی کرا ✓', 'Proxy link copied ✓')
          : tr('تعذر نسخ الرابط', 'کۆپیکردنی لینک سەرکەوتوو نەبوو', 'Unable to copy link')
      );
    });
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <motion.div
        className="hd"
        style={{ marginBottom: '16px' }}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Send size={20} style={{ color: '#0088cc' }} />
            <span>{tr('إعداد التليجرام', 'ڕێکخستنی تێلیگرام', 'Telegram Setup')}</span>
          </h2>
          {status && (
            <span
              className={`badge ${status.linked ? (status.enabled ? 'ok' : 'warn') : 'mute'}`}
              style={{ fontSize: '12px' }}
            >
              {status.linked
                ? status.enabled
                  ? tr('مربوط ويستقبل الطلبات ✓', 'بەستراوەتەوە و داواکاری وەردەگرێت ✓', 'Linked & Active ✓')
                  : tr('مربوط (متوقف مؤقتاً)', 'بەستراوەتەوە (بە کاتی وەستاوە)', 'Linked (Paused)')
                : tr('غير مربوط', 'نەبەستراوەتەوە', 'Not Linked')}
            </span>
          )}
        </div>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '13.5px', lineHeight: 1.6 }}>
          {tr(
            'ضع رقم هاتفك وشاركه مع بوت تيليجرام ليصلك كل طلب جديد يرسله الزبائن مباشرة إلى حسابك في تيليجرام.',
            'ژمارەی مۆبایلەکەت بنووسە و لەگەڵ بۆتی تێلیگرام هاوبەشی بکە تا هەموو داواکارییەکی نوێ ڕاستەوخۆ بگاتە هەژمارەکەت.',
            'Enter your phone number and share it with our Telegram bot to receive every new order directly in Telegram.'
          )}
        </p>
      </motion.div>

      {loading ? (
        <div className="card" style={{ ...surfaceCardStyle, padding: '28px', textAlign: 'center' }}>
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto 8px' }} />
          <div className="muted" style={{ fontSize: '13.5px' }}>
            {tr('جاري التحقق من حالة الربط...', 'دۆخی بەستنەوە دەپشکنرێت...', 'Checking connection status...')}
          </div>
        </div>
      ) : (
        <motion.div
          className="card"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
          style={{ ...surfaceCardStyle, padding: '22px' }}
        >
          {botUnavailable && (
            <div className="mp-inline-status is-err" style={{ marginBottom: '16px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>
                {!status?.botConfigured
                  ? tr('خدمة بوت تيليجرام غير مفعلة حالياً من إدارة المنصة.', 'خزمەتگوزاری بۆتی تێلیگرام لە ئێستادا لەلایەن بەڕێوەبەری پلاتفۆرمەوە چالاک نەکراوە.', 'Telegram bot service is currently not configured by platform admin.')
                  : botTokenRejected
                  ? tr(
                      'توكن بوت تيليجرام مرفوض من خادم تيليجرام — يرجى تحديث التوكن الصحيح من @BotFather في إعدادات الأدمن.',
                      'تۆکنی بۆتی تێلیگرام لەلایەن تێلیگرامەوە ڕەتکرایەوە — تکایە تۆکنی دروست لە @BotFather نوێ بکەرەوە.',
                      'Telegram bot token was rejected — please update a valid @BotFather token in platform settings.'
                    )
                  : tr('تم إيقاف بوت تيليجرام مؤقتاً من إعدادات المنصة.', 'بۆتی تێلیگرام بە شێوەی کاتی لە ڕێکخستنەکانی پلاتفۆرم وەستێنراوە.', 'Telegram bot is temporarily paused in platform settings.')}
              </span>
            </div>
          )}

          {error && (
            <div className="mp-inline-status is-err" role="alert" style={{ marginBottom: '14px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && !error && (
            <div className="mp-inline-status is-ok" style={{ marginBottom: '14px' }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{infoMsg}</span>
            </div>
          )}

          {status?.linked ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'var(--soft)',
                  border: '1px solid color-mix(in srgb, var(--brand) 28%, var(--line))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#0088cc',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--ink)' }}>
                      {tr('حساب تيليجرام مربوط بنجاح', 'هەژماری تێلیگرام بە سەرکەوتوویی بەسترایەوە', 'Telegram account linked successfully')}
                    </div>
                    <div className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }} dir="ltr">
                      {status.telegramPhone}
                      {status.telegramUsername ? ` · @${status.telegramUsername}` : ''}
                    </div>
                  </div>
                </div>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: toggling ? 'wait' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'color-mix(in srgb, var(--surface) 40%, transparent)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={status.enabled}
                    disabled={toggling}
                    onChange={(e) => void handleToggleEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                  />
                  <Bell size={14} style={{ color: status.enabled ? 'var(--brand)' : 'var(--muted)' }} />
                  <span>
                    {status.enabled
                      ? tr('استلام الطلبات مفعّل', 'وەرگرتنی داواکاری چالاکە', 'Order notifications enabled')
                      : tr('إشعارات الطلبات متوقفة', 'ئاگادارکردنەوەکان وەستاون', 'Order notifications paused')}
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn p"
                  disabled={testing || Boolean(botUnavailable)}
                  onClick={() => void handleSendTestOrder()}
                  style={{ gap: '7px' }}
                >
                  {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>
                    {testing
                      ? tr('جاري الإرسال...', 'دەنێردرێت...', 'Sending...')
                      : tr('إرسال طلب تجريبي إلى تيليجرام', 'ناردنی داواکاری تاقیکردنەوە بۆ تێلیگرام', 'Send Test Order to Telegram')}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn s d"
                  disabled={unlinking}
                  onClick={() => void handleUnlink()}
                  style={{ gap: '6px' }}
                >
                  {unlinking ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                  <span>{tr('تغيير الرقم / فك الربط', 'گۆڕینی ژمارە / لابردنی بەستنەوە', 'Change Number / Unlink')}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label className="f" style={{ margin: 0 }}>
                <span style={{ fontWeight: 800, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={15} style={{ color: 'var(--brand)' }} />
                  <span>{tr('رقم هاتفك في تيليجرام', 'ژمارەی مۆبایلەکەت لە تێلیگرام', 'Your Telegram Phone Number')}</span>
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setError('');
                  }}
                  placeholder={tr('07XXXXXXXXX أو +9647XXXXXXXXX', '07XXXXXXXXX یان +9647XXXXXXXXX', '07XXXXXXXXX or +9647XXXXXXXXX')}
                  required
                  style={{ ...themedInputStyle, fontSize: '15px', fontWeight: 700, marginTop: '6px' }}
                />
                <small className="muted" style={{ display: 'block', marginTop: '5px', fontSize: '12px' }}>
                  {tr(
                    'أدخل رقم الهاتف المرتبط بحسابك في تيليجرام والذي تريد استلام إشعارات الطلبات عليه.',
                    'ژمارەی مۆبایلی بەستراو بە هەژماری تێلیگرامەکەتەوە بنووسە کە دەتەوێت داواکارییەکانی بۆ بێت.',
                    'Enter the phone number associated with your Telegram account where you want order alerts delivered.'
                  )}
                </small>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn p"
                  disabled={submitting || Boolean(botUnavailable)}
                  style={{ gap: '7px', fontWeight: 800 }}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>
                    {submitting
                      ? tr('جاري التجهيز...', 'ئامادە دەکرێت...', 'Preparing...')
                      : tr('حفظ الرقم والربط مع البوت', 'پاشەکەوتکردن و بەستنەوە بە بۆت', 'Save Number & Link Bot')}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn s"
                  onClick={() => void loadStatus(false)}
                  style={{ gap: '6px' }}
                >
                  <RefreshCw size={14} />
                  <span>{tr('تحديث الحالة', 'نوێکردنەوەی دۆخ', 'Refresh Status')}</span>
                </button>
              </div>

              {awaitingShare && botUrl && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'color-mix(in srgb, #0088cc 8%, var(--bg))',
                    border: '1.5px solid color-mix(in srgb, #0088cc 35%, var(--line))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)' }}>
                    {tr('الخطوة الأخيرة: شارك رقمك داخل البوت', 'دوا هەنگاو: ژمارەکەت لە ناو بۆت هاوبەش بکە', 'Final Step: Share your number inside the bot')}
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.65 }}>
                    {tr(
                      `اضغط على الزر أدناه لفتح بوت تيليجرام (@${status?.botUsername || 'MenuPlus_bot'})، ثم اضغط Start وبعدها اضغط زر «📱 مشاركة رقم هاتفي لاستقبال الطلبات». سيتم الربط هنا تلقائياً فور المشاركة.`,
                      `دوگمەی خوارەوە دابگرە بۆ کردنەوەی بۆتی تێلیگرام (@${status?.botUsername || 'MenuPlus_bot'})، پاشان Start دابگرە و دوگمەی «📱 مشاركة رقم هاتفي» دابگرە. دوای هاوبەشکردن ڕاستەوخۆ دەبەسترێتەوە.`,
                      `Tap below to open our Telegram bot (@${status?.botUsername || 'MenuPlus_bot'}), press Start, then tap "Share my phone number". Linking completes automatically once shared.`
                    )}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <a
                      href={botUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn p"
                      style={{
                        background: '#0088cc',
                        borderColor: '#0088cc',
                        color: '#ffffff',
                        textDecoration: 'none',
                        gap: '7px',
                        fontWeight: 800,
                      }}
                    >
                      <ExternalLink size={15} />
                      <span>{tr('فتح البوت ومشاركة الرقم في تيليجرام', 'کردنەوەی بۆت و هاوبەشکردنی ژمارە', 'Open Bot & Share Number')}</span>
                    </a>
                    <span className="muted" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{tr('بانتظار مشاركة الرقم...', 'چاوەڕوانی هاوبەشکردنی ژمارە...', 'Waiting for phone share...')}</span>
                    </span>
                  </div>
                </div>
              )}
            </form>
          )}
        </motion.div>
      )}

      {!loading && (
        <motion.div
          className="card"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            ...surfaceCardStyle,
            padding: '18px 20px',
            marginTop: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} style={{ color: '#0088cc' }} />
              <b style={{ fontSize: '14.5px', color: 'var(--ink)' }}>
                {tr('بروكسي تيليجرام (لتشغيل البوت والتطبيق بسلاسة)', 'پرۆکسی تێلیگرام (بۆ کارکردنی ئاسانی بۆت و ئەپ)', 'Telegram Proxy (for smooth connectivity)')}
              </b>
            </div>
            {customProxyUrl && (
              <span className="badge ok" style={{ fontSize: '11.5px' }}>
                {tr('بروكسي مخصص مفعّل', 'پرۆکسی تایبەت چالاکە', 'Custom proxy active')}
              </span>
            )}
          </div>

          <p className="muted" style={{ margin: 0, fontSize: '13px', lineHeight: 1.65 }}>
            {tr(
              'إذا كان تيليجرام يحتاج بروكسي على جهازك، اضغط الزر أدناه لإضافة البروكسي مباشرة إلى حسابك في تيليجرام، أو يمكنك إدخال أي رابط بروكسي آخر يعمل لديك.',
              'ئەگەر تێلیگرام لەسەر ئامێرەکەت پێویستی بە پرۆکسی هەیە، دوگمەی خوارەوە دابگرە بۆ زیادکردنی، یان دەتوانیت هەر لینکێکی تری پرۆکسی بنووسیت.',
              'If Telegram requires a proxy on your network, tap below to add it directly or configure your own working proxy URL.'
            )}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={effectiveProxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn p"
              style={{
                background: '#0088cc',
                borderColor: '#0088cc',
                color: '#ffffff',
                textDecoration: 'none',
                gap: '7px',
                fontWeight: 800,
              }}
            >
              <ExternalLink size={15} />
              <span>{tr('إضافة بروكسي إلى تيليجرام الخاص بك', 'زیادکردنی پرۆکسی بۆ تێلیگرامەکەت', 'Add Proxy to Telegram')}</span>
            </a>

            <button
              type="button"
              className="btn s"
              onClick={handleCopyProxyLink}
              style={{ gap: '6px' }}
            >
              <Copy size={14} />
              <span>{tr('نسخ رابط البروكسي', 'کۆپیکردنی لینکی پرۆکسی', 'Copy Proxy Link')}</span>
            </button>

            <button
              type="button"
              className="btn s"
              onClick={() => {
                setProxyError('');
                setShowCustomProxyForm((v) => !v);
              }}
              style={{ gap: '6px' }}
            >
              <Settings size={14} />
              <span>
                {showCustomProxyForm
                  ? tr('إخفاء تعديل البروكسي', 'شاردنەوەی دەستکاری پرۆکسی', 'Hide Proxy Settings')
                  : tr('استخدام بروكسي آخر', 'بەکارهێنانی پرۆکسی تر', 'Use Custom Proxy')}
              </span>
            </button>

            {customProxyUrl && (
              <button
                type="button"
                className="btn s"
                onClick={handleResetDefaultProxy}
                style={{ gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>{tr('العودة للبروكسي الافتراضي', 'گەڕانەوە بۆ پرۆکسی بنەڕەتی', 'Reset to Default Proxy')}</span>
              </button>
            )}
          </div>

          {showCustomProxyForm && (
            <form
              onSubmit={handleSaveCustomProxy}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <label className="f" style={{ margin: 0 }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800 }}>
                  {tr(
                    'رابط بروكسي تيليجرام البديل (https://t.me/proxy?... أو tg://proxy?...)',
                    'لینکی پرۆکسی تێلیگرامی جێگرەوە (https://t.me/proxy?... یان tg://proxy?...)',
                    'Custom Telegram Proxy Link (https://t.me/proxy?... or tg://proxy?...)'
                  )}
                </span>
                <input
                  type="text"
                  dir="ltr"
                  value={proxyDraft}
                  onChange={(e) => {
                    setProxyDraft(e.target.value);
                    setProxyError('');
                  }}
                  placeholder={platformProxyUrl}
                  style={{ ...themedInputStyle, fontSize: '13px', marginTop: '6px' }}
                />
              </label>
              {proxyError && (
                <div className="mp-inline-status is-err" role="alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{proxyError}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn p s" style={{ fontWeight: 800 }}>
                  {tr('حفظ واعتماد رابط البروكسي', 'پاشەکەوتکردنی لینکی پرۆکسی', 'Save Proxy Link')}
                </button>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => {
                    setProxyDraft(platformProxyUrl);
                    setProxyError('');
                  }}
                >
                  {tr('تعبئة الرابط الافتراضي', 'پڕکردنەوەی لینکی بنەڕەتی', 'Fill Default Link')}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {!loading && status && (
        <motion.div
          className="card"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{
            ...surfaceCardStyle,
            padding: '18px 20px',
            marginTop: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: status.telegramSendReady ? '#10b981' : '#f59e0b' }} />
              <b style={{ fontSize: '14.5px', color: 'var(--ink)' }}>
                {tr('التحقق من جاهزية خدمة إرسال الطلبات', 'پشکنینی ئامادەیی خزمەتگوزاری ناردنی داواکاری', 'Order Delivery Service Readiness')}
              </b>
            </div>
            <span className={`badge ${status.telegramSendReady ? 'ok' : 'warn'}`} style={{ fontSize: '12px' }}>
              {status.telegramSendReady
                ? tr('الخدمة جاهزة وتستقبل الطلبات ✓', 'خزمەتگوزاری ئامادەیە ✓', 'Ready & Active ✓')
                : tr('تحتاج إكمال التفعيل', 'پێویستی بە تەواوکردنی چالاککردنە', 'Setup Incomplete')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
            {[
              {
                label: tr('توكن البوت وتفعيله', 'تۆکن و چالاککردنی بۆت', 'Bot Token & Status'),
                ok: Boolean(status.botConfigured && status.botEnabled && status.botTokenValid !== false),
                detail: !status.botConfigured
                  ? tr('غير مضبوط في المنصة (TELEGRAM_BOT_TOKEN)', 'لە پلاتفۆرم دانەنراوە (TELEGRAM_BOT_TOKEN)', 'Not configured (TELEGRAM_BOT_TOKEN)')
                  : status.botTokenValid === false
                  ? tr('توكن البوت مرفوض من تيليجرام — حدّث التوكن من @BotFather', 'تۆکنی بۆت ڕەتکراوەتەوە — لە @BotFather نوێی بکەرەوە', 'Bot token rejected — update via @BotFather')
                  : !status.botEnabled
                  ? tr('معطل من إعدادات المنصة', 'لە ڕێکخستنەکانی پلاتفۆرم ناچالاک کراوە', 'Disabled in platform settings')
                  : tr(`مفعّل (@${status.botUsername})`, `چالاکە (@${status.botUsername})`, `Enabled (@${status.botUsername})`),
              },
              {
                label: tr('اتصال البوت بالخادم', 'پەیوەندی بۆت بە سێرڤەر', 'Bot Server Connection'),
                ok: Boolean(
                  status.pollingActive &&
                    !status.lastPollError &&
                    (status.pollingHealthy || status.lastPollSuccessAt)
                ),
                detail: status.lastPollError
                  ? status.lastPollError
                  : status.botTokenError
                  ? status.botTokenError
                  : status.lastSendError
                  ? tr(`تعذر إرسال الرد: ${status.lastSendError}`, `ناردنی وەڵام سەرکەوتوو نەبوو: ${status.lastSendError}`, `Send error: ${status.lastSendError}`)
                  : status.pollingHealthy || status.pollingActive
                  ? tr('يعمل ويستقبل رسائل الربط ✓', 'کار دەکات و پەیامەکان وەردەگرێت ✓', 'Running & polling updates ✓')
                  : tr('متوقف أو بانتظار توكن البوت', 'وەستاوە یان چاوەڕێی تۆکنە', 'Stopped or awaiting bot token'),
              },
              {
                label: tr('ربط حساب المتجر', 'بەستنەوەی هەژماری فرۆشگا', 'Store Account Link'),
                ok: status.linked,
                detail: status.linked
                  ? tr(`مربوط (${status.telegramPhone || 'تم التحقق'})`, `بەستراوەتەوە (${status.telegramPhone || 'پشکنرا'})`, `Linked (${status.telegramPhone || 'Verified'})`)
                  : tr('غير مربوط — أدخل الرقم واضغط حفظ ثم شارك جهة الاتصال', 'نەبەستراوەتەوە — ژمارە بنووسە و پاشان پەیوەندییەکەت هاوبەش بکە', 'Not linked — enter number, save & share contact'),
              },
              {
                label: tr('قناة الطلبات المختارة', 'کەناڵی داواکاری هەڵبژێردراو', 'Selected Order Channel'),
                ok: status.orderChannel !== 'whatsapp',
                detail: channelLabel,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '10px 12px',
                  borderRadius: '11px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)' }}>{item.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: item.ok ? '#10b981' : '#f59e0b' }}>
                    {item.ok ? `✓ ${tr('سليم', 'باشە', 'OK')}` : `! ${tr('تنبيه', 'ئاگاداری', 'Alert')}`}
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--muted)', wordBreak: 'break-word' }}>{item.detail}</span>
              </div>
            ))}
          </div>

          {(status.lastPollError || status.lastSendError) && (
            <div className="mp-inline-status is-err" style={{ marginTop: '2px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12.5px' }}>
                {status.lastPollError && (
                  <span>
                    <b>{tr('سبب توقف الاستقبال:', 'هۆکاری وەستانی وەرگرتن:', 'Polling error:')}</b> {status.lastPollError}
                  </span>
                )}
                {status.lastSendError && (
                  <span>
                    <b>{tr('آخر خطأ في الإرسال:', 'دوا هەڵەی ناردن:', 'Last send error:')}</b> {status.lastSendError}
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {tr(
                'يمكنك فحص اتصال البوت مباشرة أو تغيير قناة الطلبات من الإعدادات.',
                'دەتوانیت ڕاستەوخۆ پەیوەندی بۆت بپشکنیت یان کەناڵی داواکاری لە ڕێکخستنەکان بگۆڕیت.',
                'Test bot connectivity or switch order channels anytime in Settings.'
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn s"
                disabled={verifying}
                onClick={() => void handleVerifyBot()}
                style={{ gap: '6px', fontSize: '12px', fontWeight: 800 }}
              >
                {verifying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                <span>
                  {verifying
                    ? tr('جاري الفحص...', 'دەپشکنرێت...', 'Checking...')
                    : tr('فحص اتصال البوت الآن', 'پشکنینی پەیوەندی بۆت ئێستا', 'Test Bot Connection')}
                </span>
              </button>
              <button
                type="button"
                className="btn s"
                onClick={() => setActiveTab('set')}
                style={{ gap: '6px', fontSize: '12px', fontWeight: 800 }}
              >
                <Settings size={13} />
                <span>{tr('تغيير قناة الطلبات من الإعدادات', 'گۆڕینی کەناڵی داواکاری لە ڕێکخستن', 'Change Channel in Settings')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
