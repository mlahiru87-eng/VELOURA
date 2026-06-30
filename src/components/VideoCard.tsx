import React from 'react';
import { Video } from '../types';
import { useVideos } from '../context/VideoContext';
import { Play, Eye, Calendar, Heart, Trash2, Edit } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onEditClick?: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onEditClick }) => {
  const { setActiveVideo, incrementViews, isAdminMode, deleteVideo, favorites, toggleFavorite } = useVideos();

  const isFavorited = favorites.includes(video.id);

  const handlePlayClick = () => {
    incrementViews(video.id);
    setActiveVideo(video);
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K views`;
    }
    return `${count} views`;
  };

  return (
    <div className="group relative flex flex-col bg-[#18181F] border border-gold-500/5 rounded-2xl overflow-hidden shadow-xl hover:border-gold-500/20 hover:shadow-gold-500/[0.02] transition-all duration-300">
      
      {/* Thumbnail Trigger Area */}
      <div 
        onClick={handlePlayClick}
        className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
        />

        {/* Cinematic Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-black shadow-2xl shadow-gold-500/20 transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play size={22} fill="currentColor" className="ml-1 text-black" />
          </div>
        </div>

        {/* Luxury Category Chip */}
        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg bg-black/80 border border-gold-500/20 backdrop-blur-md text-[9px] font-mono font-bold uppercase text-gold-400 tracking-wider">
          {video.category}
        </span>

        {/* Duration counter */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-zinc-200 tracking-tighter">
          {video.duration}
        </span>
      </div>

      {/* Video text info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h4 
              onClick={handlePlayClick}
              className="text-sm font-semibold text-zinc-100 group-hover:text-gold-400 transition cursor-pointer line-clamp-2 leading-snug"
            >
              {video.title}
            </h4>
            
            {/* Direct Favorite Heart button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(video.id);
              }}
              className="p-1 hover:bg-[#0b0b0f] rounded-lg transition text-zinc-500 hover:text-gold-400 shrink-0 cursor-pointer"
              title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart 
                size={14} 
                fill={isFavorited ? '#D4AF37' : 'none'} 
                className={isFavorited ? 'text-gold-400' : ''} 
              />
            </button>
          </div>
          
          <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        </div>

        {/* Metadata bottom shelf */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-900/60 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Eye size={10} className="text-gold-400/40" />
            <span>{formatViews(video.views)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={10} className="text-gold-400/40" />
            <span>{video.uploadedAt}</span>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Handles */}
      {isAdminMode && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
          {onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(video);
              }}
              className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#0B0B0F] border border-gold-500/20 text-gold-400 transition shadow-lg cursor-pointer"
              title="Edit Video Record"
            >
              <Edit size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
                deleteVideo(video.id);
              }
            }}
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-red-950/80 border border-red-500/20 text-red-400 transition shadow-lg cursor-pointer"
            title="Delete Video"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
