import { Router } from 'express';
import { listPublicVisualCatalog } from '../lib/visualTemplates/catalogService';

const router = Router();

/**
 * Public visual template catalog — operational policy ∩ CODE registry.
 * GET /api/templates/visual-catalog?concept=WEDDING&locale=ko-KR
 */
router.get('/visual-catalog', async (req, res) => {
  try {
    const concept = typeof req.query.concept === 'string' ? req.query.concept.trim() : undefined;
    const locale = typeof req.query.locale === 'string' ? req.query.locale.trim() : undefined;
    const templates = await listPublicVisualCatalog({
      concept: concept || undefined,
      locale: locale || undefined,
    });
    return res.status(200).json({ templates });
  } catch (error) {
    console.error('[templates] visual-catalog failed', error);
    return res.status(500).json({ error: 'VISUAL_CATALOG_FAILED' });
  }
});

export default router;
