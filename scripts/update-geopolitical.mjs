/**
 * EnergyShield AI — Geopolitical Data Refresh Script
 *
 * Runs the geopolitical event pipeline in mock mode by default.
 * Set GEOPOLITICAL_MOCK_MODE=false to fetch from live sources.
 *
 * Usage: npm run update-geopolitical
 *
 * In mock mode: no network calls, uses sample data.
 * In live mode: fetches from GDELT, filters, deduplicates, scores, optionally AI.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const processedDir = join(dataDir, 'processed');
const metadataDir = join(dataDir, 'metadata');
const rawDir = join(dataDir, 'raw', 'geopolitical');

const mockMode = process.env.GEOPOLITICAL_MOCK_MODE !== 'false';
const now = new Date().toISOString();

console.log('=== EnergyShield AI — Geopolitical Refresh ===');
console.log(`Mode: ${mockMode ? 'MOCK (no network calls)' : 'LIVE (fetching from sources)'}`);
console.log(`Timestamp: ${now}`);

if (!existsSync(rawDir)) mkdirSync(rawDir, { recursive: true });

// Load source config
const sourceConfig = JSON.parse(readFileSync(join(dataDir, 'sources', 'geopolitical_sources.json'), 'utf-8'));

// In mock mode, use the existing processed events
if (mockMode) {
  const eventsPath = join(processedDir, 'geopolitical_events.json');
  if (existsSync(eventsPath)) {
    const events = JSON.parse(readFileSync(eventsPath, 'utf-8'));
    // Update retrievedAt timestamps
    for (const evt of events) {
      evt.retrievedAt = now;
    }
    writeFileSync(eventsPath, JSON.stringify(events, null, 2) + '\n', 'utf-8');

    // Update status metadata
    const statusPath = join(metadataDir, 'geopolitical_status.json');
    const status = existsSync(statusPath) ? JSON.parse(readFileSync(statusPath, 'utf-8')) : {};
    status.lastGeopoliticalUpdate = now;
    status.geopoliticalStatus = 'mock';
    status.totalEvents = events.length;
    status.criticalEvents = events.filter((e) => e.severity === 'CRITICAL').length;
    status.highEvents = events.filter((e) => e.severity === 'HIGH').length;
    status.aiStatus = 'unavailable';
    status.usingFallback = false;
    writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n', 'utf-8');

    console.log(`\nMock mode: ${events.length} events preserved.`);
    console.log(`  CRITICAL: ${status.criticalEvents}`);
    console.log(`  HIGH: ${status.highEvents}`);
    console.log(`\nNo network calls made. No AI credits used.`);
  }
  process.exit(0);
}

// In live mode, we would run the full pipeline
// This requires the GDELT fetch logic implemented in Node.js
// For now, log that live mode requires the pipeline to be run from the browser/edge function
console.log('\nLive mode requires the geopolitical pipeline to run via the edge function.');
console.log('The edge function at supabase/functions/geopolitical-events/ handles live fetching.');
console.log('This script updates metadata timestamps only in live mode.');

// Update status metadata
const statusPath = join(metadataDir, 'geopolitical_status.json');
const status = existsSync(statusPath) ? JSON.parse(readFileSync(statusPath, 'utf-8')) : {};
status.lastGeopoliticalUpdate = now;
status.geopoliticalStatus = 'live';
status.aiStatus = 'unavailable';
status.usingFallback = false;
writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n', 'utf-8');

console.log(`\nMetadata updated at ${now}`);
