import React from 'react';
import { ShieldCheck, Cpu, Leaf, Users, Eye, Target, Sparkles, Building2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  const pillars = [
    {
      title: 'Intelligent Technology & AI',
      desc: 'Powered by Google Gemini models specialized in urban water grievance categorization, priority assessment, and Water Service Department review.',
      icon: Cpu,
    },
    {
      title: 'Digital Citizen Empowerment',
      desc: 'Enabling residents across Mira Road, Bhayandar East, Bhayandar West, and Uttan to report issues in under 2 minutes.',
      icon: Users,
    },
    {
      title: 'Radical Municipal Transparency',
      desc: 'Public 5-stage resolution lifecycle timeline, real-time officer accountability, and SLA countdown visibility.',
      icon: Eye,
    },
    {
      title: 'Sustainable Urban Delivery',
      desc: '100% paperless governance, water loss mitigation, and alignment with UN Sustainable Development Goals (SDG 11, 9, 16).',
      icon: Leaf,
    },
    {
      title: 'Citizen-Verified Feedback',
      desc: 'Civic complaints are only concluded when citizens rate resolution quality and confirm ground results.',
      icon: ShieldCheck,
    },
    {
      title: 'Executive Business Intelligence',
      desc: 'Data-driven pattern recognition highlighting recurring infrastructure vulnerabilities across municipal wards.',
      icon: Target,
    },
  ];

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-md">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest block mb-2">
            Civic Platform Overview
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Mira-Bhayandar Urban Connect
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-3xl leading-relaxed">
            An intelligent web-based urban service management system designed to modernize interaction between citizens and urban service providers across the twin city of Mira-Bhayandar.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-3 text-xs text-blue-200 bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              <strong>Official Grievance Redressal Platform:</strong> Mira-Bhayandar Urban Connect provides responsive municipal service delivery, transparent timeline tracking, and automated department routing for all wards across Mira Road and Bhayandar.
            </span>
          </div>
        </div>

        {/* Core Pillars */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Core Pillars of Urban Connect
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2 hover:border-blue-300 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coverage Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              Coverage & Ward Administration
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Mira-Bhayandar is a vibrant coastal metropolitan region situated north of Mumbai with over 1.2 million citizens. Urban Connect unifies all 10 administrative zones—including Bhayandar East, Bhayandar West, Mira Road East, Kanakia, Beverly Park, Shanti Park, Silver Park, Hatkesh, Kashimira, and Uttan—under a unified digital service catalog.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Population</span>
              <strong className="text-slate-900 font-mono text-sm">1.2M+</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Wards</span>
              <strong className="text-slate-900 font-mono text-sm">10 Wards</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Department</span>
              <strong className="text-cyan-700 font-mono text-sm">Water Service Dept</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[11px]">Hardware</span>
              <strong className="text-emerald-700 font-mono text-sm">100% Software</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
