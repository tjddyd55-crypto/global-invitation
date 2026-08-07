/**
 * Dynamic renderer loader — avoids bundling all templates into the first paint.
 */
import type { ComponentType } from 'react';
import type { VisualTemplateId } from './ids';
import type { VisualTemplateRendererProps } from './visualTemplateRegistry';

type Loader = () => Promise<{ default: ComponentType<VisualTemplateRendererProps> }>;

const LOADERS: Record<VisualTemplateId, Loader> = {
  WEDDING_01_CLASSIC: () =>
    import('@/src/templates/weddingClassic/WeddingClassicInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  WEDDING_04_EDITORIAL: () =>
    import('@/src/templates/weddingEditorial/WeddingEditorialInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  WEDDING_05_GARDEN: () =>
    import('@/src/templates/weddingGarden/WeddingGardenInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  WEDDING_06_NIGHT: () =>
    import('@/src/templates/weddingNight/WeddingNightInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  GENERAL_01_CLASSIC: () =>
    import('@/src/templates/general/GeneralInvitationRenderer').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  GENERAL_04_CLEAN: () =>
    import('@/src/templates/generalClean/GeneralCleanInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  GENERAL_05_FESTIVE: () =>
    import('@/src/templates/generalFestive/GeneralFestiveInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  GENERAL_06_CULTURE: () =>
    import('@/src/templates/generalCulture/GeneralCultureInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
  ORGANIZATION_01_OFFICIAL: () =>
    import('@/src/templates/organizationOfficial/OrganizationOfficialInvitation').then((m) => ({
      default: m.default as ComponentType<VisualTemplateRendererProps>,
    })),
};

export function loadVisualTemplateRenderer(id: VisualTemplateId): ReturnType<Loader> {
  return LOADERS[id]();
}
