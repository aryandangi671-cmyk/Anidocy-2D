import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDateBilingual, getBilingualText } from '../i18n/translations.ts';
import type { VideoRecord } from '../types/anidoc.ts';
import { getYouTubeEmbedUrl } from '../utils/youtube.ts';
import { VideoThumbnail } from '../components/VideoThumbnail.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

export const ShortsPage: React.FC = () => {
  const { language, t, videos, loadingPublic } = useApp();
  const [activeShort, setActiveShort] = useState<VideoRecord | null>(null);

  const shorts = videos.filter((v) => v.format === 'short');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SeoHead title={t.pages.shortsTitle} description={t.pages.shortsDesc} />

      <div className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-8">
        <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
          ANIDOC 2D
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB] sm:text-5xl">
          {t.pages.shortsTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#525252] dark:text-[#929292]">
          {t.pages.shortsDesc}
        </p>
      </div>

      {loadingPublic ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="aspect-[9/16] rounded-sm bg-[#E9E6DF] dark:bg-[#151515] animate-pulse" />
          ))}
        </div>
      ) : shorts.length === 0 ? (
        <div className="mt-10 rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-12 text-center">
          <p className="text-base text-[#525252] dark:text-[#929292]">{t.sections.noResults}</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
          {shorts.map((short) => {
            const title = getBilingualText(language, short.title_en, short.title_hi).text;
            const cat = getBilingualText(language, short.category_name_en, short.category_name_hi).text;
            return (
              <div key={short.id} className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveShort(short)}
                  className="group relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A47A2C] dark:focus-visible:ring-[#D4AF62] rounded-sm cursor-pointer"
                >
                  <VideoThumbnail
                    youtubeId={short.youtube_id}
                    customThumbnailUrl={short.custom_thumbnail_url}
                    alt={title}
                    aspect="9/16"
                    isShort
                    className="rounded-sm"
                  />
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] dark:text-[#929292]">
                    {cat && <span>{cat}</span>}
                    {short.published_at && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDateBilingual(short.published_at, language)}</span>
                      </>
                    )}
                  </div>
                  <Link
                    to={`/watch/${short.slug}`}
                    className="block font-serif text-base font-semibold leading-snug text-[#171717] dark:text-[#F4F1EB] hover:text-[#A47A2C] dark:hover:text-[#D4AF62] line-clamp-2"
                  >
                    {title}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Vertical Short Modal Player */}
      {activeShort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={getBilingualText(language, activeShort.title_en, activeShort.title_hi).text}
        >
          <div className="relative flex w-full max-w-md flex-col gap-3 rounded-sm border border-[#F4F1EB]/15 bg-[#151515] p-4 text-[#F4F1EB]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold leading-snug line-clamp-2">
                {getBilingualText(language, activeShort.title_en, activeShort.title_hi).text}
              </h2>
              <button
                type="button"
                onClick={() => setActiveShort(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#F4F1EB]/15 hover:border-[#D4AF62] cursor-pointer"
                aria-label="Close video player"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-auto w-full max-w-[340px] aspect-[9/16] overflow-hidden rounded-sm bg-[#090909]">
              {activeShort.youtube_id ? (
                <iframe
                  src={getYouTubeEmbedUrl(activeShort.youtube_id)}
                  title={getBilingualText(language, activeShort.title_en, activeShort.title_hi).text}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-xs text-[#929292]">
                  No YouTube Short ID configured.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                to={`/watch/${activeShort.slug}`}
                onClick={() => setActiveShort(null)}
                className="inline-flex items-center gap-1.5 font-semibold text-[#D4AF62] hover:underline"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.controls.watchShort}</span>
              </Link>
              {activeShort.youtube_url && (
                <a
                  href={activeShort.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#929292] hover:text-[#F4F1EB]"
                >
                  <span>{t.sections.watchOnYouTube}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
