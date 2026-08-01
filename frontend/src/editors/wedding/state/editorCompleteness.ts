import {
  getInvitationAccountItems,
  isAccountItemComplete,
} from '@/src/invitation/accountItems';
import { sanitizeGalleryItems } from '@/src/invitation/galleryAsset';
import { getMusicByKey } from '@/src/constants/music';
import type { WeddingEditorState } from './weddingEditor.types';
import { resolveVisibleSections } from './editorSteps';

function isNonEmpty(value: string | undefined | null): boolean {
  return Boolean(value && value.trim());
}

/**
 * 필드 기반 완성도 (선택 계좌는 OFF면 미완료로 계산하지 않음).
 */
export function computeEditorCompleteness(state: WeddingEditorState): {
  percent: number;
  completed: number;
  total: number;
} {
  const sections = resolveVisibleSections(state.setup.conceptType);
  let completed = 0;
  let total = 0;

  for (const section of sections) {
    switch (section.key) {
      case 'setup':
        total += 1;
        // GENERAL: 일시는 schedule 단계에서 입력·집계. setup은 제목만 요구.
        if (state.setup.conceptType === 'GENERAL') {
          if (isNonEmpty(state.basic.title)) completed += 1;
        } else if (isNonEmpty(state.basic.title) && isNonEmpty(state.basic.eventDateTime)) {
          completed += 1;
        }
        break;
      case 'message':
        total += 1;
        if (isNonEmpty(state.invitationMessage.body)) completed += 1;
        break;
      case 'hero':
        total += 1;
        if (isNonEmpty(state.hero.heroImage)) completed += 1;
        break;
      case 'couple':
        total += 1;
        if (state.setup.conceptType === 'FUNERAL') {
          if (isNonEmpty(state.basic.title)) completed += 1;
        } else if (isNonEmpty(state.groom.name) && isNonEmpty(state.bride.name)) {
          completed += 1;
        }
        break;
      case 'schedule':
        total += 1;
        if (isNonEmpty(state.basic.eventDateTime)) completed += 1;
        break;
      case 'gallery':
        total += 1;
        if (
          sanitizeGalleryItems(
            state.gallery.images.map((image) => ({
              url: image.url,
              objectKey: image.objectKey,
              mediaId: image.mediaId,
            }))
          ).length > 0
        ) {
          completed += 1;
        }
        break;
      case 'location':
        total += 1;
        if (isNonEmpty(state.location.address) || isNonEmpty(state.location.venueName)) completed += 1;
        break;
      case 'accounts': {
        const enabled =
          state.setup.conceptType === 'GENERAL'
            ? Boolean(state.extras.accountEnabled)
            : true;
        if (!enabled) {
          // optional OFF — 완성도에서 제외
          break;
        }
        total += 1;
        const accounts = getInvitationAccountItems(
          state.accounts.map((account) => ({
            role: account.role,
            bank: account.bank,
            number: account.number,
            holder: account.holder,
            iban: account.iban,
            swiftBic: account.swiftBic,
            routingCode: account.routingCode,
            paymentNote: account.paymentNote,
          }))
        );
        if (accounts.some(isAccountItemComplete)) completed += 1;
        break;
      }
      case 'rsvp':
      case 'share':
        total += 1;
        completed += 1;
        break;
      case 'music': {
        // 선택 기능: OFF면 완성도에서 제외. ON이면 유효 source 필요.
        if (!state.extras.musicEnabled) {
          break;
        }
        total += 1;
        const hasUpload = Boolean((state.extras.musicFileUrl || '').trim());
        const hasShared = Boolean(getMusicByKey(state.extras.musicKey));
        if (hasUpload || hasShared) completed += 1;
        break;
      }
      default:
        break;
    }
  }

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { percent, completed, total };
}
