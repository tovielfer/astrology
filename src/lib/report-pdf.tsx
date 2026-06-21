import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { getSignLabel, SIGNS, type Sign } from "@/lib/astrology";

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
  forHouse: boolean;
  forSign: boolean;
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

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) {
    return;
  }

  const fontDir = path.join(process.cwd(), "src", "lib", "fonts");

  Font.register({
    family: "Rubik",
    fonts: [
      { src: path.join(fontDir, "Rubik-Regular.ttf") },
      { src: path.join(fontDir, "Rubik-Bold.ttf"), fontWeight: "bold" },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Rubik",
    fontSize: 11,
    color: "#1f2937",
    lineHeight: 1.4,
    paddingVertical: 24,
    paddingHorizontal: 51,
    textAlign: "right",
  },
  cover: {
    borderBottomWidth: 2,
    borderBottomColor: "#d7c8aa",
    marginBottom: 12,
    paddingBottom: 8,
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4b3828",
    lineHeight: 1.2,
    marginBottom: 4,
  },
  meta: {
    color: "#6b7280",
    fontSize: 10,
    marginTop: 2,
  },
  planet: {
    marginBottom: 10,
  },
  planetHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#c9b89a",
    paddingBottom: 3,
    marginBottom: 5,
  },
  planetTitle: {
    color: "#4b3828",
    fontSize: 17,
    fontWeight: "bold",
  },
  position: {
    color: "#6b7280",
    fontSize: 12,
  },
  interpretation: {
    marginTop: 6,
  },
  interpretationTitle: {
    color: "#6f4e37",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
    paddingRight: 8,
    borderRightWidth: 3,
    borderRightColor: "#c9b89a",
  },
  itemTitle: {
    color: "#4b3828",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 1,
  },
  itemContent: {
    color: "#374151",
  },
  missing: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  handwriting: {
    marginTop: 6,
  },
  handwritingLabel: {
    color: "#4b3828",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  handwritingLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#c9b89a",
    height: 20,
  },
});

type InterpretationGroup = {
  title: string;
  items: { title: string; content: string }[];
};

function buildSectionGroups(section: ReportSection): InterpretationGroup[] {
  const { position, columns, houseRow, signRow } = section;
  const signLabelText = position.sign ? getSignLabel(position.sign) : null;

  const candidates = [
    ...(signLabelText
      ? [{ title: `פירוש לפי מזל ${signLabelText}`, row: signRow, dimension: "sign" as const }]
      : []),
    ...(position.house !== null
      ? [{ title: `פירוש לפי בית ${position.house}`, row: houseRow, dimension: "house" as const }]
      : []),
  ];

  const presentGroups = candidates.filter(
    (group): group is { title: string; row: InterpretationRow & { cells: InterpretationCell[] }; dimension: "house" | "sign" } =>
      group.row !== null,
  );

  const seenCells = new Set<string>();

  return presentGroups
    .map((group) => ({
      title: group.title,
      items: columns
        .filter((column) => (group.dimension === "house" ? column.forHouse : column.forSign))
        .map((column) => ({
          title: column.title,
          content: group.row.cells.find((cell) => cell.columnId === column.id)?.content.trim() ?? "",
          cellKey: `${group.row.id}:${column.id}`,
        }))
        .filter((item) => {
          if (!item.content || seenCells.has(item.cellKey)) {
            return false;
          }

          seenCells.add(item.cellKey);
          return true;
        })
        .map((item) => ({
          title: item.title,
          content: item.content
            .replace(/\r\n?/g, "\n")
            .replace(/[ \t]+$/gm, "")
            .replace(/^[ \t]+/gm, "")
            .replace(/\n{2,}/g, "\u0000")
            .replace(/\n/g, " ")
            .replace(/\u0000/g, "\n\n"),
        })),
    }))
    .filter((group) => group.items.length > 0);
}

function getHouseNaturalSign(section: ReportSection): Sign | null {
  if (section.position.house === null) {
    return null;
  }

  return section.houseRow?.sign ?? SIGNS[section.position.house - 1]?.value ?? null;
}

function PositionText({ house, signLabel }: { house: number | null; signLabel: string | null }) {
  const parts: string[] = [];

  if (house !== null) {
    parts.push(`בית ${house}`);
  }

  if (signLabel) {
    parts.push(`מזל ${signLabel}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return <Text style={styles.position}>{parts.join(" / ")}</Text>;
}

function ReportDocument({ person, sections }: { person: Person; sections: ReportSection[] }) {
  const generatedAt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverTitle}>מפת לידה - {person.name}</Text>
          <Text style={styles.meta}>נוצר בתאריך {generatedAt}</Text>
          {person.birthDate ? <Text style={styles.meta}>תאריך לידה: {person.birthDate}</Text> : null}
          {person.notes ? <Text style={styles.meta}>הערות: {person.notes}</Text> : null}
        </View>

        {sections.map((section, index) => {
          const signLabelText = section.position.sign ? getSignLabel(section.position.sign) : null;
          const groups = buildSectionGroups(section);
          const houseNaturalSign = getHouseNaturalSign(section);

          return (
            <View key={index} style={styles.planet}>
              <View style={styles.planetHeader} wrap={false}>
              <PositionText house={section.position.house} signLabel={signLabelText} />
                <Text style={styles.planetTitle}>{section.position.planet.label}</Text>
              </View>

              {groups.length > 0 ? (
                groups.map((group, groupIndex) => (
                  <View key={groupIndex} style={styles.interpretation}>
                    <Text style={styles.interpretationTitle}>{group.title}</Text>
                    {group.items.map((item, itemIndex) => (
                      <View key={itemIndex}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemContent}>{item.content}</Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.missing}>לא נמצאה פרשנות מתאימה.</Text>
              )}

              {houseNaturalSign ? (
                <View style={styles.handwriting}>
                  <Text style={styles.handwritingLabel}>תכונות מזל {getSignLabel(houseNaturalSign)} (למילוי בכתב יד)</Text>
                  <View style={styles.handwritingLine} />
                  <View style={styles.handwritingLine} />
                </View>
              ) : null}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function renderReportPdf(person: Person, sections: ReportSection[]): Promise<Buffer> {
  registerFonts();

  return renderToBuffer(<ReportDocument person={person} sections={sections} />);
}
