import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  Send,
  Cpu,
  UserCheck,
  PlayCircle,
  CheckCircle2,
  CheckSquare,
  RotateCcw,
  Star,
  ArrowRight,
  Droplets,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const { setIsReportModalOpen } = useApp();

  // Requirement 11: Complete Water Issue Workflow
  const steps = [
    {
      num: '01',
      title: 'Report Water Issue',
      desc: 'Citizen files an issue with location, description, and photo of the leak or outage.',
      icon: Send,
      color: 'bg-blue-600',
    },
    {
      num: '02',
      title: 'AI Classification',
      desc: 'Specialized Water AI classifies category, evaluates urgency, and recommends priority.',
      icon: Cpu,
      color: 'bg-purple-600',
    },
    {
      num: '03',
      title: 'Water Officer Review',
      desc: 'Water Department Officer reviews details, adjusts priority if needed, and confirms the issue.',
      icon: UserCheck,
      color: 'bg-cyan-600',
    },
    {
      num: '04',
      title: 'Worker Assigned',
      desc: 'Officer assigns a certified department field worker (e.g. Ramesh Patil or Vijay More).',
      icon: PlayCircle,
      color: 'bg-amber-600',
    },
    {
      num: '05',
      title: 'Work In Progress',
      desc: 'Field worker conducts on-site excavation, joint sealing, or valve repair with live progress notes.',
      icon: Droplets,
      color: 'bg-indigo-600',
    },
    {
      num: '06',
      title: 'Marked Solved',
      desc: 'Officer inspects the repair, logs a resolution description and completion photo.',
      icon: CheckCircle2,
      color: 'bg-emerald-600',
    },
    {
      num: '07',
      title: 'Citizen Verification',
      desc: 'Citizen inspects the resolution: Yes (Closed) or Partially / Not Resolved (Reopened).',
      icon: CheckSquare,
      color: 'bg-teal-600',
    },
    {
      num: '08',
      title: 'Closed & Feedback',
      desc: 'Citizen rates satisfaction (1–5 stars) to guarantee transparent governance.',
      icon: Star,
      color: 'bg-rose-600',
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-blue-700 tracking-wider uppercase">
            End-to-End Water Grievance Workflow
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Urban Water Connect Operates
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            A transparent 8-stage lifecycle from citizen complaint to AI categorization, officer triage, field repair, and citizen verification sign-off.
          </p>
        </div>

        {/* Process Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${step.color} text-white flex items-center justify-center shadow-xs`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    STEP {step.num}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Callout Box */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-900 to-blue-950 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold">
              Experiencing a water leak, low pressure, or supply interruption?
            </h4>
            <p className="text-xs text-slate-300 max-w-xl">
              Submit your water report in under 2 minutes. Our specialized AI will analyze priority and alert the Water Service Department immediately.
            </p>
          </div>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-xs whitespace-nowrap transition-colors"
          >
            Report Water Issue Now
          </button>
        </div>
      </div>
    </section>
  );
};
