import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, X, Tv, Shield, Zap } from 'lucide-react';

interface AdBannerProps {
  id?: string;
  className?: string;
  type?: 'banner' | 'direct-promo' | 'sidebar';
}

export const AdBanner: React.FC<AdBannerProps> = ({ id, className = '', type = 'banner' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const banner320Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    // 1. Load Desktop / Large Banner (ID: container-8b71d267cacce4bf5870c6483a0d4507)
    if (containerRef.current && type === 'banner') {
      containerRef.current.innerHTML = '';
      
      const containerDiv = document.createElement('div');
      containerDiv.id = 'container-8b71d267cacce4bf5870c6483a0d4507';
      containerRef.current.appendChild(containerDiv);

      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl30328996.effectivecpmnetwork.com/8b71d267cacce4bf5870c6483a0d4507/invoke.js';
      containerRef.current.appendChild(script);
    }

    // 2. Load Mobile / Classic Banner (320x50 with atOptions)
    if (banner320Ref.current && type === 'banner') {
      banner320Ref.current.innerHTML = '';

      // Set options on the window object
      (window as any).atOptions = {
        'key': '9faf5d29efb91624fa28405d134175e0',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
      };

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.highperformanceformat.com/9faf5d29efb91624fa28405d134175e0/invoke.js';
      banner320Ref.current.appendChild(script);
    }
  }, [isVisible, type]);

  if (!isVisible) return null;

  // Direct Adsterra Link: high high conversion!
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
          
          {/* Mobile Display: 320x50 Adsterra Banner */}
          <div className="block md:hidden w-[320px] min-h-[50px] overflow-hidden rounded-xl bg-zinc-950 border border-gold-500/10 flex justify-center items-center">
            <div ref={banner320Ref} id="adsterra-mobile-320-wrapper" className="w-[320px] h-[50px]" />
          </div>

          {/* Desktop/Tablet Display: Custom container banner */}
          <div className="hidden md:block w-full max-w-[728px] min-h-[90px] overflow-hidden rounded-2xl bg-zinc-950/40 border border-gold-500/10 flex justify-center items-center p-1">
            <div ref={containerRef} id="adsterra-desktop-container-wrapper" className="w-full min-h-[90px] flex justify-center items-center" />
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
