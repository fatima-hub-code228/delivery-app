import React, { useState } from 'react';
import { ScreenId } from '../types';
import { syncMenuStockToSupabase, logPartnerAction } from '../lib/supabase';

interface AddEditDishScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export default function AddEditDishScreen({ onNavigate }: AddEditDishScreenProps) {
  const [dishNameEn, setDishNameEn] = useState('Smoked Black Angus Tenderloin with Saffron Puree');
  const [dishNameAr, setDishNameAr] = useState('فيليه لحم أنجوس مدخن مع بيوريه الزعفران');
  const [category, setCategory] = useState("Chef's Signature Mains");
  const [cuisineOrigin, setCuisineOrigin] = useState('Modern Emirati Fusion');
  const [description, setDescription] = useState(
    'Prime tenderloin smoked with Emirati applewood, accompanied by roasted baby vegetables and golden saffron jus.'
  );

  const [basePrice, setBasePrice] = useState('280.00');
  const [promoPrice, setPromoPrice] = useState('250.00');
  const [packagingFee, setPackagingFee] = useState('5.00');

  const [dailyPrepLimit, setDailyPrepLimit] = useState(25);
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [kitchenPrepTime, setKitchenPrepTime] = useState(22);

  const [selectedDoneness, setSelectedDoneness] = useState('medium_rare');
  const [selectedSides, setSelectedSides] = useState<string[]>(['mash', 'asparagus']);

