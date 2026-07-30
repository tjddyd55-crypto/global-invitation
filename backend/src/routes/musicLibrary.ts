import { InvitationMusicCategory } from '@prisma/client';
import { Router } from 'express';
import { getAuthUser } from '../lib/auth';
import {
  InvitationMusicLibraryError,
  listPublicTracks,
} from '../services/invitationMusicLibraryService';

const router = Router();
const USER_CONCEPTS = new Set<InvitationMusicCategory>([
  InvitationMusicCategory.WEDDING,
  InvitationMusicCategory.FUNERAL,
  InvitationMusicCategory.GENERAL,
]);

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseConcept(value: unknown): Exclude<InvitationMusicCategory, 'COMMON'> | undefined {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return undefined;
  if (!USER_CONCEPTS.has(normalized as InvitationMusicCategory)) {
    throw new InvitationMusicLibraryError('INVALID_MUSIC_CONCEPT', 400);
  }
  return normalized as Exclude<InvitationMusicCategory, 'COMMON'>;
}

router.get('/', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }
    const tracks = await listPublicTracks(
      parseConcept(req.query.concept),
      normalizeText(req.query.search) || undefined
    );
    return res.status(200).json(tracks);
  } catch (error) {
    if (error instanceof InvitationMusicLibraryError) {
      return res.status(error.status).json({ error: error.code });
    }
    console.error('Music library route error:', error);
    return res.status(500).json({ error: 'MUSIC_LIBRARY_INTERNAL_ERROR' });
  }
});

export default router;
