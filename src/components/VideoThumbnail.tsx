import React, { useState } from 'react';
import { Film, Play } from 'lucide-react';
import { getVideoThumbnailUrl } from '../utils/youtube.ts';

interface VideoThumbnailProps {
  youtubeId?: string | null;
  customThumbnailUrl?: string | null;
  alt: string;
  aspect?: '16/9' | '9/16';
  showPlayAffordance?: boolean;
  isShort?: boolean;
  className?: string;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  youtubeId,
  customThumbnailUrl,
  alt,
  aspect = '16/9',
  showPlayAffordance = true,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = getVideoThumbnailUrl({ youtube_id: youtubeId, custom_thumbnail_url: customThumbnailUrl });

  const aspectClass = aspect === '9/16' ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <div
      className={`relative overflow-hidden bg-[#E9E6DF] dark:bg-[#151515] border border-[#171717]/10 dark:border-[#F4F1EB]/10 ${aspectClass} ${className}`}
    >
      {src && !imgFailed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center bg-[#E9E6DF] dark:bg-[#151515]">
          <Film className="h-7 w-7 text-[#929292]" aria-hidden="true" />
          <span className="text-xs font-medium text-[#171717]/70 dark:text-[#929292] line-clamp-2 max-w-[20ch]">
            {alt}
          </span>
        </div>
      )}

      {showPlayAffordance && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/25">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#090909]/80 text-[#F4F1EB] border border-[#D4AF62]/50 opacity-90 transition-transform duration-200 group-hover:scale-105">
            <Play className="h-4 w-4 translate-x-0.5 fill-current" aria-hidden="true" />
          </span>
        </div>
      )}
    </div>
  );
};
