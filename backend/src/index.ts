import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import prisma from './lib/prisma';
import invitationsRouter from './routes/invitations';
import eventsRouter from './routes/events';
import authRouter from './routes/auth';
import adminAuthRouter from './routes/adminAuth';
import adminRouter from './routes/admin';
import templateRegistryRouter from './routes/templateRegistry';
import rsvpRouter from './routes/rsvp';
import invitationAnalyticsRouter from './routes/invitationAnalytics';
import mediaRouter from './routes/media';
import templateSubmissionsRouter from './routes/templateSubmissions';
import adminTemplateSubmissionsRouter from './routes/adminTemplateSubmissions';
import adminSuperRouter from './routes/adminSuper';
import testLoginRouter from './routes/testLogin';
import notificationsRouter from './routes/notifications';
import { startCleanupWorker } from './workers/cleanupWorker';
import { attachGuestSession } from './middleware/guestSessionMiddleware';
import { guestRateLimit } from './middleware/guestRateLimit';

const app = express();
const PORT = process.env.PORT || 3001;

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
      'https://frontend-production-54bf.up.railway.app',
      'http://localhost:3000',
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

app.use(express.json());
// Legacy fallback for pre-R2 records only. New uploads use direct-to-R2.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('[REQUEST]', {
      path: req.path,
      guestToken: req.headers['x-guest-token'],
      origin: req.headers.origin,
    });
  }
  next();
});

app.use('/api', attachGuestSession);
app.use('/api', guestRateLimit);

// Health check endpoint (email diagnostics: secret 값 미포함)
app.get('/health', async (req, res) => {
  try {
    const { getEmailDiagnostics } = await import('./lib/mailer');
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      email: getEmailDiagnostics(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// API routes
app.use('/api/invitations', invitationsRouter);
app.use('/api/invitations', invitationAnalyticsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminTemplateSubmissionsRouter);
app.use('/api/admin/super', adminSuperRouter);
app.use('/api/creator', templateSubmissionsRouter);
app.use('/api/templates', templateRegistryRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/media', mediaRouter);
app.use('/api/test-login', testLoginRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  void import('./lib/mailer').then(({ getEmailDiagnostics }) => {
    const email = getEmailDiagnostics();
    console.info('[startup] email diagnostics', email);
  });
  startCleanupWorker();
});
