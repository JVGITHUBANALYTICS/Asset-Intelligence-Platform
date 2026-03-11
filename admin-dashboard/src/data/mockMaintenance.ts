import type { AssetClass, MaintenanceCategory, MaintenanceRecord, MaintenanceStatus, VoltageClass } from '../types';

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

function randFloat(rand: () => number, min: number, max: number): number {
  return Math.round((min + rand() * (max - min)) * 100) / 100;
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
  voltageClass: VoltageClass;
}

const assetTypes: AssetTypeEntry[] = [
  { type: 'Power Transformer', prefix: 'TX', voltageClass: 'Transmission' },
  { type: 'Circuit Breaker', prefix: 'CB', voltageClass: 'Sub-Transmission' },
  { type: 'Dist Transformer', prefix: 'DT', voltageClass: 'Distribution' },
  { type: 'Disconnect Switch', prefix: 'DS', voltageClass: 'Sub-Transmission' },
  { type: 'Capacitor Bank', prefix: 'CP', voltageClass: 'Distribution' },
  { type: 'Voltage Regulator', prefix: 'VR', voltageClass: 'Distribution' },
  { type: 'Recloser', prefix: 'RC', voltageClass: 'Distribution' },
  { type: 'Underground Cable', prefix: 'UC', voltageClass: 'Sub-Transmission' },
];

// ~15% Power Transformer, ~15% Circuit Breaker, ~20% Dist Transformer,
// ~12% Disconnect Switch, ~10% Capacitor Bank, ~10% Voltage Regulator,
// ~10% Recloser, ~8% Underground Cable
const assetTypeWeights: number[] = [0.15, 0.15, 0.20, 0.12, 0.10, 0.10, 0.10, 0.08];

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

// Distribution asset types use feeders, others use substations
const distributionTypes: Set<AssetClass> = new Set([
  'Dist Transformer', 'Capacitor Bank', 'Voltage Regulator', 'Recloser',
]);

// ─── Category distribution ──────────────────────────────────────
// ~45% Preventive, ~30% Repair - Planned, ~25% Repair - Unplanned
const categories: MaintenanceCategory[] = ['Preventive', 'Repair - Planned', 'Repair - Unplanned'];
const categoryWeights: number[] = [0.45, 0.30, 0.25];

// ─── Work order types by category and asset type ────────────────

const preventiveWorkOrders: Record<string, string[]> = {
  'Power Transformer': [
    'Oil Filtration', 'Bushing Inspection', 'Cooling System Service',
    'Tap Changer Maintenance', 'DGA Sampling', 'Insulation Resistance Test',
  ],
  'Circuit Breaker': [
    'Contact Inspection', 'Mechanism Lubrication', 'Trip Coil Test',
    'SF6 Gas Check', 'Timing Test',
  ],
  'Dist Transformer': [
    'Pole Mount Inspection', 'Oil Level Check', 'Lightning Arrester Test',
    'Connector Torque Check',
  ],
  'Underground Cable': [
    'Manhole Inspection', 'Splice Inspection', 'Partial Discharge Test',
    'Jacket Integrity Check',
  ],
  _default: [
    'Visual Inspection', 'Operational Test', 'Cleaning and Lubrication',
    'Contact Resistance Test',
  ],
};

const repairPlannedWorkOrders: string[] = [
  'Gasket Replacement', 'Bushing Replacement', 'Relay Upgrade',
  'Cooling Fan Replacement', 'Insulator Replacement', 'Control Wiring Repair',
  'Oil Reclamation', 'Contact Replacement',
];

const repairUnplannedWorkOrders: string[] = [
  'Emergency Oil Leak Repair', 'Failed Bushing Replacement',
  'Lightning Damage Repair', 'Overload Damage Repair',
  'Animal Contact Damage', 'Storm Damage Repair',
  'Vandalism Repair', 'Control Failure Repair', 'Mechanism Jam Repair',
];

