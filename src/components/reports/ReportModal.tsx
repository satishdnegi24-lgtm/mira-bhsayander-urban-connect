import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportCategory, ReportPriority } from '../../types';
import { classifyIssueWithAi, ClassifyResult } from '../../services/api';
import {
  X,
  Sparkles,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Droplets,
  Edit,
  ArrowRight,
  Info,
  ShieldAlert,
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

const LOCALITIES = [
  'Mira Road East (Beverly Park)',
  'Mira Road East (Kanakia)',
  'Mira Road East (Shanti Park)',
  'Mira Road East (Silver Park)',
  'Mira Road East (Pleasant Park)',
  'Mira Road West (Station Area)',
  'Bhayandar East (Station Deck)',
  'Bhayandar East (Navghar Road)',
  'Bhayandar West (Station Road)',
  'Bhayandar West (Maxus Mall / 150ft Rd)',
  'Kashimira / Western Express Highway',
  'Hatkesh / Penkarpada',
  'Uttan / Gorai Coastal Belt',
];

export const ReportModal: React.FC = () => {
  const {
    isReportModalOpen,
    setIsReportModalOpen,
    reportCategoryPreset,
    setReportCategoryPreset,
    addReport,
    setSelectedReportId,
    setActivePage,
    isAuthenticated,
    currentUser,
    openAuthModal,
  } = useApp();

  // Form Fields (Requirement 13)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('Water Leakage');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState(LOCALITIES[0]);
  const [landmark, setLandmark] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Review & Confirmation Step (Requirement 14)
  // 'form' -> user filling form
  // 'analyzing' -> AI reviewing
  // 'ai_review' -> showing AI analysis with Confirm Report & Edit Report
  // 'unrelated_rejected' -> non-water complaint rejected
  const [stage, setStage] = useState<'form' | 'analyzing' | 'ai_review' | 'unrelated_rejected'>('form');
  const [aiResult, setAiResult] = useState<ClassifyResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  useEffect(() => {
    if (reportCategoryPreset) {
      setCategory(reportCategoryPreset);
    }
  }, [reportCategoryPreset]);

  useEffect(() => {
    if (isReportModalOpen) {
      if (reportCategoryPreset) {
        setCategory(reportCategoryPreset);
      }
      setStage('form');
      setValidationErrors({});
    }
  }, [isReportModalOpen, reportCategoryPreset]);

  if (!isReportModalOpen) return null;

  // Gate unauthenticated users: must sign in or register to report issue
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Report Water Issue</h3>
                <p className="text-[11px] text-slate-500">Water Service Department · MBMC</p>
              </div>
            </div>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Sign In to Report Issue</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anonymous and unauthenticated complaints cannot be accepted by the Water Service Department. Please sign in or register your citizen account to file an official water service grievance.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  openAuthModal('login', 'Please sign in to report a water issue.');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span>Sign In to Report Issue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsReportModalOpen(false);
                  openAuthModal('register', 'Create an account to report and track water issues.');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                New Citizen? Register Here
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({ ...prev, photo: 'File size must be under 5MB.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickSampleWaterPhoto = (type: string) => {
    if (type === 'leak') {
      setPhotoPreview('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800');
    } else if (type === 'damage') {
      setPhotoPreview('https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&q=80&w=800');
    } else {
      setPhotoPreview('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800');
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Please enter an issue title.';
    if (!description.trim()) errors.description = 'Please describe the water problem.';
    if (description.trim().length < 10) errors.description = 'Description should be at least 10 characters.';
    if (!location.trim()) errors.location = 'Please provide the address or street location.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Report triggers AI Analysis Review (Requirement 13 & 14)
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUser) {
      setIsReportModalOpen(false);
      openAuthModal('login', 'Please sign in or register to report a water issue.');
      return;
    }
    if (!validate()) return;

    setStage('analyzing');

    try {
      const res = await classifyIssueWithAi({
        title: title.trim(),
        description: description.trim(),
        location: `${location}, ${area}`,
      });

      setAiResult(res);

      if (!res.isWaterRelated) {
        // Requirement 7: Reject clearly unrelated complaints
        setStage('unrelated_rejected');
      } else {
        // Requirement 14: Show AI Analysis before confirmation
        setStage('ai_review');
      }
    } catch (err) {
      console.error(err);
      setStage('ai_review');
    }
  };

  // Final Confirmation (Requirement 14)
  const handleConfirmReport = () => {
    if (!isAuthenticated || !currentUser) {
      setIsReportModalOpen(false);
      openAuthModal('login', 'Please sign in or register to report a water issue.');
      return;
    }
    setIsSubmittingFinal(true);

    const chosenCategory = aiResult?.category || category;
    const chosenPriority = aiResult?.suggestedPriority || 'Medium';

    setTimeout(() => {
      const newReport = addReport({
        title: title.trim(),
        category: chosenCategory,
        description: description.trim(),
        location: location.trim(),
        area,
        landmark: landmark.trim(),
        priority: chosenPriority,
        photoUrl: photoPreview || undefined,
        aiAnalysis: aiResult
          ? {
              suggestedCategory: aiResult.category,
              suggestedPriority: aiResult.suggestedPriority,
              suggestedAction: aiResult.suggestedAction,
              reason: aiResult.reason,
              isWaterRelated: true,
              source: aiResult.source,
            }
          : undefined,
      });

      setIsSubmittingFinal(false);
      setIsReportModalOpen(false);
      setSelectedReportId(newReport.id);
      setActivePage('track');

      // Reset
      setTitle('');
      setDescription('');
      setLocation('');
      setLandmark('');
      setPhotoPreview(null);
      setStage('form');
      setAiResult(null);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Report Water Issue
              </h3>
              <p className="text-[11px] text-slate-500">
                Water Service Department · Mira-Bhayandar
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReportModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* STAGE 1: FORM (Requirement 13) */}
          {stage === 'form' && (
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              {/* Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  This portal handles <strong>urban water-related issues</strong> only (supply, pipeline leaks, low pressure, contamination, wastage). Unrelated municipal complaints will be redirected.
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water leakage near main road, low pressure in 4th floor"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {validationErrors.title && (
                  <p className="text-rose-600 text-[10px] mt-1">{validationErrors.title}</p>
                )}
              </div>

              {/* Water Issue Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Water Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {WATER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the water problem in detail (e.g. Clean water leaking from underground joint continuously onto street for past 2 hours...)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
                {validationErrors.description && (
                  <p className="text-rose-600 text-[10px] mt-1">{validationErrors.description}</p>
                )}
              </div>

              {/* Location Fields */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Area / Locality *
                    </label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Opposite Cinemax Circle, Kanakia Road"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {validationErrors.location && (
                      <p className="text-rose-600 text-[10px] mt-1">{validationErrors.location}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Box Office, Pillar #14"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Photo Upload (Requirement 13) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Photo of Water Issue (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-slate-400">or try sample:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSampleWaterPhoto('leak')}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Leak Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSampleWaterPhoto('damage')}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Pipe Damage
                  </button>
                </div>

                {photoPreview && (
                  <div className="mt-2.5 relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Water Issue Preview"
                      className="w-28 h-20 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button triggers AI Review */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit Report for AI Review</span>
                </button>
                <span className="text-[10px] text-slate-400 text-center block mt-1.5">
                  AI will categorize and recommend priority before final confirmation.
                </span>
              </div>
            </form>
          )}

          {/* STAGE 2: ANALYZING SPINNER */}
          {stage === 'analyzing' && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">
                Specialized Water AI is Analyzing Your Report...
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Validating water domain relevance, detecting leakage risks, and evaluating infrastructure priority.
              </p>
            </div>
          )}

          {/* STAGE 3: UNRELATED REJECTION BANNER (Requirement 7) */}
          {stage === 'unrelated_rejected' && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-950 text-sm">
                    Platform Handles Urban Water-Related Issues Only
                  </h4>
                  <p className="text-rose-800 leading-relaxed">
                    This platform currently handles urban water-related issues. Please submit a water-related issue.
                  </p>
                  <p className="text-[11px] text-rose-700 pt-1">
                    Your description appears to describe non-water issues (e.g. road potholes, garbage, or streetlights). For other municipal departments, please visit the general Mira-Bhayandar civic grievance counter.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200">
                <span className="font-bold text-slate-700 block">Accepted Water Categories:</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Water Supply · Water Leakage · Low Water Pressure · No Water Supply · Contaminated Water · Pipeline Damage · Water Wastage · Public Water Facility.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('form')}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Edit Report Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: AI REVIEW BEFORE SUBMISSION (Requirement 14) */}
          {stage === 'ai_review' && aiResult && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                      AI Analysis Completed
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    Water Service Department
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Recommended Category:</span>
                    <strong className="text-blue-900 font-bold text-sm">
                      {aiResult.category}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Recommended Priority:</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-0.5 ${
                        aiResult.suggestedPriority === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : aiResult.suggestedPriority === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : aiResult.suggestedPriority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {aiResult.suggestedPriority}
                    </span>
                  </div>
                </div>

                {aiResult.suggestedAction && (
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[11px]">Suggested Action:</span>
                    <span className="font-semibold text-slate-800">
                      {aiResult.suggestedAction}
                    </span>
                  </div>
                )}

                <div className="text-xs pt-1 border-t border-blue-200/60">
                  <span className="text-slate-500 block text-[11px]">Reason:</span>
                  <p className="text-slate-700 italic text-[11px] leading-relaxed mt-0.5">
                    "{aiResult.reason}"
                  </p>
                </div>
              </div>

              {/* Report Summary Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900">{title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{area}</span>
                </div>
                <p className="text-slate-600 text-[11px] line-clamp-2">{description}</p>
                <p className="text-[10px] text-slate-500">
                  Location: <strong className="text-slate-700">{location}</strong>
                  {landmark ? ` (Near: ${landmark})` : ''}
                </p>
                {photoPreview && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium pt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Photo attached for water officer inspection
                  </span>
                )}
              </div>

              {/* Requirement 14: Confirm Report and Edit Report buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('form')}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmittingFinal}
                  onClick={handleConfirmReport}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingFinal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Confirm Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
