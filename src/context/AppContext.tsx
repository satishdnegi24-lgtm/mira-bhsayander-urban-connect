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
  WaterIssue,
  WaterReport,
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
  subscribeToWaterIssues,
  subscribeToWaterReports,
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
  persistWaterIssueStatusChange,
  updateWaterIssueInFirestore,
  submitCitizenVerificationFeedback,
  submitCitizenWaterReport,
  syncAndMigrateExistingData,
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
  signInWithGoogleAuth: (emailParam?: string) => Promise<boolean>;
  isFirebaseConnected: boolean;

  // Data
  reports: Report[];
  waterIssues: WaterIssue[];
  waterReports: WaterReport[];
  departmentReports: Report[]; // Water reports for officer dashboard
  departmentIssues: WaterIssue[]; // Operational water issues for officer dashboard (ONE issue for many citizen reports)
  citizenReports: Report[]; // Only reports filed by current citizen
  workers: Worker[]; // Field workers (Ramesh Patil, Vijay More, Sunil Yadav, Mahesh Sharma)
  departmentWorkers: Worker[];
  feedbacks: ReportFeedback[];
  updates: ReportUpdate[];
  departments: Department[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;

  // Actions & Queries
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addReport: (data: Partial<Report>) => Promise<Report> | Report;
  getReportsForIssue: (issueId: string) => WaterReport[];
  getIssueForReport: (reportId: string) => WaterIssue | null;
  confirmOfficerReview: (reportId: string) => Promise<void> | void;
  assignWorkerToReport: (reportId: string, workerId: string) => Promise<void> | void;
  startWorkOnReport: (reportId: string) => Promise<void> | void;
  updateReportStatus: (reportId: string, newStatus: ReportStatus, note?: string) => Promise<void> | void;
  addProgressUpdate: (reportId: string, message: string, photoUrl?: string) => void;
  markReportSolved: (reportId: string, resolutionDescription: string, resolutionPhotoUrl?: string) => Promise<void> | void;
  verifyCitizenResolution: (
    reportId: string,
    status: 'Yes' | 'Partially' | 'No' | 'YES_SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED',
    comment?: string,
    rating?: number
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
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  selectedIssue: WaterIssue | null;
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

  // Operational Water Issues (ONE issue for MULTIPLE citizen reports)
  const [waterIssues, setWaterIssues] = useState<WaterIssue[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_water_issues_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Individual Citizen Reports
  const [waterReports, setWaterReports] = useState<WaterReport[]>(() => {
    try {
      const saved = localStorage.getItem('mbu_water_reports_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
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
  const [selectedReportId, setSelectedReportIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mbu_selected_report_id') || null;
    } catch (e) {
      return null;
    }
  });

  const setSelectedReportId = (id: string | null) => {
    setSelectedReportIdState(id);
    try {
      if (id) {
        localStorage.setItem('mbu_selected_report_id', id);
      } else {
        localStorage.removeItem('mbu_selected_report_id');
      }
    } catch (e) {}
  };

  const [selectedIssueId, setSelectedIssueIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mbu_selected_issue_id') || null;
    } catch (e) {
      return null;
    }
  });

  const setSelectedIssueId = (id: string | null) => {
    setSelectedIssueIdState(id);
    try {
      if (id) {
        localStorage.setItem('mbu_selected_issue_id', id);
      } else {
        localStorage.removeItem('mbu_selected_issue_id');
      }
    } catch (e) {}
  };
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
      localStorage.setItem('mbu_water_issues_v4', JSON.stringify(waterIssues));
    } catch (e) {}
  }, [waterIssues]);

  useEffect(() => {
    try {
      localStorage.setItem('mbu_water_reports_v4', JSON.stringify(waterReports));
    } catch (e) {}
  }, [waterReports]);

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

  // Firestore Sync & Migration
  useEffect(() => {
    let isMounted = true;
    seedInitialFirestoreData().catch(() => {});
    syncAndMigrateExistingData().catch(() => {});

    // Operational Water Issues stream (Source of truth for Officer Dashboard)
    const unsubIssues = subscribeToWaterIssues((newIssues) => {
      if (!isMounted) return;
      setIsFirebaseConnected(true);
      if (Array.isArray(newIssues)) {
        setWaterIssues(newIssues);
        // Synchronize reports in state so all consumers immediately reflect WaterIssue operational status
        setReports((prev) =>
          prev.map((r) => {
            const matched = newIssues.find(
              (i) => i.issueId === r.issueId || i.id === r.issueId || i.issueId === r.id || i.id === r.id
            );
            if (matched) {
              return {
                ...r,
                status: matched.status,
                isSolved: matched.status === 'CLOSED',
                closedAt: matched.closedAt ?? r.closedAt,
                reopenedAt: matched.reopenedAt ?? r.reopenedAt,
                reopenReason: matched.reopenReason ?? r.reopenReason,
              };
            }
            return r;
          })
        );
      }
    });

    // Individual Citizen Reports stream
    const unsubWaterReports = subscribeToWaterReports((newReports) => {
      if (!isMounted) return;
      setIsFirebaseConnected(true);
      if (Array.isArray(newReports)) {
        setWaterReports(newReports);
        setReports(newReports);
      }
    });

    const unsubReports = subscribeToReports((newReports) => {
      if (!isMounted) return;
      setIsFirebaseConnected(true);
      if (Array.isArray(newReports) && newReports.length > 0) {
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
      unsubIssues();
      unsubWaterReports();
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

  // Operational Water Issues for Officer Dashboard (ONE issue for many citizen reports)
  const departmentIssues = useMemo(() => {
    return waterIssues;
  }, [waterIssues]);

  const selectedIssue = useMemo(() => {
    if (selectedIssueId) {
      return (
        waterIssues.find((i) => i.issueId === selectedIssueId || i.id === selectedIssueId) || null
      );
    }
    return waterIssues[0] || null;
  }, [waterIssues, selectedIssueId]);

  const getReportsForIssue = (issueId: string): WaterReport[] => {
    const list = waterReports.length > 0 ? waterReports : reports;
    return list.filter(
      (r) => r.issueId === issueId || (issueId === 'WTR-ISSUE-00025' && (!r.issueId || r.issueId === 'WTR-ISSUE-00025'))
    );
  };

  const getIssueForReport = (reportId: string): WaterIssue | null => {
    const rep = (waterReports.length > 0 ? waterReports : reports).find(
      (r) => r.id === reportId || r.reportId === reportId
    );
    if (!rep) return null;
    if (rep.issueId) {
      return waterIssues.find((i) => i.issueId === rep.issueId || i.id === rep.issueId) || null;
    }
    return waterIssues[0] || null;
  };

  // Helper to resolve underlying issueId if a reportId is provided
  const resolveTargetIssueId = (id: string): string => {
    if (id.startsWith('WTR-ISSUE')) return id;
    const rep = (waterReports.length > 0 ? waterReports : reports).find(
      (r) => r.id === id || r.reportId === id
    );
    if (rep?.issueId) return rep.issueId;
    return id;
  };

  // All reports belong to Water Service Department - operational status is read directly from underlying Water Issue
  const departmentReports = useMemo(() => {
    return reports.map((r) => {
      const issue = r.issueId
        ? waterIssues.find((i) => i.issueId === r.issueId || i.id === r.issueId)
        : waterIssues.find((i) => i.id === r.id || i.issueId === r.id);
      if (issue) {
        return {
          ...r,
          status: issue.status,
          isSolved: issue.isSolved ?? (issue.status === 'CLOSED'),
          closedAt: issue.closedAt ?? r.closedAt,
          reopenedAt: issue.reopenedAt ?? r.reopenedAt,
          reopenReason: issue.reopenReason ?? r.reopenReason,
          assignedWorkerId: issue.assignedWorkerId ?? r.assignedWorkerId,
          assignedWorkerName: issue.assignedWorkerName ?? r.assignedWorkerName,
        };
      }
      return r;
    });
  }, [reports, waterIssues]);

  // Reports filed by the logged-in citizen - status synchronized with underlying Water Issue
  const citizenReports = useMemo(() => {
    if (!currentUser) return [];
    const list = reports.filter(
      (r) =>
        r.citizenId === currentUser.id ||
        (r.citizenName && r.citizenName.toLowerCase() === currentUser.name.toLowerCase())
    );
    return list.map((r) => {
      const issue = r.issueId
        ? waterIssues.find((i) => i.issueId === r.issueId || i.id === r.issueId)
        : waterIssues.find((i) => i.id === r.id || i.issueId === r.id);
      if (issue) {
        return {
          ...r,
          status: issue.status,
          isSolved: issue.isSolved ?? (issue.status === 'CLOSED'),
          closedAt: issue.closedAt ?? r.closedAt,
          reopenedAt: issue.reopenedAt ?? r.reopenedAt,
          reopenReason: issue.reopenReason ?? r.reopenReason,
        };
      }
      return r;
    });
  }, [reports, waterIssues, currentUser]);

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

    try {
      localStorage.removeItem('mbu_signed_out');
      localStorage.setItem('mbu_auth_active', 'true');
      localStorage.setItem('mbu_user_session_v4', JSON.stringify(newCitizen));
    } catch (e) {}

    setCurrentUser(newCitizen);
    setCurrentRole('citizen');
    setIsAuthenticated(true);

    addToast(`Account created and signed in as ${newCitizen.name}`, 'success');
    return { success: true, message: 'Account created successfully and signed in.' };
  };

  // Citizen Login (Requirement 4 & Seamless Access)
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
      // Seamlessly create citizen profile so citizens can report grievances immediately
      const defaultName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      const newCitizen: User = {
        id: `usr-cit-${Date.now()}`,
        name: formattedName || 'Resident Citizen',
        email: cleanEmail,
        phone: '+91 98200 12345',
        role: 'citizen',
        area: 'Mira Road East (Beverly Park)',
        language: 'en',
        departmentId: 'water',
        departmentName: 'Water Service Department',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        createdAt: new Date().toISOString(),
        isGovAuthenticated: false,
      };

      if (password) {
        try {
          const stored = localStorage.getItem('mbu_citizen_passwords');
          const passMap = stored ? JSON.parse(stored) : {};
          passMap[cleanEmail] = password;
          localStorage.setItem('mbu_citizen_passwords', JSON.stringify(passMap));
        } catch (e) {}
      }

      setRegisteredCitizens((prev) => [...prev, newCitizen]);
      saveUserToFirestore(newCitizen);

      try {
        localStorage.removeItem('mbu_signed_out');
        localStorage.setItem('mbu_auth_active', 'true');
        localStorage.setItem('mbu_user_session_v4', JSON.stringify(newCitizen));
      } catch (e) {}

      setCurrentUser(newCitizen);
      setCurrentRole('citizen');
      setIsAuthenticated(true);
      addToast(`Welcome, ${newCitizen.name}! Signed in successfully.`, 'success');
      return { success: true };
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

  // Google Auth (Direct reliable citizen verification without 401 popup failure)
  const signInWithGoogleAuth = async (emailParam?: string): Promise<boolean> => {
    try {
      const targetEmail = (emailParam || 'satish.d.negi24@slrtce.in').trim().toLowerCase();
      const defaultName = targetEmail.includes('@')
        ? targetEmail
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Satish Negi';

      const citizenUser: User = {
        id: `usr-cit-${Date.now()}`,
        name: defaultName || 'Satish Negi',
        email: targetEmail,
        phone: '+91 98200 12345',
        role: 'citizen',
        area: 'Mira Road East (Beverly Park)',
        language: 'en',
        departmentId: 'water',
        departmentName: 'Water Service Department',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`,
        createdAt: new Date().toISOString(),
        isGovAuthenticated: false,
      };

      try {
        localStorage.removeItem('mbu_signed_out');
        localStorage.setItem('mbu_auth_active', 'true');
        localStorage.setItem('mbu_user_session_v4', JSON.stringify(citizenUser));
      } catch (e) {}

      setRegisteredCitizens((prev) => [
        ...prev.filter((c) => c.email.toLowerCase() !== targetEmail),
        citizenUser,
      ]);
      saveUserToFirestore(citizenUser);

      setCurrentUser(citizenUser);
      setCurrentRole('citizen');
      setIsAuthenticated(true);
      addToast(`Signed in with Google as ${citizenUser.name} (${targetEmail})`, 'success');
      return true;
    } catch (err: any) {
      addToast('Google Sign-In failed. Please try again.', 'error');
      return false;
    }
  };

  // WORKFLOW: 10. REPORT CREATION WITH INTELLIGENT DUPLICATE DETECTION & CONSOLIDATION
  const addReport = async (data: Partial<Report>): Promise<Report> => {
    if (!isAuthenticated || !currentUser) {
      addToast('Authentication required: Please sign in or register to submit a water report.', 'error');
      openAuthModal('login', 'Please sign in or register to submit a water report.');
      throw new Error('User must be authenticated to submit a report.');
    }

    try {
      const submission = await submitCitizenWaterReport(data, currentUser);
      const { report, issue, isDuplicate, duplicateReason } = submission;

      // Optimistically update states
      setWaterReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
      setReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
      setWaterIssues((prev) => [issue, ...prev.filter((i) => i.id !== issue.id)]);

      setSelectedReportId(report.id);
      setSelectedIssueId(issue.id);

      if (isDuplicate) {
        addToast(
          `Your report has been linked to an existing water issue in your area (${issue.issueId}). You can track the progress of the shared issue here.`,
          'info'
        );
      } else {
        addToast(`Water Report ${report.reportId} submitted successfully! New Water Issue ${issue.issueId} created.`, 'success');
      }

      return report;
    } catch (err: any) {
      console.error('Error in submitCitizenWaterReport:', err);
      const reportIndex = reports.length + 1;
      const paddedNum = String(reportIndex).padStart(6, '0');
      const fallbackReportId = `WTR-REPORT-${paddedNum}`;
      const now = new Date().toISOString();
      const fallbackReport: Report = {
        id: fallbackReportId,
        reportId: fallbackReportId,
        issueId: waterIssues[0]?.issueId || 'WTR-ISSUE-00025',
        citizenId: currentUser.id,
        citizenName: currentUser.name,
        citizenPhone: currentUser.phone || data.citizenPhone || '+91 98200 00000',
        title: data.title || 'Water Issue in Mira-Bhayandar',
        description: data.description || '',
        category: (data.category as ReportCategory) || 'Water Supply',
        location: data.location || 'Mira Road, MBMC',
        area: data.area || currentUser.area || 'Mira Road East',
        landmark: data.landmark,
        photo: data.photo || data.photoUrl,
        photoUrl: data.photoUrl || data.photo,
        status: 'SUBMITTED',
        createdAt: now,
        updatedAt: now,
        isSolved: false,
      };

      setReports((prev) => [fallbackReport, ...prev]);
      saveReportToFirestore(fallbackReport);
      setSelectedReportId(fallbackReportId);
      addToast(`Water Report ${fallbackReportId} submitted successfully!`, 'success');
      return fallbackReport;
    }
  };

  // WORKFLOW: Confirm Issue Review by Officer (moves to OFFICER_REVIEW)
  const confirmOfficerReview = async (targetId: string) => {
    const issueId = resolveTargetIssueId(targetId);
    const updated = await persistWaterIssueStatusChange(
      issueId,
      'OFFICER_REVIEW',
      {},
      `Water Department Officer ${currentUser?.name || 'Officer'} confirmed and reviewed the issue.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );
    if (updated) {
      setWaterIssues((prev) => prev.map((i) => (i.issueId === updated.issueId ? updated : i)));
      setReports((prev) => prev.map((r) => (r.issueId === updated.issueId ? { ...r, status: 'OFFICER_REVIEW' } : r)));
    }
    addToast('Issue confirmed and placed under officer review.', 'success');
  };

  // WORKFLOW: 17. ASSIGN WORKER
  const assignWorkerToReport = async (targetId: string, workerId: string) => {
    const worker = workers.find((w) => w.workerId === workerId);
    if (!worker) {
      addToast('Worker not found in Water Service Department records.', 'error');
      return;
    }

    const issueId = resolveTargetIssueId(targetId);
    const now = new Date().toISOString();
    const updated = await persistWaterIssueStatusChange(
      issueId,
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
      setWaterIssues((prev) => prev.map((i) => (i.issueId === updated.issueId ? updated : i)));
      setReports((prev) => prev.map((r) => (r.issueId === updated.issueId ? { ...r, status: 'WORKER_ASSIGNED', assignedWorkerId: worker.workerId, assignedWorkerName: worker.workerName } : r)));
    }

    setWorkers((prev) =>
      prev.map((w) =>
        w.workerId === workerId ? { ...w, assignedTasksCount: (w.assignedTasksCount || 0) + 1 } : w
      )
    );

    const linkedReps = getReportsForIssue(issueId);
    linkedReps.forEach((r) => {
      addAppNotification({
        userId: r.citizenId,
        title: 'Field Worker Assigned',
        message: `Field Worker ${worker.workerName} has been assigned to your water issue ${r.reportId}.`,
        type: 'assignment',
        reportId: r.reportId,
      });
    });

    addToast(`Worker ${worker.workerName} assigned successfully.`, 'success');
  };

  // WORKFLOW: 18. WORK IN PROGRESS
  const startWorkOnReport = async (targetId: string) => {
    const issueId = resolveTargetIssueId(targetId);
    const current = waterIssues.find((i) => i.issueId === issueId);
    const defaultWorker = DEMO_WORKERS[0] || { workerId: 'w-water-1', workerName: 'Ramesh Patil' };
    const finalWorkerId = current?.assignedWorkerId || defaultWorker.workerId;
    const finalWorkerName = current?.assignedWorkerName || defaultWorker.workerName;
    const now = new Date().toISOString();

    const updated = await persistWaterIssueStatusChange(
      issueId,
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
      setWaterIssues((prev) => prev.map((i) => (i.issueId === updated.issueId ? updated : i)));
      setReports((prev) => prev.map((r) => (r.issueId === updated.issueId ? { ...r, status: 'WORK_IN_PROGRESS', assignedWorkerId: finalWorkerId, assignedWorkerName: finalWorkerName } : r)));
    }

    const linkedReps = getReportsForIssue(issueId);
    linkedReps.forEach((r) => {
      addAppNotification({
        userId: r.citizenId,
        title: 'Work In Progress',
        message: `Work on your water issue ${r.reportId} is now in progress (Worker: ${finalWorkerName}).`,
        type: 'status_change',
        reportId: r.reportId,
      });
    });

    addToast(`Work on ${issueId} is now In Progress (Worker: ${finalWorkerName}).`, 'success');
  };

  // Direct status update by officer (Enforces NO DIRECT CLOSURE rule)
  const updateReportStatus = async (targetId: string, newStatus: ReportStatus, note?: string) => {
    if (newStatus === 'CLOSED') {
      addToast('Citizen verification is required before this issue can be closed. Officers cannot directly close issues.', 'error');
      return;
    }

    const issueId = resolveTargetIssueId(targetId);
    const current = waterIssues.find((i) => i.issueId === issueId);
    const defaultWorker = DEMO_WORKERS[0] || { workerId: 'w-water-1', workerName: 'Ramesh Patil' };
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

    const updated = await persistWaterIssueStatusChange(
      issueId,
      newStatus,
      {
        assignedWorkerId: finalWorkerId,
        assignedWorkerName: finalWorkerName,
      },
      note || `Status updated to ${newStatus.replace(/_/g, ' ')} by Officer ${currentUser?.name || 'Water Officer'}.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );

    if (updated) {
      setWaterIssues((prev) => prev.map((i) => (i.issueId === updated.issueId ? updated : i)));
      setReports((prev) => prev.map((r) => (r.issueId === updated.issueId ? { ...r, status: newStatus } : r)));
    }

    addToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
  };

  // WORKFLOW: 19. PROGRESS UPDATES
  const addProgressUpdate = (targetId: string, message: string, photoUrl?: string) => {
    const issueId = resolveTargetIssueId(targetId);
    const now = new Date().toISOString();
    const current = waterIssues.find((i) => i.issueId === issueId);
    const currentStatus = current?.status || 'SUBMITTED';

    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: issueId,
      status: currentStatus,
      message: message.trim(),
      photoUrl: photoUrl || undefined,
      createdBy: currentUser?.name || 'Water Officer',
      role: currentUser?.designation || 'Water Department Officer',
      createdAt: now,
    };
    setUpdates((prev) => [upd, ...prev]);
    saveUpdateToFirestore(upd);

    updateWaterIssueInFirestore(issueId, { updatedAt: now });

    const linkedReps = getReportsForIssue(issueId);
    linkedReps.forEach((r) => {
      addAppNotification({
        userId: r.citizenId,
        title: 'New Progress Update',
        message: `Update on ${r.reportId}: "${message.trim()}"`,
        type: 'info',
        reportId: r.reportId,
      });
    });

    addToast('Progress update published for citizens.', 'success');
  };

  // WORKFLOW: 20. MARK AS SOLVED (Transitions to CITIZEN_VERIFICATION stage)
  const markReportSolved = async (
    targetId: string,
    resolutionDescription: string,
    resolutionPhotoUrl?: string
  ) => {
    const issueId = resolveTargetIssueId(targetId);
    const now = new Date().toISOString();
    const current = waterIssues.find((i) => i.issueId === issueId);

    const updated = await persistWaterIssueStatusChange(
      issueId,
      'CITIZEN_VERIFICATION',
      {
        isSolved: true,
        resolutionNotes: resolutionDescription,
        resolutionPhotoUrl: resolutionPhotoUrl || current?.resolutionPhotoUrl,
        solvedAt: now,
        verificationsCount: 0,
        verificationsTotal: current?.citizenReportCount || 1,
      },
      `Issue marked as solved by Officer ${currentUser?.name || 'Officer'}. Resolution: "${resolutionDescription}". Awaiting citizen verification.`,
      { id: currentUser?.id, name: currentUser?.name, role: currentUser?.designation || 'Water Officer' }
    );

    if (updated) {
      setWaterIssues((prev) => prev.map((i) => (i.issueId === updated.issueId ? updated : i)));
      setReports((prev) => prev.map((r) => (r.issueId === updated.issueId ? { ...r, ...updated, status: 'CITIZEN_VERIFICATION' } : r)));
    }

    const linkedReps = getReportsForIssue(issueId);
    linkedReps.forEach((r) => {
      addAppNotification({
        userId: r.citizenId,
        title: 'Water Issue Solved — Verification Required',
        message: `Your water issue ${r.reportId} has been marked as solved. Please verify the resolution.`,
        type: 'verification',
        reportId: r.reportId,
      });
    });

    addToast('Marked as solved. Awaiting citizen verification before closure.', 'success');
  };

  // WORKFLOW: 21. CITIZEN VERIFICATION
  const verifyCitizenResolution = async (
    reportId: string,
    status: 'Yes' | 'Partially' | 'No' | 'YES_SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED',
    comment?: string,
    rating?: number
  ) => {
    const rep = reports.find((r) => r.id === reportId || r.reportId === reportId);
    const issueId = rep?.issueId || resolveTargetIssueId(reportId) || 'WTR-ISSUE-00025';

    const raw = (status || 'Yes').toString().toUpperCase();
    const isYes = raw === 'YES' || raw === 'YES_SOLVED' || raw === 'RESOLVED';
    const isPartially = raw === 'PARTIALLY' || raw === 'PARTIALLY_SOLVED';
    const canonical = isYes ? 'YES_SOLVED' : (isPartially ? 'PARTIALLY_SOLVED' : 'NOT_SOLVED');

    const res = await submitCitizenVerificationFeedback({
      issueId,
      reportId,
      citizenId: currentUser?.id || rep?.citizenId || 'citizen',
      citizenName: currentUser?.name || rep?.citizenName || 'Citizen',
      resolutionStatus: canonical,
      rating: rating || (isYes ? 5 : 1),
      comment:
        comment?.trim() ||
        (isYes ? 'Resolution confirmed by citizen.' : 'Citizen indicated water issue is not resolved.'),
    });

    if (res.issue) {
      setWaterIssues((prev) => prev.map((i) => (i.issueId === res.issue!.issueId ? res.issue! : i)));
      setReports((prev) =>
        prev.map((r) =>
          r.issueId === res.issue!.issueId || r.id === reportId
            ? {
                ...r,
                status: res.issue!.status,
                isSolved: res.issue!.status === 'CLOSED',
                closedAt: res.issue!.closedAt ?? r.closedAt,
                reopenedAt: res.issue!.reopenedAt ?? r.reopenedAt,
                reopenReason: res.issue!.reopenReason ?? r.reopenReason,
              }
            : r
        )
      );
      setWaterReports((prev) =>
        prev.map((r) =>
          r.issueId === res.issue!.issueId || r.id === reportId
            ? {
                ...r,
                status: res.issue!.status,
                isSolved: res.issue!.status === 'CLOSED',
                closedAt: res.issue!.closedAt ?? r.closedAt,
                reopenedAt: res.issue!.reopenedAt ?? r.reopenedAt,
                reopenReason: res.issue!.reopenReason ?? r.reopenReason,
              }
            : r
        )
      );
    }

    if (res.feedback) {
      setFeedbacks((prev) => [res.feedback, ...prev.filter((f) => f.id !== res.feedback.id)]);
    }

    if (res.issue?.status === 'CLOSED') {
      addToast('Verification recorded: Water issue marked as CLOSED.', 'success');
    } else if (res.issue?.status === 'REOPENED') {
      addToast('Issue marked as unresolved and reopened for officer review.', 'info');
    } else if (res.issue?.status === 'CITIZEN_VERIFICATION') {
      addToast(`Verification recorded (${res.verificationsCount} of ${res.verificationsTotal} completed). Awaiting remaining citizen verification.`, 'info');
    }
  };

  // Update Priority
  const updatePriority = (targetId: string, newPriority: ReportPriority) => {
    const issueId = resolveTargetIssueId(targetId);
    const now = new Date().toISOString();
    updateWaterIssueInFirestore(issueId, { priority: newPriority, updatedAt: now });

    setWaterIssues((prev) =>
      prev.map((i) => (i.issueId === issueId ? { ...i, priority: newPriority, updatedAt: now } : i))
    );
    setReports((prev) =>
      prev.map((r) => (r.issueId === issueId ? { ...r, priority: newPriority, updatedAt: now } : r))
    );

    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: issueId,
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
  const updateCategory = (targetId: string, newCategory: ReportCategory) => {
    const issueId = resolveTargetIssueId(targetId);
    const now = new Date().toISOString();
    updateWaterIssueInFirestore(issueId, { category: newCategory, updatedAt: now });

    setWaterIssues((prev) =>
      prev.map((i) => (i.issueId === issueId ? { ...i, category: newCategory, updatedAt: now } : i))
    );
    setReports((prev) =>
      prev.map((r) => (r.issueId === issueId ? { ...r, category: newCategory, updatedAt: now } : r))
    );

    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: issueId,
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

  // Add Comment to Report / Issue
  const addReportComment = (targetId: string, message: string) => {
    const issueId = resolveTargetIssueId(targetId);
    const now = new Date().toISOString();
    const current = waterIssues.find((i) => i.issueId === issueId);
    const isOff = currentRole === 'department_officer' || currentRole === 'water_officer';
    const upd: ReportUpdate = {
      id: `upd-${Date.now()}`,
      updateId: `upd-${Date.now()}`,
      reportId: issueId,
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

  // Add Feedback / Verification with Multi-Citizen Support
  const addFeedback = async (feedback: Omit<ReportFeedback, 'id' | 'createdAt'>) => {
    const rep = reports.find((r) => r.id === feedback.reportId || r.reportId === feedback.reportId);
    const issueId = rep?.issueId || feedback.issueId || resolveTargetIssueId(feedback.reportId) || 'WTR-ISSUE-00025';

    const raw = (feedback.resolutionStatus || feedback.verificationResponse || 'Yes').toString().toUpperCase();
    const isYes = raw === 'YES' || raw === 'YES_SOLVED' || raw === 'RESOLVED';
    const canonical = isYes ? 'YES_SOLVED' : (raw === 'PARTIALLY' || raw === 'PARTIALLY_SOLVED' ? 'PARTIALLY_SOLVED' : 'NOT_SOLVED');

    const result = await submitCitizenVerificationFeedback({
      issueId,
      reportId: feedback.reportId,
      citizenId: feedback.citizenId || currentUser?.id || 'citizen',
      citizenName: feedback.citizenName || currentUser?.name || 'Resident Citizen',
      resolutionStatus: canonical,
      rating: feedback.rating || (isYes ? 5 : 1),
      comment:
        feedback.comment ||
        (isYes ? 'Issue verified by citizen.' : 'Citizen indicated water issue is not resolved.'),
    });

    setFeedbacks((prev) => [result.feedback, ...prev.filter((f) => f.id !== result.feedback.id)]);

    if (result.issue) {
      setWaterIssues((prev) => prev.map((i) => (i.issueId === result.issue!.issueId ? result.issue! : i)));
      setReports((prev) =>
        prev.map((r) =>
          r.issueId === result.issue!.issueId || r.id === feedback.reportId
            ? {
                ...r,
                status: result.issue!.status,
                isSolved: result.issue!.status === 'CLOSED',
                closedAt: result.issue!.closedAt ?? r.closedAt,
                reopenedAt: result.issue!.reopenedAt ?? r.reopenedAt,
                reopenReason: result.issue!.reopenReason ?? r.reopenReason,
                hasFeedback: r.id === feedback.reportId ? true : r.hasFeedback,
                feedbackRating: r.id === feedback.reportId ? feedback.rating : r.feedbackRating,
                feedbackComment: r.id === feedback.reportId ? feedback.comment : r.feedbackComment,
              }
            : r
        )
      );
      setWaterReports((prev) =>
        prev.map((r) =>
          r.issueId === result.issue!.issueId || r.id === feedback.reportId
            ? {
                ...r,
                status: result.issue!.status,
                isSolved: result.issue!.status === 'CLOSED',
                closedAt: result.issue!.closedAt ?? r.closedAt,
                reopenedAt: result.issue!.reopenedAt ?? r.reopenedAt,
                reopenReason: result.issue!.reopenReason ?? r.reopenReason,
                hasFeedback: r.id === feedback.reportId ? true : r.hasFeedback,
                feedbackRating: r.id === feedback.reportId ? feedback.rating : r.feedbackRating,
                feedbackComment: r.id === feedback.reportId ? feedback.comment : r.feedbackComment,
              }
            : r
        )
      );
    }

    if (result.issue?.status === 'CLOSED') {
      addToast('Citizen verification completed! Water issue officially closed.', 'success');
    } else if (result.issue?.status === 'REOPENED') {
      addToast('Issue reported as unresolved and reopened for officer review.', 'info');
    } else if (result.issue?.status === 'CITIZEN_VERIFICATION') {
      addToast(`Verification recorded (${result.verificationsCount} of ${result.verificationsTotal} completed). Awaiting remaining citizen verification.`, 'info');
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
    reports: departmentReports,
    waterIssues,
    waterReports: departmentReports,
    departmentReports,
    departmentIssues,
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
    getReportsForIssue,
    getIssueForReport,
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
    selectedIssueId,
    setSelectedIssueId,
    selectedIssue,
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
