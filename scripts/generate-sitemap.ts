import fs from 'fs';
import path from 'path';
import { fetchActiveVideosForSitemap, generateSitemapXml, generateRobotsTxt, SITE_URL } from '../src/lib/sitemapGenerator';

async function main() {
  console.log('Generating sitemap.xml and robots.txt...');
  
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const videos = await fetchActiveVideosForSitemap();
  const xml = generateSitemapXml(videos, SITE_URL);
  const robots = generateRobotsTxt(SITE_URL);

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');

  console.log(`Successfully generated public/sitemap.xml with ${videos.length} public videos.`);
  console.log('Successfully generated public/robots.txt.');
}

main().catch((err) => {
  console.error('Error in build sitemap generator:', err);
  process.exit(1);
});
