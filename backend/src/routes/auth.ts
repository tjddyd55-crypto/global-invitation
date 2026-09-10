import { Router, type Request } from 'express';
import prisma from '../lib/prisma';
import {
  clearAuthSessionCookie,
  createToken,
  getAuthUser,
  getSessionExpiry,
  isValidEmail,
  normalizeEmail,
  resolveSessionToken,
  setAuthSessionCookie,
  transferGuestData,
} from '../lib/auth';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  buildAuthRateLimitKey,
  checkAuthRateLimit,
  clearAuthRateLimit,
  recordAuthRateLimitFailure,
  resolveLoginRateLimitConfig,
  resolveRecoveryRateLimitConfig,
} from '../lib/authRateLimit';
import {
  ADMIN_RESET_TYPE,
  RECOVERY_GRANT_TYPE,
  changePasswordForUser,
  createAdminResetToken,
  createRecoveryGrant,
  issueRecoveryCodeForUser,
  resetPasswordWithRecoveryToken,
  validatePasswordLength,
} from '../lib/passwordRecovery';
import { hashRecoveryCode, verifyRecoveryCode } from '../lib/recoveryCode';
import { normalizeUsername, validateUsername } from '../lib/username';

const router = Router();

function resolveClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function toSafeUser(user: {
  id: string;
  username: string | null;
  email: string | null;
  nickname: string | null;
  role: string;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  };
}

async function createUserSession(userId: string) {
  const sessionToken = createToken();
  await prisma.authSession.create({
    data: {
      token: sessionToken,
      userId,
      expiresAt: getSessionExpiry(),
    },
  });
  return sessionToken;
}

type RegisterInput = {
  username: string;
  email: string;
  password: string;
  guestToken?: string;
};

async function registerUser(input: RegisterInput) {
  const usernameError = validateUsername(input.username);
  if (usernameError) {
    return { status: 400 as const, body: { ok: false, error: usernameError } };
  }

  if (!input.email || !isValidEmail(input.email)) {
    return { status: 400 as const, body: { ok: false, error: 'INVALID_EMAIL' } };
  }

  if (!validatePasswordLength(input.password)) {
    return { status: 400 as const, body: { ok: false, error: 'PASSWORD_TOO_SHORT' } };
  }

  const normalizedUsername = normalizeUsername(input.username);
  const normalizedEmail = normalizeEmail(input.email);

  const [usernameTaken, emailTaken] = await Promise.all([
    prisma.user.findUnique({ where: { username: normalizedUsername }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
  ]);

  if (usernameTaken) {
    return { status: 409 as const, body: { ok: false, error: 'USERNAME_ALREADY_EXISTS' } };
  }
  if (emailTaken) {
    return { status: 409 as const, body: { ok: false, error: 'EMAIL_ALREADY_EXISTS' } };
  }

  const passwordHash = await hashPassword(input.password);
  const recoveryCode = await (async () => {
    const { generateRecoveryCode } = await import('../lib/recoveryCode');
    return generateRecoveryCode();
  })();

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      recoveryCodeHash: hashRecoveryCode(recoveryCode),
      recoveryCodeIssuedAt: new Date(),
      passwordChangedAt: new Date(),
      role: 'USER',
    },
    select: { id: true, username: true, email: true, nickname: true, role: true },
  });

  const sessionToken = await createUserSession(user.id);
  if (input.guestToken) {
    await transferGuestData(input.guestToken, user.id);
  }

  return {
    status: 201 as const,
    body: {
      ok: true,
      token: sessionToken,
      user: toSafeUser(user),
      recoveryCode,
    },
  };
}

