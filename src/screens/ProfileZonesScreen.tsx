import React, { useState, useEffect } from 'react';
import { ScreenId } from '../types';
import {
  syncZoneToSupabase,
  logPartnerAction,
  fetchDeliveryZonesFromSupabase,
} from '../lib/supabase';

interface ProfileZonesScreenProps {
  onNavigate: (screen: ScreenId) => void;
  showToast: (msg: string, icon?: string) => void;
}

export default function ProfileZonesScreen({ onNavigate, showToast }: ProfileZonesScreenProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'zones' | 'hours' | 'finance'>('profile');
  const [ramadanEnabled, setRamadanEnabled] = useState(true);

  // Delivery zone state
  const [zones, setZones] = useState([
    {
      id: 'z1',
      name: 'Al Maryah & Al Reem Island',
      badge: 'Zone 1',
      subBadge: 'Primary Core',
      radius: '0 - 5 km from Four Seasons Dispatch',
      fee: 'AED 10',
      feeSub: 'Free above 150',
      minOrder: 'AED 80',
      window: '25-35m',
      active: true,
      color: 'bg-[#ba880f]',
    },
    {
      id: 'z2',
      name: 'Corniche & Al Bateen',
      badge: 'Zone 2',
      subBadge: 'Diplomatic Enclave',
      radius: '5 - 12 km • Diplomatic & Waterfront Residences',
      fee: 'AED 20',
      feeSub: '',
      minOrder: 'AED 150',
      window: '35-45m',
      active: true,
      color: 'bg-[#383432]',
    },
    {
      id: 'z3',
      name: 'Saadiyat Cultural District & Beach',
      badge: 'Zone 3',
      subBadge: 'Louvre / St. Regis',
      radius: '10 - 18 km • High Check Average Corridors',
      fee: 'AED 25',
      feeSub: '',
      minOrder: 'AED 200',
      window: '40-50m',
      active: true,
      color: 'bg-[#ba880f]/30',
    },
    {
      id: 'z4',
      name: 'Yas Island & Khalifa City',
      badge: 'Zone 4',
      subBadge: 'Auto-Throttled',
      radius: 'Disabled during peak dinner rush (19:30 - 22:30) to safeguard floor kitchen capacity',
      fee: 'AED 35',
      feeSub: '',
      minOrder: 'AED 250',
      window: '50-65m',
      active: false,
      color: 'bg-[#93000a]/20',
    },
  ]);

  useEffect(() => {
    fetchDeliveryZonesFromSupabase().then((dbZones) => {
      if (dbZones && dbZones.length > 0) {
        setZones(
          dbZones.map((z: any, idx: number) => ({
            id: z.id,
            name: z.name || z.id,
            badge: z.id.startsWith('ad_') ? 'Customer App Zone' : `Zone ${idx + 1}`,
            subBadge: z.id.startsWith('ad_') ? 'Abu Dhabi Geofence' : 'Executive Fleet',
            radius: z.radius || 'Abu Dhabi Service Sector',
            fee: z.fee || 'AED 7',
            feeSub: '',
            minOrder: z.min_order || 'AED 35',
            window: '25-35m',
            active: Boolean(z.is_active),
            color: z.is_active ? 'bg-[#ba880f]' : 'bg-[#93000a]/20',
          }))
        );
      }
    });
  }, []);

  const [cuisineTags, setCuisineTags] = useState([
    'Contemporary Emirati',
    'Fine Dining Mediterranean',
    'Steakhouse',
  ]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const toggleZone = (id: string) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id === id) {
          const next = !z.active;
          syncZoneToSupabase(z.id, z.name, next);
          showToast(
            `${z.name} ${next ? 'activated for live dispatch' : 'temporarily paused'} (synced to Supabase)`,
            'radar'
          );
          return { ...z, active: next };
        }
        return z;
      })
    );
  };

  const removeTag = (tagToRemove: string) => {
    setCuisineTags((prev) => prev.filter((t) => t !== tagToRemove));
    logPartnerAction('cuisine_tag_removed', tagToRemove);
  };

  const addTag = () => {
    if (newTagInput.trim()) {
      const tag = newTagInput.trim();
      setCuisineTags((prev) => [...prev, tag]);
      logPartnerAction('cuisine_tag_added', tag);
      setNewTagInput('');
      setIsAddingTag(false);
      showToast('Cuisine style added to registry and Supabase', 'check_circle');
    }
  };

  const handleSave = () => {
    logPartnerAction('restaurant_profile_saved', 'The Grand Pavilion', {
      zonesCount: zones.length,
      activeZones: zones.filter((z) => z.active).map((z) => z.name),
      ramadanEnabled,
      cuisines: cuisineTags,
    });
    showToast('Restaurant profile and delivery logistics saved to Supabase', 'cloud_done');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Banner Header */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#221f1d] mb-6 shadow-xl border border-[#383432]/40">
        <div className="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-[#facc15]/5 blur-3xl pointer-events-none" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-[#f7bd48]">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span className="text-xs uppercase tracking-widest text-[#f7bd48] font-semibold">
                Department of Economic Development • Abu Dhabi Verified
              </span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-tight text-[#ffecb9]">
              Restaurant Profile &amp; Delivery Logistics
            </h1>
            <p className="text-sm text-[#d1c6ab] flex items-center gap-2">
              <span>The Grand Pavilion Restaurant &amp; Lounge</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f7bd48]" />
              <span className="text-[#e9e1dd]">Al Maryah Island Flagship</span>
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="px-3.5 py-1.5 rounded-full bg-[#2d2927] border border-[#383432]/50 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#facc15] animate-pulse" />
              <span className="text-xs font-semibold text-[#e9e1dd]">
                Fleet Sync Active ({zones.filter((z) => z.active).length} Zones Live)
              </span>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] font-['Inter'] text-sm font-semibold transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">cloud_sync</span>
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto px-6 bg-[#1e1b19]/70 backdrop-blur-md border-t border-[#383432]/40">
          <button
            onClick={() => setActiveTab('profile')}
            className={`tab-trigger flex items-center gap-2 px-4 py-3.5 rounded-t-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#6c5700] bg-[#facc15]'
                : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">storefront</span>
            <span>General Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`tab-trigger flex items-center gap-2 px-4 py-3.5 rounded-t-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'zones'
                ? 'text-[#6c5700] bg-[#facc15] font-semibold'
                : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">radar</span>
            <span>Abu Dhabi Delivery Zones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#2d2927] text-[10px] text-[#f7bd48] font-bold">
              {zones.filter((z) => z.active).length} LIVE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`tab-trigger flex items-center gap-2 px-4 py-3.5 rounded-t-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'hours'
                ? 'text-[#6c5700] bg-[#facc15] font-semibold'
                : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">schedule</span>
            <span>Operating Hours &amp; Ramadan</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`tab-trigger flex items-center gap-2 px-4 py-3.5 rounded-t-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'finance'
                ? 'text-[#6c5700] bg-[#facc15] font-semibold'
                : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">account_balance</span>
            <span>Banking &amp; UAE Tax (TRN)</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Primary Sections (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Section 1: Brand & Dining Atmosphere */}
          <section className="bg-[#221f1d] rounded-xl p-6 shadow-md border border-[#383432]/40 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#383432]/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined">
                  palette
                </span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                    Brand &amp; Dining Atmosphere
                  </h2>
                  <p className="text-xs text-[#d1c6ab]">
                    Visual assets, venue identity, and luxury culinary accreditation
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#2d2927] text-[#f7bd48] text-xs font-semibold border border-[#383432]/50">
                Tier 1 Dining
              </span>
            </div>

            {/* Cover & Crest Upload Mosaic */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
              <div className="md:col-span-8 relative h-48 md:h-56 rounded-xl overflow-hidden group shadow-inner border border-[#383432]/40">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt="Fine dining interior overlooking Al Maryah Island promenade"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGveaB2TI-m_l6joI5EgzBDtldtpJ4EPjJAD6vpphoToHZqL5x22IA509pvk9wXUpaT6bdBo5-uLRXGnKNIsmnxK9-WIIYRdq8hy5NLDLWEy6TMGssVltctRSvzcJB1j9-9pOCmYHgAzEiLOmRXvrn6hlvvh7_eCArZtPVnyy0KG8FQeG9uWjoGuMwB9RfpLDp9tNIup9nmULVSDGf5RRSO4JpbDO31FZv5oFexP2qIdOQp7ufXv0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100e0c]/90 via-[#100e0c]/30 to-transparent flex flex-col justify-end p-4">
                  <span className="text-xs uppercase tracking-wider text-[#f7bd48] font-semibold">
                    Hero Showcase • Waterfront Promenade
                  </span>
                  <p className="text-xs text-[#e9e1dd]">Dimensions 2560x1080px (Optimal 2.39:1 Cinema Ratio)</p>
                </div>
                <button
                  onClick={() => showToast('Banner image update prompt opened', 'photo_camera')}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#100e0c]/80 backdrop-blur-md text-[#e9e1dd] text-xs font-medium hover:bg-[#2d2927] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>Update Banner</span>
                </button>
              </div>

              <div className="md:col-span-4 relative h-48 md:h-56 rounded-xl bg-[#1e1b19] flex flex-col items-center justify-center p-4 text-center group border border-[#383432]/40">
                <div className="relative w-20 h-20 rounded-full bg-[#2d2927] shadow-lg flex items-center justify-center mb-2 overflow-hidden border border-[#f7bd48]/30">
                  <img
                    className="w-full h-full object-cover"
                    alt="Imperial Brand Crest"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhApTFj7H7F-ODvIvwDdhM6wVOlOzpM8m-zc3WQlM9kiy36hrLMSSXOAKFnaIz2vCmUvDUd2Er1xthCFW4bsidv8ZQgAp9UTrjfTq99IqDmwtCGhdX0PzvM6QyZeCAqvTZvVg29LkdSlR51xavzjTQN4Kd2dQB2M_NrpKOkKVrmYACYBBUrr3gjBgcepwyDdHDf9FH7sBmEfHuqavIrXES0phGiK0wxdDKOdWi-GoQTm4XBEO-OsY"
                  />
                  <div className="absolute inset-0 bg-[#100e0c]/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ffecb9] text-xl">upload</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#e9e1dd]">Imperial Brand Crest</span>
                <span className="text-[11px] text-[#d1c6ab]">SVG, PNG with Alpha Transparency</span>
                <button
                  onClick={() => showToast('Crest upload modal active', 'badge')}
                  className="mt-2 text-[#f7bd48] hover:text-[#ffecb9] text-xs font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Replace Crest
                </button>
              </div>
            </div>

            {/* Venue Metadata Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                  Restaurant Registered Name
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1e1b19] text-[#e9e1dd] text-sm border border-[#383432]/50 focus:outline-none focus:border-[#f7bd48] transition-all"
                    type="text"
                    defaultValue="The Grand Pavilion Restaurant & Lounge"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#f7bd48] text-base">
                    verified
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                  Commercial License / DED Number
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1e1b19] text-[#ffecb9] font-['Plus_Jakarta_Sans'] font-bold text-sm tracking-wider border border-[#383432]/50 focus:outline-none focus:border-[#f7bd48] transition-all"
                    type="text"
                    defaultValue="CN-1049281"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#d1c6ab] text-base">
                    badge
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                  Official Location &amp; Dispatch Point
                </label>
                <div className="relative">
                  <input
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1e1b19] text-[#e9e1dd] text-sm border border-[#383432]/50 focus:outline-none focus:border-[#f7bd48] transition-all"
                    type="text"
                    defaultValue="Four Seasons Hotel Promenade, Al Maryah Island, Abu Dhabi, UAE"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#f7bd48] text-base">
                    location_on
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                  Curated Cuisine Styles
                </label>
                <div className="flex flex-wrap gap-2">
                  {cuisineTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg bg-[#2d2927] text-[#ffecb9] text-xs font-medium flex items-center gap-1.5 border border-[#383432]/50 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm text-[#f7bd48]">star</span>
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="material-symbols-outlined text-sm text-[#d1c6ab] hover:text-[#ffb4ab] ml-1 cursor-pointer"
                      >
                        close
                      </button>
                    </span>
                  ))}
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Tag name..."
                        className="px-2.5 py-1 text-xs rounded-lg bg-[#1e1b19] text-[#e9e1dd] border border-[#f7bd48] focus:outline-none w-32"
                        autoFocus
                      />
                      <button
                        onClick={addTag}
                        className="px-2 py-1 rounded bg-[#facc15] text-[#6c5700] text-xs font-bold"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setIsAddingTag(false)}
                        className="px-1 text-xs text-[#d1c6ab]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#1e1b19] text-[#f7bd48] text-xs font-medium hover:bg-[#2d2927] transition-all flex items-center gap-1 border border-[#383432]/40 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Cuisine Tag</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Abu Dhabi Delivery Zones & Geo-Fence Settings */}
          <section className="bg-[#221f1d] rounded-xl p-6 shadow-md border border-[#383432]/40 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#383432]/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined">
                  distance
                </span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                    Abu Dhabi Delivery Zones &amp; Geo-Fence Logistics
                  </h2>
                  <p className="text-xs text-[#d1c6ab]">
                    Real-time driver dispatch boundaries, dynamic pricing, and minimum baskets
                  </p>
                </div>
              </div>
              <button
                onClick={() => showToast('New zone polygon boundary drawer opened', 'add_location_alt')}
                className="px-3.5 py-1.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-[#f7bd48] text-xs font-semibold transition-all self-start sm:self-auto flex items-center gap-1.5 border border-[#383432]/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add_location_alt</span>
                <span>Configure New Zone</span>
              </button>
            </div>

            {/* Static Delivery Zone Map Overview */}
            <div className="relative w-full h-52 rounded-xl overflow-hidden my-4 group border border-[#383432]/50">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDj8fUO5LNcCsSqMXzz9rgCzCLzBdFjeV3E03jKnIzfeLrbLaXOWraFRI2OBdBG65KiaoWzgrR1NISIs1yzZCkq070-0uwHnECZifPSUvXpmWsxWHgs-xzB7ghbKiC07XnH9XBh-sJkPBMJfbFldYpeb5ZiP51i0Z3UzEcrW9tb8U9vdqOLNtuW4VAcTj0qSeVntjYeSftYKgVGMVs07JIa0lmniKauBjWtRjd_PwUYrCgXR_15qUQ')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#100e0c]/80 via-transparent to-[#100e0c]/60 flex items-end p-4">
                <div className="bg-[#221f1d]/90 backdrop-blur-md p-3 rounded-lg flex items-center gap-4 border border-[#383432]/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#f7bd48]" />
                    <span className="text-xs text-[#e9e1dd]">Hub: Al Maryah Island</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#facc15]" />
                    <span className="text-xs text-[#e9e1dd]">Active Coverage: 18km Radius</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Cards */}
            <div className="space-y-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 rounded-xl transition-all border ${
                    zone.active
                      ? 'bg-[#1e1b19] border-[#383432]/60 hover:bg-[#2d2927]/60'
                      : 'bg-[#1e1b19]/50 border-[#383432]/30 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            zone.active
                              ? 'bg-[#ba880f] text-[#392700]'
                              : 'bg-[#383432] text-[#d1c6ab]'
                          }`}
                        >
                          {zone.badge}
                        </span>
                        <h3 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-[#e9e1dd]">
                          {zone.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            zone.active
                              ? 'bg-[#facc15]/20 text-[#f7bd48]'
                              : 'bg-[#93000a]/20 text-[#ffb4ab]'
                          }`}
                        >
                          {zone.subBadge}
                        </span>
                      </div>
                      <p className="text-xs text-[#d1c6ab] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#f7bd48]">
                          explore
                        </span>
                        <span>{zone.radius}</span>
                      </p>
                    </div>

                    {/* Zone Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#221f1d] p-3 rounded-lg border border-[#383432]/40">
                      <div>
                        <span className="text-[10px] uppercase text-[#d1c6ab] block">Delivery Fee</span>
                        <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                          {zone.fee}
                        </span>
                        {zone.feeSub && (
                          <span className="text-[10px] text-[#f7bd48] block leading-tight">
                            {zone.feeSub}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#d1c6ab] block">Min. Order</span>
                        <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#e9e1dd]">
                          {zone.minOrder}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#d1c6ab] block">Est. Window</span>
                        <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#f7bd48]">
                          {zone.window}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center items-end pr-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={zone.active}
                            onChange={() => toggleZone(zone.id)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-[#383432] rounded-full peer peer-checked:bg-[#facc15] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e9e1dd] peer-checked:after:bg-[#6c5700] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                        <span
                          className={`text-[10px] font-bold mt-1 ${
                            zone.active ? 'text-[#f7bd48]' : 'text-[#d1c6ab]/60'
                          }`}
                        >
                          {zone.active ? 'ACTIVE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Operating Schedule & Ramadan */}
          <section className="bg-[#221f1d] rounded-xl p-6 shadow-md border border-[#383432]/40 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#383432]/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined">
                  more_time
                </span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                    Weekly Operating Schedule &amp; Ramadan Protocols
                  </h2>
                  <p className="text-xs text-[#d1c6ab]">
                    UAE regulatory dining windows and religious observance service shifts
                  </p>
                </div>
              </div>
            </div>

            {/* Ramadan Banner Toggle */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1e1b19] via-[#2d2927] to-[#1e1b19] my-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#f7bd48]/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ba880f]/30 flex items-center justify-center text-[#f7bd48]">
                  <span className="material-symbols-outlined text-2xl">nights_stay</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                      Ramadan Special Iftar &amp; Suhoor Schedule
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f7bd48] text-[#412d00] text-[10px] font-bold">
                      UAE Holy Month
                    </span>
                  </div>
                  <p className="text-xs text-[#d1c6ab] mt-0.5">
                    Automatically switches platform menus to Sunset Iftar sets and extends late-night Suhoor delivery to 04:00 AM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-xs text-[#f7bd48] font-semibold">
                  {ramadanEnabled ? 'Enabled for Ramadan 1446 AH' : 'Standard Routine'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ramadanEnabled}
                    onChange={(e) => {
                      setRamadanEnabled(e.target.checked);
                      showToast(
                        e.target.checked
                          ? 'Ramadan Iftar & Suhoor mode active'
                          : 'Reverted to standard service schedule',
                        'nights_stay'
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#383432] rounded-full peer peer-checked:bg-[#facc15] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e9e1dd] peer-checked:after:bg-[#6c5700] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>

            {/* Standard Schedule Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#1e1b19] space-y-3 border border-[#383432]/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#e9e1dd] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f7bd48] text-base">
                      calendar_view_week
                    </span>
                    <span>Monday - Thursday</span>
                  </span>
                  <span className="text-[11px] text-[#f7bd48] font-semibold uppercase">Regular Weekday</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#221f1d] border border-[#383432]/30">
                  <div>
                    <span className="text-[10px] uppercase text-[#d1c6ab] block">Kitchen Open</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      12:00 PM
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#d1c6ab]">arrow_forward</span>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[#d1c6ab] block">Last Dispatch</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      01:00 AM
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#d1c6ab] px-1">
                  <span>Afternoon: 12:00 - 16:30</span>
                  <span>Dinner: 18:00 - 01:00</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1e1b19] space-y-3 border border-[#383432]/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#e9e1dd] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f7bd48] text-base">
                      weekend
                    </span>
                    <span>Friday - Sunday</span>
                  </span>
                  <span className="text-[11px] text-[#f7bd48] font-semibold uppercase">Weekend Peak</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#221f1d] border border-[#383432]/30">
                  <div>
                    <span className="text-[10px] uppercase text-[#d1c6ab] block">Kitchen Open</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      12:00 PM
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#d1c6ab]">arrow_forward</span>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[#d1c6ab] block">Last Dispatch</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      02:30 AM
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#d1c6ab] px-1">
                  <span>Continuous Friday Brunch &amp; Late Night Lounge</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Operational Stats & Compliance (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Primary Save & Cloud Console Card */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-[#2d2927] to-[#221f1d] shadow-xl space-y-4 border border-[#383432]/50 sticky top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#f7bd48] uppercase tracking-widest font-semibold">
                Cloud Sync Console
              </span>
              <span className="text-[11px] text-[#d1c6ab]">AD-SERVER-09</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#e9e1dd] leading-tight">
                Instant Network Dispatch
              </h3>
              <p className="text-xs text-[#d1c6ab] mt-1">
                Changes propagate immediately across VAYORA Concierge, customer mobile applications, and private butler stations.
              </p>
            </div>
            <div className="space-y-2 p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#d1c6ab]">Zones Configured</span>
                <span className="text-[#e9e1dd] font-semibold">
                  4 Sectors ({zones.filter((z) => z.active).length} Live)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#d1c6ab]">Avg Delivery Window</span>
                <span className="text-[#f7bd48] font-semibold">32 Minutes</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#d1c6ab]">Dispatch Surcharge (VAT 5%)</span>
                <span className="text-[#e9e1dd] font-semibold">Automated</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 px-4 rounded-xl bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-tight shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-lg transition-transform group-hover:rotate-180">
                sync
              </span>
              <span>Save &amp; Update Profile</span>
            </button>
            <span className="block text-center text-[11px] uppercase text-[#d1c6ab]/80 tracking-wider">
              Live Sync across Abu Dhabi Emirates
            </span>
          </div>

          {/* UAE Tax & Financial Compliance Snapshot */}
          <div className="p-6 rounded-xl bg-[#221f1d] shadow-md space-y-4 border border-[#383432]/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">account_balance</span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Federal Tax Authority (UAE)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#f7bd48] text-xs font-bold border border-[#383432]">
                FTA Validated
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/30">
                <span className="text-[10px] uppercase text-[#d1c6ab] block">
                  TRN (Tax Registration Number)
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9] tracking-wider">
                  100-2490-8839-0003
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/30">
                <span className="text-[10px] uppercase text-[#d1c6ab] block">
                  Corporate IBAN Account
                </span>
                <span className="text-xs text-[#e9e1dd] font-semibold block font-mono">
                  AE29 0330 0000 1289 4019 92
                </span>
                <span className="text-[11px] text-[#d1c6ab] block mt-0.5">
                  First Abu Dhabi Bank (FAB) • Al Maryah Branch
                </span>
              </div>
            </div>
            <button
              onClick={() => showToast('Downloading official FTA Tax Clearance Certificate PDF', 'download')}
              className="w-full py-2 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-[#e9e1dd] text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-[#383432]/50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Download FTA Clearance PDF</span>
            </button>
          </div>

          {/* Fleet Readiness Indicator Card */}
          <div className="p-6 rounded-xl bg-[#221f1d] shadow-md space-y-4 border border-[#383432]/40">
            <div className="flex items-center justify-between">
              <span className="font-['Plus_Jakarta_Sans'] text-sm text-[#e9e1dd] font-semibold">
                Courier Fleet Saturation
              </span>
              <span className="text-xs text-[#f7bd48] font-bold">94% Fleet Health</span>
            </div>
            {/* Circular Gauge */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#383432]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-[#f7bd48]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="94, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  94%
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#e9e1dd]">18 Active Couriers Staged</p>
                <p className="text-[11px] text-[#d1c6ab]">
                  Average turnaround time from kitchen hotplate to driver thermal pod: 3.4 mins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
