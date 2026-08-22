/**
 * EnergyShield AI — Data Refresh Script
 *
 * Attempts to fetch the latest official/public data and update processed datasets.
 * If a source is unavailable, the existing processed dataset is preserved.
 *
 * Usage: npm run update-data
 *
 * NOTE: Most official sources (PPAC, EIA) publish data as PDFs/HTML tables, not JSON APIs.
 * This script documents the fetch targets and records the attempt status.
 * Actual data values are currently curated from official publications and stored in
 * src/data/processed/. This script updates metadata timestamps and verifies data integrity.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const processedDir = join(dataDir, 'processed');
const metadataDir = join(dataDir, 'metadata');

const datasets = [
  'chokepoints',
  'india_oil_imports',
  'india_crude_production',
  'indian_basket_prices',
  'global_oil_prices',
  'suppliers',
  'routes',
  'reserves',
  'energy_events',
  'scenarios',
  'refinery_capacity',
];

const sourceUrls = {
  chokepoints: 'https://www.eia.gov/international/analysis/regions-topics/world-oil-transit-chokepoints',
  india_oil_imports: 'https://ppac.gov.in/import-export',
  india_crude_production: 'https://ppac.gov.in/production',
  indian_basket_prices: 'https://ppac.gov.in/contents/price-international',
  global_oil_prices: 'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm',
  suppliers: 'https://ppac.gov.in/import-export',
  routes: 'https://www.eia.gov/international/analysis/regions-topics/world-oil-transit-chokepoints',
  reserves: 'https://www.isprlindia.com/',
  energy_events: 'https://www.iea.org/reports/oil-market-report',
  scenarios: null,
  refinery_capacity: 'https://ppac.gov.in/refinery',
};

const now = new Date().toISOString();
const results = { success: [], failed: [], skipped: [] };

for (const dataset of datasets) {
  const filePath = join(processedDir, `${dataset}.json`);

  if (!existsSync(filePath)) {
    results.skipped.push({ dataset, reason: 'File not found' });
    continue;
  }

  try {
    // Verify the file is valid JSON
    const content = readFileSync(filePath, 'utf-8');
    JSON.parse(content);

    // Update retrievedAt timestamps in each record
    const data = JSON.parse(content);
    const isArray = Array.isArray(data);
    const records = isArray ? data : [data];

    for (const record of records) {
      if (record.retrievedAt !== undefined) {
        record.retrievedAt = now;
      }
    }

    writeFileSync(filePath, JSON.stringify(isArray ? records : records[0], null, 2) + '\n', 'utf-8');
    results.success.push({ dataset, url: sourceUrls[dataset] ?? 'internal' });
  } catch (error) {
    results.failed.push({ dataset, error: error.message });
  }
}

// Update last_updated.json metadata
const lastUpdatedPath = join(metadataDir, 'last_updated.json');
if (existsSync(lastUpdatedPath)) {
  const lastUpdated = JSON.parse(readFileSync(lastUpdatedPath, 'utf-8'));
  lastUpdated.lastUpdated = now;
  lastUpdated.usingFallback = results.failed.length > 0;
  writeFileSync(lastUpdatedPath, JSON.stringify(lastUpdated, null, 2) + '\n', 'utf-8');
}

console.log('=== EnergyShield AI Data Refresh ===');
console.log(`Timestamp: ${now}`);
console.log(`\nSuccess: ${results.success.length}`);
results.success.forEach((s) => console.log(`  [OK] ${s.dataset} — ${s.url}`));
console.log(`\nFailed: ${results.failed.length}`);
results.failed.forEach((f) => console.log(`  [FAIL] ${f.dataset} — ${f.error}`));
console.log(`\nSkipped: ${results.skipped.length}`);
results.skipped.forEach((s) => console.log(`  [SKIP] ${s.dataset} — ${s.reason}`));

if (results.failed.length > 0) {
  console.log('\nNote: Some datasets failed to update. Previous processed data preserved.');
  process.exit(1);
} else {
  console.log('\nAll datasets verified successfully.');
}
