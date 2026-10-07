import { DuplicateDetectionResult, ReportCategory, WaterIssue, WaterReport } from '../types';

export const DUPLICATE_TIME_WINDOW_HOURS = 48;

// Normalize text for comparison (lowercase, trimmed, stripped of special chars)
function normalizeStr(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize text into words, omitting common stop words
function getTokens(str?: string): Set<string> {
  const normalized = normalizeStr(str);
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near',
    'road', 'street', 'area', 'mira', 'bhayandar', 'water', 'issue', 'problem',
    'please', 'very', 'from', 'to', 'for', 'our', 'my', 'we', 'there'
  ]);
  const words = normalized.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));
  return new Set(words);
}

// Jaccard similarity between two sets of tokens
function calculateSimilarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Checks if location phrases overlap significantly (e.g. "kanakia park", "beverly park")
function areLocationsClose(locA: string, areaA: string, locB: string, areaB: string): boolean {
  const normLocA = normalizeStr(locA);
  const normAreaA = normalizeStr(areaA);
  const normLocB = normalizeStr(locB);
  const normAreaB = normalizeStr(areaB);

  // Exact location or area match
  if (normLocA && normLocB && (normLocA.includes(normLocB) || normLocB.includes(normLocA))) {
    return true;
  }
  if (normAreaA && normAreaB && (normAreaA === normAreaB || normAreaA.includes(normAreaB) || normAreaB.includes(normAreaA))) {
    // If area matches, check location tokens
    const tokensA = getTokens(locA);
    const tokensB = getTokens(locB);
    for (const t of tokensA) {
      if (tokensB.has(t)) return true;
    }
  }

  // Check key neighborhood landmarks
  const keyAreas = ['kanakia', 'beverly', 'shanti', 'sheetal', 'silver park', 'maxus', 'station', 'golden nest', 'ramdev', 'jangid'];
  for (const key of keyAreas) {
    const inA = normLocA.includes(key) || normAreaA.includes(key);
    const inB = normLocB.includes(key) || normAreaB.includes(key);
    if (inA && inB) return true;
  }

  return false;
}

/**
 * Deterministic duplicate score calculator.
 * Evaluates location, category, description, and time proximity.
 */
export function calculateDuplicateScore(
  report: Partial<WaterReport>,
  issue: WaterIssue
): { score: number; reason: string } {
  // 1. Time Proximity Check
  const issueTime = new Date(issue.lastReportAt || issue.createdAt).getTime();
  const reportTime = report.createdAt ? new Date(report.createdAt).getTime() : Date.now();
  const hoursDiff = Math.abs(reportTime - issueTime) / (1000 * 60 * 60);

  if (hoursDiff > DUPLICATE_TIME_WINDOW_HOURS) {
    return { score: 0, reason: 'Report time exceeds 48-hour matching window.' };
  }

  // 2. Status Check: Closed issues are not candidates for merging new complaints
  if (issue.status === 'CLOSED') {
    return { score: 0, reason: 'Existing issue is already closed.' };
  }

  // 3. Location Proximity
  const locMatches = areLocationsClose(
    report.location || '',
    report.area || '',
    issue.location || '',
    issue.area || ''
  );

  if (!locMatches) {
    return { score: 0.1, reason: 'Locations are in different municipal sections.' };
  }

  // 4. Category Match
  const categoryA = report.category;
  const categoryB = issue.category;
  const sameCategory = categoryA === categoryB;

  // Compatible categories (e.g., Water Leakage & Pipeline Damage can be related, but Water Contamination & Water Leakage are distinct)
  const isCompatibleDamage =
    (categoryA === 'Water Leakage' && categoryB === 'Pipeline Damage') ||
    (categoryA === 'Pipeline Damage' && categoryB === 'Water Leakage');

  if (!sameCategory && !isCompatibleDamage) {
    return {
      score: 0.2,
      reason: `Different water problem categories (${categoryA} vs ${categoryB}) at similar location.`,
    };
  }

  // 5. Semantic similarity of descriptions
  const tokensReport = getTokens(`${report.title || ''} ${report.description || ''}`);
  const tokensIssue = getTokens(`${issue.title || ''} ${issue.description || ''}`);
  const descSim = calculateSimilarity(tokensReport, tokensIssue);

  // Scoring weights:
  // - Location proximity: 0.40
  // - Category match: 0.35 (or 0.20 if compatible damage)
  // - Description similarity: 0.15
  // - Time proximity (within 24h bonus): 0.10
  let totalScore = 0.40;
  totalScore += sameCategory ? 0.35 : 0.20;
  totalScore += Math.min(0.15, descSim * 0.3);
  if (hoursDiff <= 24) totalScore += 0.10;

  const categoryName = categoryA === 'Contaminated Water' ? 'suspected water contamination' : (categoryA || 'water issue');
  const locName = report.location || issue.location || 'the area';

  return {
    score: Math.min(1.0, totalScore),
    reason: `Multiple reports describe ${categoryName} in ${locName} within the past ${Math.round(hoursDiff)} hours.`,
  };
}

