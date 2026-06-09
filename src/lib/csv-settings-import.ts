export type ImportedCsvColumn = {
  title: string;
  rows: Array<{
    house: number;
    content: string;
  }>;
};

export function extractInterpretationColumnsFromCsv(text: string): ImportedCsvColumn[] {
  const records = parseCsv(text.replace(/^\uFEFF/, "")).filter((record) =>
    record.some((cell) => cell.trim()),
  );

  return extractInterpretationColumnsFromRecords(records);
}

export function extractInterpretationColumnsFromRecords(records: string[][]): ImportedCsvColumn[] {
  if (records.length <= 1) {
    return [];
  }

  const headers = records[0].map((cell) => cell.trim());
  const rows = records.slice(1, 13);

  return headers
    .map((title, columnIndex) => ({
      title,
      rows: rows
        .map((row, rowIndex) => ({
          house: rowIndex + 1,
          content: (row[columnIndex] ?? "").trim(),
        }))
        .filter((row) => row.content),
    }))
    .filter(
      (column, columnIndex) =>
        column.title && column.rows.length > 0 && !isHouseLabelColumn(headers[columnIndex], rows, columnIndex),
    );
}

function parseCsv(text: string) {
  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      record.push(field);
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      record.push(field);
      records.push(record);
      record = [];
      field = "";

      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      continue;
    }

    field += character;
  }

  record.push(field);
  records.push(record);

  return records;
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiters = [",", ";", "\t"];

  return delimiters.reduce((bestDelimiter, delimiter) =>
    countDelimiter(firstLine, delimiter) > countDelimiter(firstLine, bestDelimiter) ? delimiter : bestDelimiter,
  );
}

function countDelimiter(line: string, delimiter: string) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

function isHouseLabelColumn(title: string, rows: string[][], columnIndex: number) {
  const normalizedTitle = title.trim().replace(/\s+/g, "").toLowerCase();

  if (!["בית", "house"].includes(normalizedTitle)) {
    return false;
  }

  return rows.every((row, index) => {
    const value = (row[columnIndex] ?? "").trim().replace(/\s+/g, " ");

    return value === String(index + 1) || value === `בית ${index + 1}` || value.toLowerCase() === `house ${index + 1}`;
  });
}
