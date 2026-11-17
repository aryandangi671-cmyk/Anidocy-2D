export interface ParsedYouTubeUrl {
  valid: boolean;
  videoId: string;
  isShort: boolean;
  canonicalUrl: string;
  thumbnailUrl: string;
  maxResThumbnailUrl: string;
}

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(rawUrl: string): ParsedYouTubeUrl | null {
  const input = rawUrl.trim();
  if (!input) return null;

  if (YT_ID_REGEX.test(input)) {
    return buildResult(input, false);
  }

  let parsed: URL;
  try {
    parsed = new URL(input.startsWith('http') ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  let videoId = '';
  let isShort = false;

  if (host === 'youtu.be') {
    videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') {
      videoId = parsed.searchParams.get('v') || '';
    } else if (parts[0] === 'shorts') {
      videoId = parts[1] || '';
      isShort = true;
    } else if (parts[0] === 'embed' || parts[0] === 'live' || parts[0] === 'v') {
      videoId = parts[1] || '';
    } else if (parsed.searchParams.get('v')) {
      videoId = parsed.searchParams.get('v') || '';
    }
  }

  if (!YT_ID_REGEX.test(videoId)) {
    return null;
  }

  return buildResult(videoId, isShort);
}

function buildResult(videoId: string, isShort: boolean): ParsedYouTubeUrl {
  return {
    valid: true,
    videoId,
    isShort,
    canonicalUrl: isShort
      ? `https://www.youtube.com/shorts/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    maxResThumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

export function getVideoThumbnailUrl(video: {
  custom_thumbnail_url?: string | null;
  youtube_id?: string | null;
}): string | null {
  if (video.custom_thumbnail_url && video.custom_thumbnail_url.trim()) {
    return video.custom_thumbnail_url.trim();
  }
  if (video.youtube_id && YT_ID_REGEX.test(video.youtube_id.trim())) {
    return `https://i.ytimg.com/vi/${video.youtube_id.trim()}/hqdefault.jpg`;
  }
  return null;
}

export function getYouTubeEmbedUrl(youtubeId: string): string {
  const clean = youtubeId.trim();
  return `https://www.youtube-nocookie.com/embed/${clean}?rel=0&modestbranding=1`;
}
