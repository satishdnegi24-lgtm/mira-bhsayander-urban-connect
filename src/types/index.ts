export type Language = 'en' | 'hi' | 'mr';

// EXACTLY TWO AUTHENTICATED ROLES: Citizen and Water Department Officer
export type UserRole = 'citizen' | 'water_officer' | 'department_officer' | 'guest';

// EXACT 9 WATER ISSUE CATEGORIES SPECIFIED IN REQUIREMENT 7
export type ReportCategory =
  | 'Water Supply'
  | 'Water Leakage'
  | 'Low Water Pressure'
  | 'No Water Supply'
  | 'Contaminated Water'
  | 'Pipeline Damage'
  | 'Water Wastage'
  | 'Public Water Facility'
  | 'Other Water Issue';

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// EXACT 9 REPORT STATUSES SPECIFIED IN REQUIREMENT 12
export type ReportStatus =
  | 'SUBMITTED'
  | 'AI_CLASSIFIED'
  | 'OFFICER_REVIEW'
  | 'WORKER_ASSIGNED'
  | 'WORK_IN_PROGRESS'
  | 'SOLVED'
  | 'CITIZEN_VERIFICATION'
  | 'CLOSED'
  | 'REOPENED';

export const VALID_REPORT_STATUSES: readonly ReportStatus[] = [
  'SUBMITTED',
  'AI_CLASSIFIED',
  'OFFICER_REVIEW',
  'WORKER_ASSIGNED',
  'WORK_IN_PROGRESS',
  'SOLVED',
  'CITIZEN_VERIFICATION',
  'CLOSED',
  'REOPENED',
] as const;

export function isValidReportStatus(status: any): status is ReportStatus {
  return typeof status === 'string' && VALID_REPORT_STATUSES.includes(status as ReportStatus);
}

export interface User {
  id: string; // uid
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'water_officer' | 'department_officer';
  area: string;
  language: 'en' | 'hi' | 'mr';
  departmentId?: string; // "water"
  departmentName?: string; // "Water Service Department"
  designation?: string;
  avatar?: string;
  createdAt?: string;
  isGovAuthenticated?: boolean;
}

export interface Worker {
  workerId: string;
  workerName: string;
  phoneNumber: string;
  active: boolean;
  departmentId?: string;
  assignedTasksCount?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Operational Real-World Water Issue (ONE issue for MULTIPLE citizen reports)
export interface WaterIssue {
  id: string; // e.g. "WTR-ISSUE-00025"
  issueId: string;
  category: ReportCategory;
  priority: ReportPriority;
  priorityReason?: string;
  title: string;
  description: string;
  location: string;
  area: string;
  landmark?: string;
  status: ReportStatus;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedByOfficerId?: string;
  assignedByOfficerName?: string;
  assignedAt?: string;
  startedAt?: string;
  solvedAt?: string;
  closedAt?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  resolutionNotes?: string;
  resolutionPhotoUrl?: string;
  isSolved?: boolean;
  citizenReportCount: number;
  lastReportAt: string;
  createdAt: string;
  updatedAt: string;
  citizenVerification?: {
    status: 'Yes' | 'Partially' | 'No';
    comment?: string;
    verifiedAt: string;
  };
  verificationsCount?: number;
  verificationsTotal?: number;
  departmentId?: string;
  departmentName?: string;
}

// Individual Citizen Report / Evidence Submission
export interface WaterReport {
  id: string; // e.g. "WTR-REPORT-000101"
  reportId: string;
  issueId: string; // Links to WaterIssue.issueId
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  title: string;
  description: string;
  category: ReportCategory;
  aiSuggestedCategory?: ReportCategory;
  departmentId?: string; // "water"
  departmentName?: string; // "Water Service Department"
  priority?: ReportPriority;
  location: string;
  area: string;
  landmark?: string;
  photoUrl?: string;
  photo?: string;
  coordinates?: Coordinates;
  contactPreference?: 'sms' | 'email' | 'whatsapp';
  documentName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedByOfficerId?: string;
  assignedByOfficerName?: string;
  assignedAt?: string;
  status?: ReportStatus;
  startedAt?: string;
  solvedAt?: string;
  closedAt?: string;
  resolutionNotes?: string;
  resolutionPhotoUrl?: string;
  reopenComment?: string;
  aiAnalysis?: {
    suggestedCategory?: ReportCategory;
    suggestedPriority?: ReportPriority;
    suggestedAction?: string;
    reason: string;
    isWaterRelated?: boolean;
    confidenceScore?: number;
    source?: string;
  };
  citizenVerification?: {
    status: 'Yes' | 'Partially' | 'No';
    comment?: string;
    verifiedAt: string;
  };
  isSolved?: boolean;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  hasFeedback?: boolean;
  feedbackRating?: number;
  feedbackComment?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Backward-compatible Report type
export type Report = WaterReport;

export interface DuplicateDetectionResult {
  isLikelyDuplicate: boolean;
  matchedIssueId: string | null;
  confidence: number;
  reason: string;
}

export interface ReportUpdate {
  id: string; // updateId
  updateId?: string;
  reportId: string;
  status: ReportStatus;
  message: string;
  photoUrl?: string;
  createdBy: string;
  role?: string;
  createdAt: string;
}

export interface ReportFeedback {
  id: string; // feedbackId
  feedbackId?: string;
  reportId: string;
  issueId?: string;
  citizenId: string;
  citizenName?: string;
  rating: number; // 1 to 5
  resolutionStatus: 'Yes' | 'Partially' | 'No';
  comment: string;
  createdAt: string;
}

export interface Department {
  id: string; // "water"
  departmentId?: string;
  name: string;
  code: string;
  headOfficer?: string;
  email: string;
  phone: string;
  activeStaff?: number;
  resolvedRate?: number;
  openIssues?: number;
  description: string;
  active: boolean;
}

export interface NotificationItem {
  id: string; // notificationId
  notificationId?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'status_change' | 'assignment' | 'solved' | 'verification' | 'reopened' | 'feedback_request';
  read: boolean;
  reportId?: string;
  createdAt: string;
}

export interface ServiceDefinition {
  id: string;
  category: ReportCategory;
  name: string;
  iconName: string;
  shortDescription: string;
  standardResolutionHours: number;
  departmentName: string;
  sdgTag: string;
}

export type ActivePage =
  | 'home'
  | 'services'
  | 'how-it-works'
  | 'dashboard'
  | 'report'
  | 'my-reports'
  | 'track'
  | 'details'
  | 'map'
  | 'analytics'
  | 'feedback'
  | 'sustainability'
  | 'faq'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'profile';
