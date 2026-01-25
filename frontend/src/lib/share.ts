import { I18N_KEYS } from '@/src/i18n';
import { buildCanonicalUrl } from './siteUrl';

export type ShareTemplateType = 'wedding' | 'funeral' | 'message' | 'branded';

type ShareContent = {
  title: string;
  description: string;
};

type SharePayload = {
  url: string;
  title: string;
  text: string;
};

type ShareResult = 'shared' | 'copied' | 'manual' | 'cancelled' | 'failed';

export function buildShareUrl(path: string): string {
  return buildCanonicalUrl(path);
}

export function getShareContent(templateType: ShareTemplateType, t: (key: string) => string): ShareContent {
  switch (templateType) {
    case 'funeral':
      return {
        title: t(I18N_KEYS.share.titleFuneral),
        description: t(I18N_KEYS.share.descriptionFuneral),
      };
    case 'message':
      return {
        title: t(I18N_KEYS.share.titleMessage),
        description: t(I18N_KEYS.share.descriptionMessage),
      };
    case 'branded':
      return {
        title: t(I18N_KEYS.share.titleBranded),
        description: t(I18N_KEYS.share.descriptionBranded),
      };
    case 'wedding':
    default:
      return {
        title: t(I18N_KEYS.share.titleWedding),
        description: t(I18N_KEYS.share.descriptionWedding),
      };
  }
}

async function copyToClipboard(text: string): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'manual';
    }
  }

  if (typeof document === 'undefined') {
    return 'failed';
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success ? 'copied' : 'manual';
  } catch {
    document.body.removeChild(textArea);
    return 'manual';
  }
}

export async function shareLink(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  return copyToClipboard(payload.url);
}
