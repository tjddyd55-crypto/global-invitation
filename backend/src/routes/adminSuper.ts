import { Router, type Request } from 'express';
import { requireSuperAdminSession } from '../lib/adminSession';
import type { AdminSession } from '../lib/adminSession';
import {
  adjustUserCredits,
  bulkGrantCredits,
  createCreditPackage,
  listAdminAuditLogs,
  listCreditPackages,
  listCreditPolicies,
  listCreditTransactions,
  searchUsersWithBalance,
  updateCreditPackage,
  updateCreditPolicy,
} from '../services/superCreditService';

const router = Router();

router.use(requireSuperAdminSession);

function adminId(req: Request): string {
  const session = (req as Request & { locals: { adminSession?: AdminSession } }).locals.adminSession;
  return session?.adminId ?? 'unknown';
}

router.get('/credit-policies', async (_req, res) => {
  try {
    const rows = await listCreditPolicies();
    return res.json({ items: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_LIST_POLICIES' });
  }
});

router.patch('/credit-policies/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(String(req.params.key || ''));
    const cost = typeof req.body?.cost === 'number' ? req.body.cost : undefined;
    const active = typeof req.body?.active === 'boolean' ? req.body.active : undefined;
    if (cost === undefined && active === undefined) {
      return res.status(400).json({ error: 'NO_FIELDS' });
    }
    const row = await updateCreditPolicy(key, { cost, active }, adminId(req));
    return res.json(row);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      return res.status(404).json({ error: 'POLICY_NOT_FOUND' });
    }
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_POLICY' });
  }
});

router.get('/credit-packages', async (_req, res) => {
  try {
    const rows = await listCreditPackages();
    return res.json({ items: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_LIST_PACKAGES' });
  }
});

router.post('/credit-packages', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name : '';
    const credits = typeof req.body?.credits === 'number' ? req.body.credits : NaN;
    if (!name.trim() || Number.isNaN(credits)) {
      return res.status(400).json({ error: 'INVALID_BODY' });
    }
    const row = await createCreditPackage(
      {
        name,
        credits,
        priceCents: typeof req.body?.priceCents === 'number' ? req.body.priceCents : 0,
        sortOrder: typeof req.body?.sortOrder === 'number' ? req.body.sortOrder : 0,
        active: req.body?.active !== false,
      },
      adminId(req)
    );
    return res.status(201).json(row);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_CREATE_PACKAGE' });
  }
});

router.patch('/credit-packages/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '');
    const row = await updateCreditPackage(
      id,
      {
        name: typeof req.body?.name === 'string' ? req.body.name : undefined,
        credits: typeof req.body?.credits === 'number' ? req.body.credits : undefined,
        priceCents: typeof req.body?.priceCents === 'number' ? req.body.priceCents : undefined,
        sortOrder: typeof req.body?.sortOrder === 'number' ? req.body.sortOrder : undefined,
        active: typeof req.body?.active === 'boolean' ? req.body.active : undefined,
      },
      adminId(req)
    );
    return res.json(row);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') {
      return res.status(404).json({ error: 'PACKAGE_NOT_FOUND' });
    }
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_UPDATE_PACKAGE' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const take = typeof req.query.take === 'string' ? Number(req.query.take) : 100;
    const items = await searchUsersWithBalance(q, take);
    return res.json({ items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_LIST_USERS' });
  }
});

router.post('/users/:userId/credits', async (req, res) => {
  try {
    const userId = String(req.params.userId || '');
    const amount = typeof req.body?.amount === 'number' ? req.body.amount : NaN;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
    if (!userId || Number.isNaN(amount) || !reason.trim()) {
      return res.status(400).json({ error: 'INVALID_BODY' });
    }
    const txn = await adjustUserCredits({
      userId,
      amount,
      reason,
      type: 'ADMIN_ADJUST',
      adminId: adminId(req),
    });
    return res.json(txn);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }
    if (msg === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });
    }
    if (msg === 'AMOUNT_ZERO') {
      return res.status(400).json({ error: 'AMOUNT_ZERO' });
    }
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_ADJUST_CREDITS' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 200;
    const rows = await listCreditTransactions(limit);
    return res.json({ items: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_LIST_TRANSACTIONS' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 200;
    const rows = await listAdminAuditLogs(limit);
    return res.json({ items: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'FAILED_TO_LIST_LOGS' });
  }
});

router.post('/bulk-grant', async (req, res) => {
  try {
    const amount = typeof req.body?.amount === 'number' ? req.body.amount : NaN;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
    if (Number.isNaN(amount) || amount <= 0 || !reason.trim()) {
      return res.status(400).json({ error: 'INVALID_BODY' });
    }
    const country = typeof req.body?.country === 'string' ? req.body.country : null;
    const registeredAfter =
      typeof req.body?.registeredAfter === 'string' && req.body.registeredAfter.trim()
        ? new Date(req.body.registeredAfter)
        : null;
    const registeredBefore =
      typeof req.body?.registeredBefore === 'string' && req.body.registeredBefore.trim()
        ? new Date(req.body.registeredBefore)
        : null;

    const out = await bulkGrantCredits({
      country: country?.trim() || null,
      registeredAfter: registeredAfter && !Number.isNaN(registeredAfter.getTime()) ? registeredAfter : null,
      registeredBefore: registeredBefore && !Number.isNaN(registeredBefore.getTime()) ? registeredBefore : null,
      amount,
      reason,
      adminId: adminId(req),
    });
    return res.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'AMOUNT_INVALID') {
      return res.status(400).json({ error: 'AMOUNT_INVALID' });
    }
    console.error(e);
    return res.status(500).json({ error: 'FAILED_BULK_GRANT' });
  }
});

export default router;
