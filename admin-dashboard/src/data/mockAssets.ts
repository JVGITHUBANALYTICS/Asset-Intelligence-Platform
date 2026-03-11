import type { Asset, AssetClass, RiskLevel, VoltageClass } from '../types';

// ─── Seeded PRNG (Mulberry32) ───────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Original 12 hardcoded assets ───────────────────────────────
const originalAssets: Asset[] = [
  {
    id: 'TX-4401',
    type: 'Power Transformer',
    manufacturer: 'ABB',
    voltage: '345/138 kV',
    capacity: '500 MVA',
    location: 'Riverside Substation',
    commissionDate: '1978-06-15',
    age: 47,
    healthScore: 18,
    riskScore: 96,
    riskLevel: 'critical',
    estimatedCost: 4200000,
    lastAssessment: '2026-01-08',
    customersAffected: 42000,
    voltageClass: 'Transmission',
  },
  {
    id: 'TX-2287',
    type: 'Power Transformer',
    manufacturer: 'GE',
    voltage: '230/69 kV',
    capacity: '200 MVA',
    location: 'Northgate Station',
    commissionDate: '1982-03-22',
    age: 43,
    healthScore: 24,
    riskScore: 92,
    riskLevel: 'critical',
    estimatedCost: 3800000,
    lastAssessment: '2026-01-12',
    customersAffected: 38500,
    voltageClass: 'Transmission',
  },
  {
    id: 'CB-0819',
    type: 'Circuit Breaker',
    manufacturer: 'Siemens',
    voltage: '138 kV',
    capacity: '3000 A',
    location: 'Elm Creek Substation',
    commissionDate: '1985-11-10',
    age: 40,
    healthScore: 31,
    riskScore: 88,
    riskLevel: 'high',
    estimatedCost: 850000,
    lastAssessment: '2025-12-20',
    customersAffected: 22000,
    voltageClass: 'Sub-Transmission',
  },
  {
    id: 'TX-3350',
    type: 'Power Transformer',
    manufacturer: 'Westinghouse',
    voltage: '138/69 kV',
    capacity: '100 MVA',
    location: 'Valley View Sub',
    commissionDate: '1975-09-05',
    age: 50,
    healthScore: 22,
    riskScore: 94,
    riskLevel: 'critical',
    estimatedCost: 2900000,
    lastAssessment: '2026-01-15',
    customersAffected: 31000,
    voltageClass: 'Sub-Transmission',
  },
  {
    id: 'CB-1145',
    type: 'Circuit Breaker',
    manufacturer: 'ABB',
    voltage: '69 kV',
    capacity: '2000 A',
    location: 'Oakmont Substation',
    commissionDate: '1990-04-18',
    age: 35,
    healthScore: 38,
    riskScore: 82,
    riskLevel: 'high',
    estimatedCost: 620000,
    lastAssessment: '2025-11-30',
    customersAffected: 15800,
    voltageClass: 'Sub-Transmission',
  },
  {
    id: 'DT-7720',
    type: 'Dist Transformer',
    manufacturer: 'Howard Industries',
    voltage: '13.8/0.48 kV',
    capacity: '2500 kVA',
    location: 'Industrial Park Feeder 12',
    commissionDate: '1998-08-12',
    age: 27,
    healthScore: 42,
    riskScore: 76,
    riskLevel: 'high',
    estimatedCost: 185000,
    lastAssessment: '2025-12-05',
    customersAffected: 340,
    voltageClass: 'Distribution',
  },
  {
    id: 'DS-0334',
    type: 'Disconnect Switch',
    manufacturer: 'S&C Electric',
    voltage: '138 kV',
    capacity: '1200 A',
    location: 'Riverside Substation',
    commissionDate: '1988-02-28',
    age: 37,
    healthScore: 35,
    riskScore: 79,
    riskLevel: 'high',
    estimatedCost: 320000,
    lastAssessment: '2025-12-18',
    customersAffected: 42000,
    voltageClass: 'Sub-Transmission',
  },
  {
    id: 'VR-0056',
    type: 'Voltage Regulator',
    manufacturer: 'Cooper Power',
    voltage: '13.8 kV',
    capacity: '500 kVA',
    location: 'Maple Grove Feeder 7',
    commissionDate: '2005-06-20',
    age: 20,
    healthScore: 58,
    riskScore: 55,
    riskLevel: 'medium',
    estimatedCost: 95000,
    lastAssessment: '2025-10-14',
    customersAffected: 1200,
    voltageClass: 'Distribution',
  },
  {
    id: 'RC-0112',
    type: 'Recloser',
    manufacturer: 'Cooper Power',
    voltage: '25 kV',
    capacity: '560 A',
    location: 'Cedar Hills Line 4',
    commissionDate: '2010-11-03',
    age: 15,
    healthScore: 72,
    riskScore: 38,
    riskLevel: 'low',
    estimatedCost: 45000,
    lastAssessment: '2025-09-22',
    customersAffected: 860,
    voltageClass: 'Distribution',
  },
  {
    id: 'UC-0088',
    type: 'Underground Cable',
    manufacturer: 'Southwire',
    voltage: '69 kV',
    capacity: '400 A',
    location: 'Downtown Loop Section 3',
    commissionDate: '1995-03-14',
    age: 30,
    healthScore: 44,
    riskScore: 71,
    riskLevel: 'medium',
    estimatedCost: 1500000,
    lastAssessment: '2025-11-11',
    customersAffected: 8500,
    voltageClass: 'Sub-Transmission',
  },
  {
    id: 'CP-0201',
    type: 'Capacitor Bank',
    manufacturer: 'Eaton',
    voltage: '13.8 kV',
    capacity: '3600 kVAR',
    location: 'Westfield Sub',
    commissionDate: '2008-07-09',
    age: 17,
    healthScore: 65,
    riskScore: 42,
    riskLevel: 'low',
    estimatedCost: 110000,
    lastAssessment: '2025-10-28',
    customersAffected: 4200,
    voltageClass: 'Distribution',
  },
  {
    id: 'TX-5580',
    type: 'Power Transformer',
    manufacturer: 'Hitachi',
    voltage: '230/138 kV',
    capacity: '400 MVA',
    location: 'Lakewood Central',
    commissionDate: '2015-01-20',
    age: 11,
    healthScore: 85,
    riskScore: 22,
    riskLevel: 'low',
    estimatedCost: 3500000,
    lastAssessment: '2025-12-01',
    customersAffected: 55000,
    voltageClass: 'Transmission',
  },
];

