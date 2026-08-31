-- Phase 2: Visual Template Catalog (operational policy for CODE skins)

CREATE TYPE "VisualTemplateCatalogStatus" AS ENUM ('DRAFT', 'QA_READY', 'ACTIVE', 'HIDDEN', 'ARCHIVED');
CREATE TYPE "VisualTemplateSourceType" AS ENUM ('CODE', 'FIGMA_DEFINITION');
CREATE TYPE "VisualTemplateVersionStatus" AS ENUM ('DRAFT', 'QA_READY', 'ACTIVE', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS "visual_template_catalog_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_key" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "display_name_ko" TEXT NOT NULL,
    "display_name_en" TEXT NOT NULL,
    "description_ko" TEXT NOT NULL DEFAULT '',
    "description_en" TEXT NOT NULL DEFAULT '',
    "source_type" "VisualTemplateSourceType" NOT NULL DEFAULT 'CODE',
    "status" "VisualTemplateCatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "thumbnail_url" TEXT,
    "preview_url" TEXT,
    "active_version_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visual_template_catalog_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "visual_template_catalog_entries_template_key_key"
  ON "visual_template_catalog_entries"("template_key");
CREATE UNIQUE INDEX IF NOT EXISTS "visual_template_catalog_entries_active_version_id_key"
  ON "visual_template_catalog_entries"("active_version_id");
CREATE INDEX IF NOT EXISTS "visual_template_catalog_entries_concept_status_is_visible_sort_order_idx"
  ON "visual_template_catalog_entries"("concept", "status", "is_visible", "sort_order");
CREATE INDEX IF NOT EXISTS "visual_template_catalog_entries_status_is_visible_idx"
  ON "visual_template_catalog_entries"("status", "is_visible");

CREATE TABLE IF NOT EXISTS "visual_template_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "catalog_entry_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "source_type" "VisualTemplateSourceType" NOT NULL DEFAULT 'CODE',
    "status" "VisualTemplateVersionStatus" NOT NULL DEFAULT 'ACTIVE',
    "definition_json" JSONB,
    "source_metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    CONSTRAINT "visual_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "visual_template_versions_catalog_entry_id_version_key"
  ON "visual_template_versions"("catalog_entry_id", "version");
CREATE INDEX IF NOT EXISTS "visual_template_versions_catalog_entry_id_status_idx"
  ON "visual_template_versions"("catalog_entry_id", "status");

ALTER TABLE "visual_template_versions"
  ADD CONSTRAINT "visual_template_versions_catalog_entry_id_fkey"
  FOREIGN KEY ("catalog_entry_id") REFERENCES "visual_template_catalog_entries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "visual_template_catalog_entries"
  ADD CONSTRAINT "visual_template_catalog_entries_active_version_id_fkey"
  FOREIGN KEY ("active_version_id") REFERENCES "visual_template_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "visual_template_version_id" UUID;
