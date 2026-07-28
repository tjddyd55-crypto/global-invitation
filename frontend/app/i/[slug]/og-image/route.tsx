import type { ReactElement } from 'react';
import { ImageResponse } from 'next/og';
import { fetchSharedInvitationForOpenGraph } from '@/src/lib/server/shareInvitationFetch';
import {
  extractSharePresentationFromPayload,
  OG_IMAGE_FONT_STACK,
  resolveHeroImageAbsolute,
  type InvitationConceptKind,
} from '@/src/lib/invitationShareMeta';
import { getSiteBaseUrl } from '@/src/lib/siteUrl';

/** Dynamic OG PNG fallback at /og-image (not opengraph-image convention). */
export const dynamic = 'force-dynamic';

export const runtime = 'edge';

const size = { width: 1200, height: 630 };


/** 텍스트 안전 영역(양쪽·상하) */
const PAD = 80;

const FALLBACK_BG: Record<InvitationConceptKind, string> = {
  WEDDING:
    'linear-gradient(148deg, #fffdf9 0%, #fff4ee 32%, #fde8e0 58%, #f0ddd4 100%)',
  FUNERAL: [
    'linear-gradient(155deg, #070b12 0%, #1e293b 42%, #0f172a 72%, #020617 100%)',
    'repeating-linear-gradient(125deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 6px, rgba(255,255,255,0.02) 7px)',
  ].join(', '),
  GENERAL: 'linear-gradient(138deg, #f8fafc 0%, #eef2ff 44%, #e8edff 72%, #ffffff 100%)',
};

function resolveSlug(params: { slug?: string | string[] }): string {
  const raw = params?.slug;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return '';
}

async function loadNotoFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[]
> {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
    if (!css.ok) return [];
    const sheet = await css.text();
    const urls = Array.from(sheet.matchAll(/src:\s*url\(([^)]+)\)/g), (m) => m[1].replace(/['"]/g, '')).filter(Boolean);
    if (urls.length < 1) return [];
    const regularUrl = urls[0];
    const boldUrl = urls.length > 1 ? urls[1] : urls[0];
    const [reg, bol] = await Promise.all([fetch(regularUrl), fetch(boldUrl)]);
    if (!reg.ok || !bol.ok) return [];
    const [regBuf, bolBuf] = await Promise.all([reg.arrayBuffer(), bol.arrayBuffer()]);
    return [
      { name: 'Noto Sans KR', data: regBuf, weight: 400 as const, style: 'normal' as const },
      { name: 'Noto Sans KR', data: bolBuf, weight: 700 as const, style: 'normal' as const },
    ];
  } catch {
    return [];
  }
}

const OG_RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, must-revalidate',
};

function ogImageResponse(body: ReactElement, fonts: Awaited<ReturnType<typeof loadNotoFonts>>) {
  return new ImageResponse(body, {
    ...size,
    fonts: fonts.length > 0 ? fonts : undefined,
    headers: OG_RESPONSE_HEADERS,
  });
}

