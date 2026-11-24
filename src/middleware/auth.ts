import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export function isAdminEmail(email?: string | null): boolean {
  const configuredAdmin = (
    process.env.ADMIN_EMAIL || 'calderonpedraza.lauramichelle@gmail.com'
  )
    .trim()
    .toLowerCase();
  if (!configuredAdmin || !email) {
    return false;
  }
  return email.trim().toLowerCase() === configuredAdmin;
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

// Strict admin guard: verifies a valid Firebase ID token AND checks user.email === process.env.ADMIN_EMAIL.
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!isAdminEmail(decodedToken.email)) {
      return res.status(401).json({ error: 'Unauthorized: Account does not match ADMIN_EMAIL.' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
  }
}
