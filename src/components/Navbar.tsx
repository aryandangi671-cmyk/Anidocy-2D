import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Globe, LayoutDashboard, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AnidocLogo } from './AnidocLogo.tsx';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, theme, toggleTheme, t, auth } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const showOwnerSetup = !auth.ownerExists;
  const showOwnerDashboard = auth.authenticated && Boolean(auth.user);

  const navLinks = [
    { to: '/documentaries', label: t.nav.documentaries },
    { to: '/mysteries', label: t.nav.mysteries },
    { to: '/real-stories', label: t.nav.realStories },
    { to: '/shorts', label: t.nav.shorts },
    { to: '/about', label: t.nav.about },
    { to: '/contact', label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#F7F5F0]/95 dark:bg-[#090909]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A47A2C] dark:focus-visible:ring-[#D4AF62] rounded-sm"
          aria-label="ANIDOC 2D Home"
        >
          <AnidocLogo />
        </Link>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary Navigation">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-[#A47A2C] dark:border-[#D4AF62] text-[#171717] dark:text-[#F4F1EB]'
                    : 'border-transparent text-[#525252] dark:text-[#929292] hover:text-[#171717] dark:hover:text-[#F4F1EB]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showOwnerSetup && (
            <Link
              to="/owner/setup"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#A47A2C]/50 dark:border-[#D4AF62]/50 bg-[#D4AF62]/15 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#171717] dark:text-[#D4AF62] hover:bg-[#D4AF62]/25 transition-colors whitespace-nowrap shrink-0"
              aria-label={t.nav.ownerSetup}
              title={t.nav.ownerSetup}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t.nav.ownerSetup}</span>
            </Link>
          )}

          {showOwnerDashboard && (
            <Link
              to="/owner"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              aria-label={t.nav.ownerDashboard}
              title={t.nav.ownerDashboard}
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t.nav.ownerDashboard}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3 py-1.5 text-xs font-semibold text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
          >
            <Globe className="h-3.5 w-3.5 text-[#A47A2C] dark:text-[#D4AF62]" aria-hidden="true" />
            <span>{language === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-2.5 py-1.5 text-xs font-medium text-[#171717] dark:text-[#F4F1EB] hover:border-[#A47A2C] dark:hover:border-[#D4AF62] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            title={theme === 'dark' ? t.controls.themeLight : t.controls.themeDark}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#D4AF62]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-[#A47A2C]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex lg:hidden min-h-[40px] min-w-[40px] items-center justify-center rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] text-[#171717] dark:text-[#F4F1EB] cursor-pointer"
            aria-label={mobileOpen ? t.controls.closeMenu : t.controls.openMenu}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#F7F5F0] dark:bg-[#090909]">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3" aria-label="Mobile Navigation">
            <NavLink
              to="/"
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 text-[#171717] dark:text-[#F4F1EB]"
            >
              {t.nav.home}
            </NavLink>
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `py-3 text-sm font-medium border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 ${
                    isActive
                      ? 'text-[#A47A2C] dark:text-[#D4AF62]'
                      : 'text-[#171717] dark:text-[#F4F1EB]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {showOwnerSetup && (
              <NavLink
                to="/owner/setup"
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62]"
              >
                {t.nav.ownerSetup}
              </NavLink>
            )}
            {showOwnerDashboard && (
              <NavLink
                to="/owner"
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-semibold text-[#A47A2C] dark:text-[#D4AF62]"
              >
                {t.nav.ownerDashboard}
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
