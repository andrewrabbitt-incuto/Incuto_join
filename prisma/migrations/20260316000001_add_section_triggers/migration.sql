-- Add triggers column to form_sections
-- Stores an array of SectionTrigger objects that fire when the section completes.
ALTER TABLE "form_sections" ADD COLUMN "triggers" JSONB;
