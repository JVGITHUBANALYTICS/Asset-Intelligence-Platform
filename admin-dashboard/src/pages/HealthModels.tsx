import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Brain,
  Play,
  TrendingUp,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
  Settings,
  Calendar,
  BarChart3,
  Database,
  CheckCircle2,
  Target,
  Layers,
  Users,
  FileText,
  Info,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import { useTheme } from '../hooks/useTheme';
import { getHealthModels } from '../services/healthModelService';
import type { HealthModel, ModelCategory, ModelStatus } from '../types';

const MODEL_CATEGORIES: ModelCategory[] = ['Regressor', 'Classifier', 'Clustering', 'Rule-Based', 'Physics-Based', 'Ensemble'];

const CATEGORY_COLORS: Record<ModelCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Regressor: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/40', darkText: 'dark:text-blue-300' },
  Classifier: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/40', darkText: 'dark:text-purple-300' },
  Clustering: { bg: 'bg-teal-100', text: 'text-teal-700', darkBg: 'dark:bg-teal-900/40', darkText: 'dark:text-teal-300' },
  'Rule-Based': { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-300' },
  'Physics-Based': { bg: 'bg-rose-100', text: 'text-rose-700', darkBg: 'dark:bg-rose-900/40', darkText: 'dark:text-rose-300' },
  Ensemble: { bg: 'bg-indigo-100', text: 'text-indigo-700', darkBg: 'dark:bg-indigo-900/40', darkText: 'dark:text-indigo-300' },
};

const STATUS_STYLES: Record<ModelStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-50 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', label: 'Active' },
  training: { bg: 'bg-cyan-50 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', label: 'Training' },
  draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'Draft' },
  retired: { bg: 'bg-red-50 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Retired' },
};

const radarData = [
  { metric: 'Accuracy', 'Transformer HI': 94, 'CB Failure': 91 },
  { metric: 'Coverage', 'Transformer HI': 78, 'CB Failure': 92 },
  { metric: 'Speed', 'Transformer HI': 85, 'CB Failure': 88 },
  { metric: 'Interpretability', 'Transformer HI': 72, 'CB Failure': 65 },
  { metric: 'Stability', 'Transformer HI': 90, 'CB Failure': 82 },
  { metric: 'Data Quality', 'Transformer HI': 88, 'CB Failure': 79 },
];

const accuracyBarColor = (accuracy: number): string => {
  if (accuracy >= 92) return 'bg-green-500';
  if (accuracy >= 89) return 'bg-cyan-500';
  return 'bg-yellow-500';
};

