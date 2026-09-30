import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  MapPin,
  Calendar,
  AlertCircle,
  Star,
  ChevronRight,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Droplets,
  ShieldCheck,
  Check,
  AlertTriangle,
  Send,
  Eye,
} from 'lucide-react';

// Requirement 22: Visual Timeline Steps
// ✓ Report Submitted
// ✓ AI Analysis Completed
// ✓ Officer Review
// ✓ Worker Assigned
// ✓ Work In Progress
// ✓ Solved
// ● Citizen Verification
// ○ Closed
// If reopened: ↻ Issue Reopened
const TIMELINE_STEPS = [
  { key: 'SUBMITTED', label: 'Report Submitted', desc: 'Received at Water Service desk' },
  { key: 'AI_CLASSIFIED', label: 'AI Analysis Completed', desc: 'Water category & priority assessed' },
  { key: 'OFFICER_REVIEW', label: 'Officer Review', desc: 'Water Department Officer confirmed' },
  { key: 'WORKER_ASSIGNED', label: 'Worker Assigned', desc: 'Field repair worker tasked' },
  { key: 'WORK_IN_PROGRESS', label: 'Work In Progress', desc: 'Field repair work commenced' },
  { key: 'SOLVED', label: 'Solved', desc: 'Officer completed resolution' },
  { key: 'CITIZEN_VERIFICATION', label: 'Citizen Verification', desc: 'Citizen verifying on site' },
  { key: 'CLOSED', label: 'Closed', desc: 'Issue verified & finalized' },
];

function getTimelineIndex(status: ReportStatus): number {
  switch (status) {
    case 'SUBMITTED':
      return 0;
    case 'AI_CLASSIFIED':
      return 1;
    case 'OFFICER_REVIEW':
      return 2;
    case 'WORKER_ASSIGNED':
      return 3;
    case 'WORK_IN_PROGRESS':
      return 4;
    case 'SOLVED':
      return 5;
    case 'CITIZEN_VERIFICATION':
      return 6;
    case 'CLOSED':
      return 7;
    case 'REOPENED':
      return 2; // Reopened returns to officer review / worker queue
    default:
      return 0;
  }
}

