import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
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
    lineHeight: 1.65,
    paddingVertical: 62,
    paddingHorizontal: 51,
    textAlign: "right",
  },
  cover: {
    borderBottomWidth: 2,
    borderBottomColor: "#d7c8aa",
    marginBottom: 28,
    paddingBottom: 18,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3828",
    lineHeight: 1.3,
    marginBottom: 12,
  },
  meta: {
    color: "#6b7280",
    fontSize: 10,
    marginTop: 6,
  },
  planet: {
    marginBottom: 28,
  },
  planetHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#c9b89a",
    paddingBottom: 6,
    marginBottom: 12,
  },
  planetTitle: {
    color: "#4b3828",
    fontSize: 18,
    fontWeight: "bold",
  },
  position: {
    color: "#6b7280",
    fontSize: 12,
  },
  interpretation: {
    marginTop: 12,
  },
  interpretationTitle: {
    color: "#6f4e37",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    paddingRight: 8,
    borderRightWidth: 3,
    borderRightColor: "#c9b89a",
  },
  itemTitle: {
    color: "#4b3828",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 2,
  },
  itemContent: {
    color: "#374151",
  },
  missing: {
    color: "#9ca3af",
    fontStyle: "italic",
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
    ...(position.house !== null ? [{ title: `פירוש לפי בית ${position.house}`, row: houseRow }] : []),
    ...(signLabelText ? [{ title: `פירוש לפי מזל ${signLabelText}`, row: signRow }] : []),
  ];

  const seenRowIds = new Set<string>();
  const uniqueGroups = candidates.filter((group): group is { title: string; row: InterpretationRow & { cells: InterpretationCell[] } } => {
    if (!group.row || seenRowIds.has(group.row.id)) {
      return false;
    }

    seenRowIds.add(group.row.id);
    return true;
  });

  return uniqueGroups
    .map((group) => ({
      title: group.title,
      items: columns
        .map((column) => ({
          title: column.title,
          content: group.row.cells.find((cell) => cell.columnId === column.id)?.content.trim() ?? "",
        }))
        .filter((item) => item.content)
        .map((item) => ({
          ...item,
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
