import React, { useState, useEffect, useRef } from 'react';
import { useVideos } from '../context/VideoContext';
import { Video, Category, CATEGORIES } from '../types';
import { getProxiedThumbnailUrl } from '../lib/utils';
import { generateAiSeoMetadata, getFallbackThumbnailUrl } from '../lib/aiSeoGenerator';
import { AdBanner } from './AdBanner';
import { triggerSessionPopunder } from '../lib/adsterra';
import { getTaskSessionFromFirestore, completeTaskSessionInFirestore } from '../lib/firebase';
import { 
  ChevronLeft, 
  ChevronRight,
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
  Trash2,
  MessageCircle,
  Send,
  MessageSquare,
  Tag,
  Clock,
  Compass,
  Link,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

import { motion } from 'motion/react';

export const VideoPlayerPage: React.FC = () => {
  const { 
    activeVideo, 
    setActiveVideo, 
    setSelectedCategory,
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        // Ignore URL parsing errors
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

  const [resumed, setResumed] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // --- VELOURA QUEST MODE INTEGRATION ---
  // Read Quest params on initial load and lock into component state
  const [questParams] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tId = searchParams.get('taskId');
    const uId = searchParams.get('userId');
    const sId = searchParams.get('sessionId');
    const rawReturnUrl = searchParams.get('returnUrl');

    let validReturnUrl = '';
    if (rawReturnUrl) {
      try {
        const decoded = decodeURIComponent(rawReturnUrl);
        if (decoded.startsWith('https://veloura-quest.vercel.app')) {
          validReturnUrl = decoded;
        }
      } catch {
        // ignore malformed returnUrl
      }
    }

    const isQuest = Boolean(tId && uId && sId);
    const fallbackReturnUrl = isQuest
      ? `https://veloura-quest.vercel.app/complete?taskId=${encodeURIComponent(tId!)}&sessionId=${encodeURIComponent(sId!)}`
      : '';

    return {
      taskId: tId,
      userId: uId,
      sessionId: sId,
      isQuestMode: isQuest,
      returnUrl: validReturnUrl || fallbackReturnUrl
    };
  });

  const { taskId, userId, sessionId, isQuestMode, returnUrl } = questParams;

  const [questWatchProgress, setQuestWatchProgress] = useState<number>(0);
  const [isCompletionReached, setIsCompletionReached] = useState<boolean>(false);
  const [firestoreUpdateStatus, setFirestoreUpdateStatus] = useState<'idle' | 'completing' | 'success' | 'failed'>('idle');
  const [firestoreSessionChecked, setFirestoreSessionChecked] = useState(false);
  const [firestoreSessionValid, setFirestoreSessionValid] = useState<boolean | null>(null);

  // Initial check of Firestore session (runs in background, does NOT block Quest Mode)
  useEffect(() => {
    if (!isQuestMode || !taskId || !userId || !sessionId) return;

    let isMounted = true;
    getTaskSessionFromFirestore(sessionId, taskId, userId)
      .then((res) => {
        if (!isMounted) return;
        setFirestoreSessionChecked(true);
        if (res.status === 'valid' || res.session?.status === 'completed') {
          setFirestoreSessionValid(true);
          if (res.session?.status === 'completed') {
            setIsCompletionReached(true);
            setQuestWatchProgress(100);
            setFirestoreUpdateStatus('success');
          }
        } else {
          setFirestoreSessionValid(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[Veloura Quest Debug] Firestore initial check exception:', err);
        setFirestoreSessionChecked(true);
      });

    return () => {
      isMounted = false;
    };
  }, [isQuestMode, taskId, userId, sessionId]);

  // Consolidated Veloura Quest Debug Log
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || isQuestMode) {
      console.log(`[Veloura Quest Debug]
URL: ${window.location.href}
taskId: ${taskId || 'None'}
userId: ${userId || 'None'}
sessionId: ${sessionId || 'None'}
Quest Mode: ${isQuestMode}
Session Exists: ${firestoreSessionChecked ? (firestoreSessionValid ? 'Yes' : 'No') : 'Checking...'}
Session Status: ${firestoreSessionChecked ? (firestoreSessionValid ? 'Valid' : 'Unverified') : 'Pending'}
Session Valid: ${isQuestMode}
Video Completion: ${questWatchProgress}%
Firestore Update: ${firestoreUpdateStatus}
Return Button Visible: ${isCompletionReached}`);
    }
  }, [taskId, userId, sessionId, isQuestMode, firestoreSessionChecked, firestoreSessionValid, questWatchProgress, firestoreUpdateStatus, isCompletionReached]);

  // Track watch progress while video is playing in Quest Mode
  useEffect(() => {
    if (!isQuestMode || isCompletionReached) return;

    if (playerState === 'playing') {
      const interval = setInterval(() => {
        setQuestWatchProgress((prev) => {
          const next = prev + 10;
          if (next >= 80 && !isCompletionReached) {
            setIsCompletionReached(true);
            return 80;
          }
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isQuestMode, playerState, isCompletionReached]);

  // Trigger Firestore completion update when 80% completion threshold is reached
  useEffect(() => {
    if (isQuestMode && isCompletionReached && firestoreUpdateStatus === 'idle') {
      if (!sessionId) return;
      console.log('[Veloura Quest Debug] 80% watch threshold reached. Updating Firestore taskSessions for sessionId:', sessionId);
      setFirestoreUpdateStatus('completing');
      completeTaskSessionInFirestore(sessionId)
        .then((success) => {
          if (success) {
            setFirestoreUpdateStatus('success');
            console.log('[Veloura Quest Debug] Firestore task session marked completed.');
          } else {
            setFirestoreUpdateStatus('failed');
            console.warn('[Veloura Quest Debug] Firestore task session update failed; displaying fallback.');
          }
        })
        .catch((err) => {
          console.error('[Veloura Quest Debug] Firestore completion error:', err);
          setFirestoreUpdateStatus('failed');
        });
    }
  }, [isQuestMode, isCompletionReached, firestoreUpdateStatus, sessionId]);

  const handleReturnToQuest = () => {
    console.log('[Veloura Quest Debug] Redirecting to Quest return URL:', returnUrl);
    window.location.href = returnUrl;
  };


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
    
    // Auto detect aspect ratio based on orientation if provided
    if (activeVideo?.orientation === 'portrait') {
      setIframeAspect('9:16');
    } else {
      setIframeAspect('16:9');
    }

    // Trigger popunder ad strictly ONCE per session on first video play
    if (activeVideo) {
      triggerSessionPopunder();
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

  const getShareUrl = () => {
    if (!activeVideo) return '';
    return `${window.location.origin}/video/${encodeURIComponent(activeVideo.id)}`;
  };

  const handleShare = () => {
    if (!activeVideo) return;
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const downloadLink = activeVideo?.downloadUrl || activeVideo?.videoUrl;
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formattedDate = activeVideo.uploadDate 
    ? new Date(activeVideo.uploadDate).toLocaleDateString(undefined, { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Unknown Date';

  const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : (videos.length > 0 ? videos[videos.length - 1] : null);
  const nextVideo = currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1] : (videos.length > 0 ? videos[0] : null);

  const aiMeta = generateAiSeoMetadata(
    activeVideo.title,
    activeVideo.category,
    activeVideo.description,
    activeVideo.duration
  );

  return (
    <div className="w-full space-y-6">
      
      {/* Semantic Breadcrumb Navigation & Next/Prev Controls */}
      <nav aria-label="Breadcrumb & Sequential Navigation" className="flex flex-wrap items-center justify-between gap-3 bg-[#18181F]/60 border border-gold-500/10 px-4 py-2.5 rounded-2xl text-xs font-medium">
        <div className="flex items-center gap-2 flex-wrap text-zinc-400 font-mono text-[11px]">
          <button
            onClick={() => {
              setActiveVideo(null);
              setSelectedCategory('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-gold-400 transition cursor-pointer text-zinc-300 font-semibold"
          >
            Home
          </button>
          <span>/</span>
          <button
            onClick={() => {
              setActiveVideo(null);
              setSelectedCategory((activeVideo.category as Category) || 'All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-gold-400 transition cursor-pointer text-gold-400 font-bold"
          >
            {activeVideo.category}
          </button>
          <span>/</span>
          <span className="text-zinc-200 truncate max-w-[180px] sm:max-w-[300px]">
            {activeVideo.title}
          </span>
        </div>

        {/* Prev / Next Video Quick Controls */}
        <div className="flex items-center gap-2">
          {prevVideo && (
            <button
              onClick={() => playNextVideo(prevVideo)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/15 hover:border-gold-400/40 rounded-xl text-[11px] font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
              title={`Previous Video: ${prevVideo.title}`}
            >
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Prev</span>
            </button>
          )}
          {nextVideo && (
            <button
              onClick={() => playNextVideo(nextVideo)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/15 hover:border-gold-400/40 rounded-xl text-[11px] font-semibold text-gold-400 hover:text-gold-300 transition cursor-pointer"
              title={`Next Video: ${nextVideo.title}`}
            >
              <span className="hidden sm:inline">Next Video</span>
              <ChevronRight size={13} />
            </button>
          )}
          <button
            onClick={() => {
              setActiveVideo(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1 px-3 py-1 bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/15 hover:border-gold-400/40 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer shrink-0"
          >
            Catalog
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Cinema Player and Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* VELOURA QUEST MODE BANNER & STATUS NOTIFICATIONS */}
          {isQuestMode && (
            <div className="w-full">
              {isCompletionReached ? (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#18181F] to-emerald-950/90 border border-emerald-500/40 shadow-2xl space-y-4 text-center">
                  <div className="flex items-center justify-center gap-2.5 text-emerald-400 font-serif font-bold text-xl">
                    <CheckCircle2 size={26} className="text-emerald-400" />
                    <span>✓ Quest Completed</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-300 max-w-md mx-auto">
                    {firestoreUpdateStatus === 'failed'
                      ? 'Video completed. Please return to Veloura Quest.'
                      : 'Your video playback task session has been completed.'}
                  </p>
                  <div className="pt-2">
                    <a
                      href={returnUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        handleReturnToQuest();
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold font-mono text-xs uppercase tracking-widest rounded-xl transition duration-200 shadow-2xl shadow-emerald-500/30 active:scale-95 cursor-pointer border border-emerald-300/30"
                    >
                      <span>Return to Veloura Quest</span>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-between gap-3 text-xs font-mono text-gold-300 flex-wrap shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={18} className="text-gold-400 animate-pulse shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-white">Quest Mode</span>
                        <span className="px-2 py-0.5 rounded-md bg-gold-400/20 text-gold-300 text-[10px] font-bold">ACTIVE</span>
                      </div>
                      <span className="text-zinc-400 text-[11px] block mt-0.5">
                        Watch video to complete task session ({Math.min(100, Math.round((questWatchProgress / 80) * 100))}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsCompletionReached(true);
                        setQuestWatchProgress(100);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-gold-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Complete Quest Task</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
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
            {/* 1. IDLE STATE: Primary LCP Thumbnail Poster + Instant Click-to-Play Overlay */}
            {playerState === 'idle' && (
              <div 
                onClick={handleStartPlay}
                className="relative w-full h-full cursor-pointer group flex items-center justify-center overflow-hidden bg-black select-none"
                title="Click to play video"
              >
                <img
                  src={getProxiedThumbnailUrl(activeVideo.thumbnailUrl)}
                  alt={aiMeta.imageAltText || activeVideo.title}
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
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                {/* Luxury Play Button Center Widget */}
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold-400/20 backdrop-blur-md border border-gold-400/50 flex items-center justify-center text-gold-400 group-hover:bg-gold-400 group-hover:text-black transition-all duration-300 shadow-2xl shadow-gold-500/20 group-hover:scale-110">
                    <Play size={32} className="ml-1 fill-current" />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-gold-500/30 text-xs font-mono font-bold text-gold-400 uppercase tracking-widest shadow-xl group-hover:bg-gold-400 group-hover:text-black transition duration-300">
                    Click to Play Stream
                  </span>
                </div>

                {/* Duration Badge */}
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

            {/* 4. IFRAME OR VIDEO RENDER (MOUNTED ONLY WHEN playerState IS NOT 'idle') */}
            {playerState !== 'idle' && (
              (activeVideo.embedUrl || activeVideo.iframeUrl) ? (
                <iframe
                  key={`uqload-iframe-${activeVideo.id}-${iframeRetryKey}`}
                  src={activeVideo.embedUrl || activeVideo.iframeUrl}
                  onLoad={() => setPlayerState('playing')}
                  onError={() => setPlayerState('error')}
                  className="w-full h-full border-0 flex-1 rounded-[16px]"
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
                  className="w-full h-full object-contain flex-1 bg-black"
                />
              )
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
                title={activeVideo.downloadUrl ? "Open download link" : "Download video as MP4"}
                id="btn-download-video-page"
              >
                <Download size={14} className={downloading ? 'animate-bounce text-gold-400' : 'text-gold-400'} />
                <span>{downloading ? 'Downloading...' : activeVideo.downloadUrl ? 'Download Video' : 'Download MP4'}</span>
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
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                  showShareMenu
                    ? 'bg-gold-500 text-black border-gold-500 font-bold'
                    : 'bg-[#0B0B0F] hover:bg-zinc-800 border border-gold-500/5 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <Share2 size={14} />
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

                {/* Messenger / Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006AFF]/10 hover:bg-[#006AFF]/20 border border-[#006AFF]/20 rounded-lg text-xs font-semibold text-[#2563eb] transition"
                >
                  <MessageSquare size={13} />
                  <span>Facebook</span>
                </a>

                {/* X (Twitter) */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeVideo.title)}&url=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs font-semibold text-zinc-200 transition"
                >
                  <Share2 size={13} />
                  <span>X (Twitter)</span>
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

            {/* Description & Overview */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-mono font-bold uppercase text-gold-400 tracking-widest flex items-center justify-between">
                <span>Overview & Narrative</span>
                <span className="text-zinc-500 font-normal">Est. Watch: {activeVideo.duration}</span>
              </h4>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {activeVideo.description || 'This is a premium high-resolution video stream prepared exclusively for certified Veloura viewers. Sound design and lighting contrast optimized for professional dark theater rooms.'}
              </p>
            </div>

            {/* Video SEO Tags & Keywords */}
            <div className="space-y-2 pt-2 border-t border-zinc-900/80">
              <h5 className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Tag size={12} className="text-gold-400" />
                <span>Search Keywords & Tags</span>
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {aiMeta.tags.map((tag, idx) => (
                  <span 
                    key={`tag-${idx}`}
                    className="px-2.5 py-1 rounded-lg bg-[#0B0B0F] border border-gold-500/10 text-[10px] font-mono text-zinc-300 hover:border-gold-400/40 hover:text-gold-400 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ADSTERRA DIRECT LINK PROMO CARD & BANNER */}
            <AdBanner type="direct" className="mt-4" />
            <AdBanner type="banner" className="mt-4" />

          </div>

        </div>

        {/* Right Side: Showcase Metadata and Related Videos */}
        <div className="space-y-6">
          
          {/* Cover Art Box - satisfying "Show: Thumbnail" on dedicated page explicitly */}
          <div className="bg-[#18181F] border border-gold-500/10 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-gold-400 tracking-widest">
              Cinematic Poster
            </h3>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black">
              <img
                src={getProxiedThumbnailUrl(activeVideo.thumbnailUrl)}
                alt={aiMeta.imageAltText}
                loading="lazy"
                decoding="async"
                width="640"
                height="360"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getFallbackThumbnailUrl(activeVideo.title, activeVideo.category);
                }}
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
                      src={getProxiedThumbnailUrl(item.thumbnailUrl)}
                      alt={`${item.title} - ${item.category} video on Veloura`}
                      loading="lazy"
                      decoding="async"
                      width="320"
                      height="180"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackThumbnailUrl(item.title, item.category);
                      }}
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

          {/* Related Categories Internal Linking Widget */}
          <div className="bg-[#18181F] border border-gold-500/10 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-mono font-bold uppercase text-gold-400 tracking-widest flex items-center gap-1.5">
              <Compass size={13} className="text-gold-400" />
              Explore Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c !== 'Favorites').map(cat => (
                <button
                  key={`cat-link-${cat}`}
                  onClick={() => {
                    setActiveVideo(null);
                    setSelectedCategory(cat);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    cat === activeVideo.category
                      ? 'bg-gold-500/20 border-gold-400 text-gold-400 font-bold'
                      : 'bg-[#0B0B0F] hover:bg-zinc-800 border-gold-500/10 text-zinc-300 hover:text-white hover:border-gold-400/40'
                  }`}
                >
                  {cat} Videos
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