export async function GET(
  _request: Request,
  context: { params: { slug?: string | string[] } }
) {
  const slug = resolveSlug(context.params);
  const fonts = await loadNotoFonts();

  const fallbackPresentation = extractSharePresentationFromPayload(null);

  if (!slug) {
    return ogImageResponse(
      <FallbackOg concept="GENERAL" titleLines={['초대장']} detailLines={[]} tone="행사에 초대드립니다" />,
      fonts
    );
  }

  let payload: unknown = null;
  try {
    payload = await fetchSharedInvitationForOpenGraph(slug);
  } catch {
    payload = null;
  }

  const site = getSiteBaseUrl();
  const pres = payload
    ? extractSharePresentationFromPayload(payload, { siteOrigin: site, purpose: 'public-meta' })
    : fallbackPresentation;
  const heroAbs =
    resolveHeroImageAbsolute(pres.imageUrl || null, site) ||
    resolveHeroImageAbsolute(pres.heroImageRaw, site);
  const concept = pres.concept;
  const bg = FALLBACK_BG[concept];
  const isDark = concept === 'FUNERAL';
  const titleColor = isDark ? '#f9fafb' : heroAbs && concept === 'WEDDING' ? '#ffffff' : '#111827';
  const detailColor = isDark ? '#e2e8f0' : heroAbs && concept === 'WEDDING' ? '#f1f5f9' : '#374151';
  const toneColor = isDark ? '#94a3b8' : heroAbs && concept === 'WEDDING' ? '#e2e8f0' : '#6b7280';

  const overlay =
    heroAbs && concept === 'WEDDING'
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.52) 100%)'
      : heroAbs && concept === 'FUNERAL'
        ? 'linear-gradient(90deg, rgba(7,11,18,0.9) 0%, rgba(15,23,42,0.58) 52%, rgba(15,23,42,0.32) 100%)'
        : heroAbs && concept === 'GENERAL'
          ? 'linear-gradient(to bottom, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.93) 100%)'
          : null;

  const alignItems = concept === 'FUNERAL' ? ('flex-start' as const) : ('center' as const);
  const textAlign = concept === 'FUNERAL' ? ('left' as const) : ('center' as const);

  const cardWrap =
    concept === 'GENERAL' && !heroAbs
      ? {
          display: 'flex',
          flexDirection: 'column' as const,
          background: 'rgba(255,255,255,0.94)',
          borderRadius: 28,
          padding: 48,
          boxShadow: '0 28px 56px rgba(67,56,202,0.12), 0 8px 24px rgba(15,23,42,0.08)',
          border: '1px solid rgba(99,102,241,0.28)',
          maxWidth: 920,
        }
      : concept === 'GENERAL' && heroAbs
        ? {
            display: 'flex',
            flexDirection: 'column' as const,
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 28,
            padding: 48,
            boxShadow: '0 24px 48px rgba(15,23,42,0.2)',
            maxWidth: 920,
          }
        : null;

  try {
    return ogImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: 'flex',
            position: 'relative',
            background: bg,
            fontFamily: OG_IMAGE_FONT_STACK,
          }}
        >
          {heroAbs ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires img
            <img
              alt=""
              src={heroAbs}
              width={1200}
              height={630}
              style={{
                position: 'absolute',
                inset: 0,
                width: 1200,
                height: 630,
                objectFit: 'cover',
              }}
            />
          ) : null}
          {overlay ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: overlay,
              }}
            />
          ) : null}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems,
              width: 1200,
              height: 630,
              padding: PAD,
              boxSizing: 'border-box',
            }}
          >
            <div style={cardWrap ?? { display: 'flex', flexDirection: 'column' as const, alignItems, maxWidth: 1040 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 10,
                  alignItems,
                  textAlign,
                  width: cardWrap ? '100%' : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: cardWrap && concept === 'GENERAL' ? '#111827' : titleColor,
                    letterSpacing: concept === 'FUNERAL' ? '-0.02em' : '-0.03em',
                    fontFamily: OG_IMAGE_FONT_STACK,
                    maxWidth: '100%',
                  }}
                >
                  {pres.titleLines[0]}
                </div>
                {pres.titleLines[1] ? (
                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: cardWrap && concept === 'GENERAL' ? '#111827' : titleColor,
                      fontFamily: OG_IMAGE_FONT_STACK,
                      maxWidth: '100%',
                    }}
                  >
                    {pres.titleLines[1]}
                  </div>
                ) : null}
              </div>
              {pres.detailLines.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: 8,
                    marginTop: 20,
                    alignItems,
                    textAlign,
                    width: cardWrap ? '100%' : undefined,
                  }}
                >
                  {pres.detailLines.map((line, i) => (
                    <div
                      key={`d-${i}`}
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        lineHeight: 1.4,
                        color: cardWrap && concept === 'GENERAL' ? '#374151' : detailColor,
                        fontFamily: OG_IMAGE_FONT_STACK,
                        maxWidth: '100%',
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ) : null}
              <div
                style={{
                  marginTop: 28,
                  fontSize: 24,
                  fontWeight: 400,
                  color: cardWrap && concept === 'GENERAL' ? '#6366f1' : toneColor,
                  textAlign,
                  alignSelf: alignItems === 'flex-start' ? 'flex-start' : 'center',
                  fontFamily: OG_IMAGE_FONT_STACK,
                  maxWidth: '100%',
                }}
              >
                {pres.toneTagline}
              </div>
            </div>
          </div>
        </div>
      ),
      fonts
    );
  } catch {
    return ogImageResponse(
      <FallbackOg concept={pres.concept} titleLines={pres.titleLines} detailLines={[]} tone={pres.toneTagline} />,
      fonts
    );
  }
}

function FallbackOg({
  concept,
  titleLines,
  detailLines,
  tone,
}: {
  concept: InvitationConceptKind;
  titleLines: [string] | [string, string];
  detailLines: string[];
  tone: string;
}) {
  const bg = FALLBACK_BG[concept];
  const isDark = concept === 'FUNERAL';
  const titleColor = isDark ? '#f9fafb' : '#111827';
  const toneColor = isDark ? '#94a3b8' : '#6b7280';
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        background: bg,
        fontFamily: OG_IMAGE_FONT_STACK,
        padding: PAD,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: titleColor,
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 1040,
          fontFamily: OG_IMAGE_FONT_STACK,
        }}
      >
        {titleLines[0]}
      </div>
      {titleLines[1] ? (
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: titleColor,
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 1.2,
            maxWidth: 1040,
            fontFamily: OG_IMAGE_FONT_STACK,
          }}
        >
          {titleLines[1]}
        </div>
      ) : null}
      {detailLines.map((line, i) => (
        <div
          key={`f-${i}`}
          style={{
            fontSize: 28,
            color: isDark ? '#e2e8f0' : '#374151',
            marginTop: 14,
            fontFamily: OG_IMAGE_FONT_STACK,
            maxWidth: 1040,
          }}
        >
          {line}
        </div>
      ))}
      <div style={{ fontSize: 24, color: toneColor, marginTop: 28, fontFamily: OG_IMAGE_FONT_STACK }}>{tone}</div>
    </div>
  );
}
