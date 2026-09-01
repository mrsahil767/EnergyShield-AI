import type { GeopoliticalEvent, RawArticle, SourceConfig } from './types';
import sourceConfigData from '@/data/sources/geopolitical_sources.json';
import { fetchAllSources } from './fetcher';
import { filterByRelevance } from './filter';
import { deduplicate } from './deduplicator';
import { toGeopoliticalEvent } from './scorer';
import { createAIAnalyzer, selectForAI } from './aiAnalyzer';

const config = sourceConfigData as unknown as SourceConfig;

export type PipelineStatus = 'idle' | 'fetching' | 'processing' | 'complete' | 'error' | 'mock';

export interface PipelineResult {
  status: PipelineStatus;
  totalFetched: number;
  afterFilter: number;
  afterDedup: number;
  highImpact: number;
  aiAnalyzed: number;
  events: GeopoliticalEvent[];
  aiStatus: 'available' | 'unavailable';
  timestamp: string;
  usingCache: boolean;
}

/**
 * Runs the full geopolitical event pipeline:
 * fetch → filter → deduplicate → classify → score → AI (optional) → store
 *
 * In mock mode (default), uses local sample data without any network calls.
 */
export async function runPipeline(mockMode: boolean = config.mockMode): Promise<PipelineResult> {
  const timestamp = new Date().toISOString();

  // Step 1: Fetch
  let articles: RawArticle[];
  try {
    articles = await fetchAllSources(mockMode);
  } catch {
    return {
      status: 'error',
      totalFetched: 0,
      afterFilter: 0,
      afterDedup: 0,
      highImpact: 0,
      aiAnalyzed: 0,
      events: [],
      aiStatus: 'unavailable',
      timestamp,
      usingCache: true,
    };
  }

  // Step 2: Filter by relevance
  const filtered = filterByRelevance(articles);

  // Step 3: Deduplicate
  const deduped = deduplicate(filtered);

  // Step 4: Classify + Score
  const events = deduped.map(toGeopoliticalEvent);

  // Step 5: Select high-impact events for AI
  const forAI = selectForAI(events);

  // Step 6: AI analysis (batched, optional)
  const analyzer = createAIAnalyzer();
  let aiStatus: 'available' | 'unavailable' = 'unavailable';
  let aiAnalyzed = 0;

  if (forAI.length > 0) {
    try {
      const aiResults = await analyzer.analyzeEvents(forAI);
      if (aiResults.size > 0) {
        aiStatus = 'available';
        aiAnalyzed = aiResults.size;
        for (const event of events) {
          const analysis = aiResults.get(event.id);
          if (analysis) {
            event.aiAnalysis = analysis;
          }
        }
      }
    } catch {
      // Fallback: keep rule-based classification
    }
  }

  return {
    status: mockMode ? 'mock' : 'complete',
    totalFetched: articles.length,
    afterFilter: filtered.length,
    afterDedup: deduped.length,
    highImpact: forAI.length,
    aiAnalyzed,
    events,
    aiStatus,
    timestamp,
    usingCache: false,
  };
}

/**
 * Applies time-based decay to an event's impact score.
 * The decay only affects the event's contribution to the derived risk model,
 * not the original event record.
 */
export function getDecayedImpactScore(event: GeopoliticalEvent, now: Date = new Date()): number {
  const publishedAt = new Date(event.publishedAt);
  const ageHours = (now.getTime() - publishedAt.getTime()) / 3600_000;

  let decayMultiplier: number;
  if (ageHours <= 24) {
    decayMultiplier = config.decaySchedule['0-24h'];
  } else if (ageHours <= 48) {
    decayMultiplier = config.decaySchedule['24-48h'];
  } else if (ageHours <= 72) {
    decayMultiplier = config.decaySchedule['48-72h'];
  } else {
    decayMultiplier = config.decaySchedule['72h+'];
  }

  return Math.round(event.impactScore * decayMultiplier);
}

/**
 * Returns only HIGH and CRITICAL events for the critical endpoint.
 */
export function getCriticalEvents(events: GeopoliticalEvent[]): GeopoliticalEvent[] {
  return events.filter((e) => e.severity === 'HIGH' || e.severity === 'CRITICAL');
}
