ALTER TABLE "users"
ALTER COLUMN "id"
SET DEFAULT gen_random_uuid();

ALTER TABLE "templates"
ALTER COLUMN "price" TYPE integer
USING "price"::integer;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_templates_updated_at ON "templates";
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON "templates"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitations_updated_at ON "invitations";
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON "invitations"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_templates_active
ON "templates"("is_active")
WHERE "is_deleted" = false;

CREATE INDEX IF NOT EXISTS idx_invitations_slug
ON "invitations"("slug");
