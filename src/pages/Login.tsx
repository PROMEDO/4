/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PricingPlan, Session, SiteSettings } from '../types';
import {
  flushRemoteSync,
  getCollection,
  getItem,
  hash,
  loginWithServer,
  putItem,
  resolveEffectiveThemeMode,
  setSession,
  waLink,
} from '../utils/storage';
import { translateServerError, useTranslation } from '../utils/i18n';
import { AppLogo } from '../components/AppLogo';
import { LanguageSelector } from '../components/LanguageSelector';
import { DEFAULT_PLANS_V2 } from '../utils/plans';
import { getSupportWhatsapp } from '../utils/businessDefaults';

interface AuthViewProps {
  mode: 'login' | 'signup' | 'forgot';
  site: SiteSettings;
  plans: PricingPlan[];
  selectedPlanIndex: number;
  onNavigate: (hash: string) => void;
  onLoginSuccess: (session: Session) => void;
}

const COUNTRY_CODES = [
  { code: '+964', label: '🇮🇶 +964', name: 'العراق' },
  { code: '+966', label: '🇸🇦 +966', name: 'السعودية' },
  { code: '+971', label: '🇦🇪 +971', name: 'الإمارات' },
  { code: '+965', label: '🇰🇼 +965', name: 'الكويت' },
  { code: '+962', label: '🇯🇴 +962', name: 'الأردن' },
  { code: '+974', label: '🇶🇦 +974', name: 'قطر' },
  { code: '+968', label: '🇴🇲 +968', name: 'عُمان' },
  { code: '+973', label: '🇧🇭 +973', name: 'البحرين' },
  { code: '+20', label: '🇪🇬 +20', name: 'مصر' },
  { code: '+961', label: '🇱🇧 +961', name: 'لبنان' },
  { code: '+963', label: '🇸🇾 +963', name: 'سوريا' },
  { code: '+90', label: '🇹🇷 +90', name: 'تركيا' },
];

