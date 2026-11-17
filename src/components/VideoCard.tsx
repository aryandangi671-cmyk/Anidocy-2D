import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { formatDateBilingual, getBilingualText } from '../i18n/translations.ts';
import type { VideoRecord } from '../types/anidoc.ts';
import { VideoThumbnail } from './VideoThumbnail.tsx';

interface VideoCardProps {
  video: VideoRecord;
  variant?: 'standard' | 'short';
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, variant = 'standard' }) => {
  const { language, t } = useApp();
  const title = getBilingualText(language, video.title_en, video.title_hi).text;
  const desc = getBilingualText(language, video.description_en, video.description_hi).text;
  const catName = getBilingualText(language, video.category_name_en, video.category_name_hi).text;
  const dateStr = formatDateBilingual(video.published_at, language);

  if (variant === 'short') {
    return (
      <Link
        to={`/watch/${video.slug}`}
        className="group flex flex-col gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A47A2C] dark:focus-visible:ring-[#D4AF62] rounded-sm"
      >
        <VideoThumbnail
          youtubeId={video.youtube_id}
          customThumbnailUrl={video.custom_thumbnail_url}
          alt={title}
          aspect="9/16"
          isShort
          className="rounded-sm"
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] dark:text-[#929292]">
            {catName && <span>{catName}</span>}
            {video.is_demo === 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#B8202D] dark:text-[#D4AF62] font-medium">{t.sections.demoLabel}</span>
              </>
            )}
          </div>
          <h3 className="font-serif text-base font-semibold leading-snug text-[#171717] dark:text-[#F4F1EB] line-clamp-2 group-hover:text-[#A47A2C] dark:group-hover:text-[#D4AF62] transition-colors">
            {title}
          </h3>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/watch/${video.slug}`}
      className="group flex flex-col gap-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A47A2C] dark:focus-visible:ring-[#D4AF62]"
    >
      <VideoThumbnail
        youtubeId={video.youtube_id}
        customThumbnailUrl={video.custom_thumbnail_url}
        alt={title}
        aspect="16/9"
        className="rounded-sm"
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B] dark:text-[#929292]">
          {catName && <span className="font-medium text-[#A47A2C] dark:text-[#D4AF62]">{catName}</span>}
          {catName && dateStr && <span aria-hidden="true">·</span>}
          {dateStr && <span className="tabular-nums">{dateStr}</span>}
          {video.is_demo === 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#B8202D] dark:text-[#C92332]">{t.sections.demoLabel}</span>
            </>
          )}
        </div>
        <h3 className="font-serif text-xl font-semibold leading-snug text-[#171717] dark:text-[#F4F1EB] line-clamp-2 group-hover:text-[#A47A2C] dark:group-hover:text-[#D4AF62] transition-colors">
          {title}
        </h3>
        {desc && (
          <p className="text-sm leading-relaxed text-[#525252] dark:text-[#929292] line-clamp-2">
            {desc}
          </p>
        )}
      </div>
    </Link>
  );
};
