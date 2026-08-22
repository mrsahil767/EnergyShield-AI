import processedSuppliersData from '@/data/processed/suppliers.json';
import processedRoutesData from '@/data/processed/routes.json';
import processedEventsData from '@/data/processed/energy_events.json';
import processedOilPricesData from '@/data/processed/global_oil_prices.json';
import processedIndianBasketData from '@/data/processed/indian_basket_prices.json';
import processedReservesData from '@/data/processed/reserves.json';
import processedScenariosData from '@/data/processed/scenarios.json';
import processedChokepointsData from '@/data/processed/chokepoints.json';
import processedImportsData from '@/data/processed/india_oil_imports.json';
import processedProductionData from '@/data/processed/india_crude_production.json';
import processedRefineryData from '@/data/processed/refinery_capacity.json';
import geopoliticalEventsData from '@/data/processed/geopolitical_events.json';
import geopoliticalStatusData from '@/data/metadata/geopolitical_status.json';
import lastUpdatedData from '@/data/metadata/last_updated.json';
import sourcesData from '@/data/metadata/sources.json';
import type { GeopoliticalEvent } from '@/services/geopolitical/types';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type EventCategory = 'Geopolitical' | 'Shipping' | 'Sanctions';

export interface RiskRegion {
  name: string;
  riskScore: number;
  riskLevel: RiskLevel;
  trend: string;
  exposure: string;
  disruptionProbability: number;
  source?: string;
}

export interface Supplier {
  country: string;
  aiScore: number;
  risk: RiskLevel;
  costPerBarrel: number;
  capacity: string;
  capacityBpd: number;
  transitDays: number;
  reliability: number;
  recommendation: string;
  source?: string;
  importVolumeMt?: number;
  importSharePct?: number;
}

export interface ScenarioResult {
  supplyGap: number;
  reserveCoverage: number;
  priceImpact: number;
  projectedPrice: number;
  riskScore: number;
  throughput: number;
  recommendation: string;
}

export interface Scenario {
  name: string;
  baseGap: number;
  basePrice: number;
  baseRisk: number;
}

export interface RouteData {
  id: string;
  name: string;
  riskScore: number;
  disruptionProbability: number;
  transitDays: number;
  status: string;
  dataType: string;
  sourceOrganization?: string;
  sourceUrl?: string;
  oilFlowMbd?: number | null;
}

export interface IntelligenceEvent {
  id: string;
  date: string;
  region: string;
  category: EventCategory;
  severity: string;
  title: string;
  description: string;
  impactScore: number;
  dataType: string;
  source?: string;
  sourceUrl?: string;
  sourceOrganization?: string;
  confidence?: number;
  indiaExposure?: string | null;
}

export interface OilPrice {
  date: string;
  benchmark: string;
  price: number;
  currency: string;
  dataType: string;
  sourceOrganization?: string;
}

export interface ReserveData {
  currentCoverageDays: number;
  criticalThresholdDays: number;
  dailyConsumptionKbd: number;
  policy: string;
  dataType: string;
  sourceOrganization?: string;
  totalCapacityMt?: number;
  facilities?: Array<{ facility: string; location: string; capacityMt: number; currentInventoryMt: number | null }>;
}

export interface ChokepointData {
  id: string;
  name: string;
  period: string;
  oilFlowMbd: number;
  crudeAndCondensateMbd: number | null;
  petroleumProductsMbd: number | null;
  sourceOrganization: string;
  sourceUrl: string;
  publicationDate: string;
  dataType: string;
  unit: string;
}

export interface ImportData {
  id: string;
  financialYear: string;
  period: string;
  importQuantityMt: number;
  importValueBnUsd?: number;
  unit: string;
  sourceOrganization: string;
  sourceUrl: string;
  publicationDate: string;
  dataType: string;
  supplierCountry?: string;
  importSharePct?: number;
}

export interface ProductionData {
  id: string;
  financialYear: string;
  period: string;
  productionMt: number;
  unit: string;
  sourceOrganization: string;
  sourceUrl: string;
  publicationDate: string;
  dataType: string;
}

export interface RefineryData {
  id: string;
  refinery: string;
  operator: string;
  location: string;
  capacityMtpa: number;
  unit: string;
  operationalStatus: string;
  sourceOrganization: string;
  sourceUrl: string;
  publicationDate: string;
  dataType: string;
}

export const dataSources = sourcesData;
export const lastUpdated = lastUpdatedData;

