import { NextResponse } from "next/server";
import { getAllInterpretationSettings, savePlanetInterpretationSettings } from "@/lib/interpretation-settings";
import { saveInterpretationSettingsSchema } from "@/lib/validation";

export async function GET() {
  const settings = await getAllInterpretationSettings();

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const data = saveInterpretationSettingsSchema.parse(body);
  const settings = await savePlanetInterpretationSettings(data);

  return NextResponse.json(settings);
}
