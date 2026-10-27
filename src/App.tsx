/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('VY-9021');
  const [chimeActive, setChimeActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);

  const showToast = (message: string, icon = 'check_circle') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

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
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        pendingOrdersCount={4}
      />

      {/* Main Top Header */}
      <Header
        onSearch={setSearchQuery}
        onNavigate={setCurrentScreen}
        chimeActive={chimeActive}
        onToggleChime={toggleChime}
      />

      {/* Primary Scrollable Screen Content */}
      <main className="pl-72 pt-20 w-full min-h-screen bg-[#161311] px-6 lg:px-8 py-6">
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
