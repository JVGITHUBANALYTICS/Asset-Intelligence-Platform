import type { NavItem } from '../types';

export const APP_NAME = 'Asset Intelligence Platform';

// ─── Navigation Items ───────────────────────────────────────────
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Asset Registry', path: '/assets', icon: 'Database' },
  { label: 'Inspection Results', path: '/inspections', icon: 'ClipboardCheck' },
  { label: 'DGA Test Results', path: '/dga-tests', icon: 'FlaskConical' },
  { label: 'Maintenance History', path: '/maintenance', icon: 'Wrench' },
  { label: 'Health Models', path: '/health-models', icon: 'Brain' },
  { label: 'Work Queue', path: '/work-queue', icon: 'ClipboardList' },
  { label: 'Replacement Planning', path: '/replacement', icon: 'Calendar' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart3' },
  { label: 'Reports', path: '/reports', icon: 'FileText' },
  { label: 'Data Upload', path: '/data-upload', icon: 'Upload' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
];

// ─── Risk Level Colors ──────────────────────────────────────────
export const RISK_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string; darkBg: string; darkText: string; darkBorder: string }
> = {
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    darkBg: 'dark:bg-red-950',
    darkText: 'dark:text-red-300',
    darkBorder: 'dark:border-red-800',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    darkBg: 'dark:bg-orange-950',
    darkText: 'dark:text-orange-300',
    darkBorder: 'dark:border-orange-800',
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
    darkBg: 'dark:bg-yellow-950',
    darkText: 'dark:text-yellow-300',
    darkBorder: 'dark:border-yellow-800',
  },
  low: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
    darkBg: 'dark:bg-green-950',
    darkText: 'dark:text-green-300',
    darkBorder: 'dark:border-green-800',
  },
};

// ─── Risk Level Chart Colors ────────────────────────────────────
export const RISK_CHART_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

// ─── Voltage Class Colors ───────────────────────────────────────
export const VOLTAGE_CLASS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Transmission: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    darkBg: 'dark:bg-purple-900',
    darkText: 'dark:text-purple-200',
  },
  'Sub-Transmission': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    darkBg: 'dark:bg-blue-900',
    darkText: 'dark:text-blue-200',
  },
  Distribution: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    darkBg: 'dark:bg-teal-900',
    darkText: 'dark:text-teal-200',
  },
};

// ─── Asset Class Colors ─────────────────────────────────────────
export const ASSET_CLASS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  'Power Transformer': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    darkBg: 'dark:bg-indigo-900',
    darkText: 'dark:text-indigo-200',
  },
  'Circuit Breaker': {
    bg: 'bg-sky-100',
    text: 'text-sky-800',
    darkBg: 'dark:bg-sky-900',
    darkText: 'dark:text-sky-200',
  },
  'Dist Transformer': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    darkBg: 'dark:bg-emerald-900',
    darkText: 'dark:text-emerald-200',
  },
  'Disconnect Switch': {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    darkBg: 'dark:bg-amber-900',
    darkText: 'dark:text-amber-200',
  },
  'Capacitor Bank': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    darkBg: 'dark:bg-cyan-900',
    darkText: 'dark:text-cyan-200',
  },
  'Voltage Regulator': {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    darkBg: 'dark:bg-rose-900',
    darkText: 'dark:text-rose-200',
  },
  Recloser: {
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    darkBg: 'dark:bg-violet-900',
    darkText: 'dark:text-violet-200',
  },
  'Underground Cable': {
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    darkBg: 'dark:bg-stone-900',
    darkText: 'dark:text-stone-200',
  },
};

// ─── Health Score Thresholds ────────────────────────────────────
export const HEALTH_THRESHOLDS = {
  CRITICAL: 30,
  HIGH: 50,
  MEDIUM: 70,
  LOW: 85,
} as const;

// ─── Alert Type Labels ──────────────────────────────────────────
export const ALERT_TYPE_LABELS: Record<string, string> = {
  dga_test: 'DGA Test',
  thermal: 'Thermal Imaging',
  load_alert: 'Load Alert',
  inspection: 'Inspection',
  failure: 'Equipment Failure',
  maintenance: 'Maintenance',
};

// ─── Role Colors ────────────────────────────────────────────────
export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  asset_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  engineer: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};
