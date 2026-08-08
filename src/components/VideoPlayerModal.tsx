import React, { useState, useEffect, useRef } from 'react';
import { useVideos } from '../context/VideoContext';
import { Video } from '../types';
import { X, ThumbsUp, ThumbsDown, Eye, Share2, Heart, Check, CornerRightDown, Sparkles, Download, Loader2, MessageCircle, Send, MessageSquare, Link, Play, RotateCcw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getProxiedThumbnailUrl } from '../lib/utils';
import { getFallbackThumbnailUrl } from '../lib/aiSeoGenerator';

export const VideoPlayerModal: React.FC = () => {
  const { activeVideo, setActiveVideo, videos, toggleLike, incrementViews, favorites, toggleFavorite } = useVideos();
  const [copied, setCopied] = useState(false);
  const [userLiked, setUserLiked] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fast Click-To-Play State Machine: 'idle' | 'loading' | 'ready' | 'playing' | 'error'
  const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'ready' | 'playing' | 'error'>('idle');
  const [iframeRetryKey, setIframeRetryKey] = useState(0);

  // Connection Warm-Up: Preconnect & DNS-Prefetch for UQLoad host
  useEffect(() => {
    setPlayerState('idle');
    setIframeRetryKey(0);

    const embedUrl = activeVideo?.embedUrl || activeVideo?.iframeUrl;
    if (embedUrl) {
      try {
        const parsed = new URL(embedUrl);
        const origin = parsed.origin;
        if (origin && origin.startsWith('http')) {
          let pc = document.querySelector(`link[rel="preconnect"][href="${origin}"]`);
          if (!pc) {
            pc = document.createElement('link');
            pc.setAttribute('rel', 'preconnect');
            pc.setAttribute('href', origin);
            document.head.appendChild(pc);
          }
          let dns = document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`);
          if (!dns) {
            dns = document.createElement('link');
            dns.setAttribute('rel', 'dns-prefetch');
            dns.setAttribute('href', origin);
            document.head.appendChild(dns);
          }
        }
      } catch (e) {
        // Ignore URL parsing error
      }
    }
  }, [activeVideo?.id, activeVideo?.embedUrl, activeVideo?.iframeUrl]);

  // Loading Timeout Safeguard (15s)
  useEffect(() => {
    if (playerState !== 'loading') return;

    const timer = setTimeout(() => {
      setPlayerState('error');
    }, 15000);

    return () => clearTimeout(timer);
  }, [playerState, iframeRetryKey]);

  const handleStartPlay = () => {
    if (playerState !== 'idle' && playerState !== 'error') return;
    setPlayerState('loading');
  };

  const handleRetryPlay = () => {
    setIframeRetryKey(prev => prev + 1);
    setPlayerState('loading');
  };

  if (!activeVideo) return null;

  const isFavorited = favorites.includes(activeVideo.id);

  // Find related videos (same category, excluding current video)
  const relatedVideos = videos
    .filter(v => v.category === activeVideo.category && v.id !== activeVideo.id)
    .slice(0, 3);

  // Fallback: if no related videos in same category, get trending/latest
  const finalRelated = relatedVideos.length > 0 
    ? relatedVideos 
    : videos.filter(v => v.id !== activeVideo.id).slice(0, 3);

  const handleLikeClick = (isLike: boolean) => {
    const currentStatus = userLiked[activeVideo.id];
    
    if (isLike) {
      if (currentStatus === 'like') return; // Already liked
      toggleLike(activeVideo.id, true);
      setUserLiked(prev => ({ ...prev, [activeVideo.id]: 'like' }));
    } else {
      if (currentStatus === 'dislike') return; // Already disliked
      toggleLike(activeVideo.id, false);
      setUserLiked(prev => ({ ...prev, [activeVideo.id]: 'dislike' }));
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}/?video=${activeVideo.id}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const downloadLink = activeVideo.downloadUrl || activeVideo.videoUrl;
    if (!downloadLink) return;
    
    // If custom downloadUrl is present, redirect to it in a new tab
    if (activeVideo.downloadUrl) {
      const a = document.createElement('a');
      a.href = activeVideo.downloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      return;
    }

    try {
      setDownloading(true);
      const response = await fetch(downloadLink);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use clean alphanumeric name for download file
      const safeTitle = activeVideo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeTitle || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Direct download fetch failed, trying standard link download fallback:', err);
      const a = document.createElement('a');
      a.href = downloadLink;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = `${activeVideo.title}.mp4`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const playNextVideo = (nextVid: Video) => {
    incrementViews(nextVid.id);
    setActiveVideo(nextVid);
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B0B0F]/95 backdrop-blur-xl flex flex-col items-center justify-start p-0 md:p-6 lg:p-10">
      
      {/* Top action header */}
      <div className="w-full max-w-6xl flex justify-between items-center px-4 py-3 md:py-0 md:mb-4 shrink-0 bg-[#0B0B0F] md:bg-transparent border-b border-gold-500/10 md:border-b-0">
        <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-bold flex items-center gap-1.5">
          <Sparkles size={12} className="animate-pulse" />
          Veloura High Fidelity Cinema Decryption
        </span>
        <button
          onClick={() => setActiveVideo(null)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#18181F] hover:bg-zinc-800 border border-gold-500/20 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <X size={14} />
          Exit Cinema
        </button>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#18181F] md:border md:border-gold-500/15 md:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex-1 mb-16 md:mb-0">
        
        {/* Main Cinema Area */}
        <div className="lg:col-span-2 flex flex-col">
                    {/* Main Video Element */}
          <div className="relative aspect-video bg-black w-full border-b border-gold-500/5">
            {/* 1. IDLE STATE: Primary LCP Thumbnail Poster + Instant Click-to-Play Overlay */}
            {playerState === 'idle' && (
              <div 
                onClick={handleStartPlay}
                className="relative w-full h-full cursor-pointer group flex items-center justify-center overflow-hidden bg-black select-none"
                title="Click to play video"
              >
                <img
                  src={getProxiedThumbnailUrl(activeVideo.thumbnailUrl)}
                  alt={activeVideo.title}
                  loading="eager"
                  decoding="async"
                  width="1280"
                  height="720"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackThumbnailUrl(activeVideo.title, activeVideo.category);
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold-400/20 backdrop-blur-md border border-gold-400/50 flex items-center justify-center text-gold-400 group-hover:bg-gold-400 group-hover:text-black transition-all duration-300 shadow-2xl shadow-gold-500/20 group-hover:scale-110">
                    <Play size={32} className="ml-1 fill-current" />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-gold-500/30 text-xs font-mono font-bold text-gold-400 uppercase tracking-widest shadow-xl group-hover:bg-gold-400 group-hover:text-black transition duration-300">
                    Click to Play Stream
                  </span>
                </div>
                {activeVideo.duration && (
                  <span className="absolute bottom-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-gold-500/20 text-[11px] font-mono font-bold text-zinc-300">
                    {activeVideo.duration}
                  </span>
                )}
              </div>
            )}

            {/* 2. LOADING OVERLAY */}
            {playerState === 'loading' && (
              <div className="absolute inset-0 bg-[#0B0B0F] flex flex-col items-center justify-center space-y-3 z-30 pointer-events-none select-none">
                <Loader2 size={40} className="text-gold-400 animate-spin" />
                <span className="text-xs font-mono tracking-widest text-gold-400 uppercase font-bold animate-pulse">
                  Loading video...
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Connecting to high-speed stream server
                </span>
              </div>
            )}

            {/* 3. ERROR OVERLAY WITH RETRY */}
            {playerState === 'error' && (
              <div className="absolute inset-0 bg-[#0B0B0F] flex flex-col items-center justify-center space-y-4 z-30 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Video could not be loaded.
                  </h4>
                  <p className="text-xs font-mono text-zinc-400 max-w-sm">
                    The video stream server timed out or was temporarily unresponsive.
                  </p>
                </div>
                <button
                  onClick={handleRetryPlay}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gold-400 hover:bg-gold-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-gold-500/20"
                >
                  <RotateCcw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* 4. IFRAME OR VIDEO RENDER */}
            {playerState !== 'idle' && (
              (activeVideo.embedUrl || activeVideo.iframeUrl) ? (
                <iframe
                  key={`uqload-iframe-modal-${activeVideo.id}-${iframeRetryKey}`}
                  src={activeVideo.embedUrl || activeVideo.iframeUrl}
                  onLoad={() => setPlayerState('playing')}
                  onError={() => setPlayerState('error')}
                  className="w-full h-full border-0 rounded-[16px]"
                  style={{ width: '100%' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                  scrolling="no"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={activeVideo.videoUrl}
                  poster={getProxiedThumbnailUrl(activeVideo.thumbnailUrl)}
                  controls
                  autoPlay
                  playsInline
                  onCanPlay={() => setPlayerState('playing')}
                  onError={() => setPlayerState('error')}
                  className="w-full h-full object-contain"
                />
              )
            )}
          </div>

          {/* Video detail details */}
          <div className="p-5 md:p-8 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/20 text-[10px] font-mono font-bold uppercase text-gold-400">
                {activeVideo.category}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                HASH: {activeVideo.id.toUpperCase()}
              </span>
            </div>

            <h2 className="text-xl md:text-3xl font-serif font-semibold text-white tracking-tight leading-snug">
              {activeVideo.title}
            </h2>

            {/* Micro interaction Shelf */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pb-6 border-b border-zinc-900">
              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} className="text-gold-400" />
                  {activeVideo.views.toLocaleString()} Streams
                </span>
                <span>•</span>
                <span>Uploaded {activeVideo.uploadDate}</span>
              </div>

              {/* Like / Share / Favorite controls */}
              <div className="flex items-center gap-2">
                
                {/* Like */}
                <button
                  onClick={() => handleLikeClick(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    userLiked[activeVideo.id] === 'like'
                      ? 'bg-gold-500/15 border-gold-400/50 text-gold-400'
                      : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300'
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>{activeVideo.likes + (userLiked[activeVideo.id] === 'like' ? 1 : 0)}</span>
                </button>

                {/* Dislike */}
                <button
                  onClick={() => handleLikeClick(false)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    userLiked[activeVideo.id] === 'dislike'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300'
                  }`}
                >
                  <ThumbsDown size={13} />
                  <span>{activeVideo.dislikes + (userLiked[activeVideo.id] === 'dislike' ? 1 : 0)}</span>
                </button>

                {/* Bookmark/Favorite */}
                <button
                  onClick={() => toggleFavorite(activeVideo.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isFavorited
                      ? 'bg-gold-500/15 border-gold-400/50 text-gold-400 font-bold'
                      : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300'
                  }`}
                >
                  <Heart size={13} fill={isFavorited ? '#D4AF37' : 'none'} className="text-gold-400" />
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                </button>

                {/* Download */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/5 rounded-xl text-xs font-semibold text-zinc-300 transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  title={activeVideo.downloadUrl ? "Open download link" : "Download video as MP4"}
                  id="btn-download-video-modal"
                >
                  <Download size={13} className={downloading ? 'animate-bounce text-gold-400' : 'text-gold-400'} />
                  <span>{downloading ? 'Downloading...' : activeVideo.downloadUrl ? 'Download Video' : 'Download MP4'}</span>
                </button>

                {/* Share Link */}
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                    showShareMenu
                      ? 'bg-gold-500 text-black border-gold-500'
                      : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300'
                  }`}
                  title="Share Options"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>
              </div>

              {/* Share Options Drawer */}
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-[#0B0B0F]/90 border border-gold-500/10 rounded-2xl flex flex-wrap gap-2 items-center"
                >
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider mr-2">Share via:</span>
                  
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(activeVideo.title + '\n' + getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#075E54]/10 hover:bg-[#075E54]/20 border border-[#075E54]/20 rounded-lg text-xs font-semibold text-[#25D366] transition"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(activeVideo.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-lg text-xs font-semibold text-[#38bdf8] transition"
                  >
                    <Send size={13} />
                    <span>Telegram</span>
                  </a>

                  {/* Messenger */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006AFF]/10 hover:bg-[#006AFF]/20 border border-[#006AFF]/20 rounded-lg text-xs font-semibold text-[#2563eb] transition"
                  >
                    <MessageSquare size={13} />
                    <span>Messenger</span>
                  </a>

                  {/* Copy Link */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/5 hover:bg-gold-500/10 border border-gold-500/15 rounded-lg text-xs font-semibold text-gold-400 transition cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-green-500" /> : <Link size={13} />}
                    <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Overview Detail text */}
            <div className="mt-6">
              <h4 className="text-xs font-mono font-bold uppercase text-gold-400/80 tracking-widest mb-2.5">
                Overview & Insight
              </h4>
              <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                {activeVideo.description || 'This is a premium high-resolution video stream prepared exclusively for certified Veloura viewers. Sound design and lighting contrast optimized for professional dark theater rooms.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cinematic Related Sidebar list */}
        <div className="p-5 md:p-8 bg-[#13131A] border-t lg:border-t-0 lg:border-l border-gold-500/5 flex flex-col">
          <h3 className="text-xs font-mono font-bold uppercase text-gold-400/80 tracking-widest mb-5 flex items-center gap-2">
            <CornerRightDown size={14} className="text-gold-400 animate-bounce" />
            Bespoke Suggestions
          </h3>

          <div className="flex flex-col gap-4 overflow-y-auto flex-1">
            {finalRelated.map(item => (
              <div
                key={`related-${item.id}`}
                onClick={() => playNextVideo(item)}
                className="group flex gap-3 p-2.5 bg-[#0B0B0F]/40 hover:bg-[#0B0B0F] border border-gold-500/5 hover:border-gold-500/15 rounded-xl transition cursor-pointer"
              >
                {/* Small Cover image */}
                <div className="relative aspect-video w-24 shrink-0 rounded-lg overflow-hidden bg-[#18181F]">
                  <img
                    src={getProxiedThumbnailUrl(item.thumbnailUrl)}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-300">
                    {item.duration}
                  </span>
                </div>

                {/* Suggestion title */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 group-hover:text-gold-400 transition truncate leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-normal">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 block mt-1">
                    {item.views.toLocaleString()} Views
                  </span>
                </div>
              </div>
            ))}
            
            {finalRelated.length === 0 && (
              <p className="text-zinc-600 text-xs font-mono py-8 text-center">
                No matching related video recommendations.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
