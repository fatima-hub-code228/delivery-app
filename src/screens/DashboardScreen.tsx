import React, { useState, useEffect, useCallback } from 'react';
import ThreeGoldenCloche from '../components/ThreeGoldenCloche';
import { ScreenId } from '../types';
import { playOrderChime } from '../components/AudioChime';
import {
  acceptOrderInSupabase,
  fetchOrdersFromSupabase,
  getLastSupabaseError,
  getPartnerSession,
  onPartnerSessionChange,
  onSupabaseAction,
  subscribeToOrdersRealtime,
} from '../lib/supabase';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenOrder: (orderId: string) => void;
}

export default function DashboardScreen({ onNavigate, onOpenOrder }: DashboardScreenProps) {
  const [velocityFilter, setVelocityFilter] = useState<'today' | 'yesterday' | '7days' | 'month'>('today');
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string>(() => getPartnerSession().storeId);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3800);
  };

  const [ordersList, setOrdersList] = useState<
    Array<{
      id: string;
      rawId: string;
      badge: string;
      badgeColor: string;
      dest: string;
      selection: string;
      note: string;
      total: string;
      slaRemaining: string;
    }>
  >([]);
  const [dbError, setDbError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const currentStoreId = getPartnerSession().storeId;
    setActiveStoreId(currentStoreId);
    const data = await fetchOrdersFromSupabase(currentStoreId);
    if (data) {
      setDbError(null);
      const incoming = data.filter((o) => o.status === 'incoming');
      setOrdersList(
        incoming.map((o) => ({
          id: o.id.startsWith('#') ? o.id : `#${o.id}`,
          rawId: o.id,
          badge: o.storeName || o.vip_tier || 'VIP',
          badgeColor: o.vip_tier?.includes('Platinum')
            ? 'bg-[#ffe083] text-[#231b00]'
            : 'bg-[#2d2927] text-[#f7bd48]',
          dest: `${o.delivery_zone || 'Abu Dhabi Enclave'} (${o.customer_name || 'Guest'})`,
          selection:
            Array.isArray(o.items) && o.items.length > 0
              ? o.items.map((i: any) => `${i.qty || i.quantity || 1}x ${i.name || i.name_en}`).join(', ')
              : 'Order Items',
          note: `${o.notes || 'Standard preparation'} • Customer App: ${o.customerStatus.code}`,
          total: Number(o.total_aed || 0).toFixed(2),
          slaRemaining: '02:00',
        }))
      );
    } else {
      setOrdersList([]);
      setDbError(getLastSupabaseError());
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const unsubSession = onPartnerSessionChange(() => {
      loadOrders();
    });
    const unsubAction = onSupabaseAction((act) => {
      if (act.action_type.startsWith('order_') || act.action_type === 'customer_order_placed') {
        loadOrders();
      }
    });
    const unsubRealtime = subscribeToOrdersRealtime(() => {
      loadOrders();
    });
    return () => {
      unsubSession();
      unsubAction();
      unsubRealtime();
    };
  }, [loadOrders]);

  const handleAccept = async (orderId: string) => {
    setAcceptingOrderId(orderId);
    try {
      const res = await acceptOrderInSupabase(orderId);
      if (res.success) {
        playOrderChime();
        showToast(
          `Order #${res.orderId} accepted! Partner status: '${res.newStatus}' → Customer App: '${res.customerStatus}'.`
        );
        setOrdersList((prev) => prev.filter((o) => o.rawId !== orderId && o.rawId !== res.orderId));
        await loadOrders();
      } else {
        showToast(`Failed to accept order #${orderId}: ${res.error}`);
      }
    } catch (err: any) {
      showToast(`Error accepting order #${orderId}: ${err?.message || 'Database error'}`);
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleMute = () => {
    setSoundMuted(!soundMuted);
    if (soundMuted) {
      playOrderChime();
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Hero Command Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1e1b19] p-6 lg:p-8 shadow-2xl border border-[#383432]/50">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#facc15]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#f7bd48] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#f7bd48]">
                OPERATIONAL COMMAND • Al Maryah Island Executive Suite
              </span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl font-bold tracking-tight text-[#ffecb9] leading-tight">
              Your Restaurant. One Powerful Dashboard.
            </h1>
            <p className="text-sm text-[#d1c6ab] mt-2 leading-relaxed">
              Real-time kitchen orchestration, delivery logistics, and revenue performance across Abu Dhabi. Good evening, GM Tariq Al-Mansoor.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d2927] text-xs font-semibold text-[#e9e1dd] border border-[#383432]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48]" />
                VIP Service Protocol: Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d2927] text-xs font-semibold text-[#e9e1dd] border border-[#383432]">
                <span className="material-symbols-outlined text-xs text-[#f7bd48]">schedule</span>
                Shift: Dinner Rush (18:00 – 00:30)
              </span>
            </div>
          </div>

          {/* Interactive 3D Fleet Dome Card */}
          <div className="w-full lg:w-80 h-44 rounded-xl bg-[#100e0c]/90 border border-[#ba880f]/30 overflow-hidden relative shadow-inner flex flex-col justify-end p-3">
            <div className="absolute inset-0">
              <ThreeGoldenCloche className="w-full h-full" cameraDistance={8.5} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-[#100e0c]/80 backdrop-blur-md text-[10px] uppercase font-bold text-[#f7bd48] tracking-widest border border-[#f7bd48]/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">local_shipping</span>
                LIVE FLEET DOME
              </span>
              <button
                onClick={() => onNavigate('live-orders')}
                className="text-[11px] text-[#ffecb9] hover:text-[#facc15] font-semibold underline underline-offset-2"
              >
                Track Live
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Dispatch Alert Strip */}
      {!alertDismissed && (
        <div className="p-4 rounded-xl bg-[#221f1d] border border-[#ba880f]/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#ba880f]/20 flex items-center justify-center text-[#f7bd48] shrink-0 border border-[#f7bd48]/30">
              <span className="material-symbols-outlined text-xl">alarm</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#ffecb9]">Urgent Dispatch Alert</span>
                <span className="px-2 py-0.5 rounded-full bg-[#93000a] text-[#ffdad6] text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  4 Pending
                </span>
              </div>
              <p className="text-xs text-[#d1c6ab] mt-0.5">
                4 incoming orders require kitchen acceptance within <strong className="text-[#f7bd48]">01:45</strong> to maintain UAE Michelin standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              onClick={handleMute}
              className="px-3.5 py-2 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#e9e1dd] transition-colors"
            >
              {soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            </button>
            <button
              onClick={() => onNavigate('live-orders')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#facc15] hover:bg-[#f7bd48] text-[#6c5700] text-xs font-bold transition-all shadow-[0_0_16px_rgba(250,204,21,0.25)]"
            >
              <span className="material-symbols-outlined text-sm font-bold">restaurant</span>
              <span>Open Live Board</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d1c6ab]">
              TODAY'S REVENUE
            </span>
            <span className="text-[11px] font-bold uppercase text-[#f7bd48]">AED</span>
          </div>
          <div className="mt-2">
            <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9] tracking-tight">
              18,450.00
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#383432]/40 flex items-center justify-between text-xs">
            <span className="text-[#f7bd48] font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +14.2% vs yesterday
            </span>
            <span className="text-[#d1c6ab]/70">Target: 20k</span>
          </div>
          <div className="w-full h-1.5 bg-[#2d2927] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-gradient-to-r from-[#ba880f] to-[#facc15] rounded-full" style={{ width: '92%' }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d1c6ab]">
              KITCHEN PIPELINE
            </span>
            <span className="material-symbols-outlined text-[#f7bd48] text-base">skillet</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9]">12</span>
            <span className="text-xs text-[#d1c6ab]">Active Orders</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#383432]/40 grid grid-cols-3 gap-1 text-center">
            <div className="p-1 rounded bg-[#2d2927]/60">
              <span className="block text-[10px] text-[#f7bd48] font-bold">4</span>
              <span className="text-[9px] text-[#d1c6ab] uppercase">PENDING</span>
            </div>
            <div className="p-1 rounded bg-[#2d2927]/60">
              <span className="block text-[10px] text-[#ffecb9] font-bold">6</span>
              <span className="text-[9px] text-[#d1c6ab] uppercase">COOKING</span>
            </div>
            <div className="p-1 rounded bg-[#2d2927]/60">
              <span className="block text-[10px] text-[#f7bd48] font-bold">2</span>
              <span className="text-[9px] text-[#d1c6ab] uppercase">READY</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d1c6ab]">
              AVG. PREP TIME
            </span>
            <span className="material-symbols-outlined text-[#f7bd48] text-base">timer</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9]">18.4</span>
            <span className="text-xs text-[#d1c6ab]">mins</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#383432]/40 flex items-center justify-between text-xs">
            <span className="text-[#f7bd48] font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">speed</span>
              -2.1 mins speed boost
            </span>
            <span className="text-[#d1c6ab]/70">SLA: &lt;20 min</span>
          </div>
          <div className="w-full h-1.5 bg-[#2d2927] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#f7bd48] rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d1c6ab]">
              GUEST EXPERIENCE
            </span>
            <span className="material-symbols-outlined text-[#facc15] text-base">star</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#ffecb9]">4.94</span>
            <div className="flex text-[#facc15] text-xs">★★★★★</div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#383432]/40 flex items-center justify-between text-xs">
            <span className="text-[#d1c6ab]">142 Abu Dhabi reviews today</span>
            <span className="text-[#f7bd48] font-bold">99.1% VIP</span>
          </div>
        </div>
      </section>

      {/* Middle Row: Revenue & Dining Velocity Chart + Kitchen Stations */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#ffecb9]">
                Revenue &amp; Dining Velocity
              </h2>
              <p className="text-xs text-[#d1c6ab] mt-0.5">
                Peak dining corridor observed: 19:00 – 22:30 GST
              </p>
            </div>
            <div className="flex items-center p-1 rounded-lg bg-[#221f1d] border border-[#383432]">
              {(['today', 'yesterday', '7days', 'month'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setVelocityFilter(key)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                    velocityFilter === key
                      ? 'bg-[#facc15] text-[#6c5700] shadow-sm'
                      : 'text-[#d1c6ab] hover:text-[#e9e1dd]'
                  }`}
                >
                  {key === '7days' ? '7 Days' : key}
                </button>
              ))}
            </div>
          </div>

          {/* Custom SVG Velocity Chart */}
          <div className="relative w-full h-52 flex items-end my-2">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 180">
              <defs>
                <linearGradient id="goldVelocityGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="760" y2="20" stroke="#2d2927" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="760" y2="70" stroke="#2d2927" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="760" y2="120" stroke="#2d2927" strokeDasharray="3 3" />
              <line x1="0" y1="165" x2="760" y2="165" stroke="#383432" />

              {/* Peak bar highlights */}
              <rect x="420" y="30" width="12" height="135" fill="#ba880f" opacity="0.45" rx="3" />
              <rect x="440" y="22" width="16" height="143" fill="#facc15" opacity="0.6" rx="3" />
              <rect x="465" y="40" width="14" height="125" fill="#ba880f" opacity="0.45" rx="3" />

              {/* Smooth Area Path */}
              <path
                d="M 0,150 Q 120,145 220,135 T 380,85 T 480,22 T 620,80 T 760,140 L 760,165 L 0,165 Z"
                fill="url(#goldVelocityGlow)"
              />
              {/* Stroke */}
              <path
                d="M 0,150 Q 120,145 220,135 T 380,85 T 480,22 T 620,80 T 760,140"
                fill="none"
                stroke="#facc15"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Peak Label Node */}
              <circle cx="480" cy="22" r="5" fill="#facc15" stroke="#161311" strokeWidth="2" />
              <text x="445" y="14" fill="#facc15" fontSize="11" fontWeight="bold">
                AED 4,820 / hr
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[#d1c6ab] text-[11px] pt-2">
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span className="text-[#facc15] font-bold">20:00 (Peak)</span>
            <span>22:00</span>
            <span>00:00</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-[#383432]/40 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#d1c6ab]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                Hourly Revenue Trend
              </span>
              <span className="flex items-center gap-1.5 text-[#d1c6ab]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#383432]" />
                Order Velocity (Covers)
              </span>
            </div>
            <span className="text-[#ffecb9] font-bold tracking-wider">
              AVG CHECK SIZE: AED 615.00
            </span>
          </div>
        </div>

        {/* Right Kitchen Stations (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Kitchen Stations
                </h3>
                <span className="text-[11px] text-[#d1c6ab]">Executive Line Telemetry</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold uppercase tracking-wider">
                Live Feed
              </span>
            </div>

            <div className="space-y-4 mt-4">
              {/* Station 1 */}
              <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#f7bd48]">outdoor_grill</span>
                    <span className="text-xs font-bold text-[#e9e1dd]">Grill Station</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#f7bd48] text-[10px] font-semibold">
                    Optimal
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#d1c6ab]">
                  <span>4 orders in queue</span>
                  <span className="text-[#e9e1dd] font-medium">Chef Marco Rossi</span>
                </div>
                <div className="w-full h-1 bg-[#2d2927] rounded-full overflow-hidden">
                  <div className="h-full bg-[#facc15] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Station 2 */}
              <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#f7bd48]">bakery_dining</span>
                    <span className="text-xs font-bold text-[#e9e1dd]">Pastry &amp; Dessert</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#f7bd48] text-[10px] font-semibold">
                    Optimal
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#d1c6ab]">
                  <span>2 orders active</span>
                  <span className="text-[#e9e1dd] font-medium">Chef Leila Haddad</span>
                </div>
                <div className="w-full h-1 bg-[#2d2927] rounded-full overflow-hidden">
                  <div className="h-full bg-[#f7bd48] rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              {/* Station 3 */}
              <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#ba880f]">two_wheeler</span>
                    <span className="text-xs font-bold text-[#e9e1dd]">Packaging &amp; Dispatch</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold">
                    Bay Busy
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#d1c6ab]">
                  <span>3 VIP chauffeurs waiting</span>
                  <span className="text-[#f7bd48] font-medium">Avg Handover: 2.2 min</span>
                </div>
                <div className="w-full h-1 bg-[#2d2927] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ba880f] rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playOrderChime();
              showToast('Kitchen Stations rebalanced across stations 1-4.');
            }}
            className="w-full mt-4 py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#ffecb9] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-[#f7bd48]">tune</span>
            <span>Rebalance Kitchen Stations</span>
          </button>
        </div>
      </section>

      {/* Bottom Row: Incoming Priority Orders Table + Item Availability & 86'd */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Orders Table (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Incoming Priority Orders
                </h3>
                <p className="text-xs text-[#d1c6ab] mt-0.5">
                  Real-time orders awaiting chef confirmation
                </p>
              </div>
              <button
                onClick={() => onNavigate('live-orders')}
                className="text-xs text-[#f7bd48] hover:text-[#ffecb9] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View All 38 Orders</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-[#d1c6ab]/70 border-b border-[#383432]/40 pb-2">
                    <th className="py-2.5 px-2">ORDER ID &amp; DEST.</th>
                    <th className="py-2.5 px-2">CURATED SELECTION</th>
                    <th className="py-2.5 px-2">TOTAL (AED)</th>
                    <th className="py-2.5 px-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#383432]/30 text-xs">
                  {ordersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-3 text-center text-[#d1c6ab]">
                        {dbError ? (
                          <div className="p-3 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffdad6] text-left">
                            <span className="font-bold block mb-1">
                              Shared Supabase Database Setup Pending (rbdsjgalxoehuwskzvit):
                            </span>
                            <span>{dbError}</span>
                          </div>
                        ) : (
                          'No live incoming orders in public."order" for the selected vendor.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    ordersList.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => onOpenOrder(ord.rawId)}
                        className="hover:bg-[#221f1d] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#ffecb9]">{ord.id}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ord.badgeColor}`}>
                              {ord.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#d1c6ab] block mt-0.5 truncate max-w-[160px]">
                            {ord.dest}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium text-[#e9e1dd] block">{ord.selection}</span>
                          <span className="text-[11px] text-[#d1c6ab]/80 block italic">{ord.note}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#ffecb9] text-sm">
                            {ord.total}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={acceptingOrderId === ord.rawId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(ord.rawId);
                              }}
                              className="px-2.5 py-1 rounded bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] font-bold text-[10px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              title="Accept Order & Update Supabase Status"
                            >
                              {acceptingOrderId === ord.rawId && (
                                <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                              )}
                              <span>{acceptingOrderId === ord.rawId ? 'Accepting...' : 'Accept'}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenOrder(ord.rawId);
                              }}
                              className="px-2.5 py-1 rounded bg-[#2d2927] hover:bg-[#ba880f] hover:text-[#392700] text-[#f7bd48] font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Item Availability & 86'd (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#f7bd48]">inventory</span>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                    Item Availability &amp; 86'd
                  </h3>
                  <span className="text-[11px] text-[#d1c6ab]">Live pantry inventory gating</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#f7bd48] text-[10px] font-bold">
                Shift Sync
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {/* Item 1 */}
              <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    alt="Wagyu Ribeye"
                    className="w-10 h-10 rounded-lg object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs8WyTvu0l60ERcVqbtIDYUXrUqsoQbx0uPNVwbvTVZYsEhM4qRu93kPXdHOQjwSD30g_BSB9VzRpFxJioSKYkZ29Qll93rcPVywnZO5ANZwy82YelgsirUq5H2YlmEBOJFAUGqZlISQAe7tsD_AOxE_7aVVwpHYsF6k5ACA5SOFABrrBcv0Oh0rtdNwepppf81U1cfK428EQnjOAesCSbJ9eA8yhc_mccMM2PY5pt8jlf0r5U2iw"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#e9e1dd]">Wagyu Ribeye MB9+</h4>
                    <span className="text-[11px] text-[#f7bd48]">Only 3 portions remaining</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] font-bold shrink-0">
                  Auto-86
                </span>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    alt="Caviar"
                    className="w-10 h-10 rounded-lg object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8szzv4EA-xFJXTJh9_uQO-ffkBwRfg7cwKscFGDq-UXn4duQXDELTdcJ1bYKTwEiPbNObYHDLjZGxW6Kcpcfa1cx4NK1sMyfBjzEoq0W1LvmPNRG8XzHsfGKTXmyTNTR39XN-Kji0ItjFegn_hdtC4VTCNpFY8RpKqDOrWNGwexUezwIpJ2aAOLJ8HOcgXss_A6KKd2XechwprufsW2vGpLaoHgAm70oncq0O08EVlE5fjxkRnXo"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#e9e1dd]">Imperial Osetra Caviar</h4>
                    <span className="text-[11px] text-[#d1c6ab]">Restocked (18 tins in chiller)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#ffecb9] text-[10px] font-bold shrink-0">
                  Available
                </span>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-lg bg-[#221f1d] border border-[#383432]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    alt="Cake"
                    className="w-10 h-10 rounded-lg object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo8xNtGH5b6L2WycxFdjA3yFEG07Sju7qMlfrqUeeVzooYzlTZ4jFEoD2js0TJsCcdwufiL1oO2texYYgrnH3wtr7TCo2gw6LV3EO30EvTIEc6MVHqSue5lRS3EFydQDkwo-cq2vypZv2xiy8lznaa30jRm9lDEcmHNbQWc7IheFwqogEyRayOqk1_TgnRFvmVB3wphmDwT1023nNHOxEVSNQHw7dXETgrVFqb9TadzPZ4dDegUsE"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#e9e1dd]">Signature Saffron Cake</h4>
                    <span className="text-[11px] text-[#d1c6ab]">Pastry Station Stock: 14 pcs</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#2d2927] text-[#ffecb9] text-[10px] font-bold shrink-0">
                  Available
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('menu-inventory')}
            className="w-full mt-4 py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-xs font-semibold text-[#f7bd48] transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>Quick 86 / Toggle Menu Items</span>
          </button>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="px-5 py-3 rounded-xl bg-[#2d2927] border border-[#f7bd48]/40 text-[#e9e1dd] shadow-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[#f7bd48]">check_circle</span>
            <span className="text-xs font-semibold">{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
