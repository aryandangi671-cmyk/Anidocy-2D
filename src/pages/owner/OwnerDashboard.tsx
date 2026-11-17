import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  CheckSquare,
  DatabaseBackup,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  FolderOpen,
  Globe,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Settings,
  Sliders,
  Star,
  Sun,
  Trash2,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { getBilingualText } from '../../i18n/translations.ts';
import type {
  AuditLogEntry,
  AuthUser,
  BackupRecord,
  Category,
  ContactMessage,
  DashboardOverview,
  HomepageSection,
  MediaAsset,
  OwnerPhoto,
  SiteSettings,
  VideoRecord,
} from '../../types/anidoc.ts';
import { AnidocLogo } from '../../components/AnidocLogo.tsx';
import { VideoThumbnail } from '../../components/VideoThumbnail.tsx';
import { VideoEditorForm } from '../../components/owner/VideoEditorForm.tsx';
import {
  AuditLogsPanel,
  BackupPanel,
  CategoriesPanel,
  HomepageEditorPanel,
  MediaLibraryPanel,
  MessagesPanel,
  OwnerProfilePanel,
  SettingsPanel,
} from '../../components/owner/DashboardSettingsPanels.tsx';
import { SeoHead } from '../../components/SeoHead.tsx';

type ModuleKey =
  | 'overview'
  | 'videos'
  | 'addVideo'
  | 'editVideos'
  | 'shorts'
  | 'featured'
  | 'categories'
  | 'homepage'
  | 'media'
  | 'messages'
  | 'seo'
  | 'language'
  | 'theme'
  | 'settings'
  | 'profile'
  | 'backup'
  | 'audit';

