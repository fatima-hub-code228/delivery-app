import React, { useState, useEffect, useCallback } from 'react';
import { ScreenId, MenuItem } from '../types';
import {
  syncMenuStockToSupabase,
  fetchMenuInventoryFromSupabase,
  getPartnerSession,
  onPartnerSessionChange,
} from '../lib/supabase';

interface MenuInventoryScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

function mapCategoryBucket(cat: string): 'starters' | 'mains' | 'grill' | 'desserts' {
  const c = (cat || '').toLowerCase();
  if (c === 'grill' || c.includes('grill')) return 'grill';
  if (
    c === 'desserts' ||
    c.includes('sweet') ||
    c.includes('pastry') ||
    c.includes('kunafa') ||
    c.includes('date') ||
    c.includes('drink') ||
    c.includes('beverage') ||
    c.includes('coffee')
  ) {
    return 'desserts';
  }
  if (
    c === 'starters' ||
    c.includes('mezze') ||
    c.includes('snack') ||
    c.includes('nut') ||
    c.includes('kernel') ||
    c.includes('fruit')
  ) {
    return 'starters';
  }
  return 'mains';
}

export default function MenuInventoryScreen({ onNavigate }: MenuInventoryScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'sold_out'>('all');
  const [activeDietary, setActiveDietary] = useState<string[]>([]);
  const [emergency86Mode, setEmergency86Mode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dishes, setDishes] = useState<MenuItem[]>([]);

  const loadSharedMenu = useCallback(async () => {
    const storeId = getPartnerSession().storeId;
    const sharedItems = await fetchMenuInventoryFromSupabase(storeId);
    const mapped: MenuItem[] = sharedItems.map((p) => ({
      id: p.id,
      title: p.nameEn,
      category: mapCategoryBucket(p.category),
      categoryLabel: `${p.storeName} • ${p.category}`,
      description: `${p.description} (${p.nameAr} • ${p.weightOrPortion})`,
      price: p.priceAed,
      sku: p.sku,
      stock: p.isAvailable ? p.stock : 0,
      badge: p.storeName,
      prepTime: '15-25 min',
      calories: `${p.weightOrPortion} • Halal Certified`,
      dietary: ['halal'],
      image: p.image,
      isChefSignature: p.id.startsWith('DSH-01') || p.id === 'prod_ms_mixed_grill',
    }));
    setDishes(mapped);
  }, []);

  useEffect(() => {
    loadSharedMenu();
    const unsub = onPartnerSessionChange(() => {
      loadSharedMenu();
    });
    return unsub;
  }, [loadSharedMenu]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleStockChange = (dishId: string, delta: number) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const nextStock = Math.max(0, d.stock + delta);
          syncMenuStockToSupabase(d.id, d.title, nextStock, nextStock === 0, {
            price: d.price,
            sku: d.sku,
          });
          return { ...d, stock: nextStock };
        }
        return d;
      })
    );
  };

  const handleToggle86 = (dishId: string) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const nextStock = d.stock > 0 ? 0 : 15;
          const is86 = nextStock === 0;
          syncMenuStockToSupabase(d.id, d.title, nextStock, is86, {
            price: d.price,
            sku: d.sku,
          });
          showToast(
            is86
              ? `Item "${d.title}" 86'd and synced to shared Supabase catalog.`
              : `Item "${d.title}" restocked (15 portions) and live in Customer App & Supabase.`
          );
          return { ...d, stock: nextStock };
        }
        return d;
      })
    );
  };

  const toggleDietaryTag = (tag: string) => {
    setActiveDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Filtered dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesCat = activeCategory === 'all' || dish.category === activeCategory;
    const matchesQuery =
      !searchQuery ||
      dish.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = dish.stock > 5;
    else if (stockFilter === 'low_stock') matchesStock = dish.stock > 0 && dish.stock <= 5;
    else if (stockFilter === 'sold_out') matchesStock = dish.stock === 0;

    const matchesDietary =
      activeDietary.length === 0 || activeDietary.every((t) => dish.dietary.includes(t));

    return matchesCat && matchesQuery && matchesStock && matchesDietary;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Operational Status & Summary Section */}
      <section className="bg-[#1e1b19] rounded-xl p-6 lg:p-8 shadow-xl relative overflow-hidden border border-[#383432]/60">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#facc15]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f7bd48] animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f7bd48]">
                VAYORA Core Registry • POS Sync Active
              </span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9] tracking-tight">
              Menu &amp; Inventory Management
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#d1c6ab]">
              <span className="text-[#e9e1dd] font-semibold">58 Active Items</span>
              <span>/</span>
              <span>4 Categories</span>
              <span>/</span>
              <span className="text-[#f7bd48] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                3 Low Stock Alerts
              </span>
              <span>/</span>
              <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#ffecb9] text-[11px] font-semibold border border-[#383432]">
                Live on Abu Dhabi App
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setEmergency86Mode(!emergency86Mode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 border ${
                emergency86Mode
                  ? 'bg-[#93000a] text-[#ffdad6] border-[#ffb4ab]'
                  : 'bg-[#2d2927] hover:bg-[#383432] text-[#e9e1dd] border-[#383432]'
              }`}
            >
              <span className="material-symbols-outlined text-[#ffb4ab] text-base">block</span>
              <span>{emergency86Mode ? 'Exit 86 Mode' : '86 Emergency Mode'}</span>
            </button>

            <button
              onClick={() => showToast('CSV Template downloaded. Syncing with Abu Dhabi POS...')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#221f1d] hover:bg-[#2d2927] text-[#d1c6ab] hover:text-[#e9e1dd] text-xs font-medium transition-all border border-[#383432]/60"
            >
              <span className="material-symbols-outlined text-base">file_upload</span>
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => showToast('Exporting active UAE Dirham pricing ledger (5% VAT inclusive)...')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#221f1d] hover:bg-[#2d2927] text-[#d1c6ab] hover:text-[#e9e1dd] text-xs font-medium transition-all border border-[#383432]/60"
            >
              <span className="material-symbols-outlined text-base">file_download</span>
              <span>Export Pricing</span>
            </button>

            <button
              onClick={() => onNavigate('add-edit-dish')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-[0_0_18px_rgba(250,204,21,0.25)] active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add New Dish</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 bg-[#100e0c]/60 rounded-lg p-4 border border-[#383432]/40">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase tracking-wider font-semibold">
              Gross Inventory Valuation
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                142,850
              </span>
              <span className="text-[10px] text-[#f7bd48] font-bold">AED</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase tracking-wider font-semibold">
              Average Check Item
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                182.50
              </span>
              <span className="text-[10px] text-[#f7bd48] font-bold">AED</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase tracking-wider font-semibold">
              Kitchen Yield Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#f7bd48]">
                96.8%
              </span>
              <span className="text-[10px] text-[#d1c6ab] font-medium">Optimal</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#d1c6ab] uppercase tracking-wider font-semibold">
              Stock Depletion Velocity
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#f1eddd]">
                4.2
              </span>
              <span className="text-[10px] text-[#d1c6ab] font-medium">orders / min</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills & Filters */}
      <section className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Dishes', count: 58 },
            { id: 'starters', label: 'Starters & Cold Mezze', count: 14 },
            { id: 'mains', label: "Chef's Signature Mains", count: 22 },
            { id: 'grill', label: 'Woodfire Grill', count: 12 },
            { id: 'desserts', label: 'Artisan Desserts & Mocktails', count: 10 },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#facc15] text-[#6c5700] font-bold shadow-md'
                  : 'bg-[#2d2927] hover:bg-[#383432] text-[#e9e1dd]'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeCategory === cat.id ? 'bg-[#6c5700]/20' : 'bg-[#221f1d] text-[#d1c6ab]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Filters & Search Bar */}
        <div className="bg-[#1e1b19] rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 border border-[#383432]/60 shadow-md">
          <div className="relative w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d1c6ab] text-base">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-[#221f1d] border border-[#383432]/60 rounded-xl text-[#e9e1dd] placeholder:text-[#d1c6ab]/40 text-xs focus:outline-none focus:bg-[#2d2927] transition-all"
              placeholder="Search dish name, gold flakes, saffron, wagyu..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d1c6ab] hover:text-[#e9e1dd]"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Stock Filter Select */}
            <div className="flex items-center gap-1.5 bg-[#221f1d] border border-[#383432]/60 px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-[#f7bd48] text-base">inventory</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-transparent text-xs text-[#e9e1dd] focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#2d2927]">All Availability</option>
                <option value="in_stock" className="bg-[#2d2927]">In Stock Only</option>
                <option value="low_stock" className="bg-[#2d2927]">Low Stock Alert (3)</option>
                <option value="sold_out" className="bg-[#2d2927]">86'd / Sold Out</option>
              </select>
            </div>

            {/* Dietary Chips */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleDietaryTag('halal')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeDietary.includes('halal')
                    ? 'bg-[#ba880f]/30 border-[#f7bd48] text-[#f7bd48]'
                    : 'bg-[#221f1d] border-[#383432]/60 text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-[#f7bd48]">verified</span>
                <span>Halal Certified</span>
              </button>

              <button
                onClick={() => toggleDietaryTag('gluten-free')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeDietary.includes('gluten-free')
                    ? 'bg-[#ba880f]/30 border-[#f7bd48] text-[#f7bd48]'
                    : 'bg-[#221f1d] border-[#383432]/60 text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-[#ffecb9]">eco</span>
                <span>Gluten-Free</span>
              </button>

              <button
                onClick={() => toggleDietaryTag('vegan')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeDietary.includes('vegan')
                    ? 'bg-[#ba880f]/30 border-[#f7bd48] text-[#f7bd48]'
                    : 'bg-[#221f1d] border-[#383432]/60 text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-[#ffecb9]">psychiatry</span>
                <span>Vegan</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency 86 Banner */}
      {emergency86Mode && (
        <div className="p-4 rounded-xl bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab] flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl animate-pulse">crisis_alert</span>
            <div>
              <h2 className="text-sm font-bold leading-tight">Emergency 86 Batch Mode Activated</h2>
              <p className="text-xs opacity-90 mt-0.5">
                Clicking any dish card immediately pulls it from live UAE delivery tablets and guest menus.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmergency86Mode(false)}
            className="px-3.5 py-1.5 rounded-lg bg-[#100e0c] text-[#e9e1dd] text-xs font-semibold hover:bg-[#221f1d] transition-all"
          >
            Exit Mode
          </button>
        </div>
      )}

      {/* Luxury Menu Items Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDishes.map((dish) => {
          const isSoldOut = dish.stock === 0;
          const isLowStock = dish.stock > 0 && dish.stock <= 5;

          return (
            <article
              key={dish.id}
              className={`rounded-xl overflow-hidden border transition-all duration-300 flex flex-col justify-between group ${
                isSoldOut
                  ? 'bg-[#1e1b19]/80 border-[#93000a]/50 shadow-md'
                  : isLowStock
                  ? 'bg-[#1e1b19] border-[#ba880f]/50 shadow-lg hover:shadow-2xl'
                  : 'bg-[#1e1b19] border-[#383432]/60 shadow-lg hover:shadow-2xl'
              }`}
            >
              <div>
                {/* Media Container */}
                <div className="relative h-56 w-full overflow-hidden bg-[#221f1d]">
                  <img
                    alt={dish.title}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                      isSoldOut ? 'filter grayscale contrast-125' : ''
                    }`}
                    src={dish.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b19] via-transparent to-black/50" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#100e0c]/80 backdrop-blur-md text-[#f7bd48] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-xs">hotel_class</span>
                      {dish.badge || "Chef's Signature"}
                    </span>

                    {isSoldOut ? (
                      <div className="px-2.5 py-0.5 rounded-full bg-[#93000a] text-[#ffdad6] text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                        <span>86'd / SOLD OUT</span>
                      </div>
                    ) : isLowStock ? (
                      <div className="px-2.5 py-0.5 rounded-full bg-[#ba880f] text-[#392700] text-[10px] font-bold flex items-center gap-1 shadow-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#392700]" />
                        <span>LOW STOCK</span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-0.5 rounded-full bg-[#2d2927]/90 text-[#f7bd48] text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48]" />
                        <span>Available</span>
                      </div>
                    )}
                  </div>

                  {/* Sold out overlay */}
                  {isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                      <span className="px-4 py-1.5 rounded-xl bg-[#100e0c]/90 text-[#ffb4ab] font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-wider uppercase shadow-2xl border border-[#93000a]">
                        Kitchen 86'd
                      </span>
                    </div>
                  )}

                  {/* Bottom Metas */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[#e9e1dd] text-[11px]">
                    <span className="flex items-center gap-1 bg-[#100e0c]/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      <span className="material-symbols-outlined text-xs text-[#f7bd48]">timer</span>
                      {dish.prepTime}
                    </span>
                    <span className="bg-[#100e0c]/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-[#d1c6ab]">
                      {dish.calories}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-2">
                    <h2
                      className={`font-['Plus_Jakarta_Sans'] text-base font-bold leading-tight group-hover:text-[#ffecb9] transition-colors ${
                        isSoldOut ? 'text-[#d1c6ab] line-through' : 'text-[#e9e1dd]'
                      }`}
                    >
                      {dish.title}
                    </h2>
                    <p className="text-xs text-[#d1c6ab] mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Price & SKU */}
                  <div className="flex items-baseline justify-between py-2 border-b border-[#383432]/40">
                    <div className="flex items-baseline gap-1">
                      <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                        {dish.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#f7bd48] font-bold">AED</span>
                      <span className="text-[10px] text-[#d1c6ab]/70 ml-1">(5% VAT incl.)</span>
                    </div>
                    <span className="text-[11px] text-[#f7bd48] font-semibold">{dish.sku}</span>
                  </div>

                  {/* Inventory Stepper & Live Stock */}
                  <div className="flex items-center justify-between mt-3 py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#d1c6ab]">Portions Left:</span>
                      <span
                        className={`font-['Plus_Jakarta_Sans'] text-sm font-bold ${
                          isSoldOut
                            ? 'text-[#ffb4ab]'
                            : isLowStock
                            ? 'text-[#f7bd48]'
                            : 'text-[#ffecb9]'
                        }`}
                      >
                        {isSoldOut ? '0 In Stock' : isLowStock ? `${dish.stock} Left` : dish.stock}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center bg-[#221f1d] border border-[#383432]/50 rounded-lg p-0.5">
                      <button
                        onClick={() => handleStockChange(dish.id, -1)}
                        className="p-1 rounded hover:bg-[#2d2927] text-[#d1c6ab] hover:text-[#e9e1dd] transition-colors"
                        title="Decrement Stock"
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-[#e9e1dd]">
                        {dish.stock}
                      </span>
                      <button
                        onClick={() => handleStockChange(dish.id, 1)}
                        className="p-1 rounded hover:bg-[#2d2927] text-[#d1c6ab] hover:text-[#e9e1dd] transition-colors"
                        title="Increment Stock"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => onNavigate('add-edit-dish')}
                  className="flex-1 py-2 rounded-lg bg-[#221f1d] hover:bg-[#2d2927] text-[#e9e1dd] text-xs font-semibold flex items-center justify-center gap-1 border border-[#383432]/50 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Edit</span>
                </button>

                {isSoldOut ? (
                  <button
                    onClick={() => handleToggle86(dish.id)}
                    className="flex-1 py-2 rounded-lg bg-[#facc15] text-[#6c5700] hover:bg-[#f7bd48] text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Restock &amp; Go Live</span>
                  </button>
                ) : isLowStock ? (
                  <button
                    onClick={() => handleStockChange(dish.id, 10)}
                    className="px-3 py-2 rounded-lg bg-[#ba880f] text-[#392700] hover:brightness-110 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">add_box</span>
                    <span>Replenish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggle86(dish.id)}
                    className="px-3 py-2 rounded-lg bg-[#221f1d] hover:bg-[#93000a]/20 text-[#d1c6ab] hover:text-[#ffb4ab] text-xs font-medium transition-all border border-[#383432]/50"
                  >
                    <span>86 Item</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Empty State */}
      {filteredDishes.length === 0 && (
        <div className="bg-[#1e1b19] border border-[#383432] rounded-xl p-12 text-center flex flex-col items-center justify-center my-6 shadow-inner">
          <div className="w-16 h-16 rounded-full bg-[#2d2927] flex items-center justify-center mb-4 text-[#f7bd48]">
            <span className="material-symbols-outlined text-3xl">dinner_dining</span>
          </div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg text-[#e9e1dd] font-bold">
            No Menu Items Found
          </h3>
          <p className="text-xs text-[#d1c6ab] max-w-md mt-2 leading-relaxed">
            No items match your query "{searchQuery}". Check your spelling or reset applied filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setStockFilter('all');
              setActiveDietary([]);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#facc15] text-[#6c5700] text-xs font-bold shadow-md hover:bg-[#f7bd48] transition-all"
          >
            Clear All Filters &amp; Search
          </button>
        </div>
      )}

      {/* Regulatory Compliance Bar */}
      <section className="bg-[#1e1b19] border border-[#383432]/60 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#221f1d] text-[#f7bd48]">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#e9e1dd]">
              Abu Dhabi Food Control Authority (ADFCA) Compliant
            </h4>
            <p className="text-[11px] text-[#d1c6ab]">
              All item allergens, Halal disclosures, and 5% UAE Federal VAT calculations are synchronized automatically across consumer terminals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
          <button
            onClick={() => showToast('Displaying ADFCA Regulatory Audit Log (Last inspection: Grade A)')}
            className="px-3.5 py-2 rounded-xl bg-[#221f1d] hover:bg-[#2d2927] text-xs font-semibold text-[#d1c6ab] transition-all border border-[#383432]/60"
          >
            Audit Log
          </button>
          <button
            onClick={() => showToast('Synchronizing 58 items with micros/Symphony POS... Done!')}
            className="px-4 py-2 rounded-xl bg-[#ba880f] hover:bg-[#f7bd48] text-[#392700] text-xs font-bold transition-all shadow-md"
          >
            Batch Sync to POS
          </button>
        </div>
      </section>

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
