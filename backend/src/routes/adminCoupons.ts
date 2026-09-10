import { InvitationCouponStatus } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { logAdminAction } from '../admin/adminAuditLog';
import { getAdminSession, requireAdminSession, type AdminSession } from '../lib/adminSession';
import { CouponError } from '../lib/coupons/errors';
import {
  archiveCoupon,
  createCoupon,
  getCouponById,
  listCoupons,
  listCouponUsages,
  transitionCouponStatus,
  updateCoupon,
} from '../lib/coupons/adminService';

const router = Router();
router.use(requireAdminSession);

function requireSuper(req: Request, res: Response): AdminSession | null {
  const session = getAdminSession(req);
  if (!session || session.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    return null;
  }
  return session;
}

function sessionOf(res: Response): AdminSession {
  return res.locals.adminSession as AdminSession;
}

function handleCouponError(error: unknown, res: Response, fallback: string): Response {
  if (error instanceof CouponError) {
    return res.status(error.httpStatus).json({ error: error.code, message: error.message });
  }
  console.error('[admin/coupons]', fallback, error);
  return res.status(500).json({ error: fallback });
}

function parseStatus(value: unknown): InvitationCouponStatus | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const status = value.toUpperCase();
  if (!Object.values(InvitationCouponStatus).includes(status as InvitationCouponStatus)) {
    return undefined;
  }
  return status as InvitationCouponStatus;
}

router.get('/ops/coupons', async (req, res) => {
  try {
    const coupons = await listCoupons({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      status: parseStatus(req.query.status),
      organization: typeof req.query.organization === 'string' ? req.query.organization : undefined,
    });
    return res.status(200).json({ coupons });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_LIST_FAILED');
  }
});

router.post('/ops/coupons', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const coupon = await createCoupon(req.body || {}, session.email);
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'COUPON_CREATED',
      targetType: 'invitation_coupon',
      targetId: coupon.id,
      payload: { actorRole: session.role, code: coupon.code, status: coupon.status },
    });
    return res.status(201).json({ coupon });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_CREATE_FAILED');
  }
});

router.get('/ops/coupons/:id/usages', async (req, res) => {
  try {
    const usages = await listCouponUsages(req.params.id);
    return res.status(200).json({ usages });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_USAGE_LIST_FAILED');
  }
});

router.get('/ops/coupons/:id', async (req, res) => {
  try {
    const coupon = await getCouponById(req.params.id);
    return res.status(200).json({ coupon });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_GET_FAILED');
  }
});

router.put('/ops/coupons/:id', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const coupon = await updateCoupon(req.params.id, req.body || {}, session.email);
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'COUPON_UPDATED',
      targetType: 'invitation_coupon',
      targetId: coupon.id,
      payload: { actorRole: session.role, code: coupon.code },
    });
    return res.status(200).json({ coupon });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_UPDATE_FAILED');
  }
});

router.post('/ops/coupons/:id/pause', async (req, res) => {
  return transition(req, res, InvitationCouponStatus.PAUSED, 'COUPON_PAUSED');
});

router.post('/ops/coupons/:id/activate', async (req, res) => {
  return transition(req, res, InvitationCouponStatus.ACTIVE, 'COUPON_ACTIVATED');
});

router.post('/ops/coupons/:id/archive', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const coupon = await archiveCoupon(req.params.id, session.email);
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'COUPON_ARCHIVED',
      targetType: 'invitation_coupon',
      targetId: coupon.id,
      payload: { actorRole: session.role, code: coupon.code },
    });
    return res.status(200).json({ coupon });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_ARCHIVE_FAILED');
  }
});

async function transition(
  req: Request,
  res: Response,
  status: InvitationCouponStatus,
  action: 'COUPON_PAUSED' | 'COUPON_ACTIVATED'
) {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const coupon = await transitionCouponStatus(req.params.id, status, session.email);
    await logAdminAction({
      adminId: session.adminId || sessionOf(res).adminId || session.email,
      action,
      targetType: 'invitation_coupon',
      targetId: coupon.id,
      payload: { actorRole: session.role, code: coupon.code, status },
    });
    return res.status(200).json({ coupon });
  } catch (error) {
    return handleCouponError(error, res, 'COUPON_STATUS_FAILED');
  }
}

export default router;
