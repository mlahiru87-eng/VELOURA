import React from 'react';
import { useVideos } from '../context/VideoContext';
import { Home, Flame, Heart, Sliders, Shield } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
    isAdminMode,
    setAdminMode,
    isAgeVerified,
    setShowAuthModal,
  } = useVideos();

  if (!isAgeVerified) return null;

  const handleHomeClick = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePremiumClick = () => {
    setSelectedCategory('Hot');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavoritesClick = () => {
    setSelectedCategory('Favorites');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAdmin = () => {
    if (isAdminMode) {
      setAdminMode(false);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0B0B0F]/95 border-t border-gold-500/10 backdrop-blur-md px-4 py-2.5 flex items-center justify-around shadow-2xl safe-bottom">
      
      {/* Tab: Home */}
      <button
        onClick={handleHomeClick}
        className={`flex flex-col items-center justify-center gap-1.5 py-1 px-3 rounded-xl transition cursor-pointer ${
          selectedCategory === 'All'
            ? 'text-gold-400 font-bold'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Home size={18} />
        <span className="text-[10px] font-mono tracking-tight uppercase">Home</span>
      </button>

      {/* Tab: Premium (Gold Stream) */}
      <button
        onClick={handlePremiumClick}
        className={`flex flex-col items-center justify-center gap-1.5 py-1 px-3 rounded-xl transition cursor-pointer ${
          selectedCategory === 'Hot'
            ? 'text-gold-400 font-bold'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Flame size={18} className={selectedCategory === 'Hot' ? 'animate-pulse' : ''} />
        <span className="text-[10px] font-mono tracking-tight uppercase">VIP Feed</span>
      </button>

      {/* Tab: Favorites */}
      <button
        onClick={handleFavoritesClick}
        className={`flex flex-col items-center justify-center gap-1.5 py-1 px-3 rounded-xl transition cursor-pointer ${
          selectedCategory === 'Favorites'
            ? 'text-gold-400 font-bold'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Heart size={18} fill={selectedCategory === 'Favorites' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-mono tracking-tight uppercase">Saved</span>
      </button>

      {/* Tab: Admin Panel status */}
      <button
        onClick={toggleAdmin}
        className={`flex flex-col items-center justify-center gap-1.5 py-1 px-3 rounded-xl transition cursor-pointer ${
          isAdminMode
            ? 'text-gold-400 font-extrabold'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        {isAdminMode ? <Sliders size={18} /> : <Shield size={18} />}
        <span className="text-[10px] font-mono tracking-tight uppercase">
          {isAdminMode ? 'Admin' : 'Console'}
        </span>
      </button>

    </nav>
  );
};
