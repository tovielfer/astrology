import { NextResponse } from "next/server";
import { extractInterpretationRowsFromPdf } from "@/lib/pdf-settings-import";
import { getAllPlanets } from "@/lib/planets";
import { planetIdSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const planetId = planetIdSchema.parse(formData.get("planetId"));
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "PDF file is required" }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ message: "Only PDF files are supported" }, { status: 400 });
  }

  const planets = await getAllPlanets();
  const rows = await extractInterpretationRowsFromPdf(
    new Uint8Array(await file.arrayBuffer()),
    planets.map((planet) => planet.label),
  );

  if (rows.length === 0) {
    return NextResponse.json({ message: "No interpretation table rows were found in this PDF" }, { status: 400 });
  }

  return NextResponse.json({
    planetId,
    columnTitle: file.name.replace(/\.pdf$/i, "") || "ייבוא PDF",
    rows,
  });
}
