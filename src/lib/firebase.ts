import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import {
  Report,
  ReportStatus,
  isValidReportStatus,
  VALID_REPORT_STATUSES,
  ReportFeedback,
  ReportUpdate,
  Worker,
  User,
  Department,
  NotificationItem,
  WaterIssue,
  WaterReport,
  ReportCategory,
} from '../types';
import { detectDuplicateWaterIssue } from './duplicateDetection';
import {
  DEMO_DEPARTMENTS,
  DEMO_WORKERS,
} from '../data/demoData';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with specific database ID if configured
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore Connection on Boot (Skill Requirement)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network status.');
    }
  }
}
testConnection();

// Structured Firestore Error Handling (Skill Requirement)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
}

export async function logOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
}

// Fetch all reports from Firestore directly (Source of Truth on boot/refresh)
export async function fetchReportsFromFirestore(): Promise<Report[]> {
  try {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);
    if (!snapshot.empty) {
      const reportsList: Report[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Report;
        reportsList.push({
          ...data,
          id: docSnap.id,
          reportId: data.reportId || docSnap.id,
          status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
        });
      });
      reportsList.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      return reportsList;
    }
    return [];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'reports');
    return [];
  }
}

// Subscribe to all reports (Live synchronization for Citizen and Officer)
export function subscribeToReports(
  onReportsUpdate: (reports: Report[]) => void,
  departmentIdFilter?: string,
  onError?: (error: Error) => void
) {
  try {
    const reportsRef = collection(db, 'reports');
    return onSnapshot(
      reportsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const reportsList: Report[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Report;
            reportsList.push({
              ...data,
              id: docSnap.id,
              reportId: data.reportId || docSnap.id,
              status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
            });
          });
          reportsList.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          onReportsUpdate(reportsList);
        } else {
          onReportsUpdate([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'reports');
    return () => {};
  }
}

// Fetch all Water Issues from Firestore directly
export async function fetchWaterIssuesFromFirestore(): Promise<WaterIssue[]> {
  try {
    const issuesRef = collection(db, 'waterIssues');
    const snapshot = await getDocs(issuesRef);
    if (!snapshot.empty) {
      const list: WaterIssue[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WaterIssue;
        list.push({
          ...data,
          id: docSnap.id,
          issueId: data.issueId || docSnap.id,
          status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
          citizenReportCount: data.citizenReportCount || 1,
        });
      });
      list.sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
      return list;
    }
    return [];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'waterIssues');
    return [];
  }
}

// Fetch all Water Reports from Firestore directly
export async function fetchWaterReportsFromFirestore(): Promise<WaterReport[]> {
  try {
    const reportsRef = collection(db, 'waterReports');
    const snapshot = await getDocs(reportsRef);
    if (!snapshot.empty) {
      const list: WaterReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WaterReport;
        list.push({
          ...data,
          id: docSnap.id,
          reportId: data.reportId || docSnap.id,
          status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
        });
      });
      list.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      return list;
    }
    return [];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'waterReports');
    return [];
  }
}

// Subscribe to all Water Issues (Live synchronization for Water Officer Dashboard)
export function subscribeToWaterIssues(
  onIssuesUpdate: (issues: WaterIssue[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const issuesRef = collection(db, 'waterIssues');
    return onSnapshot(
      issuesRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: WaterIssue[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as WaterIssue;
            list.push({
              ...data,
              id: docSnap.id,
              issueId: data.issueId || docSnap.id,
              status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
              citizenReportCount: data.citizenReportCount || 1,
            });
          });
          list.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
          );
          onIssuesUpdate(list);
        } else {
          onIssuesUpdate([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'waterIssues');
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'waterIssues');
    return () => {};
  }
}

// Subscribe to all Water Reports (Evidence and Citizen submissions)
export function subscribeToWaterReports(
  onReportsUpdate: (reports: WaterReport[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const reportsRef = collection(db, 'waterReports');
    return onSnapshot(
      reportsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: WaterReport[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as WaterReport;
            list.push({
              ...data,
              id: docSnap.id,
              reportId: data.reportId || docSnap.id,
              status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
            });
          });
          list.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          onReportsUpdate(list);
        } else {
          onReportsUpdate([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'waterReports');
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'waterReports');
    return () => {};
  }
}

// Fetch single report directly from Firestore by reportId
export async function getReportFromFirestore(reportId: string): Promise<Report | null> {
  try {
    if (!reportId) return null;
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (snap.exists()) {
      const data = snap.data() as Report;
      return {
        ...data,
        id: snap.id,
        reportId: data.reportId || snap.id,
        status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `reports/${reportId}`);
    return null;
  }
}

// Subscribe to single report by reportId (Live updates on Track page)
export function subscribeToSingleReport(
  reportId: string,
  onUpdate: (report: Report | null) => void
): () => void {
  try {
    if (!reportId) return () => {};
    const reportRef = doc(db, 'reports', reportId);
    return onSnapshot(
      reportRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Report;
          onUpdate({
            ...data,
            id: snap.id,
            reportId: data.reportId || snap.id,
            status: isValidReportStatus(data.status) ? data.status : 'SUBMITTED',
          });
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `reports/${reportId}`);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `reports/${reportId}`);
    return () => {};
  }
}

// Subscribe to workers
export function subscribeToWorkers(
  onWorkersUpdate: (workers: Worker[]) => void,
  departmentIdFilter?: string
) {
  try {
    const workersRef = collection(db, 'workers');
    let q = query(workersRef);
    if (departmentIdFilter) {
      q = query(workersRef, where('departmentId', '==', departmentIdFilter));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Worker[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Worker);
          });
          onWorkersUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'workers');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'workers');
    return () => {};
  }
}

