/**
 * Parameter Extraction Utility (Module 2)
 * Pure, side-effect-free helpers to infer sensible tool parameters from a free-form user query.
 *
 * NOTE: This module is intentionally standalone and not wired into execution yet.
 */

const STATE_NAME_TO_CODE = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC', 'dc': 'DC'
};

const STATE_CODE_SET = new Set(Object.values(STATE_NAME_TO_CODE));

function normalizeWhitespace(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function toLower(text) {
  return (text || '').toLowerCase();
}

function detectStateCode(query) {
  const lower = toLower(query);
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    const nameRegex = new RegExp(`\\b${name.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (nameRegex.test(query)) return code;
    if (lower.includes(`state of ${name}`)) return code;
  }
  // Look for standalone two-letter state code
  const codeMatch = query.match(/\b([A-Z]{2})\b/);
  if (codeMatch && STATE_CODE_SET.has(codeMatch[1])) return codeMatch[1];
  return undefined;
}

function detectZipCode(query) {
  const m = query.match(/\b\d{5}(?:-\d{4})?\b/);
  return m ? m[0] : undefined;
}

function detectDocketNumber(query) {
  // Common federal pattern: 1:21-cv-01234 or 2:18-cr-00001 etc.
  const m = query.match(/\b\d{1,2}:\d{2}-(?:cv|cr|mc|mj|md|bk|br|ap)-\d{3,8}\b/i);
  return m ? m[0] : undefined;
}

function detectYearAfter(query) {
  // Extract year after phrases like "from 2020", "after 2019", "since 2018"
  const m = query.match(/\b(from|after|since)\s+(19\d{2}|20\d{2})\b/i);
  if (!m) return undefined;
  const year = parseInt(m[2], 10);
  if (year >= 1900 && year <= 2100) return `${year}-01-01`;
  return undefined;
}

function detectHasTranscript(query) {
  const lower = toLower(query);
  return /transcript|with transcript|has transcript/.test(lower);
}

function buildCaseQuery(query) {
  // Preserve user’s terms; rely on downstream highlight biasing
  return normalizeWhitespace(query);
}

function extractEPAParams(query) {
  const state = detectStateCode(query);
  const zip = detectZipCode(query);
  const params = {};
  if (state) params.state = state;
  if (zip) params.zip_code = zip;
  // Heuristic: if query suggests violations, set compliance_status to 'violation'
  if (/violation|noncompliance|echo|enforcement/i.test(query)) {
    params.compliance_status = 'violation';
  }
  return params;
}

function extractCaseParams(query) {
  const params = {
    query: buildCaseQuery(query),
    include_snippet: true,
    limit: 10
  };
  const dateAfter = detectYearAfter(query);
  if (dateAfter) params.date_filed_after = dateAfter;
  return params;
}

function extractDocketParams(query) {
  const docket = detectDocketNumber(query);
  const params = { limit: 5 };
  if (docket) {
    params.docket_number = docket;
  } else {
    params.case_name = normalizeWhitespace(query);
  }
  const dateAfter = detectYearAfter(query);
  if (dateAfter) params.date_filed_after = dateAfter;
  return params;
}

function extractJudgeSearchParams(query) {
  // Pass through as the judge name; downstream will fuzzy match
  return {
    name: normalizeWhitespace(query),
    limit: 5
  };
}

function extractAudioParams(query) {
  const params = { query: normalizeWhitespace(query), limit: 5 };
  if (detectHasTranscript(query)) params.has_transcript = true;
  return params;
}

function extractCitationParams(query) {
  // If a standard citation-like pattern exists, use it directly
  const citationLike = query.match(/\b\d+\s+[A-Z][\w.]+\s+\d+\b/);
  return {
    citation: citationLike ? citationLike[0] : normalizeWhitespace(query),
    limit: 5,
    include_snippet: true
  };
}

/**
 * Infer parameters for a supported tool from a free-text query
 * @param {string} toolName
 * @param {string} userQuery
 * @returns {object} extracted parameters (may be empty)
 */
export function extractParametersFromQuery(toolName, userQuery) {
  const tool = (toolName || '').trim();
  const query = (userQuery || '').trim();
  if (!tool || !query) return {};

  try {
    if (tool === 'search_epa_facilities') return extractEPAParams(query);
    if (tool === 'search_cases' || tool === 'search_opinions') return extractCaseParams(query);
    if (tool === 'search_dockets') return extractDocketParams(query);
    if (tool === 'search_judges') return extractJudgeSearchParams(query);
    if (tool === 'search_audio') return extractAudioParams(query);
    if (tool === 'lookup_citation') return extractCitationParams(query);
  } catch (_) {
    // Fail closed: return empty on extractor error
    return {};
  }

  // Default: pass-through query if the schema likely accepts it
  if (/search|lookup/i.test(tool)) {
    return { query: normalizeWhitespace(query) };
  }
  return {};
}

// Named exports for testing of individual helpers (optional)
export const __test__ = {
  detectStateCode,
  detectZipCode,
  detectDocketNumber,
  detectYearAfter,
  detectHasTranscript,
  normalizeWhitespace
};


