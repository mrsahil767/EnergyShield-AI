import type { RawArticle } from './types';

/**
 * Deduplicates articles that refer to the same event.
 * Uses normalized URL and title similarity.
 * Returns canonical articles with a count of related articles.
 */
export function deduplicate(articles: RawArticle[]): RawArticle[] {
  const seen = new Map<string, { article: RawArticle; count: number }>();

  for (const article of articles) {
    const normalizedUrl = normalizeUrl(article.url);
    const titleKey = normalizeTitle(article.title);

    // Check for exact URL match
    if (seen.has(normalizedUrl)) {
      const existing = seen.get(normalizedUrl)!;
      existing.count++;
      // Prefer higher tier (lower number = better)
      if (article.sourceTier < existing.article.sourceTier) {
        existing.article = article;
      }
      continue;
    }

    // Check for title similarity
    let foundSimilar = false;
    for (const [key, value] of seen) {
      if (titleSimilarity(titleKey, normalizeTitle(value.article.title)) >= 0.7) {
        value.count++;
        if (article.sourceTier < value.article.sourceTier) {
          value.article = article;
        }
        foundSimilar = true;
        break;
      }
    }

    if (!foundSimilar) {
      seen.set(normalizedUrl, { article, count: 1 });
    }
  }

  return Array.from(seen.values()).map(({ article, count }) => ({
    ...article,
    relatedArticles: count,
  }));
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`;
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Simple Jaccard similarity on word sets.
 */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
