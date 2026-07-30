import { InvitationMusicCategory, Prisma } from '@prisma/client';
import { Router } from 'express';
import type { Response } from 'express';
import { logAdminAction } from '../admin/adminAuditLog';
import { requireAdminSession } from '../lib/adminSession';
import {
  archiveTrack,
  confirmSharedMusic,
  countTrackUsage,
  createSharedMusicPresign,
  deleteTrack,
  getDashboardMusicSummary,
  InvitationMusicLibraryError,
  listAdminTracks,
  updateTrack,
  type ConfirmSharedMusicInput,
  type UpdateTrackInput,
} from '../services/invitationMusicLibraryService';

const router = Router();

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new InvitationMusicLibraryError('INVALID_BOOLEAN_FILTER', 400);
}

function parseCategory(value: unknown): InvitationMusicCategory | undefined {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return undefined;
  if (!Object.values(InvitationMusicCategory).includes(normalized as InvitationMusicCategory)) {
    throw new InvitationMusicLibraryError('INVALID_MUSIC_CATEGORY', 400);
  }
  return normalized as InvitationMusicCategory;
}

function getAdminId(res: Response): string {
  return String(res.locals.adminSession?.adminId || 'unknown-admin');
}

function handleError(error: unknown, res: Response) {
  if (error instanceof InvitationMusicLibraryError) {
    return res.status(error.status).json({ error: error.code });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return res.status(409).json({ error: 'MUSIC_TRACK_ALREADY_CONFIRMED' });
  }
  console.error('Admin music library route error:', error);
  return res.status(500).json({ error: 'MUSIC_LIBRARY_INTERNAL_ERROR' });
}

async function writeAuditLog(params: {
  adminId: string;
  action: string;
  targetId?: string;
  payload?: Prisma.InputJsonValue;
}) {
  await logAdminAction({
    adminId: params.adminId,
    action: params.action,
    targetType: 'invitation_music_track',
    targetId: params.targetId,
    payload: params.payload,
  }).catch((error) => {
    console.warn('Failed to write music library audit log:', error);
  });
}

router.use(requireAdminSession);

router.get('/music', async (req, res) => {
  try {
    const tracks = await listAdminTracks({
      search: normalizeText(req.query.search) || undefined,
      category: parseCategory(req.query.category),
      isActive: parseBoolean(req.query.isActive),
      isArchived: parseBoolean(req.query.isArchived),
    });
    return res.status(200).json(tracks);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get('/music/summary', async (_req, res) => {
  try {
    return res.status(200).json(await getDashboardMusicSummary());
  } catch (error) {
    return handleError(error, res);
  }
});

router.post('/music/presign', async (req, res) => {
  try {
    const result = await createSharedMusicPresign(getAdminId(res), {
      contentType: req.body?.contentType,
      filename: req.body?.filename,
      fileSize: req.body?.fileSize,
      category: req.body?.category,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post('/music/confirm', async (req, res) => {
  try {
    const adminId = getAdminId(res);
    const track = await confirmSharedMusic(adminId, req.body as ConfirmSharedMusicInput);
    await writeAuditLog({
      adminId,
      action: 'music_track_create',
      targetId: track.id,
      payload: { category: track.category, isActive: track.isActive },
    });
    return res.status(201).json(track);
  } catch (error) {
    return handleError(error, res);
  }
});

router.patch('/music/:id', async (req, res) => {
  try {
    const adminId = getAdminId(res);
    const track = await updateTrack(req.params.id, req.body as UpdateTrackInput);
    await writeAuditLog({
      adminId,
      action: 'music_track_update',
      targetId: track.id,
      payload: req.body as Prisma.InputJsonValue,
    });
    return res.status(200).json(track);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post('/music/:id/archive', async (req, res) => {
  try {
    const adminId = getAdminId(res);
    const track = await archiveTrack(req.params.id);
    await writeAuditLog({
      adminId,
      action: 'music_track_archive',
      targetId: track.id,
      payload: { isActive: false, isArchived: true },
    });
    return res.status(200).json(track);
  } catch (error) {
    return handleError(error, res);
  }
});

router.delete('/music/:id', async (req, res) => {
  try {
    const adminId = getAdminId(res);
    const track = await deleteTrack(req.params.id);
    await writeAuditLog({
      adminId,
      action: 'music_track_delete',
      targetId: track.id,
      payload: { isActive: false, isArchived: true, objectDeleteAttempted: true },
    });
    return res.status(200).json(track);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get('/music/:id/usage', async (req, res) => {
  try {
    return res.status(200).json(await countTrackUsage(req.params.id));
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
