-- Template / submission / version: store R2 object keys alongside public URLs

ALTER TABLE "templates" ADD COLUMN "thumbnail_object_key" TEXT;
ALTER TABLE "templates" ADD COLUMN "preview_thumbnail_object_key" TEXT;

ALTER TABLE "template_submissions" ADD COLUMN "preview_thumbnail_object_key" TEXT;

ALTER TABLE "template_versions" ADD COLUMN "thumbnail_object_key" TEXT;
