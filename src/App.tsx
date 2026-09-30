import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/home/Hero';
import { ServicesSection } from './components/home/ServicesSection';
import { HowItWorks } from './components/home/HowItWorks';
import { ReportModal } from './components/reports/ReportModal';
import { TrackReportView } from './components/reports/TrackReportView';
import { CitizenFeedbackModal } from './components/reports/CitizenFeedbackModal';
import { CityMapView } from './components/map/CityMapView';
import { CitizenDashboard } from './components/dashboard/CitizenDashboard';
import { OfficerDashboard } from './components/dashboard/OfficerDashboard';
import { SustainabilityView } from './components/sustainability/SustainabilityView';
import { FAQView } from './components/pages/FAQView';
import { AboutView } from './components/pages/AboutView';
import { ContactView } from './components/pages/ContactView';
import { AuthModal } from './components/auth/AuthModal';
import { AiCitizenAssistant } from './components/ai/AiCitizenAssistant';
import { ToastContainer } from './components/common/ToastContainer';

const AppContent: React.FC = () => {
  const { activePage, currentRole, isOfficer, setActivePage, setIsReportModalOpen } = useApp();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'gov'>('login');
  const [feedbackReportId, setFeedbackReportId] = useState<string | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' | 'gov') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenFeedback = (reportId: string) => {
    setFeedbackReportId(reportId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navbar with two-role switcher & notifications */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* Main Content Region */}
      <main className="flex-1">
        {activePage === 'home' && (
          <div className="space-y-0">
            <Hero />
            <ServicesSection />
            <HowItWorks />

            {/* Quick Municipal Stats & Trust Bar */}
            <section className="bg-slate-900 text-white py-12 border-t border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
                  Zero Paper · Real-Time Redressal · Citizen Empowered
                </span>
                <h3 className="text-xl sm:text-2xl font-bold">
                  Empowering Citizens in Every Ward of Mira-Bhayandar
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
                  From Beverly Park and Kanakia in Mira Road to Maxus Mall and Station Road in Bhayandar, experience modern municipal services designed for total transparency.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-colors"
                  >
                    + Report Water Issue
                  </button>
                  <button
                    onClick={() => setActivePage('track')}
                    className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                  >
                    Track Water Report →
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activePage === 'services' && (
          <div className="py-8">
            <ServicesSection />
          </div>
        )}

        {activePage === 'how-it-works' && (
          <div className="py-8">
            <HowItWorks />
          </div>
        )}

        {activePage === 'dashboard' && (
          <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isOfficer ? (
              <OfficerDashboard />
            ) : (
              <CitizenDashboard onOpenFeedback={handleOpenFeedback} />
            )}
          </div>
        )}

        {activePage === 'track' && (
          <TrackReportView onOpenFeedback={handleOpenFeedback} />
        )}

        {activePage === 'map' && <CityMapView />}

        {activePage === 'sustainability' && <SustainabilityView />}

        {activePage === 'faq' && <FAQView />}

        {activePage === 'about' && <AboutView />}

        {activePage === 'contact' && <ContactView />}
      </main>

      {/* Global Modals & Widgets */}
      <ReportModal />

      <CitizenFeedbackModal
        reportId={feedbackReportId}
        onClose={() => setFeedbackReportId(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Floating MB Urban AI Assistant Widget */}
      <AiCitizenAssistant />

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Persistent Civic Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
