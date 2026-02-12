import { z } from "zod";

export const settingsSchema = z.object({
  boardName: z.string().trim().min(1).max(80).default("My Vestaboard"),
  apiKey: z.string().trim().min(8).max(256).optional(),
  apiSecret: z.string().trim().min(8).max(256).optional(),
  mode: z.enum(["DAILYSCRIPT", "RICK_MORTY"]).default("DAILYSCRIPT"),
  intervalMinutes: z.coerce.number().int().min(1).max(1440).default(60),
  timezone: z.string().trim().min(3).max(100).default("America/Los_Angeles"),
  active: z.coerce.boolean().default(true)
});

export const testSendSchema = z.object({
  mode: z.enum(["DAILYSCRIPT", "RICK_MORTY"]).optional()
});
