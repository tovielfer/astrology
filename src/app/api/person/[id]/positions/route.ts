import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savePositionsSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: personId } = await context.params;
  const body = await request.json();
  const { positions } = savePositionsSchema.parse(body);

  const person = await prisma.person.findUnique({ where: { id: personId } });

  if (!person) {
    return NextResponse.json({ message: "Person not found" }, { status: 404 });
  }

  const filledPositions = positions.filter((position) => position.house !== null || position.sign !== null);
  const emptyPlanetIds = positions
    .filter((position) => position.house === null && position.sign === null)
    .map((position) => position.planetId);

  await prisma.$transaction([
    prisma.planetPosition.deleteMany({
      where: {
        personId,
        planetId: { in: emptyPlanetIds },
      },
    }),
    ...filledPositions.map((position) =>
      prisma.planetPosition.upsert({
        where: {
          personId_planetId: {
            personId,
            planetId: position.planetId,
          },
        },
        update: {
          house: position.house,
          sign: position.sign,
        },
        create: {
          person: { connect: { id: personId } },
          planet: { connect: { id: position.planetId } },
          house: position.house,
          sign: position.sign,
        },
      }),
    ),
  ]);

  const updated = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      positions: {
        include: { planet: true },
        orderBy: { planet: { sortOrder: "asc" } },
      },
    },
  });

  return NextResponse.json(updated);
}
