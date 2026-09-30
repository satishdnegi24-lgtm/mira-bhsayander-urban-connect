import { ReportCategory, ReportPriority } from '../types';

export interface ClassifyResult {
  isWaterRelated: boolean;
  category: ReportCategory;
  suggestedPriority: ReportPriority;
  suggestedAction: string;
  reason: string;
  suggestedDepartment: string;
  rejectionMessage?: string;
  source?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
  type: string;
}

export interface ChatApiResponse {
  reply: string;
  quickActions?: string[];
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  source?: string;
}

export async function classifyIssueWithAi(data: {
  title: string;
  description: string;
  location: string;
}): Promise<ClassifyResult> {
  try {
    const res = await fetch('/api/gemini/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      return {
        isWaterRelated: json.isWaterRelated !== false,
        category: (json.category as ReportCategory) || 'Other Water Issue',
        suggestedPriority: (json.suggestedPriority as ReportPriority) || 'Medium',
        suggestedAction: json.suggestedAction || 'Water Department Inspection',
        reason: json.reason || 'Water issue evaluated by municipal intake classifier.',
        suggestedDepartment: 'Water Service Department',
        rejectionMessage: json.rejectionMessage,
        source: json.source || 'gemini-3.5-flash',
      };
    }
  } catch (err) {
    console.warn('Backend water classify API request failed, using intelligent client rules:', err);
  }

  // Client-side rule analysis fallback specialized for Water Service Department
  const text = `${data.title} ${data.description} ${data.location}`.toLowerCase();

  // Non-water detection
  const isNonWater =
    text.includes('pothole') ||
    text.includes('road') ||
    text.includes('asphalt') ||
    text.includes('garbage') ||
    text.includes('waste') ||
    text.includes('trash') ||
    text.includes('streetlight') ||
    text.includes('lamp') ||
    text.includes('traffic') ||
    text.includes('toilet');

  const hasWater =
    text.includes('water') ||
    text.includes('pipe') ||
    text.includes('leak') ||
    text.includes('pressure') ||
    text.includes('tap') ||
    text.includes('supply') ||
    text.includes('burst');

  if (isNonWater && !hasWater) {
    return {
      isWaterRelated: false,
      category: 'Other Water Issue',
      suggestedPriority: 'Low',
      suggestedAction: 'Redirect to Municipal Desk',
      reason: 'This platform currently handles urban water-related issues. Please submit a water-related issue.',
      rejectionMessage: 'This platform currently handles urban water-related issues. Please submit a water-related issue.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('contaminat') || text.includes('dirty') || text.includes('mud') || text.includes('smell')) {
    return {
      isWaterRelated: true,
      category: 'Contaminated Water',
      suggestedPriority: 'High',
      suggestedAction: 'Water Quality Testing & Line Flushing',
      reason: 'Unsafe or contaminated water reported which may pose health risks to residents.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('damage') || text.includes('burst') || text.includes('break') || text.includes('crack')) {
    return {
      isWaterRelated: true,
      category: 'Pipeline Damage',
      suggestedPriority: 'High',
      suggestedAction: 'Emergency Pipeline Repair & Joint Isolation',
      reason: 'Physical pipeline structural damage detected requiring urgent repair.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('leak') || text.includes('gush') || text.includes('dripping')) {
    return {
      isWaterRelated: true,
      category: 'Water Leakage',
      suggestedPriority: 'High',
      suggestedAction: 'Water Department Inspection',
      reason: 'Continuous leakage may result in water wastage and affect nearby infrastructure.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('no water') || text.includes('cutoff') || text.includes('stopped')) {
    return {
      isWaterRelated: true,
      category: 'No Water Supply',
      suggestedPriority: 'High',
      suggestedAction: 'Distribution Line & Valve Inspection',
      reason: 'Interruption in scheduled drinking water supply to residential premises.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('pressure') || text.includes('low') || text.includes('slow')) {
    return {
      isWaterRelated: true,
      category: 'Low Water Pressure',
      suggestedPriority: 'Medium',
      suggestedAction: 'Pressure Gauge & Valve Regulation',
      reason: 'Insufficient pressure preventing normal inflow into storage sumps and overhead tanks.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('wastage') || text.includes('overflow')) {
    return {
      isWaterRelated: true,
      category: 'Water Wastage',
      suggestedPriority: 'Medium',
      suggestedAction: 'Float Valve Adjustment & Shutoff',
      reason: 'Continuous water loss identified, requiring rapid conservation response.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  if (text.includes('public tap') || text.includes('standpost')) {
    return {
      isWaterRelated: true,
      category: 'Public Water Facility',
      suggestedPriority: 'Medium',
      suggestedAction: 'Public Tap Repair & Valve Replacement',
      reason: 'Public community water access facility needs mechanical repair.',
      suggestedDepartment: 'Water Service Department',
      source: 'client-water-rules',
    };
  }

  return {
    isWaterRelated: true,
    category: 'Water Supply',
    suggestedPriority: 'Medium',
    suggestedAction: 'Water Department Inspection',
    reason: 'Water supply management grievance submitted for municipal review.',
    suggestedDepartment: 'Water Service Department',
    source: 'client-water-rules',
  };
}

export async function sendChatMessageToAi(
  message: string,
  history: Array<{ role: string; text: string }>,
  options?: {
    mode?: 'general' | 'fast' | 'search' | 'maps' | 'complex';
  }
): Promise<ChatApiResponse> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        mode: options?.mode || 'general',
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend chat API failed, using client fallback:', err);
  }

  const msg = message.toLowerCase();
  let reply = 'I am your MB Urban Water Assistant. How can I help you with water services in Mira-Bhayandar?';
  const quickActions = ['Report Water Leakage', 'Check Water Timetable', 'Track Water Report'];

  if (msg.includes('pothole') || msg.includes('road') || msg.includes('garbage') || msg.includes('waste')) {
    reply = 'This platform currently handles urban water-related issues. Please submit a water-related issue.';
  } else if (msg.includes('leak') || msg.includes('pipeline')) {
    reply = 'Water pipeline leakages are prioritized for inspection and joint sealing by the Water Service Department to prevent treated water loss.';
  } else if (msg.includes('pressure')) {
    reply = 'Low water pressure reports are routed to ward distribution officers to inspect booster pumps and pipeline distribution valves.';
  }

  return {
    reply,
    quickActions,
    modelUsed: 'client-fallback',
    source: 'client-fallback',
  };
}
