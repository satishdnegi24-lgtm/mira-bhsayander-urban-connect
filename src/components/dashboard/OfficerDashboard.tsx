import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Report, ReportCategory, ReportPriority, ReportStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Droplet,
  Droplets,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  UserCheck,
  Edit,
  ArrowRight,
  Send,
  Eye,
  Shield,
  FileCheck,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Users,
  MapPin,
  Camera,
  MessageSquare,
  ChevronRight,
  X,
  Check,
  CheckCircle,
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

export const OfficerDashboard: React.FC = () => {
  const {
    currentUser,
    departmentReports,
    departmentWorkers,
    updates,
    feedbacks,
    confirmOfficerReview,
    assignWorkerToReport,
    startWorkOnReport,
    updateReportStatus,
    addProgressUpdate,
    markReportSolved,
    updatePriority,
    updateCategory,
    addReportComment,
  } = useApp();

  const officerName = currentUser?.name || 'Water Department Officer';
  const officerDesignation = currentUser?.designation || 'Executive Engineer (Water Service)';

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected report for drawer/details (Requirement 16) - reactive with departmentReports
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    departmentReports[0]?.id || null
  );

  const selectedReport = useMemo(() => {
    return (
      departmentReports.find((r) => r.id === selectedReportId) ||
      departmentReports[0] ||
      null
    );
  }, [departmentReports, selectedReportId]);

  // Modals & Action States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    departmentWorkers[0]?.workerId || ''
  );

  const [isSolveModalOpen, setIsSolveModalOpen] = useState(false);
  const [solveDescription, setSolveDescription] = useState('');
  const [solvePhotoUrl, setSolvePhotoUrl] = useState('');
  const [solveError, setSolveError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ReportCategory>('Water Leakage');
  const [editPriority, setEditPriority] = useState<ReportPriority>('High');

  // Progress update input (Requirement 19)
  const [progressText, setProgressText] = useState('');
  const [progressPhoto, setProgressPhoto] = useState('');

  // Requirement 15: Exact 7 Dashboard cards
  // 1. New Reports (SUBMITTED / AI_CLASSIFIED)
  // 2. Under Review (OFFICER_REVIEW)
  // 3. Workers Assigned (WORKER_ASSIGNED)
  // 4. Work In Progress (WORK_IN_PROGRESS)
  // 5. Solved (SOLVED / CITIZEN_VERIFICATION)
  // 6. Reopened (REOPENED)
  // 7. Closed (CLOSED)
  const countNewReports = departmentReports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'AI_CLASSIFIED'
  ).length;

  const countUnderReview = departmentReports.filter(
    (r) => r.status === 'OFFICER_REVIEW'
  ).length;

  const countWorkersAssigned = departmentReports.filter(
    (r) => r.status === 'WORKER_ASSIGNED'
  ).length;

  const countInProgress = departmentReports.filter(
    (r) => r.status === 'WORK_IN_PROGRESS'
  ).length;

  const countSolved = departmentReports.filter(
    (r) => r.status === 'SOLVED' || r.status === 'CITIZEN_VERIFICATION'
  ).length;

  const countReopened = departmentReports.filter(
    (r) => r.status === 'REOPENED'
  ).length;

  const countClosed = departmentReports.filter(
    (r) => r.status === 'CLOSED'
  ).length;

  // Filtered reports
  const filteredReports = useMemo(() => {
    return departmentReports.filter((r) => {
      const matchSearch =
        searchQuery === '' ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.citizenName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === 'All' ||
        (filterStatus === 'NEW' && (r.status === 'SUBMITTED' || r.status === 'AI_CLASSIFIED')) ||
        (filterStatus === 'UNDER_REVIEW' && r.status === 'OFFICER_REVIEW') ||
        (filterStatus === 'SOLVED' && (r.status === 'SOLVED' || r.status === 'CITIZEN_VERIFICATION')) ||
        r.status === filterStatus;

      const matchPriority = filterPriority === 'All' || r.priority === filterPriority;
      const matchCategory = filterCategory === 'All' || r.category === filterCategory;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [departmentReports, searchQuery, filterStatus, filterPriority, filterCategory]);

  // Selected report updates & feedback
  const activeReportUpdates = useMemo(() => {
    if (!selectedReport) return [];
    return updates.filter((u) => u.reportId === selectedReport.id);
  }, [selectedReport, updates]);

  const activeReportFeedback = useMemo(() => {
    if (!selectedReport) return null;
    return feedbacks.find((f) => f.reportId === selectedReport.id);
  }, [selectedReport, feedbacks]);

  // Confirm worker assignment
  const handleAssignWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !selectedWorkerId) return;
    setIsAssignModalOpen(false);
    await assignWorkerToReport(selectedReport.id, selectedWorkerId);
  };

  // Submit Mark as Solved (Requirement 20)
  const handleMarkSolved = async (e: React.FormEvent) => {
    e.preventDefault();
    setSolveError(null);

    if (!selectedReport) return;
    if (!solveDescription.trim()) {
      setSolveError('Please enter a resolution description before marking solved.');
      return;
    }

    const repId = selectedReport.id;
    const desc = solveDescription.trim();
    const photo = solvePhotoUrl.trim() || undefined;

    setIsSolveModalOpen(false);
    setSolveDescription('');
    setSolvePhotoUrl('');

    await markReportSolved(repId, desc, photo);
  };

  // Submit Progress Update (Requirement 19)
  const handleAddProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !progressText.trim()) return;

    addProgressUpdate(
      selectedReport.id,
      progressText.trim(),
      progressPhoto.trim() || undefined
    );

    setProgressText('');
    setProgressPhoto('');
  };

  // Confirm Issue Review (moves to OFFICER_REVIEW)
  const handleConfirmIssue = async () => {
    if (!selectedReport) return;
    await confirmOfficerReview(selectedReport.id);
  };

  // Start Work (Requirement 18) - sets status to WORK_IN_PROGRESS immediately
  const handleStartWork = async () => {
    if (!selectedReport) return;
    await startWorkOnReport(selectedReport.id);
  };

  // Direct status override
  const handleDirectStatusChange = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    if (newStatus === 'WORK_IN_PROGRESS') {
      await startWorkOnReport(selectedReport.id);
    } else if (newStatus === 'SOLVED') {
      setSolveDescription(
        selectedReport.resolutionNotes ||
          'Damaged pipeline section repaired and water leakage stopped.'
      );
      setSolvePhotoUrl(selectedReport.resolutionPhotoUrl || '');
      setSolveError(null);
      setIsSolveModalOpen(true);
    } else {
      await updateReportStatus(selectedReport.id, newStatus);
    }
  };

  // Quick Progress note presets
  const handleQuickProgress = (note: string) => {
    setProgressText(note);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Water Service Department (Requirement 15) */}
      <div className="bg-gradient-to-r from-cyan-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-800/60 text-cyan-200 text-xs font-semibold">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mira-Bhayandar Municipal Corporation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Water Service Department
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Logged in: <strong className="text-white">{officerName}</strong> · {officerDesignation}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 block uppercase">Active Complaints</span>
              <strong className="text-lg font-bold font-mono text-cyan-300">
                {countNewReports + countUnderReview + countWorkersAssigned + countInProgress + countReopened}
              </strong>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 block uppercase">Field Workers</span>
              <strong className="text-lg font-bold font-mono text-emerald-300">
                {departmentWorkers.length} Active
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Requirement 15: Exact 7 Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. New Reports */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'NEW' ? 'All' : 'NEW')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'NEW'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">New Reports</span>
          <p className="text-xl font-bold font-mono text-blue-700 mt-1">{countNewReports}</p>
          <span className="text-[10px] text-slate-400">Intake / AI</span>
        </button>

        {/* 2. Under Review */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'OFFICER_REVIEW' ? 'All' : 'OFFICER_REVIEW')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'OFFICER_REVIEW'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Under Review</span>
          <p className="text-xl font-bold font-mono text-purple-700 mt-1">{countUnderReview}</p>
          <span className="text-[10px] text-slate-400">Officer desk</span>
        </button>

        {/* 3. Workers Assigned */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'WORKER_ASSIGNED' ? 'All' : 'WORKER_ASSIGNED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'WORKER_ASSIGNED'
              ? 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Workers Assigned</span>
          <p className="text-xl font-bold font-mono text-cyan-800 mt-1">{countWorkersAssigned}</p>
          <span className="text-[10px] text-slate-400">Dispatched</span>
        </button>

        {/* 4. Work In Progress */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'WORK_IN_PROGRESS' ? 'All' : 'WORK_IN_PROGRESS')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'WORK_IN_PROGRESS'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Work In Progress</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">{countInProgress}</p>
          <span className="text-[10px] text-slate-400">On site repair</span>
        </button>

        {/* 5. Solved */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'SOLVED' ? 'All' : 'SOLVED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'SOLVED'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Solved</span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{countSolved}</p>
          <span className="text-[10px] text-slate-400">Awaiting citizen</span>
        </button>

        {/* 6. Reopened */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'REOPENED' ? 'All' : 'REOPENED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'REOPENED'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Reopened</span>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">{countReopened}</p>
          <span className="text-[10px] text-slate-400">Citizen feedback</span>
        </button>

        {/* 7. Closed */}
        <button
          onClick={() => setFilterStatus(filterStatus === 'CLOSED' ? 'All' : 'CLOSED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'CLOSED'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Closed</span>
          <p className="text-xl font-bold font-mono text-slate-800 mt-1">{countClosed}</p>
          <span className="text-[10px] text-slate-400">Verified complete</span>
        </button>
      </div>

      {/* Main Content: Split layout with Report Table on Left & Report View on Right (Requirement 16) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Water Complaints Table (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search water report ID, title, street, citizen..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Categories</option>
                  {WATER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Issue Title & Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Worker</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No water reports matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const isSelected = selectedReport?.id === report.id;
                    return (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-50/70 border-l-4 border-l-cyan-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {report.id}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]">
                            {report.title}
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {report.category} · {report.area}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <PriorityBadge priority={report.priority} size="sm" />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusBadge status={report.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {report.assignedWorkerName ? (
                            <span className="text-slate-800 font-medium flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
                              <span>{report.assignedWorkerName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {report.status !== 'WORK_IN_PROGRESS' &&
                              report.status !== 'SOLVED' &&
                              report.status !== 'CLOSED' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReportId(report.id);
                                    startWorkOnReport(report.id);
                                  }}
                                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                                  title="Start Work immediately"
                                >
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Start Work</span>
                                </button>
                              )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReportId(report.id);
                              }}
                              className="p-1 text-slate-400 hover:text-cyan-700 rounded"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: WATER OFFICER REPORT VIEW (Requirement 16) (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          {!selectedReport ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select a report from the list to view details and execute actions.
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-blue-700">
                      {selectedReport.id}
                    </span>
                    <StatusBadge status={selectedReport.status} size="sm" />
                    <PriorityBadge priority={selectedReport.priority} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedReport.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reported by <strong className="text-slate-700">{selectedReport.citizenName}</strong> on{' '}
                    {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description & Location */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                    Description:
                  </span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Category:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedReport.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Location:
                    </span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {selectedReport.location}
                    </span>
                  </div>
                </div>

                {selectedReport.landmark && (
                  <p className="text-[11px] text-slate-500">
                    Landmark: <span className="text-slate-700">{selectedReport.landmark}</span>
                  </p>
                )}

                {/* Uploaded Photo */}
                {selectedReport.photoUrl && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                      Uploaded Photo:
                    </span>
                    <img
                      src={selectedReport.photoUrl}
                      alt="Water Issue"
                      className="w-full h-36 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                {/* AI Classification Info (Requirement 16) */}
                {selectedReport.aiAnalysis && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        AI Analysis
                      </span>
                      <span className="text-blue-700 font-mono text-[10px]">
                        Category: {selectedReport.aiAnalysis.suggestedCategory}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      "{selectedReport.aiAnalysis.reason}"
                    </p>
                    {selectedReport.aiAnalysis.suggestedAction && (
                      <p className="text-[10px] text-blue-800 font-medium">
                        Suggested Action: {selectedReport.aiAnalysis.suggestedAction}
                      </p>
                    )}
                  </div>
                )}

                {/* Assigned Worker Info */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Assigned Field Worker:
                    </span>
                    <strong className="text-slate-900">
                      {selectedReport.assignedWorkerName || 'No worker assigned yet'}
                    </strong>
                  </div>
                  {selectedReport.assignedWorkerName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold">
                      Field Assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Requirement 16: OFFICER ACTIONS */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Water Officer Actions:
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Action 1: Confirm Issue */}
                  <button
                    onClick={handleConfirmIssue}
                    disabled={selectedReport.status !== 'SUBMITTED' && selectedReport.status !== 'AI_CLASSIFIED'}
                    className="py-2 px-2.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Issue</span>
                  </button>

                  {/* Action 2 & 3: Change Category / Priority */}
                  <button
                    onClick={() => {
                      setEditCategory(selectedReport.category);
                      setEditPriority(selectedReport.priority);
                      setIsEditModalOpen(true);
                    }}
                    className="py-2 px-2.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Change Cat/Priority</span>
                  </button>

                  {/* Action 4: Assign Worker (Requirement 17) */}
                  <button
                    onClick={() => {
                      setSelectedWorkerId(departmentWorkers[0]?.workerId || '');
                      setIsAssignModalOpen(true);
                    }}
                    className="py-2 px-2.5 rounded-lg border border-cyan-400 bg-cyan-50 text-cyan-900 hover:bg-cyan-100 font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Assign Worker</span>
                  </button>

                  {/* Action 5: Start Work (Requirement 18) */}
                  <button
                    type="button"
                    onClick={handleStartWork}
                    disabled={
                      selectedReport.status === 'WORK_IN_PROGRESS' ||
                      selectedReport.status === 'SOLVED' ||
                      selectedReport.status === 'CLOSED'
                    }
                    className={`py-2 px-2.5 rounded-lg border font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      selectedReport.status === 'WORK_IN_PROGRESS'
                        ? 'bg-amber-100 border-amber-300 text-amber-900 cursor-default'
                        : 'border-amber-400 bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      selectedReport.status === 'WORK_IN_PROGRESS'
                        ? 'Repair work is currently in progress'
                        : 'Start field repair work on this water report'
                    }
                  >
                    <PlayCircle
                      className={`w-3.5 h-3.5 ${
                        selectedReport.status === 'WORK_IN_PROGRESS'
                          ? 'text-amber-700 animate-pulse'
                          : 'text-white'
                      }`}
                    />
                    <span>
                      {selectedReport.status === 'WORK_IN_PROGRESS' ? 'Work In Progress' : 'Start Work'}
                    </span>
                  </button>
                </div>

                {/* Action 7: Mark Solved (Requirement 20) */}
                <button
                  type="button"
                  onClick={() => {
                    setSolveDescription(
                      selectedReport.resolutionNotes ||
                        'Damaged pipeline section repaired and water leakage stopped.'
                    );
                    setSolvePhotoUrl(selectedReport.resolutionPhotoUrl || '');
                    setSolveError(null);
                    setIsSolveModalOpen(true);
                  }}
                  disabled={selectedReport.status === 'SOLVED' || selectedReport.status === 'CLOSED'}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Solved</span>
                </button>

                {/* Direct Quick Status Override for Officer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">Quick Set Status:</span>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleDirectStatusChange(e.target.value as ReportStatus)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="AI_CLASSIFIED">AI Classified</option>
                    <option value="OFFICER_REVIEW">Officer Review</option>
                    <option value="WORKER_ASSIGNED">Worker Assigned</option>
                    <option value="WORK_IN_PROGRESS">Work In Progress</option>
                    <option value="SOLVED">Solved</option>
                    <option value="REOPENED">Reopened</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Requirement 19: Add Progress Update Form */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Add Progress Update (Visible to Citizen):
                </span>
                <form onSubmit={handleAddProgress} className="space-y-2">
                  <textarea
                    rows={2}
                    value={progressText}
                    onChange={(e) => setProgressText(e.target.value)}
                    placeholder="e.g. Field inspection completed. Pipeline damage identified. Repair work started."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white resize-none"
                  />

                  {/* Quick update presets */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleQuickProgress('Field inspection completed.')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Field inspection completed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickProgress('Pipeline damage identified.')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Pipeline damage identified
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickProgress('Repair work started.')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Repair work started
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickProgress('Leakage source isolated.')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Leakage source isolated
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!progressText.trim()}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Progress Update</span>
                  </button>
                </form>
              </div>

              {/* Timeline of Updates (Requirement 16) */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Report Timeline & Progress Log:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100">
                  {activeReportUpdates.length === 0 ? (
                    <p className="text-[11px] text-slate-400">No updates logged yet.</p>
                  ) : (
                    activeReportUpdates.map((upd) => (
                      <div key={upd.id} className="pt-2 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <strong className="text-slate-800">{upd.createdBy} ({upd.role || 'Officer'})</strong>
                          <span className="font-mono">
                            {new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-snug">{upd.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: ASSIGN FIELD WORKER (Requirement 17) */}
      {isAssignModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Field Worker (Water Service Department)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Report ID: {selectedReport.id}
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Field Worker (Water Department Only) *
                </label>
                <div className="space-y-2">
                  {departmentWorkers.map((w) => (
                    <label
                      key={w.workerId}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWorkerId === w.workerId
                          ? 'border-cyan-500 bg-cyan-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="worker"
                          value={w.workerId}
                          checked={selectedWorkerId === w.workerId}
                          onChange={() => setSelectedWorkerId(w.workerId)}
                          className="text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                          <strong className="text-xs text-slate-900 block">{w.workerName}</strong>
                          <span className="text-[10px] text-slate-500">Phone: {w.phoneNumber}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {w.assignedTasksCount || 0} active tasks
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Confirm Worker Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MARK AS SOLVED (Requirement 20) */}
      {isSolveModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mark Water Issue as Solved
                </h3>
                <p className="text-[11px] text-slate-500">
                  Report ID: {selectedReport.id}
                </p>
              </div>
              <button
                onClick={() => setIsSolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {solveError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {solveError}
              </div>
            )}

            <form onSubmit={handleMarkSolved} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={solveDescription}
                  onChange={(e) => setSolveDescription(e.target.value)}
                  placeholder="e.g. Damaged pipeline section repaired and water leakage stopped."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Completion Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={solvePhotoUrl}
                  onChange={(e) => setSolvePhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                >
                  Mark as Solved & Request Verification
                </button>
                <button
                  type="button"
                  onClick={() => setIsSolveModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHANGE CATEGORY / PRIORITY */}
      {isEditModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Update Category & Priority
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Water Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ReportCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {WATER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as ReportPriority)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCategory(selectedReport.id, editCategory);
                    updatePriority(selectedReport.id, editPriority);
                    setIsEditModalOpen(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
