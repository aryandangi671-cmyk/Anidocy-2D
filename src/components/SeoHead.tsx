import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'video.other';
  jsonLd?: Record<string, unknown> | null;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  image,
  type = 'website',
  jsonLd,
}) => {
  const { language, settings } = useApp();
  const location = useLocation();

  useEffect(() => {
    const fallbackTitle =
      language === 'hi'
        ? settings?.seo_title_hi || 'ANIDOC 2D — डॉक्यूमेंट्री, रहस्य और सच्ची कहानियाँ'
        : settings?.seo_title_en || 'ANIDOC 2D — Documentaries, Mysteries & Real Stories';
    const fallbackDesc =
      language === 'hi'
        ? settings?.seo_description_hi || 'ANIDOC 2D पर ऐतिहासिक खोजों और रहस्यों पर आधारित 2D डॉक्यूमेंट्री देखें।'
        : settings?.seo_description_en || 'Explore 2D-animated documentaries, historical discoveries, and real stories on ANIDOC 2D.';

    const resolvedTitle = title ? `${title} | ANIDOC 2D` : fallbackTitle;
    const resolvedDesc = (description || fallbackDesc).slice(0, 160);
    const base = settings?.canonical_base_url?.trim() || window.location.origin;
    const canonicalUrl = `${base.replace(/\/+$/, '')}${location.pathname}`;

    document.title = resolvedTitle;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', resolvedDesc);
    setMeta('meta[property="og:title"]', 'property', 'og:title', resolvedTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', resolvedDesc);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', resolvedDesc);
    if (image) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', image);
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    }

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    const scriptId = 'anidoc-structured-data';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    const schema =
      jsonLd || {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ANIDOC 2D',
        url: canonicalUrl,
        description: resolvedDesc,
      };
    scriptEl.textContent = JSON.stringify(schema);
  }, [title, description, image, type, jsonLd, language, settings, location.pathname]);

  return null;
};
