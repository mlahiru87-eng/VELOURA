import { fetchActiveVideosForSitemap, generateSitemapXml } from '../src/lib/sitemapGenerator';

export default async function handler(req: any, res: any) {
  try {
    const protocol = (req.headers && req.headers['x-forwarded-proto']) || 'https';
    const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || 'veloura-etez.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    const videos = await fetchActiveVideosForSitemap();
    const xml = generateSitemapXml(videos, baseUrl);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
  }
}
