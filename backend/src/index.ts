import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import invitationsRouter from './routes/invitations';
import eventsRouter from './routes/events';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
app.use('/api/events', eventsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
