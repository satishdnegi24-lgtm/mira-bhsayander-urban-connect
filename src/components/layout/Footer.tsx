import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Heart, ExternalLink, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActivePage, t } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                MB
              </div>
              <span className="font-bold text-white text-sm">
                MB Urban Connect
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              One Digital Platform for a Better City. Intelligent urban service delivery and grievance redressal for Mira-Bhayandar.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <span>Mira Road · Bhayandar · Uttan</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Civic Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActivePage('home')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('services')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.services}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('how-it-works')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.howItWorks}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('track')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.trackReport}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('map')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.map}
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Sustainability */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Transparency & SDGs
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActivePage('sustainability')}
                  className="hover:text-white transition-colors"
                >
                  Sustainability & SDGs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('about')}
                  className="hover:text-white transition-colors"
                >
                  About the Platform
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('faq')}
                  className="hover:text-white transition-colors"
                >
                  FAQ & Knowledge Base
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('contact')}
                  className="hover:text-white transition-colors"
                >
                  Municipal Contacts
                </button>
              </li>
            </ul>
          </div>

          {/* Civic Helplines */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Emergency & Helplines
            </h4>
            <p className="text-[11px] text-slate-400">
              National Emergency: <strong className="text-white font-mono">112</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              Fire Brigade: <strong className="text-white font-mono">101</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              Police Control Room: <strong className="text-white font-mono">100</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              MBMC HQ Helpline: <strong className="text-white font-mono">022-28114400</strong>
            </p>
          </div>
        </div>

        {/* Official Portal Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            {t.demoNotice}
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Intelligent Municipal Governance</span>
            <span>·</span>
            <span>Citizen Service Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
