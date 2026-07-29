import React, { useEffect } from 'react';
import { useVideos } from '../context/VideoContext';
import { getProxiedThumbnailUrl } from '../lib/utils';
import { generateAiSeoMetadata, generateCategorySeo } from '../lib/aiSeoGenerator';

export const BASE_URL = 'https://veloura-etez.vercel.app';

function parseIsoDuration(durationStr?: string): string {
  if (!durationStr) return 'PT5M';
  const clean = durationStr.trim();
  const parts = clean.split(':').map(p => parseInt(p, 10));
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
  const { activeVideo, selectedCategory, searchQuery, videos } = useVideos();

  useEffect(() => {
    let title = 'Veloura - Premium Video Streaming & Exclusive Entertainment';
    let description = 'Watch high-definition video streaming on Veloura. Discover trending releases, exclusive titles, curated categories, and high quality media content.';
    let keywords = 'Veloura, video streaming, HD videos, watch videos, trending releases, online video player, premium entertainment';
    let canonicalUrl = `${BASE_URL}/`;
    let ogType = 'website';
    let ogImage = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80';
    let imageAlt = 'Veloura Premium Video Streaming Platform';
    
    let videoObjectSchema: any = null;
    let breadcrumbsSchema: any = null;
    let collectionPageSchema: any = null;

    const baseBreadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BASE_URL}/`,
      },
    ];

    if (activeVideo) {
      // 1. VIDEO PLAYER PAGE
      const aiMeta = generateAiSeoMetadata(
        activeVideo.title,
        activeVideo.category,
        activeVideo.description,
        activeVideo.duration
      );

      title = `${activeVideo.title} - Stream on Veloura`;
      description = aiMeta.seoDescription;
      keywords = aiMeta.keywords.join(', ');
      canonicalUrl = `${BASE_URL}/video/${encodeURIComponent(activeVideo.id)}`;
      ogType = 'video.other';
      if (activeVideo.thumbnailUrl) {
        ogImage = getProxiedThumbnailUrl(activeVideo.thumbnailUrl);
      }
      imageAlt = aiMeta.imageAltText;

      const isoUploadDate = activeVideo.uploadDate 
        ? new Date(activeVideo.uploadDate).toISOString() 
        : new Date().toISOString();

      const contentUrl = activeVideo.videoUrl || activeVideo.downloadUrl || canonicalUrl;
      const embedUrl = activeVideo.embedUrl || activeVideo.iframeUrl || contentUrl;

      // VideoObject Schema
      videoObjectSchema = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: activeVideo.title,
        description: aiMeta.fullDescription,
        thumbnailUrl: [ogImage],
        uploadDate: isoUploadDate,
        duration: parseIsoDuration(activeVideo.duration),
        contentUrl: contentUrl,
        embedUrl: embedUrl,
        isFamilyFriendly: true,
        inLanguage: 'en',
        keywords: aiMeta.keywords.join(', '),
        category: activeVideo.category,
        genre: activeVideo.category,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WatchAction' },
          userInteractionCount: activeVideo.views || 0,
        },
        potentialAction: {
          '@type': 'WatchAction',
          target: canonicalUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Veloura',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/assets/logo.png`,
          },
        },
      };

      // Breadcrumbs for Video Page
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
      // 2. CATEGORY PAGE
      const catSeo = generateCategorySeo(selectedCategory);
      title = catSeo.title;
      description = catSeo.description;
      keywords = catSeo.keywords;
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

      // CollectionPage Schema
      const categoryVideos = videos.filter(v => v.category === selectedCategory).slice(0, 10);
      collectionPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${selectedCategory} Videos`,
        description: catSeo.description,
        url: canonicalUrl,
        hasPart: categoryVideos.map(v => ({
          '@type': 'VideoObject',
          name: v.title,
          url: `${BASE_URL}/video/${encodeURIComponent(v.id)}`,
          thumbnailUrl: getProxiedThumbnailUrl(v.thumbnailUrl),
        })),
      };
    } else if (searchQuery) {
      // 3. SEARCH PAGE
      title = `Search results for "${searchQuery}" - Veloura`;
      description = `Stream videos matching "${searchQuery}" on Veloura. High definition playback, exclusive releases, and curated category videos.`;
      keywords = `${searchQuery}, watch ${searchQuery}, veloura search, HD video player`;
      canonicalUrl = `${BASE_URL}/`;
      ogType = 'website';
    } else {
      // 4. HOMEPAGE
      breadcrumbsSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: baseBreadcrumbs,
      };
    }

    // Set Document Title
    document.title = title;

    // Standard Meta Tags
    updateMetaTag('meta[name="title"]', 'name', 'title', title);
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('meta[name="author"]', 'name', 'author', 'Veloura Team');
    updateMetaTag('meta[name="referrer"]', 'name', 'referrer', 'strict-origin-when-cross-origin');
    updateMetaTag('meta[name="theme-color"]', 'name', 'theme-color', '#0B0B0F');
    updateMetaTag('meta[name="language"]', 'name', 'language', 'English');
    updateLinkCanonical(canonicalUrl);

    // Open Graph Tags
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    updateMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1280');
    updateMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '720');
    updateMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', imageAlt);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Veloura');
    updateMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');

    // Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:site"]', 'name', 'twitter:site', '@VelouraApp');
    updateMetaTag('meta[name="twitter:creator"]', 'name', 'twitter:creator', '@VelouraApp');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);
    updateMetaTag('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', imageAlt);

    // Build JSON-LD Schemas List
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
    if (collectionPageSchema) {
      schemas.push(collectionPageSchema);
    }
    if (videoObjectSchema) {
      schemas.push(videoObjectSchema);
    }

    updateJsonLd(schemas);
  }, [activeVideo, selectedCategory, searchQuery, videos]);

  return null;
};
