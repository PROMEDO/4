/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';

export interface HomeLanguageItem {
  code: SupportedLanguage;
  name: string;
  flagCode: string;
  isRtl: boolean;
}

// Exactly 3 languages in strict required order:
// 1. Arabic (العربية) first
// 2. Kurdish (کوردی) second
// 3. English (English) third
export const HOME_LANGUAGES: HomeLanguageItem[] = [
  { code: 'ar', name: 'العربية', flagCode: 'iq', isRtl: true },
  { code: 'ku', name: 'کوردی', flagCode: 'ku', isRtl: true },
  { code: 'en', name: 'English', flagCode: 'gb', isRtl: false },
];

export const IRAQ_REGIONS = [
  'بغداد',
  'أربيل',
  'البصرة',
  'النجف',
  'كربلاء',
  'السليمانية',
  'دهوك',
  'كركوك',
  'الموصل (نينوى)',
  'بابل',
  'الأنبار',
  'ديالى',
  'ذي قار',
  'ميسان',
  'واسط',
  'المثنى',
  'القادسية (الديوانية)',
  'صلاح الدين',
];

export const SUPPORTED_COUNTRIES = [
  { code: 'iq', name: 'العراق' },
  { code: 'sa', name: 'السعودية' },
  { code: 'ae', name: 'الإمارات' },
  { code: 'kw', name: 'الكويت' },
  { code: 'qa', name: 'قطر' },
  { code: 'bh', name: 'البحرين' },
  { code: 'om', name: 'عمان' },
  { code: 'jo', name: 'الأردن' },
  { code: 'eg', name: 'مصر' },
  { code: 'lb', name: 'لبنان' },
  { code: 'tr', name: 'تركيا' },
];

export const COUNTRY_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  iq: { ar: 'العراق', ku: 'عێراق', en: 'Iraq' },
  sa: { ar: 'السعودية', ku: 'سعوودیە', en: 'Saudi Arabia' },
  ae: { ar: 'الإمارات', ku: 'ئیمارات', en: 'UAE' },
  kw: { ar: 'الكويت', ku: 'کوەیت', en: 'Kuwait' },
  qa: { ar: 'قطر', ku: 'قەتەر', en: 'Qatar' },
  bh: { ar: 'البحرين', ku: 'بەحرەین', en: 'Bahrain' },
  om: { ar: 'عمان', ku: 'عومان', en: 'Oman' },
  jo: { ar: 'الأردن', ku: 'ئوردن', en: 'Jordan' },
  eg: { ar: 'مصر', ku: 'میسر', en: 'Egypt' },
  lb: { ar: 'لبنان', ku: 'لوبنان', en: 'Lebanon' },
  tr: { ar: 'تركيا', ku: 'تورکیا', en: 'Turkey' },
};

export const REGION_LABELS: Record<string, { ar: string; ku: string; en: string }> = {
  'بغداد': { ar: 'بغداد', ku: 'بەغدا', en: 'Baghdad' },
  'أربيل': { ar: 'أربيل', ku: 'هەولێر', en: 'Erbil' },
  'البصرة': { ar: 'البصرة', ku: 'بەسرە', en: 'Basra' },
  'النجف': { ar: 'النجف', ku: 'نەجەف', en: 'Najaf' },
  'كربلاء': { ar: 'كربلاء', ku: 'کەربەلا', en: 'Karbala' },
  'السليمانية': { ar: 'السليمانية', ku: 'سلێمانی', en: 'Sulaymaniyah' },
  'دهوك': { ar: 'دهوك', ku: 'دهۆک', en: 'Duhok' },
  'كركوك': { ar: 'كركوك', ku: 'کەرکووک', en: 'Kirkuk' },
  'الموصل (نينوى)': { ar: 'الموصل (نينوى)', ku: 'موسڵ (نەینەوا)', en: 'Mosul (Nineveh)' },
  'بابل': { ar: 'بابل', ku: 'بابل', en: 'Babylon' },
  'الأنبار': { ar: 'الأنبار', ku: 'ئەنبار', en: 'Anbar' },
  'ديالى': { ar: 'ديالى', ku: 'دیالە', en: 'Diyala' },
  'ذي قار': { ar: 'ذي قار', ku: 'زیقار', en: 'Dhi Qar' },
  'ميسان': { ar: 'ميسان', ku: 'مەیسان', en: 'Maysan' },
  'واسط': { ar: 'واسط', ku: 'واست', en: 'Wasit' },
  'المثنى': { ar: 'المثنى', ku: 'موسەننا', en: 'Muthanna' },
  'القادسية (الديوانية)': { ar: 'القادسية (الديوانية)', ku: 'قادسیە (دیوانیە)', en: 'Qadisiyyah (Diwaniyah)' },
  'صلاح الدين': { ar: 'صلاح الدين', ku: 'سەلاحەدین', en: 'Saladin' },
};

export function trByLang(
  lang: SupportedLanguage | string | undefined,
  ar: string,
  ku: string,
  en: string
): string {
  if (lang === 'en') return en;
  if (lang === 'ku') return ku;
  return ar;
}

export function getIntlLocale(lang: SupportedLanguage | string | undefined): string {
  if (lang === 'en') return 'en-US';
  if (lang === 'ku') return 'ckb-IQ-u-nu-latn';
  return 'ar-IQ-u-nu-latn';
}

export function getLocalizedCountryName(countryNameOrCode: string, lang: SupportedLanguage): string {
  const clean = String(countryNameOrCode || '').trim();
  const byCode = COUNTRY_LABELS[clean.toLowerCase()];
  if (byCode) return trByLang(lang, byCode.ar, byCode.ku, byCode.en);
  const matched = SUPPORTED_COUNTRIES.find((c) => c.name === clean);
  if (matched && COUNTRY_LABELS[matched.code]) {
    const entry = COUNTRY_LABELS[matched.code];
    return trByLang(lang, entry.ar, entry.ku, entry.en);
  }
  return clean;
}

export function getLocalizedCountries(lang: SupportedLanguage): Array<{ code: string; value: string; name: string }> {
  return SUPPORTED_COUNTRIES.map((c) => ({
    code: c.code,
    value: c.name,
    name: getLocalizedCountryName(c.code, lang),
  }));
}

export function getLocalizedRegionName(region: string, lang: SupportedLanguage): string {
  const clean = String(region || '').trim();
  const entry = REGION_LABELS[clean];
  if (entry) return trByLang(lang, entry.ar, entry.ku, entry.en);
  return clean;
}

export function getLocalizedRegions(lang: SupportedLanguage): Array<{ value: string; label: string }> {
  return IRAQ_REGIONS.map((r) => ({
    value: r,
    label: getLocalizedRegionName(r, lang),
  }));
}

