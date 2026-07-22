import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, X, Zap } from 'lucide-react';

interface AdBannerProps {
  id?: string;
  className?: string;
  type?: 'banner' | 'direct-promo' | 'sidebar';
  adKey?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  id, 
  className = '', 
  type = 'banner',
  adKey = '6f8fff85e414d68c272b5409fda3ead2'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const directAdLink = "https://www.effectivecpmnetwork.com/acytcm6ag?key=6f8fff85e414d68c272b5409fda3ead2";

  if (!isVisible) return null;

  // Generates complete HTML code for isolated iframe script execution
  const getIframeSrcDoc = (width: number, height: number, key: string) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="//www.highperformanceformat.com/${key}/invoke.js"></script>
  <script type="text/javascript" src="//www.effectivecpmnetwork.com/${key}/invoke.js"></script>
</body>
</html>`;
  };

  if (type === 'banner') {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-6 px-4 ${className}`} id={id}>
        
        {/* Banner header label */}
        <div className="flex justify-between items-center w-full max-w-[320px] md:max-w-[728px] mb-1.5 px-1">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-1">
            <Sparkles size={10} className="text-gold-400/70" />
            Adsterra Sponsor Ad
          </span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-zinc-600 hover:text-zinc-400 transition cursor-pointer"
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>

        {/* Adsterra Display Banner container with fallback Direct Link */}
        <div className="w-full flex flex-col items-center justify-center gap-3">
          
          {/* Mobile Display: 320x50 Adsterra Live Ad Frame */}
          <div className="block md:hidden w-[320px] h-[50px] overflow-hidden rounded-xl bg-zinc-950 border border-gold-500/20 shadow-md">
            <iframe
              title="Adsterra Mobile Banner"
              srcDoc={getIframeSrcDoc(320, 50, adKey)}
              width="320"
              height="50"
              scrolling="no"
              frameBorder="0"
              className="w-[320px] h-[50px] border-0 overflow-hidden"
            />
          </div>

          {/* Desktop Display: 728x90 Adsterra Live Ad Frame */}
          <div className="hidden md:block w-[728px] h-[90px] overflow-hidden rounded-2xl bg-zinc-950 border border-gold-500/20 shadow-lg">
            <iframe
              title="Adsterra Desktop Banner"
              srcDoc={getIframeSrcDoc(728, 90, adKey)}
              width="728"
              height="90"
              scrolling="no"
              frameBorder="0"
              className="w-[728px] h-[90px] border-0 overflow-hidden"
            />
          </div>

          {/* Direct Link Banner Card (Guarantees user click CPM conversion) */}
          <div className="w-full max-w-[320px] md:max-w-[728px] overflow-hidden rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-gold-500/20 p-2.5">
            <a 
              href={directAdLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-900/50 transition duration-300 gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
                  <Zap size={16} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white tracking-wide">Veloura VIP Streaming Server</div>
                  <div className="text-[10px] text-zinc-400">Click to connect to high-speed 4K mirror (Adsterra Direct)</div>
                </div>
              </div>
              <div className="shrink-0 bg-gold-500 hover:bg-gold-400 text-black text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition uppercase flex items-center gap-1 shadow-md shadow-gold-500/10">
                <span>Connect</span>
                <ExternalLink size={11} strokeWidth={2.5} />
              </div>
            </a>
          </div>

        </div>

      </div>
    );
  }

  // Type 2: Direct Ad Link promo container (Direct Link card)
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
