import { useState, useMemo, useRef, useCallback } from 'react';
import {
  FileText,
  Heart,
  Shield,
  DollarSign,
  LayoutDashboard,
  Wrench,
  TrendingUp,
  Download,
  ChevronUp,
  Clock,
  CheckCircle2,
  X,
  Building2,
  AlertTriangle,
  Upload,
  File,
  Trash2,
  FolderOpen,
  Tag,
  Search,
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import { mockAssets } from '../data/mockAssets';
import { RISK_COLORS } from '../utils/constants';

// ─── Fleet Health Calculations ──────────────────────────────────
function useFleetHealthData() {
  return useMemo(() => {
    const total = mockAssets.length;
    const critical = mockAssets.filter((a) => a.riskLevel === 'critical').length;
    const high = mockAssets.filter((a) => a.riskLevel === 'high').length;
    const medium = mockAssets.filter((a) => a.riskLevel === 'medium').length;
    const low = mockAssets.filter((a) => a.riskLevel === 'low').length;
    const avgHealth = Math.round(mockAssets.reduce((sum, a) => sum + a.healthScore, 0) / total);
    const avgRisk = Math.round(mockAssets.reduce((sum, a) => sum + a.riskScore, 0) / total);

    // By asset type
    const byType: Record<string, { count: number; avgHealth: number; avgRisk: number }> = {};
    mockAssets.forEach((a) => {
      if (!byType[a.type]) byType[a.type] = { count: 0, avgHealth: 0, avgRisk: 0 };
      byType[a.type].count += 1;
      byType[a.type].avgHealth += a.healthScore;
      byType[a.type].avgRisk += a.riskScore;
    });
    Object.keys(byType).forEach((key) => {
      byType[key].avgHealth = Math.round(byType[key].avgHealth / byType[key].count);
      byType[key].avgRisk = Math.round(byType[key].avgRisk / byType[key].count);
    });

    // By voltage class
    const byVoltageClass: Record<string, { count: number; avgHealth: number; avgRisk: number }> = {};
    mockAssets.forEach((a) => {
      if (!byVoltageClass[a.voltageClass]) byVoltageClass[a.voltageClass] = { count: 0, avgHealth: 0, avgRisk: 0 };
      byVoltageClass[a.voltageClass].count += 1;
      byVoltageClass[a.voltageClass].avgHealth += a.healthScore;
      byVoltageClass[a.voltageClass].avgRisk += a.riskScore;
    });
    Object.keys(byVoltageClass).forEach((key) => {
      byVoltageClass[key].avgHealth = Math.round(byVoltageClass[key].avgHealth / byVoltageClass[key].count);
      byVoltageClass[key].avgRisk = Math.round(byVoltageClass[key].avgRisk / byVoltageClass[key].count);
    });

    return { total, critical, high, medium, low, avgHealth, avgRisk, byType, byVoltageClass };
  }, []);
}

function usePUCFilingData() {
  return useMemo(() => {
    const criticalAssets = mockAssets.filter((a) => a.riskLevel === 'critical' || a.riskLevel === 'high');
    const totalCapitalRequired = criticalAssets.reduce((sum, a) => sum + a.estimatedCost, 0);
    const totalCustomersAtRisk = criticalAssets.reduce((sum, a) => sum + (a.customersAffected ?? 0), 0);
    const avgAge = Math.round(criticalAssets.reduce((sum, a) => sum + a.age, 0) / criticalAssets.length);

    return { criticalAssets, totalCapitalRequired, totalCustomersAtRisk, avgAge };
  }, []);
}

// ─── Risk Level Badge ───────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  const colors = RISK_COLORS[level];
  if (!colors) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} ${colors.darkBg} ${colors.darkText} border`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

// ─── Fleet Health Report Content ────────────────────────────────
function FleetHealthReport({ onClose }: { onClose: () => void }) {
  const data = useFleetHealthData();

  return (
    <div className="mt-4 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Fleet Health Summary Report
        </h4>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Assets</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{data.avgHealth}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Health Score</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.avgRisk}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Risk Score</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.critical + data.high}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At-Risk Assets</p>
        </div>
      </div>

      {/* Risk Distribution Table */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Risk Distribution
        </h5>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Fleet
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(
                [
                  { level: 'critical', count: data.critical, color: 'bg-red-500' },
                  { level: 'high', count: data.high, color: 'bg-orange-500' },
                  { level: 'medium', count: data.medium, color: 'bg-yellow-500' },
                  { level: 'low', count: data.low, color: 'bg-green-500' },
                ] as const
              ).map((row) => (
                <tr key={row.level} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <RiskBadge level={row.level} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {row.count}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {((row.count / data.total) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${row.color} rounded-full h-2 transition-all`}
                        style={{ width: `${(row.count / data.total) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Asset Type */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Health by Asset Type
        </h5>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asset Type
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Health
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Risk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {Object.entries(data.byType)
                .sort(([, a], [, b]) => a.avgHealth - b.avgHealth)
                .map(([type, stats]) => (
                  <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{type}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{stats.count}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          stats.avgHealth < 30
                            ? 'text-red-600 dark:text-red-400'
                            : stats.avgHealth < 50
                              ? 'text-orange-600 dark:text-orange-400'
                              : stats.avgHealth < 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {stats.avgHealth}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{stats.avgRisk}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Voltage Class */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Health by Voltage Class
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(data.byVoltageClass).map(([voltageClass, stats]) => (
            <div
              key={voltageClass}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{voltageClass}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Assets</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.count}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Avg Health</span>
                  <span
                    className={`font-medium ${
                      stats.avgHealth < 30
                        ? 'text-red-600 dark:text-red-400'
                        : stats.avgHealth < 50
                          ? 'text-orange-600 dark:text-orange-400'
                          : stats.avgHealth < 70
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {stats.avgHealth}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Avg Risk</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300">{stats.avgRisk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PUC Filing Report Content ──────────────────────────────────
function PUCFilingReport({ onClose }: { onClose: () => void }) {
  const data = usePUCFilingData();

  return (
    <div className="mt-4 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            Pennsylvania PUC Regulatory Filing
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Building2 size={14} className="text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">PPL Electric Utilities</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filing Header */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Filing Type</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-0.5">Capital Investment Plan - Infrastructure Replacement</p>
          </div>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Filing Period</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-0.5">FY 2026-2027</p>
          </div>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Jurisdiction</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-0.5">Pennsylvania Public Utility Commission</p>
          </div>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Report Date</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Capital Justification Summary */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          Capital Justification Summary
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-center border border-red-100 dark:border-red-900">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{data.criticalAssets.length}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">At-Risk Assets</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center border border-amber-100 dark:border-amber-900">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              ${(data.totalCapitalRequired / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Capital Required</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {(data.totalCustomersAtRisk / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Customers at Risk</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{data.avgAge} yrs</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Age (At-Risk)</p>
          </div>
        </div>
      </div>

      {/* Assets Requiring Replacement */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Assets Requiring Capital Investment
        </h5>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asset ID
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Age
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Est. Cost
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customers
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.criticalAssets
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900 dark:text-white">
                      {asset.id}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{asset.type}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{asset.location}</td>
                    <td className="px-4 py-3 text-center">
                      <RiskBadge level={asset.riskLevel} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{asset.age} yrs</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      ${(asset.estimatedCost / 1000000).toFixed(2)}M
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {(asset.customersAffected ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-900/50 font-semibold">
                <td colSpan={5} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                  ${(data.totalCapitalRequired / 1000000).toFixed(2)}M
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                  {data.totalCustomersAtRisk.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Regulatory Note */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Regulatory Note:</span>{' '}
          This filing is prepared in accordance with 52 Pa. Code Chapter 57 and reflects PPL Electric
          Utilities' asset condition assessment methodology. All health and risk scores are derived
          from the Asset Intelligence Platform using IEEE C57 standards for transformer assessment,
          NERC reliability standards, and PPL's internal condition-based maintenance protocols. Capital
          investment figures represent estimated replacement costs at current market rates.
        </p>
      </div>
    </div>
  );
}

// ─── Report Definitions ─────────────────────────────────────────
const reports = [
  {
    id: 'fleet-health',
    title: 'Fleet Health Summary',
    description:
      'Comprehensive overview of asset fleet health scores, risk distribution, and condition trends across all voltage classes and asset types.',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    id: 'puc-filing',
    title: 'PUC Regulatory Filing',
    description:
      'Formatted report for Public Utility Commission submissions including reliability metrics, capital investment justification, and compliance data.',
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    id: 'capital-plan',
    title: 'Capital Plan Report',
    description:
      'Detailed capital expenditure plan with prioritized replacement schedules, cost projections, and 5-year budget forecasting.',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    id: 'exec-dashboard',
    title: 'Executive Dashboard',
    description:
      'High-level executive summary with KPIs, fleet risk index trends, budget utilization, and strategic investment recommendations.',
    icon: LayoutDashboard,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    id: 'maintenance-opt',
    title: 'Maintenance Optimization',
    description:
      'Analysis of maintenance intervals, cost-benefit assessments, and recommendations for optimizing preventive maintenance schedules.',
    icon: Wrench,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    id: 'risk-trend',
    title: 'Risk Trend Analysis',
    description:
      'Historical risk score trends, deterioration curves, failure probability analysis, and predictive modeling accuracy assessment.',
    icon: TrendingUp,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
];

// ─── Previously Generated Reports (mock) ────────────────────────
interface GeneratedReport {
  id: string;
  title: string;
  description: string;
  generatedAt: string;
  format: string;
  fileSize: string;
  generatedBy: string;
  status: 'completed';
  pages: number;
  scope: string;
}

const generatedReportsHistory: GeneratedReport[] = [
  {
    id: 'gen-1',
    title: 'Fleet Health Summary',
    description: 'Comprehensive overview of asset fleet health scores, risk distribution by voltage class and asset type. Includes health score trending over the past 12 months and deterioration analysis for critical assets.',
    generatedAt: 'Jan 15, 2026 at 9:42 AM',
    format: 'PDF',
    fileSize: '2.4 MB',
    generatedBy: 'Sarah Chen',
    status: 'completed',
    pages: 18,
    scope: 'All Assets (1,000)',
  },
  {
    id: 'gen-2',
    title: 'PUC Regulatory Filing',
    description: 'PA Public Utility Commission filing per 52 Pa. Code Chapter 57. Covers SAIDI/SAIFI performance metrics, infrastructure investment plan, capital justification for at-risk assets, and reliability improvement projections for FY 2026-2027.',
    generatedAt: 'Jan 12, 2026 at 2:15 PM',
    format: 'PDF',
    fileSize: '5.1 MB',
    generatedBy: 'Mike Rodriguez',
    status: 'completed',
    pages: 42,
    scope: 'Critical & High Risk Assets',
  },
  {
    id: 'gen-3',
    title: 'Capital Plan Report',
    description: 'Detailed 5-year capital expenditure plan with prioritized replacement schedules based on risk scoring. Includes cost projections, budget allocation by asset class, and ROI analysis for proposed investments.',
    generatedAt: 'Jan 10, 2026 at 11:30 AM',
    format: 'XLSX',
    fileSize: '8.7 MB',
    generatedBy: 'Sarah Chen',
    status: 'completed',
    pages: 6,
    scope: 'All Assets (1,000)',
  },
  {
    id: 'gen-4',
    title: 'Executive Dashboard',
    description: 'High-level executive summary with fleet KPIs, risk index trends over 24 months, budget utilization vs. plan, and strategic investment recommendations for board presentation.',
    generatedAt: 'Jan 5, 2026 at 4:00 PM',
    format: 'PDF',
    fileSize: '1.8 MB',
    generatedBy: 'Lisa Thompson',
    status: 'completed',
    pages: 12,
    scope: 'All Assets (1,000)',
  },
  {
    id: 'gen-5',
    title: 'Risk Trend Analysis',
    description: 'Historical risk score trends with deterioration curves for each asset class. Includes failure probability analysis using Weibull distributions and predictive modeling accuracy assessment against actual failures in 2025.',
    generatedAt: 'Dec 28, 2025 at 10:20 AM',
    format: 'PDF',
    fileSize: '3.6 MB',
    generatedBy: 'Dr. James Park',
    status: 'completed',
    pages: 28,
    scope: 'Transmission & Sub-Transmission',
  },
  {
    id: 'gen-6',
    title: 'Maintenance Optimization',
    description: 'Analysis of maintenance intervals and cost-benefit assessments for all asset classes. Recommends optimized preventive maintenance schedules based on condition monitoring data and failure modes.',
    generatedAt: 'Dec 15, 2025 at 3:30 PM',
    format: 'PDF',
    fileSize: '2.9 MB',
    generatedBy: 'Mike Rodriguez',
    status: 'completed',
    pages: 22,
    scope: 'All Assets (1,000)',
  },
  {
    id: 'gen-7',
    title: 'DGA Trending Report - Q4 2025',
    description: 'Quarterly dissolved gas analysis trending report for all monitored power transformers. Includes Duval Triangle analysis, gas generation rates, and recommended actions per IEEE C57.104-2019.',
    generatedAt: 'Dec 10, 2025 at 10:00 AM',
    format: 'XLSX',
    fileSize: '6.2 MB',
    generatedBy: 'Dr. James Park',
    status: 'completed',
    pages: 8,
    scope: 'Power Transformers (125)',
  },
  {
    id: 'gen-8',
    title: 'Fleet Health Summary - November',
    description: 'Monthly fleet health summary showing health score changes, newly identified at-risk assets, and completed remediation activities during November 2025.',
    generatedAt: 'Dec 1, 2025 at 9:00 AM',
    format: 'PDF',
    fileSize: '2.1 MB',
    generatedBy: 'Sarah Chen',
    status: 'completed',
    pages: 15,
    scope: 'All Assets (1,000)',
  },
  {
    id: 'gen-9',
    title: 'Inspection Compliance Summary',
    description: 'Summary of inspection compliance rates by asset type and region. Highlights overdue inspections, inspection backlog, and resource allocation recommendations.',
    generatedAt: 'Nov 20, 2025 at 2:45 PM',
    format: 'PDF',
    fileSize: '1.5 MB',
    generatedBy: 'Lisa Thompson',
    status: 'completed',
    pages: 10,
    scope: 'All Assets (1,000)',
  },
  {
    id: 'gen-10',
    title: 'Capital Plan Report - Draft',
    description: 'Draft version of the 5-year capital expenditure plan for internal review. Includes preliminary budget allocations, project prioritization matrix, and stakeholder impact analysis.',
    generatedAt: 'Nov 15, 2025 at 11:15 AM',
    format: 'XLSX',
    fileSize: '7.4 MB',
    generatedBy: 'Sarah Chen',
    status: 'completed',
    pages: 5,
    scope: 'Critical & High Risk Assets',
  },
];

// ─── Document Upload Types ──────────────────────────────────
type DocumentCategory =
  | 'Regulatory Filing'
  | 'Compliance Report'
  | 'Audit Report'
  | 'Engineering Study'
  | 'Insurance Document'
  | 'Internal Report'
  | 'Other';

interface UploadedDocument {
  id: string;
  fileName: string;
  title: string;
  category: DocumentCategory;
  description: string;
  tags: string[];
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Regulatory Filing',
  'Compliance Report',
  'Audit Report',
  'Engineering Study',
  'Insurance Document',
  'Internal Report',
  'Other',
];

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  'Regulatory Filing': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Compliance Report': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Audit Report': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Engineering Study': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'Insurance Document': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'Internal Report': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Other: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-500',
  xlsx: 'text-green-600',
  xls: 'text-green-600',
  docx: 'text-blue-500',
  doc: 'text-blue-500',
  csv: 'text-emerald-500',
  pptx: 'text-orange-500',
};

const INITIAL_UPLOADED_DOCS: UploadedDocument[] = [
  {
    id: 'doc-1',
    fileName: 'PA_PUC_Annual_Filing_2025.pdf',
    title: 'PA PUC Annual Reliability Filing 2025',
    category: 'Regulatory Filing',
    description: 'Annual filing to Pennsylvania PUC per 52 Pa. Code Chapter 57 covering system reliability metrics, SAIDI/SAIFI performance, and infrastructure investment plan.',
    tags: ['PUC', 'SAIDI', 'SAIFI', 'Annual'],
    fileSize: '4.2 MB',
    fileType: 'pdf',
    uploadedBy: 'Sarah Chen',
    uploadedAt: 'Jan 28, 2026',
  },
  {
    id: 'doc-2',
    fileName: 'NERC_CIP_Compliance_Q4_2025.pdf',
    title: 'NERC CIP Compliance Assessment Q4 2025',
    category: 'Compliance Report',
    description: 'Quarterly NERC Critical Infrastructure Protection compliance assessment covering CIP-002 through CIP-014 standards for bulk electric system assets.',
    tags: ['NERC', 'CIP', 'Compliance', 'Q4'],
    fileSize: '2.8 MB',
    fileType: 'pdf',
    uploadedBy: 'Mike Rodriguez',
    uploadedAt: 'Jan 15, 2026',
  },
  {
    id: 'doc-3',
    fileName: 'Transformer_Oil_Analysis_2025.xlsx',
    title: 'Annual Transformer Oil Analysis Summary',
    category: 'Engineering Study',
    description: 'Consolidated DGA and oil quality analysis results for all power transformers per IEEE C57.104-2019 guidelines. Includes trending and recommended actions.',
    tags: ['DGA', 'IEEE C57', 'Oil Analysis', 'Transformers'],
    fileSize: '8.7 MB',
    fileType: 'xlsx',
    uploadedBy: 'Dr. James Park',
    uploadedAt: 'Jan 10, 2026',
  },
  {
    id: 'doc-4',
    fileName: 'Insurance_Risk_Assessment_2026.pdf',
    title: 'Insurance Risk Assessment & Valuation 2026',
    category: 'Insurance Document',
    description: 'Comprehensive risk assessment and replacement cost valuation for insurance underwriting. Covers all T&D assets above 69kV.',
    tags: ['Insurance', 'Valuation', 'Risk Assessment'],
    fileSize: '3.1 MB',
    fileType: 'pdf',
    uploadedBy: 'Sarah Chen',
    uploadedAt: 'Dec 20, 2025',
  },
  {
    id: 'doc-5',
    fileName: 'Internal_Audit_Asset_Mgmt_2025.pdf',
    title: 'Internal Audit - Asset Management Practices',
    category: 'Audit Report',
    description: 'Internal audit findings on asset management practices, data integrity, maintenance scheduling adherence, and process improvement recommendations.',
    tags: ['Audit', 'Asset Management', 'Process'],
    fileSize: '1.9 MB',
    fileType: 'pdf',
    uploadedBy: 'Lisa Thompson',
    uploadedAt: 'Dec 5, 2025',
  },
  {
    id: 'doc-6',
    fileName: 'Vegetation_Mgmt_Report_2025.docx',
    title: 'Vegetation Management Program Annual Report',
    category: 'Internal Report',
    description: 'Annual summary of vegetation management activities, miles trimmed, outage reduction impact, and budget performance for distribution corridors.',
    tags: ['Vegetation', 'Distribution', 'Annual'],
    fileSize: '5.4 MB',
    fileType: 'docx',
    uploadedBy: 'Tom Bradley',
    uploadedAt: 'Nov 18, 2025',
  },
];

// ─── Main Reports Page ──────────────────────────────────────────
export default function Reports() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [reportSearch, setReportSearch] = useState('');
  const [reportFormatFilter, setReportFormatFilter] = useState<string>('all');

  // Upload state
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>(INITIAL_UPLOADED_DOCS);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Regulatory Filing');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTagInput, setUploadTagInput] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = (reportId: string) => {
    setExpandedReport((prev) => (prev === reportId ? null : reportId));
  };

  // ─── Upload Handlers ────────────────────────────────────────
  const resetUploadForm = useCallback(() => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadCategory('Regulatory Filing');
    setUploadDescription('');
    setUploadTagInput('');
    setUploadTags([]);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setUploadFile({ name: file.name, size: `${sizeMB} MB`, type: ext });
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setUploadTitle(nameWithoutExt);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleAddTag = useCallback(() => {
    const tag = uploadTagInput.trim();
    if (tag && !uploadTags.includes(tag)) {
      setUploadTags((prev) => [...prev, tag]);
      setUploadTagInput('');
    }
  }, [uploadTagInput, uploadTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setUploadTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleUploadSubmit = useCallback(() => {
    if (!uploadFile || !uploadTitle.trim()) return;
    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      fileName: uploadFile.name,
      title: uploadTitle.trim(),
      category: uploadCategory,
      description: uploadDescription.trim(),
      tags: uploadTags,
      fileSize: uploadFile.size,
      fileType: uploadFile.type,
      uploadedBy: 'Current User',
      uploadedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    };
    setUploadedDocs((prev) => [newDoc, ...prev]);
    resetUploadForm();
    setShowUploadModal(false);
  }, [uploadFile, uploadTitle, uploadCategory, uploadDescription, uploadTags, resetUploadForm]);

  const handleDeleteDoc = useCallback((docId: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  // ─── Filtered Generated Reports ─────────────────────────────
  const filteredReports = useMemo(() => {
    let result = generatedReportsHistory as GeneratedReport[];
    if (reportSearch) {
      const q = reportSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.generatedBy.toLowerCase().includes(q) ||
          r.scope.toLowerCase().includes(q),
      );
    }
    if (reportFormatFilter !== 'all') {
      result = result.filter((r) => r.format === reportFormatFilter);
    }
    return result;
  }, [reportSearch, reportFormatFilter]);

  // ─── Filtered Documents ─────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let result = uploadedDocs;
    if (docSearch) {
      const q = docSearch.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (docCategoryFilter !== 'all') {
      result = result.filter((d) => d.category === docCategoryFilter);
    }
    return result;
  }, [uploadedDocs, docSearch, docCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-cyan-500" />
            Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate and export standardized asset intelligence reports
          </p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {reports.map((report) => {
          const isExpanded = expandedReport === report.id;
          const hasExpandableContent = report.id === 'fleet-health' || report.id === 'puc-filing';

          return (
            <Card
              key={report.id}
              className={`flex flex-col ${
                isExpanded ? 'md:col-span-2 xl:col-span-3' : ''
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${report.bgColor} flex-shrink-0`}>
                  <report.icon size={24} className={report.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {report.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  PDF / XLSX
                </span>
                <Button
                  size="sm"
                  variant={isExpanded ? 'primary' : 'secondary'}
                  onClick={() => handleGenerate(report.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} />
                      Collapse
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Generate
                    </>
                  )}
                </Button>
              </div>

              {/* Expandable Report Content */}
              {isExpanded && report.id === 'fleet-health' && (
                <FleetHealthReport onClose={() => setExpandedReport(null)} />
              )}
              {isExpanded && report.id === 'puc-filing' && (
                <PUCFilingReport onClose={() => setExpandedReport(null)} />
              )}
              {isExpanded && !hasExpandableContent && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      {report.title}
                    </h4>
                    <button
                      onClick={() => setExpandedReport(null)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className={`p-4 rounded-full ${report.bgColor} mb-4`}>
                      <report.icon size={32} className={report.color} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      The {report.title} report is being generated. In a production environment, this
                      would compile data from the asset intelligence engine and produce a downloadable
                      PDF or XLSX file.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Button size="sm" variant="secondary" disabled>
                        <Download size={14} />
                        Download PDF
                      </Button>
                      <Button size="sm" variant="secondary" disabled>
                        <Download size={14} />
                        Download XLSX
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Generated Reports History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Generated Reports
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Previously generated reports available for download
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by title, description, author, or scope..."
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <select
            value={reportFormatFilter}
            onChange={(e) => setReportFormatFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Formats</option>
            <option value="PDF">PDF</option>
            <option value="XLSX">XLSX</option>
          </select>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No reports match your search</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{report.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {report.generatedAt}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {report.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 size={12} />
                        Completed
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                        <Download size={14} />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
          {generatedReportsHistory.length} generated report{generatedReportsHistory.length !== 1 ? 's' : ''}
          {reportSearch || reportFormatFilter !== 'all'
            ? ` (${filteredReports.length} shown)`
            : ''}
        </div>
      </Card>

      {/* ─── Document Library ──────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FolderOpen size={20} className="text-amber-500" />
          Document Library
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Upload and manage regulatory filings, compliance reports, and important documents
        </p>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search documents by title, filename, or tags..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <select
            value={docCategoryFilter}
            onChange={(e) => setDocCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Categories</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              resetUploadForm();
              setShowUploadModal(true);
            }}
          >
            <Upload size={16} />
            Upload Document
          </Button>
        </div>

        {/* Document Cards */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No documents found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                {/* File icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <File
                    size={28}
                    className={FILE_TYPE_COLORS[doc.fileType] || 'text-gray-400'}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                        {doc.fileName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${CATEGORY_COLORS[doc.category]}`}
                    >
                      {doc.category}
                    </span>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {/* Tags */}
                    {doc.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag size={10} className="text-gray-400" />
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {doc.fileSize} &middot; {doc.fileType.toUpperCase()} &middot; {doc.uploadedBy} &middot; {doc.uploadedAt}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
          {uploadedDocs.length} document{uploadedDocs.length !== 1 ? 's' : ''} in library
          {docSearch || docCategoryFilter !== 'all'
            ? ` (${filteredDocs.length} shown)`
            : ''}
        </div>
      </Card>

      {/* ─── Upload Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          resetUploadForm();
        }}
        title="Upload Document"
        size="lg"
      >
        <div className="space-y-4">
          {/* Drop zone */}
          {!uploadFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Upload size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drag & drop a file here, or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Supports PDF, XLSX, DOCX, CSV, PPTX (max 50 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <File
                size={24}
                className={FILE_TYPE_COLORS[uploadFile.type] || 'text-gray-400'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {uploadFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {uploadFile.size} &middot; {uploadFile.type.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadFile(null)}
                className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g., PA PUC Annual Reliability Filing 2026"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Brief description of this document's contents and purpose..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <Input
                value={uploadTagInput}
                onChange={(e) => setUploadTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag and press Enter"
              />
              <Button size="sm" variant="secondary" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {uploadTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {uploadTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowUploadModal(false);
                resetUploadForm();
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleUploadSubmit}
              disabled={!uploadFile || !uploadTitle.trim()}
            >
              <Upload size={14} />
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Document Preview Modal ────────────────────────────── */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title="Document Details"
        size="lg"
      >
        {previewDoc && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <File
                size={32}
                className={FILE_TYPE_COLORS[previewDoc.fileType] || 'text-gray-400'}
              />
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {previewDoc.title}
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                  {previewDoc.fileName}
                </p>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{previewDoc.category}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">File Size</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{previewDoc.fileSize}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Uploaded By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{previewDoc.uploadedBy}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Upload Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{previewDoc.uploadedAt}</p>
              </div>
            </div>

            {/* Description */}
            {previewDoc.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {previewDoc.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {previewDoc.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {previewDoc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button size="sm" variant="secondary" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
              <Button size="sm" variant="primary">
                <Download size={14} />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Generated Report Detail Modal ──────────────────────── */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `Report — ${selectedReport.title}` : ''}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-5">
            {/* Status & Format Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle2 size={14} />
                Completed
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {selectedReport.format}
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Generated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedReport.generatedAt}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Generated By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedReport.generatedBy}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">File Size</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedReport.fileSize}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pages / Sheets</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedReport.pages}</p>
              </div>
            </div>

            {/* Scope */}
            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
              <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Report Scope</p>
              <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mt-0.5">{selectedReport.scope}</p>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button size="sm" variant="secondary" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
              <Button size="sm" variant="primary">
                <Download size={14} />
                Download {selectedReport.format}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
