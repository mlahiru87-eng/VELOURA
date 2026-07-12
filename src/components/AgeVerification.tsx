import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Check, X, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

interface AgeVerificationProps {
  onVerify: () => void;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerify }) => {
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!day || !month || !year) {
      setValidationError('Please select your complete date of birth.');
      return;
    }

    if (!agreedToTerms) {
      setValidationError('You must confirm that you are at least 18 years of age.');
      return;
    }

    const birthDay = parseInt(day, 10);
    const birthMonth = parseInt(month, 10);
    const birthYear = parseInt(year, 10);

    // Calculate age precisely
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() + 1 - birthMonth;
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }

    if (age >= 18) {
      setValidationError(null);
      onVerify();
    } else {
      setValidationError('ACCESS DENIED: You must be at least 18 years old to enter Veloura Cinemas.');
    }
  };

  // Generate Year options (e.g. from 2026 down to 1930)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 97 }, (_, i) => currentYear - i);
  
  // Generate Days options (1 to 31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0F] overflow-y-auto scrollbar-none">
      {/* Background radial soft red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Decorative floating particles design */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-red-950/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg bg-[#18181F]/85 border border-gold-500/20 rounded-3xl p-6 md:p-10 backdrop-blur-2xl shadow-2xl shadow-black/80 text-center my-8"
      >
        {/* Top visual divider */}
        <div className="absolute top-0 inset-x-10 h-[1px] bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

        {/* Premium Veloura Shield Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#18181F] to-[#0B0B0F] border border-gold-400/30 text-gold-400 mb-6 md:mb-8 shadow-xl relative group">
          <div className="absolute inset-0.5 rounded-full bg-gold-400/5 animate-pulse" />
          <ShieldAlert size={32} className="text-gold-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] md:w-9 md:h-9" />
        </div>

        {/* Brand Header */}
        <h2 className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-gold-400 mb-2 font-bold">
          VELOURA CINEMAS
        </h2>
        
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white tracking-tight leading-tight mb-2">
          Age Verification
        </h1>

        <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-900/50 border border-zinc-800/80 rounded-full px-4 py-1.5 inline-block mb-6">
          🔐 Restrictive Entry Zone [18+]
        </p>

        {/* Warning text */}
        <p className="text-zinc-300 text-xs md:text-sm leading-relaxed mb-6 max-w-md mx-auto">
          You are about to enter a highly curated, private archive of premium visual narratives and cinematic showcases. 
          Please confirm your eligibility to access restricted content.
        </p>

        <form onSubmit={handleVerifySubmit} className="space-y-6 text-left max-w-md mx-auto">
          
          {/* Select DOB Dropdowns */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-2">
              Select Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Day */}
              <select
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  setValidationError(null);
                }}
                className="bg-[#0B0B0F] border border-gold-500/15 text-zinc-200 text-xs rounded-xl px-3 py-3 focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 cursor-pointer font-mono"
              >
                <option value="">Day</option>
                {days.map(d => (
                  <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>

              {/* Month */}
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setValidationError(null);
                }}
                className="bg-[#0B0B0F] border border-gold-500/15 text-zinc-200 text-xs rounded-xl px-3 py-3 focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 cursor-pointer font-mono"
              >
                <option value="">Month</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              {/* Year */}
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setValidationError(null);
                }}
                className="bg-[#0B0B0F] border border-gold-500/15 text-zinc-200 text-xs rounded-xl px-3 py-3 focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 cursor-pointer font-mono"
              >
                <option value="">Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Terms Confirm Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-900/20 transition select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                setValidationError(null);
              }}
              className="mt-0.5 w-4.5 h-4.5 rounded border-zinc-800 bg-[#0B0B0F] text-gold-500 focus:ring-gold-400 focus:ring-offset-zinc-950 accent-gold-500 cursor-pointer"
            />
            <div className="text-[11px] text-zinc-400 leading-normal">
              By ticking this, I confirm that <strong className="text-gold-400 font-bold">I am at least 18 years old</strong>, agree to the terms of discrete viewing, and understand that videos are intended for adult audiences.
            </div>
          </label>

          {/* Error Message */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-xs leading-relaxed"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row-reverse gap-3.5 pt-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition duration-300 shadow-xl shadow-gold-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              Verify & Enter
            </button>
            
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-400 hover:text-white rounded-xl text-xs uppercase tracking-wider transition duration-300 active:scale-[0.98] cursor-pointer"
            >
              <X size={16} />
              Leave Site
            </button>
          </div>

        </form>

        {/* Subtle footer */}
        <div className="mt-10 pt-6 border-t border-zinc-900 text-[9px] font-mono text-zinc-600 flex justify-between items-center">
          <span>SECURE ARCHIVE COMPLIANCE</span>
          <span className="flex items-center gap-1">
            <Sparkles size={10} className="text-gold-500/50" />
            VELOURA EST. 2026
          </span>
        </div>
      </motion.div>
    </div>
  );
};