export const OwnerDashboard: React.FC = () => {
  const { auth, refreshAuth, refreshPublicData, language, toggleLanguage, theme, toggleTheme, t } = useApp();
  const navigate = useNavigate();

  const [activeModule, setActiveModule] = useState<ModuleKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [adminVideos, setAdminVideos] = useState<VideoRecord[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminSections, setAdminSections] = useState<HomepageSection[]>([]);
  const [adminMedia, setAdminMedia] = useState<MediaAsset[]>([]);
  const [adminMessages, setAdminMessages] = useState<ContactMessage[]>([]);
  const [adminSettings, setAdminSettings] = useState<SiteSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<AuthUser[]>([]);
  const [adminBackups, setAdminBackups] = useState<BackupRecord[]>([]);
  const [adminLogs, setAdminLogs] = useState<AuditLogEntry[]>([]);
  const [ownerPhotos, setOwnerPhotos] = useState<OwnerPhoto[]>([]);

  const [editingVideo, setEditingVideo] = useState<VideoRecord | null>(null);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoStatusFilter, setVideoStatusFilter] = useState<'all' | 'published' | 'draft' | 'demo'>('all');
  const [selectedDemoIds, setSelectedDemoIds] = useState<number[]>([]);
  const [confirmDeleteDemosOpen, setConfirmDeleteDemosOpen] = useState(false);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<VideoRecord | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<number, number>>({});

  const loadAdminData = useCallback(async () => {
    if (!auth.authenticated) return;
    const isOwner = auth.user?.role === 'owner';

    const requests: Promise<Response>[] = [
      fetch('/api/admin/overview'),
      fetch('/api/admin/videos'),
      fetch('/api/admin/categories'),
      fetch('/api/admin/homepage-sections'),
      fetch('/api/admin/media'),
      fetch('/api/admin/messages'),
      fetch('/api/admin/settings'),
    ];
    if (isOwner) {
      requests.push(fetch('/api/admin/backups'));
      requests.push(fetch('/api/admin/audit-logs'));
      requests.push(fetch('/api/admin/owner-photos'));
    }

    const responses = await Promise.all(requests);
    const [ovRes, vidRes, catRes, secRes, medRes, msgRes, setRes, bakRes, logRes, photoRes] = responses;

    if (ovRes?.ok) setOverview(await ovRes.json());
    if (vidRes?.ok) {
      const loadedVideos: VideoRecord[] = (await vidRes.json()).videos || [];
      setAdminVideos(loadedVideos);
      const nextDrafts: Record<number, number> = {};
      loadedVideos.forEach((v) => {
        nextDrafts[v.id] = v.display_order;
      });
      setOrderDrafts(nextDrafts);
    }
    if (catRes?.ok) setAdminCategories((await catRes.json()).categories || []);
    if (secRes?.ok) setAdminSections((await secRes.json()).sections || []);
    if (medRes?.ok) setAdminMedia((await medRes.json()).assets || []);
    if (msgRes?.ok) setAdminMessages((await msgRes.json()).messages || []);
    if (setRes?.ok) {
      const sData = await setRes.json();
      setAdminSettings(sData.settings || null);
      setAdminUsers(sData.users || []);
    }
    if (bakRes?.ok) setAdminBackups((await bakRes.json()).backups || []);
    if (logRes?.ok) setAdminLogs((await logRes.json()).logs || []);
    if (photoRes?.ok) setOwnerPhotos((await photoRes.json()).photos || []);

    await refreshPublicData();
  }, [auth.authenticated, auth.user?.role, refreshPublicData]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  if (!auth.ownerExists) {
    return <Navigate to="/owner/setup" replace />;
  }
  if (!auth.authenticated || !auth.user) {
    return <Navigate to="/owner/login" replace />;
  }

  const isOwner = auth.user.role === 'owner';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refreshAuth();
    navigate('/owner/login', { replace: true });
  };

  const handleToggleStatus = async (video: VideoRecord) => {
    const nextStatus = video.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/videos/${video.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) await loadAdminData();
  };

  const handleToggleFlag = async (video: VideoRecord, field: 'is_featured' | 'is_trending') => {
    const res = await fetch(`/api/admin/videos/${video.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...video,
        is_featured: field === 'is_featured' ? video.is_featured === 0 : video.is_featured === 1,
        is_trending: field === 'is_trending' ? video.is_trending === 0 : video.is_trending === 1,
        is_demo: video.is_demo === 1,
      }),
    });
    if (res.ok) await loadAdminData();
  };

  const handleSetMainFeatured = async (video: VideoRecord) => {
    const othersToClear = adminVideos.filter(
      (v) => v.id !== video.id && v.format === video.format && v.is_featured === 1
    );
    await Promise.all([
      ...othersToClear.map((other) =>
        fetch(`/api/admin/videos/${other.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...other,
            is_featured: false,
            is_trending: other.is_trending === 1,
            is_demo: other.is_demo === 1,
          }),
        })
      ),
      fetch(`/api/admin/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...video,
          is_featured: true,
          is_trending: video.is_trending === 1,
          is_demo: video.is_demo === 1,
        }),
      }),
    ]);
    await loadAdminData();
  };

  const handleMoveToTop = async (videoId: number) => {
    const res = await fetch(`/api/admin/videos/${videoId}/move-to-top`, { method: 'POST' });
    if (res.ok) await loadAdminData();
  };

  const handleSaveDisplayOrder = async (video: VideoRecord, nextOrder: number) => {
    const normalized = Number.isFinite(nextOrder) ? Math.max(1, Math.round(nextOrder)) : 1;
    const res = await fetch('/api/admin/videos/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: [{ id: video.id, display_order: normalized }] }),
    });
    if (res.ok) await loadAdminData();
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1, list: VideoRecord[]) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const itemA = list[index];
    const itemB = list[targetIdx];
    const fullCopy = [...adminVideos];
    const posA = fullCopy.findIndex((v) => v.id === itemA.id);
    const posB = fullCopy.findIndex((v) => v.id === itemB.id);
    if (posA === -1 || posB === -1) return;
    const [moved] = fullCopy.splice(posA, 1);
    fullCopy.splice(posB, 0, moved);
    const orders = fullCopy.map((v, i) => ({ id: v.id, display_order: i + 1 }));
    const res = await fetch('/api/admin/videos/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    if (res.ok) await loadAdminData();
  };

  const handleDeleteSingleVideo = async (video: VideoRecord) => {
    const res = await fetch(`/api/admin/videos/${video.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConfirmDeleteVideo(null);
      setSelectedDemoIds((prev) => prev.filter((id) => id !== video.id));
      await loadAdminData();
    }
  };

  const demoVideos = useMemo(() => adminVideos.filter((v) => v.is_demo === 1), [adminVideos]);

  const handleSelectAllDemos = () => {
    setSelectedDemoIds(demoVideos.map((v) => v.id));
  };

  const handleBulkDeleteDemos = async () => {
    if (selectedDemoIds.length === 0) return;
    const res = await fetch('/api/admin/videos/delete-demos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedDemoIds }),
    });
    if (res.ok) {
      setSelectedDemoIds([]);
      setConfirmDeleteDemosOpen(false);
      await loadAdminData();
    }
  };

  const filteredVideos = useMemo(() => {
    const q = videoSearch.trim().toLowerCase();
    return adminVideos.filter((v) => {
      if (videoStatusFilter === 'published' && v.status !== 'published') return false;
      if (videoStatusFilter === 'draft' && v.status !== 'draft') return false;
      if (videoStatusFilter === 'demo' && v.is_demo !== 1) return false;
      if (q) {
        return (
          v.title_en.toLowerCase().includes(q) ||
          v.title_hi.toLowerCase().includes(q) ||
          v.youtube_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adminVideos, videoSearch, videoStatusFilter]);

  const navItems: Array<{ key: ModuleKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview', label: t.owner.navItems.overview, icon: LayoutDashboard },
    { key: 'videos', label: t.owner.navItems.videos, icon: Video },
    { key: 'addVideo', label: t.owner.navItems.addVideo, icon: PlusCircle },
    { key: 'editVideos', label: t.owner.navItems.editVideos, icon: Edit3 },
    { key: 'shorts', label: t.owner.navItems.shorts, icon: Film },
    { key: 'featured', label: t.owner.navItems.featured, icon: Star },
    { key: 'categories', label: t.owner.navItems.categories, icon: FolderOpen },
    { key: 'homepage', label: t.owner.navItems.homepage, icon: LayoutTemplate },
    { key: 'media', label: t.owner.navItems.media, icon: ImageIcon },
    { key: 'messages', label: t.owner.navItems.messages, icon: Mail },
    { key: 'seo', label: t.owner.navItems.seo, icon: Search },
    { key: 'language', label: t.owner.navItems.language, icon: Globe },
    { key: 'theme', label: t.owner.navItems.theme, icon: Sliders },
    { key: 'settings', label: t.owner.navItems.settings, icon: Settings },
    ...(isOwner ? [{ key: 'profile' as const, label: t.owner.navItems.profile, icon: UserCheck }] : []),
    { key: 'backup', label: t.owner.navItems.backup, icon: DatabaseBackup },
    { key: 'audit', label: t.owner.navItems.audit, icon: History },
  ];

  const activeNavLabel = navItems.find((n) => n.key === activeModule)?.label || t.owner.dashboardTitle;

  return (
    <div className="flex min-h-screen bg-[#F7F5F0] dark:bg-[#090909] text-[#171717] dark:text-[#F4F1EB]">
      <SeoHead title={`${activeNavLabel} — Owner Dashboard`} description="ANIDOC 2D Private Owner Studio" />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (17 modules including Logout) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 px-4">
          <Link to="/" className="focus:outline-none">
            <AnidocLogo />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-[#929292]"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveModule(item.key);
                  if (item.key !== 'editVideos') setEditingVideo(null);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#171717] dark:bg-[#D4AF62] text-[#FFFFFF] dark:text-[#090909] font-semibold'
                    : 'text-[#525252] dark:text-[#929292] hover:bg-[#E9E6DF]/60 dark:hover:bg-[#090909]/60 hover:text-[#171717] dark:hover:text-[#F4F1EB]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 p-3 space-y-2">
          <div className="px-2 py-1 text-[11px] text-[#6B6B6B] dark:text-[#929292]">
            <p className="font-semibold text-[#171717] dark:text-[#F4F1EB] truncate">{auth.user.name}</p>
            <p className="font-mono uppercase">{auth.user.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[38px] w-full items-center gap-2.5 rounded-sm border border-[#B8202D]/30 px-3 py-1.5 text-xs font-semibold text-[#B8202D] dark:text-[#C92332] hover:bg-[#B8202D]/10 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.owner.navItems.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#F7F5F0]/95 dark:bg-[#090909]/95 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15"
              aria-label="Open dashboard menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold truncate sm:text-2xl">{activeNavLabel}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3 py-1.5 text-xs font-medium hover:border-[#A47A2C] dark:hover:border-[#D4AF62]"
            >
              <span>Public Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              {language === 'en' ? 'हिंदी' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-[#D4AF62]" /> : <Moon className="h-4 w-4 text-[#A47A2C]" />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* 1. OVERVIEW */}
          {activeModule === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: language === 'hi' ? 'कुल वीडियो' : 'Total Videos', val: overview.totalVideos },
                  { label: language === 'hi' ? 'प्रकाशित' : 'Published', val: overview.publishedVideos },
                  { label: language === 'hi' ? 'ड्राफ्ट' : 'Drafts', val: overview.draftVideos },
                  { label: language === 'hi' ? 'डेमो रिकॉर्ड' : 'Demo Records', val: overview.demoRecords },
                  { label: language === 'hi' ? 'श्रेणियाँ' : 'Categories', val: overview.categoriesCount },
                  { label: language === 'hi' ? 'संदेश' : 'Contact Messages', val: overview.contactMessagesCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-4"
                  >
                    <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">{stat.label}</p>
                    <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{stat.val}</p>
                  </div>
                ))}
              </div>

              {overview.demoRecords > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#D4AF62]/50 bg-[#D4AF62]/10 p-4">
                  <div className="text-sm">
                    <span className="font-semibold">
                      {overview.demoRecords} demo sample record(s) active.
                    </span>{' '}
                    <span className="text-[#525252] dark:text-[#929292]">
                      Demo records are clearly marked and can be bulk-removed anytime from the Video Library.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoStatusFilter('demo');
                      setActiveModule('videos');
                    }}
                    className="min-h-[38px] rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-4 py-1.5 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
                  >
                    Manage Demo Records
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl font-semibold">Quick Actions</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveModule('addVideo')}
                      className="min-h-[40px] rounded-sm bg-[#C92332] px-4 py-2 text-xs font-semibold text-[#F4F1EB] cursor-pointer"
                    >
                      + Add New YouTube Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('messages')}
                      className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      View Messages ({overview.unreadMessagesCount} new)
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setActiveModule('backup')}
                        className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-4 py-2 text-xs font-semibold cursor-pointer"
                      >
                        Backup Snapshot
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-2">
                  <h2 className="font-serif text-xl font-semibold">Channel & Storage Summary</h2>
                  <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">
                    Verified Channel Records: <span className="font-mono tabular-nums">{overview.realVideos}</span> · Shorts:{' '}
                    <span className="font-mono tabular-nums">{overview.shortsCount}</span> · Custom Uploads:{' '}
                    <span className="font-mono tabular-nums">{overview.mediaCount}</span>
                  </p>
                  <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">
                    No fabricated YouTube statistics or mock analytics are displayed. All counts reflect real database
                    records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. VIDEO LIBRARY (with bulk demo selection & deletion) */}
          {activeModule === 'videos' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'published', 'draft', 'demo'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setVideoStatusFilter(f)}
                      className={`min-h-[38px] rounded-sm px-3 py-1.5 text-xs font-semibold capitalize cursor-pointer ${
                        videoStatusFilter === f
                          ? 'bg-[#171717] dark:bg-[#D4AF62] text-[#FFFFFF] dark:text-[#090909]'
                          : 'border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    placeholder="Search title or YouTube ID..."
                    className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] px-3 text-xs"
                  />
                  {demoVideos.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleSelectAllDemos}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-sm border border-[#A47A2C]/50 px-3 py-1.5 text-xs font-semibold text-[#A47A2C] dark:text-[#D4AF62] cursor-pointer"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Select all demo records ({demoVideos.length})</span>
                      </button>
                      {selectedDemoIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDemosOpen(true)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-sm bg-[#B8202D] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete selected demo records ({selectedDemoIds.length})</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 text-[#6B6B6B] dark:text-[#929292]">
                    <tr>
                      <th className="px-3 py-3">Sel</th>
                      <th className="px-3 py-3">Thumbnail</th>
                      <th className="px-3 py-3">Title (EN / HI)</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Order</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171717]/10 dark:divide-[#F4F1EB]/10">
                    {filteredVideos.map((v, idx) => (
                      <tr key={v.id}>
                        <td className="px-3 py-3">
                          {v.is_demo === 1 ? (
                            <input
                              type="checkbox"
                              aria-label={`Select demo ${v.title_en || v.title_hi}`}
                              checked={selectedDemoIds.includes(v.id)}
                              onChange={(e) =>
                                setSelectedDemoIds((prev) =>
                                  e.target.checked ? [...prev, v.id] : prev.filter((id) => id !== v.id)
                                )
                              }
                              className="h-4 w-4 accent-[#B8202D]"
                            />
                          ) : (
                            <span className="text-[#929292]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 w-28">
                          <VideoThumbnail
                            youtubeId={v.youtube_id}
                            customThumbnailUrl={v.custom_thumbnail_url}
                            alt={v.title_en || v.title_hi}
                            showPlayAffordance={false}
                            className="w-24 rounded-sm"
                          />
                        </td>
                        <td className="px-3 py-3 max-w-xs">
                          <p className="font-semibold line-clamp-1">
                            {getBilingualText(language, v.title_en, v.title_hi).text}
                          </p>
                          <p className="text-[11px] text-[#929292] font-mono">
                            {v.youtube_id || 'No YT ID'} {v.is_demo === 1 ? '· DEMO' : ''}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono">{v.format === 'short' ? 'Short' : '16:9'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(v)}
                            className={`inline-flex items-center gap-1 font-semibold cursor-pointer ${
                              v.status === 'published'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-[#A47A2C] dark:text-[#D4AF62]'
                            }`}
                          >
                            {v.status === 'published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            <span>{v.status === 'published' ? 'Published' : 'Draft'}</span>
                          </button>
                        </td>
                        <td className="px-3 py-3 font-mono tabular-nums">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              aria-label={`Display order for ${v.title_en || v.title_hi}`}
                              value={orderDrafts[v.id] ?? v.display_order}
                              onChange={(e) =>
                                setOrderDrafts((prev) => ({
                                  ...prev,
                                  [v.id]: Number(e.target.value),
                                }))
                              }
                              onBlur={() => {
                                const val = orderDrafts[v.id] ?? v.display_order;
                                if (val !== v.display_order) {
                                  handleSaveDisplayOrder(v, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveDisplayOrder(v, orderDrafts[v.id] ?? v.display_order);
                                }
                              }}
                              className="w-14 rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-1.5 py-1 text-center text-xs tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => handleMoveToTop(v.id)}
                              title={language === 'hi' ? 'शीर्ष पर ले जाएँ' : 'Move to Top'}
                              className="inline-flex items-center gap-0.5 rounded-sm border border-[#A47A2C]/40 px-1.5 py-1 text-[11px] font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:bg-[#D4AF62]/15 cursor-pointer"
                            >
                              <ArrowUpToLine className="h-3 w-3" />
                              <span>{language === 'hi' ? 'शीर्ष' : 'Top'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(idx, -1, filteredVideos)}
                              className="p-1 hover:text-[#D4AF62] cursor-pointer"
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(idx, 1, filteredVideos)}
                              className="p-1 hover:text-[#D4AF62] cursor-pointer"
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right space-x-2.5 whitespace-nowrap">
                          {v.format === 'long' && (
                            <button
                              type="button"
                              onClick={() => handleSetMainFeatured(v)}
                              className={`font-semibold cursor-pointer ${
                                v.is_featured === 1
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-[#6B6B6B] dark:text-[#929292] hover:text-[#D4AF62]'
                              }`}
                            >
                              {v.is_featured === 1 ? '★ Featured' : 'Set Featured'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVideo(v);
                              setActiveModule('editVideos');
                            }}
                            className="font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteVideo(v)}
                            className="font-semibold text-[#B8202D] dark:text-[#C92332] hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. ADD NEW VIDEO */}
          {activeModule === 'addVideo' && (
            <VideoEditorForm
              categories={adminCategories}
              onSaved={async () => {
                await loadAdminData();
              }}
            />
          )}

          {/* 4. EDIT VIDEOS */}
          {activeModule === 'editVideos' && (
            <div className="space-y-6">
              {!editingVideo ? (
                <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-4">
                  <h2 className="font-serif text-xl font-semibold">Select a Video to Edit</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {adminVideos.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setEditingVideo(v)}
                        className="flex items-center gap-3 rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-3 text-left hover:border-[#A47A2C] dark:hover:border-[#D4AF62] cursor-pointer"
                      >
                        <VideoThumbnail
                          youtubeId={v.youtube_id}
                          customThumbnailUrl={v.custom_thumbnail_url}
                          alt={v.title_en || v.title_hi}
                          showPlayAffordance={false}
                          className="w-24 shrink-0 rounded-sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">
                            {getBilingualText(language, v.title_en, v.title_hi).text}
                          </p>
                          <p className="text-xs text-[#929292]">
                            {v.status} · {v.format}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <VideoEditorForm
                  initialVideo={editingVideo}
                  categories={adminCategories}
                  onSaved={async (updated) => {
                    setEditingVideo(updated);
                    await loadAdminData();
                  }}
                  onCancel={() => setEditingVideo(null)}
                />
              )}
            </div>
          )}

          {/* 5. SHORTS MANAGEMENT */}
          {activeModule === 'shorts' && (
            <div className="space-y-6">
              <VideoEditorForm
                defaultFormat="short"
                categories={adminCategories}
                onSaved={async () => {
                  await loadAdminData();
                }}
              />
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4">
                <h3 className="font-serif text-xl font-semibold">Existing Shorts</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                  {adminVideos
                    .filter((v) => v.format === 'short')
                    .map((s) => (
                      <div key={s.id} className="space-y-2">
                        <VideoThumbnail
                          youtubeId={s.youtube_id}
                          customThumbnailUrl={s.custom_thumbnail_url}
                          alt={s.title_hi || s.title_en}
                          aspect="9/16"
                          className="rounded-sm"
                        />
                        <p className="text-xs font-semibold line-clamp-2">
                          {getBilingualText(language, s.title_en, s.title_hi).text}
                        </p>
                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s)}
                            className="font-semibold text-[#A47A2C] dark:text-[#D4AF62] cursor-pointer"
                          >
                            {s.status}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteVideo(s)}
                            className="text-[#B8202D] dark:text-[#C92332] cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. FEATURED VIDEOS & PRIORITY ORDERING */}
          {activeModule === 'featured' && (
            <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4">
              <div>
                <h2 className="font-serif text-xl font-semibold">Homepage Featured, Priority Order & Trending Curation</h2>
                <p className="text-xs text-[#6B6B6B] dark:text-[#929292] mt-1">
                  Control which documentary appears as the main Homepage Spotlight and adjust homepage ordering.
                </p>
              </div>
              <div className="divide-y divide-[#171717]/10 dark:divide-[#F4F1EB]/10">
                {adminVideos
                  .filter((v) => v.format === 'long')
                  .map((v, idx, longList) => (
                    <div key={v.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <VideoThumbnail
                          youtubeId={v.youtube_id}
                          customThumbnailUrl={v.custom_thumbnail_url}
                          alt={v.title_en || v.title_hi}
                          showPlayAffordance={false}
                          className="w-20 shrink-0 rounded-sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {getBilingualText(language, v.title_en, v.title_hi).text}
                          </p>
                          <p className="text-xs text-[#929292]">
                            {v.status} · Order #{v.display_order}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleMoveToTop(v.id)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-2.5 py-1 font-semibold hover:border-[#A47A2C] dark:hover:border-[#D4AF62] cursor-pointer"
                        >
                          <ArrowUpToLine className="h-3.5 w-3.5" />
                          <span>Move to Top</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, -1, longList)}
                          className="inline-flex min-h-[36px] items-center rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-2 py-1 hover:border-[#A47A2C] cursor-pointer"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 1, longList)}
                          className="inline-flex min-h-[36px] items-center rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-2 py-1 hover:border-[#A47A2C] cursor-pointer"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetMainFeatured(v)}
                          className={`min-h-[36px] rounded-sm px-3 py-1 font-semibold cursor-pointer ${
                            v.is_featured === 1
                              ? 'bg-[#D4AF62] text-[#090909]'
                              : 'border border-[#171717]/15 dark:border-[#F4F1EB]/15'
                          }`}
                        >
                          {v.is_featured === 1 ? 'Main Featured' : 'Set as Featured'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(v, 'is_trending')}
                          className={`min-h-[36px] rounded-sm px-3 py-1 font-semibold cursor-pointer ${
                            v.is_trending === 1
                              ? 'bg-[#C92332] text-white'
                              : 'border border-[#171717]/15 dark:border-[#F4F1EB]/15'
                          }`}
                        >
                          {v.is_trending === 1 ? 'Trending' : 'Mark Trending'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 7. CATEGORIES */}
          {activeModule === 'categories' && (
            <CategoriesPanel categories={adminCategories} isOwner={isOwner} onRefreshAll={loadAdminData} />
          )}

          {/* 8. HOMEPAGE EDITOR */}
          {activeModule === 'homepage' && (
            <HomepageEditorPanel sections={adminSections} onRefreshAll={loadAdminData} />
          )}

          {/* 9. MEDIA LIBRARY */}
          {activeModule === 'media' && <MediaLibraryPanel assets={adminMedia} onRefreshAll={loadAdminData} />}

          {/* 10. CONTACT MESSAGES */}
          {activeModule === 'messages' && (
            <MessagesPanel messages={adminMessages} isOwner={isOwner} onRefreshAll={loadAdminData} />
          )}

          {/* 11-14. SETTINGS */}
          {(activeModule === 'seo' ||
            activeModule === 'language' ||
            activeModule === 'theme' ||
            activeModule === 'settings') &&
            adminSettings && (
              <SettingsPanel
                mode={activeModule === 'settings' ? 'website' : activeModule}
                settings={adminSettings}
                videos={adminVideos}
                users={adminUsers}
                isOwner={isOwner}
                onRefreshAll={loadAdminData}
              />
            )}

          {/* 15. OWNER PROFILE & PUBLIC CONTACT */}
          {activeModule === 'profile' && adminSettings && (
            <OwnerProfilePanel
              photos={ownerPhotos}
              settings={adminSettings}
              isOwner={isOwner}
              onRefreshAll={loadAdminData}
            />
          )}

          {/* 16. BACKUP & RECOVERY */}
          {activeModule === 'backup' && (
            <BackupPanel backups={adminBackups} isOwner={isOwner} onRefreshAll={loadAdminData} />
          )}

          {/* 17. AUDIT LOGS */}
          {activeModule === 'audit' && <AuditLogsPanel logs={adminLogs} isOwner={isOwner} />}
        </main>
      </div>

      {/* Confirmation Modal: Bulk Delete Demo Records */}
      {confirmDeleteDemosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-sm border border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-4">
            <h3 className="font-serif text-xl font-semibold">Confirm Permanent Demo Deletion</h3>
            <p className="text-sm text-[#525252] dark:text-[#929292]">
              Permanently delete {selectedDemoIds.length} selected demo record(s) from the database? This cannot be
              undone, and they will immediately disappear from the public website.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteDemosOpen(false)}
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-4 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteDemos}
                className="min-h-[38px] rounded-sm bg-[#B8202D] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
              >
                Delete Selected Demos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Video */}
      {confirmDeleteVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-sm border border-[#F4F1EB]/15 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-4">
            <h3 className="font-serif text-xl font-semibold">Confirm Video Deletion</h3>
            <p className="text-sm text-[#525252] dark:text-[#929292]">
              Permanently delete{' '}
              <span className="font-semibold text-[#171717] dark:text-[#F4F1EB]">
                {confirmDeleteVideo.title_en || confirmDeleteVideo.title_hi}
              </span>{' '}
              and any unreferenced uploaded thumbnail?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteVideo(null)}
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 px-4 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingleVideo(confirmDeleteVideo)}
                className="min-h-[38px] rounded-sm bg-[#B8202D] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
