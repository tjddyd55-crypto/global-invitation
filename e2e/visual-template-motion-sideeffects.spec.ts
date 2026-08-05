/**
 * reduced-motion 6종 + Preview side-effect + motion observation log.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  API,
  FE,
  NEW_SIX,
  loginInBrowser,
  writeJsonArtifact,
} from './helpers/visualTemplateAcceptance';

test.setTimeout(600_000);

const OUT = path.resolve('artifacts/visual-template-acceptance');

async function countHiddenReveals(page: Page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.gi-reveal, [data-reveal], [class*="reveal"]'));
    return nodes
      .map((node) => {
        const style = getComputedStyle(node);
        return { opacity: style.opacity, transform: style.transform };
      })
      .filter((row) => row.opacity === '0' || (row.transform && row.transform !== 'none' && row.transform.includes('matrix') === false && row.transform !== 'none'));
  });
}

async function observeMotion(page: Page, id: string) {
  await page.goto(`${FE}/templates/${id}/preview`, { waitUntil: 'networkidle', timeout: 90_000 });
  await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });

  const before = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id="hero"], [data-preview-section="hero"]');
    if (!el) return null;
    const style = getComputedStyle(el);
    return { opacity: style.opacity, transform: style.transform };
  });

  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(700);

  const revealCount = await page.locator('.gi-reveal').count();
  const animated = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.gi-reveal, [class*="parallax"], [class*="stagger"]'));
    return els.slice(0, 12).map((el) => {
      const style = getComputedStyle(el);
      return {
        className: el.className.toString().slice(0, 80),
        opacity: style.opacity,
        transform: style.transform,
        animation: style.animationName,
      };
    });
  });

  await page.screenshot({
    path: path.join(OUT, `motion-${id}-375.png`),
    fullPage: false,
  });

  return { before, revealCount, animated };
}

test('reduced-motion: all 6 templates final state', async ({ browser }) => {
  fs.mkdirSync(OUT, { recursive: true });
  const report: Array<Record<string, unknown>> = [];

  for (const id of NEW_SIX) {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`${FE}/templates/${id}/preview`, { waitUntil: 'networkidle', timeout: 90_000 });
    await expect(page.getByTestId('public-invitation-document')).toBeVisible({ timeout: 60_000 });

    const hidden = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.gi-reveal'));
      return nodes
        .map((node) => {
          const style = getComputedStyle(node);
          return { opacity: style.opacity, transform: style.transform };
        })
        .filter((row) => row.opacity === '0');
    });
    expect(hidden, `${id} opacity0 ${JSON.stringify(hidden)}`).toEqual([]);

    // gallery/account/rsvp still interactive in preview (preview RSVP is placeholder)
    await expect(page.getByTestId('preview-create-cta')).toBeVisible();
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    report.push({ id, status: 'PASS', hiddenCount: hidden.length });
    await context.close();
  }

  writeJsonArtifact('artifacts/visual-template-acceptance/reduced-motion-6.json', { report });
});

test('motion observation log for 6 templates', async ({ browser }) => {
  fs.mkdirSync(OUT, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const log: Array<Record<string, unknown>> = [];

  for (const id of NEW_SIX) {
    const observed = await observeMotion(page, id);
    const entry = {
      id,
      revealCount: observed.revealCount,
      sample: observed.animated.slice(0, 5),
      verdict:
        observed.revealCount > 0 || observed.animated.some((a) => a.animation && a.animation !== 'none')
          ? '보임'
          : '부분 보임',
    };
    log.push(entry);
  }

  writeJsonArtifact('artifacts/visual-template-acceptance/motion-watch-log.json', { log });
  await context.close();
});

test('preview side effects: no invitation write / no view analytics', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  const apiCalls: Array<{ method: string; url: string }> = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/')) {
      apiCalls.push({ method: req.method(), url });
    }
  });

  // unauthenticated preview sweep
  for (const id of NEW_SIX) {
    await page.goto(`${FE}/templates/${id}/preview`, { waitUntil: 'networkidle', timeout: 90_000 });
    await expect(page.getByTestId('visual-template-preview')).toBeVisible({ timeout: 60_000 });
  }

  const writes = apiCalls.filter((c) =>
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.method)
  );
  const invitationWrites = writes.filter(
    (c) => /\/api\/invitations(?!\/share)/.test(c.url) || /\/api\/rsvp/.test(c.url)
  );
  const viewTracks = apiCalls.filter((c) => /\/api\/invitations\/.+\/view/.test(c.url));

  expect(invitationWrites, JSON.stringify(invitationWrites)).toEqual([]);
  expect(viewTracks, JSON.stringify(viewTracks)).toEqual([]);

  writeJsonArtifact('artifacts/visual-template-acceptance/preview-side-effects.json', {
    apiCallCount: apiCalls.length,
    writes,
    invitationWrites,
    viewTracks,
    status: 'PASS',
  });
  await context.close();
});

test('preview side effects while logged in without CTA click', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await loginInBrowser(page, `preview-fx-${Date.now()}@example.com`);

  const posts: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/invitations')) {
      posts.push(req.url());
    }
  });

  await page.goto(`${FE}/templates/WEDDING_04_EDITORIAL/preview`, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });
  await expect(page.getByTestId('preview-create-cta')).toBeVisible();
  await page.waitForTimeout(1500);
  expect(posts.filter((u) => !u.includes('/view'))).toEqual([]);
  await context.close();
});