/**
 * Searches existing active issues for a likely duplicate using AI and deterministic scoring.
 */
export async function detectDuplicateWaterIssue(
  newReport: Partial<WaterReport>,
  activeIssues: WaterIssue[]
): Promise<DuplicateDetectionResult> {
  // If no active issues exist, cannot be duplicate
  const eligibleIssues = activeIssues.filter((i) => i.status !== 'CLOSED');
  if (eligibleIssues.length === 0) {
    return {
      isLikelyDuplicate: false,
      matchedIssueId: null,
      confidence: 0,
      reason: 'No existing active water issues found.',
    };
  }

  // Step 1: Pre-filter candidate issues using deterministic checks
  const candidatesWithScores = eligibleIssues.map((issue) => {
    const { score, reason } = calculateDuplicateScore(newReport, issue);
    return { issue, score, reason };
  });

  // Sort by highest score
  candidatesWithScores.sort((a, b) => b.score - a.score);
  const bestCandidate = candidatesWithScores[0];

  // Try Server-Side AI Detection if endpoint is available
  try {
    const res = await fetch('/api/gemini/duplicate-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newReport: {
          title: newReport.title,
          description: newReport.description,
          category: newReport.category,
          location: newReport.location,
          area: newReport.area,
          landmark: newReport.landmark,
          createdAt: newReport.createdAt || new Date().toISOString(),
        },
        candidateIssues: eligibleIssues.slice(0, 5).map((iss) => ({
          issueId: iss.issueId,
          category: iss.category,
          title: iss.title,
          description: iss.description,
          location: iss.location,
          area: iss.area,
          landmark: iss.landmark,
          status: iss.status,
          createdAt: iss.createdAt,
          lastReportAt: iss.lastReportAt,
          citizenReportCount: iss.citizenReportCount,
        })),
      }),
    });

    if (res.ok) {
      const data: DuplicateDetectionResult = await res.json();
      if (typeof data.isLikelyDuplicate === 'boolean' && data.confidence !== undefined) {
        return data;
      }
    }
  } catch (e) {
    // Fall back to deterministic check
  }

  // Step 2: Fallback to high-confidence deterministic matching
  if (bestCandidate && bestCandidate.score >= 0.75) {
    return {
      isLikelyDuplicate: true,
      matchedIssueId: bestCandidate.issue.issueId,
      confidence: Number(bestCandidate.score.toFixed(2)),
      reason: bestCandidate.reason,
    };
  }

  return {
    isLikelyDuplicate: false,
    matchedIssueId: null,
    confidence: bestCandidate ? Number(bestCandidate.score.toFixed(2)) : 0,
    reason: 'Report appears to describe a distinct real-world water incident.',
  };
}