// Subscribe to Users collection
export function subscribeToUsers(
  onUpdate: (users: User[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const q = collection(db, 'users');
    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((d) => d.data() as User);
        onUpdate(users);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
    return () => {};
  }
}

// Subscribe to Updates collection
export function subscribeToUpdates(
  onUpdate: (updates: ReportUpdate[]) => void
): () => void {
  try {
    const updatesRef = collection(db, 'updates');
    return onSnapshot(
      updatesRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as ReportUpdate);
          items.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          onUpdate(items);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'updates');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'updates');
    return () => {};
  }
}

// Subscribe to Feedbacks collection
export function subscribeToFeedbacks(
  onUpdate: (feedbacks: ReportFeedback[]) => void
): () => void {
  try {
    const feedbacksRef = collection(db, 'feedbacks');
    return onSnapshot(
      feedbacksRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as ReportFeedback);
          items.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          onUpdate(items);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'feedbacks');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'feedbacks');
    return () => {};
  }
}

// Subscribe to Notifications collection
export function subscribeToNotifications(
  onUpdate: (notifs: NotificationItem[]) => void
): () => void {
  try {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as NotificationItem);
          onUpdate(items);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'notifications');
    return () => {};
  }
}

// Helper to scrub all undefined properties recursively
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? cleanForFirestore(value) : value;
    }
  }
  return cleaned as T;
}

