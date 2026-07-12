import React, { useState } from 'react';
import { VideoProvider, useVideos } from './context/VideoContext';
import { AgeVerification } from './components/AgeVerification';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerPage } from './components/VideoPlayerPage';
import { AdBanner } from './components/AdBanner';
import { BottomNav } from './components/BottomNav';
import { Video } from './types';
import { Play, Flame, Film, Sparkles, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function StreamingPortalContent() {
  const {
    isAgeVerified,
    verifyAge,
    videos,
    loading,
    error,
    refetchVideos,
    selectedCategory,
    searchQuery,
    activeVideo,
    setActiveVideo,
    incrementViews,
    favorites,
    accessDeniedMessage,
    setAccessDeniedMessage,
    editTarget,
    setEditTarget,
  } = useVideos();

  // Filter and Sort: Latest Videos sorted by uploadDate descending
  const filteredVideos = videos
    .filter((video) => {
      // Automatically display all active videos on the homepage
      if (!video.active) return false;

      const matchesCategory =
        selectedCategory === 'All' || 
        (selectedCategory === 'Favorites' ? favorites.includes(video.id) : video.category === selectedCategory);
        
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const timeA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
      const timeB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
      return timeB - timeA; // descending Latest order
    });

  // Display Featured Videos where featured=true (or fallback to first matching video)
  const featuredVideo = filteredVideos.find((v) => v.featured) || filteredVideos[0];

  // Display Trending Videos sorted by views descending
  const trendingVideos = [...filteredVideos]
    .sort((a, b) => b.views - a.views);

  const handleLaunchHero = (video: Video) => {
    setActiveVideo(video);
  };

  if (!isAgeVerified) {
    return <AgeVerification onVerify={verifyAge} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-100 flex flex-col font-sans selection:bg-gold-400 selection:text-black pb-20 md:pb-8">
      {/* Top Header & Chips */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Administrator Interface */}
        <AdminPanel 
          editVideoTarget={editTarget} 
          onCloseEditTarget={() => setEditTarget(null)} 
        />

        {loading ? (
          /* Loading State */
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gold-500/10" />
              <div className="absolute inset-0 rounded-full border-4 border-t-gold-400 animate-spin" />
            </div>
            <p className="text-zinc-400 font-mono text-xs tracking-widest uppercase animate-pulse">
              Synchronizing with Veloura Secure Vault...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-20 text-center max-w-md mx-auto border border-red-500/20 bg-red-950/10 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Vault Connection Refused</h4>
            <p className="text-xs text-zinc-500 font-mono leading-relaxed">{error}</p>
            <button 
              onClick={refetchVideos}
              className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : activeVideo ? (
          /* 4. Dedicated Video Player page */
          <VideoPlayerPage />
        ) : (
          /* Normal Home grid view */
          <>
            {/* 1. FEATURED HERO BILLBOARD BANNER */}
            {featuredVideo ? (
              <section className="relative w-full rounded-3xl overflow-hidden border border-gold-500/10 bg-[#18181F] aspect-[21/9] min-h-[250px] md:min-h-[420px] flex items-end shadow-2xl">
                {/* Background Image poster */}
                <div className="absolute inset-0">
                  <img
                    src={featuredVideo.thumbnailUrl}
                    alt={featuredVideo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-45"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/45 to-transparent" />
                  <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#0B0B0F] to-transparent hidden md:block" />
                </div>

                {/* Overlap Text */}
                <div className="relative z-10 p-6 sm:p-8 md:p-12 max-w-2xl">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400 text-[9px] font-mono font-bold uppercase tracking-widest text-black shadow-lg shadow-gold-500/15">
                      <Sparkles size={10} />
                      Featured Masterpiece
                    </span>
                    <span className="text-[10px] font-mono text-gold-300 font-semibold uppercase tracking-wider">
                      {featuredVideo.duration} • {featuredVideo.category}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl md:text-5xl font-serif font-bold tracking-tight text-white line-clamp-2 leading-tight">
                    {featuredVideo.title}
                  </h1>
                  
                  <p className="text-zinc-400 text-xs sm:text-sm mt-3 line-clamp-2 sm:line-clamp-3 leading-relaxed hidden sm:block">
                    {featuredVideo.description}
                  </p>

                  <div className="mt-6 flex items-center gap-4">
                    <button
                      onClick={() => handleLaunchHero(featuredVideo)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black rounded-xl text-xs sm:text-sm font-bold transition duration-200 shadow-xl shadow-gold-500/10 active:scale-[0.98] cursor-pointer"
                    >
                      <Play size={16} fill="currentColor" />
                      Begin Experience
                    </button>
                    <div className="text-[10px] sm:text-xs font-mono text-zinc-500">
                      {featuredVideo.views.toLocaleString()} curated playbacks
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <div className="p-8 text-center bg-[#18181F]/40 border border-gold-500/5 rounded-2xl">
                <p className="text-sm font-mono text-zinc-500">No cinematic showpieces match the current filters.</p>
              </div>
            )}

            {/* ADSTERRA BANNER PLACEHOLDER - BELOW FEATURED SECTION */}
            <AdBanner id="adsterra-banner-1" />

            {/* 2. TRENDING VIDEOS SECTION (Sorted by views descending) */}
            {trendingVideos.length > 0 && selectedCategory === 'All' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-gold-500/10 pb-2.5">
                  <h3 className="text-sm md:text-base font-serif font-semibold uppercase tracking-wide text-white flex items-center gap-2">
                    <Flame size={16} className="text-gold-400 animate-pulse" />
                    Trending Masterclasses
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Global Acceleration Queue</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingVideos.slice(0, 3).map((video) => (
                    <VideoCard 
                      key={`trending-${video.id}`} 
                      video={video} 
                      onEditClick={(v) => setEditTarget(v)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. LATEST VIDEOS / EXPANSIVE ARCHIVE (Sorted by uploadDate descending) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gold-500/10 pb-2.5">
                <h3 className="text-sm md:text-base font-serif font-semibold uppercase tracking-wide text-white flex items-center gap-2">
                  <Film size={16} className="text-gold-400" />
                  {selectedCategory === 'All' 
                    ? 'Latest Curated Releases' 
                    : selectedCategory === 'Favorites' 
                      ? 'My Bookmarked Archives' 
                      : `${selectedCategory} Showcases`}
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {filteredVideos.length} Channels Loaded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard 
                    key={`latest-${video.id}`} 
                    video={video} 
                    onEditClick={(v) => setEditTarget(v)}
                  />
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <div className="py-20 text-center border border-dashed border-gold-500/10 rounded-3xl bg-[#18181F]/30 max-w-lg mx-auto">
                  {selectedCategory === 'Favorites' ? (
                    <Heart className="mx-auto text-gold-400/40 mb-3 animate-pulse" size={36} />
                  ) : (
                    <AlertTriangle className="mx-auto text-gold-400/40 mb-3" size={36} />
                  )}
                  <h4 className="text-sm text-zinc-200 font-bold uppercase tracking-wider">
                    {selectedCategory === 'Favorites' ? 'Your Saved Vault is Empty' : 'Archive Discovered Nothing'}
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono mt-2 leading-relaxed px-4">
                    {selectedCategory === 'Favorites' 
                      ? 'Click the heart icon on any cinematic card to curate your own custom premium theater list.'
                      : 'Try selecting another category or resetting your search bar keywords.'}
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ADSTERRA BANNER PLACEHOLDER - ABOVE FOOTER */}
        <AdBanner id="adsterra-banner-2" className="mt-8" />

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#18181F] border-t border-gold-500/10 mt-auto py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-black font-serif font-bold shadow-md shadow-gold-500/15">
                <span>V</span>
              </div>
              <span className="text-base font-serif font-bold tracking-wider text-white uppercase">
                VELOURA<span className="text-gold-400">TV</span>
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto md:mx-0">
              A private luxury video archive delivering high-fidelity decrypted cinematic streams. 
              Our service offers unparalleled sound design and customized visual aesthetics.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase text-gold-400 tracking-widest">
              Compliance & Decryption
            </h4>
            <div className="flex items-center justify-center md:justify-start gap-2.5 text-zinc-400 text-xs">
              <ShieldCheck size={14} className="text-gold-400" />
              <span>Full Iframe Sandbox Secured</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2.5 text-zinc-400 text-xs">
              <ShieldCheck size={14} className="text-gold-400" />
              <span>Double-Verification (Age & Passcode Gated)</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2.5 text-zinc-400 text-xs">
              <ShieldCheck size={14} className="text-gold-400" />
              <span>Vercel Deployable Framework</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-zinc-400 font-mono">
            <h4 className="text-[11px] font-mono font-bold uppercase text-gold-400 tracking-widest">
              Authentic Showcase
            </h4>
            <p className="leading-relaxed text-zinc-500">
              Veloura serves as a demonstrative framework highlighting high-end luxury client architecture. 
              Video streaming belongs to open-source creators.
            </p>
            <div className="pt-2 text-[10px] text-zinc-600">
              © 2026 VELOURA INC. ALL RIGHTS RESERVED.
            </div>
          </div>

        </div>
      </footer>

      {/* Access Denied Toast/Modal */}
      <AnimatePresence>
        {accessDeniedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#18181F]/95 border border-red-500/30 rounded-3xl p-6 shadow-2xl relative text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-serif font-bold text-white mb-2">Access Denied</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-mono">
                {accessDeniedMessage}
              </p>
              <button
                onClick={() => setAccessDeniedMessage(null)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl border border-zinc-700/50 transition cursor-pointer"
              >
                Return to Veloura Archive
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Touch Bottom Navigator for mobile */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <VideoProvider>
      <StreamingPortalContent />
    </VideoProvider>
  );
}