// ─── Asset-type configuration ───────────────────────────────────
interface AssetTypeConfig {
  type: AssetClass;
  prefix: string;
  manufacturers: string[];
  voltages: string[];
  capacities: string[];
  voltageClass: VoltageClass;
  costMin: number;
  costMax: number;
  customersMin: number;
  customersMax: number;
}

const assetTypeConfigs: AssetTypeConfig[] = [
  {
    type: 'Power Transformer',
    prefix: 'TX',
    manufacturers: ['ABB', 'GE', 'Siemens', 'Hitachi', 'Westinghouse', 'Hyundai', 'TBEA'],
    voltages: ['345/138 kV', '230/138 kV', '230/69 kV', '138/69 kV', '500/230 kV', '345/69 kV'],
    capacities: ['100 MVA', '150 MVA', '200 MVA', '300 MVA', '400 MVA', '500 MVA', '750 MVA'],
    voltageClass: 'Transmission',
    costMin: 2000000,
    costMax: 6000000,
    customersMin: 10000,
    customersMax: 60000,
  },
  {
    type: 'Circuit Breaker',
    prefix: 'CB',
    manufacturers: ['ABB', 'Siemens', 'GE', 'Eaton', 'Schneider'],
    voltages: ['345 kV', '230 kV', '138 kV', '69 kV', '46 kV'],
    capacities: ['1200 A', '2000 A', '3000 A', '4000 A', '1600 A'],
    voltageClass: 'Sub-Transmission',
    costMin: 400000,
    costMax: 1200000,
    customersMin: 5000,
    customersMax: 35000,
  },
  {
    type: 'Dist Transformer',
    prefix: 'DT',
    manufacturers: ['Howard Industries', 'Eaton', 'ABB', 'Cooper Power', 'Prolec GE'],
    voltages: ['13.8/0.48 kV', '13.8/0.24 kV', '4.16/0.48 kV', '13.2/0.24 kV', '23/0.48 kV', '34.5/0.48 kV'],
    capacities: ['25 kVA', '50 kVA', '75 kVA', '100 kVA', '167 kVA', '250 kVA', '500 kVA', '750 kVA', '1000 kVA', '1500 kVA', '2000 kVA', '2500 kVA'],
    voltageClass: 'Distribution',
    costMin: 80000,
    costMax: 300000,
    customersMin: 100,
    customersMax: 5000,
  },
  {
    type: 'Disconnect Switch',
    prefix: 'DS',
    manufacturers: ['S&C Electric', 'ABB', 'Siemens', 'Southern States'],
    voltages: ['345 kV', '230 kV', '138 kV', '69 kV', '46 kV'],
    capacities: ['600 A', '1200 A', '2000 A', '3000 A'],
    voltageClass: 'Sub-Transmission',
    costMin: 150000,
    costMax: 500000,
    customersMin: 2000,
    customersMax: 25000,
  },
  {
    type: 'Capacitor Bank',
    prefix: 'CP',
    manufacturers: ['Eaton', 'ABB', 'GE', 'Schneider'],
    voltages: ['13.8 kV', '23 kV', '34.5 kV', '4.16 kV', '13.2 kV'],
    capacities: ['1200 kVAR', '1800 kVAR', '2400 kVAR', '3600 kVAR', '4800 kVAR', '6000 kVAR'],
    voltageClass: 'Distribution',
    costMin: 60000,
    costMax: 250000,
    customersMin: 500,
    customersMax: 8000,
  },
  {
    type: 'Voltage Regulator',
    prefix: 'VR',
    manufacturers: ['Cooper Power', 'Eaton', 'Siemens', 'GE'],
    voltages: ['13.8 kV', '23 kV', '34.5 kV', '4.16 kV', '13.2 kV'],
    capacities: ['250 kVA', '500 kVA', '750 kVA', '1000 kVA'],
    voltageClass: 'Distribution',
    costMin: 50000,
    costMax: 200000,
    customersMin: 300,
    customersMax: 5000,
  },
  {
    type: 'Recloser',
    prefix: 'RC',
    manufacturers: ['Cooper Power', 'S&C Electric', 'ABB', 'Eaton'],
    voltages: ['15 kV', '25 kV', '27 kV', '38 kV'],
    capacities: ['280 A', '400 A', '560 A', '800 A'],
    voltageClass: 'Distribution',
    costMin: 25000,
    costMax: 120000,
    customersMin: 200,
    customersMax: 3000,
  },
  {
    type: 'Underground Cable',
    prefix: 'UC',
    manufacturers: ['Southwire', 'Prysmian', 'Nexans', 'General Cable'],
    voltages: ['138 kV', '69 kV', '46 kV', '34.5 kV', '15 kV', '25 kV'],
    capacities: ['200 A', '400 A', '600 A', '800 A', '1000 A'],
    voltageClass: 'Sub-Transmission',
    costMin: 500000,
    costMax: 3000000,
    customersMin: 1000,
    customersMax: 15000,
  },
];

