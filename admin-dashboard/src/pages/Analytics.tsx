import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis,
  LineChart, Line,
  BarChart, Bar, Legend,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import Card, { CardHeader } from '../components/UI/Card';
import { useTheme } from '../hooks/useTheme';
import { mockAssets } from '../data/mockAssets';
import { mockInspections } from '../data/mockInspections';
import { mockDGATests } from '../data/mockDGATests';
import { mockMaintenance } from '../data/mockMaintenance';

// Age vs Risk scatter data
const ageRiskData = [
  { age: 47, risk: 96, name: 'TX-4401' },
  { age: 43, risk: 92, name: 'TX-2287' },
  { age: 50, risk: 94, name: 'TX-3350' },
  { age: 40, risk: 88, name: 'CB-0819' },
  { age: 35, risk: 82, name: 'CB-1145' },
  { age: 27, risk: 76, name: 'DT-7720' },
  { age: 37, risk: 79, name: 'DS-0334' },
  { age: 20, risk: 55, name: 'VR-0056' },
  { age: 15, risk: 38, name: 'RC-0112' },
  { age: 30, risk: 71, name: 'UC-0088' },
  { age: 17, risk: 42, name: 'CP-0201' },
  { age: 11, risk: 22, name: 'TX-5580' },
  { age: 25, risk: 64, name: 'TX-6612' },
  { age: 33, risk: 73, name: 'CB-2201' },
  { age: 8, risk: 18, name: 'RC-0445' },
  { age: 42, risk: 85, name: 'DS-1102' },
  { age: 22, risk: 52, name: 'VR-0189' },
  { age: 38, risk: 78, name: 'DT-9901' },
];

// Failure rate prediction
const failureRateData = [
  { year: '2022', actual: 2.1, predicted: 2.0 },
  { year: '2023', actual: 2.4, predicted: 2.3 },
  { year: '2024', actual: 2.8, predicted: 2.7 },
  { year: '2025', actual: 3.1, predicted: 3.2 },
  { year: '2026', actual: null, predicted: 3.6 },
  { year: '2027', actual: null, predicted: 4.1 },
  { year: '2028', actual: null, predicted: 4.8 },
  { year: '2029', actual: null, predicted: 5.5 },
  { year: '2030', actual: null, predicted: 6.3 },
];

// Risk by voltage class
const voltageRiskData = [
  { class: 'Transmission (345kV)', critical: 12, high: 28, medium: 45, low: 62 },
  { class: 'Transmission (230kV)', critical: 8, high: 22, medium: 38, low: 54 },
  { class: 'Sub-Trans (138kV)', critical: 18, high: 42, medium: 67, low: 89 },
  { class: 'Sub-Trans (69kV)', critical: 24, high: 56, medium: 92, low: 134 },
  { class: 'Distribution (25kV)', critical: 142, high: 328, medium: 524, low: 892 },
  { class: 'Distribution (13.8kV)', critical: 286, high: 612, medium: 1024, low: 1840 },
];

// Age profile
const ageProfileData = [
  { range: '0-10', count: 4820, cumPct: 10 },
  { range: '11-20', count: 8240, cumPct: 27 },
  { range: '21-30', count: 12460, cumPct: 53 },
  { range: '31-40', count: 10890, cumPct: 75 },
  { range: '41-50', count: 7340, cumPct: 90 },
  { range: '51-60', count: 3580, cumPct: 97 },
  { range: '60+', count: 1000, cumPct: 100 },
];

// ─── Color palettes ─────────────────────────────────────────────
const ASSET_TYPE_COLORS: Record<string, string> = {
  'Power Transformer': '#6366f1',
  'Circuit Breaker': '#0ea5e9',
  'Dist Transformer': '#10b981',
  'Disconnect Switch': '#f59e0b',
  'Capacitor Bank': '#06b6d4',
  'Voltage Regulator': '#f43f5e',
  'Recloser': '#8b5cf6',
  'Underground Cable': '#78716c',
};

const CONDITION_PIE_COLORS: Record<string, string> = {
  Good: '#22c55e',
  Fair: '#eab308',
  Poor: '#f97316',
  Critical: '#ef4444',
};

const DGA_DIAGNOSIS_COLORS: Record<string, string> = {
  Normal: '#22c55e',
  Caution: '#eab308',
  Warning: '#f97316',
  Critical: '#ef4444',
};

const MAINT_CATEGORY_COLORS: Record<string, string> = {
  'Preventive': '#3b82f6',
  'Repair - Planned': '#f59e0b',
  'Repair - Unplanned': '#ef4444',
};

