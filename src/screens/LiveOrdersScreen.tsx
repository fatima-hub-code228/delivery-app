import React, { useState, useEffect, useCallback } from 'react';
import { playOrderChime } from '../components/AudioChime';
import { ScreenId } from '../types';
import {
  acceptOrderInSupabase,
  rejectOrderInSupabase,
  updateOrderStatusInSupabase,
  fetchOrdersFromSupabase,
  getLastSupabaseError,
  getPartnerSession,
  onPartnerSessionChange,
  onSupabaseAction,
  subscribeToOrdersRealtime,
} from '../lib/supabase';

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

  // State for real database orders from public."order" + public."order_items" (no fake initial orders)
  const [incomingList, setIncomingList] = useState<
    Array<{
      id: string;
      displayId: string;
      tier: string;
      tierColor: string;
      customer: string;
      dest: string;
      items: Array<{ name: string; qty: number; price: string }>;
      note: string;
      payment: string;
      total: string;
    }>
  >([]);

  const [kitchenOrders, setKitchenOrders] = useState<
    Array<{
      id: string;
      displayId: string;
      station: string;
      guest: string;
      assignment: string;
      rhythm: string;
      progress: number;
      phase: string;
      checklist: Array<{ label: string; done: boolean }>;
    }>
  >([]);

  const [readyOrders, setReadyOrders] = useState<
    Array<{
      id: string;
      displayId: string;
      guest: string;
      box: string;
      courierName: string;
      courierRole?: string;
      courierStatus?: string;
      courierBay?: string;
      eta?: string;
      vehicle?: string;
      packStatus?: string;
      pin?: string[];
      pinStr?: string;
      checkedIn?: boolean;
    }>
  >([]);

  const [dbError, setDbError] = useState<string | null>(null);

  // Drawer state
  const [selectedDrawerOrderId, setSelectedDrawerOrderId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Culinary Ingredient Depleted (86 Item)');

  // Loading state for specific order being accepted
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Fetch and sync orders directly from Supabase (filtered by active vendor if selected)
  const loadSupabaseOrders = useCallback(async () => {
    const storeId = getPartnerSession().storeId;
    const dbOrders = await fetchOrdersFromSupabase(storeId);
    if (!dbOrders) {
      setIncomingList([]);
      setKitchenOrders([]);
      setReadyOrders([]);
      setDbError(getLastSupabaseError());
      return;
    }
    setDbError(null);

    // Separate by status
    const dbIncoming: typeof incomingList = [];
    const dbCooking: typeof kitchenOrders = [];
    const dbReady: typeof readyOrders = [];

    dbOrders.forEach((o) => {
      const displayId = o.id.startsWith('#') ? o.id : `#${o.id}`;
      const normalizedItems =
        Array.isArray(o.items) && o.items.length > 0
          ? o.items.map((item: any) => ({
              name: item.name || item.name_en || 'Abu Dhabi Specialty Item',
              qty: Number(item.qty || item.quantity || 1),
              price:
                item.price ||
                `AED ${(Number(item.price_aed || 0) * Number(item.qty || item.quantity || 1)).toFixed(2)}`,
            }))
          : [
              {
                name: 'Wagyu Tenderloin Rossini',
                qty: 1,
                price: `AED ${Number(o.total_aed || 340).toFixed(2)}`,
              },
            ];

      if (o.status === 'incoming') {
        dbIncoming.push({
          id: o.id,
          displayId,
          tier: `${o.storeName} • ${o.customerStatus.code}`,
          tierColor: o.vip_tier?.includes('Platinum')
            ? 'bg-[#ffe083] text-[#231b00]'
            : 'bg-[#383432] text-[#f7bd48]',
          customer: o.customer_name || 'VIP Patron',
          dest: o.delivery_zone || 'Abu Dhabi Sector',
          items: normalizedItems,
          note: o.notes || 'Note: "Prepared to executive hospitality standards."',
          payment: `Customer App (${o.customerStatus.title})`,
          total: Number(o.total_aed || 340).toFixed(2),
        });
      } else if (o.status === 'cooking' || o.status === 'preparing') {
        dbCooking.push({
          id: o.id,
          displayId,
          station: o.storeName || 'Mains & Saucier',
          guest: o.customer_name || 'Executive Guest',
          assignment: `${o.courier || 'Kitchen Team'} • Customer App: ${o.customerStatus.code}`,
          rhythm: '12 min / 20 min Target',
          progress: 60,
          phase: `Preparing at ${o.storeName} • Customer App: ${o.customerStatus.title}`,
          checklist: normalizedItems.map((i: any, idx: number) => ({
            label: `${i.qty}× ${i.name}`,
            done: idx === 0,
          })),
        });
      } else if (
        o.status === 'ready_for_pickup' ||
        o.status === 'ready' ||
        o.status === 'dispatched'
      ) {
        dbReady.push({
          id: o.id,
          displayId,
          guest: `${o.customer_name || 'VIP Guest'} (${o.storeName})`,
          box: `Customer App: ${o.customerStatus.code}`,
          courierName: o.courier || 'Ahmed R.',
          courierRole: 'VAYORA Premier Fleet #284',
          courierBay: 'At Bay 2',
          vehicle: 'Yamaha AD-8831 (Climate Pod)',
          packStatus: '62°C Heated Core',
          pin: ['8', '4', '9', '2'],
        });
      }
    });

    setIncomingList(dbIncoming);
    setKitchenOrders(dbCooking);
    setReadyOrders(dbReady);
  }, []);

  // Sync on component mount + vendor session changes + real-time order updates
  useEffect(() => {
    loadSupabaseOrders();
    const unsubSession = onPartnerSessionChange(() => {
      loadSupabaseOrders();
    });
    const unsubAction = onSupabaseAction((act) => {
      if (act.action_type.startsWith('order_') || act.action_type === 'customer_order_placed') {
        loadSupabaseOrders();
      }
    });
    const unsubRealtime = subscribeToOrdersRealtime(() => {
      loadSupabaseOrders();
    });
    return () => {
      unsubSession();
      unsubAction();
      unsubRealtime();
    };
  }, [loadSupabaseOrders]);

  /**
   * Verified Accept Order Handler:
   * 1. Updates Supabase database status to 'cooking' (Customer App -> 'PREPARING').
   * 2. Checks returned database response.
   * 3. Refetches order from Supabase to verify updated record.
   * 4. Only transitions UI upon confirmed database success.
   * 5. Displays clear error toast if update fails.
   */
  const handleAcceptOrder = async (orderId: string) => {
    if (!orderId) return;
    setLoadingOrderId(orderId);

    try {
      const result = await acceptOrderInSupabase(orderId);

      if (result.success) {
        playOrderChime();
        showToast(
          `Order #${result.orderId} accepted! Supabase: '${result.newStatus}' → Customer App: '${result.customerStatus}'.`
        );

        // Re-fetch the live order records from Supabase to confirm state
        await loadSupabaseOrders();
      } else {
        // Failed update in Supabase: keep in incomingList and alert with the exact reason
        showToast(`Supabase update failed for #${orderId}: ${result.error}`);
      }
    } catch (err: any) {
      showToast(`Error accepting order #${orderId}: ${err?.message || 'Database error'}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleMarkKitchenReady = async (orderId: string) => {
    const order = kitchenOrders.find((o) => o.id === orderId);
    if (!order) return;

    setLoadingOrderId(orderId);
    try {
      const result = await updateOrderStatusInSupabase(orderId, 'ready_for_pickup', {
        courier: 'Ahmed R.',
      });

      if (result.success) {
        playOrderChime();
        showToast(
          `Order #${result.orderId} ready for pickup! Supabase: '${result.newStatus}' → Customer App: '${result.customerStatus}'.`
        );
        await loadSupabaseOrders();
      } else {
        showToast(`Supabase update failed for #${orderId}: ${result.error}`);
      }
    } catch (err: any) {
      showToast(`Error updating order #${orderId}: ${err?.message || 'Database error'}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleConfirmHandover = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      const result = await updateOrderStatusInSupabase(orderId, 'completed', {
        courier: 'Khalid M.',
        note: 'Delivered to customer in Abu Dhabi',
      });

      if (result.success) {
        playOrderChime();
        showToast(
          `Order #${result.orderId} delivered! Supabase: '${result.newStatus}' → Customer App: '${result.customerStatus}'.`
        );
        await loadSupabaseOrders();
      } else {
        showToast(`Supabase handover update failed for #${orderId}: ${result.error}`);
      }
    } catch (err: any) {
      showToast(`Error dispatching order #${orderId}: ${err?.message || 'Database error'}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    const targetId = rejectingOrderId;
    setLoadingOrderId(targetId);

    try {
      const result = await rejectOrderInSupabase(targetId, rejectReason);

      if (result.success) {
        showToast(
          `Order #${result.orderId} declined. Status confirmed as '${result.newStatus}' in Supabase.`
        );
        setRejectingOrderId(null);
        await loadSupabaseOrders();
      } else {
        showToast(`Supabase reject failed for #${targetId}: ${result.error}`);
      }
    } catch (err: any) {
      showToast(`Error declining order #${targetId}: ${err?.message || 'Database error'}`);
    } finally {
      setLoadingOrderId(null);
    }
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

      {dbError && (
        <div className="w-full p-4 rounded-xl bg-[#93000a]/25 border border-[#ffb4ab]/40 text-xs text-[#ffdad6] flex items-start gap-3">
          <span className="material-symbols-outlined text-[#ffb4ab] text-lg shrink-0">warning</span>
          <div>
            <span className="font-bold block">
              Shared Customer App Supabase Connection Pending (https://rbdsjgalxoehuwskzvit.supabase.co)
            </span>
            <p className="mt-0.5 text-[11px] opacity-90">{dbError}</p>
          </div>
        </div>
      )}

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
                    disabled={loadingOrderId === ord.id}
                    onClick={() => handleAcceptOrder(ord.id)}
                    className="py-2 px-3 rounded-lg bg-[#facc15] text-[#6c5700] hover:bg-[#f7bd48] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingOrderId === ord.id ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                        <span>Accept Order</span>
                      </>
                    )}
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
                disabled={loadingOrderId === k.id}
                onClick={() => handleMarkKitchenReady(k.id)}
                className="w-full py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#facc15] text-[#ffecb9] hover:text-[#6c5700] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {loadingOrderId === k.id ? 'progress_activity' : 'check_circle'}
                </span>
                <span>
                  {loadingOrderId === k.id
                    ? 'Saving to Supabase...'
                    : 'Mark Ready for Courier Handover'}
                </span>
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
                  disabled={loadingOrderId === r.id}
                  onClick={() => handleConfirmHandover(r.id)}
                  className="w-full py-2.5 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">
                    {loadingOrderId === r.id ? 'progress_activity' : 'local_shipping'}
                  </span>
                  <span>
                    {loadingOrderId === r.id
                      ? 'Confirming in Supabase...'
                      : 'Confirm Rider Handover & Dispatch'}
                  </span>
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
                disabled={!selectedDrawerOrderId || loadingOrderId === selectedDrawerOrderId}
                onClick={async () => {
                  if (selectedDrawerOrderId) {
                    await handleAcceptOrder(selectedDrawerOrderId);
                    setSelectedDrawerOrderId(null);
                  }
                }}
                className="flex-1 py-3 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingOrderId === selectedDrawerOrderId ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    <span>Accepting in Supabase...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">restaurant</span>
                    <span>Commit to Kitchen</span>
                  </>
                )}
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
