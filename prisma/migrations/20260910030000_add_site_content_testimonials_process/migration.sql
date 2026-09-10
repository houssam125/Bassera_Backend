-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "heroEyebrow" TEXT NOT NULL DEFAULT 'Creative Digital Agency',
    "heroTitleLead" TEXT NOT NULL DEFAULT 'We Build Brands',
    "heroTitleHighlight" TEXT NOT NULL DEFAULT 'That Matter',
    "heroTitleTail" TEXT NOT NULL DEFAULT 'in the Digital World',
    "heroSubtext" TEXT NOT NULL DEFAULT 'Bassera crafts premium digital experiences — from brand identity to immersive web & mobile platforms — for visionary businesses.',
    "heroPrimaryCtaLabel" TEXT NOT NULL DEFAULT 'View Our Work',
    "heroSecondaryCtaLabel" TEXT NOT NULL DEFAULT 'Start a Project',
    "contactLocation" TEXT NOT NULL DEFAULT 'Algiers, Algeria',
    "contactEmail" TEXT NOT NULL DEFAULT 'hello@bassera.agency',
    "contactPhone" TEXT NOT NULL DEFAULT '+213 (0) 555 123 456',
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT,
    "company" TEXT,
    "avatarUrl" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessStep" (
    "id" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'search',
    "visibility" "Visibility" NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_visibility_sortOrder_idx" ON "Testimonial"("visibility", "sortOrder");

-- CreateIndex
CREATE INDEX "ProcessStep_visibility_sortOrder_idx" ON "ProcessStep"("visibility", "sortOrder");

