-- Rename the old enum so the new editable Planet table can use the Planet name.
ALTER TYPE "Planet" RENAME TO "PlanetEnum";

-- CreateTable
CREATE TABLE "Planet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Planet_pkey" PRIMARY KEY ("id")
);

-- Seed existing enum values as editable planet rows.
INSERT INTO "Planet" ("id", "code", "label", "sortOrder", "updatedAt")
VALUES
  ('planet_sun', 'sun', 'שמש', 0, CURRENT_TIMESTAMP),
  ('planet_moon', 'moon', 'ירח', 1, CURRENT_TIMESTAMP),
  ('planet_mercury', 'mercury', 'מרקורי', 2, CURRENT_TIMESTAMP),
  ('planet_venus', 'venus', 'ונוס', 3, CURRENT_TIMESTAMP),
  ('planet_mars', 'mars', 'מאדים', 4, CURRENT_TIMESTAMP),
  ('planet_jupiter', 'jupiter', 'צדק', 5, CURRENT_TIMESTAMP),
  ('planet_saturn', 'saturn', 'שבתאי', 6, CURRENT_TIMESTAMP);

-- Add new FK columns.
ALTER TABLE "PlanetPosition" ADD COLUMN "planetId" TEXT;
ALTER TABLE "Interpretation" ADD COLUMN "planetId" TEXT;
ALTER TABLE "InterpretationColumn" ADD COLUMN "planetId" TEXT;
ALTER TABLE "InterpretationRow" ADD COLUMN "planetId" TEXT;

-- Backfill from the old enum columns.
UPDATE "PlanetPosition" SET "planetId" = "Planet"."id" FROM "Planet" WHERE "PlanetPosition"."planet"::text = "Planet"."code";
UPDATE "Interpretation" SET "planetId" = "Planet"."id" FROM "Planet" WHERE "Interpretation"."planet"::text = "Planet"."code";
UPDATE "InterpretationColumn" SET "planetId" = "Planet"."id" FROM "Planet" WHERE "InterpretationColumn"."planet"::text = "Planet"."code";
UPDATE "InterpretationRow" SET "planetId" = "Planet"."id" FROM "Planet" WHERE "InterpretationRow"."planet"::text = "Planet"."code";

-- Drop old enum-based constraints and indexes.
DROP INDEX IF EXISTS "PlanetPosition_planet_house_idx";
DROP INDEX IF EXISTS "PlanetPosition_planet_sign_idx";
DROP INDEX IF EXISTS "PlanetPosition_personId_planet_key";
DROP INDEX IF EXISTS "Interpretation_planet_type_house_idx";
DROP INDEX IF EXISTS "Interpretation_planet_type_sign_idx";
DROP INDEX IF EXISTS "InterpretationColumn_planet_idx";
DROP INDEX IF EXISTS "InterpretationColumn_planet_sortOrder_key";
DROP INDEX IF EXISTS "InterpretationRow_planet_idx";
DROP INDEX IF EXISTS "InterpretationRow_planet_house_key";
DROP INDEX IF EXISTS "InterpretationRow_planet_sign_key";

-- Make FK columns required after backfill.
ALTER TABLE "PlanetPosition" ALTER COLUMN "planetId" SET NOT NULL;
ALTER TABLE "Interpretation" ALTER COLUMN "planetId" SET NOT NULL;
ALTER TABLE "InterpretationColumn" ALTER COLUMN "planetId" SET NOT NULL;
ALTER TABLE "InterpretationRow" ALTER COLUMN "planetId" SET NOT NULL;

-- Drop old enum columns.
ALTER TABLE "PlanetPosition" DROP COLUMN "planet";
ALTER TABLE "Interpretation" DROP COLUMN "planet";
ALTER TABLE "InterpretationColumn" DROP COLUMN "planet";
ALTER TABLE "InterpretationRow" DROP COLUMN "planet";

-- CreateIndex
CREATE UNIQUE INDEX "Planet_code_key" ON "Planet"("code");
CREATE INDEX "Planet_isActive_sortOrder_idx" ON "Planet"("isActive", "sortOrder");
CREATE INDEX "PlanetPosition_planetId_house_idx" ON "PlanetPosition"("planetId", "house");
CREATE INDEX "PlanetPosition_planetId_sign_idx" ON "PlanetPosition"("planetId", "sign");
CREATE UNIQUE INDEX "PlanetPosition_personId_planetId_key" ON "PlanetPosition"("personId", "planetId");
CREATE INDEX "Interpretation_planetId_type_house_idx" ON "Interpretation"("planetId", "type", "house");
CREATE INDEX "Interpretation_planetId_type_sign_idx" ON "Interpretation"("planetId", "type", "sign");
CREATE INDEX "InterpretationColumn_planetId_idx" ON "InterpretationColumn"("planetId");
CREATE UNIQUE INDEX "InterpretationColumn_planetId_sortOrder_key" ON "InterpretationColumn"("planetId", "sortOrder");
CREATE INDEX "InterpretationRow_planetId_idx" ON "InterpretationRow"("planetId");
CREATE UNIQUE INDEX "InterpretationRow_planetId_house_key" ON "InterpretationRow"("planetId", "house");
CREATE UNIQUE INDEX "InterpretationRow_planetId_sign_key" ON "InterpretationRow"("planetId", "sign");

-- AddForeignKey
ALTER TABLE "PlanetPosition" ADD CONSTRAINT "PlanetPosition_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Interpretation" ADD CONSTRAINT "Interpretation_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterpretationColumn" ADD CONSTRAINT "InterpretationColumn_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterpretationRow" ADD CONSTRAINT "InterpretationRow_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropEnum
DROP TYPE "PlanetEnum";
