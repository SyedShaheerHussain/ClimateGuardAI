# Financial Model

**Every monetary figure in this build is illustrative.**
Label used throughout the UI and API: `ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS`.
Funding rules are labeled `SIMULATION — NO FUNDS ARE TRANSFERRED`.

Currency is Pakistani rupees (PKR). `formatPkr` supports rupees, thousands, lakhs, and crores.

## Expected damage per asset

```
gross = Σ_hazards value × exposure × vulnerability × min(1, probability_h × scenarioMultiplier) × damageRatio_h
expectedDamage = min(value, gross)
avoidedLoss = expectedDamage × interventionEffectiveness
netBenefit = avoidedLoss − interventionCost
ROI = (netBenefit / cost)             // null when cost = 0
BCR = avoidedLoss / cost              // null when cost = 0
```

- `exposure`, `vulnerability`, `interventionEffectiveness`, `damageRatio`, and `probability` are
  constrained to [0, 1]; invalid values throw.
- Combining hazards assumes independence. Because correlation is not modelled, gross damage is
  capped at the asset value.
- ROI and BCR are deliberately `null` when intervention cost is zero rather than dividing by zero.

## Scenarios

| Scenario | Probability multiplier |
|---|---|
| conservative | 1.25 |
| base | 1.00 |
| optimistic | 0.75 |

The multiplier is applied to each hazard probability before the cap at 1.

## Portfolio

The portfolio sums asset results. `assetCount`, `totalValuePkr`, `expectedDamagePkr`,
`avoidedLossPkr`, `interventionCostPkr`, `netBenefitPkr`, `roi`, and `benefitCostRatio` are
returned with `currency: "PKR"` and the illustrative label.

## Seeded assets

Five illustrative entries in `src/lib/finance/portfolio.ts` (warehouse cluster, residential block,
water infrastructure, commercial district, public facility) with invented PKR values such as
PKR 4.5 billion. They are sample inputs, not valuations of real properties. Exposure and
vulnerability are assumed constants, not survey results.

## Sensitivity

`sensitivity()` varies vulnerability (+0.10), flood probability (+0.10), and exposure (−0.10) one at
a time and reports the resulting expected damage. It is a local one-factor check, not a Monte Carlo
simulation.

## Funding simulation

`src/lib/funding/simulation.ts` evaluates a rule against an observed city/hazard/category:

- Breach requires geography match, hazard match, category ≥ minimum category, and an eligible rule
  status (`Draft`, `Pending Review`, `Approved`, `Simulated`).
- Any breach returns `status: "Simulated"`, an `estimatedFundingPkr`, `moneyTransferred: false`, and
  the simulation label.
- Default rules: a Sindh flood screening trigger (PKR 250,000,000) and a Karachi heat trigger
  (PKR 80,000,000). Both are illustrative.
- No payment rail, wallet, bank API, smart contract, oracle quorum, or disbursement workflow exists.
  No money is transferred and no government savings are claimed.

## Not modelled

Taxes, discounting, inflation, insurance premiums, basis risk, correlation between hazards,
business-interruption losses, casualties, and recovery time. There is no actuarial calibration and
no comparison with observed disaster losses.
