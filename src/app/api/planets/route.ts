import { NextResponse } from "next/server";
import { createPlanet, getAllPlanets } from "@/lib/planets";
import { prisma } from "@/lib/prisma";
import { createPlanetSchema, updatePlanetsSchema } from "@/lib/validation";

export async function GET() {
  const planets = await getAllPlanets();

  return NextResponse.json(planets);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = createPlanetSchema.parse(body);
  const planet = await createPlanet(data.label);

  return NextResponse.json(planet, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { planets } = updatePlanetsSchema.parse(body);

  await prisma.$transaction(
    planets.map((planet) =>
      prisma.planet.update({
        where: { id: planet.id },
        data: {
          label: planet.label,
          sortOrder: planet.sortOrder,
          isActive: planet.isActive,
          houseOnly: planet.houseOnly,
        },
      }),
    ),
  );

  return NextResponse.json(await getAllPlanets());
}
