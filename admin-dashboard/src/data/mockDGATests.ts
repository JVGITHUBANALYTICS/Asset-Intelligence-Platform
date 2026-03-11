import type { DGADiagnosis, DGAFaultType, DGATrend, DGATestResult } from '../types';

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

// ─── Utility functions ──────────────────────────────────────────
function pickItem<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(rand: () => number, min: number, max: number): number {
  return Math.round((min + rand() * (max - min)) * 10) / 10;
}

function padId(n: number): string {
  return String(n).padStart(4, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function pickWeightedIndex(rand: () => number, weights: number[]): number {
  const r = rand();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return i;
  }
  return weights.length - 1;
}

// ─── Pennsylvania locations (matching mockAssets.ts pools) ──────
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

// ─── Lab pool ───────────────────────────────────────────────────
const labs: string[] = [
  'National Testing Labs',
  'Mid-Atlantic Diagnostics',
  'PA Power Analytics',
  'Keystone Testing Services',
  'Allegheny Lab Services',
  'Eastern Utility Testing',
  'Transformer Diagnostics Inc.',
  'Liberty Oil Lab',
];

// ─── Gas ranges by diagnosis (IEEE C57.104 guidelines) ──────────
interface GasRange {
  h2Min: number; h2Max: number;
  ch4Min: number; ch4Max: number;
  c2h6Min: number; c2h6Max: number;
  c2h4Min: number; c2h4Max: number;
  c2h2Min: number; c2h2Max: number;
  coMin: number; coMax: number;
  co2Min: number; co2Max: number;
}

const gasRanges: Record<DGADiagnosis, GasRange> = {
  Normal: {
    h2Min: 10, h2Max: 100,
    ch4Min: 5, ch4Max: 50,
    c2h6Min: 3, c2h6Max: 30,
    c2h4Min: 5, c2h4Max: 30,
    c2h2Min: 0, c2h2Max: 2,
    coMin: 100, coMax: 400,
    co2Min: 1000, co2Max: 5000,
  },
  Caution: {
    h2Min: 100, h2Max: 300,
    ch4Min: 50, ch4Max: 150,
    c2h6Min: 30, c2h6Max: 80,
    c2h4Min: 30, c2h4Max: 100,
    c2h2Min: 2, c2h2Max: 10,
    coMin: 400, coMax: 700,
    co2Min: 5000, co2Max: 8000,
  },
  Warning: {
    h2Min: 300, h2Max: 700,
    ch4Min: 150, ch4Max: 400,
    c2h6Min: 80, c2h6Max: 200,
    c2h4Min: 100, c2h4Max: 300,
    c2h2Min: 10, c2h2Max: 35,
    coMin: 700, coMax: 1000,
    co2Min: 8000, co2Max: 12000,
  },
  Critical: {
    h2Min: 700, h2Max: 1800,
    ch4Min: 400, ch4Max: 1000,
    c2h6Min: 200, c2h6Max: 500,
    c2h4Min: 300, c2h4Max: 700,
    c2h2Min: 35, c2h2Max: 150,
    coMin: 1000, coMax: 1800,
    co2Min: 12000, co2Max: 20000,
  },
};

// ─── Diagnosis distribution weights ─────────────────────────────
// ~55% Normal, ~25% Caution, ~12% Warning, ~8% Critical
const diagnosisWeights: number[] = [0.55, 0.25, 0.12, 0.08];
const diagnosisLabels: DGADiagnosis[] = ['Normal', 'Caution', 'Warning', 'Critical'];

// ─── Temperature and moisture ranges by diagnosis ───────────────
interface TempMoistureRange {
  tempMin: number; tempMax: number;
  moistMin: number; moistMax: number;
}

const tempMoistureRanges: Record<DGADiagnosis, TempMoistureRange> = {
  Normal:   { tempMin: 40, tempMax: 60, moistMin: 5, moistMax: 15 },
  Caution:  { tempMin: 50, tempMax: 70, moistMin: 15, moistMax: 25 },
  Warning:  { tempMin: 60, tempMax: 80, moistMin: 25, moistMax: 40 },
  Critical: { tempMin: 65, tempMax: 85, moistMin: 40, moistMax: 60 },
};

// ─── Fault type determination based on gas ratios ───────────────
function determineFaultType(
  rand: () => number,
  diagnosis: DGADiagnosis,
  h2: number,
  ch4: number,
  c2h4: number,
  c2h2: number,
  co: number,
  co2: number,
): DGAFaultType {
  if (diagnosis === 'Normal') {
    return 'Normal';
  }

  // Calculate gas ratios for fault identification
  const totalHydrocarbons = ch4 + c2h4 + c2h2;
  const c2h2Ratio = totalHydrocarbons > 0 ? c2h2 / totalHydrocarbons : 0;
  const c2h4Ratio = totalHydrocarbons > 0 ? c2h4 / totalHydrocarbons : 0;
  const h2Ratio = (h2 + totalHydrocarbons) > 0 ? h2 / (h2 + totalHydrocarbons) : 0;
  const coRatio = (co + co2) > 0 ? co / (co + co2) : 0;

  // Score each fault type based on gas signature
  const scores: { type: DGAFaultType; score: number }[] = [];

  // Arcing: high C2H2 relative to other hydrocarbons
  scores.push({ type: 'Arcing', score: c2h2Ratio * 3 + (c2h2 > 20 ? 2 : 0) });

  // Thermal Fault: high C2H4, low C2H2
  scores.push({ type: 'Thermal Fault', score: c2h4Ratio * 2.5 + (c2h4 > 80 ? 1.5 : 0) - c2h2Ratio * 2 });

  // Partial Discharge: high H2 relative to other gases
  scores.push({ type: 'Partial Discharge', score: h2Ratio * 3 + (h2 > 200 ? 1 : 0) });

  // Electrical Fault: elevated H2 with some hydrocarbons
  scores.push({ type: 'Electrical Fault', score: h2Ratio * 2 + c2h2Ratio * 1.5 });

  // Cellulose Degradation: high CO and CO2
  scores.push({ type: 'Cellulose Degradation', score: coRatio * 4 + (co > 600 ? 1.5 : 0) + (co2 > 8000 ? 1 : 0) });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Add some randomness: usually pick the top scorer, but sometimes second
  if (scores.length >= 2 && rand() < 0.15) {
    return scores[1].type;
  }

  return scores[0].type;
}

// ─── Trend determination based on diagnosis ─────────────────────
function determineTrend(rand: () => number, diagnosis: DGADiagnosis): DGATrend {
  const r = rand();
  switch (diagnosis) {
    case 'Normal':
      // Mostly Stable
      if (r < 0.75) return 'Stable';
      if (r < 0.90) return 'Improving';
      return 'Deteriorating';
    case 'Caution':
      // Mixed
      if (r < 0.35) return 'Stable';
      if (r < 0.55) return 'Improving';
      return 'Deteriorating';
    case 'Warning':
      // Mostly Deteriorating
      if (r < 0.15) return 'Stable';
      if (r < 0.30) return 'Improving';
      return 'Deteriorating';
    case 'Critical':
      // Mostly Deteriorating
      if (r < 0.10) return 'Stable';
      if (r < 0.15) return 'Improving';
      return 'Deteriorating';
  }
}

// ─── Main generator ─────────────────────────────────────────────
function generateDGATests(): DGATestResult[] {
  const rand = mulberry32(555777999);
  const results: DGATestResult[] = [];
  const usedIds = new Set<string>();

  const totalRecords = 1050;

  for (let i = 0; i < totalRecords; i++) {
    // Generate unique test ID
    let testId: string;
    do {
      testId = `DGA-${String(randInt(rand, 10000, 99999))}`;
    } while (usedIds.has(testId));
    usedIds.add(testId);

    // Asset type: ~60% Power Transformer, ~40% Dist Transformer
    const isPowerTransformer = rand() < 0.60;
    const assetType: 'Power Transformer' | 'Dist Transformer' = isPowerTransformer
      ? 'Power Transformer'
      : 'Dist Transformer';

    // Asset ID
    const assetPrefix = isPowerTransformer ? 'TX' : 'DT';
    const assetId = `${assetPrefix}-${padId(randInt(rand, 1000, 9999))}`;

    // Location
    const location = isPowerTransformer
      ? pickItem(rand, substationLocations)
      : pickItem(rand, feederLocations);

    // Lab
    const lab = pickItem(rand, labs);

    // Sample date: spanning 2023-2025
    const sampleYear = pickWeightedIndex(rand, [0.25, 0.35, 0.40]) + 2023;
    const sampleMonth = randInt(rand, 1, 12);
    const sampleDay = randInt(rand, 1, 28);
    const sampleDate = formatDate(sampleYear, sampleMonth, sampleDay);

    // Diagnosis (weighted)
    const diagnosisIndex = pickWeightedIndex(rand, diagnosisWeights);
    const diagnosis = diagnosisLabels[diagnosisIndex];

    // Gas values based on diagnosis
    const range = gasRanges[diagnosis];
    const hydrogen = randInt(rand, range.h2Min, range.h2Max);
    const methane = randInt(rand, range.ch4Min, range.ch4Max);
    const ethane = randInt(rand, range.c2h6Min, range.c2h6Max);
    const ethylene = randInt(rand, range.c2h4Min, range.c2h4Max);
    const acetylene = randInt(rand, range.c2h2Min, range.c2h2Max);
    const co = randInt(rand, range.coMin, range.coMax);
    const co2 = randInt(rand, range.co2Min, range.co2Max);

    // TDCG = sum of H2 + CH4 + C2H6 + C2H4 + C2H2 + CO
    const tdcg = hydrogen + methane + ethane + ethylene + acetylene + co;

    // Oil temperature based on diagnosis
    const tmRange = tempMoistureRanges[diagnosis];
    const oilTemperature = randFloat(rand, tmRange.tempMin, tmRange.tempMax);

    // Moisture content based on diagnosis
    const moistureContent = randFloat(rand, tmRange.moistMin, tmRange.moistMax);

    // Fault type based on gas ratios
    const faultType = determineFaultType(rand, diagnosis, hydrogen, methane, ethylene, acetylene, co, co2);

    // Trend based on diagnosis
    const trend = determineTrend(rand, diagnosis);

    results.push({
      id: testId,
      assetId,
      assetType,
      location,
      sampleDate,
      lab,
      hydrogen,
      methane,
      ethane,
      ethylene,
      acetylene,
      co,
      co2,
      tdcg,
      oilTemperature,
      moistureContent,
      diagnosis,
      faultType,
      trend,
    });
  }

  return results;
}

// ─── Export static array (generated once at module load) ─────────
export const mockDGATests: DGATestResult[] = generateDGATests();
