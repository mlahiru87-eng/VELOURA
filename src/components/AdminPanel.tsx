import React, { useState, useEffect } from 'react';
import { useVideos } from '../context/VideoContext';
import { Video, Category, CATEGORIES } from '../types';
import { 
  PlusCircle, 
  Sliders, 
  X, 
  Check, 
  FileVideo, 
  Edit, 
  Trash2, 
  Image, 
  Sparkles, 
  Film, 
  Eye, 
  PlaySquare, 
  EyeOff, 
  Star, 
  ShieldAlert, 
  Clock,
  Search,
  Filter,
  Loader2,
  HardDrive,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Premium fallback placeholder thumbnails by category
export const PREMIUM_CATEGORY_THUMBNAILS: Record<string, string> = {
  'Sri Lankan': 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
  'Indian': 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80',
  'Romantic': 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
  'Movies': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  'Series': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80',
  'Short Videos': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
  'VIP': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
  '18+': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'Trending': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  'Premium': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
};

// Extractor helper to extract the exact Google Drive file ID from links or strings
export const extractGoogleDriveFileId = (linkOrId: string): string | null => {
  if (!linkOrId) return null;
  const trimmed = linkOrId.trim();
  
  // Direct ID check: 15-50 characters, alphanumeric, dashes, underscores
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Standard Google Drive Link Formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{25,50})/,
    /[?&]id=([a-zA-Z0-9_-]{25,50})/,
    /\/d\/([a-zA-Z0-9_-]{25,50})/,
    /\/open\?id=([a-zA-Z0-9_-]{25,50})/,
    /\/uc\?id=([a-zA-Z0-9_-]{25,50})/
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

interface AdminPanelProps {
  editVideoTarget: Video | null;
  onCloseEditTarget: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ editVideoTarget, onCloseEditTarget }) => {
  const { addVideo, updateVideo, deleteVideo, deleteAllVideos, triggerManualSeed, isAdminMode, setAdminMode, videos } = useVideos();
  const [isOpen, setIsOpen] = useState(false);
  const [localEditTarget, setLocalEditTarget] = useState<Video | null>(null);

  // Form States
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [driveFileId, setDriveFileId] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Movies');
  const [duration, setDuration] = useState('00:00');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [premium, setPremium] = useState(false);
  const [active, setActive] = useState(true);
  
  const [successMessage, setSuccessMessage] = useState('');
  const [formErrors, setFormErrors] = useState<{title?: string; category?: string; driveLink?: string}>({});
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Search & Filter state for catalog table
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<Category>('All');

  // Confirmation States for Deletion to avoid iframe-blocked native dialogs
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const [dbFeedback, setDbFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtered list of videos for the table
  const filteredAdminVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      video.category.toLowerCase().includes(adminSearchQuery.toLowerCase());
      
    const matchesCategory =
      adminCategoryFilter === 'All' ||
      (adminCategoryFilter === 'Favorites' ? false : video.category === adminCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  // Dashboard Stats Calculations
  const totalVideosCount = videos.length;
  const totalViewsCount = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikesCount = videos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const totalFavoritesCount = videos.reduce((acc, v) => acc + (v.favorites || 0), 0);
  const premiumVideosCount = videos.filter(v => v.premium).length;

  // Format numbers to look clean and neat
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Google Drive link processing & duplicate detection
  const handleDriveLinkChange = (val: string) => {
    setGoogleDriveLink(val);
    setImageError(false);
    
    if (!val.trim()) {
      setDriveFileId('');
      setIframeUrl('');
      setExtractionError(null);
      return;
    }
    
    const fileId = extractGoogleDriveFileId(val);
    if (!fileId) {
      setExtractionError('Invalid link. Please paste a valid Google Drive share link.');
      setDriveFileId('');
      setIframeUrl('');
      return;
    }
    
    // Detect duplicate videos (checks if driveFileId already exists)
    const isDuplicate = videos.some(v => v.driveFileId === fileId && v.id !== localEditTarget?.id);
    if (isDuplicate) {
      setExtractionError('Duplicate Detected: A video with this Google Drive File ID is already published on Veloura.');
      setDriveFileId('');
      setIframeUrl('');
      return;
    }
    
    setExtractionError(null);
    setDriveFileId(fileId);
    setIframeUrl(`https://drive.google.com/file/d/${fileId}/preview`);
    
    // Automatic Title Pre-fill
    if (!title || title.startsWith('Veloura ') || title === 'Google Drive Video Release') {
      setTitle(`Veloura ${category} Masterpiece`);
    }
    
    // Automatic Description Pre-fill
    if (!description) {
      setDescription(`An exclusive high-fidelity ${category.toLowerCase()} presentation prepared specifically for certified Veloura viewers. Visual aesthetics and contrast optimized for professional dark theater environments.`);
    }

    if (duration === '00:00' || !duration) {
      setDuration('12:45'); // Beautiful default cinematic duration
    }
  };

  // Update fields when Category is changed (auto-generated titles if untouched)
  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    if (!title || title.startsWith('Veloura ') || title === 'Google Drive Video Release') {
      setTitle(`Veloura ${newCat} Masterpiece`);
    }
    if (!description || description.includes('presentation prepared specifically')) {
      setDescription(`An exclusive high-fidelity ${newCat.toLowerCase()} presentation prepared specifically for certified Veloura viewers. Visual aesthetics and contrast optimized for professional dark theater environments.`);
    }
  };

  // Handle setting targets when editing is requested
  useEffect(() => {
    if (editVideoTarget) {
      setLocalEditTarget(editVideoTarget);
      setGoogleDriveLink(editVideoTarget.driveFileId ? `https://drive.google.com/file/d/${editVideoTarget.driveFileId}/view` : editVideoTarget.videoUrl || '');
      setDriveFileId(editVideoTarget.driveFileId || '');
      setIframeUrl(editVideoTarget.iframeUrl || '');
      setTitle(editVideoTarget.title);
      setCategory(editVideoTarget.category as Category);
      setDuration(editVideoTarget.duration);
      setDescription(editVideoTarget.description);
      setFeatured(!!editVideoTarget.featured);
      setPremium(!!editVideoTarget.premium);
      setActive(editVideoTarget.active !== false);
      setImageError(false);
      setFormErrors({});
      setExtractionError(null);
      setIsOpen(true); // Auto-open panel on edit request
    }
  }, [editVideoTarget]);

  if (!isAdminMode) return null;

  const resetForm = () => {
    setGoogleDriveLink('');
    setDriveFileId('');
    setIframeUrl('');
    setTitle('');
    setCategory('Movies');
    setDuration('00:00');
    setDescription('');
    setFeatured(false);
    setPremium(false);
    setActive(true);
    setImageError(false);
    setFormErrors({});
    setExtractionError(null);
    setLocalEditTarget(null);
    onCloseEditTarget();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: {title?: string; category?: string; driveLink?: string} = {};
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    if (!category) {
      errors.category = 'Category is required';
    }
    if (!driveFileId) {
      errors.driveLink = 'A valid Google Drive File ID is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsPublishing(true);

    try {
      // Auto Thumbnail selection
      // If the Google Drive thumbnail succeeds, it's used; otherwise fallback category placeholder is rendered
      const activeThumbnail = !imageError && driveFileId
        ? `https://drive.google.com/thumbnail?sz=w800&id=${driveFileId}`
        : (PREMIUM_CATEGORY_THUMBNAILS[category] || PREMIUM_CATEGORY_THUMBNAILS['Premium']);

      if (localEditTarget) {
        const updated: Video = {
          ...localEditTarget,
          title,
          category,
          thumbnailUrl: activeThumbnail,
          videoUrl: `https://drive.google.com/file/d/${driveFileId}/preview`,
          driveFileId,
          iframeUrl,
          duration,
          description,
          featured,
          premium,
          active,
        };
        await updateVideo(updated);
        setSuccessMessage('Video details updated successfully!');
      } else {
        await addVideo({
          title,
          category,
          thumbnailUrl: activeThumbnail,
          videoUrl: `https://drive.google.com/file/d/${driveFileId}/preview`,
          driveFileId,
          iframeUrl,
          duration,
          description,
          featured,
          premium,
          active,
        });
        setSuccessMessage('One-Click Video Published Successfully!');
      }

      setTimeout(() => {
        setSuccessMessage('');
        setIsPublishing(false);
        resetForm();
        setIsOpen(false);
      }, 1500);

    } catch (err: any) {
      console.error('Publishing failed:', err);
      setExtractionError(err.message || 'Failed to save video record');
      setIsPublishing(false);
    }
  };

  // --- QUICK CONTROLS ---
  const handleToggleActive = async (video: Video) => {
    try {
      await updateVideo({ ...video, active: !video.active });
    } catch (err) {
      console.error('Failed to toggle active state', err);
    }
  };

  const handleToggleFeatured = async (video: Video) => {
    try {
      await updateVideo({ ...video, featured: !video.featured });
    } catch (err) {
      console.error('Failed to toggle featured state', err);
    }
  };

  const handleTogglePremium = async (video: Video) => {
    try {
      await updateVideo({ ...video, premium: !video.premium });
    } catch (err) {
      console.error('Failed to toggle premium state', err);
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    try {
      await deleteVideo(video.id);
    } catch (err) {
      console.error('Failed to delete video', err);
    }
  };

  // Currently resolved dynamic thumbnail preview
  const resolvedPreviewThumbnail = (!imageError && driveFileId)
    ? `https://drive.google.com/thumbnail?sz=w800&id=${driveFileId}`
    : (PREMIUM_CATEGORY_THUMBNAILS[category] || PREMIUM_CATEGORY_THUMBNAILS['Premium']);

  return (
    <div id="admin-dashboard-container" className="w-full max-w-7xl mx-auto px-4 mb-12">
      
      {/* Dynamic Statistics Dashboard Row */}
      <div id="stats-grid-row" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        {/* Stat 1: Total Videos */}
        <div id="stat-total-videos" className="bg-[#18181F]/90 border border-gold-500/10 rounded-2xl p-4 flex items-center gap-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition duration-300">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <PlaySquare size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Total Library</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{totalVideosCount}</span>
          </div>
        </div>

        {/* Stat 2: Total Views */}
        <div id="stat-total-views" className="bg-[#18181F]/90 border border-gold-500/10 rounded-2xl p-4 flex items-center gap-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition duration-300">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <Eye size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Total Views</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{formatCompact(totalViewsCount)}</span>
          </div>
        </div>

        {/* Stat 3: Premium Vault */}
        <div id="stat-total-favorites" className="bg-[#18181F]/90 border border-gold-500/10 rounded-2xl p-4 flex items-center gap-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition duration-300">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <Star size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Premium Gates</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-gold-400 leading-tight">{premiumVideosCount}</span>
          </div>
        </div>

        {/* Stat 4: Total Engagements */}
        <div id="stat-total-likes" className="bg-[#18181F]/90 border border-gold-500/10 rounded-2xl p-4 flex items-center gap-4 shadow-md relative overflow-hidden group hover:border-gold-500/30 transition duration-300">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Likes & Faves</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{formatCompact(totalLikesCount + totalFavoritesCount)}</span>
          </div>
        </div>

      </div>

      {/* Quick Dashboard Action Header */}
      <div id="dashboard-action-panel" className="bg-zinc-950 border border-gold-500/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl mb-6 relative">
        <div className="absolute inset-0 bg-noise opacity-5" />
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 font-serif tracking-wide">
              Veloura Video Publisher Console
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            </h3>
            <p className="text-zinc-500 text-[10px] font-mono leading-none mt-1 uppercase tracking-wider">
              One-Click Google Drive Publisher System Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            id="toggle-add-panel-btn"
            onClick={() => {
              if (isOpen && editVideoTarget) {
                resetForm();
              }
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black rounded-xl text-xs font-bold shadow-md shadow-gold-500/10 transition cursor-pointer"
          >
            {editVideoTarget ? <Edit size={14} /> : <PlusCircle size={14} />}
            <span>{editVideoTarget ? 'Editing Video File' : isOpen ? 'Hide Panel' : 'Publish Google Drive Video'}</span>
          </button>
          
          <button
            id="exit-admin-btn"
            onClick={() => setAdminMode(false)}
            className="px-4 py-2.5 bg-[#18181F] hover:bg-[#20202a] border border-gold-500/10 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Logout Dashboard
          </button>
        </div>
      </div>

      {/* Expandable Form Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="form-expandable-box"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#18181F]/90 border border-gold-500/15 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
              
              <div className="flex justify-between items-center pb-4 border-b border-gold-500/10 mb-6">
                <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Film size={14} className="text-gold-400" />
                  {editVideoTarget ? 'Modify Veloura Video Document' : 'One-Click Google Drive Publisher'}
                </h4>
                <button
                  id="close-form-btn"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="p-1 text-zinc-500 hover:text-white rounded transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {successMessage && (
                <div id="form-success-box" className="mb-6 p-3.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side fields */}
                <div className="space-y-4">
                  
                  {/* Google Drive Link paste area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                        Google Drive Share Link <span className="text-gold-400">*</span>
                      </label>
                      {formErrors.driveLink && (
                        <span className="text-[10px] font-mono text-red-400 font-semibold">{formErrors.driveLink}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Paste share link here (e.g., https://drive.google.com/file/d/...)"
                      value={googleDriveLink}
                      onChange={(e) => handleDriveLinkChange(e.target.value)}
                      className={`w-full bg-[#0B0B0F] border rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50 font-mono ${
                        formErrors.driveLink || extractionError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gold-500/10'
                      }`}
                    />
                    
                    {extractionError && (
                      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2">
                        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-red-400 font-mono leading-normal">{extractionError}</span>
                      </div>
                    )}
                    
                    {driveFileId && (
                      <div className="p-3 bg-zinc-950/60 border border-gold-500/10 rounded-xl space-y-1 text-[10px] font-mono text-zinc-400">
                        <div className="flex items-center justify-between text-zinc-500 text-[9px] uppercase tracking-wider pb-1 border-b border-zinc-900">
                          <span>Extracted Drive Metadata</span>
                          <span className="text-gold-400 font-bold">✓ Link Validated</span>
                        </div>
                        <div>File ID: <span className="text-zinc-200">{driveFileId}</span></div>
                        <div className="truncate">Preview: <span className="text-zinc-400 text-[9px]">{iframeUrl}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                        Video Title <span className="text-gold-400">*</span>
                      </label>
                      {formErrors.title && (
                        <span className="text-[10px] font-mono text-red-400 font-semibold">{formErrors.title}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Pre-fills automatically, customize as needed..."
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (formErrors.title) {
                          setFormErrors(prev => ({ ...prev, title: undefined }));
                        }
                      }}
                      className={`w-full bg-[#0B0B0F] border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50 ${
                        formErrors.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-gold-500/10'
                      }`}
                    />
                  </div>

                  {/* Category & Duration Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                          Category <span className="text-gold-400">*</span>
                        </label>
                      </div>
                      <select
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value as Category)}
                        className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                      >
                        {CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                        Duration (MM:SS)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15:00"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                      Description Summary
                    </label>
                    <textarea
                      placeholder="Add brief details or a cinematic synopsis..."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50 resize-none"
                    />
                  </div>
                </div>

                {/* Right Side Fields */}
                <div className="space-y-4">
                  
                  {/* Thumbnail Selection Preview */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                      Auto-Generated Thumbnail Preview
                    </label>

                    <div className="p-4 bg-[#09090D] border border-gold-500/10 rounded-xl space-y-3">
                      <div className="aspect-video relative rounded-lg overflow-hidden border border-zinc-800 bg-black">
                        <img
                          src={resolvedPreviewThumbnail}
                          alt="Video Cover Poster"
                          onError={() => {
                            // If the Google Drive thumbnail fails to load (CORS, file restrictions), we set imageError to fallback to category preset
                            setImageError(true);
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-gold-400 text-black px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-sans shadow">
                          {!imageError && driveFileId ? 'Drive Capture' : 'Category Preset Cover'}
                        </div>
                      </div>
                      
                      <p className="text-[10px] font-mono text-zinc-400 leading-normal">
                        {!imageError && driveFileId 
                          ? "✓ Auto-rendering standard 800px preview capture from your shared Google Drive file." 
                          : "✦ Displaying a premium default placeholder thumbnail customized for the selected category."}
                      </p>
                    </div>
                  </div>

                  {/* Flag Toggles (Featured, Premium, Active) */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-2">
                      Portal Badges & Visibility Flags
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      
                      {/* Featured Toggle */}
                      <label className="flex items-center gap-2 p-2.5 bg-[#0B0B0F] border border-gold-500/10 hover:border-gold-500/20 rounded-xl cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={featured}
                          onChange={(e) => setFeatured(e.target.checked)}
                          className="w-4 h-4 rounded text-gold-400 focus:ring-gold-400/30 bg-zinc-950 border-gold-500/20 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-100">Featured</div>
                          <div className="text-[8px] font-mono text-zinc-500 leading-none mt-0.5">
                            Hero display
                          </div>
                        </div>
                      </label>

                      {/* Premium Toggle */}
                      <label className="flex items-center gap-2 p-2.5 bg-[#0B0B0F] border border-gold-500/10 hover:border-gold-500/20 rounded-xl cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={premium}
                          onChange={(e) => setPremium(e.target.checked)}
                          className="w-4 h-4 rounded text-gold-400 focus:ring-gold-400/30 bg-zinc-950 border-gold-500/20 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-100">Premium</div>
                          <div className="text-[8px] font-mono text-zinc-500 leading-none mt-0.5">
                            Gated badge
                          </div>
                        </div>
                      </label>

                      {/* Active Toggle */}
                      <label className="flex items-center gap-2 p-2.5 bg-[#0B0B0F] border border-gold-500/10 hover:border-gold-500/20 rounded-xl cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => setActive(e.target.checked)}
                          className="w-4 h-4 rounded text-gold-400 focus:ring-gold-400/30 bg-zinc-950 border-gold-500/20 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-100">Active</div>
                          <div className="text-[8px] font-mono text-zinc-500 leading-none mt-0.5">
                            Show in list
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit actions */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={isPublishing || !driveFileId}
                      className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-black font-bold rounded-xl text-xs shadow-lg shadow-gold-500/10 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                    >
                      {isPublishing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          Publishing to Veloura...
                        </span>
                      ) : editVideoTarget ? (
                        'Update Google Drive Video'
                      ) : (
                        'Publish Google Drive Video'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-5 py-3 bg-[#0B0B0F] border border-gold-500/10 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel / Reset
                    </button>
                  </div>

                </div>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- REAL-TIME VIDEO MANAGEMENT LIST --- */}
      <div id="video-catalog-management" className="bg-[#18181F]/90 border border-gold-500/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-10 h-[1px] bg-gradient-to-r from-transparent via-gold-400/25 to-transparent" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gold-500/10 gap-3">
          <div>
            <h4 className="text-sm font-serif font-bold text-white tracking-wide">
              Veloura Live Catalog Database
            </h4>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">
              Edit, delete, and toggle featured or premium gates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded bg-[#0B0B0F] border border-gold-500/10 text-gold-400">
              {videos.length} Published Videos
            </span>
            {videos.length > 0 ? (
              !isConfirmingDeleteAll ? (
                <button
                  onClick={() => {
                    setIsConfirmingDeleteAll(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-lg text-xs font-semibold cursor-pointer transition"
                  title="Delete All Videos"
                >
                  <Trash2 size={12} />
                  <span>මුළු වීඩියෝ සියල්ලම ඉවත් කරන්න (Delete All)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#1C1C24] p-1.5 rounded-lg border border-red-500/20">
                  <span className="text-[10px] font-mono text-red-400 px-1 font-semibold">Are you absolutely sure?</span>
                  <button
                    onClick={async () => {
                      try {
                        await deleteAllVideos();
                        setIsConfirmingDeleteAll(false);
                        setDbFeedback({ type: 'success', message: 'All videos successfully removed from database.' });
                        setTimeout(() => setDbFeedback(null), 4500);
                      } catch (err: any) {
                        setDbFeedback({ type: 'error', message: `Failed to delete: ${err.message || err}` });
                        setTimeout(() => setDbFeedback(null), 4500);
                      }
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition animate-pulse"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setIsConfirmingDeleteAll(false)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer transition"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={async () => {
                  try {
                    await triggerManualSeed();
                    setDbFeedback({ type: 'success', message: 'Sample videos successfully re-seeded.' });
                    setTimeout(() => setDbFeedback(null), 4500);
                  } catch (err: any) {
                    setDbFeedback({ type: 'error', message: `Failed to seed: ${err.message || err}` });
                    setTimeout(() => setDbFeedback(null), 4500);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B0B0F] hover:bg-zinc-900 border border-gold-500/20 text-gold-400 hover:text-gold-300 rounded-lg text-xs font-semibold cursor-pointer transition"
                title="Load Demo Videos"
              >
                <Sparkles size={12} />
                <span>ආදර්ශ වීඩියෝ ඇතුළත් කරන්න (Load Sample Videos)</span>
              </button>
            )}
            
            {dbFeedback && (
              <span className={`text-[10px] font-mono px-3 py-1.5 rounded border transition-all duration-300 ${
                dbFeedback.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-950/40 border-red-500/30 text-red-400'
              }`}>
                {dbFeedback.message}
              </span>
            )}
          </div>
        </div>

        {/* Search and Category Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 py-4 border-b border-zinc-800/80">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Search videos by title, description or category..."
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Filter size={11} />
              Category:
            </span>
            <select
              value={adminCategoryFilter}
              onChange={(e) => setAdminCategoryFilter(e.target.value as Category)}
              className="bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter(c => c !== 'Favorites').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldAlert size={36} className="text-gold-400/40 mx-auto mb-3" />
            <span className="text-sm text-zinc-400 block font-serif">No videos found inside Firestore.</span>
            <span className="text-[10px] text-zinc-600 font-mono mt-1 block">Seed data or publish your first Google Drive video.</span>
          </div>
        ) : filteredAdminVideos.length === 0 ? (
          <div className="py-12 text-center">
            <Search size={36} className="text-zinc-600 mx-auto mb-3" />
            <span className="text-sm text-zinc-400 block font-serif">No matching videos found.</span>
            <span className="text-[10px] text-zinc-600 font-mono mt-1 block">Try adjusting your search query or category filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gold-500/10">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4 font-semibold">Video Details</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Streams / Likes</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Active</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Featured</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Premium</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Database Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredAdminVideos.map((video) => {
                  const hasDuplicate = videos.filter(v => v.driveFileId === video.driveFileId).length > 1;
                  return (
                    <tr key={video.id} className="hover:bg-[#1f1f28]/30 transition group">
                      {/* Details Column */}
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-16 aspect-video rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-[#0B0B0F] relative">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                          <span className="font-serif font-bold text-zinc-100 hover:text-gold-400 transition truncate block flex items-center gap-2">
                            {video.title}
                            {hasDuplicate && (
                              <span className="px-1.5 py-0.5 bg-red-950/40 text-red-400 border border-red-500/30 text-[8px] rounded uppercase font-mono tracking-wider font-bold">
                                DUPLICATE
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-400">
                              {video.category}
                            </span>
                            <span className="flex items-center gap-0.5 text-[9px] font-mono text-zinc-500">
                              <Clock size={10} />
                              {video.duration || '12:45'}
                            </span>
                            {video.driveFileId && (
                              <span className="text-[8px] font-mono text-gold-400/70 truncate max-w-[120px]" title={video.driveFileId}>
                                ID: {video.driveFileId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stats Column */}
                      <td className="py-4 px-3 text-center">
                        <div className="font-mono text-[10px] text-zinc-200">
                          {formatCompact(video.views)} streams
                        </div>
                        <div className="font-mono text-[9px] text-zinc-500 mt-0.5">
                          +{video.likes} likes
                        </div>
                      </td>

                      {/* Active State Toggle */}
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(video)}
                          className={`inline-flex items-center justify-center w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                            video.active ? 'bg-gold-500' : 'bg-zinc-800'
                          }`}
                          title={video.active ? "Unpublish Video" : "Publish Video"}
                        >
                          <span
                            className={`w-4 h-4 bg-[#0B0B0F] rounded-full transition-transform duration-200 ${
                              video.active ? 'translate-x-3' : '-translate-x-3'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Featured State Toggle */}
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(video)}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border cursor-pointer transition ${
                            video.featured 
                              ? 'bg-gold-400/10 border-gold-400/30 text-gold-400' 
                              : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
                          }`}
                          title="Toggle Featured"
                        >
                          <Sparkles size={14} fill={video.featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>

                      {/* Premium State Toggle */}
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => handleTogglePremium(video)}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border cursor-pointer transition ${
                            video.premium 
                              ? 'bg-amber-400/10 border-amber-500/30 text-amber-500' 
                              : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
                          }`}
                          title="Toggle Premium Gate"
                        >
                          <Star size={14} fill={video.premium ? 'currentColor' : 'none'} />
                        </button>
                      </td>

                      {/* Edit/Delete Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              setLocalEditTarget(video);
                              setGoogleDriveLink(video.driveFileId ? `https://drive.google.com/file/d/${video.driveFileId}/view` : video.videoUrl || '');
                              setDriveFileId(video.driveFileId || '');
                              setIframeUrl(video.iframeUrl || '');
                              setTitle(video.title);
                              setCategory(video.category as Category);
                              setDuration(video.duration);
                              setDescription(video.description);
                              setFeatured(!!video.featured);
                              setPremium(!!video.premium);
                              setActive(video.active !== false);
                              setFormErrors({});
                              setIsOpen(true);
                              // Scroll smoothly to input form
                              document.getElementById('form-expandable-box')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-gold-500/20 hover:bg-zinc-850 hover:text-gold-400 text-zinc-400 rounded-xl transition cursor-pointer"
                            title="Edit Document"
                          >
                            <Edit size={13} />
                          </button>
                          {deletingVideoId === video.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  await handleDeleteVideo(video);
                                  setDeletingVideoId(null);
                                }}
                                className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-bold cursor-pointer transition animate-pulse"
                                title="Confirm Permanent Delete"
                              >
                                <span>Confirm</span>
                              </button>
                              <button
                                onClick={() => setDeletingVideoId(null)}
                                className="px-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg text-[9px] font-semibold cursor-pointer transition"
                              >
                                <span>Cancel</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingVideoId(video.id)}
                              className="p-2 bg-zinc-900 border border-zinc-800 hover:border-red-500/20 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 rounded-xl transition cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
