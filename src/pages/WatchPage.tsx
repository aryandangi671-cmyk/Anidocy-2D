import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Film, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDateBilingual, getBilingualText } from '../i18n/translations.ts';
import type { VideoRecord } from '../types/anidoc.ts';
import { getVideoThumbnailUrl, getYouTubeEmbedUrl } from '../utils/youtube.ts';
import { VideoCard } from '../components/VideoCard.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

export const WatchPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language, t } = useApp();

  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [related, setRelated] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public/videos/${encodeURIComponent(slug || '')}`)
      .then(async (res) => {
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (active) {
          setVideo(data.video);
          setRelated(data.related || []);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = video ? getBilingualText(language, video.title_en, video.title_hi).text : 'ANIDOC 2D';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 animate-pulse space-y-6">
        <div className="h-5 w-32 rounded bg-[#E9E6DF] dark:bg-[#151515]" />
        <div className="aspect-video w-full rounded-sm bg-[#E9E6DF] dark:bg-[#151515]" />
        <div className="h-8 w-2/3 rounded bg-[#E9E6DF] dark:bg-[#151515]" />
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
          {t.pages.notFoundTitle}
        </h1>
        <p className="mt-3 text-base text-[#525252] dark:text-[#929292]">{t.pages.notFoundBody}</p>
        <Link
          to="/documentaries"
          className="mt-6 inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] dark:text-[#090909]"
        >
          {t.controls.backToArchive}
        </Link>
      </div>
    );
  }

  const titleMeta = getBilingualText(language, video.title_en, video.title_hi);
  const descMeta = getBilingualText(language, video.description_en, video.description_hi);
  const catName = getBilingualText(language, video.category_name_en, video.category_name_hi).text;
  const pubDate = formatDateBilingual(video.published_at, language);
  const thumbUrl = getVideoThumbnailUrl(video);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: titleMeta.text,
    description: descMeta.text || titleMeta.text,
    ...(thumbUrl ? { thumbnailUrl: [thumbUrl] } : {}),
    ...(video.published_at ? { uploadDate: video.published_at } : {}),
    ...(video.youtube_id ? { embedUrl: getYouTubeEmbedUrl(video.youtube_id) } : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <SeoHead
        title={titleMeta.text}
        description={descMeta.text || titleMeta.text}
        image={thumbUrl}
        type="video.other"
        jsonLd={jsonLd}
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-[#525252] dark:text-[#929292] hover:text-[#171717] dark:hover:text-[#F4F1EB] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t.controls.backToArchive}</span>
        </button>

        <div className="flex items-center gap-2">
          {video.youtube_url && (
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3.5 py-2 text-xs font-semibold text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors"
            >
              <span>{t.sections.watchOnYouTube}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3.5 py-2 text-xs font-semibold text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                <span>{t.controls.copiedLink}</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.controls.shareEpisode}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Player Frame */}
      <div
        className={`mx-auto overflow-hidden rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#090909] ${
          video.format === 'short' ? 'max-w-sm aspect-[9/16]' : 'w-full aspect-video'
        }`}
      >
        {video.youtube_id ? (
          <iframe
            src={getYouTubeEmbedUrl(video.youtube_id)}
            title={titleMeta.text}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center text-[#929292]">
            <Film className="h-10 w-10 text-[#D4AF62]" aria-hidden="true" />
            <p className="font-serif text-xl text-[#F4F1EB]">{titleMeta.text}</p>
            <p className="max-w-md text-xs text-[#929292]">
              {video.is_demo === 1
                ? language === 'hi'
                  ? 'यह एक डेमो नमूना प्रविष्टि है जिसमें कोई यूट्यूब वीडियो आईडी नहीं जुड़ा है।'
                  : 'This is a clearly labeled DEMO entry with no external YouTube video ID attached.'
                : 'No YouTube embed URL is configured for this record.'}
            </p>
          </div>
        )}
      </div>

      {/* Episode Metadata & Description */}
      <div className="mt-8 border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B] dark:text-[#929292]">
          {catName && <span className="font-semibold text-[#A47A2C] dark:text-[#D4AF62]">{catName}</span>}
          {catName && pubDate && <span aria-hidden="true">·</span>}
          {pubDate && (
            <span className="tabular-nums">
              {t.sections.publicationDate}: {pubDate}
            </span>
          )}
          {video.is_demo === 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#B8202D] dark:text-[#C92332]">{t.sections.demoLabel}</span>
            </>
          )}
        </div>

        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[#171717] dark:text-[#F4F1EB] sm:text-4xl">
          {titleMeta.text}
        </h1>

        {(titleMeta.isFallbackLanguage || descMeta.isFallbackLanguage) && (
          <p className="mt-2 text-xs italic text-[#6B6B6B] dark:text-[#929292]">
            {t.sections.translationNote}
          </p>
        )}

        {descMeta.text && (
          <div className="mt-6 max-w-3xl whitespace-pre-line text-base leading-relaxed text-[#404040] dark:text-[#F4F1EB]/85">
            {descMeta.text}
          </div>
        )}
      </div>

      {/* Related Videos */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-2xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
            {t.sections.relatedEpisodes}
          </h2>
          <div
            className={`grid gap-6 ${
              video.format === 'short'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {related.map((item) => (
              <VideoCard key={item.id} video={item} variant={item.format === 'short' ? 'short' : 'standard'} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
