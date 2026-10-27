import React, { useState } from 'react';
import ThreeGoldenCloche from '../components/ThreeGoldenCloche';
import { ScreenId } from '../types';

interface LoginTerminalScreenProps {
  onLoginSuccess: () => void;
  onNavigate: (screen: ScreenId) => void;
  showToast: (msg: string, icon?: string) => void;
}

export default function LoginTerminalScreen({
  onLoginSuccess,
  onNavigate,
  showToast,
}: LoginTerminalScreenProps) {
  const [selectedBranch, setSelectedBranch] = useState(
    'The Grand Pavilion • Al Maryah Island (Terminal #01)'
  );
  const [email, setEmail] = useState('gm@grandpavilion.ae');
  const [password, setPassword] = useState('VayoraReserve2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // Simulator states
  const [simState, setSimState] = useState<'normal' | 'loading' | 'error'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simState === 'error') {
      return;
    }
    setSimState('loading');
    setTimeout(() => {
      setSimState('normal');
      showToast('Franchise license verified. Terminal activated.', 'verified');
      onLoginSuccess();
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-[#161311] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 relative">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-[#facc15]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-[#ba880f]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden shadow-2xl bg-[#100e0c] border border-[#383432]/50">
          {/* Left Panel: Luxury Brand Immersion */}
          <div className="lg:col-span-6 relative flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-[#1e1b19] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#383432]/40">
            {/* Geometric Gold Filigree Background Accent */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#ffecb9] via-[#1e1b19] to-[#100e0c]" />

            <div className="relative z-10 space-y-6">
              {/* Emblem Header */}
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#2d2927] border border-[#f7bd48]/30 flex items-center justify-center shadow-md">
                  <span
                    className="material-symbols-outlined text-[#ffecb9] text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    restaurant_menu
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-wider text-[#ffecb9] uppercase leading-none">
                    VAYORA
                  </span>
                  <span className="text-[10px] tracking-widest text-[#d1c6ab] uppercase font-semibold mt-0.5">
                    Haute Gastronomy Portal
                  </span>
                </div>
              </div>

              {/* Hero Narrative */}
              <div className="space-y-3 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2d2927] border border-[#383432] text-[#f7bd48] text-xs tracking-widest uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f7bd48] animate-pulse" />
                  Abu Dhabi Culinary Guild
                </div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl font-bold text-[#e9e1dd] leading-tight">
                  Empowering Abu Dhabi's Finest Culinary Destinations
                </h1>
                <p className="text-sm text-[#d1c6ab] max-w-lg leading-relaxed">
                  Join over 250 Michelin-recognized and luxury hospitality venues orchestrating high-end delivery with precision.
                </p>
              </div>
            </div>

            {/* Interactive 3D Golden Cloche Container */}
            <div className="relative z-10 my-6 flex flex-col items-center justify-center">
              <div className="relative w-full h-72 rounded-xl bg-[#2d2927]/40 border border-[#383432]/50 flex items-center justify-center overflow-hidden shadow-inner">
                <ThreeGoldenCloche className="w-full h-72" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-4 py-2 rounded-lg bg-[#100e0c]/80 backdrop-blur-md border border-[#383432]/40">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-[#f7bd48] text-sm">
                      workspace_premium
                    </span>
                    <span className="text-xs text-[#e9e1dd] tracking-wide font-medium">
                      Live Dispatch Node
                    </span>
                  </div>
                  <span className="text-[10px] text-[#f7bd48] uppercase tracking-widest font-bold">
                    Active • 99.98% Latency SLA
                  </span>
                </div>
              </div>
            </div>

            {/* Curated Testimonial / Footnote */}
            <div className="relative z-10 pt-2 flex items-center space-x-4">
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1e1b19] object-cover"
                  alt="Executive Chef"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvXSYIZf8akTiE6AXG8oL7nBt3rglFR668IlxsqwKD9yENg8ZdxPnUyF2nFOFzVU05ZGDY26egAAmTYtnIxTC1ckyl5KXlYTrtux3Io5EOdb03lF1I5MZZqp0sLv4pMCntXtSCI12poquSmqs-Op4zQ3mnAKPxcDRt5f3uKXqGrINJ-uP-o9I-CXSopHdcNk2dSHJnAbmI9kX4gTGDtiD_KtZzBuOTOlI_6aNdsT5tiaIeyPRLpQ8"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1e1b19] object-cover"
                  alt="Sommelier"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-IOEO8DLr_4ZzBWc77uYzy6Woo-TLLjjcILf6qydeAWtkeWNLpl97ZoxEIgpfwuVLaT9YWCTJhByr2lctSOG_QGyQdXITXAGZ_oM5KmeqRdL3p6o08RIAw2s29wBNwxqj5nBFUFY7FcQsEyTZugS7vhfvT1KCe2mlERozW6Hv_KX6EhBZsD-XXEZmX8ZC-JUhnNZbGvDJhbcmAq2xzx3YoRmoWjM2Gz-GegxW49UKzBCCHL9F8Sw"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1e1b19] object-cover"
                  alt="General Manager"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcG_WgxtpUHIWFSXC1qLUtQN6tQLErOS4rLIt1AVdJ7zyGfu98WWjqbyWk_wlsCegdM4wnJ2Ffnk0BWzMkaAooZbiUxLEVmXwlM8vAKDuFEhoExepzbmUsunsA-Bf3sWAI1Fm7s5yYyQSgZjoaIXp1_g4vU8X-8zXYI1Oqg-jKa5ymaEVo-8Tco3V3Wa8ivx4gaOwcjWRkroWkVa0mSjTXJrlrkVHvI9wd8OHtI75V7T1Wsx6j2CI"
                />
              </div>
              <p className="text-xs text-[#d1c6ab]">
                Orchestrating banquet-grade delivery across Saadiyat, Al Maryah &amp; Corniche.
              </p>
            </div>
          </div>

          {/* Right Panel: Executive Credential Terminal */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-[#221f1d]">
            <div>
              {/* Header Module */}
              <div className="space-y-1 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#e9e1dd]">
                    Restaurant Partner Sign In
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#facc15]/20 text-[#f7bd48] border border-[#f7bd48]/30">
                    Terminal v4.12
                  </span>
                </div>
                <p className="text-xs text-[#d1c6ab]">
                  Enter your verified partner credentials to access the kitchen terminal.
                </p>
              </div>

              {/* Alert Container for Interactive Simulation */}
              {simState === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-[#93000a]/30 border border-[#ffb4ab]/40 transition-all duration-300 animate-in fade-in">
                  <div className="flex items-start space-x-3">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-xl mt-0.5">
                      error
                    </span>
                    <div>
                      <h4 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#ffb4ab]">
                        Authentication Failed
                      </h4>
                      <p className="text-xs text-[#ffdad6] mt-0.5">
                        Invalid restaurant franchise license key or password for Abu Dhabi branch.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Branch Location Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                    Branch / Assigned Terminal
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#f7bd48] text-lg">
                        storefront
                      </span>
                    </div>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#1e1b19] text-[#e9e1dd] text-xs border border-[#383432]/50 focus:outline-none focus:border-[#f7bd48] transition-all appearance-none cursor-pointer"
                    >
                      <option>The Grand Pavilion • Al Maryah Island (Terminal #01)</option>
                      <option>L'Orangerie Privée • Saadiyat Beach Club (Terminal #02)</option>
                      <option>Maison Qasr • Corniche Reserve (Terminal #03)</option>
                      <option>Cipriani Executive Lounge • Yas Marina (Terminal #04)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#d1c6ab] text-lg">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email / Partner Username */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                    Partner Email or General Manager ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#f7bd48] text-lg">
                        alternate_email
                      </span>
                    </div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e1b19] text-[#e9e1dd] text-xs border border-[#383432]/50 placeholder-[#d1c6ab]/40 focus:outline-none focus:border-[#f7bd48] transition-all shadow-inner"
                      placeholder="gm@grandpavilion.ae"
                      required
                      type="email"
                    />
                  </div>
                </div>

                {/* Secret Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#d1c6ab] uppercase tracking-wider">
                      Secret Terminal Key
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          'Password reset token dispatched to licensed Abu Dhabi franchisee holder',
                          'key'
                        )
                      }
                      className="text-xs text-[#f7bd48] hover:text-[#ffecb9] transition-colors tracking-wide cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#f7bd48] text-lg">key</span>
                    </div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-lg bg-[#1e1b19] text-[#e9e1dd] text-xs border border-[#383432]/50 placeholder-[#d1c6ab]/40 focus:outline-none focus:border-[#f7bd48] transition-all shadow-inner"
                      placeholder="••••••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#d1c6ab] hover:text-[#e9e1dd] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Shift Persistence Toggle */}
                <div className="flex items-center pt-1">
                  <label className="relative flex items-center cursor-pointer select-none space-x-3">
                    <input
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#1e1b19] text-[#ba880f] accent-[#facc15] cursor-pointer"
                      type="checkbox"
                    />
                    <span className="text-xs text-[#d1c6ab]">
                      Keep terminal logged in for this 14-hour service shift
                    </span>
                  </label>
                </div>

                {/* Primary Submission CTA */}
                <div className="pt-2">
                  <button
                    disabled={simState === 'loading'}
                    className="relative w-full py-3.5 px-6 rounded-lg bg-[#facc15] hover:bg-[#ba880f] text-[#6c5700] hover:text-[#ffecb9] font-['Plus_Jakarta_Sans'] font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#facc15]/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    type="submit"
                  >
                    {simState === 'loading' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            fill="currentColor"
                          />
                        </svg>
                        <span>Verifying Franchise Clearance...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Kitchen Dashboard</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Secondary Partner Actions */}
              <div className="mt-8 pt-6 space-y-4 border-t border-[#383432]/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d1c6ab]">New culinary concept in Abu Dhabi?</span>
                  <button
                    onClick={() =>
                      showToast('Routing to VAYORA Abu Dhabi Curation Board...', 'stars')
                    }
                    className="text-[#f7bd48] hover:text-[#ffecb9] font-semibold transition-colors cursor-pointer"
                  >
                    Apply for VAYORA Partnership →
                  </button>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#2d2927]/60 border border-[#383432]/30">
                  <div className="flex items-center space-x-2.5">
                    <span className="material-symbols-outlined text-[#f7bd48] text-base">
                      support_agent
                    </span>
                    <span className="text-[11px] text-[#d1c6ab] uppercase tracking-wider font-semibold">
                      UAE Partner Concierge
                    </span>
                  </div>
                  <a
                    className="text-xs text-[#ffecb9] font-bold hover:underline"
                    href="tel:800829672"
                  >
                    800-VAYORA (800-829672)
                  </a>
                </div>
              </div>
            </div>

            {/* Terminal Status Metadata Footer */}
            <div className="mt-8 pt-6 flex items-center justify-between border-t border-[#383432]/40">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#f7bd48]" />
                <span className="text-[10px] text-[#d1c6ab] tracking-wider uppercase">
                  Encrypted AED Settlement Stream
                </span>
              </div>
              <span className="text-xs text-[#d1c6ab]/70">UAE Central Bank Regulatory Standard</span>
            </div>
          </div>
        </div>

        {/* Developer & Reviewer Interactive State Simulator Bar */}
        <div className="mt-6 p-4 rounded-xl bg-[#1e1b19] border border-[#383432]/50 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#f7bd48] text-base">tune</span>
              <span className="text-xs text-[#e9e1dd] tracking-wider uppercase font-bold">
                Terminal Simulator
              </span>
              <span className="text-[#d1c6ab] text-xs">(Preview UI States)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSimState('normal')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  simState === 'normal'
                    ? 'bg-[#facc15] text-[#6c5700] shadow-sm'
                    : 'bg-[#2d2927] hover:bg-[#383432] text-[#e9e1dd]'
                }`}
              >
                Normal State
              </button>
              <button
                type="button"
                onClick={() => setSimState('loading')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  simState === 'loading'
                    ? 'bg-[#facc15] text-[#6c5700] shadow-sm'
                    : 'bg-[#2d2927] hover:bg-[#383432] text-[#f7bd48]'
                }`}
              >
                Loading State
              </button>
              <button
                type="button"
                onClick={() => setSimState('error')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  simState === 'error'
                    ? 'bg-[#93000a] text-[#ffdad6] shadow-sm'
                    : 'bg-[#2d2927] hover:bg-[#383432] text-[#ffb4ab]'
                }`}
              >
                Invalid Credentials Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
