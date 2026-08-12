import type { WeddingInvitationData } from '@/src/invitation/schemas';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import { getVisualTemplatePreviewFixture } from '@/src/templates/visualTemplate/previewFixtures';

/** Home hero preview — same template as 「완성 예시 보기」. */
export const HOME_PREVIEW_TEMPLATE_ID: VisualTemplateId = 'WEDDING_05_GARDEN';

export const HOME_PREVIEW_PATH = `/templates/${HOME_PREVIEW_TEMPLATE_ID}/preview`;

/**
 * Garden preview fixture with below-the-fold weight removed.
 * Hero / couple / greeting / schedule stay so the clipped phone still looks finished.
 * Gallery + map stay off so the home page does not load those assets.
 */
export function getHomeInvitationPreviewData(): WeddingInvitationData {
  const fixture = getVisualTemplatePreviewFixture(HOME_PREVIEW_TEMPLATE_ID);
  return {
    ...fixture,
    galleryImages: [],
    mapLat: undefined,
    mapLng: undefined,
    mapProvider: undefined,
    googlePlaceId: undefined,
    address: '',
    formattedAddress: '',
    detailAddress: '',
    accounts: [],
    accountEnabled: false,
    music: { enabled: false },
    transportInfo: [],
    parkingInfo: [],
    guestbookEnabled: false,
    commentsEnabled: false,
  };
}
