import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X, Download, ArrowUpDown, FlaskConical } from 'lucide-react';
import { mockDGATests } from '../data/mockDGATests';
import { formatDate } from '../utils/helpers';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import type { DGATestResult, DGADiagnosis, DGAFaultType, DGATrend } from '../types';

// ─── Constants ──────────────────────────────────────────────────
const diagnoses: DGADiagnosis[] = ['Normal', 'Caution', 'Warning', 'Critical'];
const faultTypes: DGAFaultType[] = ['Normal', 'Thermal Fault', 'Electrical Fault', 'Arcing', 'Partial Discharge', 'Cellulose Degradation'];
const trends: DGATrend[] = ['Stable', 'Improving', 'Deteriorating'];
const transformerTypes = ['Power Transformer', 'Dist Transformer'] as const;

const DIAGNOSIS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string; dot: string }> = {
  Normal: { bg: 'bg-green-50', text: 'text-green-700', darkBg: 'dark:bg-green-950', darkText: 'dark:text-green-300', dot: 'bg-green-500' },
  Caution: { bg: 'bg-yellow-50', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-950', darkText: 'dark:text-yellow-300', dot: 'bg-yellow-500' },
  Warning: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'dark:bg-orange-950', darkText: 'dark:text-orange-300', dot: 'bg-orange-500' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'dark:bg-red-950', darkText: 'dark:text-red-300', dot: 'bg-red-500' },
};

