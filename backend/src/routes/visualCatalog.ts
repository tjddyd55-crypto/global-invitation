import { Router } from 'express';
import { listPublicVisualCatalog } from '../lib/visualTemplates/catalogService';
import {
  getActiveDefinitionForTemplateKey,
  getDefinitionByVersionId,
} from '../lib/visualTemplates/definition/importService';

const router = Router();

/**
 * Public visual template catalog — operational policy ∩ CODE/FIGMA rules.
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

/**
 * Active FIGMA definition for a template key (public render / picker preview).
 * CODE templates return 404 — use CODE registry instead.
 */
router.get('/visual-definition/:templateKey', async (req, res) => {
  try {
    const key = String(req.params.templateKey || '').trim();
    const versionId =
      typeof req.query.versionId === 'string' ? req.query.versionId.trim() : '';
    const resolved = versionId
      ? await getDefinitionByVersionId(versionId)
      : await getActiveDefinitionForTemplateKey(key);
    if (!resolved) return res.status(404).json({ error: 'DEFINITION_NOT_FOUND' });
    return res.status(200).json({
      templateKey: 'templateKey' in resolved ? resolved.templateKey : key,
      versionId: resolved.versionId,
      sourceType: 'FIGMA_DEFINITION',
      definition: resolved.definition,
    });
  } catch (error) {
    console.error('[templates] visual-definition failed', error);
    return res.status(500).json({ error: 'DEFINITION_FETCH_FAILED' });
  }
});

export default router;
