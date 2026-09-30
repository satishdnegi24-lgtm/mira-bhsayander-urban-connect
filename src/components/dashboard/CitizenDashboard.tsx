import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ReportCategory } from '../../types';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Droplet,
  Droplets,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckSquare,
} from 'lucide-react';

const WATER_CATEGORIES: ReportCategory[] = [
  'Water Supply',
  'Water Leakage',
  'Low Water Pressure',
  'No Water Supply',
  'Contaminated Water',
  'Pipeline Damage',
  'Water Wastage',
  'Public Water Facility',
  'Other Water Issue',
];

export const CitizenDashboard: React.FC<{ onOpenFeedback: (reportId: string) => void }> = ({
  onOpenFeedback,
}) => {
  const {
    currentUser,
    reports,
    citizenReports,
    setIsReportModalOpen,
    setSelectedReportId,
    setActivePage,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('All');

  // Reports filed by current citizen (fallback to showing demo water reports if empty)
  const displayReports = citizenReports.length > 0 ? citizenReports : reports;

  const filtered = displayReports.filter(
    (r) => categoryFilter === 'All' || r.category === categoryFilter
  );

  // Requirement 23: Exact Cards
  // - Total Water Reports
  // - Active Reports
  // - In Progress
  // - Solved
  // - Closed
  // - Reopened
  const totalWaterReports = displayReports.length;

  const activeReportsCount = displayReports.filter(
    (r) => r.status !== 'CLOSED' && r.status !== 'SOLVED'
  ).length;

  const inProgressCount = displayReports.filter(
    (r) => r.status === 'WORK_IN_PROGRESS'
  ).length;

  const solvedCount = displayReports.filter(
    (r) => r.status === 'SOLVED' || r.status === 'CITIZEN_VERIFICATION'
  ).length;

  const closedCount = displayReports.filter((r) => r.status === 'CLOSED').length;

  const reopenedCount = displayReports.filter((r) => r.status === 'REOPENED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-900 via-cyan-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-700/60 text-cyan-200 text-xs font-semibold mb-2">
            <Droplet className="w-3.5 h-3.5 text-cyan-300" />
            <span>Water Service Department · Citizen Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {currentUser?.name || 'Resident Citizen'}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Area: <strong className="text-white">{currentUser?.area || 'Mira-Bhayandar'}</strong> · Registered Email:{' '}
            <strong className="text-white">{currentUser?.email || 'Registered Citizen'}</strong> · Mobile:{' '}
            <strong className="text-white">{currentUser?.phone || 'On Record'}</strong>
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-blue-700" />
          <span>Report Water Issue</span>
        </button>
      </div>

      {/* Requirement 23: Dashboard Cards (Total Water Reports, Active Reports, In Progress, Solved, Closed, Reopened) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Water Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Water Reports</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalWaterReports}
          </p>
          <span className="text-[10px] text-slate-400">Filed by citizen</span>
        </div>

        {/* 2. Active Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Active Reports</span>
          <p className="text-2xl font-bold font-mono text-cyan-800 mt-1">
            {activeReportsCount}
          </p>
          <span className="text-[10px] text-slate-400">In department queue</span>
        </div>

        {/* 3. In Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">In Progress</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {inProgressCount}
          </p>
          <span className="text-[10px] text-slate-400">Field work active</span>
        </div>

        {/* 4. Solved */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Solved</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {solvedCount}
          </p>
          <span className="text-[10px] text-slate-400">Needs verification</span>
        </div>

        {/* 5. Closed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Closed</span>
          <p className="text-2xl font-bold font-mono text-slate-700 mt-1">
            {closedCount}
          </p>
          <span className="text-[10px] text-slate-400">Verified resolved</span>
        </div>

        {/* 6. Reopened */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Reopened</span>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {reopenedCount}
          </p>
          <span className="text-[10px] text-slate-400">Returned to officer</span>
        </div>
      </div>

      {/* Verification Notice Banner if any solved issues await citizen inspection */}
      {solvedCount > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-4 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="font-bold block">Resolution Verification Required</strong>
              <span>
                You have {solvedCount} water report(s) marked as solved by the Water Service Department. Please verify if the resolution fixed your problem.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActivePage('track')}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shrink-0"
          >
            Verify Now →
          </button>
        </div>
      )}

      {/* Reports Table (Requirement 23: No department filtering) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Water Service Grievances</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track status, assigned field worker, live timeline, and verification actions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="All">All Water Categories</option>
              {WATER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Issue Title & Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Field Worker</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No water reports found in this view.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {report.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block max-w-sm truncate">
                        {report.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {report.category} · {report.location}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={report.priority} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {report.assignedWorkerName ? (
                        <span className="text-slate-800 font-medium">
                          {report.assignedWorkerName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Assigning...</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReportId(report.id);
                          setActivePage('track');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>

                      {report.status === 'SOLVED' && (
                        <button
                          onClick={() => {
                            setSelectedReportId(report.id);
                            setActivePage('track');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
