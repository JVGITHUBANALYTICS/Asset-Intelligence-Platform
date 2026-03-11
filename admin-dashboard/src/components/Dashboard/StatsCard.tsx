import { Zap, DollarSign, Target, TrendingUp, TrendingDown } from 'lucide-react';
import type { FleetStat } from '../../types';

const iconMap: Record<string, React.ElementType> = {
  Zap,
  DollarSign,
  Target,
  TrendingUp,
};

const colorMap: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-500' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  good: { bg: 'bg-green-500/10', text: 'text-green-500' },
  info: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
};

export default function StatsCard({ stat }: { stat: FleetStat }) {
  const Icon = iconMap[stat.icon] || Zap;
  const colors = colorMap[stat.color] || colorMap.info;
  const isPositive = stat.change >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:border-cyan-500/50 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {isPositive ? '+' : ''}{stat.change}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{stat.changeLabel}</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon size={24} className={colors.text} />
        </div>
      </div>
    </div>
  );
}
