# EnergyShield AI — Data Layer

## Baseline fallback datasets

Located in `src/data/fallback/`. Simulated prototype values used when processed data is unavailable.

| Dataset | Purpose | Data type |
|---|---|---|
| suppliers.json | Supplier profiles for Procurement Optimizer | simulated |
| routes.json | Shipping route risk for Supply Chain Map | simulated |
| events.json | Geopolitical/logistics events for Risk Intelligence + Alerts | simulated |
| oil_prices.json | Historical Brent price reference for Scenario Simulator | simulated |
| reserves.json | Strategic reserve parameters for Strategic Reserves screen | simulated |
| scenarios.json | Scenario definitions for Scenario Simulator engine | simulated |

## Processed datasets (official + derived)

Located in `src/data/processed/`. Each record carries `dataType`, `sourceOrganization`, `sourceUrl`, `retrievedAt`, and `publicationDate`.

| Dataset | Source | Data type | Date/period | Update frequency |
|---|---|---|---|---|
| chokepoints.json | U.S. EIA | official | 2023 (pub. 2024-07) | Manual |
| india_oil_imports.json | PPAC | official | FY 2023-24 | Manual |
| india_crude_production.json | PPAC | official | FY 2023-24 | Manual |
| indian_basket_prices.json | PPAC | official | 2024-03 to 2026-08 | Manual |
| global_oil_prices.json | U.S. EIA | official | 2024-03 to 2026-08 | Manual |
| suppliers.json | PPAC import data | official volumes + derived scores | FY 2023-24 | Manual |
| routes.json | EIA chokepoint data | official flows + derived risk | 2023 | Manual |
| reserves.json | ISPRL | official capacity + derived coverage | 2024 | Manual |
| energy_events.json | EIA, IEA, PPAC, OPEC | official | 2024-05 to 2024-07 | Manual |
| scenarios.json | EIA baseline + simulated params | mixed | 2026-08 | Manual |
| refinery_capacity.json | PPAC | official | 2024-05 | Manual |
| geopolitical_events.json | GDELT + official sources | derived | 2026-08-21 | 60 min |

## Data sources

| Source | URL | Tier | Datasets |
|---|---|---|---|
| Petroleum Planning & Analysis Cell (PPAC) | https://ppac.gov.in/ | 1 | imports, production, prices, refinery |
| India Open Government Data | https://data.gov.in/ | 1 | (alternative) |
| U.S. Energy Information Administration (EIA) | https://www.eia.gov/ | 1 | chokepoints, Brent prices |
| International Energy Agency (IEA) | https://www.iea.org/ | 2 | events |
| OPEC | https://www.opec.org/ | 2 | events |
| Indian Strategic Petroleum Reserves Ltd (ISPRL) | https://www.isprlindia.com/ | 1 | reserves |
| World Bank | https://www.worldbank.org/ | 2 | (future) |
| UNCTAD | https://unctad.org/ | 2 | (future) |
| GDELT DOC 2.0 | https://api.gdeltproject.org/ | 3 | geopolitical events |

## Units

| Field | Unit |
|---|---|
| oilFlowMbd | million barrels per day |
| importQuantityMt | million tonnes |
| productionMt | million tonnes |
| price | USD per barrel |
| capacityMtpa | million tonnes per annum |
| capacityMt | million tonnes |
| riskScore | 0-100 (higher = worse) |

## Transformations

- Supplier costPerBarrel: derived from cost index estimate × latest Indian Basket price. Marked derived.
- Supplier transitDays: estimated from geographic proximity to Indian ports. Marked derived.
- Supplier capacityBpd: estimated from import volume share. Marked derived.
- Route riskScore: derived from EIA flow volume + geopolitical exposure. modelVersion: v1.
- Reserve coverageDays: derived from ISPRL capacity ÷ daily consumption. Marked derived.
- Scenario baseRisk: incorporates geopolitical event decay boost. Marked simulated.

## Real vs Derived vs Simulated

- **Official**: Directly from authoritative dataset (EIA, PPAC, ISPRL, IEA, OPEC). Example: "EIA Hormuz oil flow: 20.9 million b/d"
- **Derived**: Calculated from official inputs with documented methodology. Example: "EnergyShield Supplier Risk Score: 71" — labeled `dataType: "derived"`, `modelVersion: "v1"`
- **Simulated**: Hypothetical what-if scenario. Example: "Projected supply gap under 30-day Hormuz closure: 42%" — labeled `dataType: "simulated"`

## Geopolitical Intelligence Layer

### Sources

1. GDELT DOC 2.0 — targeted API queries (max 15 results per query)
2. EIA, IEA, OPEC, PPAC — official publications

### Query strategy

8 targeted groups: Hormuz, Red Sea/Bab el-Mandeb, Iran sanctions, Russia sanctions, supplier disruptions, refinery/terminal, shipping, OPEC policy.

### Refresh interval

Default: 60 minutes. Configurable via `GEOPOLITICAL_REFRESH_MINUTES`.

### Cache duration

Default: 30 minutes.

### Filtering pipeline

Fetch → Relevance filter → Deduplicate (URL + title similarity) → Classify (keyword rules) → Impact score → Select high-impact → Optional AI batch → Store

### Impact scoring formula

modelVersion: `geopolitical-v1`

| Factor | Weight |
|---|---|
| Supply disruption | +30 |
| Major chokepoint | +25 |
| Sanctions affecting crude exports | +20 |
| Physical infrastructure | +25 |
| Shipping disruption | +20 |
| Major supplier | +15 |
| Direct India exposure | +20 |
| Minor/indirect mention | -20 |

Clamped 0-100. Severity: 0-24 LOW, 25-49 MODERATE, 50-74 HIGH, 75-100 CRITICAL.

### Event decay

| Age | Impact multiplier |
|---|---|
| 0-24h | 100% |
| 24-48h | 75% |
| 48-72h | 50% |
| 72h+ | 25% |

### Confidence

1 source → 50, 2 sources → 70, 3+ → 85. Tier 1 bonus +10. Max 95.

### AI usage policy

- AI called ONLY for impactScore ≥ 60 or HIGH/CRITICAL events
- One batched request per refresh cycle
- If AI unavailable: rule-based classification used, `aiStatus = "unavailable"`
- AI must not invent numerical values

### Fallback behavior

- AI unavailable: rule-based scores retained
- No new events: last dataset used, "Using cached intelligence" shown
- `GEOPOLITICAL_MOCK_MODE=true` (default): no network calls, local sample data

### Data provenance

Every event includes: `source`, `sourceTier`, `sourceUrl`, `publishedAt`, `retrievedAt`, `dataType`, `modelVersion`. EnergyShield scores labeled "EnergyShield Derived Risk" — not official government classifications.

## Known limitations

- PPAC and EIA publish data as PDFs/HTML tables, not JSON APIs — values are curated from official publications
- ISPRL capacity is public; current inventory is not officially published (set to null)
- Supplier cost/transit/capacity fields are derived estimates, not official figures
- Geopolitical events use mock data by default; live mode requires `GEOPOLITICAL_MOCK_MODE=false`
- GDELT API availability and rate limits may affect live mode
