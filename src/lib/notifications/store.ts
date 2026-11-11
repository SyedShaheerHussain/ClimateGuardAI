import type { RiskAssessment } from "../risk/engine";

export interface AppNotification {
  id: string;
  kind: "risk" | "weather" | "incident" | "funding" | "api" | "freshness";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
}

interface NotificationState {
  items: AppNotification[];
  readIds: string[];
}

const globalStore = globalThis as typeof globalThis & { __climateGuardNotifications?: NotificationState };

function state(): NotificationState {
  if (!globalStore.__climateGuardNotifications) {
    globalStore.__climateGuardNotifications = { items: [], readIds: [] };
  }
  return globalStore.__climateGuardNotifications;
}

export function syncRiskNotifications(entries: Array<{ city: string; slug: string; risks: RiskAssessment[] }>): AppNotification[] {
  const store = state();
  const generated: AppNotification[] = [];
  for (const entry of entries) {
    for (const risk of entry.risks) {
      if (risk.category === "High" || risk.category === "Very High" || risk.category === "Extreme") {
        const id = `risk-${entry.slug}-${risk.hazard}-${risk.category}`;
        generated.push({
          id,
          kind: "risk",
          title: `${entry.city} ${risk.hazard} is ${risk.category}`,
          body: `Heuristic score ${risk.score}. This is not a government warning. Confidence ${risk.confidence}.`,
          createdAt: risk.evaluatedAt,
          read: store.readIds.includes(id),
          href: "/dashboard/risk-intelligence",
        });
      }
    }
  }
  const preserved = store.items.filter((item) => !item.id.startsWith("risk-"));
  store.items = [...generated, ...preserved].slice(0, 50);
  return store.items;
}

export function addNotification(item: Omit<AppNotification, "read">): AppNotification {
  const store = state();
  const next = { ...item, read: store.readIds.includes(item.id) };
  store.items = [next, ...store.items.filter((existing) => existing.id !== item.id)].slice(0, 50);
  return next;
}

export function listNotifications(): AppNotification[] {
  return state().items;
}

export function markNotificationRead(id: string): void {
  const store = state();
  if (!store.readIds.includes(id)) store.readIds.push(id);
  store.items = store.items.map((item) => (item.id === id ? { ...item, read: true } : item));
}

export function markAllNotificationsRead(): void {
  const store = state();
  for (const item of store.items) {
    if (!store.readIds.includes(item.id)) store.readIds.push(item.id);
    item.read = true;
  }
}
