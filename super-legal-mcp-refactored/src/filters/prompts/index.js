/**
 * Domain-Specific System Prompts for Gemini Filter Modules
 *
 * Each prompt is optimized for extracting relevant information from
 * domain-specific legal documents. These are used as system instructions
 * for Gemini 2.5 Flash to ensure consistent, high-quality extraction.
 *
 * Prompt Design Principles:
 * 1. Explicit extraction targets with examples
 * 2. Structured output format specification
 * 3. Priority ordering (most important first)
 * 4. Length constraints to control output tokens
 * 5. Citation requirements for traceability
 */

// Import individual domain prompts
export { SECURITIES_PROMPT } from './securities.js';
export { PHARMACEUTICAL_PROMPT } from './pharmaceutical.js';
export { ENVIRONMENTAL_PROMPT } from './environmental.js';
export { CASE_LAW_PROMPT } from './caseLaw.js';
export { LEGISLATION_PROMPT } from './legislation.js';
export { FEDERAL_REGISTER_PROMPT } from './federalRegister.js';
export { PRODUCT_SAFETY_PROMPT } from './productSafety.js';
export { ANTITRUST_PROMPT } from './antitrust.js';
export { PATENT_PROMPT } from './patent.js';
export { PATENT_APPEALS_PROMPT } from './patentAppeals.js';
export { STATE_COURTS_PROMPT } from './stateCourts.js';
export { STATE_STATUTES_PROMPT } from './stateStatutes.js';

/**
 * Aggregated prompts object for easy access by domain ID
 */
export const DOMAIN_PROMPTS = {
  securities: null,           // Loaded lazily below
  pharmaceutical_safety: null,
  environmental: null,
  case_law: null,
  legislation: null,
  federal_register: null,
  product_safety: null,
  antitrust: null,
  patent: null,
  patent_appeals: null,
  state_courts: null,
  state_statutes: null
};

// Lazy load prompts to avoid circular dependencies
import('./securities.js').then(m => DOMAIN_PROMPTS.securities = m.SECURITIES_PROMPT);
import('./pharmaceutical.js').then(m => DOMAIN_PROMPTS.pharmaceutical_safety = m.PHARMACEUTICAL_PROMPT);
import('./environmental.js').then(m => DOMAIN_PROMPTS.environmental = m.ENVIRONMENTAL_PROMPT);
import('./caseLaw.js').then(m => DOMAIN_PROMPTS.case_law = m.CASE_LAW_PROMPT);
import('./legislation.js').then(m => DOMAIN_PROMPTS.legislation = m.LEGISLATION_PROMPT);
import('./federalRegister.js').then(m => DOMAIN_PROMPTS.federal_register = m.FEDERAL_REGISTER_PROMPT);
import('./productSafety.js').then(m => DOMAIN_PROMPTS.product_safety = m.PRODUCT_SAFETY_PROMPT);
import('./antitrust.js').then(m => DOMAIN_PROMPTS.antitrust = m.ANTITRUST_PROMPT);
import('./patent.js').then(m => DOMAIN_PROMPTS.patent = m.PATENT_PROMPT);
import('./patentAppeals.js').then(m => DOMAIN_PROMPTS.patent_appeals = m.PATENT_APPEALS_PROMPT);
import('./stateCourts.js').then(m => DOMAIN_PROMPTS.state_courts = m.STATE_COURTS_PROMPT);
import('./stateStatutes.js').then(m => DOMAIN_PROMPTS.state_statutes = m.STATE_STATUTES_PROMPT);

/**
 * Get prompt for a specific domain
 *
 * @param {string} domain - Domain identifier
 * @returns {string|null} Domain prompt or null if not found
 */
export function getPromptForDomain(domain) {
  return DOMAIN_PROMPTS[domain] || null;
}

/**
 * Get all available domain IDs
 *
 * @returns {string[]} Array of domain identifiers
 */
export function getAvailableDomains() {
  return Object.keys(DOMAIN_PROMPTS);
}

/**
 * Domain to client mapping
 * Maps domain IDs to the registered client instance keys
 * These must match the keys used when registering clients with ClaudeOrchestrator
 * e.g., orchestrator.registerClients({ secWeb: client, ... })
 */
export const DOMAIN_CLIENT_MAPPING = {
  securities: ['secWeb'],
  pharmaceutical_safety: ['fdaWeb', 'fdaHybrid'],
  environmental: ['epa', 'epaWeb'],  // Native ECHO first, web search fallback
  case_law: ['courtListenerWeb', 'courtListener'],
  legislation: ['govInfo'],
  federal_register: ['federalRegisterWeb'],
  product_safety: ['cpsc', 'nhtsaWeb'],
  antitrust: ['ftcWeb'],
  patent: ['uspto', 'usptoWeb'],
  patent_appeals: ['ptabWebSearch'],
  state_courts: ['stateCourtRules'],
  state_statutes: ['stateStatute']
};

/**
 * Get domain for a given client class name
 *
 * @param {string} clientName - Client class name
 * @returns {string|null} Domain identifier or null
 */
export function getDomainForClient(clientName) {
  for (const [domain, clients] of Object.entries(DOMAIN_CLIENT_MAPPING)) {
    if (clients.includes(clientName)) {
      return domain;
    }
  }
  return null;
}

export default DOMAIN_PROMPTS;
