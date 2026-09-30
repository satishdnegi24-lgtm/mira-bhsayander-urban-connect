import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, PlusCircle, CheckCircle, Clock, Users, Droplet, Droplets, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  const { t, setIsReportModalOpen, setActivePage, reports } = useApp();

  const totalReports = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'SOLVED' || r.status === 'CLOSED').length;

  return (
    <section className="relative overflow-hidden bg-slate-900 text-white py-16 lg:py-24 border-b border-slate-800">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Core Brief */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-cyan-400 text-xs font-semibold">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Water Service Department · Mira-Bhayandar Municipal Corporation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Urban Water Service Management.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
                Fast. Accountable. Transparent.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Empowering citizens to report pipeline leakages, low water pressure, contamination, and supply interruptions with AI-driven categorization, swift field worker dispatch, and citizen resolution verification.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Water Issue</span>
              </button>

              <button
                onClick={() => {
                  const elem = document.getElementById('services-section');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                  else setActivePage('services');
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <span>Water Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
                  {resolvedCount + 820}+
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Water Issues Solved</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  &lt; 8 Hours
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Avg Leak Isolation</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white tabular-nums">10 Wards</p>
                <p className="text-xs text-slate-400 mt-0.5">Mira & Bhayandar</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums">4.9 / 5.0</p>
                <p className="text-xs text-slate-400 mt-0.5">Citizen Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Graphic Asset */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-800 group">
              <img
                src="/src/assets/images/mira_bhayandar_hero_1790144544776.jpg"
                alt="Mira-Bhayandar Sustainable Clean Water Infrastructure"
                referrerPolicy="no-referrer"
                className="w-full h-80 object-cover transform group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="font-semibold text-white">Live Water Grid Redressal</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300">WSD Central Cell</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">
                  Real-time pipeline monitoring across Bhayandar West, East, and Mira Road with instant worker assignment and resolution verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