const riskBand = (score: number): RiskLevel => (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');

// --- Processed data with real official provenance ---
const processedSuppliers = processedSuppliersData as Array<{
  id: string; country: string; importVolumeMt: number; importSharePct: number;
  period: string; sourceOrganization: string; sourceUrl: string; retrievedAt: string;
  dataType: string; riskScore: number; reliabilityScore: number; procurementScore: number;
}>;

const processedRoutes = processedRoutesData as Array<{
  id: string; name: string; chokepointId: string | null; oilFlowMbd: number | null;
  riskScore: number; disruptionProbability: number; transitDays: number; status: string;
  sourceOrganization: string; sourceUrl: string | null; retrievedAt: string;
  publicationDate: string; dataType: string;
}>;

const processedEvents = processedEventsData as IntelligenceEvent[];
const processedOilPrices = processedOilPricesData as OilPrice[];
const processedIndianBasket = processedIndianBasketData as Array<{
  id: string; date: string; financialYear: string; price: number; currency: string;
  unit: string; sourceOrganization: string; sourceUrl: string; retrievedAt: string;
  publicationDate: string; dataType: string;
}>;

const processedReserves = processedReservesData as ReserveData & {
  currentCoverageDataType: string; currentCoverageMethodology: string;
  criticalThresholdDataType: string; criticalThresholdMethodology: string;
  dailyConsumptionDataType: string; dailyConsumptionMethodology: string;
  totalCapacityMt: number;
};

const processedScenarios = processedScenariosData as Array<{
  id: string; name: string; baseGap: number; basePrice: number; baseRisk: number;
  chokepointId: string | null; chokepointFlowMbd: number | null;
  sourceOrganization: string; sourceUrl: string | null; retrievedAt: string;
  dataType: string;
}>;

export const chokepoints: ChokepointData[] = processedChokepointsData as ChokepointData[];
export const indiaImports: ImportData[] = processedImportsData as ImportData[];
export const indiaProduction: ProductionData[] = processedProductionData as ProductionData[];
export const refineryCapacity: RefineryData[] = processedRefineryData as RefineryData[];
export const indianBasketPrices = processedIndianBasket;

// --- Suppliers: map processed real-data records to the Supplier interface ---
// Processed suppliers have real import volumes and derived risk/reliability/procurement scores
// from PPAC data. Fields not in the official dataset (costIndex, capacityKbd, transitDays)
// are derived from available data or marked as derived.
// Transit days are estimated from geographic proximity to Indian ports.
const transitDaysEstimate: Record<string, number> = {
  'Iraq': 14, 'Saudi Arabia': 12, 'Russia': 18, 'UAE': 11, 'United States': 24, 'Nigeria': 22,
};
const capacityBpdEstimate: Record<string, number> = {
  'Iraq': 280, 'Saudi Arabia': 450, 'Russia': 300, 'UAE': 320, 'United States': 200, 'Nigeria': 150,
};
const costIndexEstimate: Record<string, number> = {
  'Iraq': 76, 'Saudi Arabia': 78, 'Russia': 72, 'UAE': 79, 'United States': 83, 'Nigeria': 83,
};
const recommendationMap: Record<string, string> = {
  'Iraq': 'Diversify exposure', 'Saudi Arabia': 'Primary alternative', 'Russia': 'Monitor sanctions risk',
  'UAE': 'High confidence', 'United States': 'Strategic diversification', 'Nigeria': 'Emergency reserve',
};
const supplierRiskMap: Record<string, RiskLevel> = {
  'Saudi Arabia': 'LOW', 'UAE': 'LOW', 'Iraq': 'MEDIUM', 'Nigeria': 'HIGH',
  'Russia': 'HIGH', 'United States': 'LOW',
};

export const suppliers: Supplier[] = processedSuppliers.map((s) => ({
  country: s.country,
  aiScore: s.procurementScore,
  risk: supplierRiskMap[s.country] ?? riskBand(s.riskScore),
  costPerBarrel: Number((costIndexEstimate[s.country] ?? 78) * 0.01 * 89.4 + 0.4).toFixed(2) as unknown as number,
  capacity: `${capacityBpdEstimate[s.country] ?? 200}k bpd`,
  capacityBpd: capacityBpdEstimate[s.country] ?? 200,
  transitDays: transitDaysEstimate[s.country] ?? 14,
  reliability: s.reliabilityScore,
  recommendation: recommendationMap[s.country] ?? 'Monitor',
  source: s.sourceOrganization,
  importVolumeMt: s.importVolumeMt,
  importSharePct: s.importSharePct,
}));

// --- Routes: use processed route data with EIA chokepoint flows ---
export const routes: RouteData[] = processedRoutes.map((r) => ({
  id: r.id,
  name: r.name,
  riskScore: r.riskScore,
  disruptionProbability: r.disruptionProbability,
  transitDays: r.transitDays,
  status: r.status,
  dataType: r.dataType,
  sourceOrganization: r.sourceOrganization,
  sourceUrl: r.sourceUrl ?? undefined,
  oilFlowMbd: r.oilFlowMbd,
}));

// --- Geopolitical events (from the geopolitical intelligence pipeline) ---
const geoEvents = geopoliticalEventsData as unknown as GeopoliticalEvent[];
export const geopoliticalEvents = geoEvents;
export const geopoliticalStatus = geopoliticalStatusData as {
  lastGeopoliticalUpdate: string; geopoliticalStatus: string; aiStatus: string;
  usingFallback: boolean; totalEvents: number; criticalEvents: number; highEvents: number;
};

// --- Events: merge processed official events + geopolitical events ---
const geoCategoryMap: Record<string, EventCategory> = {
  GEOPOLITICAL: 'Geopolitical', SHIPPING: 'Shipping', SANCTIONS: 'Sanctions',
  SUPPLY: 'Shipping', INFRASTRUCTURE: 'Geopolitical', MARKET: 'Geopolitical', POLICY: 'Sanctions',
};
const geoSeverityMap: Record<string, string> = {
  CRITICAL: 'CRITICAL', HIGH: 'WARNING', MODERATE: 'WARNING', LOW: 'INFO',
};

const geoEventsMapped: IntelligenceEvent[] = geoEvents.map((e) => ({
  id: e.id, date: e.publishedAt, region: e.region,
  category: geoCategoryMap[e.category] ?? 'Geopolitical',
  severity: e.severity, title: e.title, description: e.description ?? '',
  impactScore: e.impactScore, dataType: 'derived',
  source: e.source, sourceUrl: e.url, confidence: e.confidence, indiaExposure: e.indiaExposure,
}));

const officialEventsMapped: IntelligenceEvent[] = processedEvents.map((e) => ({
  ...e,
  source: e.sourceOrganization ?? e.source,
}));

export const intelligenceEvents: {
  category: EventCategory; level: string; time: string; title: string; description: string;
  source?: string; confidence?: number; indiaExposure?: string | null;
}[] = [...geoEventsMapped, ...officialEventsMapped].map((e) => ({
  category: e.category,
  level: geoSeverityMap[e.severity] ?? e.severity,
  time: e.date, title: e.title, description: e.description,
  source: e.source, confidence: e.confidence, indiaExposure: e.indiaExposure,
}));

// --- Alerts derived from high-impact geopolitical events + official events ---
const geoAlerts = geoEvents
  .filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH')
  .map((e, i) => ({
    id: i + 1, level: e.severity === 'CRITICAL' ? 'Critical' : 'High',
    title: e.title, detail: e.description ?? '', time: e.publishedAt,
    read: false, source: e.source, confidence: e.confidence,
  }));

const officialAlerts = processedEvents
  .filter((e) => e.severity === 'CRITICAL' || e.severity === 'WARNING')
  .map((e, i) => ({
    id: geoAlerts.length + i + 1,
    level: e.severity === 'CRITICAL' ? 'Critical' : 'High',
    title: e.title, detail: e.description, time: e.date, read: i >= 2,
    source: e.sourceOrganization,
  }));

export const alerts = [...geoAlerts, ...officialAlerts];

// --- Oil prices: use processed Brent prices from EIA ---
export const oilPrices: OilPrice[] = processedOilPrices;
export const latestOilPrice = processedIndianBasket[0]?.price ?? processedOilPrices[processedOilPrices.length - 1]?.price ?? 89.4;
export const latestBrentPrice = processedOilPrices[processedOilPrices.length - 1]?.price ?? 89.4;

// --- Reserves: use processed ISPRL data ---
export const reserveData: ReserveData = {
  currentCoverageDays: processedReserves.currentCoverageDays,
  criticalThresholdDays: processedReserves.criticalThresholdDays,
  dailyConsumptionKbd: processedReserves.dailyConsumptionKbd,
  policy: processedReserves.policy,
  dataType: processedReserves.dataType,
  sourceOrganization: processedReserves.sourceOrganization,
  totalCapacityMt: processedReserves.totalCapacityMt,
  facilities: processedReserves.facilities,
};

// --- Scenarios: use processed scenario data with EIA baseline flows ---
export const scenarios: Scenario[] = processedScenarios.map((s) => ({
  name: s.name, baseGap: s.baseGap, basePrice: s.basePrice, baseRisk: s.baseRisk,
}));

/**
 * Event decay: reduces an event's impact contribution over time.
 * 0-24h: 100%, 24-48h: 75%, 48-72h: 50%, 72h+: 25%
 */
export function getDecayedImpact(event: { publishedAt: string; impactScore: number }, now: Date = new Date()): number {
  const ageHours = (now.getTime() - new Date(event.publishedAt).getTime()) / 3600_000;
  let multiplier: number;
  if (ageHours <= 24) multiplier = 1.0;
  else if (ageHours <= 48) multiplier = 0.75;
  else if (ageHours <= 72) multiplier = 0.5;
  else multiplier = 0.25;
  return Math.round(event.impactScore * multiplier);
}

/**
 * Derives a region's risk score from:
 *   1. Base route risk (from EIA chokepoint data)
 *   2. Active geopolitical event signals (with time decay)
 *   3. Multi-source confidence bonus
 *
 * Formula: baseRisk * 0.6 + (baseRisk + decayedEventImpact * 0.3) * 0.4, clamped 0-99
 */
function deriveRegionRisk(baseRiskScore: number, regionName: string): { riskScore: number; trend: string } {
  const regionEvents = geoEvents.filter((e) => {
    const eventRegion = e.region.toLowerCase();
    const targetRegion = regionName.toLowerCase();
    return eventRegion.includes(targetRegion) || targetRegion.includes(eventRegion);
  });

  let eventContribution = 0;
  for (const evt of regionEvents) {
    const decayed = getDecayedImpact(evt);
    eventContribution += decayed * 0.3;
  }

  const blended = baseRiskScore * 0.6 + (baseRiskScore + eventContribution) * 0.4;
  const riskScore = Math.min(99, Math.max(0, Math.round(blended)));

  const hasRecentHigh = regionEvents.some((e) =>
    (Date.now() - new Date(e.publishedAt).getTime()) < 48 * 3600_000 && e.impactScore >= 60
  );
  const trend = hasRecentHigh ? (riskScore >= 75 ? 'SEVERE' : 'ELEVATED') : riskScore >= 50 ? 'MONITOR' : 'STABLE';

  return { riskScore, trend };
}

// --- Risk regions (derived from EIA route data + geopolitical event signals) ---
export const riskRegions: RiskRegion[] = [
  { name: 'Strait of Hormuz', ...deriveRegionRisk(87, 'Strait of Hormuz'), riskLevel: riskBand(deriveRegionRisk(87, 'Strait of Hormuz').riskScore), exposure: '34%', disruptionProbability: 78, source: 'EIA + EnergyShield derived' },
  { name: 'Russia-Europe', ...deriveRegionRisk(72, 'Russia-Europe'), riskLevel: riskBand(deriveRegionRisk(72, 'Russia-Europe').riskScore), exposure: '21%', disruptionProbability: 42, source: 'EnergyShield derived' },
  { name: 'Red Sea', ...deriveRegionRisk(65, 'Red Sea'), riskLevel: riskBand(deriveRegionRisk(65, 'Red Sea').riskScore), exposure: '18%', disruptionProbability: 55, source: 'EIA + EnergyShield derived' },
  { name: 'Persian Gulf', ...deriveRegionRisk(45, 'Persian Gulf'), riskLevel: riskBand(deriveRegionRisk(45, 'Persian Gulf').riskScore), exposure: '15%', disruptionProbability: 31, source: 'EnergyShield derived' },
  { name: 'West Africa', ...deriveRegionRisk(30, 'West Africa'), riskLevel: riskBand(deriveRegionRisk(30, 'West Africa').riskScore), exposure: '8%', disruptionProbability: 18, source: 'EnergyShield derived' },
].map((r) => ({ ...r, trend: r.trend }));

export const calculateScenario = (scenario: Scenario, duration: number, severity: number, policy: string): ScenarioResult => {
  const durationFactor = duration / 30;
  const severityFactor = severity / 3;
  const policyFactor = policy === 'Aggressive drawdown' ? 1.16 : policy === 'Conservative hold' ? 0.84 : 1;

  const supplyGap = Math.min(88, Math.round(scenario.baseGap * durationFactor * severityFactor));
  const reserveCoverage = Math.max(2.1, Number((reserveData.currentCoverageDays - supplyGap * 0.075 * policyFactor).toFixed(1)));
  const priceImpact = Math.round(scenario.basePrice * durationFactor * (0.7 + severityFactor * 0.3));

  const geoBoost = geoEvents.length > 0
    ? Math.min(15, Math.round(geoEvents.reduce((sum, e) => sum + getDecayedImpact(e), 0) / geoEvents.length * 0.1))
    : 0;
  const riskScore = Math.min(99, Math.round(scenario.baseRisk + (severity - 2) * 8 + (duration - 14) * 0.28 + geoBoost));

  const throughput = Math.max(18, 100 - supplyGap);
  const recommendation = reserveCoverage < 6.5
    ? 'Preserve strategic reserves and prioritize alternative procurement.'
    : 'Increase alternative procurement and reduce exposure to high-risk corridors.';

  return { supplyGap, reserveCoverage, priceImpact, projectedPrice: Number((latestOilPrice * (1 + priceImpact / 100)).toFixed(2)), riskScore, throughput, recommendation };
};

export const getScenarioAdjustedSuppliers = (scenarioName: string): Supplier[] => {
  const hormuzAffected = scenarioName === 'Strait of Hormuz Closure' || scenarioName === 'Persian Gulf Disruption';
  const redSeaAffected = scenarioName === 'Red Sea Suspension';
  const sanctionAffected = scenarioName === 'Major Supplier Sanction';
  const portAffected = scenarioName === 'Port Disruption';

  return suppliers.map((supplier) => {
    let adjustedScore = supplier.aiScore;
    let adjustedRisk = supplier.risk;
    let adjustedCost = Number(supplier.costPerBarrel);
    let adjustedTransit = supplier.transitDays;

    if (hormuzAffected && ['Saudi Arabia', 'UAE', 'Iraq'].includes(supplier.country)) {
      adjustedScore -= 12;
      adjustedRisk = supplier.risk === 'LOW' ? 'MEDIUM' : 'HIGH';
      adjustedTransit += 5;
    }
    if (redSeaAffected && ['Saudi Arabia', 'UAE', 'Iraq'].includes(supplier.country)) {
      adjustedScore -= 8;
      adjustedTransit += 4;
    }
    if (sanctionAffected && supplier.country === 'Saudi Arabia') {
      adjustedScore -= 20;
      adjustedRisk = 'HIGH';
      adjustedCost += 6;
    }
    if (portAffected) {
      adjustedScore -= 4;
      adjustedTransit += 2;
    }
    if ((hormuzAffected || redSeaAffected) && !['Saudi Arabia', 'UAE', 'Iraq'].includes(supplier.country)) {
      adjustedScore += 6;
      adjustedCost -= 1.5;
    }

    adjustedScore = Math.max(40, Math.min(99, adjustedScore));
    return { ...supplier, aiScore: adjustedScore, risk: adjustedRisk, costPerBarrel: Number(adjustedCost.toFixed(2)), transitDays: adjustedTransit };
  });
};

export const rankSuppliers = (scenarioName: string): Supplier[] => {
  const adjusted = getScenarioAdjustedSuppliers(scenarioName);
  const costs = adjusted.map((s) => s.costPerBarrel);
  const caps = adjusted.map((s) => s.capacityBpd);
  const transits = adjusted.map((s) => s.transitDays);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const maxCap = Math.max(...caps);
  const minTransit = Math.min(...transits);
  const maxTransit = Math.max(...transits);
  const riskValue = (r: RiskLevel) => (r === 'LOW' ? 90 : r === 'MEDIUM' ? 60 : r === 'HIGH' ? 30 : 10);

  const scored = adjusted.map((s) => {
    const riskScore = riskValue(s.risk);
    const costScore = maxCost === minCost ? 100 : 100 - ((s.costPerBarrel - minCost) / (maxCost - minCost)) * 100;
    const capacityScore = (s.capacityBpd / maxCap) * 100;
    const transitScore = maxTransit === minTransit ? 100 : 100 - ((s.transitDays - minTransit) / (maxTransit - minTransit)) * 100;
    const reliabilityScore = s.reliability;
    const score = Math.round(riskScore * 0.30 + costScore * 0.20 + capacityScore * 0.20 + transitScore * 0.15 + reliabilityScore * 0.15);
    return { ...s, aiScore: Math.max(1, Math.min(99, score)) };
  });

  return scored.sort((a, b) => b.aiScore - a.aiScore);
};

export const defaultResult = calculateScenario(scenarios[0], 21, 2, 'Moderate drawdown');
