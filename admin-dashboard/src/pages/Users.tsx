import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, Database, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, X, FileText, MapPin, Calendar, Cpu, Shield, Zap, Download, ArrowUpDown, AlertTriangle, Activity, DollarSign } from 'lucide-react';
import { getAssets } from '../services/assetService';
import { formatDate, formatCurrency } from '../utils/helpers';
import { RISK_COLORS, ASSET_CLASS_COLORS, VOLTAGE_CLASS_COLORS, HEALTH_THRESHOLDS } from '../utils/constants';
import Card, { CardHeader } from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import type { Asset, AssetClass, VoltageClass, RiskLevel } from '../types';

const healthScoreColor = (score: number): string => {
  if (score < HEALTH_THRESHOLDS.CRITICAL) return 'text-red-500';
  if (score < HEALTH_THRESHOLDS.HIGH) return 'text-orange-500';
  if (score < HEALTH_THRESHOLDS.MEDIUM) return 'text-yellow-500';
  return 'text-green-500';
};

const assetTypes: AssetClass[] = [
  'Power Transformer',
  'Circuit Breaker',
  'Dist Transformer',
  'Disconnect Switch',
  'Capacitor Bank',
  'Voltage Regulator',
  'Recloser',
  'Underground Cable',
];

const voltageClasses: VoltageClass[] = ['Transmission', 'Sub-Transmission', 'Distribution'];
const riskLevels: RiskLevel[] = ['critical', 'high', 'medium', 'low'];

const RISK_LEVEL_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

type SortKey = 'id' | 'type' | 'location' | 'age' | 'healthScore' | 'riskLevel' | 'lastAssessment';
type SortDir = 'asc' | 'desc';

