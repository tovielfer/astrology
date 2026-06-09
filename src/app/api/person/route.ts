import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { personSchema } from "@/lib/validation";

export async function GET() {
  const people = await prisma.person.findMany({
    include: {
      positions: {
        include: { planet: true },
        orderBy: { planet: { sortOrder: "asc" } },
      },
      reports: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = personSchema.parse(body);

  const person = await prisma.person.create({
    data: {
      name: data.name,
      birthDate: data.birthDate || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(person, { status: 201 });
}
