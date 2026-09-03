import { Router, type Response } from 'express';
import {
  getAdminSession,
  requireAdminSession,
  type AdminSession,
} from '../lib/adminSession';
import { logAdminAction } from '../admin/adminAuditLog';
import {
  clearFigmaAccessToken,
  getFigmaConfigView,
  resolveFigmaAccessToken,
  upsertFigmaAccessToken,
} from '../lib/figma/config';
import { FigmaApiError, probeFigmaCredentials } from '../lib/figma/client';
import { FIGMA_RUNTIME_IMPORT_SCOPES } from '../lib/figma/scopes';
import { parseFigmaFrameUrl } from '../lib/figma/urlParser';
import {
  activateDefinitionVersion,
  analyzeFigmaFrame,
  analyzeWeddingPocFixture,
  markVersionQaReady,
  saveDefinitionDraft,
} from '../lib/visualTemplates/definition/importService';
import {
  DEFAULT_WEDDING_SECTIONS,
  generateFigmaDesignPrompt,
  suggestTemplateKey,
  type TemplateDesignRequest,
} from '../lib/visualTemplates/definition/promptGenerator';
import { GI_SECTIONS } from '../lib/visualTemplates/definition/types';
import { WEDDING_POC_TEMPLATE_KEY } from '../lib/visualTemplates/definition/weddingPocFixture';

const router = Router();
router.use(requireAdminSession);

function sessionOf(res: Response): AdminSession {
  return res.locals.adminSession as AdminSession;
}

function requireSuper(req: import('express').Request, res: Response): AdminSession | null {
  const session = getAdminSession(req);
  if (!session || session.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'SUPER_ADMIN_REQUIRED' });
    return null;
  }
  return session;
}

router.get('/figma/config', async (_req, res) => {
  try {
    return res.status(200).json(await getFigmaConfigView());
  } catch (error) {
    console.error('[admin/figma] config get failed', error);
    return res.status(500).json({ error: 'FIGMA_CONFIG_FAILED' });
  }
});

router.put('/figma/config', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    if (req.body?.clear === true) {
      const view = await clearFigmaAccessToken(session.adminId || session.email);
      await logAdminAction({
        adminId: session.adminId || session.email,
        action: 'figma_config_clear',
        targetType: 'figma_integration',
        payload: { actorRole: session.role },
      });
      return res.status(200).json(view);
    }
    const token = typeof req.body?.accessToken === 'string' ? req.body.accessToken : '';
    const view = await upsertFigmaAccessToken({
      accessToken: token,
      updatedBy: session.adminId || session.email,
    });
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'figma_config_update',
      targetType: 'figma_integration',
      payload: { actorRole: session.role, configured: view.configured },
    });
    return res.status(200).json(view);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FIGMA_CONFIG_FAILED';
    if (message === 'ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED') {
      return res.status(503).json({ error: message });
    }
    console.error('[admin/figma] config put failed', error);
    return res.status(500).json({ error: 'FIGMA_CONFIG_FAILED' });
  }
});

