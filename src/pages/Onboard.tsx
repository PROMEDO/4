/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Category, MenuItem, Restaurant, SiteSettings } from '../types';
import {
  compressImage,
  deleteItem,
  flushRemoteSync,
  formatNumber,
  getCollection,
  getItem,
  getPlans,
  getSession,
  putItem,
  saveOnboardProfileToServer,
  setSession,
  uid,
} from '../utils/storage';
import { getLocalizedPlanName, resolveRestaurantPlan } from '../utils/plans';
import { getLocalizedCurrencyUnit, useTranslation } from '../utils/i18n';
import { LanguageSelector } from '../components/LanguageSelector';
import {
  UtensilsCrossed,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Globe,
  Clock,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Sun,
  Moon,
  Eye,
  LayoutDashboard,
  SlidersHorizontal,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ImageSuggestionPicker } from '../components/ImageSuggestionPicker';
import { AjaxConfirmModal, AjaxDialogState, INITIAL_AJAX_DIALOG } from '../components/AjaxConfirmModal';
import { AppLogo } from '../components/AppLogo';
import { UnifiedSetupProgressBar, UnifiedSetupStage } from '../components/UnifiedSetupProgressBar';
import {
  ensureRestaurantDefaults,
  getDefaultBusinessMedia,
  getPublicMenuUrlPath,
  getSubdomainBaseDomain,
  isReservedSlug,
  sanitizeSlug,
} from '../utils/businessDefaults';

