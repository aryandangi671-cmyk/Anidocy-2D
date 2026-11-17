import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { getBilingualText } from '../i18n/translations.ts';
import { VideoCard } from '../components/VideoCard.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

interface CatalogPageProps {
  preset: 'documentaries' | 'mysteries' | 'real-stories';
}

const PAGE_SIZE = 6;

export const CatalogPage: React.FC<CatalogPageProps> = ({ preset }) => {
  const { language, t, videos, categories, loadingPublic } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory =
    preset === 'mysteries'
      ? 'mysteries'
      : preset === 'real-stories'
        ? 'real-stories'
        : searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'curated' | 'newest' | 'oldest' | 'title'>('curated');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Sync preset when navigating between /documentaries, /mysteries, /real-stories
  React.useEffect(() => {
    if (preset === 'mysteries') setSelectedCategory('mysteries');
    else if (preset === 'real-stories') setSelectedCategory('real-stories');
    else setSelectedCategory(searchParams.get('category') || 'all');
    setVisibleCount(PAGE_SIZE);
  }, [preset, searchParams]);

  const pageTitle =
    preset === 'mysteries'
      ? t.pages.mysteriesTitle
      : preset === 'real-stories'
        ? t.pages.realStoriesTitle
        : t.pages.documentariesTitle;

  const pageDesc =
    preset === 'mysteries'
      ? t.pages.mysteriesDesc
      : preset === 'real-stories'
        ? t.pages.realStoriesDesc
        : t.pages.documentariesDesc;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = videos.filter((v) => v.format === 'long');

    if (selectedCategory !== 'all') {
      list = list.filter((v) => v.category_slug === selectedCategory);
    }

    if (q) {
      list = list.filter(
        (v) =>
          v.title_en.toLowerCase().includes(q) ||
          v.title_hi.toLowerCase().includes(q) ||
          v.description_en.toLowerCase().includes(q) ||
          v.description_hi.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => (a.published_at || a.created_at).localeCompare(b.published_at || b.created_at));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => {
        const ta = getBilingualText(language, a.title_en, a.title_hi).text;
        const tb = getBilingualText(language, b.title_en, b.title_hi).text;
        return ta.localeCompare(tb);
      });
    } else {
      sorted.sort((a, b) => a.display_order - b.display_order || b.id - a.id);
    }
    return sorted;
  }, [videos, selectedCategory, searchQuery, sortBy, language]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setVisibleCount(PAGE_SIZE);
    if (preset === 'documentaries') {
      if (slug === 'all') setSearchParams({});
      else setSearchParams({ category: slug });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SeoHead title={pageTitle} description={pageDesc} />

      <div className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-8">
        <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
          ANIDOC 2D
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#171717] dark:text-[#F4F1EB] sm:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#525252] dark:text-[#929292]">
          {pageDesc}
        </p>
      </div>

      {/* Filters & Search Bar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {preset === 'documentaries' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`min-h-[40px] rounded-sm px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#171717] dark:bg-[#D4AF62] text-[#FFFFFF] dark:text-[#090909]'
                  : 'border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] text-[#525252] dark:text-[#929292] hover:text-[#171717] dark:hover:text-[#F4F1EB]'
              }`}
            >
              {t.controls.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.slug)}
                className={`min-h-[40px] rounded-sm px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-[#171717] dark:bg-[#D4AF62] text-[#FFFFFF] dark:text-[#090909]'
                    : 'border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] text-[#525252] dark:text-[#929292] hover:text-[#171717] dark:hover:text-[#F4F1EB]'
                }`}
              >
                {getBilingualText(language, cat.name_en, cat.name_hi).text}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm font-medium text-[#525252] dark:text-[#929292] tabular-nums">
            {filtered.length}{' '}
            {language === 'hi' ? 'प्रकाशित डॉक्यूमेंट्री' : filtered.length === 1 ? 'episode' : 'episodes'}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[240px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929292]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder={t.controls.searchPlaceholder}
              aria-label={t.controls.searchPlaceholder}
              className="min-h-[42px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] pl-9 pr-3 text-sm text-[#171717] dark:text-[#F4F1EB] placeholder:text-[#929292] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'curated' | 'newest' | 'oldest' | 'title')}
            aria-label="Sort episodes"
            className="min-h-[42px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3 text-sm text-[#171717] dark:text-[#F4F1EB] focus:border-[#A47A2C] dark:focus:border-[#D4AF62] focus:outline-none"
          >
            <option value="curated">{t.controls.sortCurated}</option>
            <option value="newest">{t.controls.sortNewest}</option>
            <option value="oldest">{t.controls.sortOldest}</option>
            <option value="title">{t.controls.sortTitle}</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="mt-10">
        {loadingPublic ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="space-y-3 animate-pulse">
                <div className="aspect-video rounded-sm bg-[#E9E6DF] dark:bg-[#151515]" />
                <div className="h-4 w-2/3 rounded bg-[#E9E6DF] dark:bg-[#151515]" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-12 text-center">
            <p className="text-base text-[#525252] dark:text-[#929292]">{t.sections.noResults}</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleCategoryChange(preset === 'documentaries' ? 'all' : preset);
              }}
              className="mt-4 inline-flex min-h-[40px] items-center rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-4 py-2 text-xs font-semibold text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] cursor-pointer"
            >
              {t.sections.resetFilters}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="min-h-[44px] rounded-sm border border-[#171717]/20 dark:border-[#D4AF62]/50 bg-[#FFFFFF] dark:bg-[#151515] px-7 py-2.5 text-sm font-semibold text-[#171717] dark:text-[#D4AF62] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors cursor-pointer"
                >
                  {t.controls.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
