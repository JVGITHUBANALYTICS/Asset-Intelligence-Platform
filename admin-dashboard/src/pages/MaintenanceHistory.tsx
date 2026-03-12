import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X, Download, ArrowUpDown, Wrench, Clock, DollarSign } from 'lucide-react';
import { getMaintenanceRecords } from '../services/maintenanceService';
import { formatDate, formatCurrency } from '../utils/helpers';
import { ASSET_CLASS_COLORS, VOLTAGE_CLASS_COLORS } from '../utils/constants';
import Card from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import type { MaintenanceRecord, MaintenanceCategory, MaintenanceStatus, AssetClass, VoltageClass } from '../types';

// ─── Constants ──────────────────────────────────────────────────
const categories: MaintenanceCategory[] = ['Preventive', 'Repair - Planned', 'Repair - Unplanned'];
const statuses: MaintenanceStatus[] = ['Completed', 'In Progress', 'Scheduled', 'Cancelled'];

const assetTypes: AssetClass[] = [
  'Power Transformer', 'Circuit Breaker', 'Dist Transformer', 'Disconnect Switch',
  'Capacitor Bank', 'Voltage Regulator', 'Recloser', 'Underground Cable',
];

const voltageClasses: VoltageClass[] = ['Transmission', 'Sub-Transmission', 'Distribution'];

