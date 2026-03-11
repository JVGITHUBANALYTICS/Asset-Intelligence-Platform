/**
 * Seed script — inserts all mock data into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
 * (service key, NOT anon key — needed to bypass RLS for seeding).
 *
 * Or pass them inline:
 *   SUPABASE_URL=https://xwlemkbxfzmbmudqvqbf.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   npx tsx scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js';

// --- Import mock data (these files export arrays) --------
import { mockAssets } from '../src/data/mockAssets';
import { mockInspections } from '../src/data/mockInspections';
import { mockDGATests } from '../src/data/mockDGATests';
import { mockMaintenance } from '../src/data/mockMaintenance';
import { mockAlerts } from '../src/data/mockStats';

// --- Supabase client (service role key to bypass RLS) ----
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  console.error('  The service key is found in Supabase Dashboard → Settings → API → service_role key.');
  process.exit(1);
}

const supabase = createClient(url, key);

// --- Helper: batch insert in chunks of N ---
async function batchInsert(
  table: string,
  rows: Record<string, unknown>[],
  options?: { upsertOn?: string },
  chunkSize = 500,
) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = options?.upsertOn
      ? await supabase.from(table).upsert(chunk, { onConflict: options.upsertOn })
      : await supabase.from(table).insert(chunk);
    if (error) {
      console.error(`  ✗ ${table} chunk ${i}–${i + chunk.length}: ${error.message}`);
      throw error;
    }
    inserted += chunk.length;
  }
  console.log(`  ✓ ${table}: ${inserted} rows`);
}

// --- Pennsylvania lat/lng ranges for generating coordinates ---
function randomCoord(seed: number): { lat: number; lng: number } {
  // Pennsylvania bounding box approx: 39.7–42.3 lat, -80.5–-74.7 lng
  const latSeed = Math.sin(seed * 12.9898) * 43758.5453;
  const lngSeed = Math.sin(seed * 78.233) * 43758.5453;
  const lat = 39.7 + (latSeed - Math.floor(latSeed)) * 2.6;
  const lng = -80.5 + (lngSeed - Math.floor(lngSeed)) * 5.8;
  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lng: Math.round(lng * 1000000) / 1000000,
  };
}

// --- Asset ID mapping for FK resolution ---
// Mock child records (inspections, DGA, maintenance) generate random asset IDs
// that may not match the actual generated assets. We remap them to valid asset IDs.
const assetIdList = mockAssets.map((a) => a.id);
const assetByType = new Map<string, string[]>();
for (const a of mockAssets) {
  const list = assetByType.get(a.type) || [];
  list.push(a.id);
  assetByType.set(a.type, list);
}

// Deterministic remap: given a child record's original assetId and type, pick a valid asset
function remapAssetId(originalId: string, assetType: string, index: number): string {
  // Try to find assets matching the type first
  const candidates = assetByType.get(assetType) || assetIdList;
  return candidates[index % candidates.length];
}

// --- Transform mock data to DB format ---

function assetsToDb() {
  return mockAssets.map((a, i) => {
    const coords = randomCoord(i + 1);
    return {
      id: a.id,
      type: a.type,
      manufacturer: a.manufacturer,
      voltage: a.voltage,
      capacity: a.capacity,
      location: a.location,
      commission_date: a.commissionDate,
      age: a.age,
      health_score: a.healthScore,
      risk_score: a.riskScore,
      risk_level: a.riskLevel,
      estimated_cost: a.estimatedCost,
      last_assessment: a.lastAssessment,
      customers_affected: a.customersAffected ?? null,
      voltage_class: a.voltageClass,
      latitude: coords.lat,
      longitude: coords.lng,
    };
  });
}

function inspectionsToDb() {
  return mockInspections.map((r, i) => ({
    asset_id: remapAssetId(r.assetId, r.assetType, i),
    asset_type: r.assetType,
    location: r.location,
    inspector: r.inspector,
    inspection_date: r.inspectionDate,
    inspection_type: r.inspectionType,
    overall_condition: r.overallCondition,
    findings: r.findings,
    recommendations: r.recommendations,
    next_inspection_due: r.nextInspectionDue,
    priority: r.priority,
  }));
}

function dgaToDb() {
  return mockDGATests.map((r, i) => ({
    asset_id: remapAssetId(r.assetId, r.assetType, i),
    asset_type: r.assetType,
    location: r.location,
    sample_date: r.sampleDate,
    lab: r.lab,
    hydrogen: r.hydrogen,
    methane: r.methane,
    ethane: r.ethane,
    ethylene: r.ethylene,
    acetylene: r.acetylene,
    co: r.co,
    co2: r.co2,
    tdcg: r.tdcg,
    oil_temperature: r.oilTemperature,
    moisture_content: r.moistureContent,
    diagnosis: r.diagnosis,
    fault_type: r.faultType,
    trend: r.trend,
  }));
}

function maintenanceToDb() {
  return mockMaintenance.map((r, i) => ({
    asset_id: remapAssetId(r.assetId, r.assetType, i),
    asset_type: r.assetType,
    voltage_class: r.voltageClass,
    location: r.location,
    category: r.category,
    work_order_type: r.workOrderType,
    description: r.description,
    assigned_crew: r.assignedCrew,
    scheduled_date: r.scheduledDate,
    completed_date: r.completedDate,
    status: r.status,
    duration: r.duration,
    cost: r.cost,
    parts_used: r.partsUsed,
    outage_required: r.outageRequired,
    notes: r.notes,
  }));
}

function alertsToDb() {
  return mockAlerts.map((a) => ({
    id: a.id,
    asset_id: a.assetId,
    type: a.type,
    message: a.message,
    severity: a.severity,
    timestamp: a.timestamp,
    read: false,
  }));
}

function healthModelsToDb() {
  return [
    {
      id: 'HM-001', name: 'Transformer Health Index', category: 'Regressor',
      algorithm: 'Random Forest', accuracy: 94, last_run: '2 hours ago',
      assets_scored: 8429, icon: '🧠', status: 'active', version: '3.2.1',
      created_by: 'Dr. Sarah Chen', created_date: '2024-03-15',
      description: 'Multi-factor regression model that calculates a composite health index (0–100) for power transformers based on dissolved gas analysis, oil quality, load history, and age deterioration curves.',
      business_context: 'Primary driver for transformer replacement prioritization. Feeds the Capital Planning module and risk dashboards.',
      input_features: ['DGA Results', 'Oil Moisture Content', 'Power Factor', 'Load Factor', 'Age', 'Maintenance History', 'Ambient Temperature', 'Nameplate Rating'],
      output_metric: 'Health Index Score (0–100)',
      training_data_size: 24500, refresh_frequency: 'Every 6 hours',
      asset_types: ['Power Transformer'],
    },
    {
      id: 'HM-002', name: 'Circuit Breaker Failure Predictor', category: 'Classifier',
      algorithm: 'Gradient Boosting (XGBoost)', accuracy: 91, last_run: '5 hours ago',
      assets_scored: 12847, icon: '⚡', status: 'active', version: '2.1.0',
      created_by: 'James Martinez', created_date: '2024-06-20',
      description: 'Binary classifier predicting circuit breaker failure probability within 12 months.',
      business_context: 'Enables proactive replacement before catastrophic failure. Each avoided failure saves ~$180K.',
      input_features: ['Operations Count', 'Fault Current History', 'Contact Resistance', 'SF6 Pressure', 'Trip Coil Current', 'Age', 'Maintenance Records', 'Environment'],
      output_metric: 'Failure Probability (0–1) within 12 months',
      training_data_size: 18200, refresh_frequency: 'Every 12 hours',
      asset_types: ['Circuit Breaker'],
    },
    {
      id: 'HM-003', name: 'Age-Based Deterioration Curve', category: 'Physics-Based',
      algorithm: 'Weibull Distribution', accuracy: 87, last_run: '1 day ago',
      assets_scored: 47329, icon: '📏', status: 'active', version: '4.0.0',
      created_by: 'Dr. Robert Liu', created_date: '2023-11-10',
      description: 'Physics-informed survivability model using Weibull distribution parameters calibrated to each asset class.',
      business_context: 'Foundation model for long-term capital planning (5–20 year horizons).',
      input_features: ['Commission Date', 'Asset Class', 'Manufacturer', 'Voltage Class', 'Loading Percentile', 'Environmental Zone', 'Maintenance Quality'],
      output_metric: 'Remaining Useful Life (years)',
      training_data_size: 47329, refresh_frequency: 'Weekly',
      asset_types: ['Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Disconnect Switch', 'Capacitor Bank', 'Voltage Regulator', 'Recloser', 'Underground Cable'],
    },
    {
      id: 'HM-004', name: 'Thermal Overload Risk Model', category: 'Physics-Based',
      algorithm: 'Thermal Dynamic Simulation', accuracy: 89, last_run: '3 hours ago',
      assets_scored: 8429, icon: '🌡️', status: 'active', version: '2.0.3',
      created_by: 'Dr. Sarah Chen', created_date: '2024-01-22',
      description: 'Physics-based thermal model simulating winding hot-spot temperatures under various loading scenarios.',
      business_context: 'Critical for summer peak load planning. Prevented 3 thermal failures in 2025.',
      input_features: ['Ambient Temperature', 'Load Profile', 'Winding Configuration', 'Cooling Type', 'Oil Temperature', 'Nameplate Ratings', 'Thermal History'],
      output_metric: 'Hot-Spot Temperature & Thermal Aging Factor',
      training_data_size: 8429, refresh_frequency: 'Every 6 hours',
      asset_types: ['Power Transformer', 'Dist Transformer'],
    },
    {
      id: 'HM-005', name: 'Maintenance Impact Scoring', category: 'Rule-Based',
      algorithm: 'Weighted Decision Matrix', accuracy: 92, last_run: '4 hours ago',
      assets_scored: 47329, icon: '🔧', status: 'active', version: '5.1.0',
      created_by: 'Mike Thompson', created_date: '2023-08-05',
      description: 'Expert-system rule engine scoring expected impact of performing vs. deferring maintenance activities.',
      business_context: 'Drives Work Queue prioritization. Reduces maintenance backlog costs by ~18% annually.',
      input_features: ['Health Score', 'Criticality Rating', 'Last Maintenance Date', 'Maintenance Type Due', 'Failure Consequence', 'Customer Count', 'Compliance Status'],
      output_metric: 'Maintenance Priority Score (0–100)',
      training_data_size: 47329, refresh_frequency: 'Every 4 hours',
      asset_types: ['Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Disconnect Switch', 'Capacitor Bank', 'Voltage Regulator', 'Recloser', 'Underground Cable'],
    },
    {
      id: 'HM-006', name: 'Lightning Vulnerability Index', category: 'Classifier',
      algorithm: 'Neural Network (MLP)', accuracy: 88, last_run: '6 hours ago',
      assets_scored: 23847, icon: '🌩️', status: 'active', version: '1.4.2',
      created_by: 'Dr. Robert Liu', created_date: '2024-09-12',
      description: 'MLP classifier assessing lightning strike vulnerability based on geography, elevation, and protection status.',
      business_context: 'Reduced lightning-related equipment damage by 22% in first year.',
      input_features: ['GPS Coordinates', 'Elevation', 'Ground Flash Density', 'Grounding Resistance', 'Surge Arrester Status', 'Line Configuration', 'Historical Strikes', 'Vegetation Proximity'],
      output_metric: 'Vulnerability Tier (Low/Medium/High/Critical)',
      training_data_size: 23847, refresh_frequency: 'Daily',
      asset_types: ['Power Transformer', 'Dist Transformer', 'Recloser', 'Capacitor Bank'],
    },
    {
      id: 'HM-007', name: 'DGA Fault Gas Interpreter', category: 'Classifier',
      algorithm: 'Multi-class SVM + Duval Triangle', accuracy: 93, last_run: '1 hour ago',
      assets_scored: 8429, icon: '🔬', status: 'active', version: '3.0.1',
      created_by: 'Dr. Sarah Chen', created_date: '2024-04-18',
      description: 'Combines SVM classification with Duval Triangle and Rogers Ratio methods for DGA fault diagnosis.',
      business_context: 'Automates DGA interpretation, reducing diagnosis time from days to minutes.',
      input_features: ['H2', 'CH4', 'C2H2', 'C2H4', 'C2H6', 'CO', 'CO2', 'O2', 'N2', 'TDCG Trend'],
      output_metric: 'Fault Type Classification & Severity',
      training_data_size: 12800, refresh_frequency: 'On new DGA results',
      asset_types: ['Power Transformer'],
    },
    {
      id: 'HM-008', name: 'Asset Criticality Ranker', category: 'Rule-Based',
      algorithm: 'AHP (Analytic Hierarchy Process)', accuracy: 95, last_run: '12 hours ago',
      assets_scored: 47329, icon: '🎯', status: 'active', version: '2.3.0',
      created_by: 'Mike Thompson', created_date: '2023-05-20',
      description: 'AHP model ranking asset criticality using multi-criteria decision analysis.',
      business_context: 'Foundational model used as input by nearly all other models. Used in PUC regulatory filings.',
      input_features: ['Customers Served', 'Peak Load', 'Redundancy Factor', 'Critical Load Flag', 'Environmental Zone', 'Regulatory Tier', 'Revenue Impact'],
      output_metric: 'Criticality Score (0–100) & Tier (1–5)',
      training_data_size: 47329, refresh_frequency: 'Quarterly',
      asset_types: ['Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Disconnect Switch', 'Capacitor Bank', 'Voltage Regulator', 'Recloser', 'Underground Cable'],
    },
    {
      id: 'HM-009', name: 'Fleet Segmentation Model', category: 'Clustering',
      algorithm: 'K-Means + DBSCAN', accuracy: 86, last_run: '2 days ago',
      assets_scored: 47329, icon: '📊', status: 'active', version: '1.2.0',
      created_by: 'James Martinez', created_date: '2024-11-05',
      description: 'Unsupervised clustering segmenting the asset fleet into behavioral groups.',
      business_context: 'Identifies early failure clusters and life extension candidates for fleet strategy reviews.',
      input_features: ['Health Score Trajectory', 'Loading Pattern', 'Maintenance Frequency', 'Age', 'Asset Type', 'Voltage Class', 'Region', 'Failure History'],
      output_metric: 'Cluster Assignment & Health Profile',
      training_data_size: 47329, refresh_frequency: 'Monthly',
      asset_types: ['Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Underground Cable'],
    },
    {
      id: 'HM-010', name: 'Replacement Cost Estimator', category: 'Regressor',
      algorithm: 'Gradient Boosting (LightGBM)', accuracy: 90, last_run: '8 hours ago',
      assets_scored: 47329, icon: '💰', status: 'active', version: '2.0.0',
      created_by: 'James Martinez', created_date: '2024-07-30',
      description: 'Regression model estimating current replacement costs based on type, specs, and market conditions.',
      business_context: 'Provides cost estimates used throughout the platform. Achieves ±8% accuracy vs ±25% with static tables.',
      input_features: ['Asset Type', 'Voltage Rating', 'Capacity', 'Manufacturer', 'Installation Complexity', 'Location', 'Market Index', 'Lead Time'],
      output_metric: 'Estimated Replacement Cost ($)',
      training_data_size: 3200, refresh_frequency: 'Monthly',
      asset_types: ['Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Disconnect Switch', 'Capacitor Bank', 'Voltage Regulator', 'Recloser', 'Underground Cable'],
    },
    {
      id: 'HM-011', name: 'Cable Insulation Degradation', category: 'Ensemble',
      algorithm: 'Stacked (RF + XGBoost + Linear)', accuracy: 88, last_run: '1 day ago',
      assets_scored: 3842, icon: '🔌', status: 'training', version: '1.1.0-beta',
      created_by: 'Dr. Robert Liu', created_date: '2025-01-10',
      description: 'Ensemble stacking model predicting underground cable insulation degradation rate.',
      business_context: 'Expected to reduce unplanned cable failures by 30% once deployed fleet-wide.',
      input_features: ['Partial Discharge', 'Tan-Delta', 'Thermal Loading', 'Installation Method', 'Soil Conditions', 'Age', 'Joint Count', 'Splice History'],
      output_metric: 'Insulation Remaining Life (years)',
      training_data_size: 3842, refresh_frequency: 'Weekly',
      asset_types: ['Underground Cable'],
    },
    {
      id: 'HM-012', name: 'Outage Impact Predictor', category: 'Regressor',
      algorithm: 'Random Forest + GIS Integration', accuracy: 85, last_run: '3 days ago',
      assets_scored: 47329, icon: '🚨', status: 'draft', version: '0.9.0',
      created_by: 'Dr. Sarah Chen', created_date: '2025-02-01',
      description: 'Regression model predicting customer-minutes-interrupted and financial impact of asset failure.',
      business_context: 'Will enable consequence-of-failure analysis. Planned for Q2 2026 integration.',
      input_features: ['Network Topology', 'Customer Count', 'Critical Facilities', 'Switching Capability', 'Crew Availability', 'Restoration Times', 'Weather'],
      output_metric: 'Customer-Minutes-Interrupted & Financial Impact ($)',
      training_data_size: 15000, refresh_frequency: 'TBD',
      asset_types: ['Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Recloser'],
    },
  ];
}

// --- Main ---
async function main() {
  console.log('Seeding Supabase database...\n');

  // Order matters: assets first (FK target), then child tables
  const assets = assetsToDb();
  const inspections = inspectionsToDb();
  const dga = dgaToDb();
  const maintenance = maintenanceToDb();
  const models = healthModelsToDb();
  const alerts = alertsToDb();

  const total = assets.length + inspections.length + dga.length + maintenance.length + models.length + alerts.length;

  console.log('1/6 Assets...');
  await batchInsert('assets', assets, { upsertOn: 'id' });

  console.log('2/6 Inspections...');
  await batchInsert('inspections', inspections);

  console.log('3/6 DGA Tests...');
  await batchInsert('dga_tests', dga);

  console.log('4/6 Maintenance...');
  await batchInsert('maintenance', maintenance);

  console.log('5/6 Health Models...');
  await batchInsert('health_models', models, { upsertOn: 'id' });

  console.log('6/6 Activity Alerts...');
  await batchInsert('activity_alerts', alerts, { upsertOn: 'id' });

  console.log(`\n✓ Seeding complete! ${total} records inserted.`);
}

main().catch((err) => {
  console.error('\nSeeding failed:', err.message);
  process.exit(1);
});
