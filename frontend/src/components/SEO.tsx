import React, { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  breadcrumbs?: BreadcrumbItem[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Examirror provides accredited skill development courses, computer institute franchise opportunities, national certifications, and automated center management solutions across India.',
  keywords = [
    'Examirror',
    'Skill Development',
    'Computer Institute Franchise',
    'National Certification',
    'Government Registered Institute',
    'ISO Certified Computer Center',
    'DCA Course',
    'ADCA Course',
    'Computer Certification India'
  ],
  canonicalUrl,
  ogType = 'website',
  ogImage = '/assets/logo.png',
  twitterCard = 'summary_large_image',
  noindex = false,
  jsonLd,
  breadcrumbs
}) => {
  useEffect(() => {
    // 1. Title: Format as "Primary Topic | Examirror"
    const brandName = 'Examirror';
    let siteTitle = `${brandName} | Skill Development & National Certification`;
    if (title) {
      siteTitle = title.includes(brandName) ? title : `${title} | ${brandName}`;
    }
    document.title = siteTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // Helper to update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Meta description
    updateMetaTag('meta[name="description"]', 'name', 'description', description);

    // 3. Meta keywords
    const keywordStr = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    if (keywordStr) {
      updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywordStr);
    }

    // 4. Robots
    const robotsContent = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    updateMetaTag('meta[name="robots"]', 'name', 'robots', robotsContent);

    // 5. Canonical URL
    const fullCanonical =
      canonicalUrl ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://examirror.edu.in');
    updateLinkTag('canonical', fullCanonical);

    // 6. Open Graph metadata
    const absoluteOgImage =
      typeof window !== 'undefined' && !ogImage.startsWith('http')
        ? `${window.location.origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`
        : ogImage;

    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', siteTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', fullCanonical);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', absoluteOgImage);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Examirror');

    // 7. Twitter / X metadata
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', twitterCard);
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', siteTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteOgImage);

    // 8. JSON-LD Structured Data
    const existingScript = document.getElementById('seo-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    const jsonLdData: any[] = [];

    // Add BreadcrumbList schema if breadcrumbs provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://examirror.edu.in';
      jsonLdData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.item.startsWith('http') ? b.item : `${origin}${b.item.startsWith('/') ? '' : '/'}${b.item}`
        }))
      });
    }

    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        jsonLdData.push(...jsonLd);
      } else {
        jsonLdData.push(jsonLd);
      }
    }

    if (jsonLdData.length > 0) {
      const script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLdData.length === 1 ? jsonLdData[0] : jsonLdData);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById('seo-jsonld');
      if (script) script.remove();
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, twitterCard, noindex, jsonLd, breadcrumbs]);

  return null;
};

export default SEO;
