import { SIGNS, type Sign } from "@/lib/astrology";
import { getActivePlanets } from "@/lib/planets";
import { prisma } from "@/lib/prisma";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;
type PlanetReference = { id: string };

export type SaveInterpretationSettingsInput = {
  planetId: string;
  columns: Array<{
    clientId: string;
    title: string;
    sortOrder: number;
  }>;
  cells: Array<{
    house: number;
    columnClientId: string;
    content: string;
  }>;
};

export async function getAllInterpretationSettings() {
  const planets = await getActivePlanets();

  await Promise.all(
    planets.map((planet: PlanetReference) => ensurePlanetInterpretationSettings(planet.id)),
  );

  const settings = await Promise.all(
    planets.map((planet: PlanetReference) => getPlanetInterpretationSettings(planet.id)),
  );

  return settings;
}

export async function getPlanetInterpretationSettings(planetId: string) {
  await ensurePlanetInterpretationSettings(planetId);

  const [planet, columns, rows] = await Promise.all([
    prisma.planet.findUnique({
      where: { id: planetId },
    }),
    prisma.interpretationColumn.findMany({
      where: { planetId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.interpretationRow.findMany({
      where: { planetId },
      include: {
        cells: true,
      },
      orderBy: { house: "asc" },
    }),
  ]);

  if (!planet) {
    throw new Error("Planet not found");
  }

  return {
    planet,
    planetId,
    columns,
    rows,
  };
}

export async function getPlanetReportSettings(planetId: string, house: number | null, sign: Sign | null) {
  await ensurePlanetInterpretationSettings(planetId);

  const [columns, houseRow, signRow] = await Promise.all([
    prisma.interpretationColumn.findMany({
      where: { planetId },
      orderBy: { sortOrder: "asc" },
    }),
    house !== null
      ? prisma.interpretationRow.findUnique({
          where: { planetId_house: { planetId, house } },
          include: { cells: true },
        })
      : Promise.resolve(null),
    sign !== null
      ? prisma.interpretationRow.findUnique({
          where: { planetId_sign: { planetId, sign } },
          include: { cells: true },
        })
      : Promise.resolve(null),
  ]);

  return { columns, houseRow, signRow };
}

export async function savePlanetInterpretationSettings(input: SaveInterpretationSettingsInput) {
  await ensurePlanetInterpretationSettings(input.planetId);

  return prisma.$transaction(async (tx: TransactionClient) => {
    const existingColumns = await tx.interpretationColumn.findMany({
      where: { planetId: input.planetId },
      select: { id: true },
    });
    const existingColumnIds = new Set(existingColumns.map((column: { id: string }) => column.id));
    const retainedColumnIds = input.columns
      .filter((column) => !isNewClientColumnId(column.clientId))
      .map((column) => column.clientId);
    const columnIdByClientId = new Map<string, string>();

    for (const columnId of retainedColumnIds) {
      if (!existingColumnIds.has(columnId)) {
        throw new Error("Invalid interpretation column reference");
      }
    }

    await tx.interpretationColumn.deleteMany({
      where: {
        planetId: input.planetId,
        id: { notIn: retainedColumnIds },
      },
    });

    await Promise.all(
      retainedColumnIds.map((columnId, index) =>
        tx.interpretationColumn.update({
          where: { id: columnId },
          data: { sortOrder: -(index + 1) },
        }),
      ),
    );

    await Promise.all(
      input.columns.map(async (column) => {
        if (isNewClientColumnId(column.clientId)) {
          const created = await tx.interpretationColumn.create({
            data: {
              planetId: input.planetId,
              title: column.title,
              sortOrder: column.sortOrder,
            },
          });
          columnIdByClientId.set(column.clientId, created.id);
          return;
        }

        const updated = await tx.interpretationColumn.update({
          where: { id: column.clientId },
          data: {
            title: column.title,
            sortOrder: column.sortOrder,
          },
        });
        columnIdByClientId.set(column.clientId, updated.id);
      }),
    );

    const rows = await tx.interpretationRow.findMany({
      where: { planetId: input.planetId },
    });
    const rowIdByHouse = new Map(rows.map((row: { house: number; id: string }) => [row.house, row.id]));

    await Promise.all(
      input.cells.map((cell) => {
        const rowId = rowIdByHouse.get(cell.house);
        const columnId = columnIdByClientId.get(cell.columnClientId);

        if (!rowId || !columnId) {
          throw new Error("Invalid interpretation cell reference");
        }

        return tx.interpretationCell.upsert({
          where: {
            rowId_columnId: {
              rowId,
              columnId,
            },
          },
          update: {
            content: cell.content,
          },
          create: {
            rowId,
            columnId,
            content: cell.content,
          },
        });
      }),
    );

    const [planet, columns, rowsWithCells] = await Promise.all([
      tx.planet.findUnique({
        where: { id: input.planetId },
      }),
      tx.interpretationColumn.findMany({
        where: { planetId: input.planetId },
        orderBy: { sortOrder: "asc" },
      }),
      tx.interpretationRow.findMany({
        where: { planetId: input.planetId },
        include: {
          cells: true,
        },
        orderBy: { house: "asc" },
      }),
    ]);

    if (!planet) {
      throw new Error("Planet not found");
    }

    return {
      planet,
      planetId: input.planetId,
      columns,
      rows: rowsWithCells,
    };
  }, {
    maxWait: 10000,
    timeout: 30000,
  });
}

async function ensurePlanetInterpretationSettings(planetId: string) {
  await Promise.all(
    SIGNS.map((sign, index) =>
      prisma.interpretationRow.upsert({
        where: {
          planetId_house: {
            planetId,
            house: index + 1,
          },
        },
        update: {
          sign: sign.value,
        },
        create: {
          planetId,
          house: index + 1,
          sign: sign.value,
        },
      }),
    ),
  );
}

function isNewClientColumnId(clientId: string) {
  return clientId.startsWith("new-") || clientId.startsWith("import-");
}
