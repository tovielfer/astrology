import { SIGN_VALUES } from "@/lib/astrology";
import { z } from "zod";

const INTERPRETATION_TYPES = ["house", "sign", "mixed"] as const;

export const planetIdSchema = z.string().trim().min(1, "Planet is required");
export const signSchema = z.enum(SIGN_VALUES);
export const interpretationTypeSchema = z.enum(INTERPRETATION_TYPES);

export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  birthDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const planetPositionSchema = z.object({
  planetId: planetIdSchema,
  house: z.coerce.number().int().min(1).max(12).optional().nullable(),
  sign: signSchema.optional().nullable(),
});

export const savePositionsSchema = z.object({
  positions: z.array(planetPositionSchema).min(1),
});

export const interpretationSchema = z
  .object({
    planetId: planetIdSchema,
    type: interpretationTypeSchema,
    house: z.coerce.number().int().min(1).max(12).optional().nullable(),
    sign: signSchema.optional().nullable(),
    title: z.string().trim().min(1, "Title is required"),
    content: z.string().trim().min(1, "Content is required"),
    category: z.string().trim().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.type === "house" && !value.house) {
      context.addIssue({
        code: "custom",
        message: "House interpretation requires a house",
        path: ["house"],
      });
    }

    if (value.type === "sign" && !value.sign) {
      context.addIssue({
        code: "custom",
        message: "Sign interpretation requires a sign",
        path: ["sign"],
      });
    }
  });

export const saveInterpretationSettingsSchema = z.object({
  planetId: planetIdSchema,
  columns: z
    .array(
      z.object({
        clientId: z.string().min(1),
        title: z.string().trim().min(1, "Column title is required"),
        sortOrder: z.coerce.number().int().min(0),
      }),
    ),
  cells: z.array(
    z.object({
      house: z.coerce.number().int().min(1).max(12),
      columnClientId: z.string().min(1),
      content: z.string().trim(),
    }),
  ),
});

export const generateReportSchema = z.object({
  personId: z.string().min(1),
});

export const createPlanetSchema = z.object({
  label: z.string().trim().min(1, "Planet name is required"),
});

export const updatePlanetsSchema = z.object({
  planets: z.array(
    z.object({
      id: planetIdSchema,
      label: z.string().trim().min(1, "Planet name is required"),
      sortOrder: z.coerce.number().int().min(0),
      isActive: z.boolean(),
      houseOnly: z.boolean(),
    }),
  ),
});
