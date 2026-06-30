export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // URL for MP4 or embed (e.g. YouTube, Vimeo, or mock loop)
  duration: string; // e.g., "14:20"
  views: number;
  category: string;
  uploadedAt: string; // relative or absolute date
  isFeatured?: boolean;
  isTrending?: boolean;
  likes: number;
  dislikes: number;
}

export type Category = 'All' | 'Cinematic' | 'Drama' | 'Mystery' | 'Symphonic' | 'Sci-Fi' | 'Noir' | 'Premium' | 'Favorites';

export const CATEGORIES: Category[] = [
  'All',
  'Cinematic',
  'Drama',
  'Mystery',
  'Symphonic',
  'Sci-Fi',
  'Noir',
  'Premium',
  'Favorites'
];