// ─── Pennsylvania locations ─────────────────────────────────────
// Substations for Transmission / Sub-Transmission assets
const substationLocations: string[] = [
  'Riverside Substation', 'Northgate Station', 'Elm Creek Substation',
  'Valley View Sub', 'Oakmont Substation', 'Lakewood Central',
  'Westfield Sub', 'Penn Hills Station', 'Braddock Substation',
  'Monroeville Sub', 'Cranberry Station', 'Allegheny North Sub',
  'Beaver Valley Sub', 'Washington Junction', 'Mt. Lebanon Station',
  'Greensburg Substation', 'Connellsville Sub', 'Uniontown Station',
  'Indiana Borough Sub', 'Johnstown Central', 'Altoona West Sub',
  'State College Station', 'Bellefonte Sub', 'Lock Haven Station',
  'Williamsport North Sub', 'Scranton Central', 'Wilkes-Barre Sub',
  'Hazleton Station', 'Pottsville Sub', 'Reading East Station',
  'Lancaster Central', 'York Junction Sub', 'Harrisburg West',
  'Carlisle Sub', 'Chambersburg Station', 'Gettysburg Sub',
  'Hanover Station', 'Lebanon Valley Sub', 'Bethlehem Central',
  'Easton Station', 'Norristown Sub', 'King of Prussia Station',
  'Chester Springs Sub', 'Media Junction', 'Swarthmore Station',
];

