-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIGURING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OutfitBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OutfitBlock_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutfitBlockImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "angle" TEXT,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutfitBlockImage_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "OutfitBlock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OutfitBlockImage_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "articleCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Garment_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Garment_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "OutfitBlock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garmentId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "hexColor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Variant_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Variant_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "OutfitBlock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Variant_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stopRequested" BOOLEAN NOT NULL DEFAULT false,
    "resumeToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GenerationJob_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "garmentId" TEXT,
    "variantId" TEXT,
    "angle" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Generation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Generation_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Generation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenerationLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
