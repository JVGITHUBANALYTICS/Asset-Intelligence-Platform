// ─── Asset Types ────────────────────────────────────────────────
export type AssetClass =
  | 'Power Transformer'
  | 'Circuit Breaker'
  | 'Dist Transformer'
  | 'Disconnect Switch'
  | 'Capacitor Bank'
  | 'Voltage Regulator'
  | 'Recloser'
  | 'Underground Cable';

export type VoltageClass = 'Transmission' | 'Sub-Transmission' | 'Distribution';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Asset {
  id: string;
  type: AssetClass;
  manufacturer: string;
  voltage: string;
  capacity: string;
  location: string;
  commissionDate: string;
  age: number;
  healthScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  estimatedCost: number;
  lastAssessment: string;
  customersAffected?: number;
  voltageClass: VoltageClass;
}

export interface FleetStat {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  color: 'critical' | 'warning' | 'good' | 'info';
}

export interface HealthModel {
  id: string;
  name: string;
  type: string;
  algorithm: string;
  accuracy: number;
  lastRun: string;
  assetsScored: number;
  icon: string;
}

export interface ReplacementItem {
  asset: Asset;
  priorityRank: number;
  scheduledQuarter: string;
  consequenceOfFailure: 'High' | 'Medium' | 'Low';
  leadTime: string;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ActivityAlert {
  id: string;
  assetId: string;
  type: 'dga_test' | 'thermal' | 'load_alert' | 'inspection' | 'failure' | 'maintenance';
  message: string;
  severity: RiskLevel;
  timestamp: string;
}

export interface WorkQueueItem {
  asset: Asset;
  notes: string;
  addedAt: string;
  addedBy: string;
}

export interface CapitalPlan {
  id: string;
  name: string;
  type: '5year' | 'annual' | 'emergency';
  budget: number;
  description: string;
  assets: Asset[];
  createdAt: string;
  createdBy: string;
}

// ─── Inspection Results ─────────────────────────────────────────
export type InspectionType =
  | 'Visual'
  | 'Thermal Imaging'
  | 'Ultrasonic'
  | 'Oil Analysis'
  | 'Partial Discharge'
  | 'Vibration Analysis';

export type OverallCondition = 'Good' | 'Fair' | 'Poor' | 'Critical';

export interface InspectionResult {
  id: string;
  assetId: string;
  assetType: AssetClass;
  location: string;
  inspector: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  overallCondition: OverallCondition;
  findings: string;
  recommendations: string;
  nextInspectionDue: string;
  priority: 'Routine' | 'Priority' | 'Urgent' | 'Emergency';
}

// ─── DGA Test Results ───────────────────────────────────────────
export type DGADiagnosis = 'Normal' | 'Caution' | 'Warning' | 'Critical';
export type DGAFaultType = 'Normal' | 'Thermal Fault' | 'Electrical Fault' | 'Arcing' | 'Partial Discharge' | 'Cellulose Degradation';
export type DGATrend = 'Stable' | 'Improving' | 'Deteriorating';

export interface DGATestResult {
  id: string;
  assetId: string;
  assetType: 'Power Transformer' | 'Dist Transformer';
  location: string;
  sampleDate: string;
  lab: string;
  hydrogen: number;       // H2 ppm
  methane: number;        // CH4 ppm
  ethane: number;         // C2H6 ppm
  ethylene: number;       // C2H4 ppm
  acetylene: number;      // C2H2 ppm
  co: number;             // CO ppm
  co2: number;            // CO2 ppm
  tdcg: number;           // Total Dissolved Combustible Gas ppm
  oilTemperature: number; // °C
  moistureContent: number; // ppm
  diagnosis: DGADiagnosis;
  faultType: DGAFaultType;
  trend: DGATrend;
}

// ─── Maintenance History ────────────────────────────────────────
export type MaintenanceCategory = 'Preventive' | 'Repair - Planned' | 'Repair - Unplanned';
export type MaintenanceStatus = 'Completed' | 'In Progress' | 'Scheduled' | 'Cancelled';

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetType: AssetClass;
  voltageClass: VoltageClass;
  location: string;
  category: MaintenanceCategory;
  workOrderType: string;
  description: string;
  assignedCrew: string;
  scheduledDate: string;
  completedDate: string | null;
  status: MaintenanceStatus;
  duration: number;          // hours
  cost: number;              // USD
  partsUsed: string;
  outageRequired: boolean;
  notes: string;
}

// ─── Navigation ─────────────────────────────────────────────────
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

// ─── Auth Types ─────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'asset_manager' | 'engineer' | 'viewer';
  title: string;
  organization: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