// Feeder names for Distribution assets
const feederLocations: string[] = [
  'Industrial Park Feeder 12', 'Maple Grove Feeder 7', 'Cedar Hills Line 4',
  'Downtown Loop Section 3', 'Pine Ridge Feeder 9', 'Chestnut Ave Feeder 2',
  'Market Street Line 6', 'Highland Park Feeder 11', 'Shadyside Loop 3',
  'Squirrel Hill Feeder 5', 'South Side Line 8', 'Strip District Feeder 1',
  'Lawrenceville Line 10', 'Bloomfield Feeder 14', 'East Liberty Loop 7',
  'Brookline Feeder 3', 'Dormont Line 12', 'Beechview Feeder 6',
  'Mt. Washington Loop 2', 'Carrick Line 9', 'Oakland Feeder 15',
  'Greenfield Loop 4', 'Hazelwood Line 11', 'North Shore Feeder 8',
  'Manchester Line 5', 'Troy Hill Feeder 13', 'Spring Garden Loop 1',
  'Polish Hill Line 7', 'Brighton Heights Feeder 10', 'Bellevue Loop 6',
  'Avalon Feeder 2', 'Ross Township Line 14', 'Shaler Feeder 9',
  'Etna Loop 3', 'Millvale Line 8', 'Aspinwall Feeder 5',
];

// ─── Weighted asset type selection ──────────────────────────────
// Distribution: ~15% Power Transformer, ~15% Circuit Breaker, ~20% Dist Transformer,
// ~12% Disconnect Switch, ~10% Capacitor Bank, ~10% Voltage Regulator,
// ~10% Recloser, ~8% Underground Cable
const assetTypeWeights: number[] = [0.15, 0.15, 0.20, 0.12, 0.10, 0.10, 0.10, 0.08];

function pickWeightedIndex(rand: () => number, weights: number[]): number {
  const r = rand();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return i;
  }
  return weights.length - 1;
}

