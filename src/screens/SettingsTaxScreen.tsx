import React, { useState } from 'react';
import { playOrderChime } from '../components/AudioChime';
import { ScreenId } from '../types';
import {
  logPartnerAction,
  testSupabaseConnection,
  ACTIVE_ORDER_TABLE,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  IS_CUSTOMER_SHARED_BACKEND,
  CUSTOMER_SUPABASE_URL,
  getLastSupabaseError,
} from '../lib/supabase';

interface SettingsTaxScreenProps {
  onNavigate: (screen: ScreenId) => void;
  showToast: (msg: string, icon?: string) => void;
  chimeActive: boolean;
  onToggleChime: () => void;
}

export default function SettingsTaxScreen({
  onNavigate,
  showToast,
  chimeActive,
  onToggleChime,
}: SettingsTaxScreenProps) {
  const [trn, setTrn] = useState('100294819400003');
  const [vatInclusive, setVatInclusive] = useState(true);
  const [eInvoiceFormat, setEInvoiceFormat] = useState('xml_pdfa3');
  const [chimeVolume, setChimeVolume] = useState(85);
  const [requireHandoverPin, setRequireHandoverPin] = useState(true);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [repeatInterval, setRepeatInterval] = useState('45');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connResult, setConnResult] = useState<string | null>(null);

  const handleTestChime = () => {
    playOrderChime();
    showToast('Acoustic chime signal triggered', 'volume_up');
  };

  const handleTestSupabase = async () => {
    setTestingConnection(true);
    setConnResult(null);
    const res = await testSupabaseConnection();
    setTestingConnection(false);
    setConnResult(res.message);
    showToast(res.message, res.connected ? 'database' : 'error');
  };

  const handleSaveSettings = () => {
    logPartnerAction('settings_updated', 'partner_config', {
      trn,
      vatInclusive,
      eInvoiceFormat,
      chimeVolume,
      requireHandoverPin,
      autoDispatch,
      repeatInterval,
    });
    showToast('UAE Tax & Terminal settings saved to Supabase', 'verified');
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-[10px] uppercase tracking-widest font-bold">
              UAE Executive Configuration
            </span>
            <span className="text-xs text-[#d1c6ab]">• Terminal v4.12 Core</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-tight text-[#ffecb9] mt-1">
            Partner Settings &amp; UAE Tax
          </h1>
          <p className="text-sm text-[#d1c6ab]">
            Configure Federal Tax Authority (FTA) parameters, acoustic alert volumes, and courier security handover protocols.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] font-['Plus_Jakarta_Sans'] text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">save</span>
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Tax & Alerts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: FTA & Tax Parameters */}
          <section className="bg-[#221f1d] rounded-xl p-6 shadow-md border border-[#383432]/40 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined">
                  account_balance
                </span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#ffecb9]">
                    Federal Tax Authority (FTA) &amp; TRN
                  </h2>
                  <p className="text-xs text-[#d1c6ab]">
                    Statutory UAE 5% Value Added Tax ledger and cryptographic e-Invoicing
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#ba880f]/20 text-[#f7bd48] text-xs font-semibold">
                FTA Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider">
                  Tax Registration Number (TRN)
                </label>
                <div className="relative">
                  <input
                    value={trn}
                    onChange={(e) => setTrn(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1e1b19] text-[#ffecb9] font-['Plus_Jakarta_Sans'] font-bold text-sm tracking-wider border border-[#383432]/60 focus:outline-none focus:border-[#f7bd48]"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#f7bd48] text-base">
                    verified
                  </span>
                </div>
                <span className="text-[11px] text-[#d1c6ab]">
                  Linked to Abu Dhabi DED Commercial License CN-1049281
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#d1c6ab] uppercase tracking-wider">
                  Standard VAT Rate
                </label>
                <div className="relative">
                  <input
                    disabled
                    value="5.0% (Federal Statutory UAE Standard)"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1e1b19]/60 text-[#e9e1dd] text-sm border border-[#383432]/40 cursor-not-allowed"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#d1c6ab] text-base">
                    lock
                  </span>
                </div>
                <span className="text-[11px] text-[#d1c6ab]">
                  Enforced uniformly across Abu Dhabi emirate
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#383432]/30 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1b19]">
                <div>
                  <span className="text-sm font-semibold text-[#e9e1dd] block">
                    Tax-Inclusive Pricing Display
                  </span>
                  <span className="text-xs text-[#d1c6ab]">
                    Display all dish items and check totals inclusive of 5% VAT on patron terminals
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vatInclusive}
                    onChange={(e) => setVatInclusive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#383432] rounded-full peer peer-checked:bg-[#facc15] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e9e1dd] peer-checked:after:bg-[#6c5700] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1b19]">
                <div>
                  <span className="text-sm font-semibold text-[#e9e1dd] block">
                    e-Invoicing Dispatch Format
                  </span>
                  <span className="text-xs text-[#d1c6ab]">
                    Official electronic tax invoice output for weekly audits
                  </span>
                </div>
                <select
                  value={eInvoiceFormat}
                  onChange={(e) => setEInvoiceFormat(e.target.value)}
                  className="bg-[#2d2927] text-[#ffecb9] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#383432] focus:outline-none cursor-pointer"
                >
                  <option value="xml_pdfa3">XML + PDF-A3 (UAE FTA Standard)</option>
                  <option value="pdf_only">Standard PDF Only</option>
                  <option value="edi">EDI Corporate Gateway</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Floor Acoustic Chime & Audio Signals */}
          <section className="bg-[#221f1d] rounded-xl p-6 shadow-md border border-[#383432]/40 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined">
                  volume_up
                </span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#ffecb9]">
                    Acoustic Chime &amp; KDS Alerts
                  </h2>
                  <p className="text-xs text-[#d1c6ab]">
                    Real-time Web Audio API bell chime synthesizer for kitchen and expeditor bay
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleChime}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  chimeActive
                    ? 'bg-[#facc15] text-[#6c5700]'
                    : 'bg-[#383432] text-[#d1c6ab]'
                }`}
              >
                {chimeActive ? 'Live Chime Active' : 'Muted'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#d1c6ab] uppercase">
                    Bell Sound Volume
                  </span>
                  <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#f7bd48]">
                    {chimeVolume}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#d1c6ab] text-lg">volume_down</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={chimeVolume}
                    onChange={(e) => setChimeVolume(Number(e.target.value))}
                    className="w-full accent-[#facc15] cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-[#f7bd48] text-lg">volume_up</span>
                  <button
                    onClick={handleTestChime}
                    className="px-3 py-1.5 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-[#ffecb9] text-xs font-semibold flex items-center gap-1 border border-[#383432] cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    <span>Test Chime</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-[#1e1b19] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#e9e1dd] block">
                      Auto-Dispatch Audible Warning
                    </span>
                    <span className="text-[11px] text-[#d1c6ab]">
                      Chime whenever an incoming VIP order enters queue
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDispatch}
                      onChange={(e) => setAutoDispatch(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#383432] rounded-full peer peer-checked:bg-[#facc15] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e9e1dd] peer-checked:after:bg-[#6c5700] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-[#1e1b19] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#e9e1dd] block">
                      Urgent Repeat Frequency
                    </span>
                    <span className="text-[11px] text-[#d1c6ab]">
                      Repeat alarm if unacknowledged for &gt; 2 mins
                    </span>
                  </div>
                  <select
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(e.target.value)}
                    className="bg-[#2d2927] text-[#ffecb9] text-xs font-semibold px-2 py-1 rounded border border-[#383432] focus:outline-none"
                  >
                    <option value="30">Every 30s</option>
                    <option value="45">Every 45s</option>
                    <option value="60">Every 60s</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Courier Handover Security PIN */}
          <section className="bg-[#221f1d] rounded-xl p-6 shadow-md border border-[#383432]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#383432]/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#2d2927] text-[#f7bd48] material-symbols-outlined">
                  pin
                </span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#ffecb9]">
                    Courier Handover &amp; Dispatch Security
                  </h2>
                  <p className="text-xs text-[#d1c6ab]">
                    Two-factor biometric or PIN handover for high-value orders
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#1e1b19]">
              <div>
                <span className="text-sm font-semibold text-[#e9e1dd] block">
                  Mandatory 4-Digit Rider Handover PIN
                </span>
                <span className="text-xs text-[#d1c6ab]">
                  Kitchen staff must visually verify or input the rider's matching 4-digit code before releasing packaging
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHandoverPin}
                  onChange={(e) => setRequireHandoverPin(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#383432] rounded-full peer peer-checked:bg-[#facc15] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e9e1dd] peer-checked:after:bg-[#6c5700] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Banking & Session Management */}
        <div className="lg:col-span-4 space-y-6">
          {/* Banking Settlement Ledger */}
          <div className="p-6 rounded-xl bg-[#221f1d] shadow-md border border-[#383432]/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">account_balance</span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Disbursement Bank
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#f7bd48] bg-[#ba880f]/20 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/30">
                <span className="text-[10px] uppercase text-[#d1c6ab] block font-semibold">
                  Financial Institution
                </span>
                <span className="text-xs font-bold text-[#e9e1dd]">First Abu Dhabi Bank (FAB)</span>
                <span className="text-[11px] text-[#d1c6ab] block">Al Maryah Financial Freezone</span>
              </div>

              <div className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/30">
                <span className="text-[10px] uppercase text-[#d1c6ab] block font-semibold">
                  Corporate IBAN
                </span>
                <span className="font-mono text-xs text-[#ffecb9] font-bold block">
                  AE29 0330 0000 1289 4019 92
                </span>
                <span className="text-[10px] text-[#f7bd48] font-medium block mt-0.5">
                  Direct Wire Settlement active
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/30">
                <span className="text-[10px] uppercase text-[#d1c6ab] block font-semibold">
                  Weekly Settlement Window
                </span>
                <span className="text-xs text-[#e9e1dd] font-semibold block">
                  Every Monday at 04:00 GST
                </span>
              </div>
            </div>
          </div>

          {/* Supabase Backend Integration Card */}
          <div className="p-6 rounded-xl bg-[#221f1d] shadow-md border border-[#10b981]/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#10b981] text-xl">database</span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Supabase Backend
                </h3>
              </div>
              {getLastSupabaseError() ? (
                <span className="text-[10px] uppercase font-bold text-[#ffb4ab] bg-[#93000a]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                  Setup Needed
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-[#10b981] bg-[#10b981]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Target Configured
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#1e1b19] border border-[#383432]/30 space-y-1">
                <span className="text-[10px] uppercase text-[#d1c6ab] block font-semibold">
                  Active Project Reference (public."{ACTIVE_ORDER_TABLE}" table)
                </span>
                <span className="font-mono text-xs text-[#ffecb9] font-bold block">
                  {SUPABASE_PROJECT_ID}
                </span>
                <span className="text-[10px] text-[#d1c6ab] truncate block font-mono">
                  {SUPABASE_URL}
                </span>
                {!IS_CUSTOMER_SHARED_BACKEND && (
                  <span className="text-[10px] text-[#f7bd48] block font-mono pt-1 border-t border-[#383432]/40 mt-1">
                    Staged Shared Target: {CUSTOMER_SUPABASE_URL}
                  </span>
                )}
              </div>

              {(connResult || getLastSupabaseError()) && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] font-semibold flex items-start gap-2 ${
                    getLastSupabaseError()
                      ? 'bg-[#93000a]/25 border-[#ffb4ab]/30 text-[#ffdad6]'
                      : 'bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm shrink-0">
                    {getLastSupabaseError() ? 'warning' : 'verified'}
                  </span>
                  <span>{connResult || getLastSupabaseError()}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={testingConnection}
                className="w-full py-2 rounded-lg bg-[#2d2927] hover:bg-[#383432] text-[#f7bd48] text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-[#383432] cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">cloud_sync</span>
                <span>{testingConnection ? 'Checking Connection...' : 'Test Supabase Connection'}</span>
              </button>
            </div>
          </div>

          {/* Terminal Session & Security */}
          <div className="p-6 rounded-xl bg-[#221f1d] shadow-md border border-[#383432]/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f7bd48] text-xl">security</span>
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                  Terminal Session
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#f7bd48] animate-pulse" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#383432]/30 text-[#d1c6ab]">
                <span>Active Terminal:</span>
                <span className="text-[#e9e1dd] font-semibold">Terminal #01 (KDS Master)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#383432]/30 text-[#d1c6ab]">
                <span>Session Duration:</span>
                <span className="text-[#e9e1dd] font-semibold">6 hrs 42 mins</span>
              </div>
              <div className="flex justify-between py-1 text-[#d1c6ab]">
                <span>Active Floor Handhelds:</span>
                <span className="text-[#f7bd48] font-semibold">3 Connected</span>
              </div>
            </div>

            <button
              onClick={() => {
                showToast('Locking terminal screen...', 'lock');
                onNavigate('login');
              }}
              className="w-full py-2.5 rounded-lg bg-[#2d2927] hover:bg-[#93000a]/30 text-[#ffb4ab] text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#383432] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              <span>Lock Terminal Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
