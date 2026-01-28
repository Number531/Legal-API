/**
 * Anthropic managed skills configuration (document processing).
 * These are built-in skills provided by Anthropic; no custom code is required.
 */
export const MANAGED_SKILLS = {
  pdf: {
    enabled: true,
    description: 'PDF reading for SEC filings, court documents, and opinions'
  },
  xlsx: {
    enabled: true,
    description: 'Excel spreadsheet handling for financial data extraction'
  },
  docx: {
    enabled: true,
    description: 'Word document processing for legal document analysis'
  },
  pptx: {
    enabled: false,
    description: 'PowerPoint creation/editing (not needed for legal research by default)'
  }
};

/**
 * Return array of enabled managed skills.
 */
export function getEnabledManagedSkills() {
  return Object.entries(MANAGED_SKILLS)
    .filter(([, cfg]) => cfg?.enabled)
    .map(([skill_id]) => skill_id);
}

