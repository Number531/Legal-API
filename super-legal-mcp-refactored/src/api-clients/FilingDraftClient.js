/**
 * Filing Draft Client
 * Generates structured draft filings from provided facts and evidence without external API calls.
 * NOTE: Requires explicit user confirmation that evidence is adequate before producing a draft.
 */

import { FilingTemplateEngine } from '../utils/FilingTemplateEngine.js';
import { CitationValidator } from '../utils/CitationValidator.js';

export class FilingDraftClient {
  constructor() {
    this.templateEngine = new FilingTemplateEngine();
    this.citationValidator = new CitationValidator();
  }

  /**
   * Draft a legal filing using templates and provided evidence/citations
   * @param {Object} args
   * @param {string} args.filing_type - e.g., complaint | motion_to_dismiss | motion_to_suppress | memorandum | brief
   * @param {string} args.court - Court name or abbreviation (e.g., 'N.D. Cal.', 'ca9')
   * @param {string} args.jurisdiction - e.g., 'federal' | 'state'
   * @param {Object} args.parties - { plaintiff, defendant } or { movant, respondent }
   * @param {string[]} [args.causes_of_action] - e.g., ['Breach of Contract']
   * @param {string} [args.relief_sought]
   * @param {string} [args.fact_summary] - narrative facts
   * @param {Array} [args.evidence_items] - [{ title, citation, url, excerpt, type }]
   * @param {Array} [args.case_citations] - [{ citation, name, url, holding }]
   * @param {boolean} args.confirm_evidence_adequate - must be true to produce full draft
   * @param {boolean} [args.include_table_of_authorities=false]
   * @param {string} [args.citation_format='Bluebook']
   */
  async draftLegalFiling(args) {
    if (!args || typeof args !== 'object') args = {};

    const {
      filing_type,
      court,
      jurisdiction,
      parties = {},
      causes_of_action = [],
      relief_sought,
      fact_summary,
      evidence_items = [],
      case_citations = [],
      confirm_evidence_adequate,
      include_table_of_authorities = false,
      citation_format = 'Bluebook'
    } = args;

    if (!filing_type) {
      return this._responseText({
        error: 'filing_type is required',
        suggestion: 'Provide filing_type (e.g., complaint, motion_to_dismiss, motion_to_suppress, memorandum, brief)'
      });
    }

    // If user hasn't confirmed evidence adequacy, return an outline and checklist only
    if (!confirm_evidence_adequate) {
      return this._responseText(this._buildOutlineOnly({
        filing_type,
        court,
        jurisdiction,
        parties,
        causes_of_action,
        relief_sought,
        fact_summary,
        evidence_items,
        case_citations,
        citation_format
      }));
    }

    // Produce full draft
    const draft = this._buildDraft({
      filing_type,
      court,
      jurisdiction,
      parties,
      causes_of_action,
      relief_sought,
      fact_summary,
      evidence_items,
      case_citations,
      include_table_of_authorities,
      citation_format
    });

    return this._responseText(draft);
  }

  _buildOutlineOnly(ctx) {
    const { filing_type, court, jurisdiction, parties, causes_of_action, relief_sought, fact_summary, evidence_items, case_citations, citation_format } = ctx;
    return {
      mode: 'outline',
      notice: 'User has not confirmed evidence adequacy. Returning structured outline and requirements checklist instead of a full draft.',
      filing_type,
      court,
      jurisdiction,
      sections: [
        'Caption',
        'Preliminary Statement',
        'Jurisdiction and Venue',
        'Parties',
        'Statement of Facts',
        filing_type === 'complaint' ? 'Causes of Action' : 'Legal Standard',
        filing_type === 'complaint' ? 'Prayer for Relief' : 'Argument',
        'Conclusion',
        'Signature',
        'Certificate of Service',
        'Evidence Appendix'
      ],
      current_inputs: {
        parties,
        causes_of_action,
        relief_sought,
        fact_summary_present: Boolean(fact_summary),
        evidence_items_count: evidence_items.length,
        case_citations_count: case_citations.length
      },
      requirements_checklist: [
        'Confirm factual narrative is complete and internally consistent',
        'Confirm each claim/argument is tied to at least one piece of admissible evidence',
        'Confirm citations formatted per ' + citation_format,
        'Confirm jurisdiction and venue are properly alleged',
        'Confirm prayer for relief matches causes of action (if complaint)',
        'Confirm certificate of service (if required by local rules)'
      ],
      evidence_preview: this._mapEvidence(evidence_items),
      authorities_preview: this._mapAuthorities(case_citations)
    };
  }

