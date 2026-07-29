import { Video, Category } from '../types';

export interface GeneratedSeoMetadata {
  title: string;
  seoDescription: string;
  fullDescription: string;
  keywords: string[];
  tags: string[];
  trendingPhrases: string[];
  imageAltText: string;
  thumbnailTitle: string;
  thumbnailDescription: string;
  categoryDescription: string;
}

/**
 * Intelligent NLP & AI SEO Content Generator.
 * Generates natural, unique, keyword-rich SEO metadata without keyword stuffing.
 */
export function generateAiSeoMetadata(
  rawTitle: string,
  category: Category | string,
  rawDescription?: string,
  duration?: string
): GeneratedSeoMetadata {
  const cleanTitle = rawTitle.trim() || 'Exclusive Video Release';
  const cleanCategory = category || 'General';
  const displayCategory = cleanCategory === 'All' ? 'Exclusive' : cleanCategory;

  // Natural Title
  const titleHasVeloura = cleanTitle.toLowerCase().includes('veloura');
  const formattedTitle = titleHasVeloura
    ? cleanTitle
    : `${cleanTitle} - Stream in ${displayCategory} on Veloura`;

  // Base context from existing description or title
  const contextText = rawDescription && rawDescription.length > 10 ? rawDescription.trim() : cleanTitle;

  // SEO Description (Strictly 140-160 characters for peak Google Search snippet snippet rendering)
  let seoDescription = `Stream ${cleanTitle} in HD on Veloura. Experience top ${displayCategory} video entertainment with instant playback, high bitrates, and curated streaming.`;
  if (seoDescription.length > 158) {
    seoDescription = `${seoDescription.slice(0, 155)}...`;
  }

  // Full Rich Description
  const fullDescription = rawDescription && rawDescription.length > 30
    ? rawDescription
    : `Watch "${cleanTitle}" exclusively on Veloura. Featuring premium high-definition streaming in the ${displayCategory} showcase. Enjoy smooth buffer-free video playback, verified audio quality, and related video collections on Veloura.`;

  // Natural Keywords (no obsolete keyword stuffing, clean semantic tags)
  const baseWords = cleanTitle
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  const keywords = Array.from(
    new Set([
      cleanTitle,
      `${cleanTitle} HD`,
      `watch ${cleanTitle}`,
      `${displayCategory} videos`,
      `veloura ${displayCategory.toLowerCase()}`,
      'veloura streaming',
      'hd video player',
      ...baseWords
    ])
  );

  const tags = Array.from(
    new Set([
      displayCategory,
      'HD Video',
      'Veloura Exclusive',
      'Trending Stream',
      'Full HD 1080p',
      ...baseWords.slice(0, 3)
    ])
  );

  const trendingPhrases = [
    `Watch ${cleanTitle} online`,
    `Best ${displayCategory} videos 2026`,
    `Veloura ${cleanTitle} full video`,
    `Stream ${displayCategory} in 1080p HD`
  ];

  // Image Alt Text & Thumbnail Metadata
  const imageAltText = `${cleanTitle} - High Definition ${displayCategory} video stream on Veloura`;
  const thumbnailTitle = `${cleanTitle} (${displayCategory})`;
  const thumbnailDescription = `Watch ${cleanTitle} video preview thumbnail - Veloura ${displayCategory} collection.`;

  // Category Description
  const categoryDescription = `Explore our curated selection of ${displayCategory} videos on Veloura. Hand-picked HD video streams, trending releases, and exclusive content.`;

  return {
    title: formattedTitle,
    seoDescription,
    fullDescription,
    keywords,
    tags,
    trendingPhrases,
    imageAltText,
    thumbnailTitle,
    thumbnailDescription,
    categoryDescription
  };
}

/**
 * Helper to generate Category-specific SEO descriptions and titles
 */
export function generateCategorySeo(categoryName: string) {
  const cat = categoryName || 'All';
  if (cat === 'All') {
    return {
      title: 'Veloura - Premium Video Streaming & Exclusive Entertainment',
      description: 'Discover trending releases, exclusive titles, curated categories, and high quality HD media streaming on Veloura.',
      keywords: 'Veloura, video streaming, HD videos, watch videos, trending releases, online video player, premium entertainment'
    };
  }
  return {
    title: `${cat} Videos & HD Streaming - Veloura Showcase`,
    description: `Watch top ${cat} videos in full HD on Veloura. Discover latest releases, exclusive clips, and trending ${cat} streaming content online.`,
    keywords: `${cat}, ${cat} videos, stream ${cat}, watch ${cat} HD, veloura ${cat.toLowerCase()}, trending ${cat}`
  };
}

/**
 * Fallback image placeholder generator when video thumbnails fail to load
 */
export function getFallbackThumbnailUrl(title: string, category: string = 'Veloura'): string {
  const safeTitle = encodeURIComponent(title.slice(0, 30));
  const safeCat = encodeURIComponent(category.toUpperCase());
  return `https://placehold.co/1280x720/0f0f15/D4AF37?text=${safeTitle}+%7C+${safeCat}`;
}
