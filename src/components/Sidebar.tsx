import React from 'react';
import { ScreenId } from '../types';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  pendingOrdersCount?: number;
}

export default function Sidebar({
  currentScreen,
  onNavigate,
  pendingOrdersCount = 4,
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: 'Dashboard',
      icon: 'dashboard',
    },
    {
      id: 'live-orders' as ScreenId,
      label: 'Live Orders',
      icon: 'room_service',
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} New` : undefined,
    },
    {
      id: 'order-details' as ScreenId,
      label: 'Order Details & History',
      icon: 'receipt_long',
    },
    {
      id: 'menu-inventory' as ScreenId,
      label: 'Menu & Inventory',
      icon: 'inventory_2',
    },
    {
      id: 'add-edit-dish' as ScreenId,
      label: 'Add / Edit Dish',
      icon: 'restaurant_menu',
    },
    {
      id: 'profile-zones' as ScreenId,
      label: 'Profile & Zones',
      icon: 'map',
    },
    {
      id: 'analytics-sales' as ScreenId,
      label: 'Analytics & Sales',
      icon: 'monitoring',
    },
    {
      id: 'settings-tax' as ScreenId,
      label: 'Settings & UAE Tax',
      icon: 'settings',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#1e1b19] z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-r border-[#383432]/40">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="h-20 px-4 flex items-center gap-2 bg-[#100e0c]/60 backdrop-blur-md border-b border-[#383432]/30">
          <img
            alt="VAYORA Partner Logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1Vu_ERvxM1TR_WtX3iJxrhFOEEmv5C686HsjH3CyVYBYC9u-V9_1S46iKEAom3NtM3XPY1HePkEOVmpyVKLJomFOb33Ws5hhdUubFia9Xhgy6fV2XvtjCnifOYwDwkhlM14zGcWEcuEbDzdpBaKLFpI_P7P7KFIYnOsE9DVapMFuAwGYiSc7gOIhDXksVBbLvrRWT7Cby0Mbd6WCfy8yHszed4qPAomY1GvqoS_DjpD9TlAGusetj7d"
          />
          <div className="flex flex-col">
            <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight text-[#ffecb9] leading-none">
              VAYORA
            </span>
            <span className="font-['Inter'] text-[11px] uppercase tracking-wider text-[#f7bd48] font-semibold mt-0.5">
              Partner Portal
            </span>
          </div>
        </div>

        {/* Hub Status Banner */}
        <div className="px-4 py-2">
          <div className="p-2 rounded-lg bg-[#221f1d] flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.2)] border border-[#383432]/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f7bd48] animate-pulse" />
              <span className="text-xs text-[#e9e1dd] font-medium">Abu Dhabi Hub</span>
            </div>
            <span className="text-[11px] text-[#f7bd48] font-semibold uppercase tracking-wider">
              UAE VIP
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all text-left group ${
                  isActive
                    ? 'bg-[#facc15] text-[#6c5700] font-semibold shadow-[0_0_16px_rgba(250,204,21,0.2)]'
                    : 'text-[#d1c6ab] hover:bg-[#2d2927] hover:text-[#e9e1dd]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl transition-transform group-hover:scale-105 ${
                      isActive ? 'text-[#6c5700]' : 'text-[#f7bd48]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                      isActive
                        ? 'bg-[#6c5700]/20 text-[#6c5700]'
                        : 'bg-[#ba880f] text-[#392700]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Shift Revenue & Concierge Hotline */}
        <div className="p-4 bg-[#100e0c]/80 backdrop-blur-md space-y-2 border-t border-[#383432]/40">
          <div className="p-2.5 rounded-lg bg-[#2d2927] flex flex-col gap-1 border border-[#383432]/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-[#d1c6ab] font-medium tracking-wider">
                Today's Shift
              </span>
              <span className="text-[11px] uppercase text-[#f7bd48] font-bold">AED</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#ffecb9] leading-tight">
                14,820
              </span>
              <span className="text-xs text-[#f7bd48] font-semibold">+18.4%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#221f1d] flex items-center justify-between border border-[#383432]/30">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#d1c6ab]">UAE Concierge Support</span>
              <a
                href="tel:+97126008296"
                className="text-xs text-[#ffecb9] font-semibold tracking-tight hover:underline"
              >
                +971 2 600 VAYORA
              </a>
            </div>
            <span className="material-symbols-outlined text-[#f7bd48] text-xl">support_agent</span>
          </div>

          {/* Quick Terminal Switcher Link */}
          <button
            onClick={() => onNavigate('login')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#d1c6ab]/70 hover:text-[#f7bd48] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">lock_reset</span>
            <span>Switch / Lock Terminal</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
