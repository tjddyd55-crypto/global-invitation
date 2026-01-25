CREATE TABLE "event_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_name" TEXT NOT NULL,
    "template_type" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);
