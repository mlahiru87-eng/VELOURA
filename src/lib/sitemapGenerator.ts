import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { CATEGORIES, Video } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { STATIC_SEED_VIDEOS } from './firebase';

export const SITE_URL = 'https://veloura-etez.vercel.app';

export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
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

    const db = firebaseAppletConfig.firestoreDatabaseId
      ? initializeFirestore(app, {}, firebaseAppletConfig.firestoreDatabaseId)
      : initializeFirestore(app, {});

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

export function generateSitemapXml(videos: Video[], baseUrl: string = SITE_URL): string {
  const domain = baseUrl.replace(/\/$/, '');
  const currentDate = new Date().toISOString().split('T')[0];

  // Filter out internal category 'Favorites'
  const publicCategories = CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

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
    
    let lastMod = currentDate;
    if (video.uploadDate) {
      try {
        lastMod = new Date(video.uploadDate).toISOString().split('T')[0];
      } catch {
        lastMod = currentDate;
      }
    }
      
    const videoPageUrl = `${domain}/video/${encodeURIComponent(video.id)}`;

    xml += `  <url>\n`;
    xml += `    <loc>${videoPageUrl}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    
    // Google Video Sitemap Extension
    if (video.title && (video.videoUrl || video.iframeUrl || video.embedUrl)) {
      xml += `    <video:video>\n`;
      if (video.thumbnailUrl) {
        xml += `      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>\n`;
      }
      xml += `      <video:title>${escapeXml(video.title)}</video:title>\n`;
      xml += `      <video:description>${escapeXml(video.description || video.title)}</video:description>\n`;
      
      const contentLoc = video.videoUrl || video.embedUrl || video.iframeUrl || '';
      if (contentLoc) {
        xml += `      <video:content_loc>${escapeXml(contentLoc)}</video:content_loc>\n`;
      }
      if (video.uploadDate) {
        xml += `      <video:publication_date>${escapeXml(video.uploadDate)}</video:publication_date>\n`;
      }
      xml += `    </video:video>\n`;
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

Sitemap: ${domain}/sitemap.xml
`;
}
