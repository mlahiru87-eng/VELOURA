import React, { createContext, useContext, useState, useEffect } from 'react';
import { Video, Category } from '../types';
import { INITIAL_VIDEOS } from '../data/mockVideos';

interface VideoContextType {
  isAgeVerified: boolean;
  verifyAge: () => void;
  resetAgeVerification: () => void;
  
  videos: Video[];
  addVideo: (video: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadedAt'>) => void;
  updateVideo: (video: Video) => void;
  deleteVideo: (id: string) => void;
  incrementViews: (id: string) => void;
  toggleLike: (id: string, isLike: boolean) => void;
  
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  
  isAdminMode: boolean;
  setAdminMode: (admin: boolean) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    const saved = localStorage.getItem('isAgeVerified');
    return saved === 'true';
  });

  const [videos, setVideos] = useState<Video[]>(() => {
    const saved = localStorage.getItem('streaming_videos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved videos', e);
      }
    }
    return INITIAL_VIDEOS;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('veloura_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved favorites', e);
      }
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isAdminMode, setAdminMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isAdminMode');
    return saved === 'true';
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('streaming_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('veloura_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('isAgeVerified', String(isAgeVerified));
  }, [isAgeVerified]);

  useEffect(() => {
    localStorage.setItem('isAdminMode', String(isAdminMode));
  }, [isAdminMode]);

  const verifyAge = () => {
    setIsAgeVerified(true);
  };

  const resetAgeVerification = () => {
    setIsAgeVerified(false);
  };

  const addVideo = (newVideoData: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadedAt'>) => {
    const newVideo: Video = {
      ...newVideoData,
      id: `custom-${Date.now()}`,
      views: 0,
      likes: 0,
      dislikes: 0,
      uploadedAt: 'Just now'
    };
    setVideos(prev => [newVideo, ...prev]);
  };

  const updateVideo = (updated: Video) => {
    setVideos(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    // Clean up favorites if deleted
    setFavorites(prev => prev.filter(favId => favId !== id));
    if (activeVideo && activeVideo.id === id) {
      setActiveVideo(null);
    }
  };

  const incrementViews = (id: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, views: v.views + 1 };
      }
      return v;
    }));
  };

  const toggleLike = (id: string, isLike: boolean) => {
    setVideos(prev => prev.map(v => {
      if (v.id === id) {
        if (isLike) {
          return { ...v, likes: v.likes + 1 };
        } else {
          return { ...v, dislikes: v.dislikes + 1 };
        }
      }
      return v;
    }));
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(favId => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <VideoContext.Provider
      value={{
        isAgeVerified,
        verifyAge,
        resetAgeVerification,
        videos,
        addVideo,
        updateVideo,
        deleteVideo,
        incrementViews,
        toggleLike,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        activeVideo,
        setActiveVideo,
        isAdminMode,
        setAdminMode,
        favorites,
        toggleFavorite
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideos = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideos must be used within a VideoProvider');
  }
  return context;
};
