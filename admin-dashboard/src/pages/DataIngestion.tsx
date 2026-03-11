import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Database,
  FlaskConical,
  ClipboardCheck,
  Wrench,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronLeft,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

// ─── Types ──────────────────────────────────────────────────────
type DataType = 'asset-registry' | 'inspection-results' | 'dga-test-results' | 'maintenance-history';
type UploadMode = 'full-replace' | 'incremental';
type FieldStatus = 'matched' | 'review' | 'unmapped';

interface FieldMapping {
  platformField: string;
  required: boolean;
  status: FieldStatus;
  sourceColumn: string;
  sampleData: string;
  fieldType: string;
}

interface UploadHistoryEntry {
  fileName: string;
  dataType: string;
  records: number | null;
  status: 'completed' | 'failed' | 'rolled-back';
  quality: number | null;
  date: string;
}

// ─── Constants ──────────────────────────────────────────────────
const DATA_TYPES = [
  {
    id: 'asset-registry' as DataType,
    label: 'Asset Registry',
    icon: Database,
    badge: 'Primary File',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    description:
      'Asset ID, type, manufacturer, voltage, capacity, location, commission date, voltage class',
  },
  {
    id: 'inspection-results' as DataType,
    label: 'Inspection Results',
    icon: ClipboardCheck,
    badge: 'Update File',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    description:
      'Asset ID, inspection date, inspector, condition rating, findings, photos attached, recommended action',
  },
  {
    id: 'dga-test-results' as DataType,
    label: 'DGA Test Results',
    icon: FlaskConical,
    badge: 'Incremental',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    description:
      'Asset ID, test date, H2, CH4, C2H2, C2H4, C2H6, CO, CO2, oil temperature',
  },
  {
    id: 'maintenance-history' as DataType,
    label: 'Maintenance History',
    icon: Wrench,
    badge: 'Incremental',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    description:
      'Asset ID, category (preventive/repair), work order type, crew, scheduled date, cost, duration, parts used',
  },
];

const REQUIRED_FIELDS: Record<DataType, string[]> = {
  'asset-registry': [
    'Asset ID',
    'Asset Type',
    'Manufacturer',
    'Voltage Rating',
    'Capacity',
    'Location',
    'Commission Date',
    'Voltage Class',
  ],
  'inspection-results': [
    'Asset ID',
    'Inspection Date',
    'Inspector',
    'Condition Rating',
    'Findings',
    'Photos Attached',
    'Recommended Action',
  ],
  'dga-test-results': [
    'Asset ID',
    'Test Date',
    'H2 (ppm)',
    'CH4 (ppm)',
    'C2H2 (ppm)',
    'C2H4 (ppm)',
    'C2H6 (ppm)',
    'CO (ppm)',
    'CO2 (ppm)',
    'Oil Temperature',
  ],
  'maintenance-history': [
    'Asset ID',
    'Category',
    'Work Order Type',
    'Description',
    'Assigned Crew',
    'Scheduled Date',
    'Status',
    'Duration (hrs)',
    'Cost ($)',
  ],
};

const TEMPLATES = [
  { name: 'Asset Registry Template', file: 'asset_registry_template.xlsx', icon: Database },
  { name: 'Inspection Template', file: 'inspection_template.xlsx', icon: ClipboardCheck },
  { name: 'DGA Test Template', file: 'dga_test_template.xlsx', icon: FlaskConical },
  { name: 'Maintenance Template', file: 'maintenance_template.xlsx', icon: Wrench },
];

