import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { expect, test, type Page } from '@playwright/test';

// Isolated HTTP backend fixtures exercise the real Next rewrite without a database.
const user = { id: 'fixture-user', email: 'fixture@example.com', nickname: 'Fixture', role: 'USER' };
const token = 'fixture-session';
const cookie = `auth_session_token=${token}; HttpOnly; Path=/; SameSite=Lax`;
let holdAnonymous = false;
let staleBootstrap: ServerResponse | undefined;
let authenticatedChecks = 0;
const backend = createServer(handleApi);

function handleApi(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/api/auth/login' || req.url === '/api/auth/signup') {
    res.setHeader('Set-Cookie', cookie);
    res.end(JSON.stringify({ token, user }));
    return;
  }
  if (req.url === '/api/auth/me') {
    const authenticated = req.headers.cookie?.includes(`auth_session_token=${token}`) || req.headers.authorization === `Bearer ${token}`;
    if (authenticated) {
      authenticatedChecks++;
      res.end(JSON.stringify(user));
      return;
    }
    res.statusCode = 401;
    if (holdAnonymous) { staleBootstrap = res; return; }
    res.end('{}');
    return;
  }
  if (req.url?.startsWith('/api/invitations')) { res.end('[]'); return; }
  res.end('{}');
}

test.beforeAll(async () => {
  await new Promise<void>((resolve) => backend.listen(3101, '127.0.0.1', resolve));
});
test.afterAll(async () => {
  backend.closeAllConnections();
  await new Promise<void>((resolve, reject) => backend.close((error) => error ? reject(error) : resolve()));
});
test.beforeEach(() => { holdAnonymous = false; staleBootstrap = undefined; authenticatedChecks = 0; });
test.afterEach(() => { staleBootstrap?.end('{}'); });

function prefix(projectName: string) { return projectName === 'mobile' ? '/m' : '/pc'; }

async function fillLogin(page: Page) {
  await page.locator('input[autocomplete="username"]').fill('fixture-user');
  await page.locator('input[autocomplete="current-password"]').fill('fixture-password');
  await page.locator('button[type="submit"]').click();
}

async function expectSessionPersists(page: Page, destination: string) {
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  expect(authenticatedChecks).toBeGreaterThan(0);
  const cookies = await page.context().cookies();
  expect(cookies.find((entry) => entry.name === 'auth_session_token')).toMatchObject({ httpOnly: true, domain: '127.0.0.1', path: '/' });
  // Cookie alone must bootstrap after a full document reload.
  await page.evaluate(() => { localStorage.removeItem('auth_session_v1'); sessionStorage.clear(); });
  await page.reload();
  await expect(page.getByTestId('my-invitations-workspace')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
}

for (const param of ['next', 'redirect']) {
  test(`login honors ${param} and persists with cookie and bearer`, async ({ page }, testInfo) => {
    const destination = `${prefix(testInfo.project.name)}/my-invitations`;
    const apiRequests: string[] = [];
    page.on('request', (req) => { if (new URL(req.url()).pathname.startsWith('/api/')) apiRequests.push(req.url()); });
    await page.goto(`${prefix(testInfo.project.name)}/login?${param}=${encodeURIComponent(destination)}`);
    await expect.poll(() => page.locator('input[autocomplete="username"]').isVisible()).toBeTruthy();
    await fillLogin(page);
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    // Bearer/localStorage fallback must survive reload with cookies removed.
    await page.context().clearCookies();
    await page.reload();
    await expect(page.getByTestId('my-invitations-workspace')).toBeVisible();
    // Restore the fixture cookie through the real proxy before cookie-only checks.
    await page.request.post('/api/auth/login', { data: { username: 'fixture-user', password: 'fixture-password' } });
    await expectSessionPersists(page, destination);
    expect(apiRequests.every((url) => new URL(url).origin === 'http://127.0.0.1:3100')).toBeTruthy();
  });

  test(`signup honors ${param} and persists after reload`, async ({ page }, testInfo) => {
    const destination = `${prefix(testInfo.project.name)}/my-invitations`;
    await page.goto(`${prefix(testInfo.project.name)}/signup?${param}=${encodeURIComponent(destination)}`);
    await page.locator('input[autocomplete="email"]').fill('fixture@example.com');
    await page.locator('input[autocomplete="new-password"]').fill('fixture-password');
    await page.locator('button[type="submit"]').click();
    await expectSessionPersists(page, destination);
  });
}

test('late unauthenticated bootstrap cannot overwrite login refresh', async ({ page }, testInfo) => {
  holdAnonymous = true;
  const destination = `${prefix(testInfo.project.name)}/my-invitations`;
  await page.goto(`${prefix(testInfo.project.name)}/login?next=${encodeURIComponent(destination)}`);
  await expect.poll(() => Boolean(staleBootstrap)).toBeTruthy();
  await fillLogin(page);
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  const staleResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/me') && response.status() === 401);
  staleBootstrap?.end('{}');
  await (await staleResponse).finished();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('my-invitations-workspace')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('my-invitations-workspace')).toBeVisible();
});
