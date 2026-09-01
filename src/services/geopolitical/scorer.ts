import type { GeopoliticalEvent, RawArticle, SourceConfig } from './types';
import sourceConfigData from '@/data/sources/geopolitical_sources.json';
import { classifyArticle, classifyRegion } from './filter';

const config = sourceConfigData as unknown as SourceConfig;

/**
 * Calculates a transparent, deterministic impact score for an event.
 * Uses rule-based weights from the source configuration.
 * Score range: 0-100. Marked as "derived" with modelVersion "geopolitical-v1".
 */
export function scoreEvent(article: RawArticle): { impactScore: number; severity: string; indiaExposure: string | null } {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();
  const weights = config.impactWeights;
  let score = 0;

  // Supply disruption
  if (/\b(supply disruption|supply cut|outage|halt|stoppage)\b/.test(text)) {
    score += weights.supplyDisruption;
  }

  // Major chokepoint
  if (/\b(hormuz|bab el-mandeb|suez|malacca|chokepoint|strait)\b/.test(text)) {
    score += weights.majorChokepoint;
  }

  // Sanctions affecting crude exports
  if (/\b(sanction|embargo)\b/.test(text) && /\b(crude|oil|export)\b/.test(text)) {
    score += weights.sanctionsCrudeExports;
  }

  // Physical infrastructure disruption
  if (/\b(refinery|terminal|pipeline|port)\b/.test(text) && /\b(disruption|attack|fire|explosion|damage|closure)\b/.test(text)) {
    score += weights.physicalInfrastructure;
  }

  // Shipping disruption
  if (/\b(tanker|ship|vessel|shipping|reroute|convoy|piracy|hijack|attack)\b/.test(text)) {
    score += weights.shippingDisruption;
  }

  // Major supplier involved
  if (/\b(saudi arabia|uae|iraq|russia|nigeria|united states)\b/.test(text)) {
    score += weights.majorSupplier;
  }

  // Direct India exposure
  if (/\b(india|indian)\b/.test(text)) {
    score += weights.directIndiaExposure;
  }

  // Minor/indirect mention penalty
  if (isMinorMention(text)) {
    score += weights.minorMention;
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    impactScore: score,
    severity: scoreToSeverity(score),
    indiaExposure: calculateIndiaExposure(article, text),
  };
}

function isMinorMention(text: string): boolean {
  // If energy keywords appear only once and the article is mostly about other topics
  const energyKeywordCount = config.relevanceKeywords.reduce((count, kw) => {
    return count + (text.includes(kvLowerCase(kw)) ? 1 : 0);
  }, 0);
  return energyKeywordCount <= 1;
}

function scoreToSeverity(score: number): string {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

/**
 * Calculates India exposure based on existing real supplier/chokepoint data.
 * Returns null if exposure cannot be determined from available data.
 */
function calculateIndiaExposure(article: RawArticle, text: string): string | null {
  // Check if the event involves a major Indian supplier or chokepoint
  const involvesHormuz = text.includes('hormuz');
  const involvesRedSea = text.includes('red sea') || text.includes('bab el-mandeb');
  const involvesSupplier = /\b(saudi arabia|uae|iraq|russia|nigeria|united states)\b/.test(text);

  if (involvesHormuz) return 'HIGH'; // ~60% of India's crude flows through Hormuz
  if (involvesRedSea) return 'MEDIUM';
  if (involvesSupplier) return 'MEDIUM';
  if (text.includes('india')) return 'HIGH';

  return null;
}

function kvLowerCase(s: string): string {
  return s.toLowerCase();
}

/**
 * Calculates confidence based on number of independent sources and source tier.
 */
export function calculateConfidence(relatedArticles: number, sourceTier: number): number {
  const rules = config.confidenceRules;
  let confidence = rules.singleSource;

  if (relatedArticles >= 3) {
    confidence = rules.threePlusSources;
  } else if (relatedArticles === 2) {
    confidence = rules.twoIndependentSources;
  }

  // Tier 1 sources get a bonus
  if (sourceTier === 1) {
    confidence += rules.tier1Bonus;
  }

  return Math.min(confidence, rules.maxConfidence);
}

/**
 * Converts a deduplicated RawArticle into a full GeopoliticalEvent.
 */
export function toGeopoliticalEvent(article: RawArticle): GeopoliticalEvent {
  const { impactScore, severity, indiaExposure } = scoreEvent(article);
  const category = classifyArticle(article);
  const region = classifyRegion(article);
  const confidence = calculateConfidence(article.relatedArticles ?? 1, article.sourceTier);

  return {
    id: `geo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: article.title,
    description: article.description,
    url: article.url,
    source: article.source,
    sourceTier: article.sourceTier,
    publishedAt: article.publishedAt,
    retrievedAt: article.retrievedAt,
    region,
    category,
    severity,
    impactScore,
    confidence,
    indiaExposure,
    relatedArticles: article.relatedArticles ?? 1,
    dataType: 'derived',
    modelVersion: 'geopolitical-v1',
    aiAnalysis: null,
  };
}