export default function Assets() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [voltageFilter, setVoltageFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalAsset, setModalAsset] = useState<Asset | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [assessmentCondition, setAssessmentCondition] = useState('fair');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Fetch assets from service (Supabase or mock fallback)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getAssets().then((data) => {
      if (!cancelled) {
        setAllAssets(data);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      const matchesSearch =
        asset.id.toLowerCase().includes(search.toLowerCase()) ||
        asset.type.toLowerCase().includes(search.toLowerCase()) ||
        asset.location.toLowerCase().includes(search.toLowerCase()) ||
        asset.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      const matchesVoltage = voltageFilter === 'all' || asset.voltageClass === voltageFilter;
      const matchesRisk = riskFilter === 'all' || asset.riskLevel === riskFilter;
      return matchesSearch && matchesType && matchesVoltage && matchesRisk;
    });
  }, [allAssets, search, typeFilter, voltageFilter, riskFilter]);

  const sortedAssets = useMemo(() => {
    if (!sortKey) return filteredAssets;
    const sorted = [...filteredAssets];
    const dir = sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'id':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'location':
          cmp = a.location.localeCompare(b.location);
          break;
        case 'age':
          cmp = a.age - b.age;
          break;
        case 'healthScore':
          cmp = a.healthScore - b.healthScore;
          break;
        case 'riskLevel':
          cmp = (RISK_LEVEL_ORDER[a.riskLevel] ?? 0) - (RISK_LEVEL_ORDER[b.riskLevel] ?? 0);
          break;
        case 'lastAssessment':
          cmp = a.lastAssessment.localeCompare(b.lastAssessment);
          break;
      }
      return cmp * dir;
    });
    return sorted;
  }, [filteredAssets, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedAssets.length / pageSize);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAssets.slice(start, start + pageSize);
  }, [sortedAssets, currentPage, pageSize]);

  // Reset to page 1 when filters or sort change
  useEffect(() => { setCurrentPage(1); }, [search, typeFilter, voltageFilter, riskFilter, pageSize, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  };

  const activeFilters = useMemo(() => {
    const filters: { label: string; key: string; value: string }[] = [];
    if (search) filters.push({ label: `Search: "${search}"`, key: 'search', value: search });
    if (typeFilter !== 'all') filters.push({ label: `Type: ${typeFilter}`, key: 'type', value: typeFilter });
    if (voltageFilter !== 'all') filters.push({ label: `Voltage: ${voltageFilter}`, key: 'voltage', value: voltageFilter });
    if (riskFilter !== 'all') filters.push({ label: `Risk: ${riskFilter}`, key: 'risk', value: riskFilter });
    return filters;
  }, [search, typeFilter, voltageFilter, riskFilter]);

  const clearFilter = useCallback((key: string) => {
    if (key === 'search') setSearch('');
    if (key === 'type') setTypeFilter('all');
    if (key === 'voltage') setVoltageFilter('all');
    if (key === 'risk') setRiskFilter('all');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setVoltageFilter('all');
    setRiskFilter('all');
  }, []);

  const exportToExcel = useCallback(() => {
    const dataToExport = selectedIds.size > 0
      ? filteredAssets.filter((a) => selectedIds.has(a.id))
      : filteredAssets;

    const headers = [
      'Asset ID', 'Type', 'Manufacturer', 'Voltage', 'Capacity', 'Location',
      'Commission Date', 'Age (yrs)', 'Health Score', 'Risk Score', 'Risk Level',
      'Voltage Class', 'Estimated Cost', 'Last Assessment', 'Customers Affected',
    ];

    const csvRows = [
      headers.join(','),
      ...dataToExport.map((a) =>
        [
          a.id,
          `"${a.type}"`,
          `"${a.manufacturer}"`,
          `"${a.voltage}"`,
          `"${a.capacity}"`,
          `"${a.location}"`,
          a.commissionDate,
          a.age,
          a.healthScore,
          a.riskScore,
          a.riskLevel,
          a.voltageClass,
          a.estimatedCost,
          a.lastAssessment,
          a.customersAffected ?? '',
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset_registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredAssets, selectedIds]);

  // ─── KPI Summary ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = allAssets.length;
    if (total === 0) return { total: 0, critical: 0, highRisk: 0, avgHealth: 0, avgAge: 0, totalReplacementCost: 0 };
    const critical = allAssets.filter((a) => a.riskLevel === 'critical').length;
    const highRisk = allAssets.filter((a) => a.riskLevel === 'high').length;
    const avgHealth = Math.round(allAssets.reduce((sum, a) => sum + a.healthScore, 0) / total);
    const avgAge = Math.round(allAssets.reduce((sum, a) => sum + a.age, 0) / total * 10) / 10;
    const totalReplacementCost = allAssets.reduce((sum, a) => sum + a.estimatedCost, 0);
    return { total, critical, highRisk, avgHealth, avgAge, totalReplacementCost };
  }, [allAssets]);

  const SortHeader = ({ label, colKey, className }: { label: string; colKey: SortKey; className?: string }) => (
    <button
      type="button"
      onClick={() => handleSort(colKey)}
      className={`inline-flex items-center gap-1 group cursor-pointer select-none ${className || ''}`}
    >
      {label}
      {sortKey === colKey ? (
        sortDir === 'asc' ? (
          <ChevronUp size={14} className="text-cyan-500" />
        ) : (
          <ChevronDown size={14} className="text-cyan-500" />
        )
      ) : (
        <ArrowUpDown size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={filteredAssets.length > 0 && selectedIds.size === filteredAssets.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-gray-900"
        />
      ) as unknown as string,
      render: (asset: Asset) => (
        <input
          type="checkbox"
          checked={selectedIds.has(asset.id)}
          onChange={() => toggleSelect(asset.id)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-gray-900"
        />
      ),
    },
    {
      key: 'id',
      header: (<SortHeader label="Asset ID" colKey="id" />) as unknown as string,
      render: (asset: Asset) => (
        <button
          onClick={() => { setModalAsset(asset); setAssessmentNotes(''); setAssessmentCondition('fair'); }}
          className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
        >
          {asset.id}
        </button>
      ),
    },
    {
      key: 'type',
      header: (<SortHeader label="Type" colKey="type" />) as unknown as string,
      render: (asset: Asset) => {
        const colors = ASSET_CLASS_COLORS[asset.type];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors?.bg || ''} ${colors?.text || ''} ${colors?.darkBg || ''} ${colors?.darkText || ''}`}>
            {asset.type}
          </span>
        );
      },
    },
    {
      key: 'location',
      header: (<SortHeader label="Location" colKey="location" />) as unknown as string,
      render: (asset: Asset) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">{asset.location}</span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'age',
      header: (<SortHeader label="Age (yrs)" colKey="age" />) as unknown as string,
      render: (asset: Asset) => (
        <span className="text-gray-700 dark:text-gray-300 font-medium">{asset.age}</span>
      ),
    },
    {
      key: 'healthScore',
      header: (<SortHeader label="Health Score" colKey="healthScore" />) as unknown as string,
      render: (asset: Asset) => (
        <span className={`font-bold text-sm ${healthScoreColor(asset.healthScore)}`}>
          {asset.healthScore}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      header: (<SortHeader label="Risk Level" colKey="riskLevel" />) as unknown as string,
      render: (asset: Asset) => {
        const colors = RISK_COLORS[asset.riskLevel];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`} />
            {asset.riskLevel}
          </span>
        );
      },
    },
    {
      key: 'lastAssessment',
      header: (<SortHeader label="Last Assessment" colKey="lastAssessment" />) as unknown as string,
      render: (asset: Asset) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(asset.lastAssessment)}</span>
      ),
      className: 'hidden xl:table-cell',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={24} className="text-cyan-500" />
            Asset Registry
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive inventory of all monitored utility assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button size="sm" onClick={() => setSelectedIds(new Set())}>
              <ClipboardList size={16} />
              Add {selectedIds.size} to Work Queue
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={exportToExcel}>
            <Download size={16} />
            Export {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'All'} to CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Database size={14} className="text-cyan-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Assets</p>
          </div>
          <p className="text-xl font-bold text-cyan-500">{kpis.total.toLocaleString()}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Critical Risk</p>
          </div>
          <p className="text-xl font-bold text-red-500">{kpis.critical.toLocaleString()}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-orange-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">High Risk</p>
          </div>
          <p className="text-xl font-bold text-orange-500">{kpis.highRisk.toLocaleString()}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-green-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Health</p>
          </div>
          <p className="text-xl font-bold text-green-500">{kpis.avgHealth}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-purple-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Age (yrs)</p>
          </div>
          <p className="text-xl font-bold text-purple-500">{kpis.avgAge}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-amber-500" />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Replacement Cost</p>
          </div>
          <p className="text-xl font-bold text-amber-500">{formatCurrency(kpis.totalReplacementCost)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by ID, type, location, manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Types</option>
                {assetTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={voltageFilter}
                onChange={(e) => setVoltageFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Voltage Classes</option>
                {voltageClasses.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none capitalize"
              >
                <option value="all">All Risk Levels</option>
                {riskLevels.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Showing {filteredAssets.length} of {allAssets.length} assets
          {selectedIds.size > 0 && (
            <span className="ml-2 text-cyan-600 dark:text-cyan-400 font-medium">
              ({selectedIds.size} selected)
            </span>
          )}
        </p>

        {/* Active Filter Pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Filters:</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
              >
                {f.label}
                <button
                  type="button"
                  onClick={() => clearFilter(f.key)}
                  className="p-0.5 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline underline-offset-2 ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card padding={false}>
        <Table<Asset>
          columns={columns}
          data={paginatedAssets}
          keyExtractor={(asset) => asset.id}
        />

        {/* Pagination */}
        {sortedAssets.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedAssets.length)} of {sortedAssets.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Asset Detail Modal */}
      <Modal
        isOpen={modalAsset !== null}
        onClose={() => setModalAsset(null)}
        title={modalAsset ? `Asset Detail - ${modalAsset.id}` : ''}
        size="lg"
      >
        {modalAsset && (
          <div className="space-y-6">
            {/* Asset Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Cpu size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{modalAsset.type}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Voltage / Capacity</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{modalAsset.voltage} / {modalAsset.capacity}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{modalAsset.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manufacturer</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{modalAsset.manufacturer}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Commissioned / Age</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(modalAsset.commissionDate)} ({modalAsset.age} yrs)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Replacement Cost</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(modalAsset.estimatedCost)}</p>
                </div>
              </div>
            </div>

            {/* Health & Risk Meters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Health Score</p>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold ${healthScoreColor(modalAsset.healthScore)}`}>{modalAsset.healthScore}</span>
                  <span className="text-sm text-gray-400 mb-1">/ 100</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${modalAsset.healthScore}%` }} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Risk Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-red-500">{modalAsset.riskScore}</span>
                  <span className="text-sm text-gray-400 mb-1">/ 100</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: `${modalAsset.riskScore}%` }} />
                </div>
              </div>
            </div>

            {/* Voltage Class & Customers */}
            <div className="flex gap-3">
              {(() => {
                const vc = VOLTAGE_CLASS_COLORS[modalAsset.voltageClass];
                return (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${vc?.bg || ''} ${vc?.text || ''} ${vc?.darkBg || ''} ${vc?.darkText || ''}`}>
                    {modalAsset.voltageClass}
                  </span>
                );
              })()}
              {modalAsset.customersAffected && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {modalAsset.customersAffected.toLocaleString()} customers affected
                </span>
              )}
            </div>

            {/* Engineering Assessment Form */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Engineering Assessment</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Overall Condition
                  </label>
                  <select
                    value={assessmentCondition}
                    onChange={(e) => setAssessmentCondition(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="good">Good - Normal operation expected</option>
                    <option value="fair">Fair - Monitor closely</option>
                    <option value="poor">Poor - Plan replacement</option>
                    <option value="critical">Critical - Immediate action required</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assessment Notes
                  </label>
                  <textarea
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter engineering assessment notes, findings, and recommendations..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModalAsset(null)}>
                <X size={16} />
                Cancel
              </Button>
              <Button onClick={() => setModalAsset(null)}>
                <ClipboardList size={16} />
                Save Assessment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
