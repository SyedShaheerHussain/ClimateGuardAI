import type { AssetValuation } from "./model";

export const ILLUSTRATIVE_LABEL = "ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS";

const sharedHazards = {
  flood: { probability: 0.08, damageRatio: 0.35 },
  heatwave: { probability: 0.2, damageRatio: 0.04 },
  drought: { probability: 0.12, damageRatio: 0.15 },
};

function asset(
  partial: Pick<AssetValuation, "id" | "name" | "citySlug" | "category" | "valuePkr"> &
    Partial<AssetValuation>
): AssetValuation {
  return {
    exposure: 0.7,
    vulnerability: 0.45,
    interventionEffectiveness: 0.35,
    interventionCostPkr: Math.round(partial.valuePkr * 0.01),
    provenance: ILLUSTRATIVE_LABEL,
    ...partial,
    hazards: partial.hazards ?? {
      flood: { ...sharedHazards.flood },
      heatwave: { ...sharedHazards.heatwave },
      drought: { ...sharedHazards.drought },
    },
  };
}

export function seedPortfolio(): AssetValuation[] {
  return [
    asset({
      id: "khi-port-warehouse",
      name: "Karachi port warehouse cluster",
      citySlug: "karachi",
      category: "Warehouses",
      valuePkr: 4_500_000_000,
      hazards: {
        flood: { probability: 0.12, damageRatio: 0.4 },
        heatwave: { probability: 0.28, damageRatio: 0.05 },
        drought: { probability: 0.05, damageRatio: 0.02 },
      },
    }),
    asset({
      id: "hyd-residential",
      name: "Hyderabad residential block",
      citySlug: "hyderabad",
      category: "Residential",
      valuePkr: 1_800_000_000,
      hazards: {
        flood: { probability: 0.15, damageRatio: 0.3 },
        heatwave: { probability: 0.3, damageRatio: 0.03 },
        drought: { probability: 0.1, damageRatio: 0.04 },
      },
    }),
    asset({
      id: "suk-barrage-works",
      name: "Sukkur barrage adjacent works",
      citySlug: "sukkur",
      category: "Water infrastructure",
      valuePkr: 6_200_000_000,
      exposure: 0.9,
      vulnerability: 0.55,
      hazards: {
        flood: { probability: 0.18, damageRatio: 0.25 },
        heatwave: { probability: 0.22, damageRatio: 0.02 },
        drought: { probability: 0.14, damageRatio: 0.08 },
      },
    }),
    asset({
      id: "lhe-commercial",
      name: "Lahore commercial district sample",
      citySlug: "lahore",
      category: "Commercial",
      valuePkr: 3_100_000_000,
    }),
    asset({
      id: "isb-public",
      name: "Islamabad public facility sample",
      citySlug: "islamabad",
      category: "Public facilities",
      valuePkr: 950_000_000,
      exposure: 0.5,
      vulnerability: 0.3,
    }),
  ];
}

interface PortfolioState {
  assets: AssetValuation[];
  updatedAt: string;
}

const globalStore = globalThis as typeof globalThis & { __climateGuardPortfolio?: PortfolioState };

export function portfolioState(): PortfolioState {
  if (!globalStore.__climateGuardPortfolio) {
    globalStore.__climateGuardPortfolio = {
      assets: seedPortfolio(),
      updatedAt: new Date().toISOString(),
    };
  }
  return globalStore.__climateGuardPortfolio;
}

export function listAssets(): AssetValuation[] {
  return portfolioState().assets.map((item) => ({ ...item, hazards: { ...item.hazards } }));
}

export function upsertAsset(assetValue: AssetValuation): AssetValuation {
  const state = portfolioState();
  const index = state.assets.findIndex((item) => item.id === assetValue.id);
  const next = { ...assetValue, provenance: ILLUSTRATIVE_LABEL };
  if (index >= 0) state.assets[index] = next;
  else state.assets.push(next);
  state.updatedAt = new Date().toISOString();
  return next;
}

export function removeAsset(id: string): boolean {
  const state = portfolioState();
  const before = state.assets.length;
  state.assets = state.assets.filter((item) => item.id !== id);
  state.updatedAt = new Date().toISOString();
  return state.assets.length < before;
}