const CATEGORY_COLORS: Record<string, string> = {
  Preventive: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'Repair - Planned': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'Repair - Unplanned': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string; dot: string }> = {
  Completed: { bg: 'bg-green-50', text: 'text-green-700', darkBg: 'dark:bg-green-950', darkText: 'dark:text-green-300', dot: 'bg-green-500' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'dark:bg-blue-950', darkText: 'dark:text-blue-300', dot: 'bg-blue-500' },
  Scheduled: { bg: 'bg-yellow-50', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-950', darkText: 'dark:text-yellow-300', dot: 'bg-yellow-500' },
  Cancelled: { bg: 'bg-gray-50', text: 'text-gray-500', darkBg: 'dark:bg-gray-800', darkText: 'dark:text-gray-400', dot: 'bg-gray-400' },
};

const STATUS_ORDER: Record<string, number> = { 'In Progress': 4, Scheduled: 3, Completed: 2, Cancelled: 1 };

type SortKey = 'id' | 'assetId' | 'assetType' | 'location' | 'category' | 'workOrderType' | 'scheduledDate' | 'status' | 'duration' | 'cost';
type SortDir = 'asc' | 'desc';

export default function MaintenanceHistory() {
  const [allRecords, setAllRecords] = useState<MaintenanceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [voltageFilter, setVoltageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalRecord, setModalRecord] = useState<MaintenanceRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    let cancelled = false;
    getMaintenanceRecords().then((data) => { if (!cancelled) setAllRecords(data); });
    return () => { cancelled = true; };
  }, []);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch =
        r.id.toLowerCase().includes(s) ||
        r.assetId.toLowerCase().includes(s) ||
        r.location.toLowerCase().includes(s) ||
        r.workOrderType.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.assignedCrew.toLowerCase().includes(s);
      const matchesType = typeFilter === 'all' || r.assetType === typeFilter;
      const matchesVoltage = voltageFilter === 'all' || r.voltageClass === voltageFilter;
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesType && matchesVoltage && matchesCategory && matchesStatus;
    });
  }, [allRecords, search, typeFilter, voltageFilter, categoryFilter, statusFilter]);

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
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'workOrderType': cmp = a.workOrderType.localeCompare(b.workOrderType); break;
        case 'scheduledDate': cmp = a.scheduledDate.localeCompare(b.scheduledDate); break;
        case 'status': cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0); break;
        case 'duration': cmp = a.duration - b.duration; break;
        case 'cost': cmp = a.cost - b.cost; break;
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

  useEffect(() => { setCurrentPage(1); }, [search, typeFilter, voltageFilter, categoryFilter, statusFilter, pageSize, sortKey, sortDir]);

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
    if (voltageFilter !== 'all') filters.push({ label: `Voltage: ${voltageFilter}`, key: 'voltage' });
    if (categoryFilter !== 'all') filters.push({ label: `Category: ${categoryFilter}`, key: 'category' });
    if (statusFilter !== 'all') filters.push({ label: `Status: ${statusFilter}`, key: 'status' });
    return filters;
  }, [search, typeFilter, voltageFilter, categoryFilter, statusFilter]);

  const clearFilter = useCallback((key: string) => {
    if (key === 'search') setSearch('');
    if (key === 'type') setTypeFilter('all');
    if (key === 'voltage') setVoltageFilter('all');
    if (key === 'category') setCategoryFilter('all');
    if (key === 'status') setStatusFilter('all');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setVoltageFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
  }, []);

  const exportToCSV = useCallback(() => {
    const headers = [
      'Work Order ID', 'Asset ID', 'Asset Type', 'Voltage Class', 'Location',
      'Category', 'Work Order Type', 'Description', 'Assigned Crew',
      'Scheduled Date', 'Completed Date', 'Status', 'Duration (hrs)', 'Cost ($)',
      'Parts Used', 'Outage Required', 'Notes',
    ];
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          r.id, r.assetId, `"${r.assetType}"`, r.voltageClass, `"${r.location}"`,
          `"${r.category}"`, `"${r.workOrderType}"`, `"${r.description.replace(/"/g, '""')}"`, `"${r.assignedCrew}"`,
          r.scheduledDate, r.completedDate || '', r.status, r.duration, r.cost,
          `"${r.partsUsed.replace(/"/g, '""')}"`, r.outageRequired ? 'Yes' : 'No', `"${r.notes.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredRecords]);

  // ─── KPI Summary ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) return { total: 0, preventive: 0, unplanned: 0, inProgress: 0, totalCost: 0, avgDuration: 0 };
    const preventive = filteredRecords.filter((r) => r.category === 'Preventive').length;
    const unplanned = filteredRecords.filter((r) => r.category === 'Repair - Unplanned').length;
    const inProgress = filteredRecords.filter((r) => r.status === 'In Progress').length;
    const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
    const completed = filteredRecords.filter((r) => r.status === 'Completed');
    const avgDuration = completed.length > 0 ? Math.round(completed.reduce((sum, r) => sum + r.duration, 0) / completed.length * 10) / 10 : 0;
    return { total, preventive, unplanned, inProgress, totalCost, avgDuration };
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
      header: (<SortHeader label="Work Order" colKey="id" />) as unknown as string,
      render: (r: MaintenanceRecord) => (
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
      render: (r: MaintenanceRecord) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{r.assetId}</span>
      ),
    },
    {
      key: 'assetType',
      header: (<SortHeader label="Asset Type" colKey="assetType" />) as unknown as string,
      render: (r: MaintenanceRecord) => {
        const colors = ASSET_CLASS_COLORS[r.assetType];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors?.bg || ''} ${colors?.text || ''} ${colors?.darkBg || ''} ${colors?.darkText || ''}`}>
            {r.assetType}
          </span>
        );
      },
    },
    {
      key: 'category',
      header: (<SortHeader label="Category" colKey="category" />) as unknown as string,
      render: (r: MaintenanceRecord) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>
          {r.category}
        </span>
      ),
    },
    {
      key: 'workOrderType',
      header: (<SortHeader label="Work Type" colKey="workOrderType" />) as unknown as string,
      render: (r: MaintenanceRecord) => (
        <span className="text-gray-600 dark:text-gray-300 text-sm truncate max-w-[180px] block">{r.workOrderType}</span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'scheduledDate',
      header: (<SortHeader label="Scheduled" colKey="scheduledDate" />) as unknown as string,
      render: (r: MaintenanceRecord) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(r.scheduledDate)}</span>
      ),
    },
    {
      key: 'status',
      header: (<SortHeader label="Status" colKey="status" />) as unknown as string,
      render: (r: MaintenanceRecord) => {
        const c = STATUS_COLORS[r.status];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.dot}`} />
            {r.status}
          </span>
        );
      },
    },
    {
      key: 'cost',
      header: (<SortHeader label="Cost" colKey="cost" />) as unknown as string,
      render: (r: MaintenanceRecord) => (
        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{formatCurrency(r.cost)}</span>
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
            <Wrench size={24} className="text-cyan-500" />
            Maintenance History
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Preventive and repair maintenance records for transmission and distribution assets
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportToCSV}>
          <Download size={16} />
          Export to CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Records', value: kpis.total.toLocaleString(), color: 'text-cyan-500', icon: Wrench },
          { label: 'Preventive', value: kpis.preventive.toLocaleString(), color: 'text-blue-500', icon: Clock },
          { label: 'Unplanned Repairs', value: kpis.unplanned.toLocaleString(), color: 'text-red-500', icon: Wrench },
          { label: 'In Progress', value: kpis.inProgress.toLocaleString(), color: 'text-yellow-500', icon: Clock },
          { label: 'Total Spend', value: formatCurrency(kpis.totalCost), color: 'text-green-500', icon: DollarSign },
          { label: 'Avg Duration (hrs)', value: kpis.avgDuration.toString(), color: 'text-purple-500', icon: Clock },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon size={14} className={kpi.color} />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            </div>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by ID, asset, location, work type, crew..."
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
                value={voltageFilter}
                onChange={(e) => setVoltageFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Voltage Classes</option>
                {voltageClasses.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Showing {filteredRecords.length} of {allRecords.length} maintenance records
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
        <Table<MaintenanceRecord>
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
        title={modalRecord ? `Work Order - ${modalRecord.id}` : ''}
        size="lg"
      >
        {modalRecord && (
          <div className="space-y-6">
            {/* Header Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[modalRecord.category]}`}>
                {modalRecord.category}
              </span>
              {(() => {
                const c = STATUS_COLORS[modalRecord.status];
                return (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${c.dot}`} />
                    {modalRecord.status}
                  </span>
                );
              })()}
              {modalRecord.outageRequired && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                  Outage Required
                </span>
              )}
              {(() => {
                const vc = VOLTAGE_CLASS_COLORS[modalRecord.voltageClass];
                return (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${vc?.bg || ''} ${vc?.text || ''} ${vc?.darkBg || ''} ${vc?.darkText || ''}`}>
                    {modalRecord.voltageClass}
                  </span>
                );
              })()}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned Crew</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.assignedCrew}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(modalRecord.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{modalRecord.completedDate ? formatDate(modalRecord.completedDate) : '—'}</p>
              </div>
            </div>

            {/* Work Order Details */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{modalRecord.workOrderType}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{modalRecord.description}</p>
            </div>

            {/* Cost & Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                  <p className="text-xs text-green-600 dark:text-green-400">Cost</p>
                </div>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatCurrency(modalRecord.cost)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">Duration</p>
                </div>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{modalRecord.duration} hrs</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Outage Required</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">{modalRecord.outageRequired ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Parts Used */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Parts Used</h4>
              <p className="text-sm text-amber-700 dark:text-amber-200">{modalRecord.partsUsed}</p>
            </div>

            {/* Notes */}
            {modalRecord.notes && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Field Notes</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{modalRecord.notes}</p>
              </div>
            )}

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
