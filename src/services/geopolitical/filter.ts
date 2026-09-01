import type { RawArticle, SourceConfig } from './types';
import sourceConfigData from '@/data/sources/geopolitical_sources.json';

const config = sourceConfigData as unknown as SourceConfig;

/**
 * Filters articles by relevance to energy security.
 * Uses keyword matching — no AI calls.
 * Articles must contain at least one relevance keyword to pass.
 */
export function filterByRelevance(articles: RawArticle[]): RawArticle[] {
  return articles.filter((article) => {
    const text = `${article.title} ${article.description ?? ''}`.toLowerCase();
    return config.relevanceKeywords.some((kw) => text.includes(kvLowerCase(kw)));
  });
}

/**
 * Classifies an article into a category using deterministic keyword rules.
 * Falls back to the query's assigned category if no rule matches.
 */
export function classifyArticle(article: RawArticle): string {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();

  if (/\b(sanction|embargo)\b/.test(text)) return 'SANCTIONS';
  if (/\b(tanker|ship|vessel|shipping|reroute|convoy|piracy)\b/.test(text)) return 'SHIPPING';
  if (/\b(refinery|terminal|pipeline|port|infrastructure)\b/.test(text)) return 'INFRASTRUCTURE';
  if (/\b(hormuz|red sea|bab el-mandeb|suez|chokepoint|blockade|strait)\b/.test(text)) return 'GEOPOLITICAL';
  if (/\b(opec|production cut|output|quota|supply)\b/.test(text)) return 'POLICY';
  if (/\b(export|import|crude|barrel|oil flow)\b/.test(text)) return 'SUPPLY';
  if (/\b(market|price|futures|brent|wti)\b/.test(text)) return 'MARKET';

  return article.category || 'GEOPOLITICAL';
}

/**
 * Classifies the geographic region of an article.
 * Uses keyword matching against known regions.
 * Returns 'GLOBAL' if no confident match.
 */
export function classifyRegion(article: RawArticle): string {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();

  if (text.includes('hormuz')) return 'Strait of Hormuz';
  if (text.includes('bab el-mandeb') || text.includes('bab el mandeb')) return 'Bab el-Mandeb';
  if (text.includes('red sea')) return 'Red Sea';
  if (text.includes('suez')) return 'Suez';
  if (text.includes('persian gulf') || text.includes('arabian gulf')) return 'Persian Gulf';
  if (text.includes('arabian sea')) return 'Arabian Sea';
  if (text.includes('west africa') || text.includes('nigeria')) return 'West Africa';
  if (text.includes('russia') || text.includes('ukraine')) return 'Russia-Europe';
  if (text.includes('south asia') || text.includes('india')) return 'South Asia';
  if (text.includes('north america') || text.includes('united states') || text.includes('u.s.')) return 'North America';

  // Fall back to query-assigned region
  return article.region || 'GLOBAL';
}

function kvLowerCase(s: string): string {
  return s.toLowerCase();
}