  _buildDraft(ctx) {
    const { filing_type, court, jurisdiction, parties, causes_of_action, relief_sought, fact_summary, evidence_items, case_citations, include_table_of_authorities, citation_format } = ctx;

    try {
      // Use professional template engine if available
      const template = this.templateEngine.getTemplate(filing_type, jurisdiction);
      if (template) {
        const templateContent = {
          court_district: court,
          case_number: '[CASE NUMBER]',
          plaintiff_name: parties.plaintiff || '[PLAINTIFF]',
          defendant_name: parties.defendant || '[DEFENDANT]',
          attorney_name: '[ATTORNEY NAME]',
          bar_number: '[BAR NUMBER]',
          law_firm: '[LAW FIRM]',
          address: '[ADDRESS]',
          phone: '[PHONE]',
          email: '[EMAIL]',
          party_represented: parties.plaintiff || parties.defendant || '[CLIENT]',
          factual_allegations: fact_summary || '[FACTUAL ALLEGATIONS]',
          causes_of_action: this._formatCausesForTemplate(causes_of_action),
          relief_requested: relief_sought || '[RELIEF REQUESTED]'
        };
        
        const professionalDraft = this.templateEngine.populateTemplate(template, templateContent);
        const validatedCitations = this._validateAndFormatCitations(case_citations, citation_format);
        
        return {
          mode: 'draft',
          template_used: true,
          filing_type,
          court,
          jurisdiction,
          document: professionalDraft,
          citation_validation: validatedCitations,
          evidence_summary: this._mapEvidence(evidence_items)
        };
      }
    } catch (error) {
      // Fall back to legacy method if template fails
      console.warn('Template engine failed, using legacy method:', error.message);
    }

    // Legacy method as fallback
    const caption = this._buildCaption({ court, parties });
    const prelim = this._buildPrelimStatement({ filing_type, fact_summary });
    const jnv = this._buildJurisdictionVenue({ court, jurisdiction, evidence_items });
    const partiesSec = this._buildParties({ parties });
    const facts = this._buildFacts({ fact_summary, evidence_items });
    const body = filing_type === 'complaint'
      ? this._buildCausesOfAction({ causes_of_action, evidence_items, case_citations, citation_format })
      : this._buildArgument({ filing_type, case_citations, evidence_items, citation_format });
    const relief = filing_type === 'complaint' ? this._buildPrayerForRelief({ relief_sought }) : null;
    const conclusion = this._buildConclusion({ filing_type });
    const signature = this._buildSignature();
    const appendix = this._buildEvidenceAppendix({ evidence_items });
    const toa = include_table_of_authorities ? this._buildTableOfAuthorities({ case_citations }) : null;

    return {
      mode: 'draft',
      template_used: false,
      filing_type,
      court,
      jurisdiction,
      sections: {
        caption,
        preliminary_statement: prelim,
        jurisdiction_and_venue: jnv,
        parties: partiesSec,
        statement_of_facts: facts,
        ...(filing_type === 'complaint' ? { causes_of_action: body } : { argument: body }),
        ...(relief ? { prayer_for_relief: relief } : {}),
        conclusion,
        signature,
        ...(toa ? { table_of_authorities: toa } : {}),
        evidence_appendix: appendix
      }
    };
  }

  _buildCaption({ court, parties }) {
    const left = (parties.plaintiff || parties.movant || 'Plaintiff/Movant').toUpperCase();
    const right = (parties.defendant || parties.respondent || 'Defendant/Respondent').toUpperCase();
    return `${left}\n\nv.\n\n${right}\n\nIN THE ${court || 'SPECIFIED COURT'}`;
  }

  _buildPrelimStatement({ filing_type, fact_summary }) {
    return `This ${this._label(filing_type)} arises from the facts summarized below. The movant respectfully requests the relief set forth herein.` + (fact_summary ? `\n\nSummary of Facts:\n${fact_summary}` : '');
  }

  _buildJurisdictionVenue({ court, jurisdiction }) {
    return `Jurisdiction is proper in this ${jurisdiction || 'jurisdiction'} court. Venue is appropriate in ${court || 'this court'} pursuant to applicable statutes and local rules.`;
  }

  _buildParties({ parties }) {
    const lines = [];
    if (parties.plaintiff) lines.push(`Plaintiff: ${parties.plaintiff}`);
    if (parties.defendant) lines.push(`Defendant: ${parties.defendant}`);
    if (parties.movant) lines.push(`Movant: ${parties.movant}`);
    if (parties.respondent) lines.push(`Respondent: ${parties.respondent}`);
    return lines.join('\n');
  }

  _buildFacts({ fact_summary, evidence_items }) {
    const items = this._mapEvidence(evidence_items);
    const bullets = items.map((e, idx) => `(${idx + 1}) ${e.title}${e.citation ? `, ${e.citation}` : ''}${e.url ? `, ${e.url}` : ''}`);
    return (fact_summary ? fact_summary + '\n\n' : '') + (bullets.length ? 'Key Evidence:\n' + bullets.join('\n') : '');
  }

