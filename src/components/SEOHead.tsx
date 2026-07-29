import React, { useEffect } from 'react';
import { useVideos } from '../context/VideoContext';
import { getProxiedThumbnailUrl } from '../lib/utils';

export const BASE_URL = 'https://veloura-etez.vercel.app';

function parseIsoDuration(durationStr?: string): string {
  if (!durationStr) return 'PT5M';
  const parts = durationStr.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 'PT5M';
  
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return `PT${h}H${m}M${s}S`;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return `PT${m}M${s}S`;
  } else if (parts.length === 1) {
    return `PT${parts[0]}S`;
  }
  return 'PT5M';
}

function updateMetaTag(selector: string, attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateLinkCanonical(url: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

function updateJsonLd(schemas: object[]) {
  let scriptEl = document.getElementById('seo-jsonld-script') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'seo-jsonld-script';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(schemas, null, 2);
}

export const SEOHead: React.FC = () => {
  const { activeVideo, selectedCategory, searchQuery } = useVideos();

  useEffect(() => {
    let title = 'Veloura - Premium Video Streaming & Exclusive Entertainment';
    let description = 'Watch high-definition video streaming on Veloura. Discover trending releases, exclusive titles, curated categories, and high quality media content.';
    let keywords = 'Veloura, video streaming, HD videos, watch videos, trending releases, online video player, premium entertainment';
    let canonicalUrl = `${BASE_URL}/`;
    let ogType = 'website';
    let ogImage = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80';
    let videoObjectSchema: any = null;
    let breadcrumbsSchema: any = null;

    const baseBreadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BASE_URL}/`,
      },
    ];

    if (activeVideo) {
      // 1. Video Player Page
      title = `${activeVideo.title} - Watch on Veloura`;
      description = activeVideo.description 
        ? `${activeVideo.description.slice(0, 155)}...`
        : `Watch ${activeVideo.title} in high definition on Veloura. Streaming in ${activeVideo.category} category.`;
      keywords = `${activeVideo.title}, ${activeVideo.category}, watch video, veloura streaming, HD video`;
      canonicalUrl = `${BASE_URL}/video/${encodeURIComponent(activeVideo.id)}`;
      ogType = 'video.other';
      if (activeVideo.thumbnailUrl) {
        ogImage = getProxiedThumbnailUrl(activeVideo.thumbnailUrl);
      }

      const isoUploadDate = activeVideo.uploadDate 
        ? new Date(activeVideo.uploadDate).toISOString() 
        : new Date().toISOString();

      const mediaUrl = activeVideo.videoUrl || activeVideo.embedUrl || activeVideo.iframeUrl || canonicalUrl;

      // VideoObject Schema
      videoObjectSchema = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: activeVideo.title,
        description: activeVideo.description || activeVideo.title,
        thumbnailUrl: [ogImage],
        uploadDate: isoUploadDate,
        duration: parseIsoDuration(activeVideo.duration),
        contentUrl: mediaUrl,
        embedUrl: activeVideo.embedUrl || activeVideo.iframeUrl || mediaUrl,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WatchAction' },
          userInteractionCount: activeVideo.views || 0,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Veloura',
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/assets/logo.png`,
          },
        },
      };

      // Breadcrumb Schema for Video Page
      breadcrumbsSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          ...baseBreadcrumbs,
          {
            '@type': 'ListItem',
            position: 2,
            name: activeVideo.category,
            item: `${BASE_URL}/category/${encodeURIComponent(activeVideo.category)}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: activeVideo.title,
            item: canonicalUrl,
          },
        ],
      };
    } else if (selectedCategory && selectedCategory !== 'All') {
      // 2. Category Page
      title = `${selectedCategory} Videos - Veloura Premium Streaming`;
      description = `Explore top ${selectedCategory} videos on Veloura. Stream HD releases, latest uploads, and curated ${selectedCategory} content online.`;
      keywords = `${selectedCategory}, ${selectedCategory} videos, watch ${selectedCategory}, veloura category`;
      canonicalUrl = `${BASE_URL}/category/${encodeURIComponent(selectedCategory)}`;
      ogType = 'website';

      breadcrumbsSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          ...baseBreadcrumbs,
          {
            '@type': 'ListItem',
            position: 2,
            name: selectedCategory,
            item: canonicalUrl,
          },
        ],
      };
    } else if (searchQuery) {
      // 3. Search View
      title = `Search results for "${searchQuery}" - Veloura`;
      description = `Find videos matching "${searchQuery}" on Veloura. Stream top matched videos and exclusive releases.`;
      canonicalUrl = `${BASE_URL}/`;
    } else {
      // 4. Default Homepage
      breadcrumbsSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: baseBreadcrumbs,
      };
    }

    // Document Title
    document.title = title;

    // Standard Meta Tags
    updateMetaTag('meta[name="title"]', 'name', 'title', title);
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateLinkCanonical(canonicalUrl);

    // Open Graph Tags
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Veloura');
    updateMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');

    // Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // Build JSON-LD Schemas list
    const schemas: any[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Veloura',
        url: BASE_URL,
        description: 'Premium video streaming and exclusive entertainment platform.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Veloura',
        url: BASE_URL,
        logo: `${BASE_URL}/assets/logo.png`,
      },
    ];

    if (breadcrumbsSchema) {
      schemas.push(breadcrumbsSchema);
    }
    if (videoObjectSchema) {
      schemas.push(videoObjectSchema);
    }

    updateJsonLd(schemas);
  }, [activeVideo, selectedCategory, searchQuery]);

  return null;
};