router.post('/register', async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const guestToken =
      typeof req.body?.guestToken === 'string' && req.body.guestToken.trim()
        ? req.body.guestToken.trim()
        : undefined;

    const result = await registerUser({ username, email, password, guestToken });
    if (result.status === 201) {
      setAuthSessionCookie(res, result.body.token);
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error during register:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_REGISTER' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const guestToken =
      typeof req.body?.guestToken === 'string' && req.body.guestToken.trim()
        ? req.body.guestToken.trim()
        : undefined;

    const result = await registerUser({ username, email, password, guestToken });
    if (result.status === 201) {
      setAuthSessionCookie(res, result.body.token);
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_SIGNUP' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username.trim()) {
      return res.status(400).json({ ok: false, error: 'USERNAME_REQUIRED' });
    }
    if (!password) {
      return res.status(400).json({ ok: false, error: 'PASSWORD_REQUIRED' });
    }

    const normalizedUsername = normalizeUsername(username);
    const loginConfig = resolveLoginRateLimitConfig();
    const loginKey = buildAuthRateLimitKey('login', resolveClientIp(req), normalizedUsername);
    const rateCheck = checkAuthRateLimit(loginKey, loginConfig);
    if (rateCheck.limited) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        ok: false,
        error: 'LOGIN_RATE_LIMITED',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        passwordHash: true,
        deactivatedAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      recordAuthRateLimitFailure(loginKey, loginConfig);
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }
    if (user.deactivatedAt) {
      return res.status(403).json({ ok: false, error: 'ACCOUNT_DEACTIVATED' });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      recordAuthRateLimitFailure(loginKey, loginConfig);
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const sessionToken = await createUserSession(user.id);
    setAuthSessionCookie(res, sessionToken);
    clearAuthRateLimit(loginKey);

    return res.status(200).json({
      ok: true,
      token: sessionToken,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_LOGIN' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json(toSafeUser(user));
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = resolveSessionToken(req);
    if (token) {
      await prisma.authSession
        .update({
          where: { token },
          data: { revokedAt: new Date() },
        })
        .catch(() => undefined);
    }

    clearAuthSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ error: 'FAILED_TO_LOGOUT' });
  }
});

router.post('/transfer-guest', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const guestToken = typeof req.body?.guestToken === 'string' ? req.body.guestToken.trim() : '';
    if (!guestToken) {
      return res.status(400).json({ error: 'guestToken is required' });
    }

    const transferredCount = await transferGuestData(guestToken, user.id);
    res.status(200).json({ transferredCount });
  } catch (error) {
    console.error('Error transferring guest data:', error);
    res.status(500).json({ error: 'Failed to transfer guest data' });
  }
});

router.post('/recovery/verify', async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const recoveryCode =
      typeof req.body?.recoveryCode === 'string' ? req.body.recoveryCode : '';

    if (!username.trim() || !email.trim() || !recoveryCode.trim()) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);
    const recoveryConfig = resolveRecoveryRateLimitConfig();
    const recoveryKey = buildAuthRateLimitKey(
      'recovery',
      resolveClientIp(req),
      normalizedUsername
    );
    const rateCheck = checkAuthRateLimit(recoveryKey, recoveryConfig);
    if (rateCheck.limited) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        ok: false,
        error: 'RECOVERY_RATE_LIMITED',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        email: true,
        recoveryCodeHash: true,
        deactivatedAt: true,
      },
    });

    const emailMatches = user?.email === normalizedEmail;
    const codeMatches = verifyRecoveryCode(recoveryCode, user?.recoveryCodeHash);

    if (!user || user.deactivatedAt || !emailMatches || !codeMatches) {
      recordAuthRateLimitFailure(recoveryKey, recoveryConfig);
      return res.status(400).json({
        ok: false,
        error: 'RECOVERY_VERIFICATION_FAILED',
      });
    }

    clearAuthRateLimit(recoveryKey);
    const recoveryToken = await createRecoveryGrant(user.id);

    return res.status(200).json({
      ok: true,
      recoveryToken,
    });
  } catch (error) {
    console.error('Error verifying recovery code:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_VERIFY_RECOVERY' });
  }
});

