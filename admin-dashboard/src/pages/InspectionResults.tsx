import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X, Download, ArrowUpDown, ClipboardCheck, Eye } from 'lucide-react';
import { getInspections } from '../services/inspectionService';
import { formatDate } from '../utils/helpers';
import { ASSET_CLASS_COLORS } from '../utils/constants';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import type { InspectionResult, InspectionType, OverallCondition, AssetClass } from '../types';

// ─── Constants ──────────────────────────────────────────────────
const inspectionTypes: InspectionType[] = [
  'Visual', 'Thermal Imaging', 'Ultrasonic', 'Oil Analysis', 'Partial Discharge', 'Vibration Analysis',
];

const conditions: OverallCondition[] = ['Good', 'Fair', 'Poor', 'Critical'];

const priorities = ['Routine', 'Priority', 'Urgent', 'Emergency'] as const;

const assetTypes: AssetClass[] = [
  'Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Disconnect Switch',
  'Capacitor Bank', 'Voltage Regulator', 'Recloser', 'Underground Cable',
];

const CONDITION_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string; dot: string }> = {
  Good: { bg: 'bg-green-50', text: 'text-green-700', darkBg: 'dark:bg-green-950', darkText: 'dark:text-green-300', dot: 'bg-green-500' },
  Fair: { bg: 'bg-yellow-50', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-950', darkText: 'dark:text-yellow-300', dot: 'bg-yellow-500' },
  Poor: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'dark:bg-orange-950', darkText: 'dark:text-orange-300', dot: 'bg-orange-500' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'dark:bg-red-950', darkText: 'dark:text-red-300', dot: 'bg-red-500' },
};

