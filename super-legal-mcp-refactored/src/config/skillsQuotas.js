/**
 * Quotas and guardrails for skill execution.
 * Values are conservative defaults for initial rollout.
 */
export const skillQuotas = {
  __default: { hourlyLimit: 100, dailyLimit: 500, maxOutputBytes: 64000 },
  sec_filing_extractor: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  epa_compliance_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  fda_safety_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  case_law_extractor: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  legislation_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  patent_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  ptab_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  federal_register_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  product_safety_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  antitrust_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  state_court_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 },
  state_statute_analyzer: { hourlyLimit: 60, dailyLimit: 300, maxOutputBytes: 64000 }
};

