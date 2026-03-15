-- ============================================================
-- Incuto Join — Full setup script for Railway PostgreSQL
-- Run this in the Railway database Query tab (or psql)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');
CREATE TYPE "CommonBondType" AS ENUM ('GEOGRAPHICAL', 'POSTCODE', 'EMPLOYMENT', 'COMMUNITY', 'ASSOCIATION');
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "FormType" AS ENUM ('STANDARD', 'SAVINGS_ONLY', 'LOAN', 'ISA', 'CORPORATE', 'CHILDREN', 'CAMPAIGN');
CREATE TYPE "FieldType" AS ENUM (
  'TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'RADIO',
  'CHECKBOX', 'TEXTAREA', 'FILE_UPLOAD', 'HEADING', 'PARAGRAPH', 'DIVIDER',
  'COMMON_BOND_SELECTOR', 'PRODUCT_SELECTOR', 'MEMBER_TYPE_SELECTOR', 'SIGNATURE',
  'ADDRESS_LOOKUP', 'SORT_CODE', 'ACCOUNT_NUMBER', 'NATIONAL_INSURANCE', 'ID_UPLOAD',
  'CONSENT', 'DECLARATION', 'LOAN_AMOUNT', 'LOAN_PURPOSE', 'LOAN_TERM'
);
CREATE TYPE "FieldWidth" AS ENUM ('FULL', 'HALF', 'THIRD', 'TWO_THIRDS');
CREATE TYPE "ApplicationStatus" AS ENUM (
  'STARTED', 'IN_PROGRESS', 'SUBMITTED', 'ID_CHECK_PENDING', 'ID_CHECK_FAILED',
  'VOUCHSAFE_PENDING', 'COMPLETED', 'REJECTED', 'ABANDONED'
);
CREATE TYPE "MemberType" AS ENUM ('INDIVIDUAL', 'CORPORATE', 'CHILD', 'JOINT');
CREATE TYPE "IdCheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'REQUIRES_MORE_INFO');
CREATE TYPE "VouchsafeStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "tenants" (
  "id"                  TEXT        NOT NULL PRIMARY KEY,
  "name"                TEXT        NOT NULL,
  "slug"                TEXT        NOT NULL UNIQUE,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  "primaryColor"        TEXT        NOT NULL DEFAULT '#1E40AF',
  "secondaryColor"      TEXT        NOT NULL DEFAULT '#DBEAFE',
  "accentColor"         TEXT        NOT NULL DEFAULT '#3B82F6',
  "logoUrl"             TEXT,
  "faviconUrl"          TEXT,
  "fontFamily"          TEXT        NOT NULL DEFAULT 'Inter',
  "borderRadius"        TEXT        NOT NULL DEFAULT '8',
  "customCss"           TEXT,
  "incutoApiUrl"        TEXT,
  "incutoApiKey"        TEXT,
  "incutoTenantId"      TEXT,
  "idCheckEnabled"      BOOLEAN     NOT NULL DEFAULT TRUE,
  "vouchsafeEnabled"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "aiChatbotEnabled"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "chatbotPersonality"  TEXT
);

CREATE TABLE "users" (
  "id"        TEXT        NOT NULL PRIMARY KEY,
  "tenantId"  TEXT        NOT NULL REFERENCES "tenants"("id"),
  "email"     TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "password"  TEXT,
  "role"      "UserRole"  NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "email")
);

CREATE TABLE "common_bonds" (
  "id"          TEXT            NOT NULL PRIMARY KEY,
  "tenantId"    TEXT            NOT NULL REFERENCES "tenants"("id"),
  "name"        TEXT            NOT NULL,
  "type"        "CommonBondType" NOT NULL,
  "description" TEXT,
  "values"      JSONB           NOT NULL,
  "isActive"    BOOLEAN         NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)    NOT NULL
);

