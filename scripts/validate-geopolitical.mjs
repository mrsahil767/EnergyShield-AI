/**
 * EnergyShield AI — Geopolitical Data Validation Script
 *
 * Validates the geopolitical events dataset and source configuration.
 * Checks: required fields, valid dataType, valid severity, no missing source,
 * no impossible values, no duplicate IDs.
 *
 * Usage: npm run validate-geopolitical
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

const errors = [];
const warnings = [];

const ALLOWED_DATA_TYPES = ['official', 'derived', 'simulated'];
const ALLOWED_SEVERITIES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
const ALLOWED_CATEGORIES = ['GEOPOLITICAL', 'SHIPPING', 'SANCTIONS', 'SUPPLY', 'INFRASTRUCTURE', 'MARKET', 'POLICY'];

// Validate geopolitical_events.json
const eventsPath = join(dataDir, 'processed', 'geopolitical_events.json');
if (!existsSync(eventsPath)) {
  errors.push('processed/geopolitical_events.json: file not found');
} else {
  let events;
  try {
    events = JSON.parse(readFileSync(eventsPath, 'utf-8'));
  } catch (e) {
    errors.push(`geopolitical_events.json: invalid JSON — ${e.message}`);
  }

  if (events) {
    if (!Array.isArray(events)) {
      errors.push('geopolitical_events.json: expected array');
    } else {
      const seenIds = new Set();
      for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        const name = `event[${i}]`;

        // Required fields
        for (const field of ['id', 'title', 'source', 'publishedAt', 'region', 'category', 'severity', 'impactScore', 'dataType']) {
          if (evt[field] === undefined || evt[field] === null) {
            errors.push(`${name}: missing required field "${field}"`);
          }
        }

        // dataType
        if (evt.dataType && !ALLOWED_DATA_TYPES.includes(evt.dataType)) {
          errors.push(`${name}: invalid dataType "${evt.dataType}"`);
        }

        // severity
        if (evt.severity && !ALLOWED_SEVERITIES.includes(evt.severity)) {
          errors.push(`${name}: invalid severity "${evt.severity}"`);
        }

        // category
        if (evt.category && !ALLOWED_CATEGORIES.includes(evt.category)) {
          errors.push(`${name}: invalid category "${evt.category}"`);
        }

        // impactScore range
        if (evt.impactScore !== undefined && (typeof evt.impactScore !== 'number' || evt.impactScore < 0 || evt.impactScore > 100)) {
          errors.push(`${name}: impactScore must be 0-100, got ${evt.impactScore}`);
        }

        // confidence range
        if (evt.confidence !== undefined && (typeof evt.confidence !== 'number' || evt.confidence < 0 || evt.confidence > 100)) {
          errors.push(`${name}: confidence must be 0-100, got ${evt.confidence}`);
        }

        // source required for derived/official
        if ((evt.dataType === 'derived' || evt.dataType === 'official') && !evt.source) {
          warnings.push(`${name}: dataType="${evt.dataType}" but no source field`);
        }

        // Duplicate ID
        if (evt.id) {
          if (seenIds.has(evt.id)) {
            errors.push(`${name}: duplicate id "${evt.id}"`);
          }
          seenIds.add(evt.id);
        }

        // modelVersion required for derived
        if (evt.dataType === 'derived' && !evt.modelVersion) {
          warnings.push(`${name}: derived data without modelVersion`);
        }
      }
    }
  }
}

// Validate source config
const sourceConfigPath = join(dataDir, 'sources', 'geopolitical_sources.json');
if (!existsSync(sourceConfigPath)) {
  errors.push('sources/geopolitical_sources.json: file not found');
} else {
  let config;
  try {
    config = JSON.parse(readFileSync(sourceConfigPath, 'utf-8'));
  } catch (e) {
    errors.push(`geopolitical_sources.json: invalid JSON — ${e.message}`);
  }

  if (config) {
    // Check queries exist
    if (!config.queries || !Array.isArray(config.queries) || config.queries.length === 0) {
      errors.push('geopolitical_sources.json: no queries defined');
    }

    // Check each query has keywords
    if (config.queries) {
      for (const q of config.queries) {
        if (!q.keywords || q.keywords.length === 0) {
          errors.push(`query "${q.id}": no keywords defined`);
        }
      }
    }

    // Check impact weights exist
    if (!config.impactWeights) {
      errors.push('geopolitical_sources.json: no impactWeights defined');
    }

    // Check decay schedule
    if (!config.decaySchedule) {
      errors.push('geopolitical_sources.json: no decaySchedule defined');
    }
  }
}

console.log('=== EnergyShield AI — Geopolitical Validation ===');
console.log(`\nErrors: ${errors.length}`);
errors.forEach((e) => console.log(`  [ERROR] ${e}`));
console.log(`\nWarnings: ${warnings.length}`);
warnings.forEach((w) => console.log(`  [WARN] ${w}`));

if (errors.length > 0) {
  console.log('\nValidation FAILED.');
  process.exit(1);
} else {
  console.log('\nValidation PASSED.');
  process.exit(0);
}
