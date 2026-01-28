/**
 * Parameter Validation Utility (Module 3)
 * Pure, side-effect-free validation for required tool parameters.
 */

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function clampNumber(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return Math.min(Math.max(value, min), max);
}

export function validateToolParameters(toolName, params = {}) {
  const name = (toolName || '').trim();
  const input = params && typeof params === 'object' ? { ...params } : {};

  switch (name) {
    case 'search_cases': {
      if (!isNonEmptyString(input.query)) {
        return {
          valid: false,
          message: 'search_cases requires query. Example: { query: "bankruptcy Pennsylvania manufacturer", include_snippet: true, limit: 5 }'
        };
      }
      if (input.include_snippet === undefined) input.include_snippet = true;
      if (input.limit === undefined) input.limit = 5;
      input.limit = clampNumber(input.limit, 1, 10) ?? 5;
      return { valid: true, parameters: input };
    }

    case 'search_epa_facilities': {
      const hasLocator = [
        'facility_name',
        'company_name',
        'city',
        'zip_code'
      ].some((k) => isNonEmptyString(input[k]));
      if (!hasLocator) {
        return {
          valid: false,
          message: 'search_epa_facilities requires one of: facility_name, company_name, city, or zip_code (state recommended). Example: { state: "PA", city: "Pittsburgh", compliance_status: "violation", limit: 5 }'
        };
      }
      if (input.limit === undefined) input.limit = 5;
      input.limit = clampNumber(input.limit, 1, 5) ?? 5;
      return { valid: true, parameters: input };
    }

    case 'search_sec_filings': {
      if (!isNonEmptyString(input.company_identifier)) {
        return {
          valid: false,
          message: 'search_sec_filings requires company_identifier. Example: { company_identifier: "Alcoa", filing_type: "10-K", limit: 10 }'
        };
      }
      if (input.limit === undefined) input.limit = 10;
      input.limit = clampNumber(input.limit, 1, 20) ?? 10;
      return { valid: true, parameters: input };
    }

    case 'search_patents': {
      if (!isNonEmptyString(input.query_type)) {
        return {
          valid: false,
          message: 'search_patents requires query_type ("patents" | "inventors" | "assignees"). Example: { query_type: "patents", search_text: "manufacturing Pennsylvania", limit: 10 }'
        };
      }
      if (input.limit === undefined) input.limit = 10;
      input.limit = clampNumber(input.limit, 1, 100) ?? 10;
      return { valid: true, parameters: input };
    }

    default: {
      // No validation for other tools
      return { valid: true, parameters: input };
    }
  }
}


