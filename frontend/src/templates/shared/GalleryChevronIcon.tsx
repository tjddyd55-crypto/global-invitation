import type { SVGProps } from 'react';
import { GALLERY_CHEVRON_ICON } from './galleryChevronGeometry';

/**
 * 갤러리 펼치기/접기 전용 chevron.
 * 접힘(아래)·펼침(위) 모두 이 컴포넌트를 쓰고 방향은 호출부 CSS rotate 로만 바꾼다.
 * 텍스트 glyph 를 쓰지 않아 브라우저·폰트와 무관하게 같은 비율로 그려진다.
 */
export default function GalleryChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={GALLERY_CHEVRON_ICON.size}
      height={GALLERY_CHEVRON_ICON.size}
      viewBox={GALLERY_CHEVRON_ICON.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={GALLERY_CHEVRON_ICON.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d={GALLERY_CHEVRON_ICON.path} />
    </svg>
  );
}
