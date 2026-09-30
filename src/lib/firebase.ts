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
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import {
  Report,
  ReportStatus,
  ReportFeedback,
  ReportUpdate,
  Worker,
  User,
  Department,
  NotificationItem,
} from '../types';
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

// Subscribe to all reports
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
          snapshot.forEach((doc) => {
            reportsList.push(doc.data() as Report);
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

// Save Report Document to Firestore
export async function saveReportToFirestore(report: Report): Promise<void> {
  try {
    const reportRef = doc(db, 'reports', report.id);
    await setDoc(
      reportRef,
      cleanForFirestore({
        ...report,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reports/${report.id}`);
  }
}

// Update Report Document in Firestore
export async function updateReportInFirestore(
  reportId: string,
  updates: Partial<Report>
): Promise<void> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await setDoc(
      reportRef,
      cleanForFirestore({
        ...updates,
        updatedAt: updates.updatedAt || new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
}

// Centralized Authoritative Status Update Function (Requirements 3, 5, 6, 7, 8, 10, 11, 12)
export async function persistReportStatusChange(
  reportId: string,
  newStatus: ReportStatus,
  extraData: Partial<Report> = {},
  logMessage?: string,
  userActor?: { id?: string; name?: string; role?: string }
): Promise<Report | null> {
  try {
    if (!reportId) return null;
    const now = new Date().toISOString();
    const reportRef = doc(db, 'reports', reportId);

    // Read current data from Firestore if available
    let currentData: Partial<Report> = {};
    try {
      const snap = await getDoc(reportRef);
      if (snap.exists()) {
        currentData = snap.data() as Report;
      }
    } catch (e) {
      // Proceed with update
    }

    const statusTimestamps: Partial<Report> = {};
    if (newStatus === 'WORK_IN_PROGRESS') {
      statusTimestamps.startedAt = currentData.startedAt || extraData.startedAt || now;
    } else if (newStatus === 'SOLVED') {
      statusTimestamps.solvedAt = currentData.solvedAt || extraData.solvedAt || now;
      statusTimestamps.isSolved = true;
    } else if (newStatus === 'REOPENED') {
      statusTimestamps.reopenedAt = now;
      statusTimestamps.isSolved = false;
    } else if (newStatus === 'CLOSED') {
      statusTimestamps.closedAt = currentData.closedAt || extraData.closedAt || now;
      statusTimestamps.isSolved = true;
    } else if (newStatus === 'WORKER_ASSIGNED') {
      statusTimestamps.assignedAt = currentData.assignedAt || extraData.assignedAt || now;
    }

    const payload: Partial<Report> = {
      ...currentData,
      ...extraData,
      ...statusTimestamps,
      id: reportId,
      status: newStatus,
      updatedAt: now,
      syncedAt: now,
    };

    const cleanedPayload = cleanForFirestore(payload);
    await setDoc(reportRef, cleanedPayload, { merge: true });

    // Save history audit log in Firestore 'updates' collection
    const updId = `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const updateLog: ReportUpdate = {
      id: updId,
      updateId: updId,
      reportId: reportId,
      status: newStatus,
      message:
        logMessage ||
        (newStatus === 'CLOSED'
          ? 'Citizen confirmed that the issue was resolved. Status: CLOSED'
          : newStatus === 'REOPENED'
          ? `Citizen reopened the report: ${extraData.reopenComment || 'Issue unresolved'}`
          : newStatus === 'SOLVED'
          ? `Issue marked as solved by Officer ${userActor?.name || 'Officer'}. Awaiting citizen verification.`
          : newStatus === 'WORK_IN_PROGRESS'
          ? `Field repair work commenced on site.`
          : `Status changed to ${newStatus.replace(/_/g, ' ')}.`),
      photoUrl: extraData.resolutionPhotoUrl,
      createdBy: userActor?.name || 'Water Service Department',
      role: userActor?.role || 'Officer',
      createdAt: now,
    };

    const updateRef = doc(db, 'updates', updId);
    await setDoc(updateRef, cleanForFirestore(updateLog), { merge: true });

    return cleanedPayload as Report;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    return null;
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
