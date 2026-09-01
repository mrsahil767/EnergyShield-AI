import type { GeopoliticalEvent, AIAnalysisResult, SourceConfig } from './types';
import sourceConfigData from '@/data/sources/geopolitical_sources.json';

const config = sourceConfigData as unknown as SourceConfig;

export interface AIAnalyzer {
  analyzeEvents(events: GeopoliticalEvent[]): Promise<Map<string, AIAnalysisResult>>;
}

/**
 * Null implementation — used when no AI provider is configured.
 * Returns empty map. Events retain their rule-based classification.
 */
class NullAIAnalyzer implements AIAnalyzer {
  async analyzeEvents(_events: GeopoliticalEvent[]): Promise<Map<string, AIAnalysisResult>> {
    return new Map();
  }
}

/**
 * OpenAI-compatible implementation.
 * Sends ONE batched request with only high-impact events.
 * Requires OPENAI_API_KEY environment variable.
 * If the key is missing or the request fails, returns empty map (fallback to rule-based).
 */
class OpenAIAnalyzer implements AIAnalyzer {
  constructor(private apiKey: string, private endpoint: string = 'https://api.openai.com/v1/chat/completions') {}

  async analyzeEvents(events: GeopoliticalEvent[]): Promise<Map<string, AIAnalysisResult>> {
    const results = new Map<string, AIAnalysisResult>();
    if (events.length === 0) return results;

    const prompt = buildBatchPrompt(events);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an energy security analyst. Return ONLY valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) return results;

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return results;

      const parsed = JSON.parse(content) as Array<{
        eventId: string;
        summary: string;
        affectedAssets: string[];
        affectedCorridors: string[];
        potentialSupplyImpact: 'LOW' | 'MEDIUM' | 'HIGH';
        indiaExposure: 'LOW' | 'MEDIUM' | 'HIGH';
        recommendedMonitoring: string[];
        confidence: number;
      }>;

      for (const item of parsed) {
        results.set(item.eventId, {
          eventId: item.eventId,
          summary: item.summary,
          affectedAssets: item.affectedAssets ?? [],
          affectedCorridors: item.affectedCorridors ?? [],
          potentialSupplyImpact: item.potentialSupplyImpact ?? 'LOW',
          indiaExposure: item.indiaExposure ?? 'LOW',
          recommendedMonitoring: item.recommendedMonitoring ?? [],
          confidence: item.confidence ?? 50,
        });
      }
    } catch {
      // Silent fallback — rule-based classification remains
    }

    return results;
  }
}

function buildBatchPrompt(events: GeopoliticalEvent[]): string {
  const eventSummaries = events.map((e) => ({
    eventId: e.id,
    title: e.title,
    source: e.source,
    date: e.publishedAt,
    description: e.description ?? 'No description available.',
  }));

  return `Analyze these ${events.length} energy-security events. Return a JSON array (no markdown) where each element has: eventId, summary (1 sentence), affectedAssets (array of strings), affectedCorridors (array of strings), potentialSupplyImpact (LOW|MEDIUM|HIGH), indiaExposure (LOW|MEDIUM|HIGH), recommendedMonitoring (array of strings), confidence (0-100). Do NOT invent numerical values.

Events:
${JSON.stringify(eventSummaries)}`;
}

/**
 * Factory: returns the appropriate analyzer based on environment.
 * If no API key is set, returns NullAIAnalyzer (deterministic fallback).
 */
export function createAIAnalyzer(): AIAnalyzer {
  const apiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? '';
  if (apiKey) {
    return new OpenAIAnalyzer(apiKey);
  }
  return new NullAIAnalyzer();
}

/**
 * Selects events that should be sent to AI based on the configured threshold.
 */
export function selectForAI(events: GeopoliticalEvent[]): GeopoliticalEvent[] {
  const threshold = config.aiThreshold;
  return events.filter((e) => {
    if (e.impactScore >= threshold.minImpactScore) return true;
    if (threshold.triggerSeverities.includes(e.severity)) return true;
    if (threshold.triggerRegions.includes(e.region)) return true;
    return false;
  });
}
