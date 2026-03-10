import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.ADMIN_SESSION_SECRET?.trim()) {
  throw new Error('ADMIN_SESSION_SECRET must be defined');
}

function resolveAllowedOrigins(): string[] {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(configuredOrigins));
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = resolveAllowedOrigins();
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

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
app.use('/api/creator', templateSubmissionsRouter);
app.use('/api/templates', templateRegistryRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/media', mediaRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
