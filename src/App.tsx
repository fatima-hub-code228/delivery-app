/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardScreen from './screens/DashboardScreen';
import LiveOrdersScreen from './screens/LiveOrdersScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import MenuInventoryScreen from './screens/MenuInventoryScreen';
import AddEditDishScreen from './screens/AddEditDishScreen';
import ProfileZonesScreen from './screens/ProfileZonesScreen';
import AnalyticsSalesScreen from './screens/AnalyticsSalesScreen';
import SettingsTaxScreen from './screens/SettingsTaxScreen';
import LoginTerminalScreen from './screens/LoginTerminalScreen';
import { ScreenId } from './types';
import {
  fetchOrdersFromSupabase,
  ensureSharedCatalogSyncedToSupabase,
  getPartnerSession,
  onPartnerSessionChange,
  onSupabaseAction,
  subscribeToOrdersRealtime,
} from './lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('VY-9021');
  const [chimeActive, setChimeActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);

  const showToast = (message: string, icon = 'check_circle') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Configure Capacitor Android native status bar, splash screen, and hardware back button
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#161311' }).catch(() => {});
      SplashScreen.hide().catch(() => {});

      const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        } else if (currentScreen !== 'dashboard' && currentScreen !== 'login') {
          setCurrentScreen('dashboard');
        } else if (!canGoBack) {
          CapApp.exitApp();
        }
      });

      return () => {
        backListener.then((h) => h.remove());
      };
    }
  }, [currentScreen, mobileMenuOpen]);

  // Ensure shared Customer App + Partner Portal catalog & zones are synced on startup
  useEffect(() => {
    ensureSharedCatalogSyncedToSupabase();
  }, []);

  // Fetch live incoming order count from Supabase (filtered by active vendor session)
  useEffect(() => {
    const refreshPendingCount = () => {
      const storeId = getPartnerSession().storeId;
      fetchOrdersFromSupabase(storeId).then((orders) => {
        if (orders) {
          const incomingCount = orders.filter((o) => o.status === 'incoming').length;
          setPendingOrdersCount(incomingCount);
        } else {
          setPendingOrdersCount(0);
        }
      });
    };
    refreshPendingCount();

    const unsubSession = onPartnerSessionChange(refreshPendingCount);
    const unsubAction = onSupabaseAction(refreshPendingCount);
    const unsubRealtime = subscribeToOrdersRealtime(refreshPendingCount);

    return () => {
      unsubSession();
      unsubAction();
      unsubRealtime();
    };
  }, [currentScreen]);

  const toggleChime = () => {
    setChimeActive((prev) => !prev);
  };

  const handleOpenOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentScreen('order-details');
  };

  // If on login screen, render full-bleed terminal switcher
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-[#161311] text-[#e9e1dd]">
        <LoginTerminalScreen
          onLoginSuccess={() => setCurrentScreen('dashboard')}
          onNavigate={setCurrentScreen}
          showToast={showToast}
        />
        {/* Global Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="px-5 py-3 rounded-xl bg-[#2d2927] border border-[#f7bd48]/30 text-[#e9e1dd] shadow-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f7bd48]">{toast.icon}</span>
              <span className="text-xs font-semibold">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161311] text-[#e9e1dd] font-['Inter'] selection:bg-[#facc15] selection:text-[#6c5700]">
      {/* Responsive Left Navigation Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        pendingOrdersCount={pendingOrdersCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Top Header */}
      <Header
        onSearch={setSearchQuery}
        onNavigate={setCurrentScreen}
        chimeActive={chimeActive}
        onToggleChime={toggleChime}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Primary Scrollable Screen Content */}
      <main className="lg:pl-72 pt-20 w-full min-h-screen bg-[#161311] px-4 sm:px-6 lg:px-8 py-6">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onNavigate={setCurrentScreen}
            onOpenOrder={handleOpenOrder}
          />
        )}

        {currentScreen === 'live-orders' && (
          <LiveOrdersScreen
            onNavigate={setCurrentScreen}
            onOpenOrderDetails={handleOpenOrder}
            chimeActive={chimeActive}
            onToggleChime={toggleChime}
          />
        )}

        {currentScreen === 'order-details' && (
          <OrderDetailsScreen
            orderId={selectedOrderId}
            onNavigate={setCurrentScreen}
          />
        )}

        {currentScreen === 'menu-inventory' && (
          <MenuInventoryScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'add-edit-dish' && (
          <AddEditDishScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'profile-zones' && (
          <ProfileZonesScreen
            onNavigate={setCurrentScreen}
            showToast={showToast}
          />
        )}

        {currentScreen === 'analytics-sales' && (
          <AnalyticsSalesScreen
            onNavigate={setCurrentScreen}
            showToast={showToast}
          />
        )}

        {currentScreen === 'settings-tax' && (
          <SettingsTaxScreen
            onNavigate={setCurrentScreen}
            showToast={showToast}
            chimeActive={chimeActive}
            onToggleChime={toggleChime}
          />
        )}
      </main>

      {/* Global Interactive Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="px-5 py-3 rounded-xl bg-[#2d2927] border border-[#f7bd48]/40 text-[#e9e1dd] shadow-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[#f7bd48]">{toast.icon}</span>
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
