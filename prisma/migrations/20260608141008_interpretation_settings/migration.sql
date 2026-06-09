-- CreateTable
CREATE TABLE "InterpretationColumn" (
    "id" TEXT NOT NULL,
    "planet" "Planet" NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpretationColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterpretationRow" (
    "id" TEXT NOT NULL,
    "planet" "Planet" NOT NULL,
    "house" INTEGER NOT NULL,
    "sign" "Sign" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpretationRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterpretationCell" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpretationCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterpretationColumn_planet_idx" ON "InterpretationColumn"("planet");

-- CreateIndex
CREATE UNIQUE INDEX "InterpretationColumn_planet_sortOrder_key" ON "InterpretationColumn"("planet", "sortOrder");

-- CreateIndex
CREATE INDEX "InterpretationRow_planet_idx" ON "InterpretationRow"("planet");

-- CreateIndex
CREATE UNIQUE INDEX "InterpretationRow_planet_house_key" ON "InterpretationRow"("planet", "house");

-- CreateIndex
CREATE UNIQUE INDEX "InterpretationRow_planet_sign_key" ON "InterpretationRow"("planet", "sign");

-- CreateIndex
CREATE INDEX "InterpretationCell_columnId_idx" ON "InterpretationCell"("columnId");

-- CreateIndex
CREATE UNIQUE INDEX "InterpretationCell_rowId_columnId_key" ON "InterpretationCell"("rowId", "columnId");

-- AddForeignKey
ALTER TABLE "InterpretationCell" ADD CONSTRAINT "InterpretationCell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "InterpretationRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterpretationCell" ADD CONSTRAINT "InterpretationCell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "InterpretationColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
