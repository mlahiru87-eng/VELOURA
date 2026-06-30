import React, { useState, useEffect } from 'react';
import { useVideos } from '../context/VideoContext';
import { Video, Category, CATEGORIES } from '../types';
import { PlusCircle, Sliders, X, Check, FileVideo, Edit, Trash2, Image, Sparkles, Film, BarChart3, Users, Eye, PlaySquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  editVideoTarget: Video | null;
  onCloseEditTarget: () => void;
}

const PRESET_THUMBNAILS = [
  { name: 'Gilded Velvet', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
  { name: 'Symphonic Amber', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Techno Onyx', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cinematic Noir', url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80' },
  { name: 'Symphonic Hills', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80' },
  { name: 'Surreal Machina', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ editVideoTarget, onCloseEditTarget }) => {
  const { addVideo, updateVideo, isAdminMode, setAdminMode, videos } = useVideos();
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Cinematic');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
  const [duration, setDuration] = useState('14:48');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState('');

  // Dashboard Stats Calculations
  const totalArchives = videos.length;
  const totalViews = videos.reduce((acc, curr) => acc + curr.views, 0);
  const totalLikes = videos.reduce((acc, curr) => acc + curr.likes, 0);
  const featuredCount = videos.filter(v => v.isFeatured).length;

  // Format big numbers
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Handle setting targets when editing is requested
  useEffect(() => {
    if (editVideoTarget) {
      setTitle(editVideoTarget.title);
      setCategory(editVideoTarget.category as Category);
      setThumbnailUrl(editVideoTarget.thumbnailUrl);
      setVideoUrl(editVideoTarget.videoUrl);
      setDuration(editVideoTarget.duration);
      setDescription(editVideoTarget.description);
      setIsFeatured(!!editVideoTarget.isFeatured);
      setIsTrending(!!editVideoTarget.isTrending);
      setIsOpen(true); // Auto-open panel on edit request
    }
  }, [editVideoTarget]);

  if (!isAdminMode) return null;

  const handlePresetSelect = (url: string) => {
    setThumbnailUrl(url);
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Cinematic');
    setThumbnailUrl('');
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
    setDuration('05:00');
    setDescription('');
    setIsFeatured(false);
    setIsTrending(false);
    onCloseEditTarget();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !videoUrl) {
      alert('Please fill out all required fields (Title, Category, Video Stream URL).');
      return;
    }

    const finalThumbnail = thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

    if (editVideoTarget) {
      // Perform Update
      const updated: Video = {
        ...editVideoTarget,
        title,
        category,
        thumbnailUrl: finalThumbnail,
        videoUrl,
        duration,
        description,
        isFeatured,
        isTrending
      };
      updateVideo(updated);
      setSuccessMessage('Video record updated successfully!');
    } else {
      // Perform Add
      addVideo({
        title,
        category,
        thumbnailUrl: finalThumbnail,
        videoUrl,
        duration,
        description,
        isFeatured,
        isTrending
      });
      setSuccessMessage('New video uploaded successfully!');
    }

    resetForm();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mb-8">
      
      {/* Dynamic Statistics Dashboard Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        
        {/* Stat: Total Archives */}
        <div className="bg-[#18181F] border border-gold-500/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <PlaySquare size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Total Vault Archives</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{totalArchives}</span>
          </div>
        </div>

        {/* Stat: Total Views */}
        <div className="bg-[#18181F] border border-gold-500/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <Eye size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Cumulative Streams</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{formatCompact(totalViews)}</span>
          </div>
        </div>

        {/* Stat: Total Likes */}
        <div className="bg-[#18181F] border border-gold-500/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <BarChart3 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Positive Reactions</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{formatCompact(totalLikes)}</span>
          </div>
        </div>

        {/* Stat: Featured Count */}
        <div className="bg-[#18181F] border border-gold-500/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Featured Showcases</span>
            <span className="text-xl md:text-2xl font-serif font-bold text-white leading-tight">{featuredCount} / {totalArchives}</span>
          </div>
        </div>

      </div>

      {/* Quick Dashboard Action Header */}
      <div className="bg-zinc-950 border border-gold-500/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
              Veloura Control Console
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
            </h3>
            <p className="text-zinc-500 text-[11px] font-mono leading-none mt-1">
              PROVISIONING & CONTENT MANAGEMENT PIPELINE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isOpen && editVideoTarget) {
                resetForm();
              }
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black rounded-xl text-xs font-bold shadow-md shadow-gold-500/10 transition cursor-pointer"
          >
            {editVideoTarget ? <Edit size={14} /> : <PlusCircle size={14} />}
            <span>{editVideoTarget ? 'Editing Video File' : isOpen ? 'Hide Panel' : 'Add Custom Video'}</span>
          </button>
          
          <button
            onClick={() => setAdminMode(false)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-gold-500/10 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Exit Admin Session
          </button>
        </div>
      </div>

      {/* Expandable Form Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-[#18181F]/90 border border-gold-500/15 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-gold-500/10 mb-6">
                <h4 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Film size={14} className="text-gold-400" />
                  {editVideoTarget ? 'Modify Decryption Database Item' : 'Register New Private Stream'}
                </h4>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="p-1 text-zinc-500 hover:text-white rounded"
                >
                  <X size={16} />
                </button>
              </div>

              {successMessage && (
                <div className="mb-6 p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <Check size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                      Video Title <span className="text-gold-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sintel Open Cinematic Special"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                    />
                  </div>

                  {/* Category & Duration Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                        Category <span className="text-gold-400">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
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
                        placeholder="e.g. 14:48"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
                      />
                    </div>
                  </div>

                  {/* Stream URL */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                      Stream Video URL <span className="text-gold-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. https://commondatastorage.googleapis.com/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50 font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Direct raw MP4 files play natively.
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      placeholder="Add an enticing summary description..."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50 resize-none"
                    />
                  </div>
                </div>

                {/* Right Side Fields */}
                <div className="space-y-4">
                  {/* Thumbnail URL Input */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-1.5">
                      Cover Thumbnail URL
                    </label>
                    <input
                      type="url"
                      placeholder="Paste cover URL, or choose a preset below..."
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-gold-500/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400/50 font-mono"
                    />
                  </div>

                  {/* Preset thumbnails selector */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-zinc-600 tracking-wider mb-2 flex items-center gap-1">
                      <Image size={11} />
                      Or Choose Curated Preset
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_THUMBNAILS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handlePresetSelect(preset.url)}
                          className={`group relative aspect-video rounded-lg overflow-hidden border transition cursor-pointer ${
                            thumbnailUrl === preset.url 
                              ? 'border-gold-400 ring-1 ring-gold-400/50' 
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 px-1 text-center">
                            <span className="text-[8px] font-mono font-bold text-zinc-300 truncate block">
                              {preset.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flag Toggles (Featured & Trending) */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider mb-2">
                      Portal Visibility Flags
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Featured */}
                      <label className="flex items-center gap-3 p-3.5 bg-[#0B0B0F] border border-gold-500/10 hover:border-gold-500/20 rounded-xl cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="w-4 h-4 rounded text-gold-400 focus:ring-gold-400/30 bg-zinc-950 border-gold-500/20"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-100">Featured Hero</div>
                          <div className="text-[9px] font-mono text-zinc-500 leading-none mt-0.5">
                            Display at top banner
                          </div>
                        </div>
                      </label>

                      {/* Trending */}
                      <label className="flex items-center gap-3 p-3.5 bg-[#0B0B0F] border border-gold-500/10 hover:border-gold-500/20 rounded-xl cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={isTrending}
                          onChange={(e) => setIsTrending(e.target.checked)}
                          className="w-4 h-4 rounded text-gold-400 focus:ring-gold-400/30 bg-zinc-950 border-gold-500/20"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-100">Trending Feed</div>
                          <div className="text-[9px] font-mono text-zinc-500 leading-none mt-0.5">
                            Place in hot queue
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit actions */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-bold rounded-xl text-xs shadow-lg shadow-gold-500/10 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                    >
                      {editVideoTarget ? 'Update Video Record' : 'Register Custom Stream'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-5 py-3 bg-[#0B0B0F] border border-gold-500/10 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Reset Fields
                    </button>
                  </div>

                </div>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
