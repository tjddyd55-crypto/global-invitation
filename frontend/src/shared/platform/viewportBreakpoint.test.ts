import assert from 'node:assert/strict';
import {
  VIEWPORT_BREAKPOINT_PX,
  resolveViewportPlatformFromWidth,
} from './viewportBreakpoint';

assert.equal(VIEWPORT_BREAKPOINT_PX, 1024);

assert.equal(resolveViewportPlatformFromWidth(375), 'mobile');
assert.equal(resolveViewportPlatformFromWidth(390), 'mobile');
assert.equal(resolveViewportPlatformFromWidth(768), 'mobile');
assert.equal(resolveViewportPlatformFromWidth(834), 'mobile');
assert.equal(resolveViewportPlatformFromWidth(1023), 'mobile');
assert.equal(resolveViewportPlatformFromWidth(1024), 'desktop');
assert.equal(resolveViewportPlatformFromWidth(1440), 'desktop');

console.log('viewportBreakpoint.test.ts PASS');
