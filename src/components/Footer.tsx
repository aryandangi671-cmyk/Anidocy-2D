import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Phone, User } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AnidocLogo } from './AnidocLogo.tsx';

export const Footer: React.FC = () => {
  const { language, t, settings } = useApp();
  const channelUrl = settings?.youtube_channel_url || 'https://youtube.com/@anidocemedia?si=rcoYZaWMGqJ7c7na';
  const showContact = settings?.show_public_contact === '1';
  const contactName = settings?.public_contact_name || '';
  const contactMobile = settings?.public_contact_mobile || '';

  return (
    <footer className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#E9E6DF]/55 dark:bg-[#151515]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <AnidocLogo />
            <p className="max-w-md text-sm leading-relaxed text-[#525252] dark:text-[#929292]">
              {t.footer.tagline}
            </p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-sm border border-[#171717]/15 dark:border-[#D4AF62]/40 bg-[#FFFFFF] dark:bg-[#090909] px-4 py-2 text-xs font-semibold text-[#171717] dark:text-[#D4AF62] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors"
            >
              <span>{t.controls.subscribeYouTube}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-[#171717] dark:text-[#F4F1EB]">
              {t.footer.explore}
            </h4>
            <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#929292]">
              <li>
                <Link to="/documentaries" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.documentaries}
                </Link>
              </li>
              <li>
                <Link to="/mysteries" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.mysteries}
                </Link>
              </li>
              <li>
                <Link to="/real-stories" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.realStories}
                </Link>
              </li>
              <li>
                <Link to="/shorts" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.shorts}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-[#171717] dark:text-[#F4F1EB]">
              {t.footer.platform}
            </h4>
            <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#929292]">
              <li>
                <Link to="/" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-[#171717] dark:text-[#F4F1EB]">
              {language === 'hi' ? 'संपर्क एवं नियम' : 'Contact & Legal'}
            </h4>
            <ul className="space-y-2.5 text-sm text-[#525252] dark:text-[#929292]">
              {showContact && contactName && (
                <li className="flex items-center gap-2 text-[#171717] dark:text-[#F4F1EB] font-medium">
                  <User className="h-3.5 w-3.5 text-[#A47A2C] dark:text-[#D4AF62] shrink-0" aria-hidden="true" />
                  <span>{contactName}</span>
                </li>
              )}
              {showContact && contactMobile && (
                <li>
                  <a
                    href={`tel:${contactMobile}`}
                    className="inline-flex items-center gap-2 font-mono text-xs text-[#171717] dark:text-[#F4F1EB] hover:text-[#A47A2C] dark:hover:text-[#D4AF62]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#A47A2C] dark:text-[#D4AF62] shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">{contactMobile}</span>
                  </a>
                </li>
              )}
              <li>
                <Link to="/privacy" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.pages.privacyTitle}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#A47A2C] dark:hover:text-[#D4AF62] transition-colors">
                  {t.pages.termsTitle}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-6 text-xs text-[#6B6B6B] dark:text-[#929292] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t.footer.copyright}</p>
          <p>{t.footer.thumbnailNotice}</p>
        </div>
      </div>
    </footer>
  );
};
