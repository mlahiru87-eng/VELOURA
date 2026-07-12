import React, { createContext, useContext, useState, useEffect } from 'react';
import { Video, Category } from '../types';
import { 
  seedInitialVideos, 
  fetchActiveVideosFromFirestore, 
  fetchAllVideosFromFirestore,
  createVideoInFirestore, 
  updateVideoInFirestore, 
  deleteVideoFromFirestore, 
  incrementVideoViews, 
  registerReactionInFirestore,
  auth,
  registerAdminInFirestore,
  getAdminFromFirestore
} from '../lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

interface VideoContextType {
  isAgeVerified: boolean;
  verifyAge: () => void;
  resetAgeVerification: () => void;
  
  videos: Video[];
  loading: boolean;
  error: string | null;
  refetchVideos: () => Promise<void>;
  
  addVideo: (video: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadDate'>) => Promise<void>;
  updateVideo: (video: Video) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  deleteAllVideos: () => Promise<void>;
  triggerManualSeed: () => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  toggleLike: (id: string, isLike: boolean) => Promise<void>;
  
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  
  isAdminMode: boolean;
  setAdminMode: (admin: boolean) => void;

  editTarget: Video | null;
  setEditTarget: (video: Video | null) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;

  // Real Auth States
  currentUser: User | null;
  userRole: 'admin' | 'user' | null;
  logoutUser: () => Promise<void>;

  // Admin secure flow states
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  accessDeniedMessage: string | null;
  setAccessDeniedMessage: (msg: string | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    const saved = localStorage.getItem('isAgeVerified');
    return saved === 'true';
  });

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
  
  // Real Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [isAdminMode, setAdminMode] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<Video | null>(null);

  // Secure flow state triggers
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Monitor Auth Changes and Sync Roles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Read the secure "admins" collection
        let adminData = await getAdminFromFirestore(user.uid);
        
        if (!adminData) {
          // Auto-bootstrap admin user record in the "admins" collection if email matches authorized admin domains/lists
          const isAdminEmail = 
            user.email === 'mlahiru87@gmail.com' || 
            user.email === 'admin@veloura.tv' ||
            (user.email && (user.email.endsWith('@veloura.tv') || user.email.includes('admin')));
          
          if (isAdminEmail) {
            const name = user.displayName || user.email?.split('@')[0] || 'Master Admin';
            // Each admin document ID must be the Firebase Authentication UID.
            // Contains: email, fullName, role ("admin"), active (true), createdAt (serverTimestamp)
            await registerAdminInFirestore(user.uid, user.email || '', name, 'admin', true);
            adminData = {
              email: user.email || '',
              fullName: name,
              role: 'admin',
              active: true
            };
          }
        }

