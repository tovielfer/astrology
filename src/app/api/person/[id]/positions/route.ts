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
  const planetIds = positions.map((position) => position.planetId);

  await prisma.$transaction([
    prisma.planetPosition.deleteMany({
      where: {
        personId,
        planetId: { in: planetIds },
      },
    }),
    ...(filledPositions.length > 0
      ? [
          prisma.planetPosition.createMany({
            data: filledPositions.map((position) => ({
              personId,
              planetId: position.planetId,
              house: position.house,
              sign: position.sign,
            })),
          }),
        ]
      : []),
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
