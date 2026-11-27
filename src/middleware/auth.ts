import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

function getConfiguredAdminUid(): string {
  return process.env.ADMIN_UID?.trim() || '';
}

function getConfiguredAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || '';
}

/**
 * Returns true only if at least one explicit admin identifier (ADMIN_UID or ADMIN_EMAIL)
 * is configured in environment variables. Never falls back to a hardcoded identity.
 */
export function isAdminConfigured(): boolean {
  return Boolean(getConfiguredAdminUid() || getConfiguredAdminEmail());
}

/**
 * Logs a clear startup error if admin configuration is missing so admin access fails closed
 * while allowing the public read-only directory to remain available.
 */
export function assertAdminConfigAtStartup(): void {
  const adminUid = getConfiguredAdminUid();
  const adminEmail = getConfiguredAdminEmail();

  if (!adminUid && !adminEmail) {
    console.error(
      '[auth] Neither ADMIN_UID nor ADMIN_EMAIL is configured. Admin sign-in and write endpoints will fail closed (403) until configured.'
    );
    return;
  }

  if (adminUid) {
    console.log('[auth] Admin authorization configured via ADMIN_UID.');
  } else {
    console.log(
      '[auth] Admin authorization configured via verified ADMIN_EMAIL (consider setting ADMIN_UID).'
    );
  }
}

/**
 * Authorizes an authenticated Firebase ID token:
 * - If ADMIN_UID is configured, strictly requires token.uid === ADMIN_UID.
 * - Else if ADMIN_EMAIL is configured, requires token.email_verified === true and case-insensitive match.
 * - Otherwise fails closed (false).
 */
export function isAdminUser(user?: DecodedIdToken | null): boolean {
  if (!user) {
    return false;
  }

  const configuredUid = getConfiguredAdminUid();
  if (configuredUid) {
    return user.uid === configuredUid;
  }

  const configuredEmail = getConfiguredAdminEmail();
  if (configuredEmail) {
    return (
      user.email_verified === true &&
      typeof user.email === 'string' &&
      user.email.trim().toLowerCase() === configuredEmail
    );
  }

  return false;
}

// Optional auth parser for public routes (e.g., GET /api/resources) that behave differently for the admin.
export async function attachOptionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) {
      try {
        req.user = await adminAuth.verifyIdToken(token);
      } catch {
        // Ignore invalid/expired tokens on public reads; treat caller as an anonymous visitor.
      }
    }
  }
  next();
}

// Strict fail-closed admin guard: verifies a valid Firebase ID token and explicit server admin configuration.
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!isAdminConfigured()) {
      return res.status(403).json({
        error:
          'Admin access is disabled until ADMIN_UID or ADMIN_EMAIL is configured on the server.',
      });
    }

    if (!isAdminUser(decodedToken)) {
      return res.status(403).json({
        error: 'Forbidden: Account is not authorized for admin access.',
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res
      .status(401)
      .json({ error: 'Unauthorized: Invalid authentication token.' });
  }
}