export function getLocalizedCurrencyLabel(codeOrSymbol: string, lang: SupportedLanguage): string {
  const clean = String(codeOrSymbol || '').trim().toUpperCase();
  if (clean === 'IQD' || clean === 'د.ع') {
    return trByLang(lang, 'دينار عراقي (د.ع)', 'دیناری عێراقی (د.ع)', 'Iraqi Dinar (IQD)');
  }
  if (clean === 'USD' || clean === '$') {
    return trByLang(lang, 'دولار أمريكي ($)', 'دۆلاری ئەمریکی ($)', 'US Dollar ($)');
  }
  if (clean === 'SAR') {
    return trByLang(lang, 'ريال سعودي (SAR)', 'ڕیاڵی سعودی (SAR)', 'Saudi Riyal (SAR)');
  }
  if (clean === 'AED') {
    return trByLang(lang, 'درهم إماراتي (AED)', 'درهەمی ئیماراتی (AED)', 'UAE Dirham (AED)');
  }
  return codeOrSymbol;
}

export function getLocalizedCurrencyUnit(currency: string | undefined, lang: SupportedLanguage): string {
  const clean = String(currency || 'د.ع').trim();
  if (lang === 'en' && (clean === 'د.ع' || clean === 'د.ع.')) return 'IQD';
  return clean;
}

