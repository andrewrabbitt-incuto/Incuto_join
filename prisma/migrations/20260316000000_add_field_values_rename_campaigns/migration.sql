-- CreateTable: application_field_values
-- Stores one row per submitted field, enabling full-text search across applicants
-- without scanning the formData JSON blob.
--
-- The campaigns table and its FK columns are intentionally left unchanged —
-- the Prisma model was renamed from Campaign → LandingPage but @map("campaigns")
-- and @map("campaignId") preserve the existing table/column names.

CREATE TABLE "application_field_values" (
    "id"             TEXT NOT NULL,
    "applicationId"  TEXT NOT NULL,
    "fieldKey"       TEXT NOT NULL,
    "fieldLabel"     TEXT NOT NULL,
    "stringValue"    TEXT,
    "rawValue"       JSONB,
    "incutoFieldKey" TEXT,

    CONSTRAINT "application_field_values_pkey" PRIMARY KEY ("id")
);

-- Index for fast lookup by application
CREATE INDEX "application_field_values_applicationId_idx"
    ON "application_field_values"("applicationId");

-- Index for filtering/grouping by field
CREATE INDEX "application_field_values_fieldKey_idx"
    ON "application_field_values"("fieldKey");

-- Index for search across values
CREATE INDEX "application_field_values_stringValue_idx"
    ON "application_field_values"("stringValue");

-- AddForeignKey
ALTER TABLE "application_field_values"
    ADD CONSTRAINT "application_field_values_applicationId_fkey"
    FOREIGN KEY ("applicationId")
    REFERENCES "applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
