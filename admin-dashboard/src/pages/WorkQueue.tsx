import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Trash2, Download, FileText, XCircle } from 'lucide-react';
import { mockAssets } from '../data/mockAssets';
import { RISK_COLORS } from '../utils/constants';
import Card, { CardHeader } from '../components/UI/Card';
import Table from '../components/UI/Table';
import Button from '../components/UI/Button';
import type { Asset } from '../types';

interface QueueItem {
  asset: Asset;
  addedAt: string;
}

const initialQueue: QueueItem[] = [...mockAssets]
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 3)
  .map((asset) => ({
    asset,
    addedAt: new Date().toISOString(),
  }));

export default function WorkQueue() {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const navigate = useNavigate();

  const removeItem = (assetId: string) => {
    setQueue((prev) => prev.filter((item) => item.asset.id !== assetId));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const exportQueueCsv = () => {
    if (queue.length === 0) return;

    const headers = [
      'Asset ID',
      'Type',
      'Manufacturer',
      'Voltage',
      'Capacity',
      'Location',
      'Commission Date',
      'Age',
      'Health Score',
      'Risk Score',
      'Risk Level',
      'Estimated Cost',
      'Last Assessment',
      'Customers Affected',
      'Voltage Class',
      'Added At',
    ];

    const rows = queue.map((item) => [
      item.asset.id,
      item.asset.type,
      item.asset.manufacturer,
      item.asset.voltage,
      item.asset.capacity,
      `"${item.asset.location}"`,
      item.asset.commissionDate,
      item.asset.age,
      item.asset.healthScore,
      item.asset.riskScore,
      item.asset.riskLevel,
      item.asset.estimatedCost,
      item.asset.lastAssessment,
      item.asset.customersAffected ?? '',
      item.asset.voltageClass,
      item.addedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work-queue-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalCost = queue.reduce((sum, item) => sum + item.asset.estimatedCost, 0);

  const columns = [
    {
      key: 'id',
      header: 'Asset ID',
      render: (item: QueueItem) => (
        <span className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400">
          {item.asset.id}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: QueueItem) => (
        <span className="text-gray-700 dark:text-gray-300 text-sm">{item.asset.type}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (item: QueueItem) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">{item.asset.location}</span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      render: (item: QueueItem) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${item.asset.riskScore}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.asset.riskScore}</span>
        </div>
      ),
    },
    {
      key: 'riskLevel',
      header: 'Risk Level',
      render: (item: QueueItem) => {
        const colors = RISK_COLORS[item.asset.riskLevel];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
            {item.asset.riskLevel}
          </span>
        );
      },
    },
    {
      key: 'cost',
      header: 'Est. Cost',
      render: (item: QueueItem) => (
        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
          ${(item.asset.estimatedCost / 1000000).toFixed(1)}M
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: QueueItem) => (
        <button
          onClick={() => removeItem(item.asset.id)}
          className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Remove from queue"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={24} className="text-amber-500" />
            Work Queue
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Assets queued for engineering review and capital planning
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={clearQueue} disabled={queue.length === 0}>
            <XCircle size={16} />
            Clear Queue
          </Button>
          <Button size="sm" variant="secondary" onClick={exportQueueCsv} disabled={queue.length === 0}>
            <Download size={16} />
            Export Queue
          </Button>
          <Button size="sm" onClick={() => navigate('/replacement')} disabled={queue.length === 0}>
            <FileText size={16} />
            Create Capital Plan from Queue
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {queue.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Queue Items</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{queue.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Estimated Cost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(totalCost / 1000000).toFixed(1)}M
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Risk Score</p>
            <p className="text-2xl font-bold text-red-500">
              {queue.length > 0
                ? Math.round(queue.reduce((sum, i) => sum + i.asset.riskScore, 0) / queue.length)
                : 0}
            </p>
          </Card>
        </div>
      )}

      {/* Queue Table or Empty State */}
      {queue.length > 0 ? (
        <Card padding={false}>
          <div className="p-6 pb-0">
            <CardHeader
              title="Queued Assets"
              subtitle={`${queue.length} asset${queue.length !== 1 ? 's' : ''} pending review`}
            />
          </div>
          <Table<QueueItem>
            columns={columns}
            data={queue}
            keyExtractor={(item) => item.asset.id}
          />
        </Card>
      ) : (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Work Queue is Empty
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Select assets from the Asset Registry and add them to the work queue for engineering review and capital planning.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
