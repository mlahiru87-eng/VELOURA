import { generateRobotsTxt } from '../src/lib/sitemapGenerator';

export default async function handler(req: any, res: any) {
  try {
    const protocol = (req.headers && req.headers['x-forwarded-proto']) || 'https';
    const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || 'veloura-etez.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    const robotsTxt = generateRobotsTxt(baseUrl);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(500).send('User-agent: *\nAllow: /\nSitemap: https://veloura-etez.vercel.app/sitemap.xml\n');
  }
}