export function formatHhmm12(hhmm: string | undefined, lang: SupportedLanguage = 'ar'): string {
  const raw = String(hhmm || '').trim();
  if (!raw) return '';
  const [hRaw, mRaw] = raw.split(':').map(Number);
  if (Number.isNaN(hRaw)) return raw;
  const h24 = Math.min(23, Math.max(0, hRaw));
  const m = Number.isNaN(mRaw) ? 0 : Math.min(59, Math.max(0, mRaw));
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const isPm = h24 >= 12;
  const period =
    lang === 'en'
      ? isPm
        ? 'PM'
        : 'AM'
      : lang === 'ku'
      ? isPm
        ? 'د.ن'
        : 'ب.ن'
      : isPm
      ? 'م'
      : 'ص';
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function translateServerError(rawMsg: string | undefined, lang: SupportedLanguage): string {
  const msg = String(rawMsg || '').trim();
  if (!msg) return trByLang(lang, 'حدث خطأ غير متوقع.', 'هەڵەیەکی چاوەڕواننەکراو ڕوویدا.', 'An unexpected error occurred.');
  if (lang === 'ar') return msg;

  const exactMap: Array<[RegExp, string, string]> = [
    [/طلبات كثيرة جداً/i, 'داواکاری زۆرە، تکایە خولەکێک چاوەڕوان بە و دووبارە هەوڵبدەرەوە.', 'Too many requests. Please wait a minute and try again.'],
    [/محاولات دخول كثيرة جداً/i, 'هەوڵی چوونەژوورەوە زۆرە، تکایە خولەکێک چاوەڕوان بە.', 'Too many login attempts. Please wait a minute and try again.'],
    [/ليست لديك صلاحية لتعديل هذه البيانات/i, 'مۆڵەتی دەستکاریکردنی ئەم داتایانت نییە.', 'You do not have permission to edit this data.'],
    [/يرجى تسجيل الدخول لإجراء هذه العملية/i, 'تکایە بچۆ ژوورەوە بۆ ئەنجامدانی ئەم کارە.', 'Please sign in to perform this action.'],
    [/يرجى إدخال رقم الهاتف أو المعرف وكلمة المرور/i, 'تکایە ژمارەی مۆبایل یان ئیمەیڵ و وشەی نهێنی بنووسە.', 'Please enter your phone/username and password.'],
    [/تم إيقاف هذا الحساب من قبل إدارة المنصة/i, 'ئەم هەژمارە لەلایەن بەڕێوەبەرایەتی پلاتفۆرمەوە ڕاگیراوە.', 'This account has been suspended by platform administration.'],
    [/تم إيقاف هذا المتجر مؤقتاً/i, 'ئەم فرۆشگایە بە شێوەی کاتی ڕاگیراوە، تکایە پەیوەندی بە پشتگیرییەوە بکە.', 'This store is temporarily suspended. Please contact support.'],
    [/كلمة المرور غير صحيحة/i, 'وشەی نهێنی هەڵەیە.', 'Incorrect password.'],
    [/لا يوجد حساب بهذا الرقم/i, 'هیچ هەژمارێک بەم ژمارەیە تۆمار نەکراوە.', 'No account found with this number/identifier.'],
    [/بيانات الدخول غير صحيحة/i, 'زانیاری چوونەژوورەوە هەڵەیە.', 'Invalid login credentials.'],
    [/تعذر إتمام تسجيل الدخول/i, 'چوونەژوورەوە سەرکەوتوو نەبوو.', 'Unable to complete login.'],
    [/يرجى تسجيل الدخول للمتابعة/i, 'تکایە بۆ بەردەوامبوون بچۆ ژوورەوە.', 'Please sign in to continue.'],
    [/غير مصرح بتعديل هذا المشروع/i, 'مۆڵەتی دەستکاریکردنی ئەم پڕۆژەیەت نییە.', 'Not authorized to modify this project.'],
    [/تعذر حفظ بيانات المشروع/i, 'پاشەکەوتکردنی زانیارییەکانی پڕۆژە سەرکەوتوو نەبوو.', 'Unable to save project details.'],
    [/ليست لديك صلاحية تعديل المنيو التجريبي/i, 'مۆڵەتی دەستکاریکردنی مینیۆی نموونەیت نییە.', 'Not authorized to edit the demo menu.'],
    [/ليست لديك صلاحية فتح لوحة تحكم الشركاء/i, 'مۆڵەتی کردنەوەی پانێڵی هاوبەشانت نییە.', 'Not authorized to open partner dashboards.'],
    [/غير مصرح بفتح لوحة التحكم/i, 'مۆڵەتی کردنەوەی کۆنتڕۆڵ پانێڵت نییە.', 'Not authorized to open the dashboard.'],
    [/المتجر المستهدف غير موجود/i, 'فرۆشگای مەبەست نەدۆزرایەوە.', 'Target store not found.'],
    [/المتجر غير موجود/i, 'فرۆشگا نەدۆزرایەوە.', 'Store not found.'],
    [/تعذر تبديل الجلسة/i, 'گۆڕینی دانیشتن سەرکەوتوو نەبوو.', 'Unable to switch session.'],
    [/يرجى كتابة التقييم قبل الإرسال/i, 'تکایە پێش ناردن هەڵسەنگاندنەکە بنووسە.', 'Please write your review before submitting.'],
    [/تعذر إرسال التقييم/i, 'ناردنی هەڵسەنگاندن سەرکەوتوو نەبوو.', 'Unable to submit review.'],
    [/غير مصرح بالوصول إلى هذا المتجر/i, 'مۆڵەتی گەیشتن بەم فرۆشگایەت نییە.', 'Not authorized to access this store.'],
    [/معرّف المتجر مطلوب/i, 'ناسنامەی فرۆشگا پێویستە.', 'Store ID is required.'],
    [/تعذر تحميل حالة الربط/i, 'بارکردنی دۆخی بەستنەوە سەرکەوتوو نەبوو.', 'Unable to load connection status.'],
    [/تعذر بدء ربط تيليجرام/i, 'دەستپێکردنی بەستنەوەی تێلیگرام سەرکەوتوو نەبوو.', 'Unable to start Telegram linking.'],
    [/تعذر تحديث التفعيل/i, 'نوێکردنەوەی چالاککردن سەرکەوتوو نەبوو.', 'Unable to update activation status.'],
    [/تعذر فك الربط/i, 'لابردنی بەستنەوە سەرکەوتوو نەبوو.', 'Unable to unlink Telegram.'],
    [/تعذر إرسال الطلب التجريبي/i, 'ناردنی داواکاری تاقیکردنەوە سەرکەوتوو نەبوو.', 'Unable to send test order.'],
    [/ليست لديك صلاحية رفع وتعديل خطوط المنصة/i, 'مۆڵەتی بارکردن و دەستکاریکردنی فۆنتەکانت نییە.', 'Not authorized to upload or edit platform fonts.'],
    [/ملف الخط فارغ أو غير صالح/i, 'فایلی فۆنتەکە بەتاڵە یان نادروستە.', 'Font file is empty or invalid.'],
    [/حجم ملف الخط/i, 'قەبارەی فایلی فۆنت دەبێت لە نێوان 32 بایت و 8 مێگابایت بێت.', 'Font file size must be between 32 bytes and 8 MB.'],
    [/صيغة ملف الخط غير مدعومة/i, 'جۆری فایلی فۆنت پشتگیری نەکراوە (.otf, .ttf, .woff2, .woff).', 'Unsupported font format. Please upload .otf, .ttf, .woff2, or .woff.'],
    [/فشل رفع ملف الخط/i, 'بارکردنی فایلی فۆنت سەرکەوتوو نەبوو.', 'Failed to upload font file.'],
    [/فشل حذف ملف الخط/i, 'سڕینەوەی فایلی فۆنت سەرکەوتوو نەبوو.', 'Failed to delete font file.'],
    [/Database unavailable/i, 'داتابەیس لەبەردەستدا نییە.', 'Database unavailable'],
    [/Database error/i, 'هەڵەی داتابەیس ڕوویدا.', 'Database error'],
    [/Network/i, 'هەڵەی پەیوەندی ئینتەرنێت.', 'Network connection error.'],
  ];

  for (const [re, ku, en] of exactMap) {
    if (re.test(msg)) return lang === 'ku' ? ku : en;
  }
  return msg;
}

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    appName: 'منيو بلس',
    tagline: 'المنيو والكتالوج الإلكتروني الذكي لمطعمك أو متجرك، والطلبات تصلك فوراً على الواتساب',
    heroBadge: 'المنصة الأذكى لقوائم المطاعم والمتاجر الإلكترونية في العراق 🇮🇶',
    heroTitle: 'المنيو الأذكى بالعراق',
    heroTitleLine2: 'لمتجرك أو مطعمك',
    heroSubtitle: 'أطلق متجرك الآن واستقبل الطلبات',
    heroLead: 'أطلق متجرك الآن واستقبل الطلبات',
    createAccountNow: 'أنشئ حساب مطعمك أو متجرك الآن 🚀',
    getMenuBtn: 'احصل على منيو مشروعك 🚀',
    demoBtn: 'معاينة منيو كاب برجر الحي 👁',
    enterNow: 'دخول الآن',
    completeSetup: 'إكمال الإعداد',

    // Nav
    home: 'الرئيسية',
    about: 'نبذة',
    features: 'مميزاتنا',
    startNow: 'ابدأ الآن',
    pricing: 'الأسعار',
    demoMenuNav: 'منيو كاب برجر التجريبي',
    login: 'تسجيل الدخول',
    dashboard: 'لوحة التحكم',
    partnerDashboard: 'لوحة الشريك',
    adminDashboard: 'لوحة تحكم مدير المنصة',
    logout: 'تسجيل الخروج',
    viewLiveMenu: 'معاينة المنيو',
    systemOnline: 'النظام يعمل بكفاءة 100%',
    sidebarToggle: 'القوائم الجانبية',
    collapseSidebar: 'طي القائمة الجانبية',
    expandSidebar: 'فتح القائمة الجانبية',

    // About & Demo section
    aboutTitle: 'نبذة عن منيو بلس',
    aboutLead: 'تجربة حية تفاعلية تحاكي هاتف زبونك: تصفح الأصناف، أضف للسلة، وجرب إرسال الطلب للواتساب.',
    phoneSearchPlaceholder: 'ابحث عن برجر أو منتج...',
    phoneRestaurantTitle: 'كاب برجر | Cap Burger',
    phoneRestaurantSubtitle: 'سماش برجر لحم، دجاج كريسبي، فرايز ومشروبات باردة',
    openNow: 'مفتوح الآن',
    closedNow: 'مغلق حالياً',
    phoneAllCat: 'الكل',
    phoneBurgers: 'سماش برجر',
    phonePizza: 'دجاج كريسبي',
    phoneGrills: 'فرايز وصوصات',
    phoneDrinks: 'مشروبات باردة',
    phoneDesserts: 'حلويات',
    phoneAdd: 'إضافة',
    sendWhatsApp: 'إرسال الطلب عبر الواتساب',
    cartEmpty: 'السلة فارغة حالياً',
    cartSubtotal: 'مجموع الطلب',
    currencyIqd: 'د.ع',

    // Features section
    whyTitle: 'كل ما يحتاجه مطعمك أو متجرك لبيع أكثر',
    whyLead: 'منيو سريع يفتح بلمسة واحدة، وطلبات تصل منظمة مباشرة لواتسابك بدون تعقيد.',
    feature1Title: 'صفر عمولة.. وأرباحك 100% لك',
    feature1Desc: 'استقبل مئات الطلبات يومياً بدون اقتطاع أي نسبة مئوية أو رسوم خفية؛ كل دينار يدخل حسابك بالكامل.',
    feature2Title: 'طلبات مرتبة على واتسابك بلحظة',
    feature2Desc: 'يتصفح الزبون الصور ويضيف للسلة ويرسل لك فاتورة جاهزة بالأسعار والعنوان وموقع GPS فوراً.',
    feature3Title: 'تحكم فوري بالأسعار والأصناف',
    feature3Desc: 'نفدت وجبة أو تغيّر سعر؟ عدّل الأسعار وأخفِ الأصناف أو أطلق خصماً من موبايلك بنفس الثانية.',
    feature4Title: 'باركود QR خاص لطاولاتك وإعلاناتك',
    feature4Desc: 'باركود بتصميم أنيق وشعار مطعمك، يمسحه الزبون بكاميرا هاتفه ليفتح المنيو فوراً دون تحميل تطبيق.',
    feature5Title: 'أدوات ذكية تضاعف قيمة الفاتورة',
    feature5Desc: 'عجلة حظ، كوبونات خصم، ومقترحات إضافية داخل السلة تشجّع الزبون على زيادة طلبه تلقائياً.',
    feature6Title: 'لوحة مبيعات وتقارير لحظية',
    feature6Desc: 'تعرّف على عدد الزوار، أكثر الأصناف طلباً، وأوقات الذروة بوضوح لتتخذ قرارات تزيد مبيعاتك.',

    // Steps section
    stepsTitle: 'كيف تبدأ مع منيو بلس؟',
    stepsLead: 'أربع خطوات سهلة ومباشرة لتبدأ باستقبال الطلبات لمطعمك أو متجرك خلال دقائق:',
    step1Title: '1. سجّل حساب مشروعك',
    step1Desc: 'أنشئ حساب مطعمك أو متجرك برقم هاتفك واسم مشروعك في ثوانٍ معدودة وبدون أي تعقيد.',
    step2Title: '2. أضف منتجاتك وأسعارك',
    step2Desc: 'رتّب أقسامك وأضف الأطباق أو المنتجات مع الصور والأسعار والخيارات.',
    step3Title: '3. انشر الرابط وكود الـ QR',
    step3Desc: 'اطبع كود الـ QR في محلك أو شارك الرابط في إنستغرام وتيك توك وفيسبوك.',
    step4Title: '4. استقبل الطلبات بالواتساب',
    step4Desc: 'يصلك إشعار الطلب مفصلاً مع العنوان والمجموع، وتابع إحصائيات مبيعاتك لحظة بلحظة.',
    stepsCta: 'ابدأ الآن وسجل مشروعك 🚀',

    // Partner Dashboard
    tabOverview: 'نظرة عامة',
    tabCategories: 'الأقسام',
    tabItems: 'العناصر والمنتجات',
    tabAppearance: 'مظهر المنيو',
    tabOrders: 'الطلبات الواردة',
    tabSettings: 'الإعدادات',
    tabQrCode: 'كود الـ QR',
    totalItems: 'إجمالي المنتجات',
    totalCategories: 'عدد الأقسام',
    totalOrders: 'إجمالي الطلبات',
    workStatus: 'حالة المطعم',
    bestSellers: 'الأصناف الأكثر مبيعاً 🌟',
    addCategory: 'إضافة قسم جديد',
    categoryName: 'اسم القسم',
    categoryEmoji: 'إيموجي القسم',
    addItem: 'إضافة عنصر جديد',
    itemName: 'اسم الصنف',
    itemPrice: 'السعر',
    itemDesc: 'الوصف ومكونات الطبق',
    itemImage: 'صورة الصنف',
    itemCategory: 'القسم',
    itemSizes: 'الأحجام',
    itemExtras: 'الإضافات',
    saveChanges: 'حفظ التعديلات',
    orderStatusPending: 'جديد',
    orderStatusPreparing: 'قيد التجهيز',
    orderStatusCompleted: 'مكتمل',
    orderStatusCancelled: 'ملغي',
    deliveryOrder: 'طلب توصيل',
    pickupOrder: 'استلام من الفرع',
    customerName: 'اسم الزبون',
    customerPhone: 'رقم الهاتف',
    customerAddress: 'عنوان التوصيل',
    orderNotes: 'ملاحظات إضافية',

    // Auth
    authLoginTitle: 'تسجيل الدخول إلى حسابك',
    authSignupTitle: 'إنشاء حساب جديد لمطعمك',
    usernameOrPhone: 'البريد الإلكتروني',
    enterUsername: 'أدخل البريد الإلكتروني',
    password: 'كلمة المرور',
    enterPassword: 'أدخل كلمة المرور',
    projectName: 'اسم المطعم أو المشروع',
    phone: 'رقم الهاتف',
    loginBtn: 'تسجيل الدخول 🚀',
    signupBtn: 'إنشاء حساب مطعمي ✨',
    forgotPassword: 'نسيت كلمة المرور؟',
    haveAccount: 'لديك حساب بالفعل؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    orderDirectWhatsApp: 'إرسال الطلب عبر الواتساب',

    // Dashboard & Extended Keys (AR)
    tabHome: 'الصفحة الرئيسية',
    tabProStats: 'احصائيات احترافية',
    tabAppearanceMenu: 'المظهر',
    tabBranches: 'عدة أفرع',
    tabAddons: 'الإضافات',
    tabQrMenuLink: 'كود QR ورابط المنيو',
    tabQrCatalogLink: 'كود QR ورابط الكتالوج',
    openMenuDirect: 'فتح المنيو',
    copyLinkBtn: 'نسخ الرابط',
    linkCopiedToast: 'تم نسخ الرابط بنجاح ✓',
    getHelpBtn: 'احصل على مساعدة',
    adminPanelBtn: 'لوحة تحكم الإدارة',
    monthlyOrdersLabel: 'طلبات هذا الشهر',
    activePlanLabel: 'الباقة الحالية',
    planExpiryLabel: 'تاريخ الانتهاء',
    tipsSectionTitle: 'نصائح لتحسين المنيو وزيادة مبيعاتك',
    tipsShareTitle: 'كيف تنشر رابطك وتجلب طلبات أكثر؟',
    lockedTabNotice: 'ميزة متوفرة في باقة أعلى — يمكنك استعراض التفاصيل والترقية في أي وقت.',
    upgradeViaWhatsapp: 'ترقية الباقة عبر واتساب',
    heroBadgeShort: 'منصتك الذكية للمنيو والكتالوج',
    annualSaveLabel: 'خصم السنوي (شهر مجاناً)',
    monthlyBilling: 'شهري',
    annualBilling: 'سنوي',
    perMonth: 'د.ع / شهر',
    perYear: 'د.ع / سنة',
    freeForever: 'مجاني 100%',
    choosePlanBtn: 'ابدأ بهذه الباقة',
    popularBadge: 'الأكثر طلباً',
    faqSupportBtn: 'تواصل معنا عبر واتساب',
    allRightsReserved: 'جميع الحقوق محفوظة',
    homeMenuDemoPreviewBtn: 'معاينة المنيو الحي 👁',
    backHomeBtn: 'العودة للرئيسية',
    backBtn: 'رجوع',
    nextBtn: 'التالي',
    finishAndEnterDashboard: 'حفظ والدخول إلى لوحة التحكم 🚀',
    optionalStepHint: 'اختياري — في حال التخطي سيتم وضع صورة وبنر ونبذة افتراضية تلقائياً',
    uploadLogoLabel: 'شعار المشروع',
    uploadBannerLabel: 'صورة البنر (الغلاف)',
    chooseProjectTypeTitle: 'ما نوع مشروعك؟',
    restaurantTypeLabel: 'مطعم / كافيه / حلويات',
    storeTypeLabel: 'متجر إلكتروني / تجزئة',
    selectCountryLabel: 'الدولة',
    selectRegionLabel: 'المحافظة / المنطقة',
    selectLanguageLabel: 'لغة العرض الافتراضية',
    selectCurrencyLabel: 'العملة',
    searchMenuPlaceholder: 'ابحث في المنيو...',
    allCategoriesLabel: 'الكل',
    addToCartBtn: 'أضف للسلة',
    viewCartBtn: 'عرض السلة',
    checkoutTitle: 'إتمام الطلب',
    sendOrderBtn: 'تأكيد وإرسال الطلب',
    orderSentSuccess: 'تم إرسال طلبك بنجاح! ✓',
    callWaiterBtn: 'نداء النادل',
    workingHoursTitle: 'أوقات العمل',
    aboutSectionTitle: 'من نحن',
    reviewsTitle: 'تقييمات الزبائن',
    rateUsTitle: 'قيّم تجربتك',
    emptyMenuText: 'لم تتم إضافة أصناف بعد.',
    spinWheelTitle: 'عجلة الحظ',
    unavailableLabel: 'غير متوفر حالياً',
    optionalNotesPlaceholder: 'أضف أي ملاحظة خاصة للطلب...',
    sun: 'الأحد',
    mon: 'الإثنين',
    tue: 'الثلاثاء',
    wed: 'الأربعاء',
    thu: 'الخميس',
    fri: 'الجمعة',
    sat: 'السبت',
  },

  ku: {
    appName: 'مینیۆ پڵەس',
    tagline: 'مینیۆ و کەتەلۆگی دیجیتاڵی زیرەک بۆ چێشتخانە یان فرۆشگاکەت، داواکارییەکان ڕاستەوخۆ دەگەنە واتسئاپ',
    heroBadge: 'پێشکەوتووترین پلاتفۆرمی مینیۆ و کەتەلۆگی دیجیتاڵ لە عێراق 🇮🇶',
    heroTitle: 'زیرەکترین مینیۆ لە عێراق',
    heroTitleLine2: 'بۆ فرۆشگا یان چێشتخانەکەت',
    heroSubtitle: 'ئێستا فرۆشگاکەت بخە کار و داواکاری وەرگرە',
    heroLead: 'ئێستا فرۆشگاکەت بخە کار و داواکاری وەرگرە',
    createAccountNow: 'ئێستا هەژماری پرۆژەکەت دروست بکە 🚀',
    getMenuBtn: 'مینیۆی پرۆژەکەت وەربگرە 🚀',
    demoBtn: 'تاقیکردنەوەی مینیۆی کاپ بەرگر 👁',
    enterNow: 'چوونەژوورەوە ئێستا',
    completeSetup: 'تەواوکردنی ڕێکخستن',

    // Nav
    home: 'سەرەکی',
    about: 'دەربارە',
    features: 'تایبەتمەندییەکان',
    startNow: 'ئێستا دەستپێبکە',
    pricing: 'نرخەکان',
    demoMenuNav: 'مینیۆی کاپ بەرگر',
    login: 'چوونەژوورەوە',
    dashboard: 'کۆنتڕۆڵ پانێڵ',
    partnerDashboard: 'پانێڵی هاوبەش',
    adminDashboard: 'پانێڵی بەڕێوەبەری پلاتفۆرم',
    logout: 'چوونەدەرەوە',
    viewLiveMenu: 'بینینی مینیۆ',
    systemOnline: 'سیستەم بە ڕێژەی ١٠٠٪ چالاکە',
    sidebarToggle: 'لیستە لاوەکییەکان',
    collapseSidebar: 'داخستنی لیستی لاوەکی',
    expandSidebar: 'کردنەوەی لیستی لاوەکی',

    // About & Demo section
    aboutTitle: 'دەربارەی مینیۆ پڵەس',
    aboutLead: 'ئەزموونێکی ڕاستەقینە هاوشێوەی مۆبایلی کڕیار: بەرهەمەکان هەڵبژێرە، زیادی بکە بۆ سەبەتە و تاقیبکەرەوە لە واتسئاپ.',
    phoneSearchPlaceholder: 'گەڕان بۆ بەرگر یان بەرهەم...',
    phoneRestaurantTitle: 'کاپ بەرگر | Cap Burger',
    phoneRestaurantSubtitle: 'سماش بەرگری تازە، کریسپی، فرایز و خواردنەوە ساردەکان',
    openNow: 'ئێستا کراوەیە',
    closedNow: 'ئێستا داخراوە',
    phoneAllCat: 'هەمووی',
    phoneBurgers: 'سماش بەرگر',
    phonePizza: 'مریشکی کریسپی',
    phoneGrills: 'فرایز و سۆس',
    phoneDrinks: 'خواردنەوە ساردەکان',
    phoneDesserts: 'شیرینی',
    phoneAdd: 'زیادکردن',
    sendWhatsApp: 'ناردنی داواکاری لە واتسئاپ',
    cartEmpty: 'سەبەتە ئێستا بەتاڵە',
    cartSubtotal: 'کۆی داواکاری',
    currencyIqd: 'د.ع',

    // Features section
    whyTitle: 'هەموو ئەوەی چێشتخانە یان فرۆشگاکەت پێویستیەتی بۆ فرۆشتنی زیاتر',
    whyLead: 'مینیۆیەکی خێرا بە یەک دەستلێدان دەکرێتەوە و داواکارییەکان ڕێکخراو دەگەنە واتسئاپ.',
    feature1Title: '٠٪ عمولە.. تەواوی قازانج بۆ خۆتە',
    feature1Desc: 'ڕۆژانە سەدان داواکاری وەربگرە بەبێ هیچ ڕێژە یان تێچوویەکی شاراوە.',
    feature2Title: 'داواکاری ڕێکخراو لە واتسئاپ لە چرکەیەکدا',
    feature2Desc: 'کڕیار وێنەکان دەبینێت و وەسڵی تەواو بە نرخ و ناونیشان و نەخشەی GPS دەنێرێت یەکسەر.',
    feature3Title: 'کۆنترۆڵی خێرای نرخ و بەرهەمەکان',
    feature3Desc: 'خواردن تەواوبوو یان نرخ گۆڕا؟ نرخەکان بگۆڕە یان بەرهەم بشارەوە و داشکاندن بکە لە هەمان چرکەدا.',
    feature4Title: 'کۆدی QR ی تایبەت بۆ مێز و ڕیکلام',
    feature4Desc: 'کۆد بە دیزاینی جوان و لۆگۆی خۆت؛ کڕیار بە کامێرا سکانی دەکات بەبێ داگرتنی ئەپ.',
    feature5Title: 'ئامرازی زیرەک بۆ زیادکردنی وەسڵ',
    feature5Desc: 'چەرخی بەخت، کۆدی داشکاندن و پێشنیاری ناو سەبەتە فرۆشتنت زیاد دەکەن.',
    feature6Title: 'ئاماری فرۆشتن و ڕاپۆرتی خێرا',
    feature6Desc: 'ژمارەی سەردان، پڕفرۆشترین بەرهەمەکان و کاتە قەرەباڵغەکان ببینە بۆ بڕیاری دروست.',

    // Steps section
    stepsTitle: 'چۆن دەستپێبکەیت لەگەڵ مینیۆ پڵەس؟',
    stepsLead: 'چوار هەنگاوی ئاسان و ڕوون بۆ ئەوەی لە ماوەی چەند خولەکێکدا دەست بکەیت بە وەرگرتنی داواکاری:',
    step1Title: '١. هەژمارەکەت تۆمار بکە',
    step1Desc: 'بە ژمارەی مۆبایل و ناوی چێشتخانە یان فرۆشگاکەت هەژمار دروست بکە لە چەند چرکەیەکدا.',
    step2Title: '٢. بەرهەم و نرخەکان دابنێ',
    step2Desc: 'بەشەکان ڕێکبخە و خواردن یان بەرهەمەکان بە وێنە و نرخ و بژاردەکان دابنێ.',
    step3Title: '٣. لینک و کۆدی QR بڵاوبکەرەوە',
    step3Desc: 'کۆدی QR چاپ بکە لە دووکانەکەت یان لینکەکەی لە ئینستاگرام و تیکتۆک و فەیسبووک هاوبەش بکە.',
    step4Title: '٤. داواکارییەکان لە واتسئاپ وەربگرە',
    step4Desc: 'ئاگادارکردنەوەی داواکاری بە تەواوی ناونیشان و کۆی گشتی وەربگرە و چاودێری فرۆش بکە.',
    stepsCta: 'ئێستا دەستپێبکە و ناونووسین بکە 🚀',

    // Partner Dashboard
    tabOverview: 'ڕوانگەی گشتی',
    tabCategories: 'بەشەکان',
    tabItems: 'بەرهەم و خواردنەکان',
    tabAppearance: 'ڕووکاری مینیۆ',
    tabOrders: 'داواکارییەکان',
    tabSettings: 'ڕێکخستنەکان',
    tabQrCode: 'کۆدی QR',
    totalItems: 'کۆی بەرهەمەکان',
    totalCategories: 'ژمارەی بەشەکان',
    totalOrders: 'کۆی داواکارییەکان',
    workStatus: 'دۆخی کارکردن',
    bestSellers: 'پڕفرۆشترین خواردنەکان 🌟',
    addCategory: 'زیادکردنی بەشی نوێ',
    categoryName: 'ناوی بەش',
    categoryEmoji: 'ئیمۆجی بەش',
    addItem: 'زیادکردنی بەرهەمی نوێ',
    itemName: 'ناوی بەرهەم',
    itemPrice: 'نرخ',
    itemDesc: 'وەسف و پێکهاتەکان',
    itemImage: 'وێنەی بەرهەم',
    itemCategory: 'بەش',
    itemSizes: 'قەبارەکان',
    itemExtras: 'زیادکراوەکان',
    saveChanges: 'پاشەکەوتکردنی گۆڕانکارییەکان',
    orderStatusPending: 'نوێ',
    orderStatusPreparing: 'لە ئامادەکردندا',
    orderStatusCompleted: 'تەواوبوو',
    orderStatusCancelled: 'هەڵوەشێنراوە',
    deliveryOrder: 'داواکاری گەیاندن',
    pickupOrder: 'وەرگرتن لە لق',
    customerName: 'ناوی کڕیار',
    customerPhone: 'ژمارەی مۆبایل',
    customerAddress: 'ناونیشانی گەیاندن',
    orderNotes: 'تێبینی زیادە',

    // Auth
    authLoginTitle: 'چوونەژوورەوە بۆ هەژمارەکەت',
    authSignupTitle: 'دروستکردنی هەژماری نوێ بۆ چێشتخانەکەت',
    usernameOrPhone: 'ئیمەیڵ',
    enterUsername: 'ئیمەیڵەکەت بنووسە',
    password: 'وشەی نهێنی',
    enterPassword: 'وشەی نهێنی بنووسە',
    projectName: 'ناوی چێشتخانە یان پرۆژە',
    phone: 'ژمارەی مۆبایل',
    loginBtn: 'چوونەژوورەوە 🚀',
    signupBtn: 'تۆمارکردنی چێشتخانەکەم ✨',
    forgotPassword: 'وشەی نهێنیت لەبیرچووە؟',
    haveAccount: 'پێشتر هەژمارت هەبووە؟',
    dontHaveAccount: 'هەژمارت نییە؟',
    orderDirectWhatsApp: 'ناردنی داواکاری لە واتسئاپ',

    // Dashboard & Extended Keys (KU)
    tabHome: 'پەڕەی سەرەکی',
    tabProStats: 'ئاماری پڕۆفیشناڵ',
    tabAppearanceMenu: 'ڕووکار',
    tabBranches: 'فرە لق',
    tabAddons: 'زیادکراوەکان',
    tabQrMenuLink: 'کۆدی QR و لینکی مینیۆ',
    tabQrCatalogLink: 'کۆدی QR و لینکی کەتەلۆگ',
    openMenuDirect: 'کردنەوەی مینیۆ',
    copyLinkBtn: 'کۆپیکردنی لینک',
    linkCopiedToast: 'لینکەکە کۆپی کرا ✓',
    getHelpBtn: 'یارمەتی وەرگرە',
    adminPanelBtn: 'پانێڵی بەڕێوەبەری گشتی',
    monthlyOrdersLabel: 'داواکارییەکانی ئەم مانگە',
    activePlanLabel: 'پاکێجی ئێستا',
    planExpiryLabel: 'بەرواری بەسەرچوون',
    tipsSectionTitle: 'ئامۆژگاری بۆ باشترکردنی مینیۆ و زیادکردنی فرۆش',
    tipsShareTitle: 'چۆن لینکەکەت بڵاوبکەیتەوە و داواکاری زیاتر بهێنیت؟',
    lockedTabNotice: 'ئەم تایبەتمەندییە لە پاکێجی بەرزتردایە — دەتوانیت بیبینیت و هەر کاتێک بتەوێت بەرزی بکەیتەوە.',
    upgradeViaWhatsapp: 'بەرزکردنەوەی پاکێج لە واتسئاپ',
    heroBadgeShort: 'پلاتفۆرمی زیرەکی مینیۆ و کەتەلۆگ',
    annualSaveLabel: 'داشکاندنی ساڵانە (مانگێک بێبەرامبەر)',
    monthlyBilling: 'مانگانە',
    annualBilling: 'ساڵانە',
    perMonth: 'د.ع / مانگ',
    perYear: 'د.ع / ساڵ',
    freeForever: '١٠٠٪ بێبەرامبەر',
    choosePlanBtn: 'بەم پاکێجە دەستپێبکە',
    popularBadge: 'پڕداواکارترین',
    faqSupportBtn: 'پەیوەندیمان پێوە بکە لە واتسئاپ',
    allRightsReserved: 'هەموو مافەکان پارێزراون',
    homeMenuDemoPreviewBtn: 'بینینی مینیۆی نموونەیی 👁',
    backHomeBtn: 'گەڕانەوە بۆ سەرەکی',
    backBtn: 'گەڕانەوە',
    nextBtn: 'دواتر',
    finishAndEnterDashboard: 'پاشەکەوتکردن و چوونە ناو پانێڵ 🚀',
    optionalStepHint: 'ئارەزوومەندانەیە — ئەگەر بەجێی بهێڵیت وێنە و لۆگۆی بنەڕەتی دادەنرێت',
    uploadLogoLabel: 'لۆگۆی پرۆژە',
    uploadBannerLabel: 'وێنەی بەرگ (بانەر)',
    chooseProjectTypeTitle: 'جۆری پرۆژەکەت چییە؟',
    restaurantTypeLabel: 'چێشتخانە / کافێ / شیرینی',
    storeTypeLabel: 'فرۆشگای ئەلیکترۆنی / بازرگانی',
    selectCountryLabel: 'وڵات',
    selectRegionLabel: 'پارێزگا / ناوچە',
    selectLanguageLabel: 'زمانی سەرەکی مینیۆ',
    selectCurrencyLabel: 'دراو',
    searchMenuPlaceholder: 'گەڕان لە مینیۆدا...',
    allCategoriesLabel: 'هەمووی',
    addToCartBtn: 'زیادکردن بۆ سەبەتە',
    viewCartBtn: 'بینینی سەبەتە',
    checkoutTitle: 'تەواوکردنی داواکاری',
    sendOrderBtn: 'ناردنی داواکاری',
    orderSentSuccess: 'داواکارییەکەت بە سەرکەوتوویی نێردرا! ✓',
    callWaiterBtn: 'بانگکردنی گارسۆن',
    workingHoursTitle: 'کاتژمێرەکانی کارکردن',
    aboutSectionTitle: 'دەربارەی ئێمە',
    reviewsTitle: 'هەڵسەنگاندنی کڕیاران',
    rateUsTitle: 'ئەزموونەکەت هەڵبسەنگێنە',
    emptyMenuText: 'هێشتا هیچ بەرهەمێک زیاد نەکراوە.',
    spinWheelTitle: 'چەرخی بەخت',
    unavailableLabel: 'ئێستا بەردەست نییە',
    optionalNotesPlaceholder: 'تێبینی خۆت بنووسە...',
    sun: 'یەکشەممە',
    mon: 'دووشەممە',
    tue: 'سێشەممە',
    wed: 'چوارشەممە',
    thu: 'پێنجشەممە',
    fri: 'هەینی',
    sat: 'شەممە',
  },

  en: {
    appName: 'Menu+',
    tagline: 'Smart QR digital menu & product catalog for restaurants, cafés, and online stores',
    heroBadge: 'Smartest Digital Menu & Store Catalog Platform in Iraq 🇮🇶',
    heroTitle: 'The Smartest Menu in Iraq',
    heroTitleLine2: 'For Your Store or Restaurant',
    heroSubtitle: 'Launch your store now and start receiving orders',
    heroLead: 'Launch your store now and start receiving orders',
    createAccountNow: 'Create Business Account 🚀',
    getMenuBtn: 'Launch Your Digital Menu 🚀',
    demoBtn: 'View Cap Burger Live Demo 👁',
    enterNow: 'Enter Now',
    completeSetup: 'Complete Setup',

    // Nav
    home: 'Home',
    about: 'About',
    features: 'Features',
    startNow: 'Start Now',
    pricing: 'Pricing',
    demoMenuNav: 'Cap Burger Demo',
    login: 'Log In',
    dashboard: 'Dashboard',
    partnerDashboard: 'Partner Dashboard',
    adminDashboard: 'Platform Admin Dashboard',
    logout: 'Log Out',
    viewLiveMenu: 'Preview Menu',
    systemOnline: 'System 100% Operational',
    sidebarToggle: 'Side Navigation',
    collapseSidebar: 'Collapse Sidebar',
    expandSidebar: 'Expand Sidebar',

    // About & Demo section
    aboutTitle: 'About Menu+',
    aboutLead: 'A live interactive preview just like your customer sees on mobile: browse categories, add to cart, and test WhatsApp orders.',
    phoneSearchPlaceholder: 'Search burgers, fries, drinks...',
    phoneRestaurantTitle: 'Cap Burger | كاب برجر',
    phoneRestaurantSubtitle: 'Fresh smashed beef burgers, crispy chicken, loaded fries & cold drinks',
    openNow: 'Open Now',
    closedNow: 'Closed Now',
    phoneAllCat: 'All',
    phoneBurgers: 'Smash Burgers',
    phonePizza: 'Crispy Chicken',
    phoneGrills: 'Fries & Sauces',
    phoneDrinks: 'Cold Drinks',
    phoneDesserts: 'Desserts',
    phoneAdd: 'Add',
    sendWhatsApp: 'Send Order via WhatsApp',
    cartEmpty: 'Cart is currently empty',
    cartSubtotal: 'Order Subtotal',
    currencyIqd: 'IQD',

    // Features section
    whyTitle: 'Everything Your Business Needs to Sell More',
    whyLead: 'A lightning-fast digital menu that opens in one tap and sends clean orders straight to WhatsApp.',
    feature1Title: '0% Commission — 100% Yours',
    feature1Desc: 'Receive unlimited daily orders with zero percentage fees or hidden cuts; every dinar stays with you.',
    feature2Title: 'Instant Formatted WhatsApp Orders',
    feature2Desc: 'Customers browse photos, add to cart, and send itemized bills with address & GPS location in one tap.',
    feature3Title: 'Real-Time Price & Menu Control',
    feature3Desc: 'Out of stock or launching a deal? Update prices, hide dishes, or launch offers straight from your phone.',
    feature4Title: 'Branded QR Codes Ready to Print',
    feature4Desc: 'Sleek custom QR codes with your logo—customers scan with any camera to open instantly without an app.',
    feature5Title: 'Smart Tools That Boost Order Size',
    feature5Desc: 'Spin-the-wheel rewards, promo coupons, and cart upsells naturally increase your average ticket.',
    feature6Title: 'Live Sales & Top-Item Analytics',
    feature6Desc: 'Track daily visitors, top-selling dishes, and peak hours clearly to grow your revenue faster.',

    // Steps section
    stepsTitle: 'How to Get Started with Menu+?',
    stepsLead: 'Four straightforward steps to start receiving orders in just minutes:',
    step1Title: '1. Register Your Business',
    step1Desc: 'Create your restaurant or store profile with your phone number and business name in seconds.',
    step2Title: '2. Add Products & Prices',
    step2Desc: 'Organize your categories and upload crisp product photos with clear prices and options.',
    step3Title: '3. Share the QR Code & Link',
    step3Desc: 'Print QR stand cards and share your link across Instagram, TikTok, and social channels.',
    step4Title: '4. Receive Orders on WhatsApp',
    step4Desc: 'Get formatted WhatsApp orders instantly with address details while monitoring live analytics.',
    stepsCta: 'Start Now & Register Your Business 🚀',

    // Partner Dashboard
    tabOverview: 'Overview',
    tabCategories: 'Categories',
    tabItems: 'Menu Items',
    tabAppearance: 'Appearance',
    tabOrders: 'Orders',
    tabSettings: 'Settings',
    tabQrCode: 'QR Code',
    totalItems: 'Total Products',
    totalCategories: 'Categories',
    totalOrders: 'Total Orders',
    workStatus: 'Operating Status',
    bestSellers: 'Top Selling Items 🌟',
    addCategory: 'Add New Category',
    categoryName: 'Category Name',
    categoryEmoji: 'Category Emoji',
    addItem: 'Add New Item',
    itemName: 'Item Name',
    itemPrice: 'Price',
    itemDesc: 'Description & Ingredients',
    itemImage: 'Item Image',
    itemCategory: 'Category',
    itemSizes: 'Sizes',
    itemExtras: 'Add-ons',
    saveChanges: 'Save Changes',
    orderStatusPending: 'New',
    orderStatusPreparing: 'Preparing',
    orderStatusCompleted: 'Completed',
    orderStatusCancelled: 'Cancelled',
    deliveryOrder: 'Delivery Order',
    pickupOrder: 'Branch Pickup',
    customerName: 'Customer Name',
    customerPhone: 'Phone Number',
    customerAddress: 'Delivery Address',
    orderNotes: 'Order Notes',

    // Auth
    authLoginTitle: 'Log in to Your Account',
    authSignupTitle: 'Create New Restaurant Account',
    usernameOrPhone: 'Email Address',
    enterUsername: 'Enter email address',
    password: 'Password',
    enterPassword: 'Enter your password',
    projectName: 'Restaurant / Business Name',
    phone: 'Phone Number',
    loginBtn: 'Sign In 🚀',
    signupBtn: 'Create Restaurant Account ✨',
    forgotPassword: 'Forgot Password?',
    haveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    orderDirectWhatsApp: 'Send Order via WhatsApp',

    // Dashboard & Extended Keys (EN)
    tabHome: 'Home',
    tabProStats: 'Pro Analytics',
    tabAppearanceMenu: 'Appearance',
    tabBranches: 'Branches',
    tabAddons: 'Add-ons',
    tabQrMenuLink: 'QR & Menu Link',
    tabQrCatalogLink: 'QR & Catalog Link',
    openMenuDirect: 'Open Menu',
    copyLinkBtn: 'Copy Link',
    linkCopiedToast: 'Link copied ✓',
    getHelpBtn: 'Get Help',
    adminPanelBtn: 'Admin Panel',
    monthlyOrdersLabel: 'Orders This Month',
    activePlanLabel: 'Current Plan',
    planExpiryLabel: 'Expiry Date',
    tipsSectionTitle: 'Tips to Complete Your Setup & Grow Sales',
    tipsShareTitle: 'How to Share Your Link & Get More Orders',
    lockedTabNotice: 'Available on a higher plan — you can inspect all options and upgrade anytime.',
    upgradeViaWhatsapp: 'Upgrade via WhatsApp',
    heroBadgeShort: 'Smart Digital Menu & Store Catalog',
    annualSaveLabel: 'Annual discount (1 month free)',
    monthlyBilling: 'Monthly',
    annualBilling: 'Annual',
    perMonth: 'IQD / mo',
    perYear: 'IQD / yr',
    freeForever: '100% Free',
    choosePlanBtn: 'Start With This Plan',
    popularBadge: 'Most Popular',
    faqSupportBtn: 'Contact Support on WhatsApp',
    allRightsReserved: 'All rights reserved',
    homeMenuDemoPreviewBtn: 'Open Live Demo 👁',
    backHomeBtn: 'Back to Home',
    backBtn: 'Back',
    nextBtn: 'Next',
    finishAndEnterDashboard: 'Save & Open Dashboard 🚀',
    optionalStepHint: 'Optional — if skipped, a curated default logo, banner, and bio will be assigned.',
    uploadLogoLabel: 'Business Logo',
    uploadBannerLabel: 'Cover Banner',
    chooseProjectTypeTitle: 'What type of business is yours?',
    restaurantTypeLabel: 'Restaurant / Café / Sweets',
    storeTypeLabel: 'Online Store / Retail Shop',
    selectCountryLabel: 'Country',
    selectRegionLabel: 'City / Region',
    selectLanguageLabel: 'Default Menu Language',
    selectCurrencyLabel: 'Currency',
    searchMenuPlaceholder: 'Search items...',
    allCategoriesLabel: 'All',
    addToCartBtn: 'Add to Cart',
    viewCartBtn: 'View Cart',
    checkoutTitle: 'Complete Order',
    sendOrderBtn: 'Confirm & Send Order',
    orderSentSuccess: 'Your order has been sent! ✓',
    callWaiterBtn: 'Call Waiter',
    workingHoursTitle: 'Opening Hours',
    aboutSectionTitle: 'About Us',
    reviewsTitle: 'Customer Reviews',
    rateUsTitle: 'Rate Your Experience',
    emptyMenuText: 'No items added yet.',
    spinWheelTitle: 'Lucky Spin Wheel',
    unavailableLabel: 'Currently Unavailable',
    optionalNotesPlaceholder: 'Add any special notes...',
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
  },
  // Fallbacks for any legacy type references
  es: {} as any,
  fr: {} as any,
  ur: {} as any,
};

