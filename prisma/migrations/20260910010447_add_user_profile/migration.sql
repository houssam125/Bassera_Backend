-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profileTags" TEXT[],
ADD COLUMN     "showOnTeam" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "teamOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "User_showOnTeam_teamOrder_idx" ON "User"("showOnTeam", "teamOrder");
