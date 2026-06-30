import React, { useState } from 'react';
import { useVideos } from '../context/VideoContext';
import { CATEGORIES, Category } from '../types';
import { Search, Menu, X, ShieldAlert, Sliders, LogOut, CheckCircle2, ChevronRight, Laptop, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isAdminMode,
    setAdminMode,
    resetAgeVerification,
    favorites,
  } = useVideos();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Supporting standard high-level secure passcodes or standard admin login
    if (adminPassword === 'admin123' || (adminEmail === 'admin@veloura.tv' && adminPassword === 'premium2026')) {
      setAdminMode(true);
      setShowAdminPassModal(false);
      setAdminPassword('');
      setAdminEmail('');
      setAdminError('');
      setIsMenuOpen(false);
    } else {
      setAdminError('Incorrect passcode. Use default: admin123 or admin@veloura.tv / premium2026');
    }
  };

  const handleLogoutAdmin = () => {
    setAdminMode(false);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0B0F]/90 border-b border-gold-500/10 backdrop-blur-md">
      {/* Visual Top Decorative Gold Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo - Veloura */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-black font-serif font-bold shadow-lg shadow-gold-500/20 relative group">
            <span className="text-xl">V</span>
            <div className="absolute inset-0 rounded-xl border border-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-serif font-bold tracking-wide text-white leading-tight flex items-center gap-1">
              VELOURA
              <Sparkles size={11} className="text-gold-400 animate-pulse" />
            </span>
            <span className="text-[9px] font-mono text-gold-400/80 tracking-[0.25em] leading-none">
              PREMIUM STREAMING
            </span>
          </div>
        </div>

        {/* Live Search Bar with Gold Accents */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400/70">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search custom archives & categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181F]/80 hover:bg-[#18181F] focus:bg-[#18181F] focus:outline-none focus:ring-1 focus:ring-gold-400/40 text-sm text-zinc-100 placeholder-zinc-500 pl-10 pr-10 py-2.5 rounded-xl border border-gold-500/10 transition duration-150"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-gold-400 transition cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Menu & Control Badges */}
        <div className="flex items-center gap-3">
          
          {/* Favorites Badge */}
          {favorites.length > 0 && (
            <button
              onClick={() => setSelectedCategory('Favorites')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                selectedCategory === 'Favorites'
                  ? 'bg-gold-500/15 border-gold-400/40 text-gold-400'
                  : 'bg-[#18181F]/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Heart size={12} fill={selectedCategory === 'Favorites' ? 'currentColor' : 'none'} className="text-gold-400" />
              <span>{favorites.length} Favorites</span>
            </button>
          )}

          {/* Admin Badge */}
          {isAdminMode && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-mono text-[10px] uppercase tracking-wider">
              <Sliders size={12} />
              Session Admin
            </span>
          )}

          {/* Hamburger Drawer Action */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 bg-[#18181F] hover:bg-zinc-800 border border-gold-500/10 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer relative"
            aria-label="Open Veloura Menu"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Categories Chips - Scrolling Bar */}
      <div className="w-full bg-[#0B0B0F]/60 border-t border-gold-500/5 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2 px-4">
        {CATEGORIES.map((category) => {
          const isFavChip = category === 'Favorites';
          const isSelected = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black shadow-lg shadow-gold-500/15 font-semibold'
                  : 'bg-[#18181F]/80 hover:bg-[#18181F] text-zinc-400 hover:text-white border border-gold-500/5'
              }`}
            >
              {isFavChip && (
                <Heart size={11} fill={isSelected ? 'black' : 'none'} className={isSelected ? 'text-black' : 'text-gold-400'} />
              )}
              {category}
            </button>
          );
        })}
      </div>

      {/* Mobile Search input - visible under navigation */}
      <div className="px-4 pb-3.5 md:hidden bg-[#0B0B0F]/90 border-b border-gold-500/5">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-400/70">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Search Veloura catalogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181F] text-sm text-zinc-200 placeholder-zinc-500 pl-10 pr-4 py-2.5 rounded-xl border border-gold-500/5 focus:outline-none focus:ring-1 focus:ring-gold-400/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-gold-400"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Drawer Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/90 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#0B0B0F] border-l border-gold-500/10 shadow-2xl z-50 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-gold-500/10">
                  <span className="text-xs font-mono text-gold-400/80 tracking-widest uppercase">
                    VELOURA MENU
                  </span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="py-6 space-y-4">
                  {/* Shortcut: Favorites */}
                  <button
                    onClick={() => {
                      setSelectedCategory('Favorites');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#18181F] hover:bg-zinc-800/80 border border-gold-500/5 text-zinc-200 transition text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        <Heart size={14} className="text-gold-400" fill="currentColor" />
                        My Favorites Catalog
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Review your saved archives
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gold-400/10 text-gold-400 border border-gold-500/20">
                      {favorites.length}
                    </span>
                  </button>

                  {/* Option: Admin Auth panel */}
                  {isAdminMode ? (
                    <button
                      onClick={handleLogoutAdmin}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/30 transition text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-sm">Disable Admin Session</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          Secure database manipulation
                        </div>
                      </div>
                      <LogOut size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAdminPassModal(true);
                        setAdminError('');
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#18181F] hover:bg-zinc-800/80 border border-gold-500/10 text-zinc-200 transition text-left cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <Sliders size={14} className="text-gold-400" />
                          Administrative Control
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          Register or modify videos
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gold-400" />
                    </button>
                  )}

                  {/* Option: Gate testing reset */}
                  <button
                    onClick={() => {
                      resetAgeVerification();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#18181F] hover:bg-zinc-800/80 border border-gold-500/5 text-zinc-200 transition text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm">Lock Entrance Portal</div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        Trigger age-verification pass
                      </div>
                    </div>
                    <ShieldAlert size={16} className="text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Menu Footer */}
              <div className="pt-6 border-t border-gold-500/10 text-[10px] font-mono text-zinc-600 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span>VELOURA CONSOLE V1</span>
                  <span className="text-zinc-500">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>VERCEL OPTIMIZED</span>
                  <span className="text-zinc-500">Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>FIREBASE STORAGE</span>
                  <span className="text-zinc-500">Synced</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Administrative Auth Dialog / Firebase simulator */}
      <AnimatePresence>
        {showAdminPassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181F] border border-gold-500/20 rounded-3xl p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-10 h-[1px] bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

              <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                <Laptop size={20} className="text-gold-400" />
                Administrative Sign In
              </h3>
              <p className="text-zinc-400 text-xs mb-6">
                Provide secure administrative credentials. This connects to Veloura\'s private database.
              </p>

              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Admin Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="admin@veloura.tv"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-gold-500/10 text-sm text-zinc-200 placeholder-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Secure Administrative Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="Enter admin123 or premium2026"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-gold-500/10 text-sm text-zinc-200 placeholder-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                    required
                  />
                  {adminError && (
                    <p className="text-red-500 text-[10px] font-mono mt-2">
                      {adminError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Authenticate Session
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPassModal(false);
                      setAdminPassword('');
                      setAdminEmail('');
                      setAdminError('');
                    }}
                    className="px-5 py-3.5 bg-[#0B0B0F] border border-gold-500/5 text-zinc-400 rounded-xl text-xs font-semibold hover:bg-zinc-900 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