const FIELD_MAPPINGS: Record<DataType, FieldMapping[]> = {
  'asset-registry': [
    { platformField: 'Asset ID', required: true, status: 'matched', sourceColumn: 'asset_id', sampleData: 'TRF-001-2024', fieldType: 'Text' },
    { platformField: 'Asset Type', required: true, status: 'matched', sourceColumn: 'type', sampleData: 'Power Transformer', fieldType: 'Enum' },
    { platformField: 'Manufacturer', required: true, status: 'matched', sourceColumn: 'manufacturer', sampleData: 'ABB', fieldType: 'Text' },
    { platformField: 'Voltage Rating', required: true, status: 'matched', sourceColumn: 'voltage_kv', sampleData: '138 kV', fieldType: 'Number' },
    { platformField: 'Capacity', required: true, status: 'review', sourceColumn: 'capacity_mva', sampleData: '100 MVA', fieldType: 'Number' },
    { platformField: 'Location', required: true, status: 'matched', sourceColumn: 'station_name', sampleData: 'Riverside Substation', fieldType: 'Text' },
    { platformField: 'Commission Date', required: true, status: 'matched', sourceColumn: 'install_date', sampleData: '2003-06-15', fieldType: 'Date' },
    { platformField: 'Voltage Class', required: true, status: 'matched', sourceColumn: 'voltage_class', sampleData: 'Transmission', fieldType: 'Enum' },
    { platformField: 'Serial Number', required: false, status: 'matched', sourceColumn: 'serial_no', sampleData: 'SN-29384756', fieldType: 'Text' },
    { platformField: 'GPS Latitude', required: false, status: 'unmapped', sourceColumn: '', sampleData: '', fieldType: 'Number' },
    { platformField: 'GPS Longitude', required: false, status: 'unmapped', sourceColumn: '', sampleData: '', fieldType: 'Number' },
  ],
  'inspection-results': [
    { platformField: 'Asset ID', required: true, status: 'matched', sourceColumn: 'asset_id', sampleData: 'TRF-001-2024', fieldType: 'Text' },
    { platformField: 'Inspection Date', required: true, status: 'matched', sourceColumn: 'insp_date', sampleData: '2026-01-28', fieldType: 'Date' },
    { platformField: 'Inspector', required: true, status: 'matched', sourceColumn: 'inspector_name', sampleData: 'J. Martinez', fieldType: 'Text' },
    { platformField: 'Condition Rating', required: true, status: 'review', sourceColumn: 'condition_score', sampleData: '3.5 / 5', fieldType: 'Number' },
    { platformField: 'Findings', required: true, status: 'matched', sourceColumn: 'notes', sampleData: 'Minor oil seepage at valve', fieldType: 'Text' },
    { platformField: 'Photos Attached', required: true, status: 'matched', sourceColumn: 'has_photos', sampleData: 'Yes', fieldType: 'Boolean' },
    { platformField: 'Recommended Action', required: true, status: 'review', sourceColumn: 'rec_action', sampleData: 'Schedule follow-up', fieldType: 'Text' },
  ],
  'dga-test-results': [
    { platformField: 'Asset ID', required: true, status: 'matched', sourceColumn: 'asset_id', sampleData: 'TRF-001-2024', fieldType: 'Text' },
    { platformField: 'Test Date', required: true, status: 'matched', sourceColumn: 'sample_date', sampleData: '2026-01-30', fieldType: 'Date' },
    { platformField: 'H2 (ppm)', required: true, status: 'matched', sourceColumn: 'h2_ppm', sampleData: '45', fieldType: 'Number' },
    { platformField: 'CH4 (ppm)', required: true, status: 'matched', sourceColumn: 'ch4_ppm', sampleData: '22', fieldType: 'Number' },
    { platformField: 'C2H2 (ppm)', required: true, status: 'matched', sourceColumn: 'c2h2_ppm', sampleData: '0.5', fieldType: 'Number' },
    { platformField: 'C2H4 (ppm)', required: true, status: 'matched', sourceColumn: 'c2h4_ppm', sampleData: '18', fieldType: 'Number' },
    { platformField: 'C2H6 (ppm)', required: true, status: 'matched', sourceColumn: 'c2h6_ppm', sampleData: '12', fieldType: 'Number' },
    { platformField: 'CO (ppm)', required: true, status: 'matched', sourceColumn: 'co_ppm', sampleData: '320', fieldType: 'Number' },
    { platformField: 'CO2 (ppm)', required: true, status: 'matched', sourceColumn: 'co2_ppm', sampleData: '2450', fieldType: 'Number' },
    { platformField: 'Oil Temperature', required: true, status: 'review', sourceColumn: 'oil_temp_c', sampleData: '68.2', fieldType: 'Number' },
  ],
  'maintenance-history': [
    { platformField: 'Asset ID', required: true, status: 'matched', sourceColumn: 'asset_id', sampleData: 'TX-4401', fieldType: 'Text' },
    { platformField: 'Category', required: true, status: 'matched', sourceColumn: 'maint_category', sampleData: 'Preventive', fieldType: 'Enum' },
    { platformField: 'Work Order Type', required: true, status: 'matched', sourceColumn: 'wo_type', sampleData: 'Oil Filtration', fieldType: 'Text' },
    { platformField: 'Description', required: true, status: 'matched', sourceColumn: 'description', sampleData: 'Routine oil filtration and purification', fieldType: 'Text' },
    { platformField: 'Assigned Crew', required: true, status: 'matched', sourceColumn: 'crew', sampleData: 'Transformer Services A', fieldType: 'Text' },
    { platformField: 'Scheduled Date', required: true, status: 'matched', sourceColumn: 'sched_date', sampleData: '2025-09-15', fieldType: 'Date' },
    { platformField: 'Completed Date', required: false, status: 'matched', sourceColumn: 'comp_date', sampleData: '2025-09-16', fieldType: 'Date' },
    { platformField: 'Status', required: true, status: 'matched', sourceColumn: 'status', sampleData: 'Completed', fieldType: 'Enum' },
    { platformField: 'Duration (hrs)', required: true, status: 'review', sourceColumn: 'duration_hrs', sampleData: '8', fieldType: 'Number' },
    { platformField: 'Cost ($)', required: true, status: 'matched', sourceColumn: 'cost_usd', sampleData: '4500', fieldType: 'Number' },
    { platformField: 'Parts Used', required: false, status: 'matched', sourceColumn: 'parts', sampleData: 'Oil filter cartridge, silicone sealant', fieldType: 'Text' },
    { platformField: 'Outage Required', required: false, status: 'review', sourceColumn: 'outage_req', sampleData: 'Yes', fieldType: 'Boolean' },
  ],
};

