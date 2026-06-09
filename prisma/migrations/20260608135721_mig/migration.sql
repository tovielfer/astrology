-- CreateEnum
CREATE TYPE "Planet" AS ENUM ('sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn');

-- CreateEnum
CREATE TYPE "Sign" AS ENUM ('aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces');

-- CreateEnum
CREATE TYPE "InterpretationType" AS ENUM ('house', 'sign', 'mixed');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanetPosition" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "planet" "Planet" NOT NULL,
    "house" INTEGER NOT NULL,
    "sign" "Sign" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanetPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interpretation" (
    "id" TEXT NOT NULL,
    "planet" "Planet" NOT NULL,
    "type" "InterpretationType" NOT NULL,
    "house" INTEGER,
    "sign" "Sign",
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interpretation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanetPosition_planet_house_idx" ON "PlanetPosition"("planet", "house");

-- CreateIndex
CREATE INDEX "PlanetPosition_planet_sign_idx" ON "PlanetPosition"("planet", "sign");

-- CreateIndex
CREATE UNIQUE INDEX "PlanetPosition_personId_planet_key" ON "PlanetPosition"("personId", "planet");

-- CreateIndex
CREATE INDEX "Interpretation_planet_type_house_idx" ON "Interpretation"("planet", "type", "house");

-- CreateIndex
CREATE INDEX "Interpretation_planet_type_sign_idx" ON "Interpretation"("planet", "type", "sign");

-- AddForeignKey
ALTER TABLE "PlanetPosition" ADD CONSTRAINT "PlanetPosition_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
