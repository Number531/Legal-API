/**
 * Filing Template Engine
 * Professional template system for generating structured legal documents
 * Supports multiple jurisdictions and filing types with proper formatting
 */

export class FilingTemplateEngine {
  constructor() {
    // Court-specific formatting rules - define first
    this.courtRules = {
      federal: {
        margins: '1 inch all sides',
        font: '12pt Times New Roman',
        line_spacing: 'double',
        page_numbering: 'bottom center',
        caption_format: 'left_aligned'
      },
      state: {
        margins: 'varies by state',
        font: '12pt Times New Roman or Arial',
        line_spacing: 'double',
        page_numbering: 'varies',
        caption_format: 'varies'
      }
    };

    // Template registry for different filing types and jurisdictions - define after courtRules
    this.templates = {
      federal: {
        complaint: this._federalComplaintTemplate(),
        motion_to_dismiss: this._federalMotionToDismissTemplate(),
        motion_to_suppress: this._federalMotionToSuppressTemplate(),
        memorandum: this._federalMemorandumTemplate(),
        brief: this._federalBriefTemplate(),
        motion_to_compel: this._federalMotionToCompelTemplate(),
        motion_for_summary_judgment: this._federalSummaryJudgmentTemplate(),
        tro_application: this._federalTROTemplate()
      },
      state: {
        complaint: this._stateComplaintTemplate(),
        motion_to_dismiss: this._stateMotionToDismissTemplate(),
        motion_to_suppress: this._stateMotionToSuppressTemplate(),
        memorandum: this._stateMemorandumTemplate(),
        brief: this._stateBriefTemplate()
      }
    };
  }

  /**
   * Generate a structured document using appropriate template
   * @param {Object} params
   * @param {string} params.filing_type - Type of filing
   * @param {string} params.jurisdiction - federal | state
   * @param {Object} params.content - Content for template population
   */
  generateDocument(params) {
    const { filing_type, jurisdiction = 'federal', content } = params;
    
    const template = this.getTemplate(filing_type, jurisdiction);
    if (!template) {
      throw new Error(`Template not found for ${filing_type} in ${jurisdiction} jurisdiction`);
    }

    return this.populateTemplate(template, content);
  }

  /**
   * Get template for specific filing type and jurisdiction
   */
  getTemplate(filing_type, jurisdiction) {
    return this.templates[jurisdiction]?.[filing_type];
  }

  /**
   * Populate template with provided content
   */
  populateTemplate(template, content) {
    const populated = JSON.parse(JSON.stringify(template)); // Deep clone
    
    // Replace placeholders with actual content
    this._replacePlaceholders(populated, content);
    
    return populated;
  }

  /**
   * Get formatting rules for jurisdiction
   */
  getFormattingRules(jurisdiction) {
    return this.courtRules[jurisdiction] || this.courtRules.federal;
  }

  // ===== FEDERAL TEMPLATES =====

