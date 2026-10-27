import React, { useState } from 'react';
import { ScreenId } from '../types';

interface AnalyticsSalesScreenProps {
  onNavigate: (screen: ScreenId) => void;
  showToast: (msg: string, icon?: string) => void;
}

export default function AnalyticsSalesScreen({
  onNavigate,
  showToast,
}: AnalyticsSalesScreenProps) {
  const [dateRange, setDateRange] = useState<'today' | '7d' | 'month' | 'custom'>('month');
  const [filterQuery, setFilterQuery] = useState('');

  const batches = [
    {
      id: '#SET-2024-W43',
      trn: 'TRN-AE-1004829',
      period: 'Oct 22 - Oct 28, 2024',
      gross: 'AED 94,120.00',
      fee: '-AED 7,529.60',
      vat: 'AED 4,706.00',
      net: 'AED 81,884.40',
      bank: 'Emirates NBD • Settled',
    },
    {
      id: '#SET-2024-W42',
      trn: 'TRN-AE-1004829',
      period: 'Oct 15 - Oct 21, 2024',
      gross: 'AED 88,430.00',
      fee: '-AED 7,074.40',
      vat: 'AED 4,421.50',
      net: 'AED 76,934.10',
      bank: 'Emirates NBD • Settled',
    },
    {
      id: '#SET-2024-W41',
      trn: 'TRN-AE-1004829',
      period: 'Oct 08 - Oct 14, 2024',
      gross: 'AED 82,100.00',
      fee: '-AED 6,568.00',
      vat: 'AED 4,105.00',
      net: 'AED 71,427.00',
      bank: 'Emirates NBD • Settled',
    },
    {
      id: '#SET-2024-W40',
      trn: 'TRN-AE-1004829',
      period: 'Oct 01 - Oct 07, 2024',
      gross: 'AED 78,200.00',
      fee: '-AED 6,256.00',
      vat: 'AED 3,910.00',
      net: 'AED 68,034.00',
      bank: 'Emirates NBD • Settled',
    },
  ];

  const filteredBatches = batches.filter(
    (b) =>
      b.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      b.trn.toLowerCase().includes(filterQuery.toLowerCase()) ||
      b.period.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-6 pb-16">
      {/* Top Control Ribbon & Date Engine */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] uppercase tracking-widest font-bold">
              FTA Verified Tax Engine
            </span>
            <span className="text-[#d1c6ab] text-xs">• TRN 100482910300003</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-tight text-[#e9e1dd]">
            Financial &amp; VAT Settlement Intelligence
          </h1>
          <p className="text-sm text-[#d1c6ab]">
            Live audit reconciliations, luxury dine-out margins, and Federal Tax Authority settlement dispatches for The Grand Pavilion.
          </p>
        </div>

        {/* Quick Actions & Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#221f1d] border border-[#383432]/50 shadow-inner">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRange === 'today'
                  ? 'bg-[#2d2927] text-[#ffecb9] shadow-sm'
                  : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRange === '7d'
                  ? 'bg-[#2d2927] text-[#ffecb9] shadow-sm'
                  : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
              }`}
            >
              Last 7D
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRange === 'month'
                  ? 'bg-[#2d2927] text-[#ffecb9] shadow-sm'
                  : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
              }`}
            >
              Oct 1 - Oct 31, 2024
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                dateRange === 'custom'
                  ? 'bg-[#2d2927] text-[#ffecb9] shadow-sm'
                  : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
              }`}
            >
              <span>Custom</span>
              <span className="material-symbols-outlined text-sm">calendar_month</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                showToast('Generating official UAE FTA Tax Invoice PDF...', 'receipt_long')
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#221f1d] hover:bg-[#2d2927] text-[#e9e1dd] text-xs font-semibold border border-[#383432]/60 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#f7bd48] text-base">receipt_long</span>
              <span>Export PDF Tax Invoice</span>
            </button>
            <button
              onClick={() =>
                showToast('Exporting financial settlement CSV ledger...', 'download')
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* Executive Performance Indicators (Institutional Matrix) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Gross Platform Sales */}
        <div className="relative overflow-hidden rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#ba880f]/10 blur-xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-[#d1c6ab] font-bold">
                Gross Platform GMV
              </span>
              <span className="text-xs text-[#f7bd48] font-medium">October 2024 Consolidated</span>
            </div>
            <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined text-xl">
              payments
            </span>
          </div>
          <div className="flex flex-col mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase font-bold text-[#f7bd48]">AED</span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#ffecb9] tracking-tight">
                342,850.00
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center text-[#f7bd48] text-xs font-semibold">
                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span>+18.4%
              </span>
              <span className="text-xs text-[#d1c6ab]">vs. previous period</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders Completed */}
        <div className="relative overflow-hidden rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-[#d1c6ab] font-bold">
                Volume &amp; Demand
              </span>
              <span className="text-xs text-[#d1c6ab]">99.8% Successful delivery</span>
            </div>
            <span className="p-2 rounded-lg bg-[#2d2927] text-[#ffecb9] material-symbols-outlined text-xl">
              concierge
            </span>
          </div>
          <div className="flex flex-col mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#e9e1dd] tracking-tight">
                1,248
              </span>
              <span className="text-xs text-[#d1c6ab]">Cover Orders</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-[#d1c6ab]">Avg Basket Size:</span>
              <span className="font-semibold text-[#f7bd48]">AED 274.70 / guest</span>
            </div>
          </div>
        </div>

        {/* Card 3: UAE 5% VAT Collected */}
        <div className="relative overflow-hidden rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-[#f7bd48] font-bold">
                FTA 5% Statutory VAT
              </span>
              <span className="text-xs text-[#d1c6ab]">Segregated Escrow Account</span>
            </div>
            <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined text-xl">
              account_balance
            </span>
          </div>
          <div className="flex flex-col mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase font-bold text-[#f7bd48]">AED</span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#ffecb9] tracking-tight">
                17,142.50
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-xs font-semibold">
                Q4 Ready to File
              </span>
              <span className="text-xs text-[#d1c6ab]">Due Nov 28</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Restaurant Settlement */}
        <div className="relative overflow-hidden rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-[#d1c6ab] font-bold">
                Net Net Payout
              </span>
              <span className="text-xs text-[#d1c6ab]">Post-Commission &amp; Fees</span>
            </div>
            <span className="p-2 rounded-lg bg-[#2d2927] text-[#facc15] material-symbols-outlined text-xl">
              assured_workload
            </span>
          </div>
          <div className="flex flex-col mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase font-bold text-[#f7bd48]">AED</span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#ffecb9] tracking-tight">
                298,280.00
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#f7bd48]" />
              <span className="text-xs text-[#d1c6ab]">Auto-Dispatched: Emirates NBD VIP Corporate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Macro Analytical Split: Revenue Velocity & Culinary Item Performance */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Visual Sales Trajectory Chart (8 cols) */}
        <div className="xl:col-span-8 rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[10px] text-[#f7bd48] uppercase tracking-wider font-bold">
                Shift Dynamics
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#e9e1dd]">
                Revenue by Meal Period &amp; Peak Hour Distribution
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#facc15]" />
                <span className="text-xs text-[#d1c6ab]">Dinner Rush (62%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#f7bd48]" />
                <span className="text-xs text-[#d1c6ab]">Lunch (28%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#383432]" />
                <span className="text-xs text-[#d1c6ab]">Late Night (10%)</span>
              </div>
            </div>
          </div>

          {/* Custom SVG Revenue Trajectory Graph */}
          <div className="relative w-full h-56 flex items-end my-2">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 200">
              <defs>
                <linearGradient id="goldGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lunchGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#f7bd48" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f7bd48" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid Guides */}
              <line stroke="#383432" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="760" y1="20" y2="20" />
              <line stroke="#383432" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="760" y1="75" y2="75" />
              <line stroke="#383432" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="760" y1="130" y2="130" />
              <line stroke="#383432" strokeWidth="1" x1="0" x2="760" y1="185" y2="185" />
              {/* Shaded Area Chart: Dinner Dominance */}
              <path
                d="M 0,160 Q 95,150 190,135 T 380,80 T 570,30 T 760,110 L 760,185 L 0,185 Z"
                fill="url(#goldGlow)"
              />
              {/* Smooth Line Chart: Total Dynamic GMV */}
              <path
                d="M 0,160 Q 95,150 190,135 T 380,80 T 570,30 T 760,110"
                fill="none"
                stroke="#facc15"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
              {/* Smooth Line Chart: Lunch Service Secondary */}
              <path
                d="M 0,175 Q 95,140 190,105 T 380,140 T 570,160 T 760,175"
                fill="none"
                stroke="#f7bd48"
                strokeDasharray="6 3"
                strokeWidth="2"
              />
              {/* Interactive Highlight Nodes */}
              <circle cx="570" cy="30" fill="#facc15" r="5" stroke="#161311" strokeWidth="2" />
              <circle cx="190" cy="105" fill="#f7bd48" r="4" stroke="#161311" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[#d1c6ab] text-[11px] font-mono pt-3 border-t border-[#383432]/30">
            <span>12:00 (Lunch Start)</span>
            <span>15:00 (Afternoon Tea)</span>
            <span>19:30 (Peak Dinner Service)</span>
            <span>22:00 (Royal Service)</span>
            <span>01:00 (Lounge Wrap)</span>
          </div>

          {/* Shift Proportional Summary Strip */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 bg-[#2d2927]/40 p-4 rounded-lg border border-[#383432]/30">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#f7bd48] font-bold">DINNER CRITICAL</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                AED 212,567.00
              </span>
              <span className="text-xs text-[#d1c6ab]">774 Covers Served</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#d1c6ab] font-bold">LUNCH SERVICE</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-[#e9e1dd]">
                AED 95,998.00
              </span>
              <span className="text-xs text-[#d1c6ab]">349 Covers Served</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#d1c6ab] font-bold">LATE NIGHT LOUNGE</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-[#e9e1dd]">
                AED 34,285.00
              </span>
              <span className="text-xs text-[#d1c6ab]">125 Covers Served</span>
            </div>
          </div>
        </div>

        {/* Zone Distribution Donut (4 cols) */}
        <div className="xl:col-span-4 rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#f7bd48] uppercase font-bold tracking-wider">
                Geo-Territorial Reach
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#e9e1dd]">
                Delivery Zones
              </h2>
            </div>
            <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined text-xl">
              share_location
            </span>
          </div>

          {/* Donut Visual Breakdown */}
          <div className="flex items-center justify-center my-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#2d2927" strokeWidth="12" />
                {/* Al Maryah (38%) */}
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="38"
                  stroke="#facc15"
                  strokeDasharray="90.7 238.7"
                  strokeDashoffset="0"
                  strokeWidth="12"
                />
                {/* Saadiyat (32%) */}
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="38"
                  stroke="#f7bd48"
                  strokeDasharray="76.4 238.7"
                  strokeDashoffset="-90.7"
                  strokeWidth="12"
                />
                {/* Al Bateen (18%) */}
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="38"
                  stroke="#ba880f"
                  strokeDasharray="43 238.7"
                  strokeDashoffset="-167.1"
                  strokeWidth="12"
                />
                {/* Other Zones (12%) */}
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="38"
                  stroke="#4d4632"
                  strokeDasharray="28.6 238.7"
                  strokeDashoffset="-210.1"
                  strokeWidth="12"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase text-[#d1c6ab] font-bold">Primary Hub</span>
                <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                  38%
                </span>
                <span className="text-[11px] text-[#f7bd48] font-semibold">Al Maryah</span>
              </div>
            </div>
          </div>

          {/* Zone List Items */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#2d2927]/60 border border-[#383432]/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                <span className="text-xs text-[#e9e1dd]">Al Maryah Island (Financial Hub)</span>
              </div>
              <span className="text-xs text-[#ffecb9] font-semibold">AED 130,283 (38%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#2d2927]/60 border border-[#383432]/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f7bd48]" />
                <span className="text-xs text-[#e9e1dd]">Saadiyat Island Resorts &amp; Villas</span>
              </div>
              <span className="text-xs text-[#e9e1dd] font-semibold">AED 109,712 (32%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#2d2927]/60 border border-[#383432]/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba880f]" />
                <span className="text-xs text-[#e9e1dd]">Al Bateen Marina Mansions</span>
              </div>
              <span className="text-xs text-[#e9e1dd] font-semibold">AED 61,713 (18%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#2d2927]/60 border border-[#383432]/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4d4632]" />
                <span className="text-xs text-[#d1c6ab]">Yas Bay &amp; Al Raha Beach</span>
              </div>
              <span className="text-xs text-[#d1c6ab] font-medium">AED 41,142 (12%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Culinary Stars & Operational Health Matrix */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Top 3 Best-Selling Dishes (7 cols) */}
        <div className="xl:col-span-7 rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] text-[#f7bd48] uppercase tracking-wider font-bold">
                Signature Revenue Drivers
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#e9e1dd]">
                Top Signature Culinary Selections
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#2d2927] text-[#d1c6ab] text-xs">
              Ranked by Volume
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Dish 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#2d2927]/60 hover:bg-[#2d2927] transition-colors border border-[#383432]/40">
              <div className="flex items-center gap-3">
                <img
                  className="w-14 h-14 rounded-lg object-cover shadow-sm"
                  alt="Glazed Chilean Sea Bass"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ4qkUyu-YGFjvYX7lk7-qQp4Ap73mH3cu18Orz-5TrutKYc0r2Vw6Mlvb25hZfhsCNGiTqT_FGLEcm0s5cejWkO_t8hBxQpBW7Suap27sd0XgoAGJ4sjG2FqLSKxlQgX1YRy7rBHCeg0i_fo-kvc8M5PRPQ6rCiA-GNobHr5yO5wvfP0vhsNsjv4ur1JOBIzpSg4ssWrqBBYrxpUZJKqGOAArGUO6y4lOPdr0H0nur2DFYrwtPls"
                />
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9] leading-tight">
                    Glazed Chilean Sea Bass
                  </span>
                  <span className="text-xs text-[#d1c6ab]">
                    White Miso • Shiso Leaf Emulsion • Yuzu Caviar
                  </span>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                    312
                  </span>
                  <span className="text-xs text-[#d1c6ab]">Orders</span>
                </div>
                <span className="text-xs text-[#f7bd48] font-semibold">AED 84,240</span>
              </div>
            </div>

            {/* Dish 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#2d2927]/60 hover:bg-[#2d2927] transition-colors border border-[#383432]/40">
              <div className="flex items-center gap-3">
                <img
                  className="w-14 h-14 rounded-lg object-cover shadow-sm"
                  alt="Wagyu Ribeye MB9"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNCkfUd4Ovh3NmTlKL2kWS-mZQpb48m1Ue08CwVGWKcH_4DzNmJmuPZYn3PGnlw0lOnSf0I-Ouv6AkTIFfAWZ1cKmBR5UeJFYddCzpPcp6Ohlk1Oqo_UNLAYILyiRrRbSRrUsyIkb-o4pavEfR46T8cE2T9-B9K_4fglxr6C4C3LFdv8ASnyz3dZPBWFe6eysWdrcwRkB6zxwZg_Bih2BHvXEaDrDiAor9dQssjGiyTCZH434LjUE"
                />
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9] leading-tight">
                    Wagyu Ribeye MB9 (400g)
                  </span>
                  <span className="text-xs text-[#d1c6ab]">
                    Smoked Black Garlic • Bone Marrow Demi-Glace
                  </span>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                    204
                  </span>
                  <span className="text-xs text-[#d1c6ab]">Orders</span>
                </div>
                <span className="text-xs text-[#f7bd48] font-semibold">AED 91,800</span>
              </div>
            </div>

            {/* Dish 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#2d2927]/60 hover:bg-[#2d2927] transition-colors border border-[#383432]/40">
              <div className="flex items-center gap-3">
                <img
                  className="w-14 h-14 rounded-lg object-cover shadow-sm"
                  alt="Alba Black Truffle Risotto"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGFt1JC2MCGal4E1fpa98YELeM0rmirUzeNZBT7TmlmgFVy978evRQQGpKUvVwIP9D2ngF_MPbkBxWowzTyDuSqJZ_KT0mJf4fMDSc1S9KZJ4LYGUd22N4juB_sgO0Zm0v1lkgWRX1v49xk0m37EgnpG-w4c47eyyg360KQaqGAE4dytlHR-UL1mP8MtJ4swU3xSneVcWuJ6WIH01SeB7MKAMIro7e0xNPUjMzKiaZW5L2RgMMxi8"
                />
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9] leading-tight">
                    Alba Black Truffle Risotto
                  </span>
                  <span className="text-xs text-[#d1c6ab]">
                    Acquerello Aged Rice • Parmigiano 36M • Forest Jus
                  </span>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                    188
                  </span>
                  <span className="text-xs text-[#d1c6ab]">Orders</span>
                </div>
                <span className="text-xs text-[#f7bd48] font-semibold">AED 37,600</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Health & Service SLA (5 cols) */}
        <div className="xl:col-span-5 rounded-xl bg-[#221f1d] p-6 flex flex-col justify-between shadow-lg border border-[#383432]/40">
          <div>
            <span className="text-[10px] text-[#f7bd48] uppercase tracking-wider font-bold">
              Operational Rigor
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#e9e1dd] mb-4">
              Kitchen Fulfillment &amp; Service Health
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Metric 1 */}
              <div className="p-4 rounded-xl bg-[#2d2927] border border-[#383432]/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#e9e1dd]">Kitchen Fulfillment Rate</span>
                  <span className="font-['Plus_Jakarta_Sans'] text-sm text-[#f7bd48] font-bold">
                    99.2%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#100e0c] overflow-hidden">
                  <div className="h-full bg-[#f7bd48] rounded-full" style={{ width: '99.2%' }} />
                </div>
                <span className="text-[11px] text-[#d1c6ab] mt-2 inline-block">
                  3 rejections across 1,248 orders (strictly inventory zero-stock triggers).
                </span>
              </div>

              {/* Metric 2 */}
              <div className="p-4 rounded-xl bg-[#2d2927] border border-[#383432]/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#e9e1dd]">Guest Experience Index</span>
                  <div className="flex items-center gap-1 text-[#facc15]">
                    <span className="material-symbols-outlined text-base">star</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold">4.93</span>
                    <span className="text-[#d1c6ab] text-xs">/ 5.0</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#100e0c] overflow-hidden">
                  <div className="h-full bg-[#facc15] rounded-full" style={{ width: '98.6%' }} />
                </div>
                <span className="text-[11px] text-[#d1c6ab] mt-2 inline-block">
                  Direct VIP feedback rated temperature, plating precision, and speed.
                </span>
              </div>

              {/* Metric 3 */}
              <div className="p-4 rounded-xl bg-[#2d2927] border border-[#383432]/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#e9e1dd]">Courier Expedite Handover</span>
                  <span className="font-['Plus_Jakarta_Sans'] text-sm text-[#ffecb9] font-bold">
                    1.4 mins
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#100e0c] overflow-hidden">
                  <div className="h-full bg-[#ba880f] rounded-full" style={{ width: '92%' }} />
                </div>
                <span className="text-[11px] text-[#d1c6ab] mt-2 inline-block">
                  Heated staging pass-through under maître d' inspection.
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Seal */}
          <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-[#100e0c]/80 border border-[#383432]/50">
            <span className="material-symbols-outlined text-[#f7bd48] text-2xl">verified_user</span>
            <div className="flex flex-col">
              <span className="text-xs text-[#e9e1dd] font-semibold">
                ADAFSA Grade-A Excellence Verified
              </span>
              <span className="text-[11px] text-[#d1c6ab]">
                Abu Dhabi Agriculture and Food Safety Authority active compliance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Financial Ledger & UAE Tax Settlement Table */}
      <section className="rounded-xl bg-[#221f1d] p-6 shadow-lg flex flex-col gap-4 border border-[#383432]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#383432]/30">
          <div>
            <span className="text-[10px] text-[#f7bd48] uppercase tracking-wider font-bold">
              Statutory Audit Trail
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-[#e9e1dd]">
              Weekly Settlement Batches &amp; VAT Distribution
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#d1c6ab] text-base">
                filter_list
              </span>
              <input
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-[#2d2927] text-[#e9e1dd] text-xs placeholder:text-[#d1c6ab]/40 border border-[#383432]/50 focus:outline-none focus:border-[#f7bd48]"
                placeholder="Filter batch ID or TRN..."
                type="text"
              />
            </div>
            <button
              onClick={() => showToast('Sorting batches chronologically', 'arrow_drop_down')}
              className="px-3 py-1.5 rounded-lg bg-[#2d2927] text-[#e9e1dd] hover:text-[#ffecb9] text-xs flex items-center gap-1 border border-[#383432]/50 transition-colors cursor-pointer"
            >
              <span>Sort By Date</span>
              <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
            </button>
          </div>
        </div>

        {/* Data Ledger Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#100e0c]/60 text-[#d1c6ab] text-[11px] uppercase tracking-wider border-b border-[#383432]/40">
                <th className="py-3 px-4 rounded-l-lg">Settlement Ref / Batch</th>
                <th className="py-3 px-4">Cycle Period</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">VAYORA Fee (8%)</th>
                <th className="py-3 px-4">UAE 5% VAT (FTA)</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Bank Disbursement</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Tax File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383432]/40">
              {filteredBatches.map((b) => (
                <tr key={b.id} className="hover:bg-[#2d2927]/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#ffecb9]">{b.id}</span>
                      <span className="text-[11px] text-[#d1c6ab]">{b.trn}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-[#e9e1dd]">{b.period}</td>
                  <td className="py-4 px-4 text-xs font-bold text-[#e9e1dd]">{b.gross}</td>
                  <td className="py-4 px-4 text-xs text-[#ffb4ab]">{b.fee}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-xs font-semibold">
                      {b.vat}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffecb9]">
                      {b.net}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#f7bd48]" />
                      <span className="text-xs text-[#e9e1dd]">{b.bank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() =>
                        showToast(`Tax invoice for ${b.id} downloaded (PDF-A3)`, 'download')
                      }
                      className="p-1.5 rounded-lg bg-[#2d2927] hover:bg-[#ba880f] hover:text-[#392700] text-[#e9e1dd] transition-all cursor-pointer"
                      title="Download Tax Invoice"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Ledger Summarizer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-2 text-[#d1c6ab] text-xs border-t border-[#383432]/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#f7bd48] text-base">lock</span>
            <span>Cryptographically signed with UAE FTA e-Invoicing standard XML/PDF-A3.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Showing {filteredBatches.length} completed weekly cycles for Oct 2024</span>
            <button
              onClick={() => showToast('Loading Q2 & Q3 historic records...', 'history')}
              className="text-[#f7bd48] hover:text-[#ffecb9] font-semibold transition-colors cursor-pointer"
            >
              View Prior Quarters →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
