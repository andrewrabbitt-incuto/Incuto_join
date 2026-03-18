-- Add new FieldType enum values
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'TAX_RESIDENCY';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'LOAN_CALCULATOR';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'ADDRESS_HISTORY';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'INCOME_EXPENDITURE';

-- Add resumable flag to journeys
ALTER TABLE "journeys" ADD COLUMN IF NOT EXISTS "resumable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: journey_sessions
CREATE TABLE IF NOT EXISTS "journey_sessions" (
    "id"             TEXT NOT NULL,
    "journeyId"      TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "phone"          TEXT,
    "currentStepId"  TEXT,
    "journeyData"    JSONB NOT NULL DEFAULT '{}',
    "stepResults"    JSONB NOT NULL DEFAULT '{}',
    "resumeToken"    TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "otp"            TEXT,
    "otpExpiresAt"   TIMESTAMP(3),
    "verifiedAt"     TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "journey_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "journey_sessions_resumeToken_key"
    ON "journey_sessions"("resumeToken");

ALTER TABLE "journey_sessions"
    ADD CONSTRAINT "journey_sessions_journeyId_fkey"
    FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
