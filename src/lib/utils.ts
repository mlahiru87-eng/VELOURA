/**
 * Utility function to proxy image URLs that have hotlink protection (like uqload.is or strm subdomains).
 * By using the fast and free wsrv.nl (images.weserv.nl) proxy, we bypass CORS and Referer restrictions.
 */
export function getProxiedThumbnailUrl(url: string): string {
  if (!url) return '';

  // If already a data URI, local path, or already proxied, return as-is
  if (
    url.startsWith('data:') || 
    url.startsWith('/') || 
    url.startsWith('.') ||
    url.includes('images.weserv.nl') || 
    url.includes('wsrv.nl')
  ) {
    return url;
  }

  // Check if it's from uqload, strm, or other known external host that restricts hotlinking
  // We can also proxy any external URL that is NOT Unsplash or other safe CDNs to be absolutely robust
  const isSafeDomain = url.includes('unsplash.com') || url.includes('googleusercontent') || url.includes('github');
  
  if (!isSafeDomain && url.startsWith('http')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  return url;
}
