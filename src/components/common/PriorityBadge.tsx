import React from 'react';
import { ReportPriority } from '../../types';
import { AlertTriangle, AlertCircle, ArrowDown, ShieldAlert } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ReportPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  switch (priority) {
    case 'Critical':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>Critical</span>
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded bg-orange-50 text-orange-700 border border-orange-200 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          <span>High</span>
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Low</span>
        </span>
      );
    default:
      return <span className={`inline-flex items-center font-medium ${sizeClasses}`}>{priority}</span>;
  }
};
