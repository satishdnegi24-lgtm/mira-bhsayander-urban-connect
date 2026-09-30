import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Bell,
  Search,
  PlusCircle,
  Globe,
  User as UserIcon,
  Shield,
  Briefcase,
  ChevronDown,
  Menu,
  X,
  MapPin,
  HelpCircle,
  LogOut,
  Droplet,
  Droplets,
  Check,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenAuth: (mode: 'login' | 'register' | 'gov') => void }> = ({
  onOpenAuth,
}) => {
  const {
    currentUser,
    currentRole,
    isAuthenticated,
    isOfficer,
    isCitizen,
    logout,
    language,
    setLanguage,
    t,
    activePage,
    setActivePage,
    setIsReportModalOpen,
    unreadNotificationCount,
    notifications,
    markNotificationRead,
    clearNotifications,
    setSelectedReportId,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Water Services' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'track', label: 'Track Water Report' },
    { id: 'map', label: 'Water Grid Map' },
    { id: 'sustainability', label: 'Clean Water & SDGs' },
    { id: 'faq', label: 'FAQ' },
    { id: 'about', label: 'About' },
  ];

  return (
    <>
      {/* Official Municipal Portal Header Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-medium text-slate-200">Government of Maharashtra</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-300 font-semibold">MBMC Water Service Department</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="hidden sm:inline">Water Control Room Helpline: <strong className="text-white font-mono">022-28114403</strong></span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">Toll-Free: <strong className="text-white font-mono">1800-22-2811</strong></span>
            {isAuthenticated && currentUser && (
              <span className="text-cyan-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Signed in: <strong className="text-white">{currentUser.name}</strong> ({isOfficer ? 'Water Department Officer' : 'Citizen'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActivePage('home')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-blue-800 transition-colors">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-base tracking-tight group-hover:text-blue-700 transition-colors">
                  MB Urban Connect
                </span>
                <span className="text-[10px] text-cyan-800 font-bold tracking-wide">
                  Water Service Department · MBMC
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActivePage(link.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activePage === link.id
                    ? 'text-blue-700 bg-blue-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* Dashboard Link */}
            <button
              onClick={() => setActivePage('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activePage === 'dashboard'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isOfficer ? 'Water Officer Dashboard' : 'Citizen Dashboard'}
            </button>
          </nav>

          {/* Right Header Utility Region */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div className="relative group">
              <button
                aria-label="Change Language"
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="uppercase">{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-50 text-xs">
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                    language === 'en' ? 'text-blue-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  English {language === 'en' && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                    language === 'hi' ? 'text-blue-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  हिंदी {language === 'hi' && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setLanguage('mr')}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                    language === 'mr' ? 'text-blue-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  मराठी {language === 'mr' && <Check className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Water Notifications</h4>
                      <p className="text-[10px] text-slate-500">Live water repair & inspection updates</p>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            if (notif.reportId) {
                              setSelectedReportId(notif.reportId);
                              setActivePage('track');
                            }
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                            !notif.read ? 'bg-blue-50/50 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-slate-900 text-[11px]">
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{notif.message}</p>
                          {notif.reportId && (
                            <span className="inline-block mt-1 font-mono text-[9px] text-blue-600 font-bold">
                              ID: {notif.reportId} →
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Officer Badge indicator */}
            {isOfficer && currentUser ? (
              <div
                onClick={() => setActivePage('dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-50 border border-cyan-300 text-cyan-950 text-xs font-bold cursor-pointer"
                title={`${currentUser.name} - Water Service Department`}
              >
                <Droplet className="w-3.5 h-3.5 text-cyan-700" />
                <span className="max-w-[150px] truncate">Water Officer</span>
              </div>
            ) : null}

            {/* Primary Action: Report Water Issue */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Water Issue</span>
            </button>

            {/* Authentication / User Profile Region */}
            {!isAuthenticated || !currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Citizen Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('gov')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-400 bg-cyan-50 text-cyan-900 hover:bg-cyan-100 text-xs font-semibold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Water Officer</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isOfficer
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-950'
                      : 'border-slate-300 bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[90px] truncate hidden sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <strong className="block text-slate-900 font-bold">{currentUser.name}</strong>
                      <span className="text-slate-500 font-mono text-[11px] block">{currentUser.email}</span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Role: {isOfficer ? 'Water Department Officer' : 'Citizen'}
                      </span>
                    </div>

                    {/* User Links */}
                    <div className="px-2 py-1.5 border-b border-slate-100 space-y-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActivePage('dashboard');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                      >
                        {isOfficer ? (
                          <>
                            <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Water Officer Dashboard</span>
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>My Water Reports Dashboard</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActivePage('track');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <span>Track Water Issues</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            <button
              onClick={() => {
                setIsReportModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold mb-2 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Water Issue</span>
            </button>

            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActivePage(link.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activePage === link.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                }`}
              >
                {link.label}
              </button>
            ))}

            <button
              onClick={() => {
                setActivePage('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-cyan-800 bg-cyan-50"
            >
              {isOfficer ? 'Water Officer Dashboard' : 'Citizen Dashboard'}
            </button>
          </div>
        )}
      </header>
    </>
  );
};
