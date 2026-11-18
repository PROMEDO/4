/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SupportedLanguage } from '../types';

export function isStoreProject(projectType?: string): boolean {
  const clean = String(projectType || '').toLowerCase().trim();
  return clean === 'store' || clean === 'market' || clean === 'shop' || clean === 'boutique';
}

export interface BusinessTerms {
  isStore: boolean;
  entity: string;
  entityDef: string;
  menuTitle: string;
  menuDef: string;
  catalogLinkLabel: string;
  itemSingular: string;
  itemsPlural: string;
  itemDef: string;
  addItemLabel: string;
  categorySingular: string;
  categoriesPlural: string;
  emptyItemsMsg: string;
  preparationLabel: string;
  dineInOrBranchNote: string;
  pickupLabel: string;
  tableOptionLabel: string;
  closedOrderNote: string;
  projectTypeLabel: string;
}

export function getBusinessTerms(
  projectType?: string,
  lang: SupportedLanguage = 'ar'
): BusinessTerms {
  const isStore = isStoreProject(projectType);

  if (lang === 'en') {
    return isStore
      ? {
          isStore: true,
          entity: 'Store',
          entityDef: 'The Store',
          menuTitle: 'Store Catalog',
          menuDef: 'The Catalog',
          catalogLinkLabel: 'Store Catalog Link',
          itemSingular: 'Product',
          itemsPlural: 'Products',
          itemDef: 'The Product',
          addItemLabel: 'Add New Product',
          categorySingular: 'Collection',
          categoriesPlural: 'Collections',
          emptyItemsMsg: 'No products added in this collection yet.',
          preparationLabel: 'Packing Time',
          dineInOrBranchNote: 'Order at Showroom / Branch',
          pickupLabel: 'Pickup from Store',
          tableOptionLabel: 'In-Store Order',
          closedOrderNote: 'Pre-orders are open and will be prepared as soon as the store opens.',
          projectTypeLabel: 'Online Store / Retail',
        }
      : {
          isStore: false,
          entity: 'Restaurant',
          entityDef: 'The Restaurant',
          menuTitle: 'Digital Menu',
          menuDef: 'The Menu',
          catalogLinkLabel: 'Digital Menu Link',
          itemSingular: 'Dish',
          itemsPlural: 'Dishes & Items',
          itemDef: 'The Dish',
          addItemLabel: 'Add New Dish',
          categorySingular: 'Category',
          categoriesPlural: 'Categories',
          emptyItemsMsg: 'No dishes added in this category yet.',
          preparationLabel: 'Prep Time',
          dineInOrBranchNote: 'Order at Table (Dine-in)',
          pickupLabel: 'Pickup from Branch',
          tableOptionLabel: 'Dine-in / Table',
          closedOrderNote: 'Pre-orders are open and will be prepared as soon as the restaurant opens.',
          projectTypeLabel: 'Restaurant / Café',
        };
  }

  if (lang === 'ku') {
    return isStore
      ? {
          isStore: true,
          entity: 'فرۆشگا',
          entityDef: 'فرۆشگاکە',
          menuTitle: 'کەتەلۆگی فرۆشگا',
          menuDef: 'کەتەلۆگ',
          catalogLinkLabel: 'لینکی کەتەلۆگی فرۆشگا',
          itemSingular: 'بەرهەم',
          itemsPlural: 'بەرهەمەکان',
          itemDef: 'بەرهەمەکە',
          addItemLabel: 'زیادکردنی بەرهەمی نوێ',
          categorySingular: 'بەش',
          categoriesPlural: 'بەشەکان',
          emptyItemsMsg: 'هیچ بەرهەمێک لەم بەشەدا نییە.',
          preparationLabel: 'کاتی ئامادەکردن',
          dineInOrBranchNote: 'داواکاری لە ناو فرۆشگا',
          pickupLabel: 'وەرگرتن لە فرۆشگا',
          tableOptionLabel: 'لە ناو لق',
          closedOrderNote: 'داواکاری پێشوەختە وەردەگیرێت و دوای کردنەوە ئامادە دەکرێت.',
          projectTypeLabel: 'فرۆشگای ئەلیکترۆنی',
        }
      : {
          isStore: false,
          entity: 'چێشتخانە',
          entityDef: 'چێشتخانەکە',
          menuTitle: 'مینیۆی دیجیتاڵ',
          menuDef: 'مینیۆکە',
          catalogLinkLabel: 'لینکی مینیۆ',
          itemSingular: 'خواردن',
          itemsPlural: 'خواردنەکان',
          itemDef: 'خواردنەکە',
          addItemLabel: 'زیادکردنی خواردنی نوێ',
          categorySingular: 'بەش',
          categoriesPlural: 'بەشەکان',
          emptyItemsMsg: 'هیچ خواردنێک لەم بەشەدا نییە.',
          preparationLabel: 'کاتی ئامادەکردن',
          dineInOrBranchNote: 'داواکاری لەسەر مێز (هۆڵ)',
          pickupLabel: 'وەرگرتن لە لق',
          tableOptionLabel: 'لەسەر مێز',
          closedOrderNote: 'داواکاری پێشوەختە وەردەگیرێت و دوای کردنەوەی چێشتخانە ئامادە دەکرێت.',
          projectTypeLabel: 'چێشتخانە / کافێ',
        };
  }

  return isStore
    ? {
        isStore: true,
        entity: 'متجر',
        entityDef: 'المتجر',
        menuTitle: 'كتالوج المتجر',
        menuDef: 'الكتالوج',
        catalogLinkLabel: 'رابط كتالوج المتجر',
        itemSingular: 'منتج',
        itemsPlural: 'المنتجات',
        itemDef: 'المنتج',
        addItemLabel: 'إضافة منتج جديد',
        categorySingular: 'قسم',
        categoriesPlural: 'الأقسام والتصنيفات',
        emptyItemsMsg: 'لا توجد منتجات مضافة في هذا القسم بعد.',
        preparationLabel: 'وقت التجهيز',
        dineInOrBranchNote: 'طلب داخل المعرض / الفرع',
        pickupLabel: 'استلام من المتجر',
        tableOptionLabel: 'داخل الفرع',
        closedOrderNote: 'نستقبل الطلبات المسبقة وسيتم تجهيزها فور افتتاح المتجر.',
        projectTypeLabel: 'متجر إلكتروني / تجزئة',
      }
    : {
        isStore: false,
        entity: 'مطعم',
        entityDef: 'المطعم',
        menuTitle: 'المنيو الإلكتروني',
        menuDef: 'المنيو',
        catalogLinkLabel: 'رابط المنيو',
        itemSingular: 'صنف',
        itemsPlural: 'الأصناف والأطباق',
        itemDef: 'الطبق',
        addItemLabel: 'إضافة صنف جديد',
        categorySingular: 'قسم',
        categoriesPlural: 'الأقسام والتصنيفات',
        emptyItemsMsg: 'لا توجد أطباق مضافة في هذا القسم بعد.',
        preparationLabel: 'وقت التحضير',
        dineInOrBranchNote: 'طلب على الطاولة (داخل الصالة)',
        pickupLabel: 'استلام من المطعم',
        tableOptionLabel: 'على الطاولة',
        closedOrderNote: 'نستقبل الطلبات المسبقة وسيتم تحضيرها فور افتتاح المطعم.',
        projectTypeLabel: 'مطعم / كافيه',
      };
}
