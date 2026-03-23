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

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.ADMIN_JWT_SECRET?.trim() && !process.env.ADMIN_SESSION_SECRET?.trim()) {
  throw new Error('ADMIN_JWT_SECRET (or ADMIN_SESSION_SECRET) must be defined');
}

/** Primary credentialed-CORS frontend (Railway). Always allow; extend via env. */
const RAILWAY_FRONTEND_PRODUCTION = 'https://frontend-production-54bf.up.railway.app';

function resolveAllowedOrigins(): string[] {
  const listFromEnv = (process.env.FRONTEND_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const configuredOrigins = [
    RAILWAY_FRONTEND_PRODUCTION,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_PREVIEW_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
    ...listFromEnv,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(configuredOrigins));
}

// Middleware
const corsAllowedOrigins = resolveAllowedOrigins();

app.use(
  cors({
    // Explicit allow-list (includes https://frontend-production-54bf.up.railway.app + env + localhost).
    origin: (origin, callback) => {
      if (!origin || corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn('CORS rejected origin:', origin, 'allowed:', corsAllowedOrigins);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
// Legacy fallback for pre-R2 records only. New uploads use direct-to-R2.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// API routes
app.use('/api/invitations', invitationsRouter);
app.use('/api/invitations', invitationAnalyticsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
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
});
