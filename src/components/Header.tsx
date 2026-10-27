import React, { useState } from 'react';
import { playOrderChime } from './AudioChime';
import { ScreenId } from '../types';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onNavigate: (screen: ScreenId) => void;
  chimeActive: boolean;
  onToggleChime: () => void;
}

export default function Header({
  onSearch,
  onNavigate,
  chimeActive,
  onToggleChime,
}: HeaderProps) {
  const [storeOpen, setStoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('The Grand Pavilion • Al Maryah Island');
  const [searchVal, setSearchVal] = useState('');

  const branches = [
    'The Grand Pavilion • Al Maryah Island',
    "L'Orangerie Privée • Saadiyat Beach Club",
    'Maison Qasr • Corniche Reserve',
    'Cipriani Executive Lounge • Yas Marina',
  ];

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
      title: 'Pantry Stock Alert: Wagyu Ribeye',
      desc: 'Remaining cuts dropped to 3. Auto-86 enabled.',
      time: '4 mins ago',
      urgent: true,
    },
    {
      id: 3,
      title: 'VIP Courier Khalid M. Arrived',
      desc: 'Staged at Bay 2 with Thermal Pod AD-49219',
      time: '12 mins ago',
      urgent: false,
    },
  ];

  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [syncedActions, setSyncedActions] = useState<any[]>([]);

  React.useEffect(() => {
    // Import and listen to Supabase actions
    import('../lib/supabase').then(({ onSupabaseAction }) => {
      const unsub = onSupabaseAction((action) => {
        setSyncedActions((prev) => [action, ...prev.slice(0, 19)]);
      });
      return unsub;
    });
  }, []);

  const handleChimeClick = () => {
    onToggleChime();
    playOrderChime();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-[#161311]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-40 px-6 flex items-center justify-between border-b border-[#383432]/40">
      <div className="flex items-center gap-6 flex-1">
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-3 py-1.5 px-4 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:bg-[#2d2927] transition-all text-left"
          >
            <span className="material-symbols-outlined text-[#f7bd48] text-xl">storefront</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#e9e1dd] font-semibold">{selectedBranch}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48] animate-pulse" />
                <span className="text-[11px] text-[#f7bd48] font-semibold tracking-wide uppercase">
                  Open &amp; Accepting Orders
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#d1c6ab] text-lg ml-2">expand_more</span>
          </button>

          {storeOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-[#221f1d] border border-[#383432] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="px-3 py-1 text-[10px] uppercase font-bold text-[#f7bd48] tracking-widest block">
                Select Venue Terminal
              </span>
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setSelectedBranch(b);
                    setStoreOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedBranch === b
                      ? 'bg-[#facc15] text-[#6c5700] font-bold'
                      : 'text-[#e9e1dd] hover:bg-[#2d2927]'
                  }`}
                >
                  <span>{b}</span>
                  {selectedBranch === b && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
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
            placeholder="Search orders, menu items, guests, or tables..."
            type="text"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Supabase Backend Live Status Indicator */}
        <button
          onClick={() => setSupabaseOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#383432] bg-[#1e1b19] hover:bg-[#2d2927] hover:border-[#f7bd48]/40 transition-all text-left cursor-pointer"
          title="Supabase Backend Connected: xwbfblwigouidecdukef"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[#f7bd48] leading-none tracking-wider">
              Supabase Live
            </span>
            <span className="text-[9px] text-[#d1c6ab] font-mono leading-none mt-0.5">
              xwbfbl...
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
                Tariq Al Mansoori
              </span>
              <span className="text-[10px] text-[#f7bd48] uppercase font-medium">
                General Director
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
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#221f1d] border border-[#383432] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-[#383432]/50">
                <p className="text-xs font-bold text-[#ffecb9]">Tariq Al Mansoori</p>
                <p className="text-[11px] text-[#d1c6ab]">gm@grandpavilion.ae</p>
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
                  <span>Restaurant Profile</span>
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
                  <span>Lock / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Live Telemetry & Backend Integration Modal */}
      {supabaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100e0c]/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#221f1d] border border-[#f7bd48]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-[#1e1b19] border-b border-[#383432] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
                  <span className="material-symbols-outlined text-2xl">database</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffecb9]">
                      Supabase Backend Synchronizer
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold">
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-xs text-[#d1c6ab]">
                    All actions performed across the portal are transmitted to Supabase tables.
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#e9e1dd]">
              {/* Credentials Card */}
              <div className="p-4 rounded-xl bg-[#1e1b19] border border-[#383432] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#383432]/40">
                  <span className="text-[11px] uppercase font-bold text-[#f7bd48] tracking-wider">
                    Configured Project Details
                  </span>
                  <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Authentication Verified
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#d1c6ab] block uppercase">Project ID</span>
                    <span className="font-mono text-xs text-[#ffecb9] font-bold">
                      xwbfblwigouidecdukef
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#d1c6ab] block uppercase">Supabase Endpoint</span>
                    <span className="font-mono text-[11px] text-[#e9e1dd] truncate block">
                      https://xwbfblwigouidecdukef.supabase.co
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#d1c6ab] block uppercase">Publishable API Key</span>
                    <span className="font-mono text-[10px] text-[#d1c6ab] break-all block bg-[#161311] p-2 rounded border border-[#383432]">
                      sb_publishable_GfZk4JRIBUfzGbtFW12cQA_hgh8vf2p
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
                    <p className="text-xs font-semibold text-[#e9e1dd]">Awaiting User Actions</p>
                    <p className="text-[11px] text-[#d1c6ab] mt-0.5">
                      Accept orders, mark kitchen dishes ready, or modify menu inventory to see live Supabase sync events appear here.
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

              {/* Quick Supabase Database Tables SQL Reference */}
              <div className="p-4 rounded-xl bg-[#100e0c] border border-[#383432]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#ffecb9] uppercase tracking-wider">
                    Supabase SQL Schema Helper
                  </span>
                  <button
                    onClick={() => {
                      const sql = `-- VAYORA Abu Dhabi Supabase Backend Tables\ncreate table if not exists partner_actions (\n  id uuid default gen_random_uuid() primary key,\n  action_type text not null,\n  entity_id text,\n  details jsonb,\n  operator text default 'Tariq Al Mansoori',\n  branch text default 'The Grand Pavilion',\n  created_at timestamp with time zone default timezone('utc'::text, now())\n);\n\ncreate table if not exists orders (\n  id text primary key,\n  status text,\n  total_aed numeric,\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);\n\ncreate table if not exists menu_inventory (\n  id text primary key,\n  title text,\n  stock integer,\n  is_86 boolean default false,\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);\n\ncreate table if not exists delivery_zones (\n  id text primary key,\n  name text,\n  is_active boolean,\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);`;
                      navigator.clipboard.writeText(sql);
                      alert('Supabase SQL copied to clipboard! Paste it into your Supabase SQL Editor.');
                    }}
                    className="px-2.5 py-1 rounded bg-[#2d2927] hover:bg-[#383432] text-[#f7bd48] font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                    <span>Copy Tables SQL</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#d1c6ab]">
                  If you haven't run the table migrations in your Supabase dashboard yet, copy this script into your{' '}
                  <span className="text-[#ffecb9] font-semibold">Supabase &gt; SQL Editor</span>.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#1e1b19] border-t border-[#383432] flex items-center justify-between">
              <span className="text-[11px] text-[#d1c6ab]">
                Backend connected: <strong className="text-[#e9e1dd]">xwbfblwigouidecdukef.supabase.co</strong>
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
