import { buildApiUrl, getApiBaseUrl } from '@/src/lib/apiBase';

export type EventType = 'invitation_view' | 'share_click' | 'editor_open' | 'preview_open';
export type TemplateType = 'wedding' | 'funeral' | 'message' | 'branded';

export type EventMetadata = Record<string, string | number | boolean>;

type EventPayload = {
  eventType: EventType;
  templateType: TemplateType;
  language: string;
  pageUrl: string;
  metadata?: EventMetadata;
};

export async function logEvent(payload: EventPayload): Promise<boolean> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return false;

  try {
    const response = await fetch(buildApiUrl('/api/events'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('[events] Failed to log event', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[events] Failed to log event', error);
    return false;
  }
}