CREATE TABLE "forms" (
  "id"                TEXT         NOT NULL PRIMARY KEY,
  "tenantId"          TEXT         NOT NULL REFERENCES "tenants"("id"),
  "name"              TEXT         NOT NULL,
  "slug"              TEXT         NOT NULL,
  "description"       TEXT,
  "status"            "FormStatus" NOT NULL DEFAULT 'DRAFT',
  "formType"          "FormType"   NOT NULL DEFAULT 'STANDARD',
  "includesSavings"   BOOLEAN      NOT NULL DEFAULT TRUE,
  "includesLoan"      BOOLEAN      NOT NULL DEFAULT FALSE,
  "allowsCorporate"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "allowsChildren"    BOOLEAN      NOT NULL DEFAULT FALSE,
  "loanRedirectUrl"   TEXT,
  "loanJourneyEmbed"  BOOLEAN      NOT NULL DEFAULT FALSE,
  "brandingOverride"  JSONB,
  "chatbotEnabled"    BOOLEAN      NOT NULL DEFAULT FALSE,
  "chatbotConfig"     JSONB,
  "requireCommonBond" BOOLEAN      NOT NULL DEFAULT TRUE,
  "publishedAt"       TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "slug")
);

CREATE TABLE "form_sections" (
  "id"          TEXT         NOT NULL PRIMARY KEY,
  "formId"      TEXT         NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "title"       TEXT         NOT NULL,
  "description" TEXT,
  "helpText"    TEXT,
  "infoButton"  JSONB,
  "order"       INTEGER      NOT NULL,
  "conditions"  JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);

CREATE TABLE "form_fields" (
  "id"              TEXT         NOT NULL PRIMARY KEY,
  "sectionId"       TEXT         NOT NULL REFERENCES "form_sections"("id") ON DELETE CASCADE,
  "fieldKey"        TEXT         NOT NULL,
  "fieldType"       "FieldType"  NOT NULL,
  "label"           TEXT         NOT NULL,
  "placeholder"     TEXT,
  "helpText"        TEXT,
  "infoButton"      JSONB,
  "required"        BOOLEAN      NOT NULL DEFAULT FALSE,
  "order"           INTEGER      NOT NULL,
  "validation"      JSONB,
  "options"         JSONB,
  "incutoFieldKey"  TEXT,
  "isSystemField"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "systemFieldName" TEXT,
  "conditions"      JSONB,
  "width"           "FieldWidth" NOT NULL DEFAULT 'FULL',
  "cssClass"        TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);

CREATE TABLE "campaigns" (
  "id"           TEXT         NOT NULL PRIMARY KEY,
  "tenantId"     TEXT         NOT NULL REFERENCES "tenants"("id"),
  "name"         TEXT         NOT NULL,
  "description"  TEXT,
  "utmSource"    TEXT,
  "utmMedium"    TEXT,
  "utmCampaign"  TEXT,
  "utmContent"   TEXT,
  "trackingCode" TEXT         NOT NULL UNIQUE,
  "isActive"     BOOLEAN      NOT NULL DEFAULT TRUE,
  "startsAt"     TIMESTAMP(3),
  "endsAt"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL
);

CREATE TABLE "campaign_forms" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "campaignId" TEXT NOT NULL REFERENCES "campaigns"("id"),
  "formId"     TEXT NOT NULL REFERENCES "forms"("id"),
  UNIQUE("campaignId", "formId")
);

CREATE TABLE "applications" (
  "id"                   TEXT                 NOT NULL PRIMARY KEY,
  "tenantId"             TEXT                 NOT NULL REFERENCES "tenants"("id"),
  "formId"               TEXT                 NOT NULL REFERENCES "forms"("id"),
  "campaignId"           TEXT                 REFERENCES "campaigns"("id"),
  "sessionId"            TEXT                 NOT NULL UNIQUE,
  "status"               "ApplicationStatus"  NOT NULL DEFAULT 'STARTED',
  "memberType"           "MemberType"         NOT NULL DEFAULT 'INDIVIDUAL',
  "products"             JSONB                NOT NULL,
  "formData"             JSONB,
  "idCheckStatus"        "IdCheckStatus",
  "idCheckData"          JSONB,
  "idCheckAttempts"      INTEGER              NOT NULL DEFAULT 0,
  "vouchsafeStatus"      "VouchsafeStatus",
  "vouchsafeData"        JSONB,
  "incutoMemberId"       TEXT,
  "incutoSubmittedAt"    TIMESTAMP(3),
  "incutoResponse"       JSONB,
  "loanApplicationId"    TEXT,
  "loanRedirectedAt"     TIMESTAMP(3),
  "currentSectionIndex"  INTEGER              NOT NULL DEFAULT 0,
  "completedSections"    JSONB                NOT NULL DEFAULT '[]',
  "dropoutSection"       TEXT,
  "dropoutAt"            TIMESTAMP(3),
  "ipAddress"            TEXT,
  "userAgent"            TEXT,
  "referrer"             TEXT,
  "utmParams"            JSONB,
  "startedAt"            TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt"          TIMESTAMP(3),
  "completedAt"          TIMESTAMP(3),
  "updatedAt"            TIMESTAMP(3)         NOT NULL
);