const UPLOAD_HISTORY: UploadHistoryEntry[] = [
  { fileName: 'asset_registry_20260203.csv', dataType: 'Asset Registry', records: 47329, status: 'completed', quality: 94.2, date: 'Feb 3, 2026' },
  { fileName: 'inspection_results_20260201.csv', dataType: 'Inspection Results', records: 2847, status: 'completed', quality: 97.8, date: 'Feb 1, 2026' },
  { fileName: 'dga_results_20260130.csv', dataType: 'DGA Test Results', records: 1234, status: 'completed', quality: 99.1, date: 'Jan 30, 2026' },
  { fileName: 'asset_registry_20260125.csv', dataType: 'Asset Registry', records: null, status: 'failed', quality: null, date: 'Jan 25, 2026' },
  { fileName: 'maintenance_history_20260128.csv', dataType: 'Maintenance History', records: 3156, status: 'completed', quality: 96.3, date: 'Jan 28, 2026' },
  { fileName: 'dga_results_20260120.csv', dataType: 'DGA Test Results', records: 892, status: 'rolled-back', quality: 72.1, date: 'Jan 20, 2026' },
];

const STEPPER_LABELS = ['Select Data Type', 'Upload File', 'Map Fields', 'Validate & Import'];

// ─── Helpers ────────────────────────────────────────────────────
function getSourceColumns(dataType: DataType): string[] {
  return FIELD_MAPPINGS[dataType].filter((f) => f.sourceColumn).map((f) => f.sourceColumn);
}

function getMappingStats(dataType: DataType) {
  const fields = FIELD_MAPPINGS[dataType];
  return {
    autoMatched: fields.filter((f) => f.status === 'matched').length,
    needsReview: fields.filter((f) => f.status === 'review').length,
    unmapped: fields.filter((f) => f.status === 'unmapped').length,
    total: fields.length,
  };
}

