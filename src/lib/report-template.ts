import { getSignLabel, type Sign } from "@/lib/astrology";

type Person = {
  name: string;
  birthDate: string | null;
  notes: string | null;
};

type Planet = {
  label: string;
};

type PlanetPosition = {
  planet: Planet;
  house: number;
  sign: Sign;
};

type InterpretationColumn = {
  id: string;
  title: string;
};

type InterpretationCell = {
  id: string;
  rowId: string;
  columnId: string;
  content: string;
};

type InterpretationRow = {
  id: string;
  planetId: string;
  house: number;
  sign: Sign;
};

type ReportSection = {
  position: PlanetPosition;
  columns: InterpretationColumn[];
  houseRow: (InterpretationRow & { cells: InterpretationCell[] }) | null;
  signRow: (InterpretationRow & { cells: InterpretationCell[] }) | null;
};

export function buildReportHtml(person: Person, sections: ReportSection[]) {
  const generatedAt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: A4;
        margin: 22mm 18mm;
      }

      body {
        direction: rtl;
        font-family: Arial, sans-serif;
        color: #1f2937;
        line-height: 1.65;
        margin: 0;
        background: #ffffff;
      }

      h1, h2, h3 {
        margin: 0;
      }

      .cover {
        border-bottom: 2px solid #d7c8aa;
        margin-bottom: 28px;
        padding-bottom: 18px;
      }

      .cover h1 {
        font-size: 30px;
        color: #4b3828;
      }

      .meta {
        color: #6b7280;
        font-size: 13px;
        margin-top: 8px;
      }

      .planet {
        break-inside: avoid;
        border: 1px solid #eadfce;
        border-radius: 16px;
        margin: 0 0 20px;
        padding: 18px;
      }

      .planet h2 {
        color: #4b3828;
        font-size: 22px;
        margin-bottom: 6px;
      }

      .position {
        color: #6b7280;
        margin-bottom: 14px;
      }

      .interpretation {
        margin-top: 14px;
      }

      .interpretation h3 {
        color: #6f4e37;
        font-size: 16px;
        margin-bottom: 4px;
      }

      .interpretation h4 {
        color: #4b3828;
        font-size: 14px;
        margin: 10px 0 2px;
      }

      .interpretation p {
        white-space: pre-wrap;
        margin: 0;
      }

      .missing {
        color: #9ca3af;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <header class="cover">
      <h1>מפת לידה - ${escapeHtml(person.name)}</h1>
      <div class="meta">נוצר בתאריך ${escapeHtml(generatedAt)}</div>
      ${person.birthDate ? `<div class="meta">תאריך לידה: ${escapeHtml(person.birthDate)}</div>` : ""}
      ${person.notes ? `<div class="meta">הערות: ${escapeHtml(person.notes)}</div>` : ""}
    </header>

    ${sections.map(renderSection).join("")}
  </body>
</html>`;
}

function renderSection(section: ReportSection) {
  const { position, columns, houseRow, signRow } = section;
  const planetLabel = position.planet.label;
  const signLabel = getSignLabel(position.sign);
  const interpretationGroups = buildInterpretationGroups([
    { title: `פירוש לפי בית ${position.house}`, row: houseRow },
    { title: `פירוש לפי מזל ${signLabel}`, row: signRow },
  ]).map((group) => ({
    title: group.title,
    items: columns
      .map((column) => ({
        column,
        content: group.row.cells.find((cell) => cell.columnId === column.id)?.content.trim() ?? "",
      }))
      .filter((item) => item.content),
  }));
  const hasInterpretations = interpretationGroups.some((group) => group.items.length > 0);

  return `<section class="planet">
    <h2>${escapeHtml(planetLabel)}</h2>
    <div class="position">בית ${position.house} / מזל ${escapeHtml(signLabel)}</div>

    ${
      hasInterpretations
        ? interpretationGroups
            .filter((group) => group.items.length > 0)
            .map(
              (group) => `<div class="interpretation">
      <h3>${escapeHtml(group.title)}</h3>
      ${group.items
        .map(
          (item) => `<h4>${escapeHtml(item.column.title)}</h4>
      <p>${escapeHtml(item.content)}</p>`,
        )
        .join("")}
    </div>`,
            )
            .join("")
        : `<p class="missing">לא נמצאה פרשנות מתאימה.</p>`
    }
  </section>`;
}

function buildInterpretationGroups(
  groups: Array<{ title: string; row: (InterpretationRow & { cells: InterpretationCell[] }) | null }>,
) {
  const seenRowIds = new Set<string>();

  return groups.filter((group) => {
    if (!group.row || seenRowIds.has(group.row.id)) {
      return false;
    }

    seenRowIds.add(group.row.id);
    return true;
  }) as Array<{ title: string; row: InterpretationRow & { cells: InterpretationCell[] } }>;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
