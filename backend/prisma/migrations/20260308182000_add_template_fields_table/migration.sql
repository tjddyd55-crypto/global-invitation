-- Template field definition table for dynamic editor forms
CREATE TABLE IF NOT EXISTS "template_fields" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
  "field_name" TEXT NOT NULL,
  "field_type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "placeholder" TEXT NOT NULL DEFAULT '',
  "is_required" BOOLEAN NOT NULL DEFAULT FALSE,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  UNIQUE ("template_id", "field_name")
);

CREATE INDEX IF NOT EXISTS "template_fields_template_id_sort_order_idx"
  ON "template_fields"("template_id", "sort_order");

-- Seed example wedding fields (if wedding-korean-classic template exists)
INSERT INTO "template_fields" (
  "template_id",
  "field_name",
  "field_type",
  "label",
  "placeholder",
  "is_required",
  "sort_order"
)
SELECT
  t."id",
  seed."field_name",
  seed."field_type",
  seed."label",
  seed."placeholder",
  seed."is_required",
  seed."sort_order"
FROM "templates" t
JOIN (
  VALUES
    ('groom_name', 'text', '신랑 이름', '예: 김민준', TRUE, 1),
    ('bride_name', 'text', '신부 이름', '예: 이유진', TRUE, 2),
    ('date', 'datetime', '예식 일시', '예: 2026-05-16 14:00', TRUE, 3),
    ('location', 'text', '예식 장소', '예: 더링크호텔 서울 3층', TRUE, 4),
    ('message', 'textarea', '초대 메시지', '소중한 분들을 초대합니다.', FALSE, 5)
) AS seed("field_name", "field_type", "label", "placeholder", "is_required", "sort_order")
  ON TRUE
WHERE t."slug" = 'wedding-korean-classic'
ON CONFLICT ("template_id", "field_name") DO NOTHING;
