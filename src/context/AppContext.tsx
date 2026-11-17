import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UI_COPY } from '../i18n/translations.ts';
import type {
  AuthStatus,
  Category,
  HomepageSection,
  Language,
  OwnerPhoto,
  SiteSettings,
  ThemeMode,
  VideoRecord,
} from '../types/anidoc.ts';

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  t: (typeof UI_COPY)['en'] | (typeof UI_COPY)['hi'];
  categories: Category[];
  sections: HomepageSection[];
  settings: SiteSettings | null;
  videos: VideoRecord[];
  publicPhotos: OwnerPhoto[];
  loadingPublic: boolean;
  refreshPublicData: () => Promise<void>;
  auth: AuthStatus;
  refreshAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const THEME_STORAGE_KEY = 'anidoc_theme';
const LANG_STORAGE_KEY = 'anidoc_lang';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [publicPhotos, setPublicPhotos] = useState<OwnerPhoto[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [auth, setAuth] = useState<AuthStatus>({
    ownerExists: true,
    authenticated: false,
    user: null,
  });

  const applyThemeToDom = useCallback((nextTheme: ThemeMode) => {
    const root = document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme, applyThemeToDom]);

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  }, [language, setLanguage]);

  const refreshPublicData = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories || []);
      setSections(data.sections || []);
      setSettings(data.settings || null);
      setVideos(data.videos || []);
      setPublicPhotos(data.publicPhotos || []);

      // Apply DB default language/theme only if visitor hasn't explicitly chosen one
      try {
        if (!localStorage.getItem(LANG_STORAGE_KEY) && (data.settings?.default_language === 'hi' || data.settings?.default_language === 'en')) {
          setLanguageState(data.settings.default_language);
        }
        if (!localStorage.getItem(THEME_STORAGE_KEY) && (data.settings?.default_theme === 'light' || data.settings?.default_theme === 'dark')) {
          setThemeState(data.settings.default_theme);
        }
      } catch {
        // ignore
      }
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = (await res.json()) as AuthStatus;
        setAuth(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
    refreshAuth();
  }, [refreshPublicData, refreshAuth]);

  const t = UI_COPY[language];

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
        t,
        categories,
        sections,
        settings,
        videos,
        publicPhotos,
        loadingPublic,
        refreshPublicData,
        auth,
        refreshAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
