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

  if (!reportId) return null;

  const report = reports.find((r) => r.id === reportId);
  if (!report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addFeedback({
        reportId,
        rating,
        resolutionStatus,
        comment: comment.trim() || 'Work verified by citizen.',
        citizenId: currentUser?.id || report.citizenId,
        citizenName: currentUser?.name || report.citizenName,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Citizen Service Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <span className="text-[11px] font-mono text-blue-700 font-bold block">
              Report ID: {report.id}
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{report.title}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Department: {report.departmentName}
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
              Was the issue satisfactorily resolved?
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['Yes', 'Partially', 'No'] as const).map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setResolutionStatus(opt)}
                  className={`py-2 px-3 rounded-lg border font-medium text-center transition-colors ${
                    resolutionStatus === opt
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comments or Observations
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with the field officers and municipal team..."
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