function getWorkOrderType(rand: () => number, category: MaintenanceCategory, assetType: AssetClass): string {
  if (category === 'Preventive') {
    const pool = preventiveWorkOrders[assetType] ?? preventiveWorkOrders._default;
    return pickItem(rand, pool);
  }
  if (category === 'Repair - Planned') {
    return pickItem(rand, repairPlannedWorkOrders);
  }
  return pickItem(rand, repairUnplannedWorkOrders);
}

// ─── Descriptions by work order type ────────────────────────────

const descriptionsByWorkOrder: Record<string, string[]> = {
  // Preventive - Power Transformer
  'Oil Filtration': [
    'Perform scheduled oil filtration to remove moisture and particulates from insulating oil.',
    'Circulate transformer oil through filtration unit to restore dielectric strength.',
    'Routine oil processing to maintain insulation quality and extend transformer life.',
  ],
  'Bushing Inspection': [
    'Visual and electrical inspection of high-voltage bushings for signs of deterioration.',
    'Inspect bushing porcelain, oil levels, and connection integrity per maintenance schedule.',
    'Conduct bushing power factor and capacitance tests to assess insulation condition.',
  ],
  'Cooling System Service': [
    'Service cooling fans, radiators, and oil pumps per scheduled maintenance interval.',
    'Inspect and clean cooling system components; verify fan rotation and oil flow rates.',
    'Perform annual cooling system maintenance including fan motor lubrication and radiator cleaning.',
  ],
  'Tap Changer Maintenance': [
    'Inspect and service on-load tap changer mechanism and contacts.',
    'Perform scheduled tap changer maintenance including contact inspection and oil sampling.',
    'Service OLTC mechanism, replace oil in diverter tank, and verify operation counts.',
  ],
  'DGA Sampling': [
    'Collect oil sample for dissolved gas analysis per routine monitoring schedule.',
    'Perform scheduled DGA sampling and submit to laboratory for analysis.',
    'Routine dissolved gas sampling to monitor transformer internal condition.',
  ],
  'Insulation Resistance Test': [
    'Perform insulation resistance and polarization index testing on transformer windings.',
    'Conduct megger testing on all windings to assess insulation condition.',
    'Scheduled insulation resistance measurements to trend winding insulation health.',
  ],
  // Preventive - Circuit Breaker
  'Contact Inspection': [
    'Inspect main and arcing contacts for wear, pitting, and alignment.',
    'Perform scheduled contact wear measurement and assess remaining contact life.',
    'Visual and dimensional inspection of breaker contacts per maintenance cycle.',
  ],
  'Mechanism Lubrication': [
    'Lubricate operating mechanism linkages, bearings, and pivot points.',
    'Perform scheduled mechanism lubrication using manufacturer-specified grease.',
    'Service operating mechanism with fresh lubricant and inspect for wear.',
  ],
  'Trip Coil Test': [
    'Test trip and close coil operation, measure current draw and timing.',
    'Verify trip coil functionality and minimum trip voltage per relay settings.',
    'Perform scheduled trip coil test and verify protective relay coordination.',
  ],
  'SF6 Gas Check': [
    'Check SF6 gas pressure and density; verify no leakage on gas-insulated breaker.',
    'Perform scheduled SF6 gas quality test including moisture and purity analysis.',
    'Monitor SF6 gas levels and test for decomposition byproducts.',
  ],
  'Timing Test': [
    'Perform breaker timing test to verify open and close times meet specifications.',
    'Conduct first-trip and reclose timing tests on circuit breaker mechanism.',
    'Measure breaker contact travel, velocity, and timing for all three phases.',
  ],
  // Preventive - Dist Transformer
  'Pole Mount Inspection': [
    'Inspect pole-mounted transformer hardware, brackets, and arresters.',
    'Perform visual inspection of pole mount assembly and verify structural integrity.',
    'Check mounting hardware torque, crossarm condition, and ground connections.',
  ],
  'Oil Level Check': [
    'Verify oil level on distribution transformer and check for visible leaks.',
    'Routine oil level inspection and visual assessment of tank condition.',
    'Check transformer oil level gauge and inspect for signs of overheating.',
  ],
  'Lightning Arrester Test': [
    'Test lightning arresters for proper operation and leakage current levels.',
    'Perform scheduled arrester inspection and verify ground connections.',
    'Conduct leakage current test on surge arresters to assess condition.',
  ],
  'Connector Torque Check': [
    'Verify torque on all bolted electrical connections per manufacturer specs.',
    'Perform scheduled connector torque verification and thermal inspection.',
    'Re-torque primary and secondary connections to prevent resistive heating.',
  ],
  // Preventive - Underground Cable
  'Manhole Inspection': [
    'Inspect manhole structure, cable supports, and drainage system.',
    'Perform scheduled manhole entry and visual assessment of cable conditions.',
    'Check manhole for water intrusion, cable damage, and structural defects.',
  ],
  'Splice Inspection': [
    'Inspect cable splice joints for signs of overheating or insulation damage.',
    'Perform visual and thermal inspection of accessible cable splices.',
    'Conduct scheduled splice assessment including thermal imaging scan.',
  ],
  'Partial Discharge Test': [
    'Perform partial discharge testing on underground cable sections.',
    'Conduct online PD measurement to assess cable insulation condition.',
    'Scheduled partial discharge survey of underground cable system.',
  ],
  'Jacket Integrity Check': [
    'Test cable jacket integrity using DC hipot to detect moisture ingress.',
    'Perform jacket fault location test to identify sheath damage.',
    'Conduct scheduled cable jacket integrity verification.',
  ],
  // Preventive - Other asset types (default)
  'Visual Inspection': [
    'Perform routine visual inspection per scheduled maintenance plan.',
    'Conduct visual assessment of equipment condition and surroundings.',
    'Scheduled visual inspection to document equipment condition and identify issues.',
  ],
  'Operational Test': [
    'Verify proper operation of equipment through functional testing.',
    'Perform scheduled operational test to confirm correct switching behavior.',
    'Conduct functional test of all operating modes per maintenance procedure.',
  ],
  'Cleaning and Lubrication': [
    'Clean equipment surfaces and lubricate moving parts per maintenance schedule.',
    'Perform cleaning of insulators and lubrication of mechanical components.',
    'Scheduled cleaning of contacts and lubrication of operating mechanism.',
  ],
  'Contact Resistance Test': [
    'Measure contact resistance across main current path using micro-ohmmeter.',
    'Perform scheduled contact resistance test to verify connection integrity.',
    'Conduct DLRO test on all current-carrying connections and compare to baseline.',
  ],
  // Repair - Planned
  'Gasket Replacement': [
    'Replace deteriorated gasket on main tank cover to eliminate oil seepage.',
    'Scheduled gasket replacement on radiator header to prevent future leaks.',
    'Remove and replace aging flange gaskets identified during routine inspection.',
  ],
  'Bushing Replacement': [
    'Replace high-voltage bushing showing elevated power factor test results.',
    'Scheduled replacement of bushing approaching end of service life.',
    'Install new bushing to replace unit with declining dielectric test values.',
  ],
  'Relay Upgrade': [
    'Upgrade electromechanical relays to modern microprocessor-based protection.',
    'Replace aging protective relay with new digital relay per system upgrade plan.',
    'Install updated relay firmware and reconfigure protection settings.',
  ],
  'Cooling Fan Replacement': [
    'Replace failed cooling fan motor identified during thermal inspection.',
    'Scheduled replacement of aging cooling fan assembly with updated model.',
    'Install new cooling fan to restore full cooling capacity on transformer.',
  ],
  'Insulator Replacement': [
    'Replace cracked post insulator identified during visual inspection.',
    'Scheduled replacement of porcelain insulators with polymer units.',
    'Remove and replace damaged insulator string to restore insulation margin.',
  ],
  'Control Wiring Repair': [
    'Repair damaged control wiring found during routine panel inspection.',
    'Replace degraded control cables and verify proper relay operation.',
    'Scheduled re-wiring of control circuits to address aging conductors.',
  ],
  'Oil Reclamation': [
    'Perform full oil reclamation process to restore insulating oil properties.',
    'Scheduled oil reclamation treatment to address elevated acid number.',
    'Process transformer oil through reclamation unit to remove oxidation products.',
  ],
  'Contact Replacement': [
    'Replace worn main contacts on breaker per maintenance cycle requirements.',
    'Scheduled contact replacement based on accumulated fault interruptions.',
    'Install new arcing contacts and nozzles per manufacturer service bulletin.',
  ],
  // Repair - Unplanned
  'Emergency Oil Leak Repair': [
    'Emergency response to active oil leak on main tank weld seam.',
    'Urgent repair of oil leak at radiator valve discovered during patrol.',
    'Emergency gasket replacement to stop significant oil leak at bushing flange.',
  ],
  'Failed Bushing Replacement': [
    'Emergency replacement of bushing that failed during service.',
    'Urgent bushing swap after porcelain fracture caused flashover.',
    'Replace catastrophically failed bushing and inspect adjacent equipment.',
  ],
  'Lightning Damage Repair': [
    'Repair lightning strike damage to arrester and associated wiring.',
    'Replace surge arrester and repair control equipment damaged by lightning.',
    'Assess and repair damage from direct lightning strike on equipment.',
  ],
  'Overload Damage Repair': [
    'Repair overheated connections and replace damaged components from overload event.',
    'Address thermal damage to conductors and insulators caused by prolonged overload.',
    'Repair overload damage to winding insulation and cooling system.',
  ],
  'Animal Contact Damage': [
    'Repair damage from animal contact causing phase-to-ground fault.',
    'Replace faulted components and install animal guards after squirrel contact.',
    'Repair bushing damage and clean equipment after bird-caused flashover.',
  ],
  'Storm Damage Repair': [
    'Repair storm damage including broken insulators and displaced conductors.',
    'Emergency restoration of equipment damaged by severe weather event.',
    'Replace broken crossarm and re-string conductors after wind damage.',
  ],
  'Vandalism Repair': [
    'Repair damage from vandalism to equipment and security fencing.',
    'Replace stolen grounding conductors and repair damaged enclosures.',
    'Restore equipment to service after vandalism to control cabinet.',
  ],
  'Control Failure Repair': [
    'Diagnose and repair failed control circuit preventing remote operation.',
    'Replace failed relay card and restore SCADA communication.',
    'Emergency repair of control system failure causing incorrect operation.',
  ],
  'Mechanism Jam Repair': [
    'Clear mechanism jam and restore breaker to operable condition.',
    'Repair seized operating mechanism and replace damaged linkage.',
    'Diagnose and repair stuck tap changer mechanism to restore operation.',
  ],
};