export const TrackReportView: React.FC<{ onOpenFeedback: (reportId: string) => void }> = ({
  onOpenFeedback,
}) => {
  const {
    reports,
    updates,
    feedbacks,
    selectedReportId,
    setSelectedReportId,
    verifyCitizenResolution,
    addReportComment,
  } = useApp();

  const [searchInput, setSearchInput] = useState('');
  const [commentText, setCommentText] = useState('');

  // Citizen verification interaction state (Requirement 21)
  const [verificationChoice, setVerificationChoice] = useState<'Yes' | 'Partially' | 'No' | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const currentReport =
    reports.find((r) => r.id.toLowerCase() === (selectedReportId || '').toLowerCase()) ||
    reports[0];

  const reportUpdates = updates.filter((u) => u.reportId === currentReport?.id);
  const reportFeedback = feedbacks.find((f) => f.reportId === currentReport?.id);

  const currentStepIndex = currentReport ? getTimelineIndex(currentReport.status) : 0;
  const isReopened = currentReport?.status === 'REOPENED';
  const isAwaitingVerification = currentReport?.status === 'SOLVED';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const found = reports.find(
      (r) =>
        r.id.toLowerCase().includes(searchInput.trim().toLowerCase()) ||
        r.title.toLowerCase().includes(searchInput.trim().toLowerCase())
    );
    if (found) {
      setSelectedReportId(found.id);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentReport) return;
    addReportComment(currentReport.id, commentText.trim());
    setCommentText('');
  };

  // Requirement 21: Citizen Verification Submission
  // Options:
  // - Yes, Resolved → CLOSED
  // - Partially Resolved → REOPENED
  // - Not Resolved → REOPENED
  const handleCitizenVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    if (!verificationChoice) {
      setVerificationError('Please select whether the water issue is resolved.');
      return;
    }

    if ((verificationChoice === 'Partially' || verificationChoice === 'No') && !reopenReason.trim()) {
      setVerificationError('Please enter citizen feedback/comment explaining what is still pending.');
      return;
    }

    await verifyCitizenResolution(
      currentReport.id,
      verificationChoice,
      reopenReason.trim() || undefined
    );

    if (verificationChoice === 'Yes') {
      onOpenFeedback(currentReport.id);
    }

    setVerificationChoice(null);
    setReopenReason('');
  };

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>Water Service Department · Grievance Tracking</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Track Water Grievance Lifecycle
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of water pipeline repairs, leak isolation, and verification status.
              </p>
            </div>

            {/* Search ID Form */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Report ID (e.g. WTR-2026-000001)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                Track
              </button>
            </form>
          </div>
        </div>

        {/* Details & Tracking Container */}
        {!currentReport ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <Droplets className="w-10 h-10 text-blue-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Water Report Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {reports.length === 0
                ? 'No water reports have been filed yet. The system is freshly initialized. Click "Report Water Issue" in the navigation bar to submit a new report.'
                : 'No report matching this ID was found. Please check the Report ID and try again.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Requirement 22: Display Header Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-base font-bold text-blue-700">
                      {currentReport.id}
                    </span>
                    <StatusBadge status={currentReport.status} size="sm" />
                    <PriorityBadge priority={currentReport.priority} size="sm" />
                    {isReopened && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        <span>Issue Reopened</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{currentReport.title}</h2>
                  <p className="text-xs text-slate-500">
                    Category: <strong className="text-slate-800">{currentReport.category}</strong> · Location:{' '}
                    <strong className="text-slate-800">{currentReport.location}</strong> ({currentReport.area})
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="text-slate-400 block text-[11px]">Assigned Field Worker:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentReport.assignedWorkerName || 'Assigning field worker...'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Water Service Department
                  </span>
                </div>
              </div>

              {/* Requirement 22: VISUAL TIMELINE */}
              <div className="py-4">
                <span className="text-xs font-bold text-slate-700 block mb-3 uppercase tracking-wider">
                  Lifecycle Workflow Timeline:
                </span>

                {/* Timeline progress line */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex && !isReopened;
                    const isCurrent = idx === currentStepIndex && !isReopened;
                    const isPassedInReopened = isReopened && idx <= 4;

                    return (
                      <div
                        key={step.key}
                        className={`p-3 rounded-xl border transition-all text-left relative ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-400 shadow-xs ring-2 ring-blue-400/20'
                            : isCompleted || isPassedInReopened
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            STEP 0{idx + 1}
                          </span>
                          {isCompleted ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          ) : isCurrent ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                          ) : null}
                        </div>

                        <strong
                          className={`text-xs block font-bold leading-tight ${
                            isCurrent
                              ? 'text-blue-900'
                              : isCompleted
                              ? 'text-emerald-900'
                              : 'text-slate-700'
                          }`}
                        >
                          {step.label}
                        </strong>

                        <span className="text-[10px] text-slate-500 mt-1 block leading-tight">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* If Reopened Indicator (Requirement 22) */}
                {isReopened && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 text-xs text-rose-900">
                    <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <strong className="font-bold block">↻ Issue Reopened by Citizen</strong>
                      <span className="text-[11px] text-rose-800">
                        Citizen remarked: "{currentReport.reopenComment || 'Pending resolution'}". The issue has returned to the Water Officer for re-inspection and corrective action.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirement 21: CITIZEN VERIFICATION SECTION */}
              {isAwaitingVerification && (
                <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-400 rounded-2xl space-y-4 shadow-sm animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-emerald-950">
                        Your water issue has been marked as solved. Please verify the resolution.
                      </h3>
                      <p className="text-xs text-emerald-800">
                        Resolution Notes from Water Officer:{' '}
                        <strong className="text-slate-900 italic">
                          "{currentReport.resolutionNotes || 'Work completed on site.'}"
                        </strong>
                      </p>
                      {currentReport.resolutionPhotoUrl && (
                        <div className="pt-1">
                          <span className="text-[11px] text-emerald-900 font-semibold block mb-1">
                            Officer Completion Photo:
                          </span>
                          <img
                            src={currentReport.resolutionPhotoUrl}
                            alt="Resolution Completion"
                            className="w-48 h-32 object-cover rounded-lg border border-emerald-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {verificationError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {verificationError}
                    </div>
                  )}

                  <form onSubmit={handleCitizenVerificationSubmit} className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-800 block">
                      Has this water issue been successfully resolved?
                    </span>

                    {/* Radio Options: Yes, Resolved -> CLOSED; Partially Resolved -> REOPENED; Not Resolved -> REOPENED */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setVerificationChoice('Yes')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          verificationChoice === 'Yes'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <strong className="block text-xs">Yes, Resolved</strong>
                          <span className="text-[10px] opacity-80">Close complaint</span>
                        </div>
                        {verificationChoice === 'Yes' && <Check className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerificationChoice('Partially')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          verificationChoice === 'Partially'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <strong className="block text-xs">Partially Resolved</strong>
                          <span className="text-[10px] opacity-80">Reopen for completion</span>
                        </div>
                        {verificationChoice === 'Partially' && <Check className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerificationChoice('No')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          verificationChoice === 'No'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <strong className="block text-xs">Not Resolved</strong>
                          <span className="text-[10px] opacity-80">Reopen issue</span>
                        </div>
                        {verificationChoice === 'No' && <Check className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Require feedback comment if reopened */}
                    {(verificationChoice === 'Partially' || verificationChoice === 'No') && (
                      <div className="pt-2 space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Citizen Feedback / Comment (Required for reopening) *
                        </label>
                        <input
                          type="text"
                          required
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="e.g. Water leakage has reduced but is still continuing onto pavement."
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={!verificationChoice}
                        className="py-2.5 px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-40"
                      >
                        Submit Citizen Verification
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Requirement 22: Display Report Details, Latest Update, Resolution, and Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Updates & Resolution (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Resolution Summary Card (if solved/closed) */}
                {(currentReport.status === 'SOLVED' || currentReport.status === 'CLOSED') && (
                  <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Official Resolution Summary
                      </h3>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      {currentReport.resolutionNotes || 'Work certified and resolved by Water Service Department.'}
                    </p>
                    {currentReport.closedAt && (
                      <p className="text-[11px] text-slate-400">
                        Closed on: {new Date(currentReport.closedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Citizen Feedback (if submitted) */}
                {reportFeedback && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          Citizen Post-Resolution Feedback
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-amber-600">
                        {reportFeedback.rating} / 5 Stars
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      "{reportFeedback.comment}"
                    </p>
                  </div>
                )}

                {/* Live Progress Log & Updates */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Latest Updates & Field Notes
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {reportUpdates.length} update(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {reportUpdates.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No progress notes logged yet.
                      </p>
                    ) : (
                      reportUpdates.map((u) => (
                        <div key={u.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <strong className="text-slate-800">
                              {u.createdBy} ({u.role || 'Officer'})
                            </strong>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(u.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{u.message}</p>
                          {u.photoUrl && (
                            <img
                              src={u.photoUrl}
                              alt="Update Evidence"
                              className="w-36 h-24 object-cover rounded mt-1 border"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Public Citizen Comment */}
                  <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add an inquiry or update regarding this water issue..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Complete Report Metadata (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Grievance Record Details
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Description
                    </span>
                    <p className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {currentReport.description}
                    </p>
                  </div>

                  {currentReport.photoUrl && (
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        Reported Photo Evidence
                      </span>
                      <img
                        src={currentReport.photoUrl}
                        alt="Water Issue Photo"
                        className="w-full h-44 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Department
                      </span>
                      <span className="font-semibold text-slate-800">
                        Water Service Department
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Category
                      </span>
                      <span className="font-semibold text-slate-800">
                        {currentReport.category}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Area / Locality
                      </span>
                      <span className="font-semibold text-slate-800">
                        {currentReport.area}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Submitted Date
                      </span>
                      <span className="font-semibold text-slate-800">
                        {new Date(currentReport.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {currentReport.assignedWorkerName && (
                    <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-lg text-xs space-y-0.5">
                      <span className="text-cyan-900 font-bold block">
                        Assigned Field Worker
                      </span>
                      <p className="text-slate-800 font-medium">
                        {currentReport.assignedWorkerName}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Water Service Department · Mira-Bhayandar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
