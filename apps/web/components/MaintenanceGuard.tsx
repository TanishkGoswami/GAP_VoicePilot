"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Mic, PhoneCall, Bot, Clock, BarChart2 } from "lucide-react";

interface MaintenanceGuardProps {
  children: React.ReactNode;
  productKey: string;
}

interface MaintenanceStatus {
  maintenance: boolean;
  maintenanceType?: string;
  title?: string;
  message?: string;
  expectedBackAt?: string;
  productName?: string;
}

const SUPABASE_URL = "https://uklxlappjcuvdqjvecfh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4";

// Custom CSS for ambient Voice Pilot animations
const customStyles = `
  @keyframes ambient-drift-1 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(40px, -60px) scale(1.1); }
    66% { transform: translate(-30px, 30px) scale(0.95); }
  }
  @keyframes ambient-drift-2 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(-50px, 70px) scale(1.15); }
    66% { transform: translate(40px, -40px) scale(0.85); }
  }
  @keyframes waveform-pulse {
    0%, 100% { transform: scaleY(0.2); opacity: 0.2; }
    50% { transform: scaleY(1); opacity: 0.6; }
  }
  @keyframes orb-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(98, 174, 240, 0.4), inset 0 0 20px rgba(98, 174, 240, 0.4); }
    50% { transform: scale(1.05); box-shadow: 0 0 80px rgba(214, 182, 246, 0.6), inset 0 0 40px rgba(214, 182, 246, 0.6); }
  }
  @keyframes mic-pulse-ring {
    0% { transform: scale(0.8); opacity: 0.6; }
    100% { transform: scale(3.5); opacity: 0; }
  }
  @keyframes float-card-1 {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-15px) rotate(1deg); }
  }
  @keyframes float-card-2 {
    0%, 100% { transform: translateY(0) rotate(3deg); }
    50% { transform: translateY(-12px) rotate(-1deg); }
  }
  @keyframes float-card-3 {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(15px) scale(1.03); }
  }
  @keyframes particle-drift {
    0% { transform: translateY(0) scale(1); opacity: 0; }
    20% { opacity: 0.8; }
    80% { opacity: 0.8; }
    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-ambient-1, .animate-ambient-2, .animate-waveform, .animate-orb, .animate-mic-ring, .animate-card-1, .animate-card-2, .animate-card-3 {
      animation: none !important;
      transform: none !important;
    }
  }

  .animate-ambient-1 { animation: ambient-drift-1 25s ease-in-out infinite; }
  .animate-ambient-2 { animation: ambient-drift-2 30s ease-in-out infinite reverse; }
  .animate-orb { animation: orb-pulse 4s ease-in-out infinite; }
  .animate-mic-ring { animation: mic-pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
  .animate-card-1 { animation: float-card-1 7s ease-in-out infinite; }
  .animate-card-2 { animation: float-card-2 8s ease-in-out infinite 1s; }
  .animate-card-3 { animation: float-card-3 9s ease-in-out infinite 2s; }
`;

