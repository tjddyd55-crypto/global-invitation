import { Router } from 'express';
import prisma from '../lib/prisma';
import { getAuthUser } from '../lib/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        linkPath: true,
        readAt: true,
        createdAt: true,
      },
    });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error listing notifications:', error);
    return res.status(500).json({ error: 'FAILED_TO_LIST_NOTIFICATIONS' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const readAt = new Date();
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: { readAt },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ error: 'FAILED_TO_MARK_ALL_NOTIFICATIONS_READ' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      return res.status(400).json({ error: 'NOTIFICATION_ID_REQUIRED' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!notification || notification.userId !== user.id) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'FAILED_TO_MARK_NOTIFICATION_READ' });
  }
});

export default router;
