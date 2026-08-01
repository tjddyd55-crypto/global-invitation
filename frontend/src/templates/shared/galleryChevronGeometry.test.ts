/**
 * chevron 은 하나의 도형을 회전해서 쓰므로, 비율이 바뀌면 위·아래가 함께 바뀐다.
 * 여기서는 "너무 뾰족하지 않은" 시각 기준만 회귀 방지한다.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { GALLERY_CHEVRON_ICON, toRenderedPx } from './galleryChevronGeometry';

test('chevron 은 세로보다 충분히 넓다 (뾰족함 방지)', () => {
  const ratio = GALLERY_CHEVRON_ICON.spanX / GALLERY_CHEVRON_ICON.spanY;
  assert.ok(ratio >= 1.8, `가로/세로 비율 ${ratio} 은 너무 뾰족하다`);
});

test('렌더 크기가 디자인 기준 범위 안에 있다', () => {
  const width = toRenderedPx(GALLERY_CHEVRON_ICON.spanX);
  const height = toRenderedPx(GALLERY_CHEVRON_ICON.spanY);
  const stroke = toRenderedPx(GALLERY_CHEVRON_ICON.strokeWidth);

  assert.ok(width >= 11 && width <= 13, `chevron 가로 ${width}px`);
  assert.ok(height >= 6 && height <= 8, `chevron 세로 ${height}px`);
  assert.ok(stroke >= 1.8 && stroke <= 2, `stroke ${stroke}px`);
});

test('path 는 단일 SSOT 로 유지된다', () => {
  assert.equal(GALLERY_CHEVRON_ICON.path, 'M4.5 9 12 16.5 19.5 9');
  assert.equal(GALLERY_CHEVRON_ICON.viewBox, '0 0 24 24');
});
