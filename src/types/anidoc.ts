export type Language = 'en' | 'hi';
export type ThemeMode = 'dark' | 'light';
export type VideoFormat = 'long' | 'short';
export type VideoStatus = 'draft' | 'published';
export type UserRole = 'owner' | 'editor';

export interface Category {
  id: number;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en: string;
  description_hi: string;
  sort_order: number;
  created_at: string;
}

export interface VideoRecord {
  id: number;
  slug: string;
  youtube_url: string;
  youtube_id: string;
  format: VideoFormat;
  title_en: string;
  title_hi: string;
  description_en: string;
  description_hi: string;
  category_id: number | null;
  category_slug?: string | null;
  category_name_en?: string | null;
  category_name_hi?: string | null;
  custom_thumbnail_url: string | null;
  status: VideoStatus;
  is_featured: number;
  is_trending: number;
  is_demo: number;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  section_key: string;
  title_en: string;
  title_hi: string;
  subtitle_en: string;
  subtitle_hi: string;
  cta_label_en: string;
  cta_label_hi: string;
  is_visible: number;
  sort_order: number;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  youtube_channel_url: string;
  default_language: Language;
  default_theme: ThemeMode;
  seo_title_en: string;
  seo_title_hi: string;
  seo_description_en: string;
  seo_description_hi: string;
  seo_keywords: string;
  canonical_base_url: string;
  about_en: string;
  about_hi: string;
  privacy_en: string;
  privacy_hi: string;
  terms_en: string;
  terms_hi: string;
  contact_email: string;
  public_contact_name?: string;
  public_contact_mobile?: string;
  show_public_contact?: string;
}

export interface OwnerPhoto {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  caption: string;
  is_public: number;
  sort_order: number;
  created_at: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthStatus {
  ownerExists: boolean;
  authenticated: boolean;
  user: AuthUser | null;
}

export interface MediaAsset {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  alt_text: string;
  uploaded_by: number | null;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  language: Language;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  actor_id: number | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  result: 'success' | 'denied' | 'error';
  details: string;
  ip_address: string;
  created_at: string;
}

export interface BackupRecord {
  id: number;
  created_by: string;
  record_counts_json: string;
  notes: string;
  created_at: string;
}

export interface DashboardOverview {
  totalVideos: number;
  publishedVideos: number;
  draftVideos: number;
  demoRecords: number;
  realVideos: number;
  shortsCount: number;
  categoriesCount: number;
  contactMessagesCount: number;
  unreadMessagesCount: number;
  mediaCount: number;
  auditLogsCount: number;
  editorsCount: number;
}
