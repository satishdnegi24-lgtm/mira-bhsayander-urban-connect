import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, X, CheckCircle2, MessageSquare, ThumbsUp } from 'lucide-react';

interface CitizenFeedbackModalProps {
  reportId: string | null;
  onClose: () => void;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  reportId,
  onClose,
}) => {
  const { reports, addFeedback, currentUser } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [resolutionStatus, setResolutionStatus] = useState<'Yes' | 'Partially' | 'No'>('Yes');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  if (!reportId) return null;

  const report = reports.find((r) => r.id === reportId);
  if (!report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (resolutionStatus !== 'Yes' && !comment.trim()) {
      setFormError('Please enter a comment/reason explaining what is still pending.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addFeedback({
        reportId,
        rating,
        resolutionStatus,
        verificationResponse:
          resolutionStatus === 'Yes'
            ? 'YES_SOLVED'
            : resolutionStatus === 'Partially'
            ? 'PARTIALLY_SOLVED'
            : 'NOT_SOLVED',
        comment:
          comment.trim() ||
          (resolutionStatus === 'Yes'
            ? 'Work verified by citizen.'
            : 'Citizen reported issue as unresolved.'),
        citizenId: currentUser?.id || report.citizenId,
        citizenName: currentUser?.name || report.citizenName,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Citizen Service Feedback & Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <span className="text-[11px] font-mono text-blue-700 font-bold block">
              Report ID: {report.id}
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{report.title}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Department: {report.departmentName || 'Water Service Department'}
            </p>
          </div>

          {/* Star Rating */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              How would you rate the speed and quality of resolution?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700 mt-1 block">
              {rating === 5 && 'Outstanding service!'}
              {rating === 4 && 'Good resolution'}
              {rating === 3 && 'Average experience'}
              {rating === 2 && 'Needs improvement'}
              {rating === 1 && 'Unsatisfactory'}
            </span>
          </div>

          {/* Was issue resolved */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Was the water issue satisfactorily resolved?
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { key: 'Yes' as const, label: 'Yes, Solved', desc: 'Confirm & Close' },
                { key: 'Partially' as const, label: 'Partially Solved', desc: 'Reopen Issue' },
                { key: 'No' as const, label: 'Not Solved', desc: 'Reopen Issue' },
              ].map(({ key, label, desc }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setResolutionStatus(key)}
                  className={`py-2 px-2.5 rounded-lg border text-center transition-colors ${
                    resolutionStatus === key
                      ? key === 'Yes'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
                        : key === 'Partially'
                        ? 'bg-amber-50 border-amber-600 text-amber-800 font-bold'
                        : 'bg-rose-50 border-rose-600 text-rose-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs font-bold">{label}</span>
                  <span className="text-[10px] opacity-75">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comments or Observations {resolutionStatus !== 'Yes' && <span className="text-rose-600">*</span>}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                resolutionStatus === 'Yes'
                  ? 'Tell us about your experience with the water department team...'
                  : 'Please explain what remains unresolved so field officers can address it...'
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
