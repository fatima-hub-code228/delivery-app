import React, { useState, useEffect } from 'react';
import { playOrderChime } from '../components/AudioChime';
import { ScreenId } from '../types';
import { syncOrderToSupabase } from '../lib/supabase';

interface LiveOrdersScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenOrderDetails: (orderId: string) => void;
  chimeActive: boolean;
  onToggleChime: () => void;
}

export default function LiveOrdersScreen({
  onNavigate,
  onOpenOrderDetails,
  chimeActive,
  onToggleChime,
}: LiveOrdersScreenProps) {
  const [activeTab, setActiveTab] = useState<'incoming' | 'kitchen' | 'ready' | 'dispatched' | 'delivered'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('saadiyat');
  const [autoDispatch, setAutoDispatch] = useState(true);

  // Countdown timer for Order 1 & 2
  const [countdownSeconds, setCountdownSeconds] = useState(108); // 01:48
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // State for interactive orders
  const [incomingList, setIncomingList] = useState([
    {
      id: 'VY-9021',
      displayId: '#VY-9021',
      tier: 'VIP Platinum',
      tierColor: 'bg-[#ffe083] text-[#231b00]',
      customer: 'Dr. Mansoor Al-Ketbi',
      dest: 'Saadiyat Beach Villas • Royal Enclave Bay #4',
      items: [
        { name: 'Charcoal Grilled Sea Bass', qty: 2, price: 'AED 390.00' },
        { name: 'Truffle Acquerello Risotto', qty: 1, price: 'AED 135.00' },
        { name: 'Royal Medjool Date Pudding', qty: 1, price: 'AED 60.00' },
      ],
      note: 'Note: "No shellfish, extra saffron sauce, ring gate..."',
      payment: 'Apple Pay Confirmed',
      total: '585.00',
    },
    {
      id: 'VY-9022',
      displayId: '#VY-9022',
      tier: 'Standard VIP',
      tierColor: 'bg-[#383432] text-[#e9e1dd]',
      customer: 'Fatima Al-Suwaidi',
      dest: 'Al Bateen Marina • Pier 7 Residences',
      items: [
        { name: 'Wagyu Tenderloin Rossini', qty: 1, price: 'AED 260.00' },
        { name: 'Sparkling San Pellegrino 750ml', qty: 2, price: 'AED 80.00' },
      ],
      note: 'Note: "Quiet delivery at penthouse lobby."',
      payment: 'Credit Card • Tap ID',
      total: '340.00',
    },
  ]);

  const [kitchenOrders, setKitchenOrders] = useState([
    {
      id: 'VY-9018',
      displayId: '#VY-9018',
      station: 'Mains Station',
      guest: 'Sheikh Sultan Bin Zayed',
      assignment: 'Chef Marco • Station 2',
      rhythm: '12 min / 20 min Target',
      progress: 60,
      phase: 'Cooking Phase: Searing & Glaze',
      checklist: [
        { label: '2× Chilean Sea Bass Fillets', done: true },
        { label: '1× Saffron Risotto Pot', done: true },
        { label: '1× Truffle Shaving & Plating Finish', done: false },
      ],
    },
    {
      id: 'VY-9019',
      displayId: '#VY-9019',
      station: 'Cold Larder',
      guest: 'Elena Rostova',
      assignment: 'Chef Amira • Station 4 (Pastry & Raw Bar)',
      rhythm: '08 min / 12 min',
      progress: 75,
      phase: '1× Imperial Oscietra Caviar Brioche • Final Chilling',
      checklist: [{ label: '1x Imperial Caviar Plate', done: true }],
    },
  ]);

  const [readyOrders, setReadyOrders] = useState([
    {
      id: 'VY-9015',
      displayId: '#VY-9015',
      guest: 'Ambassador Charles Laurent',
      box: 'BOX 04-A',
      courierName: 'Khalid M.',
      courierRole: 'VAYORA Elite Fleet Captain',
      courierBay: 'At Bay 2',
      vehicle: 'AD-49219 (Climate Pod)',
      packStatus: '62°C Heated Core',
      pin: ['8', '4', '9', '2'],
    },
    {
      id: 'VY-9016',
      displayId: '#VY-9016',
      guest: 'Mariam Al-Husseini',
      box: 'BOX 02-B',
      courierName: 'Tariq Z.',
      courierStatus: 'In Transit to Venue',
      eta: 'ETA 3 MIN',
      pinStr: '[5 1 3 0]',
      checkedIn: false,
    },
  ]);

  // Drawer state
  const [selectedDrawerOrderId, setSelectedDrawerOrderId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Culinary Ingredient Depleted (86 Sea Bass)');

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleAcceptOrder = (orderId: string) => {
    const order = incomingList.find((o) => o.id === orderId);
    if (!order) return;

    setIncomingList((prev) => prev.filter((o) => o.id !== orderId));
    setKitchenOrders((prev) => [
      ...prev,
      {
        id: order.id,
        displayId: order.displayId,
        station: 'Mains & Saucier',
        guest: order.customer,
        assignment: 'Chef Marco • Station 2',
        rhythm: '0 min / 20 min Target',
        progress: 10,
        phase: 'Ticket Sent to Line • Prep Started',
        checklist: order.items.map((i) => ({ label: `${i.qty}× ${i.name}`, done: false })),
      },
    ]);
    playOrderChime();
    syncOrderToSupabase(orderId, 'accepted', {
      customer: order.customer,
      total_aed: order.total,
      vip_tier: order.tier,
    });
    showToast(`Order ${order.displayId} accepted and synced to Supabase.`);
  };

  const handleMarkKitchenReady = (orderId: string) => {
    const order = kitchenOrders.find((o) => o.id === orderId);
    if (!order) return;

    setKitchenOrders((prev) => prev.filter((o) => o.id !== orderId));
    setReadyOrders((prev) => [
      ...prev,
      {
        id: order.id,
        displayId: order.displayId,
        guest: order.guest,
        box: 'BOX 05-C',
        courierName: 'Ahmed R.',
        courierRole: 'VAYORA Premier Fleet #284',
        courierBay: 'At Staging Area',
        vehicle: 'Yamaha AD-8831',
        packStatus: '62°C Heated Core',
        pin: ['4', '1', '7', '9'],
      },
    ]);
    syncOrderToSupabase(orderId, 'ready_for_pickup', { guest: order.guest });
    showToast(`Order ${order.displayId} ready for pickup and saved to Supabase.`);
  };

  const handleConfirmHandover = (orderId: string) => {
    setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
    syncOrderToSupabase(orderId, 'dispatched', { courier: 'Khalid M.' });
    showToast(`Order #${orderId} handed over and dispatched (synced to Supabase).`);
  };

  const handleConfirmReject = () => {
    if (!rejectingOrderId) return;
    setIncomingList((prev) => prev.filter((o) => o.id !== rejectingOrderId));
    syncOrderToSupabase(rejectingOrderId, 'declined', { reason: rejectReason });
    showToast(`Order #${rejectingOrderId} declined and recorded in Supabase.`);
    setRejectingOrderId(null);
  };

  const handleSimulateAlert = () => {
    playOrderChime();
    showToast('Acoustic chime signal broadcasted across Abu Dhabi KDS nodes.');
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Operational HUD / Streamline Bar */}
      <div className="w-full bg-[#2d2927] rounded-xl p-4 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 border border-[#383432]">
        {/* Controls Left */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Audio Chime Button */}
          <button
            onClick={onToggleChime}
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#221f1d] hover:bg-[#383432] text-[#e9e1dd] shadow-sm transition-all border border-[#383432]/60"
          >
            <span
              className={`material-symbols-outlined text-lg ${
                chimeActive ? 'text-[#f7bd48]' : 'text-[#d1c6ab]/50'
              }`}
            >
              {chimeActive ? 'volume_up' : 'volume_off'}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase text-[#d1c6ab] font-bold leading-none">
                Acoustic Signal
              </span>
              <span
                className={`text-xs font-bold leading-tight ${
                  chimeActive ? 'text-[#f7bd48]' : 'text-[#d1c6ab]/70'
                }`}
              >
                Chime: {chimeActive ? 'Active' : 'Muted'}
              </span>
            </div>
          </button>

          {/* Auto-Dispatch Switch */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#221f1d] border border-[#383432]/60 shadow-sm">
            <span className="material-symbols-outlined text-[#f7bd48] text-lg">bolt</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-[#d1c6ab] font-bold leading-none">
                Auto-Dispatch
              </span>
              <span className="text-xs text-[#e9e1dd] font-medium leading-tight">
                Kitchen Protocol
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={() => setAutoDispatch(!autoDispatch)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#383432] rounded-full peer peer-checked:bg-[#ba880f] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#ffecb9] after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>

          {/* KDS Sync Status */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg bg-[#100e0c] border border-[#383432]/50 shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f7bd48] animate-ping" />
              <span className="text-xs text-[#f7bd48] font-bold uppercase tracking-wider">
                KDS Terminal Sync
              </span>
            </div>
            <span className="text-xs text-[#d1c6ab]">• 4 Expeditor Bays Active</span>
          </div>
        </div>

        {/* Search & Sector Filters Right */}
        <div className="flex flex-wrap items-center gap-3 flex-1 xl:max-w-xl justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#d1c6ab] text-base">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#100e0c] border border-[#383432]/60 rounded-lg text-[#e9e1dd] placeholder:text-[#d1c6ab]/40 text-xs focus:outline-none focus:bg-[#1e1b19] transition-all"
              placeholder="Search #VY-..., VIP status, or guest name..."
              type="text"
            />
          </div>

          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="appearance-none bg-[#100e0c] border border-[#383432]/60 text-[#e9e1dd] text-xs py-2 pl-3.5 pr-8 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">All Emirates Sectors</option>
              <option value="saadiyat">Saadiyat Island (Zone 1)</option>
              <option value="al-maryah">Al Maryah Financial Freezone</option>
              <option value="al-reem">Al Reem Island Towers</option>
              <option value="yas">Yas Island Luxury Marinas</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#d1c6ab] text-sm">
              expand_more
            </span>
          </div>

          <button
            onClick={handleSimulateAlert}
            className="p-2 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] shadow-md transition-all"
            title="Simulate Acoustic Order Alert"
          >
            <span className="material-symbols-outlined text-lg leading-none">notifications_active</span>
          </button>
        </div>
      </div>

      {/* Pipeline Status Tabs */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeTab === 'incoming'
              ? 'bg-[#2d2927] text-[#ffecb9] shadow-md border border-[#facc15]/30'
              : 'bg-[#221f1d] text-[#d1c6ab] hover:text-[#e9e1dd]'
          }`}
        >
          <span>⚡</span>
          <span>New Incoming</span>
          <span className="px-2 py-0.5 rounded-full bg-[#ba880f] text-[#392700] text-[10px] font-bold">
            {incomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeTab === 'kitchen'
              ? 'bg-[#2d2927] text-[#ffecb9] shadow-md border border-[#facc15]/30'
              : 'bg-[#221f1d] text-[#d1c6ab] hover:text-[#e9e1dd]'
          }`}
        >
          <span>Preparing / In Kitchen</span>
          <span className="px-2 py-0.5 rounded-full bg-[#383432] text-[#e9e1dd] text-[10px]">
            {kitchenOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ready')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeTab === 'ready'
              ? 'bg-[#2d2927] text-[#ffecb9] shadow-md border border-[#facc15]/30'
              : 'bg-[#221f1d] text-[#d1c6ab] hover:text-[#e9e1dd]'
          }`}
        >
          <span>Ready for Pickup</span>
          <span className="px-2 py-0.5 rounded-full bg-[#383432] text-[#e9e1dd] text-[10px]">
            {readyOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dispatched')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeTab === 'dispatched'
              ? 'bg-[#2d2927] text-[#ffecb9] shadow-md border border-[#facc15]/30'
              : 'bg-[#221f1d] text-[#d1c6ab] hover:text-[#e9e1dd]'
          }`}
        >
          <span>Dispatched / En Route</span>
          <span className="px-2 py-0.5 rounded-full bg-[#383432] text-[#e9e1dd] text-[10px]">
            8
          </span>
        </button>

        <button
          onClick={() => setActiveTab('delivered')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeTab === 'delivered'
              ? 'bg-[#2d2927] text-[#ffecb9] shadow-md border border-[#facc15]/30'
              : 'bg-[#221f1d] text-[#d1c6ab] hover:text-[#e9e1dd]'
          }`}
        >
          <span>Delivered Shift Records</span>
          <span className="px-2 py-0.5 rounded-full bg-[#383432] text-[#d1c6ab] text-[10px]">
            54 Today
          </span>
        </button>
      </div>

      {/* Live 3-Column Order Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: Incoming Orders */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f7bd48] animate-pulse" />
              <span className="text-sm font-bold text-[#e9e1dd]">Incoming Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold uppercase tracking-wider">
                Urgent Focus
              </span>
              <span className="text-xs text-[#ffecb9] font-bold">{incomingList.length} Awaiting</span>
            </div>
          </div>

          {incomingList.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#221f1d] border border-[#383432]/40 text-center text-xs text-[#d1c6ab]">
              No pending incoming orders at this moment.
            </div>
          ) : (
            incomingList.map((ord, idx) => (
              <div
                key={ord.id}
                onClick={() => setSelectedDrawerOrderId(ord.id)}
                className="cursor-pointer group relative bg-[#221f1d] border border-[#383432]/60 rounded-xl p-5 shadow-xl hover:bg-[#2d2927] transition-all"
              >
                {/* Accent Top Line for VIP */}
                <div className="absolute top-0 right-0 left-0 h-1 rounded-t-xl bg-gradient-to-r from-[#ba880f] via-[#facc15] to-[#f7bd48]" />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                        {ord.displayId}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ord.tierColor}`}>
                        {ord.tier}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#e9e1dd] block mt-1">
                      {ord.customer}
                    </span>
                  </div>

                  {/* Countdown timer */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold border border-[#f7bd48]/30 animate-pulse">
                    <span className="material-symbols-outlined text-xs">alarm</span>
                    <span>{idx === 0 ? formatCountdown(countdownSeconds) : '02:15'} REMAINING</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#d1c6ab] mb-3">
                  <span className="material-symbols-outlined text-[#f7bd48] text-sm">location_city</span>
                  <span className="truncate">{ord.dest}</span>
                </div>

                {/* Items Preview */}
                <div className="p-2.5 rounded-lg bg-[#100e0c] border border-[#383432]/40 space-y-1 mb-3">
                  {ord.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-[#e9e1dd]">
                      <span>
                        <strong className="text-[#ffecb9]">{item.qty}×</strong> {item.name}
                      </span>
                      <span className="text-[#d1c6ab] text-[11px]">{item.price}</span>
                    </div>
                  ))}
                </div>

                {/* Special Instruction */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#2d2927] mb-3 border border-[#383432]/40">
                  <span className="material-symbols-outlined text-[#f7bd48] text-sm">notifications_active</span>
                  <p className="text-xs text-[#e9e1dd] truncate">{ord.note}</p>
                </div>

                {/* Price and Total */}
                <div className="flex items-baseline justify-between py-1 mb-4">
                  <span className="text-[11px] uppercase text-[#d1c6ab] font-semibold">{ord.payment}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] uppercase text-[#f7bd48] font-bold">AED</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#ffecb9]">
                      {ord.total}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setRejectingOrderId(ord.id)}
                    className="py-2 px-3 rounded-lg bg-[#2d2927] text-[#ffb4ab] hover:bg-[#93000a] hover:text-[#ffdad6] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => handleAcceptOrder(ord.id)}
                    className="py-2 px-3 rounded-lg bg-[#facc15] text-[#6c5700] hover:bg-[#f7bd48] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                    <span>Accept Order</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUMN 2: Kitchen Execution */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f7bd48] text-lg">restaurant</span>
              <span className="text-sm font-bold text-[#e9e1dd]">Kitchen Execution</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#221f1d] text-[#ffecb9] text-xs font-bold">
              {kitchenOrders.length} Active Pots
            </span>
          </div>

          {kitchenOrders.map((k) => (
            <div
              key={k.id}
              className="bg-[#221f1d] border border-[#383432]/60 rounded-xl p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      {k.displayId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-semibold">
                      {k.station}
                    </span>
                  </div>
                  <span className="text-xs text-[#e9e1dd] font-medium block mt-1">
                    Guest: {k.guest}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">outdoor_grill</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#100e0c] border border-[#383432]/40">
                <div>
                  <span className="text-[10px] text-[#d1c6ab] uppercase block">Station Assignment</span>
                  <span className="text-xs text-[#e9e1dd] font-bold">{k.assignment}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#d1c6ab] uppercase block">Prep Rhythm</span>
                  <span className="text-xs text-[#f7bd48] font-bold">{k.rhythm}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#d1c6ab]">
                  <span>{k.phase}</span>
                  <span className="text-[#ffecb9] font-semibold">{k.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#2d2927] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ba880f] via-[#facc15] to-[#f7bd48] rounded-full transition-all duration-500"
                    style={{ width: `${k.progress}%` }}
                  />
                </div>
              </div>

              {/* Item Checklist */}
              <div className="space-y-1.5 text-xs text-[#e9e1dd]">
                {k.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded bg-[#2d2927]/60"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        readOnly
                        className="accent-[#facc15] rounded cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[11px] text-[#f7bd48] font-semibold">
                      {item.done ? 'Done' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleMarkKitchenReady(k.id)}
                className="w-full py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#facc15] text-[#ffecb9] hover:text-[#6c5700] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Mark Ready for Courier Handover</span>
              </button>
            </div>
          ))}
        </div>

        {/* COLUMN 3: Ready for Pickup & Expedite */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1b19] border border-[#383432]/60 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f7bd48] text-lg">two_wheeler</span>
              <span className="text-sm font-bold text-[#e9e1dd]">Expedite &amp; Pickup</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#ba880f] text-[#392700] text-[10px] font-bold">
              3 Drivers Staged
            </span>
          </div>

          {readyOrders.map((r) => (
            <div
              key={r.id}
              className="bg-[#221f1d] border border-[#383432]/60 rounded-xl p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      {r.displayId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#f7bd48] text-[10px] font-bold uppercase tracking-wider">
                      PACKED &amp; SEALED
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#e9e1dd] block mt-1">
                    {r.guest}
                  </span>
                </div>
                <span className="px-2 py-1 rounded bg-[#100e0c] text-[#ffecb9] text-xs font-bold border border-[#383432]">
                  {r.box}
                </span>
              </div>

              {/* Assigned Courier Profile */}
              <div className="p-3 rounded-xl bg-[#100e0c] border border-[#383432]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2d2927] flex items-center justify-center font-bold text-[#ffecb9] text-xs">
                      {r.courierName.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#e9e1dd] font-bold">{r.courierName}</span>
                      <span className="text-[11px] text-[#f7bd48] font-semibold">{r.courierRole || r.courierStatus}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold">
                    {r.courierBay || r.eta}
                  </span>
                </div>

                {r.vehicle && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#383432]/40 text-[11px] text-[#d1c6ab]">
                    <div>
                      <span className="block uppercase font-medium text-[9px]">Vehicle License</span>
                      <span className="text-[#e9e1dd] font-bold">{r.vehicle}</span>
                    </div>
                    <div>
                      <span className="block uppercase font-medium text-[9px]">Thermal Pack</span>
                      <span className="text-[#ffecb9] font-semibold">{r.packStatus}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4-Digit Security PIN */}
              {r.pin ? (
                <div className="p-2.5 rounded-lg bg-[#2d2927] flex flex-col items-center justify-center gap-1 border border-[#383432]/40">
                  <span className="text-[10px] text-[#d1c6ab] uppercase font-semibold tracking-wider">
                    Rider Handover Security PIN
                  </span>
                  <div className="flex items-center gap-2 tracking-widest my-1">
                    {r.pin.map((digit, i) => (
                      <span
                        key={i}
                        className="w-8 h-8 rounded bg-[#100e0c] text-[#ffecb9] font-['Plus_Jakarta_Sans'] text-lg flex items-center justify-center font-bold shadow-inner border border-[#383432]"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#d1c6ab]/70">
                    Verify rider display terminal before dispatch
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1 text-xs text-[#d1c6ab]">
                  <span>Handover Code:</span>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#ffecb9] text-base tracking-widest">
                    {r.pinStr}
                  </span>
                </div>
              )}

              {/* Handover Button */}
              {r.pin ? (
                <button
                  onClick={() => handleConfirmHandover(r.id)}
                  className="w-full py-2.5 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">local_shipping</span>
                  <span>Confirm Rider Handover &amp; Dispatch</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg bg-[#2d2927] text-[#d1c6ab]/50 text-xs font-semibold cursor-not-allowed"
                >
                  Awaiting Driver Gate Check-in
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Network Diagnostics Banner */}
      <div className="w-full p-4 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f7bd48]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#d1c6ab] uppercase font-semibold">
                UAE Logistics Mesh
              </span>
              <span className="text-xs text-[#e9e1dd] font-bold">Latency: Optimal (18ms)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#f7bd48] text-base">timer</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#d1c6ab] uppercase font-semibold">
                Abu Dhabi Island Fleet
              </span>
              <span className="text-xs text-[#e9e1dd] font-bold">Average Dispatch: 28 mins</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ffecb9] text-base">receipt_long</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#d1c6ab] uppercase font-semibold">
                Shift Volume Completed
              </span>
              <span className="text-xs text-[#ffecb9] font-bold">
                54 Orders Dispatched • AED 38,450
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#d1c6ab] text-[11px]">
          <span>SYNCHRONIZED WITH EMIRATES CLOUD KDS • GMT+4</span>
          <span className="material-symbols-outlined text-sm text-[#f7bd48]">cloud_done</span>
        </div>
      </div>

      {/* Order Details Slide-Over Drawer */}
      {selectedDrawerOrderId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setSelectedDrawerOrderId(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-full max-w-xl h-full bg-[#2d2927] border-l border-[#383432] shadow-2xl overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300">
            {/* Top Bar */}
            <div className="p-6 bg-[#221f1d] flex items-center justify-between border-b border-[#383432]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#ffecb9]">
                    #{selectedDrawerOrderId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffe083] text-[#231b00] text-xs font-bold uppercase">
                    VIP Platinum
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#e9e1dd] mt-1 block">
                  Dr. Mansoor Al-Ketbi
                </span>
              </div>
              <button
                onClick={() => setSelectedDrawerOrderId(null)}
                className="p-2 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-[#d1c6ab] hover:text-[#e9e1dd] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Special Directives */}
              <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432] space-y-2">
                <div className="flex items-center gap-2 text-[#f7bd48]">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Special Culinary Directives
                  </span>
                </div>
                <p className="text-xs text-[#ffecb9] font-medium leading-relaxed bg-[#221f1d] p-3 rounded-lg border border-[#383432]/60">
                  “Strict allergy protocol: No shellfish under any circumstance. Ensure extra saffron emulsion sauce served in insulated silver container. Courier instructions: Ring private gate bell directly, do not call phone.”
                </p>
              </div>

              {/* Location Preview */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#d1c6ab] uppercase font-bold tracking-wider">
                  Delivery Destination • Sector Coordinates
                </span>
                <div
                  className="w-full h-36 rounded-xl bg-cover bg-center overflow-hidden flex flex-col justify-end p-3 border border-[#383432]"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATfXF_oPUWa9scJM3aScJ_lPYIZ7BCUXQ4ARfzTapa_NQ03Y8V3zLclKo2BFULyshA5JLZ3tELo_OREXmIdg7MsL7sCzio5PEIujJiYm-_pYkZg7fjAdS14BYkviojzh0cCfsU4iE2RsxMonQdVpUM8Fq9O2yCOwlSmvm9XITZUCfokdoa4CmFJBE__AbhgPvP9Nw0OtFKh4dKP5A9AOq-2S3VChnKjvZ8LI3ZbmcUm9kvW80MdP8')",
                  }}
                >
                  <div className="bg-[#161311]/90 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 text-xs text-[#e9e1dd]">
                    <span className="material-symbols-outlined text-[#f7bd48] text-base">pin_drop</span>
                    <span className="truncate">Saadiyat Beach Villas, Villa No. 18, Street 4</span>
                  </div>
                </div>
              </div>

              {/* Order Ledger */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#d1c6ab] uppercase font-bold tracking-wider">
                  Order Ledger
                </span>
                <div className="bg-[#221f1d] border border-[#383432] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start pb-2 border-b border-[#383432]/40">
                    <div>
                      <span className="text-xs text-[#e9e1dd] font-semibold">
                        2× Charcoal Grilled Sea Bass
                      </span>
                      <span className="block text-[11px] text-[#d1c6ab]">
                        Wild Asparagus, Saffron Emulsion
                      </span>
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#ffecb9] text-sm">
                      390.00
                    </span>
                  </div>

                  <div className="flex justify-between items-start pb-2 border-b border-[#383432]/40">
                    <div>
                      <span className="text-xs text-[#e9e1dd] font-semibold">
                        1× Truffle Acquerello Risotto
                      </span>
                      <span className="block text-[11px] text-[#d1c6ab]">
                        Aged 7 years Carnaroli, Black Truffle
                      </span>
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#ffecb9] text-sm">
                      135.00
                    </span>
                  </div>

                  <div className="flex justify-between items-start pb-2 border-b border-[#383432]/40">
                    <div>
                      <span className="text-xs text-[#e9e1dd] font-semibold">
                        1× Royal Medjool Date Pudding
                      </span>
                      <span className="block text-[11px] text-[#d1c6ab]">
                        Camel milk caramel, 24K gold dust
                      </span>
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#ffecb9] text-sm">
                      60.00
                    </span>
                  </div>

                  <div className="pt-2 space-y-1 text-xs text-[#d1c6ab]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>AED 585.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UAE 5% VAT (Included)</span>
                      <span>AED 27.86</span>
                    </div>
                    <div className="flex justify-between text-[#f7bd48] font-bold text-sm pt-1">
                      <span>Total Charge (Settled)</span>
                      <span className="font-['Plus_Jakarta_Sans'] text-base text-[#ffecb9]">
                        AED 585.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-[#221f1d] border-t border-[#383432] flex items-center gap-3">
              <button
                onClick={() => setSelectedDrawerOrderId(null)}
                className="flex-1 py-3 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#e9e1dd] transition-all"
              >
                Dismiss Drawer
              </button>
              <button
                onClick={() => {
                  handleAcceptOrder(selectedDrawerOrderId);
                  setSelectedDrawerOrderId(null);
                }}
                className="flex-1 py-3 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">restaurant</span>
                <span>Commit to Kitchen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setRejectingOrderId(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-md bg-[#2d2927] border border-[#383432] rounded-xl shadow-2xl p-6 space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#ffb4ab]">Reject Order Protocol</span>
              <button
                onClick={() => setRejectingOrderId(null)}
                className="text-[#d1c6ab] hover:text-[#e9e1dd]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-[#d1c6ab] leading-relaxed">
              Declining an executive patron order alerts the UAE VIP Concierge. Please designate the primary operational constraint:
            </p>
            <div className="space-y-2">
              {[
                'Culinary Ingredient Depleted (86 Sea Bass)',
                'Kitchen Shift Peak Capacity Exceeded',
                'Delivery Zone Unreachable Before Service Close',
              ].map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-[#221f1d] hover:bg-[#383432] cursor-pointer text-xs text-[#e9e1dd]"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="accent-[#facc15]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectingOrderId(null)}
                className="flex-1 py-2.5 rounded-lg bg-[#221f1d] text-[#e9e1dd] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-lg bg-[#93000a] text-[#ffdad6] hover:bg-[#690005] text-xs font-bold transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

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
