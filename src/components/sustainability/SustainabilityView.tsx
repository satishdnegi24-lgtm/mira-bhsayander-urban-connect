import React from 'react';
import { SUSTAINABILITY_INSIGHTS } from '../../data/demoData';
import { Droplet, Droplets, Globe, CheckCircle2, ArrowRight, ShieldCheck, Gauge } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SustainabilityView: React.FC = () => {
  const { setIsReportModalOpen } = useApp();

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-cyan-900 to-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-500/30">
            <Droplets className="w-3.5 h-3.5" />
            <span>Water Conservation & UN SDG 6 Alignment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Clean Water Security & Sustainability Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            By enabling immediate citizen reporting of pipeline leaks, burst water mains, and wastage, Mira-Bhayandar Urban Connect conserves millions of liters of treated drinking water and ensures equitable distribution across every ward.
          </p>
        </div>

        {/* Environmental Impact Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Drinking Water Preserved</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-blue-700 mt-2">
              {SUSTAINABILITY_INSIGHTS.waterConservedLiters.toLocaleString()} L
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Saved via early pipeline leak reports
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pipeline Leaks Repaired</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-cyan-800 mt-2">
              {SUSTAINABILITY_INSIGHTS.leakagesRepairedCount} Leaks
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Repaired within 8-hour target SLA
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pipeline Audits Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-2">
              {SUSTAINABILITY_INSIGHTS.pipelineInspectionsDone} Audits
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Valve and pressure inspections logged
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Water Quality Compliance</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-teal-700 mt-2">
              {SUSTAINABILITY_INSIGHTS.waterQualityTestsPassed}%
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Samples meeting WHO/BIS safety criteria
            </span>
          </div>
        </div>

        {/* UN SDG Alignments Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Alignment with UN Sustainable Development Goals (SDGs)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl mb-6">
            Demonstrating sustainable, resilient, and transparent water resource management across Mira-Bhayandar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUSTAINABILITY_INSIGHTS.sdgAlignments.map((item) => (
              <div
                key={item.sdg}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${item.color}`}>
                    {item.sdg}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Citizen Water Habits */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Citizen Water Conservation Tips: How You Can Help
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            {SUSTAINABILITY_INSIGHTS.citizenTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-cyan-50/40 border border-cyan-100"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Report a Water Leakage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
