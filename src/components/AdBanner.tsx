import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, X, Zap, Flame } from 'lucide-react';

interface AdBannerProps {
  id?: string;
  className?: string;
  type?: 'native' | 'banner' | 'direct';
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  id, 
  className = '', 
  type = 'native'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const directAdLink = "https://www.effectivecpmnetwork.com/acytcm6ag?key=6f8fff85e414d68c272b5409fda3ead2";

  // Native Container script injection (container-8b71d267cacce4bf5870c6483a0d4507)
  useEffect(() => {
    if (type === 'native' && isVisible && containerRef.current) {
      const containerId = 'container-8b71d267cacce4bf5870c6483a0d4507';
      const existingContainer = document.getElementById(containerId);
      
      // If container element does not exist inside our ref, append it
      if (!existingContainer && containerRef.current) {
        const div = document.createElement('div');
        div.id = containerId;
        containerRef.current.appendChild(div);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://pl30328996.effectivecpmnetwork.com/8b71d267cacce4bf5870c6483a0d4507/invoke.js';
        containerRef.current.appendChild(script);
      }
    }
  }, [type, isVisible]);

  if (!isVisible) return null;

  // 320x50 Banner with atOptions iframe srcDoc
  const getBanner320x50SrcDoc = () => {
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
      'key' : '9faf5d29efb91624fa28405d134175e0',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highperformanceformat.com/9faf5d29efb91624fa28405d134175e0/invoke.js"></script>
</body>
</html>`;
  };

  if (type === 'banner') {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-6 px-4 ${className}`} id={id}>
        <div className="flex justify-between items-center w-full max-w-[320px] mb-1.5 px-1">
          <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-1">
            <Sparkles size={10} className="text-gold-400/70" />
            Sponsored Ad
          </span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-zinc-600 hover:text-zinc-400 transition cursor-pointer"
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>

        {/* 320x50 Banner Frame */}
        <div className="w-[320px] h-[50px] overflow-hidden rounded-xl bg-zinc-950 border border-gold-500/20 shadow-md">
          <iframe
            title="Adsterra 320x50 Banner"
            srcDoc={getBanner320x50SrcDoc()}
            width="320"
            height="50"
            scrolling="no"
            frameBorder="0"
            className="w-[320px] h-[50px] border-0 overflow-hidden"
          />
        </div>
      </div>
    );
  }

  if (type === 'direct') {
    return (
      <div className={`w-full bg-gradient-to-r from-gold-500/5 via-gold-400/10 to-gold-500/5 border border-gold-500/20 rounded-2xl p-4 md:p-5 relative overflow-hidden group shadow-xl ${className}`} id={id}>
        <div className="absolute right-0 top-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl group-hover:bg-gold-400/20 transition-all duration-500 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 self-start sm:self-center">
            <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
              <Flame size={22} className="animate-pulse text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs md:text-sm font-serif font-bold text-white">⚡ Veloura High-Speed Server Mirror</h4>
                <span className="bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[8px] font-mono tracking-wider px-1.5 rounded uppercase">
                  VIP SPONSOR
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-zinc-400 mt-1">
                If video buffers or loads slowly, click below to connect to our fast 4K mirror server.
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
  }

  // Native Container Ad (8b71d267cacce4bf5870c6483a0d4507)
  return (
    <div className={`w-full flex flex-col items-center justify-center my-6 px-4 ${className}`} id={id}>
      <div className="flex justify-between items-center w-full max-w-4xl mb-1.5 px-1">
        <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-1">
          <Sparkles size={10} className="text-gold-400/70" />
          Sponsored Content
        </span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-zinc-600 hover:text-zinc-400 transition cursor-pointer"
          title="Dismiss"
        >
          <X size={12} />
        </button>
      </div>

      <div ref={containerRef} className="w-full max-w-4xl min-h-[100px] flex justify-center items-center overflow-hidden rounded-2xl bg-zinc-950/60 border border-gold-500/10 p-2">
        {/* Adsterra container inserted dynamically via useEffect */}
      </div>

      {/* Direct link fallback button under native banner for maximum CTR/CPM */}
      <a
        href={directAdLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-[10px] font-mono text-gold-400/80 hover:text-gold-300 flex items-center gap-1 transition"
      >
        <span>⚡ High Speed Server Download Link</span>
        <ExternalLink size={10} />
      </a>
    </div>
  );
};
