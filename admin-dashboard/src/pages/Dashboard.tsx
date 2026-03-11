import { useState, useEffect, useMemo } from 'react';
import { getAssets } from '../services/assetService';
import ActivityFeed from '../components/Dashboard/ActivityFeed';
import Card, { CardHeader } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useTheme } from '../hooks/useTheme';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import '../utils/leafletSetup';
import { RISK_COLORS } from '../utils/constants';
import type { Asset } from '../types';

// ─── Risk Score Trend Data (12 months) ──────────────────────────
const riskTrendData = [
  { month: 'Feb', critical: 1623, highRisk: 4234 },
  { month: 'Mar', critical: 1654, highRisk: 4289 },
  { month: 'Apr', critical: 1689, highRisk: 4331 },
  { month: 'May', critical: 1712, highRisk: 4367 },
  { month: 'Jun', critical: 1738, highRisk: 4402 },
  { month: 'Jul', critical: 1761, highRisk: 4438 },
  { month: 'Aug', critical: 1779, highRisk: 4471 },
  { month: 'Sep', critical: 1798, highRisk: 4498 },
  { month: 'Oct', critical: 1815, highRisk: 4521 },
  { month: 'Nov', critical: 1829, highRisk: 4539 },
  { month: 'Dec', critical: 1841, highRisk: 4553 },
  { month: 'Jan', critical: 1847, highRisk: 4562 },
];

// ─── Asset Class Risk Data (for doughnut chart) ─────────────────
const assetClassRiskData = [
  { name: 'Transformers', value: 547, color: '#ef4444' },
  { name: 'Circuit Breakers', value: 423, color: '#f97316' },
  { name: 'Switches', value: 312, color: '#eab308' },
  { name: 'Capacitors', value: 289, color: '#06b6d4' },
  { name: 'Lines/Cables', value: 276, color: '#8b5cf6' },
];

// ─── Bar Chart Colors ───────────────────────────────────────────
const barChartColors: Record<string, string> = {
  Critical: '#ef4444',
  'High Risk': '#f97316',
  'Medium Risk': '#eab308',
  'Low Risk': '#22c55e',
  Healthy: '#06b6d4',
};

// ─── Risk Bar Colors ────────────────────────────────────────────
const riskBarColorMap: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

// ─── Geographic Map Asset Locations (PPL Electric Territory) ─────
const assetMapLocations = [
  { lat: 40.6023, lng: -75.4714, risk: 'critical' as const, id: 'TX-4401', name: 'Riverside Substation', type: 'Power Transformer' },
  { lat: 40.6259, lng: -75.3705, risk: 'critical' as const, id: 'TX-2287', name: 'Northgate Station', type: 'Power Transformer' },
  { lat: 40.8090, lng: -75.2080, risk: 'critical' as const, id: 'TX-3350', name: 'Valley View Sub', type: 'Power Transformer' },
  { lat: 40.6912, lng: -75.2100, risk: 'high' as const, id: 'CB-0819', name: 'Elm Creek Substation', type: 'Circuit Breaker' },
  { lat: 40.7260, lng: -75.3240, risk: 'high' as const, id: 'CB-1145', name: 'Oakmont Substation', type: 'Circuit Breaker' },
  { lat: 40.5860, lng: -75.4580, risk: 'high' as const, id: 'DT-7720', name: 'Industrial Park Feeder 12', type: 'Dist Transformer' },
  { lat: 40.6340, lng: -75.5120, risk: 'high' as const, id: 'DS-0334', name: 'Riverside Substation', type: 'Disconnect Switch' },
  { lat: 40.7450, lng: -75.2890, risk: 'medium' as const, id: 'VR-0056', name: 'Maple Grove Feeder 7', type: 'Voltage Regulator' },
  { lat: 40.6580, lng: -75.1450, risk: 'medium' as const, id: 'UC-0088', name: 'Downtown Loop Section 3', type: 'Underground Cable' },
  { lat: 40.8320, lng: -75.3540, risk: 'low' as const, id: 'RC-0112', name: 'Cedar Hills Line 4', type: 'Recloser' },
  { lat: 40.5520, lng: -75.3890, risk: 'low' as const, id: 'CP-0201', name: 'Westfield Sub', type: 'Capacitor Bank' },
  { lat: 40.7780, lng: -75.4230, risk: 'low' as const, id: 'TX-5580', name: 'Lakewood Central', type: 'Power Transformer' },
];

const mapRiskColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [allAssets, setAllAssets] = useState<Asset[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAssets().then((data) => { if (!cancelled) setAllAssets(data); });
    return () => { cancelled = true; };
  }, []);

  const topAssets = useMemo(() =>
    [...allAssets].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5),
    [allAssets],
  );

  const healthDistribution = useMemo(() => {
    const buckets: Record<string, number> = { Critical: 0, 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0, Healthy: 0 };
    for (const a of allAssets) {
      if (a.riskLevel === 'critical') buckets['Critical']++;
      else if (a.riskLevel === 'high') buckets['High Risk']++;
      else if (a.riskLevel === 'medium') buckets['Medium Risk']++;
      else if (a.riskLevel === 'low') buckets['Low Risk']++;
      else buckets['Healthy']++;
    }
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [allAssets]);

  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    color: isDark ? '#f3f4f6' : '#111827',
  };

  const axisTickStyle = { fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 };
  const axisLineStyle = { stroke: isDark ? '#4b5563' : '#d1d5db' };
  const gridStroke = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="space-y-6">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Asset Health Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fleet overview for PPL Electric Utilities T&amp;D asset management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Download size={16} />
            Export Report
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw size={16} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ═══ Stats Grid (4 columns) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Critical Assets */}
        <div className="relative overflow-hidden rounded-xl border border-red-200 dark:border-red-800/60 bg-white dark:bg-gray-800 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-red-500/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Critical Assets
              </span>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">1,847</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
              <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-500" />
              12.3% vs last quarter
            </p>
          </div>
        </div>

        {/* Replacement Cost (Critical) */}
        <div className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-gray-800 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-amber-500/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-500 text-base font-bold">$</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Replacement Cost (Critical)
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">$127M</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Estimated total for critical fleet
            </p>
          </div>
        </div>

        {/* Planned Replacements (2026) */}
        <div className="relative overflow-hidden rounded-xl border border-cyan-200 dark:border-cyan-800/60 bg-white dark:bg-gray-800 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-cyan-500/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-cyan-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Planned Replacements (2026)
              </span>
            </div>
            <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">324</p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
              Scheduled for current fiscal year
            </p>
          </div>
        </div>

        {/* Model Accuracy */}
        <div className="relative overflow-hidden rounded-xl border border-green-200 dark:border-green-800/60 bg-white dark:bg-gray-800 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-green-500/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-500 text-base font-bold">%</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Model Accuracy
              </span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">94.2%</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Weighted avg across all models
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Charts Row: Fleet Health + Risk Score Trend ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Fleet Health Distribution (Bar Chart) */}
        <Card>
          <CardHeader
            title="Fleet Health Distribution"
            subtitle="Asset count by health category"
          />
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={healthDistribution}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="name"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value.toLocaleString(), 'Assets']}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {healthDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={barChartColors[entry.name] || '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Score Trend (Line Chart) */}
        <Card>
          <CardHeader
            title="Risk Score Trend (12 Months)"
            subtitle="Critical and high-risk asset counts over time"
          />
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={riskTrendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="month"
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={axisLineStyle}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === 'critical' ? 'Critical' : 'High Risk',
                  ]}
                />
                <Legend
                  wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
                  formatter={(value: string) =>
                    value === 'critical' ? 'Critical' : 'High Risk'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#ef4444' }}
                  activeDot={{ r: 6 }}
                  name="critical"
                />
                <Line
                  type="monotone"
                  dataKey="highRisk"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f97316' }}
                  activeDot={{ r: 6 }}
                  name="highRisk"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ═══ Geographic Risk Distribution (Full Width) ═══ */}
      <Card>
        <CardHeader
          title="Geographic Risk Distribution"
          subtitle="Asset locations by risk level across the service territory"
          action={
            <div className="flex items-center gap-1">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">PPL Electric Service Territory</span>
            </div>
          }
        />
        <div className="relative w-full h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[40.69, -75.35]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url={isDark
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              }
            />
            {assetMapLocations.map((loc) => (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={loc.risk === 'critical' ? 10 : loc.risk === 'high' ? 8 : 6}
                pathOptions={{
                  fillColor: mapRiskColors[loc.risk],
                  color: '#ffffff',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'system-ui', fontSize: '13px' }}>
                    <strong style={{ color: mapRiskColors[loc.risk] }}>{loc.id}</strong>
                    <br />
                    <span>{loc.type}</span>
                    <br />
                    <span style={{ color: '#6b7280' }}>{loc.name}</span>
                    <br />
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: mapRiskColors[loc.risk],
                      backgroundColor: loc.risk === 'critical' ? '#fef2f2' : loc.risk === 'high' ? '#fff7ed' : loc.risk === 'medium' ? '#fefce8' : '#f0fdf4',
                    }}>
                      {loc.risk}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          {/* Legend overlay */}
          <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-lg">
            <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Risk Level
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Low</span>
              </div>
            </div>
          </div>
          {/* Location count overlay */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded px-2 py-1 shadow">
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
              {assetMapLocations.length} monitored locations
            </p>
          </div>
        </div>
      </Card>

      {/* ═══ Bottom Row: Critical Assets + Risk by Asset Class ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Critical Assets Requiring Immediate Attention */}
        <Card padding={false}>
          <div className="p-6 pb-4">
            <CardHeader
              title="Critical Assets Requiring Immediate Attention"
              subtitle="Top 5 highest-risk assets in the fleet"
              action={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  <AlertTriangle size={12} />
                  {topAssets.length} assets
                </span>
              }
            />
          </div>
          <div className="px-6 pb-6 space-y-3">
            {topAssets.map((asset: Asset) => {
              const riskColors = RISK_COLORS[asset.riskLevel];
              const barColor = riskBarColorMap[asset.riskLevel];
              return (
                <div
                  key={asset.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4"
                >
                  {/* Top row: Asset ID + Health Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                      {asset.id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${riskColors.bg} ${riskColors.text} ${riskColors.border} ${riskColors.darkBg} ${riskColors.darkText} ${riskColors.darkBorder}`}
                    >
                      {asset.riskLevel === 'critical'
                        ? 'Critical'
                        : asset.riskLevel === 'high'
                        ? 'High Risk'
                        : asset.riskLevel.charAt(0).toUpperCase() + asset.riskLevel.slice(1)}
                    </span>
                  </div>

                  {/* 2x2 Info Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Type
                      </p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {asset.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Voltage
                      </p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {asset.voltage}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Age
                      </p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {asset.age} years
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Location
                      </p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {asset.location}
                      </p>
                    </div>
                  </div>

                  {/* Risk Score Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${asset.riskScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-7 text-right">
                      {asset.riskScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Risk by Asset Class (Doughnut Chart) */}
        <Card>
          <CardHeader
            title="Risk by Asset Class"
            subtitle="Distribution of critical assets by equipment type"
          />
          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetClassRiskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {assetClassRiskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value.toLocaleString(), 'Assets']}
                />
                <Legend
                  wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151', fontSize: '12px' }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ═══ Activity Feed ═══ */}
      <Card>
        <CardHeader
          title="Recent Activity & Alerts"
          subtitle="Latest monitoring events and notifications"
        />
        <ActivityFeed />
      </Card>
    </div>
  );
}
