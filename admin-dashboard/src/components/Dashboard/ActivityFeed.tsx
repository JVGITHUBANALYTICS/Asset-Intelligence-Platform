import { mockAlerts } from '../../data/mockStats';
import { formatRelativeTime } from '../../utils/helpers';
import { AlertTriangle, Thermometer, Gauge, ClipboardCheck, Wrench, FlaskConical } from 'lucide-react';
import { RISK_COLORS } from '../../utils/constants';
import type { ActivityAlert } from '../../types';

const alertIcons: Record<string, React.ReactNode> = {
  dga_test: <FlaskConical size={16} />,
  thermal: <Thermometer size={16} />,
  load_alert: <Gauge size={16} />,
  inspection: <ClipboardCheck size={16} />,
  failure: <AlertTriangle size={16} />,
  maintenance: <Wrench size={16} />,
};

const severityBorderColors: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

export default function ActivityFeed() {
  return (
    <div className="space-y-3">
      {mockAlerts.slice(0, 6).map((alert: ActivityAlert) => {
        const colors = RISK_COLORS[alert.severity];
        return (
          <div
            key={alert.id}
            className={`border-l-4 ${severityBorderColors[alert.severity]} rounded-r-lg p-3 bg-gray-50 dark:bg-gray-700/30`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 ${colors.text} ${colors.darkText}`}>
                {alertIcons[alert.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    {alert.assetId}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                  {alert.message}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {formatRelativeTime(alert.timestamp)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
