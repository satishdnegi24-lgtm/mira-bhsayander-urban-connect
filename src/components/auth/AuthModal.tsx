import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  Droplet,
  AlertCircle,
  KeyRound,
  UserPlus,
} from 'lucide-react';

const LOCALITIES = [
  'Mira Road East (Beverly Park)',
  'Mira Road East (Kanakia)',
  'Mira Road East (Shanti Park)',
  'Mira Road East (Silver Park)',
  'Mira Road East (Pleasant Park)',
  'Mira Road West (Station Area)',
  'Bhayandar East (Station Deck)',
  'Bhayandar East (Navghar Road)',
  'Bhayandar West (Station Road)',
  'Bhayandar West (Maxus Mall / 150ft Rd)',
  'Kashimira / Western Express Highway',
  'Hatkesh / Penkarpada',
  'Uttan / Gorai Coastal Belt',
];

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'gov';
  promptMessage?: string | null;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  promptMessage,
  onClose,
}) => {
  const {
    loginCitizen,
    registerCitizen,
    loginOfficer,
    registerOfficer,
    signInWithGoogleAuth,
    setActivePage,
    setIsReportModalOpen,
    authPromptMessage,
    addToast,
  } = useApp();

  // Exactly two primary tabs: 'citizen' or 'officer' (Requirement 3)
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>(
    initialMode === 'gov' ? 'officer' : 'citizen'
  );

  // Sub-mode for citizen: 'signin' | 'signup'
  const [citizenMode, setCitizenMode] = useState<'signin' | 'signup'>(
    initialMode === 'register' ? 'signup' : 'signin'
  );

  // Sub-mode for officer: 'signin' | 'register'
  const [officerMode, setOfficerMode] = useState<'signin' | 'register'>('signin');

  // Show/hide passwords
  const [showCitizenPassword, setShowCitizenPassword] = useState(false);
  const [showOfficerPassword, setShowOfficerPassword] = useState(false);

  // Citizen Sign In form (Empty by default - no default sign in)
  const [citizenSignInEmail, setCitizenSignInEmail] = useState('');
  const [citizenSignInPassword, setCitizenSignInPassword] = useState('');

  // Citizen Sign Up form (Requirement 4)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regArea, setRegArea] = useState(LOCALITIES[0]);
  const [regLanguage, setRegLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [regError, setRegError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [citizenSignInError, setCitizenSignInError] = useState<string | null>(null);

  // Water Department Officer Sign In form (Empty by default - no demo credentials)
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerError, setOfficerError] = useState<string | null>(null);

  // Officer Registration / Activation form
  const [regOfficerName, setRegOfficerName] = useState('');
  const [regOfficerEmail, setRegOfficerEmail] = useState('');
  const [regOfficerPhone, setRegOfficerPhone] = useState('');
  const [regOfficerDesignation, setRegOfficerDesignation] = useState('Executive Engineer (Water Service)');
  const [regOfficerPassword, setRegOfficerPassword] = useState('');
  const [regOfficerConfirmPassword, setRegOfficerConfirmPassword] = useState('');
  const [regOfficerCode, setRegOfficerCode] = useState('');
  const [officerRegError, setOfficerRegError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode === 'gov') {
      setActiveTab('officer');
    } else {
      setActiveTab('citizen');
      setCitizenMode(initialMode === 'register' ? 'signup' : 'signin');
    }
    setCitizenSignInError(null);
    setRegError(null);
    setOfficerError(null);
    setOfficerRegError(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Handle Citizen Registration
  const handleCitizenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setCitizenSignInError(null);

    if (!regFullName.trim()) {
      setRegError('Please provide your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid email address (e.g. rahul@gmail.com, priya@yahoo.com).');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Please provide your mobile number.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Password and Confirm Password do not match.');
      return;
    }

    const res = registerCitizen({
      name: regFullName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword,
      area: regArea,
      language: regLanguage,
    });

    if (res.success) {
      setSuccessBanner('Account created successfully. Please sign in with your email and password.');
      setCitizenSignInEmail(regEmail.trim());
      setCitizenSignInPassword(regPassword);
      setCitizenSignInError(null);
      setCitizenMode('signin');
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    } else {
      setRegError(res.error || 'Failed to create account.');
    }
  };

  // Handle Citizen Sign In
  const handleCitizenSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenSignInError(null);
    setSuccessBanner(null);

    const emailTrim = citizenSignInEmail.trim();
    if (!emailTrim) {
      const msg = 'Please enter your registered email address.';
      setCitizenSignInError(msg);
      addToast(msg, 'error');
      return;
    }

    const res = loginCitizen(emailTrim, citizenSignInPassword);
    if (res.success) {
      if (promptMessage || authPromptMessage) {
        setIsReportModalOpen(true);
      } else {
        setActivePage('dashboard');
      }
      onClose();
    } else {
      const errorMsg = res.error || `Email "${emailTrim}" is not registered. Please create an account before signing in.`;
      setCitizenSignInError(errorMsg);
      addToast(errorMsg, 'error');
    }
  };

  // Handle Water Officer Sign In
  const handleOfficerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerError(null);
    if (!officerEmail.trim()) {
      setOfficerError('Please enter your Water Department Officer email address.');
      return;
    }

    const res = loginOfficer(officerEmail, officerPassword);
    if (res.success) {
      setActivePage('dashboard');
      onClose();
    } else {
      setOfficerError(res.error || 'Invalid officer credentials.');
    }
  };

  // Handle Water Officer Registration
  const handleOfficerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerRegError(null);
    if (!regOfficerName.trim()) {
      setOfficerRegError('Please provide your full name.');
      return;
    }
    if (!regOfficerEmail.trim() || !regOfficerEmail.includes('@')) {
      setOfficerRegError('Please provide a valid official email address.');
      return;
    }
    if (regOfficerPassword.length < 6) {
      setOfficerRegError('Password must be at least 6 characters.');
      return;
    }
    if (regOfficerPassword !== regOfficerConfirmPassword) {
      setOfficerRegError('Password and Confirm Password do not match.');
      return;
    }

    if (!regOfficerCode.trim()) {
      setOfficerRegError('Department Passcode / Authorization Key is mandatory for all Water Department officers.');
      return;
    }

    if (regOfficerCode.trim().toUpperCase() !== 'WTR-45') {
      setOfficerRegError('Invalid Department Passcode / Authorization Key. Please enter the valid verification code provided by the Water Department Engineering Administration.');
      return;
    }

    const res = registerOfficer({
      name: regOfficerName.trim(),
      email: regOfficerEmail.trim(),
      phone: regOfficerPhone.trim(),
      designation: regOfficerDesignation,
      password: regOfficerPassword,
      departmentCode: regOfficerCode.trim(),
    });

    if (res.success) {
      setActivePage('dashboard');
      onClose();
    } else {
      setOfficerRegError(res.error || 'Failed to register officer profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header Tabs: Exactly Two Roles (Requirement 3) */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('citizen');
              setSuccessBanner(null);
            }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'citizen'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Citizen Portal</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('officer');
              setSuccessBanner(null);
            }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'officer'
                ? 'border-cyan-600 text-cyan-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Droplet className="w-4 h-4 text-cyan-600" />
            <span>Water Department Officer</span>
          </button>

          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {successBanner && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {(promptMessage || authPromptMessage) && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 animate-in fade-in shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-slate-900">Sign In to Report Issue</strong>
                <span className="text-slate-600">{promptMessage || authPromptMessage}</span>
              </div>
            </div>
          )}

          {/* ================= CITIZEN PORTAL ================= */}
          {activeTab === 'citizen' && (
            <div className="space-y-4">
              {/* Sign In vs Sign Up Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode('signin');
                    setRegError(null);
                    setCitizenSignInError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    citizenMode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Citizen Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode('signup');
                    setCitizenSignInError(null);
                    setSuccessBanner(null);
                    if (citizenSignInEmail && !regEmail) {
                      setRegEmail(citizenSignInEmail);
                    }
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    citizenMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create New Account
                </button>
              </div>

              {/* CITIZEN SIGN IN FORM */}
              {citizenMode === 'signin' && (
                <form onSubmit={handleCitizenSignIn} className="space-y-4 pt-1">
                  {citizenSignInError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold block text-rose-900">Email Not Registered</span>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">{citizenSignInError}</p>
                        <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRegEmail(citizenSignInEmail.trim());
                              setCitizenMode('signup');
                              setCitizenSignInError(null);
                            }}
                            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
                          >
                            Create an account with this email →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={citizenSignInEmail}
                        onChange={(e) => {
                          setCitizenSignInEmail(e.target.value);
                          if (citizenSignInError) setCitizenSignInError(null);
                        }}
                        placeholder="e.g. citizen@gmail.com, rahul@yahoo.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Citizens can sign in with any registered personal email address.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCitizenPassword ? 'text' : 'password'}
                        required
                        value={citizenSignInPassword}
                        onChange={(e) => setCitizenSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCitizenPassword(!showCitizenPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCitizenPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                  >
                    Sign In as Citizen
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-semibold text-slate-400">
                      <span className="bg-white px-2">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await signInWithGoogleAuth();
                      if (ok) {
                        if (promptMessage || authPromptMessage) {
                          setIsReportModalOpen(true);
                        } else {
                          setActivePage('dashboard');
                        }
                        onClose();
                      }
                    }}
                    className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google Account</span>
                  </button>
                </form>
              )}

              {/* CITIZEN REGISTRATION FORM (Requirement 4) */}
              {citizenMode === 'signup' && (
                <form onSubmit={handleCitizenRegister} className="space-y-3 pt-1">
                  {regError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Any Valid Email) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="rahul@gmail.com, priya@yahoo.com, user123@outlook.com"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      No specific email domain required. Citizens can use any valid email.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Area / Locality *
                      </label>
                      <select
                        value={regArea}
                        onChange={(e) => setRegArea(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                      >
                        {LOCALITIES.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Language *
                      </label>
                      <select
                        value={regLanguage}
                        onChange={(e) => setRegLanguage(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                    >
                      Register Citizen Account
                    </button>
                    <span className="text-[10px] text-slate-400 text-center block mt-1.5">
                      Every public registration automatically receives role: citizen.
                    </span>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= WATER DEPARTMENT OFFICER PORTAL ================= */}
          {activeTab === 'officer' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-950 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Water Service Department — Official Control Desk</strong>
                  <span className="text-[11px] text-cyan-800">
                    Secure municipal access for authorized Water Department Engineers and Administrative Officers.
                  </span>
                </div>
              </div>

              {/* Officer Sign In vs Officer Registration Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setOfficerMode('signin');
                    setOfficerError(null);
                    setOfficerRegError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    officerMode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Officer Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOfficerMode('register');
                    setOfficerError(null);
                    setOfficerRegError(null);
                    if (officerEmail && !regOfficerEmail) {
                      setRegOfficerEmail(officerEmail);
                    }
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    officerMode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register Officer Profile
                </button>
              </div>

              {/* OFFICER SIGN IN FORM */}
              {officerMode === 'signin' && (
                <form onSubmit={handleOfficerSignIn} className="space-y-3 pt-1">
                  {officerError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{officerError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Officer Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={officerEmail}
                        onChange={(e) => {
                          setOfficerEmail(e.target.value);
                          if (officerError) setOfficerError(null);
                        }}
                        placeholder="e.g. officer@gmail.com, engineer@mbmc.gov.in"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Officer Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showOfficerPassword ? 'text' : 'password'}
                        required
                        value={officerPassword}
                        onChange={(e) => setOfficerPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOfficerPassword(!showOfficerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showOfficerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors mt-2"
                  >
                    Sign In to Water Service Dashboard
                  </button>

                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    New department officer? Switch to <button type="button" onClick={() => setOfficerMode('register')} className="text-cyan-700 font-semibold underline">Register Officer Profile</button> to activate access.
                  </p>
                </form>
              )}

              {/* OFFICER REGISTRATION FORM */}
              {officerMode === 'register' && (
                <form onSubmit={handleOfficerRegister} className="space-y-3 pt-1">
                  {officerRegError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{officerRegError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Officer Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regOfficerName}
                        onChange={(e) => setRegOfficerName(e.target.value)}
                        placeholder="e.g. Er. S. K. Patil"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={regOfficerEmail}
                        onChange={(e) => setRegOfficerEmail(e.target.value)}
                        placeholder="officer@gmail.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regOfficerPhone}
                        onChange={(e) => setRegOfficerPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Officer Designation *
                    </label>
                    <select
                      value={regOfficerDesignation}
                      onChange={(e) => setRegOfficerDesignation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="Executive Engineer (Water Service)">Executive Engineer (Water Service)</option>
                      <option value="Assistant Distribution Officer (Water)">Assistant Distribution Officer (Water)</option>
                      <option value="Water Quality & Reservoir Inspector">Water Quality & Reservoir Inspector</option>
                      <option value="Pipeline Maintenance Supervisor">Pipeline Maintenance Supervisor</option>
                      <option value="Grievance Redressal Officer">Grievance Redressal Officer</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regOfficerPassword}
                        onChange={(e) => setRegOfficerPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regOfficerConfirmPassword}
                        onChange={(e) => setRegOfficerConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Department Passcode / Authorization Key *
                      </label>
                      <span className="text-[10px] text-cyan-800 font-bold bg-cyan-100 px-2 py-0.5 rounded-full">
                        Mandatory
                      </span>
                    </div>
                    <input
                      type="password"
                      required
                      value={regOfficerCode}
                      onChange={(e) => {
                        setRegOfficerCode(e.target.value);
                        if (officerRegError) setOfficerRegError(null);
                      }}
                      placeholder="Enter official authorization key"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Mandatory verification code provided by the Water Department Engineering Administration.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors mt-2"
                  >
                    Register & Activate Officer Account
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
