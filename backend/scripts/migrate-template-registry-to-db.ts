import path from 'path';
import { promises as fs } from 'fs';
import prisma from '../src/lib/prisma';

type LegacyTemplateRecord = {
  id: string;
  name: string;
  category: string;
  style: string;
  description: string;
  price: number;
  creatorShare: number;
  creatorId?: string;
  component: string;
  templateKey: string;
  marketplaceType?: 'SYSTEM' | 'CREATOR';
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
};

const LEGACY_REGISTRY_PATH = path.resolve(__dirname, '../data/template-registry.json');

async function readLegacyRegistry(): Promise<LegacyTemplateRecord[]> {
  try {
    await fs.access(LEGACY_REGISTRY_PATH);
  } catch {
    return [];
  }

  const raw = await fs.readFile(LEGACY_REGISTRY_PATH, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Legacy template registry must be an array');
  }
  return parsed as LegacyTemplateRecord[];
}

async function migrate() {
  try {
    const legacyRecords = await readLegacyRegistry();
    if (legacyRecords.length === 0) {
      console.log('No legacy template-registry.json found. Skipping migration.');
      return;
    }

    for (const record of legacyRecords) {
      const creatorId = record.creatorId?.trim() || null;
      const marketplaceType = creatorId ? 'CREATOR' : 'SYSTEM';

      await prisma.template.upsert({
        where: { slug: record.id },
        create: {
          slug: record.id,
          name: record.name,
          category: record.category,
          style: record.style,
          description: record.description,
          price: Number(record.price) || 0,
          creatorShare: Number(record.creatorShare) || 0,
          creatorId,
          component: record.component,
          templateKey: record.templateKey,
          marketplaceType,
          isActive: Boolean(record.isActive),
          isDeleted: Boolean(record.isDeleted),
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        },
        update: {
          name: record.name,
          category: record.category,
          style: record.style,
          description: record.description,
          price: Number(record.price) || 0,
          creatorShare: Number(record.creatorShare) || 0,
          creatorId,
          component: record.component,
          templateKey: record.templateKey,
          marketplaceType,
          isActive: Boolean(record.isActive),
          isDeleted: Boolean(record.isDeleted),
        },
      });
    }

    await fs.unlink(LEGACY_REGISTRY_PATH).catch(() => undefined);
    console.log(`Migrated ${legacyRecords.length} template records to DB.`);
    console.log('Removed backend/data/template-registry.json after migration.');
  } finally {
    await prisma.$disconnect();
  }
}

void migrate().catch((error) => {
  console.error('Template registry migration failed:', error);
  process.exit(1);
});
