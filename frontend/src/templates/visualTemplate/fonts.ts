import { DM_Serif_Display, Gowun_Batang, Noto_Sans_KR } from 'next/font/google';

/**
 * Visual template fonts — next/font (no raw Google CSS @import in templates).
 * Apply `visualTemplateFonts.className` on invitation root wrappers.
 */
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-gi-dm-serif',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

const gowunBatang = Gowun_Batang({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gi-gowun',
  display: 'swap',
  fallback: ['Batang', 'serif'],
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-gi-noto',
  display: 'swap',
  fallback: ['Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
});

export const visualTemplateFonts = {
  className: `${dmSerif.variable} ${gowunBatang.variable} ${notoSansKr.variable}`,
  style: {
    // Consumers set font-family via CSS vars in template modules
  } as const,
};
