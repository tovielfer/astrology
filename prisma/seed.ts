import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Sign } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const defaultPlanets = [
  { code: "sun", label: "שמש", sortOrder: 0 },
  { code: "moon", label: "ירח", sortOrder: 1 },
  { code: "mercury", label: "מרקורי", sortOrder: 2 },
  { code: "venus", label: "ונוס", sortOrder: 3 },
  { code: "mars", label: "מאדים", sortOrder: 4 },
  { code: "jupiter", label: "צדק", sortOrder: 5 },
  { code: "saturn", label: "שבתאי", sortOrder: 6 },
];
const signsByHouse: Sign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

async function main() {
  await prisma.interpretation.deleteMany();

  const planets = await Promise.all(
    defaultPlanets.map((planet) =>
      prisma.planet.upsert({
        where: { code: planet.code },
        update: {
          label: planet.label,
          sortOrder: planet.sortOrder,
          isActive: true,
        },
        create: planet,
      }),
    ),
  );

  for (const planet of planets) {
    await Promise.all(
      signsByHouse.map((sign, index) =>
        prisma.interpretationRow.upsert({
          where: {
            planetId_house: {
              planetId: planet.id,
              house: index + 1,
            },
          },
          update: {},
          create: {
            planetId: planet.id,
            house: index + 1,
            sign,
          },
        }),
      ),
    );

    await prisma.interpretation.createMany({
      data: [
        {
          planetId: planet.id,
          type: "house",
          house: null,
          sign: null,
          title: "פירוש כללי לפי בית",
          content: `זהו טקסט כללי לדוגמה עבור ${planet.label} לפי בית. החליפי אותו בפרשנות המקצועית שלך.`,
          category: `${planet.code}_house`,
        },
        {
          planetId: planet.id,
          type: "sign",
          house: null,
          sign: null,
          title: "פירוש כללי לפי מזל",
          content: `זהו טקסט כללי לדוגמה עבור ${planet.label} לפי מזל. החליפי אותו בפרשנות המקצועית שלך.`,
          category: `${planet.code}_sign`,
        },
      ],
    });
  }

  const sun = planets.find((planet) => planet.code === "sun");
  if (!sun) {
    throw new Error("Sun planet seed was not created");
  }

  await prisma.interpretation.createMany({
    data: [
      {
        planetId: sun.id,
        type: "house",
        house: 2,
        sign: null,
        title: "שמש בבית 2",
        content: "השמש בבית 2 מדגישה בניית ביטחון, ערכים אישיים ויכולת להפוך כישרון למשאב מעשי.",
        category: "sun_analysis",
      },
      {
        planetId: sun.id,
        type: "sign",
        house: null,
        sign: "gemini",
        title: "שמש במזל תאומים",
        content: "השמש בתאומים מדגישה סקרנות, תנועה מחשבתית, תקשורת וגמישות מול מצבים משתנים.",
        category: "sun_analysis",
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