function getDescription(rand: () => number, workOrderType: string): string {
  const pool = descriptionsByWorkOrder[workOrderType];
  if (pool && pool.length > 0) {
    return pickItem(rand, pool);
  }
  return `Perform ${workOrderType.toLowerCase()} as per maintenance schedule.`;
}

// ─── Assigned crews ─────────────────────────────────────────────

const assignedCrews: string[] = [
  'Line Crew Alpha', 'Substation Team 1', 'Transformer Services A',
  'Distribution Crew 3', 'Cable Team B', 'Emergency Response Unit',
  'Relay Services', 'Substation Team 2', 'Line Crew Bravo',
  'Distribution Crew 7', 'Transformer Services B', 'Cable Team D',
  'Line Crew Charlie', 'Substation Team 3', 'Distribution Crew 12',
];

// ─── Parts used by work order type ──────────────────────────────

const partsByWorkOrder: Record<string, string[]> = {
  // Preventive - Power Transformer
  'Oil Filtration': ['Oil filter cartridge', 'Desiccant breather element', 'Oil filter cartridge, desiccant breather', 'N/A'],
  'Bushing Inspection': ['N/A', 'Bushing gasket set', 'Silicone grease for seals'],
  'Cooling System Service': ['Fan motor bearings', 'Cooling fan belt', 'Oil pump seal kit', 'N/A'],
  'Tap Changer Maintenance': ['Tap changer contacts, diverter oil', 'OLTC gasket kit', 'Tap changer transition resistors'],
  'DGA Sampling': ['N/A', 'Oil sample syringes, shipping container'],
  'Insulation Resistance Test': ['N/A', 'Test lead replacement set'],
  // Preventive - Circuit Breaker
  'Contact Inspection': ['N/A', 'Contact lubricant', 'Arcing contact wear gauge'],
  'Mechanism Lubrication': ['Mobilgrease 28 lubricant', 'Mechanism grease kit', 'N/A'],
  'Trip Coil Test': ['N/A', 'Trip coil test leads'],
  'SF6 Gas Check': ['SF6 gas cylinder', 'SF6 moisture sensor', 'N/A', 'SF6 gas top-up cylinder'],
  'Timing Test': ['N/A', 'Timing test transducer set'],
  // Preventive - Dist Transformer
  'Pole Mount Inspection': ['N/A', 'Mounting bolts and hardware', 'Split bolt connectors'],
  'Oil Level Check': ['N/A', 'Transformer oil (1 gal)', 'Oil level gauge gasket'],
  'Lightning Arrester Test': ['N/A', 'Arrester ground lead'],
  'Connector Torque Check': ['N/A', 'Anti-oxidant compound', 'Replacement compression connectors'],
  // Preventive - Underground Cable
  'Manhole Inspection': ['N/A', 'Cable rack hardware', 'Sump pump replacement'],
  'Splice Inspection': ['N/A', 'Heat shrink repair sleeve'],
  'Partial Discharge Test': ['N/A', 'PD sensor coupling kit'],
  'Jacket Integrity Check': ['N/A', 'Jacket repair kit, mastic tape'],
  // Preventive - Other
  'Visual Inspection': ['N/A', 'N/A', 'Replacement warning signs'],
  'Operational Test': ['N/A', 'N/A', 'Control fuse replacement'],
  'Cleaning and Lubrication': ['Insulator cleaning solvent', 'Contact lubricant', 'N/A', 'Cleaning rags and degreaser'],
  'Contact Resistance Test': ['N/A', 'DLRO test leads'],
  // Repair - Planned
  'Gasket Replacement': ['Gasket kit, silicone sealant', 'Cork-neoprene gasket set', 'Nitrile rubber gasket, sealant'],
  'Bushing Replacement': ['Replacement bushing H1', 'Replacement bushing assembly', 'Bushing, gasket kit, mounting hardware'],
  'Relay Upgrade': ['SEL-751 digital relay', 'GE Multilin relay module', 'Microprocessor relay, test switch'],
  'Cooling Fan Replacement': ['Replacement fan motor assembly', 'Cooling fan, mounting brackets', 'Fan blade assembly, motor bearings'],
  'Insulator Replacement': ['Polymer post insulator', 'Porcelain insulator string', 'Composite insulator, mounting hardware'],
  'Control Wiring Repair': ['Control cable (250 ft)', 'Terminal blocks, wire markers', 'Control cable, crimp terminals, wire ties'],
  'Oil Reclamation': ['Fuller earth canisters', 'Reclamation filter media', 'Activated alumina, oil test kits'],
  'Contact Replacement': ['Main contact set, arcing tips', 'Breaker contact kit', 'Silver-tungsten contacts, nozzle set'],
  // Repair - Unplanned
  'Emergency Oil Leak Repair': ['Emergency gasket kit, silicone sealant', 'Epoxy repair compound, drain valve', 'Weld repair kit, replacement gasket'],
  'Failed Bushing Replacement': ['Emergency bushing assembly', 'Replacement bushing, gasket set, oil', 'Bushing, porcelain housing, lead assembly'],
  'Lightning Damage Repair': ['Surge arrester, fuse links', 'Arrester, control board replacement', 'Lightning arrester, lead wire, connectors'],
  'Overload Damage Repair': ['Replacement conductors, insulators', 'Crimp connectors, insulation tape', 'Conductor splice kit, heat shrink'],
  'Animal Contact Damage': ['Fuse links, animal guard kit', 'Bushing, animal deterrent spikes', 'Fuse cutout, arrester, animal guard'],
  'Storm Damage Repair': ['Crossarm, insulators, conductor', 'Pole hardware, guy wire, anchors', 'Replacement pole, crossarm assembly'],
  'Vandalism Repair': ['Security fencing, padlocks', 'Ground conductor, enclosure latch', 'Cabinet door, lock assembly, signage'],
  'Control Failure Repair': ['Relay card, communication module', 'Control transformer, fuses', 'PLC module, power supply, wiring'],
  'Mechanism Jam Repair': ['Linkage pin, spring assembly', 'Motor operator gears, lubricant', 'Mechanism spring, pivot bearings'],
};

