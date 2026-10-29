import React, { useState, useEffect } from 'react';
import { playOrderChime } from './AudioChime';
import { ScreenId } from '../types';
import {
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  CUSTOMER_DB_TABLES,
  getLastSupabaseError,
  getPartnerSession,
  setPartnerBranch,
  onPartnerSessionChange,
  onSupabaseAction,
  placeCustomerOrderInSupabase,
  fetchOrdersFromSupabase,
  fetchSingleOrderFromSupabase,
  acceptOrderInSupabase,
  rejectOrderInSupabase,
  updateOrderStatusInSupabase,
  EnrichedOrderRecord,
} from '../lib/supabase';
import {
  SHARED_ABU_DHABI_STORES,
  SHARED_PRODUCTS,
  SHARED_ABU_DHABI_ZONES,
} from '../lib/sharedCatalog';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onNavigate: (screen: ScreenId) => void;
  chimeActive: boolean;
  onToggleChime: () => void;
  onOpenMobileMenu?: () => void;
}

interface ConnectionCheckStep {
  step: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  detail: string;
}

export default function Header({
  onSearch,
  onNavigate,
  chimeActive,
  onToggleChime,
  onOpenMobileMenu,
}: HeaderProps) {
  const [session, setSession] = useState(() => getPartnerSession());
  const [storeOpen, setStoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedKotlin, setCopiedKotlin] = useState(false);

  // Shared Backend & Customer App Bridge Modal
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'bridge' | 'telemetry' | 'code' | 'apk'>('apk');
  const [syncedActions, setSyncedActions] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [installNotice, setInstallNotice] = useState<string | null>(null);

  // Customer App Order Simulator State (uses real Supabase `public."order"` + `public."order_items"`)
  const [simStoreId, setSimStoreId] = useState('store_mosaic');
  const [simProductId, setSimProductId] = useState('prod_ms_mixed_grill');
  const [simQty, setSimQty] = useState(2);
  const [simCustomerName, setSimCustomerName] = useState('Fatima Al Mansoori');
  const [simCustomerPhone, setSimCustomerPhone] = useState('+971 50 442 8912');
  const [simEmirate, setSimEmirate] = useState('Abu Dhabi');
  const [simZoneId, setSimZoneId] = useState('ad_al_reem');
  const [simBuilding, setSimBuilding] = useState('Sky Tower, Shams Abu Dhabi');
  const [simApartment, setSimApartment] = useState('Apt 2402');
  const [simNotes, setSimNotes] = useState('Fresh garlic sauce & warm bread please');
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simResult, setSimResult] = useState<{
    success: boolean;
    message: string;
    order?: EnrichedOrderRecord;
  } | null>(null);
  const [liveCustomerOrders, setLiveCustomerOrders] = useState<EnrichedOrderRecord[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 1-Click Live Connection Verification State
  const [verifyingConnection, setVerifyingConnection] = useState(false);
  const [checkSteps, setCheckSteps] = useState<ConnectionCheckStep[]>([]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setPwaInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const unsubSession = onPartnerSessionChange((updated) => {
      setSession(updated);
    });
    const unsubAction = onSupabaseAction((action) => {
      setSyncedActions((prev) => [action, ...prev.slice(0, 19)]);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubSession();
      unsubAction();
    };
  }, []);

  const handleInstallWebApk = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setPwaInstalled(true);
        setDeferredPrompt(null);
        setInstallNotice('Quick Shop Partner installed on your device!');
      }
    } else {
      setInstallNotice(
        'To install directly on your Android phone: open Chrome menu (⋮) → tap "Install app" or "Add to Home screen", or download QuickShopPartner-Android-Project.zip below to compile app-debug.apk.'
      );
    }
  };

  const refreshLiveCustomerOrders = async () => {
    const orders = await fetchOrdersFromSupabase('ALL');
    if (orders) {
      setLiveCustomerOrders(orders.slice(0, 8));
    }
  };

  useEffect(() => {
    if (supabaseOpen) {
      refreshLiveCustomerOrders();
    }
  }, [supabaseOpen, syncedActions.length]);

  // Keep selected product valid when switching simulated store
  useEffect(() => {
    const storeProducts = SHARED_PRODUCTS.filter((p) => p.storeId === simStoreId);
    if (storeProducts.length > 0 && !storeProducts.some((p) => p.id === simProductId)) {
      setSimProductId(storeProducts[0].id);
    }
  }, [simStoreId, simProductId]);

  const handlePlaceCustomerOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimSubmitting(true);
    setSimResult(null);
    try {
      const res = await placeCustomerOrderInSupabase({
        storeId: simStoreId,
        customerName: simCustomerName,
        customerPhone: simCustomerPhone,
        emirate: simEmirate,
        zoneId: simZoneId,
        buildingName: simBuilding,
        apartmentOrVilla: simApartment,
        instructions: simNotes,
        paymentMethod: 'Apple Pay / Credit Card',
        items: [{ productId: simProductId, quantity: simQty, specialNotes: simNotes }],
      });

      if (res.success && res.order) {
        playOrderChime();
        setSimResult({
          success: true,
          message: `Order #${res.orderId} saved to Supabase 'public."${CUSTOMER_DB_TABLES.order}"' + 'public."${CUSTOMER_DB_TABLES.orderItems}"' for ${res.order.storeName}! Customer App status: ${res.order.customerStatus.title} (${res.order.customerStatus.code}).`,
          order: res.order,
        });
        await refreshLiveCustomerOrders();
      } else {
        setSimResult({
          success: false,
          message: res.error || 'Order failed validation.',
        });
      }
    } finally {
      setSimSubmitting(false);
    }
  };

  const handleInlineStatusUpdate = async (
    order: EnrichedOrderRecord,
    nextStatus: 'cooking' | 'ready_for_pickup' | 'completed' | 'declined'
  ) => {
    setUpdatingOrderId(order.id);
    const previousBranch = getPartnerSession().storeId;
    try {
      // Ensure operator branch matches order vendor or ALL so authorization passes
      if (previousBranch !== 'ALL' && previousBranch !== order.storeId) {
        setPartnerBranch(order.storeId);
      }

      if (nextStatus === 'cooking') {
        await acceptOrderInSupabase(order.id);
      } else if (nextStatus === 'declined') {
        await rejectOrderInSupabase(order.id, 'Declined from Live Connection Bridge');
      } else {
        await updateOrderStatusInSupabase(order.id, nextStatus);
      }
      await refreshLiveCustomerOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const runLiveConnectionDiagnostic = async () => {
    setVerifyingConnection(true);
    const steps: ConnectionCheckStep[] = [
      {
        step: `1. Verify Shared Supabase Backend (${SUPABASE_PROJECT_ID})`,
        status: 'running',
        detail: `Connecting to ${SUPABASE_URL} (public."order" & public."order_items")...`,
      },
      {
        step: '2. Place Test Order from Customer App (Mosaic Restaurant)',
        status: 'pending',
        detail: 'Waiting...',
      },
      {
        step: '3. Retrieve Order in Restaurant App & Verify Store Scoping',
        status: 'pending',
        detail: 'Waiting...',
      },
      {
        step: '4. Restaurant Accepts Order → Customer App Sees PREPARING',
        status: 'pending',
        detail: 'Waiting...',
      },
    ];
    setCheckSteps([...steps]);

    const prevStoreId = getPartnerSession().storeId;

    try {
      // Step 1
      const allOrders = await fetchOrdersFromSupabase('ALL');
      if (!allOrders) {
        steps[0] = {
          ...steps[0],
          status: 'fail',
          detail:
            getLastSupabaseError() ||
            `Could not query public."${CUSTOMER_DB_TABLES.order}" from ${SUPABASE_URL}.`,
        };
        setCheckSteps([...steps]);
        return;
      }
      steps[0] = {
        ...steps[0],
        status: 'pass',
        detail: `Connected to ${SUPABASE_PROJECT_ID}! Read ${allOrders.length} rows from public."order".`,
      };
      steps[1] = { ...steps[1], status: 'running', detail: 'Inserting real customer order...' };
      setCheckSteps([...steps]);

      // Step 2: Create Customer Order
      const created = await placeCustomerOrderInSupabase({
        storeId: 'store_mosaic',
        customerName: 'Live Connection Test Guest',
        customerPhone: '+971 50 999 1122',
        emirate: 'Abu Dhabi',
        zoneId: 'ad_al_khalidiya',
        buildingName: 'Corniche Residence Tower A',
        apartmentOrVilla: 'Apt 904',
        instructions: 'Live connection test between Customer App & Restaurant App',
        paymentMethod: 'Apple Pay',
        items: [{ productId: 'prod_ms_mixed_grill', quantity: 1 }],
      });

      if (!created.success || !created.orderId) {
        steps[1] = {
          ...steps[1],
          status: 'fail',
          detail: created.error || 'Failed to insert order.',
        };
        setCheckSteps([...steps]);
        return;
      }

      const testId = created.orderId;
      steps[1] = {
        ...steps[1],
        status: 'pass',
        detail: `Created order #${testId} in public."order" + public."order_items" (Partner: incoming / Customer: CONFIRMED, Total: AED ${created.order?.total_aed}).`,
      };
      steps[2] = {
        ...steps[2],
        status: 'running',
        detail: `Checking restaurant queue for Mosaic Restaurant (store_mosaic)...`,
      };
      setCheckSteps([...steps]);

      // Step 3: Retrieve in Restaurant App
      const mosaicOrders = await fetchOrdersFromSupabase('store_mosaic');
      const foundInMosaic = mosaicOrders?.find((o) => o.id === testId);
      if (!foundInMosaic) {
        steps[2] = {
          ...steps[2],
          status: 'fail',
          detail: `Order #${testId} was not found in store_mosaic queue.`,
        };
        setCheckSteps([...steps]);
        return;
      }
      steps[2] = {
        ...steps[2],
        status: 'pass',
        detail: `Restaurant App received #${testId} for ${foundInMosaic.storeName} in ${foundInMosaic.delivery_zone || 'Al Khalidiya'}!`,
      };
      steps[3] = {
        ...steps[3],
        status: 'running',
        detail: `Accepting order #${testId} as Mosaic Restaurant...`,
      };
      setCheckSteps([...steps]);

      // Step 4: Accept in Restaurant App & verify Customer App status
      setPartnerBranch('store_mosaic');
      const accepted = await acceptOrderInSupabase(testId);
      const updatedOrder = await fetchSingleOrderFromSupabase(testId);

      if (!accepted.success || !updatedOrder || updatedOrder.status !== 'cooking') {
        steps[3] = {
          ...steps[3],
          status: 'fail',
          detail: accepted.error || 'Status update failed.',
        };
        setCheckSteps([...steps]);
        return;
      }

      playOrderChime();
      steps[3] = {
        ...steps[3],
        status: 'pass',
        detail: `Verified! Database status updated to "${updatedOrder.status}" → Customer App now displays "${updatedOrder.customerStatus.code}" (${updatedOrder.customerStatus.title}).`,
      };
      setCheckSteps([...steps]);
      await refreshLiveCustomerOrders();
    } finally {
      setPartnerBranch(prevStoreId);
      setVerifyingConnection(false);
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'Urgent Dispatch #VY-9021',
      desc: 'Saadiyat Cultural District • 1m 48s SLA remaining',
      time: 'Just now',
      urgent: true,
    },
    {
      id: 2,
      title: 'Shared Catalog Synced (36 Products)',
      desc: '9 Abu Dhabi Vendors & 16 Delivery Zones live in Supabase.',
      time: 'Just now',
      urgent: false,
    },
    {
      id: 3,
      title: 'VIP Courier Khalid M. Arrived',
      desc: 'Staged at Bay 2 with Thermal Pod AD-49219',
      time: '12 mins ago',
      urgent: false,
    },
  ];

  const handleChimeClick = () => {
    onToggleChime();
    playOrderChime();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch?.(e.target.value);
  };

  const storeProductsForSim = SHARED_PRODUCTS.filter((p) => p.storeId === simStoreId);

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-[#161311]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-40 px-4 sm:px-6 flex items-center justify-between border-b border-[#383432]/40">
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#1e1b19] border border-[#383432]/50 text-[#f7bd48] hover:bg-[#2d2927] shrink-0"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}

        {/* Multi-Vendor / Restaurant Selector Dropdown */}
        <div className="relative min-w-0">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 sm:gap-3 py-1.5 px-3 sm:px-4 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:bg-[#2d2927] transition-all text-left max-w-[230px] sm:max-w-xs"
          >
            <span className="material-symbols-outlined text-[#f7bd48] text-xl shrink-0">
              storefront
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-[#e9e1dd] font-semibold truncate">
                  {session.branch}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48] animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-[11px] text-[#f7bd48] font-semibold tracking-wide uppercase truncate">
                  {session.storeId === 'ALL'
                    ? 'All 9 Abu Dhabi Vendors Synced'
                    : `Scoped Vendor: ${session.storeId}`}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#d1c6ab] text-lg ml-1 shrink-0">
              expand_more
            </span>
          </button>

          {storeOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-[#221f1d] border border-[#383432] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="px-3 py-1 text-[10px] uppercase font-bold text-[#f7bd48] tracking-widest block">
                Filter by Shared Customer App Vendor
              </span>
              <button
                onClick={() => {
                  setPartnerBranch('ALL');
                  setStoreOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between mb-1 ${
                  session.storeId === 'ALL'
                    ? 'bg-[#facc15] text-[#6c5700] font-bold'
                    : 'text-[#e9e1dd] hover:bg-[#2d2927]'
                }`}
              >
                <div>
                  <span className="block">All Connected Vendors (Abu Dhabi Hub)</span>
                  <span className="text-[10px] opacity-80">
                    Executive view across all Customer App restaurants &amp; stores
                  </span>
                </div>
                {session.storeId === 'ALL' && (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
              </button>

              <div className="border-t border-[#383432]/60 my-1 pt-1">
                {SHARED_ABU_DHABI_STORES.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      setPartnerBranch(store.id);
                      setStoreOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      session.storeId === store.id
                        ? 'bg-[#facc15] text-[#6c5700] font-bold'
                        : 'text-[#e9e1dd] hover:bg-[#2d2927]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{store.nameEn}</span>
                        {!store.isApproved && (
                          <span className="px-1.5 py-0.2 rounded bg-[#93000a] text-[#ffdad6] text-[9px] font-bold">
                            UNAPPROVED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-75 block truncate">
                        {store.categoryDisplayName} • {store.zoneName}
                      </span>
                    </div>
                    {session.storeId === store.id && (
                      <span className="material-symbols-outlined text-sm shrink-0">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md w-full hidden xl:block">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d1c6ab] text-lg">
            search
          </span>
          <input
            value={searchVal}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-[#1e1b19] border border-[#383432]/40 rounded-xl text-[#e9e1dd] placeholder:text-[#d1c6ab]/40 text-xs focus:outline-none focus:ring-1 focus:ring-[#ba880f] transition-all"
            placeholder="Search orders, menu items, vendors, or guests..."
            type="text"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Dedicated Android APK & Install App Button */}
        <button
          onClick={() => {
            setModalTab('apk');
            setSupabaseOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#10b981]/60 bg-[#10b981]/15 hover:bg-[#10b981]/25 transition-all text-left cursor-pointer shadow-sm"
          title="Download Android Capacitor Package (.zip) or Install Quick Shop Partner on Android"
        >
          <span className="material-symbols-outlined text-[#10b981] text-lg">android</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[#10b981] leading-none tracking-wider">
              Get Android APK
            </span>
            <span className="text-[9px] text-[#e9e1dd] font-mono leading-none mt-0.5">
              Download / Install
            </span>
          </div>
        </button>

        {/* Shared Backend & Customer App Bridge Button */}
        <button
          onClick={() => {
            setModalTab('bridge');
            setSupabaseOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#f7bd48]/60 bg-[#2d2927] hover:bg-[#383432] transition-all text-left cursor-pointer shadow-sm"
          title={`Test Connection Between Customer App & Restaurant App (${SUPABASE_PROJECT_ID})`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[#facc15] leading-none tracking-wider">
              Test Connection
            </span>
            <span className="text-[9px] text-[#e9e1dd] font-mono leading-none mt-0.5">
              Customer ↔ Partner
            </span>
          </div>
          {syncedActions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#10b981]/20 text-[#10b981] text-[9px] font-bold">
              {syncedActions.length}
            </span>
          )}
        </button>

        {/* Acoustic Chime Toggle */}
        <button
          onClick={handleChimeClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            chimeActive
              ? 'bg-[#1e1b19] border-[#f7bd48]/40 text-[#f7bd48] shadow-sm'
              : 'bg-[#1e1b19] border-[#383432] text-[#d1c6ab]/50'
          }`}
          title="Toggle Acoustic Signal Alert"
        >
          <span className="material-symbols-outlined text-lg">
            {chimeActive ? 'volume_up' : 'volume_off'}
          </span>
          <span className="text-xs hidden sm:inline font-medium">
            {chimeActive ? 'Chime Live' : 'Muted'}
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl bg-[#1e1b19] border border-[#383432]/50 text-[#d1c6ab] hover:text-[#e9e1dd] hover:bg-[#2d2927] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f7bd48] text-[#412d00] text-[11px] flex items-center justify-center font-bold shadow-md">
              3
            </span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#221f1d] border border-[#383432] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#383432]/50">
                <span className="text-xs font-bold text-[#ffecb9] uppercase tracking-wider">
                  Live Terminal Alerts
                </span>
                <span className="text-[10px] text-[#f7bd48] font-semibold">3 Unread</span>
              </div>
              <div className="space-y-2 mt-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifOpen(false);
                      onNavigate('live-orders');
                    }}
                    className="p-2 rounded-lg bg-[#2d2927] hover:bg-[#383432] cursor-pointer transition-colors border-l-2 border-[#facc15]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#e9e1dd]">{n.title}</span>
                      <span className="text-[10px] text-[#d1c6ab]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#d1c6ab] mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-2 cursor-pointer group"
          >
            <div className="flex flex-col text-right hidden lg:block">
              <span className="text-xs text-[#e9e1dd] font-semibold leading-tight group-hover:text-[#ffecb9]">
                {session.operator}
              </span>
              <span className="text-[10px] text-[#f7bd48] uppercase font-medium">
                {session.role}
              </span>
            </div>
            <div className="relative flex items-center gap-1.5 p-1 rounded-full bg-[#1e1b19] border border-[#383432]/60 hover:border-[#f7bd48]/50 transition-all">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrlF07D7rcBKVtzkU4_A51hJFZgKReEOtctmAqEotlcBypQJMRlHl26LyYOa3tIQeKb8NwFIldaLy6zW0Wd2XzOS11wWEOw05lX2MI0SdiWOEx_izf9ynUDaWYwRcFLYB4RGpDeWTEPWQufNxo_sOEK41nFzMT6DOrWzgAADsoew9EsCNK9bdA84yzmp8bdAMXwJ5Fckop26XoUT7Ct5C2UiF4rwhqCqTelxxp3cKop9R9gkMzFJw"
              />
              <span className="material-symbols-outlined text-[#d1c6ab] text-base pr-1">
                keyboard_arrow_down
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-[#221f1d] border border-[#383432] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-[#383432]/50">
                <p className="text-xs font-bold text-[#ffecb9]">{session.operator}</p>
                <p className="text-[11px] text-[#d1c6ab] truncate">{session.email}</p>
                <p className="text-[10px] text-[#f7bd48] mt-0.5 truncate">{session.branch}</p>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('profile-zones');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#e9e1dd] hover:bg-[#2d2927] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm text-[#f7bd48]">badge</span>
                  <span>Restaurant Profile &amp; Zones</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('settings-tax');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#e9e1dd] hover:bg-[#2d2927] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm text-[#f7bd48]">settings</span>
                  <span>Partner Settings</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#ffb4ab] hover:bg-[#93000a]/30 flex items-center gap-2 mt-1 border-t border-[#383432]/50 pt-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Switch Vendor / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Supabase Backend & Customer App Bridge Modal */}
      {supabaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100e0c]/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl bg-[#221f1d] border border-[#f7bd48]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-[#1e1b19] border-b border-[#383432] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
                  <span className="material-symbols-outlined text-2xl">sync_alt</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      Shared Supabase Backend: Food Delivery App ↔ Delivery App
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        getLastSupabaseError()
                          ? 'bg-[#93000a]/30 text-[#ffdad6]'
                          : 'bg-[#10b981]/20 text-[#10b981]'
                      }`}
                    >
                      {SUPABASE_PROJECT_ID} • {getLastSupabaseError() ? 'SETUP REQUIRED' : 'READY'}
                    </span>
                  </div>
                  <p className="text-xs text-[#d1c6ab]">
                    Verify live connection between{' '}
                    <span className="text-[#ffecb9] font-mono">
                      fatima-hub-code228/vayora
                    </span>{' '}
                    (Customer App) and{' '}
                    <span className="text-[#ffecb9] font-mono">
                      fatima-hub-code228/delivery-app
                    </span>{' '}
                    (Partner Portal).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSupabaseOpen(false)}
                className="p-1.5 rounded-lg bg-[#2d2927] text-[#d1c6ab] hover:text-[#e9e1dd] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Sub-Navigation */}
            <div className="flex flex-wrap border-b border-[#383432] bg-[#161311] px-5 pt-2 gap-2">
              <button
                onClick={() => setModalTab('bridge')}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalTab === 'bridge'
                    ? 'bg-[#facc15] text-[#231b00]'
                    : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                1. Check Both Apps Connected (Live Order Test)
              </button>
              <button
                onClick={() => setModalTab('apk')}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalTab === 'apk'
                    ? 'bg-[#facc15] text-[#231b00]'
                    : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                2. Where is the APK File? (Android Build Guide)
              </button>
              <button
                onClick={() => setModalTab('telemetry')}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalTab === 'telemetry'
                    ? 'bg-[#facc15] text-[#231b00]'
                    : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                3. Live Database Log ({syncedActions.length})
              </button>
              <button
                onClick={() => setModalTab('code')}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalTab === 'code'
                    ? 'bg-[#facc15] text-[#231b00]'
                    : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
                }`}
              >
                4. Customer App Kotlin Sync &amp; SQL
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#e9e1dd]">
              {modalTab === 'bridge' && (
                <div className="space-y-5">
                  {/* Top Banner: 1-Click Automated End-to-End Verification */}
                  <div className="p-4 rounded-xl bg-[#1e1b19] border border-[#f7bd48]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#ffecb9] uppercase tracking-wider flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#10b981] text-base">
                            verified
                          </span>
                          1-Click Live Connection Verification (No APK Needed to Test Database)
                        </span>
                        <p className="text-[11px] text-[#d1c6ab] mt-0.5">
                          Tests real order creation from Customer App → Restaurant App retrieval →
                          Restaurant Accept → Customer App status sync in Supabase (
                          <code className="text-[#f7bd48]">{SUPABASE_PROJECT_ID}</code> •{' '}
                          <code className="text-[#ffecb9]">public."order"</code> +{' '}
                          <code className="text-[#ffecb9]">public."order_items"</code>).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={runLiveConnectionDiagnostic}
                        disabled={verifyingConnection}
                        className="px-4 py-2.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                        <span>
                          {verifyingConnection
                            ? 'Running Live Supabase Test...'
                            : 'Run 1-Click Connection Test Now'}
                        </span>
                      </button>
                    </div>

                    {checkSteps.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#383432]/60">
                        {checkSteps.map((s, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border ${
                              s.status === 'pass'
                                ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#d1fae5]'
                                : s.status === 'fail'
                                ? 'bg-[#93000a]/30 border-[#ffb4ab]/40 text-[#ffdad6]'
                                : s.status === 'running'
                                ? 'bg-[#facc15]/10 border-[#facc15]/40 text-[#ffecb9]'
                                : 'bg-[#161311] border-[#383432] text-[#d1c6ab]'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-[11px]">
                              <span className="material-symbols-outlined text-sm">
                                {s.status === 'pass'
                                  ? 'check_circle'
                                  : s.status === 'fail'
                                  ? 'error'
                                  : s.status === 'running'
                                  ? 'sync'
                                  : 'schedule'}
                              </span>
                              <span>{s.step}</span>
                            </div>
                            <p className="text-[10px] opacity-90 mt-1">{s.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Place Real Order as Customer App */}
                    <form
                      onSubmit={handlePlaceCustomerOrder}
                      className="lg:col-span-6 p-4 rounded-xl bg-[#1e1b19] border border-[#383432] space-y-3.5"
                    >
                      <div className="flex items-center justify-between border-b border-[#383432]/60 pb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#f7bd48] block">
                            Step A: Place Order as Customer App (Food Delivery App)
                          </span>
                          <span className="text-[10px] text-[#d1c6ab]">
                            Inserts a real order into Supabase `public."order"` &amp; `public."order_items"`
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-[#f7bd48]">
                          phone_iphone
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Select Abu Dhabi Store / Restaurant
                          </label>
                          <select
                            value={simStoreId}
                            onChange={(e) => setSimStoreId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                          >
                            {SHARED_ABU_DHABI_STORES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nameEn} ({s.categoryDisplayName}){' '}
                                {!s.isApproved ? '— [UNAPPROVED / BLOCKED]' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Select Real Product from Shared Catalog
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={simProductId}
                              onChange={(e) => setSimProductId(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                            >
                              {storeProductsForSim.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nameEn} — AED {p.priceAed.toFixed(2)} ({p.weightOrPortion})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={simQty}
                              onChange={(e) => setSimQty(Number(e.target.value) || 1)}
                              className="w-16 px-2 py-2 rounded-lg bg-[#161311] border border-[#383432] text-xs text-center text-[#ffecb9] font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            value={simCustomerName}
                            onChange={(e) => setSimCustomerName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Emirate (Geofence Check)
                          </label>
                          <select
                            value={simEmirate}
                            onChange={(e) => setSimEmirate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                          >
                            <option value="Abu Dhabi">Abu Dhabi (Supported)</option>
                            <option value="Dubai">Dubai (Rejected by Geofence)</option>
                            <option value="Sharjah">Sharjah (Rejected by Geofence)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Abu Dhabi Service Zone
                          </label>
                          <select
                            value={simZoneId}
                            onChange={(e) => setSimZoneId(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                          >
                            {SHARED_ABU_DHABI_ZONES.map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.nameEn} (+AED {z.deliveryFeeAed})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Building / Tower / Villa
                          </label>
                          <input
                            type="text"
                            value={simBuilding}
                            onChange={(e) => setSimBuilding(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase text-[#d1c6ab] font-bold block mb-1">
                            Special Delivery / Kitchen Notes
                          </label>
                          <input
                            type="text"
                            value={simNotes}
                            onChange={(e) => setSimNotes(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#161311] border border-[#383432] text-xs text-[#e9e1dd]"
                          />
                        </div>
                      </div>

                      {simResult && (
                        <div
                          className={`p-3 rounded-lg border text-[11px] ${
                            simResult.success
                              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#d1fae5]'
                              : 'bg-[#93000a]/30 border-[#ffb4ab]/40 text-[#ffdad6]'
                          }`}
                        >
                          <p className="font-semibold">{simResult.message}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={simSubmitting}
                        className="w-full py-2.5 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#231b00] font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">
                          shopping_bag
                        </span>
                        <span>
                          {simSubmitting
                            ? 'Saving Customer Order to Supabase...'
                            : 'Place Live Customer Order in Shared Supabase'}
                        </span>
                      </button>
                    </form>

                    {/* Right: Live Order Synchronization Status across Both Apps */}
                    <div className="lg:col-span-6 p-4 rounded-xl bg-[#1e1b19] border border-[#383432] flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between border-b border-[#383432]/60 pb-2 mb-3">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#f7bd48] block">
                              Step B: Restaurant Updates &amp; Customer Status (`public."order"`)
                            </span>
                            <span className="text-[10px] text-[#d1c6ab]">
                              Click Accept / Ready / Delivered below to see both apps update live
                            </span>
                          </div>
                          <button
                            onClick={refreshLiveCustomerOrders}
                            className="px-2 py-1 rounded bg-[#2d2927] hover:bg-[#383432] text-[10px] text-[#ffecb9] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">refresh</span>
                            Refresh
                          </button>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {liveCustomerOrders.map((ord) => (
                            <div
                              key={ord.id}
                              className="p-3 rounded-lg bg-[#161311] border border-[#383432] space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-[#ffecb9] text-xs">
                                      #{ord.id}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-[#2d2927] text-[#f7bd48] text-[10px] font-semibold truncate">
                                      {ord.storeName}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#d1c6ab] truncate mt-0.5">
                                    Guest: {ord.customer_name} • AED{' '}
                                    {Number(ord.total_aed || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-bold uppercase">
                                    Restaurant: {ord.status}
                                  </span>
                                  <span className="block text-[10px] text-[#ffecb9] font-bold mt-0.5">
                                    Customer App: {ord.customerStatus.code}
                                  </span>
                                </div>
                              </div>

                              {/* Inline Restaurant Action Buttons */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#383432]/50">
                                <span className="text-[10px] text-[#d1c6ab] mr-1">
                                  Update as Restaurant:
                                </span>
                                <button
                                  type="button"
                                  disabled={updatingOrderId === ord.id || ord.status === 'cooking'}
                                  onClick={() => handleInlineStatusUpdate(ord, 'cooking')}
                                  className="px-2 py-1 rounded bg-[#facc15]/20 hover:bg-[#facc15]/30 border border-[#facc15]/40 text-[#ffecb9] text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                >
                                  Accept (PREPARING)
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId === ord.id || ord.status === 'ready_for_pickup'
                                  }
                                  onClick={() => handleInlineStatusUpdate(ord, 'ready_for_pickup')}
                                  className="px-2 py-1 rounded bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/40 text-[#bfdbfe] text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                >
                                  Ready (ON_THE_WAY)
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId === ord.id || ord.status === 'completed'
                                  }
                                  onClick={() => handleInlineStatusUpdate(ord, 'completed')}
                                  className="px-2 py-1 rounded bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/40 text-[#a7f3d0] text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                >
                                  Complete (DELIVERED)
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingOrderId === ord.id || ord.status === 'declined'}
                                  onClick={() => handleInlineStatusUpdate(ord, 'declined')}
                                  className="px-2 py-1 rounded bg-[#93000a]/40 hover:bg-[#93000a]/60 border border-[#ffb4ab]/30 text-[#ffdad6] text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                >
                                  Reject (DECLINED)
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#161311] border border-[#383432]/70 text-[11px] text-[#d1c6ab]">
                        <strong className="text-[#ffecb9]">Also available in Live Orders:</strong>{' '}
                        Click{' '}
                        <button
                          onClick={() => {
                            setSupabaseOpen(false);
                            onNavigate('live-orders');
                          }}
                          className="text-[#facc15] underline font-bold cursor-pointer"
                        >
                          Live Orders
                        </button>{' '}
                        on the left sidebar to manage orders in the full Restaurant Kitchen Board.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'apk' && (
                <div className="space-y-4">
                  {/* Direct Download & 1-Click Android Install Hub */}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-[#1e1b19] via-[#27221e] to-[#1e1b19] border border-[#10b981]/50 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold uppercase tracking-wider">
                            Ready to Download &amp; Install
                          </span>
                          <span className="text-xs font-mono text-[#f7bd48]">
                            com.vayora.quickshoppartner • v1.0.0
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#ffecb9]">
                          Quick Shop Partner — Android Package &amp; Direct Phone Installer
                        </h4>
                        <p className="text-xs text-[#d1c6ab] max-w-2xl">
                          Download the complete pre-synced Android Capacitor bundle (
                          <code className="text-[#ffecb9]">
                            QuickShopPartner-Android-Project.zip
                          </code>
                          ) with 1-click APK build scripts, or install the standalone Android
                          WebAPK directly onto your phone right now.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <a
                          href="/QuickShopPartner-Android-Project.zip"
                          download="QuickShopPartner-Android-Project.zip"
                          className="px-4 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#ba880f] text-[#231b00] hover:text-[#ffecb9] font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">folder_zip</span>
                          <span>Download Android Project (.ZIP • 10.5 MB)</span>
                        </a>

                        {!pwaInstalled && (
                          <button
                            onClick={handleInstallWebApk}
                            className="px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">
                              install_mobile
                            </span>
                            <span>Install App on This Device</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {installNotice && (
                      <div className="p-3 rounded-lg bg-[#100e0c] border border-[#f7bd48]/40 text-xs text-[#ffecb9] flex items-center justify-between gap-2">
                        <span>{installNotice}</span>
                        <button
                          onClick={() => setInstallNotice(null)}
                          className="text-[#d1c6ab] hover:text-white text-[11px] font-bold"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Direct Helper Downloads Row */}
                    <div className="pt-3 border-t border-[#383432]/60 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-[#d1c6ab] font-semibold mr-1">
                        1-Click APK Build Scripts:
                      </span>
                      <a
                        href="/build-android-apk.bat"
                        download="build-android-apk.bat"
                        className="px-3 py-1.5 rounded-lg bg-[#161311] hover:bg-[#2d2927] border border-[#383432] text-[#f7bd48] text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>build-android-apk.bat (Windows)</span>
                      </a>
                      <a
                        href="/build-android-apk.sh"
                        download="build-android-apk.sh"
                        className="px-3 py-1.5 rounded-lg bg-[#161311] hover:bg-[#2d2927] border border-[#383432] text-[#f7bd48] text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>build-android-apk.sh (Mac / Linux)</span>
                      </a>
                      <a
                        href="/QuickShopPartner-Android-Package.tar.gz"
                        download="QuickShopPartner-Android-Package.tar.gz"
                        className="px-3 py-1.5 rounded-lg bg-[#161311] hover:bg-[#2d2927] border border-[#383432] text-[#d1c6ab] text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">archive</span>
                        <span>QuickShopPartner-Android-Package.tar.gz</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432] space-y-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold uppercase">
                        Method 1 — Install Immediately on Phone
                      </span>
                      <h5 className="text-xs font-bold text-[#e9e1dd]">
                        Scan or Open Shared App URL on Android
                      </h5>
                      <p className="text-[11px] text-[#d1c6ab]">
                        Open this URL in Chrome on your Android phone and tap{' '}
                        <strong className="text-[#ffecb9]">Install Quick Shop Partner</strong>:
                      </p>
                      <div className="p-2 rounded-lg bg-[#161311] border border-[#383432] font-mono text-[10px] text-[#f7bd48] break-all">
                        https://ais-pre-el4ykrrgssfsd7dcvs4cnh-429922206857.asia-northeast1.run.app
                      </div>
                      <p className="text-[10px] text-[#d1c6ab]">
                        Android Chrome packages the Web App Manifest &amp; Service Worker into a
                        native full-screen Android launcher app connected to{' '}
                        <code className="text-[#ffecb9]">{SUPABASE_PROJECT_ID}.supabase.co</code>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432] space-y-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#facc15]/20 text-[#facc15] text-[10px] font-bold uppercase">
                        Method 2 — GitHub Actions Cloud APK
                      </span>
                      <h5 className="text-xs font-bold text-[#e9e1dd]">
                        Download Compiled `app-debug.apk` from GitHub
                      </h5>
                      <p className="text-[11px] text-[#d1c6ab]">
                        We configured{' '}
                        <code className="text-[#ffecb9]">
                          .github/workflows/build-android-apk.yml
                        </code>{' '}
                        to compile the binary APK automatically on GitHub servers:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#d1c6ab]">
                        <li>
                          Push/sync to GitHub → open the{' '}
                          <strong className="text-[#ffecb9]">Actions</strong> tab.
                        </li>
                        <li>
                          Click{' '}
                          <strong className="text-[#ffecb9]">
                            Build Quick Shop Partner Android APK &amp; AAB
                          </strong>
                          .
                        </li>
                        <li>
                          Download{' '}
                          <code className="text-[#f7bd48]">QuickShopPartner-Android-APK</code> (
                          <code className="text-[#ffecb9]">app-debug.apk</code>).
                        </li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432] space-y-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#f7bd48]/20 text-[#f7bd48] text-[10px] font-bold uppercase">
                        Method 3 — Local ZIP + 1-Click Script
                      </span>
                      <h5 className="text-xs font-bold text-[#e9e1dd]">
                        Unzip &amp; Run `build-android-apk.bat`
                      </h5>
                      <p className="text-[11px] text-[#d1c6ab]">
                        Download{' '}
                        <code className="text-[#ffecb9]">
                          QuickShopPartner-Android-Project.zip
                        </code>{' '}
                        above, extract it, or run inside your project folder:
                      </p>
                      <pre className="p-2.5 rounded-lg bg-[#161311] border border-[#383432] font-mono text-[10px] text-[#ffecb9] overflow-x-auto">
{`npm install --legacy-peer-deps && npm run build
npx cap sync android
cd android && ./gradlew assembleDebug`}
                      </pre>
                      <p className="text-[10px] text-[#d1c6ab]">
                        Output:{' '}
                        <code className="text-[#f7bd48]">
                          android/app/build/outputs/apk/debug/app-debug.apk
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'telemetry' && (
                <div className="space-y-4">
                  {/* Credentials Card */}
                  <div className="p-4 rounded-xl bg-[#1e1b19] border border-[#383432] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#383432]/40">
                      <span className="text-[11px] uppercase font-bold text-[#f7bd48] tracking-wider">
                        Shared Supabase Backend Configuration
                      </span>
                      <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        36 Products • 16 Zones • 9 Vendors Synced
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-[#d1c6ab] block uppercase">
                          Project ID
                        </span>
                        <span className="font-mono text-xs text-[#ffecb9] font-bold">
                          {SUPABASE_PROJECT_ID}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#d1c6ab] block uppercase">
                          Supabase Endpoint
                        </span>
                        <span className="font-mono text-[11px] text-[#e9e1dd] truncate block">
                          {SUPABASE_URL}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Action Telemetry Feed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#ffecb9] uppercase tracking-wider">
                        Live Synced Actions ({syncedActions.length})
                      </span>
                      <span className="text-[10px] text-[#d1c6ab]">Real-time Event Stream</span>
                    </div>

                    {syncedActions.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/60 text-center">
                        <span className="material-symbols-outlined text-3xl text-[#f7bd48] mb-1">
                          sync_saved_locally
                        </span>
                        <p className="text-xs font-semibold text-[#e9e1dd]">
                          Awaiting User Actions
                        </p>
                        <p className="text-[11px] text-[#d1c6ab] mt-0.5">
                          Place a customer order, accept orders, or modify menu inventory to see
                          live Supabase sync events appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {syncedActions.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/60 flex items-start justify-between gap-3"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-[#10b981] text-base mt-0.5">
                                check_circle
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#f7bd48] text-xs">
                                    {act.action_type}
                                  </span>
                                  <span className="text-[10px] text-[#d1c6ab]">
                                    Target: {act.entity_id}
                                  </span>
                                </div>
                                {act.details && (
                                  <p className="font-mono text-[10px] text-[#d1c6ab] mt-0.5 truncate max-w-sm">
                                    {JSON.stringify(act.details)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#d1c6ab] shrink-0 font-mono">
                              {new Date(act.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalTab === 'code' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#ffecb9] uppercase tracking-wider">
                        Customer App (fatima-hub-code228/vayora) Kotlin Supabase Client
                      </span>
                      <button
                        onClick={() => {
                          fetch('/customer-app-supabase/VayoraSupabaseClient.kt')
                            .then((r) => r.text())
                            .then((txt) => {
                              navigator.clipboard.writeText(txt);
                              setCopiedKotlin(true);
                              setTimeout(() => setCopiedKotlin(false), 2500);
                            });
                        }}
                        className="px-2.5 py-1 rounded bg-[#2d2927] hover:bg-[#383432] text-[#f7bd48] font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {copiedKotlin ? 'check' : 'content_copy'}
                        </span>
                        <span>
                          {copiedKotlin
                            ? 'Kotlin Code Copied!'
                            : 'Copy VayoraSupabaseClient.kt'}
                        </span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#d1c6ab]">
                      Drop{' '}
                      <code className="text-[#ffecb9]">VayoraSupabaseClient.kt</code> into{' '}
                      <code className="text-[#ffecb9]">
                        app/src/main/java/com/example/data/remote/VayoraSupabaseClient.kt
                      </code>{' '}
                      in your <strong className="text-[#e9e1dd]">vayora</strong> Customer App repo
                      so <code className="text-[#ffecb9]">VayoraViewModel.placeOrder()</code> and
                      order polling connect directly to{' '}
                      <code className="text-[#f7bd48]">{SUPABASE_URL}</code> (tables{' '}
                      <code className="text-[#ffecb9]">public."order"</code> and{' '}
                      <code className="text-[#ffecb9]">public."order_items"</code>).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#ffecb9] uppercase tracking-wider">
                        Additive SQL Migration for {SUPABASE_PROJECT_ID} (Preserves Existing Tables)
                      </span>
                      <button
                        onClick={() => {
                          const sql = `-- Run in Supabase SQL Editor for project ${SUPABASE_PROJECT_ID} (${SUPABASE_URL})\n-- Full migration file: supabase/migrations/20261029_rbdsjgalxoehuwskzvit_customer_db_alignment.sql\nALTER TABLE public."order"\n  ADD COLUMN IF NOT EXISTS store_name text,\n  ADD COLUMN IF NOT EXISTS customer_name text,\n  ADD COLUMN IF NOT EXISTS customer_phone text,\n  ADD COLUMN IF NOT EXISTS vip_tier text,\n  ADD COLUMN IF NOT EXISTS status text DEFAULT 'CONFIRMED',\n  ADD COLUMN IF NOT EXISTS partner_status text DEFAULT 'incoming',\n  ADD COLUMN IF NOT EXISTS subtotal_aed numeric(10,2) DEFAULT 0.00,\n  ADD COLUMN IF NOT EXISTS delivery_fee_aed numeric(10,2) DEFAULT 0.00,\n  ADD COLUMN IF NOT EXISTS total_aed numeric(10,2) DEFAULT 0.00,\n  ADD COLUMN IF NOT EXISTS delivery_zone text,\n  ADD COLUMN IF NOT EXISTS delivery_address jsonb,\n  ADD COLUMN IF NOT EXISTS payment_method text,\n  ADD COLUMN IF NOT EXISTS courier text,\n  ADD COLUMN IF NOT EXISTS notes text,\n  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();\n\nALTER TABLE public."order_items"\n  ADD COLUMN IF NOT EXISTS product_name_en text,\n  ADD COLUMN IF NOT EXISTS product_name_ar text,\n  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,\n  ADD COLUMN IF NOT EXISTS unit_price_aed numeric(10,2) DEFAULT 0.00,\n  ADD COLUMN IF NOT EXISTS weight_or_portion text,\n  ADD COLUMN IF NOT EXISTS special_notes text;`;
                          navigator.clipboard.writeText(sql);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2500);
                        }}
                        className="px-2.5 py-1 rounded bg-[#2d2927] hover:bg-[#383432] text-[#f7bd48] font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {copiedSql ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedSql ? 'SQL Copied!' : 'Copy Additive SQL'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#d1c6ab]">
                      Preserves existing singular/plural tables{' '}
                      <code className="text-[#ffecb9]">category</code>,{' '}
                      <code className="text-[#ffecb9]">"order"</code>,{' '}
                      <code className="text-[#ffecb9]">order_items</code>,{' '}
                      <code className="text-[#ffecb9]">product</code>,{' '}
                      <code className="text-[#ffecb9]">rider_profile</code>,{' '}
                      <code className="text-[#ffecb9]">store</code>, and{' '}
                      <code className="text-[#ffecb9]">"user"</code> without creating duplicate
                      tables.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#1e1b19] border-t border-[#383432] flex items-center justify-between">
              <span className="text-[11px] text-[#d1c6ab]">
                Shared Backend:{' '}
                <strong className="text-[#e9e1dd]">{SUPABASE_PROJECT_ID}.supabase.co</strong> •
                Active Terminal: <strong className="text-[#f7bd48]">{session.branch}</strong>
              </span>
              <button
                onClick={() => setSupabaseOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
