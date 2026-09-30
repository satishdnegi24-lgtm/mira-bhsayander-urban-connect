import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Report, ReportCategory, ReportStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  MapPin,
  Filter,
  Navigation,
  Compass,
  Droplets,
  Droplet,
  Eye,
  AlertTriangle,
  CheckCircle2,
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

const WARDS_ZONES = [
  { id: 'w-1', name: 'Bhayandar West (Coastal & Station)', x: 40, y: 30, w: 220, h: 180, color: 'fill-blue-50/60 stroke-blue-300' },
  { id: 'w-2', name: 'Bhayandar East (Navghar & Industrial)', x: 270, y: 30, w: 230, h: 180, color: 'fill-cyan-50/60 stroke-cyan-300' },
  { id: 'w-3', name: 'Mira Road East (Beverly & Shanti Park)', x: 40, y: 220, w: 240, h: 200, color: 'fill-teal-50/60 stroke-teal-300' },
  { id: 'w-4', name: 'Mira Road East (Kanakia & Silver Park)', x: 290, y: 220, w: 210, h: 200, color: 'fill-blue-50/60 stroke-blue-300' },
  { id: 'w-5', name: 'Uttan / Gorai Coastal Belt', x: 20, y: 430, w: 210, h: 130, color: 'fill-sky-50/60 stroke-sky-300' },
  { id: 'w-6', name: 'Kashimira / WEH Gateway', x: 240, y: 430, w: 260, h: 130, color: 'fill-indigo-50/60 stroke-indigo-300' },
];

export const CityMapView: React.FC = () => {
  const { reports, setSelectedReportId, setActivePage, setIsReportModalOpen } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activePin, setActivePin] = useState<Report | null>(reports[0] || null);

  const filteredReports = reports.filter((r) => {
    const matchCat = selectedCategory === 'All' || r.category === selectedCategory;
    const matchStat =
      selectedStatus === 'All' ||
      (selectedStatus === 'Active' && r.status !== 'SOLVED' && r.status !== 'CLOSED') ||
      (selectedStatus === 'Resolved' && (r.status === 'SOLVED' || r.status === 'CLOSED'));
    return matchCat && matchStat;
  });

  const getMarkerCoords = (report: Report, index: number) => {
    const minLat = 19.275;
    const maxLat = 19.32;
    const minLng = 72.81;
    const maxLng = 72.885;

    const lat = report.coordinates?.lat || (19.29 + (index * 0.005) % 0.03);
    const lng = report.coordinates?.lng || (72.85 + (index * 0.007) % 0.03);

    const x = ((lng - minLng) / (maxLng - minLng)) * 460 + 35;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 500 + 40;

    return { x: Math.max(30, Math.min(500, x)), y: Math.max(40, Math.min(550, y)) };
  };

  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Title & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Droplets className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Mira-Bhayandar Water Grid & Grievance Map
                </h1>
                <p className="text-xs text-slate-500">
                  Geospatial visualization of water pipeline leakages, pressure monitoring, and repair works.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="All">All Water Categories</option>
                {WATER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Issues</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-xs"
            >
              + Report Water Issue
            </button>
          </div>
        </div>

        {/* Map Canvas and Info Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SVG Map Canvas */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-xs overflow-hidden relative">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> Critical / High Leakage
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span> Normal / Medium
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Resolved
                </span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">
                {filteredReports.length} Active Pins
              </span>
            </div>

            {/* SVG Visual Map */}
            <div className="relative border border-slate-100 rounded-xl bg-slate-900/5 p-2 overflow-x-auto">
              <svg viewBox="0 0 540 600" className="w-full h-[480px]">
                {/* Ward Zones Background */}
                {WARDS_ZONES.map((zone) => (
                  <g key={zone.id}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.w}
                      height={zone.h}
                      rx="12"
                      className={`${zone.color} transition-colors`}
                    />
                    <text
                      x={zone.x + 12}
                      y={zone.y + 24}
                      className="text-[11px] font-bold fill-slate-600 uppercase tracking-wide"
                    >
                      {zone.name.split('(')[0]}
                    </text>
                  </g>
                ))}

                {/* Pipeline Grid Line Vectors */}
                <path
                  d="M 50 120 Q 250 140 480 110"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                  fill="none"
                />
                <path
                  d="M 150 50 Q 180 320 160 550"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  fill="none"
                />
                <path
                  d="M 380 50 Q 360 300 400 550"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  fill="none"
                />

                {/* Report Markers */}
                {filteredReports.map((report, idx) => {
                  const { x, y } = getMarkerCoords(report, idx);
                  const isSelected = activePin?.id === report.id;
                  const isCritical = report.priority === 'Critical' || report.priority === 'High';
                  const isSolved = report.status === 'SOLVED' || report.status === 'CLOSED';

                  return (
                    <g
                      key={report.id}
                      onClick={() => setActivePin(report)}
                      className="cursor-pointer group"
                    >
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="16"
                          className="fill-blue-500/20 animate-ping"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '9' : '7'}
                        className={`transition-all ${
                          isSolved
                            ? 'fill-emerald-500 stroke-white'
                            : isCritical
                            ? 'fill-rose-600 stroke-white'
                            : 'fill-cyan-600 stroke-white'
                        }`}
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Column: Selected Pin Details */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
              Selected Water Grievance
            </h3>

            {!activePin ? (
              <p className="text-xs text-slate-400">Click a marker on the map to view details.</p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-700">
                    {activePin.id}
                  </span>
                  <StatusBadge status={activePin.status} size="sm" />
                  <PriorityBadge priority={activePin.priority} size="sm" />
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{activePin.title}</h4>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Category:
                  </span>
                  <p className="text-slate-800 font-semibold">{activePin.category}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Location:
                  </span>
                  <p className="text-slate-800 mt-0.5">{activePin.location} ({activePin.area})</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Description:
                  </span>
                  <p className="text-slate-700 mt-0.5 line-clamp-3 leading-relaxed">
                    {activePin.description}
                  </p>
                </div>

                {activePin.assignedWorkerName && (
                  <div className="p-2 bg-cyan-50 rounded-lg border border-cyan-200 text-[11px]">
                    <span className="text-cyan-900 font-bold block">Assigned Worker:</span>
                    <span className="text-slate-800 font-medium">{activePin.assignedWorkerName}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedReportId(activePin.id);
                      setActivePage('track');
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Track Full Lifecycle Timeline</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