router.post('/recovery/reset', async (req, res) => {
  try {
    const recoveryToken =
      typeof req.body?.recoveryToken === 'string' ? req.body.recoveryToken.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!recoveryToken || !newPassword) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    const result = await resetPasswordWithRecoveryToken({
      token: recoveryToken,
      newPassword,
      expectedType: RECOVERY_GRANT_TYPE,
      revokeOtherSessions: true,
      rotateRecoveryCode: true,
    });

    return res.status(200).json({
      ok: true,
      newRecoveryCode: result.newRecoveryCode,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PASSWORD_TOO_SHORT') {
        return res.status(400).json({ ok: false, error: 'PASSWORD_TOO_SHORT' });
      }
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
        return res.status(400).json({ ok: false, error: 'INVALID_OR_EXPIRED_TOKEN' });
      }
    }
    console.error('Error resetting password via recovery:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_RESET_PASSWORD' });
  }
});

router.post('/admin-reset/validate', async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    const { hashRecoveryGrantToken } = await import('../lib/passwordRecovery');
    const tokenHash = hashRecoveryGrantToken(token); // dynamic import avoids circular deps
    const record = await prisma.passwordRecoveryToken.findFirst({
      where: { tokenHash, type: ADMIN_RESET_TYPE, usedAt: null },
      select: { expiresAt: true },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ ok: false, error: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error validating admin reset token:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_VALIDATE_TOKEN' });
  }
});

router.post('/admin-reset/reset', async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    const result = await resetPasswordWithRecoveryToken({
      token,
      newPassword,
      expectedType: ADMIN_RESET_TYPE,
      revokeOtherSessions: true,
      rotateRecoveryCode: true,
    });

    return res.status(200).json({
      ok: true,
      newRecoveryCode: result.newRecoveryCode,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PASSWORD_TOO_SHORT') {
        return res.status(400).json({ ok: false, error: 'PASSWORD_TOO_SHORT' });
      }
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
        return res.status(400).json({ ok: false, error: 'INVALID_OR_EXPIRED_TOKEN' });
      }
    }
    console.error('Error resetting password via admin link:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_RESET_PASSWORD' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    await changePasswordForUser({
      userId: user.id,
      currentPassword,
      newPassword,
      keepCurrentSessionToken: resolveSessionToken(req),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        return res.status(400).json({ ok: false, error: 'INVALID_CURRENT_PASSWORD' });
      }
      if (error.message === 'PASSWORD_TOO_SHORT') {
        return res.status(400).json({ ok: false, error: 'PASSWORD_TOO_SHORT' });
      }
    }
    console.error('Error changing password:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_CHANGE_PASSWORD' });
  }
});

router.post('/recovery-code/regenerate', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    if (!currentPassword) {
      return res.status(400).json({ ok: false, error: 'PASSWORD_REQUIRED' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!dbUser?.passwordHash) {
      return res.status(400).json({ ok: false, error: 'PASSWORD_NOT_SET' });
    }

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return res.status(400).json({ ok: false, error: 'INVALID_CURRENT_PASSWORD' });
    }

    const recoveryCode = await issueRecoveryCodeForUser(user.id);
    return res.status(200).json({ ok: true, recoveryCode });
  } catch (error) {
    console.error('Error regenerating recovery code:', error);
    return res.status(500).json({ ok: false, error: 'FAILED_TO_REGENERATE_RECOVERY_CODE' });
  }
});

/** @deprecated 이메일 OTP는 제거됨 */
router.post('/email/request-code', (_req, res) => {
  return res.status(410).json({ ok: false, error: 'EMAIL_OTP_DEPRECATED' });
});

/** @deprecated 이메일 OTP는 제거됨 */
router.post('/email/verify-code', (_req, res) => {
  return res.status(410).json({ ok: false, error: 'EMAIL_OTP_DEPRECATED' });
});

/** @deprecated 매직링크는 제거됨 */
router.post('/magic-link', (_req, res) => {
  return res.status(410).json({ ok: false, error: 'MAGIC_LINK_DEPRECATED' });
});

/** @deprecated 매직링크는 제거됨 */
router.post('/verify', (_req, res) => {
  return res.status(410).json({ ok: false, error: 'MAGIC_LINK_DEPRECATED' });
});

export default router;
