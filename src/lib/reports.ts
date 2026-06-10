import { getPlanetInterpretation } from "@/lib/interpretations";
import { renderPdf } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { buildReportHtml } from "@/lib/report-template";
import type { Sign } from "@/lib/astrology";

type ReportPerson = {
  name: string;
  birthDate: string | null;
  notes: string | null;
  positions: {
    planetId: string;
    house: number | null;
    sign: Sign | null;
    planet: {
      label: string;
    };
  }[];
};

export async function generateReport(personId: string) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      positions: {
        include: { planet: true },
        orderBy: { planet: { sortOrder: "asc" } },
      },
    },
  });

  if (!person) {
    throw new Error("Person not found");
  }

  const reportPerson = person as ReportPerson;
  const sections = await Promise.all(
    reportPerson.positions.map(async (position) => ({
      position,
      ...(await getPlanetInterpretation(position.planetId, position.house, position.sign)),
    })),
  );

  const html = buildReportHtml(reportPerson, sections);
  const pdf = await renderPdf(html);

  return {
    fileName: buildReportFileName(reportPerson.name),
    pdf,
  };
}

function buildReportFileName(personName: string) {
  const safeName = personName.replace(/[\\/:*?"<>|]/g, "").trim();

  return `${safeName || "report"}.pdf`;
}
