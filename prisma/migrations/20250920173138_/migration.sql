/*
  Warnings:

  - You are about to drop the column `level` on the `logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "logs_level_idx";

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "level";
