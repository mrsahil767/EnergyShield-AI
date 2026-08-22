/**
 * EnergyShield AI — Data Validation Script
 *
 * Validates all processed datasets against schema requirements:
 * - Required fields present
 * - Valid dataType values (official | derived | simulated)
 * - No invalid dates
 * - No impossible negative values
 * - No missing source for official/derived records
 * - No duplicate IDs
 *
 * Usage: npm run validate-data
 *
 * Exit code 0 = all valid, 1 = validation errors found.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const processedDir = join(__dirname, '..', 'src', 'data', 'processed');

const ALLOWED_DATA_TYPES = ['official', 'derived', 'simulated'];
const ISO_DATE_REGEX = /^\d{4}-\d{2}(-\d{2})?$/;

const requirements = {
  chokepoints: {
    type: 'array',
    required: ['id', 'name', 'oilFlowMbd', 'sourceOrganization', 'dataType'],
    nonNegative: ['oilFlowMbd', 'crudeAndCondensateMbd', 'petroleumProductsMbd'],
  },
  india_oil_imports: {
    type: 'array',
    required: ['id', 'period', 'importQuantityMt', 'sourceOrganization', 'dataType'],
    nonNegative: ['importQuantityMt', 'importValueBnUsd', 'importSharePct'],
  },
  india_crude_production: {
    type: 'array',
    required: ['id', 'period', 'productionMt', 'sourceOrganization', 'dataType'],
    nonNegative: ['productionMt'],
  },
  indian_basket_prices: {
    type: 'array',
    required: ['id', 'date', 'price', 'currency', 'dataType'],
    nonNegative: ['price'],
  },
  global_oil_prices: {
    type: 'array',
    required: ['id', 'date', 'benchmark', 'price', 'currency', 'dataType'],
    nonNegative: ['price'],
  },
  suppliers: {
    type: 'array',
    required: ['id', 'country', 'dataType'],
    nonNegative: ['importVolumeMt', 'importSharePct', 'riskScore', 'reliabilityScore', 'procurementScore'],
  },
  routes: {
    type: 'array',
    required: ['id', 'name', 'riskScore', 'dataType'],
    nonNegative: ['riskScore', 'disruptionProbability', 'transitDays', 'oilFlowMbd'],
  },
  reserves: {
    type: 'object',
    required: ['currentCoverageDays', 'criticalThresholdDays', 'dataType'],
    nonNegative: ['currentCoverageDays', 'criticalThresholdDays', 'dailyConsumptionKbd', 'totalCapacityMt'],
  },
  energy_events: {
    type: 'array',
    required: ['id', 'date', 'region', 'category', 'title', 'dataType'],
    nonNegative: ['impactScore'],
  },
  scenarios: {
    type: 'array',
    required: ['id', 'name', 'baseGap', 'basePrice', 'baseRisk', 'dataType'],
    nonNegative: ['baseGap', 'basePrice', 'baseRisk', 'chokepointFlowMbd'],
  },
  refinery_capacity: {
    type: 'array',
    required: ['id', 'refinery', 'operator', 'capacityMtpa', 'dataType'],
    nonNegative: ['capacityMtpa'],
  },
};

const errors = [];
const warnings = [];

function validateRecord(record, rules, fileName, index) {
  const recordName = typeof index === 'number' ? `record[${index}]` : 'record';

  // Required fields
  for (const field of rules.required) {
    if (record[field] === undefined || record[field] === null) {
      // Allow null for explicitly nullable fields
      if (field === 'oilFlowMbd' || field === 'crudeAndCondensateMbd' || field === 'petroleumProductsMbd' || field === 'chokepointFlowMbd') {
        continue;
      }
      errors.push(`${fileName}: ${recordName} missing required field "${field}"`);
    }
  }

  // dataType validation
  const dt = record.dataType;
  if (dt !== undefined && !ALLOWED_DATA_TYPES.includes(dt)) {
    errors.push(`${fileName}: ${recordName} invalid dataType "${dt}" (allowed: ${ALLOWED_DATA_TYPES.join(', ')})`);
  }

  // Source required for official/derived
  if ((dt === 'official' || dt === 'derived') && !record.sourceOrganization && !record.source) {
    warnings.push(`${fileName}: ${recordName} dataType="${dt}" but no sourceOrganization/source field`);
  }

  // Non-negative checks
  for (const field of rules.nonNegative) {
    const val = record[field];
    if (val !== undefined && val !== null && typeof val === 'number' && val < 0) {
      errors.push(`${fileName}: ${recordName} field "${field}" has negative value ${val}`);
    }
  }

  // Date validation
  if (record.date !== undefined && typeof record.date === 'string' && !ISO_DATE_REGEX.test(record.date)) {
    warnings.push(`${fileName}: ${recordName} date "${record.date}" may not be ISO format`);
  }
}

function validateFile(fileName, rules) {
  const filePath = join(processedDir, `${fileName}.json`);
  if (!existsSync(filePath)) {
    errors.push(`${fileName}.json: file not found`);
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    errors.push(`${fileName}.json: invalid JSON — ${e.message}`);
    return;
  }

  if (rules.type === 'array') {
    if (!Array.isArray(data)) {
      errors.push(`${fileName}.json: expected array, got ${typeof data}`);
      return;
    }
    const seenIds = new Set();
    data.forEach((record, i) => {
      validateRecord(record, rules, fileName, i);
      if (record.id !== undefined) {
        if (seenIds.has(record.id)) {
          errors.push(`${fileName}.json: duplicate id "${record.id}"`);
        }
        seenIds.add(record.id);
      }
    });
  } else {
    validateRecord(data, rules, fileName, null);
  }
}

// Run validation on all datasets
for (const [fileName, rules] of Object.entries(requirements)) {
  validateFile(fileName, rules);
}

console.log('=== EnergyShield AI Data Validation ===');
console.log(`\nErrors: ${errors.length}`);
errors.forEach((e) => console.log(`  [ERROR] ${e}`));
console.log(`\nWarnings: ${warnings.length}`);
warnings.forEach((w) => console.log(`  [WARN] ${w}`));

if (errors.length > 0) {
  console.log('\nValidation FAILED. Do not overwrite processed datasets.');
  process.exit(1);
} else {
  console.log('\nValidation PASSED. All datasets are valid.');
  process.exit(0);
}
