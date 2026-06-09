import { PDFParse } from "pdf-parse";
import { SIGNS } from "@/lib/astrology";

export type ImportedPdfRow = {
  house: number;
  content: string;
};

const houseMarkerRegex = /(?:^|[\n/])\s*ב\s*י\s*ת\s*(1[0-2]|[1-9])(?!\d)(?!\s*[-–])/g;
const repeatedTableHeader = "דחפים, הבעה עצמית";
const defaultPlanetHeadingLabels = [
  "שמש",
  "ירח",
  "מרקורי",
  "ונוס",
  "מאדים",
  "מרס",
  "צדק",
  "יופיטר",
  "שבתאי",
  "סטורן",
];

export async function extractInterpretationRowsFromPdf(
  data: Uint8Array,
  planetLabels: string[] = [],
): Promise<ImportedPdfRow[]> {
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText({
      cellSeparator: " ",
      pageJoiner: "\n",
    });

    return extractRowsFromText(result.text, planetLabels);
  } finally {
    await parser.destroy();
  }
}

function extractRowsFromText(text: string, planetLabels: string[]) {
  const normalizedText = normalizeExtractedText(text);
  const matches = Array.from(normalizedText.matchAll(houseMarkerRegex));
  const rowsByHouse = new Map<number, string>();
  const planetHeadingLabels = new Set([...defaultPlanetHeadingLabels, ...planetLabels].map((label) => compactLabel(label)));

  matches.forEach((match, index) => {
    const house = Number(match[1]);

    if (rowsByHouse.has(house) || match.index == null) {
      return;
    }

    const contentStart = match.index + match[0].length;
    const contentEnd = matches[index + 1]?.index ?? normalizedText.length;
    const content = cleanRowContent(normalizedText.slice(contentStart, contentEnd), planetHeadingLabels);

    if (content) {
      rowsByHouse.set(house, content);
    }
  });

  return Array.from(rowsByHouse.entries())
    .sort(([firstHouse], [secondHouse]) => firstHouse - secondHouse)
    .map(([house, content]) => ({ house, content }));
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/\t/g, " ");
}

function cleanRowContent(content: string, planetHeadingLabels: Set<string>) {
  const headerIndex = content.lastIndexOf(repeatedTableHeader);
  const withoutRepeatedHeader = headerIndex > 0 ? content.slice(0, headerIndex) : content;
  const lines = withoutRepeatedHeader
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  stripNextRowHeading(lines, planetHeadingLabels);

  return lines
    .join(" ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripNextRowHeading(lines: string[], planetHeadingLabels: Set<string>) {
  while (lines.length > 0 && isSignHeading(lines[lines.length - 1])) {
    lines.pop();
  }

  while (lines.length > 0 && isPlanetHeading(lines[lines.length - 1], planetHeadingLabels)) {
    lines.pop();
  }
}

function isSignHeading(line: string) {
  const compactLine = compactLabel(line);

  return SIGNS.some((sign) => compactLine === sign.label || compactLine === `ב${sign.label}`);
}

function isPlanetHeading(line: string, planetHeadingLabels: Set<string>) {
  return planetHeadingLabels.has(compactLabel(line));
}

function compactLabel(label: string) {
  return label.replace(/\s+/g, "");
}
