import React from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_SERVICES } from '../../data/demoData';
import { ReportCategory } from '../../types';
import {
  Droplet,
  Droplets,
  Waves,
  Gauge,
  XCircle,
  AlertTriangle,
  Wrench,
  Building2,
  HelpCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Droplets,
  Droplet,
  Gauge,
  XCircle,
  AlertTriangle,
  Wrench,
  Waves,
  Building2,
  HelpCircle,
};

export const ServicesSection: React.FC = () => {
  const { t, setIsReportModalOpen, setReportCategoryPreset, reports } = useApp();

  const handleReportCategory = (category: ReportCategory) => {
    setReportCategoryPreset(category);
    setIsReportModalOpen(true);
  };

  return (
    <section id="services-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-3">
            <Droplets className="w-3.5 h-3.5 text-blue-700" />
            <span>Water Service Department · Mira-Bhayandar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Urban Water Services & Grievance Redressal
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Dedicated municipal service channels for drinking water supply, pipeline leak repairs, pressure regulation, and water quality testing across Mira Road and Bhayandar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_SERVICES.map((service) => {
            const IconComponent = iconMap[service.iconName] || Droplet;
            const categoryOpenReports = reports.filter(
              (r) => r.category === service.category && r.status !== 'CLOSED' && r.status !== 'SOLVED'
            ).length;

            return (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {service.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {service.shortDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Resolution SLA: ~{service.standardResolutionHours}h
                    </span>
                    <span className="font-mono text-blue-700 font-semibold">
                      {categoryOpenReports} active
                    </span>
                  </div>

                  <button
                    onClick={() => handleReportCategory(service.category)}
                    className="w-full py-1.5 px-3 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Report Water Issue</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
