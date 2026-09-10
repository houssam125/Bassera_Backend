-- CreateEnum
CREATE TYPE "Division" AS ENUM ('social', 'software');

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "icon" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Capability_slug_key" ON "Capability"("slug");

-- CreateIndex
CREATE INDEX "Capability_division_visibility_sortOrder_idx" ON "Capability"("division", "visibility", "sortOrder");
