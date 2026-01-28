/**
 * EPA Web Search Client (Exa-only)
 * Replaces ECHO API by querying official EPA domains and parsing structured data from page text.
 */

import { validateLimit } from '../utils/validation.js';

export class EPAWebSearchClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    this.exaApiKey = process.env.EXA_API_KEY;

    if (!this.exaApiKey) {
      console.warn('EXA_API_KEY not configured. EPA web search will not be available.');
    }
  }

  /**
   * Search EPA facilities via Exa (domain-restricted to echo.epa.gov)
   * Mirrors shape of EPAComplianceClient.searchFacilities output
   */
  async searchFacilitiesWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const {
      facility_name,
      company_name,
      city,
      state,
      zip_code,
      compliance_status,
      violations_last_3_years,
      limit = 3,
      include_full_text = false
    } = args;

    const validatedLimit = validateLimit(limit, 25);

    // Build domain-targeted query
    let query = 'site:echo.epa.gov ';
    if (facility_name) query += `"${facility_name}" `;
    if (company_name) query += `"${company_name}" `;
    if (city) query += `"${city}" `;
    if (state) query += `"${state}" `;
    if (zip_code) query += `"${zip_code}" `;
    if (compliance_status === 'violation') query += ' ("noncompliance" OR "violations") ';
    if (violations_last_3_years) query += ' ("last 12 quarters" OR "12 quarters") ';

    const results = await this.executeExaSearch(query.trim(), validatedLimit, true);

    // Map to facility summary
    const facilities = results
      .filter(r => (r.url || '').includes('echo.epa.gov'))
      .map(r => this.mapFacilityFromText(r, include_full_text));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          facilities,
          total_facilities: facilities.length,
          query_id: null,
          high_priority_violators: facilities.filter(f => f.compliance?.current_status?.toLowerCase?.().includes('high priority')).length
        }, null, 2)
      }]
    };
  }

  /**
   * Get compliance report via Exa by targeting DFR/facility pages
   * Mirrors shape of EPAComplianceClient.getFacilityComplianceReport output
   */
  async getFacilityComplianceReportWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { facility_id, include_violations = true, include_enforcement = true, include_full_text = false } = args;
    if (!facility_id) throw new Error('facility_id is required');

    // Search for Detailed Facility Report or facility page mentioning this ID
    const query = `site:echo.epa.gov ("p_id=${facility_id}" OR "FRSID ${facility_id}" OR "Registry ID ${facility_id}")`;
    const results = await this.executeExaSearch(query, 5, true);
    const top = results.find(r => (r.url || '').includes('echo.epa.gov')) || results[0];
    if (!top) {
      return { content: [{ type: 'text', text: JSON.stringify({ facility: {}, compliance_summary: {}, three_year_compliance: [], violations: [], enforcement_actions: [] }, null, 2) }] };
    }

    const text = top.text || '';
    const report = {
      facility: this.extractFacilityHeader(text, include_full_text),
      compliance_summary: this.extractComplianceSummary(text),
      three_year_compliance: this.extractThreeYearHistory(text)
    };

    if (include_violations) report.violations = this.extractViolations(text);
    if (include_enforcement) report.enforcement_actions = this.extractEnforcement(text);

    return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
  }

  /**
   * Search violations via Exa and filter client-side
   * Mirrors shape of EPAComplianceClient.searchViolations output
   */
  async searchViolationsWeb(args) {
    if (!args || typeof args !== 'object') args = {};
    const { facility_id, program, date_after, date_before, limit = 15 } = args;
    if (!facility_id) throw new Error('facility_id is required');

    const query = `site:echo.epa.gov ("p_id=${facility_id}" OR "FRSID ${facility_id}" OR "Registry ID ${facility_id}")`;
    const results = await this.executeExaSearch(query, 5, true);
    const top = results.find(r => (r.url || '').includes('echo.epa.gov')) || results[0];
    const violationsAll = this.extractViolations(top?.text || '');

    let violations = violationsAll;
    if (program) {
      const p = String(program).toUpperCase();
      violations = violations.filter(v => (v.Program || '').toUpperCase().includes(p));
    }
    if (date_after) violations = violations.filter(v => !v.Date || v.Date >= date_after);
    if (date_before) violations = violations.filter(v => !v.Date || v.Date <= date_before);

    const max = Math.min(Number(limit) || 200, violations.length);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ facility_id, count: max, results: violations.slice(0, max) }, null, 2)
      }]
    };
  }

  // ===== Helpers =====
  async executeExaSearch(query, limit, includeText) {
    if (!this.exaApiKey) throw new Error('Exa API key not configured. Set EXA_API_KEY environment variable.');
    if (this.rateLimiter && typeof this.rateLimiter.enforce === 'function') {
      await this.rateLimiter.enforce();
    }
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-api-key': this.exaApiKey },
      body: JSON.stringify({ 
        query, 
        numResults: limit, 
        includeDomains: ['echo.epa.gov', 'www.epa.gov'], 
        contents: includeText ? { text: true } : undefined,
        liveCrawl: true,        // Enable real-time crawling for current EPA data
        use_autoprompt: true    // Enable autoprompt for better content extraction
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Exa API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.results || [];
  }

  mapFacilityFromText(result, includeFullText) {
    const text = result.text || '';
    const name = this.extractFirst(/Facility\s*Name\s*:?\s*([^\n]+)/i, text) || result.title || 'Unknown Facility';
    const registry = this.extractFirst(/(FRSID|Registry\s*ID)\s*:?\s*(\d{5,})/i, text, 2);
    const address = this.extractFirst(/Address\s*:?\s*([^\n]+)/i, text);
    const city = this.extractFirst(/City\s*:?\s*([^\n\r]+)/i, text);
    const state = this.extractFirst(/State\s*:?\s*([A-Z]{2})/i, text);
    const status = this.extractFirst(/Compliance\s*Status\s*:?\s*([^\n]+)/i, text);
    const totalPen = this.extractFirst(/Total\s*Penalties\s*:?\s*\$?([\d,]+)/i, text);
    const qnc = this.extractFirst(/Quarters\s*in\s*Noncompliance\s*:?\s*(\d+)/i, text);

    const mapped = {
      name,
      epa_registry_id: registry || null,
      location: { address: address || null, city: city || null, state: state || null },
      compliance_status: status || null,
      total_penalties: totalPen ? Number(totalPen.replace(/,/g, '')) : null,
      clean_air: /Clean\s*Air|CAA/i.test(text),
      clean_water: /Clean\s*Water|CWA/i.test(text)
    };
    if (includeFullText && text) mapped.full_text = text;

    // Extended shape (like EPAComplianceClient small result set)
    mapped.company = this.extractFirst(/Company\s*:?\s*([^\n]+)/i, text) || null;
    mapped.compliance = {
      current_status: status || null,
      quarters_in_noncompliance: qnc ? Number(qnc) : null,
      formal_enforcement_actions: this.extractFirst(/Formal\s*Enforcement\s*Actions\s*:?\s*(\d+)/i, text) || null,
      total_penalties: mapped.total_penalties
    };
    mapped.programs = {
      clean_air: /CAA/i.test(text),
      clean_water: /CWA/i.test(text),
      rcra: /RCRA/i.test(text)
    };
    return mapped;
  }

  extractFacilityHeader(text, includeFullText) {
    const name = this.extractFirst(/Facility\s*Name\s*:?\s*([^\n]+)/i, text);
    const registry = this.extractFirst(/(FRSID|Registry\s*ID)\s*:?\s*(\d{5,})/i, text, 2);
    const location = this.extractFirst(/Location\s*:?\s*([^\n]+)/i, text);
    const address = this.extractFirst(/Address\s*:?\s*([^\n]+)/i, text) || location;
    const facility = { name: name || null, registry_id: registry || null, address: address || null };
    if (includeFullText && text) facility.full_text = text;
    return facility;
  }

  extractComplianceSummary(text) {
    return {
      Status: this.extractFirst(/Compliance\s*Status\s*:?\s*([^\n]+)/i, text) || null,
      QtrsInNC: this.extractFirst(/Quarters\s*in\s*Noncompliance\s*:?\s*(\d+)/i, text) || null,
      FormalActions: this.extractFirst(/Formal\s*Enforcement\s*Actions\s*:?\s*(\d+)/i, text) || null,
      TotalPenalties: this.extractFirst(/Total\s*Penalties\s*:?\s*\$?([\d,]+)/i, text) || null
    };
  }

  extractThreeYearHistory(text) {
    // Simple heuristic: capture lines mentioning quarters/noncompliance
    const lines = (text.match(/\n.*?(Q\d\s*\d{4}|quarter|noncompliance).*?\n/gi) || []).map(s => s.trim());
    return lines.slice(0, 50);
  }

  extractViolations(text) {
    // Heuristic extraction of violation entries
    const entries = [];
    const regex = /(Program|ViolProgram)\s*:?\s*([^\n]+).*?(Date|ViolDate)\s*:?\s*([A-Za-z0-9\-\/ ,]+).*?Description\s*:?\s*([^\n]+)/gis;
    let m;
    while ((m = regex.exec(text)) !== null) {
      entries.push({ Program: (m[2] || '').trim(), Date: (m[4] || '').trim(), Description: (m[5] || '').trim() });
      if (entries.length >= 200) break;
    }
    return entries;
  }

  extractEnforcement(text) {
    const entries = [];
    const regex = /(Enforcement\s*Action|Case)\s*:?\s*([^\n]+).*?(Date)\s*:?\s*([A-Za-z0-9\-\/ ,]+)/gis;
    let m;
    while ((m = regex.exec(text)) !== null) {
      entries.push({ Action: (m[2] || '').trim(), Date: (m[4] || '').trim() });
      if (entries.length >= 200) break;
    }
    return entries;
  }

  extractFirst(re, text, groupIndex = 1) {
    const m = text.match(re);
    if (!m) return null;
    return (m[groupIndex] || m[1] || '').trim();
  }
}


