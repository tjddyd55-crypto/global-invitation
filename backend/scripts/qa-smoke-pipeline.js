require('dotenv/config');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const base = 'http://localhost:3001';
const created = { sessions: [], submissions: [], templates: [], invitations: [] };

function token(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

async function api(path, { method = 'GET', tokenValue, cookie, body } = {}) {
  const headers = {};
  if (tokenValue) headers.Authorization = `Bearer ${tokenValue}`;
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { status: res.status, json, headers: res.headers };
}

function studioConfig() {
  return {
    category: 'wedding',
    theme: {
      primaryColor: '#e8a3b3',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Playfair Display',
      spacingScale: 'normal',
    },
    sections: {
      hero: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'image' },
      basicInfo: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'color' },
      invitationMessage: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'color' },
      couple: { enabled: true, layout: 'split', textAlign: 'center', backgroundStyle: 'color' },
      gallery: { enabled: true, layout: 'grid', columns: 3, imageStyle: 'rounded', textAlign: 'center', backgroundStyle: 'color' },
      location: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'color', mapStyle: 'card', showTransport: true, showParking: true },
      accounts: { enabled: true, layout: 'center', textAlign: 'left', backgroundStyle: 'color' },
      messages: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'gradient' },
      rsvp: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'color' },
      share: { enabled: true, layout: 'center', textAlign: 'center', backgroundStyle: 'color' },
    },
    sectionOrder: ['hero','basicInfo','invitationMessage','couple','gallery','location','accounts','messages','rsvp','share'],
  };
}

async function main() {
  const now = Date.now();
  const creator = await prisma.user.upsert({
    where: { email: `qa.creator.smoke.${now}@example.com` },
    create: { email: `qa.creator.smoke.${now}@example.com`, isCreator: true },
    update: { isCreator: true },
  });
  const t = token('qa_creator');
  created.sessions.push(t);
  await prisma.authSession.create({
    data: { token: t, userId: creator.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  const draft = await api('/api/creator/template-submissions', {
    method: 'POST',
    tokenValue: t,
    body: {
      category: 'wedding',
      templateKeyCandidate: `qa_smoke_${now}`,
      name: `QA Smoke ${now}`,
      description: 'smoke',
      style: 'modern',
      price: 1000,
    },
  });
  if (draft.status !== 201) throw new Error(`draft create failed: ${draft.status}`);
  const submissionId = draft.json.id;
  created.submissions.push(submissionId);

  const patch = await api(`/api/creator/template-submissions/${submissionId}`, {
    method: 'PATCH',
    tokenValue: t,
    body: { studioConfig: studioConfig(), previewThumbnailUrl: `https://example.com/smoke-${now}.jpg` },
  });
  if (patch.status !== 200) throw new Error(`draft patch failed: ${patch.status}`);

  const submit = await api(`/api/creator/template-submissions/${submissionId}/submit`, { method: 'POST', tokenValue: t, body: {} });
  if (submit.status !== 200) throw new Error(`submit failed: ${submit.status}`);

  const admin = await api('/api/admin/login', {
    method: 'POST',
    body: { id: process.env.ADMIN_ID?.trim() || 'admin', password: process.env.ADMIN_PASSWORD?.trim() || 'admin!2345' },
  });
  if (admin.status !== 200) throw new Error(`admin login failed: ${admin.status}`);
  const cookie = String(admin.headers.get('set-cookie')).split(';')[0];

  const approve = await api(`/api/admin/template-submissions/${submissionId}/approve`, {
    method: 'POST',
    cookie,
    body: { reviewNote: 'smoke approve', creatorShare: 20 },
  });
  if (approve.status !== 200) throw new Error(`approve failed: ${approve.status}`);
  const templateId = approve.json.approvedTemplateId;
  created.templates.push(templateId);

  const invite = await api('/api/invitations', {
    method: 'POST',
    tokenValue: t,
    body: { templateId, data: { smoke: true }, countryCode: 'GLOBAL', language: 'en' },
  });
  if (invite.status !== 201) throw new Error(`invitation create failed: ${invite.status}`);
  created.invitations.push(invite.json.id);

  console.log(JSON.stringify({ ok: true, submissionId, templateId, invitationSlug: invite.json.slug }, null, 2));
}

async function cleanup() {
  if (created.invitations.length) await prisma.invitation.deleteMany({ where: { id: { in: created.invitations } } });
  if (created.templates.length) await prisma.template.deleteMany({ where: { id: { in: created.templates } } });
  if (created.submissions.length) await prisma.templateSubmission.deleteMany({ where: { id: { in: created.submissions } } });
  if (created.sessions.length) await prisma.authSession.deleteMany({ where: { token: { in: created.sessions } } });
}

main()
  .catch((e) => {
    console.error('[SMOKE FAILED]', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch(() => undefined);
    await prisma.$disconnect();
  });
