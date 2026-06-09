import { NextResponse } from "next/server";
import { generateReport } from "@/lib/reports";
import { generateReportSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const { personId } = generateReportSchema.parse(body);

  try {
    const report = await generateReport(personId);
    const encodedFileName = encodeURIComponent(report.fileName);

    return new Response(new Blob([report.pdf], { type: "application/pdf" }), {
      status: 201,
      headers: {
        "Content-Disposition": `attachment; filename="report.pdf"; filename*=UTF-8''${encodedFileName}`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Person not found") {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    throw error;
  }
}
