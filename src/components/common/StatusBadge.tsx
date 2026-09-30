import React from 'react';
import { ReportStatus } from '../../types';
import {
  Inbox,
  Sparkles,
  UserCheck,
  PlayCircle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Check,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 font-medium'
      : size === 'md'
      ? 'text-xs px-3 py-1 font-semibold'
      : 'text-sm px-3.5 py-1.5 font-semibold';

  const s = String(status).toUpperCase();

  switch (s) {
    case 'SUBMITTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/90 ${sizeClasses}`}
        >
          <Inbox className="w-3.5 h-3.5 text-slate-500" />
          <span>Submitted</span>
        </span>
      );

    case 'AI_CLASSIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Classified</span>
        </span>
      );

    case 'OFFICER_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}
        >
          <Check className="w-3.5 h-3.5 text-blue-600" />
          <span>Officer Review</span>
        </span>
      );

    case 'WORKER_ASSIGNED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 ${sizeClasses}`}
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
          <span>Worker Assigned</span>
        </span>
      );

    case 'WORK_IN_PROGRESS':
    case 'IN PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}
        >
          <PlayCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Work In Progress</span>
        </span>
      );

    case 'SOLVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Solved</span>
        </span>
      );

    case 'CITIZEN_VERIFICATION':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-teal-50 text-teal-800 border border-teal-300 ${sizeClasses}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
          <span>Citizen Verification</span>
        </span>
      );

    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Closed</span>
        </span>
      );

    case 'REOPENED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses}`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
          <span>Reopened</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
