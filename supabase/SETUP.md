# ANIDOC 2D — Backend & Supabase Configuration Guide

## Current Active Runtime (Zero-Cost Persistent Backend)
Out of the box, ANIDOC 2D runs on a real, persistent Express + Node.js (`node:sqlite`) backend in `server.ts` with:
- Real SQLite persistence (`data/anidoc.db`)
- Cryptographic `scrypt` password hashing with per-user salts
- HMAC-SHA256 signed `HttpOnly`, `SameSite=Lax` session cookies
- One-time initial Owner setup lock (`/api/auth/setup-owner`)
- Server-side RBAC enforcement on all `/api/admin/*` endpoints
- Safe disk uploads (`/uploads`) with MIME & size validation
- Dynamic `/sitemap.xml` and `/robots.txt`

## Optional External Supabase Migration
If you deploy to an external Supabase project:
1. Create a free Supabase project at https://supabase.com
2. Open **SQL Editor** and execute `supabase/schema.sql` to create all tables and Row-Level Security (RLS) policies.
3. In **Authentication -> Providers -> Email**, disable public signups ("Allow new users to sign up: OFF") after creating the single initial Owner account.
4. Create a Storage bucket named `anidoc-thumbnails` (public read, authenticated staff write).
5. Set environment variables on your server/host:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (Publishable/Anon key — safe for client SDK if using Supabase client)
   - `SUPABASE_SERVICE_ROLE_KEY` (Server-only secret — NEVER expose in `VITE_*` or frontend files)
   - `SESSION_SECRET` (Random 64-char hex string for server session signing)
