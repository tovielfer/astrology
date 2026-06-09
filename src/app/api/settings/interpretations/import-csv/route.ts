import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { extractInterpretationColumnsFromCsv, extractInterpretationColumnsFromRecords } from "@/lib/csv-settings-import";
import { planetIdSchema } from "@/lib/validation";

const supportedFileTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const planetId = planetIdSchema.parse(formData.get("planetId"));
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "CSV file is required" }, { status: 400 });
  }

  if (file.type && !supportedFileTypes.has(file.type)) {
    return NextResponse.json({ message: "Only CSV and Excel files are supported" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const columns = isExcelFile(buffer)
    ? extractInterpretationColumnsFromRecords(readExcelRecords(buffer))
    : extractInterpretationColumnsFromCsv(decodeCsvFile(buffer));

  if (columns.length === 0) {
    return NextResponse.json({ message: "No interpretation table rows were found in this file" }, { status: 400 });
  }

  return NextResponse.json({
    planetId,
    columns,
  });
}

function isExcelFile(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const startsWithZipSignature = bytes[0] === 0x50 && bytes[1] === 0x4b;

  return startsWithZipSignature;
}

function readExcelRecords(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(worksheet, {
    blankrows: false,
    defval: "",
    header: 1,
    raw: false,
  });

  return rows.map((row) => row.map((cell) => String(cell).trim()));
}

function decodeCsvFile(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const utf8Text = new TextDecoder("utf-8").decode(bytes);
  const windows1255Text = decodeWindows1255(bytes);

  return scoreHebrewText(windows1255Text) > scoreHebrewText(utf8Text) ? windows1255Text : utf8Text;
}

function decodeWindows1255(bytes: Uint8Array) {
  return Array.from(bytes, decodeWindows1255Byte).join("");
}

function decodeWindows1255Byte(byte: number) {
  if (byte < 0x80) {
    return String.fromCharCode(byte);
  }

  if (byte >= 0xe0 && byte <= 0xfa) {
    return String.fromCharCode(0x05d0 + byte - 0xe0);
  }

  return String.fromCharCode(byte);
}

function scoreHebrewText(text: string) {
  const hebrewCharacters = text.match(/[\u0590-\u05ff]/g)?.length ?? 0;
  const replacementCharacters = text.match(/\uFFFD/g)?.length ?? 0;

  return hebrewCharacters - replacementCharacters * 5;
}
