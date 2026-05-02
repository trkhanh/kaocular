-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('LOG', 'INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "issue_text" TEXT NOT NULL,
    "solution_text" TEXT,
    "tags" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "embedding_generated_at" TIMESTAMP(3),
    "embedding" extensions.vector,
    "text_search" tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, issue_text)) STORED,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logs_text_search_idx" ON "logs"("text_search");

-- CreateIndex
CREATE INDEX "logs_timestamp_idx" ON "logs"("timestamp");

-- CreateIndex
CREATE INDEX "logs_level_idx" ON "logs"("level");

-- CreateIndex
CREATE INDEX "logs_tags_idx" ON "logs"("tags");

-- CreateIndex
CREATE INDEX "logs_embedding_idx" ON "logs"("embedding");