interface OnboardingViewProps {
  restaurantId: string;
  site: SiteSettings;
  onNavigate: (hash: string) => void;
  onRefresh: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  restaurantId,
  site: _site,
  onNavigate,
  onRefresh,
}) => {
  let initialRest = getItem<Restaurant>(`restaurants/${restaurantId}`);
  if (!initialRest) {
    initialRest = {
      id: restaurantId,
      n: 'مشروعي الجديد',
      ow: '',
      ph: '',
      p: 'الباقة الاقتصادية',
      planId: 'starter',
      sub: 'شهري',
      e: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      on: 1,
      done: 0,
      lay: 'list',
      themeMode: 'light',
      themePreset: 'clean-light',
      color: '#0F766E',
      projectType: 'restaurant',
      country: 'العراق',
      region: 'بغداد',
      currency: 'د.ع',
      language: 'ar',
      isPaid: true,
    };
    putItem(`restaurants/${restaurantId}`, initialRest);
  }
  const resolvedPlan = resolveRestaurantPlan(initialRest, getPlans());
  const prefersReducedMotion = useReducedMotion();
  const { t, lang, setLang, isRtl, tr } = useTranslation();

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${t.appName} | ${tr('تجهيز مشروعك', 'ئامادەکردنی پرۆژەکەت', 'Project Setup')}`;
    }
  }, [lang, t.appName, tr]);

  // Steps: 0 = Project Info, 1 = Hours, 2 = Categories, 3 = Items, 4 = Finish ("مبروك"), 5 = Complete Editing ("أكمل التعديل على المنيو")
  const [step, setStep] = useState<number>(0);
  const [isSavingStep, setIsSavingStep] = useState(false);

  // Step 0: Project Identity (Name, Optional Phone without verification, Type, Logo & Cover)
  const initialDefaultLogo = getDefaultBusinessMedia(initialRest.projectType, 'ar').logo;
  const initialDefaultBanner = getDefaultBusinessMedia(initialRest.projectType, 'ar').banner;
  const [projectName, setProjectName] = useState<string>(
    initialRest.n && initialRest.n !== 'مشروعي الجديد' ? initialRest.n : ''
  );
  const [projectPhone, setProjectPhone] = useState<string>(initialRest.ph || '');
  const [projectType, setProjectType] = useState<'restaurant' | 'store'>(
    (initialRest.projectType as 'restaurant' | 'store') || 'restaurant'
  );
  const [logoImg, setLogoImg] = useState<string>(
    initialRest.logo && initialRest.logo !== initialDefaultLogo ? initialRest.logo : ''
  );
  const [coverImg, setCoverImg] = useState<string>(
    initialRest.coverImages?.[0] && initialRest.coverImages[0] !== initialDefaultBanner
      ? initialRest.coverImages[0]
      : ''
  );
  const [customSubdomain, setCustomSubdomain] = useState<string>(initialRest?.slug || '');
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const baseDomain = getSubdomainBaseDomain(_site);
  const subdomainEnabled = _site?.subdomainRules?.enabled === true;

  // Step 1: Working Hours
  const [hoursMode, setHoursMode] = useState<'24' | 'c'>(initialRest?.h?.m || '24');
  const [hoursFrom, setHoursFrom] = useState<string>(initialRest?.h?.f || '09:00');
  const [hoursTo, setHoursTo] = useState<string>(initialRest?.h?.t || '23:00');

  // Step 2: Categories
  const [newCatName, setNewCatName] = useState<string>('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState<string>('');

  // Step 3: Items
  const [itemCat, setItemCat] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemDesc, setItemDesc] = useState<string>('');
  const [itemImage, setItemImage] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<string>('');

  // Step 5: Complete Menu Customization (Description, Light/Dark mode, Accent color, Layout, Categories, Items)
  const [customizeTab, setCustomizeTab] = useState<'style' | 'cats' | 'items'>('style');
  const [tagline, setTagline] = useState<string>(initialRest?.tagline || '');
  const [aboutText, setAboutText] = useState<string>(initialRest?.aboutText || '');
  const [menuThemeMode, setMenuThemeMode] = useState<'light' | 'dark'>(
    initialRest?.themeMode === 'dark' ? 'dark' : 'light'
  );
  const [menuColor] = useState<string>(initialRest?.color || '#0F766E');
  const [menuLayout, setMenuLayout] = useState<'list' | 'grid' | 'cards'>(
    initialRest?.lay === 'grid' ? 'grid' : initialRest?.lay === 'cards' ? 'cards' : 'list'
  );

  const [error, setError] = useState<string>('');
  const [ajaxDialog, setAjaxDialog] = useState<AjaxDialogState>(INITIAL_AJAX_DIALOG);
  const itemFormRef = useRef<HTMLFormElement | null>(null);

  React.useEffect(() => {
    const clean = sanitizeSlug(customSubdomain);
    if (!resolvedPlan.perms.customSlug || !clean) {
      setSubdomainStatus('idle');
      return;
    }
    if (clean.length < 3 || isReservedSlug(clean)) {
      setSubdomainStatus('invalid');
      return;
    }
    setSubdomainStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/subdomains/check?slug=${encodeURIComponent(clean)}&excludeRid=${encodeURIComponent(restaurantId)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        setSubdomainStatus(data?.available ? 'available' : 'taken');
      } catch {
        setSubdomainStatus('idle');
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [customSubdomain, restaurantId, resolvedPlan.perms.customSlug]);

  const triggerAjaxConfirm = (
    title: string,
    message: string,
    type: 'warn' | 'danger' | 'info',
    confirmLabel: string,
    action: () => void | Promise<void>,
    successMessage: string
  ) => {
    setAjaxDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmLabel,
      isCompleted: false,
      successMessage,
      onConfirm: async () => {
        await action();
        setAjaxDialog((prev) => ({ ...prev, isCompleted: true }));
        setTimeout(() => {
          setAjaxDialog((prev) => ({ ...prev, isOpen: false, isCompleted: false }));
        }, 900);
      },
    });
  };

  const allCategories = getCollection<Category>('cats')
    .filter((c) => c.rid === restaurantId)
    .sort((a, b) => (a.o ?? 0) - (b.o ?? 0));
  const allItems = getCollection<MenuItem>('items')
    .filter((i) => i.rid === restaurantId)
    .sort((a, b) => (a.o ?? 0) - (b.o ?? 0));

  const isStore = projectType === 'store';
  const storeCatSuggestions = [
    tr('إلكترونيات', 'ئەلیکترۆنیات', 'Electronics'),
    tr('أدوات منزلية', 'پێداویستی ماڵ', 'Home & Kitchen'),
    tr('ملابس وأزياء', 'جلوبەرگ و مۆدە', 'Fashion'),
    tr('عطور ومستلزمات', 'بۆن و جوانکاری', 'Perfumes & Beauty'),
    tr('إكسسوارات', 'ئێکسسوارات', 'Accessories'),
  ];
  const restCatSuggestions = [
    tr('البرجر', 'بەرگەر', 'Burgers'),
    tr('البيتزا', 'پیتزا', 'Pizza'),
    tr('المشروبات والعصائر', 'خواردنەوە و شەربەت', 'Drinks & Juices'),
    tr('المقبلات', 'پیشخواردنەکان', 'Appetizers'),
    tr('الشاورما والوجبات', 'شاورما و ژەمەکان', 'Shawarma & Meals'),
  ];

  const onboardStageMap: Record<number, UnifiedSetupStage> = {
    0: 'onboard-info',
    1: 'onboard-hours',
    2: 'onboard-cats',
    3: 'onboard-items',
    4: 'onboard-ready',
  };

  // Media upload helpers for Logo & Cover
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, 'logo');
      setLogoImg(b64);
      setError('');
    } catch {
      setError(tr('تعذر قراءة صورة الشعار، يرجى تجربة صورة أخرى.', 'نەتوانرا وێنەی لۆگۆ بخوێندرێتەوە، تکایە وێنەیەکی تر تاقیبکەرەوە.', 'Unable to read logo image. Please try another photo.'));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, 'banner');
      setCoverImg(b64);
      setError('');
    } catch {
      setError(tr('تعذر قراءة صورة الغلاف، يرجى تجربة صورة أخرى.', 'نەتوانرا وێنەی بەرگ بخوێندرێتەوە، تکایە وێنەیەکی تر تاقیبکەرەوە.', 'Unable to read cover image. Please try another photo.'));
    }
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  const handleNext = async () => {
    setError('');
    const currentRest = getItem<Restaurant>(`restaurants/${restaurantId}`) || initialRest!;

    // Step 0: Project Name, Optional Phone, Type, Logo & Cover
    if (step === 0) {
      const cleanName = projectName.trim();
      if (!cleanName) {
        setError(tr('يرجى إدخال اسم المشروع للمتابعة.', 'تکایە ناوی پرۆژەکەت بنووسە بۆ بەردەوامبوون.', 'Please enter your business name to continue.'));
        return;
      }

      let cleanSub = '';
      if (resolvedPlan.perms.customSlug && customSubdomain.trim()) {
        cleanSub = sanitizeSlug(customSubdomain);
        if (cleanSub.length < 3 || isReservedSlug(cleanSub) || subdomainStatus === 'taken') {
          setError(
            subdomainStatus === 'taken'
              ? tr('هذا الرابط الفرعي محجوز لمتجر آخر، يرجى اختيار اسم مختلف.', 'ئەم ناونیشانە بۆ فرۆشگایەکی تر گیراوە، تکایە ناوێکی تر هەڵبژێرە.', 'This handle is already taken. Please choose another.')
              : tr('الدومين الفرعي غير صالح أو محجوز (استخدم 3 أحرف إنجليزية على الأقل).', 'ناونیشانەکە نادروستە یان پارێزراوە (لانیکەم ٣ پیتی ئینگلیزی بەکاربهێنە).', 'Invalid or reserved handle (use at least 3 English letters).')
          );
          return;
        }
      }

      const defaults = getDefaultBusinessMedia(projectType, 'ar');
      const otherType = projectType === 'store' ? 'restaurant' : 'store';
      const otherDefaults = getDefaultBusinessMedia(otherType, 'ar');
      const finalLogo = logoImg.trim() || defaults.logo;
      const finalCover = [coverImg.trim() || defaults.banner];
      const cleanPhone = projectPhone.trim();

      const curTagline = (currentRest.tagline || '').trim();
      const curAbout = (currentRest.aboutText || '').trim();
      const resolvedTagline =
        !curTagline || curTagline === otherDefaults.tagline ? defaults.tagline : curTagline;
      const resolvedAbout =
        !curAbout || curAbout === otherDefaults.aboutText ? defaults.aboutText : curAbout;

      setIsSavingStep(true);
      try {
        const nextRest = ensureRestaurantDefaults({
          ...currentRest,
          n: cleanName,
          ow: cleanName,
          ph: cleanPhone,
          projectType,
          logo: finalLogo,
          coverImages: finalCover,
          tagline: resolvedTagline,
          aboutText: resolvedAbout,
          ...(cleanSub
            ? { slug: cleanSub, subdomain: subdomainEnabled ? cleanSub : '' }
            : { subdomain: '' }),
        });
        putItem(`restaurants/${restaurantId}`, nextRest);
        setTagline(resolvedTagline);
        setAboutText(resolvedAbout);
        await saveOnboardProfileToServer({
          rid: restaurantId,
          n: cleanName,
          ph: cleanPhone,
          projectType,
          logo: finalLogo,
          coverImages: finalCover,
          tagline: resolvedTagline,
          aboutText: resolvedAbout,
          ...(cleanSub ? { slug: cleanSub } : {}),
        }).catch(() => {});
        onRefresh();
        setStep(1);
      } finally {
        setIsSavingStep(false);
      }
      return;
    }

    // Step 1: Working Hours
    if (step === 1) {
      const nextHours: Restaurant['h'] = {
        m: hoursMode,
        f: hoursMode === 'c' ? hoursFrom : undefined,
        t: hoursMode === 'c' ? hoursTo : undefined,
      };
      setIsSavingStep(true);
      try {
        putItem(`restaurants/${restaurantId}`, {
          ...currentRest,
          h: nextHours,
        });
        await saveOnboardProfileToServer({
          rid: restaurantId,
          h: nextHours,
        }).catch(() => {});
        void flushRemoteSync();
        setStep(2);
      } finally {
        setIsSavingStep(false);
      }
      return;
    }

    // Step 2: Categories
    if (step === 2) {
      if (allCategories.length === 0) {
        setError(tr('يرجى إضافة قسم واحد على الأقل للمتابعة.', 'تکایە لانیکەم بەشێک زیاد بکە بۆ بەردەوامبوون.', 'Please add at least one category to continue.'));
        return;
      }
      if (!itemCat && allCategories.length > 0) {
        setItemCat(allCategories[0].id);
      }
      void flushRemoteSync();
      setStep(3);
      return;
    }

    // Step 3: Items -> Finish (MUST have at least 1 category AND 1 item)
    if (step === 3) {
      if (allCategories.length === 0) {
        setError(tr('يرجى إضافة قسم واحد على الأقل أولاً.', 'سەرەتا لانیکەم بەشێک زیاد بکە.', 'Please add at least one category first.'));
        setStep(2);
        return;
      }
      if (allItems.length === 0) {
        setError(
          isStore
            ? tr('يرجى إضافة منتج واحد على الأقل للمنيو قبل المتابعة.', 'تکایە لانیکەم بەرهەمێک زیاد بکە پێش بەردەوامبوون.', 'Please add at least one product before continuing.')
            : tr('يرجى إضافة عنصر واحد على الأقل للمنيو قبل المتابعة.', 'تکایە لانیکەم خواردنێک زیاد بکە پێش بەردەوامبوون.', 'Please add at least one item before continuing.')
        );
        return;
      }

      setIsSavingStep(true);
      try {
        const finalized = ensureRestaurantDefaults({
          ...currentRest,
          done: 1,
          on: 1,
        });
        putItem(`restaurants/${restaurantId}`, finalized);
        await saveOnboardProfileToServer({
          rid: restaurantId,
          done: 1,
          on: 1,
        }).catch(() => {});
        const curSes = getSession();
        if (!curSes || !curSes.rid) {
          setSession({ email: currentRest.ow || currentRest.n || restaurantId, rid: restaurantId });
        }
        await flushRemoteSync().catch(() => false);
        onRefresh();
        setStep(4);
      } finally {
        setIsSavingStep(false);
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 5) {
      setStep(4);
    } else if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  // Category CRUD
  const handleAddCategory = (nameToAdd?: string) => {
    const n = (nameToAdd || newCatName).trim();
    if (!n) return;

    if (resolvedPlan.maxCats !== -1 && allCategories.length >= resolvedPlan.maxCats) {
      const localizedPlan = getLocalizedPlanName(resolvedPlan.plan, lang);
      setError(
        tr(
          `وصلت إلى الحد الأقصى للأقسام في ${localizedPlan} (${resolvedPlan.maxCats} أقسام).`,
          `گەیشتیتە سنووری زۆرترین بەشەکان لە ${localizedPlan} (${resolvedPlan.maxCats} بەش).`,
          `You reached the maximum category limit on ${localizedPlan} (${resolvedPlan.maxCats}).`
        )
      );
      return;
    }

    if (allCategories.some((c) => c.n.toLowerCase() === n.toLowerCase())) {
      setError(tr('هذا القسم موجود مسبقاً.', 'ئەم بەشە پێشتر هەیە.', 'This category already exists.'));
      return;
    }

    const catId = uid();
    putItem<Category>(`cats/${catId}`, {
      id: catId,
      rid: restaurantId,
      n,
      o: allCategories.length,
    });
    setNewCatName('');
    setError('');
    if (!itemCat) setItemCat(catId);
    onRefresh();
  };

  const handleSaveCategoryRename = (cat: Category) => {
    const clean = editingCatValue.trim();
    if (!clean) return;
    putItem<Category>(`cats/${cat.id}`, { ...cat, n: clean });
    setEditingCatId(null);
    setEditingCatValue('');
    onRefresh();
  };

  const handleDeleteCategory = (catId: string) => {
    const targetCat = allCategories.find((c) => c.id === catId);
    triggerAjaxConfirm(
      tr('تأكيد حذف القسم', 'دڵنیاکردنەوەی سڕینەوەی بەش', 'Confirm Category Deletion'),
      tr(
        `هل أنت متأكد من حذف القسم "${targetCat?.n || ''}" وكافة العناصر المرتبطة به؟`,
        `ئایا دڵنیایت لە سڕینەوەی بەشی "${targetCat?.n || ''}" و هەموو بەرهەمەکانی ناوی؟`,
        `Are you sure you want to delete "${targetCat?.n || ''}" and all items inside it?`
      ),
      'danger',
      tr('حذف', 'سڕینەوە', 'Delete'),
      () => {
        deleteItem(`cats/${catId}`);
        allItems.filter((it) => it.cat === catId).forEach((it) => deleteItem(`items/${it.id}`));
        if (itemCat === catId) {
          const remaining = allCategories.filter((c) => c.id !== catId);
          setItemCat(remaining[0]?.id || '');
        }
        onRefresh();
      },
      tr('تم حذف القسم', 'بەشەکە سڕایەوە', 'Category deleted')
    );
  };

  // Item CRUD
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetCat = itemCat || allCategories[0]?.id;
    if (!targetCat) {
      setError(tr('يرجى إضافة أو اختيار قسم أولاً.', 'تکایە سەرەتا بەشێک زیاد بکە یان هەڵبژێرە.', 'Please add or select a category first.'));
      return;
    }

    const trimmedName = itemName.trim();
    if (!trimmedName) {
      setError(
        isStore
          ? tr('يرجى كتابة اسم المنتج.', 'تکایە ناوی بەرهەم بنووسە.', 'Please enter the product name.')
          : tr('يرجى كتابة اسم العنصر.', 'تکایە ناوی خواردن بنووسە.', 'Please enter the item name.')
      );
      return;
    }

    const numericPrice = Number(itemPrice);
    if (itemPrice === '' || isNaN(numericPrice) || numericPrice < 0) {
      setError(tr('يرجى إدخال السعر بشكل صحيح.', 'تکایە نرخەکە بە دروستی بنووسە.', 'Please enter a valid price.'));
      return;
    }

    if (!editingItemId && resolvedPlan.maxItems !== -1 && allItems.length >= resolvedPlan.maxItems) {
      const localizedPlan = getLocalizedPlanName(resolvedPlan.plan, lang);
      setError(
        tr(
          `وصلت إلى الحد الأقصى للعناصر في ${localizedPlan} (${resolvedPlan.maxItems} عنصر).`,
          `گەیشتیتە سنووری زۆرترین بەرهەم لە ${localizedPlan} (${resolvedPlan.maxItems}).`,
          `You reached the maximum items limit on ${localizedPlan} (${resolvedPlan.maxItems}).`
        )
      );
      return;
    }

    const existingItem = editingItemId ? allItems.find((x) => x.id === editingItemId) : undefined;
    const itemId = editingItemId || uid();
    putItem<MenuItem>(`items/${itemId}`, {
      ...(existingItem || {}),
      id: itemId,
      rid: restaurantId,
      cat: targetCat,
      n: trimmedName,
      pr: numericPrice,
      d: itemDesc.trim(),
      img: itemImage.trim() || undefined,
      available: existingItem?.available ?? true,
      o: existingItem?.o ?? allItems.length,
    });

    setItemName('');
    setItemPrice('');
    setItemDesc('');
    setItemImage('');
    setEditingItemId(null);
    setSavedBanner(tr(`✓ تم حفظ "${trimmedName}"`, `✓ "${trimmedName}" پاشەکەوتکرا`, `✓ Saved "${trimmedName}"`));
    setTimeout(() => setSavedBanner(''), 2200);
    onRefresh();
  };

  const handleStartEditItem = (it: MenuItem) => {
    setEditingItemId(it.id);
    setItemCat(it.cat);
    setItemName(it.n);
    setItemPrice(it.pr);
    setItemDesc(it.d || '');
    setItemImage(it.img || '');
    setError('');
    itemFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, 'item');
      setItemImage(b64);
    } catch {
      setError(tr('تعذر قراءة الصورة، يرجى تجربة صورة أخرى.', 'نەتوانرا وێنەکە بخوێندرێتەوە، تکایە وێنەیەکی تر تاقیبکەرەوە.', 'Unable to read image. Please try another photo.'));
    }
  };

  // Save Customization (Step 5)
  const handleSaveCustomization = async (redirectTarget?: string) => {
    setIsSavingStep(true);
    setError('');
    try {
      const currentRest = getItem<Restaurant>(`restaurants/${restaurantId}`) || initialRest!;
      const defaults = getDefaultBusinessMedia(projectType, lang);
      const finalLogo = logoImg.trim() || currentRest.logo || defaults.logo;
      const finalCover = [coverImg.trim() || currentRest.coverImages?.[0] || defaults.banner];
      const nextRest = ensureRestaurantDefaults({
        ...currentRest,
        n: projectName.trim() || currentRest.n,
        ph: projectPhone.trim(),
        projectType,
        logo: finalLogo,
        coverImages: finalCover,
        tagline: tagline.trim(),
        aboutText: aboutText.trim(),
        themeMode: menuThemeMode,
        themePreset: menuThemeMode === 'dark' ? 'dark-obsidian' : 'clean-light',
        color: menuColor,
        lay: menuLayout,
        done: 1,
        on: 1,
      });
      putItem(`restaurants/${restaurantId}`, nextRest);
      await saveOnboardProfileToServer({
        rid: restaurantId,
        n: nextRest.n,
        ph: nextRest.ph,
        projectType,
        logo: finalLogo,
        coverImages: finalCover,
        tagline: tagline.trim(),
        aboutText: aboutText.trim(),
        themeMode: menuThemeMode,
        color: menuColor,
        lay: menuLayout,
        done: 1,
        on: 1,
      }).catch(() => {});
      await flushRemoteSync().catch(() => false);
      onRefresh();
      setSavedBanner(tr('✓ تم حفظ جميع التعديلات بنجاح', '✓ هەموو گۆڕانکارییەکان بە سەرکەوتوویی پاشەکەوتکران', '✓ All customizations saved'));
      setTimeout(() => setSavedBanner(''), 2500);
      if (redirectTarget) {
        onNavigate(redirectTarget);
      }
    } finally {
      setIsSavingStep(false);
    }
  };

  const latestRest = getItem<Restaurant>(`restaurants/${restaurantId}`) || initialRest;
  const previewPath = getPublicMenuUrlPath(latestRest, resolvedPlan);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        padding: '24px 16px 56px',
        maxWidth: '640px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
        <LanguageSelector currentLang={lang} onChange={setLang} compact buttonTextColor="var(--ink)" />
      </div>
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div
          onClick={() => onNavigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '8px',
          }}
          aria-label={t.appName}
        >
          <AppLogo size={42} />
        </div>
        <h1 style={{ fontSize: '21px', fontWeight: 900, margin: '0 0 4px', color: 'var(--ink)' }}>
          {projectName.trim() || tr('تجهيز مشروعك', 'ئامادەکردنی پرۆژەکەت', 'Set Up Your Business')}
        </h1>
        <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
          {tr('أكمل الخطوات السريعة لتجهيز منيوك الإلكتروني', 'هەنگاوە خێراکان تەواو بکە بۆ ئامادەکردنی مینیۆکەت', 'Complete these quick steps to launch your digital menu')}
        </p>
      </div>

      {/* Single Unified Box: Aurora Progress Bar + Active Step Content + Navigation */}
      <motion.div
        className="card mp-unified-card"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {step < 5 && (
          <UnifiedSetupProgressBar stage={onboardStageMap[step] || 'onboard-info'} integrated />
        )}

        <motion.div
          key={step}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '20px 22px 24px' }}
        >
          {error && (
            <div className="mp-inline-status is-err" role="alert" style={{ marginBottom: '14px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 0: اسم المشروع + نوع النشاط + الصور                        */}
          {/* ================================================================ */}
          {step === 0 && (
            <div>
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px', color: 'var(--ink)' }}>
              {tr('بيانات المشروع الأساسية', 'زانیارییە سەرەکییەکانی پرۆژە', 'Basic Business Details')}
            </h2>
            <p className="muted" style={{ fontSize: '13.5px', margin: 0 }}>
              {tr('أدخل اسم مشروعك واختر نوع النشاط للانطلاق', 'ناوی پرۆژەکەت بنووسە و جۆری چالاکی هەڵبژێرە', 'Enter your business name and choose your category')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. اسم المشروع */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '7px', color: 'var(--ink)' }}>
                {tr('اسم المشروع', 'ناوی پرۆژە', 'Business Name')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={tr('مثال: مطعم الباشا أو متجر النخبة', 'بۆ نموونە: چێشتخانەی شاهانە یان فرۆشگای نەورۆز', 'e.g. Royal Burger or Elite Store')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                }}
                required
                autoFocus
              />
            </div>

            {/* 2. نوع المشروع: مطعم أو كافيه / متجر أو محل */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '9px', color: 'var(--ink)' }}>
                {tr('نوع المشروع', 'جۆری پرۆژە', 'Business Type')}
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setProjectType('restaurant')}
                  style={{
                    textAlign: 'start',
                    padding: '16px',
                    borderRadius: '16px',
                    border: projectType === 'restaurant' ? '2px solid var(--brand)' : '1px solid var(--line)',
                    background: projectType === 'restaurant' ? 'var(--soft)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: projectType === 'restaurant' ? 'var(--brand)' : 'var(--bg)',
                      color: projectType === 'restaurant' ? '#ffffff' : 'var(--ink)',
                      border: '1px solid var(--line)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UtensilsCrossed size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--ink)', marginBottom: '2px' }}>
                      {tr('مطعم أو كافيه', 'چێشتخانە یان کافێ', 'Restaurant or Café')}
                    </div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {tr('للمأكولات والمشروبات والحلويات', 'بۆ خواردن و خواردنەوە و شیرینی', 'For food, drinks & desserts')}
                    </div>
                  </div>
                  {projectType === 'restaurant' && (
                    <CheckCircle2 size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setProjectType('store')}
                  style={{
                    textAlign: 'start',
                    padding: '16px',
                    borderRadius: '16px',
                    border: projectType === 'store' ? '2px solid var(--brand)' : '1px solid var(--line)',
                    background: projectType === 'store' ? 'var(--soft)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: projectType === 'store' ? 'var(--brand)' : 'var(--bg)',
                      color: projectType === 'store' ? '#ffffff' : 'var(--ink)',
                      border: '1px solid var(--line)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShoppingBag size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--ink)', marginBottom: '2px' }}>
                      {tr('متجر أو محل', 'فرۆشگا یان دووکان', 'Store or Shop')}
                    </div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {tr('للمنتجات والبضائع والتسوق', 'بۆ بەرهەم و کاڵا و بازاڕکردن', 'For retail products & shopping')}
                    </div>
                  </div>
                  {projectType === 'store' && (
                    <CheckCircle2 size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  )}
                </button>
              </div>
            </div>

            {/* 4. صورة المشروع والغلاف */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>
                  {isStore
                    ? tr('صورة المتجر والغلاف', 'وێنەی فرۆشگا و بەرگ', 'Store Logo & Cover')
                    : tr('صورة المطعم والغلاف', 'وێنەی چێشتخانە و بەرگ', 'Restaurant Logo & Cover')}{' '}
                  <span className="muted" style={{ fontWeight: 700, fontSize: '13px' }}>
                    {tr('(اختياري)', '(ئارەزوومەندانە)', '(Optional)')}
                  </span>
                </span>
                <span className="muted" style={{ fontSize: '12px', fontWeight: 600 }}>
                  {tr('يمكن تعديله لاحقاً', 'دواتر دەتوانرێت بگۆڕدرێت', 'Can be edited later')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* Logo upload */}
                <div
                  style={{
                    border: 0,
                    borderRadius: '14px',
                    padding: '14px 12px',
                    background: 'var(--panel)',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                    {logoImg ? (
                      <img
                        src={logoImg}
                        alt={t.uploadLogoLabel}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          margin: '0 auto 8px',
                          border: '1px solid var(--line)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'var(--soft)',
                          color: 'var(--brand)',
                          display: 'grid',
                          placeItems: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        <ImageIcon size={22} />
                      </div>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                      {logoImg
                        ? tr('تغيير صورة الشعار', 'گۆڕینی وێنەی لۆگۆ', 'Change Logo Image')
                        : isStore
                        ? tr('إضافة صورة المتجر', 'زیادکردنی وێنەی فرۆشگا', 'Add Store Logo')
                        : tr('إضافة صورة المطعم', 'زیادکردنی وێنەی چێشتخانە', 'Add Restaurant Logo')}
                    </div>
                  </label>
                  {logoImg && (
                    <button
                      type="button"
                      onClick={() => setLogoImg('')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        insetInlineEnd: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--muted)',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                      title={tr('إزالة الصورة', 'سڕینەوەی وێنە', 'Remove image')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Cover upload */}
                <div
                  style={{
                    border: 0,
                    borderRadius: '14px',
                    padding: '14px 12px',
                    background: 'var(--panel)',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" accept="image/*" hidden onChange={handleCoverUpload} />
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={t.uploadBannerLabel}
                        style={{
                          width: '100%',
                          maxWidth: '140px',
                          height: '64px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          margin: '0 auto 8px',
                          border: '1px solid var(--line)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'var(--soft)',
                          color: 'var(--brand)',
                          display: 'grid',
                          placeItems: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        <ImageIcon size={22} />
                      </div>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                      {coverImg ? tr('تغيير صورة الغلاف', 'گۆڕینی وێنەی بەرگ', 'Change Cover Banner') : tr('إضافة صورة الغلاف', 'زیادکردنی وێنەی بەرگ', 'Add Cover Banner')}
                    </div>
                  </label>
                  {coverImg && (
                    <button
                      type="button"
                      onClick={() => setCoverImg('')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        insetInlineEnd: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--muted)',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                      title={tr('إزالة الصورة', 'سڕینەوەی وێنە', 'Remove image')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Handle / Subdomain only if unlocked on plan */}
            {resolvedPlan.perms.customSlug && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Globe size={17} style={{ color: 'var(--brand)' }} />
                  <b style={{ fontSize: '13.5px' }}>
                    {subdomainEnabled
                      ? tr('الرابط الفرعي المخصص (اختياري)', 'لینکی تایبەت (ئارەزوومەندانە)', 'Custom Subdomain (Optional)')
                      : tr('رابط المنيو باسم حسابك (اختياري)', 'لینکی مینیۆ بە ناوی هەژمارەکەت (ئارەزوومەندانە)', 'Custom Menu Handle (Optional)')}
                  </b>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} dir="ltr">
                  {!subdomainEnabled && (
                    <span className="muted" style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {baseDomain}/
                    </span>
                  )}
                  <input
                    type="text"
                    value={customSubdomain}
                    onChange={(e) => setCustomSubdomain(sanitizeSlug(e.target.value))}
                    placeholder="mystore"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                    }}
                  />
                  {subdomainEnabled && (
                    <span className="muted" style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                      .{baseDomain}
                    </span>
                  )}
                </div>
                {subdomainStatus !== 'idle' && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color:
                        subdomainStatus === 'available'
                          ? 'var(--brand)'
                          : subdomainStatus === 'checking'
                          ? 'var(--muted)'
                          : '#ef4444',
                    }}
                  >
                    {subdomainStatus === 'checking' && tr('جاري فحص توفر الرابط...', 'پشکنینی بەردەستبوونی لینک...', 'Checking availability...')}
                    {subdomainStatus === 'available' && tr('✓ هذا الرابط متاح', '✓ ئەم لینکە بەردەستە', '✓ This handle is available')}
                    {subdomainStatus === 'taken' && tr('✕ هذا الرابط محجوز مسبقاً', '✕ ئەم لینکە پێشتر گیراوە', '✕ This handle is already taken')}
                    {subdomainStatus === 'invalid' && tr('✕ يجب أن يتكون من 3 أحرف إنجليزية على الأقل', '✕ دەبێت لانیکەم ٣ پیتی ئینگلیزی بێت', '✕ Must be at least 3 English characters')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 1: ساعات التواجد                                              */}
      {/* ================================================================ */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Clock size={22} style={{ color: 'var(--brand)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
              {tr('ساعات التواجد والعمل', 'کاتژمێرەکانی کارکردن', 'Working Hours')}
            </h2>
          </div>
          <p className="muted" style={{ fontSize: '13.5px', marginBottom: '20px' }}>
            {tr('حدد أوقات العمل ليظهر للزبون حالة مشروعك (مفتوح / مغلق):', 'کاتی کارکردن دیاری بکە بۆ ئەوەی دۆخی پرۆژەکەت (کراوە / داخراو) بۆ کڕیار دەربکەوێت:', 'Set your opening hours so customers know when you are Open or Closed:')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '14px',
                border: hoursMode === '24' ? '2px solid var(--brand)' : '1px solid var(--line)',
                background: hoursMode === '24' ? 'var(--soft)' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="hoursMode"
                checked={hoursMode === '24'}
                onChange={() => setHoursMode('24')}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <b style={{ fontSize: '15px', display: 'block' }}>{tr('مفتوح على مدار 24 ساعة', 'کراوەیە ٢٤ کاتژمێر', 'Open 24 Hours')}</b>
                <span className="muted" style={{ fontSize: '12.5px' }}>
                  {tr('يستقبل الطلبات طوال اليوم دون توقف', 'بەدرێژایی ڕۆژ داواکاری وەردەگرێت', 'Accepting orders around the clock')}
                </span>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '14px',
                border: hoursMode === 'c' ? '2px solid var(--brand)' : '1px solid var(--line)',
                background: hoursMode === 'c' ? 'var(--soft)' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="hoursMode"
                checked={hoursMode === 'c'}
                onChange={() => setHoursMode('c')}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <b style={{ fontSize: '15px', display: 'block' }}>{tr('ساعات عمل محددة يومياً', 'کاتژمێری کارکردنی دیاریکراو', 'Custom Daily Hours')}</b>
                <span className="muted" style={{ fontSize: '12.5px' }}>
                  {tr('يفتح ويغلق في أوقات محددة كل يوم', 'هەموو ڕۆژێک لە کاتێکی دیاریکراو دەکرێتەوە و دادەخرێت', 'Opens and closes at specific times daily')}
                </span>
              </div>
            </label>
          </div>

          {hoursMode === '24' && (
            <div role="alert" className="mp-warn-note">
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b className="mp-warn-note-title">
                  {tr('تنبيه مهم بخصوص أوقات العمل (24 ساعة):', 'ئاگاداری گرنگ دەربارەی کاتەکانی کارکردن (٢٤ کاتژمێر):', 'Important Note on 24/7 Hours:')}
                </b>
                <span>
                  {tr(
                    'عند اختيار «مفتوح على مدار 24 ساعة»، سيظهر مشروعك مفتوحاً للزبائن وستستقبل الطلبات على مدار الوقت طوال اليوم دون توقف.',
                    'کاتێک «کراوەیە ٢٤ کاتژمێر» هەڵدەبژێریت، پرۆژەکەت بەردەوام بە کراوەیی دەردەکەوێت و داواکاری بە درێژایی ڕۆژ وەردەگرێت.',
                    'When choosing "Open 24 Hours", your storefront stays open continuously and accepts orders anytime.'
                  )}
                </span>
              </div>
            </div>
          )}

          {hoursMode === 'c' && (
            <div
              style={{
                paddingTop: '14px',
                borderTop: '1px solid var(--line)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  {tr('يفتح من الساعة:', 'دەکرێتەوە لە کاتژمێر:', 'Opens at:')}
                </label>
                <input
                  type="time"
                  value={hoursFrom}
                  onChange={(e) => setHoursFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  {tr('يغلق في الساعة:', 'دادەخرێت لە کاتژمێر:', 'Closes at:')}
                </label>
                <input
                  type="time"
                  value={hoursTo}
                  onChange={(e) => setHoursTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 2: تحديد الأقسام (بسيط ومرتب)                                */}
      {/* ================================================================ */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={21} style={{ color: 'var(--brand)' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                {tr('تحديد الأقسام', 'دیاریکردنی بەشەکان', 'Set Up Categories')}
              </h2>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'var(--soft)',
                color: 'var(--brand-ink, var(--brand))',
                border: '1px solid var(--line)',
              }}
            >
              {allCategories.length} {resolvedPlan.maxCats !== -1 ? `/ ${resolvedPlan.maxCats}` : tr('قسم', 'بەش', 'cats')}
            </span>
          </div>
          <p className="muted" style={{ fontSize: '13.5px', marginBottom: '18px' }}>
            {isStore
              ? tr('أضف أقسام منتجاتك بكتابة الاسم أو اختيار قسم جاهز:', 'بەشەکانی بەرهەمەکانت زیاد بکە بە نووسینی ناو یان هەڵبژاردنی بەشێکی ئامادە:', 'Add your store collections by typing a name or picking a quick suggestion:')
              : tr('أضف أقسام قائمة طعامك بكتابة الاسم أو اختيار قسم جاهز:', 'بەشەکانی مینیۆکەت زیاد بکە بە نووسینی ناو یان هەڵبژاردنی بەشێکی ئامادە:', 'Add your menu categories by typing a name or picking a quick suggestion:')}
          </p>

          {/* Add Input */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              placeholder={
                isStore
                  ? tr('اكتب اسم القسم (مثال: عطور)', 'ناوی بەش بنووسە (بۆ نموونە: بۆن)', 'Category name (e.g., Perfumes)')
                  : tr('اكتب اسم القسم (مثال: البرجر)', 'ناوی بەش بنووسە (بۆ نموونە: بەرگەر)', 'Category name (e.g., Burgers)')
              }
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                fontSize: '14px',
              }}
            />
            <button
              type="button"
              className="btn p"
              onClick={() => handleAddCategory()}
              style={{ padding: '12px 18px', fontWeight: 800, borderRadius: '12px', whiteSpace: 'nowrap' }}
            >
              <Plus size={16} />
              <span>{tr('إضافة', 'زیادکردن', 'Add')}</span>
            </button>
          </div>

          {/* Quick Suggestions */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
              {tr('اقتراحات سريعة:', 'پێشنیاری خێرا:', 'Quick Suggestions:')}
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(isStore ? storeCatSuggestions : restCatSuggestions).map((sug) => {
                const alreadyAdded = allCategories.some((c) => c.n.toLowerCase() === sug.toLowerCase());
                return (
                  <button
                    key={sug}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleAddCategory(sug)}
                    style={{
                      background: alreadyAdded ? 'var(--soft)' : 'var(--bg)',
                      border: alreadyAdded ? '1px solid var(--brand)' : '1px solid var(--line)',
                      color: alreadyAdded ? 'var(--brand-ink, var(--brand))' : 'var(--ink)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: alreadyAdded ? 'default' : 'pointer',
                      opacity: alreadyAdded ? 0.8 : 1,
                    }}
                  >
                    {alreadyAdded ? `✓ ${sug}` : `+ ${sug}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories List */}
          {allCategories.length === 0 ? (
            <div
              style={{
                borderRadius: '12px',
                padding: '20px',
                background: 'var(--panel)',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '13.5px',
              }}
            >
              {tr('لم تضف أي قسم بعد. اكتب اسم القسم أو اختر من الاقتراحات أعلاه.', 'هێشتا هیچ بەشێکت زیاد نەکردووە. ناوێک بنووسە یان لە پێشنیارەکان هەڵبژێرە.', 'No categories added yet. Type a name or pick from suggestions above.')}
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {allCategories.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 4px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  {editingCatId === c.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        value={editingCatValue}
                        onChange={(e) => setEditingCatValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCategoryRename(c);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--brand)',
                          background: 'var(--surface)',
                          fontSize: '14px',
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn p s"
                        onClick={() => handleSaveCategoryRename(c)}
                      >
                        {tr('حفظ', 'پاشەکەوت', 'Save')}
                      </button>
                      <button
                        type="button"
                        className="btn s"
                        onClick={() => setEditingCatId(null)}
                      >
                        {tr('إلغاء', 'پاشگەزبوونەوە', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '8px',
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                            color: 'var(--brand)',
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <b style={{ fontSize: '14.5px', color: 'var(--ink)' }}>{c.n}</b>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(c.id);
                            setEditingCatValue(c.n);
                          }}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Pencil size={12} />
                          <span>{tr('تعديل', 'دەستکاری', 'Edit')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#dc2626',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={12} />
                          <span>{tr('حذف', 'سڕینەوە', 'Delete')}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: تحديد العناصر (بسيط ومرتب)                                */}
      {/* ================================================================ */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
              {isStore ? tr('تحديد المنتجات', 'دیاریکردنی بەرهەمەکان', 'Add Products') : tr('تحديد العناصر والأصناف', 'دیاریکردنی خواردنەکان', 'Add Menu Items')}
            </h2>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'var(--soft)',
                color: 'var(--brand-ink, var(--brand))',
                border: '1px solid var(--line)',
              }}
            >
              {allItems.length} {resolvedPlan.maxItems !== -1 ? `/ ${resolvedPlan.maxItems}` : tr('عنصر', 'بەرهەم', 'items')}
            </span>
          </div>
          <p className="muted" style={{ fontSize: '13.5px', marginBottom: '16px' }}>
            {tr('اختر القسم ثم أضف الاسم والسعر، ويمكنك تعديل أي عنصر في أي وقت:', 'بەش هەڵبژێرە پاشان ناو و نرخ بنووسە، دەتوانیت هەر کاتێک بتەوێت دەستکاری بکەیت:', 'Select a category, enter the name and price — you can edit anytime:')}
          </p>

          {/* Quick Category Pills */}
          {allCategories.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {allCategories.map((c) => {
                const active = (itemCat || allCategories[0]?.id) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setItemCat(c.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: active ? '1px solid var(--brand)' : '1px solid var(--line)',
                      background: active ? 'var(--brand)' : 'var(--bg)',
                      color: active ? '#ffffff' : 'var(--ink)',
                    }}
                  >
                    {c.n}
                  </button>
                );
              })}
            </div>
          )}

          <form ref={itemFormRef} onSubmit={handleSaveItem} style={{ marginBottom: '20px' }}>
            {savedBanner && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'var(--soft)',
                  border: '1px solid var(--line)',
                  color: 'var(--brand-ink, var(--brand))',
                  fontSize: '13px',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                {savedBanner}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, display: 'block', marginBottom: '5px' }}>
                    {isStore ? tr('اسم المنتج', 'ناوی بەرهەم', 'Product Name') : tr('اسم العنصر', 'ناوی خواردن', 'Item Name')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder={
                      isStore
                        ? tr('مثال: عطر عود', 'بۆ نموونە: بۆنی عوود', 'e.g. Oud Perfume')
                        : tr('مثال: برجر كلاسيك', 'بۆ نموونە: کلاسیک بەرگەر', 'e.g. Classic Burger')
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      fontSize: '13.5px',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, display: 'block', marginBottom: '5px' }}>
                    {tr('السعر', 'نرخ', 'Price')} ({getLocalizedCurrencyUnit(latestRest.currency || 'د.ع', lang)}) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="250"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="7000"
                    dir="ltr"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      fontSize: '13.5px',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                    {tr('وصف مختصر', 'وەسفی کورت', 'Short Description')}
                  </label>
                  <input
                    type="text"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder={
                      isStore
                        ? tr('مواصفات المنتج...', 'تایبەتمەندییەکانی بەرهەم...', 'Product specs...')
                        : tr('مكونات الوجبة أو الإضافات...', 'پێکهاتەکانی ژەم...', 'Ingredients or details...')
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={tr('معاينة', 'پێشبینین', 'Preview')}
                      style={{ width: '22px', height: '22px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  ) : (
                    <ImageIcon size={16} />
                  )}
                  <span>{itemImage ? tr('تغيير الصورة', 'گۆڕینی وێنە', 'Change Photo') : tr('صورة', 'وێنە', 'Photo')}</span>
                </label>
              </div>

              {itemName.trim() && (
                <div>
                  <ImageSuggestionPicker
                    productName={itemName}
                    categoryName={allCategories.find((c) => c.id === (itemCat || allCategories[0]?.id))?.n}
                    currentImage={itemImage}
                    onSelect={(imgUrl) => setItemImage(imgUrl)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn p b"
                  style={{ flex: 1, padding: '11px', fontSize: '14px', fontWeight: 800 }}
                >
                  {editingItemId
                    ? tr('✓ حفظ تعديلات العنصر', '✓ پاشەکەوتکردنی گۆڕانکارییەکان', '✓ Save Item Changes')
                    : isStore
                    ? tr('+ إضافة المنتج', '+ زیادکردنی بەرهەم', '+ Add Product')
                    : tr('+ إضافة العنصر', '+ زیادکردنی خواردن', '+ Add Item')}
                </button>
                {editingItemId && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setEditingItemId(null);
                      setItemName('');
                      setItemPrice('');
                      setItemDesc('');
                      setItemImage('');
                    }}
                  >
                    {tr('إلغاء', 'پاشگەزبوونەوە', 'Cancel')}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Added Items List */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>
              {tr('العناصر المضافة', 'بەرهەمە زیادکراوەکان', 'Added Items')} ({allItems.length}):
            </h4>
            {allItems.length === 0 ? (
              <div
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'var(--panel)',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '13.5px',
                }}
              >
                {isStore
                  ? tr('لم تضف منتجات بعد. يرجى إضافة منتج واحد على الأقل أعلاه للمتابعة.', 'هێشتا هیچ بەرهەمێک زیاد نەکراوە. تکایە لانیکەم بەرهەمێک زیاد بکە.', 'No products added yet. Please add at least one product above.')
                  : tr('لم تضف عناصر بعد. يرجى إضافة عنصر واحد على الأقل أعلاه للمتابعة.', 'هێشتا هیچ خواردنێک زیاد نەکراوە. تکایە لانیکەم خواردنێک زیاد بکە.', 'No items added yet. Please add at least one item above.')}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {allItems.map((it) => {
                  const catName = allCategories.find((c) => c.id === it.cat)?.n || '';
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 4px',
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        {it.img ? (
                          <img
                            src={it.img}
                            alt={it.n}
                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              background: 'var(--surface)',
                              border: '1px solid var(--line)',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '18px',
                              flexShrink: 0,
                            }}
                          >
                            {isStore ? '🛍️' : '🍽️'}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <b style={{ fontSize: '14.5px', display: 'block', color: 'var(--ink)' }}>{it.n}</b>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand)' }}>
                              {formatNumber(it.pr)} {getLocalizedCurrencyUnit(latestRest.currency || 'د.ع', lang)}
                            </span>
                            {catName && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: 'var(--surface)',
                                  border: '1px solid var(--line)',
                                  color: 'var(--muted)',
                                }}
                              >
                                {catName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleStartEditItem(it)}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tr('تعديل', 'دەستکاری', 'Edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerAjaxConfirm(
                              tr('تأكيد حذف العنصر', 'دڵنیاکردنەوەی سڕینەوەی بەرهەم', 'Confirm Item Deletion'),
                              tr(`هل أنت متأكد من حذف "${it.n}"؟`, `ئایا دڵنیایت لە سڕینەوەی "${it.n}"؟`, `Are you sure you want to delete "${it.n}"?`),
                              'danger',
                              tr('حذف', 'سڕینەوە', 'Delete'),
                              () => {
                                deleteItem(`items/${it.id}`);
                                onRefresh();
                              },
                              tr('تم الحذف بنجاح', 'بە سەرکەوتوویی سڕایەوە', 'Deleted successfully')
                            );
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#dc2626',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tr('حذف', 'سڕینەوە', 'Delete')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 4: مبروك! المنيو جاهز مع 3 أزرار رئيسية                      */}
      {/* ================================================================ */}
      {step === 4 && (
        <div style={{ padding: '12px 4px', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--soft)',
              color: 'var(--brand)',
              border: '1px solid var(--line)',
              margin: '0 auto 16px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '34px',
            }}
          >
            🎉
          </div>

          <h2 style={{ fontSize: '23px', fontWeight: 900, marginBottom: '10px', color: 'var(--ink)' }}>
            {tr('مبروك! المنيو الخاص بمشروعك جاهز الآن', 'پیرۆزە! مینیۆی پرۆژەکەت ئێستا ئامادەیە', 'Congrats! Your Digital Menu Is Ready')}
          </h2>

          <p
            style={{
              fontSize: '14.5px',
              color: 'var(--muted)',
              lineHeight: 1.75,
              maxWidth: '520px',
              margin: '0 auto 24px',
            }}
          >
            {tr(
              `تم تجهيز منيو ${projectName.trim() || latestRest.n} (${allCategories.length} أقسام • ${allItems.length} عناصر). يمكنك الآن إكمال التعديلات وإضافة المزيد أو معاينة المنيو مباشرة.`,
              `مینیۆی ${projectName.trim() || latestRest.n} ئامادەکرا (${allCategories.length} بەش • ${allItems.length} بەرهەم). دەتوانیت ئێستا گۆڕانکاری زیاتر بکەیت یان ڕاستەوخۆ مینیۆ ببینیت.`,
              `Your menu for ${projectName.trim() || latestRest.n} is set up (${allCategories.length} categories • ${allItems.length} items). You can customize further, preview live, or open your dashboard.`
            )}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '420px',
              margin: '0 auto',
            }}
          >
            {/* زر 1: أكمل التعديل على المنيو */}
            <button
              type="button"
              onClick={() => {
                setError('');
                setCustomizeTab('style');
                setStep(5);
              }}
              className="btn p b"
              style={{
                padding: '14px 18px',
                fontSize: '15.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <SlidersHorizontal size={18} />
              <span>{tr('أكمل التعديل على المنيو', 'تەواوکردنی دەستکاری مینیۆ', 'Customize Your Menu')}</span>
            </button>

            {/* زر 2: معاينة شكل المنيو */}
            <a
              href={previewPath}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(previewPath);
              }}
              className="btn b"
              style={{
                padding: '14px 18px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <Eye size={18} />
              <span>{tr('معاينة شكل المنيو', 'پێشبینینی شێوەی مینیۆ', 'Preview Live Menu')}</span>
            </a>

            {/* زر 3: لوحة التحكم */}
            <button
              type="button"
              onClick={() => {
                const currentRest = getItem<Restaurant>(`restaurants/${restaurantId}`) || initialRest!;
                putItem(`restaurants/${restaurantId}`, {
                  ...currentRest,
                  done: 1,
                  on: 1,
                });
                const curSes = getSession();
                if (!curSes || !curSes.rid) {
                  setSession({ email: currentRest.ow || currentRest.n || restaurantId, rid: restaurantId });
                }
                void flushRemoteSync();
                onNavigate('/dashboard/home');
              }}
              className="btn b"
              style={{
                padding: '14px 18px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <LayoutDashboard size={18} />
              <span>{t.dashboard}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 5: أكمل التعديل على المنيو (وصف، فاتح/غامق، ألوان، أقسام، عناصر) */}
      {/* ================================================================ */}
      {step === 5 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px' }}>
                {tr('إكمال التعديل على المنيو', 'تەواوکردنی دەستکاری مینیۆ', 'Customize Your Menu')}
              </h2>
              <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                {tr('أضف وصف المشروع، اختر المظهر الفاتح أو الغامق، أو أضف أقساماً وعناصر جديدة', 'وەسفی پرۆژە زیاد بکە، ڕووکاری ڕووناک یان تاریک هەڵبژێرە، یان بەش و بەرهەمی نوێ زیاد بکە', 'Add your bio, pick Light or Dark appearance, or add more categories and items')}
              </p>
            </div>
            <button
              type="button"
              className="btn s"
              onClick={() => setStep(4)}
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{t.backBtn}</span>
              <ArrowRight size={15} style={{ transform: isRtl ? undefined : 'rotate(180deg)' }} />
            </button>
          </div>

          {savedBanner && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--soft)',
                border: '1px solid var(--line)',
                color: 'var(--brand-ink, var(--brand))',
                fontSize: '13px',
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              {savedBanner}
            </div>
          )}

          {/* Sub-tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn s${customizeTab === 'style' ? ' p' : ''}`}
              onClick={() => setCustomizeTab('style')}
              style={{ justifyContent: 'center', fontWeight: 800 }}
            >
              {tr('الوصف والمظهر', 'وەسف و شێواز', 'Bio & Style')}
            </button>
            <button
              type="button"
              className={`btn s${customizeTab === 'cats' ? ' p' : ''}`}
              onClick={() => setCustomizeTab('cats')}
              style={{ justifyContent: 'center', fontWeight: 800 }}
            >
              {tr('الأقسام', 'بەشەکان', 'Categories')} ({allCategories.length})
            </button>
            <button
              type="button"
              className={`btn s${customizeTab === 'items' ? ' p' : ''}`}
              onClick={() => setCustomizeTab('items')}
              style={{ justifyContent: 'center', fontWeight: 800 }}
            >
              {tr('العناصر', 'بەرهەمەکان', 'Items')} ({allItems.length})
            </button>
          </div>

          {customizeTab === 'style' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* نبذة سريعة + وصف المشروع */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, marginBottom: '6px' }}>
                  {tr('عنوان مختصر أسفل الاسم (نبذة سريعة)', 'ناونیشانی کورت لە ژێر ناو (پێناسە)', 'Short Tagline Under Name')}
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={
                    isStore
                      ? tr('مثال: أحدث المنتجات والعروض المختارة بجودة عالية', 'بۆ نموونە: نوێترین بەرهەم و ئۆفەرەکان بە کوالێتی بەرز', 'e.g. Curated products & daily deals')
                      : tr('مثال: أشهى الأطباق الطازجة يومياً', 'بۆ نموونە: بەتامترین خواردنە تازەکان ڕۆژانە', 'e.g. Freshly prepared dishes every day')
                  }
                  style={{
                    width: '100%',
                    padding: '11px 13px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, marginBottom: '6px' }}>
                  {tr('وصف المشروع الكامل', 'وەسفی تەواوی پرۆژە', 'Full Business Description')}
                </label>
                <textarea
                  rows={3}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder={
                    isStore
                      ? tr('اكتب وصفاً موجزاً عن متجرك وأبرز المنتجات والخدمات والعنوان...', 'وەسفێکی کورت بنووسە دەربارەی فرۆشگاکەت و ناونیشان...', 'Write a brief description of your store, highlights, and location...')
                      : tr('اكتب وصفاً موجزاً عن مطعمك ومشروعك وأطباقك والخدمات...', 'وەسفێکی کورت بنووسە دەربارەی چێشتخانەکەت و خواردنەکان...', 'Write a brief description of your restaurant, dishes, and service...')
                  }
                  style={{
                    width: '100%',
                    padding: '11px 13px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* فاتح أو غامق */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, marginBottom: '8px' }}>
                  {tr('مظهر المنيو للزبائن (فاتح أو غامق)', 'شێوازی مینیۆ بۆ کڕیاران (ڕووناک یان تاریک)', 'Customer Menu Theme (Light or Dark)')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMenuThemeMode('light')}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: menuThemeMode === 'light' ? '2px solid var(--brand)' : '1px solid var(--line)',
                      background: menuThemeMode === 'light' ? 'var(--soft)' : 'var(--bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: 'var(--ink)',
                    }}
                  >
                    <Sun size={18} />
                    <span>{tr('مظهر فاتح (Light)', 'ڕووکاری ڕووناک (Light)', 'Light Mode')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuThemeMode('dark')}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: menuThemeMode === 'dark' ? '2px solid var(--brand)' : '1px solid var(--line)',
                      background: menuThemeMode === 'dark' ? 'var(--soft)' : 'var(--bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: 'var(--ink)',
                    }}
                  >
                    <Moon size={18} />
                    <span>{tr('مظهر غامق (Dark)', 'ڕووکاری تاریک (Dark)', 'Dark Mode')}</span>
                  </button>
                </div>
              </div>

              {/* طريقة عرض العناصر */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 800, marginBottom: '8px' }}>
                  {tr('شكل عرض العناصر', 'شێوازی پیشاندانی بەرهەمەکان', 'Item Display Layout')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'list' as const, label: tr('قائمة مرتبة', 'لیستی ڕێکخراو', 'Clean List') },
                    { id: 'grid' as const, label: tr('شبكة مزدوجة', 'تۆڕی دووانە', '2-Col Grid') },
                    { id: 'cards' as const, label: tr('بطاقات كبيرة', 'کارتی گەورە', 'Large Cards') },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`btn s${menuLayout === opt.id ? ' p' : ''}`}
                      onClick={() => setMenuLayout(opt.id)}
                      style={{ justifyContent: 'center', fontWeight: 700 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isSavingStep}
                className="btn p b"
                onClick={() => void handleSaveCustomization()}
                style={{ padding: '12px', fontWeight: 800, fontSize: '14.5px' }}
              >
                {isSavingStep ? tr('جاري الحفظ...', 'پاشەکەوت دەکرێت...', 'Saving...') : tr('حفظ إعدادات المظهر والوصف', 'پاشەکەوتکردنی شێواز و وەسف', 'Save Appearance & Bio')}
              </button>
            </div>
          )}

          {customizeTab === 'cats' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder={tr('أضف قسماً جديداً...', 'بەشێکی نوێ زیاد بکە...', 'Add a new category...')}
                  style={{
                    flex: 1,
                    padding: '11px 13px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  className="btn p"
                  onClick={() => handleAddCategory()}
                  style={{ fontWeight: 800, borderRadius: '12px' }}
                >
                  {tr('+ إضافة', '+ زیادکردن', '+ Add')}
                </button>
              </div>
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {allCategories.map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 4px',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <b style={{ fontSize: '14px' }}>{idx + 1}. {c.n}</b>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#dc2626',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {tr('حذف', 'سڕینەوە', 'Delete')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customizeTab === 'items' && (
            <div>
              <form onSubmit={handleSaveItem} style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <select
                      value={itemCat || allCategories[0]?.id || ''}
                      onChange={(e) => setItemCat(e.target.value)}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        fontSize: '13.5px',
                      }}
                    >
                      {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.n}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder={tr('اسم العنصر...', 'ناوی خواردن یان بەرهەم...', 'Item name...')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        fontSize: '13.5px',
                      }}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="250"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder={tr('السعر...', 'نرخ...', 'Price...')}
                      dir="ltr"
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        fontSize: '13.5px',
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      placeholder={tr('وصف مختصر...', 'وەسفی کورت...', 'Short description...')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        fontSize: '13px',
                      }}
                    />
                    <label
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        fontWeight: 700,
                      }}
                    >
                      <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                      {itemImage ? tr('✓ صورة', '✓ وێنە', '✓ Photo') : tr('صورة', 'وێنە', 'Photo')}
                    </label>
                    <button type="submit" className="btn p" style={{ fontWeight: 800 }}>
                      {editingItemId ? tr('حفظ', 'پاشەکەوت', 'Save') : tr('+ إضافة', '+ زیادکردن', '+ Add')}
                    </button>
                  </div>
                </div>
              </form>

              <div style={{ borderTop: '1px solid var(--line)' }}>
                {allItems.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 4px',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <b style={{ fontSize: '14px', display: 'block' }}>{it.n}</b>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand)' }}>
                        {formatNumber(it.pr)} {getLocalizedCurrencyUnit(latestRest.currency || 'د.ع', lang)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEditItem(it)}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {tr('تعديل', 'دەستکاری', 'Edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteItem(`items/${it.id}`);
                          onRefresh();
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#dc2626',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {tr('حذف', 'سڕینەوە', 'Delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              disabled={isSavingStep}
              className="btn p"
              onClick={() => void handleSaveCustomization(previewPath)}
              style={{ justifyContent: 'center', fontWeight: 800, padding: '12px' }}
            >
              <Eye size={17} />
              <span>{tr('حفظ ومعاينة شكل المنيو', 'پاشەکەوتکردن و پێشبینینی مینیۆ', 'Save & Preview Menu')}</span>
            </button>
            <button
              type="button"
              disabled={isSavingStep}
              className="btn"
              onClick={() => void handleSaveCustomization('/dashboard/home')}
              style={{ justifyContent: 'center', fontWeight: 800, padding: '12px' }}
            >
              <LayoutDashboard size={17} />
              <span>{t.dashboard}</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons (السابق والتالي) inside the unified card for steps 0 to 3 */}
      {step < 4 && (
        <div
          style={{
            display: 'flex',
            justifyContent: step > 0 ? 'space-between' : 'flex-end',
            gap: '10px',
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
          }}
        >
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn"
              style={{
                padding: '11px 20px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
              }}
            >
              <span>{t.backBtn}</span>
              <ArrowRight size={16} style={{ transform: isRtl ? undefined : 'rotate(180deg)' }} />
            </button>
          )}

          <button
            type="button"
            disabled={isSavingStep}
            onClick={() => void handleNext()}
            className="btn p"
            style={{
              padding: '11px 26px',
              fontSize: '14.5px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
            }}
          >
            <span>
              {isSavingStep
                ? tr('جاري الحفظ...', 'پاشەکەوت دەکرێت...', 'Saving...')
                : step === 3
                ? tr('إنهاء وتجهيز المنيو', 'تەواوکردن و ئامادەکردنی مینیۆ', 'Finish & Launch Menu')
                : t.nextBtn}
            </span>
            {!isSavingStep && <ArrowLeft size={16} style={{ transform: isRtl ? undefined : 'rotate(180deg)' }} />}
          </button>
        </div>
      )}
        </motion.div>
      </motion.div>

      <AjaxConfirmModal
        dialog={ajaxDialog}
        onClose={() => setAjaxDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
