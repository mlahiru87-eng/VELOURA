export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // URL for MP4 or embed (e.g. YouTube, Vimeo, or mock loop)
  driveFileId?: string; // Google Drive File ID
  iframeUrl?: string; // Google Drive preview iframe URL
  duration: string; // e.g., "14:20" or "00:15"
  views: number;
  category: string;
  uploadDate: string; // ISO string upload date from Firestore
  featured: boolean; // whether the video is featured (featured=true)
  premium: boolean; // whether the video is premium (premium=true)
  active: boolean; // whether the video is active (active=true)
  likes: number;
  dislikes: number;
  favorites: number; // number of users who favorited this video
  orientation?: 'landscape' | 'portrait' | 'square';
  aspectRatio?: string;
  resolution?: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

export type Category = 'All' | 'Sri Lankan' | 'Indian' | 'Romantic' | 'Movies' | 'Series' | 'Short Videos' | 'VIP' | '18+' | 'Trending' | 'Premium' | 'Favorites';

export const CATEGORIES: Category[] = [
  'All',
  'Sri Lankan',
  'Indian',
  'Romantic',
  'Movies',
  'Series',
  'Short Videos',
  'VIP',
  '18+',
  'Trending',
  'Premium',
  'Favorites'
];

export interface Admin {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin';
  active: boolean;
  createdAt: string;
}


