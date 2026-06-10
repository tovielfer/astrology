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
  house: number | null;
  sign: Sign | null;
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
  house: number | null;
  sign: Sign | null;
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
        margin: 0 0 28px;
        padding: 0;
      }

      .planet-header {
        display: flex;
        align-items: baseline;
        gap: 10px;
        border-bottom: 2px solid #c9b89a;
        padding-bottom: 6px;
        margin-bottom: 12px;
      }

      .planet h2 {
        color: #4b3828;
        font-size: 22px;
        margin: 0;
      }

      .position {
        color: #6b7280;
        font-size: 14px;
        margin: 0;
      }

      .interpretation {
        margin-top: 12px;
      }

      .interpretation h3 {
        color: #6f4e37;
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 6px;
        padding-right: 8px;
        border-right: 3px solid #c9b89a;
      }

      .interpretation h4 {
        color: #4b3828;
        font-size: 14px;
        margin: 10px 0 2px;
      }

      .interpretation p {
        margin: 0;
        color: #374151;
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
  const signLabelText = position.sign ? getSignLabel(position.sign) : null;
  const interpretationGroups = buildInterpretationGroups([
    ...(position.house !== null ? [{ title: `פירוש לפי בית ${position.house}`, row: houseRow }] : []),
    ...(signLabelText ? [{ title: `פירוש לפי מזל ${signLabelText}`, row: signRow }] : []),
  ]).map((group) => ({
    title: group.title,
    items: columns
      .map((column) => ({
        column,
        content: group.row.cells.find((cell) => cell.columnId === column.id)?.content.trim() ?? "",
      }))
      .filter((item) => item.content)
      .map((item) => ({ ...item, content: item.content.replace(/\n+/g, " ") })),
  }));
  const hasInterpretations = interpretationGroups.some((group) => group.items.length > 0);

  return `<section class="planet">
    <div class="planet-header">
      <h2>${escapeHtml(planetLabel)}</h2>
      <div class="position">${position.house !== null ? `בית ${position.house}` : ""}${position.house !== null && signLabelText ? " / " : ""}${signLabelText ? `מזל ${escapeHtml(signLabelText)}` : ""}</div>
    </div>

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
