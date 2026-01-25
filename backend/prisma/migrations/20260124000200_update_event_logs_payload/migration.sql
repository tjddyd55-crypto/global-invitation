ALTER TABLE "event_logs" RENAME COLUMN "event_name" TO "event_type";
ALTER TABLE "event_logs" ADD COLUMN "page_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "event_logs" ADD COLUMN "metadata" JSONB;