// ─── Component ──────────────────────────────────────────────────
export default function HealthModels() {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const [models, setModels] = useState<HealthModel[]>([]);

  useEffect(() => {
    getHealthModels().then(setModels);
  }, []);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailModel, setDetailModel] = useState<HealthModel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newModel, setNewModel] = useState({
    name: '',
    category: 'Regressor' as ModelCategory,
    algorithm: '',
    description: '',
    outputMetric: '',
    refreshFrequency: 'Daily',
    assetTypes: '',
  });

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.algorithm.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [models, search, categoryFilter, statusFilter]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; key: string }[] = [];
    if (search) filters.push({ label: `Search: "${search}"`, key: 'search' });
    if (categoryFilter !== 'all') filters.push({ label: `Category: ${categoryFilter}`, key: 'category' });
    if (statusFilter !== 'all') filters.push({ label: `Status: ${statusFilter}`, key: 'status' });
    return filters;
  }, [search, categoryFilter, statusFilter]);

  const clearFilter = useCallback((key: string) => {
    if (key === 'search') setSearch('');
    if (key === 'category') setCategoryFilter('all');
    if (key === 'status') setStatusFilter('all');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
  }, []);

  const handleAddModel = useCallback(() => {
    setShowAddModal(false);
    setNewModel({ name: '', category: 'Regressor', algorithm: '', description: '', outputMetric: '', refreshFrequency: 'Daily', assetTypes: '' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain size={24} className="text-purple-500" />
            Health Models
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI/ML models powering asset health and risk scoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary">
            <Play size={16} />
            Run All Models
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add New Model
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{models.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Models</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{models.filter((m) => m.status === 'active').length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active in Production</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
              <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(() => { const active = models.filter((m) => m.status === 'active'); return active.length > 0 ? Math.round(active.reduce((s, m) => s + m.accuracy, 0) / active.length) : 0; })()}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Accuracy</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.max(...models.map((m) => m.assetsScored), 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Assets Scored</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by model name, algorithm, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="all">All Categories</option>
                {MODEL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                <option value="active">Active</option>
                <option value="training">Training</option>
                <option value="draft">Draft</option>
                <option value="retired">Retired</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Showing {filteredModels.length} of {models.length} models
        </p>

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

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredModels.map((model) => {
          const catColors = CATEGORY_COLORS[model.category];
          const statusStyle = STATUS_STYLES[model.status];
          return (
            <Card key={model.id}>
              <button type="button" onClick={() => setDetailModel(model)} className="w-full text-left">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{model.icon}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                        {model.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{model.algorithm}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${catColors.bg} ${catColors.text} ${catColors.darkBg} ${catColors.darkText}`}>
                    {model.category}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">v{model.version}</span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Accuracy</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{model.accuracy}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${accuracyBarColor(model.accuracy)} transition-all`} style={{ width: `${model.accuracy}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>{model.assetsScored.toLocaleString()} assets</span>
                  </div>
                  <span>Last run: {model.lastRun}</span>
                </div>
              </button>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <Play size={12} />
                  Run Model
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredModels.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No models match your filters</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        </Card>
      )}

      {/* Radar Chart */}
      <Card>
        <CardHeader title="Model Comparison" subtitle="Transformer Health Index vs Circuit Breaker Failure model" />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: textColor, fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: textColor, fontSize: 10 }} />
              <Radar name="Transformer HI" dataKey="Transformer HI" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="CB Failure" dataKey="CB Failure" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: '12px', color: textColor }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ─── Model Detail Modal ──────────────────────────────────── */}
      <Modal isOpen={detailModel !== null} onClose={() => setDetailModel(null)} title={detailModel ? `${detailModel.icon} ${detailModel.name}` : ''} size="lg">
        {detailModel && (() => {
          const catColors = CATEGORY_COLORS[detailModel.category];
          const statusStyle = STATUS_STYLES[detailModel.status];
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${catColors.bg} ${catColors.text} ${catColors.darkBg} ${catColors.darkText}`}>{detailModel.category}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">v{detailModel.version}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">ID: {detailModel.id}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{detailModel.accuracy}%</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Accuracy</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{detailModel.assetsScored.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Assets Scored</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{detailModel.trainingDataSize.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Training Samples</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{detailModel.refreshFrequency}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Refresh Freq</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-gray-400" />
                  Technical Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{detailModel.description}</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-1.5">
                  <BarChart3 size={14} />
                  Business Impact & Context
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">{detailModel.businessContext}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Settings size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Algorithm</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{detailModel.algorithm}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Output Metric</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{detailModel.outputMetric}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created By</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{detailModel.createdBy}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{detailModel.createdDate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Layers size={14} className="text-gray-400" />
                  Input Features ({detailModel.inputFeatures.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailModel.inputFeatures.map((feature) => (
                    <span key={feature} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{feature}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Database size={14} className="text-gray-400" />
                  Asset Types Covered
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailModel.assetTypes.map((at) => (
                    <span key={at} className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">{at}</span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={() => setDetailModel(null)}>
                  <X size={16} />
                  Close
                </Button>
                <Button variant="secondary">
                  <Settings size={16} />
                  Configure
                </Button>
                <Button>
                  <Play size={16} />
                  Run Model
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Add New Model Modal ─────────────────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Health Model" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Register a new health model to the platform. Once added, it will appear in the model inventory and can be configured for automated scoring runs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Model Name <span className="text-red-500">*</span></label>
              <input type="text" value={newModel.name} onChange={(e) => setNewModel((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Transformer Thermal Risk" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category <span className="text-red-500">*</span></label>
              <select value={newModel.category} onChange={(e) => setNewModel((p) => ({ ...p, category: e.target.value as ModelCategory }))} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                {MODEL_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Algorithm <span className="text-red-500">*</span></label>
              <input type="text" value={newModel.algorithm} onChange={(e) => setNewModel((p) => ({ ...p, algorithm: e.target.value }))} placeholder="e.g., Random Forest, XGBoost" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Output Metric <span className="text-red-500">*</span></label>
              <input type="text" value={newModel.outputMetric} onChange={(e) => setNewModel((p) => ({ ...p, outputMetric: e.target.value }))} placeholder="e.g., Health Score (0-100)" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Refresh Frequency</label>
              <select value={newModel.refreshFrequency} onChange={(e) => setNewModel((p) => ({ ...p, refreshFrequency: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="Real-time">Real-time</option>
                <option value="Hourly">Hourly</option>
                <option value="Every 6 hours">Every 6 hours</option>
                <option value="Every 12 hours">Every 12 hours</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Asset Types</label>
              <input type="text" value={newModel.assetTypes} onChange={(e) => setNewModel((p) => ({ ...p, assetTypes: e.target.value }))} placeholder="e.g., Power Transformer, Circuit Breaker" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea value={newModel.description} onChange={(e) => setNewModel((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe the model's purpose, methodology, and key assumptions..." className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              <X size={16} />
              Cancel
            </Button>
            <Button onClick={handleAddModel} disabled={!newModel.name || !newModel.algorithm || !newModel.description}>
              <Plus size={16} />
              Register Model
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
