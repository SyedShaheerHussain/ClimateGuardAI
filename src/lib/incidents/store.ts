export interface ManagedIncident {
  id: string;
  hazardType: "flood" | "heatwave" | "drought" | "fire" | "other";
  city: string;
  latitude: number | null;
  longitude: number | null;
  severity: string;
  description: string;
  source: string;
  detectedAt: string;
  updatedAt: string;
  status: "open" | "monitoring" | "closed";
  verificationStatus: "unverified_model_signal" | "user_imported" | "illustrative";
  governmentAlert: false;
}

const globalStore = globalThis as typeof globalThis & { __climateGuardIncidents?: ManagedIncident[] };

export function listIncidents(): ManagedIncident[] {
  return globalStore.__climateGuardIncidents ?? [];
}

export function replaceModelSignals(incidents: ManagedIncident[]): ManagedIncident[] {
  const imported = listIncidents().filter((item) => item.verificationStatus !== "unverified_model_signal");
  globalStore.__climateGuardIncidents = [...incidents, ...imported].slice(0, 200);
  return globalStore.__climateGuardIncidents;
}

export function importIncidents(incidents: ManagedIncident[]): ManagedIncident[] {
  const current = listIncidents();
  const ids = new Set(incidents.map((item) => item.id));
  globalStore.__climateGuardIncidents = [...incidents, ...current.filter((item) => !ids.has(item.id))].slice(0, 200);
  return globalStore.__climateGuardIncidents;
}
