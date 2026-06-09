import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { person: true },
  });

  if (!report) {
    return NextResponse.json({ message: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