  // Dietary tags
  const [dietaryTags, setDietaryTags] = useState<Record<string, boolean>>({
    halal: true,
    recommended: true,
    dairy: true,
    glutenFree: false,
    dairyFree: false,
    nutWarning: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleSide = (sideId: string) => {
    setSelectedSides((prev) =>
      prev.includes(sideId) ? prev.filter((s) => s !== sideId) : [...prev, sideId]
    );
  };

  const handleSaveAndPublish = () => {
    const dishId = `DSH-${Date.now().toString().slice(-4)}`;
    syncMenuStockToSupabase(dishId, dishNameEn, dailyPrepLimit, false);
    logPartnerAction('dish_created', dishId, {
      name_en: dishNameEn,
      name_ar: dishNameAr,
      category,
      price: basePrice,
      prep_limit: dailyPrepLimit,
    });
    showToast(`"${dishNameEn}" successfully published and saved to Supabase!`);
    setTimeout(() => {
      onNavigate('menu-inventory');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Sub-Header & Breadcrumb Bar */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs text-[#d1c6ab]">
            <button
              onClick={() => onNavigate('menu-inventory')}
              className="hover:text-[#ffecb9] transition-colors cursor-pointer"
            >
              Menu Management
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-[#f7bd48] font-semibold">Add New Signature Dish</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9] tracking-tight">
              Create Signature Menu Item
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-xs font-semibold border border-[#f7bd48]/30">
              VAYORA Abu Dhabi Flagship
            </span>
          </div>
          <p className="text-xs text-[#d1c6ab] max-w-2xl leading-relaxed">
            Curate Michelin-grade culinary experiences with synchronized bilingual telemetry, kitchen load balancing, and UAE Federal Tax compliance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => onNavigate('menu-inventory')}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#d1c6ab] hover:text-[#e9e1dd] hover:bg-[#2d2927] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => showToast('Draft saved to local executive cache.')}
            className="px-4 py-2.5 rounded-xl bg-[#2d2927] hover:bg-[#383432] text-[#f1eddd] text-xs font-semibold transition-all shadow-sm border border-[#383432]"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSaveAndPublish}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-[0_0_20px_rgba(250,204,21,0.25)]"
          >
            <span className="material-symbols-outlined text-base">publish</span>
            <span>Save Dish &amp; Publish</span>
          </button>
        </div>
      </section>

      {/* Live KPI Glance Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase font-bold tracking-wider">
              Tax Computation
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-base text-[#ffecb9] font-bold">
              5% VAT Included
            </span>
          </div>
          <span className="material-symbols-outlined text-[#f7bd48] text-2xl">account_balance</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase font-bold tracking-wider">
              Active Service Window
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-base text-[#e9e1dd] font-bold">
              Dinner Service
            </span>
          </div>
          <span className="material-symbols-outlined text-[#f7bd48] text-2xl">timer</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase font-bold tracking-wider">
              Kitchen Prep Target
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-base text-[#ffecb9] font-bold">
              {kitchenPrepTime} Mins
            </span>
          </div>
          <span className="material-symbols-outlined text-[#f7bd48] text-2xl">soup_kitchen</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase font-bold tracking-wider">
              Live Stock Cap
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-base text-[#f7bd48] font-bold">
              {dailyPrepLimit} Covers Max
            </span>
          </div>
          <span className="material-symbols-outlined text-[#f7bd48] text-2xl">inventory_2</span>
        </div>
      </div>

      {/* Primary 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Media, Presentation, Badges (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Photography Uploader Card */}
          <div className="p-6 rounded-2xl bg-[#1e1b19] border border-[#383432]/60 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">photo_camera</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                  Media &amp; Visual Presentation
                </h2>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#f7bd48]">1:1 Required</span>
            </div>

            {/* Photo Container */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#221f1d] border border-[#383432] group flex flex-col justify-between p-4">
              <img
                alt="Smoked Black Angus"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ02bdu1rQb5kdyV2aGhniRw4paz5n_11FNvhYRTG2ox2aRbEg--Uo__e1vMyGfDAsUNVNmKVDBOHpydwcCwZN8MVJZNN1avnvFyIL7A5lZ-XcIrVMdcskyx9IOaQE-iy_LReXu6R2g5vStl0_NKSTdsnYutHwULNxgIkueTNL1n9vYQd-onarkP-tUI_zdnCgZKyYOrxzVOW0IabPE630RWNcfRrxMrntF0JobXtg_wmZ_rI1YyY"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

              {/* Badges Top */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#100e0c]/80 backdrop-blur-md text-[10px] font-semibold text-[#ffecb9] flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48]" />
                  High-Res Master Attached
                </span>
                <button
                  onClick={() => showToast('Dish master asset replaced with default studio preset.')}
                  className="p-1.5 rounded-lg bg-[#100e0c]/80 text-[#d1c6ab] hover:text-[#ffb4ab] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>

              {/* Overlay Prompt */}
              <div className="relative z-10 p-3 rounded-xl bg-[#100e0c]/90 backdrop-blur-md border border-[#ba880f]/30 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#f7bd48] text-[11px] font-bold">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Conversion Optimizer Active</span>
                </div>
                <p className="text-[11px] text-[#e9e1dd]">
                  Upload high-lighting dish photography for maximum order conversion.
                </p>
              </div>
            </div>

            {/* Tech Specs */}
            <div className="mt-4 p-3 rounded-xl bg-[#221f1d] border border-[#383432]/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-[#d1c6ab]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#f7bd48]">verified</span>
                  Asset Specifications
                </span>
                <span className="text-[#f7bd48] font-semibold">PNG, JPEG, WebP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[#383432]/30 text-xs">
                <div className="p-1.5 rounded bg-[#2d2927]/60">
                  <span className="block text-[10px] text-[#d1c6ab]">Min Size</span>
                  <span className="font-semibold text-[#f1eddd]">1200×1200</span>
                </div>
                <div className="p-1.5 rounded bg-[#2d2927]/60">
                  <span className="block text-[10px] text-[#d1c6ab]">Aspect</span>
                  <span className="font-semibold text-[#f1eddd]">1:1 Square</span>
                </div>
                <div className="p-1.5 rounded bg-[#2d2927]/60">
                  <span className="block text-[10px] text-[#d1c6ab]">Max Size</span>
                  <span className="font-semibold text-[#f1eddd]">10 MB</span>
                </div>
              </div>
            </div>

            {/* Drop Area */}
            <div
              onClick={() => showToast('Opening local drive file picker for high-resolution gallery angles...')}
              className="mt-3 p-4 rounded-xl border-2 border-dashed border-[#9a9078]/30 hover:border-[#f7bd48]/60 bg-[#221f1d]/40 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[#f7bd48] text-2xl mb-1">
                cloud_upload
              </span>
              <span className="text-xs font-semibold text-[#e9e1dd]">
                Drag alternative plate angles here
              </span>
              <span className="text-[11px] text-[#d1c6ab] mt-0.5">
                or <span className="text-[#f7bd48] underline">browse local drive</span>
              </span>
            </div>
          </div>

          {/* Dietary & Allergen Badges */}
          <div className="p-6 rounded-2xl bg-[#1e1b19] border border-[#383432]/60 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">
                  health_and_safety
                </span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                  Dietary &amp; Allergen Tags
                </h2>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#f7bd48]">ADFCA Compliant</span>
            </div>
            <p className="text-xs text-[#d1c6ab] mb-4">
              Strictly regulated badges will appear prominently on guest ordering terminals and digital bills.
            </p>

            <div className="space-y-2">
              {/* Halal */}
              <label
                onClick={() =>
                  setDietaryTags((prev) => ({ ...prev, halal: !prev.halal }))
                }
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  dietaryTags.halal
                    ? 'bg-[#221f1d] border-[#f7bd48]/50 border-l-4 border-l-[#f7bd48]'
                    : 'bg-[#221f1d]/50 border-[#383432]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={dietaryTags.halal}
                    readOnly
                    className="accent-[#facc15]"
                  />
                  <span className="text-xs font-semibold text-[#e9e1dd]">100% Halal Certified</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold">
                  UAE Standard
                </span>
              </label>

              {/* Recommended */}
              <label
                onClick={() =>
                  setDietaryTags((prev) => ({ ...prev, recommended: !prev.recommended }))
                }
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  dietaryTags.recommended
                    ? 'bg-[#221f1d] border-[#f7bd48]/50 border-l-4 border-l-[#f7bd48]'
                    : 'bg-[#221f1d]/50 border-[#383432]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={dietaryTags.recommended}
                    readOnly
                    className="accent-[#facc15]"
                  />
                  <span className="text-xs font-semibold text-[#e9e1dd]">Chef's Recommended</span>
                </div>
                <span className="material-symbols-outlined text-[#f7bd48] text-base">star</span>
              </label>

              {/* Contains Dairy */}
              <label
                onClick={() =>
                  setDietaryTags((prev) => ({ ...prev, dairy: !prev.dairy }))
                }
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  dietaryTags.dairy
                    ? 'bg-[#221f1d] border-[#f7bd48]/50 border-l-4 border-l-[#f7bd48]'
                    : 'bg-[#221f1d]/50 border-[#383432]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={dietaryTags.dairy}
                    readOnly
                    className="accent-[#facc15]"
                  />
                  <span className="text-xs font-semibold text-[#e9e1dd]">Contains Dairy</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#d1c6ab] text-[10px]">
                  Saffron Puree
                </span>
              </label>

              {/* Gluten-Free */}
              <label
                onClick={() =>
                  setDietaryTags((prev) => ({ ...prev, glutenFree: !prev.glutenFree }))
                }
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  dietaryTags.glutenFree
                    ? 'bg-[#221f1d] border-[#f7bd48]/50 border-l-4 border-l-[#f7bd48]'
                    : 'bg-[#221f1d]/50 border-[#383432]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={dietaryTags.glutenFree}
                    readOnly
                    className="accent-[#facc15]"
                  />
                  <span className="text-xs font-medium text-[#e9e1dd]">Gluten-Free</span>
                </div>
                <span className="text-[10px] text-[#d1c6ab]">Optional</span>
              </label>

              {/* Nut Warning */}
              <label
                onClick={() =>
                  setDietaryTags((prev) => ({ ...prev, nutWarning: !prev.nutWarning }))
                }
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  dietaryTags.nutWarning
                    ? 'bg-[#221f1d] border-[#f7bd48]/50 border-l-4 border-l-[#f7bd48]'
                    : 'bg-[#221f1d]/50 border-[#383432]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={dietaryTags.nutWarning}
                    readOnly
                    className="accent-[#facc15]"
                  />
                  <span className="text-xs font-medium text-[#e9e1dd]">Nut Allergy Warning</span>
                </div>
                <span className="text-[10px] text-[#d1c6ab]">Zero Traces</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Specifications, Dual-Language, UAE Pricing (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Culinary Identity */}
          <div className="p-6 rounded-2xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">translate</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                  Culinary Identity &amp; Classification
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-semibold">
                Bilingual Sync Active
              </span>
            </div>

            {/* English Name */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#e9e1dd]">
                  Dish Name in English <span className="text-[#f7bd48]">*</span>
                </label>
                <span className="text-[10px] text-[#d1c6ab]">
                  {dishNameEn.length} / 90 chars
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={dishNameEn}
                  onChange={(e) => setDishNameEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:bg-[#2d2927] focus:outline-none focus:ring-1 focus:ring-[#f7bd48] transition-all"
                />
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#f7bd48] text-base">
                  check_circle
                </span>
              </div>
            </div>

            {/* Arabic Name */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#e9e1dd] flex items-center justify-between w-full">
                  <span className="text-[10px] text-[#d1c6ab] font-normal">Official Arabic Localization</span>
                  <span><span className="text-[#f7bd48]">*</span> الاسم باللغة العربية</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  dir="rtl"
                  value={dishNameAr}
                  onChange={(e) => setDishNameAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] text-right font-medium focus:bg-[#2d2927] focus:outline-none focus:ring-1 focus:ring-[#f7bd48] transition-all"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#f7bd48] text-base">
                  check_circle
                </span>
              </div>
            </div>

            {/* Category and Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd]">
                  Menu Category <span className="text-[#f7bd48]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:outline-none focus:ring-1 focus:ring-[#f7bd48] cursor-pointer"
                  >
                    <option>Chef's Signature Mains</option>
                    <option>Appetizers &amp; Crudo</option>
                    <option>Woodfire Grill Specialities</option>
                    <option>Caviar &amp; Raw Bar</option>
                    <option>Pastry &amp; Confections</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#d1c6ab] pointer-events-none text-base">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd]">
                  Cuisine Signature Origin
                </label>
                <div className="relative">
                  <select
                    value={cuisineOrigin}
                    onChange={(e) => setCuisineOrigin(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:outline-none focus:ring-1 focus:ring-[#f7bd48] cursor-pointer"
                  >
                    <option>Modern Emirati Fusion</option>
                    <option>French Classical Luxury</option>
                    <option>Contemporary Levantine</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#d1c6ab] pointer-events-none text-base">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#e9e1dd]">
                  Short Menu Description <span className="text-[#f7bd48]">*</span>
                </label>
                <span className="text-[10px] text-[#d1c6ab]">Recommended 120-160 chars</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:outline-none focus:ring-1 focus:ring-[#f7bd48] resize-none"
              />
            </div>
          </div>

          {/* Pricing & UAE Federal Taxes */}
          <div className="p-6 rounded-2xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">payments</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                  Pricing &amp; UAE Taxes
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase text-[#f7bd48]">
                AED CURRENCY TIER
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Base Price */}
              <div className="p-3 rounded-xl bg-[#221f1d] border border-[#383432]/60 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd] flex items-center justify-between">
                  <span>Base Price</span>
                  <span className="text-[10px] text-[#f7bd48] font-bold">AED</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#2d2927] text-[#ffecb9] font-['Plus_Jakarta_Sans'] text-base font-bold focus:outline-none focus:ring-1 focus:ring-[#f7bd48]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#d1c6ab] font-bold">
                    AED
                  </span>
                </div>
                <span className="text-[10px] text-[#f7bd48] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Includes UAE 5% VAT
                </span>
              </div>

              {/* Promo Price */}
              <div className="p-3 rounded-xl bg-[#221f1d] border border-[#383432]/60 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd] flex items-center justify-between">
                  <span>Promo Price (Opt)</span>
                  <span className="text-[10px] text-[#f7bd48] font-bold">AED</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#2d2927] text-[#e9e1dd] font-['Plus_Jakarta_Sans'] text-base font-bold focus:outline-none focus:ring-1 focus:ring-[#f7bd48]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#d1c6ab] font-bold">
                    AED
                  </span>
                </div>
                <span className="text-[10px] text-[#d1c6ab] mt-0.5">Net margin: +68.4%</span>
              </div>

              {/* Packaging Fee */}
              <div className="p-3 rounded-xl bg-[#221f1d] border border-[#383432]/60 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd] flex items-center justify-between">
                  <span>Packaging Fee</span>
                  <span className="text-[10px] text-[#f7bd48] font-bold">AED</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={packagingFee}
                    onChange={(e) => setPackagingFee(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#2d2927] text-[#e9e1dd] font-['Plus_Jakarta_Sans'] text-base font-bold focus:outline-none focus:ring-1 focus:ring-[#f7bd48]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#d1c6ab] font-bold">
                    AED
                  </span>
                </div>
                <span className="text-[10px] text-[#d1c6ab] mt-0.5">Thermal bespoke box</span>
              </div>
            </div>
          </div>

          {/* Inventory & Kitchen Timing */}
          <div className="p-6 rounded-2xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">room_service</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                  Inventory &amp; Kitchen Timing
                </h2>
              </div>
              <span className="text-[10px] text-[#d1c6ab]">Real-time KDS Throttle</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd]">Daily Prep Limit</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={dailyPrepLimit}
                    onChange={(e) => setDailyPrepLimit(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:outline-none focus:ring-1 focus:ring-[#f7bd48]"
                  />
                  <span className="absolute right-3 text-[10px] text-[#d1c6ab]">portions</span>
                </div>
                <span className="text-[10px] text-[#d1c6ab]">Hard ceiling for shift</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd]">Low Stock Alert</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:outline-none focus:ring-1 focus:ring-[#f7bd48]"
                  />
                  <span className="absolute right-3 text-[10px] text-[#d1c6ab]">portions</span>
                </div>
                <span className="text-[10px] text-[#f7bd48] font-medium">Triggers floor chime</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#e9e1dd]">Kitchen Prep Time</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={kitchenPrepTime}
                    onChange={(e) => setKitchenPrepTime(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#221f1d] border border-[#383432] text-xs text-[#e9e1dd] focus:outline-none focus:ring-1 focus:ring-[#f7bd48]"
                  />
                  <span className="absolute right-3 text-[10px] text-[#d1c6ab]">minutes</span>
                </div>
                <span className="text-[10px] text-[#d1c6ab]">POS sync timing</span>
              </div>
            </div>
          </div>

          {/* Modifier Groups */}
          <div className="p-6 rounded-2xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">tune</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                  Modifier Groups &amp; Customization
                </h2>
              </div>
              <button
                onClick={() => showToast('New modifier group added: Caviar Add-ons & Truffle Shavings.')}
                className="flex items-center gap-1 text-[11px] font-bold text-[#f7bd48] hover:text-[#ffecb9] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Add Modifier Group</span>
              </button>
            </div>

            {/* Doneness */}
            <div className="p-4 rounded-xl bg-[#221f1d] border border-[#383432]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#2d2927] text-[#f7bd48] text-[10px] font-bold uppercase">
                    Required
                  </span>
                  <span className="text-xs font-bold text-[#e9e1dd]">
                    Steak Doneness Specification
                  </span>
                </div>
                <span className="text-[10px] text-[#d1c6ab]">Single Selection</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'rare', label: 'Rare', sub: 'Cool red center' },
                  { id: 'medium_rare', label: 'Medium Rare', sub: "Chef's Choice", recommended: true },
                  { id: 'medium', label: 'Medium', sub: 'Warm pink center' },
                  { id: 'well_done', label: 'Well Done', sub: 'Fully cooked' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDoneness(opt.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-center transition-all border ${
                      selectedDoneness === opt.id
                        ? 'bg-[#ba880f]/20 border-[#f7bd48] shadow-sm'
                        : 'bg-[#2d2927] border-transparent hover:bg-[#383432]'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        selectedDoneness === opt.id ? 'text-[#ffecb9]' : 'text-[#e9e1dd]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={`text-[10px] ${
                        selectedDoneness === opt.id ? 'text-[#f7bd48] font-semibold' : 'text-[#d1c6ab]'
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Side Choices */}
            <div className="p-4 rounded-xl bg-[#221f1d] border border-[#383432]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#2d2927] text-[#d1c6ab] text-[10px] font-semibold uppercase">
                    Optional Add-ons
                  </span>
                  <span className="text-xs font-bold text-[#e9e1dd]">
                    Accompaniments &amp; Luxury Sides
                  </span>
                </div>
                <span className="text-[10px] text-[#d1c6ab]">Multi-Select Allowed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  onClick={() => toggleSide('mash')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSides.includes('mash')
                      ? 'bg-[#2d2927] border-[#f7bd48]/50'
                      : 'bg-[#221f1d] border-[#383432]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedSides.includes('mash')}
                      readOnly
                      className="accent-[#facc15]"
                    />
                    <span className="text-xs font-medium text-[#e9e1dd]">
                      Truffle Mashed Potato
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#f7bd48]">+AED 25.00</span>
                </label>

                <label
                  onClick={() => toggleSide('asparagus')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSides.includes('asparagus')
                      ? 'bg-[#2d2927] border-[#f7bd48]/50'
                      : 'bg-[#221f1d] border-[#383432]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedSides.includes('asparagus')}
                      readOnly
                      className="accent-[#facc15]"
                    />
                    <span className="text-xs font-medium text-[#e9e1dd]">
                      Grilled Asparagus
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#f7bd48]">+AED 20.00</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Quick-Bar */}
      <div className="p-4 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f7bd48] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#e9e1dd]">Unsaved Changes Ready</span>
            <span className="text-[11px] text-[#d1c6ab]">
              All inputs verified compliant with UAE Municipality culinary standards.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => onNavigate('menu-inventory')}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#d1c6ab] hover:text-[#e9e1dd] transition-colors"
          >
            Discard All
          </button>
          <button
            onClick={handleSaveAndPublish}
            className="px-6 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold shadow-[0_0_16px_rgba(250,204,21,0.25)] transition-all"
          >
            Save Dish &amp; Publish
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="px-5 py-3 rounded-xl bg-[#383432] text-[#ffecb9] shadow-2xl flex items-center gap-3 border border-[#facc15]/30">
            <span className="material-symbols-outlined text-[#facc15]">check_circle</span>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
