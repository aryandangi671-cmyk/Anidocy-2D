import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { db, getDataDir, writeAuditLog } from './db.ts';
import type { AuthUser, UserRole } from '../src/types/anidoc.ts';

export const SESSION_COOKIE_NAME = 'anidoc_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }
  const secretPath = path.join(getDataDir(), '.session_secret');
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  return generated;
}

const SECRET = getSessionSecret();

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

interface SessionPayload {
  uid: number;
  role: UserRole;
  exp: number;
}

export function signSessionToken(user: { id: number; role: UserRole }): string {
  const payload: SessionPayload = {
    uid: user.id,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function ownerCount(): number {
  const row = db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE role = 'owner'`).get() as { cnt: number };
  return row?.cnt ?? 0;
}

export function getAuthenticatedUser(req: Request): AuthUser | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = db
    .prepare(`SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?`)
    .get(payload.uid) as AuthUser | undefined;
  return user ?? null;
}

export interface AuthedRequest extends Request {
  authUser?: AuthUser;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = getAuthenticatedUser(req);
  if (!user) {
    writeAuditLog({
      actorEmail: 'anonymous',
      action: 'UNAUTHORIZED_ACCESS',
      entityType: 'api',
      entityId: req.path,
      result: 'denied',
      details: `Blocked unauthenticated request to ${req.method} ${req.originalUrl}`,
      ipAddress: req.ip || '',
    });
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  req.authUser = user;
  next();
}

export function requireOwner(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.authUser.role !== 'owner') {
    writeAuditLog({
      actorId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'FORBIDDEN_OWNER_ACTION',
      entityType: 'api',
      entityId: req.path,
      result: 'denied',
      details: `Editor attempted owner-only endpoint ${req.method} ${req.originalUrl}`,
      ipAddress: req.ip || '',
    });
    res.status(403).json({ error: 'Owner authorization required.' });
    return;
  }
  next();
}
