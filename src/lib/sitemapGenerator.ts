import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { CATEGORIES, Video } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { STATIC_SEED_VIDEOS } from './firebase';

export const SITE_URL = 'https://veloura-etez.vercel.app';

export function extractCleanUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.toLowerCase().includes('<iframe') || trimmed.toLowerCase().includes('src=')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  const clean = trimmed.replace(/^["']|["']$/g, '');
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  return '';
}

export function escapeXml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function fetchActiveVideosForSitemap(): Promise<Video[]> {
  try {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp({
      apiKey: firebaseAppletConfig.apiKey,
      authDomain: firebaseAppletConfig.authDomain,
      projectId: firebaseAppletConfig.projectId,
      storageBucket: firebaseAppletConfig.storageBucket,
      messagingSenderId: firebaseAppletConfig.messagingSenderId,
      appId: firebaseAppletConfig.appId,
    });

    let db;
    try {
      db = firebaseAppletConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId)
        : getFirestore(app);
    } catch {
      db = firebaseAppletConfig.firestoreDatabaseId
        ? initializeFirestore(app, {}, firebaseAppletConfig.firestoreDatabaseId)
        : initializeFirestore(app, {});
    }

    const q = query(collection(db, 'videos'), where('active', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return STATIC_SEED_VIDEOS.filter(v => v.active);
    }

    const fetchedVideos: Video[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedVideos.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        videoUrl: data.videoUrl || '',
        embedUrl: data.embedUrl,
        driveFileId: data.driveFileId,
        iframeUrl: data.iframeUrl,
        downloadUrl: data.downloadUrl,
        duration: data.duration || '0:00',
        views: data.views || 0,
        category: data.category || 'All',
        uploadDate: data.uploadDate || new Date().toISOString(),
        featured: !!data.featured,
        premium: !!data.premium,
        active: data.active !== false,
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        favorites: data.favorites || 0,
      });
    });

    // Merge static seed videos if any are missing from Firestore
    const existingIds = new Set(fetchedVideos.map(v => v.id));
    for (const seed of STATIC_SEED_VIDEOS) {
      if (seed.active && !existingIds.has(seed.id)) {
        fetchedVideos.push(seed);
      }
    }

    return fetchedVideos;
  } catch (err) {
    console.warn('Sitemap generator fallback to static seed videos due to error:', err);
    return STATIC_SEED_VIDEOS.filter(v => v.active);
  }
}

export function formatIsoDate(rawDate: any): string {
  if (!rawDate) return new Date().toISOString();
  try {
    if (typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
      return rawDate.toDate().toISOString();
    }
    if (typeof rawDate === 'object' && typeof rawDate.seconds === 'number') {
      return new Date(rawDate.seconds * 1000).toISOString();
    }
    if (typeof rawDate === 'string' && rawDate.includes('Timestamp(')) {
      const match = rawDate.match(/seconds=(\d+)/);
      if (match && match[1]) {
        return new Date(parseInt(match[1], 10) * 1000).toISOString();
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

export function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 300;
  const clean = durationStr.trim();
  const parts = clean.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 300;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 300;
}

export function generateSitemapXml(videos: Video[], baseUrl: string = SITE_URL): string {
  const domain = baseUrl.replace(/\/$/, '');
  const currentDate = new Date().toISOString().split('T')[0];

  // Filter out internal category 'Favorites'
  const publicCategories = CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${domain}/</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Category Pages
  for (const cat of publicCategories) {
    const encodedCat = encodeURIComponent(cat);
    xml += `  <url>\n`;
    xml += `    <loc>${domain}/category/${encodedCat}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  // 3. Public Video Pages
  for (const video of videos) {
    if (!video.active) continue;
    
    const isoDate = formatIsoDate(video.uploadDate);
    const lastMod = isoDate.split('T')[0] || currentDate;
      
    const videoPageUrl = `${domain}/video/${encodeURIComponent(video.id)}`;

    xml += `  <url>\n`;
    xml += `    <loc>${videoPageUrl}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    
    // Clean and sanitize all media URLs
    const cleanThumb = extractCleanUrl(video.thumbnailUrl);
    const rawVideoLoc = extractCleanUrl(video.videoUrl || video.downloadUrl);
    const rawPlayerLoc = extractCleanUrl(video.embedUrl || video.iframeUrl);

    // Google Video Sitemap: content_loc MUST point directly to a video media file (.mp4, .webm, .m3u8, etc)
    // player_loc points to embed player pages (e.g. iframe embeds).
    const isDirectMediaFile = /\.(mp4|m3u8|webm|mkv|avi|mov)(\?.*)?$/i.test(rawVideoLoc);

    const contentLoc = isDirectMediaFile ? rawVideoLoc : '';
    const playerLoc = rawPlayerLoc || (!isDirectMediaFile ? rawVideoLoc : '');

    // Google Video Sitemap Extension
    if (video.title && (cleanThumb || contentLoc || playerLoc)) {
      xml += `    <video:video>\n`;
      if (cleanThumb) {
        xml += `      <video:thumbnail_loc>${escapeXml(cleanThumb)}</video:thumbnail_loc>\n`;
      }
      xml += `      <video:title>${escapeXml(video.title)}</video:title>\n`;
      xml += `      <video:description>${escapeXml(video.description || video.title)}</video:description>\n`;
      
      if (contentLoc) {
        xml += `      <video:content_loc>${escapeXml(contentLoc)}</video:content_loc>\n`;
      }
      if (playerLoc) {
        xml += `      <video:player_loc>${escapeXml(playerLoc)}</video:player_loc>\n`;
      }
      if (video.duration) {
        const durationSecs = parseDurationToSeconds(video.duration);
        xml += `      <video:duration>${durationSecs}</video:duration>\n`;
      }
      if (video.views) {
        xml += `      <video:view_count>${video.views}</video:view_count>\n`;
      }
      xml += `      <video:family_friendly>yes</video:family_friendly>\n`;
      xml += `      <video:publication_date>${escapeXml(isoDate)}</video:publication_date>\n`;
      if (video.category) {
        xml += `      <video:category>${escapeXml(video.category)}</video:category>\n`;
        xml += `      <video:tag>${escapeXml(video.category)}</video:tag>\n`;
      }
      xml += `      <video:tag>Veloura</video:tag>\n`;
      xml += `      <video:tag>HD Video</video:tag>\n`;
      xml += `    </video:video>\n`;
    }

    // Google Image Sitemap Extension
    if (cleanThumb) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(cleanThumb)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(video.title)}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(video.description || video.title)}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

export function generateRobotsTxt(baseUrl: string = SITE_URL): string {
  const domain = baseUrl.replace(/\/$/, '');
  return `User-agent: *
Allow: /

# Prevent crawling of administrative actions
Disallow: /admin
Disallow: /api/

Sitemap: ${domain}/sitemap.xml
`;
}
