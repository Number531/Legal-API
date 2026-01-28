/**
 * CourtListenerSchemas.js
 * JSON Schema v7 definitions for CourtListener case law and court data
 *
 * Covers:
 * - Court opinions and case law
 * - Judges and judicial biographies
 * - Dockets and case filings
 * - Oral argument audio recordings
 * - Court information and metadata
 */

import { CommonTypes, createSchema } from './BaseSchemas.js';

/**
 * Court Opinion Schema
 * Structured extraction for court opinions and case law
 */
export const CourtOpinionSchema = createSchema(
  'Court Opinion',
  {
    case_name: {
      type: 'string',
      description: 'Name of the case (e.g., Brown v. Board of Education)'
    },
    citation: {
      type: 'string',
      description: 'Legal citation (e.g., 347 U.S. 483)'
    },
    court: {
      type: 'string',
      description: 'Court that issued the opinion'
    },
    docket_number: {
      type: 'string',
      description: 'Docket or case number'
    },
    date_filed: {
      ...CommonTypes.date,
      description: 'Date the opinion was filed'
    },
    judge: {
      type: 'string',
      description: 'Authoring judge or panel'
    },
    opinion_type: {
      type: 'string',
      enum: ['Lead Opinion', 'Concurrence', 'Dissent', 'Combined', 'Per Curiam', 'Other'],
      description: 'Type of opinion'
    },
    precedential_status: {
      type: 'string',
      enum: ['Published', 'Unpublished', 'Errata', 'Separate', 'In-chambers', 'Relating-to', 'Unknown'],
      description: 'Precedential status of the opinion'
    },
    summary: {
      type: 'string',
      description: 'Summary of the opinion'
    },
    syllabus: {
      type: 'string',
      description: 'Court syllabus or headnotes'
    },
    holding: {
      type: 'string',
      description: 'Legal holding of the case'
    },
    disposition: {
      type: 'string',
      description: 'Disposition (affirmed, reversed, remanded, etc.)'
    },
    cited_cases: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Cases cited in this opinion'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the opinion on CourtListener'
    }
  },
  ['case_name'] // Minimum required fields
);

/**
 * Judge Schema
 * Structured extraction for judge information and biographies
 */
export const JudgeSchema = createSchema(
  'Judge',
  {
    name: {
      type: 'string',
      description: 'Full name of the judge'
    },
    name_first: {
      type: 'string',
      description: 'First name'
    },
    name_last: {
      type: 'string',
      description: 'Last name'
    },
    court: {
      type: 'string',
      description: 'Court where the judge serves/served'
    },
    position_type: {
      type: 'string',
      enum: ['Judge', 'Chief Judge', 'Associate Justice', 'Chief Justice', 'Magistrate Judge', 'Justice', 'Other'],
      description: 'Type of judicial position'
    },
    appointer: {
      type: 'string',
      description: 'Name of the appointing authority (e.g., president name)'
    },
    appointment_date: {
      ...CommonTypes.date,
      description: 'Date appointed to position'
    },
    termination_date: {
      ...CommonTypes.date,
      description: 'Date position ended (if applicable)'
    },
    political_affiliation: {
      type: 'string',
      enum: ['Democrat', 'Republican', 'Independent', 'Other', 'Unknown'],
      description: 'Political party affiliation'
    },
    selection_method: {
      type: 'string',
      enum: ['Presidential Appointment', 'Gubernatorial Appointment', 'Legislative Appointment', 'Election', 'Merit Selection', 'Other'],
      description: 'Method of selection to the bench'
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          school: {
            type: 'string',
            description: 'Educational institution'
          },
          degree: {
            type: 'string',
            description: 'Degree obtained'
          },
          year: {
            type: 'integer',
            description: 'Year of graduation'
          }
        }
      },
      description: 'Educational background'
    },
    bio: {
      type: 'string',
      description: 'Biographical information'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to judge profile on CourtListener'
    }
  },
  ['name'] // Minimum required fields
);

/**
 * Docket Schema
 * Structured extraction for case dockets and filings
 */
export const DocketSchema = createSchema(
  'Docket',
  {
    case_name: {
      type: 'string',
      description: 'Name of the case'
    },
    docket_number: {
      type: 'string',
      description: 'Docket or case number'
    },
    court: {
      type: 'string',
      description: 'Court where the case is filed'
    },
    date_filed: {
      ...CommonTypes.date,
      description: 'Date the case was filed'
    },
    date_terminated: {
      ...CommonTypes.date,
      description: 'Date the case was terminated (if applicable)'
    },
    assigned_to: {
      type: 'string',
      description: 'Judge assigned to the case'
    },
    referred_to: {
      type: 'string',
      description: 'Judge or magistrate case is referred to'
    },
    nature_of_suit: {
      type: 'string',
      description: 'Nature of suit classification'
    },
    cause: {
      type: 'string',
      description: 'Cause of action'
    },
    parties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Party name'
          },
          type: {
            type: 'string',
            enum: ['Plaintiff', 'Defendant', 'Appellant', 'Appellee', 'Petitioner', 'Respondent', 'Intervenor', 'Other'],
            description: 'Party type'
          }
        }
      },
      description: 'Parties to the case'
    },
    docket_entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entry_number: {
            type: 'integer',
            description: 'Docket entry number'
          },
          date: {
            ...CommonTypes.date,
            description: 'Date of entry'
          },
          description: {
            type: 'string',
            description: 'Description of the docket entry'
          }
        }
      },
      description: 'Docket entries and filings'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the docket on CourtListener'
    }
  },
  ['case_name', 'docket_number'] // Minimum required fields
);

