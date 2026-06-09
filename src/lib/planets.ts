import { prisma } from "@/lib/prisma";

export async function getActivePlanets() {
  return prisma.planet.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getAllPlanets() {
  return prisma.planet.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createPlanet(label: string) {
  const sortOrder = await prisma.planet.count();
  const codeBase = slugifyPlanetLabel(label) || `planet-${Date.now()}`;
  const code = await createUniquePlanetCode(codeBase);

  return prisma.planet.create({
    data: {
      code,
      label,
      sortOrder,
    },
  });
}

async function createUniquePlanetCode(codeBase: string) {
  let code = codeBase;
  let suffix = 2;

  while (await prisma.planet.findUnique({ where: { code } })) {
    code = `${codeBase}-${suffix}`;
    suffix += 1;
  }

  return code;
}

function slugifyPlanetLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
