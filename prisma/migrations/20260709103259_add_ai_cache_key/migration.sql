/*
  Warnings:

  - Added the required column `cacheKey` to the `AiCallLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiCallLog" ADD COLUMN     "cacheKey" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AiCallLog_cacheKey_idx" ON "AiCallLog"("cacheKey");
