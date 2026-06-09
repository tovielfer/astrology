import type { Sign } from "@/lib/astrology";
import { getPlanetReportSettings } from "@/lib/interpretation-settings";

type InterpretationColumn = {
  id: string;
  title: string;
  sortOrder: number;
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

export type PlanetInterpretation = {
  columns: InterpretationColumn[];
  houseRow: (InterpretationRow & { cells: InterpretationCell[] }) | null;
  signRow: (InterpretationRow & { cells: InterpretationCell[] }) | null;
};

export async function getPlanetInterpretation(
  planetId: string,
  house: number,
  sign: Sign,
): Promise<PlanetInterpretation> {
  const { columns, houseRow, signRow } = await getPlanetReportSettings(planetId, house, sign);

  return {
    columns,
    houseRow,
    signRow,
  };
}
