import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import type {
  AuditLogEntry,
  AuthUser,
  BackupRecord,
  Category,
  ContactMessage,
  HomepageSection,
  MediaAsset,
  OwnerPhoto,
  SiteSettings,
  VideoRecord,
} from '../../types/anidoc.ts';

interface CommonProps {
  onRefreshAll: () => Promise<void>;
}

/* ---------- 7. CATEGORIES PANEL ---------- */
export const CategoriesPanel: React.FC<
  CommonProps & { categories: Category[]; isOwner: boolean }
> = ({ categories, isOwner, onRefreshAll }) => {
  const { language } = useApp();
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descHi, setDescHi] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_en: nameEn,
        name_hi: nameHi,
        description_en: descEn,
        description_hi: descHi,
        sort_order: sortOrder,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Failed to save category.');
      return;
    }
    setNameEn('');
    setNameHi('');
    setDescEn('');
    setDescHi('');
    setSortOrder(0);
    setEditingId(null);
    setStatusMsg(language === 'hi' ? 'श्रेणी सहेजी गई।' : 'Category saved.');
    await onRefreshAll();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(language === 'hi' ? 'क्या इस श्रेणी को हटाना है?' : 'Delete this category?')) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) await onRefreshAll();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4"
      >
        <h3 className="font-serif text-xl font-semibold text-[#171717] dark:text-[#F4F1EB]">
          {editingId
            ? language === 'hi'
              ? 'श्रेणी संपादित करें'
              : 'Edit Category'
            : language === 'hi'
              ? 'नई श्रेणी जोड़ें'
              : 'Create Category'}
        </h3>
        {errorMsg && <p className="text-xs text-[#B8202D] dark:text-[#C92332]">{errorMsg}</p>}
        {statusMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{statusMsg}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            required
            placeholder="English Name"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
          />
          <input
            required
            placeholder="हिंदी नाम"
            value={nameHi}
            onChange={(e) => setNameHi(e.target.value)}
            className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm tabular-nums"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            placeholder="English Description"
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
          />
          <input
            placeholder="हिंदी विवरण"
            value={descHi}
            onChange={(e) => setDescHi(e.target.value)}
            className="min-h-[40px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-4 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{editingId ? 'Update Category' : 'Add Category'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNameEn('');
                setNameHi('');
                setDescEn('');
                setDescHi('');
              }}
              className="text-xs text-[#929292] hover:underline cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 text-xs text-[#6B6B6B] dark:text-[#929292]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">Hindi</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/10 dark:divide-[#F4F1EB]/10">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3 font-mono tabular-nums">{cat.sort_order}</td>
                <td className="px-4 py-3 font-medium">{cat.name_en}</td>
                <td className="px-4 py-3">{cat.name_hi}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#929292]">{cat.slug}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(cat.id);
                      setNameEn(cat.name_en);
                      setNameHi(cat.name_hi);
                      setDescEn(cat.description_en);
                      setDescHi(cat.description_hi);
                      setSortOrder(cat.sort_order);
                    }}
                    className="text-xs font-semibold text-[#A47A2C] dark:text-[#D4AF62] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className="text-xs font-semibold text-[#B8202D] dark:text-[#C92332] hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- 8. HOMEPAGE EDITOR ---------- */
export const HomepageEditorPanel: React.FC<
  CommonProps & { sections: HomepageSection[] }
> = ({ sections, onRefreshAll }) => {
  const { language } = useApp();
  const [draftSections, setDraftSections] = useState<HomepageSection[]>(sections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setDraftSections(sections);
  }, [sections]);

  const updateField = (key: string, field: keyof HomepageSection, val: string | number) => {
    setDraftSections((prev) =>
      prev.map((s) => (s.section_key === key ? { ...s, [field]: val } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/admin/homepage-sections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: draftSections }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      await onRefreshAll();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#525252] dark:text-[#929292]">
          {language === 'hi'
            ? 'होमपेज अनुभागों के शीर्षक, उपशीर्षक और दृश्यता को संपादित करें।'
            : 'Customize English and Hindi headings, subtitles, CTAs, and section visibility on the public homepage.'}
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="min-h-[40px] shrink-0 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save All Sections'}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-sm border border-emerald-600/30 bg-emerald-600/10 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Homepage sections updated.</span>
        </div>
      )}

      <div className="space-y-4">
        {draftSections.map((sec) => (
          <div
            key={sec.section_key}
            className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-semibold text-[#A47A2C] dark:text-[#D4AF62]">
                {sec.section_key}
              </span>
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={sec.is_visible === 1}
                  onChange={(e) => updateField(sec.section_key, 'is_visible', e.target.checked ? 1 : 0)}
                  className="h-4 w-4 accent-[#A47A2C]"
                />
                <span>Visible on Homepage</span>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={sec.title_en}
                onChange={(e) => updateField(sec.section_key, 'title_en', e.target.value)}
                placeholder="English Title"
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              />
              <input
                value={sec.title_hi}
                onChange={(e) => updateField(sec.section_key, 'title_hi', e.target.value)}
                placeholder="हिंदी शीर्षक"
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              />
              <input
                value={sec.subtitle_en}
                onChange={(e) => updateField(sec.section_key, 'subtitle_en', e.target.value)}
                placeholder="English Subtitle"
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              />
              <input
                value={sec.subtitle_hi}
                onChange={(e) => updateField(sec.section_key, 'subtitle_hi', e.target.value)}
                placeholder="हिंदी उपशीर्षक"
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              />
              <input
                value={sec.cta_label_en}
                onChange={(e) => updateField(sec.section_key, 'cta_label_en', e.target.value)}
                placeholder="CTA Label (EN)"
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              />
              <input
                value={sec.cta_label_hi}
                onChange={(e) => updateField(sec.section_key, 'cta_label_hi', e.target.value)}
                placeholder="CTA लेबल (HI)"
                className="min-h-[38px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- 9. MEDIA LIBRARY ---------- */
export const MediaLibraryPanel: React.FC<CommonProps & { assets: MediaAsset[] }> = ({
  assets,
  onRefreshAll,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_text', file.name);
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        return;
      }
      await onRefreshAll();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this uploaded asset from disk and database?')) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    if (res.ok) await onRefreshAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5">
        <div>
          <h3 className="font-serif text-xl font-semibold">Custom Thumbnail Uploads</h3>
          <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">
            JPG, PNG, or WebP up to 3 MB. Only use custom uploads when a YouTube thumbnail requires override.
          </p>
        </div>
        <label className="inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-4 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer">
          <Upload className="h-4 w-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {error && <p className="text-xs text-[#B8202D] dark:text-[#C92332]">{error}</p>}

      {assets.length === 0 ? (
        <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-10 text-center text-sm text-[#929292]">
          No custom media assets uploaded yet. Active videos use their authentic YouTube thumbnails.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-3 space-y-3"
            >
              <img
                src={asset.url}
                alt={asset.alt_text || asset.original_name}
                className="aspect-video w-full rounded-sm object-cover bg-[#090909]"
              />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{asset.original_name}</span>
                <span className="font-mono text-[#929292] tabular-nums">
                  {Math.round(asset.size_bytes / 1024)} KB
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#171717]/10 dark:border-[#F4F1EB]/10">
                <code className="truncate text-[11px] text-[#929292]">{asset.url}</code>
                <button
                  type="button"
                  onClick={() => handleDelete(asset.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8202D] dark:text-[#C92332] hover:underline cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- 10. CONTACT MESSAGES ---------- */
export const MessagesPanel: React.FC<
  CommonProps & { messages: ContactMessage[]; isOwner: boolean }
> = ({ messages, isOwner, onRefreshAll }) => {
  const updateStatus = async (id: number, status: 'new' | 'read' | 'archived') => {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await onRefreshAll();
  };

  const deleteMessage = async (id: number) => {
    if (!window.confirm('Delete this contact message permanently?')) return;
    const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    if (res.ok) await onRefreshAll();
  };

  if (messages.length === 0) {
    return (
      <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-12 text-center text-sm text-[#929292]">
        No contact messages received yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-semibold">{msg.subject}</h3>
              <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">
                {msg.name} · <span className="font-mono">{msg.email}</span> · {msg.language.toUpperCase()} ·{' '}
                <span className="tabular-nums">{new Date(msg.created_at).toLocaleString()}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={msg.status}
                onChange={(e) => updateStatus(msg.id, e.target.value as 'new' | 'read' | 'archived')}
                className="min-h-[34px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-2.5 text-xs"
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => deleteMessage(msg.id)}
                  className="text-xs font-semibold text-[#B8202D] dark:text-[#C92332] hover:underline cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#404040] dark:text-[#F4F1EB]/85">
            {msg.message}
          </p>
        </div>
      ))}
    </div>
  );
};

/* ---------- 11, 12, 13, 14. SETTINGS PANELS (SEO / LANGUAGE / THEME / WEBSITE + USERS) ---------- */
export const SettingsPanel: React.FC<
  CommonProps & {
    mode: 'seo' | 'language' | 'theme' | 'website';
    settings: SiteSettings;
    videos: VideoRecord[];
    users: AuthUser[];
    isOwner: boolean;
  }
> = ({ mode, settings, videos, users, isOwner, onRefreshAll }) => {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // Invite editor state
  const [edName, setEdName] = useState('');
  const [edEmail, setEdEmail] = useState('');
  const [edPassword, setEdPassword] = useState('');

  React.useEffect(() => {
    setForm(settings);
  }, [settings]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setErr(data.error || 'Failed to save settings.');
      return;
    }
    setMsg('Settings updated.');
    await onRefreshAll();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || 'Password update failed.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setMsg('Password updated successfully.');
  };

  const handleInviteEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const res = await fetch('/api/auth/invite-editor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: edName, email: edEmail, password: edPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || 'Invite failed.');
      return;
    }
    setEdName('');
    setEdEmail('');
    setEdPassword('');
    setMsg(`Limited Editor account created for ${data.editor.email}.`);
    await onRefreshAll();
  };

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-sm border border-[#B8202D]/40 bg-[#B8202D]/10 px-4 py-3 text-xs text-[#B8202D] dark:text-[#F4F1EB]">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-sm border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">
          {msg}
        </div>
      )}

      <form
        onSubmit={saveSettings}
        className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-5"
      >
        {mode === 'seo' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold">Search Engine & OpenGraph Settings</h3>
              <div className="flex items-center gap-3 text-xs">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
                >
                  <span>sitemap.xml</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#A47A2C] dark:text-[#D4AF62] hover:underline"
                >
                  <span>robots.txt</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Default Meta Title (English)</label>
                <input
                  value={form.seo_title_en}
                  onChange={(e) => setForm({ ...form, seo_title_en: e.target.value })}
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Default Meta Title (Hindi)</label>
                <input
                  value={form.seo_title_hi}
                  onChange={(e) => setForm({ ...form, seo_title_hi: e.target.value })}
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Meta Description (English)</label>
                <textarea
                  rows={3}
                  value={form.seo_description_en}
                  onChange={(e) => setForm({ ...form, seo_description_en: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Meta Description (Hindi)</label>
                <textarea
                  rows={3}
                  value={form.seo_description_hi}
                  onChange={(e) => setForm({ ...form, seo_description_hi: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Keywords</label>
                <input
                  value={form.seo_keywords}
                  onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Canonical Base URL (Optional)</label>
                <input
                  value={form.canonical_base_url}
                  onChange={(e) => setForm({ ...form, canonical_base_url: e.target.value })}
                  placeholder="https://anidoc2d.com"
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {mode === 'language' && (
          <div className="space-y-5">
            <h3 className="font-serif text-xl font-semibold">Bilingual Language Defaults & Coverage</h3>
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold">Default Visitor Language</label>
              <select
                value={form.default_language}
                onChange={(e) => setForm({ ...form, default_language: e.target.value as 'en' | 'hi' })}
                className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-4">
                <p className="text-xs text-[#929292]">Videos with English Titles</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {videos.filter((v) => v.title_en.trim()).length} / {videos.length}
                </p>
              </div>
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-4">
                <p className="text-xs text-[#929292]">Videos with Hindi Titles</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {videos.filter((v) => v.title_hi.trim()).length} / {videos.length}
                </p>
              </div>
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-4">
                <p className="text-xs text-[#929292]">Fully Bilingual Records</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                  {videos.filter((v) => v.title_en.trim() && v.title_hi.trim()).length} / {videos.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {mode === 'theme' && (
          <div className="space-y-5">
            <h3 className="font-serif text-xl font-semibold">Theme System Defaults</h3>
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold">Default Visitor Theme</label>
              <select
                value={form.default_theme}
                onChange={(e) => setForm({ ...form, default_theme: e.target.value as 'dark' | 'light' })}
                className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
              >
                <option value="dark">Dark Theme (Obsidian #090909)</option>
                <option value="light">Light Theme (Warm Off-White #F7F5F0)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-3 space-y-2">
                <div className="h-8 rounded-sm bg-[#090909] border border-white/10" />
                <p className="font-mono">Obsidian #090909</p>
              </div>
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-3 space-y-2">
                <div className="h-8 rounded-sm bg-[#D4AF62]" />
                <p className="font-mono">Champagne #D4AF62</p>
              </div>
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-3 space-y-2">
                <div className="h-8 rounded-sm bg-[#C92332]" />
                <p className="font-mono">Cinematic Red #C92332</p>
              </div>
              <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 p-3 space-y-2">
                <div className="h-8 rounded-sm bg-[#F7F5F0] border border-black/10" />
                <p className="font-mono">Off-White #F7F5F0</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'website' && (
          <div className="space-y-5">
            <h3 className="font-serif text-xl font-semibold">General Website & Legal Content</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Site Name</label>
                <input
                  value={form.site_name}
                  onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">YouTube Channel URL</label>
                <input
                  value={form.youtube_channel_url}
                  onChange={(e) => setForm({ ...form, youtube_channel_url: e.target.value })}
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Editorial Contact Email</label>
                <input
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">About Page (English)</label>
                <textarea
                  rows={4}
                  value={form.about_en}
                  onChange={(e) => setForm({ ...form, about_en: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">About Page (Hindi)</label>
                <textarea
                  rows={4}
                  value={form.about_hi}
                  onChange={(e) => setForm({ ...form, about_hi: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Privacy Policy (English)</label>
                <textarea
                  rows={4}
                  value={form.privacy_en}
                  onChange={(e) => setForm({ ...form, privacy_en: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Privacy Policy (Hindi)</label>
                <textarea
                  rows={4}
                  value={form.privacy_hi}
                  onChange={(e) => setForm({ ...form, privacy_hi: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Terms of Use (English)</label>
                <textarea
                  rows={4}
                  value={form.terms_en}
                  onChange={(e) => setForm({ ...form, terms_en: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Terms of Use (Hindi)</label>
                <textarea
                  rows={4}
                  value={form.terms_hi}
                  onChange={(e) => setForm({ ...form, terms_hi: e.target.value })}
                  className="w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {isOwner ? (
          <button
            type="submit"
            disabled={saving}
            className="min-h-[42px] rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        ) : (
          <p className="text-xs text-[#929292]">Only the Owner account can modify site-wide settings.</p>
        )}
      </form>

      {mode === 'website' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form
            onSubmit={handlePasswordChange}
            className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4"
          >
            <h4 className="font-serif text-lg font-semibold">Change Your Password</h4>
            <input
              type="password"
              required
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
            />
            <input
              type="password"
              required
              placeholder="New Password (8+ characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
            />
            <button
              type="submit"
              className="min-h-[40px] rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Update Password
            </button>
          </form>

          {isOwner && (
            <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#A47A2C] dark:text-[#D4AF62]" />
                <h4 className="font-serif text-lg font-semibold">Team & Limited Editor Invitation</h4>
              </div>
              <form onSubmit={handleInviteEditor} className="space-y-3">
                <input
                  required
                  placeholder="Editor Name"
                  value={edName}
                  onChange={(e) => setEdName(e.target.value)}
                  className="min-h-[38px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
                <input
                  type="email"
                  required
                  placeholder="Editor Email"
                  value={edEmail}
                  onChange={(e) => setEdEmail(e.target.value)}
                  className="min-h-[38px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
                <input
                  type="password"
                  required
                  placeholder="Temporary Password (8+ chars)"
                  value={edPassword}
                  onChange={(e) => setEdPassword(e.target.value)}
                  className="min-h-[38px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
                />
                <button
                  type="submit"
                  className="min-h-[38px] rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-4 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
                >
                  Create Editor Account
                </button>
              </form>
              <div className="border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-3 space-y-1.5 text-xs">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <span>
                      {u.name} (<span className="font-mono">{u.email}</span>)
                    </span>
                    <span className="font-mono uppercase text-[#A47A2C] dark:text-[#D4AF62]">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- 15. BACKUP & RECOVERY ---------- */
export const BackupPanel: React.FC<
  CommonProps & { backups: BackupRecord[]; isOwner: boolean }
> = ({ backups, isOwner, onRefreshAll }) => {
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isOwner) {
    return (
      <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 text-sm">
        Backup & Recovery is restricted strictly to the Owner account.
      </div>
    );
  }

  const handleExport = async () => {
    setErr(null);
    setMsg(null);
    const res = await fetch('/api/admin/backup/export');
    if (!res.ok) {
      setErr('Failed to generate backup.');
      return;
    }
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anidoc2d-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Backup downloaded and logged.');
    await onRefreshAll();
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !window.confirm(
        'Restore from this JSON backup? This replaces current videos, categories, homepage sections, and settings with the backup snapshot.'
      )
    ) {
      e.target.value = '';
      return;
    }
    setRestoring(true);
    setErr(null);
    setMsg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Restore failed.');
        return;
      }
      setMsg(`Restored ${data.restoredVideos} videos and ${data.restoredCategories} categories.`);
      await onRefreshAll();
    } catch {
      setErr('Invalid JSON backup file.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {err && <p className="text-xs text-[#B8202D] dark:text-[#C92332]">{err}</p>}
      {msg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-3">
          <h3 className="font-serif text-xl font-semibold">Manual Snapshot Export</h3>
          <p className="text-xs leading-relaxed text-[#525252] dark:text-[#929292]">
            Exports all categories, videos (published & drafts), homepage sections, website settings, and contact
            messages into a portable JSON file. Automated cloud schedules are not active unless configured at the
            hosting/storage layer.
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download Full JSON Backup</span>
          </button>
        </div>

        <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-3">
          <h3 className="font-serif text-xl font-semibold">Restore From Backup File</h3>
          <p className="text-xs leading-relaxed text-[#525252] dark:text-[#929292]">
            Upload a previously exported ANIDOC 2D JSON snapshot to restore catalog records, categories, and settings
            inside a single atomic database transaction. Owner credentials remain untouched.
          </p>
          <label className="inline-flex min-h-[42px] items-center gap-2 rounded-sm border border-[#171717]/20 dark:border-[#F4F1EB]/20 px-5 py-2 text-xs font-semibold cursor-pointer">
            <RotateCcw className="h-4 w-4" />
            <span>{restoring ? 'Restoring...' : 'Select JSON Backup File'}</span>
            <input type="file" accept="application/json,.json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 text-[#6B6B6B] dark:text-[#929292]">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Snapshot Counts</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/10 dark:divide-[#F4F1EB]/10">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#929292]">
                  No backup snapshots exported yet.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono tabular-nums">{new Date(b.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{b.created_by}</td>
                  <td className="px-4 py-3 font-mono">{b.record_counts_json}</td>
                  <td className="px-4 py-3">{b.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- 16. AUDIT LOGS ---------- */
export const AuditLogsPanel: React.FC<{ logs: AuditLogEntry[]; isOwner: boolean }> = ({ logs, isOwner }) => {
  if (!isOwner) {
    return (
      <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 text-sm">
        Audit logs are strictly restricted to the Owner account.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515]">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 text-[#6B6B6B] dark:text-[#929292]">
          <tr>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Record</th>
            <th className="px-4 py-3">Result</th>
            <th className="px-4 py-3">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#171717]/10 dark:divide-[#F4F1EB]/10">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-2.5 font-mono tabular-nums whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-2.5 font-mono">{log.actor_email}</td>
              <td className="px-4 py-2.5 font-mono font-semibold">{log.action}</td>
              <td className="px-4 py-2.5 font-mono">
                {log.entity_type}
                {log.entity_id ? ` #${log.entity_id}` : ''}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={
                    log.result === 'success'
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-[#B8202D] dark:text-[#C92332] font-semibold'
                  }
                >
                  {log.result}
                </span>
              </td>
              <td className="px-4 py-2.5 max-w-xs truncate text-[#525252] dark:text-[#929292]">{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- 17. OWNER PROFILE PHOTOS & PUBLIC CONTACT PANEL ---------- */
export const OwnerProfilePanel: React.FC<
  CommonProps & {
    photos: OwnerPhoto[];
    settings: SiteSettings;
    isOwner: boolean;
  }
> = ({ photos, settings, isOwner, onRefreshAll }) => {
  const { language } = useApp();
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [contactName, setContactName] = useState(settings.public_contact_name || '');
  const [contactMobile, setContactMobile] = useState(settings.public_contact_mobile || '');
  const [showPublicContact, setShowPublicContact] = useState(settings.show_public_contact === '1');
  const [savingContact, setSavingContact] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  React.useEffect(() => {
    setContactName(settings.public_contact_name || '');
    setContactMobile(settings.public_contact_mobile || '');
    setShowPublicContact(settings.show_public_contact === '1');
  }, [settings]);

  if (!isOwner) {
    return (
      <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 text-sm">
        Owner Profile & Public Contact management is strictly restricted to the Owner account.
      </div>
    );
  }

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setErr(null);
    setMsg(null);
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append('files', f));
      if (caption.trim()) fd.append('caption', caption.trim());

      const res = await fetch('/api/admin/owner-photos', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Photo upload failed.');
        return;
      }
      setCaption('');
      setMsg(
        language === 'hi'
          ? `${fileList.length} फ़ोटो निजी रूप से अपलोड किए गए। सार्वजनिक करने के लिए नीचे चुनें।`
          : `${fileList.length} photo(s) uploaded privately. Toggle "Public" below to display any photo publicly.`
      );
      await onRefreshAll();
    } catch {
      setErr('Network error during photo upload.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleTogglePublic = async (photo: OwnerPhoto) => {
    setErr(null);
    const res = await fetch(`/api/admin/owner-photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: photo.is_public === 0 }),
    });
    if (res.ok) await onRefreshAll();
  };

  const handleReplacePhoto = async (photoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/admin/owner-photos/${photoId}/replace`, { method: 'POST', body: fd });
    const data = await res.json();
    e.target.value = '';
    if (!res.ok) {
      setErr(data.error || 'Replace failed.');
      return;
    }
    setMsg('Photo replaced.');
    await onRefreshAll();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected photo(s)?`)) return;
    const res = await fetch('/api/admin/owner-photos/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (res.ok) {
      setSelectedIds([]);
      setMsg('Selected photos deleted.');
      await onRefreshAll();
    }
  };

  const handleDeleteSingle = async (id: number) => {
    if (!window.confirm('Delete this photo permanently?')) return;
    const res = await fetch(`/api/admin/owner-photos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      await onRefreshAll();
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setErr(null);
    setMsg(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          public_contact_name: contactName.trim(),
          public_contact_mobile: contactMobile.trim(),
          show_public_contact: showPublicContact ? '1' : '0',
        },
      }),
    });
    setSavingContact(false);
    if (!res.ok) {
      setErr('Failed to save public contact details.');
      return;
    }
    setMsg('Public contact details saved.');
    await onRefreshAll();
  };

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-sm border border-[#B8202D]/40 bg-[#B8202D]/10 px-4 py-3 text-xs text-[#B8202D] dark:text-[#F4F1EB]">
          {err}
        </div>
      )}
      {msg && (
        <div className="flex items-center gap-2 rounded-sm border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Public Contact Information Editor */}
      <form
        onSubmit={handleSaveContact}
        className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {language === 'hi' ? 'सार्वजनिक संपर्क विवरण' : 'Public Contact Information'}
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">
              {language === 'hi'
                ? 'निजी लॉगिन ईमेल या क्रेडेंशियल कभी सार्वजनिक रूप से नहीं दिखाए जाते।'
                : 'Private login email and credentials are never exposed. Only these fields appear publicly when enabled.'}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={showPublicContact}
              onChange={(e) => setShowPublicContact(e.target.checked)}
              className="h-4 w-4 accent-[#A47A2C]"
            />
            <span>{language === 'hi' ? 'वेबसाइट पर दिखाएँ' : 'Show on Public Website'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">
              {language === 'hi' ? 'प्रदर्शित नाम' : 'Public Display Name'}
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Aryan Dangi"
              className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">
              {language === 'hi' ? 'सार्वजनिक मोबाइल नंबर' : 'Public Mobile Number'}
            </label>
            <input
              value={contactMobile}
              onChange={(e) => setContactMobile(e.target.value)}
              placeholder="7389020530"
              className="min-h-[40px] w-full rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingContact}
          className="min-h-[40px] rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-5 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer"
        >
          {savingContact ? 'Saving...' : 'Save Public Contact Settings'}
        </button>
      </form>

      {/* Owner Profile Photo Multi-Upload & Privacy Controls */}
      <div className="rounded-sm border border-[#171717]/10 dark:border-[#F4F1EB]/10 bg-[#FFFFFF] dark:bg-[#151515] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {language === 'hi' ? 'ओनर प्रोफ़ाइल फ़ोटो संग्रह' : 'Owner Profile & Additional Photos'}
            </h3>
            <p className="text-xs text-[#6B6B6B] dark:text-[#929292]">
              Upload one or multiple photos (JPG, PNG, WebP up to 3 MB each). Newly uploaded photos stay{' '}
              <strong>Private</strong> until you explicitly mark them Public.
            </p>
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-sm bg-[#B8202D] px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-[#171717]/10 dark:border-[#F4F1EB]/10 pb-5">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional photo caption..."
            className="min-h-[40px] flex-1 min-w-[200px] rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] px-3 text-sm"
          />
          <label className="inline-flex min-h-[40px] items-center gap-2 rounded-sm bg-[#171717] dark:bg-[#D4AF62] px-4 py-2 text-xs font-semibold text-[#FFFFFF] dark:text-[#090909] cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Upload One or Multiple Photos'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleMultiUpload}
              className="hidden"
            />
          </label>
        </div>

        {photos.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#929292]">
            No Owner photos uploaded yet. Upload one or more photos above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-sm border border-[#171717]/15 dark:border-[#F4F1EB]/15 bg-[#F7F5F0] dark:bg-[#090909] p-3 space-y-3"
              >
                <div className="relative">
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.original_name}
                    className="aspect-square w-full rounded-sm object-cover"
                  />
                  <label className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-sm bg-black/75 px-2 py-1 text-[11px] text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(photo.id)}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, photo.id] : prev.filter((x) => x !== photo.id)
                        )
                      }
                      className="h-3.5 w-3.5 accent-[#D4AF62]"
                    />
                    <span>Select</span>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium">{photo.caption || photo.original_name}</span>
                  <button
                    type="button"
                    onClick={() => handleTogglePublic(photo)}
                    className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                      photo.is_public === 1
                        ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-[#171717]/10 dark:bg-[#F4F1EB]/10 text-[#6B6B6B] dark:text-[#929292]'
                    }`}
                  >
                    {photo.is_public === 1 ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{photo.is_public === 1 ? 'Public' : 'Private'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#171717]/10 dark:border-[#F4F1EB]/10 pt-2 text-xs">
                  <label className="inline-flex items-center gap-1 font-medium text-[#A47A2C] dark:text-[#D4AF62] hover:underline cursor-pointer">
                    <RefreshCw className="h-3 w-3" />
                    <span>Replace</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleReplacePhoto(photo.id, e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSingle(photo.id)}
                    className="inline-flex items-center gap-1 font-semibold text-[#B8202D] dark:text-[#C92332] hover:underline cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