  _federalComplaintTemplate() {
    return {
      document_type: 'Federal Civil Complaint',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{plaintiff_name}},\n\nPlaintiff,\n\nv.\n\n{{defendant_name}},\n\nDefendant.\n\nCase No. {{case_number}}\n\nCOMPLAINT FOR {{complaint_type}}'
        },
        {
          name: 'preliminary_statement',
          title: 'PRELIMINARY STATEMENT',
          template: 'Plaintiff {{plaintiff_name}} brings this action against Defendant {{defendant_name}} for {{nature_of_action}}. This Court has jurisdiction pursuant to {{jurisdiction_basis}}.'
        },
        {
          name: 'jurisdiction_and_venue',
          title: 'JURISDICTION AND VENUE',
          template: '1. This Court has subject matter jurisdiction pursuant to {{jurisdiction_statute}}.\n\n2. Venue is proper in this District pursuant to {{venue_statute}}.\n\n3. {{additional_jurisdictional_facts}}'
        },
        {
          name: 'parties',
          title: 'PARTIES',
          template: '4. Plaintiff {{plaintiff_name}} is {{plaintiff_description}}.\n\n5. Defendant {{defendant_name}} is {{defendant_description}}.\n\n{{additional_parties}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_allegations}}'
        },
        {
          name: 'causes_of_action',
          title: 'CAUSES OF ACTION',
          template: '{{causes_of_action}}'
        },
        {
          name: 'prayer_for_relief',
          title: 'PRAYER FOR RELIEF',
          template: 'WHEREFORE, Plaintiff respectfully requests that this Court:\n\n{{relief_requested}}\n\nE. Grant such other and further relief as this Court deems just and proper.'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for {{party_represented}}'
        }
      ]
    };
  }

  _federalMotionToDismissTemplate() {
    return {
      document_type: 'Federal Motion to Dismiss',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{plaintiff_name}},\n\nPlaintiff,\n\nv.\n\n{{defendant_name}},\n\nDefendant.\n\nCase No. {{case_number}}\n\nMOTION TO DISMISS PURSUANT TO FED. R. CIV. P. {{rule_basis}}'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: 'Defendant {{defendant_name}} respectfully moves this Court to dismiss {{dismissal_scope}} pursuant to Federal Rule of Civil Procedure {{rule_basis}} for {{dismissal_grounds}}.'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'legal_standard',
          title: 'LEGAL STANDARD',
          template: '{{legal_standard_text}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{argument_sections}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: 'For the foregoing reasons, Defendant respectfully requests that this Court grant this Motion to Dismiss {{dismissal_scope}}.'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for {{party_represented}}'
        }
      ]
    };
  }

  _federalMotionToSuppressTemplate() {
    return {
      document_type: 'Federal Motion to Suppress',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\nUNITED STATES OF AMERICA,\n\nv.\n\n{{defendant_name}},\n\nDefendant.\n\nCase No. {{case_number}}\n\nMOTION TO SUPPRESS EVIDENCE'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: 'Defendant {{defendant_name}} respectfully moves this Court to suppress {{evidence_description}} obtained in violation of the Fourth Amendment to the United States Constitution.'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'legal_standard',
          title: 'LEGAL STANDARD',
          template: 'Under the Fourth Amendment, evidence obtained in violation of constitutional protections must be suppressed. {{legal_standard_details}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{constitutional_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: 'For the foregoing reasons, Defendant respectfully requests that this Court grant this Motion to Suppress.'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for Defendant'
        }
      ]
    };
  }

  _federalMemorandumTemplate() {
    return {
      document_type: 'Federal Memorandum of Law',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{case_caption}}\n\nCase No. {{case_number}}\n\nMEMORANDUM OF LAW {{memo_purpose}}'
        },
        {
          name: 'table_of_contents',
          title: 'TABLE OF CONTENTS',
          template: '{{table_of_contents}}'
        },
        {
          name: 'table_of_authorities',
          title: 'TABLE OF AUTHORITIES',
          template: '{{table_of_authorities}}'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: '{{introduction_text}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{legal_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: '{{conclusion_text}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for {{party_represented}}'
        }
      ]
    };
  }

  _federalBriefTemplate() {
    return {
      document_type: 'Federal Court Brief',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{case_caption}}\n\nCase No. {{case_number}}\n\n{{brief_type}}'
        },
        {
          name: 'table_of_contents',
          title: 'TABLE OF CONTENTS',
          template: '{{table_of_contents}}'
        },
        {
          name: 'table_of_authorities',
          title: 'TABLE OF AUTHORITIES',
          template: '{{table_of_authorities}}'
        },
        {
          name: 'statement_of_issues',
          title: 'STATEMENT OF ISSUES PRESENTED',
          template: '{{issues_presented}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'summary_of_argument',
          title: 'SUMMARY OF ARGUMENT',
          template: '{{argument_summary}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{detailed_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: '{{conclusion_text}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for {{party_represented}}'
        }
      ]
    };
  }

  _federalMotionToCompelTemplate() {
    return {
      document_type: 'Federal Motion to Compel Discovery',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{case_caption}}\n\nCase No. {{case_number}}\n\nMOTION TO COMPEL DISCOVERY'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: '{{movant_name}} respectfully moves this Court to compel {{opposing_party}} to {{discovery_requested}} pursuant to Federal Rules of Civil Procedure {{applicable_rules}}.'
        },
        {
          name: 'meet_and_confer',
          title: 'MEET AND CONFER CERTIFICATION',
          template: 'Pursuant to Federal Rule of Civil Procedure 37(a)(1), counsel for {{movant_name}} conferred with opposing counsel in good faith in an effort to resolve this discovery dispute without court intervention. {{meet_confer_details}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{discovery_history}}'
        },
        {
          name: 'legal_standard',
          title: 'LEGAL STANDARD',
          template: '{{discovery_standards}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{discovery_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: 'For the foregoing reasons, {{movant_name}} respectfully requests that this Court grant this Motion to Compel.'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for {{party_represented}}'
        }
      ]
    };
  }

  _federalSummaryJudgmentTemplate() {
    return {
      document_type: 'Federal Motion for Summary Judgment',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{case_caption}}\n\nCase No. {{case_number}}\n\nMOTION FOR SUMMARY JUDGMENT'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: '{{movant_name}} respectfully moves this Court for summary judgment pursuant to Federal Rule of Civil Procedure 56 on {{claims_or_defenses}}.'
        },
        {
          name: 'statement_of_undisputed_facts',
          title: 'STATEMENT OF UNDISPUTED MATERIAL FACTS',
          template: '{{undisputed_facts}}'
        },
        {
          name: 'legal_standard',
          title: 'LEGAL STANDARD',
          template: 'Summary judgment is appropriate when "there is no genuine dispute as to any material fact and the movant is entitled to judgment as a matter of law." Fed. R. Civ. P. 56(a).'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{summary_judgment_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: 'For the foregoing reasons, {{movant_name}} respectfully requests that this Court grant summary judgment {{relief_requested}}.'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for {{party_represented}}'
        }
      ]
    };
  }

  _federalTROTemplate() {
    return {
      document_type: 'Federal Application for Temporary Restraining Order',
      format_rules: this.courtRules.federal,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: 'UNITED STATES DISTRICT COURT\n{{court_district}}\n\n{{case_caption}}\n\nCase No. {{case_number}}\n\nAPPLICATION FOR TEMPORARY RESTRAINING ORDER'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: 'Plaintiff {{plaintiff_name}} respectfully applies for a temporary restraining order pursuant to Federal Rule of Civil Procedure 65 to {{injunction_purpose}}.'
        },
        {
          name: 'factual_background',
          title: 'FACTUAL BACKGROUND',
          template: '{{emergency_facts}}'
        },
        {
          name: 'legal_standard',
          title: 'LEGAL STANDARD',
          template: 'A temporary restraining order may be granted upon a showing of: (1) likelihood of success on the merits; (2) irreparable harm; (3) balance of hardships; and (4) public interest.'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{tro_arguments}}'
        },
        {
          name: 'proposed_order',
          title: 'PROPOSED ORDER',
          template: '{{proposed_tro_terms}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: 'For the foregoing reasons, Plaintiff respectfully requests that this Court grant this Application for Temporary Restraining Order.'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: 'Respectfully submitted,\n\n/s/ {{attorney_name}}\n{{attorney_name}}\n{{bar_number}}\n{{law_firm}}\n{{address}}\n{{phone}}\n{{email}}\nAttorney for Plaintiff'
        }
      ]
    };
  }

  // ===== STATE TEMPLATES (Simplified versions) =====

  _stateComplaintTemplate() {
    // Simplified state template - can be expanded per state requirements
    return {
      document_type: 'State Court Complaint',
      format_rules: this.courtRules.state,
      note: 'Template may require state-specific modifications',
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: '{{state_court_name}}\n{{county}}\n\n{{plaintiff_name}},\n\nPlaintiff,\n\nv.\n\n{{defendant_name}},\n\nDefendant.\n\nCase No. {{case_number}}\n\nCOMPLAINT'
        },
        {
          name: 'parties',
          title: 'PARTIES',
          template: '{{parties_section}}'
        },
        {
          name: 'jurisdiction_and_venue',
          title: 'JURISDICTION AND VENUE',
          template: '{{jurisdiction_venue}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_allegations}}'
        },
        {
          name: 'causes_of_action',
          title: 'CAUSES OF ACTION',
          template: '{{causes_of_action}}'
        },
        {
          name: 'prayer_for_relief',
          title: 'PRAYER FOR RELIEF',
          template: 'WHEREFORE, Plaintiff prays for judgment against Defendant as follows:\n\n{{relief_requested}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: '{{attorney_signature_block}}'
        }
      ]
    };
  }

  _stateMotionToDismissTemplate() {
    return {
      document_type: 'State Court Motion to Dismiss',
      format_rules: this.courtRules.state,
      note: 'Template may require state-specific rule references',
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: '{{state_court_caption}}'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: '{{motion_introduction}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{legal_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: '{{conclusion}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: '{{attorney_signature_block}}'
        }
      ]
    };
  }

  _stateMotionToSuppressTemplate() {
    return {
      document_type: 'State Court Motion to Suppress',
      format_rules: this.courtRules.state,
      note: 'Template may require state constitutional provisions',
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: '{{state_court_caption}}'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: '{{suppression_motion_intro}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'legal_standard',
          title: 'LEGAL STANDARD',
          template: '{{state_suppression_standards}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{constitutional_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: '{{conclusion}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: '{{attorney_signature_block}}'
        }
      ]
    };
  }

  _stateMemorandumTemplate() {
    return {
      document_type: 'State Court Memorandum of Law',
      format_rules: this.courtRules.state,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: '{{state_court_caption}}'
        },
        {
          name: 'introduction',
          title: 'INTRODUCTION',
          template: '{{memo_introduction}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{legal_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: '{{conclusion}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: '{{attorney_signature_block}}'
        }
      ]
    };
  }

  _stateBriefTemplate() {
    return {
      document_type: 'State Court Brief',
      format_rules: this.courtRules.state,
      sections: [
        {
          name: 'caption',
          title: 'CAPTION',
          template: '{{state_court_caption}}'
        },
        {
          name: 'table_of_contents',
          title: 'TABLE OF CONTENTS',
          template: '{{table_of_contents}}'
        },
        {
          name: 'table_of_authorities',
          title: 'TABLE OF AUTHORITIES',
          template: '{{table_of_authorities}}'
        },
        {
          name: 'statement_of_facts',
          title: 'STATEMENT OF FACTS',
          template: '{{factual_background}}'
        },
        {
          name: 'argument',
          title: 'ARGUMENT',
          template: '{{legal_arguments}}'
        },
        {
          name: 'conclusion',
          title: 'CONCLUSION',
          template: '{{conclusion}}'
        },
        {
          name: 'signature',
          title: 'SIGNATURE',
          template: '{{attorney_signature_block}}'
        }
      ]
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Replace placeholders in template with actual values
   * @private
   */
  _replacePlaceholders(templateObj, values) {
    const replaceInString = (str, vals) => {
      if (typeof str !== 'string') return str;
      
      let result = str;
      for (const [key, value] of Object.entries(vals || {})) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(placeholder, value || `[${key}]`);
      }
      return result;
    };

    const replaceRecursive = (obj, vals) => {
      if (Array.isArray(obj)) {
        return obj.map(item => replaceRecursive(item, vals));
      }
      
      if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = replaceRecursive(value, vals);
        }
        return newObj;
      }
      
      return replaceInString(obj, vals);
    };

    return replaceRecursive(templateObj, values);
  }
}