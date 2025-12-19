import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  progress?: number; // 0-100
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  'data-testid'?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  progress,
  trend,
  description,
  'data-testid': testId
}: MetricCardProps) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{value}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-300"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(progress / 100) * 282.7} 282.7`}
                className="text-primary transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{progress}%</span>
            </div>
          </div>
        </div>
      )}

      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500">from last month</span>
          </div>
        </div>
      )}
    </div>
  );
}