CREATE TABLE "application_events" (
  "id"            TEXT         NOT NULL PRIMARY KEY,
  "applicationId" TEXT         NOT NULL REFERENCES "applications"("id"),
  "eventType"     TEXT         NOT NULL,
  "eventData"     JSONB,
  "sectionIndex"  INTEGER,
  "fieldKey"      TEXT,
  "timestamp"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "form_analytics_snapshots" (
  "id"                   TEXT         NOT NULL PRIMARY KEY,
  "formId"               TEXT         NOT NULL,
  "date"                 TIMESTAMP(3) NOT NULL,
  "period"               TEXT         NOT NULL,
  "totalStarts"          INTEGER      NOT NULL DEFAULT 0,
  "totalCompletions"     INTEGER      NOT NULL DEFAULT 0,
  "totalDropouts"        INTEGER      NOT NULL DEFAULT 0,
  "totalSubmissions"     INTEGER      NOT NULL DEFAULT 0,
  "dropoutBySectionData" JSONB,
  "avgCompletionTime"    DOUBLE PRECISION,
  "savingsCount"         INTEGER      NOT NULL DEFAULT 0,
  "loanCount"            INTEGER      NOT NULL DEFAULT 0,
  "bothCount"            INTEGER      NOT NULL DEFAULT 0,
  "individualCount"      INTEGER      NOT NULL DEFAULT 0,
  "corporateCount"       INTEGER      NOT NULL DEFAULT 0,
  "childCount"           INTEGER      NOT NULL DEFAULT 0,
  "campaignData"         JSONB,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("formId", "date", "period")
);

-- ─────────────────────────────────────────────────────────────
-- SEED: Demo tenant, admin user, common bonds, campaigns
-- Password 'demo' hashed with bcrypt cost 10
-- ─────────────────────────────────────────────────────────────

INSERT INTO "tenants" (
  "id", "name", "slug", "updatedAt",
  "primaryColor", "secondaryColor", "accentColor", "fontFamily", "borderRadius",
  "idCheckEnabled", "vouchsafeEnabled", "aiChatbotEnabled"
) VALUES (
  'demo-tenant-001', 'Demo Credit Union', 'demo-credit-union', NOW(),
  '#1E40AF', '#DBEAFE', '#3B82F6', 'Inter', '8',
  TRUE, TRUE, TRUE
);

INSERT INTO "users" (
  "id", "tenantId", "email", "name", "password", "role", "updatedAt"
) VALUES (
  'demo-user-001', 'demo-tenant-001', 'admin@demo-cu.co.uk', 'Demo Admin',
  '$2a$10$DBxrRS5h306VPu2xs29p/.TALbCu9gZA0Y7RQcBjMz.x.tvlXARwa',
  'OWNER', NOW()
);

INSERT INTO "common_bonds" (
  "id", "tenantId", "name", "type", "description", "values", "updatedAt"
) VALUES
(
  'bond-001', 'demo-tenant-001', 'Greater Manchester Area', 'GEOGRAPHICAL',
  'Live or work in Greater Manchester',
  '["M1","M2","M3","M4","M5","M6","M8","M9","M11","M12","M13","M14","M15","M16","M20","M21","M22","M23","M40","M41","M45","M60","Salford","Trafford","Stockport","Tameside"]',
  NOW()
),
(
  'bond-002', 'demo-tenant-001', 'NHS Employees', 'EMPLOYMENT',
  'Current NHS employees',
  '["Manchester University NHS Trust","Salford Royal NHS Trust","Stockport NHS Foundation Trust","NHS England"]',
  NOW()
);

INSERT INTO "campaigns" (
  "id", "tenantId", "name", "utmSource", "utmMedium", "utmCampaign",
  "trackingCode", "isActive", "updatedAt"
) VALUES
(
  'campaign-001', 'demo-tenant-001', 'Facebook January Campaign',
  'facebook', 'social', 'jan_2025', 'FB2501', TRUE, NOW()
),
(
  'campaign-002', 'demo-tenant-001', 'Email Newsletter Q1',
  'email', 'newsletter', 'q1_2025', 'EM2501', TRUE, NOW()
);
