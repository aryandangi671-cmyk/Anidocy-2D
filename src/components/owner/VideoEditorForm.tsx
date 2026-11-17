import React, { useEffect, useState } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import type { Category, VideoFormat, VideoRecord, VideoStatus } from '../../types/anidoc.ts';
import { extractYouTubeVideoId } from '../../utils/youtube.ts';
import { VideoThumbnail } from '../VideoThumbnail.tsx';

interface VideoEditorFormProps {
  initialVideo?: VideoRecord | null;
  defaultFormat?: VideoFormat;
  categories: Category[];
  onSaved: (video: VideoRecord) => void;
  onCancel?: () => void;
}

export const VideoEditorForm: React.FC<VideoEditorFormProps> = ({
  initialVideo,
  defaultFormat = 'long',
  categories,
  onSaved,
  onCancel,
}) => {
  const { language } = useApp();
  const isEditing = Boolean(initialVideo?.id);

  const [youtubeUrl, setYoutubeUrl] = useState(initialVideo?.youtube_url || '');
  const [format, setFormat] = useState<VideoFormat>(initialVideo?.format || defaultFormat);
  const [titleEn, setTitleEn] = useState(initialVideo?.title_en || '');
  const [titleHi, setTitleHi] = useState(initialVideo?.title_hi || '');
  const [descEn, setDescEn] = useState(initialVideo?.description_en || '');
  const [descHi, setDescHi] = useState(initialVideo?.description_hi || '');
  const [categoryId, setCategoryId] = useState<string>(
    initialVideo?.category_id ? String(initialVideo.category_id) : categories[0] ? String(categories[0].id) : ''
  );
  const [customThumb, setCustomThumb] = useState(initialVideo?.custom_thumbnail_url || '');
  const [isFeatured, setIsFeatured] = useState(initialVideo?.is_featured === 1);
  const [isTrending, setIsTrending] = useState(initialVideo?.is_trending === 1);
  const [isDemo, setIsDemo] = useState(initialVideo?.is_demo === 1);
  const [displayOrder, setDisplayOrder] = useState<number>(initialVideo?.display_order ?? 0);
  const [placement, setPlacement] = useState<'normal' | 'top' | 'featured'>('normal');

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialVideo) {
      setYoutubeUrl(initialVideo.youtube_url || '');
      setFormat(initialVideo.format || 'long');
      setTitleEn(initialVideo.title_en || '');
      setTitleHi(initialVideo.title_hi || '');
      setDescEn(initialVideo.description_en || '');
      setDescHi(initialVideo.description_hi || '');
      setCategoryId(initialVideo.category_id ? String(initialVideo.category_id) : '');
      setCustomThumb(initialVideo.custom_thumbnail_url || '');
      setIsFeatured(initialVideo.is_featured === 1);
      setIsTrending(initialVideo.is_trending === 1);
      setIsDemo(initialVideo.is_demo === 1);
      setDisplayOrder(initialVideo.display_order ?? 0);
    }
  }, [initialVideo]);

  const parsedYouTube = youtubeUrl.trim() ? extractYouTubeVideoId(youtubeUrl) : null;

  useEffect(() => {
    if (!isEditing && parsedYouTube?.isShort) {
      setFormat('short');
    }
  }, [parsedYouTube?.isShort, isEditing]);

  const handleUploadCustomThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_text', titleEn || titleHi || file.name);
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to upload thumbnail.');
        return;
      }
      setCustomThumb(data.asset.url);
    } catch {
      setError('Upload failed.');
    } finally {
      setUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleSave = async (targetStatus: VideoStatus) => {
    setError(null);
    setSuccessMsg(null);

    if (!titleEn.trim() && !titleHi.trim()) {
      setError(
        language === 'hi'
          ? 'कृपया अंग्रेज़ी या हिंदी में से कम से कम एक शीर्षक दर्ज करें।'
          : 'Please enter at least an English or Hindi title.'
      );
      return;
    }

    if (!isDemo && (!youtubeUrl.trim() || !parsedYouTube)) {
      setError(
        language === 'hi'
          ? 'कृपया एक मान्य YouTube वीडियो या Shorts URL दर्ज करें।'
          : 'Please enter a valid YouTube Video or Shorts URL.'
      );
      return;
    }

    if (youtubeUrl.trim() && !parsedYouTube) {
      setError(
        language === 'hi'
          ? 'YouTube URL का प्रारूप अमान्य है।'
          : 'Invalid YouTube URL format.'
      );
      return;
    }

    setSaving(true);
    try {
      const endpoint = isEditing ? `/api/admin/videos/${initialVideo!.id}` : '/api/admin/videos';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: youtubeUrl.trim(),
          format,
          title_en: titleEn.trim(),
          title_hi: titleHi.trim(),
          description_en: descEn.trim(),
          description_hi: descHi.trim(),
          category_id: categoryId ? Number(categoryId) : null,
          custom_thumbnail_url: customThumb.trim() || null,
          status: targetStatus,
          is_featured: isFeatured,
          is_trending: isTrending,
          is_demo: isDemo,
          display_order: Number(displayOrder) || 0,
          placement: !isEditing ? placement : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save video.');
        return;
      }
      setSuccessMsg(
        targetStatus === 'published'
          ? language === 'hi'
            ? 'वीडियो सहेजा और प्रकाशित किया गया।'
            : 'Video saved and published.'
          : language === 'hi'
            ? 'वीडियो ड्राफ्ट के रूप में सहेजा गया।'
            : 'Video saved as draft.'
      );
      if (!isEditing) {
        setYoutubeUrl('');
        setTitleEn('');
        setTitleHi('');
        setDescEn('');
        setDescHi('');
        setCustomThumb('');
        setIsFeatured(false);
        setIsTrending(false);
      }
      onSaved(data.video);
    } catch {
      setError('Network error while saving video.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-sm border border-[#B8202D]/40 bg-[#B8202D]/10 px-4 py-3 text-sm text-[#B8202D] dark:text-[#F4F1EB]"
        >
          {error}
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-sm border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Form Inputs */}
        <div className="space-y-5 lg:col-span-8">
          <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {language === 'hi' ? 'YouTube वीडियो / Shorts URL' : 'YouTube Video / Shorts URL'}
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
                className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                {parsedYouTube ? (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    Video ID: {parsedYouTube.videoId} ({parsedYouTube.isShort ? 'Shorts' : 'Standard'})
                  </span>
                ) : youtubeUrl.trim() ? (
                  <span className="text-[#B8202D] dark:text-[#C92332]">
                    {language === 'hi' ? 'अमान्य YouTube URL' : 'Unrecognized YouTube URL format'}
                  </span>
                ) : (
                  <span className="text-[#6B6B6B] dark:text-[#929292]">
                    {language === 'hi'
                      ? 'YouTube Data API की आवश्यकता नहीं — URL से ID स्वतः निकलता है।'
                      : 'No YouTube API key needed — video ID and official thumbnail resolve directly from URL.'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {language === 'hi' ? 'फ़ॉर्मेट' : 'Format'}
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as VideoFormat)}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm text-[#171717] dark:text-[#F4F1EB]"
                >
                  <option value="long">{language === 'hi' ? 'डॉक्यूमेंट्री (16:9)' : 'Documentary (16:9)'}</option>
                  <option value="short">{language === 'hi' ? 'शॉर्ट्स (9:16)' : 'YouTube Short (9:16)'}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {language === 'hi' ? 'श्रेणी' : 'Category'}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm text-[#171717] dark:text-[#F4F1EB]"
                >
                  <option value="">{language === 'hi' ? 'कोई नहीं' : 'Uncategorized'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'hi' ? `${c.name_hi} (${c.name_en})` : `${c.name_en} (${c.name_hi})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {language === 'hi' ? 'प्रदर्शन क्रम' : 'Display Order'}
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm tabular-nums text-[#171717] dark:text-[#F4F1EB]"
                />
              </div>
            </div>
          </div>

          {/* Bilingual Titles & Descriptions */}
          <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  English Title
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Enter English title (optional if Hindi provided)"
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  हिंदी शीर्षक (Hindi Title)
                </label>
                <input
                  type="text"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="हिंदी शीर्षक दर्ज करें (यदि उपलब्ध हो)"
                  className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3.5 text-sm text-[#171717] dark:text-[#F4F1EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  English Description
                </label>
                <textarea
                  rows={4}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Research summary in English..."
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm text-[#171717] dark:text-[#F4F1EB]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  हिंदी विवरण (Hindi Description)
                </label>
                <textarea
                  rows={4}
                  value={descHi}
                  onChange={(e) => setDescHi(e.target.value)}
                  placeholder="हिंदी में डॉक्यूमेंट्री का विवरण..."
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm text-[#171717] dark:text-[#F4F1EB]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-[#171717] dark:text-[#F4F1EB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 accent-[#A47A2C]"
                />
                <span>{language === 'hi' ? 'होमपेज पर फ़ीचर करें' : 'Feature on Homepage'}</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-[#171717] dark:text-[#F4F1EB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="h-4 w-4 accent-[#A47A2C]"
                />
                <span>{language === 'hi' ? 'ट्रेंडिंग संग्रह में शामिल करें' : 'Include in Trending'}</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-[#171717] dark:text-[#F4F1EB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemo}
                  onChange={(e) => setIsDemo(e.target.checked)}
                  className="h-4 w-4 accent-[#B8202D]"
                />
                <span>{language === 'hi' ? 'डेमो रिकॉर्ड के रूप में चिह्नित करें' : 'Mark as Demo Record'}</span>
              </label>
            </div>

            {!isEditing && (
              <div className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-4 space-y-2.5">
                <p className="text-xs font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {language === 'hi' ? 'होमपेज प्राथमिकता विकल्प' : 'Homepage Placement Priority'}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    {
                      val: 'normal' as const,
                      label: language === 'hi' ? 'सामान्य रूप से जोड़ें' : 'Publish / Save Normally',
                    },
                    {
                      val: 'top' as const,
                      label: language === 'hi' ? 'होमपेज के शीर्ष पर दिखाएँ' : 'Display at Top of Homepage',
                    },
                    {
                      val: 'featured' as const,
                      label: language === 'hi' ? 'मुख्य फ़ीचर्ड डॉक्यूमेंट्री बनाएँ' : 'Set as Main Featured',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex items-center gap-2 rounded-sm border p-2.5 text-xs font-medium cursor-pointer ${
                        placement === opt.val
                          ? 'border-[#A47A2C] dark:border-[#D4AF62] bg-[#D4AF62]/10'
                          : 'border-[#171717]/15 dark:border-[#F4F1EB]/15'
                      }`}
                    >
                      <input
                        type="radio"
                        name="homepagePlacement"
                        checked={placement === opt.val}
                        onChange={() => setPlacement(opt.val)}
                        className="accent-[#A47A2C]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live YouTube Thumbnail Preview & Actions */}
        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-[#A47A2C] dark:text-[#D4AF62]">
              {language === 'hi' ? 'थंबनेल पूर्वावलोकन' : 'Thumbnail Preview'}
            </h3>
            <VideoThumbnail
              youtubeId={parsedYouTube?.videoId}
              customThumbnailUrl={customThumb || null}
              alt={titleEn || titleHi || 'Video thumbnail preview'}
              aspect={format === 'short' ? '9/16' : '16/9'}
              className="rounded-sm max-h-64 mx-auto"
            />
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-[#525252] dark:text-[#929292]">
                {language === 'hi'
                  ? 'कस्टम थंबनेल (केवल आवश्यकता होने पर)'
                  : 'Custom Thumbnail Override (Optional)'}
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-3 py-1.5 text-xs font-medium text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{uploadingThumb ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadCustomThumb}
                    className="hidden"
                  />
                </label>
                {customThumb && (
                  <button
                    type="button"
                    onClick={() => setCustomThumb('')}
                    className="text-xs text-[#B8202D] dark:text-[#C92332] hover:underline cursor-pointer"
                  >
                    Clear Override
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('published')}
              className="min-h-[44px] w-full rounded-sm bg-[#C92332] px-4 py-2.5 text-sm font-semibold text-[#F4F1EB] hover:bg-[#B8202D] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {saving
                ? 'Saving...'
                : isEditing
                  ? language === 'hi'
                    ? 'अपडेट और प्रकाशित करें'
                    : 'Save & Publish'
                  : language === 'hi'
                    ? 'प्रकाशित करें'
                    : 'Publish Video'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="min-h-[42px] w-full rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-4 py-2 text-sm font-semibold text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'ड्राफ्ट के रूप में सहेजें' : 'Save as Draft'}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[40px] w-full text-xs font-medium text-[#525252] dark:text-[#929292] hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel Editing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
