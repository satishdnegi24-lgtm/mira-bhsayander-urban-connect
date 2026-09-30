import {
  Department,
  NotificationItem,
  Report,
  ReportFeedback,
  ReportUpdate,
  ServiceDefinition,
  User,
  Worker,
} from '../types';

// Exactly ONE municipal department: Water Service Department (Requirement 1 & 2)
export const DEMO_DEPARTMENTS: Department[] = [
  {
    id: 'water',
    departmentId: 'water',
    name: 'Water Service Department',
    code: 'WSD',
    headOfficer: 'Er. Water Department Head',
    email: 'water.department@mbmc.gov.in',
    phone: '022-28114403',
    activeStaff: 125,
    resolvedRate: 94,
    openIssues: 6,
    description: 'Manages municipal reservoirs, STEM & MIDC water distribution networks, pressure regulation, water leakage detection, pipeline repair, and drinking water quality assurance across Mira-Bhayandar.',
    active: true,
  },
];

// Field Workers belonging to the Water Service Department (NO LOGIN, NO ACCOUNTS) (Requirement 6)
export const DEMO_WORKERS: Worker[] = [
  {
    workerId: 'w-water-1',
    workerName: 'Ramesh Patil',
    phoneNumber: '+91 98201 11001',
    active: true,
    departmentId: 'water',
    assignedTasksCount: 2,
  },
  {
    workerId: 'w-water-2',
    workerName: 'Vijay More',
    phoneNumber: '+91 98201 11002',
    active: true,
    departmentId: 'water',
    assignedTasksCount: 1,
  },
  {
    workerId: 'w-water-3',
    workerName: 'Sunil Yadav',
    phoneNumber: '+91 98201 11003',
    active: true,
    departmentId: 'water',
    assignedTasksCount: 2,
  },
  {
    workerId: 'w-water-4',
    workerName: 'Mahesh Sharma',
    phoneNumber: '+91 98201 11004',
    active: true,
    departmentId: 'water',
    assignedTasksCount: 0,
  },
];

// Controlled Water Department Officer Accounts (NO department prefix email naming convention) (Requirement 2 & 5)
// Water Department Officer Accounts (Dynamically registered & stored in Firestore)
export const DEMO_OFFICER_ACCOUNTS: User[] = [];

// Registered Citizen Personas (Dynamically registered & stored in Firestore)
export const DEMO_USERS: Record<string, User> = {};

// Initial Reports with WTR- prefix and EXACT 9 Statuses (Requirements 10 & 12)
export const INITIAL_REPORTS: Report[] = [];

export const INITIAL_UPDATES: ReportUpdate[] = [];

