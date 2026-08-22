import type { GeopoliticalEvent, RawArticle, SourceConfig } from './types';
import sourceConfigData from '@/data/sources/geopolitical_sources.json';

const config = sourceConfigData as unknown as SourceConfig;

/**
 * Fetches raw articles from GDELT DOC 2.0 API.
 * Uses targeted queries with strict result limits to conserve resources.
 * Returns empty array on failure — caller falls back to cached/mock data.
 */
export async function fetchFromGDELT(query: typeof config.queries[number], timeWindowHours: number): Promise<RawArticle[]> {
  const keywords = query.keywords.join(' OR ');
  const startDate = new Date(Date.now() - timeWindowHours * 3600_000);
  const startStr = startDate.toISOString().slice(0, 10).replace(/-/g, '');
  const url = `${config.sources[0].url}?query=${encodeURIComponent(keywords)}&mode=ArtList&maxrecords=${config.maxResultsPerQuery}&startdatetime=${startStr}000000&sort=DateDesc&format=json`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.articles) return [];

    return (data.articles as Record<string, string>[]).slice(0, config.maxResultsPerQuery).map((article, i) => ({
      id: `gdelt-${query.id}-${i}`,
      title: article.title ?? '',
      description: null,
      url: article.url ?? '',
      source: article.domain ? article.domain.replace(/^www\./, '') : 'GDELT',
      sourceTier: 3,
      publishedAt: article.seendate ? parseGDELTDate(article.seendate) : new Date().toISOString(),
      retrievedAt: new Date().toISOString(),
      region: 'GLOBAL',
      category: query.category,
      queryId: query.id,
    }));
  } catch {
    return [];
  }
}

function parseGDELTDate(seendate: string): string {
  // GDELT format: 20260820T123000Z
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return new Date().toISOString();
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

/**
 * Fetches from all enabled sources. In mock mode, returns sample data without network calls.
 */
export async function fetchAllSources(mockMode: boolean): Promise<RawArticle[]> {
  if (mockMode) {
    return getMockArticles();
  }

  const allArticles: RawArticle[] = [];
  for (const query of config.queries) {
    const articles = await fetchFromGDELT(query, config.defaultTimeWindowHours);
    allArticles.push(...articles);
    // Sequential to respect rate limits — small delay between queries
    await new Promise((r) => setTimeout(r, 500));
  }
  return allArticles;
}

/**
 * Mock articles for development mode — no network calls, no API credits used.
 */
function getMockArticles(): RawArticle[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'mock-001',
      title: 'Shipping disruptions reported near Strait of Hormuz',
      description: 'Commercial vessels rerouting amid heightened regional naval activity.',
      url: 'https://www.eia.gov/international/analysis/regions-topics/world-oil-transit-chokepoints',
      source: 'eia.gov',
      sourceTier: 1,
      publishedAt: now,
      retrievedAt: now,
      region: 'Strait of Hormuz',
      category: 'GEOPOLITICAL',
      queryId: 'q-hormuz',
    },
    {
      id: 'mock-002',
      title: 'Red Sea tanker attacks force Cape of Good Hope reroutings',
      description: 'Multiple crude carriers diverting around Africa, adding 12-14 days transit time.',
      url: 'https://www.eia.gov/international/analysis/regions-topics/world-oil-transit-chokepoints',
      source: 'eia.gov',
      sourceTier: 1,
      publishedAt: now,
      retrievedAt: now,
      region: 'Red Sea',
      category: 'SHIPPING',
      queryId: 'q-redsea',
    },
    {
      id: 'mock-003',
      title: 'New sanctions package targets crude export networks',
      description: 'Coordinated measures affecting shipping companies operating in sanctioned trade corridors.',
      url: 'https://www.iea.org/reports/oil-market-report',
      source: 'iea.org',
      sourceTier: 2,
      publishedAt: now,
      retrievedAt: now,
      region: 'Russia-Europe',
      category: 'SANCTIONS',
      queryId: 'q-russia-sanctions',
    },
    {
      id: 'mock-004',
      title: 'OPEC+ maintains current production quotas',
      description: 'No immediate supply adjustment expected. Market remains balanced.',
      url: 'https://www.opec.org/opec_web/en/publications/340.htm',
      source: 'opec.org',
      sourceTier: 2,
      publishedAt: now,
      retrievedAt: now,
      region: 'Global',
      category: 'POLICY',
      queryId: 'q-opec-policy',
    },
  ];
}