// Mirror Spanish, French, Urdu to English/Arabic if ever queried
TRANSLATIONS.es = TRANSLATIONS.en;
TRANSLATIONS.fr = TRANSLATIONS.en;
TRANSLATIONS.ur = TRANSLATIONS.ar;

const STORAGE_KEY = 'menuplus_lang';

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'ar';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'ar' || saved === 'ku' || saved === 'en')) return saved;
  } catch {
    // ignore
  }
  return 'ar';
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    const validLang: SupportedLanguage = (lang === 'ku' || lang === 'en') ? lang : 'ar';
    localStorage.setItem(STORAGE_KEY, validLang);
    const isRtl = validLang === 'ar' || validLang === 'ku';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = validLang;
    window.dispatchEvent(new CustomEvent('menuplus_lang_changed', { detail: validLang }));
  } catch {
    // ignore
  }
}

if (typeof document !== 'undefined') {
  const bootLang = getStoredLanguage();
  document.documentElement.dir = bootLang === 'en' ? 'ltr' : 'rtl';
  document.documentElement.lang = bootLang;
}

export function useTranslation() {
  const [lang, setLangState] = useState<SupportedLanguage>(getStoredLanguage());
  const isRtl = lang === 'ar' || lang === 'ku';
  const locale = getIntlLocale(lang);

  useEffect(() => {
    const onLangChanged = (e: any) => {
      if (e?.detail && (e.detail === 'ar' || e.detail === 'ku' || e.detail === 'en')) {
        setLangState(e.detail as SupportedLanguage);
      }
    };
    window.addEventListener('menuplus_lang_changed', onLangChanged);
    return () => window.removeEventListener('menuplus_lang_changed', onLangChanged);
  }, []);

  const setLang = (newLang: SupportedLanguage) => {
    const validLang = (newLang === 'ku' || newLang === 'en') ? newLang : 'ar';
    setLangState(validLang);
    setStoredLanguage(validLang);
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
  const tr = (ar: string, ku: string, en: string): string => trByLang(lang, ar, ku, en);

  return {
    t,
    lang,
    setLang,
    isRtl,
    locale,
    tr,
  };
}