router.post('/figma/test', async (_req, res) => {
  try {
    const creds = await resolveFigmaAccessToken();
    if (!creds) {
      return res.status(400).json({
        ok: false,
        error: 'FIGMA_TOKEN_NOT_CONFIGURED',
        code: 'FIGMA_TOKEN_NOT_CONFIGURED',
        message: 'Figma Access Token is not configured.',
      });
    }

    const probe = await probeFigmaCredentials(creds.token);
    const body = {
      ...probe,
      error: probe.ok ? undefined : probe.code,
      source: creds.source,
      provider: 'figma_rest' as const,
      verification: 'figma_file_api_auth' as const,
      requiredScopes: [...FIGMA_RUNTIME_IMPORT_SCOPES],
    };

    if (!probe.ok) {
      const status =
        probe.code === 'FIGMA_TOKEN_INVALID'
          ? 401
          : probe.code === 'FIGMA_SCOPE_INSUFFICIENT' || probe.code === 'FIGMA_API_FORBIDDEN'
            ? 403
            : probe.code === 'FIGMA_API_TIMEOUT'
              ? 504
              : probe.code === 'FIGMA_API_UNREACHABLE'
                ? 502
                : probe.code === 'FIGMA_RATE_LIMITED'
                  ? 429
                  : 400;
      return res.status(status).json(body);
    }

    return res.status(200).json(body);
  } catch (error) {
    console.error('[admin/figma] test failed', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return res.status(500).json({
      ok: false,
      error: 'FIGMA_TEST_FAILED',
      code: 'FIGMA_TEST_FAILED',
      message: 'Connection test failed unexpectedly.',
    });
  }
});

router.get('/visual-templates/design-meta', (_req, res) => {
  return res.status(200).json({
    sections: GI_SECTIONS,
    defaultWeddingSections: DEFAULT_WEDDING_SECTIONS,
    pocTemplateKey: WEDDING_POC_TEMPLATE_KEY,
  });
});

router.post('/visual-templates/suggest-key', (req, res) => {
  const concept = String(req.body?.concept || 'WEDDING');
  const name = String(req.body?.displayName || 'NEW');
  return res.status(200).json({ templateKey: suggestTemplateKey(concept, name) });
});

router.post('/visual-templates/design-prompt', (req, res) => {
  try {
    const body = req.body as TemplateDesignRequest;
    if (!body?.templateKey || !body?.concept) {
      return res.status(400).json({ error: 'REQUEST_REQUIRED' });
    }
    const prompt = generateFigmaDesignPrompt({
      ...body,
      sections: Array.isArray(body.sections) ? body.sections : DEFAULT_WEDDING_SECTIONS,
      mobileFirst: body.mobileFirst !== false,
    });
    return res.status(200).json({ prompt });
  } catch (error) {
    console.error('[admin/figma] prompt failed', error);
    return res.status(500).json({ error: 'PROMPT_FAILED' });
  }
});

router.post('/visual-templates/figma/analyze', async (req, res) => {
  const session = sessionOf(res);
  try {
    if (req.body?.useFixture === true) {
      const result = await analyzeWeddingPocFixture();
      return res.status(200).json(result);
    }
    const figmaUrl = String(req.body?.figmaUrl || '');
    const templateKey = String(req.body?.templateKey || '');
    const concept = String(req.body?.concept || 'WEDDING') as 'WEDDING';
    // validate URL early for clearer errors
    parseFigmaFrameUrl(figmaUrl);
    const result = await analyzeFigmaFrame({ figmaUrl, templateKey, concept });
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'figma_analyze',
      targetType: 'visual_template_catalog',
      payload: {
        templateKey,
        canSaveDraft: result.canSaveDraft,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof FigmaApiError) {
      return res.status(400).json({ error: error.code });
    }
    const message = error instanceof Error ? error.message : 'FIGMA_ANALYZE_FAILED';
    if (message.startsWith('FIGMA_')) {
      return res.status(400).json({ error: message });
    }
    console.error('[admin/figma] analyze failed', error);
    return res.status(500).json({ error: 'FIGMA_ANALYZE_FAILED' });
  }
});

router.post('/visual-templates/figma/import', async (req, res) => {
  const session = sessionOf(res);
  try {
    const definition = req.body?.definition;
    const templateKey = String(req.body?.templateKey || definition?.templateKey || '');
    const concept = String(req.body?.concept || definition?.concept || 'WEDDING') as
      | 'WEDDING'
      | 'FUNERAL'
      | 'GENERAL'
      | 'ORGANIZATION';
    if (!definition || !templateKey) {
      return res.status(400).json({ error: 'DEFINITION_REQUIRED' });
    }
    const saved = await saveDefinitionDraft({
      templateKey,
      concept,
      displayNameKo: String(req.body?.displayNameKo || templateKey),
      displayNameEn: String(req.body?.displayNameEn || templateKey),
      descriptionKo: String(req.body?.descriptionKo || ''),
      descriptionEn: String(req.body?.descriptionEn || ''),
      definition,
      figmaMeta: {
        fileKey: req.body?.source?.fileKey,
        nodeId: req.body?.source?.nodeId,
        url: req.body?.source?.url,
        sourceHash: req.body?.sourceHash,
        warnings: req.body?.warnings,
      },
      actor: session.adminId || session.email,
    });
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'figma_import_draft',
      targetType: 'visual_template_catalog',
      targetId: saved.catalogEntryId,
      payload: { templateKey, version: saved.version, versionId: saved.versionId },
    });
    return res.status(201).json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FIGMA_IMPORT_FAILED';
    if (
      message === 'DEFINITION_VALIDATION_FAILED' ||
      message === 'CANNOT_ATTACH_FIGMA_TO_CODE_ENTRY'
    ) {
      return res.status(400).json({ error: message });
    }
    console.error('[admin/figma] import failed', error);
    return res.status(500).json({ error: 'FIGMA_IMPORT_FAILED' });
  }
});

router.post('/visual-templates/:id/versions/:versionId/qa-ready', async (req, res) => {
  const session = sessionOf(res);
  try {
    const version = await markVersionQaReady(req.params.versionId);
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'visual_template_version_qa_ready',
      targetType: 'visual_template_version',
      targetId: version.id,
      payload: { catalogEntryId: version.catalogEntryId },
    });
    return res.status(200).json({ version });
  } catch (error) {
    console.error('[admin/figma] qa-ready failed', error);
    return res.status(500).json({ error: 'QA_READY_FAILED' });
  }
});

router.post('/visual-templates/:id/versions/:versionId/activate', async (req, res) => {
  const session = requireSuper(req, res);
  if (!session) return;
  try {
    const version = await activateDefinitionVersion(req.params.versionId);
    await logAdminAction({
      adminId: session.adminId || session.email,
      action: 'visual_template_version_activate',
      targetType: 'visual_template_version',
      targetId: version.id,
      payload: { catalogEntryId: version.catalogEntryId, visibleDefault: false },
    });
    return res.status(200).json({ version });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ACTIVATE_FAILED';
    if (['VERSION_NOT_FOUND', 'NOT_FIGMA_VERSION', 'DEFINITION_INVALID'].includes(message)) {
      return res.status(400).json({ error: message });
    }
    console.error('[admin/figma] activate failed', error);
    return res.status(500).json({ error: 'ACTIVATE_FAILED' });
  }
});

export default router;
