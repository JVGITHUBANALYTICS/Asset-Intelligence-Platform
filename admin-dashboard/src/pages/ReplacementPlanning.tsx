import { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Clock, BarChart3, Zap, FileText, Target, Wallet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Card, { CardHeader } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useTheme } from '../hooks/useTheme';
import { RISK_COLORS } from '../utils/constants';
import { getAssets } from '../services/assetService';
import type { Asset } from '../types';

const stats = [
  { label: 'Planned 2026', value: '324', sub: 'assets scheduled', icon: Calendar, color: 'text-cyan-500' },
  { label: 'Budget', value: '$47.2M', sub: 'approved funding', icon: DollarSign, color: 'text-green-500' },
  { label: 'Allocated', value: '89%', sub: 'of total budget', icon: TrendingUp, color: 'text-purple-500' },
  { label: 'Backlog', value: '1,523', sub: 'assets pending', icon: Clock, color: 'text-orange-500' },
  { label: 'Peak Quarter', value: 'Q2 2026', sub: 'highest spend', icon: BarChart3, color: 'text-blue-500' },
];

const forecastData = [
  { year: '2026', transformers: 12.4, breakers: 5.8, cables: 3.2, other: 2.1 },
  { year: '2027', transformers: 14.1, breakers: 6.2, cables: 4.5, other: 2.8 },
  { year: '2028', transformers: 16.8, breakers: 7.1, cables: 5.1, other: 3.4 },
  { year: '2029', transformers: 19.2, breakers: 8.4, cables: 5.8, other: 4.1 },
  { year: '2030', transformers: 22.5, breakers: 9.7, cables: 6.9, other: 4.8 },
];

const budgetData = [
  { name: 'Transformers', value: 21.2, color: '#06b6d4' },
  { name: 'Circuit Breakers', value: 8.4, color: '#8b5cf6' },
  { name: 'Underground Cable', value: 7.8, color: '#f59e0b' },
  { name: 'Switchgear', value: 5.2, color: '#10b981' },
  { name: 'Other', value: 4.6, color: '#6b7280' },
];

const replacementTable = [
  { rank: 1, id: 'TX-4401', type: 'Power Transformer', location: 'Riverside Substation', riskLevel: 'critical' as const, quarter: 'Q1 2026', cost: '$4.2M', consequence: 'High' },
  { rank: 2, id: 'TX-3350', type: 'Power Transformer', location: 'Valley View Sub', riskLevel: 'critical' as const, quarter: 'Q1 2026', cost: '$2.9M', consequence: 'High' },
  { rank: 3, id: 'TX-2287', type: 'Power Transformer', location: 'Northgate Station', riskLevel: 'critical' as const, quarter: 'Q2 2026', cost: '$3.8M', consequence: 'High' },
  { rank: 4, id: 'CB-0819', type: 'Circuit Breaker', location: 'Elm Creek Substation', riskLevel: 'high' as const, quarter: 'Q2 2026', cost: '$850K', consequence: 'Medium' },
  { rank: 5, id: 'CB-1145', type: 'Circuit Breaker', location: 'Oakmont Substation', riskLevel: 'high' as const, quarter: 'Q3 2026', cost: '$620K', consequence: 'Medium' },
  { rank: 6, id: 'DS-0334', type: 'Disconnect Switch', location: 'Riverside Substation', riskLevel: 'high' as const, quarter: 'Q3 2026', cost: '$320K', consequence: 'Medium' },
  { rank: 7, id: 'DT-7720', type: 'Dist Transformer', location: 'Industrial Park Feeder 12', riskLevel: 'high' as const, quarter: 'Q4 2026', cost: '$185K', consequence: 'Low' },
  { rank: 8, id: 'UC-0088', type: 'Underground Cable', location: 'Downtown Loop Section 3', riskLevel: 'medium' as const, quarter: 'Q4 2026', cost: '$1.5M', consequence: 'Medium' },
];

type PlanType = '5-Year Plan' | 'Annual Plan' | 'Emergency Replacement';
type RiskThreshold = 'critical' | 'high' | 'medium' | 'all';

interface PlanSummary {
  totalAssets: number;
  totalCost: number;
  avgRiskScore: number;
  budgetUtilization: number;
}

const RISK_THRESHOLD_OPTIONS: { value: RiskThreshold; label: string; minScore: number }[] = [
  { value: 'critical', label: 'Critical Only (>80)', minScore: 80 },
  { value: 'high', label: 'High & Critical (>60)', minScore: 60 },
  { value: 'medium', label: 'Medium+ (>40)', minScore: 40 },
  { value: 'all', label: 'All Assets', minScore: 0 },
];