  _buildCausesOfAction({ causes_of_action, evidence_items, case_citations, citation_format }) {
    if (!causes_of_action || causes_of_action.length === 0) return 'No causes of action specified.';
    return causes_of_action.map((cause, idx) => {
      const support = this._supportBlock({ case_citations, evidence_items, citation_format });
      return `Count ${idx + 1}: ${cause}\n\nElements:\n- [List elements]\n\nApplication:\n${support}\n`;
    }).join('\n');
  }

  _buildArgument({ filing_type, case_citations, evidence_items, citation_format }) {
    const issues = [`Issue 1: ${this._label(filing_type)} should be granted.`];
    const support = this._supportBlock({ case_citations, evidence_items, citation_format });
    return issues.join('\n') + '\n\n' + support;
  }

  _supportBlock({ case_citations, evidence_items, citation_format }) {
    const cites = this._mapAuthorities(case_citations).map(a => `- ${a.name ? a.name + ', ' : ''}${a.citation || ''}${a.url ? ` (${a.url})` : ''}`).join('\n');
    const ev = this._mapEvidence(evidence_items).map(e => `- ${e.title}${e.citation ? `, ${e.citation}` : ''}${e.url ? ` (${e.url})` : ''}${e.excerpt ? `\n  Excerpt: ${e.excerpt}` : ''}`).join('\n');
    return `Authority (${citation_format}):\n${cites || '- [Add authorities]'}\n\nRecord/Evidence:\n${ev || '- [Add evidence]'}`;
  }

  _buildPrayerForRelief({ relief_sought }) {
    return relief_sought || 'Wherefore, Plaintiff requests that the Court grant the relief deemed just and proper.';
  }

  _buildConclusion({ filing_type }) {
    return `For the foregoing reasons, the ${this._label(filing_type)} should be granted.`;
  }

  _buildSignature() {
    return 'Respectfully submitted,\n\n[Attorney Name]\n[Law Firm]\n[Address]\n[Phone]\n[Email]\n[Bar No.]';
  }

  _buildTableOfAuthorities({ case_citations }) {
    try {
      // Use professional citation validator if available
      const toa = this.citationValidator.generateTableOfAuthorities(case_citations, 'bluebook');
      if (toa && toa.sections) {
        return toa;
      }
    } catch (error) {
      console.warn('Citation validator failed, using legacy method:', error.message);
    }
    
    // Legacy fallback
    const list = this._mapAuthorities(case_citations).map(a => `${a.name || ''} ${a.citation || ''}`).join('\n');
    return list || '[No authorities provided]';
  }

  _buildEvidenceAppendix({ evidence_items }) {
    const mapped = this._mapEvidence(evidence_items);
    return mapped.length ? mapped : [{ note: 'No evidence items provided' }];
  }

  _mapEvidence(items) {
    return (items || []).map((e, i) => ({
      index: i + 1,
      title: e.title || `Exhibit ${i + 1}`,
      citation: e.citation || null,
      url: e.url || null,
      excerpt: e.excerpt || null,
      type: e.type || null
    }));
  }

  _mapAuthorities(items) {
    return (items || []).map(a => ({
      citation: a.citation || null,
      name: a.name || null,
      url: a.url || null,
      holding: a.holding || null
    }));
  }

  _label(filing_type) {
    switch ((filing_type || '').toLowerCase()) {
      case 'complaint': return 'Complaint';
      case 'motion_to_dismiss': return 'Motion to Dismiss';
      case 'motion_to_suppress': return 'Motion to Suppress';
      case 'memorandum':
      case 'memorandum_of_law': return 'Memorandum of Law';
      case 'brief': return 'Brief';
      default: return 'Filing';
    }
  }

  _validateAndFormatCitations(citations, format) {
    if (!citations || citations.length === 0) {
      return { valid_citations: [], invalid_citations: [], warnings: [] };
    }

    const results = {
      valid_citations: [],
      invalid_citations: [],
      warnings: []
    };

    citations.forEach((citation, index) => {
      try {
        const validation = this.citationValidator.validateCitation(citation.citation || citation, format);
        
        if (validation.valid) {
          results.valid_citations.push({
            original: citation,
            formatted: validation.formatted,
            type: validation.type
          });
        } else {
          results.invalid_citations.push({
            original: citation,
            error: validation.error,
            suggestions: validation.suggestions
          });
        }
        
        if (validation.issues && validation.issues.length > 0) {
          results.warnings.push({
            citation: citation.citation || citation,
            issues: validation.issues
          });
        }
      } catch (error) {
        results.invalid_citations.push({
          original: citation,
          error: `Validation failed: ${error.message}`
        });
      }
    });

    return results;
  }

  _formatCausesForTemplate(causes_of_action) {
    if (!causes_of_action || causes_of_action.length === 0) {
      return '[CAUSES OF ACTION TO BE SPECIFIED]';
    }
    
    return causes_of_action.map((cause, index) => 
      `COUNT ${index + 1}: ${cause.toUpperCase()}`
    ).join('\n\n');
  }

  _responseText(obj) {
    return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
  }
}


