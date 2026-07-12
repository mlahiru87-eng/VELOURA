import React, { useState, useEffect, useRef } from 'react';
import { useVideos } from '../context/VideoContext';
import { Video } from '../types';
import { AdBanner } from './AdBanner';
import { 
  ChevronLeft, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Share2, 
  Heart, 
  Check, 
  CornerRightDown, 
  Sparkles, 
  Calendar, 
  Download,
  Maximize,
  Minimize,
  Smartphone,
  Tv,
  Layout,
  Loader2,
  Sliders,
  Edit,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

export const VideoPlayerPage: React.FC = () => {
  const { 
    activeVideo, 
    setActiveVideo, 
    videos, 
    toggleLike, 
    incrementViews, 
    favorites, 
    toggleFavorite,
    isAdminMode,
    deleteVideo,
    setEditTarget
  } = useVideos();
  const [copied, setCopied] = useState(false);
  const [userLiked, setUserLiked] = useState<{[key: string]: 'like' | 'dislike' | null}>({});
  
  // Element Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Responsive Player Options
  const [iframeAspect, setIframeAspect] = useState<'16:9' | '9:16' | 'responsive'>('16:9');
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [resumed, setResumed] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Synchronize fullscreen element triggers
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request refused:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Fullscreen exit failed:', err);
      });
    }
  };

  // Reset increment state, loading, and aspect ratio configuration on video change
  useEffect(() => {
    setViewIncremented(false);
    setResumed(false);
    setIsIframeLoading(true);
    
    // Auto detect aspect ratio based on orientation if provided
    if (activeVideo?.orientation === 'portrait') {
      setIframeAspect('9:16');
    } else {
      setIframeAspect('16:9');
    }
  }, [activeVideo?.id, activeVideo?.orientation]);

  // Find related recommendations
  const relatedVideos = activeVideo
    ? videos.filter(v => v.category === activeVideo.category && v.id !== activeVideo.id).slice(0, 3)
    : [];
  const finalRelated = relatedVideos.length > 0 
    ? relatedVideos 
    : videos.filter(v => activeVideo && v.id !== activeVideo.id).slice(0, 3);

  // Resume progress, listen to ended events, autoNext, and track time updates (for direct MP4 fallbacks)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!activeVideo || !videoEl) return;

    // Load video element
    videoEl.load();

    // 1. Continue Watching head restoration
    const savedTime = localStorage.getItem(`veloura_progress_${activeVideo.id}`);
    if (savedTime) {
      const time = parseFloat(savedTime);
      
      const handleMetadataLoaded = () => {
        if (time > 2 && time < videoEl.duration - 5) {
          videoEl.currentTime = time;
          setResumed(true);
          setTimeout(() => setResumed(false), 3500);
        }
      };

      videoEl.addEventListener('loadedmetadata', handleMetadataLoaded);
      
      // Try seeking immediately if metadata is already ready
      if (videoEl.readyState >= 1) {
        handleMetadataLoaded();
      }
    }

    // Play video
    videoEl.play().catch(err => {
      console.log('Autoplay blocked:', err);
    });

    // 2. Save playing progress under continue watching
    const handleTimeUpdate = () => {
      if (videoEl.currentTime > 2 && videoEl.currentTime < videoEl.duration - 2) {
        localStorage.setItem(`veloura_progress_${activeVideo.id}`, videoEl.currentTime.toString());
      }
    };

    // 3. Auto Next queue automation on end
    const handleEnded = () => {
      // Clear progress when video completes
      localStorage.removeItem(`veloura_progress_${activeVideo.id}`);
      if (autoNext && finalRelated.length > 0) {
        playNextVideo(finalRelated[0]);
      }
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('ended', handleEnded);

    return () => {
      if (videoEl) {
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
        videoEl.removeEventListener('ended', handleEnded);
      }
    };
  }, [activeVideo?.id, autoNext, finalRelated.map(v => v.id).join(',')]);

  // INCREASE FIRESTORE VIEWS IMMEDIATELY WHEN PAGE OPENS
  useEffect(() => {
    if (activeVideo && !viewIncremented) {
      incrementViews(activeVideo.id);
      setViewIncremented(true);
    }
  }, [activeVideo?.id, viewIncremented]);

  if (!activeVideo) return null;

  const isFavorited = favorites.includes(activeVideo.id);

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

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?video=${activeVideo.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!activeVideo?.videoUrl) return;
    try {
      setDownloading(true);
      const response = await fetch(activeVideo.videoUrl);
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
      a.href = activeVideo.videoUrl;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formattedDate = activeVideo.uploadDate 
    ? new Date(activeVideo.uploadDate).toLocaleDateString(undefined, { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Unknown Date';

  return (
    <div className="w-full space-y-6">
      
      {/* Back Button and Path */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setActiveVideo(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#18181F] hover:bg-zinc-800 border border-gold-500/10 hover:border-gold-500/30 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to Catalog
        </button>

        <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-bold flex items-center gap-1.5">
          <Sparkles size={12} className="animate-pulse text-gold-400" />
          Veloura High Fidelity Decryption
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Cinema Player and Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Video element with gold-tint shadow */}
          <div 
            ref={playerContainerRef}
            className={`relative bg-black rounded-3xl overflow-hidden border border-gold-500/10 shadow-2xl transition-all duration-300 flex flex-col justify-between ${
              isFullscreen 
                ? 'w-full h-full min-h-[80vh]' 
                : iframeAspect === '9:16'
                  ? 'aspect-[9/16] max-h-[75vh] max-w-[420px] mx-auto' 
                  : iframeAspect === 'responsive'
                    ? 'w-full min-h-[320px] md:min-h-[500px]'
                    : 'aspect-video w-full'
            }`}
          >
            {/* Loading Indicator for Google Drive iframe */}
            {activeVideo.iframeUrl && isIframeLoading && (
              <div className="absolute inset-0 bg-[#0B0B0F] flex flex-col items-center justify-center space-y-4 z-30">
                <Loader2 size={36} className="text-gold-400 animate-spin" />
                <span className="text-xs font-mono tracking-widest text-gold-400 uppercase font-bold animate-pulse">
                  Decrypting Secure Stream...
                </span>
              </div>
            )}

            {/* Video Player Render Choice */}
            {activeVideo.iframeUrl ? (
              <iframe
                src={activeVideo.iframeUrl}
                onLoad={() => setIsIframeLoading(false)}
                className="w-full h-full border-0 flex-1"
                allow="autoplay; fullscreen"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            ) : (
              <video
                ref={videoRef}
                src={activeVideo.videoUrl}
                poster={activeVideo.thumbnailUrl}
                controls
                autoPlay
                playsInline
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain flex-1 bg-black"
              />
            )}

            {/* Cinematic Overlay Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gold-500/15 text-xs font-mono shadow-2xl opacity-40 hover:opacity-100 transition-opacity duration-200">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mr-1">
                Aspect
              </span>
              
              {/* Aspect 16:9 */}
              <button
                onClick={() => setIframeAspect('16:9')}
                className={`p-1 rounded transition hover:text-gold-400 cursor-pointer ${iframeAspect === '16:9' ? 'text-gold-400 bg-gold-400/15' : 'text-zinc-400'}`}
                title="Widescreen (16:9)"
              >
                <Tv size={13} />
              </button>

              {/* Aspect 9:16 */}
              <button
                onClick={() => setIframeAspect('9:16')}
                className={`p-1 rounded transition hover:text-gold-400 cursor-pointer ${iframeAspect === '9:16' ? 'text-gold-400 bg-gold-400/15' : 'text-zinc-400'}`}
                title="Portrait Shorts (9:16)"
              >
                <Smartphone size={13} />
              </button>

              {/* Aspect Responsive */}
              <button
                onClick={() => setIframeAspect('responsive')}
                className={`p-1 rounded transition hover:text-gold-400 cursor-pointer ${iframeAspect === 'responsive' ? 'text-gold-400 bg-gold-400/15' : 'text-zinc-400'}`}
                title="Auto-Fit Responsive"
              >
                <Layout size={13} />
              </button>

              <span className="h-3.5 w-[1px] bg-zinc-800 mx-1" />

              {/* Fullscreen Trigger */}
              <button
                onClick={handleToggleFullscreen}
                className="p-1 rounded transition hover:text-gold-400 text-zinc-400 cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Cinematic Fullscreen'}
              >
                {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
              </button>
            </div>

            {resumed && !activeVideo.iframeUrl && (
              <div className="absolute top-4 left-4 z-20 bg-black/85 border border-gold-400/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-lg animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                <span className="text-[10px] font-mono text-zinc-300">Resumed playhead progress</span>
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-[#18181F] border border-gold-500/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-[10px] font-mono font-bold uppercase text-gold-400 tracking-wider">
                  {activeVideo.category}
                </span>
                {activeVideo.premium && (
                  <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-mono font-bold uppercase text-red-400 tracking-wider">
                    Premium
                  </span>
                )}
                <span className="text-[10px] font-mono text-zinc-500">
                  HASH: {activeVideo.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Views Counter & Date Info */}
              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} className="text-gold-400" />
                  {activeVideo.views.toLocaleString()} Streams
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-gold-400" />
                  {formattedDate}
                </span>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
              {activeVideo.title}
            </h1>

            {/* Admin Management Panel */}
            {isAdminMode && (
              <div className="p-4 bg-[#1C1C24] border border-gold-500/10 hover:border-gold-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <div className="w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center shrink-0">
                    <Sliders size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-serif">Administrative Controller</h4>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase">Manage active playback record</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => {
                      setEditTarget(activeVideo);
                      setActiveVideo(null); // Return to home grid to show admin form
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <Edit size={12} />
                    <span>Edit Video</span>
                  </button>
                  {!isConfirmingDelete ? (
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-red-950/80 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete Video</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                      <button
                        onClick={async () => {
                          try {
                            await deleteVideo(activeVideo.id);
                            setIsConfirmingDelete(false);
                            setActiveVideo(null); // Return to home screen
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer animate-pulse"
                      >
                        <span>Confirm Delete?</span>
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reaction shelf (Like, Dislike, Bookmark, Share) */}
            <div className="flex flex-wrap items-center gap-3 py-4 border-y border-zinc-900">
              {/* Like */}
              <button
                onClick={() => handleLikeClick(true)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  userLiked[activeVideo.id] === 'like'
                    ? 'bg-gold-500/15 border-gold-400/50 text-gold-400 shadow-lg shadow-gold-500/5'
                    : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <ThumbsUp size={14} />
                <span>{activeVideo.likes + (userLiked[activeVideo.id] === 'like' ? 1 : 0)} Likes</span>
              </button>

              {/* Dislike */}
              <button
                onClick={() => handleLikeClick(false)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  userLiked[activeVideo.id] === 'dislike'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg'
                    : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <ThumbsDown size={14} />
                <span>{activeVideo.dislikes + (userLiked[activeVideo.id] === 'dislike' ? 1 : 0)} Dislikes</span>
              </button>

              {/* Favorite */}
              <button
                onClick={() => toggleFavorite(activeVideo.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isFavorited
                    ? 'bg-gold-500/15 border-gold-400/50 text-gold-400 font-bold'
                    : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/5 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <Heart size={14} fill={isFavorited ? '#D4AF37' : 'none'} className="text-gold-400" />
                <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/5 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                title="Download video as MP4"
                id="btn-download-video-page"
              >
                <Download size={14} className={downloading ? 'animate-bounce text-gold-400' : 'text-gold-400'} />
                <span>{downloading ? 'Downloading...' : 'Download MP4'}</span>
              </button>

              {/* Auto Next Toggle */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0B0B0F] border border-gold-500/5 hover:border-zinc-850 rounded-xl text-xs text-zinc-300 select-none ml-auto">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">Auto Next</span>
                <button
                  type="button"
                  onClick={() => setAutoNext(!autoNext)}
                  className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                    autoNext ? 'bg-gold-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#0B0B0F] transition-transform duration-200 ${
                      autoNext ? 'translate-x-[15px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/5 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                <span>{copied ? 'Link Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Description & Overview */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-mono font-bold uppercase text-gold-400 tracking-widest">
                Overview & Narrative
              </h4>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {activeVideo.description || 'This is a premium high-resolution video stream prepared exclusively for certified Veloura viewers. Sound design and lighting contrast optimized for professional dark theater rooms.'}
              </p>
            </div>

            {/* Direct-link VIP Mirror Server ad placement */}
            <AdBanner type="direct-promo" className="mt-4" />

          </div>

        </div>

        {/* Right Side: Showcase Metadata and Related Videos */}
        <div className="space-y-6">
          
          {/* Cover Art Box - satisfying "Show: Thumbnail" on dedicated page explicitly */}
          <div className="bg-[#18181F] border border-gold-500/10 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-gold-400 tracking-widest">
              Cinematic Poster
            </h3>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800">
              <img
                src={activeVideo.thumbnailUrl}
                alt={activeVideo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[10px] font-mono text-zinc-500 leading-relaxed text-center">
              Active Stream Target: {activeVideo.duration} • Category {activeVideo.category}
            </div>
          </div>

          {/* Related suggestions panel */}
          <div className="bg-[#18181F] border border-gold-500/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-gold-400 tracking-widest flex items-center gap-2">
              <CornerRightDown size={14} className="text-gold-400 animate-bounce" />
              Bespoke Recommendations
            </h3>

            <div className="flex flex-col gap-4">
              {finalRelated.map(item => (
                <div
                  key={`related-${item.id}`}
                  onClick={() => playNextVideo(item)}
                  className="group flex gap-3 p-2.5 bg-[#0B0B0F]/40 hover:bg-[#0B0B0F] border border-gold-500/5 hover:border-gold-500/15 rounded-2xl transition cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-24 shrink-0 rounded-xl overflow-hidden bg-black">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-300">
                      {item.duration}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-gold-400 transition truncate leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 leading-normal">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 block">
                      {item.views.toLocaleString()} Streams
                    </span>
                  </div>
                </div>
              ))}

              {finalRelated.length === 0 && (
                <p className="text-zinc-600 text-xs font-mono py-4 text-center">
                  No similar stream suggestions.
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
