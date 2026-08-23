-- CreateEnum
CREATE TYPE "PartType" AS ENUM ('SENSOR', 'SCREEN', 'POWER', 'CABLE', 'MECHANICAL', 'CONSUMABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "PartCondition" AS ENUM ('NEW', 'REFURBISHED');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('PART', 'SERVICE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'SPAM');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUzCyrl" TEXT NOT NULL,
    "descUz" TEXT,
    "descRu" TEXT,
    "descUzCyrl" TEXT,
    "metaTitleUz" TEXT,
    "metaTitleRu" TEXT,
    "metaTitleUzCyrl" TEXT,
    "metaDescUz" TEXT,
    "metaDescRu" TEXT,
    "metaDescUzCyrl" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'BOTH',
    "iconKey" TEXT,
    "imageUrl" TEXT,
    "ogImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL DEFAULT 'PART',
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUzCyrl" TEXT NOT NULL,
    "shortUz" TEXT,
    "shortRu" TEXT,
    "shortUzCyrl" TEXT,
    "descUz" TEXT,
    "descRu" TEXT,
    "descUzCyrl" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "priceNote" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "sku" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "warranty" TEXT,
    "originCountry" TEXT,
    "manufacturer" TEXT,
    "condition" "PartCondition" NOT NULL DEFAULT 'NEW',
    "partType" "PartType" NOT NULL DEFAULT 'OTHER',
    "packQty" INTEGER,
    "compatibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specs" JSONB NOT NULL DEFAULT '[]',
    "includesUz" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includesRu" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includesUzCyrl" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "leadTimeUz" TEXT,
    "leadTimeRu" TEXT,
    "leadTimeUzCyrl" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "metaTitleUz" TEXT,
    "metaTitleRu" TEXT,
    "metaTitleUzCyrl" TEXT,
    "metaDescUz" TEXT,
    "metaDescRu" TEXT,
    "metaDescUzCyrl" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'uz',
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "productId" TEXT,
    "productName" TEXT,
    "source" TEXT NOT NULL DEFAULT 'site',
    "telegramSent" BOOLEAN NOT NULL DEFAULT false,
    "telegramError" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "siteNameUz" TEXT NOT NULL DEFAULT 'MedService',
    "siteNameRu" TEXT NOT NULL DEFAULT 'MedService',
    "siteNameUzCyrl" TEXT NOT NULL DEFAULT 'MedService',
    "taglineUz" TEXT,
    "taglineRu" TEXT,
    "taglineUzCyrl" TEXT,
    "aboutUz" TEXT,
    "aboutRu" TEXT,
    "aboutUzCyrl" TEXT,
    "addressUz" TEXT,
    "addressRu" TEXT,
    "addressUzCyrl" TEXT,
    "workHoursUz" TEXT,
    "workHoursRu" TEXT,
    "workHoursUzCyrl" TEXT,
    "phones" JSONB NOT NULL DEFAULT '[]',
    "socials" JSONB NOT NULL DEFAULT '[]',
    "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "telegramUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "mapEmbedUrl" TEXT,
    "metaTitleUz" TEXT,
    "metaTitleRu" TEXT,
    "metaTitleUzCyrl" TEXT,
    "metaDescUz" TEXT,
    "metaDescRu" TEXT,
    "metaDescUzCyrl" TEXT,
    "defaultOgImage" TEXT,
    "termsUz" TEXT,
    "termsRu" TEXT,
    "termsUzCyrl" TEXT,
    "privacyUz" TEXT,
    "privacyRu" TEXT,
    "privacyUzCyrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "adminLogin" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_login_key" ON "admins"("login");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_isActive_idx" ON "products"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "products_isFeatured_isActive_idx" ON "products"("isFeatured", "isActive");

-- CreateIndex
CREATE INDEX "products_kind_isActive_idx" ON "products"("kind", "isActive");

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "products"("brand");

-- CreateIndex
CREATE INDEX "products_partType_isActive_idx" ON "products"("partType", "isActive");

-- CreateIndex
CREATE INDEX "requests_status_createdAt_idx" ON "requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_createdAt_idx" ON "audit_logs"("entity", "createdAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
