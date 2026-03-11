import type { FleetStat, ActivityAlert, ChartDataPoint } from '../types';

export const mockStats: FleetStat[] = [
  {
    title: 'Critical Assets',
    value: '1,847',
    change: 12.3,
    changeLabel: 'vs last quarter',
    icon: 'Zap',
    color: 'critical',
  },
  {
    title: 'Replacement Budget',
    value: '$284M',
    change: -8.1,
    changeLabel: 'vs projected',
    icon: 'DollarSign',
    color: 'warning',
  },
  {
    title: 'Risk Index',
    value: '73.4',
    change: 5.2,
    changeLabel: 'vs last assessment',
    icon: 'Target',
    color: 'info',
  },
  {
    title: 'Fleet Health',
    value: '68.2%',
    change: 2.4,
    changeLabel: 'vs last quarter',
    icon: 'TrendingUp',
    color: 'good',
  },
];

export const mockChartData: ChartDataPoint[] = [
  { name: 'Critical', count: 1847 },
  { name: 'High Risk', count: 4562 },
  { name: 'Medium Risk', count: 8234 },
  { name: 'Low Risk', count: 12486 },
  { name: 'Healthy', count: 20200 },
];

export const mockAlerts: ActivityAlert[] = [
  {
    id: 'ALT-001',
    assetId: 'TX-4401',
    type: 'dga_test',
    message: 'Dissolved gas analysis shows elevated acetylene levels (142 ppm). Immediate investigation recommended.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'ALT-002',
    assetId: 'CB-0819',
    type: 'thermal',
    message: 'Thermal imaging detected hotspot on Phase B bushing. Temperature delta 28\u00b0C above ambient.',
    severity: 'high',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'ALT-003',
    assetId: 'TX-2287',
    type: 'load_alert',
    message: 'Loading exceeded 95% of nameplate rating during peak demand period. Duration: 3.2 hours.',
    severity: 'high',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'ALT-004',
    assetId: 'DT-7720',
    type: 'inspection',
    message: 'Field inspection completed. Oil leak detected at drain valve. Scheduled for repair.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'ALT-005',
    assetId: 'TX-3350',
    type: 'failure',
    message: 'Cooling fan bank 2 failure detected. Redundant cooling maintaining temperature within limits.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'ALT-006',
    assetId: 'DS-0334',
    type: 'maintenance',
    message: 'Scheduled maintenance completed. Contact resistance within acceptable range.',
    severity: 'low',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'ALT-007',
    assetId: 'VR-0056',
    type: 'thermal',
    message: 'Tap changer temperature trending upward. Monitoring frequency increased to hourly.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    id: 'ALT-008',
    assetId: 'UC-0088',
    type: 'inspection',
    message: 'Partial discharge testing completed on cable termination. Levels within normal range.',
    severity: 'low',
    timestamp: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
];