/**
 * Oral Argument Audio Schema
 * Structured extraction for oral argument recordings
 */
export const OralArgumentAudioSchema = createSchema(
  'Oral Argument Audio',
  {
    case_name: {
      type: 'string',
      description: 'Name of the case'
    },
    docket_number: {
      type: 'string',
      description: 'Docket or case number'
    },
    court: {
      type: 'string',
      description: 'Court where arguments were heard'
    },
    date_argued: {
      ...CommonTypes.date,
      description: 'Date of oral arguments'
    },
    judges: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Judges on the panel'
    },
    duration: {
      type: 'integer',
      minimum: 0,
      description: 'Duration in seconds'
    },
    duration_minutes: {
      type: 'number',
      minimum: 0,
      description: 'Duration in minutes'
    },
    has_transcript: {
      type: 'boolean',
      description: 'Whether a transcript is available'
    },
    transcript: {
      type: 'string',
      description: 'Full transcript text (if available)'
    },
    audio_url: {
      ...CommonTypes.url,
      description: 'URL to the audio file'
    },
    summary: {
      type: 'string',
      description: 'Summary of the oral arguments'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to the audio page on CourtListener'
    }
  },
  ['case_name', 'court'] // Minimum required fields
);

/**
 * Court Information Schema
 * Structured extraction for court metadata and information
 */
export const CourtInfoSchema = createSchema(
  'Court Information',
  {
    name: {
      type: 'string',
      description: 'Full name of the court'
    },
    short_name: {
      type: 'string',
      description: 'Short name or abbreviation'
    },
    court_id: {
      type: 'string',
      description: 'CourtListener court identifier'
    },
    jurisdiction: {
      type: 'string',
      enum: ['Federal', 'State', 'Tribal', 'International', 'Other'],
      description: 'Jurisdiction type'
    },
    level: {
      type: 'string',
      enum: ['Supreme Court', 'Appellate', 'District', 'Trial', 'Bankruptcy', 'Special', 'Other'],
      description: 'Court level in hierarchy'
    },
    location: {
      type: 'string',
      description: 'Geographic location or circuit'
    },
    start_date: {
      ...CommonTypes.date,
      description: 'Date court was established'
    },
    end_date: {
      ...CommonTypes.date,
      description: 'Date court was dissolved (if applicable)'
    },
    in_use: {
      type: 'boolean',
      description: 'Whether the court is currently in use'
    },
    has_opinion_scraper: {
      type: 'boolean',
      description: 'Whether CourtListener scrapes opinions from this court'
    },
    has_oral_argument_scraper: {
      type: 'boolean',
      description: 'Whether CourtListener scrapes oral arguments'
    },
    url: {
      ...CommonTypes.url,
      description: 'URL to court information on CourtListener'
    }
  },
  ['name'] // Minimum required fields
);

/**
 * Opinion Type enum
 * Valid opinion types
 */
export const OpinionTypeEnum = [
  'Lead Opinion',
  'Concurrence',
  'Dissent',
  'Combined',
  'Per Curiam',
  'Other'
];

/**
 * Precedential Status enum
 * Valid precedential statuses
 */
export const PrecedentialStatusEnum = [
  'Published',
  'Unpublished',
  'Errata',
  'Separate',
  'In-chambers',
  'Relating-to',
  'Unknown'
];

/**
 * Position Type enum
 * Valid judicial position types
 */
export const PositionTypeEnum = [
  'Judge',
  'Chief Judge',
  'Associate Justice',
  'Chief Justice',
  'Magistrate Judge',
  'Justice',
  'Other'
];

/**
 * Political Affiliation enum
 * Valid political affiliations
 */
export const PoliticalAffiliationEnum = [
  'Democrat',
  'Republican',
  'Independent',
  'Other',
  'Unknown'
];

/**
 * Party Type enum
 * Valid party types
 */
export const PartyTypeEnum = [
  'Plaintiff',
  'Defendant',
  'Appellant',
  'Appellee',
  'Petitioner',
  'Respondent',
  'Intervenor',
  'Other'
];

/**
 * Jurisdiction Type enum
 * Valid jurisdiction types
 */
export const JurisdictionTypeEnum = [
  'Federal',
  'State',
  'Tribal',
  'International',
  'Other'
];

/**
 * Court Level enum
 * Valid court levels
 */
export const CourtLevelEnum = [
  'Supreme Court',
  'Appellate',
  'District',
  'Trial',
  'Bankruptcy',
  'Special',
  'Other'
];

/**
 * Export all schemas
 */
export const CourtListenerSchemas = {
  court_opinion: CourtOpinionSchema,
  judge: JudgeSchema,
  docket: DocketSchema,
  oral_argument_audio: OralArgumentAudioSchema,
  court_info: CourtInfoSchema
};

/**
 * Default export
 */
export default CourtListenerSchemas;