export default function ReplacementPlanning() {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const [allAssets, setAllAssets] = useState<Asset[]>([]);

  useEffect(() => {
    getAssets().then(setAllAssets);
  }, []);

  // Capital Plan Builder state
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<PlanType>('5-Year Plan');
  const [budget, setBudget] = useState('');
  const [riskThreshold, setRiskThreshold] = useState<RiskThreshold>('high');
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);

  const generatePlan = () => {
    const thresholdConfig = RISK_THRESHOLD_OPTIONS.find((opt) => opt.value === riskThreshold);
    const minScore = thresholdConfig?.minScore ?? 0;
    const filtered = allAssets.filter((asset) => asset.riskScore > minScore);

    const totalCost = filtered.reduce((sum, asset) => sum + asset.estimatedCost, 0);
    const avgRiskScore = filtered.length > 0
      ? Math.round(filtered.reduce((sum, asset) => sum + asset.riskScore, 0) / filtered.length)
      : 0;
    const budgetValue = parseFloat(budget) * 1_000_000 || 0;
    const budgetUtilization = budgetValue > 0
      ? Math.round((totalCost / budgetValue) * 100)
      : 0;

    setPlanSummary({
      totalAssets: filtered.length,
      totalCost,
      avgRiskScore,
      budgetUtilization,
    });
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={24} className="text-cyan-500" />
          Replacement Planning
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Capital planning and asset replacement scheduling
        </p>
      </div>

      {/* Capital Plan Builder Form */}
      <Card>
        <CardHeader
          title="Capital Plan Builder"
          subtitle="Create a new optimized replacement plan based on risk and budget parameters"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Plan Name */}
          <div>
            <label htmlFor="plan-name" className={labelClass}>
              Plan Name
            </label>
            <input
              id="plan-name"
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. FY2026 Critical Replacements"
              className={inputClass}
            />
          </div>

          {/* Plan Type */}
          <div>
            <label htmlFor="plan-type" className={labelClass}>
              Plan Type
            </label>
            <select
              id="plan-type"
              value={planType}
              onChange={(e) => setPlanType(e.target.value as PlanType)}
              className={inputClass}
            >
              <option value="5-Year Plan">5-Year Plan</option>
              <option value="Annual Plan">Annual Plan</option>
              <option value="Emergency Replacement">Emergency Replacement</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="plan-budget" className={labelClass}>
              Budget ($M)
            </label>
            <input
              id="plan-budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 25"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </div>

          {/* Risk Threshold */}
          <div>
            <label htmlFor="risk-threshold" className={labelClass}>
              Risk Threshold
            </label>
            <select
              id="risk-threshold"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(e.target.value as RiskThreshold)}
              className={inputClass}
            >
              {RISK_THRESHOLD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-5">
          <Button size="md" variant="primary" onClick={generatePlan}>
            <Zap size={16} />
            Generate Optimized Plan
          </Button>
        </div>

        {/* Plan Summary */}
        {planSummary && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-cyan-500" />
              Plan Summary
              {planName && (
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                  &mdash; {planName} ({planType})
                </span>
              )}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-cyan-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total Assets</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{planSummary.totalAssets}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-green-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total Cost</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${(planSummary.totalCost / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-orange-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Avg Risk Score</span>
                </div>
                <p className="text-xl font-bold text-red-500">{planSummary.avgRiskScore}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={14} className="text-purple-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Budget Utilization</span>
                </div>
                <p className={`text-xl font-bold ${planSummary.budgetUtilization > 100 ? 'text-red-500' : planSummary.budgetUtilization > 80 ? 'text-orange-500' : 'text-green-500'}`}>
                  {planSummary.budgetUtilization > 0 ? `${planSummary.budgetUtilization}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{stat.sub}</p>
              </div>
              <stat.icon size={18} className={stat.color} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* 5-Year Forecast Bar */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="5-Year Replacement Forecast"
            subtitle="Projected spending by asset category ($M)"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="year" tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                    border: `1px solid ${gridColor}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`$${value}M`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="transformers" name="Transformers" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                <Bar dataKey="breakers" name="Breakers" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="cables" name="Cables" stackId="a" fill="#f59e0b" />
                <Bar dataKey="other" name="Other" stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget Pie */}
        <Card>
          <CardHeader
            title="Budget Allocation"
            subtitle="2026 capital budget distribution"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value}M`}
                  labelLine={{ stroke: textColor }}
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                    border: `1px solid ${gridColor}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`$${value}M`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Prioritized Replacement Table */}
      <Card padding={false}>
        <div className="p-6 pb-0">
          <CardHeader
            title="Prioritized Replacement Schedule"
            subtitle="Assets ranked by risk and consequence of failure"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset ID</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Quarter</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Est. Cost</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Consequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {replacementTable.map((row) => {
                const colors = RISK_COLORS[row.riskLevel];
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400">{row.id}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.type}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell">{row.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                        {row.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{row.quarter}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hidden lg:table-cell">{row.cost}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-medium ${row.consequence === 'High' ? 'text-red-500' : row.consequence === 'Medium' ? 'text-orange-500' : 'text-yellow-500'}`}>
                        {row.consequence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
