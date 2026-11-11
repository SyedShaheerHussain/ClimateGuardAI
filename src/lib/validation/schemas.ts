import { z } from "zod";

export const cityQuerySchema = z.object({
  city: z.string().min(2).max(64),
});

export const historyQuerySchema = z.object({
  city: z.string().min(2).max(64),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const assetSchema = z.object({
  id: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  citySlug: z.enum(["karachi", "hyderabad", "sukkur", "lahore", "islamabad"]),
  category: z.enum([
    "Residential",
    "Commercial",
    "Industrial",
    "Agriculture",
    "Warehouses",
    "Public facilities",
    "Critical infrastructure",
    "Water infrastructure",
    "Energy infrastructure",
  ]),
  valuePkr: z.number().nonnegative().max(1e15),
  exposure: z.number().min(0).max(1),
  vulnerability: z.number().min(0).max(1),
  hazards: z.object({
    flood: z.object({ probability: z.number().min(0).max(1), damageRatio: z.number().min(0).max(1) }),
    heatwave: z.object({ probability: z.number().min(0).max(1), damageRatio: z.number().min(0).max(1) }),
    drought: z.object({ probability: z.number().min(0).max(1), damageRatio: z.number().min(0).max(1) }),
  }),
  interventionEffectiveness: z.number().min(0).max(1),
  interventionCostPkr: z.number().nonnegative(),
  provenance: z.string().optional(),
});

export const importIncidentSchema = z.object({
  incidents: z.array(z.object({
    id: z.string().min(2).max(64),
    hazardType: z.enum(["flood", "heatwave", "drought", "fire", "other"]),
    city: z.string().min(2).max(80),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    severity: z.enum(["Low", "Moderate", "High", "Very High", "Extreme"]),
    description: z.string().min(4).max(500),
    source: z.string().min(2).max(160),
    detectedAt: z.string().min(4).max(40),
    status: z.enum(["open", "monitoring", "closed"]),
  })).max(100),
});

export function daysBetween(start: string, end: string): number | null {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
}
