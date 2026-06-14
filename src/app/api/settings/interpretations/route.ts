import { NextResponse } from "next/server";
import {
  getAllInterpretationSettings,
  getPlanetInterpretationSettings,
  savePlanetInterpretationSettings,
} from "@/lib/interpretation-settings";
import { saveInterpretationSettingsSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const planetId = searchParams.get("planetId");

  if (planetId) {
    const settings = await getPlanetInterpretationSettings(planetId);

    return NextResponse.json(settings);
  }

  const settings = await getAllInterpretationSettings();

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const data = saveInterpretationSettingsSchema.parse(body);
  const settings = await savePlanetInterpretationSettings(data);

  return NextResponse.json(settings);
}