function getPartsUsed(rand: () => number, workOrderType: string): string {
  const pool = partsByWorkOrder[workOrderType];
  if (pool && pool.length > 0) {
    return pickItem(rand, pool);
  }
  return 'Miscellaneous hardware and supplies';
}

// ─── Field notes pool ───────────────────────────────────────────

const fieldNotes: string[] = [
  'Completed without issues.',
  'Found additional corrosion on tank base — noted for follow-up.',
  'Crew delayed due to weather — work completed following day.',
  'Parts on backorder — rescheduled to next available window.',
  'Discovered minor oil seepage during work — documented for tracking.',
  'All tests passed within acceptable limits.',
  'Work completed ahead of schedule.',
  'Required additional crew support due to equipment weight.',
  'Access road in poor condition — maintenance request submitted.',
  'Encountered unexpected underground obstruction during excavation.',
  'Noise complaint from nearby residents — adjusted work hours.',
  'Equipment locked out and tagged out per safety procedure.',
  'Vegetation clearance performed prior to starting work.',
  'Coordination with transmission operations for switching sequence.',
  'Found evidence of previous animal intrusion — guards installed.',
  'Oil sample collected and sent to lab for expedited analysis.',
  'Thermal scan completed post-repair — no anomalies detected.',
  'Safety briefing conducted with crew prior to energized work.',
  'Customer notification completed — no complaints received.',
  'Temporary generation in place during outage window.',
  'Road closure permit obtained for crane operation.',
  'Environmental spill kit deployed as precaution during oil work.',
  'Confined space entry permit required for manhole access.',
  'PPE inspection verified for all crew members before work began.',
  'Previous repair showing signs of degradation — flagged for review.',
  'Manufacturer technical support consulted during installation.',
  'As-built drawings updated to reflect new configuration.',
  'Relay settings verified and documented after installation.',
  'Restoration switching completed without incident.',
  'Post-maintenance functional test confirmed proper operation.',
];

