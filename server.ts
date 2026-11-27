import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createResource,
  deleteResource,
  getAllResourcesForAdmin,
  getExistingTagVocabulary,
  getPublicResources,
  updateResource,
} from './src/db/resources.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  assertAdminConfigAtStartup,
  attachOptionalAuth,
  type AuthRequest,
  isAdminConfigured,
  isAdminUser,
  requireAdmin,
} from './src/middleware/auth.ts';
import { classifyResourceInput } from './src/lib/ai-classifier.ts';
import {
  searchResourcesWithAI,
  type AISearchResult,
} from './src/lib/ai-search.ts';
import { inspectPastedUrl } from './src/lib/url-metadata.ts';
import { validateResourcePayload } from './src/shared/validation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Simple sliding-window rate limiter & short-lived cache for public AI search.
const SEARCH_RATE_LIMIT_MAX = 12;
const SEARCH_RATE_WINDOW_MS = 60_000;
const searchIpHits = new Map<string, number[]>();
const publicSearchCache = new Map<
  string,
  { result: AISearchResult; expiresAt: number }
>();

function checkSearchRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (searchIpHits.get(ip) ?? []).filter(
    (ts) => now - ts < SEARCH_RATE_WINDOW_MS
  );
  if (recent.length >= SEARCH_RATE_LIMIT_MAX) {
    searchIpHits.set(ip, recent);
    return false;
  }
  recent.push(now);
  searchIpHits.set(ip, recent);
  return true;
}

async function startServer() {
  assertAdminConfigAtStartup();
  const app = express();
  const httpServer = http.createServer(app);

  // Trust the Cloud Run / Nginx proxy so req.ip reflects the real client address.
  app.set('trust proxy', 1);

  // Parse JSON request bodies cleanly (for resource CRUD and AI classification).
  app.use(express.json({ limit: '1mb' }));

  // Simple health check route so we can verify the Express backend is alive.
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'curated-index',
      timestamp: new Date().toISOString(),
    });
  });

  // Verifies the caller's Firebase ID token and reports whether they match ADMIN_UID or verified ADMIN_EMAIL.
  app.get('/api/auth/session', attachOptionalAuth, async (req: AuthRequest, res) => {
    const adminConfigured = isAdminConfigured();
    const admin = isAdminUser(req.user);
    if (admin && req.user?.uid) {
      try {
        await getOrCreateUser(req.user.uid, req.user.email ?? '');
      } catch (error) {
        console.error('Failed to sync admin user record:', error);
      }
    }
    res.json({
      authenticated: Boolean(req.user),
      isAdmin: admin,
      adminConfigured,
      email: req.user?.email ?? null,
      uid: req.user?.uid ?? null,
    });
  });

  // Returns public resources (is_public = true) to visitors, or all resources to the verified admin.
  app.get('/api/resources', attachOptionalAuth, async (req: AuthRequest, res) => {
    try {
      const admin = isAdminUser(req.user);
      const items = admin
        ? await getAllResourcesForAdmin()
        : await getPublicResources();

      res.json({
        items,
        isAdmin: admin,
      });
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      res.status(500).json({ error: 'Unable to load resources right now.' });
    }
  });

  // Admin-only Create endpoint (C in CRUD).
  app.post('/api/resources', requireAdmin, async (req: AuthRequest, res) => {
    const parsed = validateResourcePayload(req.body);
    if (parsed.ok === false) {
      return res.status(400).json({ error: parsed.error });
    }

    try {
      const dbUser =
        req.user?.uid && req.user.email
          ? await getOrCreateUser(req.user.uid, req.user.email)
          : null;

      const created = await createResource({
        ...parsed.data,
        userId: dbUser?.id ?? null,
      });
      publicSearchCache.clear();
      res.status(201).json({ item: created });
    } catch (error) {
      console.error('Failed to create resource:', error);
      res.status(500).json({ error: 'Unable to create resource right now.' });
    }
  });

  // Admin-only Update endpoint (U in CRUD).
  app.patch('/api/resources/:id', requireAdmin, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const parsed = validateResourcePayload(req.body);
    if (parsed.ok === false) {
      return res.status(400).json({ error: parsed.error });
    }

    try {
      const updated = await updateResource(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: 'Resource not found.' });
      }
      publicSearchCache.clear();
      res.json({ item: updated });
    } catch (error) {
      console.error('Failed to update resource:', error);
      res.status(500).json({ error: 'Unable to update resource right now.' });
    }
  });

  // Admin-only Delete endpoint (D in CRUD).
  app.delete('/api/resources/:id', requireAdmin, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    try {
      const deleted = await deleteResource(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Resource not found.' });
      }
      publicSearchCache.clear();
      res.json({ deletedId: deleted.id });
    } catch (error) {
      console.error('Failed to delete resource:', error);
      res.status(500).json({ error: 'Unable to delete resource right now.' });
    }
  });

  // Admin-only AI Auto-Classifier (Magic Paste -> Structured JSON Output).
  app.post('/api/classify', requireAdmin, async (req: AuthRequest, res) => {
    const rawInput =
      typeof req.body?.input === 'string' ? req.body.input.trim() : '';

    if (!rawInput) {
      return res
        .status(400)
        .json({ error: 'Please paste a URL, prompt, or note to classify.' });
    }
    if (rawInput.length > 8000) {
      return res
        .status(400)
        .json({ error: 'Pasted input is too long (max 8,000 characters).' });
    }

    try {
      const [urlMeta, existingTags] = await Promise.all([
        inspectPastedUrl(rawInput),
        getExistingTagVocabulary(60),
      ]);
      const classified = await classifyResourceInput(
        rawInput,
        urlMeta,
        existingTags
      );
      res.json({ classified });
    } catch (error) {
      console.error('AI classification failed:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to classify this input right now.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Public (and Admin-aware) AI Semantic Search grounded strictly on stored DB rows.
  app.post('/api/search', attachOptionalAuth, async (req: AuthRequest, res) => {
    const rawQuery =
      typeof req.body?.query === 'string' ? req.body.query.trim() : '';

    if (!rawQuery) {
      return res.status(400).json({ error: 'Please enter a search question.' });
    }
    if (rawQuery.length > 200) {
      return res
        .status(400)
        .json({ error: 'Search query is too long (max 200 characters).' });
    }

    const clientIp = req.ip || 'unknown';
    if (!checkSearchRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many AI searches right now. Please wait a minute and try again.',
      });
    }

    const admin = isAdminUser(req.user);
    const cacheKey = rawQuery.toLowerCase();
    if (!admin) {
      const cached = publicSearchCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.result);
      }
    }

    try {
      const catalog = admin
        ? await getAllResourcesForAdmin()
        : await getPublicResources();

      const result = await searchResourcesWithAI(rawQuery, catalog);

      if (!admin) {
        if (publicSearchCache.size >= 100) {
          publicSearchCache.clear();
        }
        publicSearchCache.set(cacheKey, {
          result,
          expiresAt: Date.now() + 60_000,
        });
      }

      res.json(result);
    } catch (error) {
      console.error('AI search failed:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to complete AI search right now.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    // In development, mount Vite as Express middleware so one server on port 3000
    // handles both /api/* routes and the React frontend without CORS friction.
    // Pass httpServer to hmr so Vite uses port 3000 instead of unreachable port 24678.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the compiled React bundle from dist/ and fall back to index.html for SPA routes.
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
