import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';

interface AdBannerProps {
  id?: string;
  className?: string;
}

const PREMIUM_ADS = [
  {
    title: '👑 Veloura VIP Club Membership',
    desc: 'Join the ultimate circle of high-society curators. Get exclusive masterclass streams.',
    cta: 'UPGRADE NOW',
    link: '#vip',
    accentColor: 'text-gold-400',
    bgColor: 'from-[#1b1509] to-[#0d0a04]',
    borderColor: 'border-gold-500/20',
  },
  {
    title: '📈 Exclusive Asset Management',
    desc: 'Harness high-net-worth liquidity strategies with elite bespoke advisors.',
    cta: 'INVEST TODAY',
    link: 'https://google.com',
    accentColor: 'text-gold-400',
    bgColor: 'from-[#141420] to-[#0c0c14]',
    borderColor: 'border-blue-500/10',
  },
  {
    title: '🛥️ Horizon Luxury Yacht Charters',
    desc: 'Unwind on bespoke custom mega yachts with elite service worldwide.',
    cta: 'BOOK NOW',
    link: 'https://google.com',
    accentColor: 'text-gold-400',
    bgColor: 'from-[#0a1815] to-[#040c0a]',
    borderColor: 'border-emerald-500/10',
  }
];

export const AdBanner: React.FC<AdBannerProps> = ({ id, className = '' }) => {
  const [adIndex, setAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Choose a random high-end ad on mount
    const rand = Math.floor(Math.random() * PREMIUM_ADS.length);
    setAdIndex(rand);
  }, []);

  if (!isVisible) return null;

  const ad = PREMIUM_ADS[adIndex];

  return (
    <div className={`w-full flex flex-col items-center justify-center my-8 px-4 ${className}`} id={id}>
      
      {/* Banner Header Info */}
      <div className="flex justify-between items-center w-full max-w-[320px] md:max-w-[728px] mb-1.5 px-1">
        <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-600 uppercase flex items-center gap-1">
          <Sparkles size={10} className="text-gold-400/50" />
          Veloura Sponsor Placement
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-zinc-600 hover:text-zinc-400 transition cursor-pointer"
          title="Dismiss Sponsor"
        >
          <X size={12} />
        </button>
      </div>

      {/* Responsive Wrapper: Displays either Mobile 320x50 or Desktop 728x90 */}
      <div className="relative w-full flex justify-center">
        
        {/* MOBILE BANNER: 320x50 */}
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden w-[320px] h-[50px] bg-gradient-to-r from-zinc-900 to-[#18181F] border border-gold-500/20 rounded-xl flex items-center justify-between px-3.5 relative overflow-hidden group shadow-lg transition duration-300 hover:shadow-gold-500/5 hover:scale-[1.01]"
        >
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-tight text-white truncate">
                {ad.title}
              </span>
              <span className="shrink-0 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[7px] font-mono px-1 rounded uppercase">
                SPONSOR
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 truncate leading-none mt-0.5">
              Unlock supreme experiences instantly.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-gold-400 hover:bg-gold-300 text-black transition flex items-center gap-0.5 font-sans">
              ENTER
              <ExternalLink size={7} />
            </span>
          </div>
        </a>

        {/* DESKTOP BANNER: 728x90 */}
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex w-[728px] h-[90px] bg-gradient-to-r from-[#18181F] via-[#21212B] to-[#18181F] border border-gold-500/15 rounded-2xl items-center justify-between px-6 relative overflow-hidden group shadow-xl transition duration-300 hover:shadow-gold-500/10 hover:border-gold-500/30"
        >
          {/* Subtle gold line on left hover */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold-300 to-gold-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          
          {/* Background overlay glow */}
          <div className="absolute inset-0 bg-gold-500/[0.01] group-hover:bg-gold-500/[0.03] transition-colors duration-300 pointer-events-none" />

          {/* Icon/Brand Badge */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white group-hover:text-gold-400 transition">
                  {ad.title}
                </h4>
                <span className="bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded uppercase">
                  VELOURA EXCLUSIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 truncate max-w-[450px]">
                {ad.desc}
              </p>
            </div>
          </div>

          {/* Interactive Button */}
          <div className="shrink-0 pl-4">
            <span className="text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black shadow-lg shadow-gold-500/10 transition-transform group-hover:scale-105 duration-200 flex items-center gap-1.5 font-sans">
              {ad.cta}
              <ExternalLink size={12} strokeWidth={2.5} />
            </span>
          </div>
        </a>

      </div>
    </div>
  );
};
