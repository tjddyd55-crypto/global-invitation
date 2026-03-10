import { Router } from 'express';
import prisma from '../lib/prisma';
import { createToken, getSessionExpiry, normalizeEmail, setAuthSessionCookie } from '../lib/auth';

const router = Router();
const DEFAULT_TEST_EMAIL = 'test@example.com';

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

router.post('/', async (req, res) => {
  if (isProductionEnvironment()) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  try {
    const requestedEmail = typeof req.body?.email === 'string' ? req.body.email : DEFAULT_TEST_EMAIL;
    const email = normalizeEmail(requestedEmail || DEFAULT_TEST_EMAIL);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
      select: { id: true, email: true },
    });

    const sessionToken = createToken();
    await prisma.authSession.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: getSessionExpiry(),
      },
    });

    setAuthSessionCookie(res, sessionToken);
    return res.status(200).json({
      ok: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error in test login route:', error);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_TEST_SESSION' });
  }
});

export default router;
