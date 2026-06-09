import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interpretationSchema } from "@/lib/validation";

export async function GET() {
  const interpretations = await prisma.interpretation.findMany({
    include: { planet: true },
    orderBy: [{ planet: { sortOrder: "asc" } }, { type: "asc" }, { house: "asc" }, { sign: "asc" }],
  });

  return NextResponse.json(interpretations);
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = interpretationSchema.parse(body);

  const interpretation = await prisma.interpretation.create({
    data: {
      planetId: data.planetId,
      type: data.type,
      house: data.type === "house" || data.type === "mixed" ? data.house : null,
      sign: data.type === "sign" || data.type === "mixed" ? data.sign : null,
      title: data.title,
      content: data.content,
      category: data.category || null,
    },
  });

  return NextResponse.json(interpretation, { status: 201 });
}