const PRIORITY_COLORS: Record<string, string> = {
  Routine: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Priority: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Emergency: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const CONDITION_ORDER: Record<string, number> = { Critical: 4, Poor: 3, Fair: 2, Good: 1 };
const PRIORITY_ORDER: Record<string, number> = { Emergency: 4, Urgent: 3, Priority: 2, Routine: 1 };

type SortKey = 'id' | 'assetId' | 'assetType' | 'location' | 'inspector' | 'inspectionDate' | 'inspectionType' | 'overallCondition' | 'priority';
type SortDir = 'asc' | 'desc';

export default function InspectionResults() {
  const [allRecords, setAllRecords] = useState<InspectionResult[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [inspTypeFilter, setInspTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [modalRecord, setModalRecord] = useState<InspectionResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    let cancelled = false;
    getInspections().then((data) => { if (!cancelled) setAllRecords(data); });
    return () => { cancelled = true; };
  }, []);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch =
        r.id.toLowerCase().includes(s) ||
        r.assetId.toLowerCase().includes(s) ||
        r.location.toLowerCase().includes(s) ||
        r.inspector.toLowerCase().includes(s) ||
        r.findings.toLowerCase().includes(s);
      const matchesType = typeFilter === 'all' || r.assetType === typeFilter;
      const matchesCondition = conditionFilter === 'all' || r.overallCondition === conditionFilter;
      const matchesInspType = inspTypeFilter === 'all' || r.inspectionType === inspTypeFilter;
      const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
      return matchesSearch && matchesType && matchesCondition && matchesInspType && matchesPriority;
    });
  }, [allRecords, search, typeFilter, conditionFilter, inspTypeFilter, priorityFilter]);

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
        case 'inspector': cmp = a.inspector.localeCompare(b.inspector); break;
        case 'inspectionDate': cmp = a.inspectionDate.localeCompare(b.inspectionDate); break;
        case 'inspectionType': cmp = a.inspectionType.localeCompare(b.inspectionType); break;
        case 'overallCondition': cmp = (CONDITION_ORDER[a.overallCondition] ?? 0) - (CONDITION_ORDER[b.overallCondition] ?? 0); break;
        case 'priority': cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0); break;
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

  useEffect(() => { setCurrentPage(1); }, [search, typeFilter, conditionFilter, inspTypeFilter, priorityFilter, pageSize, sortKey, sortDir]);

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
    if (typeFilter !== 'all') filters.push({ label: `Asset Type: ${typeFilter}`, key: 'type' });
    if (conditionFilter !== 'all') filters.push({ label: `Condition: ${conditionFilter}`, key: 'condition' });
    if (inspTypeFilter !== 'all') filters.push({ label: `Inspection: ${inspTypeFilter}`, key: 'inspType' });
    if (priorityFilter !== 'all') filters.push({ label: `Priority: ${priorityFilter}`, key: 'priority' });
    return filters;
  }, [search, typeFilter, conditionFilter, inspTypeFilter, priorityFilter]);

  const clearFilter = useCallback((key: string) => {
    if (key === 'search') setSearch('');
    if (key === 'type') setTypeFilter('all');
    if (key === 'condition') setConditionFilter('all');
    if (key === 'inspType') setInspTypeFilter('all');
    if (key === 'priority') setPriorityFilter('all');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setConditionFilter('all');
    setInspTypeFilter('all');
    setPriorityFilter('all');
  }, []);

  const exportToCSV = useCallback(() => {
    const headers = [
      'Inspection ID', 'Asset ID', 'Asset Type', 'Location', 'Inspector',
      'Inspection Date', 'Inspection Type', 'Condition', 'Priority',
      'Findings', 'Recommendations', 'Next Inspection Due',
    ];
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          r.id, r.assetId, `"${r.assetType}"`, `"${r.location}"`, `"${r.inspector}"`,
          r.inspectionDate, `"${r.inspectionType}"`, r.overallCondition, r.priority,
          `"${r.findings.replace(/"/g, '""')}"`, `"${r.recommendations.replace(/"/g, '""')}"`, r.nextInspectionDue,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inspection_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredRecords]);

  // ─── KPI Summary ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) return { total: 0, critical: 0, poor: 0, overdue: 0 };
    const critical = filteredRecords.filter((r) => r.overallCondition === 'Critical').length;
    const poor = filteredRecords.filter((r) => r.overallCondition === 'Poor').length;
    const overdue = filteredRecords.filter((r) => r.nextInspectionDue < '2026-02-01').length;
    return { total, critical, poor, overdue };
  }, [filteredRecords]);

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
      header: (<SortHeader label="Inspection ID" colKey="id" />) as unknown as string,
      render: (r: InspectionResult) => (
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
      render: (r: InspectionResult) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{r.assetId}</span>
      ),
    },
    {
      key: 'assetType',
      header: (<SortHeader label="Asset Type" colKey="assetType" />) as unknown as string,
      render: (r: InspectionResult) => {
        const colors = ASSET_CLASS_COLORS[r.assetType];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors?.bg || ''} ${colors?.text || ''} ${colors?.darkBg || ''} ${colors?.darkText || ''}`}>
            {r.assetType}
          </span>
        );
      },
    },
    {
      key: 'inspector',
      header: (<SortHeader label="Inspector" colKey="inspector" />) as unknown as string,
      render: (r: InspectionResult) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{r.inspector}</span>
      ),
      className: 'hidden xl:table-cell',
    },
    {
      key: 'inspectionDate',
      header: (<SortHeader label="Date" colKey="inspectionDate" />) as unknown as string,
      render: (r: InspectionResult) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(r.inspectionDate)}</span>
      ),
    },
    {
      key: 'inspectionType',
      header: (<SortHeader label="Type" colKey="inspectionType" />) as unknown as string,
      render: (r: InspectionResult) => (
        <span className="text-gray-600 dark:text-gray-300 text-sm">{r.inspectionType}</span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'overallCondition',
      header: (<SortHeader label="Condition" colKey="overallCondition" />) as unknown as string,
      render: (r: InspectionResult) => {
        const c = CONDITION_COLORS[r.overallCondition];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.dot}`} />
            {r.overallCondition}
          </span>
        );
      },
    },
    {
      key: 'priority',
      header: (<SortHeader label="Priority" colKey="priority" />) as unknown as string,
      render: (r: InspectionResult) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>
          {r.priority}
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
            <ClipboardCheck size={24} className="text-cyan-500" />
            Inspection Results
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Field inspection records across all monitored utility assets
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportToCSV}>
          <Download size={16} />
          Export to CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Inspections', value: kpis.total.toLocaleString(), color: 'text-cyan-500' },
          { label: 'Critical Findings', value: kpis.critical.toLocaleString(), color: 'text-red-500' },
          { label: 'Poor Condition', value: kpis.poor.toLocaleString(), color: 'text-orange-500' },
          { label: 'Overdue Re-inspect', value: kpis.overdue.toLocaleString(), color: 'text-yellow-500' },
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
              placeholder="Search by ID, asset, location, inspector, findings..."
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
                <option value="all">All Asset Types</option>
                {assetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={inspTypeFilter}
                onChange={(e) => setInspTypeFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Inspection Types</option>
                {inspectionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Conditions</option>
                {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Priorities</option>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Showing {filteredRecords.length} of {allRecords.length} inspection records
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
        <Table<InspectionResult>
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
        title={modalRecord ? `Inspection Detail - ${modalRecord.id}` : ''}
        size="lg"
      >
        {modalRecord && (
          <div className="space-y-6">
            {/* Header Badges */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const c = CONDITION_COLORS[modalRecord.overallCondition];
                return (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${c.dot}`} />
                    {modalRecord.overallCondition}
                  </span>
                );
              })()}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_COLORS[modalRecord.priority]}`}>
                {modalRecord.priority}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                {modalRecord.inspectionType}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Inspector</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.inspector}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Inspection Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(modalRecord.inspectionDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Next Inspection Due</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(modalRecord.nextInspectionDue)}</p>
              </div>
            </div>

            {/* Findings */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={16} className="text-gray-500 dark:text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Findings</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{modalRecord.findings}</p>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Recommendations</h4>
              <p className="text-sm text-amber-700 dark:text-amber-200">{modalRecord.recommendations}</p>
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
