/**
 * Utility to sanitize and prepare HTML notes for safe, interactive sandboxed iframe rendering.
 * 
 * Features:
 * 1. Smoothly scrolls internal anchor links (#heading, #section) without triggering iframe URL navigation.
 * 2. Safely opens external links (https://...) in a new browser tab.
 * 3. Prevents any relative link or unhandled click from navigating the iframe to the root app (which causes "Navigation Blocked").
 * 4. Disables form submissions and location tampering.
 */

export const prepareSafeHtmlContent = (rawHtml: string, title: string = 'Study Note'): string => {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  let html = rawHtml;

  const antiNavigationScript = `
    <script>
      (function() {
        // Prevent link clicks from navigating the iframe out of the document
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (!link) return;

          const href = link.getAttribute('href');
          if (!href) return;

          // Always prevent default iframe browser navigation
          e.preventDefault();

          // 1. Internal hash anchor navigation (e.g. #u1, #complexity, #quiz)
          if (href.startsWith('#')) {
            const targetId = href.substring(1);
            if (!targetId) return;

            try {
              // Try finding by id, then by name attribute
              const targetEl = document.getElementById(targetId) || 
                               document.querySelector('[name="' + CSS.escape(targetId) + '"]') ||
                               document.getElementById(decodeURIComponent(targetId));
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            } catch (err) {
              console.warn('Anchor scroll failed:', err);
            }
            return;
          }

          // 2. External HTTP/HTTPS links
          if (href.startsWith('http://') || href.startsWith('https://')) {
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
          }

          // 3. Mailto & Tel
          if (href.startsWith('mailto:') || href.startsWith('tel:')) {
            window.open(href, '_blank');
            return;
          }

          // Any other relative navigation is intentionally ignored to prevent iframe reloading
          console.warn('Blocked relative link inside secure note:', href);
        }, true);

        // Prevent forms inside notes from submitting and navigating away
        document.addEventListener('submit', function(e) {
          e.preventDefault();
        }, true);

        // Smooth Progressive Image Reveal & Lazy Loading for all note diagrams, flowcharts & pictures
        function initSmoothImages() {
          var images = document.querySelectorAll('img');
          images.forEach(function(img) {
            if (!img.getAttribute('loading')) {
              img.setAttribute('loading', 'lazy');
            }
            if (!img.getAttribute('decoding')) {
              img.setAttribute('decoding', 'async');
            }

            if (img.complete && img.naturalHeight !== 0) {
              img.classList.remove('enote-img-loading');
              img.classList.add('enote-img-loaded');
            } else {
              img.classList.add('enote-img-loading');
              img.addEventListener('load', function() {
                img.classList.remove('enote-img-loading');
                img.classList.add('enote-img-loaded');
              }, { once: true });
              img.addEventListener('error', function() {
                img.classList.remove('enote-img-loading');
                img.style.opacity = '0.4';
              }, { once: true });
            }
          });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initSmoothImages);
        } else {
          initSmoothImages();
        }
      })();
    </script>
  `;

  const smoothImageStyles = `
    <style id="enote-smooth-image-styles">
      img {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        display: block;
        margin: 2rem auto;
        box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);
        transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                    filter 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        background-color: #f1f5f9;
      }
      img.enote-img-loading {
        opacity: 0 !important;
        filter: blur(12px) grayscale(40%);
        transform: scale(1.02);
      }
      img.enote-img-loaded {
        opacity: 1 !important;
        filter: blur(0px) grayscale(0%);
        transform: scale(1);
      }
    </style>
  `;

  // Pre-tag any existing <img> tags with loading="lazy" and decoding="async" before parsing
  html = html.replace(/<img(?![^>]*\bloading=)([^>]*?)>/gi, '<img loading="lazy" decoding="async"$1>');

  // If the content is an incomplete snippet (no <!DOCTYPE or <html), wrap with base styles
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
        padding: 24px;
        color: #1e293b;
        line-height: 1.6;
        background-color: #ffffff;
      }
      h1, h2, h3, h4 { color: #0f172a; font-weight: 800; }
      code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
      pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; }
    </style>
    ${smoothImageStyles}
    ${antiNavigationScript}
  </head>
  <body>
    ${html}
  </body>
</html>`;
  }

  // It's a complete HTML document, inject script & styles safely
  const injection = `${smoothImageStyles}${antiNavigationScript}`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${injection}</head>`);
  } else if (html.includes('</body>')) {
    return html.replace('</body>', `${injection}</body>`);
  } else {
    return injection + html;
  }
};
