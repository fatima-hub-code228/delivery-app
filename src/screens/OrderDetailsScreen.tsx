import React, { useState } from 'react';
import { ScreenId } from '../types';
import { syncOrderToSupabase, logPartnerAction } from '../lib/supabase';

interface OrderDetailsScreenProps {
  orderId?: string;
  onNavigate: (screen: ScreenId) => void;
}

export default function OrderDetailsScreen({
  orderId = 'VY-9021',
  onNavigate,
}: OrderDetailsScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [delayAdded, setDelayAdded] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleToggleReady = () => {
    const nextState = !isReady;
    setIsReady(nextState);
    if (nextState) {
      syncOrderToSupabase(orderId, 'ready_for_pickup', { courier: 'Ahmed R.' });
      showToast('Ahmed R. signaled: Order #VY-9021 ready (synced to Supabase).');
    } else {
      syncOrderToSupabase(orderId, 'cooking', { note: 'reverted to in-prep' });
      showToast('Order status reverted to Cooking in Progress.');
    }
  };

  const handleDelay = (mins: number) => {
    setDelayAdded((prev) => prev + mins);
    syncOrderToSupabase(orderId, 'delayed', { minutes: mins, total_delay: delayAdded + mins });
    showToast(`Delay recorded (+${mins}m). Synced to Supabase.`);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Context Navigation & Meta Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('live-orders')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#f7bd48] hover:text-[#ffecb9] transition-colors group"
        >
          <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span>Back to Live Orders</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-[#d1c6ab] uppercase tracking-wider">
            Kitchen Order Ticket ID
          </span>
          <span className="px-2 py-0.5 rounded bg-[#2d2927] text-[#ffecb9] font-bold text-xs border border-[#383432]">
            KOT-88402-A
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 lg:p-8 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#facc15]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9] tracking-tight">
              Order #{orderId}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ba880f]/20 border border-[#ba880f]/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#f7bd48] animate-pulse" />
              <span className="text-[10px] text-[#f7bd48] font-bold uppercase tracking-wider">
                {isReady ? 'READY FOR COURIER' : `PREPARING (${14 + delayAdded} mins elapsed)`}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2d2927] text-[#f1eddd] text-[10px] font-semibold uppercase tracking-wider border border-[#383432]">
              Priority Dining
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#d1c6ab]">
            <span className="flex items-center gap-1 text-[#e9e1dd]">
              <span className="material-symbols-outlined text-xs text-[#f7bd48]">schedule</span>
              Placed at 19:42 GST
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#f7bd48]">location_on</span>
              Delivery Zone: Saadiyat Cultural District, Abu Dhabi
            </span>
            <span>•</span>
            <span className="text-[#f7bd48] font-medium">
              Target Kitchen Dispatch: 20:{'02'} GST ({6 + delayAdded}m left)
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => {
              window.print();
              showToast('Kitchen Order Ticket sent to Hot Line Thermal Printer 1.');
            }}
            className="px-4 py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-[#e9e1dd] text-xs font-semibold flex items-center gap-2 border border-[#383432] transition-colors"
          >
            <span className="material-symbols-outlined text-base text-[#f7bd48]">print</span>
            <span>Print KOT</span>
          </button>
          <button
            onClick={handleToggleReady}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_16px_rgba(250,204,21,0.25)] flex items-center gap-2 ${
              isReady
                ? 'bg-[#f7bd48] text-[#412d00]'
                : 'bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700]'
            }`}
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{isReady ? 'Ready for Courier (Notified)' : 'Mark Ready for Courier'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 7 cols left, 5 cols right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Stepper / Kitchen Fulfillment Pipeline */}
          <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-md flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">conversion_path</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Kitchen Fulfillment Pipeline
                </h2>
              </div>
              <div className="text-xs text-[#d1c6ab]">
                <span>Automated telemetry: </span>
                <span className="text-[#f7bd48] font-bold">Active</span>
              </div>
            </div>

            {/* 6-Stage Timeline */}
            <div className="relative py-2">
              <div className="absolute top-4 left-4 right-4 h-1 bg-[#2d2927] rounded-full" />
              <div
                className="absolute top-4 left-4 h-1 bg-gradient-to-r from-[#ba880f] via-[#facc15] to-[#f7bd48] rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all duration-500"
                style={{ width: isReady ? '66%' : '41%' }}
              />

              <div className="grid grid-cols-6 gap-1 relative z-10 text-center">
                {/* 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#f7bd48] text-[#412d00] flex items-center justify-center text-xs font-bold shadow-md">
                    <span className="material-symbols-outlined text-sm font-bold">done</span>
                  </div>
                  <span className="mt-1.5 text-xs font-semibold text-[#e9e1dd]">Received</span>
                  <span className="text-[10px] text-[#d1c6ab]">19:42</span>
                </div>

                {/* 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#f7bd48] text-[#412d00] flex items-center justify-center text-xs font-bold shadow-md">
                    <span className="material-symbols-outlined text-sm font-bold">kitchen</span>
                  </div>
                  <span className="mt-1.5 text-xs font-semibold text-[#e9e1dd]">Accepted</span>
                  <span className="text-[10px] text-[#d1c6ab]">19:43</span>
                </div>

                {/* 3 */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#facc15] text-[#6c5700] flex items-center justify-center text-xs font-bold shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-pulse">
                    <span className="material-symbols-outlined text-sm font-bold">skillet</span>
                  </div>
                  <span className="mt-1.5 text-xs font-bold text-[#ffecb9]">Cooking</span>
                  <span className="text-[10px] text-[#f7bd48] font-bold">
                    {14 + delayAdded}m In Prep
                  </span>
                </div>

                {/* 4 */}
                <div className={`flex flex-col items-center ${isReady ? 'opacity-100' : 'opacity-50'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isReady ? 'bg-[#f7bd48] text-[#412d00]' : 'bg-[#2d2927] text-[#d1c6ab]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">inventory_2</span>
                  </div>
                  <span className="mt-1.5 text-xs font-semibold text-[#d1c6ab]">Packed</span>
                  <span className="text-[10px] text-[#d1c6ab]/70">Est 20:00</span>
                </div>

                {/* 5 */}
                <div className="flex flex-col items-center opacity-50">
                  <div className="w-8 h-8 rounded-full bg-[#2d2927] text-[#d1c6ab] flex items-center justify-center text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">moped</span>
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#d1c6ab]">Courier</span>
                  <span className="text-[10px] text-[#d1c6ab]/70">Est 20:03</span>
                </div>

                {/* 6 */}
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-[#2d2927] text-[#d1c6ab] flex items-center justify-center text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">check_circle_outline</span>
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#d1c6ab]">Delivered</span>
                  <span className="text-[10px] text-[#d1c6ab]/70">Est 20:22</span>
                </div>
              </div>
            </div>

            {/* Delay Reporting Module */}
            <div className="p-3.5 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#f7bd48] text-base">alarm_on</span>
                <div>
                  <span className="text-xs font-medium text-[#e9e1dd] block">
                    Need more kitchen time?
                  </span>
                  <span className="text-[11px] text-[#d1c6ab]">
                    Notifies courier and concierge automatically
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelay(5)}
                  className="px-3 py-1.5 rounded bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#ffecb9] transition-colors"
                >
                  +5 mins
                </button>
                <button
                  onClick={() => handleDelay(10)}
                  className="px-3 py-1.5 rounded bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#ffecb9] transition-colors"
                >
                  +10 mins
                </button>
                <button
                  onClick={() => showToast('Calling courier Ahmed R. via dispatch terminal line...')}
                  className="px-3 py-1.5 rounded bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#f7bd48] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>Contact Courier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Itemized Order Dishes Card */}
          <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">restaurant</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Order Items (3 dishes • 4 portions)
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#2d2927] text-[#f7bd48] text-[10px] font-bold uppercase tracking-wider border border-[#383432]">
                100% Halal Certified
              </span>
            </div>

            <div className="space-y-3">
              {/* Dish 1 */}
              <div className="p-3.5 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-start gap-4 hover:bg-[#2d2927] transition-all">
                <img
                  alt="Sea Bass"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-bz7Kxf0zyJxDs6jGLP3Ln5GszK5T6kokX2ANYo_paLzwn5D7EMmAuyUs4WwbIOBZIgSARlvZC5vzdXBTfhh9XjxSAwJZFPmog6PdpCLfUjqHeBFI1SjiznbLcJ554fyERrhXCLC9aM5wfHP76zjhGV-lg1kmEeJFtpAAZMh_dMmSe17TbJXNEHarWPkfD2jyv_n9R4Eh5ccmksJHhwqkPsBUAalL90a1hb5jDfRTfb2-5FRdpSw"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#ba880f]/20 text-[#f7bd48] text-xs font-bold flex items-center justify-center">
                          2x
                        </span>
                        <h3 className="text-sm font-bold text-[#e9e1dd]">
                          Charcoal Grilled Chilean Sea Bass
                        </h3>
                      </div>
                      <p className="text-xs text-[#d1c6ab] mt-0.5">
                        Signature Patagonian catch, asparagus velouté, charred Meyer lemon
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                        360.00
                      </span>
                      <span className="block text-[10px] text-[#f7bd48] uppercase font-semibold">
                        AED (180.00 ea)
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ba880f]/20 text-[#f7bd48] text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-xs">priority_high</span>
                    <span>Guest Note: Gluten free lemon butter</span>
                  </div>
                </div>
              </div>

              {/* Dish 2 */}
              <div className="p-3.5 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-start gap-4 hover:bg-[#2d2927] transition-all">
                <img
                  alt="Risotto"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdpehBjY2lpTEHbHjYDEwV_DVu932xrqvD3qqpzF1kH9R3BnihlIGAX049RLZubSJrSHTRQzZRQmthbQ4lJy6xbTggR386JxT08kzumckZg_yL80IN5TjDuBI3w0ykduNziwBCj1FvR_PDFjXpD9MtWEgeaSGX8Y7XhnimqePeGQ_2f_JEM9veyHakQatZtBCEzgQsgjW2eFS0jQytsTu_u28Lq8B82t6Pvvi0eL_lswqabuBZ3rw"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#ba880f]/20 text-[#f7bd48] text-xs font-bold flex items-center justify-center">
                          1x
                        </span>
                        <h3 className="text-sm font-bold text-[#e9e1dd]">
                          Acquerello Truffle Risotto with 24K Gold Leaf
                        </h3>
                      </div>
                      <p className="text-xs text-[#d1c6ab] mt-0.5">
                        7-year aged carnaroli, Norcia black truffle, 24K edible gold sheets
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                        165.00
                      </span>
                      <span className="block text-[10px] text-[#f7bd48] uppercase font-semibold">
                        AED
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2d2927] text-[#ffecb9] text-[11px] font-semibold border border-[#383432]">
                    <span className="material-symbols-outlined text-xs text-[#f7bd48]">verified</span>
                    <span>VIP Presentation Standard</span>
                  </div>
                </div>
              </div>

              {/* Dish 3 */}
              <div className="p-3.5 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-start gap-4 hover:bg-[#2d2927] transition-all">
                <img
                  alt="Pudding"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtUV9zTs0s1aDGHtP-1noKnohDexaduDbVkoUyl65p3SufL6CCEZG29sbypiedeSHccjc-3tJliq9Fn3A_BLBtpeMXxmljiclJHOFknp-oRZjb1tD7X2QJW-Vp1Il0mztDVGePEnid8ZewqSI1cLu9mIF1RYz5Dq5-YXFApRr6TsCeIUUUjxHcuSsPtlL82opONRDjvjJDkSjNNP8c-zp_DXS0lVTlB-HgEp_r2bpFzvqLm_oSQ5k"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#ba880f]/20 text-[#f7bd48] text-xs font-bold flex items-center justify-center">
                          1x
                        </span>
                        <h3 className="text-sm font-bold text-[#e9e1dd]">
                          Traditional Emirati Saffron Date Pudding
                        </h3>
                      </div>
                      <p className="text-xs text-[#d1c6ab] mt-0.5">
                        Organic Liwa dates, warm saffron cardamom caramel, crushed pistachio
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                        60.00
                      </span>
                      <span className="block text-[10px] text-[#f7bd48] uppercase font-semibold">
                        AED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Settlement Calculation */}
          <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">
                  account_balance_wallet
                </span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Institutional Settlement Calculation
                </h2>
              </div>
              <span className="text-[11px] text-[#d1c6ab]">FTA TRN 100294819400003</span>
            </div>

            <div className="space-y-1.5 text-xs text-[#e9e1dd]">
              <div className="flex justify-between py-1 px-2 rounded bg-[#221f1d]">
                <span className="text-[#d1c6ab]">Food &amp; Beverage Gross Subtotal</span>
                <span className="font-semibold">AED 585.00</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded">
                <span className="text-[#d1c6ab]">Restaurant Packaging Eco-Fee</span>
                <span className="font-semibold">AED 10.00</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded">
                <span className="text-[#d1c6ab]">UAE 5.0% Federal Value Added Tax (VAT)</span>
                <span className="font-semibold">AED 29.75</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded text-[#ffb4ab]">
                <span>VAYORA Platform Commission (12.0% - Tier 1)</span>
                <span className="font-semibold">- AED 70.20</span>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="p-4 rounded-xl bg-[#2d2927] border border-[#ba880f]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#facc15]" />
              <div className="pl-2">
                <span className="text-[10px] text-[#f7bd48] font-bold uppercase tracking-wider block">
                  Net Partner Payout (Today's Batch)
                </span>
                <span className="text-xs text-[#d1c6ab]">
                  Direct settlement to Emirates NBD Business Acc •••• 4019
                </span>
              </div>
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-xs text-[#f7bd48] font-bold">AED</span>
                <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9] leading-none">
                  554.55
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Customer Dossier */}
          <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-lg">star</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Customer Dossier
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ba880f] text-[#392700] text-[10px] font-bold uppercase tracking-wider">
                VIP Tier 1
              </span>
            </div>

            <div className="flex items-start gap-4 pt-1">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#2d2927] flex items-center justify-center text-[#ffecb9] font-['Plus_Jakarta_Sans'] text-lg font-bold border border-[#ba880f]/40">
                  MA
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#facc15] text-[#6c5700] text-[10px] flex items-center justify-center font-bold">
                  ★
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  H.E. Dr. Mansoor Al-Ketbi
                </h3>
                <p className="text-xs text-[#d1c6ab] mt-0.5">
                  High-Value Patron • 48 fulfilled lifetime orders
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded bg-[#221f1d] text-[11px] text-[#e9e1dd]">
                    Average Check: AED 610
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#221f1d] text-[11px] text-[#f7bd48]">
                    0 Complaints
                  </span>
                </div>
              </div>
            </div>

            {/* Masked Relay Communication */}
            <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#f7bd48] text-lg">shield_person</span>
                <div>
                  <span className="text-[10px] text-[#d1c6ab] uppercase font-bold block">
                    Masked VAYORA Relay
                  </span>
                  <span className="text-xs font-semibold text-[#e9e1dd]">+971 50 *** 9211</span>
                </div>
              </div>
              <button
                onClick={() => showToast('Connecting encrypted relay line to Dr. Mansoor Al-Ketbi...')}
                className="px-3 py-1.5 rounded bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#f7bd48] flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                <span>Relay Call</span>
              </button>
            </div>
          </div>

          {/* Delivery Location & Map */}
          <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-lg">map</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Delivery Location
                </h2>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#f7bd48]">Saadiyat Zone A</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#ffecb9]">Saadiyat Beach Villas, Gate 4</span>
                <span className="px-2 py-0.5 rounded bg-[#2d2927] text-xs text-[#e9e1dd]">Villa 18-B</span>
              </div>
              <span className="text-xs text-[#d1c6ab] block mt-0.5">
                Al Saadiyat Island, Cultural District, Abu Dhabi, UAE
              </span>
            </div>

            {/* Gate Instruction */}
            <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#f7bd48] text-base mt-0.5">vpn_key</span>
              <div>
                <span className="text-[10px] text-[#f7bd48] font-bold uppercase tracking-wider block">
                  Gate Clearance Verified
                </span>
                <p className="text-xs text-[#e9e1dd] mt-0.5 leading-relaxed">
                  “Security pre-cleared for VAYORA courier. Drive through Gate 4 express lane and drop at primary foyer.”
                </p>
              </div>
            </div>

            {/* Map Preview */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#383432] group">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATfXF_oPUWa9scJM3aScJ_lPYIZ7BCUXQ4ARfzTapa_NQ03Y8V3zLclKo2BFULyshA5JLZ3tELo_OREXmIdg7MsL7sCzio5PEIujJiYm-_pYkZg7fjAdS14BYkviojzh0cCfsU4iE2RsxMonQdVpUM8Fq9O2yCOwlSmvm9XITZUCfokdoa4CmFJBE__AbhgPvP9Nw0OtFKh4dKP5A9AOq-2S3VChnKjvZ8LI3ZbmcUm9kvW80MdP8')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100e0c]/90 via-transparent to-transparent flex items-end justify-between p-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e1b19]/90 backdrop-blur-md text-[11px] text-[#e9e1dd]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48] animate-ping" />
                  <span>Destination: 6.4 km (11 min drive)</span>
                </div>
                <button
                  onClick={() => showToast('Opening high-precision satellite telemetry map...')}
                  className="px-2.5 py-1 rounded-full bg-[#2d2927] hover:bg-[#383432] text-xs text-[#f7bd48] flex items-center gap-1 transition-colors"
                >
                  <span>Expand Map</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </button>
              </div>
            </div>
          </div>

          {/* Assigned VAYORA Courier */}
          <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-lg">two_wheeler</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Assigned VAYORA Courier
                </h2>
              </div>
              <div className="flex items-center gap-1 text-[#f7bd48] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#f7bd48] animate-pulse" />
                <span>Approaching Venue</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    alt="Courier"
                    className="w-12 h-12 rounded-full object-cover border border-[#f7bd48]/40"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6jzEAsZdkIFWm2sLBIx7WuoHC5tzsbfRQuLJDRIZDY67t3HueTSGCS07QGiKC4opzJ9JziminpGLOm4KifjQQjK3-JqD6d1MGxyE-gjwP7v0mxKgQD7CADthG91nztQs576R_SZWTBV1xi7JTECUr8uAA33-Mnl2g9Tz5ChBiHnNnblSf8EfTgSxDzny214MFX_CSQhMbPyABhsCx2A2TU42DC93u2nqd54S_yt_7PgV4t9UpMCY"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#f7bd48] ring-2 ring-[#221f1d]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#e9e1dd]">Ahmed R.</span>
                    <span className="text-xs text-[#facc15] font-bold">★ 4.98</span>
                  </div>
                  <span className="text-[11px] text-[#d1c6ab] block">
                    VAYORA Premier Fleet #284
                  </span>
                  <span className="text-[10px] text-[#f7bd48]">
                    Yamaha AD-8831 (Thermal Heated Box)
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#d1c6ab] uppercase font-bold block">
                  ETA To Kitchen
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#f7bd48] leading-none block mt-0.5">
                  4 min
                </span>
                <span className="text-[10px] text-[#d1c6ab]/70">0.8 km away</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => showToast('Opening dispatch chat with Ahmed R....')}
                className="py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#e9e1dd] flex items-center justify-center gap-2 transition-colors border border-[#383432]"
              >
                <span className="material-symbols-outlined text-base text-[#f7bd48]">chat</span>
                <span>Live Chat</span>
              </button>
              <button
                onClick={() => showToast('Connecting direct driver line +971 52 *** 4402...')}
                className="py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#f7bd48] flex items-center justify-center gap-2 transition-colors border border-[#383432]"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Direct Call</span>
              </button>
            </div>
          </div>
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