        // Check if the user's UID exists, is active=true, and has role="admin"
        if (adminData && adminData.role === 'admin' && adminData.active === true) {
          setUserRole('admin');
          setAdminMode(true);
          setAccessDeniedMessage(null);
        } else {
          // Access Denied: Prevent Admin access, redirect, show error, and sign out
          setUserRole(null);
          setAdminMode(false);
          setAccessDeniedMessage('Access Denied. Your account does not have active administrative privileges on Veloura.');
          setSelectedCategory('All');
          setActiveVideo(null);
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setAdminMode(false);
      }
    });

    return () => unsubscribe();
  }, []);


  // Seed and fetch videos from Firestore
  const refetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdminMode) {
        await seedInitialVideos();
      }
      // Admins load ALL videos (including inactive ones); normal users load ACTIVE only
      const fetched = isAdminMode 
        ? await fetchAllVideosFromFirestore()
        : await fetchActiveVideosFromFirestore();
      setVideos(fetched);
    } catch (err: any) {
      console.error('Error fetching videos from Firestore:', err);
      setError(err.message || 'Failed to sync with Veloura Firestore database');
    } finally {
      setLoading(false);
    }
  };

  // Trigger refetch when admin mode changes
  useEffect(() => {
    refetchVideos();
  }, [isAdminMode]);

  // Sync state to local storage for standard user flags
  useEffect(() => {
    localStorage.setItem('veloura_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('isAgeVerified', String(isAgeVerified));
  }, [isAgeVerified]);

  const verifyAge = () => {
    setIsAgeVerified(true);
  };

  const resetAgeVerification = () => {
    setIsAgeVerified(false);
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setAdminMode(false);
      setUserRole(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const addVideo = async (newVideoData: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadDate'>) => {
    try {
      const newId = await createVideoInFirestore(newVideoData);
      if (!newId) return;
      const newVideo: Video = {
        ...newVideoData,
        id: newId,
        views: 0,
        likes: 0,
        dislikes: 0,
        uploadDate: new Date().toISOString()
      };
      setVideos(prev => [newVideo, ...prev]);
    } catch (err: any) {
      console.error('Error adding video to Firestore:', err);
      setError(err.message || 'Failed to save new video record');
      throw err;
    }
  };

  const updateVideo = async (updated: Video) => {
    try {
      await updateVideoInFirestore(updated);
      setVideos(prev => prev.map(v => v.id === updated.id ? updated : v));
      if (activeVideo && activeVideo.id === updated.id) {
        setActiveVideo(updated);
      }
    } catch (err: any) {
      console.error('Error updating video in Firestore:', err);
      setError(err.message || 'Failed to update video record');
      throw err;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await deleteVideoFromFirestore(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      setFavorites(prev => prev.filter(favId => favId !== id));
      if (activeVideo && activeVideo.id === id) {
        setActiveVideo(null);
      }
    } catch (err: any) {
      console.error('Error deleting video from Firestore:', err);
      setError(err.message || 'Failed to delete video record');
      throw err;
    }
  };

  const deleteAllVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Set the cleared flag in localStorage to prevent auto-re-seeding
      localStorage.setItem('veloura_db_cleared', 'true');
      
      // Delete each video in current list
      const currentVideos = [...videos];
      for (const video of currentVideos) {
        await deleteVideoFromFirestore(video.id);
      }
      
      setVideos([]);
      setFavorites([]);
      setActiveVideo(null);
    } catch (err: any) {
      console.error('Error deleting all videos:', err);
      setError(err.message || 'Failed to delete all videos');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSeed = async () => {
    try {
      setLoading(true);
      setError(null);
      // Remove the cleared flag in localStorage to allow seeding
      localStorage.removeItem('veloura_db_cleared');
      
      // Explicitly run the seeding function
      await seedInitialVideos(true); // pass true to override or force-run
      
      // Fetch the updated list
      const fetched = isAdminMode 
        ? await fetchAllVideosFromFirestore()
        : await fetchActiveVideosFromFirestore();
      setVideos(fetched);
    } catch (err: any) {
      console.error('Error manual seeding:', err);
      setError(err.message || 'Failed to seed sample videos');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      await incrementVideoViews(id);
      setVideos(prev => prev.map(v => {
        if (v.id === id) {
          return { ...v, views: v.views + 1 };
        }
        return v;
      }));
      if (activeVideo && activeVideo.id === id) {
        setActiveVideo(prev => prev ? { ...prev, views: prev.views + 1 } : null);
      }
    } catch (err: any) {
      console.error('Error incrementing views:', err);
    }
  };

  const toggleLike = async (id: string, isLike: boolean) => {
    try {
      await registerReactionInFirestore(id, isLike ? 'like' : 'dislike');
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
      if (activeVideo && activeVideo.id === id) {
        setActiveVideo(prev => {
          if (!prev) return null;
          return isLike 
            ? { ...prev, likes: prev.likes + 1 } 
            : { ...prev, dislikes: prev.dislikes + 1 };
        });
      }
    } catch (err: any) {
      console.error('Error registering reaction:', err);
    }
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
        loading,
        error,
        refetchVideos,
        addVideo,
        updateVideo,
        deleteVideo,
        deleteAllVideos,
        triggerManualSeed,
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
        editTarget,
        setEditTarget,
        favorites,
        toggleFavorite,
        
        currentUser,
        userRole,
        logoutUser,

        showAuthModal,
        setShowAuthModal,
        accessDeniedMessage,
        setAccessDeniedMessage
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