// ─── Status distribution ────────────────────────────────────────
// ~70% Completed, ~10% In Progress, ~15% Scheduled, ~5% Cancelled
const statuses: MaintenanceStatus[] = ['Completed', 'In Progress', 'Scheduled', 'Cancelled'];
const statusWeights: number[] = [0.70, 0.10, 0.15, 0.05];

// ─── Add days to a date ─────────────────────────────────────────

function addDays(year: number, month: number, day: number, days: number): { year: number; month: number; day: number } {
  // Simple date arithmetic using a base date approach
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let d = day + days;
  let m = month;
  let y = year;

  while (d > daysInMonth[m]) {
    d -= daysInMonth[m];
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return { year: y, month: m, day: d };
}

// ─── Generator ──────────────────────────────────────────────────

function generateMaintenance(): MaintenanceRecord[] {
  const rand = mulberry32(777888999);
  const records: MaintenanceRecord[] = [];
  const usedIds = new Set<string>();

  const totalRecords = 1050;

  for (let i = 0; i < totalRecords; i++) {
    // Generate unique maintenance ID
    let id: string;
    do {
      id = `MNT-${String(randInt(rand, 10000, 99999))}`;
    } while (usedIds.has(id));
    usedIds.add(id);

    // Pick asset type (weighted)
    const typeIndex = pickWeightedIndex(rand, assetTypeWeights);
    const assetEntry = assetTypes[typeIndex];

    // Generate asset ID
    const assetId = `${assetEntry.prefix}-${padId(randInt(rand, 1000, 9999))}`;

    // Voltage class from asset type mapping
    const voltageClass = assetEntry.voltageClass;

    // Location based on voltage class
    const location = distributionTypes.has(assetEntry.type)
      ? pickItem(rand, feederLocations)
      : pickItem(rand, substationLocations);

    // Maintenance category (weighted)
    const categoryIndex = pickWeightedIndex(rand, categoryWeights);
    const category = categories[categoryIndex];

    // Work order type based on category and asset type
    const workOrderType = getWorkOrderType(rand, category, assetEntry.type);

    // Description based on work order type
    const description = getDescription(rand, workOrderType);

    // Assigned crew
    const assignedCrew = pickItem(rand, assignedCrews);

    // Status (weighted)
    const statusIndex = pickWeightedIndex(rand, statusWeights);
    const status = statuses[statusIndex];

    // Scheduled date
    let scheduledYear: number;
    let scheduledMonth: number;
    let scheduledDay: number;

    if (status === 'Scheduled') {
      // Future dates in 2026
      scheduledYear = 2026;
      scheduledMonth = randInt(rand, 1, 12);
      scheduledDay = randInt(rand, 1, 28);
    } else {
      // Past dates spanning 2023-2025
      const yearRand = rand();
      if (yearRand < 0.25) {
        scheduledYear = 2023;
      } else if (yearRand < 0.60) {
        scheduledYear = 2024;
      } else {
        scheduledYear = 2025;
      }
      scheduledMonth = randInt(rand, 1, 12);
      scheduledDay = randInt(rand, 1, 28);
    }

    const scheduledDate = formatDate(scheduledYear, scheduledMonth, scheduledDay);

    // Completed date based on status
    let completedDate: string | null = null;
    if (status === 'Completed') {
      const daysAfter = randInt(rand, 0, 5);
      const completed = addDays(scheduledYear, scheduledMonth, scheduledDay, daysAfter);
      completedDate = formatDate(completed.year, completed.month, completed.day);
    }
    // In Progress, Scheduled, Cancelled → null

    // Duration based on category
    let duration: number;
    if (category === 'Preventive') {
      duration = randInt(rand, 2, 16);
    } else if (category === 'Repair - Planned') {
      duration = randInt(rand, 4, 40);
    } else {
      // Repair - Unplanned
      duration = randInt(rand, 1, 72);
    }

    // Cost based on category, with transmission multiplier
    let costMin: number;
    let costMax: number;
    if (category === 'Preventive') {
      costMin = 500;
      costMax = 15000;
    } else if (category === 'Repair - Planned') {
      costMin = 2000;
      costMax = 80000;
    } else {
      costMin = 5000;
      costMax = 150000;
    }

    // Higher costs for transmission assets
    const transmissionMultiplier = voltageClass === 'Transmission' ? 1.5
      : voltageClass === 'Sub-Transmission' ? 1.2
      : 1.0;

    const rawCost = randFloat(rand, costMin, costMax) * transmissionMultiplier;
    const cost = Math.round(rawCost / 100) * 100; // Round to nearest $100

    // Parts used
    const partsUsed = getPartsUsed(rand, workOrderType);

    // Outage required: ~60% for Repair, ~30% for Preventive
    const outageThreshold = category === 'Preventive' ? 0.30 : 0.60;
    const outageRequired = rand() < outageThreshold;

    // Notes
    const notes = pickItem(rand, fieldNotes);

    records.push({
      id,
      assetId,
      assetType: assetEntry.type,
      voltageClass,
      location,
      category,
      workOrderType,
      description,
      assignedCrew,
      scheduledDate,
      completedDate,
      status,
      duration,
      cost,
      partsUsed,
      outageRequired,
      notes,
    });
  }

  return records;
}

// ─── Export static array (generated once at module load) ─────────
export const mockMaintenance: MaintenanceRecord[] = generateMaintenance();