export default function MaintenanceGuard({ children, productKey }: MaintenanceGuardProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkStatus = async () => {
      try {
        const headers = {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        };

        const [globalRes, productRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/system_settings?select=*`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/system_products?product_key=eq.${productKey}&select=*`, { headers })
        ]);

        if (!globalRes.ok || !productRes.ok) throw new Error("Failed to fetch maintenance status");

        const globalData = await globalRes.json();
        const productData = await productRes.json();
        
        const globalSettings = globalData[0] || {};
        const product = productData[0] || {};

        if (mounted) {
          const now = new Date();
          
          let isGlobalMaintenance = globalSettings.global_maintenance_enabled;
          if (isGlobalMaintenance && globalSettings.end_at && new Date(globalSettings.end_at) <= now) {
              isGlobalMaintenance = false;
          }
          const isGlobalScheduleActive = globalSettings.start_at && globalSettings.end_at && 
            new Date(globalSettings.start_at) <= now && new Date(globalSettings.end_at) > now;
          const effectiveGlobalMaintenance = isGlobalMaintenance || isGlobalScheduleActive;

          let isProductMaintenance = product.maintenance_enabled;
          if (isProductMaintenance && product.maintenance_end_at && new Date(product.maintenance_end_at) <= now) {
              isProductMaintenance = false;
          }
          const isProductScheduled = product.maintenance_start_at && product.maintenance_end_at &&
            new Date(product.maintenance_start_at) <= now && new Date(product.maintenance_end_at) > now;
            
          const isMaintenance = effectiveGlobalMaintenance || isProductMaintenance || isProductScheduled;
          
          let title = product.maintenance_title || "We're currently upgrading the system";
          let message = product.maintenance_message || `Our voice AI platform is undergoing scheduled improvements. We will be back online shortly!`;
          let expectedBackAt = product.maintenance_end_at;
          
          if (effectiveGlobalMaintenance) {
              title = globalSettings.title || "We're currently upgrading the system";
              message = globalSettings.message || "Our system is currently undergoing scheduled maintenance, we will be back soon! Thank you for being so patient.";
              expectedBackAt = globalSettings.end_at;
          }

          let maintenanceType = "System Update in Progress";
          if (effectiveGlobalMaintenance) maintenanceType = "Global System Maintenance";
          else if (isProductScheduled) maintenanceType = "Scheduled Maintenance";
          else if (product.maintenance_type) {
            maintenanceType = product.maintenance_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + " Maintenance";
          }

          setStatus({
            maintenance: !!isMaintenance,
            maintenanceType,
            title,
            message,
            expectedBackAt,
            productName: product.product_name || "GAP Voice Pilot"
          });
        }
      } catch (error) {
        console.error("Maintenance check failed:", error);
        if (mounted) setStatus({ maintenance: false });
      } finally {
        if (mounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [productKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f5f4]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-[#e6e6e6] border-t-[#000000] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (status?.maintenance) {
    let formattedTime = null;
    if (status.expectedBackAt) {
      const expectedDate = new Date(status.expectedBackAt);
      if (expectedDate > new Date()) {
        const isToday = expectedDate.toDateString() === new Date().toDateString();
        const timeString = expectedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        formattedTime = isToday ? `Today at ${timeString}` : `${expectedDate.toLocaleDateString()} at ${timeString}`;
      }
    }

    return (
      <div className="relative min-h-[100dvh] w-full bg-[#f6f5f4] overflow-hidden flex flex-col items-center font-sans text-[#000000] selection:bg-[#62aef0]/30 selection:text-black">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />

        {/* 1. BACKGROUND LAYER: Ambient Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          {/* Massive sky glow */}
          <div className="absolute -top-[15%] -left-[10%] w-[70vw] h-[70vw] bg-[#62aef0] rounded-full opacity-[0.12] blur-[140px] animate-ambient-1" />
          
          {/* Massive purple glow */}
          <div className="absolute top-[30%] -right-[15%] w-[80vw] h-[80vw] bg-[#d6b6f6] rounded-full opacity-[0.12] blur-[150px] animate-ambient-2" />
          
          {/* Floating Sound Particles */}
          {[...Array(15)].map((_, i) => (
            <div 
              key={`particle-${i}`}
              className="absolute w-2 h-2 rounded-full bg-[#62aef0]"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 40}%`,
                opacity: 0,
                filter: 'blur(2px)',
                animation: `particle-drift ${5 + Math.random() * 10}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`
              }}
            />
          ))}
        </div>
        
        {/* TOP: Header Logotype */}
        <header className="relative w-full pt-10 md:pt-14 px-8 flex justify-center z-30">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GAP Voice Pilot" className="h-9 w-auto object-contain" />
            <span className="text-[#000000] font-extrabold tracking-tight text-2xl">
              Voice Pilot
            </span>
          </div>
        </header>

        {/* 2. MIDGROUND LAYER: Massive Audio Waveform & Typography */}
        <main className="relative flex-1 flex flex-col items-center justify-start pt-10 md:pt-16 px-6 max-w-5xl mx-auto z-20 w-full text-center">
          
          <h1 className="text-[clamp(40px,6vw,72px)] font-black leading-[1.05] tracking-tight text-[#000000] mb-6 relative z-30">
            {status.title}
          </h1>
          
          <p className="text-[18px] md:text-[22px] text-[#615d59] leading-relaxed max-w-3xl mb-12 relative z-30">
            {status.message}
          </p>

          {/* MASSIVE WAVEFORM (40% viewport height) */}
          <div className="absolute top-[45%] md:top-[50%] left-0 w-full h-[35vh] flex items-end justify-center gap-2 md:gap-4 opacity-15 mix-blend-multiply z-10">
            {[...Array(24)].map((_, i) => (
              <div 
                key={i} 
                className="w-4 md:w-8 bg-[#000000] rounded-t-full"
                style={{ 
                  height: `${Math.max(30, Math.random() * 100)}%`,
                  animation: `waveform-pulse ${1.5 + Math.random() * 2.5}s ease-in-out infinite alternate`,
                  animationDelay: `${Math.random() * -3}s`,
                  transformOrigin: 'bottom'
                }}
              />
            ))}
          </div>
          
          {/* 3. FOREGROUND LAYER: The Glowing AI Core & Floating Cards */}
          <div className="relative w-full max-w-4xl h-[400px] mt-4 z-30 flex items-center justify-center">
            
            {/* Central Glowing Voice Orb */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#ffffff] to-[#f6f5f4] animate-orb flex items-center justify-center border border-[#e6e6e6] z-20">
              <Mic className="w-20 h-20 text-[#000000] opacity-80" />
              {/* Concentric Pulse Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-[#62aef0] animate-mic-ring -z-10" />
              <div className="absolute inset-0 rounded-full border-2 border-[#d6b6f6] animate-mic-ring -z-10" style={{ animationDelay: '-1.5s' }} />
            </div>

            {/* Floating Card 1: Live Call Active */}
            <div className="absolute top-[10%] left-[5%] md:left-[15%] w-64 bg-white/80 backdrop-blur-xl border border-[#e6e6e6] rounded-2xl p-4 shadow-xl animate-card-1 z-30 hidden sm:block">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1aae39] animate-pulse" />
                  <span className="text-xs font-bold text-[#615d59] uppercase tracking-wider">Live Call</span>
                </div>
                <PhoneCall className="w-4 h-4 text-[#a39e98]" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f6f5f4] flex items-center justify-center text-xl">👤</div>
                <div>
                  <div className="h-3 w-24 bg-[#000000] rounded-full mb-2" />
                  <div className="h-2 w-16 bg-[#a39e98] rounded-full" />
                </div>
              </div>
            </div>

            {/* Floating Card 2: AI Agent Status */}
            <div className="absolute bottom-[15%] right-[5%] md:right-[15%] w-72 bg-white/80 backdrop-blur-xl border border-[#e6e6e6] rounded-2xl p-5 shadow-xl animate-card-2 z-30 hidden sm:block">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#62aef0] to-[#d6b6f6] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="h-3 w-20 bg-[#000000] rounded-full mb-1.5" />
                  <div className="h-2 w-32 bg-[#a39e98] rounded-full" />
                </div>
              </div>
              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-8 flex-1 rounded-sm ${i % 2 === 0 ? 'bg-[#62aef0]/40' : 'bg-[#d6b6f6]/40'}`} />
                ))}
              </div>
            </div>

            {/* Floating Card 3: Metrics / Duration */}
            <div className="absolute top-[20%] right-[0%] md:right-[5%] w-48 bg-[#000000] rounded-2xl p-4 shadow-2xl animate-card-3 z-20 hidden lg:block">
              <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-bold uppercase">Duration</span>
              </div>
              <div className="text-3xl font-light text-white mb-1">04:23</div>
              <div className="flex items-center gap-2 text-[#62aef0] text-xs font-semibold">
                <BarChart2 className="w-3 h-3" />
                Optimizing
              </div>
            </div>

          </div>
        </main>

        {/* BOTTOM: Metadata Block */}
        <footer className="relative w-full pb-10 pt-6 flex flex-col items-center justify-center z-40 bg-gradient-to-t from-[#f6f5f4] to-transparent">
          
          <div className="flex flex-col items-center gap-2 text-center mb-6">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#a39e98]">
              System Status
            </span>
            <div className="px-6 py-2 bg-white rounded-full border border-[#e6e6e6] shadow-sm font-medium text-[#000000] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" />
              {status.maintenanceType}
            </div>
            {formattedTime && (
              <p className="mt-1 text-[15px] font-semibold text-[#000000]">
                Expected Back: <span className="text-[#62aef0]">{formattedTime}</span>
              </p>
            )}
          </div>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group relative px-12 h-14 rounded-full bg-[#000000] text-white font-bold text-[16px] flex items-center justify-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 shadow-xl shadow-black/10"
          >
            {isRefreshing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              "Check Again"
            )}
          </button>

        </footer>
      </div>
    );
  }

  return <>{children}</>;
}
