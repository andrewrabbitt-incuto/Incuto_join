-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "StepType" AS ENUM ('START', 'FORM', 'ID_CHECK', 'CREDIT_CHECK', 'CONDITION', 'END');

-- CreateTable: journeys
CREATE TABLE "journeys" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "slug"        TEXT NOT NULL,
    "status"      "JourneyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable: journey_steps
CREATE TABLE "journey_steps" (
    "id"        TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "type"      "StepType" NOT NULL,
    "title"     TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formId"    TEXT,
    "config"    JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable: journey_edges
CREATE TABLE "journey_edges" (
    "id"           TEXT NOT NULL,
    "journeyId"    TEXT NOT NULL,
    "sourceStepId" TEXT NOT NULL,
    "targetStepId" TEXT NOT NULL,
    "condition"    JSONB,
    "label"        TEXT,
    "order"        INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "journey_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journeys_tenantId_slug_key" ON "journeys"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "journeys"
    ADD CONSTRAINT "journeys_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "journey_steps"
    ADD CONSTRAINT "journey_steps_journeyId_fkey"
    FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journey_steps"
    ADD CONSTRAINT "journey_steps_formId_fkey"
    FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "journey_edges"
    ADD CONSTRAINT "journey_edges_sourceStepId_fkey"
    FOREIGN KEY ("sourceStepId") REFERENCES "journey_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journey_edges"
    ADD CONSTRAINT "journey_edges_targetStepId_fkey"
    FOREIGN KEY ("targetStepId") REFERENCES "journey_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
