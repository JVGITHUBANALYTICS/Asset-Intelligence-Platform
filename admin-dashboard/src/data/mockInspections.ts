import type { AssetClass, InspectionResult, InspectionType, OverallCondition } from '../types';

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

function padId(n: number): string {
  return String(n).padStart(4, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Asset type configuration ───────────────────────────────────

interface AssetTypeEntry {
  type: AssetClass;
  prefix: string;
}

const assetTypes: AssetTypeEntry[] = [
  { type: 'Power Transformer', prefix: 'TX' },
  { type: 'Circuit Breaker', prefix: 'CB' },
  { type: 'Dist Transformer', prefix: 'DT' },
  { type: 'Disconnect Switch', prefix: 'DS' },
  { type: 'Capacitor Bank', prefix: 'CP' },
  { type: 'Voltage Regulator', prefix: 'VR' },
  { type: 'Recloser', prefix: 'RC' },
  { type: 'Underground Cable', prefix: 'UC' },
];

// ~20% Dist Transformer, ~15% Power Transformer, ~15% Circuit Breaker,
// ~12% Disconnect Switch, ~10% Capacitor Bank, ~10% Voltage Regulator,
// ~10% Recloser, ~8% Underground Cable
const assetTypeWeights: number[] = [0.15, 0.15, 0.20, 0.12, 0.10, 0.10, 0.10, 0.08];

// ─── Pennsylvania locations ─────────────────────────────────────

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

// Distribution asset types use feeders, others use substations
const distributionTypes: Set<AssetClass> = new Set([
  'Dist Transformer', 'Capacitor Bank', 'Voltage Regulator', 'Recloser',
]);

// ─── Inspectors ─────────────────────────────────────────────────

const inspectors: string[] = [
  'James McAllister', 'Robert Kowalski', 'Patricia Chen', 'Michael Brennan',
  'Linda Shultz', 'David Haggerty', 'Jennifer Novak', 'William Stroud',
  'Karen Lombardi', 'Thomas Gallagher', 'Susan Petrosky', 'Richard Callahan',
  'Barbara Yates', 'Joseph Martinelli', 'Nancy Wozniak', 'Christopher Dunn',
  'Angela Rossi', 'Daniel Fitzgerald', 'Maria Santiago', 'Mark Abramovich',
];

// ─── Inspection type weights ────────────────────────────────────
// Visual ~35%, Thermal Imaging ~20%, Oil Analysis ~15%,
// Ultrasonic ~12%, Partial Discharge ~10%, Vibration Analysis ~8%

const inspectionTypes: InspectionType[] = [
  'Visual', 'Thermal Imaging', 'Oil Analysis',
  'Ultrasonic', 'Partial Discharge', 'Vibration Analysis',
];
const inspectionTypeWeights: number[] = [0.35, 0.20, 0.15, 0.12, 0.10, 0.08];

// ─── Overall condition weights ──────────────────────────────────
// ~45% Good, ~30% Fair, ~15% Poor, ~10% Critical

const conditions: OverallCondition[] = ['Good', 'Fair', 'Poor', 'Critical'];
const conditionWeights: number[] = [0.45, 0.30, 0.15, 0.10];

// ─── Findings pools by inspection type ──────────────────────────

const findingsByType: Record<InspectionType, string[]> = {
  'Visual': [
    'No visible damage or deterioration',
    'Minor surface rust on housing',
    'Paint peeling on exterior casing',
    'Small oil stain observed at base',
    'Bird nesting material found on structure',
    'Minor vegetation encroachment near base',
    'Grounding conductor intact and secure',
    'Nameplate readable and legible',
    'Warning signs in place and visible',
    'Minor corrosion on mounting hardware',
    'Bushing porcelain in good condition',
    'No evidence of animal intrusion',
    'Control cabinet door seal intact',
    'Foundation showing minor cracks',
    'Lightning arrester appears intact',
    'Cooling fans operational',
    'Oil level within normal range on gauge',
    'Gasket showing signs of aging',
    'Pressure relief device appears functional',
    'Minor dent on tank wall',
    'Cable terminations appear secure',
    'Conduit and fittings in acceptable condition',
    'Fence and security perimeter intact',
    'Significant oil leak at main gasket',
    'Cracked bushing porcelain observed',
    'Heavy corrosion on tank and fittings',
    'Broken cooling fan blade detected',
    'Missing warning signage',
    'Extensive vegetation contact with conductors',
    'Visible arc damage on contacts',
    'Severe structural deformation noted',
    'Oil level critically low on gauge',
  ],
  'Thermal Imaging': [
    'No abnormal hot spots detected',
    'All connections within normal temperature range',
    'Uniform temperature distribution across windings',
    'Hot spot detected on bushing connection — 12°C above ambient',
    'Elevated temperature at tap changer contact — 18°C rise',
    'Minor heating on phase B cable termination — 8°C rise',
    'Overheating detected on load-side connection — 25°C rise',
    'Cooling system operating effectively',
    'Hot spot on neutral bushing — 15°C above normal',
    'Phase imbalance indicated by thermal gradient',
    'Contact resistance issue suspected on phase A — 20°C rise',
    'Hot joint detected at bolted connection — 30°C rise',
    'Internal hot spot suspected based on tank surface pattern',
    'Thermal anomaly at radiator inlet valve',
    'Elevated temperature on surge arrester connection — 10°C rise',
    'Hot spot at cable splice — 22°C above ambient',
    'Fan motor showing elevated temperature — 14°C rise',
    'Oil pump motor running warm — 11°C above baseline',
    'Bushing oil temperature elevated — 9°C above normal',
    'No issues found; recommend re-scan in 6 months',
    'Severe overheating at main bushing — 45°C rise',
    'Critical hot spot at phase C connection — 55°C above ambient',
    'Tank surface temperature anomaly indicating internal fault',
    'Multiple connection points showing elevated temperatures',
    'Thermal pattern consistent with circulating currents',
    'Control wiring junction overheating — 16°C rise',
    'Grading capacitor showing thermal anomaly',
    'Resistor bank elevated temperature — 13°C rise',
    'Crimp connection degradation indicated by heat signature',
    'Cable jacket heating suggesting insulation breakdown',
    'Switchgear bus bar hot spot — 28°C rise',
  ],
  'Oil Analysis': [
    'Oil condition satisfactory — all gases within normal limits',
    'Dissolved gas levels within IEEE C57.104 limits',
    'Moisture content within acceptable range',
    'Dielectric breakdown voltage meets standard',
    'Elevated hydrogen levels — 150 ppm (IEEE limit: 100 ppm)',
    'Minor increase in dissolved moisture — 22 ppm',
    'Acidity level slightly elevated — 0.15 mg KOH/g',
    'Power factor of oil slightly above normal',
    'Furan levels indicate moderate paper aging — 1.2 ppm',
    'Ethylene trending upward — monitor closely',
    'Acetylene detected at 3 ppm — investigate',
    'Interfacial tension below threshold — 28 dynes/cm',
    'Oil color darkening observed — schedule reclamation',
    'Particle count elevated — consider filtration',
    'PCB content below detectable limits',
    'Inhibitor content adequate — 0.2% DBPC',
    'Total dissolved combustible gas within limits',
    'Carbon monoxide slightly elevated — 450 ppm',
    'Oil oxidation stability acceptable',
    'Significant acetylene increase — 15 ppm detected',
    'Critically elevated hydrogen — 850 ppm',
    'High moisture content — 45 ppm (limit: 30 ppm)',
    'Dissolved gas analysis indicates thermal fault',
    'Oil breakdown voltage critically low — 22 kV',
    'Furan levels indicate severe paper degradation — 4.8 ppm',
    'Total combustible gas exceeding caution limits',
    'Significant ethylene increase suggesting hot spot',
    'Metal particles detected in oil sample',
    'Oil color extremely dark — immediate attention needed',
    'CO2/CO ratio suggests cellulose degradation',
    'Multiple gas indicators trending upward simultaneously',
  ],
  'Ultrasonic': [
    'No abnormal ultrasonic emissions detected',
    'Background noise levels within normal range',
    'Minor corona discharge detected at 35 kHz',
    'Partial discharge activity at bushing — low intensity',
    'Mechanical looseness indicated by vibration signature',
    'Arcing detected at 40 kHz — low amplitude',
    'Tracking activity suspected on insulator surface',
    'Gas bubble activity detected in tank',
    'Valve seat leak detected at pressure relief',
    'Bearing noise detected in cooling fan motor',
    'Contact chatter identified in tap changer',
    'Oil pump cavitation noise detected',
    'Internal sparking activity — intermittent at 38 kHz',
    'Loose hardware resonance detected',
    'Transformer hum within normal 120 Hz range',
    'Cooling system pump noise elevated',
    'Minor air leak detected at gasket interface',
    'No mechanical defects indicated',
    'Cable termination showing discharge activity at 42 kHz',
    'Compressed gas leak detected at SF6 compartment',
    'Severe arcing activity detected — 55 kHz high amplitude',
    'Significant partial discharge at multiple locations',
    'Internal mechanical failure sounds detected',
    'Heavy corona discharge across insulator string',
    'Loose core laminations indicated by ultrasonic signature',
    'Severe SF6 leak rate exceeding acceptable limits',
    'Tank resonance suggesting structural weakness',
    'High-intensity tracking on bushing surface',
    'Continuous sparking detected at tap changer — 45 kHz',
    'Multiple ultrasonic anomalies requiring immediate attention',
  ],
  'Partial Discharge': [
    'No partial discharge activity detected',
    'PD levels below threshold — less than 10 pC',
    'Minor PD activity at 25 pC — within acceptable limits',
    'Elevated PD at bushing termination — 120 pC',
    'PD activity detected in winding insulation — 85 pC',
    'Void discharge pattern identified — 150 pC peak',
    'Surface discharge on insulator — 65 pC',
    'Internal cavity discharge detected — 200 pC',
    'Corona discharge at sharp edge — 45 pC',
    'PD trending stable over last 3 measurements',
    'Floating component discharge pattern — 95 pC',
    'Cable joint showing PD activity — 110 pC',
    'PD inception voltage lower than expected',
    'Repetitive PD pattern at power frequency',
    'Contact noise differentiated from true PD',
    'PD in gas-insulated compartment — 180 pC',
    'Treeing pattern indicated in cable insulation',
    'PD activity correlates with humidity levels',
    'Multiple PD sources identified during test',
    'Delamination discharge detected in bushing — 70 pC',
    'Severe PD in main insulation — 500 pC',
    'Critical PD at cable termination — 800 pC',
    'Rapid PD escalation observed during test — from 50 to 350 pC',
    'Extensive void discharges in bushing core — 450 pC',
    'PD activity indicating imminent insulation failure',
    'Multiple high-intensity PD sites detected',
    'Cable insulation breakdown imminent — PD at 650 pC',
    'Bushing condenser layer PD — 380 pC',
    'Winding insulation PD trending sharply upward',
    'GIS compartment PD exceeding alarm threshold — 420 pC',
  ],
  'Vibration Analysis': [
    'Vibration levels within normal operating range',
    'No abnormal mechanical vibration detected',
    'Core vibration at normal 120 Hz fundamental',
    'Minor winding vibration increase — within limits',
    'Cooling fan vibration slightly elevated',
    'Pump bearing vibration trending upward',
    'Foundation vibration within design limits',
    'Tank wall vibration normal for load level',
    'Loose bolt resonance detected at 240 Hz',
    'Tap changer mechanism vibration normal',
    'Oil pump impeller imbalance detected',
    'Core clamping pressure may be decreasing — monitor',
    'Harmonic vibration at 360 Hz slightly elevated',
    'Structural resonance at specific load points',
    'Bearing defect frequency detected on fan motor',
    'Winding clamping force appears adequate',
    'Minor mounting bolt looseness indicated',
    'Vibration baseline established for future comparison',
    'Seasonal variation in vibration levels noted',
    'Load-dependent vibration within expected range',
    'Severe core vibration — possible clamping failure',
    'Winding displacement indicated by vibration shift',
    'Critical bearing failure imminent on oil pump',
    'Excessive foundation movement detected',
    'Tank structural integrity concern — resonance at 180 Hz',
    'Multiple loose components indicated by broad spectrum',
    'Core lamination separation suspected',
    'Oil pump shaft misalignment — high 1X vibration',
    'Significant change from baseline — investigate immediately',
    'Cooling system vibration causing structural fatigue',
  ],
};

// ─── Recommendations pools by inspection type ───────────────────

const recommendationsByType: Record<InspectionType, { good: string[]; fair: string[]; poor: string[]; critical: string[] }> = {
  'Visual': {
    good: [
      'Continue routine monitoring',
      'No action required — next scheduled inspection',
      'Maintain current inspection interval',
      'Document condition for baseline comparison',
    ],
    fair: [
      'Schedule minor cosmetic repairs',
      'Clean and treat surface corrosion',
      'Remove vegetation and clear area around equipment',
      'Replace aging gaskets at next maintenance window',
      'Repaint exterior surfaces to prevent further deterioration',
      'Tighten loose mounting hardware',
    ],
    poor: [
      'Schedule gasket replacement within 60 days',
      'Investigate and repair oil leak within 30 days',
      'Replace damaged bushing porcelain',
      'Perform detailed structural assessment',
      'Order replacement parts and schedule outage',
      'Increase inspection frequency to quarterly',
    ],
    critical: [
      'Immediate engineering assessment required',
      'Isolate equipment and plan emergency replacement',
      'Emergency repair crew dispatch recommended',
      'Remove from service for safety evaluation',
      'Initiate emergency capital replacement process',
    ],
  },
  'Thermal Imaging': {
    good: [
      'Continue routine thermal monitoring',
      'No action required — schedule next scan per normal interval',
      'Maintain current monitoring program',
      'All connections satisfactory',
    ],
    fair: [
      'Re-scan in 3 months to monitor trend',
      'Schedule connection retorquing at next outage',
      'Clean and re-make connection showing minor heating',
      'Monitor affected connection during peak load periods',
      'Add to enhanced thermal monitoring program',
    ],
    poor: [
      'Investigate and repair within 30 days',
      'Schedule outage to re-make overheating connection',
      'Replace degraded connector within 45 days',
      'De-rate equipment until repairs are completed',
      'Install continuous thermal monitoring on affected area',
    ],
    critical: [
      'Immediate load reduction required',
      'Emergency outage to address severe overheating',
      'Remove from service — risk of imminent failure',
      'Dispatch emergency repair crew immediately',
      'Implement emergency switching to bypass equipment',
    ],
  },
  'Oil Analysis': {
    good: [
      'Continue routine oil sampling schedule',
      'No action required — next sample per normal interval',
      'Oil condition satisfactory — maintain sampling frequency',
      'Update trending database with current results',
    ],
    fair: [
      'Increase sampling frequency to quarterly',
      'Schedule oil filtration at next opportunity',
      'Monitor trending gases and resample in 90 days',
      'Consider oil reclamation treatment',
      'Investigate source of elevated moisture',
    ],
    poor: [
      'Perform follow-up oil test within 30 days',
      'Schedule oil processing and degasification',
      'Investigate source of gas generation',
      'Consider internal inspection at next outage',
      'Install online DGA monitor',
      'Reduce load if possible until further assessment',
    ],
    critical: [
      'Immediate follow-up DGA test required',
      'Reduce load and prepare for emergency de-energization',
      'Schedule emergency internal inspection',
      'Initiate replacement planning immediately',
      'Install emergency online gas monitor',
    ],
  },
  'Ultrasonic': {
    good: [
      'Continue periodic ultrasonic monitoring',
      'No action required — normal acoustic signature',
      'Maintain current survey interval',
      'Baseline acoustic profile documented',
    ],
    fair: [
      'Re-survey in 3 months to verify stability',
      'Correlate findings with other test results',
      'Schedule mechanical inspection at next outage',
      'Monitor during varying load conditions',
      'Investigate minor leak source',
    ],
    poor: [
      'Schedule repair of detected leak within 30 days',
      'Perform detailed internal inspection',
      'Address mechanical looseness within 45 days',
      'Replace worn bearings at next maintenance window',
      'Increase ultrasonic survey frequency to monthly',
    ],
    critical: [
      'Immediate attention required — active arcing detected',
      'Emergency outage to address internal fault',
      'Remove from service for internal inspection',
      'Dispatch maintenance crew for SF6 leak repair',
      'Prepare contingency switching plan',
    ],
  },
  'Partial Discharge': {
    good: [
      'Continue periodic PD monitoring',
      'No action required — PD levels acceptable',
      'Maintain current PD survey schedule',
      'PD baseline established for future comparison',
    ],
    fair: [
      'Increase PD monitoring frequency to quarterly',
      'Correlate PD data with oil analysis results',
      'Monitor PD trend over next 6 months',
      'Investigate PD source during next outage',
      'Consider installing continuous PD monitor',
    ],
    poor: [
      'Schedule detailed PD mapping within 30 days',
      'Plan outage for source investigation and repair',
      'Install online PD monitoring system',
      'Assess remaining insulation life',
      'Begin replacement planning process',
    ],
    critical: [
      'Immediate de-energization recommended',
      'Emergency insulation assessment required',
      'Initiate emergency replacement procurement',
      'Install temporary monitoring and reduce load',
      'Risk of catastrophic insulation failure — act immediately',
    ],
  },
  'Vibration Analysis': {
    good: [
      'Continue periodic vibration monitoring',
      'No action required — vibration within normal limits',
      'Maintain current vibration survey schedule',
      'Update vibration baseline database',
    ],
    fair: [
      'Re-measure in 3 months to confirm trend',
      'Schedule bolt retorquing at next maintenance',
      'Monitor vibration during varying load conditions',
      'Investigate source of minor vibration increase',
      'Consider adding continuous vibration sensor',
    ],
    poor: [
      'Schedule mechanical repair within 30 days',
      'Replace worn bearings on cooling equipment',
      'Perform core clamping assessment at next outage',
      'De-rate if vibration worsens before repair',
      'Plan outage for structural evaluation',
    ],
    critical: [
      'Immediate load reduction required',
      'Emergency outage to address mechanical failure risk',
      'Remove cooling equipment from service and repair',
      'Structural integrity assessment required before re-energization',
      'Dispatch emergency maintenance team',
    ],
  },
};

// ─── Priority correlation with condition ────────────────────────

type Priority = 'Routine' | 'Priority' | 'Urgent' | 'Emergency';

function pickPriority(rand: () => number, condition: OverallCondition): Priority {
  const r = rand();
  switch (condition) {
    case 'Good':
      // Routine 90%, Priority 10%
      return r < 0.90 ? 'Routine' : 'Priority';
    case 'Fair':
      // Routine 50%, Priority 40%, Urgent 10%
      if (r < 0.50) return 'Routine';
      if (r < 0.90) return 'Priority';
      return 'Urgent';
    case 'Poor':
      // Priority 40%, Urgent 45%, Emergency 15%
      if (r < 0.40) return 'Priority';
      if (r < 0.85) return 'Urgent';
      return 'Emergency';
    case 'Critical':
      // Urgent 40%, Emergency 60%
      return r < 0.40 ? 'Urgent' : 'Emergency';
  }
}

// ─── Next inspection interval based on condition ────────────────

function getNextInspectionMonths(rand: () => number, condition: OverallCondition): number {
  switch (condition) {
    case 'Good':
      // 12–24 months out
      return randInt(rand, 12, 24);
    case 'Fair':
      // 6–12 months out
      return randInt(rand, 6, 12);
    case 'Poor':
      // 2–6 months out
      return randInt(rand, 2, 6);
    case 'Critical':
      // 1–3 months out
      return randInt(rand, 1, 3);
  }
}

// ─── Pick finding and recommendation ────────────────────────────

function pickFindingForCondition(
  rand: () => number,
  inspType: InspectionType,
  condition: OverallCondition,
): string {
  const pool = findingsByType[inspType];
  // Findings are roughly ordered: first ~60% are good/fair, last ~40% are poor/critical
  const total = pool.length;
  const goodFairEnd = Math.floor(total * 0.65);

  switch (condition) {
    case 'Good':
      // Pick from the first ~40% (most benign)
      return pool[Math.floor(rand() * Math.floor(total * 0.4))];
    case 'Fair':
      // Pick from middle range
      return pool[Math.floor(total * 0.2) + Math.floor(rand() * Math.floor(total * 0.4))];
    case 'Poor':
      // Pick from upper-middle to high range
      return pool[Math.floor(goodFairEnd * 0.7) + Math.floor(rand() * (total - Math.floor(goodFairEnd * 0.7)))];
    case 'Critical':
      // Pick from last ~35% (most severe)
      return pool[goodFairEnd + Math.floor(rand() * (total - goodFairEnd))];
  }
}

function pickRecommendation(
  rand: () => number,
  inspType: InspectionType,
  condition: OverallCondition,
): string {
  const recs = recommendationsByType[inspType];
  switch (condition) {
    case 'Good':
      return pickItem(rand, recs.good);
    case 'Fair':
      return pickItem(rand, recs.fair);
    case 'Poor':
      return pickItem(rand, recs.poor);
    case 'Critical':
      return pickItem(rand, recs.critical);
  }
}

// ─── Add months to a date ───────────────────────────────────────

function addMonths(year: number, month: number, day: number, months: number): { year: number; month: number; day: number } {
  let totalMonth = year * 12 + (month - 1) + months;
  const newYear = Math.floor(totalMonth / 12);
  const newMonth = (totalMonth % 12) + 1;
  return { year: newYear, month: newMonth, day: Math.min(day, 28) };
}

// ─── Generator ──────────────────────────────────────────────────

function generateInspections(): InspectionResult[] {
  const rand = mulberry32(987654321);
  const results: InspectionResult[] = [];

  for (let i = 0; i < 1050; i++) {
    // Pick asset type (weighted)
    const typeIndex = pickWeightedIndex(rand, assetTypeWeights);
    const assetEntry = assetTypes[typeIndex];

    // Generate asset ID
    const assetId = `${assetEntry.prefix}-${padId(randInt(rand, 100, 9999))}`;

    // Location based on asset type
    const location = distributionTypes.has(assetEntry.type)
      ? pickItem(rand, feederLocations)
      : pickItem(rand, substationLocations);

    // Inspector
    const inspector = pickItem(rand, inspectors);

    // Inspection date: span 2024-01-01 to 2025-12-31 (2 years)
    const inspYear = rand() < 0.5 ? 2024 : 2025;
    const inspMonth = randInt(rand, 1, 12);
    const inspDay = randInt(rand, 1, 28);
    const inspectionDate = formatDate(inspYear, inspMonth, inspDay);

    // Inspection type (weighted)
    const inspTypeIndex = pickWeightedIndex(rand, inspectionTypeWeights);
    const inspectionType = inspectionTypes[inspTypeIndex];

    // Overall condition (weighted)
    const condIndex = pickWeightedIndex(rand, conditionWeights);
    const overallCondition = conditions[condIndex];

    // Findings
    const findings = pickFindingForCondition(rand, inspectionType, overallCondition);

    // Recommendations
    const recommendations = pickRecommendation(rand, inspectionType, overallCondition);

    // Next inspection due: future date based on condition severity
    const monthsAhead = getNextInspectionMonths(rand, overallCondition);
    const nextDate = addMonths(inspYear, inspMonth, inspDay, monthsAhead);
    // Ensure the next inspection is in 2026-2027 range; clamp if needed
    const clampedYear = Math.max(nextDate.year, 2026);
    const finalYear = Math.min(clampedYear, 2027);
    const nextInspectionDue = formatDate(finalYear, nextDate.month, nextDate.day);

    // Priority correlated with condition
    const priority = pickPriority(rand, overallCondition);

    // Inspection ID
    const id = `INS-${String(i + 1).padStart(5, '0')}`;

    results.push({
      id,
      assetId,
      assetType: assetEntry.type,
      location,
      inspector,
      inspectionDate,
      inspectionType,
      overallCondition,
      findings,
      recommendations,
      nextInspectionDue,
      priority,
    });
  }

  return results;
}

// ─── Export static array (generated once at module load) ─────────
export const mockInspections: InspectionResult[] = generateInspections();
