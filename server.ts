import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createResource,
  deleteResource,
  getAllResourcesForAdmin,
  getPublicResources,
  updateResource,
} from './src/db/resources.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  attachOptionalAuth,
  type AuthRequest,
  isAdminEmail,
  requireAdmin,
} from './src/middleware/auth.ts';
import { validateResourcePayload } from './src/shared/validation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

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

  // Verifies the caller's Firebase ID token and reports whether they match ADMIN_EMAIL.
  app.get('/api/auth/session', attachOptionalAuth, async (req: AuthRequest, res) => {
    const admin = isAdminEmail(req.user?.email);
    if (admin && req.user?.uid && req.user.email) {
      try {
        await getOrCreateUser(req.user.uid, req.user.email);
      } catch (error) {
        console.error('Failed to sync admin user record:', error);
      }
    }
    res.json({
      authenticated: Boolean(req.user),
      isAdmin: admin,
      email: req.user?.email ?? null,
    });
  });

  // Returns public resources (is_public = true) to visitors, or all resources to the verified admin.
  app.get('/api/resources', attachOptionalAuth, async (req: AuthRequest, res) => {
    try {
      const admin = isAdminEmail(req.user?.email);
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
      res.json({ deletedId: deleted.id });
    } catch (error) {
      console.error('Failed to delete resource:', error);
      res.status(500).json({ error: 'Unable to delete resource right now.' });
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