function buildFullPhoneNumber(dialCode: string, rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/\D/g, '')}`;
  }
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    return `+${digits}`;
  }
  const dialDigits = dialCode.replace(/\D/g, '');
  if (digits.startsWith(dialDigits) && digits.length >= dialDigits.length + 7) {
    return `+${digits}`;
  }
  const localNoZero = digits.replace(/^0+/, '');
  return `+${dialDigits}${localNoZero}`;
}

function getPhoneMatchVariants(val: string): string[] {
  const clean = String(val || '').trim();
  if (!clean) return [];
  if (clean.includes('@')) return [clean.toLowerCase()];
  let digits = clean.replace(/\D/g, '');
  if (!digits) return [clean.toLowerCase()];
  if (digits.startsWith('00')) digits = digits.slice(2);
  const out = new Set<string>([clean.toLowerCase(), digits, `+${digits}`]);
  if (digits.startsWith('964')) {
    const loc = digits.slice(3).replace(/^0+/, '');
    if (loc) {
      out.add(loc);
      out.add(`0${loc}`);
      out.add(`+964${loc}`);
      out.add(`964${loc}`);
    }
  } else if (digits.startsWith('07') && digits.length === 11) {
    const loc = digits.slice(1);
    out.add(loc);
    out.add(`0${loc}`);
    out.add(`+964${loc}`);
    out.add(`964${loc}`);
  } else if (digits.startsWith('7') && digits.length === 10) {
    out.add(`0${digits}`);
    out.add(`+964${digits}`);
    out.add(`964${digits}`);
  }
  return Array.from(out);
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  site: _site,
  plans,
  onNavigate,
  onLoginSuccess,
}) => {
  const { t, lang, setLang, isRtl, tr } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const homeTheme = resolveEffectiveThemeMode(_site.homeThemeMode || 'light');
  const [showPassword, setShowPassword] = useState(false);

  const [countryCode, setCountryCode] = useState('+964');
  const [phoneInput, setPhoneInput] = useState(() => (mode === 'login' ? '07' : ''));
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setPassword('');
    setPhoneInput(mode === 'login' && countryCode === '+964' ? '07' : '');
    setIsSubmitting(false);
  }, [mode, countryCode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${t.appName} | ${mode === 'forgot' ? tr('استعادة كلمة المرور', 'گەڕاندنەوەی وشەی نهێنی', 'Reset Password') : t.authLoginTitle}`;
    }
  }, [lang, mode, t.appName, t.authLoginTitle, tr]);

  useEffect(() => {
    if (mode === 'signup') {
      onNavigate('/login');
    }
  }, [mode, onNavigate]);

  const supportWa = getSupportWhatsapp(_site);
  const cleanPhoneInput = phoneInput.trim();
  const hasTypedPhone = cleanPhoneInput.length > 3 && cleanPhoneInput !== '07';
  const signupWhatsappHref = waLink(
    supportWa,
    tr('اريد انشاء حساب', 'دەمەوێت هەژمار دروست بکەم', 'I would like to create an account')
  );
  const forgotWhatsappHref = waLink(
    supportWa,
    hasTypedPhone
      ? tr(`نسيت الرمز (${cleanPhoneInput})`, `وشەی نهێنیم لەبیرکردووە (${cleanPhoneInput})`, `Forgot password (${cleanPhoneInput})`)
      : tr('نسيت الرمز', 'وشەی نهێنیم لەبیرکردووە', 'Forgot password')
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawId = phoneInput.trim();
    const cleanPw = password.trim();

    if (!rawId) {
      setError(tr('يرجى إدخال رقم الهاتف المسجل.', 'تکایە ژمارەی تەلەفۆنی تۆمارکراو بنووسە.', 'Please enter your registered phone number.'));
      return;
    }
    if (!cleanPw) {
      setError(tr('يرجى إدخال كلمة المرور.', 'تکایە وشەی نهێنی بنووسە.', 'Please enter your password.'));
      return;
    }

    const fullPhone = rawId.includes('@') ? rawId.toLowerCase() : buildFullPhoneNumber(countryCode, rawId);

    setIsSubmitting(true);
    try {
      const serverRes = await loginWithServer({
        identifier: rawId,
        fullPhone,
        password: cleanPw,
      });
      if (serverRes.ok && serverRes.session) {
        onLoginSuccess(serverRes.session);
        if (serverRes.session.admin) {
          onNavigate('/admin/home');
        } else if (!serverRes.restaurant || serverRes.restaurant.done !== 1) {
          onNavigate('/onboard');
        } else {
          onNavigate('/dashboard/home');
        }
        return;
      }
      if (serverRes.error) {
        setError(translateServerError(serverRes.error, lang));
        return;
      }
    } catch {
      // Offline / local fallback below
    } finally {
      setIsSubmitting(false);
    }

    try {
      const cleanPwLower = cleanPw.toLowerCase();
      const inputKeys = new Set([
        ...getPhoneMatchVariants(rawId),
        ...getPhoneMatchVariants(fullPhone),
      ]);
      const matchesLocal = (val: unknown) =>
        typeof val === 'string' && getPhoneMatchVariants(val).some((k) => inputKeys.has(k));

      // 1. Staff Member Login
      const staffMembers = getCollection<any>('staff');
      const matchedStaff = staffMembers.find((s) => matchesLocal(s.phone) || matchesLocal(s.email));
      const matchedStaffAccount = Boolean(matchedStaff);
      if (matchedStaff) {
        const staffIds = [matchedStaff.email, matchedStaff.phone, rawId, fullPhone].filter(Boolean);
        let isStaffPwValid =
          (matchedStaff.passwordHash || '').toLowerCase() === cleanPwLower ||
          matchedStaff.passwordHash === cleanPw;
        if (!isStaffPwValid) {
          for (const idCand of staffIds) {
            if (
              matchedStaff.passwordHash === (await hash(String(idCand), cleanPwLower)) ||
              matchedStaff.passwordHash === (await hash(String(idCand), cleanPw))
            ) {
              isStaffPwValid = true;
              break;
            }
          }
        }
        if (isStaffPwValid) {
          if (!matchedStaff.active) {
            setError(tr('هذا الحساب معطل حالياً من قِبل إدارة المنصة.', 'ئەم هەژمارە لە ئێستادا لەلایەن بەڕێوەبەرایەتی پلاتفۆرمەوە ڕاگیراوە.', 'This account is currently disabled by platform administration.'));
            return;
          }
          const staffSes: Session = {
            admin: true,
            name: matchedStaff.name,
            email: matchedStaff.email,
            phone: matchedStaff.phone,
            staffId: matchedStaff.id,
            roleTitle: matchedStaff.roleTitle,
            permissions: matchedStaff.permissions,
            rid: 'demo',
            personalRid: 'demo',
          };
          setSession(staffSes);
          onLoginSuccess(staffSes);
          onNavigate('/admin/home');
          return;
        }
      }

      // 2. Partner & Admin Account Login
      const accounts = getCollection<any>('accounts')
        .filter(
          (a) =>
            matchesLocal(a.phone) ||
            matchesLocal(a.projectPhone) ||
            matchesLocal(a.username) ||
            matchesLocal(a.em) ||
            matchesLocal(a.email)
        )
        .sort((a, b) => {
          const aAdmin = a.admin === true || a.r === 'admin' || String(a.id || '').startsWith('acc_admin_') ? 0 : 1;
          const bAdmin = b.admin === true || b.r === 'admin' || String(b.id || '').startsWith('acc_admin_') ? 0 : 1;
          return aAdmin - bAdmin;
        });

      if (accounts.length === 0) {
        setError(
          matchedStaffAccount
            ? tr('كلمة المرور غير صحيحة.', 'وشەی نهێنی هەڵەیە.', 'Incorrect password.')
            : tr('لا يوجد حساب بهذا الرقم.', 'هیچ هەژمارێک بەم ژمارەیە بوونی نییە.', 'No account found with this number.')
        );
        return;
      }

      let matched: any = null;
      for (const cand of accounts) {
        const possibleIds = [cand.phone, cand.email, cand.username, cand.em, rawId, fullPhone].filter(Boolean);
        let ok =
          (cand.pw || '').toLowerCase() === cleanPwLower || cand.pw === cleanPw;
        if (!ok) {
          for (const idCandidate of possibleIds) {
            if (
              cand.pw === (await hash(String(idCandidate), cleanPwLower)) ||
              cand.pw === (await hash(String(idCandidate), cleanPw))
            ) {
              ok = true;
              break;
            }
          }
        }
        if (ok) {
          matched = cand;
          break;
        }
      }

      if (!matched) {
        setError(tr('كلمة المرور غير صحيحة.', 'وشەی نهێنی هەڵەیە.', 'Incorrect password.'));
        return;
      }

      const isAdmin = Boolean(matched.admin === true || matched.r === 'admin' || String(matched.id || '').startsWith('acc_admin_'));
      let rest = getItem<any>(`restaurants/${matched.rid}`);
      if (matched.active === false || (!isAdmin && rest && rest.a === 0)) {
        setError(tr('هذا الحساب موقوف حالياً، يرجى التواصل مع إدارة المنصة.', 'ئەم هەژمارە لە ئێستادا ڕاگیراوە، تکایە پەیوەندی بە بەڕێوەبەرایەتی پلاتفۆرمەوە بکە.', 'This account is currently suspended. Please contact platform support.'));
        return;
      }

      if (isAdmin) {
        const adminSes: Session = {
          admin: true,
          name: matched.n || matched.name || undefined,
          phone: matched.phone || matched.ph || rawId,
          email: matched.email || matched.em || matched.username || rawId,
          rid: matched.rid || 'demo',
          personalRid: matched.rid || 'demo',
        };
        setSession(adminSes);
        onLoginSuccess(adminSes);
        onNavigate('/admin/home');
        return;
      }

      if (!rest) {
        const starterPlan = plans?.[0] || DEFAULT_PLANS_V2[0];
        rest = {
          id: matched.rid,
          n: matched.projectName || tr('مشروعي الجديد', 'پرۆژە نوێیەکەم', 'My New Business'),
          ow: matched.n || '',
          ph: matched.phone || rawId,
          p: starterPlan.n,
          planId: starterPlan.id,
          done: 0,
          a: 1,
          themeMode: 'light',
          themePreset: 'clean-light',
          color: '#0F766E',
          currency: 'د.ع',
          country: 'العراق',
          region: 'بغداد',
          language: lang,
          projectType: 'restaurant',
          isPaid: starterPlan.pr > 0,
        };
        putItem(`restaurants/${matched.rid}`, rest);
        void flushRemoteSync();
      }

      const userSes: Session = {
        phone: matched.phone || matched.ph || rawId,
        email: matched.email || matched.username || matched.em || rawId,
        name: matched.n || undefined,
        rid: matched.rid,
      };
      setSession(userSes);
      onLoginSuccess(userSes);

      if (!rest || rest.done !== 1) {
        onNavigate('/onboard');
      } else {
        onNavigate('/dashboard/home');
      }
    } catch {
      setError(tr('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً.', 'هەڵەیەک لە کاتی چوونەژوورەوەدا ڕوویدا، تکایە دووبارە هەوڵبدەرەوە.', 'An error occurred while signing in. Please try again.'));
    }
  };

  const renderPhoneInputGroup = (autoFocus = false) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }} dir="ltr">
      <select
        value={countryCode}
        onChange={(e) => {
          const nextCode = e.target.value;
          setCountryCode(nextCode);
          if (nextCode === '+964') {
            setPhoneInput((prev) => (prev.trim() === '' ? '07' : prev));
          } else if (phoneInput.trim() === '07') {
            setPhoneInput('');
          }
          setError('');
        }}
        aria-label={tr('رمز الدولة', 'کۆدی وڵات', 'Country code')}
        style={{
          width: '108px',
          flexShrink: 0,
          padding: '10px 8px',
          borderRadius: '12px',
          color: 'var(--ink)',
          fontSize: '13.5px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="text"
        dir="ltr"
        maxLength={64}
        value={phoneInput}
        onChange={(e) => {
          let val = e.target.value;
          const isEmailLike = /[a-zA-Z@]/.test(val);
          if (isEmailLike && val.startsWith('07') && /^[0-9]+[a-zA-Z@]/.test(val)) {
            val = val.slice(2);
          }
          setPhoneInput(val);
          setError('');
        }}
        placeholder={countryCode === '+964' ? '07XXXXXXXXX' : 'XXXXXXXXXX'}
        autoComplete="tel"
        required
        autoFocus={autoFocus}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.5px',
        }}
      />
    </div>
  );

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      data-home-theme={homeTheme}
      className={`home-root theme-${homeTheme} mp-auth-page`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '16px', insetInlineEnd: '16px', zIndex: 10 }}>
        <LanguageSelector currentLang={lang} onChange={setLang} compact buttonTextColor="var(--ink)" />
      </div>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}
      >
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <AppLogo size={56} style={{ marginBottom: '14px' }} />
          <p className="muted" style={{ fontSize: '13.5px', margin: '4px 0 0', color: 'var(--muted)' }}>
            {t.heroBadge}
          </p>
        </a>
      </motion.div>

      <motion.div
        className="mp-auth-glass-card"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px 22px',
          borderRadius: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {mode === 'forgot' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--soft)',
                  color: 'var(--brand-ink)',
                  display: 'inline-grid',
                  placeItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px' }}>
                {tr('استعادة كلمة المرور', 'گەڕاندنەوەی وشەی نهێنی', 'Reset Password')}
              </h2>
              <p className="muted" style={{ fontSize: '13px', margin: 0, lineHeight: 1.65 }}>
                {tr('أدخل رقم هاتفك المسجل وتواصل مباشرة مع الدعم الفني عبر الواتساب لإعادة تعيين كلمة المرور بسرعة.', 'ژمارەی تەلەفۆنی تۆمارکراوت بنووسە و ڕاستەوخۆ پەیوەندی بە پشتگیری تەکنیکییەوە بکە لە واتسئاپ بۆ گۆڕینی وشەی نهێنی.', 'Enter your registered phone number and message our support team directly on WhatsApp for a quick password reset.')}
              </p>
            </div>

            <div className="f" style={{ marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px', display: 'block' }}>
                {tr('رقم الهاتف المسجل (اختياري)', 'ژمارەی تەلەفۆنی تۆمارکراو (ئارەزوومەندانە)', 'Registered Phone Number (Optional)')}
              </span>
              {renderPhoneInputGroup(true)}
            </div>

            <a
              href={forgotWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn p b"
              style={{
                width: '100%',
                fontSize: '14.5px',
                fontWeight: 800,
                textDecoration: 'none',
                background: '#25D366',
                color: '#FFFFFF',
                borderColor: '#25D366',
              }}
            >
              <MessageCircle size={17} />
              <span>{tr('تواصل مع الدعم عبر الواتساب', 'پەیوەندی بە پشتگیری لە واتسئاپ', 'Contact Support via WhatsApp')}</span>
            </a>

            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
              <a
                href="/login"
                className="muted"
                style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/login');
                }}
              >
                <ArrowRight size={14} style={{ transform: isRtl ? undefined : 'rotate(180deg)' }} />
                <span>{tr('العودة لتسجيل الدخول', 'گەڕانەوە بۆ چوونەژوورەوە', 'Back to Sign In')}</span>
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>
                {t.authLoginTitle}
              </h2>
              <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                {tr('سجّل الدخول برقم الهاتف وكلمة المرور', 'بە ژمارەی تەلەفۆن و وشەی نهێنی بچۆرە ژوورەوە', 'Sign in with your phone number & password')}
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="f" style={{ marginBottom: '14px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  {t.phone}
                </span>
                {renderPhoneInputGroup(true)}
              </div>

              <label className="f" style={{ marginBottom: '14px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.password}</span>
                <span className="pw">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    dir="ltr"
                    placeholder={t.enterPassword}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? tr('إخفاء', 'شاردنەوە', 'Hide') : tr('إظهار', 'پیشاندان', 'Show')}
                  </button>
                </span>
              </label>

              {error && (
                <div
                  className="mp-inline-status is-err"
                  role="alert"
                  style={{ marginBottom: '12px' }}
                >
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn p b"
                style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '4px', fontWeight: 800 }}
              >
                {isSubmitting ? tr('جاري تسجيل الدخول...', 'چوونەژوورەوە لە ئارادایە...', 'Signing in...') : t.loginBtn}
              </button>

              <a
                href={signupWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mp-magic-create-btn"
              >
                {isRtl ? (
                  <>
                    <span>{tr('اريد انشاء حساب', 'دەمەوێت هەژمار دروست بکەم', 'Create a New Account')}</span>
                    <Sparkles size={16} className="mp-magic-sparkle" />
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mp-magic-sparkle" />
                    <span>{tr('اريد انشاء حساب', 'دەمەوێت هەژمار دروست بکەم', 'Create a New Account')}</span>
                  </>
                )}
              </a>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <a
                  href={forgotWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="muted"
                  style={{ fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                >
                  {t.forgotPassword}
                </a>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
