import { Router } from 'express';
import {
  clearAdminSessionCookie,
  getAdminSession,
  isAdminConfigured,
  setAdminSessionCookie,
  validateAdminCredentials,
} from '../lib/adminSession';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    if (!isAdminConfigured()) {
      return res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
    }

    const adminId = typeof req.body?.adminId === 'string' ? req.body.adminId : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!adminId.trim() || !password.trim()) {
      return res.status(400).json({ error: 'ADMIN_CREDENTIALS_REQUIRED' });
    }

    if (!validateAdminCredentials(adminId, password)) {
      return res.status(401).json({ error: 'INVALID_ADMIN_CREDENTIALS' });
    }

    setAdminSessionCookie(res, adminId);
    return res.status(200).json({
      authenticated: true,
      adminId: adminId.trim(),
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    return res.status(500).json({ error: 'FAILED_TO_LOGIN_ADMIN' });
  }
});

router.post('/logout', async (_req, res) => {
  clearAdminSessionCookie(res);
  return res.status(200).json({ success: true });
});

router.get('/me', async (req, res) => {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'ADMIN_UNAUTHORIZED' });
  }

  return res.status(200).json({
    authenticated: true,
    adminId: session.adminId,
    expiresAt: session.expiresAt,
  });
});

export default router;
