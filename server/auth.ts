import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db, mapUserRow } from './db.ts';
import type { UserRow } from './db.ts';
import type { AuthUser } from '../src/types.ts';

// Session signing secret: reads from process.env with a secure in-memory random fallback
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexHash] = parts;
  const expected = Buffer.from(hexHash, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function safeComparePlaintext(provided: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function getEnvPasscodeForEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (normalized === 'imcabezas@usbcali.edu.co' && process.env.DIRECTOR_PASSCODE?.trim()) {
    return process.env.DIRECTOR_PASSCODE.trim();
  }
  if (process.env.PRESIDENT_PASSCODE?.trim()) {
    const presidentRow = db
      .prepare(
        `SELECT email FROM users WHERE role = 'Presidente del Semillero' AND status = 'aprobada' AND lower(email) = ?`
      )
      .get(normalized) as { email: string } | undefined;
    if (presidentRow) {
      return process.env.PRESIDENT_PASSCODE.trim();
    }
  }
  return null;
}

export function signAuthToken(userId: string, tokenVersion = 1): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      ver: tokenVersion,
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function verifyAuthToken(token: string): { sub: string; ver: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      ver?: number;
      exp?: number;
    };
    if (!parsed.sub || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return { sub: parsed.sub, ver: typeof parsed.ver === 'number' ? parsed.ver : 1 };
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export function getAuthenticatedUserFromRequest(req: Request): AuthUser | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  const verified = verifyAuthToken(token);
  if (!verified) return null;

  const row = db
    .prepare(
      `SELECT id, name, email, password_hash, role, program, avatar_initials, color, member_record_id, status, account_request_id, deactivation_reason, deactivation_date, token_version
       FROM users WHERE id = ?`
    )
    .get(verified.sub) as UserRow | undefined;

  if (!row) return null;
  if (row.status === 'desactivada' || row.status === 'graduado' || row.status === 'retirado') {
    return null;
  }
  const currentVersion = typeof row.token_version === 'number' ? row.token_version : 1;
  if (verified.ver !== currentVersion) {
    return null;
  }

  return mapUserRow(row);
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = getAuthenticatedUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Debes iniciar sesión como miembro activo para realizar esta acción.' });
    return;
  }
  req.authUser = user;
  next();
}

export function requireDirector(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = getAuthenticatedUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Sesión requerida.' });
    return;
  }
  const isDirector =
    user.role === 'Docente Director' || user.email.toLowerCase() === 'imcabezas@usbcali.edu.co';
  if (!isDirector) {
    res.status(403).json({
      error: 'Acción reservada exclusivamente para el Docente Director del Semillero.',
    });
    return;
  }
  req.authUser = user;
  next();
}
