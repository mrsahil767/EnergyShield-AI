export type EventCategory = 'GEOPOLITICAL' | 'SHIPPING' | 'SANCTIONS' | 'SUPPLY' | 'INFRASTRUCTURE' | 'MARKET' | 'POLICY';
export type Severity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface SourceConfig {
  version: string;
  refreshMinutes: number;
  cacheMinutes: number;
  maxResultsPerQuery: number;
  defaultTimeWindowHours: number;
  fallbackTimeWindowHours: number;
  rawRetentionDays: number;
  mockMode: boolean;
  sources: SourceEntry[];
  queries: QueryEntry[];
  relevanceKeywords: string[];
  sourceTiers: Record<string, string>;
  impactWeights: Record<string, number>;
  decaySchedule: Record<string, number>;
  aiThreshold: {
    minImpactScore: number;
    triggerSeverities: string[];
    triggerRegions: string[];
  };
  confidenceRules: {
    singleSource: number;
    twoIndependentSources: number;
    threePlusSources: number;
    tier1Bonus: number;
    maxConfidence: number;
  };
}

export interface SourceEntry {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  priority: string;
  tier: number;
  refreshMinutes: number;
}

export interface QueryEntry {
  id: string;
  label: string;
  keywords: string[];
  regions: string[];
  category: string;
}

export interface RawArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  sourceTier: number;
  publishedAt: string;
  retrievedAt: string;
  region: string;
  category: string;
  queryId: string;
  relatedArticles?: number;
}

export interface AIAnalysisResult {
  eventId: string;
  summary: string;
  affectedAssets: string[];
  affectedCorridors: string[];
  potentialSupplyImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  indiaExposure: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedMonitoring: string[];
  confidence: number;
}

export interface GeopoliticalEvent {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  sourceTier: number;
  publishedAt: string;
  retrievedAt: string;
  region: string;
  category: string;
  severity: string;
  impactScore: number;
  confidence: number;
  indiaExposure: string | null;
  relatedArticles: number;
  dataType: 'derived';
  modelVersion: string;
  aiAnalysis: AIAnalysisResult | null;
}