export default function Analytics() {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
    border: `1px solid ${gridColor}`,
    borderRadius: '8px',
    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
    fontSize: '12px',
  };

  // ─── Asset Registry: Health Score by Asset Type (radar) ───────
  const assetHealthRadar = useMemo(() => {
    const groups: Record<string, { total: number; count: number }> = {};
    for (const a of mockAssets) {
      if (!groups[a.type]) groups[a.type] = { total: 0, count: 0 };
      groups[a.type].total += a.healthScore;
      groups[a.type].count += 1;
    }
    return Object.entries(groups).map(([type, { total, count }]) => ({
      type: type.replace('Transformer', 'Xfmr').replace('Disconnect ', 'Disc. ').replace('Underground ', 'UG ').replace('Capacitor ', 'Cap. ').replace('Voltage ', 'Volt. '),
      avgHealth: Math.round(total / count),
      fullName: type,
    }));
  }, []);

  // ─── Inspection Results: Condition distribution (pie) ─────────
  const inspectionConditionData = useMemo(() => {
    const counts: Record<string, number> = { Good: 0, Fair: 0, Poor: 0, Critical: 0 };
    for (const insp of mockInspections) {
      counts[insp.overallCondition] = (counts[insp.overallCondition] || 0) + 1;
    }
    return Object.entries(counts).map(([condition, count]) => ({
      name: condition,
      value: count,
      pct: Math.round((count / mockInspections.length) * 1000) / 10,
    }));
  }, []);

  // ─── DGA Test Results: TDCG distribution by diagnosis (bar) ──
  const dgaDiagnosisData = useMemo(() => {
    const groups: Record<string, { count: number; totalTDCG: number; faults: Record<string, number> }> = {};
    const diagnosisOrder = ['Normal', 'Caution', 'Warning', 'Critical'];
    for (const d of diagnosisOrder) groups[d] = { count: 0, totalTDCG: 0, faults: {} };
    for (const t of mockDGATests) {
      const g = groups[t.diagnosis];
      g.count += 1;
      g.totalTDCG += t.tdcg;
      g.faults[t.faultType] = (g.faults[t.faultType] || 0) + 1;
    }
    return diagnosisOrder.map((d) => ({
      diagnosis: d,
      count: groups[d].count,
      avgTDCG: Math.round(groups[d].totalTDCG / (groups[d].count || 1)),
      topFault: Object.entries(groups[d].faults).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
    }));
  }, []);

  // ─── Maintenance: Cost by Asset Type & Category (stacked bar) ─
  const maintenanceCostData = useMemo(() => {
    const assetTypes = [...new Set(mockMaintenance.map((m) => m.assetType))].sort();
    const data = assetTypes.map((type) => {
      const records = mockMaintenance.filter((m) => m.assetType === type);
      const preventive = records.filter((r) => r.category === 'Preventive').reduce((s, r) => s + r.cost, 0);
      const planned = records.filter((r) => r.category === 'Repair - Planned').reduce((s, r) => s + r.cost, 0);
      const unplanned = records.filter((r) => r.category === 'Repair - Unplanned').reduce((s, r) => s + r.cost, 0);
      return {
        type: type.replace('Transformer', 'Xfmr').replace('Disconnect ', 'Disc. ').replace('Underground ', 'UG ').replace('Capacitor ', 'Cap. ').replace('Voltage ', 'Volt. '),
        Preventive: Math.round(preventive / 1000),
        'Repair-Planned': Math.round(planned / 1000),
        'Repair-Unplanned': Math.round(unplanned / 1000),
        fullName: type,
      };
    });
    return data;
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-blue-500" />
          Analytics
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Advanced fleet analytics and statistical insights
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Scatter: Age vs Risk */}
        <Card>
          <CardHeader
            title="Age vs Risk Score"
            subtitle="Correlation between asset age and computed risk"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="age"
                  name="Age (years)"
                  tick={{ fill: textColor, fontSize: 11 }}
                  label={{ value: 'Age (years)', position: 'insideBottom', offset: -5, fill: textColor, fontSize: 11 }}
                />
                <YAxis
                  dataKey="risk"
                  name="Risk Score"
                  tick={{ fill: textColor, fontSize: 11 }}
                  label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 11 }}
                />
                <ZAxis range={[40, 200]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [value, name === 'age' ? 'Age' : 'Risk Score']}
                  labelFormatter={(_, payload) => {
                    if (payload && payload.length > 0) {
                      const item = payload[0]?.payload as { name?: string };
                      return item?.name || '';
                    }
                    return '';
                  }}
                />
                <Scatter data={ageRiskData} fill="#06b6d4" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Line: Failure Rate Prediction */}
        <Card>
          <CardHeader
            title="Failure Rate Prediction"
            subtitle="Historical and predicted annual failure rates (%)"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={failureRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="year" tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => value !== null && value !== undefined ? [`${value}%`] : ['--']} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  name="Actual"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#f59e0b' }}
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar: Risk by Voltage Class */}
        <Card>
          <CardHeader
            title="Risk Distribution by Voltage Class"
            subtitle="Asset count by risk level and voltage class"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={voltageRiskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" tick={{ fill: textColor, fontSize: 10 }} />
                <YAxis dataKey="class" type="category" tick={{ fill: textColor, fontSize: 10 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
                <Bar dataKey="high" name="High" fill="#f97316" stackId="a" />
                <Bar dataKey="medium" name="Medium" fill="#eab308" stackId="a" />
                <Bar dataKey="low" name="Low" fill="#22c55e" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Area: Age Profile */}
        <Card>
          <CardHeader
            title="Fleet Age Profile"
            subtitle="Asset count distribution by age range"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ageProfileData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="range" tick={{ fill: textColor, fontSize: 11 }} label={{ value: 'Age Range (years)', position: 'insideBottom', offset: -5, fill: textColor, fontSize: 11 }} />
                <YAxis tick={{ fill: textColor, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Asset Count"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Section Separator */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Data-Driven Analytics
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Computed from {mockAssets.length.toLocaleString()} assets, {mockInspections.length.toLocaleString()} inspections, {mockDGATests.length.toLocaleString()} DGA tests, and {mockMaintenance.length.toLocaleString()} maintenance records
        </p>
      </div>

      {/* Data-Driven Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Radar: Asset Health by Type */}
        <Card>
          <CardHeader
            title="Avg Health Score by Asset Type"
            subtitle="Radar view of fleet health across asset classes"
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={assetHealthRadar} outerRadius="70%">
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="type" tick={{ fill: textColor, fontSize: 10 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: textColor, fontSize: 10 }}
                  tickCount={5}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value}`, 'Avg Health']}
                  labelFormatter={(label) => {
                    const item = assetHealthRadar.find((d) => d.type === label);
                    return item?.fullName || label;
                  }}
                />
                <Radar
                  name="Avg Health"
                  dataKey="avgHealth"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie: Inspection Condition Distribution */}
        <Card>
          <CardHeader
            title="Inspection Condition Distribution"
            subtitle="Overall condition results across all inspections"
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inspectionConditionData}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="70%"
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, pct }) => `${name} ${pct}%`}
                >
                  {inspectionConditionData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CONDITION_PIE_COLORS[entry.name] || '#94a3b8'}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} inspections`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar: DGA Diagnosis & Avg TDCG */}
        <Card>
          <CardHeader
            title="DGA Diagnosis Distribution"
            subtitle="Test count and average TDCG by diagnosis level"
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dgaDiagnosisData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="diagnosis" tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis
                  yAxisId="count"
                  tick={{ fill: textColor, fontSize: 11 }}
                  label={{ value: 'Test Count', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 11 }}
                />
                <YAxis
                  yAxisId="tdcg"
                  orientation="right"
                  tick={{ fill: textColor, fontSize: 11 }}
                  label={{ value: 'Avg TDCG (ppm)', angle: 90, position: 'insideRight', fill: textColor, fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'Avg TDCG') return [`${value.toLocaleString()} ppm`, name];
                    return [value.toLocaleString(), name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="count" dataKey="count" name="Test Count" radius={[4, 4, 0, 0]}>
                  {dgaDiagnosisData.map((entry) => (
                    <Cell
                      key={entry.diagnosis}
                      fill={DGA_DIAGNOSIS_COLORS[entry.diagnosis] || '#94a3b8'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="tdcg"
                  type="monotone"
                  dataKey="avgTDCG"
                  name="Avg TDCG"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 5, fill: '#f59e0b' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stacked Bar: Maintenance Cost by Asset Type */}
        <Card>
          <CardHeader
            title="Maintenance Cost by Asset Type"
            subtitle="Spend breakdown: Preventive vs Planned vs Unplanned ($K)"
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="type" tick={{ fill: textColor, fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: textColor, fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [`$${value.toLocaleString()}K`, name]}
                  labelFormatter={(label) => {
                    const item = maintenanceCostData.find((d) => d.type === label);
                    return item?.fullName || label;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Preventive" name="Preventive" fill={MAINT_CATEGORY_COLORS['Preventive']} stackId="cost" />
                <Bar dataKey="Repair-Planned" name="Repair - Planned" fill={MAINT_CATEGORY_COLORS['Repair - Planned']} stackId="cost" />
                <Bar dataKey="Repair-Unplanned" name="Repair - Unplanned" fill={MAINT_CATEGORY_COLORS['Repair - Unplanned']} stackId="cost" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
