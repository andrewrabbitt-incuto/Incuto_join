-- ─────────────────────────────────────────────────────────────
-- Migration: landing pages content + analytics events + custom domains
-- ─────────────────────────────────────────────────────────────

-- Custom domain on tenants
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "customDomain" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key"
  ON "tenants" ("customDomain");

-- Extend campaigns (LandingPage) with full-page content fields
ALTER TABLE "campaigns"
  ADD COLUMN IF NOT EXISTS "slug"           TEXT,
  ADD COLUMN IF NOT EXISTS "published"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pageTitle"      TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "ogImageUrl"     TEXT,
  ADD COLUMN IF NOT EXISTS "content"        JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_tenantId_slug_key"
  ON "campaigns" ("tenantId", "slug")
  WHERE "slug" IS NOT NULL;

-- Analytics events table
CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id"            TEXT NOT NULL,
  "tenantId"      TEXT NOT NULL,
  "eventType"     TEXT NOT NULL,
  "landingPageId" TEXT,
  "formId"        TEXT,
  "journeyId"     TEXT,
  "sessionId"     TEXT NOT NULL,
  "utmSource"     TEXT,
  "utmMedium"     TEXT,
  "utmCampaign"   TEXT,
  "referrer"      TEXT,
  "metadata"      JSONB,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "analytics_events_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE,
  CONSTRAINT "analytics_events_landingPageId_fkey"
    FOREIGN KEY ("landingPageId") REFERENCES "campaigns" ("id") ON DELETE SET NULL,
  CONSTRAINT "analytics_events_formId_fkey"
    FOREIGN KEY ("formId") REFERENCES "forms" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "analytics_events_tenantId_eventType_createdAt_idx"
  ON "analytics_events" ("tenantId", "eventType", "createdAt");

CREATE INDEX IF NOT EXISTS "analytics_events_tenantId_formId_eventType_idx"
  ON "analytics_events" ("tenantId", "formId", "eventType");

CREATE INDEX IF NOT EXISTS "analytics_events_tenantId_journeyId_eventType_idx"
  ON "analytics_events" ("tenantId", "journeyId", "eventType");

CREATE INDEX IF NOT EXISTS "analytics_events_tenantId_landingPageId_eventType_idx"
  ON "analytics_events" ("tenantId", "landingPageId", "eventType");
