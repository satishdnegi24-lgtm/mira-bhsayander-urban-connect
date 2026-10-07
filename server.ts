import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback water classification logic
function fallbackClassifyWater(text: string) {
  const t = text.toLowerCase();

  // Check for unrelated municipal complaints (Road, Pothole, Waste, Garbage, Streetlight, Traffic, Sanitation)
  const isUnrelated =
    t.includes('pothole') ||
    t.includes('road') ||
    t.includes('asphalt') ||
    t.includes('garbage') ||
    t.includes('waste') ||
    t.includes('trash') ||
    t.includes('litter') ||
    t.includes('streetlight') ||
    t.includes('lamp') ||
    t.includes('pole') ||
    t.includes('traffic') ||
    t.includes('parking') ||
    t.includes('toilet') ||
    t.includes('urinal');

  const hasWaterKeyword =
    t.includes('water') ||
    t.includes('pipeline') ||
    t.includes('pipe') ||
    t.includes('leak') ||
    t.includes('leakage') ||
    t.includes('pressure') ||
    t.includes('tap') ||
    t.includes('supply') ||
    t.includes('contaminated') ||
    t.includes('dirty water') ||
    t.includes('smelly water') ||
    t.includes('wastage') ||
    t.includes('burst') ||
    t.includes('tanker');

  if (isUnrelated && !hasWaterKeyword) {
    return {
      isWaterRelated: false,
      category: 'Other Water Issue',
      suggestedPriority: 'Low',
      suggestedAction: 'Redirect to Municipal Desk',
      reason: 'This platform currently handles urban water-related issues. Please submit a water-related issue.',
      rejectionMessage: 'This platform currently handles urban water-related issues. Please submit a water-related issue.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // Classification for Water Issues:
  // 1. Contaminated Water
  if (t.includes('contaminat') || t.includes('dirty') || t.includes('yellow') || t.includes('mud') || t.includes('smell') || t.includes('unsafe') || t.includes('odor')) {
    return {
      isWaterRelated: true,
      category: 'Contaminated Water',
      suggestedPriority: 'High',
      suggestedAction: 'Water Quality Testing & Line Flushing',
      reason: 'Unsafe or contaminated water reported which may pose health risks to residents.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 2. Pipeline Damage
  if (t.includes('damage') || t.includes('burst') || t.includes('break') || t.includes('broken pipe') || t.includes('crack')) {
    return {
      isWaterRelated: true,
      category: 'Pipeline Damage',
      suggestedPriority: t.includes('main') || t.includes('heavy') ? 'Critical' : 'High',
      suggestedAction: 'Emergency Pipeline Repair & Isolation',
      reason: 'Physical pipeline structural damage detected requiring excavation and section replacement.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 3. Water Leakage
  if (t.includes('leak') || t.includes('gush') || t.includes('seep') || t.includes('dripping') || t.includes('flowing on road')) {
    return {
      isWaterRelated: true,
      category: 'Water Leakage',
      suggestedPriority: t.includes('continuous') || t.includes('heavy') || t.includes('gushing') ? 'High' : 'Medium',
      suggestedAction: 'Water Department Inspection & Joint Sealing',
      reason: 'Continuous leakage may result in water wastage and affect nearby infrastructure.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 4. No Water Supply
  if (t.includes('no water') || t.includes('cutoff') || t.includes('stopped') || t.includes('dry') || t.includes('not reaching')) {
    return {
      isWaterRelated: true,
      category: 'No Water Supply',
      suggestedPriority: t.includes('days') || t.includes('entire') ? 'High' : 'Medium',
      suggestedAction: 'Distribution Line & Valve Inspection',
      reason: 'Complete disruption in scheduled water supply impacting domestic household access.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 5. Low Water Pressure
  if (t.includes('pressure') || t.includes('slow flow') || t.includes('trickle') || t.includes('insufficient')) {
    return {
      isWaterRelated: true,
      category: 'Low Water Pressure',
      suggestedPriority: 'Medium',
      suggestedAction: 'Booster Pump & Pressure Gauge Audit',
      reason: 'Sub-optimal pipeline pressure preventing water from reaching overhead tanks.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 6. Water Wastage
  if (t.includes('wastage') || t.includes('overflowing tank') || t.includes('waste') || t.includes('unnecessary flow')) {
    return {
      isWaterRelated: true,
      category: 'Water Wastage',
      suggestedPriority: 'Medium',
      suggestedAction: 'Float Valve Regulation & Conservation Check',
      reason: 'Preventable treated water loss identified, requiring valve shutoff or repair.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 7. Public Water Facility
  if (t.includes('public tap') || t.includes('standpost') || t.includes('water fountain') || t.includes('public facility') || t.includes('distribution point')) {
    return {
      isWaterRelated: true,
      category: 'Public Water Facility',
      suggestedPriority: 'Medium',
      suggestedAction: 'Municipal Standpost Upkeep & Tap Replacement',
      reason: 'Public drinking water distribution point malfunctioning or tap broken.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // 8. Water Supply
  if (t.includes('supply') || t.includes('timetable') || t.includes('schedule') || t.includes('timing')) {
    return {
      isWaterRelated: true,
      category: 'Water Supply',
      suggestedPriority: 'Medium',
      suggestedAction: 'Ward Supply Schedule Coordination',
      reason: 'Inquiry or irregularity regarding municipal water supply schedule.',
      suggestedDepartment: 'Water Service Department',
    };
  }

  // Default to Other Water Issue
  return {
    isWaterRelated: true,
    category: 'Other Water Issue',
    suggestedPriority: 'Medium',
    suggestedAction: 'Water Department Field Inspection',
    reason: 'Water infrastructure issue requiring assessment by Water Service Department.',
    suggestedDepartment: 'Water Service Department',
  };
}

// 1. Intelligent Water Issue Classification endpoint
app.post('/api/gemini/classify', async (req, res) => {
  const { title, description, location } = req.body;
  const combinedText = `${title || ''} ${description || ''} ${location || ''}`.trim();

  if (!combinedText) {
    return res.status(400).json({ error: 'Description or title is required' });
  }

  // Fallback if no AI or API key
  if (!ai || !process.env.GEMINI_API_KEY) {
    const fallback = fallbackClassifyWater(combinedText);
    return res.json({
      ...fallback,
      source: 'water-rules-engine',
    });
  }

  try {
    const prompt = `You are the specialized AI classifier for the Water Service Department of Mira-Bhayandar Municipal Corporation (MBMC).
CRITICAL CONSTRAINT: This system ONLY handles urban water-related issues.

Analyze this grievance:
Title: "${title || 'N/A'}"
Description: "${description || 'N/A'}"
Location: "${location || 'N/A'}"

Step 1: Determine if this issue is related to urban water services.
If the issue is clearly unrelated to water (e.g. road potholes, garbage/solid waste, streetlights, traffic, sewage without water supply context):
- set isWaterRelated = false
- set category = "Other Water Issue"
- set suggestedPriority = "Low"
- set reason = "This platform currently handles urban water-related issues. Please submit a water-related issue."
- set rejectionMessage = "This platform currently handles urban water-related issues. Please submit a water-related issue."
- set suggestedAction = "Redirect to general municipal desk"

Step 2: If the issue IS water-related, classify it accurately:
1. category: Must be one of:
   - "Water Supply" (problems with regular water supply schedule/distribution)
   - "Water Leakage" (visible leakage from pipelines, connections or public infrastructure)
   - "Low Water Pressure" (insufficient water pressure reaching homes/tanks)
   - "No Water Supply" (water not reaching an area or home)
   - "Contaminated Water" (dirty, discolored, or smelly water)
   - "Pipeline Damage" (visible physical damage, bursts or cracks in public water pipes)
   - "Water Wastage" (unnecessary treated water loss, overflowing tanks)
   - "Public Water Facility" (problems involving public taps, standposts or fountains)
   - "Other Water Issue" (other water-related issues)

2. suggestedPriority: Must be one of:
   - "Low" (Minor issue with limited immediate impact)
   - "Medium" (Issue affecting some residents or service availability)
   - "High" (Major leakage, contamination, prolonged water outage, damaged pipeline or issue affecting many residents)
   - "Critical" (Potentially serious public health/safety concern or major water main failure)

3. suggestedAction: A short operational recommendation for the Water Department (e.g. "Water Department Inspection", "Pipeline Section Repair & Joint Sealing", "Water Quality Lab Testing", "Pressure Valve Regulation").

4. reason: 1-2 concise sentences explaining the rationale (e.g. "Continuous leakage may result in water wastage and affect nearby infrastructure.").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isWaterRelated: { type: Type.BOOLEAN },
            category: { type: Type.STRING },
            suggestedPriority: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            reason: { type: Type.STRING },
            rejectionMessage: { type: Type.STRING },
          },
          required: ['isWaterRelated', 'category', 'suggestedPriority', 'reason', 'suggestedAction'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const isWater = parsed.isWaterRelated !== false;

    if (!isWater) {
      return res.json({
        isWaterRelated: false,
        category: 'Other Water Issue',
        suggestedPriority: 'Low',
        suggestedAction: 'Redirect to Municipal Desk',
        reason: 'This platform currently handles urban water-related issues. Please submit a water-related issue.',
        rejectionMessage: 'This platform currently handles urban water-related issues. Please submit a water-related issue.',
        suggestedDepartment: 'Water Service Department',
        source: 'gemini-3.5-flash',
      });
    }

    return res.json({
      isWaterRelated: true,
      category: parsed.category || 'Water Supply',
      suggestedPriority: parsed.suggestedPriority || 'Medium',
      suggestedAction: parsed.suggestedAction || 'Water Department Inspection',
      reason: parsed.reason || 'Water infrastructure grievance analyzed by AI.',
      suggestedDepartment: 'Water Service Department',
      source: 'gemini-3.5-flash',
    });
  } catch (error) {
    console.error('Gemini water classify error, falling back:', error);
    const fallback = fallbackClassifyWater(combinedText);
    return res.json({
      ...fallback,
      source: 'water-rules-fallback',
    });
  }
});

// Helper for deterministic duplicate matching fallback
function deterministicMatch(newReport: any, candidateIssues: any[]) {
  const norm = (s?: string) => (s || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const reportLoc = norm(newReport.location);
  const reportArea = norm(newReport.area);
  const reportCat = newReport.category;

  for (const iss of candidateIssues) {
    if (iss.status === 'CLOSED') continue;
    const issLoc = norm(iss.location);
    const issArea = norm(iss.area);

    const locOverlap =
      (reportLoc && issLoc && (reportLoc.includes(issLoc) || issLoc.includes(reportLoc))) ||
      (reportArea && issArea && reportArea === issArea && reportLoc && issLoc && reportLoc.split(' ').some((w: string) => w.length > 3 && issLoc.includes(w))) ||
      ['kanakia', 'beverly', 'shanti', 'station', 'maxus', 'sheetal', 'silver park'].some(
        (key) => (reportLoc.includes(key) || reportArea.includes(key)) && (issLoc.includes(key) || issArea.includes(key))
      );

    const sameCat = reportCat === iss.category;
    const compatibleDamage =
      (reportCat === 'Water Leakage' && iss.category === 'Pipeline Damage') ||
      (reportCat === 'Pipeline Damage' && iss.category === 'Water Leakage');

    if (locOverlap && (sameCat || compatibleDamage)) {
      const categoryTerm = reportCat === 'Contaminated Water' ? 'suspected water contamination' : reportCat;
      return {
        isLikelyDuplicate: true,
        matchedIssueId: iss.issueId,
        confidence: sameCat ? 0.92 : 0.81,
        reason: `Both reports describe ${categoryTerm} in ${newReport.location || newReport.area} within the same operational time window.`,
      };
    }
  }

  return {
    isLikelyDuplicate: false,
    matchedIssueId: null,
    confidence: 0,
    reason: 'Report appears to describe a distinct real-world water incident.',
  };
}

// 2. AI Duplicate Water Issue Detection Endpoint
app.post('/api/gemini/duplicate-detect', async (req, res) => {
  const { newReport, candidateIssues } = req.body;
  if (!newReport || !Array.isArray(candidateIssues) || candidateIssues.length === 0) {
    return res.json({
      isLikelyDuplicate: false,
      matchedIssueId: null,
      confidence: 0,
      reason: 'No candidate issues to compare against.',
    });
  }

  // Fallback if no Gemini AI configured
  if (!ai || !process.env.GEMINI_API_KEY) {
    return res.json(deterministicMatch(newReport, candidateIssues));
  }

  try {
    const prompt = `You are the Senior Operations AI for the Water Service Department of Mira-Bhayandar Municipal Corporation (MBMC).
The goal is to prevent duplicate operational work orders by determining whether a newly submitted citizen water complaint describes the SAME REAL-WORLD WATER INCIDENT as an existing open Water Issue.

New Citizen Complaint:
- Title: "${newReport.title || 'N/A'}"
- Category: "${newReport.category}"
- Location: "${newReport.location}"
- Area: "${newReport.area}"
- Landmark: "${newReport.landmark || 'N/A'}"
- Description: "${newReport.description}"
- Submitted At: "${newReport.createdAt || 'Recent'}"

Active Open Water Issues:
${candidateIssues
  .map(
    (iss: any, idx: number) => `
[Issue #${idx + 1}] ID: ${iss.issueId}
- Category: ${iss.category}
- Location: ${iss.location}
- Area: ${iss.area}
- Landmark: ${iss.landmark || 'N/A'}
- Description: ${iss.description}
- Status: ${iss.status}
- Existing Citizen Reports: ${iss.citizenReportCount || 1}
- Created: ${iss.createdAt}`
  )
  .join('\n')}

Rules for Duplicate Detection:
1. Two complaints are DUPLICATES if they describe the SAME real-world physical water event (e.g., both describe suspected water contamination in Kanakia Park, or both report pipeline rupture on Station Road).
2. Different locations (e.g. Kanakia Park vs Maxus Mall Bhayandar) are NOT duplicates.
3. Different unrelated water categories at the same general area (e.g. low household pressure in flat A vs heavy pipeline leak on street) are NOT duplicates unless they clearly describe the exact same event.
4. Do NOT assert scientifically that water is contaminated; use objective phrases such as "suspected water contamination" or "discolored water reported".
5. If confidence >= 0.75, set isLikelyDuplicate = true and matchedIssueId to the matching Issue ID. Otherwise set isLikelyDuplicate = false and matchedIssueId = null.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLikelyDuplicate: { type: Type.BOOLEAN },
            matchedIssueId: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ['isLikelyDuplicate', 'confidence', 'reason'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      isLikelyDuplicate: Boolean(parsed.isLikelyDuplicate && parsed.matchedIssueId),
      matchedIssueId: parsed.isLikelyDuplicate ? parsed.matchedIssueId : null,
      confidence: parsed.confidence || 0.85,
      reason: parsed.reason || 'Evaluated by Water Department Operations AI.',
    });
  } catch (err: any) {
    console.error('Gemini duplicate detect error:', err);
    return res.json(deterministicMatch(newReport, candidateIssues));
  }
});

// 3. AI Citizen Water Assistant Chatbot
app.post('/api/gemini/chat', async (req, res) => {
  const { message, history, mode = 'general' } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const targetModel = mode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

  const systemInstruction = `You are the specialized "MB Urban Water Assistant" for the Water Service Department of Mira-Bhayandar Municipal Corporation (MBMC).
Coverage Area: Bhayandar East, Bhayandar West, Mira Road (Beverly Park, Kanakia, Shanti Park, Silver Park, Poonam Sagar, Pleasant Park), Kashimira, Ghodbunder, and Uttan Coastal Belt.

CRITICAL FOCUS:
- You ONLY handle urban water-related inquiries and grievances.
- Categories covered: Water Supply scheduling, Water Leakage, Low Water Pressure, No Water Supply, Contaminated/Dirty Water, Pipeline Damage, Water Wastage, Public Water Facilities, and Tanker Services.
- Sourcing: Stem Water Authority and MIDC reservoirs, with local booster pumping stations at Chene and Navghar.
- If a user asks about unrelated civic issues (such as road potholes, garbage/solid waste, streetlights, or traffic):
  Politely respond: "This platform currently handles urban water-related issues. Please submit a water-related issue." and guide them on water services.
- Always provide structured, courteous, and practical answers.
- Encourage water conservation and rapid reporting of leaks.`;

  // Fallback responses if Gemini API key is missing
  if (!ai || !process.env.GEMINI_API_KEY) {
    const msg = message.toLowerCase();
    let reply = '';
    let quickActions = ['Report Water Leakage', 'Check Supply Timetable', 'Track Water Grievance'];

    if (msg.includes('pothole') || msg.includes('road') || msg.includes('garbage') || msg.includes('waste') || msg.includes('streetlight')) {
      reply = 'This platform currently handles urban water-related issues. Please submit a water-related issue.';
      quickActions = ['Report Water Leakage', 'Water Supply Timetable', 'Low Pressure Assistance'];
    } else if (msg.includes('leak') || msg.includes('pipeline') || msg.includes('burst')) {
      reply = 'Water pipeline leakages in Mira-Bhayandar are prioritized for rapid isolation and repair by the Water Service Department to prevent treated water loss. Please file a report with photo evidence to dispatch our field repair squad.';
      quickActions = ['Report Water Leakage', 'Track Active Leakage'];
    } else if (msg.includes('pressure') || msg.includes('low')) {
      reply = 'Low water pressure is typically caused by valve throttling during peak distribution cycles or pipeline air locks. You can file a Low Water Pressure report so a water officer can inspect the local feeder valve.';
      quickActions = ['Report Low Pressure', 'Supply Timetable'];
    } else if (msg.includes('dirty') || msg.includes('contaminat') || msg.includes('yellow')) {
      reply = 'If you notice discolored or smelly water, avoid consumption. The Water Service Department can conduct water sampling and line flushing in your ward.';
      quickActions = ['Report Contaminated Water', 'Water Quality Cell'];
    } else {
      reply = `Hello! I am your MB Urban Water Assistant. I am specialized in resolving all water supply, pipeline leakage, pressure regulation, and water quality issues across Mira-Bhayandar. How can I assist you today?`;
    }

    return res.json({
      reply,
      quickActions,
      modelUsed: targetModel,
      source: 'water-engine-fallback',
      groundingSources: [],
    });
  }

  try {
    const formattedHistory = Array.isArray(history)
      ? history.slice(-8).map((h: { role: string; text: string }) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        }))
      : [];

    const config: any = {
      systemInstruction,
      temperature: 0.6,
    };

    if (mode === 'search') {
      config.tools = [{ googleSearch: {} }];
    } else if (mode === 'maps') {
      config.tools = [{ googleMaps: {} }];
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: 19.2952,
            longitude: 72.8544, // Mira-Bhayandar
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      config,
    });

    const reply = response.text || 'I am ready to help you with water services in Mira-Bhayandar.';

    const quickActions: string[] = ['Report Water Issue', 'Check Supply Timetable', 'Track Water Report'];

    return res.json({
      reply,
      quickActions,
      modelUsed: targetModel,
      groundingSources: [],
      source: 'gemini-water-assistant',
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    return res.json({
      reply: 'I am here to assist with Mira-Bhayandar Water Services. Please file a report or check your water complaint status.',
      quickActions: ['Report Water Issue', 'Track Water Report'],
      modelUsed: targetModel,
      source: 'gemini-fallback',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Mira-Bhayandar Urban Connect - Water Service Department',
    focus: 'Urban Water Service Management',
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Mira-Bhayandar Urban Connect (Water Service Department) running on http://0.0.0.0:${port}`);
  });
}

startServer();
