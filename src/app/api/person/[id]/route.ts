import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      positions: {
        include: { planet: true },
        orderBy: { planet: { sortOrder: "asc" } },
      },
      reports: {
        orderBy: { generatedAt: "desc" },
      },
    },
  });

  if (!person) {
    return NextResponse.json({ message: "Person not found" }, { status: 404 });
  }

  return NextResponse.json(person);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await prisma.person.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Person not found" }, { status: 404 });
  }
  await prisma.person.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
