import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Phone, Play, User } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDateBilingual, getBilingualText } from '../i18n/translations.ts';
import { VideoCard } from '../components/VideoCard.tsx';
import { VideoThumbnail } from '../components/VideoThumbnail.tsx';
import { SeoHead } from '../components/SeoHead.tsx';

export const HomePage: React.FC = () => {
  const { language, t, videos, sections, settings, publicPhotos, loadingPublic } = useApp();

  const longVideos = videos.filter((v) => v.format === 'long');
  const shortVideos = videos.filter((v) => v.format === 'short');

  const featuredVideo = longVideos.find((v) => v.is_featured === 1) || longVideos[0] || null;
  const latestVideos = longVideos.slice(0, 6);
  const trendingVideos = longVideos.filter((v) => v.is_trending === 1).slice(0, 3);
  const mysteryVideos = longVideos.filter((v) => v.category_slug === 'mysteries').slice(0, 3);
  const realStoriesVideos = longVideos.filter((v) => v.category_slug === 'real-stories').slice(0, 3);
  const historicalVideos = longVideos.filter((v) => v.category_slug === 'historical-discoveries').slice(0, 3);

  const sectionMeta = (key: string) => sections.find((s) => s.section_key === key);
  const isVisible = (key: string) => {
    const s = sectionMeta(key);
    return s ? s.is_visible === 1 : true;
  };
  const sectionText = (key: string, fallbackTitle: string, fallbackSub: string, fallbackCta: string) => {
    const s = sectionMeta(key);
    return {
      title: s ? getBilingualText(language, s.title_en, s.title_hi).text : fallbackTitle,
      subtitle: s ? getBilingualText(language, s.subtitle_en, s.subtitle_hi).text : fallbackSub,
      cta: s ? getBilingualText(language, s.cta_label_en, s.cta_label_hi).text : fallbackCta,
    };
  };

  const heroCopy = sectionText('hero', t.pages.documentariesTitle, t.pages.documentariesDesc, t.controls.watchNow);
  const latestCopy = sectionText('latest', t.pages.documentariesTitle, '', t.controls.exploreAll);
  const trendingCopy = sectionText('trending', t.pages.documentariesTitle, '', t.controls.exploreAll);
  const mysteryCopy = sectionText('mysteries', t.pages.mysteriesTitle, t.pages.mysteriesDesc, t.controls.exploreAll);
  const realCopy = sectionText('real_stories', t.pages.realStoriesTitle, t.pages.realStoriesDesc, t.controls.exploreAll);
  const histCopy = sectionText('historical', t.pages.documentariesTitle, '', t.controls.exploreAll);
  const shortsCopy = sectionText('shorts', t.pages.shortsTitle, t.pages.shortsDesc, t.controls.exploreAll);
  const aboutCopy = sectionText('about', t.pages.aboutTitle, t.pages.aboutSubtitle, t.nav.about);

  const channelUrl = settings?.youtube_channel_url || 'https://youtube.com/@anidocemedia?si=rcoYZaWMGqJ7c7na';
  const showContact = settings?.show_public_contact === '1';
  const contactName = settings?.public_contact_name || '';
  const contactMobile = settings?.public_contact_mobile || '';

  return (
    <div className="flex flex-col">
      <SeoHead />

      {/* 1. CINEMATIC FIRST-SCREEN EDITORIAL HERO + FEATURED DOCUMENTARY */}
      {isVisible('hero') && (
        <section className="relative overflow-hidden border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#090909] text-[#F4F1EB]">
          <img
            src="/src/assets/images/hero_editorial_atmosphere_1794889504613.jpg"
            alt={language === 'hi' ? 'ANIDOC 2D संपादकीय शोध डेस्क' : 'ANIDOC 2D archival research studio'}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/70 via-[#090909]/85 to-[#090909]" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left Editorial Masthead */}
              <div className="flex flex-col justify-between gap-6 lg:col-span-5">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/Screenshot_20261017-074135_42bbe039.png"
                      alt="ANIDOC 2D"
                      className="h-11 w-11 rounded-full object-cover border border-[#D4AF62]/70 shrink-0"
                    />
                    <span className="text-xs font-semibold tracking-[0.18em] text-[#D4AF62]">
                      ANIDOC 2D · {language === 'hi' ? 'संपादकीय संग्रह' : 'EDITORIAL ARCHIVE'}
                    </span>
                  </div>

                  <h1 className="font-serif text-3xl font-semibold leading-[1.12] text-[#F4F1EB] sm:text-5xl [text-wrap:balance]">
                    {heroCopy.title}
                  </h1>
                  <p className="text-sm leading-relaxed text-[#F4F1EB]/80 sm:text-base">
                    {heroCopy.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {featuredVideo && (
                      <Link
                        to={`/watch/${featuredVideo.slug}`}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-[#C92332] px-6 py-3 text-sm font-semibold text-[#F4F1EB] hover:bg-[#B8202D] transition-colors"
                      >
                        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                        <span>{heroCopy.cta}</span>
                      </Link>
                    )}
                    <Link
                      to="/documentaries"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-[#F4F1EB]/25 bg-[#151515]/85 px-5 py-3 text-sm font-medium text-[#F4F1EB] hover:border-[#D4AF62] transition-colors"
                    >
                      <span>{t.controls.exploreAll}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* Direct Section Jump Strip (zero hidden menus) */}
                <div className="border-t border-[#F4F1EB]/15 pt-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#929292]">
                    <a href="#latest" className="hover:text-[#D4AF62] transition-colors whitespace-nowrap">
                      {latestCopy.title}
                    </a>
                    <span aria-hidden="true">·</span>
                    <a href="#mysteries" className="hover:text-[#D4AF62] transition-colors whitespace-nowrap">
                      {t.nav.mysteries}
                    </a>
                    <span aria-hidden="true">·</span>
                    <a href="#real-stories" className="hover:text-[#D4AF62] transition-colors whitespace-nowrap">
                      {t.nav.realStories}
                    </a>
                    <span aria-hidden="true">·</span>
                    <a href="#shorts" className="hover:text-[#D4AF62] transition-colors whitespace-nowrap">
                      {t.nav.shorts}
                    </a>
                    <span aria-hidden="true">·</span>
                    <a href="#about-contact" className="hover:text-[#D4AF62] transition-colors whitespace-nowrap">
                      {t.nav.about}
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Large Featured Documentary Showcase */}
              {featuredVideo && (
                <div className="flex flex-col lg:col-span-7">
                  <Link
                    to={`/watch/${featuredVideo.slug}`}
                    className="group flex h-full flex-col justify-between rounded-sm border border-[#D4AF62]/30 bg-[#151515]/95 p-3.5 sm:p-5 hover:border-[#D4AF62] transition-colors"
                  >
                    <VideoThumbnail
                      youtubeId={featuredVideo.youtube_id}
                      customThumbnailUrl={featuredVideo.custom_thumbnail_url}
                      alt={getBilingualText(language, featuredVideo.title_en, featuredVideo.title_hi).text}
                      aspect="16/9"
                      className="rounded-sm"
                    />
                    <div className="mt-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4AF62]">
                        <span className="font-semibold">{t.sections.featuredBadge}</span>
                        {featuredVideo.category_name_en && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#F4F1EB]/75">
                              {getBilingualText(language, featuredVideo.category_name_en, featuredVideo.category_name_hi).text}
                            </span>
                          </>
                        )}
                        {featuredVideo.published_at && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#929292] tabular-nums">
                              {formatDateBilingual(featuredVideo.published_at, language)}
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="font-serif text-xl font-semibold leading-snug text-[#F4F1EB] sm:text-2xl group-hover:text-[#D4AF62] transition-colors line-clamp-2">
                        {getBilingualText(language, featuredVideo.title_en, featuredVideo.title_hi).text}
                      </h2>
                      <p className="text-xs sm:text-sm leading-relaxed text-[#929292] line-clamp-2">
                        {getBilingualText(language, featuredVideo.description_en, featuredVideo.description_hi).text}
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. LATEST DOCUMENTARIES */}
      {isVisible('latest') && (
        <section id="latest" className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
                  01 · {t.nav.documentaries}
                </p>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {latestCopy.title}
                </h2>
                {latestCopy.subtitle && (
                  <p className="mt-1 text-sm text-[#525252] dark:text-[#929292]">{latestCopy.subtitle}</p>
                )}
              </div>
              <Link
                to="/documentaries"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
              >
                <span>{latestCopy.cta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {loadingPublic ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="space-y-3 animate-pulse">
                    <div className="aspect-video rounded-sm bg-[#E9E6DF] dark:bg-[#151515]" />
                    <div className="h-4 w-2/3 rounded bg-[#E9E6DF] dark:bg-[#151515]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {latestVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. MYSTERY & REAL STORIES EDITORIAL SHOWCASE */}
      {(isVisible('mysteries') || isVisible('real_stories')) && (
        <section className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#E9E6DF]/35 dark:bg-[#151515]/55 py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
            {isVisible('mysteries') && mysteryVideos.length > 0 && (
              <div id="mysteries">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
                      02 · {t.nav.mysteries}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                      {mysteryCopy.title}
                    </h2>
                    {mysteryCopy.subtitle && (
                      <p className="mt-1 text-sm text-[#525252] dark:text-[#929292]">{mysteryCopy.subtitle}</p>
                    )}
                  </div>
                  <Link
                    to="/mysteries"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
                  >
                    <span>{mysteryCopy.cta}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {mysteryVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}

            {isVisible('real_stories') && realStoriesVideos.length > 0 && (
              <div id="real-stories" className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-12">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
                      03 · {t.nav.realStories}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                      {realCopy.title}
                    </h2>
                    {realCopy.subtitle && (
                      <p className="mt-1 text-sm text-[#525252] dark:text-[#929292]">{realCopy.subtitle}</p>
                    )}
                  </div>
                  <Link
                    to="/real-stories"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
                  >
                    <span>{realCopy.cta}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {realStoriesVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. HISTORICAL DISCOVERIES & TRENDING */}
      {isVisible('historical') && historicalVideos.length > 0 && (
        <section className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
                  04 · {histCopy.title}
                </p>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {histCopy.title}
                </h2>
                {histCopy.subtitle && (
                  <p className="mt-1 text-sm text-[#525252] dark:text-[#929292]">{histCopy.subtitle}</p>
                )}
              </div>
              <Link
                to="/documentaries?category=historical-discoveries"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
              >
                <span>{histCopy.cta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {historicalVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>
      )}

      {isVisible('trending') && trendingVideos.length > 0 && (
        <section className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#E9E6DF]/35 dark:bg-[#151515]/50 py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {trendingCopy.title}
                </h2>
                {trendingCopy.subtitle && (
                  <p className="mt-1 text-sm text-[#525252] dark:text-[#929292]">{trendingCopy.subtitle}</p>
                )}
              </div>
              <Link
                to="/documentaries"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
              >
                <span>{trendingCopy.cta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {trendingVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. SHORTS SECTION */}
      {isVisible('shorts') && shortVideos.length > 0 && (
        <section id="shorts" className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
                  05 · {t.nav.shorts}
                </p>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
                  {shortsCopy.title}
                </h2>
                {shortsCopy.subtitle && (
                  <p className="mt-1 text-sm text-[#525252] dark:text-[#929292]">{shortsCopy.subtitle}</p>
                )}
              </div>
              <Link
                to="/shorts"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
              >
                <span>{shortsCopy.cta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {shortVideos.slice(0, 5).map((short) => (
                <VideoCard key={short.id} video={short} variant="short" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. ABOUT ANIDOC 2D + OWNER-APPROVED PUBLIC PHOTOS & CONTACT INFO */}
      {isVisible('about') && (
        <section
          id="about-contact"
          className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#E9E6DF]/35 dark:bg-[#151515]/55 py-16 lg:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6 space-y-4">
                <div className="overflow-hidden rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10">
                  <img
                    src="/src/assets/images/about_research_archive_1794889504861.jpg"
                    alt={language === 'hi' ? 'ANIDOC 2D अभिलेखीय शोध' : 'ANIDOC 2D archival research library'}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>

                {/* Show public creator gallery ONLY when Owner explicitly marked photos as public */}
                {publicPhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-2">
                    {publicPhotos.map((photo) => (
                      <figure
                        key={photo.id}
                        className="overflow-hidden rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#090909]"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || contactName || 'ANIDOC 2D'}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                        {photo.caption && (
                          <figcaption className="px-2.5 py-1.5 text-[11px] text-[#525252] dark:text-[#929292] truncate">
                            {photo.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6 lg:col-span-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-widest text-[#A47A2C] dark:text-[#D4AF62]">
                    {t.nav.about}
                  </p>
                  <h2 className="font-serif text-3xl font-semibold text-[#171717] dark:text-[#F4F1EB] sm:text-4xl">
                    {aboutCopy.title}
                  </h2>
                  <p className="text-base leading-relaxed text-[#525252] dark:text-[#929292]">
                    {language === 'hi' ? settings?.about_hi : settings?.about_en}
                  </p>
                </div>

                {/* Public Contact Card (controlled from Owner Dashboard) */}
                {showContact && (contactName || contactMobile) && (
                  <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#090909] p-5 space-y-3">
                    <p className="text-xs font-semibold tracking-wider text-[#A47A2C] dark:text-[#D4AF62]">
                      {language === 'hi' ? 'सार्वजनिक संपर्क विवरण' : 'Public Contact'}
                    </p>
                    <div className="flex flex-wrap items-center gap-6">
                      {contactName && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#171717] dark:text-[#F4F1EB]">
                          <User className="h-4 w-4 text-[#A47A2C] dark:text-[#D4AF62]" aria-hidden="true" />
                          <span>{contactName}</span>
                        </div>
                      )}
                      {contactMobile && (
                        <a
                          href={`tel:${contactMobile}`}
                          className="inline-flex items-center gap-2 font-mono text-sm font-medium text-[#171717] dark:text-[#F4F1EB] hover:text-[#A47A2C] dark:hover:text-[#D4AF62] tabular-nums"
                        >
                          <Phone className="h-4 w-4 text-[#A47A2C] dark:text-[#D4AF62]" aria-hidden="true" />
                          <span>{contactMobile}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-1">
                  <Link
                    to="/about"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-5 py-2.5 text-sm font-medium text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors"
                  >
                    <span>{aboutCopy.cta}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] dark:text-[#090909] hover:opacity-90 transition-opacity"
                  >
                    <span>{t.nav.contact}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. YOUTUBE CHANNEL SUBSCRIPTION SECTION */}
      <section className="bg-[#151515] text-[#F4F1EB] py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-serif text-3xl font-semibold text-[#F4F1EB]">
              {t.sections.subscribeHeading}
            </h2>
            <p className="text-sm leading-relaxed text-[#929292] sm:text-base">
              {t.sections.subscribeBody}
            </p>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-sm bg-[#C92332] px-6 py-3 text-sm font-semibold text-[#F4F1EB] hover:bg-[#B8202D] transition-colors whitespace-nowrap"
          >
            <span>{t.sections.subscribeButton}</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
};