// ─── Component ──────────────────────────────────────────────────
export default function DataIngestion() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDataType, setSelectedDataType] = useState<DataType | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('incremental');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Navigation ───────────────────────────────────────────────
  const canGoNext = () => {
    if (currentStep === 1) return selectedDataType !== null;
    if (currentStep === 2) return uploadedFile !== null;
    if (currentStep === 3) return true;
    return false;
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < 4) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedDataType(null);
    setUploadedFile(null);
    setUploadMode('incremental');
  };

  // ─── File Handling (simulated) ────────────────────────────────
  const simulateFileUpload = useCallback(
    (file?: File) => {
      const nameMap: Record<DataType, string> = {
        'asset-registry': 'asset_registry_20260213.csv',
        'inspection-results': 'inspection_results_20260213.csv',
        'dga-test-results': 'dga_results_20260213.csv',
        'maintenance-history': 'maintenance_history_20260213.csv',
      };
      const sizeMap: Record<DataType, string> = {
        'asset-registry': '14.2 MB',
        'inspection-results': '3.7 MB',
        'dga-test-results': '1.1 MB',
        'maintenance-history': '5.8 MB',
      };

      if (file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setUploadedFile({ name: file.name, size: `${sizeMB} MB`, type: file.type || 'text/csv' });
      } else if (selectedDataType) {
        setUploadedFile({
          name: nameMap[selectedDataType],
          size: sizeMap[selectedDataType],
          type: 'text/csv',
        });
      }
    },
    [selectedDataType]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) simulateFileUpload(file);
    },
    [simulateFileUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) simulateFileUpload(file);
    },
    [simulateFileUpload]
  );

  // ─── Derived Data ─────────────────────────────────────────────
  const mappingStats = selectedDataType ? getMappingStats(selectedDataType) : null;
  const sourceColumns = selectedDataType ? getSourceColumns(selectedDataType) : [];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Data Upload &amp; Ingestion
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload asset inventory, inspection results, and test data — CSV or Excel format
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Last Upload
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Feb 3, 2026</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Asset Registry — 47,329 records
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Records Loaded
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">84,572</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Across 4 data types
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
              <CheckCircle2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Data Quality Score
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">94.2%</p>
              <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '94.2%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Stale Data Alert
              </p>
              <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">3 Days</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                DGA test file overdue
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stepper */}
      <Card>
        <nav aria-label="Upload progress">
          <ol className="flex items-center w-full">
            {STEPPER_LABELS.map((label, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;
              const isLast = index === STEPPER_LABELS.length - 1;

              return (
                <li
                  key={label}
                  className={`flex items-center ${isLast ? '' : 'flex-1'}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted) setCurrentStep(stepNum);
                    }}
                    className={`flex items-center gap-2 ${
                      isCompleted ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    disabled={!isCompleted}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                    </span>
                    <span
                      className={`text-sm font-medium whitespace-nowrap hidden sm:inline ${
                        isActive
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${
                        isCompleted
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </Card>

      {/* Step 1: Select Data Type */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DATA_TYPES.map((dt) => {
              const Icon = dt.icon;
              const isSelected = selectedDataType === dt.id;
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setSelectedDataType(dt.id)}
                  className={`text-left rounded-xl border-2 p-5 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 ring-1 ring-cyan-500'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-cyan-100 dark:bg-cyan-900/50'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isSelected
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dt.badgeColor}`}
                    >
                      {dt.badge}
                    </span>
                  </div>
                  <h3
                    className={`text-base font-semibold mb-1 ${
                      isSelected
                        ? 'text-cyan-700 dark:text-cyan-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {dt.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {dt.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Required Fields Reference */}
          {selectedDataType && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-cyan-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Required Fields for{' '}
                  {DATA_TYPES.find((d) => d.id === selectedDataType)?.label}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {REQUIRED_FIELDS[selectedDataType].map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Template Downloads */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Download Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TEMPLATES.map((tpl) => {
                const TplIcon = tpl.icon;
                return (
                  <button
                    key={tpl.file}
                    type="button"
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                  >
                    <TplIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {tpl.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tpl.file}</p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Upload File */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Upload Mode */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Upload Mode
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <label
                className={`flex items-center gap-3 flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  uploadMode === 'full-replace'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="uploadMode"
                  value="full-replace"
                  checked={uploadMode === 'full-replace'}
                  onChange={() => setUploadMode('full-replace')}
                  className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Full Replace</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Replace all existing records with the uploaded data
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  uploadMode === 'incremental'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="uploadMode"
                  value="incremental"
                  checked={uploadMode === 'incremental'}
                  onChange={() => setUploadMode('incremental')}
                  className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-300 dark:border-gray-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Incremental Update
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add new records and update existing ones by Asset ID
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Drop Zone */}
          <Card>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />

            {!uploadedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-cyan-500 dark:hover:border-cyan-500'
                }`}
              >
                <Upload
                  className={`h-10 w-10 mx-auto mb-4 ${
                    isDragOver ? 'text-cyan-500' : 'text-gray-400'
                  }`}
                />
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  Drag &amp; drop your file here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Accepted formats: CSV, XLSX, XLS, TSV
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      simulateFileUpload();
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Simulate File Upload
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-xl p-8 text-center"
              >
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  File Ready
                </p>
                <div className="mt-3 inline-flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadedFile.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Step 3: Map Fields */}
      {currentStep === 3 && selectedDataType && (
        <div className="space-y-6">
          {/* Auto-mapping Summary */}
          {mappingStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mappingStats.autoMatched}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Auto-Matched</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mappingStats.needsReview}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Needs Review</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mappingStats.unmapped}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unmapped</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Field Mapping Table */}
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Platform Field
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Source Column
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Sample Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {FIELD_MAPPINGS[selectedDataType].map((field) => (
                    <tr key={field.platformField} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {field.platformField}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              field.required
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {field.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            field.status === 'matched'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : field.status === 'review'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {field.status === 'matched' && <Check className="h-3 w-3" />}
                          {field.status === 'review' && <AlertTriangle className="h-3 w-3" />}
                          {field.status === 'unmapped' && <X className="h-3 w-3" />}
                          {field.status === 'matched'
                            ? 'Matched'
                            : field.status === 'review'
                            ? 'Review'
                            : 'Unmapped'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={field.sourceColumn}
                          onChange={() => {}}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-2 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                          {field.sourceColumn ? (
                            <option value={field.sourceColumn}>{field.sourceColumn}</option>
                          ) : (
                            <option value="">-- Select --</option>
                          )}
                          {sourceColumns
                            .filter((col) => col !== field.sourceColumn)
                            .map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {field.sampleData || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {field.fieldType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Step 4: Validate & Import */}
      {currentStep === 4 && selectedDataType && (
        <div className="space-y-6">
          {/* Data Quality Score */}
          <Card>
            <div className="text-center py-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Data Quality Score
              </p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${94.2 * 2.64} ${100 * 2.64}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="text-cyan-500"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className="absolute text-3xl font-bold text-gray-900 dark:text-white">
                  94.2%
                </span>
              </div>
            </div>
          </Card>

          {/* Validation Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">44,628</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Valid Records</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,847</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Warnings</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">612</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Errors</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <Info className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">242</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duplicates</p>
              </div>
            </Card>
          </div>

          {/* Warning & Error Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Warnings
              </h3>
              <ul className="space-y-2">
                {[
                  '1,203 records have commission dates older than 50 years',
                  '412 records missing GPS coordinates (optional field)',
                  '232 records have capacity values outside expected range',
                ].map((warning) => (
                  <li
                    key={warning}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                    {warning}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Errors
              </h3>
              <ul className="space-y-2">
                {[
                  '347 records missing required Asset ID field',
                  '156 records have invalid voltage class values',
                  '109 records have duplicate Asset IDs within file',
                ].map((error) => (
                  <li
                    key={error}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                    {error}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Import Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Import Summary
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Data Type</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {DATA_TYPES.find((d) => d.id === selectedDataType)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Upload Mode</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {uploadMode === 'full-replace' ? 'Full Replace' : 'Incremental Update'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Records</span>
                <span className="font-medium text-gray-900 dark:text-white">47,329</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Records to Import</span>
                <span className="font-medium text-green-600 dark:text-green-400">44,628</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Records Skipped</span>
                <span className="font-medium text-red-600 dark:text-red-400">2,701</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">File</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {uploadedFile?.name ?? '—'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" size="lg" onClick={handleReset}>
                <Database className="h-5 w-5" />
                Import Records
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="ghost" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentStep < 4 && (
            <Button variant="primary" onClick={handleNext} disabled={!canGoNext()}>
              Next Step
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {currentStep > 1 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Upload History */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Upload History</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Recent data uploads and their status
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Data Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {UPLOAD_HISTORY.map((entry, index) => (
                <tr key={`${entry.fileName}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {entry.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {entry.dataType}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {entry.records !== null ? entry.records.toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.status === 'completed'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : entry.status === 'failed'
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {entry.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {entry.status === 'failed' && <XCircle className="h-3 w-3" />}
                      {entry.status === 'rolled-back' && <RotateCcw className="h-3 w-3" />}
                      {entry.status === 'completed'
                        ? 'Completed'
                        : entry.status === 'failed'
                        ? 'Failed'
                        : 'Rolled Back'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {entry.quality !== null ? (
                      <span
                        className={`text-sm font-medium ${
                          entry.quality >= 90
                            ? 'text-green-600 dark:text-green-400'
                            : entry.quality >= 80
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {entry.quality}%
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {entry.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
