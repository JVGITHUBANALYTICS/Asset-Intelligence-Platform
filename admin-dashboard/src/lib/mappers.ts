import type {
  Asset,
  AssetClass,
  RiskLevel,
  VoltageClass,
  InspectionResult,
  InspectionType,
  OverallCondition,
  DGATestResult,
  DGADiagnosis,
  DGAFaultType,
  DGATrend,
  MaintenanceRecord,
  MaintenanceCategory,
  MaintenanceStatus,
} from '../types';

// ─── Assets ─────────────────────────────────────────────────────

export interface DbAsset {
  id: string;
  type: string;
  manufacturer: string;
  voltage: string;
  capacity: string;
  location: string;
  commission_date: string;
  age: number;
  health_score: number;
  risk_score: number;
  risk_level: string;
  estimated_cost: number;
  last_assessment: string;
  customers_affected: number | null;
  voltage_class: string;
  latitude: number | null;
  longitude: number | null;
}

export function mapDbAssetToAsset(row: DbAsset): Asset {
  return {
    id: row.id,
    type: row.type as AssetClass,
    manufacturer: row.manufacturer,
    voltage: row.voltage,
    capacity: row.capacity,
    location: row.location,
    commissionDate: row.commission_date,
    age: row.age,
    healthScore: row.health_score,
    riskScore: row.risk_score,
    riskLevel: row.risk_level as RiskLevel,
    estimatedCost: row.estimated_cost,
    lastAssessment: row.last_assessment,
    customersAffected: row.customers_affected ?? undefined,
    voltageClass: row.voltage_class as VoltageClass,
  };
}

export function mapAssetToDb(asset: Asset): Omit<DbAsset, 'latitude' | 'longitude'> {
  return {
    id: asset.id,
    type: asset.type,
    manufacturer: asset.manufacturer,
    voltage: asset.voltage,
    capacity: asset.capacity,
    location: asset.location,
    commission_date: asset.commissionDate,
    age: asset.age,
    health_score: asset.healthScore,
    risk_score: asset.riskScore,
    risk_level: asset.riskLevel,
    estimated_cost: asset.estimatedCost,
    last_assessment: asset.lastAssessment,
    customers_affected: asset.customersAffected ?? null,
    voltage_class: asset.voltageClass,
  };
}

// ─── Inspections ────────────────────────────────────────────────

export interface DbInspection {
  id: string;
  asset_id: string;
  asset_type: string;
  location: string;
  inspector: string;
  inspection_date: string;
  inspection_type: string;
  overall_condition: string;
  findings: string;
  recommendations: string;
  next_inspection_due: string;
  priority: string;
}

export function mapDbInspectionToInspection(row: DbInspection): InspectionResult {
  return {
    id: row.id,
    assetId: row.asset_id,
    assetType: row.asset_type as AssetClass,
    location: row.location,
    inspector: row.inspector,
    inspectionDate: row.inspection_date,
    inspectionType: row.inspection_type as InspectionType,
    overallCondition: row.overall_condition as OverallCondition,
    findings: row.findings,
    recommendations: row.recommendations,
    nextInspectionDue: row.next_inspection_due,
    priority: row.priority as InspectionResult['priority'],
  };
}

// ─── DGA Tests ──────────────────────────────────────────────────

export interface DbDGATest {
  id: string;
  asset_id: string;
  asset_type: string;
  location: string;
  sample_date: string;
  lab: string;
  hydrogen: number;
  methane: number;
  ethane: number;
  ethylene: number;
  acetylene: number;
  co: number;
  co2: number;
  tdcg: number;
  oil_temperature: number;
  moisture_content: number;
  diagnosis: string;
  fault_type: string;
  trend: string;
}

export function mapDbDGATestToDGATest(row: DbDGATest): DGATestResult {
  return {
    id: row.id,
    assetId: row.asset_id,
    assetType: row.asset_type as DGATestResult['assetType'],
    location: row.location,
    sampleDate: row.sample_date,
    lab: row.lab,
    hydrogen: row.hydrogen,
    methane: row.methane,
    ethane: row.ethane,
    ethylene: row.ethylene,
    acetylene: row.acetylene,
    co: row.co,
    co2: row.co2,
    tdcg: row.tdcg,
    oilTemperature: row.oil_temperature,
    moistureContent: row.moisture_content,
    diagnosis: row.diagnosis as DGADiagnosis,
    faultType: row.fault_type as DGAFaultType,
    trend: row.trend as DGATrend,
  };
}

// ─── Maintenance ────────────────────────────────────────────────

export interface DbMaintenance {
  id: string;
  asset_id: string;
  asset_type: string;
  voltage_class: string;
  location: string;
  category: string;
  work_order_type: string;
  description: string;
  assigned_crew: string;
  scheduled_date: string;
  completed_date: string | null;
  status: string;
  duration: number;
  cost: number;
  parts_used: string;
  outage_required: boolean;
  notes: string;
}

export function mapDbMaintenanceToMaintenance(row: DbMaintenance): MaintenanceRecord {
  return {
    id: row.id,
    assetId: row.asset_id,
    assetType: row.asset_type as AssetClass,
    voltageClass: row.voltage_class as VoltageClass,
    location: row.location,
    category: row.category as MaintenanceCategory,
    workOrderType: row.work_order_type,
    description: row.description,
    assignedCrew: row.assigned_crew,
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    status: row.status as MaintenanceStatus,
    duration: row.duration,
    cost: row.cost,
    partsUsed: row.parts_used,
    outageRequired: row.outage_required,
    notes: row.notes,
  };
}
