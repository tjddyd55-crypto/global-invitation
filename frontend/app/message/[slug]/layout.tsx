import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getMessageCardDemoData, isMessageCardDemoSlug } from '@/src/templates/messageThankYou/data';
import { getMessageSimpleDemoData, isMessageSimpleDemoSlug } from '@/src/templates/messageSimple/data';
import { I18N_KEYS, translate, type Language } from '@/src/i18n';
import { buildCanonicalUrl, getMetadataBase } from '@/src/lib/siteUrl';

function resolveLanguage(): Language {
  const headerList = headers();
  const acceptLanguage = headerList.get('accept-language')?.toLowerCase() ?? '';
  if (acceptLanguage.includes('ko')) return 'ko';
  if (acceptLanguage.includes('mn')) return 'mn';
  return 'en';
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const metadataBase = getMetadataBase();
  const language = resolveLanguage();
  const title = translate(language, I18N_KEYS.share.titleMessage);
  const description = translate(language, I18N_KEYS.share.descriptionMessage);

  const fallbackImage = '/templates/basic.jpg';
  const demoImage = isMessageSimpleDemoSlug(params.slug)
    ? getMessageSimpleDemoData().heroImage
    : isMessageCardDemoSlug(params.slug)
      ? getMessageCardDemoData().coverImage
      : fallbackImage;

  const imageUrl = buildCanonicalUrl(demoImage);
  const pageUrl = buildCanonicalUrl(`/message/${params.slug}`);

  return {
    metadataBase,
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: 'website',
      url: pageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function MessageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
