import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Check, X, Sparkles, AlertCircle } from 'lucide-react';

interface AgeVerificationProps {
  onVerify: () => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerify }) => {
  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F] overflow-hidden">
      {/* Background radial soft gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Decorative floating particles design */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-950/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg bg-[#18181F]/80 border border-gold-500/20 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl shadow-black/80 text-center"
      >
        {/* Top visual divider */}
        <div className="absolute top-0 inset-x-10 h-[1px] bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

        {/* Premium Veloura Shield Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#18181F] to-[#0B0B0F] border border-gold-400/30 text-gold-400 mb-8 shadow-xl relative group">
          <div className="absolute inset-0.5 rounded-full bg-gold-400/5 animate-pulse" />
          <ShieldAlert size={36} className="text-gold-400 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
        </div>

        {/* Brand Header */}
        <h2 className="text-sm font-mono uppercase tracking-[0.25em] text-gold-400 mb-2 font-semibold">
          VELOURA CINEMAS
        </h2>
        
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-white tracking-tight leading-tight mb-4">
          Age Verification
        </h1>

        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest bg-zinc-900/50 border border-zinc-800/80 rounded-full px-4 py-1.5 inline-block mb-6">
          🔐 Restrictive Entry Zone [18+]
        </p>

        {/* Warning text */}
        <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
          You are about to enter a highly curated, private archive of premium visual narratives and cinematic showcases. 
          <span className="block mt-4 text-zinc-400 text-xs font-medium border-t border-zinc-900 pt-4">
            By entering Veloura, you confirm that you are at least <strong className="text-gold-400 font-bold">18 years of age</strong> and agree to our terms of discrete viewing.
          </span>
        </p>

        {/* Interactive Buttons with luxury hover effect */}
        <div className="flex flex-col sm:flex-row-reverse gap-4 max-w-sm mx-auto">
          <button
            onClick={onVerify}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-semibold rounded-2xl transition duration-300 shadow-xl shadow-gold-500/10 active:scale-[0.98] cursor-pointer"
          >
            <Check size={18} strokeWidth={2.5} />
            Agree & Enter
          </button>
          
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-400 hover:text-white rounded-2xl transition duration-300 active:scale-[0.98] cursor-pointer"
          >
            <X size={18} />
            Leave Site
          </button>
        </div>

        {/* Subtle footer */}
        <div className="mt-10 pt-6 border-t border-zinc-900 text-[9px] font-mono text-zinc-600 flex justify-between items-center">
          <span>SECURE SECRETS COMPLIANCE</span>
          <span className="flex items-center gap-1">
            <Sparkles size={10} className="text-gold-500/50" />
            VELOURA EST. 2026
          </span>
        </div>
      </motion.div>
    </div>
  );
};
