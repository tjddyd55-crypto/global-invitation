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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function logEvent(payload: EventPayload): Promise<boolean> {
  if (!API_BASE_URL) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
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
