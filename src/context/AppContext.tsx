import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ActivePage,
  Department,
  Language,
  NotificationItem,
  Report,
  ReportCategory,
  ReportFeedback,
  ReportPriority,
  ReportStatus,
  ReportUpdate,
  User,
  UserRole,
  Worker,
} from '../types';
import {
  DEMO_DEPARTMENTS,
  DEMO_WORKERS,
} from '../data/demoData';
import { translations } from '../data/translations';
import {
  auth,
  signInWithGoogle,
  logOutFirebase,
  subscribeToReports,
  subscribeToWorkers,
  subscribeToUsers,
  subscribeToUpdates,
  subscribeToFeedbacks,
  subscribeToNotifications,
  saveReportToFirestore,
  updateReportInFirestore,
  saveFeedbackToFirestore,
  saveUpdateToFirestore,
  saveNotificationToFirestore,
  saveUserToFirestore,
  seedInitialFirestoreData,
  persistReportStatusChange,
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  isCitizen: boolean;
  isOfficer: boolean;
  switchRole: (role: UserRole) => void;

  // Auth methods
  loginCitizen: (email: string, password?: string) => { success: boolean; error?: string };
  registerCitizen: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    area: string;
    language: 'en' | 'hi' | 'mr';
  }) => { success: boolean; message?: string; error?: string };
  loginOfficer: (email: string, password?: string) => { success: boolean; error?: string };
  registerOfficer: (data: {
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    password?: string;
    departmentCode?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  signInWithGoogleAuth: () => Promise<boolean>;
  isFirebaseConnected: boolean;

  // Data
  reports: Report[];
  departmentReports: Report[]; // Water reports for officer dashboard
  citizenReports: Report[]; // Only reports filed by current citizen
  workers: Worker[]; // Field workers (Ramesh Patil, Vijay More, Sunil Yadav, Mahesh Sharma)
  departmentWorkers: Worker[];
  feedbacks: ReportFeedback[];
  updates: ReportUpdate[];
  departments: Department[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;

  // Actions
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addReport: (data: Partial<Report>) => Report;
  confirmOfficerReview: (reportId: string) => Promise<void> | void;
  assignWorkerToReport: (reportId: string, workerId: string) => Promise<void> | void;
  startWorkOnReport: (reportId: string) => Promise<void> | void;
  updateReportStatus: (reportId: string, newStatus: ReportStatus, note?: string) => Promise<void> | void;
  addProgressUpdate: (reportId: string, message: string, photoUrl?: string) => void;
  markReportSolved: (reportId: string, resolutionDescription: string, resolutionPhotoUrl?: string) => Promise<void> | void;
  verifyCitizenResolution: (
    reportId: string,
    status: 'Yes' | 'Partially' | 'No',
    comment?: string
  ) => Promise<void> | void;
  updatePriority: (reportId: string, newPriority: ReportPriority) => void;
  updateCategory: (reportId: string, newCategory: ReportCategory) => void;
  addReportComment: (reportId: string, message: string) => void;
  addFeedback: (feedback: Omit<ReportFeedback, 'id' | 'createdAt'>) => Promise<void> | void;

  // UI state
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  reportCategoryPreset: ReportCategory | null;
  setReportCategoryPreset: (category: ReportCategory | null) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'gov';
  setAuthModalMode: (mode: 'login' | 'register' | 'gov') => void;
  authPromptMessage: string | null;
  setAuthPromptMessage: (msg: string | null) => void;
  openAuthModal: (mode?: 'login' | 'register' | 'gov', promptMessage?: string | null) => void;
  closeAuthModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user & authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const isSignedOut = localStorage.getItem('mbu_signed_out') === 'true';
      if (isSignedOut) return null;
      const saved = localStorage.getItem('mbu_user_session_v4');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id && u.id !== 'usr-cit-101' && u.id !== 'off-water-1') {
          return u;
        }
      }
    } catch (e) {}
    return null;
  });

  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => {
    try {
      const isSignedOut = localStorage.getItem('mbu_signed_out') === 'true';
      if (isSignedOut) return null;
      const saved = localStorage.getItem('mbu_user_session_v4');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id && u.id !== 'usr-cit-101' && u.id !== 'off-water-1') {
          if (u.role === 'water_officer' || u.role === 'department_officer') return 'department_officer';
          return 'citizen';
        }
      }
    } catch (e) {}
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const isSignedOut = localStorage.getItem('mbu_signed_out') === 'true';
      if (isSignedOut) return false;
      const saved = localStorage.getItem('mbu_user_session_v4');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.id && u.id !== 'usr-cit-101' && u.id !== 'off-water-1') {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  });

  // Data collections - strictly empty for fresh start
  const [reports, setReports] = useState<Report[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_reports_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_workers_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEMO_WORKERS;
  });

  const [departments] = useState<Department[]>(DEMO_DEPARTMENTS);

  const [updates, setUpdates] = useState<ReportUpdate[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_updates_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [feedbacks, setFeedbacks] = useState<ReportFeedback[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_feedbacks_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_notifications_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [registeredCitizens, setRegisteredCitizens] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_registered_citizens_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [registeredOfficers, setRegisteredOfficers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_registered_officers_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // UI States
  const [language, setLanguage] = useState<Language>('en');
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReportModalOpenState, setIsReportModalOpenState] = useState(false);
  const [reportCategoryPreset, setReportCategoryPreset] = useState<ReportCategory | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Authentication Modal States (Guards unauthenticated actions)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'gov'>('login');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);

  const openAuthModal = (
    mode: 'login' | 'register' | 'gov' = 'login',
    promptMessage: string | null = null
  ) => {
    setAuthModalMode(mode);
    setAuthPromptMessage(promptMessage);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPromptMessage(null);
  };

  // Guarded report modal opener: without sign in / sign up, do not open report form; show sign in
  const setIsReportModalOpen = (open: boolean) => {
    if (open) {
      if (!isAuthenticated || !currentUser) {
        addToast('Sign in required. Please sign in or register to report a water issue.', 'info');
        setAuthPromptMessage('Please sign in or register to report a water issue.');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
        setIsReportModalOpenState(false);
        return;
      }
    }
    setIsReportModalOpenState(open);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbu_reports_v4', JSON.stringify(reports));
    } catch (e) {}
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_workers_v4', JSON.stringify(workers));
    } catch (e) {}
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_updates_v4', JSON.stringify(updates));
    } catch (e) {}
  }, [updates]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_feedbacks_v4', JSON.stringify(feedbacks));
    } catch (e) {}
  }, [feedbacks]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_notifications_v4', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_registered_citizens_v4', JSON.stringify(registeredCitizens));
    } catch (e) {}
  }, [registeredCitizens]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_registered_officers_v4', JSON.stringify(registeredOfficers));
    } catch (e) {}
  }, [registeredOfficers]);

  // Firestore Sync & Seed
  useEffect(() => {
    let isMounted = true;
    seedInitialFirestoreData().catch(() => {});

    const unsubReports = subscribeToReports((newReports) => {
      if (!isMounted) return;
      setIsFirebaseConnected(true);
      if (Array.isArray(newReports)) {
        setReports(newReports);
      }
    });

    const unsubWorkers = subscribeToWorkers((newWorkers) => {
      if (!isMounted) return;
      if (newWorkers && newWorkers.length > 0) {
        setWorkers(newWorkers);
      }
    });

    const unsubUsers = subscribeToUsers((firestoreUsers) => {
      if (!isMounted) return;
      if (Array.isArray(firestoreUsers)) {
        const citizens = firestoreUsers.filter((u) => u.role === 'citizen');
        const officers = firestoreUsers.filter(
          (u) => u.role === 'water_officer' || u.role === 'department_officer'
        );
        setRegisteredCitizens(citizens);
        setRegisteredOfficers(officers);
      }
    });

    const unsubUpdates = subscribeToUpdates((newUpdates) => {
      if (!isMounted) return;
      if (Array.isArray(newUpdates)) {
        setUpdates(newUpdates);
      }
    });

    const unsubFeedbacks = subscribeToFeedbacks((newFeedbacks) => {
      if (!isMounted) return;
      if (Array.isArray(newFeedbacks)) {
        setFeedbacks(newFeedbacks);
      }
    });

    const unsubNotifications = subscribeToNotifications((newNotifs) => {
      if (!isMounted) return;
      if (Array.isArray(newNotifs)) {
        setNotifications(newNotifs);
      }
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      if (user) {
        setIsFirebaseConnected(true);
      }
    });

    return () => {
      isMounted = false;
      unsubReports();
      unsubWorkers();
      unsubUsers();
      unsubUpdates();
      unsubFeedbacks();
      unsubNotifications();
      unsubAuth();
    };
  }, []);

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Notification Helpers
  const addAppNotification = (notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      notificationId: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n.notificationId === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationCount = useMemo(() => {
    if (!currentUser || !isAuthenticated) return 0;
    return notifications.filter((n) => !n.read && (n.userId === currentUser.id || n.userId === 'all' || n.userId === 'officer')).length;
  }, [notifications, currentUser, isAuthenticated]);

  // All reports belong to Water Service Department
  const departmentReports = reports;

  // Reports filed by the logged-in citizen
  const citizenReports = useMemo(() => {
    if (!currentUser) return [];
    return reports.filter(
      (r) =>
        r.citizenId === currentUser.id ||
        (r.citizenName && r.citizenName.toLowerCase() === currentUser.name.toLowerCase())
    );
  }, [reports, currentUser]);

  // Water Department Workers
  const departmentWorkers = workers;

  // Citizen Registration (Requirement 4)
  const registerCitizen = (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    area: string;
    language: 'en' | 'hi' | 'mr';
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();

    // Prevent officer email from registering as citizen
    const isOfficerEmail = registeredOfficers.some(
      (off) => off.email.toLowerCase() === cleanEmail
    );
    if (isOfficerEmail) {
      return {
        success: false,
        error: 'Water Department Officer accounts are managed administratively and cannot be created via citizen registration.',
      };
    }

    // Check if account already registered
    const alreadyExists = registeredCitizens.some((c) => c.email.toLowerCase() === cleanEmail);

    if (alreadyExists) {
      return {
        success: false,
        error: `An account with email "${cleanEmail}" is already registered. Please sign in instead.`,
      };
    }

    const newCitizen: User = {
      id: `usr-cit-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      role: 'citizen',
      area: data.area,
      language: data.language,
      departmentId: 'water',
      departmentName: 'Water Service Department',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      createdAt: new Date().toISOString(),
      isGovAuthenticated: false,
    };

    if (data.password) {
      try {
        const stored = localStorage.getItem('mbu_citizen_passwords');
        const passMap = stored ? JSON.parse(stored) : {};
        passMap[cleanEmail] = data.password;
        localStorage.setItem('mbu_citizen_passwords', JSON.stringify(passMap));
      } catch (e) {}
    }

    setRegisteredCitizens((prev) => [...prev, newCitizen]);
    saveUserToFirestore(newCitizen);

    addToast('Account created successfully. Please sign in.', 'success');
    return { success: true, message: 'Account created successfully. Please sign in.' };
  };

  // Citizen Login (Requirement 4 & Unregistered Email Prompt)
  const loginCitizen = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Please enter your registered email address.',
      };
    }

    // Check if user is attempting to sign in with an officer email
    const isOfficer = registeredOfficers.find(
      (off) => off.email.toLowerCase() === cleanEmail
    );
    if (isOfficer) {
      return {
        success: false,
        error: `This email belongs to a Water Department Officer. Please switch to the "Water Department Officer" tab to sign in.`,
      };
    }

    const existing = registeredCitizens.find((c) => c.email.toLowerCase() === cleanEmail);

    if (!existing) {
      return {
        success: false,
        error: `Email "${cleanEmail}" is not registered. Please create an account before signing in.`,
      };
    }

    // Check password if set
    if (password) {
      try {
        const stored = localStorage.getItem('mbu_citizen_passwords');
        if (stored) {
          const passMap = JSON.parse(stored);
          const savedPass = passMap[cleanEmail];
          if (savedPass && savedPass !== password) {
            return {
              success: false,
              error: 'Invalid password. Please verify your credentials and try again.',
            };
          }
        }
      } catch (e) {}
    }

    try {
      localStorage.removeItem('mbu_signed_out');
      localStorage.setItem('mbu_auth_active', 'true');
      localStorage.setItem('mbu_user_session_v4', JSON.stringify(existing));
    } catch (e) {}

    setCurrentUser(existing);
    setCurrentRole('citizen');
    setIsAuthenticated(true);
    saveUserToFirestore(existing);
    addToast(`Signed in as ${existing.name}`, 'success');
    return { success: true };
  };

  // Water Officer Login (Requirement 2 & 5)
  const loginOfficer = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return {
        success: false,
        error: 'Please enter your Water Department Officer email address.',
      };
    }

    const foundOfficer = registeredOfficers.find(
      (off) => off.email.toLowerCase() === cleanEmail
    );

    if (foundOfficer) {
      if (password) {
        try {
          const stored = localStorage.getItem('mbu_officer_passwords');
          if (stored) {
            const passMap = JSON.parse(stored);
            const savedPass = passMap[cleanEmail];
            if (savedPass && savedPass !== password) {
              return {
                success: false,
                error: 'Invalid officer password. Please verify and try again.',
              };
            }
          }
        } catch (e) {}
      }

      try {
        localStorage.removeItem('mbu_signed_out');
        localStorage.setItem('mbu_auth_active', 'true');
        localStorage.setItem('mbu_user_session_v4', JSON.stringify(foundOfficer));
      } catch (e) {}
      setCurrentUser(foundOfficer);
      setCurrentRole('department_officer');
      setIsAuthenticated(true);
      saveUserToFirestore(foundOfficer);
      addToast(`Welcome, Officer ${foundOfficer.name} (Water Service Department)`, 'success');
      return { success: true };
    }

    // Direct department passcode login for instant administrative provisioning
    const isDepartmentPasscode = password && password.trim().toUpperCase() === 'WTR-45';

    if (isDepartmentPasscode) {
      const defaultName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      const newOfficer: User = {
        id: `off-water-${Date.now()}`,
        name: `Er. ${formattedName}`,
        email: cleanEmail,
        role: 'water_officer',
        departmentId: 'water',
        departmentName: 'Water Service Department',
        phone: '+91 98200 20000',
        area: 'Mira Road & Bhayandar Water Zones',
        language: 'en',
        designation: 'Executive Engineer (Water Service)',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        createdAt: new Date().toISOString(),
        isGovAuthenticated: true,
      };

      setRegisteredOfficers((prev) => [...prev.filter((o) => o.email.toLowerCase() !== cleanEmail), newOfficer]);
      try {
        localStorage.removeItem('mbu_signed_out');
        localStorage.setItem('mbu_auth_active', 'true');
        localStorage.setItem('mbu_user_session_v4', JSON.stringify(newOfficer));
        const storedPassMap = JSON.parse(localStorage.getItem('mbu_officer_passwords') || '{}');
        storedPassMap[cleanEmail] = password;
        localStorage.setItem('mbu_officer_passwords', JSON.stringify(storedPassMap));
      } catch (e) {}

      setCurrentUser(newOfficer);
      setCurrentRole('department_officer');
      setIsAuthenticated(true);
      saveUserToFirestore(newOfficer);
      addToast(`Officer profile provisioned and signed in: ${newOfficer.name}`, 'success');
      return { success: true };
    }

    return {
      success: false,
      error: `Officer account "${cleanEmail}" is not registered. Please register using the "Register Officer" tab with your Department Security Passcode.`,
    };
  };

  // Register / Provision Water Department Officer
  const registerOfficer = (data: {
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    password?: string;
    departmentCode?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please provide a valid official email address.' };
    }
    if (!data.name.trim()) {
      return { success: false, error: 'Please provide officer full name.' };
    }

    const code = (data.departmentCode || '').trim().toUpperCase();
    if (code !== 'WTR-45') {
      return {
        success: false,
        error: 'Invalid Department Passcode / Authorization Key. Please enter the valid verification code provided by the Water Department Engineering Administration.',
      };
    }

    const formattedName = data.name.trim().startsWith('Er.') ? data.name.trim() : `Er. ${data.name.trim()}`;

    const newOfficer: User = {
      id: `off-water-${Date.now()}`,
      name: formattedName,
      email: cleanEmail,
      phone: (data.phone || '+91 98200 20000').trim(),
      role: 'water_officer',
      departmentId: 'water',
      departmentName: 'Water Service Department',
      area: 'Mira Road & Bhayandar Water Zones',
      designation: (data.designation || 'Executive Engineer (Water Service)').trim(),
      language: 'en',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
      createdAt: new Date().toISOString(),
      isGovAuthenticated: true,
    };

    if (data.password) {
      try {
        const stored = localStorage.getItem('mbu_officer_passwords');
        const passMap = stored ? JSON.parse(stored) : {};
        passMap[cleanEmail] = data.password;
        localStorage.setItem('mbu_officer_passwords', JSON.stringify(passMap));
      } catch (e) {}
    }

    setRegisteredOfficers((prev) => [...prev.filter((o) => o.email.toLowerCase() !== cleanEmail), newOfficer]);
    saveUserToFirestore(newOfficer);

    try {
      localStorage.removeItem('mbu_signed_out');
      localStorage.setItem('mbu_auth_active', 'true');
      localStorage.setItem('mbu_user_session_v4', JSON.stringify(newOfficer));
    } catch (e) {}

    setCurrentUser(newOfficer);
    setCurrentRole('department_officer');
    setIsAuthenticated(true);
    addToast(`Officer profile created and signed in: ${newOfficer.name}`, 'success');
    return { success: true };
  };

  // Switch Role
  const switchRole = (role: UserRole) => {
    try {
      localStorage.removeItem('mbu_signed_out');
      localStorage.setItem('mbu_auth_active', 'true');
    } catch (e) {}

    if (role === 'citizen') {
      const u = registeredCitizens[0] || null;
      if (u) {
        try {
          localStorage.setItem('mbu_user_session_v4', JSON.stringify(u));
        } catch (e) {}
        setCurrentUser(u);
        setCurrentRole('citizen');
        setIsAuthenticated(true);
        addToast(`Active Role: Citizen (${u.name})`, 'info');
      }
    } else if (role === 'water_officer' || role === 'department_officer') {
      const waterOfficer = registeredOfficers[0] || null;
      if (waterOfficer) {
        try {
          localStorage.setItem('mbu_user_session_v4', JSON.stringify(waterOfficer));
        } catch (e) {}
        setCurrentUser(waterOfficer);
        setCurrentRole('department_officer');
        setIsAuthenticated(true);
        addToast(`Active Role: Water Officer ${waterOfficer.name}`, 'info');
      }
    }
  };

  // Logout
  const logout = () => {
    logOutFirebase().catch(() => {});
    try {
      localStorage.removeItem('mbu_user_session_v4');
      localStorage.removeItem('mbu_user_session_v2');
      localStorage.removeItem('mbu_auth_active');
      localStorage.setItem('mbu_signed_out', 'true');
    } catch (e) {}
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUser(null);
    setActivePage('home');
    addToast('Signed out successfully.', 'info');
  };

  // Google Auth
  const signInWithGoogleAuth = async (): Promise<boolean> => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        const citizenUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google Citizen',
          email: fbUser.email || 'citizen@gmail.com',
          phone: fbUser.phoneNumber || '+91 98200 12345',
          role: 'citizen',
          area: 'Mira Road East (Beverly Park)',
          language: 'en',
          departmentId: 'water',
          departmentName: 'Water Service Department',
          avatar: fbUser.photoURL || undefined,
          isGovAuthenticated: false,
        };
        try {
          localStorage.removeItem('mbu_signed_out');
          localStorage.setItem('mbu_auth_active', 'true');
          localStorage.setItem('mbu_user_session_v4', JSON.stringify(citizenUser));
        } catch (e) {}
        setCurrentUser(citizenUser);
        setCurrentRole('citizen');
        setIsAuthenticated(true);
        saveUserToFirestore(citizenUser);
        addToast(`Signed in with Google as ${citizenUser.name}`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('Google Sign-In failed: ' + (err.message || 'Please try again'), 'error');
      return false;
    }
  };

  // WORKFLOW: 10. REPORT CREATION (Unique ID format: WTR-2026-000001)
  const addReport = (data: Partial<Report>): Report => {
    if (!isAuthenticated || !currentUser) {
      addToast('Authentication required: Please sign in or register to submit a water report.', 'error');
      openAuthModal('login', 'Please sign in or register to submit a water report.');
      throw new Error('User must be authenticated to submit a report.');
    }

    const reportIndex = reports.length + 1;
    const paddedNum = String(reportIndex).padStart(6, '0');
    const reportId = `WTR-2026-${paddedNum}`;

    const cat = (data.category as ReportCategory) || 'Water Supply';
    const now = new Date().toISOString();

    const newReport: Report = {
      id: reportId,
      reportId: reportId,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      citizenPhone: currentUser.phone || data.citizenPhone || '+91 98200 00000',
      title: data.title || 'Water Issue in Mira-Bhayandar',
      description: data.description || '',
      category: cat,
      aiSuggestedCategory: data.aiSuggestedCategory || cat,
      departmentId: 'water',
      departmentName: 'Water Service Department',
      priority: data.priority || 'Medium',
      location: data.location || 'Mira Road, MBMC',
      area: data.area || currentUser.area || 'Mira Road East',
      landmark: data.landmark,
      photo: data.photo || data.photoUrl,
      photoUrl: data.photoUrl || data.photo,
      status: 'SUBMITTED', // Starts at SUBMITTED
      aiAnalysis: data.aiAnalysis,
      createdAt: now,
      updatedAt: now,
      isSolved: false,
    };

    setReports((prev) => [newReport, ...prev]);
    saveReportToFirestore(newReport);

    // Audit Update Log
    const auditUpdate: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: reportId,
      status: 'SUBMITTED',
      message: `Report filed by citizen ${newReport.citizenName}. AI analyzed category as "${cat}" with ${newReport.priority} priority recommendation.`,
      createdBy: 'System (Water Intake Desk)',
      role: 'System',
      createdAt: now,
    };
    setUpdates((prev) => [auditUpdate, ...prev]);
    saveUpdateToFirestore(auditUpdate);

    // Citizen Notification
    if (currentUser?.id) {
      addAppNotification({
        userId: currentUser.id,
        title: 'Water Report Submitted Successfully',
        message: `Your water report ${reportId} has been submitted to the Water Service Department.`,
        type: 'info',
        reportId: reportId,
      });
    }

    addToast(`Water Report ${reportId} submitted successfully!`, 'success');
    return newReport;
  };

  // WORKFLOW: Confirm Issue Review by Officer (moves to OFFICER_REVIEW)
  const confirmOfficerReview = async (reportId: string) => {
    const updated = await persistReportStatusChange(
      reportId,
      'OFFICER_REVIEW',
      {},
      `Water Department Officer ${currentUser?.name || 'Officer'} confirmed and reviewed the complaint.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, ...updated } : r)));
    }
    addToast('Issue confirmed and placed under officer review.', 'success');
  };

  // WORKFLOW: 17. ASSIGN WORKER
  const assignWorkerToReport = async (reportId: string, workerId: string) => {
    const worker = workers.find((w) => w.workerId === workerId);
    if (!worker) {
      addToast('Worker not found in Water Service Department records.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const updated = await persistReportStatusChange(
      reportId,
      'WORKER_ASSIGNED',
      {
        assignedWorkerId: worker.workerId,
        assignedWorkerName: worker.workerName,
        assignedByOfficerId: currentUser?.id || 'water_officer',
        assignedByOfficerName: currentUser?.name || 'Water Department Officer',
        assignedAt: now,
      },
      `Assigned Field Worker ${worker.workerName} (Phone: ${worker.phoneNumber}) by Officer ${currentUser?.name || 'Officer'}.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );

    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, ...updated } : r)));
    }

    setWorkers((prev) =>
      prev.map((w) =>
        w.workerId === workerId ? { ...w, assignedTasksCount: (w.assignedTasksCount || 0) + 1 } : w
      )
    );

    const targetReport = reports.find((r) => r.id === reportId || r.reportId === reportId);
    if (targetReport) {
      addAppNotification({
        userId: targetReport.citizenId,
        title: 'Field Worker Assigned',
        message: `Field Worker ${worker.workerName} has been assigned to your water issue ${reportId}.`,
        type: 'assignment',
        reportId: reportId,
      });
    }

    addToast(`Worker ${worker.workerName} assigned successfully.`, 'success');
  };

  // WORKFLOW: 18. WORK IN PROGRESS
  const startWorkOnReport = async (reportId: string) => {
    const current = reports.find((r) => r.id === reportId || r.reportId === reportId);
    const defaultWorker = DEMO_WORKERS[0] || { workerId: 'w-001', workerName: 'Ramesh Patil' };
    const finalWorkerId = current?.assignedWorkerId || defaultWorker.workerId;
    const finalWorkerName = current?.assignedWorkerName || defaultWorker.workerName;
    const now = new Date().toISOString();

    const updated = await persistReportStatusChange(
      reportId,
      'WORK_IN_PROGRESS',
      {
        assignedWorkerId: finalWorkerId,
        assignedWorkerName: finalWorkerName,
        assignedByOfficerId: current?.assignedByOfficerId || currentUser?.id || 'water_officer',
        assignedByOfficerName: current?.assignedByOfficerName || currentUser?.name || 'Water Department Officer',
        startedAt: current?.startedAt || now,
      },
      `Field repair work commenced on site by assigned worker ${finalWorkerName}.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );

    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, ...updated } : r)));
    }

    if (current) {
      addAppNotification({
        userId: current.citizenId,
        title: 'Work In Progress',
        message: `Work on your water issue ${reportId} is now in progress (Assigned Worker: ${finalWorkerName}).`,
        type: 'status_change',
        reportId: reportId,
      });
    }

    addToast(`Work on ${reportId} is now In Progress (Worker: ${finalWorkerName}).`, 'success');
  };

  // Direct status update by officer
  const updateReportStatus = async (reportId: string, newStatus: ReportStatus, note?: string) => {
    const current = reports.find((r) => r.id === reportId || r.reportId === reportId);
    const defaultWorker = DEMO_WORKERS[0] || { workerId: 'w-001', workerName: 'Ramesh Patil' };
    const finalWorkerId =
      current?.assignedWorkerId ||
      (newStatus === 'WORK_IN_PROGRESS' || newStatus === 'WORKER_ASSIGNED'
        ? defaultWorker.workerId
        : undefined);
    const finalWorkerName =
      current?.assignedWorkerName ||
      (newStatus === 'WORK_IN_PROGRESS' || newStatus === 'WORKER_ASSIGNED'
        ? defaultWorker.workerName
        : undefined);

    const updated = await persistReportStatusChange(
      reportId,
      newStatus,
      {
        assignedWorkerId: finalWorkerId,
        assignedWorkerName: finalWorkerName,
      },
      note || `Status updated to ${newStatus.replace(/_/g, ' ')} by Officer ${currentUser?.name || 'Water Officer'}.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );

    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, ...updated } : r)));
    }

    addToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
  };

  // WORKFLOW: 19. PROGRESS UPDATES
  const addProgressUpdate = (reportId: string, message: string, photoUrl?: string) => {
    const now = new Date().toISOString();
    const current = reports.find((r) => r.id === reportId || r.reportId === reportId);
    const currentStatus = current?.status || 'WORK_IN_PROGRESS';
    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: reportId,
      status: currentStatus,
      message: message.trim(),
      photoUrl: photoUrl || undefined,
      createdBy: currentUser?.name || 'Water Officer',
      role: currentUser?.designation || 'Water Department Officer',
      createdAt: now,
    };
    setUpdates((prev) => [upd, ...prev]);
    saveUpdateToFirestore(upd);

    updateReportInFirestore(reportId, { updatedAt: now });
    setReports((prev) =>
      prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, updatedAt: now } : r))
    );

    // Notify citizen
    if (current) {
      addAppNotification({
        userId: current.citizenId,
        title: 'New Progress Update',
        message: `Update on ${reportId}: "${message.trim()}"`,
        type: 'info',
        reportId: reportId,
      });
    }

    addToast('Progress update published for citizen.', 'success');
  };

  // WORKFLOW: 20. MARK AS SOLVED
  const markReportSolved = async (
    reportId: string,
    resolutionDescription: string,
    resolutionPhotoUrl?: string
  ) => {
    const now = new Date().toISOString();
    const current = reports.find((r) => r.id === reportId || r.reportId === reportId);

    const updated = await persistReportStatusChange(
      reportId,
      'SOLVED',
      {
        isSolved: true,
        resolutionNotes: resolutionDescription,
        resolutionPhotoUrl: resolutionPhotoUrl || current?.resolutionPhotoUrl,
        solvedAt: now,
      },
      `Issue marked as solved by Officer ${currentUser?.name || 'Officer'}. Resolution: "${resolutionDescription}". Awaiting citizen verification.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );

    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, ...updated } : r)));
    }

    if (current) {
      addAppNotification({
        userId: current.citizenId,
        title: 'Water Issue Solved — Verification Required',
        message: `Your water issue ${reportId} has been marked as solved. Please verify the resolution.`,
        type: 'verification',
        reportId: reportId,
      });
    }

    addToast('Marked as solved. Citizen verification requested.', 'success');
  };

  // WORKFLOW: 21. CITIZEN VERIFICATION
  const verifyCitizenResolution = async (
    reportId: string,
    status: 'Yes' | 'Partially' | 'No',
    comment?: string
  ) => {
    const now = new Date().toISOString();
    const isYes = status === 'Yes';
    const targetStatus: ReportStatus = isYes ? 'CLOSED' : 'REOPENED';
    const verificationNote =
      comment || (isYes ? 'Citizen verified complete resolution.' : 'Citizen indicated water issue is not fully resolved.');

    const updated = await persistReportStatusChange(
      reportId,
      targetStatus,
      {
        isSolved: isYes,
        closedAt: isYes ? now : undefined,
        reopenedAt: !isYes ? now : undefined,
        reopenComment: !isYes ? verificationNote : undefined,
        citizenVerification: {
          status,
          comment: verificationNote,
          verifiedAt: now,
        },
      },
      isYes
        ? 'Citizen verified successful resolution. Water issue is now officially CLOSED.'
        : `Citizen marked resolution as "${status === 'Partially' ? 'Partially Resolved' : 'Not Resolved'}". Comment: "${verificationNote}". Reopened and returned to Water Officer dashboard.`,
      { id: currentUser?.id, name: currentUser?.name || 'Citizen', role: 'Citizen' }
    );

    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === reportId || r.reportId === reportId ? { ...r, ...updated } : r)));
    }

    if (isYes) {
      addToast('Thank you! Resolution verified and issue closed.', 'success');
    } else {
      addToast('Issue reopened and returned to Water Officer dashboard.', 'info');
    }
  };

  // Update Priority
  const updatePriority = (reportId: string, newPriority: ReportPriority) => {
    const now = new Date().toISOString();
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId || r.reportId === reportId) {
          const updated = { ...r, priority: newPriority, updatedAt: now };
          updateReportInFirestore(reportId, updated);
          return updated;
        }
        return r;
      })
    );

    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: reportId,
      status: 'OFFICER_REVIEW',
      message: `Priority updated to ${newPriority} by Water Officer ${currentUser?.name || 'Officer'}.`,
      createdBy: currentUser?.name || 'Water Department Officer',
      role: currentUser?.designation || 'Water Officer',
      createdAt: now,
    };
    setUpdates((prev) => [upd, ...prev]);
    saveUpdateToFirestore(upd);

    addToast(`Priority updated to ${newPriority}`, 'success');
  };

  // Update Category
  const updateCategory = (reportId: string, newCategory: ReportCategory) => {
    const now = new Date().toISOString();
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId || r.reportId === reportId) {
          const updated = { ...r, category: newCategory, updatedAt: now };
          updateReportInFirestore(reportId, updated);
          return updated;
        }
        return r;
      })
    );

    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: reportId,
      status: 'OFFICER_REVIEW',
      message: `Category updated to ${newCategory} by Water Officer ${currentUser?.name || 'Officer'}.`,
      createdBy: currentUser?.name || 'Water Department Officer',
      role: currentUser?.designation || 'Water Officer',
      createdAt: now,
    };
    setUpdates((prev) => [upd, ...prev]);
    saveUpdateToFirestore(upd);

    addToast(`Category updated to ${newCategory}`, 'success');
  };

  // Add Comment to Report
  const addReportComment = (reportId: string, message: string) => {
    const now = new Date().toISOString();
    const current = reports.find((r) => r.id === reportId || r.reportId === reportId);
    const isOff = currentRole === 'department_officer' || currentRole === 'water_officer';
    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: reportId,
      status: current?.status || 'SUBMITTED',
      message: message,
      createdBy: currentUser?.name || (isOff ? 'Water Officer' : 'Citizen'),
      role: isOff ? (currentUser?.designation || 'Water Officer') : 'Citizen',
      createdAt: now,
    };
    setUpdates((prev) => [upd, ...prev]);
    saveUpdateToFirestore(upd);
    addToast('Comment added successfully', 'success');
  };

  // Add Feedback after closure without resetting report status (Requirement 9)
  const addFeedback = async (feedback: Omit<ReportFeedback, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newFb: ReportFeedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      feedbackId: `fb-${Date.now()}`,
      createdAt: now,
    };
    setFeedbacks((prev) => [newFb, ...prev]);
    await saveFeedbackToFirestore(newFb);

    // If report has not yet been verified/closed, finalize it now
    const current = reports.find((r) => r.id === feedback.reportId || r.reportId === feedback.reportId);
    if (current && current.status !== 'CLOSED' && current.status !== 'REOPENED') {
      await verifyCitizenResolution(
        feedback.reportId,
        feedback.resolutionStatus || 'Yes',
        feedback.comment
      );
    } else {
      addToast('Feedback recorded. Thank you for rating the water service!', 'success');
    }
  };

  const t = translations[language] || translations.en;

  const value: AppContextType = {
    currentUser,
    currentRole,
    isAuthenticated,
    isCitizen: Boolean(isAuthenticated && currentUser && currentRole === 'citizen'),
    isOfficer: Boolean(
      isAuthenticated &&
        currentUser &&
        (currentRole === 'water_officer' || currentRole === 'department_officer')
    ),
    switchRole,
    loginCitizen,
    registerCitizen,
    loginOfficer,
    registerOfficer,
    logout,
    signInWithGoogleAuth,
    isFirebaseConnected,
    reports,
    departmentReports,
    citizenReports,
    workers,
    departmentWorkers,
    feedbacks,
    updates,
    departments,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    clearNotifications,
    addReport,
    confirmOfficerReview,
    assignWorkerToReport,
    startWorkOnReport,
    updateReportStatus,
    addProgressUpdate,
    markReportSolved,
    verifyCitizenResolution,
    updatePriority,
    updateCategory,
    addReportComment,
    addFeedback,
    language,
    setLanguage,
    t,
    activePage,
    setActivePage,
    selectedReportId,
    setSelectedReportId,
    isReportModalOpen: isReportModalOpenState,
    setIsReportModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    authPromptMessage,
    setAuthPromptMessage,
    openAuthModal,
    closeAuthModal,
    reportCategoryPreset,
    setReportCategoryPreset,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    searchQuery,
    setSearchQuery,
    toasts,
    addToast,
    removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
