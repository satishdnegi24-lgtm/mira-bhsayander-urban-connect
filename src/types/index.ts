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

export interface Report {
  id: string; // e.g. "WTR-2026-000001"
  reportId: string;
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  title: string;
  description: string;
  category: ReportCategory;
  aiSuggestedCategory?: ReportCategory;
  departmentId?: string; // "water"
  departmentName?: string; // "Water Service Department"
  priority: ReportPriority;
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
  status: ReportStatus;
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
  createdAt: string;
  updatedAt: string;
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