export const INITIAL_FEEDBACKS: ReportFeedback[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

// 9 WATER-ONLY SERVICE CATEGORIES (Requirement 7)
export const SERVICES: ServiceDefinition[] = [
  {
    id: 'srv-w-supply',
    category: 'Water Supply',
    name: 'Water Supply Regularity',
    iconName: 'Droplets',
    shortDescription: 'Problems related to scheduled municipal water distribution, timetable irregularities and feeder supplies.',
    standardResolutionHours: 12,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 6: Clean Water & Sanitation',
  },
  {
    id: 'srv-w-leakage',
    category: 'Water Leakage',
    name: 'Pipeline & Joint Leakages',
    iconName: 'Droplet',
    shortDescription: 'Visible leakage from public pipelines, road valve boxes, pipe joints, and connection distribution points.',
    standardResolutionHours: 8,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 6: Water Conservation',
  },
  {
    id: 'srv-w-pressure',
    category: 'Low Water Pressure',
    name: 'Low Water Pressure',
    iconName: 'Gauge',
    shortDescription: 'Insufficient pressure during supply hours preventing normal tank filling in residential or commercial premises.',
    standardResolutionHours: 12,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 6: Equitable Distribution',
  },
  {
    id: 'srv-w-nosupply',
    category: 'No Water Supply',
    name: 'No Water Supply Outages',
    iconName: 'XCircle',
    shortDescription: 'Water is not reaching an area or building during designated municipal supply cycles.',
    standardResolutionHours: 6,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 6: Universal Water Access',
  },
  {
    id: 'srv-w-contamination',
    category: 'Contaminated Water',
    name: 'Contaminated & Turbid Water',
    iconName: 'AlertTriangle',
    shortDescription: 'Dirty, smelly, discolored, or unsafe-looking water reported by citizens requiring lab sampling and flushing.',
    standardResolutionHours: 8,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 3 & 6: Safe Drinking Water',
  },
  {
    id: 'srv-w-damage',
    category: 'Pipeline Damage',
    name: 'Pipeline Structural Damage',
    iconName: 'Wrench',
    shortDescription: 'Visible cracks, bursts, or heavy structural impacts on municipal underground or surface water conduits.',
    standardResolutionHours: 6,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 9: Resilient Infrastructure',
  },
  {
    id: 'srv-w-wastage',
    category: 'Water Wastage',
    name: 'Water Wastage Prevention',
    iconName: 'Waves',
    shortDescription: 'Unnecessary water loss, continuous overflow from overhead public tanks, or unsealed feeder pipes.',
    standardResolutionHours: 4,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 12: Responsible Consumption',
  },
  {
    id: 'srv-w-facility',
    category: 'Public Water Facility',
    name: 'Public Water Standposts',
    iconName: 'Building2',
    shortDescription: 'Problems involving public taps, community standposts, or municipal drinking water distribution kiosks.',
    standardResolutionHours: 12,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 6: Community Amenities',
  },
  {
    id: 'srv-w-other',
    category: 'Other Water Issue',
    name: 'Other Water Issues',
    iconName: 'HelpCircle',
    shortDescription: 'Special water-related issues that do not directly fit into the standard municipal categories.',
    standardResolutionHours: 24,
    departmentName: 'Water Service Department',
    sdgTag: 'SDG 6: Citizen Grievance Redressal',
  },
];

export const DEMO_SERVICES = SERVICES;

export const SUSTAINABILITY_INSIGHTS = {
  waterConservedLiters: 485000,
  leakagesRepairedCount: 312,
  pipelineInspectionsDone: 840,
  waterQualityTestsPassed: 99.2,
  sdgAlignments: [
    {
      sdg: 'SDG 6',
      color: 'bg-cyan-600',
      title: 'Clean Water and Sanitation',
      description: 'Zero treated drinking water loss through real-time citizen grievance reporting and 8-hour leak isolation SLAs.',
    },
    {
      sdg: 'SDG 9',
      color: 'bg-blue-600',
      title: 'Industry, Innovation and Infrastructure',
      description: 'Sensor-verified pipeline integrity audits and reinforced ductile iron replacements ensure durable water transport networks.',
    },
    {
      sdg: 'SDG 11',
      color: 'bg-indigo-600',
      title: 'Sustainable Cities and Communities',
      description: 'Ensuring equitable water delivery to every ward across Mira Road East, Bhayandar, and Uttan coastal communities.',
    },
    {
      sdg: 'SDG 12',
      color: 'bg-emerald-600',
      title: 'Responsible Consumption and Production',
      description: 'Rapid mitigation of water wastage and promotion of community rainwater harvesting and sump float maintenance.',
    },
  ],
  citizenTips: [
    'Promptly report pipeline leaks, damp road spots, or dripping municipal standposts on this portal to prevent treated water wastage.',
    'Regularly inspect overhead and underground water storage tank float valves to stop silent overflow losses.',
    'If you notice discolored or unusual smelling water, report immediately for rapid laboratory water quality testing and pipeline flushing.',
    'Avoid direct unauthorized suction pumps on municipal feeder lines, which causes pressure drops for neighboring families.',
  ],
};

export const CIVIC_FAQS = [
  {
    q: 'What types of issues does this portal handle?',
    a: 'This portal is exclusively specialized for Urban Water Service Management in Mira-Bhayandar. You can report Water Leakage, Low Water Pressure, No Water Supply, Contaminated Water, Pipeline Damage, Water Wastage, and Public Water Facility issues. Non-water complaints (such as roads, potholes, garbage, or streetlights) are redirected to the general municipal desk.',
  },
  {
    q: 'How does the water grievance workflow operate?',
    a: '1. Citizen signs up and reports an issue. 2. AI classifies the category and suggests priority. 3. Water Department Officer reviews the report. 4. A field worker is assigned. 5. Work commences on site. 6. Officer marks it Solved. 7. The citizen inspects and verifies the resolution (Closed or Reopened).',
  },
  {
    q: 'What are the authenticated login roles?',
    a: 'There are exactly two authenticated roles: Citizen and Water Department Officer. Field workers are municipal employees dispatched to tasks by officers and do not have platform login credentials.',
  },
  {
    q: 'Who can access the Water Department Officer portal?',
    a: 'Authorized Water Service Department Engineers and Officers can log in or register their official profile with the department authorization code on the Water Officer portal.',
  },
  {
    q: 'What happens if a solved issue is still leaking or incomplete?',
    a: 'When an officer marks an issue as Solved, you receive an inspection prompt. If you select "Partially Resolved" or "Not Resolved" with your comments, the report status immediately changes to REOPENED and returns to the Water Officer queue for urgent remediation.',
  },
  {
    q: 'What report ID format is used for tracking?',
    a: 'Every submitted water issue receives a unique tracking ID with the prefix WTR (for example: WTR-2026-000001). You can use this ID on the Track Report page to view the live timeline and assigned field worker.',
  },
];
