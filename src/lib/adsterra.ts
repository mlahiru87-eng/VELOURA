/**
 * Adsterra Ad Optimization Utility
 * Manages lazy loading, session frequency capping, and device targeting.
 */

// Trigger Popunder ONLY ONCE per session on first video play
export function triggerSessionPopunder() {
  try {
    const KEY = 'veloura_popunder_triggered';
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, 'true');
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://pl30328995.effectivecpmnetwork.com/20/e0/a5/20e0a5aa3c4f0b41eaaddb5802abf08d.js';
      script.onerror = (e) => {
        if (typeof e !== 'string' && e && 'preventDefault' in e) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.body.appendChild(script);
    }
  } catch (err) {
    console.warn('Session popunder error:', err);
  }
}

// Lazy-load Social Bar ONLY on Desktop devices after page load
export function loadSocialBarOnDesktop() {
  try {
    // Disable Social Bar on mobile devices
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      return;
    }

    const SCRIPT_ID = 'adsterra-social-bar-script';
    if (!document.getElementById(SCRIPT_ID)) {
      // Lazy load after page content completes loading
      setTimeout(() => {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://pl30328998.effectivecpmnetwork.com/3c/a6/99/3ca6993f285722055a12ca9cc0143685.js';
        script.onerror = (e) => {
          if (typeof e !== 'string' && e && 'preventDefault' in e) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        document.body.appendChild(script);
      }, 3000);
    }
  } catch (err) {
    console.warn('Social bar loader error:', err);
  }
}
