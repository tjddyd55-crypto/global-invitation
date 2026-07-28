import type { Metadata } from 'next';
import { extractSharePresentationFromPayload } from '@/src/lib/invitationShareMeta';
import { fetchSharedInvitationCached } from '@/src/lib/server/fetchSharedInvitationCached';
import { buildCanonicalUrl, getMetadataBase, getSiteBaseUrl } from '@/src/lib/siteUrl';
import PublicInvitationLayout from '@/src/components/layout/PublicInvitationLayout';

/** Invitation별 OG는 저장 직후 반영 — 장기 static cache 금지 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

function openGraphImageRouteUrl(metadataBase: URL | undefined, slug: string): string {
  // Non-convention route — Next.js opengraph-image.* would override CDN og:image.
  const path = `/i/${slug}/og-image`;
  if (!metadataBase) return path;
  try {
    return new URL(path, metadataBase).toString();
  } catch {
    return path;
  }
}

/**
 * 메타/OG URL은 NEXT_PUBLIC_SITE_URL(https 권장) 기준 canonical.
 * 카카오·페이스북은 자체 OG 캐시가 있어, 문구/이미지 변경 후 플랫폼 도구에서 링크 갱신이 필요하다.
 */
export async function generateMetadata({ params }: { params: { slug?: string | string[] } }): Promise<Metadata> {
  const slug = resolveSafeSlug(params?.slug);
  const canonicalPath = buildCanonicalUrl(slug ? `/i/${slug}` : '/i');
  const metadataBase = getMetadataBase();
  const siteOrigin = getSiteBaseUrl() || metadataBase?.origin || '';

  const fallbackTitle = '초대장';
  const fallbackDescription = '행사에 초대드립니다';

  if (!slug) {
    return {
      metadataBase,
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        type: 'website',
        url: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        images: metadataBase ? [{ url: new URL('/default-og.png', metadataBase).toString() }] : undefined,
      },
    };
  }

  const dynamicOgRoute = openGraphImageRouteUrl(metadataBase, slug);

  try {
    const payload = await fetchSharedInvitationCached(slug);
    if (!payload) {
      throw new Error('NOT_FOUND');
    }
    const pres = extractSharePresentationFromPayload(payload, {
      canonicalUrl: canonicalPath,
      siteOrigin,
    });
    const imageUrl = pres.imageUrl || dynamicOgRoute;

    return {
      metadataBase,
      title: pres.metaTitle,
      description: pres.metaDescription,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: pres.metaTitle,
        description: pres.metaDescription,
        type: 'website',
        url: canonicalPath,
        locale: 'ko_KR',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: pres.metaTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: pres.metaTitle,
        description: pres.metaDescription,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      metadataBase,
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        type: 'website',
        url: canonicalPath,
        locale: 'ko_KR',
        images: [
          {
            url: dynamicOgRoute,
            width: 1200,
            height: 630,
            alt: fallbackTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        images: [dynamicOgRoute],
      },
    };
  }
}

export default function PublicShareLayout({ children }: { children: React.ReactNode }) {
  return <PublicInvitationLayout>{children}</PublicInvitationLayout>;
}
