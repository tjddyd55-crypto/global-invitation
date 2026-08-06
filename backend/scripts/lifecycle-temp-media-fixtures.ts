/**
 * QA lifecycle fixtures for temp invitation media (development only).
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import prisma from '../src/lib/prisma';
import { deleteFile, uploadFile } from '../src/lib/storage/uploadToR2';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, resolveR2Config } from '../src/lib/storage/r2Client';
import {
  auditTempInvitationMedia,
  cleanupTempInvitationMedia,
  isEligibleTempInvitationUserAssetKey,
} from '../src/lib/tempInvitationMedia';
import { getInvitationAssetEnvironment, getInvitationRootPrefix } from '../src/lib/invitationAssetKeys';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

type Fixture = {
  label: string;
  mediaFileId: string;
  objectKey: string;
  expectCandidate: boolean;
};

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function objectExists(key: string): Promise<boolean> {
  const cfg = resolveR2Config();
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: cfg.bucketName, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const env = getInvitationAssetEnvironment();
  if (env !== 'development') {
    throw new Error(`Refusing fixture run outside development (env=${env})`);
  }

  const root = getInvitationRootPrefix();
  const stamp = Date.now().toString(36);
  const email = `qa-temp-media-${stamp}@example.com`;

  const user = await prisma.user.create({
    data: {
      email,
      nickname: `qa-temp-${stamp}`,
      role: 'USER',
    },
  });

  const invitation = await prisma.invitation.create({
    data: {
      ownerType: 'USER',
      ownerId: user.id,
      userId: user.id,
      slug: `qa-temp-media-${stamp}`,
      title: 'QA Temp Media Lifecycle',
      templateKey: 'invitation_full',
      isDeleted: false,
      dataJson: {
        templateType: 'FULL',
        conceptType: 'WEDDING',
        title: 'QA',
        galleryImages: [],
      },
    },
  });

  let dataJson = (invitation.dataJson as Record<string, unknown>) || {};
  const fixtures: Fixture[] = [];

  async function createFixture(opts: {
    label: string;
    scope: string;
    ageHours: number;
    attachInDataJson: boolean;
    expectCandidate: boolean;
  }) {
    const fileName = `${randomUUID()}.png`;
    const objectKey = [root, env, 'users', user.id, 'invitations', invitation.id, opts.scope, fileName].join('/');
    if (!isEligibleTempInvitationUserAssetKey(objectKey)) {
      throw new Error(`non-canonical fixture key: ${objectKey}`);
    }
    await uploadFile(TINY_PNG, objectKey, 'image/png');
    const publicUrl = `https://cdn.example.test/${objectKey}`;
    const media = await prisma.mediaFile.create({
      data: {
        ownerId: user.id,
        ownerType: 'INVITATION',
        ownerRefId: invitation.id,
        objectKey,
        publicUrl,
        url: publicUrl,
        fileName,
        mimeType: 'image/png',
        fileSize: TINY_PNG.length,
        usage: opts.scope,
        createdAt: hoursAgo(opts.ageHours),
      },
    });
    if (opts.attachInDataJson) {
      const gallery = Array.isArray(dataJson.galleryImages) ? [...(dataJson.galleryImages as string[])] : [];
      gallery.push(publicUrl);
      dataJson = { ...dataJson, galleryImages: gallery };
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { dataJson },
      });
    }
    fixtures.push({
      label: opts.label,
      mediaFileId: media.id,
      objectKey,
      expectCandidate: opts.expectCandidate,
    });
  }

  await createFixture({
    label: 'A_ATTACHED_AGED',
    scope: 'gallery',
    ageHours: 100,
    attachInDataJson: true,
    expectCandidate: false,
  });
  await createFixture({
    label: 'B_TEMP_AGED',
    scope: 'gallery',
    ageHours: 100,
    attachInDataJson: false,
    expectCandidate: true,
  });
  await createFixture({
    label: 'C_TEMP_RECENT',
    scope: 'hero',
    ageHours: 12,
    attachInDataJson: false,
    expectCandidate: false,
  });

  const audit = await auditTempInvitationMedia({ now: new Date() });
  const candidateKeys = new Set(audit.candidates.map((c) => c.objectKey));
  const checks = fixtures.map((f) => ({
    label: f.label,
    expectCandidate: f.expectCandidate,
    actualCandidate: candidateKeys.has(f.objectKey),
    pass: candidateKeys.has(f.objectKey) === f.expectCandidate,
  }));

  if (checks.some((c) => !c.pass)) {
    console.error(JSON.stringify({ phase: 'pre-execute-checks', checks, candidateCount: audit.candidateCount }, null, 2));
    throw new Error('Fixture candidate classification failed');
  }

  const execute = await cleanupTempInvitationMedia({
    execute: true,
    forceManual: true,
    now: new Date(),
  });

  const b = fixtures.find((f) => f.label === 'B_TEMP_AGED')!;
  const a = fixtures.find((f) => f.label === 'A_ATTACHED_AGED')!;
  const c = fixtures.find((f) => f.label === 'C_TEMP_RECENT')!;

  const after = {
    bDeletedR2: !(await objectExists(b.objectKey)),
    aStillInR2: await objectExists(a.objectKey),
    cStillInR2: await objectExists(c.objectKey),
    bSoftDeleted: Boolean((await prisma.mediaFile.findUnique({ where: { id: b.mediaFileId } }))?.deletedAt),
    aActive: !(await prisma.mediaFile.findUnique({ where: { id: a.mediaFileId } }))?.deletedAt,
    cActive: !(await prisma.mediaFile.findUnique({ where: { id: c.mediaFileId } }))?.deletedAt,
    executeDeletedR2: execute.deletedR2,
    executeFailed: execute.failed.length,
    bWasPlanned: execute.audit.candidates.some((x) => x.objectKey === b.objectKey),
  };

  const remainingKeys = [a.objectKey, c.objectKey];
  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id: invitation.id }, data: { isDeleted: true } });
    await tx.mediaFile.updateMany({
      where: { ownerRefId: invitation.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await tx.cleanupJob.createMany({
      data: remainingKeys.map((r2Key) => ({
        resourceType: 'INVITATION',
        resourceId: invitation.id,
        r2Key,
        scheduledAt: new Date(),
      })),
    });
  });

  // Soft-deleted invitation media must NOT be temp-cleanup candidates (already soft-deleted)
  const auditAfterSoftDelete = await auditTempInvitationMedia({ now: new Date() });
  const softDeleteOverlap = auditAfterSoftDelete.candidates.filter(
    (cand) => cand.objectKey === a.objectKey || cand.objectKey === c.objectKey || cand.objectKey === b.objectKey
  );

  const jobs = await prisma.cleanupJob.findMany({
    where: { resourceId: invitation.id, status: 'PENDING' },
  });
  for (const job of jobs) {
    try {
      await deleteFile(job.r2Key);
    } catch {
      // idempotent
    }
    await prisma.cleanupJob.update({ where: { id: job.id }, data: { status: 'DONE' } });
  }

  const postDelete = {
    aGone: !(await objectExists(a.objectKey)),
    cGone: !(await objectExists(c.objectKey)),
    jobsDone: jobs.length,
    softDeleteOverlapCount: softDeleteOverlap.length,
  };

  await prisma.cleanupJob.deleteMany({ where: { resourceId: invitation.id } });
  await prisma.mediaFile.deleteMany({ where: { ownerId: user.id } });
  await prisma.invitation.delete({ where: { id: invitation.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const report = {
    ok:
      after.bDeletedR2 &&
      after.aStillInR2 &&
      after.cStillInR2 &&
      after.bSoftDeleted &&
      after.aActive &&
      after.cActive &&
      postDelete.aGone &&
      postDelete.cGone &&
      postDelete.softDeleteOverlapCount === 0,
    checks,
    after,
    postDelete,
    note: 'QA fixtures removed after verification',
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error('[lifecycle-fixture] failed', error instanceof Error ? error.message : error);
  process.exit(1);
});