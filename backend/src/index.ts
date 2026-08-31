import 'dotenv/config';
import express, { type Request } from 'express';
import cors from 'cors';
import path from 'path';
import prisma from './lib/prisma';
import invitationsRouter from './routes/invitations';
import eventsRouter from './routes/events';
import authRouter from './routes/auth';
import adminAuthRouter from './routes/adminAuth';
import adminMusicRouter from './routes/adminMusic';
import adminRouter from './routes/admin';
import musicLibraryRouter from './routes/musicLibrary';
import templateRegistryRouter from './routes/templateRegistry';
import rsvpRouter from './routes/rsvp';
import invitationAnalyticsRouter from './routes/invitationAnalytics';
import {
  ownerInvitationCommentsRouter,
  publicInvitationCommentsRouter,
} from './routes/invitationComments';
import mediaRouter from './routes/media';
import templateSubmissionsRouter from './routes/templateSubmissions';
import adminTemplateSubmissionsRouter from './routes/adminTemplateSubmissions';
import adminSuperRouter from './routes/adminSuper';
import testLoginRouter from './routes/testLogin';
import testPublishedInvitationRouter from './routes/testPublishedInvitation';
import notificationsRouter from './routes/notifications';
import paymentsRouter from './routes/payments';
import adminOpsRouter from './routes/adminOps';
import adminVisualTemplatesRouter from './routes/adminVisualTemplates';
import visualCatalogRouter from './routes/visualCatalog';
import { ensurePricingBootstrap } from './lib/pricing/invitationPricing';
import { ensureSystemConfigBootstrap } from './lib/ops/systemConfig';
import { syncVisualTemplateCatalogFromRegistry } from './lib/visualTemplates/catalogService';
import { startCleanupWorker } from './workers/cleanupWorker';
import { attachGuestSession } from './middleware/guestSessionMiddleware';
import { guestRateLimit } from './middleware/guestRateLimit';
import { getBackendBuildIdentity } from './lib/buildIdentity';

const app = express();
const PORT = process.env.PORT || 3001;

// Railway / reverse proxy: correct secure cookie + client IP behavior
app.set('trust proxy', 1);

if (!process.env.ADMIN_JWT_SECRET?.trim() && !process.env.ADMIN_SESSION_SECRET?.trim()) {
  throw new Error('ADMIN_JWT_SECRET (or ADMIN_SESSION_SECRET) must be defined');
}

const listFromEnv = (process.env.FRONTEND_ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set(
    [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_PREVIEW_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      'https://frontend-development-1b8a.up.railway.app',
      'https://frontend-production-54bf.up.railway.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...listFromEnv,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim())
  )
);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('[CORS BLOCKED]', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-token', 'X-Guest-Token', 'X-Requested-With'],
  exposedHeaders: ['x-guest-token'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({
  verify: (req, _res, buf) => {
    const url = ((req as { originalUrl?: string; url?: string }).originalUrl || req.url || '');
    if (url.includes('/api/payments/webhook')) {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    }
  },
}));
// Legacy fallback for pre-R2 records only. New uploads use direct-to-R2.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('[REQUEST]', {
      path: req.path,
      hasGuestHeader: Boolean(req.headers['x-guest-token']),
      origin: req.headers.origin,
    });
  }
  next();
});

function isAdminApiPath(req: Request): boolean {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  return url === '/api/admin' || url.startsWith('/api/admin/');
}

// Health check endpoint (email/payment diagnostics: secret 값 미포함)
app.get('/health', async (req, res) => {
  try {
    const { getEmailDiagnostics } = await import('./lib/mailer');
    const { getPaymentDiagnostics } = await import('./lib/payments/provider');
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      email: getEmailDiagnostics(),
      payment: await getPaymentDiagnostics(),
      build: getBackendBuildIdentity(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** Deploy verification — sha/branch only (no secrets). */
app.get('/api/build-identity', (_req, res) => {
  res.status(200).json(getBackendBuildIdentity());
});

// Admin routes before guest middleware — admin auth must not mint guest tokens.
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin', adminMusicRouter);
app.use('/api/admin', adminOpsRouter);
app.use('/api/admin', adminVisualTemplatesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminTemplateSubmissionsRouter);
app.use('/api/admin/super', adminSuperRouter);

// Guest session only for non-admin APIs (skip remains defense-in-depth).
app.use('/api', (req, res, next) => {
  if (isAdminApiPath(req)) {
    return next();
  }
  return attachGuestSession(req, res, next);
});
app.use('/api', (req, res, next) => {
  if (isAdminApiPath(req)) {
    return next();
  }
  return guestRateLimit(req, res, next);
});

// User / public API routes
app.use('/api/invitations', invitationsRouter);
app.use('/api/invitations/:id/comments', ownerInvitationCommentsRouter);
app.use('/api/invitations', invitationAnalyticsRouter);
app.use('/api/public/invitations', publicInvitationCommentsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/creator', templateSubmissionsRouter);
app.use('/api/templates', templateRegistryRouter);
app.use('/api/templates', visualCatalogRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/media', mediaRouter);
app.use('/api/music-library', musicLibraryRouter);
app.use('/api/test-login', testLoginRouter);
app.use('/api/test/published-invitation', testPublishedInvitationRouter);
app.use('/api', paymentsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  void import('./lib/mailer').then(({ getEmailDiagnostics }) => {
    const email = getEmailDiagnostics();
    console.info('[startup] email diagnostics', email);
  });
  void Promise.all([
    ensurePricingBootstrap(),
    ensureSystemConfigBootstrap(),
    syncVisualTemplateCatalogFromRegistry(),
  ]).catch((error) => {
    console.warn('[startup] ops/catalog bootstrap skipped', {
      code: error instanceof Error ? error.message : 'UNKNOWN',
    });
  });
  startCleanupWorker();
  // Defer QA stub cleanup so a probe/ESM failure cannot take down boot.
  setTimeout(() => {
    void import('./lib/audio/archiveKnownInvalidSharedMusic')
      .then(({ archiveKnownInvalidSharedMusic }) => archiveKnownInvalidSharedMusic())
      .catch((error) => {
        console.warn('[music] skipped known-invalid archive on boot', {
          code: error instanceof Error ? error.message : 'UNKNOWN',
        });
      });
  }, 3_000);
});
