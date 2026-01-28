/**
 * EPA ECHO (Enforcement and Compliance History Online) API Client
 * Provides facility search and detailed compliance reporting
 * Docs: ECHO REST Services (get_facilities, get_dfr, get_violations, get_enforcement)
 */

import { makeApiRequest } from '../utils/apiHelpers.js';

/**
 * Custom error class for parameter validation failures
 * These should NOT trigger circuit breaker failures since they're client-side errors
 */
class ParameterValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParameterValidationError';
    this.isValidationError = true;
  }
}

export class EPAComplianceClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Search EPA-regulated facilities
   */
  async searchFacilities(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      facility_name,
      company_name,
      city,
      state,
      zip_code,
      compliance_status,
      violations_last_3_years,
      // Optional QueryID pagination support
      query_id,
      page_number,
      limit = 50
    } = args;

    // ═══════════════════════════════════════════════════════════════
    // VALIDATION: Ensure company_name has state, or other identifier provided
    // ═══════════════════════════════════════════════════════════════
    const hasLocationOrIdentifier = facility_name || city || zip_code || (company_name && state);
    if (!hasLocationOrIdentifier && !query_id) {
      // Provide specific guidance based on what was provided
      if (company_name && !state) {
        throw new ParameterValidationError(
          `company_name "${company_name}" requires a state parameter for targeted EPA searches. ` +
          `Example: search_epa_facilities({ company_name: "${company_name}", state: "NJ" }). ` +
          'Tip: For company searches, always include the state where facilities are located.'
        );
      }
      throw new ParameterValidationError(
        'At least one location identifier required: facility_name, city, zip_code, or (company_name + state). ' +
        'Example: search_epa_facilities({ state: "PA", city: "Pittsburgh" }) or ' +
        'search_epa_facilities({ facility_name: "US Steel" }). ' +
        'Tip: state alone is too broad - combine with city, zip_code, or facility/company name.'
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // SMART HYBRID APPROACH: Work around EPA API company_name limitation
    // ═══════════════════════════════════════════════════════════════
    if (this._shouldUseSmartHybrid(args) && !query_id) {
      console.log('[EPA Smart Hybrid] Detected company_name + location query');
      console.log('[EPA Smart Hybrid] Activating workaround for EPA API limitation...');
      
      // STRATEGY 1: Try facility_name parameter (works better than p_owname)
      try {
        console.log('[EPA Smart Hybrid] Strategy 1: Attempting facility_name substitution...');
        
        const facilityNameResult = await this.searchFacilities({
          facility_name: company_name,  // Substitute company_name → facility_name
          state,                        // Keep state for geographic filtering
          // Note: We omit city to avoid being too restrictive
          zip_code,
          compliance_status,
          violations_last_3_years,
          limit
        });
        
        const resultData = JSON.parse(facilityNameResult.content[0].text);
        
        if (resultData.total_facilities > 0) {
          console.log(`[EPA Smart Hybrid] ✅ Strategy 1 SUCCESS: Found ${resultData.total_facilities} facilities`);
          
          // Add metadata about the workaround used
          resultData.filtering_method = 'facility_name_substitution';
          resultData.filtering_note = 
            `Results found using facility_name parameter due to EPA API limitation. ` +
            `The company_name parameter (p_owname) does not filter correctly when combined with location parameters.`;
          resultData.smart_hybrid_enabled = true;
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(resultData, null, 2)
            }]
          };
        }
        
        console.log('[EPA Smart Hybrid] Strategy 1: No results found, will try Strategy 2...');
      } catch (error) {
        // If Strategy 1 fails (validation error, etc.), fall through to Strategy 2
        console.log(`[EPA Smart Hybrid] Strategy 1 failed: ${error.message}`);
        console.log('[EPA Smart Hybrid] Falling back to Strategy 2...');
      }
      
      // STRATEGY 2: Client-side filtering fallback
      try {
        console.log('[EPA Smart Hybrid] Strategy 2: Location search + client-side filtering...');
        
        // Search by location only (without company filter)
        const locationResult = await this.searchFacilities({
          city,
          state,
          zip_code,
          compliance_status,
          violations_last_3_years,
          limit: 100  // Get more results to filter from
        });
        
        const locationData = JSON.parse(locationResult.content[0].text);
        const originalCount = locationData.total_facilities;
        
        console.log(`[EPA Smart Hybrid] Retrieved ${locationData.facilities?.length || 0} facilities from location`);
        
        // Filter results client-side by company name
        const rawFacilities = locationData.facilities || [];
        const filteredFacilities = this._filterByCompanyName(rawFacilities, company_name);
        
        console.log(`[EPA Smart Hybrid] ✅ Strategy 2 SUCCESS: Filtered ${rawFacilities.length} → ${filteredFacilities.length} facilities`);
        
        // Return filtered results with comprehensive metadata
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              facilities: filteredFacilities.slice(0, Number(limit) || 50),
              total_facilities: filteredFacilities.length,
              original_total: originalCount,
              query_id: locationData.query_id,
              filtering_method: 'client_side_filtered',
              filtering_note: 
                `Results filtered client-side by company name "${company_name}" ` +
                `due to EPA API limitation. Original location results: ${originalCount}, ` +
                `Filtered: ${filteredFacilities.length}. The EPA API's company_name parameter (p_owname) ` +
                `does not filter correctly when combined with location parameters.`,
              smart_hybrid_enabled: true,
              strategy_1_attempted: true,
              strategy_2_used: true
            }, null, 2)
          }]
        };
        
      } catch (error) {
        // If both strategies fail, log and let the normal flow handle it
        console.log(`[EPA Smart Hybrid] ⚠️  Strategy 2 also failed: ${error.message}`);
        console.log('[EPA Smart Hybrid] Falling back to normal search flow...');
        // Don't throw - let the normal search flow handle the query
      }
    }

    // If query_id is provided, use get_qid endpoint for pagination
    if (query_id) {
      // Define QCOLUMNS_60 for pagination requests
      const QCOLUMNS_60_PAGINATION = '1,2,3,4,5,6,7,8,11,15,16,17,18,19,21,22,24,26,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,54,55,60,61,62,63,64,65,66,67,68,73,75,80,95,110,111,119,120,128,129,131,134,135,136,137';

      const params = {
        output: 'JSON',
        qid: query_id,
        pageno: page_number || 1,
        qcolumns: QCOLUMNS_60_PAGINATION
      };

      const response = await makeApiRequest('/echo_rest_services.get_qid', params, {
        apiType: 'epa_echo',
        rateLimiter: this.rateLimiter
      });

      const facilities = response.Results?.Facilities || [];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            facilities: facilities.slice(0, 25).map(f => this._formatFacilityComprehensive(f)),
            total_facilities: response.Results?.QueryRows || 0,
            query_id: query_id,
            page_number: response.Results?.PageNo || page_number || 1,
            summary: this._generateComplianceSummary(facilities.slice(0, 25))
          }, null, 2)
        }]
      };
    }

    // Initial query - returns QueryID for large result sets
    // 60-column configuration for comprehensive compliance data (~9,200 tokens for 25 facilities)
    // See EPA ECHO API metadata: https://echodata.epa.gov/echo/echo_rest_services.metadata?output=JSON
    const QCOLUMNS_60 = [
      // Identification (1-8, 11)
      '1',   // FAC_NAME
      '2',   // FAC_STREET
      '3',   // FAC_CITY
      '4',   // FAC_STATE
      '5',   // FAC_ZIP
      '6',   // REGISTRY_ID
      '7',   // FAC_COUNTY
      '8',   // FAC_EPA_REGION
      '11',  // FAC_INDIAN_CNTRY_FLG (tribal jurisdiction)
      // Industry (15-16)
      '15',  // FAC_SIC_CODES
      '16',  // FAC_NAICS_CODES
      // Coordinates (17-18)
      '17',  // FAC_LAT
      '18',  // FAC_LONG
      // Program IDs (19, 21, 22, 24, 26)
      '19',  // AIR_IDS
      '21',  // NPDES_IDS
      '22',  // RCRA_IDS
      '24',  // SEMS_IDS (Superfund)
      '26',  // TRI_IDS
      // Compliance Status (34-40)
      '34',  // FAC_SNC_FLG (Significant Non-Compliance)
      '35',  // FAC_QTRS_WITH_NC
      '36',  // FAC_COMPLIANCE_STATUS
      '37',  // CAA_COMPLIANCE_STATUS
      '38',  // CWA_COMPLIANCE_STATUS
      '39',  // RCRA_COMPLIANCE_STATUS
      '40',  // SDWA_COMPLIANCE_STATUS
      // Inspections (41-46)
      '41',  // FAC_INSPECTION_COUNT
      '42',  // FAC_DAYS_LAST_INSPECTION
      '43',  // FAC_DATE_LAST_INSPECTION
      '44',  // CAA_EVALUATION_COUNT
      '45',  // CWA_INSPECTION_COUNT
      '46',  // RCRA_INSPECTION_COUNT
      // Demographics/EJ (47-48)
      '47',  // FAC_POP_DEN
      '48',  // FAC_PERCENT_MINORITY
      // Enforcement (49, 54-55)
      '49',  // FAC_INFORMAL_COUNT
      '54',  // FAC_FORMAL_ACTION_COUNT
      '55',  // FAC_DATE_LAST_FORMAL_ACTION
      // Penalties (60-66)
      '60',  // FAC_TOTAL_PENALTIES
      '61',  // FAC_PENALTY_COUNT
      '62',  // FAC_DATE_LAST_PENALTY
      '63',  // FAC_LAST_PENALTY_AMT
      '64',  // CAA_PENALTIES
      '65',  // CWA_PENALTIES
      '66',  // RCRA_PENALTIES
      // Emissions (67-68, 131)
      '67',  // GHG_CO2_RELEASES
      '68',  // TRI_RELEASES_TRANSFERS
      '131', // TRI_ON_SITE_RELEASES
      // Flags & History (73, 75, 95)
      '73',  // FAC_MAJOR_FLAG
      '75',  // FAC_3YR_COMPLIANCE_HISTORY
      '95',  // FAC_ACTIVE_FLAG
      // Violation Flags (110, 111, 119, 120, 128, 129)
      '110', // CAA_QTRS_WITH_NC
      '111', // CAA_HPV_FLAG (High Priority Violator)
      '119', // CWA_QTRS_WITH_NC
      '120', // CWA_SNC_FLAG
      '128', // RCRA_QTRS_WITH_NC
      '129', // RCRA_SNC_FLAG
      // Federal Cases (80, 134-136)
      '80',  // FEC_CASE_IDS
      '134', // FEC_NUMBER_OF_CASES
      '135', // FEC_LAST_CASE_DATE
      '136', // FEC_TOTAL_PENALTIES
      // Links (137)
      '137'  // DFR_URL
    ].join(',');

    const params = {
      output: 'JSON',
      qcolumns: QCOLUMNS_60,
      p_rows: Math.min(Number(limit) || 25, 25)
    };

    if (facility_name) params.p_fn = facility_name;
    if (company_name) params.p_owname = company_name;
    if (city) params.p_ct = city;
    if (state) params.p_st = state;
    if (zip_code) params.p_zip = zip_code;

    if (compliance_status === 'violation') {
      params.p_qnc = 'Y'; // quarters in non-compliance
    }
    if (violations_last_3_years) {
      params.p_qiv = '12'; // last 12 quarters
    }
    
    // Prevent overly broad queries that EPA will reject
    const hasSpecificLocation = city || zip_code || facility_name;
    const isLikelyBroad = state && !hasSpecificLocation;
    
    if (isLikelyBroad && company_name) {
      // For company searches without specific location, require more specific company name
      if (company_name.length < 5 || company_name.toLowerCase() === 'chemical') {
        throw new ParameterValidationError('EPA search too broad. Please provide: 1) More specific company name, 2) City name, or 3) ZIP code');
      }
    } else if (isLikelyBroad) {
      // State-only searches are too broad
      throw new ParameterValidationError('EPA search requires more specific criteria. Please add: city, zip_code, or facility_name');
    }

    const response = await makeApiRequest('/echo_rest_services.get_facilities', params, {
      apiType: 'epa_echo',
      rateLimiter: this.rateLimiter
    });

    // Check if we got an error about query being too broad
    if (response.Results?.Error?.ErrorMessage) {
      // If query is too broad, we need more specific parameters
      throw new ParameterValidationError(`EPA Query Error: ${response.Results.Error.ErrorMessage}. Please provide more specific search criteria.`);
    }

    // Check if we got a QueryID (for large result sets)
    const queryId = response.Results?.QueryID;
    
    // If we have a QueryID but no facilities, fetch them with get_qid
    if (queryId && (!response.Results?.Facilities || response.Results.Facilities.length === 0)) {
      const qidParams = {
        output: 'JSON',
        qid: queryId,
        pageno: 1,
        qcolumns: QCOLUMNS_60,
        p_rows: 25
      };

      const qidResponse = await makeApiRequest('/echo_rest_services.get_qid', qidParams, {
        apiType: 'epa_echo',
        rateLimiter: this.rateLimiter
      });

      const facilities = qidResponse.Results?.Facilities || [];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            facilities: facilities.slice(0, 25).map(f => this._formatFacilityComprehensive(f)),
            total_facilities: qidResponse.Results?.QueryRows || response.Results?.QueryRows || 0,
            query_id: queryId,
            page_number: 1,
            summary: this._generateComplianceSummary(facilities.slice(0, 25))
          }, null, 2)
        }]
      };
    }

    // For small result sets, facilities might be returned directly
    const facilities = response.Results?.Facilities || [];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          facilities: facilities.slice(0, 25).map(f => this._formatFacilityComprehensive(f)),
          total_facilities: response.Results?.QueryRows || 0,
          query_id: queryId || null,
          summary: this._generateComplianceSummary(facilities.slice(0, 25))
        }, null, 2)
      }]
    };
  }

  /**
   * Get detailed compliance report for a specific facility (DFR)
   */
  async getFacilityComplianceReport(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const { facility_id, include_violations = true, include_enforcement = true } = args;
    if (!facility_id) {
      throw new Error('facility_id is required');
    }

    const baseParams = { output: 'JSON', p_id: facility_id };

    const report = {};

    // DFR (Detailed Facility Report)
    const dfr = await makeApiRequest(
      '/dfr_rest_services.get_dfr',
      baseParams,
      { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
    );
    report.facility = dfr.Results?.Facility || dfr.Facility || {};
    report.compliance_summary = dfr.Results?.ComplianceSummary || dfr.ComplianceSummary || {};
    report.three_year_compliance = dfr.Results?.ThreeYearComplianceHistory || dfr.ThreeYearComplianceHistory || [];

    if (include_violations) {
      try {
        const violations = await makeApiRequest(
          '/echo_rest_services.get_violations',
          baseParams,
          { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
        );
        report.violations = violations.Results?.Violations || violations.Violations || [];
      } catch (error) {
        console.error('Error fetching violations:', error);
        report.violations = [];
      }
    }

    if (include_enforcement) {
      try {
        const enforcement = await makeApiRequest(
          '/echo_rest_services.get_enforcement',
          baseParams,
          { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
        );
        report.enforcement_actions = enforcement.Results?.EnforcementActions || enforcement.EnforcementActions || [];
      } catch (error) {
        console.error('Error fetching enforcement actions:', error);
        report.enforcement_actions = [];
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(report, null, 2) }]
    };
  }

  /**
   * Search violations for a facility and optionally filter by program
   * Note: This uses the DFR endpoint as the violations endpoint requires specific formats
   */
  async searchViolations(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const { facility_id, program, date_after, date_before, limit = 200 } = args;
    if (!facility_id) {
      throw new Error('facility_id is required');
    }

    try {
      // Use the DFR (Detailed Facility Report) to get violations
      // This is more reliable than the direct violations endpoint
      const baseParams = { output: 'JSON', p_id: facility_id };
      
      // Try the DFR endpoint first
      const dfrResponse = await makeApiRequest(
        '/dfr_rest_services.get_dfr',
        baseParams,
        { apiType: 'epa_echo', rateLimiter: this.rateLimiter }
      );
      
      // Extract violations from the DFR response
      let violations = [];
      
      // Check various possible locations for violations in the response
      if (dfrResponse.Results?.ViolationsHistory) {
        violations = dfrResponse.Results.ViolationsHistory;
      } else if (dfrResponse.ViolationsHistory) {
        violations = dfrResponse.ViolationsHistory;
      } else if (dfrResponse.Results?.Violations) {
        violations = dfrResponse.Results.Violations;
      } else if (dfrResponse.Violations) {
        violations = dfrResponse.Violations;
      }
      
      // If no violations found in DFR, try to get compliance summary
      if (violations.length === 0 && dfrResponse.Results?.ComplianceSummary) {
        // Extract violation indicators from compliance summary
        const summary = dfrResponse.Results.ComplianceSummary;
        const violationInfo = {
          quarters_in_noncompliance: summary.QtrsInNC || 0,
          current_status: summary.Status || 'Unknown',
          has_violations: (summary.QtrsInNC && parseInt(summary.QtrsInNC) > 0) || false
        };
        
        // Return summary info if no detailed violations available
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              facility_id,
              message: 'Detailed violations not available. Showing compliance summary.',
              compliance_summary: violationInfo,
              count: 0,
              results: []
            }, null, 2)
          }]
        };
      }

      // Convert violations to array if needed
      if (!Array.isArray(violations)) {
        violations = Object.values(violations);
      }

      // Client-side filters
      if (program) {
        const p = String(program).toUpperCase();
        violations = violations.filter(v => 
          (v.Program || v.ViolProgram || '').toUpperCase().includes(p)
        );
      }
      if (date_after) {
        violations = violations.filter(v => {
          const vDate = v.ViolationDate || v.ViolDate || v.Date;
          return !vDate || vDate >= date_after;
        });
      }
      if (date_before) {
        violations = violations.filter(v => {
          const vDate = v.ViolationDate || v.ViolDate || v.Date;
          return !vDate || vDate <= date_before;
        });
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            facility_id,
            count: Math.min(violations.length, limit),
            results: violations.slice(0, Math.min(Number(limit) || 200, violations.length))
          }, null, 2)
        }]
      };
      
    } catch (error) {
      // If all else fails, return a helpful error message
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            facility_id,
            error: `Unable to retrieve violations: ${error.message}`,
            suggestion: 'Try using get_epa_facility_compliance_report with include_violations=true instead',
            count: 0,
            results: []
          }, null, 2)
        }]
      };
    }
  }

  /**
   * SMART HYBRID HELPER METHODS
   * These methods support automatic workarounds for EPA API limitations
   */

  /**
   * Filter facilities by company name (client-side)
   * Used when EPA API p_owname parameter doesn't work
   * 
   * @param {Array} facilities - Array of facility objects
   * @param {string} companyName - Company name to search for
   * @returns {Array} Filtered facilities matching company name
   */
  _filterByCompanyName(facilities, companyName) {
    if (!facilities || !Array.isArray(facilities) || !companyName) {
      return facilities || [];
    }

    const searchTerm = companyName.toLowerCase().trim();
    
    return facilities.filter(facility => {
      // Check multiple fields for company name match
      const name = (facility.FacName || facility.name || '').toLowerCase();
      const owner = (facility.FacParentCo || facility.company || facility.owner || '').toLowerCase();
      const registeredName = (facility.RegistryID || '').toLowerCase();
      
      // Match if company name appears in any relevant field
      return name.includes(searchTerm) || 
             owner.includes(searchTerm) ||
             registeredName.includes(searchTerm);
    });
  }

  /**
   * Format facility data into standardized structure
   * @param {Array} facilities - Raw facility data from EPA API
   * @returns {Array} Formatted facility objects
   */
  _formatFacilities(facilities) {
    if (!facilities || !Array.isArray(facilities)) {
      return [];
    }

    return facilities.map(f => ({
      name: f.FacName,
      epa_registry_id: f.RegistryID || f.FRSID,
      location: {
        address: f.FacStreet,
        city: f.FacCity,
        state: f.FacState
      },
      compliance_status: f.FacComplianceStatus,
      total_penalties: f.FacTotalPenalties,
      clean_air: f.CAAFlag === 'Y',
      clean_water: f.CWAFlag === 'Y',
      company: f.FacParentCo  // Add company field for filtering
    }));
  }

  /**
   * Check if Smart Hybrid approach should be activated
   * @param {Object} args - Search parameters
   * @returns {boolean} True if company_name + location query (EPA API limitation scenario)
   */
  _shouldUseSmartHybrid(args) {
    const { company_name, city, state } = args;
    return !!(company_name && (city || state));
  }

  /**
   * Format facility data into comprehensive structure (60 columns)
   * @param {Object} f - Raw facility data from EPA API
   * @returns {Object} Formatted facility object with all compliance data
   */
  _formatFacilityComprehensive(f) {
    return {
      // Identification
      name: f.FacName,
      registry_id: f.RegistryID,
      location: {
        address: f.FacStreet,
        city: f.FacCity,
        state: f.FacState,
        zip: f.FacZip,
        county: f.FacCounty,
        epa_region: f.FacEPARegion,
        latitude: f.FacLat,
        longitude: f.FacLong,
        indian_country: f.FacIndianCntryFlg === 'Y'
      },
      // Industry
      industry: {
        sic_codes: f.FacSICCodes,
        naics_codes: f.FacNAICSCodes
      },
      // Program IDs
      program_ids: {
        air: f.AIRIDs,
        npdes: f.NPDESIDs,
        rcra: f.RCRAIDs,
        superfund: f.SemsIDs,
        tri: f.TRIIDs
      },
      // Compliance Status
      compliance: {
        overall_status: f.FacComplianceStatus,
        significant_noncompliance: f.FacSNCFlg === 'Y',
        quarters_in_noncompliance: f.FacQtrsWithNC,
        three_year_history: f.Fac3yrComplianceHistory,
        by_program: {
          air: {
            status: f.CAAComplianceStatus,
            quarters_nc: f.CAAQtrsWithNC,
            high_priority_violator: f.CAAHpvFlag === 'Y'
          },
          water: {
            status: f.CWAComplianceStatus,
            quarters_nc: f.CWAQtrsWithNC,
            significant_noncompliance: f.CWASNCFlag === 'Y'
          },
          hazardous_waste: {
            status: f.RCRAComplianceStatus,
            quarters_nc: f.RCRAQtrsWithNC,
            significant_noncompliance: f.RCRASNCFlag === 'Y'
          },
          drinking_water: {
            status: f.SDWAComplianceStatus
          }
        }
      },
      // Inspections
      inspections: {
        total_count: f.FacInspectionCount,
        days_since_last: f.FacDaysLastInspection,
        last_inspection_date: f.FacDateLastInspection,
        by_program: {
          air_evaluations: f.CAAEvaluationCount,
          water_inspections: f.CWAInspectionCount,
          rcra_inspections: f.RCRAInspectionCount
        }
      },
      // Enforcement
      enforcement: {
        informal_actions: f.FacInformalCount,
        formal_actions: f.FacFormalActionCount,
        last_formal_action_date: f.FacDateLastFormalAction,
        federal_cases: {
          case_ids: f.FecCaseIDs,
          count: f.FecNumberOfCases,
          last_case_date: f.FecLastCaseDate,
          total_penalties: f.FecTotalPenalties
        }
      },
      // Penalties
      penalties: {
        total: f.FacTotalPenalties,
        count: f.FacPenaltyCount,
        last_penalty_date: f.FacDateLastPenalty,
        last_penalty_amount: f.FacLastPenaltyAmt,
        by_program: {
          air: f.CAAPenalties,
          water: f.CWAPenalties,
          hazardous_waste: f.RCRAPenalties
        }
      },
      // Emissions
      emissions: {
        ghg_co2_releases: f.GHGCO2Releases,
        tri_releases_transfers: f.TRIReleasesTransfers,
        tri_onsite_releases: f.TRIOnSiteReleases
      },
      // Demographics (Environmental Justice)
      demographics: {
        population_density: f.FacPopDen,
        percent_minority: f.FacPercentMinority
      },
      // Flags
      flags: {
        major_facility: f.FacMajorFlag === 'Y',
        active: f.FacActiveFlag === 'Y'
      },
      // Links
      dfr_url: f.DfrUrl
    };
  }

  /**
   * Get raw results for Gemini filtering pipeline
   * Implements the getRawResults interface required by ClaudeOrchestrator
   * @param {string} query - Natural language search query
   * @param {number} limit - Maximum number of facilities to return
   * @param {Object} options - Additional options
   * @returns {Array<{title, url, text, rawContent, _source, _domain}>}
   */
  async getRawResults(query, limit = 5, options = {}) {
    // 1. Parse natural language query into ECHO API parameters
    const params = this._parseSearchQuery(query);

    // 2. Call native ECHO API
    const result = await this.searchFacilities(params);
    const parsed = JSON.parse(result.content[0].text);
    const facilities = parsed.facilities || [];

    // 3. Convert structured data to narrative text for Gemini
    return facilities.slice(0, limit).map(f => {
      // Clean up DFR URL (remove extra spaces)
      let dfrUrl = f.dfr_url || `https://echo.epa.gov/detailed-facility-report?fid=${f.registry_id}`;
      dfrUrl = dfrUrl.replace(/\s*=\s*/g, '=');

      const narrativeText = this._structuredToNarrative(f);
      return {
        title: `EPA Facility: ${f.name}`,
        url: dfrUrl,
        text: narrativeText,
        rawContent: narrativeText,
        _source: 'epa_echo_native',
        _domain: 'environmental'
      };
    });
  }

  /**
   * Parse natural language query into ECHO API parameters
   * @param {string} query - Natural language query
   * @returns {Object} Parameters for searchFacilities
   */
  _parseSearchQuery(query) {
    const params = {};

    // Extract state (2-letter code) first - more reliable
    // Look for patterns like "in PA", "PA", ", PA", "Pennsylvania" etc.
    const statePatterns = [
      /\b(?:in\s+)?([A-Z]{2})\b(?!\w)/,  // Two capital letters not followed by more letters
      /,\s*([A-Z]{2})\b/,                 // After comma like "Pittsburgh, PA"
    ];
    for (const pattern of statePatterns) {
      const match = query.match(pattern);
      if (match && match[1] !== 'US') {  // Exclude "US" from state matching
        params.state = match[1].toUpperCase();
        break;
      }
    }

    // Extract facility/company name patterns - must stop before location words
    const namePatterns = [
      /(?:for|about|at)\s+["']?([A-Za-z][A-Za-z\s]+?)["']?\s+(?:in|received|violations|compliance|facilities)/i,
      /(?:facility|company)\s+["']?([^"',]+?)["']?\s+(?:in|received|$)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:in|violations|compliance|penalties|facilities)/i,
      /facilities?\s+(?:named?|called?)\s+["']?([^"',]+)["']?/i
    ];
    for (const pattern of namePatterns) {
      const match = query.match(pattern);
      if (match) {
        // Clean up the facility name - remove trailing prepositions
        let name = match[1].trim();
        name = name.replace(/\s+(in|at|with|for|has|received)$/i, '');
        if (name.length >= 2) {
          params.facility_name = name;
          break;
        }
      }
    }

    // Extract city (before state code or "facilities")
    const cityPatterns = [
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+[A-Z]{2}/i,
      /(?:near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    ];
    for (const pattern of cityPatterns) {
      const match = query.match(pattern);
      if (match) {
        params.city = match[1].trim();
        break;
      }
    }

    // Filter flags based on query intent
    if (/violation|noncompliance|non-compliance|penalty|enforcement|violator/i.test(query)) {
      params.violations_last_3_years = true;
    }

    // If no specific parameters found, use the query as facility name
    if (!params.facility_name && !params.city && !params.state) {
      // Extract first significant words as facility name
      const words = query.replace(/\b(what|show|find|get|list|are|the|for|in|at|with|any)\b/gi, '').trim();
      if (words.length > 2) {
        params.facility_name = words.split(/\s+/).slice(0, 3).join(' ');
      }
    }

    return params;
  }

  /**
   * Convert structured facility data to narrative text for Gemini processing
   * @param {Object} facility - Formatted facility object from _formatFacilityComprehensive
   * @returns {string} Narrative text representation
   */
  _structuredToNarrative(facility) {
    const sections = [];

    // Identification
    sections.push(`FACILITY: ${facility.name || 'Unknown'}`);
    sections.push(`Registry ID: ${facility.registry_id || 'N/A'}`);

    if (facility.location) {
      const loc = facility.location;
      sections.push(`Location: ${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.zip || ''}`);
      sections.push(`County: ${loc.county || 'N/A'} | EPA Region: ${loc.epa_region || 'N/A'}`);
      if (loc.indian_country) sections.push(`Indian Country: Yes`);
      if (loc.latitude && loc.longitude) {
        sections.push(`Coordinates: ${loc.latitude}, ${loc.longitude}`);
      }
    }

    // Industry
    if (facility.industry) {
      if (facility.industry.naics_codes) sections.push(`NAICS: ${facility.industry.naics_codes}`);
      if (facility.industry.sic_codes) sections.push(`SIC: ${facility.industry.sic_codes}`);
    }

    // Compliance Status
    if (facility.compliance) {
      sections.push(`\nCOMPLIANCE STATUS:`);
      sections.push(`Overall: ${facility.compliance.overall_status || 'Unknown'}`);
      sections.push(`Significant Non-Compliance: ${facility.compliance.significant_noncompliance ? 'YES' : 'No'}`);
      sections.push(`Quarters in NC (12): ${facility.compliance.quarters_in_noncompliance || 0}`);
      sections.push(`3-Year History: ${facility.compliance.three_year_history || 'N/A'}`);

      // Program-specific compliance
      const programs = facility.compliance.by_program;
      if (programs) {
        if (programs.air?.status) sections.push(`Air (CAA): ${programs.air.status}`);
        if (programs.air?.high_priority_violator) sections.push(`  ⚠️ HIGH PRIORITY VIOLATOR (Air)`);
        if (programs.water?.status) sections.push(`Water (CWA): ${programs.water.status}`);
        if (programs.water?.significant_noncompliance) sections.push(`  ⚠️ Significant Non-Compliance (Water)`);
        if (programs.hazardous_waste?.status) sections.push(`Hazardous Waste (RCRA): ${programs.hazardous_waste.status}`);
        if (programs.hazardous_waste?.significant_noncompliance) sections.push(`  ⚠️ Significant Non-Compliance (RCRA)`);
        if (programs.drinking_water?.status) sections.push(`Drinking Water (SDWA): ${programs.drinking_water.status}`);
      }
    }

    // Inspections
    if (facility.inspections) {
      sections.push(`\nINSPECTIONS:`);
      sections.push(`Total: ${facility.inspections.total_count || 0}`);
      sections.push(`Last Inspection: ${facility.inspections.last_inspection_date || 'Unknown'}`);
      sections.push(`Days Since: ${facility.inspections.days_since_last || 'Unknown'}`);
      if (facility.inspections.by_program) {
        const bp = facility.inspections.by_program;
        if (bp.air_evaluations) sections.push(`Air Evaluations: ${bp.air_evaluations}`);
        if (bp.water_inspections) sections.push(`Water Inspections: ${bp.water_inspections}`);
        if (bp.rcra_inspections) sections.push(`RCRA Inspections: ${bp.rcra_inspections}`);
      }
    }

    // Enforcement
    if (facility.enforcement) {
      sections.push(`\nENFORCEMENT:`);
      sections.push(`Formal Actions: ${facility.enforcement.formal_actions || 0}`);
      sections.push(`Informal Actions: ${facility.enforcement.informal_actions || 0}`);
      sections.push(`Last Formal Action: ${facility.enforcement.last_formal_action_date || 'None'}`);
      if (facility.enforcement.federal_cases) {
        const fc = facility.enforcement.federal_cases;
        if (fc.count > 0) {
          sections.push(`Federal Cases: ${fc.count}`);
          sections.push(`Federal Penalties: $${fc.total_penalties || 0}`);
          if (fc.last_case_date) sections.push(`Last Federal Case: ${fc.last_case_date}`);
        }
      }
    }

    // Penalties
    if (facility.penalties) {
      sections.push(`\nPENALTIES:`);
      sections.push(`Total: $${facility.penalties.total || 0}`);
      sections.push(`Count: ${facility.penalties.count || 0}`);
      sections.push(`Last Penalty: ${facility.penalties.last_penalty_date || 'None'} ($${facility.penalties.last_penalty_amount || 0})`);
      if (facility.penalties.by_program) {
        const bp = facility.penalties.by_program;
        if (bp.air) sections.push(`Air Penalties: $${bp.air}`);
        if (bp.water) sections.push(`Water Penalties: $${bp.water}`);
        if (bp.hazardous_waste) sections.push(`RCRA Penalties: $${bp.hazardous_waste}`);
      }
    }

    // Emissions
    if (facility.emissions) {
      const hasEmissions = facility.emissions.ghg_co2_releases ||
                          facility.emissions.tri_releases_transfers ||
                          facility.emissions.tri_onsite_releases;
      if (hasEmissions) {
        sections.push(`\nEMISSIONS:`);
        if (facility.emissions.ghg_co2_releases) sections.push(`GHG CO2: ${facility.emissions.ghg_co2_releases}`);
        if (facility.emissions.tri_releases_transfers) sections.push(`TRI Releases & Transfers: ${facility.emissions.tri_releases_transfers}`);
        if (facility.emissions.tri_onsite_releases) sections.push(`TRI On-Site Releases: ${facility.emissions.tri_onsite_releases}`);
      }
    }

    // Demographics (Environmental Justice)
    if (facility.demographics) {
      const hasDemographics = facility.demographics.percent_minority || facility.demographics.population_density;
      if (hasDemographics) {
        sections.push(`\nDEMOGRAPHICS (Environmental Justice):`);
        if (facility.demographics.percent_minority) sections.push(`Minority Population: ${facility.demographics.percent_minority}%`);
        if (facility.demographics.population_density) sections.push(`Population Density: ${facility.demographics.population_density}`);
      }
    }

    // Program IDs
    if (facility.program_ids) {
      const hasIds = facility.program_ids.air || facility.program_ids.npdes ||
                     facility.program_ids.rcra || facility.program_ids.superfund ||
                     facility.program_ids.tri;
      if (hasIds) {
        sections.push(`\nPROGRAM IDs:`);
        if (facility.program_ids.air) sections.push(`Air: ${facility.program_ids.air}`);
        if (facility.program_ids.npdes) sections.push(`NPDES: ${facility.program_ids.npdes}`);
        if (facility.program_ids.rcra) sections.push(`RCRA: ${facility.program_ids.rcra}`);
        if (facility.program_ids.superfund) sections.push(`Superfund: ${facility.program_ids.superfund}`);
        if (facility.program_ids.tri) sections.push(`TRI: ${facility.program_ids.tri}`);
      }
    }

    // Flags
    if (facility.flags) {
      sections.push(`\nSTATUS FLAGS:`);
      sections.push(`Major Facility: ${facility.flags.major_facility ? 'Yes' : 'No'}`);
      sections.push(`Active: ${facility.flags.active ? 'Yes' : 'No'}`);
    }

    // DFR URL
    if (facility.dfr_url) {
      sections.push(`\nDetailed Report: ${facility.dfr_url}`);
    }

    return sections.join('\n');
  }

  /**
   * Generate compliance summary statistics for a set of facilities
   * @param {Array} facilities - Array of raw facility objects
   * @returns {Object} Summary statistics
   */
  _generateComplianceSummary(facilities) {
    if (!facilities || facilities.length === 0) {
      return { total_returned: 0 };
    }

    const summary = {
      total_returned: facilities.length,
      high_priority_violators: facilities.filter(f => f.CAAHpvFlag === 'Y').length,
      significant_noncompliance: facilities.filter(f => f.FacSNCFlg === 'Y').length,
      with_penalties: facilities.filter(f => f.FacTotalPenalties && parseFloat(f.FacTotalPenalties) > 0).length,
      with_federal_cases: facilities.filter(f => f.FecNumberOfCases && parseInt(f.FecNumberOfCases) > 0).length,
      major_facilities: facilities.filter(f => f.FacMajorFlag === 'Y').length,
      in_indian_country: facilities.filter(f => f.FacIndianCntryFlg === 'Y').length,
      total_penalties_sum: facilities.reduce((sum, f) => {
        const penalty = parseFloat(f.FacTotalPenalties) || 0;
        return sum + penalty;
      }, 0)
    };

    // Format total penalties
    if (summary.total_penalties_sum > 0) {
      summary.total_penalties_formatted = `$${summary.total_penalties_sum.toLocaleString()}`;
    }

    return summary;
  }
}


