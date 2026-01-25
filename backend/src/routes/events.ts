import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const ALLOWED_EVENTS = new Set(['invitation_view', 'share_click', 'editor_open', 'preview_open']);
const ALLOWED_TEMPLATES = new Set(['wedding', 'funeral', 'message', 'branded']);
const ALLOWED_LANGUAGES = new Set(['en', 'ko', 'mn']);

type MetadataValue = string | number | boolean;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeMetadata(value: unknown): Record<string, MetadataValue> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const entries = Object.entries(value);
  if (entries.length === 0) return undefined;

  const normalized: Record<string, MetadataValue> = {};
  for (const [key, rawValue] of entries) {
    if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      normalized[key] = rawValue;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

router.post('/', async (req, res) => {
  try {
    const { eventType, templateType, language, pageUrl, metadata } = req.body ?? {};

    if (!ALLOWED_EVENTS.has(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType' });
    }
    if (!ALLOWED_TEMPLATES.has(templateType)) {
      return res.status(400).json({ error: 'Invalid templateType' });
    }
    if (!ALLOWED_LANGUAGES.has(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    if (!isNonEmptyString(pageUrl)) {
      return res.status(400).json({ error: 'Invalid pageUrl' });
    }

    const normalizedMetadata = normalizeMetadata(metadata);

    await prisma.eventLog.create({
      data: {
        eventType,
        templateType,
        language,
        pageUrl,
        metadata: normalizedMetadata,
      },
    });

    return res.status(201).json({ status: 'ok' });
  } catch (error) {
    console.error('Error creating event log:', error);
    return res.status(500).json({ error: 'Failed to create event log' });
  }
});

export default router;
