import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, X, Tv, Shield, Zap } from 'lucide-react';

interface AdBannerProps {
  id?: string;
  className?: string;
  type?: 'banner' | 'direct-promo' | 'sidebar';
}

export const AdBanner: React.FC<AdBannerProps> = ({ id, className = '', type = 'banner' }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Direct Ad Link: high high conversion!
  const directAdLink = "https://www.effectivecpmnetwork.com/acytcm6ag?key=6f8fff85e414d68c272b5409fda3ead2";

  // Type 1: Standard Banner wrapper (Renders both responsive ad tags)
  if (type === 'banner') {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-6 px-4 ${className}`} id={id}>
        
        {/* Banner header label */}
        <div className="flex justify-between items-center w-full max-w-[320px] md:max-w-[728px] mb-1.5 px-1">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-1">
            <Sparkles size={10} className="text-gold-400/70" />
            Sponsor Placement
          </span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-zinc-600 hover:text-zinc-400 transition cursor-pointer"
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>

        {/* Responsive Content */}
        <div className="w-full flex justify-center items-center min-h-[50px]">
          
          {/* Mobile Display: 320x50 Premium Sponsor Banner */}
          <div className="block md:hidden w-[320px] min-h-[50px] overflow-hidden rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-gold-500/20 flex justify-center items-center">
            <a 
              href={directAdLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full h-full flex items-center justify-between px-3 hover:bg-zinc-900/50 transition duration-300"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                  <Zap size={14} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-white tracking-wide">Veloura Premium Server</div>
                  <div className="text-[8px] text-zinc-400">Click to connect to buffer-free 4K mirror</div>
                </div>
              </div>
              <div className="bg-gold-500 hover:bg-gold-400 text-black text-[9px] font-extrabold px-2.5 py-1 rounded-md transition uppercase">
                Connect
              </div>
            </a>
          </div>

          {/* Desktop/Tablet Display: Custom container banner */}
          <div className="hidden md:block w-full max-w-[728px] min-h-[90px] overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-gold-500/20 flex justify-center items-center p-1">
            <a 
              href={directAdLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full h-full flex items-center justify-between px-6 py-3 hover:bg-zinc-900/30 transition duration-300 gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
                  <Zap size={24} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight">Veloura Ultra-Fast Stream Server Mirror</span>
                    <span className="bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded uppercase">
                      VIP Route
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-[450px]">
                    Bypass local bandwidth throttles. Connect directly to our high-speed, unlimited-bandwidth mirror network for lag-free 4K playback.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition shadow-lg shadow-gold-500/10">
                <span>Connect Mirror</span>
                <ExternalLink size={12} strokeWidth={2.5} />
              </div>
            </a>
          </div>

        </div>

      </div>
    );
  }

  // Type 2: Direct Ad Link promo container (highly integrated styled card that looks like a VIP mirror / fast server link)
  return (
    <div className={`w-full bg-gradient-to-r from-gold-500/5 via-gold-400/10 to-gold-500/5 border border-gold-500/20 rounded-2xl p-4 md:p-5 relative overflow-hidden group shadow-xl ${className}`} id={id}>
      <div className="absolute right-0 top-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl group-hover:bg-gold-400/20 transition-all duration-500 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5 self-start sm:self-center">
          <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            <Zap size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs md:text-sm font-serif font-bold text-white">⚡ Ultra High Speed Premium Server Mirror</h4>
              <span className="bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[8px] font-mono tracking-wider px-1.5 rounded uppercase">
                SPONSOR LINK
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-zinc-400 mt-1">
              Experienced buffer issues? Click to activate the ultra-fast buffer-free mirror streaming server instantly.
            </p>
          </div>
        </div>

        <a
          href={directAdLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-extrabold rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-gold-500/20 active:scale-[0.98] cursor-pointer"
        >
          <span>Connect VIP Mirror</span>
          <ExternalLink size={13} strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
};