const TREND_COLORS: Record<string, string> = {
  Stable: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Improving: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Deteriorating: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const FAULT_COLORS: Record<string, string> = {
  Normal: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Thermal Fault': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Electrical Fault': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Arcing: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'Partial Discharge': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Cellulose Degradation': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

const DIAGNOSIS_ORDER: Record<string, number> = { Critical: 4, Warning: 3, Caution: 2, Normal: 1 };

type SortKey = 'id' | 'assetId' | 'assetType' | 'location' | 'sampleDate' | 'lab' | 'tdcg' | 'diagnosis' | 'faultType' | 'trend' | 'acetylene';
type SortDir = 'asc' | 'desc';

export default function DGATestResults() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>('all');
  const [faultFilter, setFaultFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [modalRecord, setModalRecord] = useState<DGATestResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filteredRecords = useMemo(() => {
    return mockDGATests.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch =
        r.id.toLowerCase().includes(s) ||
        r.assetId.toLowerCase().includes(s) ||
        r.location.toLowerCase().includes(s) ||
        r.lab.toLowerCase().includes(s);
      const matchesType = typeFilter === 'all' || r.assetType === typeFilter;
      const matchesDiagnosis = diagnosisFilter === 'all' || r.diagnosis === diagnosisFilter;
      const matchesFault = faultFilter === 'all' || r.faultType === faultFilter;
      const matchesTrend = trendFilter === 'all' || r.trend === trendFilter;
      return matchesSearch && matchesType && matchesDiagnosis && matchesFault && matchesTrend;
    });
  }, [search, typeFilter, diagnosisFilter, faultFilter, trendFilter]);

  const sortedRecords = useMemo(() => {
    if (!sortKey) return filteredRecords;
    const sorted = [...filteredRecords];
    const dir = sortDir === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'id': cmp = a.id.localeCompare(b.id); break;
        case 'assetId': cmp = a.assetId.localeCompare(b.assetId); break;
        case 'assetType': cmp = a.assetType.localeCompare(b.assetType); break;
        case 'location': cmp = a.location.localeCompare(b.location); break;
        case 'sampleDate': cmp = a.sampleDate.localeCompare(b.sampleDate); break;
        case 'lab': cmp = a.lab.localeCompare(b.lab); break;
        case 'tdcg': cmp = a.tdcg - b.tdcg; break;
        case 'acetylene': cmp = a.acetylene - b.acetylene; break;
        case 'diagnosis': cmp = (DIAGNOSIS_ORDER[a.diagnosis] ?? 0) - (DIAGNOSIS_ORDER[b.diagnosis] ?? 0); break;
        case 'faultType': cmp = a.faultType.localeCompare(b.faultType); break;
        case 'trend': cmp = a.trend.localeCompare(b.trend); break;
      }
      return cmp * dir;
    });
    return sorted;
  }, [filteredRecords, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, typeFilter, diagnosisFilter, faultFilter, trendFilter, pageSize, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; key: string }[] = [];
    if (search) filters.push({ label: `Search: "${search}"`, key: 'search' });
    if (typeFilter !== 'all') filters.push({ label: `Type: ${typeFilter}`, key: 'type' });
    if (diagnosisFilter !== 'all') filters.push({ label: `Diagnosis: ${diagnosisFilter}`, key: 'diagnosis' });
    if (faultFilter !== 'all') filters.push({ label: `Fault: ${faultFilter}`, key: 'fault' });
    if (trendFilter !== 'all') filters.push({ label: `Trend: ${trendFilter}`, key: 'trend' });
    return filters;
  }, [search, typeFilter, diagnosisFilter, faultFilter, trendFilter]);

  const clearFilter = useCallback((key: string) => {
    if (key === 'search') setSearch('');
    if (key === 'type') setTypeFilter('all');
    if (key === 'diagnosis') setDiagnosisFilter('all');
    if (key === 'fault') setFaultFilter('all');
    if (key === 'trend') setTrendFilter('all');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setDiagnosisFilter('all');
    setFaultFilter('all');
    setTrendFilter('all');
  }, []);

  const exportToCSV = useCallback(() => {
    const headers = [
      'Test ID', 'Asset ID', 'Asset Type', 'Location', 'Sample Date', 'Lab',
      'H2 (ppm)', 'CH4 (ppm)', 'C2H6 (ppm)', 'C2H4 (ppm)', 'C2H2 (ppm)',
      'CO (ppm)', 'CO2 (ppm)', 'TDCG (ppm)', 'Oil Temp (°C)', 'Moisture (ppm)',
      'Diagnosis', 'Fault Type', 'Trend',
    ];
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          r.id, r.assetId, `"${r.assetType}"`, `"${r.location}"`, r.sampleDate, `"${r.lab}"`,
          r.hydrogen, r.methane, r.ethane, r.ethylene, r.acetylene,
          r.co, r.co2, r.tdcg, r.oilTemperature, r.moistureContent,
          r.diagnosis, `"${r.faultType}"`, r.trend,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dga_test_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredRecords]);

  // ─── KPI Summary ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = mockDGATests.length;
    const critical = mockDGATests.filter((r) => r.diagnosis === 'Critical').length;
    const warning = mockDGATests.filter((r) => r.diagnosis === 'Warning').length;
    const deteriorating = mockDGATests.filter((r) => r.trend === 'Deteriorating').length;
    const avgTDCG = Math.round(mockDGATests.reduce((sum, r) => sum + r.tdcg, 0) / total);
    return { total, critical, warning, deteriorating, avgTDCG };
  }, []);

  // ─── Gas level color helper ───────────────────────────────────
  const gasColor = (value: number, thresholds: [number, number, number]) => {
    if (value >= thresholds[2]) return 'text-red-500 font-bold';
    if (value >= thresholds[1]) return 'text-orange-500 font-semibold';
    if (value >= thresholds[0]) return 'text-yellow-600';
    return 'text-gray-600 dark:text-gray-400';
  };

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
      key: 'id',
      header: (<SortHeader label="Test ID" colKey="id" />) as unknown as string,
      render: (r: DGATestResult) => (
        <button
          onClick={() => setModalRecord(r)}
          className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
        >
          {r.id}
        </button>
      ),
    },
    {
      key: 'assetId',
      header: (<SortHeader label="Asset ID" colKey="assetId" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{r.assetId}</span>
      ),
    },
    {
      key: 'assetType',
      header: (<SortHeader label="Type" colKey="assetType" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.assetType === 'Power Transformer' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}`}>
          {r.assetType === 'Power Transformer' ? 'Power TX' : 'Dist TX'}
        </span>
      ),
    },
    {
      key: 'sampleDate',
      header: (<SortHeader label="Sample Date" colKey="sampleDate" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(r.sampleDate)}</span>
      ),
    },
    {
      key: 'tdcg',
      header: (<SortHeader label="TDCG (ppm)" colKey="tdcg" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className={`text-sm font-mono ${gasColor(r.tdcg, [500, 1000, 2000])}`}>
          {r.tdcg.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'acetylene',
      header: (<SortHeader label="C₂H₂ (ppm)" colKey="acetylene" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className={`text-sm font-mono ${gasColor(r.acetylene, [2, 10, 35])}`}>
          {r.acetylene}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      header: (<SortHeader label="Diagnosis" colKey="diagnosis" />) as unknown as string,
      render: (r: DGATestResult) => {
        const c = DIAGNOSIS_COLORS[r.diagnosis];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.dot}`} />
            {r.diagnosis}
          </span>
        );
      },
    },
    {
      key: 'faultType',
      header: (<SortHeader label="Fault Type" colKey="faultType" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${FAULT_COLORS[r.faultType] || ''}`}>
          {r.faultType}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'trend',
      header: (<SortHeader label="Trend" colKey="trend" />) as unknown as string,
      render: (r: DGATestResult) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TREND_COLORS[r.trend]}`}>
          {r.trend}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FlaskConical size={24} className="text-cyan-500" />
            DGA Test Results
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dissolved Gas Analysis results for power and distribution transformers
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportToCSV}>
          <Download size={16} />
          Export to CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tests', value: kpis.total.toLocaleString(), color: 'text-cyan-500' },
          { label: 'Critical', value: kpis.critical.toLocaleString(), color: 'text-red-500' },
          { label: 'Warning', value: kpis.warning.toLocaleString(), color: 'text-orange-500' },
          { label: 'Deteriorating', value: kpis.deteriorating.toLocaleString(), color: 'text-yellow-500' },
          { label: 'Avg TDCG (ppm)', value: kpis.avgTDCG.toLocaleString(), color: 'text-purple-500' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by ID, asset, location, lab..."
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
                <option value="all">All Transformer Types</option>
                {transformerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={diagnosisFilter}
                onChange={(e) => setDiagnosisFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Diagnoses</option>
                {diagnoses.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={faultFilter}
                onChange={(e) => setFaultFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Fault Types</option>
                {faultTypes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Trends</option>
                {trends.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Showing {filteredRecords.length} of {mockDGATests.length} test results
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
                <button type="button" onClick={() => clearFilter(f.key)} className="p-0.5 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
            <button type="button" onClick={clearAllFilters} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline underline-offset-2 ml-1">
              Clear All
            </button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card padding={false}>
        <Table<DGATestResult>
          columns={columns}
          data={paginatedRecords}
          keyExtractor={(r) => r.id}
        />

        {/* Pagination */}
        {sortedRecords.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedRecords.length)} of {sortedRecords.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">First</button>
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">Last</button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={modalRecord !== null}
        onClose={() => setModalRecord(null)}
        title={modalRecord ? `DGA Test Detail - ${modalRecord.id}` : ''}
        size="lg"
      >
        {modalRecord && (
          <div className="space-y-6">
            {/* Header Badges */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const c = DIAGNOSIS_COLORS[modalRecord.diagnosis];
                return (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${c.dot}`} />
                    {modalRecord.diagnosis}
                  </span>
                );
              })()}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${FAULT_COLORS[modalRecord.faultType] || ''}`}>
                {modalRecord.faultType}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${TREND_COLORS[modalRecord.trend]}`}>
                {modalRecord.trend}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asset ID</p>
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{modalRecord.assetId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asset Type</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.assetType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Laboratory</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.lab}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sample Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(modalRecord.sampleDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Oil Temperature</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.oilTemperature}°C</p>
              </div>
            </div>

            {/* Gas Concentrations Table */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Dissolved Gas Concentrations (ppm)</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Hydrogen (H₂)', value: modalRecord.hydrogen, thresholds: [100, 300, 700] as [number, number, number] },
                  { label: 'Methane (CH₄)', value: modalRecord.methane, thresholds: [50, 150, 400] as [number, number, number] },
                  { label: 'Ethane (C₂H₆)', value: modalRecord.ethane, thresholds: [30, 80, 200] as [number, number, number] },
                  { label: 'Ethylene (C₂H₄)', value: modalRecord.ethylene, thresholds: [30, 100, 300] as [number, number, number] },
                  { label: 'Acetylene (C₂H₂)', value: modalRecord.acetylene, thresholds: [2, 10, 35] as [number, number, number] },
                  { label: 'CO', value: modalRecord.co, thresholds: [400, 700, 1000] as [number, number, number] },
                  { label: 'CO₂', value: modalRecord.co2, thresholds: [5000, 8000, 12000] as [number, number, number] },
                  { label: 'TDCG', value: modalRecord.tdcg, thresholds: [500, 1000, 2000] as [number, number, number] },
                ].map((gas) => (
                  <div key={gas.label} className="p-2 rounded bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{gas.label}</p>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${gasColor(gas.value, gas.thresholds)}`}>
                      {gas.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Moisture */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">Moisture Content</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200 mt-0.5">{modalRecord.moistureContent} ppm</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400">Oil Temperature</p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-200 mt-0.5">{modalRecord.oilTemperature}°C</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModalRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
