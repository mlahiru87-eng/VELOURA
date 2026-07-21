export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // URL for MP4 or embed (e.g. YouTube, Vimeo, or mock loop)
  embedUrl?: string; // Uqload or custom iframe embed URL
  driveFileId?: string; // Google Drive File ID
  iframeUrl?: string; // Google Drive preview iframe URL
  downloadUrl?: string; // Custom video download URL
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
  isFavorited?: boolean;
}

export type Category = 'All' | 'Leack' | 'Hot' | 'Romantic' | 'Sri Lankan' | 'Indian' | 'Favorites';

export const CATEGORIES: Category[] = [
  'All',
  'Leack',
  'Hot',
  'Romantic',
  'Sri Lankan',
  'Indian',
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