function pickItem<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function padId(n: number): string {
  return String(n).padStart(4, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(riskScore: number): RiskLevel {
  if (riskScore > 85) return 'critical';
  if (riskScore > 70) return 'high';
  if (riskScore > 45) return 'medium';
  return 'low';
}

// ─── Generator ──────────────────────────────────────────────────
function generateAssets(): Asset[] {
  const rand = mulberry32(123456789);
  const assets: Asset[] = [...originalAssets];

  // Track used IDs to avoid collisions with originals
  const usedIds = new Set<string>(originalAssets.map((a) => a.id));

  for (let i = 0; i < 988; i++) {
    const configIndex = pickWeightedIndex(rand, assetTypeWeights);
    const config = assetTypeConfigs[configIndex];

    // Generate unique ID
    let id: string;
    do {
      id = `${config.prefix}-${padId(randInt(rand, 100, 9999))}`;
    } while (usedIds.has(id));
    usedIds.add(id);

    const manufacturer = pickItem(rand, config.manufacturers);
    const voltage = pickItem(rand, config.voltages);
    const capacity = pickItem(rand, config.capacities);

    // Location: substations for Transmission/Sub-Transmission, feeders for Distribution
    const location =
      config.voltageClass === 'Distribution'
        ? pickItem(rand, feederLocations)
        : pickItem(rand, substationLocations);

    // Commission date: weighted toward 1990-2010 range
    // Use a bell-curve-like approach centered around 2000
    const yearBase = 2000;
    const yearSpread = rand() + rand() + rand(); // sum of 3 uniforms -> approx bell shape [0,3]
    const normalizedSpread = (yearSpread / 3) * 2 - 1; // map to [-1, 1]
    const commissionYear = clamp(
      Math.round(yearBase + normalizedSpread * 25),
      1965,
      2024,
    );
    const commissionMonth = randInt(rand, 1, 12);
    const commissionDay = randInt(rand, 1, 28); // avoid invalid dates
    const commissionDate = formatDate(commissionYear, commissionMonth, commissionDay);

    const currentYear = 2025;
    const age = currentYear - commissionYear;

    // Health score: inversely correlated with age, with variance
    // Base health decreases linearly with age, then add noise
    const baseHealth = clamp(95 - age * 1.5, 10, 95);
    const healthNoise = (rand() - 0.5) * 30; // +/- 15 points
    const healthScore = clamp(Math.round(baseHealth + healthNoise), 10, 98);

    // Risk score: inversely related to health score, with some noise
    const baseRisk = 100 - healthScore;
    const riskNoise = (rand() - 0.5) * 16; // +/- 8 points
    const riskScore = clamp(Math.round(baseRisk + riskNoise), 5, 99);

    const riskLevel = getRiskLevel(riskScore);

    // Estimated cost: random within type range, rounded to nearest $10K
    const rawCost = randFloat(rand, config.costMin, config.costMax);
    const estimatedCost = Math.round(rawCost / 10000) * 10000;

    // Last assessment: within the last 12 months (Feb 2025 - Jan 2026)
    const assessmentMonthOffset = randInt(rand, 0, 11); // 0-11 months ago
    const assessmentDay = randInt(rand, 1, 28);
    let assessmentYear: number;
    let assessmentMonth: number;
    // Current reference: Jan 2026; go back 0-11 months
    const totalMonths = 2026 * 12 + 1 - assessmentMonthOffset; // Jan 2026 = month 24313
    assessmentYear = Math.floor((totalMonths - 1) / 12);
    assessmentMonth = ((totalMonths - 1) % 12) + 1;
    const lastAssessment = formatDate(assessmentYear, assessmentMonth, assessmentDay);

    // Customers affected
    const customersAffected = randInt(rand, config.customersMin, config.customersMax);

    // Voltage class: some underground cables may serve distribution
    let voltageClass: VoltageClass = config.voltageClass;
    if (config.type === 'Underground Cable') {
      // Lower voltage cables are distribution
      if (voltage === '15 kV' || voltage === '25 kV') {
        voltageClass = 'Distribution';
      } else if (voltage === '34.5 kV' || voltage === '46 kV') {
        voltageClass = 'Sub-Transmission';
      } else {
        voltageClass = 'Sub-Transmission';
      }
    }
    if (config.type === 'Circuit Breaker') {
      if (voltage === '345 kV' || voltage === '230 kV') {
        voltageClass = 'Transmission';
      }
    }
    if (config.type === 'Disconnect Switch') {
      if (voltage === '345 kV' || voltage === '230 kV') {
        voltageClass = 'Transmission';
      }
    }

    assets.push({
      id,
      type: config.type,
      manufacturer,
      voltage,
      capacity,
      location,
      commissionDate,
      age,
      healthScore,
      riskScore,
      riskLevel,
      estimatedCost,
      lastAssessment,
      customersAffected,
      voltageClass,
    });
  }

  return assets;
}

// ─── Export static array (generated once at module load) ─────────
export const mockAssets: Asset[] = generateAssets();