// Save Water Issue Document to Firestore
export async function saveWaterIssueToFirestore(issue: WaterIssue): Promise<void> {
  try {
    const issueRef = doc(db, 'waterIssues', issue.issueId);
    await setDoc(
      issueRef,
      cleanForFirestore({
        ...issue,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `waterIssues/${issue.issueId}`);
  }
}

// Update Water Issue Document in Firestore with atomic partial update
export async function updateWaterIssueInFirestore(
  issueId: string,
  updates: Partial<WaterIssue>
): Promise<void> {
  try {
    if (!issueId) return;
    const issueRef = doc(db, 'waterIssues', issueId);
    const cleaned = cleanForFirestore({
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    });

    try {
      await updateDoc(issueRef, cleaned);
    } catch {
      await setDoc(issueRef, cleaned, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `waterIssues/${issueId}`);
  }
}

// Save Water Report Document to Firestore
export async function saveWaterReportToFirestore(report: WaterReport): Promise<void> {
  try {
    const reportRef = doc(db, 'waterReports', report.id || report.reportId);
    await setDoc(
      reportRef,
      cleanForFirestore({
        ...report,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // Also mirror to legacy reports collection for backward compatibility
    const legacyRef = doc(db, 'reports', report.id || report.reportId);
    await setDoc(
      legacyRef,
      cleanForFirestore({
        ...report,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `waterReports/${report.id}`);
  }
}

// Update Water Report Document in Firestore
export async function updateWaterReportInFirestore(
  reportId: string,
  updates: Partial<WaterReport>
): Promise<void> {
  try {
    if (!reportId) return;
    const reportRef = doc(db, 'waterReports', reportId);
    const legacyRef = doc(db, 'reports', reportId);
    const cleaned = cleanForFirestore({
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    });

    try {
      await updateDoc(reportRef, cleaned);
    } catch {
      await setDoc(reportRef, cleaned, { merge: true });
    }

    try {
      await updateDoc(legacyRef, cleaned);
    } catch {
      await setDoc(legacyRef, cleaned, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `waterReports/${reportId}`);
  }
}

// Legacy helpers for compatibility
export async function saveReportToFirestore(report: Report): Promise<void> {
  await saveWaterReportToFirestore(report);
}

export async function updateReportInFirestore(
  reportId: string,
  updates: Partial<Report>
): Promise<void> {
  await updateWaterReportInFirestore(reportId, updates);
}

// Submit Citizen Water Report with Duplicate Detection and Atomic Transaction (Requirements 1-7, 14, 15)
export async function submitCitizenWaterReport(
  data: Partial<WaterReport>,
  citizen: User
): Promise<{
  report: WaterReport;
  issue: WaterIssue;
  isDuplicate: boolean;
  duplicateReason?: string;
}> {
  const now = new Date().toISOString();
  const cat = (data.category as ReportCategory) || 'Water Supply';

  // 1. Fetch current active issues from Firestore
  const issuesRef = collection(db, 'waterIssues');
  const issuesSnap = await getDocs(issuesRef);
  const activeIssues: WaterIssue[] = [];
  let highestIssueNumber = 24; // Default baseline so next is WTR-ISSUE-00025 or higher
  let highestReportNumber = 100; // Baseline for WTR-REPORT-000101

  issuesSnap.forEach((d) => {
    const iss = d.data() as WaterIssue;
    if (iss.status !== 'CLOSED') {
      activeIssues.push(iss);
    }
    const numMatch = (iss.issueId || d.id).match(/(\d+)$/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (n > highestIssueNumber) highestIssueNumber = n;
    }
  });

  const repSnap = await getDocs(collection(db, 'waterReports'));
  repSnap.forEach((d) => {
    const rep = d.data() as WaterReport;
    const numMatch = (rep.reportId || d.id).match(/(\d+)$/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (n > highestReportNumber) highestReportNumber = n;
    }
  });

  const nextReportSeq = highestReportNumber + 1;
  const reportId = `WTR-REPORT-${String(nextReportSeq).padStart(6, '0')}`;

  const candidateReport: Partial<WaterReport> = {
    reportId,
    citizenId: citizen.id,
    citizenName: citizen.name,
    citizenPhone: citizen.phone || '+91 98200 00000',
    title: data.title || `${cat} at ${data.location || data.area || 'Mira-Bhayandar'}`,
    description: data.description || '',
    category: cat,
    location: data.location || 'Mira Road, MBMC',
    area: data.area || citizen.area || 'Mira Road East',
    landmark: data.landmark || '',
    photoUrl: data.photoUrl || data.photo,
    photo: data.photo || data.photoUrl,
    createdAt: now,
  };

  // 2. Duplicate detection (AI / semantic matching + deterministic check)
  const dupResult = await detectDuplicateWaterIssue(candidateReport, activeIssues);

  let finalReport: WaterReport;
  let finalIssue: WaterIssue;

  if (dupResult.isLikelyDuplicate && dupResult.matchedIssueId) {
    // 3A. DUPLICATE FOUND: Link to existing Water Issue atomically (Requirement 6 & 15)
    const targetIssueId = dupResult.matchedIssueId;

    await runTransaction(db, async (txn) => {
      const issueDocRef = doc(db, 'waterIssues', targetIssueId);
      const issueSnap = await txn.get(issueDocRef);

      if (!issueSnap.exists()) {
        throw new Error(`Matched issue ${targetIssueId} does not exist`);
      }

      const existingIssue = issueSnap.data() as WaterIssue;
      const updatedCount = (existingIssue.citizenReportCount || 1) + 1;

      // Update existing Water Issue (counter & lastReportAt)
      txn.update(issueDocRef, {
        citizenReportCount: updatedCount,
        lastReportAt: now,
        updatedAt: now,
        syncedAt: now,
      });

      finalIssue = {
        ...existingIssue,
        citizenReportCount: updatedCount,
        lastReportAt: now,
        updatedAt: now,
      };

      // Create new Water Report linked to this issue (keeps new citizen's photo & description)
      finalReport = {
        id: reportId,
        reportId,
        issueId: targetIssueId,
        citizenId: citizen.id,
        citizenName: citizen.name,
        citizenPhone: candidateReport.citizenPhone,
        title: candidateReport.title || existingIssue.title,
        description: candidateReport.description || '',
        category: cat,
        location: candidateReport.location || existingIssue.location,
        area: candidateReport.area || existingIssue.area,
        landmark: candidateReport.landmark || existingIssue.landmark,
        photoUrl: candidateReport.photoUrl,
        photo: candidateReport.photo,
        status: existingIssue.status, // Operational status synchronized
        assignedWorkerId: existingIssue.assignedWorkerId,
        assignedWorkerName: existingIssue.assignedWorkerName,
        assignedByOfficerId: existingIssue.assignedByOfficerId,
        assignedByOfficerName: existingIssue.assignedByOfficerName,
        assignedAt: existingIssue.assignedAt,
        startedAt: existingIssue.startedAt,
        solvedAt: existingIssue.solvedAt,
        closedAt: existingIssue.closedAt,
        isSolved: existingIssue.isSolved,
        aiAnalysis: data.aiAnalysis,
        createdAt: now,
        updatedAt: now,
        departmentId: 'water',
        departmentName: 'Water Service Department',
      };

      const repDocRef = doc(db, 'waterReports', reportId);
      txn.set(repDocRef, cleanForFirestore(finalReport));

      const legacyDocRef = doc(db, 'reports', reportId);
      txn.set(legacyDocRef, cleanForFirestore(finalReport));
    });

    // History Log
    const updId = `upd-${Date.now()}`;
    const logItem: ReportUpdate = {
      id: updId,
      updateId: updId,
      reportId: targetIssueId,
      status: finalIssue!.status,
      message: `Additional citizen evidence report (${reportId}) linked to this Water Issue by citizen ${citizen.name}. ${dupResult.reason}`,
      createdBy: 'System (Intelligent Duplicate Detection)',
      role: 'System',
      createdAt: now,
    };
    saveUpdateToFirestore(logItem);

    return {
      report: finalReport!,
      issue: finalIssue!,
      isDuplicate: true,
      duplicateReason: dupResult.reason,
    };
  } else {
    // 3B. NO DUPLICATE: Create new Water Issue + first Water Report (Requirement 7 & 15)
    const nextIssueSeq = highestIssueNumber + 1;
    const newIssueId = `WTR-ISSUE-${String(nextIssueSeq).padStart(5, '0')}`;

    await runTransaction(db, async (txn) => {
      const issueDocRef = doc(db, 'waterIssues', newIssueId);

      finalIssue = {
        id: newIssueId,
        issueId: newIssueId,
        category: cat,
        priority: data.priority || 'Medium',
        priorityReason: data.aiAnalysis?.reason || 'Intake report evaluation',
        title: candidateReport.title || `${cat} in ${candidateReport.area}`,
        description: candidateReport.description || '',
        location: candidateReport.location || 'Mira Road',
        area: candidateReport.area || 'Mira Road East',
        landmark: candidateReport.landmark,
        status: 'SUBMITTED',
        citizenReportCount: 1,
        lastReportAt: now,
        createdAt: now,
        updatedAt: now,
        departmentId: 'water',
        departmentName: 'Water Service Department',
        isSolved: false,
      };

      txn.set(issueDocRef, cleanForFirestore(finalIssue));

      finalReport = {
        id: reportId,
        reportId,
        issueId: newIssueId,
        citizenId: citizen.id,
        citizenName: citizen.name,
        citizenPhone: candidateReport.citizenPhone,
        title: candidateReport.title || finalIssue.title,
        description: candidateReport.description || '',
        category: cat,
        location: candidateReport.location || finalIssue.location,
        area: candidateReport.area || finalIssue.area,
        landmark: candidateReport.landmark,
        photoUrl: candidateReport.photoUrl,
        photo: candidateReport.photo,
        status: 'SUBMITTED',
        aiAnalysis: data.aiAnalysis,
        createdAt: now,
        updatedAt: now,
        departmentId: 'water',
        departmentName: 'Water Service Department',
        isSolved: false,
      };

      const repDocRef = doc(db, 'waterReports', reportId);
      txn.set(repDocRef, cleanForFirestore(finalReport));

      const legacyDocRef = doc(db, 'reports', reportId);
      txn.set(legacyDocRef, cleanForFirestore(finalReport));
    });

    const updId = `upd-${Date.now()}`;
    const logItem: ReportUpdate = {
      id: updId,
      updateId: updId,
      reportId: newIssueId,
      status: 'SUBMITTED',
      message: `Operational Water Issue created from citizen report ${reportId} by ${citizen.name}.`,
      createdBy: 'System (Water Service Intake)',
      role: 'System',
      createdAt: now,
    };
    saveUpdateToFirestore(logItem);

    return {
      report: finalReport!,
      issue: finalIssue!,
      isDuplicate: false,
    };
  }
}

// Authoritative Status Update for Water Issue and all linked Water Reports (Requirements 10, 13, 14)
export async function persistWaterIssueStatusChange(
  issueId: string,
  newStatus: ReportStatus,
  extraData: Partial<WaterIssue> = {},
  logMessage?: string,
  userActor?: { id?: string; name?: string; role?: string }
): Promise<WaterIssue | null> {
  try {
    if (!issueId) return null;
    if (!isValidReportStatus(newStatus)) return null;

    const now = new Date().toISOString();
    const issueRef = doc(db, 'waterIssues', issueId);

    const statusTimestamps: Partial<WaterIssue> = {};
    if (newStatus === 'WORK_IN_PROGRESS') {
      statusTimestamps.startedAt = extraData.startedAt || now;
    } else if (newStatus === 'SOLVED') {
      statusTimestamps.solvedAt = extraData.solvedAt || now;
      statusTimestamps.isSolved = true;
    } else if (newStatus === 'CITIZEN_VERIFICATION') {
      statusTimestamps.isSolved = true;
    } else if (newStatus === 'REOPENED') {
      statusTimestamps.reopenedAt = extraData.reopenedAt || now;
      statusTimestamps.reopenedBy = extraData.reopenedBy || userActor?.id || 'citizen';
      statusTimestamps.reopenReason =
        extraData.reopenReason || 'Citizen reported issue unresolved';
      statusTimestamps.isSolved = false;
    } else if (newStatus === 'CLOSED') {
      // MANDATORY CLOSURE VALIDATION AGAINST FIRESTORE (Requirement: A Water Issue must NEVER be marked CLOSED unless citizen verification/feedback completed)
      // 1. Fetch all linked waterReports for this issueId from Firestore
      const qReports = query(collection(db, 'waterReports'), where('issueId', '==', issueId));
      const repSnap = await getDocs(qReports);
      const linkedReports: WaterReport[] = [];
      repSnap.forEach((d) => linkedReports.push(d.data() as WaterReport));

      // 2. Fetch all feedbacks for this issueId from Firestore
      const qFeedbacks = query(collection(db, 'feedbacks'), where('issueId', '==', issueId));
      const fbSnap = await getDocs(qFeedbacks);
      const feedbacksList: ReportFeedback[] = [];
      fbSnap.forEach((d) => feedbacksList.push(d.data() as ReportFeedback));

      // Also check if any feedback matches by reportId
      if (linkedReports.length > 0 && feedbacksList.length === 0) {
        const allFbSnap = await getDocs(collection(db, 'feedbacks'));
        allFbSnap.forEach((d) => {
          const fb = d.data() as ReportFeedback;
          if (linkedReports.some((r) => r.reportId === fb.reportId || r.id === fb.reportId)) {
            feedbacksList.push(fb);
          }
        });
      }

      // Check each linked report
      const totalRequired = linkedReports.length > 0 ? linkedReports.length : 1;
      let validYesResponses = 0;
      let hasUnresolvedResponse = false;

      for (const rep of linkedReports) {
        const fb = feedbacksList.find(
          (f) =>
            f.reportId === rep.reportId ||
            f.reportId === rep.id ||
            (f.citizenId && f.citizenId === rep.citizenId)
        );
        const ver = rep.citizenVerification || (fb ? { status: fb.resolutionStatus, comment: fb.comment, verifiedAt: fb.createdAt } : null);

        if (!ver && !fb) {
          // No response from this citizen
          continue;
        }

        const statusResponse = ver?.status || fb?.resolutionStatus;
        if (statusResponse === 'No' || statusResponse === 'Partially') {
          hasUnresolvedResponse = true;
          break;
        }

        if (statusResponse === 'Yes') {
          validYesResponses++;
        }
      }

      if (hasUnresolvedResponse) {
        console.warn(`[Closure Validation] Citizen indicated issue was Not Resolved. Changing status to REOPENED.`);
        return persistWaterIssueStatusChange(
          issueId,
          'REOPENED',
          {
            ...extraData,
            reopenReason: extraData.reopenReason || 'Citizen indicated water issue was not resolved during verification.',
            reopenedAt: now,
          },
          'Citizen reported issue is not resolved. Issue reopened.',
          userActor
        );
      }

      // If required citizen verification/feedback does not exist or not all citizens have responded:
      if (validYesResponses === 0 || validYesResponses < totalRequired) {
        const errorMsg = `Citizen verification is required before this issue can be closed.`;
        console.warn(`[Closure Validation] REJECTED: ${errorMsg} (${validYesResponses} of ${totalRequired} completed)`);

        // Keep issue in CITIZEN_VERIFICATION in Firestore
        const keepPayload = cleanForFirestore({
          status: 'CITIZEN_VERIFICATION',
          verificationsCount: validYesResponses,
          verificationsTotal: totalRequired,
          updatedAt: now,
          syncedAt: now,
        });
        await updateDoc(issueRef, keepPayload).catch(() => {});
        throw new Error(errorMsg);
      }

      statusTimestamps.closedAt = extraData.closedAt || now;
      statusTimestamps.isSolved = true;
    } else if (newStatus === 'WORKER_ASSIGNED') {
      statusTimestamps.assignedAt = extraData.assignedAt || now;
    }

    const issuePayload = cleanForFirestore({
      ...extraData,
      ...statusTimestamps,
      status: newStatus,
      updatedAt: now,
      syncedAt: now,
    });

    try {
      await updateDoc(issueRef, issuePayload);
    } catch {
      await setDoc(issueRef, { id: issueId, issueId, ...issuePayload }, { merge: true });
    }

    // Synchronize ALL linked citizen reports to the authoritative Water Issue status (Requirement 13)
    try {
      const q = query(collection(db, 'waterReports'), where('issueId', '==', issueId));
      const repSnap = await getDocs(q);
      const updatesList: Promise<void>[] = [];

      repSnap.forEach((docSnap) => {
        const repRef = doc(db, 'waterReports', docSnap.id);
        const legacyRef = doc(db, 'reports', docSnap.id);
        const repPayload = cleanForFirestore({
          status: newStatus,
          assignedWorkerId: extraData.assignedWorkerId,
          assignedWorkerName: extraData.assignedWorkerName,
          assignedByOfficerId: extraData.assignedByOfficerId,
          assignedByOfficerName: extraData.assignedByOfficerName,
          assignedAt: extraData.assignedAt || statusTimestamps.assignedAt,
          startedAt: statusTimestamps.startedAt,
          solvedAt: statusTimestamps.solvedAt,
          closedAt: statusTimestamps.closedAt,
          isSolved: statusTimestamps.isSolved,
          resolutionNotes: extraData.resolutionNotes,
          resolutionPhotoUrl: extraData.resolutionPhotoUrl,
          updatedAt: now,
          syncedAt: now,
        });

        updatesList.push(
          updateDoc(repRef, repPayload).catch(() => setDoc(repRef, repPayload, { merge: true }))
        );
        updatesList.push(
          updateDoc(legacyRef, repPayload).catch(() => setDoc(legacyRef, repPayload, { merge: true }))
        );
      });

      await Promise.all(updatesList);
    } catch (syncErr) {
      console.warn('Error syncing reports for issue:', syncErr);
    }

    // Save history audit log in updates collection
    const updId = `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const updateLog: ReportUpdate = {
      id: updId,
      updateId: updId,
      reportId: issueId,
      status: newStatus,
      message:
        logMessage ||
        (newStatus === 'CLOSED'
          ? 'Water issue closed and verified complete'
          : newStatus === 'REOPENED'
          ? 'Water issue reopened'
          : newStatus === 'SOLVED'
          ? `Water issue solved by Officer ${userActor?.name || 'Officer'}. Awaiting citizen verification.`
          : newStatus === 'CITIZEN_VERIFICATION'
          ? 'Waiting for citizen verification on site'
          : newStatus === 'WORK_IN_PROGRESS'
          ? 'Field repair work started'
          : newStatus === 'WORKER_ASSIGNED'
          ? `Field worker assigned: ${extraData.assignedWorkerName || 'Assigned Worker'}`
          : `Status changed to ${newStatus.replace(/_/g, ' ')}.`),
      photoUrl: extraData.resolutionPhotoUrl,
      createdBy: userActor?.name || userActor?.id || 'Water Service Department',
      role: userActor?.role || (newStatus === 'CLOSED' || newStatus === 'REOPENED' ? 'Citizen' : 'Officer'),
      createdAt: now,
    };
    await setDoc(doc(db, 'updates', updId), cleanForFirestore(updateLog), { merge: true });

    const freshSnap = await getDoc(issueRef);
    if (freshSnap.exists()) {
      const freshData = freshSnap.data() as WaterIssue;
      return {
        ...freshData,
        id: freshSnap.id,
        issueId: freshData.issueId || freshSnap.id,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `waterIssues/${issueId}`);
    throw error;
  }
}

// Submit Citizen Verification & Feedback with multi-citizen consolidation support
export async function submitCitizenVerificationFeedback(params: {
  issueId: string;
  reportId: string;
  citizenId: string;
  citizenName?: string;
  resolutionStatus: 'Yes' | 'Partially' | 'No';
  rating: number;
  comment: string;
}): Promise<{
  feedback: ReportFeedback;
  issue: WaterIssue | null;
  allVerificationsCompleted: boolean;
  verificationsCount: number;
  verificationsTotal: number;
}> {
  const now = new Date().toISOString();
  const { issueId, reportId, citizenId, citizenName, resolutionStatus, rating, comment } = params;

  // 1. Save individual feedback document to Firestore (Separate record per citizen)
  const fbId = `fb-${reportId}-${citizenId || Date.now()}`;
  const feedbackDoc: ReportFeedback = {
    id: fbId,
    feedbackId: fbId,
    reportId,
    issueId,
    citizenId,
    citizenName: citizenName || 'Resident Citizen',
    rating: Math.max(1, Math.min(5, rating || 5)),
    resolutionStatus,
    comment: comment?.trim() || (resolutionStatus === 'Yes' ? 'Resolution verified by citizen.' : 'Issue unresolved.'),
    createdAt: now,
  };
  await setDoc(doc(db, 'feedbacks', fbId), cleanForFirestore(feedbackDoc), { merge: true });

  // 2. Update the specific citizen's WaterReport in Firestore
  const reportVerification = {
    status: resolutionStatus,
    comment: feedbackDoc.comment,
    verifiedAt: now,
  };

  const repUpdates = cleanForFirestore({
    hasFeedback: true,
    feedbackRating: feedbackDoc.rating,
    feedbackComment: feedbackDoc.comment,
    citizenVerification: reportVerification,
    updatedAt: now,
    syncedAt: now,
  });

  await setDoc(doc(db, 'waterReports', reportId), repUpdates, { merge: true });
  await setDoc(doc(db, 'reports', reportId), repUpdates, { merge: true });

  // 3. Query all linked citizen reports for this issueId from Firestore
  const qReports = query(collection(db, 'waterReports'), where('issueId', '==', issueId));
  const repSnap = await getDocs(qReports);
  const linkedReports: WaterReport[] = [];
  repSnap.forEach((d) => linkedReports.push(d.data() as WaterReport));

  // Also query all feedbacks for this issueId from Firestore
  const qFeedbacks = query(collection(db, 'feedbacks'), where('issueId', '==', issueId));
  const fbSnap = await getDocs(qFeedbacks);
  const feedbacksList: ReportFeedback[] = [];
  fbSnap.forEach((d) => feedbacksList.push(d.data() as ReportFeedback));

  const totalLinked = Math.max(1, linkedReports.length);
  let confirmedYesCount = 0;
  let hasUnresolved = false;

  for (const rep of linkedReports) {
    const fb = feedbacksList.find(
      (f) =>
        f.reportId === rep.reportId ||
        f.reportId === rep.id ||
        (f.citizenId && f.citizenId === rep.citizenId)
    );
    const ver = rep.citizenVerification || (fb ? { status: fb.resolutionStatus, comment: fb.comment } : null);

    const st = ver?.status || fb?.resolutionStatus;
    if (st === 'No' || st === 'Partially') {
      hasUnresolved = true;
      break;
    }
    if (st === 'Yes') {
      confirmedYesCount++;
    }
  }

  if (resolutionStatus === 'No' || resolutionStatus === 'Partially') {
    hasUnresolved = true;
  }

  let updatedIssue: WaterIssue | null = null;
  let allCompleted = false;

  if (hasUnresolved) {
    // Citizen reported NOT RESOLVED: issue must immediately become REOPENED
    updatedIssue = await persistWaterIssueStatusChange(
      issueId,
      'REOPENED',
      {
        reopenReason: feedbackDoc.comment,
        reopenedBy: citizenId,
        reopenedAt: now,
        isSolved: false,
      },
      `Citizen ${citizenName || 'Citizen'} reported issue was Not Resolved. Issue returned to Water Officer.`,
      { id: citizenId, name: citizenName, role: 'Citizen' }
    );
  } else if (confirmedYesCount >= totalLinked) {
    // All linked citizens confirmed resolved: issue can now become CLOSED
    allCompleted = true;
    updatedIssue = await persistWaterIssueStatusChange(
      issueId,
      'CLOSED',
      {
        closedAt: now,
        isSolved: true,
        verificationsCount: totalLinked,
        verificationsTotal: totalLinked,
      },
      `All ${totalLinked} citizen verifications completed with resolution confirmation. Water issue officially closed.`,
      { id: citizenId, name: citizenName, role: 'Citizen' }
    );
  } else {
    // Partial responses: e.g. 1 of 2 completed. Keep in CITIZEN_VERIFICATION!
    const issueRef = doc(db, 'waterIssues', issueId);
    const partialData = cleanForFirestore({
      status: 'CITIZEN_VERIFICATION',
      verificationsCount: confirmedYesCount,
      verificationsTotal: totalLinked,
      updatedAt: now,
      syncedAt: now,
    });
    await updateDoc(issueRef, partialData).catch(() =>
      setDoc(issueRef, partialData, { merge: true })
    );

    const updId = `upd-${Date.now()}`;
    const logItem: ReportUpdate = {
      id: updId,
      updateId: updId,
      reportId: issueId,
      status: 'CITIZEN_VERIFICATION',
      message: `Citizen ${citizenName || 'Citizen'} submitted verification (${confirmedYesCount} of ${totalLinked} completed). Awaiting remaining citizen responses before closure.`,
      createdBy: citizenName || 'Citizen',
      role: 'Citizen',
      createdAt: now,
    };
    await setDoc(doc(db, 'updates', updId), cleanForFirestore(logItem), { merge: true });

    const freshSnap = await getDoc(issueRef);
    if (freshSnap.exists()) {
      updatedIssue = freshSnap.data() as WaterIssue;
    }
  }

  return {
    feedback: feedbackDoc,
    issue: updatedIssue,
    allVerificationsCompleted: allCompleted,
    verificationsCount: confirmedYesCount,
    verificationsTotal: totalLinked,
  };
}

// Backward-compatible status updater (finds underlying issue if reportId is passed)
export async function persistReportStatusChange(
  targetId: string,
  newStatus: ReportStatus,
  extraData: Partial<Report> = {},
  logMessage?: string,
  userActor?: { id?: string; name?: string; role?: string }
): Promise<Report | null> {
  if (!targetId) return null;

  // Check if targetId is an issueId (starts with WTR-ISSUE)
  if (targetId.startsWith('WTR-ISSUE')) {
    const updatedIssue = await persistWaterIssueStatusChange(
      targetId,
      newStatus,
      extraData as Partial<WaterIssue>,
      logMessage,
      userActor
    );
    if (updatedIssue) {
      return {
        id: updatedIssue.id,
        reportId: updatedIssue.id,
        issueId: updatedIssue.issueId,
        title: updatedIssue.title,
        description: updatedIssue.description,
        category: updatedIssue.category,
        location: updatedIssue.location,
        area: updatedIssue.area,
        status: updatedIssue.status,
        citizenId: 'water_officer',
        citizenName: 'Municipal Operations',
        createdAt: updatedIssue.createdAt,
        updatedAt: updatedIssue.updatedAt,
        ...extraData,
      } as Report;
    }
    return null;
  }

  // Look up waterReport to find linked issueId
  try {
    const repDoc = await getDoc(doc(db, 'waterReports', targetId));
    if (repDoc.exists()) {
      const repData = repDoc.data() as WaterReport;
      if (repData.issueId) {
        await persistWaterIssueStatusChange(
          repData.issueId,
          newStatus,
          extraData as Partial<WaterIssue>,
          logMessage,
          userActor
        );
        const refreshed = await getDoc(doc(db, 'waterReports', targetId));
        if (refreshed.exists()) {
          return refreshed.data() as Report;
        }
      }
    }
  } catch (e) {
    // Fall back to direct report update below
  }

  // Fallback: direct report update
  const now = new Date().toISOString();
  const reportRef = doc(db, 'reports', targetId);
  const repRef = doc(db, 'waterReports', targetId);
  const payload = cleanForFirestore({
    ...extraData,
    status: newStatus,
    updatedAt: now,
    syncedAt: now,
  });

  try {
    await updateDoc(reportRef, payload);
    await updateDoc(repRef, payload).catch(() => {});
  } catch {
    await setDoc(reportRef, { id: targetId, reportId: targetId, ...payload }, { merge: true });
    await setDoc(repRef, { id: targetId, reportId: targetId, ...payload }, { merge: true });
  }

  const snap = await getDoc(reportRef);
  return snap.exists() ? (snap.data() as Report) : null;
}

// Automatic migration & sync for existing database records (Requirement 17)
export async function syncAndMigrateExistingData(): Promise<{
  migratedIssues: number;
  migratedReports: number;
}> {
  try {
    const repSnap = await getDocs(collection(db, 'reports'));
    const issuesSnap = await getDocs(collection(db, 'waterIssues'));

    if (repSnap.empty) {
      return { migratedIssues: 0, migratedReports: 0 };
    }

    if (issuesSnap.empty) {
      const issueId = 'WTR-ISSUE-00025';
      const now = new Date().toISOString();
      const firstRep = repSnap.docs[0].data() as Report;

      const issueData: WaterIssue = {
        id: issueId,
        issueId: issueId,
        category: firstRep.category || 'Water Leakage',
        priority: firstRep.priority || 'High',
        priorityReason: 'Multiple citizen reports regarding pipe leakage in Kanakia Park',
        title: firstRep.title || 'Water Leakage in Kanakia Park',
        description: firstRep.description || 'Continuous pipeline leakage in Kanakia Park road causing water wastage.',
        location: firstRep.location || 'Kanakia road',
        area: firstRep.area || 'Mira Road East (Kanakia)',
        landmark: firstRep.landmark || '',
        status: firstRep.status || 'WORK_IN_PROGRESS',
        assignedWorkerId: firstRep.assignedWorkerId || 'w-water-1',
        assignedWorkerName: firstRep.assignedWorkerName || 'Ramesh Patil',
        assignedByOfficerId: firstRep.assignedByOfficerId || 'off-water-1',
        assignedByOfficerName: firstRep.assignedByOfficerName || 'Water Department Officer',
        citizenReportCount: repSnap.docs.length,
        lastReportAt: repSnap.docs[repSnap.docs.length - 1].data().createdAt || now,
        createdAt: firstRep.createdAt || now,
        updatedAt: now,
        departmentId: 'water',
        departmentName: 'Water Service Department',
        isSolved: firstRep.status === 'SOLVED' || firstRep.status === 'CLOSED',
      };

      await setDoc(doc(db, 'waterIssues', issueId), cleanForFirestore(issueData));

      for (const d of repSnap.docs) {
        const repData = d.data() as Report;
        const linkedRep: WaterReport = {
          ...repData,
          id: d.id,
          reportId: d.id,
          issueId: issueId,
          status: issueData.status,
          assignedWorkerId: issueData.assignedWorkerId,
          assignedWorkerName: issueData.assignedWorkerName,
          updatedAt: now,
        };
        await setDoc(doc(db, 'waterReports', d.id), cleanForFirestore(linkedRep));
        await setDoc(doc(db, 'reports', d.id), cleanForFirestore(linkedRep));
      }

      return { migratedIssues: 1, migratedReports: repSnap.docs.length };
    }

    return { migratedIssues: issuesSnap.docs.length, migratedReports: repSnap.docs.length };
  } catch (err) {
    console.error('Error during data migration sync:', err);
    return { migratedIssues: 0, migratedReports: 0 };
  }
}

// Save Feedback Document to Firestore
export async function saveFeedbackToFirestore(feedback: ReportFeedback): Promise<void> {
  try {
    const feedbackRef = doc(db, 'feedbacks', feedback.id);
    await setDoc(
      feedbackRef,
      cleanForFirestore({
        ...feedback,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `feedbacks/${feedback.id}`);
  }
}

// Save Report Update Log to Firestore
export async function saveUpdateToFirestore(update: ReportUpdate): Promise<void> {
  try {
    const updateRef = doc(db, 'updates', update.id);
    await setDoc(
      updateRef,
      cleanForFirestore({
        ...update,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `updates/${update.id}`);
  }
}

// Save Notification to Firestore
export async function saveNotificationToFirestore(notif: NotificationItem): Promise<void> {
  try {
    const notifRef = doc(db, 'notifications', notif.id);
    await setDoc(
      notifRef,
      cleanForFirestore({
        ...notif,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${notif.id}`);
  }
}

// Save User Profile to Firestore
export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      cleanForFirestore({
        ...user,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
}

// Seed initial data to Firestore (Departments, Workers, Demo Officers, Initial Reports)
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Seed Departments (Water Service Department)
    for (const dept of DEMO_DEPARTMENTS) {
      const deptRef = doc(db, 'departments', dept.id);
      await setDoc(deptRef, cleanForFirestore(dept), { merge: true });
    }

    // 2. Seed Workers (Ramesh Patil, Vijay More, Sunil Yadav, Mahesh Sharma)
    for (const worker of DEMO_WORKERS) {
      const workerRef = doc(db, 'workers', worker.workerId);
      await setDoc(workerRef, cleanForFirestore(worker), { merge: true });
    }

    console.log('Firebase Firestore initialized for Water Service Department and Field Workers.');

    console.log('Firebase Firestore seed for Water Service completed.');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed');
  }
}
