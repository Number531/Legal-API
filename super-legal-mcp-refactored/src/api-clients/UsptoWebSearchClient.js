/**
 * USPTO Web Search Client
 * Powered by Exa WebSearch API with Schema-Based Extraction
 *
 * Provides enhanced patent search capabilities for:
 * - Patent searches with comprehensive metadata extraction
 * - CPC, USPC, and WIPO classification searches
 * - Patent location and geographic analysis
 * - International patent discovery via Google Patents
 *
 * Features:
 * - Multi-domain targeting (USPTO official + Google Patents)
 * - Schema-based structured data extraction
 * - Patent metadata extraction (numbers, inventors, assignees, classifications)
 * - Classification hierarchy mapping and search
 * - Conditional content fetching for performance optimization
 */

import { validateLimit, validateDate } from '../utils/validation.js';
import { BaseWebSearchClient } from './BaseWebSearchClient.js';
import { USPTOSchemas } from './schemas/USPTOSchemas.js';

export class UsptoWebSearchClient extends BaseWebSearchClient {
  constructor(rateLimiter, exaApiKey) {
    // Call parent constructor
    super(rateLimiter, exaApiKey);

    // Register USPTO schemas for structured data extraction
    if (this.contentStrategy) {
      Object.entries(USPTOSchemas).forEach(([dataType, schema]) => {
        this.contentStrategy.registerSchema(dataType, schema);
      });
    }

    // USPTO and Google Patents domain configuration
    this.domains = [
      'uspto.gov',           // Official USPTO site
      'patft.uspto.gov',     // Patent Full-Text Database  
      'appft.uspto.gov',     // Patent Application Full-Text Database
      'patents.google.com'   // Google Patents (supplementary)
    ];

    // CPC Classification Section Mappings (Cooperative Patent Classification)
    this.cpcSections = {
      'A': 'HUMAN NECESSITIES',
      'B': 'PERFORMING OPERATIONS; TRANSPORTING', 
      'C': 'CHEMISTRY; METALLURGY',
      'D': 'TEXTILES; PAPER',
      'E': 'FIXED CONSTRUCTIONS',
      'F': 'MECHANICAL ENGINEERING; LIGHTING; HEATING; WEAPONS; BLASTING',
      'G': 'PHYSICS',
      'H': 'ELECTRICITY',
      'Y': 'GENERAL TAGGING OF NEW TECHNOLOGICAL DEVELOPMENTS'
    };

    // Patent document section mappings for smart snippet extraction
    this.patentSections = {
      'abstract': ['ABSTRACT', 'Summary', 'Brief Summary'],
      'claims': ['CLAIMS', 'What is claimed', 'Claim 1', 'Independent Claims'],
      'technical_field': ['TECHNICAL FIELD', 'Field of the Invention', 'Background'],
      'description': ['DETAILED DESCRIPTION', 'Description of the Invention'],
      'inventor': ['Inventor:', 'Inventors:', 'Applicant:'],
      'assignee': ['Assignee:', 'Assignee Name:', 'Current Owner:', 'Original Assignee:']
    };

    // USPC Class mappings (legacy system)
    this.uspcMajorClasses = {
      '002': 'Apparel',
      '128': 'Surgery',  
      '340': 'Communications: Electrical',
      '375': 'Pulse or Digital Communications',
      '381': 'Electrical Audio Signal Processing Systems and Devices',
      '382': 'Image Analysis',
      '700': 'Data Processing: Generic Control Systems',
      '701': 'Data Processing: Vehicles, Navigation, and Relative Location',
      '702': 'Data Processing: Measuring, Calibrating, or Testing',
      '703': 'Data Processing: Structural Design, Modeling, Simulation, and Emulation',
      '704': 'Data Processing: Speech Signal Processing, Linguistics, Language Translation',
      '705': 'Data Processing: Financial, Business Practice, Management, or Cost/Price Determination',
      '706': 'Data Processing: Artificial Intelligence',
      '707': 'Data Processing: Database and File Management',
      '708': 'Electrical Computers: Arithmetic Processing and Calculating',
      '709': 'Electrical Computers and Digital Processing Systems'
    };

    // WIPO Technology Field mappings (International Patent Classification)
    this.wipoFields = {
      '01': 'Electrical machinery, apparatus, energy',
      '02': 'Audio-visual technology', 
      '03': 'Telecommunications',
      '04': 'Digital communication',
      '05': 'Basic communication processes',
      '06': 'Computer technology',
      '07': 'IT methods for management',
      '08': 'Semiconductors',
      '09': 'Optics',
      '10': 'Measurement',
      '11': 'Analysis of biological materials',
      '12': 'Control',
      '13': 'Medical technology',
      '14': 'Organic fine chemistry',
      '15': 'Biotechnology',
      '16': 'Pharmaceuticals',
      '17': 'Macromolecular chemistry, polymers',
      '18': 'Food chemistry',
      '19': 'Basic materials chemistry',
      '20': 'Materials, metallurgy',
      '21': 'Surface technology, coating',
      '22': 'Micro-structure and nano-technology',
      '23': 'Chemical engineering',
      '24': 'Environmental technology',
      '25': 'Handling',
      '26': 'Machine tools',
      '27': 'Engines, pumps, turbines',
      '28': 'Textile and paper machines',
      '29': 'Other special machines',
      '30': 'Thermal processes and apparatus',
      '31': 'Mechanical elements',
      '32': 'Transport',
      '33': 'Furniture, games',
      '34': 'Other consumer goods',
      '35': 'Civil engineering'
    };

    // Patent-specific search terms for query enhancement
    this.patentTerms = [
      'patent', 'invention', 'claims', 'abstract', 'specification',
      'inventor', 'assignee', 'prior art', 'embodiment', 'method',
      'system', 'apparatus', 'device', 'process', 'composition'
    ];
  }

  /**
   * Build patent-specific search query with multi-domain targeting
   */
  buildPatentQuery(args) {
    const {
      query_type = 'patents',
      search_text,
      assignee_organization,
      inventor_name,  
      patent_number,
      cpc_code,
      uspc_code,
      patent_date_start,
      patent_date_end,
      technology_area,
      include_google = true
    } = args;

    let domains = ['site:uspto.gov', 'site:patft.uspto.gov', 'site:appft.uspto.gov'];
    if (include_google) {
      domains.push('site:patents.google.com');
    }

    let query = `(${domains.join(' OR ')})`;

    // Add specific search terms based on query type
    if (query_type === 'patents') {
      if (patent_number) {
        // Exact patent number search
        query += ` "${patent_number}"`;
      } else {
        // Build compound query
        const queryParts = [];
        
        if (search_text) {
          queryParts.push(`"${search_text}"`);
        }
        
        if (assignee_organization) {
          queryParts.push(`assignee:"${assignee_organization}"`);
        }
        
        if (inventor_name) {
          queryParts.push(`inventor:"${inventor_name}"`);
        }
        
        if (cpc_code) {
          queryParts.push(`CPC:"${cpc_code}"`);
        }
        
        if (uspc_code) {
          queryParts.push(`USPC:"${uspc_code}"`);
        }
        
        if (technology_area) {
          queryParts.push(`"${technology_area}"`);
        }
        
        if (queryParts.length > 0) {
          query += ` ${queryParts.join(' AND ')}`;
        } else {
          // Improved fallback: structured format like original API (recent patents from current year)
          const currentYear = new Date().getFullYear();
          query += ` ("patent granted ${currentYear}" OR "patent application published ${currentYear}")`;
        }
      }
    } else if (query_type === 'inventors') {
      if (inventor_name) {
        query += ` inventor:"${inventor_name}"`;
      } else if (search_text) {
        query += ` inventor:"${search_text}"`;
      } else {
        // Improved fallback: prolific inventors with explicit patent count indicators
        query += ' (inventor "patents filed" OR "prolific inventor") ("10 patents" OR "20 patents" OR "50 patents")';
      }
    } else if (query_type === 'assignees') {
      if (assignee_organization) {
        query += ` assignee:"${assignee_organization}"`;
      } else if (search_text) {
        query += ` assignee:"${search_text}"`;
      } else {
        // Improved fallback: established assignees with portfolio/leading filer indicators
        query += ' (patent assignee) ("100 patents" OR "patent portfolio" OR "leading patent filer")';
      }
    }

    // Add date filtering if provided
    if (patent_date_start) {
      query += ` after:${patent_date_start}`;
    }
    if (patent_date_end) {
      query += ` before:${patent_date_end}`;
    }

    return query.trim();
  }

  // ===== Phase 1: Foundation Methods (Precision Extraction) =====

  /**
   * Extract US patent number with permissive approach
   * Returns best available data with confidence scoring
   * @param {Object} result - Search result
   * @returns {Object} Patent number data with metadata
   */
  extractPatentNumberPrecise(result) {
    const text = (result.text || '') + ' ' + (result.title || '');
    const highlights = (result.highlights || []).join(' ');
    const allText = text + ' ' + highlights;

    const extractionResult = {
      patent_number: null,
      confidence: 0,
      format_valid: false,
      source: null,
      raw_matches: []
    };

    if (!allText.trim()) return extractionResult;

    // Try exact format first (highest confidence)
    const exactPattern = /US\d{7,8}[A-Z]*\d*/g;
    const exactMatches = allText.match(exactPattern);

    if (exactMatches && exactMatches.length > 0) {
      const patentNumber = exactMatches[0];
      const digitMatch = patentNumber.match(/US(\d+)/);
      if (digitMatch && digitMatch[1].length >= 7) {
        extractionResult.patent_number = patentNumber;
        extractionResult.confidence = 1.0;
        extractionResult.format_valid = true;
        extractionResult.source = 'exact_regex';
        extractionResult.raw_matches = exactMatches;
        return extractionResult;
      }
    }

    // Try flexible patterns (medium confidence)
    const flexiblePatterns = [
      /US[\s,]*(\d{7,8})[\s,]*([A-Z]*\d*)/gi,  // "US 7,654,321 B2"
      /Patent[\s#]*(\d{7,8})[\s,]*([A-Z]*\d*)/gi,  // "Patent 7654321B2"
      /(\d{7,8})[\s,]*([A-Z]*\d*)[\s,]*patent/gi   // "7654321B2 patent"
    ];

    for (const pattern of flexiblePatterns) {
      const matches = [...allText.matchAll(pattern)];
      if (matches && matches.length > 0) {
        const match = matches[0];
        let cleanNumber = 'US' + match[1].replace(/[,\s]/g, '');
        if (match[2]) cleanNumber += match[2].replace(/[,\s]/g, '');

        if (match[1].length >= 7) {
          extractionResult.patent_number = cleanNumber;
          extractionResult.confidence = 0.7;
          extractionResult.format_valid = false;
          extractionResult.source = 'flexible_regex';
          extractionResult.raw_matches = matches.map(m => m[0]);
          return extractionResult;
        }
      }
    }

    // Try very loose patterns (low confidence but better than nothing)
    const loosePattern = /(\d{7,8})/g;
    const looseMatches = allText.match(loosePattern);

    if (looseMatches && looseMatches.length > 0) {
      const numberOnly = looseMatches[0];
      if (numberOnly.length >= 7) {
        extractionResult.patent_number = 'US' + numberOnly;
        extractionResult.confidence = 0.3;
        extractionResult.format_valid = false;
        extractionResult.source = 'number_only';
        extractionResult.raw_matches = looseMatches;
        return extractionResult;
      }
    }

    // Last resort: check if title/highlights contain patent-like references
    if (/patent|US|application/i.test(allText) && /\d{6,}/g.test(allText)) {
      const numbers = allText.match(/\d{6,}/g);
      if (numbers && numbers[0]) {
        extractionResult.patent_number = numbers[0];
        extractionResult.confidence = 0.1;
        extractionResult.format_valid = false;
        extractionResult.source = 'fallback';
        extractionResult.raw_matches = numbers;
        return extractionResult;
      }
    }

    return extractionResult;
  }

  /**
   * Extract patent classifications with permissive approach
   * Returns partial matches and confidence metadata
   * @param {Object} result - Search result
   * @returns {Object} Classification data with metadata
   */
  extractClassificationsPrecise(result) {
    const text = (result.text || '') + ' ' + (result.title || '');
    const highlights = (result.highlights || []).join(' ');
    const allText = text + ' ' + highlights;

    const classifications = {
      cpc: [],
      uspc: [],
      ipc: [],
      _metadata: {
        cpc_confidence: 0,
        uspc_confidence: 0,
        ipc_confidence: 0,
        raw_classifications: []
      }
    };

    if (!allText.trim()) return classifications;

    // CPC Classification extraction with multiple patterns
    const cpcPatterns = [
      // Exact format: H04L12/58
      /(?:CPC[:\s]*)?([A-HY]\d{2}[A-Z]\d{1,3}\/\d{2,4})/gi,
      // Flexible format: "H04L 12/58" or "H04L-12-58"
      /(?:CPC[:\s]*)?([A-HY]\d{2}[A-Z][\s-]*\d{1,3}[\s\/-]*\d{2,4})/gi,
      // Loose format: just the code parts
      /([A-HY]\d{2}[A-Z])\s*(\d{1,3})\s*[\/\-]\s*(\d{2,4})/gi
    ];

    let cpcFound = false;
    for (const pattern of cpcPatterns) {
      const matches = [...allText.matchAll(pattern)];
      if (matches && matches.length > 0) {
        const confidence = pattern === cpcPatterns[0] ? 1.0 : pattern === cpcPatterns[1] ? 0.7 : 0.5;

        for (const match of matches.slice(0, 10)) {
          let cleanCode;
          if (match.length === 2) {
            // Simple match
            cleanCode = match[1].replace(/[\s-]/g, '').replace(/([A-HY]\d{2}[A-Z]\d{1,3})(\d{2,4})/, '$1/$2');
          } else {
            // Complex match with parts
            cleanCode = `${match[1].replace(/[\s-]/g, '')}/${match[3]}`;
          }

          if (!classifications.cpc.includes(cleanCode)) {
            classifications.cpc.push(cleanCode);
            cpcFound = true;
          }
        }

        classifications._metadata.cpc_confidence = Math.max(classifications._metadata.cpc_confidence, confidence);
        if (cpcFound) break;
      }
    }

    // USPC Classification extraction
    const uspcPatterns = [
      // Exact format: 709/206
      /(?:USPC[:\s]*)?(\d{3}\/\d{1,3}\.?\d*)/gi,
      // Flexible format: "709-206" or "709 206"
      /(?:USPC[:\s]*)?(\d{3})[\s\/-](\d{1,3}\.?\d*)/gi,
      // Class only: 709
      /(?:Class[:\s]*)?(\d{3})(?:\s|$)/gi
    ];

    let uspcFound = false;
    for (const pattern of uspcPatterns) {
      const matches = [...allText.matchAll(pattern)];
      if (matches && matches.length > 0) {
        const confidence = pattern === uspcPatterns[0] ? 1.0 : pattern === uspcPatterns[1] ? 0.7 : 0.3;

        for (const match of matches.slice(0, 10)) {
          let cleanCode;
          if (match[2]) {
            // Two-part match
            cleanCode = `${match[1]}/${match[2]}`;
          } else {
            cleanCode = match[1];
          }

          if (!classifications.uspc.includes(cleanCode)) {
            classifications.uspc.push(cleanCode);
            uspcFound = true;
          }
        }

        classifications._metadata.uspc_confidence = Math.max(classifications._metadata.uspc_confidence, confidence);
        if (uspcFound) break;
      }
    }

    // IPC Classification extraction
    const ipcPatterns = [
      // Exact format: A61K31/4178
      /(?:IPC[:\s]*)?([A-H]\d{2}[A-Z]\d{1,3}\/\d{2,4})/gi,
      // Flexible format
      /(?:IPC[:\s]*)?([A-H]\d{2}[A-Z])[\s-]*(\d{1,3})[\s\/-]*(\d{2,4})/gi
    ];

    let ipcFound = false;
    for (const pattern of ipcPatterns) {
      const matches = [...allText.matchAll(pattern)];
      if (matches && matches.length > 0) {
        const confidence = pattern === ipcPatterns[0] ? 1.0 : 0.7;

        for (const match of matches.slice(0, 10)) {
          let cleanCode;
          if (match.length === 2) {
            cleanCode = match[1].replace(/[\s-]/g, '');
          } else {
            cleanCode = `${match[1].replace(/[\s-]/g, '')}/${match[3]}`;
          }

          if (!classifications.ipc.includes(cleanCode)) {
            classifications.ipc.push(cleanCode);
            ipcFound = true;
          }
        }

        classifications._metadata.ipc_confidence = Math.max(classifications._metadata.ipc_confidence, confidence);
        if (ipcFound) break;
      }
    }

    // Store raw classification mentions for debugging
    const allClassifications = allText.match(/(?:CPC|USPC|IPC|Class)[:\s]*[A-HY]?\d+[A-Z]?[\s\/-]*\d*/gi);
    if (allClassifications) {
      classifications._metadata.raw_classifications = allClassifications.slice(0, 20);
    }

    return classifications;
  }

  /**
   * Extract patent status with confidence scoring
   * @param {Object} result - Search result
   * @returns {Object} Status data with confidence metadata
   */
  extractPatentStatusPrecise(result) {
    const text = (result.text || '') + ' ' + (result.title || '');
    const highlights = (result.highlights || []).join(' ');
    const allText = (text + ' ' + highlights).toLowerCase();

    const status = {
      active: false,
      expired: false,
      abandoned: false,
      pending: false,
      unknown: false,
      _metadata: {
        confidence: 0,
        detected_terms: [],
        source: null
      }
    };

    if (!allText.trim()) {
      status.unknown = true;
      return status;
    }

    // High confidence status terms
    const highConfidenceTerms = {
      expired: /(?:patent\s+)?(?:has\s+)?expired|(?:patent\s+)?lapsed|(?:patent\s+)?terminated/i,
      abandoned: /(?:application\s+)?abandoned|(?:patent\s+)?withdrawn|(?:application\s+)?disclaimed/i,
      pending: /(?:application\s+)?pending|provisional\s+application|patent\s+application|under\s+examination/i,
      active: /(?:patent\s+)?(?:is\s+)?active|(?:patent\s+)?enforceable|(?:patent\s+)?granted|(?:patent\s+)?issued|in\s+force/i
    };

    // Medium confidence status terms
    const mediumConfidenceTerms = {
      expired: /no\s+longer\s+valid|patent\s+ended/i,
      abandoned: /discontinued|not\s+pursued/i,
      pending: /awaiting|examination|review/i,
      active: /valid|current|maintained/i
    };

    // Check high confidence terms first
    for (const [statusType, pattern] of Object.entries(highConfidenceTerms)) {
      const matches = allText.match(pattern);
      if (matches) {
        status[statusType] = true;
        status._metadata.confidence = 0.9;
        status._metadata.detected_terms = matches;
        status._metadata.source = 'high_confidence';
        return status;
      }
    }

    // Check medium confidence terms
    for (const [statusType, pattern] of Object.entries(mediumConfidenceTerms)) {
      const matches = allText.match(pattern);
      if (matches) {
        status[statusType] = true;
        status._metadata.confidence = 0.6;
        status._metadata.detected_terms = matches;
        status._metadata.source = 'medium_confidence';
        return status;
      }
    }

    // Contextual inference (low confidence)
    const contextualClues = [
      { pattern: /\d{4}[-\s]?\d{4}|\d{4}\s*-\s*present/i, status: 'active', confidence: 0.3 }, // Date ranges
      { pattern: /filed|filing\s+date/i, status: 'pending', confidence: 0.2 }, // Filing mentions
      { pattern: /prior\s+art|citation/i, status: 'active', confidence: 0.2 }, // Referenced patents usually active
    ];

    for (const clue of contextualClues) {
      if (clue.pattern.test(allText)) {
        status[clue.status] = true;
        status._metadata.confidence = clue.confidence;
        status._metadata.detected_terms = [allText.match(clue.pattern)[0]];
        status._metadata.source = 'contextual';
        return status;
      }
    }

    // Default to unknown with low confidence
    status.unknown = true;
    status._metadata.confidence = 0.1;
    status._metadata.source = 'no_indicators';

    return status;
  }

  /**
   * Extract patent metadata from search result
   */
  extractPatentMetadata(result) {
    const metadata = {
      patent_id: null,
      patent_title: result.title || '',
      patent_number: null,
      publication_date: null,
      inventors: [],
      assignee_organization: null,
      assignees: [],
      cpc_classifications: [],
      uspc_classifications: [],
      ipc_classifications: [],
      abstract: null,
      url: result.url || ''
    };

    const text = result.text || '';
    const title = result.title || '';

    // Extract patent number (US########, US########A1, US########B2, etc.)
    const patentNumberMatch = text.match(/US\d{7,8}[A-Z]*\d*/g) || title.match(/US\d{7,8}[A-Z]*\d*/g);
    if (patentNumberMatch) {
      metadata.patent_number = patentNumberMatch[0];
      metadata.patent_id = patentNumberMatch[0];
    }

    // Extract publication/issue date
    const datePatterns = [
      /(?:Publication|Issue|Grant)\s*Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
      /(?:Published|Issued|Granted)[:\s]*(\w+\s+\d{1,2},?\s+\d{4})/i,
      /Date[:\s]*(\d{2}\/\d{2}\/\d{4})/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.publication_date = match[1];
        break;
      }
    }

    // Extract inventors
    const inventorPattern = /(?:Inventor[s]?[:\s]+)([^;\n]+(?:;[^;\n]+)*)/i;
    const inventorMatch = text.match(inventorPattern);
    if (inventorMatch) {
      const inventorStr = inventorMatch[1];
      // Split by semicolon first (typical USPTO format), then by newlines
      const inventorList = inventorStr.split(/;|\n/).map(inv => inv.trim()).filter(inv => inv);
      
      const inventors = inventorList.map(name => {
        const trimmed = name.trim();
        // Handle format: "Last, First (Location)" or "First Last"
        let inventorName = trimmed.replace(/\([^)]*\)/, '').trim(); // Remove location
        
        if (inventorName.includes(',')) {
          // Format: "Last, First" 
          const [last, first] = inventorName.split(',').map(n => n.trim());
          return {
            inventor_name_last: last,
            inventor_name_first: first
          };
        } else {
          // Format: "First Last"
          const parts = inventorName.split(/\s+/);
          if (parts.length >= 2) {
            return {
              inventor_name_last: parts[parts.length - 1],
              inventor_name_first: parts.slice(0, -1).join(' ')
            };
          }
          return { inventor_name_last: inventorName, inventor_name_first: '' };
        }
      }).filter(inv => inv.inventor_name_last && inv.inventor_name_last.length > 1);
      
      metadata.inventors = inventors.slice(0, 5); // Limit to 5 inventors
    }

    // Extract assignee
    const assigneePattern = /(?:Assignee[:\s]+)([^;\n]+)/i;
    const assigneeMatch = text.match(assigneePattern);
    if (assigneeMatch) {
      const assignee = assigneeMatch[1].trim();
      metadata.assignee_organization = assignee;
      metadata.assignees = [{ assignee_organization: assignee }];
    }

    // Extract CPC classifications
    const cpcPattern = /CPC[:\s]*([A-HY]\d{2}[A-Z]\d{1,3}\/\d{2,4})/gi;
    const cpcMatches = text.match(cpcPattern);
    if (cpcMatches) {
      metadata.cpc_classifications = cpcMatches.slice(0, 10).map(cpc => cpc.replace(/^CPC[:\s]*/, ''));
    }

    // Extract USPC classifications  
    const uspcPattern = /USPC[:\s]*(\d{3}\/\d{1,3}\.?\d*)/gi;
    const uspcMatches = text.match(uspcPattern);
    if (uspcMatches) {
      metadata.uspc_classifications = uspcMatches.slice(0, 10).map(uspc => uspc.replace(/^USPC[:\s]*/, ''));
    }

    // Extract abstract
    const abstractPattern = /(?:ABSTRACT|Abstract)[:\s]*\n?\s*([^]+?)(?:\n\s*(?:BACKGROUND|Claims|Field|CLAIMS)|$)/i;
    const abstractMatch = text.match(abstractPattern);
    if (abstractMatch) {
      metadata.abstract = abstractMatch[1].trim().substring(0, 500);
    }

    return metadata;
  }

  // ===== Phase 2: Hybrid Extraction Method =====

  /**
   * Extract patent metadata using hybrid approach
   * Combines precision regex for identifiers with AI extraction for descriptive content
   * @param {Object} result - Search result with highlights
   * @returns {Object} Hybrid extracted metadata
   */
  extractPatentMetadataHybrid(result) {
    if (!result) {
      return {
        patent_number: null,
        patent_id: null,
        _extraction_method: 'hybrid',
        _quality: { relevance_score: 0, confidence: 0 }
      };
    }

    // Step 1: Permissive extraction for identifiers (with confidence metadata)
    const patentNumberData = this.extractPatentNumberPrecise(result);
    const classificationsData = this.extractClassificationsPrecise(result);
    const statusData = this.extractPatentStatusPrecise(result);

    // Step 2: Extract descriptive content using regex-based extraction
    let inventors = [];
    let assignees = [];
    let publicationDate = null;
    let abstract = null;

    const text = result.text || '';

    // Extract inventors
    const inventorMatch = text.match(/inventor[s]?[:\s]+([^;\n]+)/i);
    if (inventorMatch) {
      inventors = [{
        inventor_name_first: '',
        inventor_name_last: inventorMatch[1].trim().split(',')[0] || 'Unknown'
      }];
    }

    // Extract assignees
    const assigneeMatch = text.match(/assignee[:\s]+([^;\n]+)/i);
    if (assigneeMatch) {
      assignees = [{ assignee_organization: assigneeMatch[1].trim() }];
    }

    // Date extraction
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      publicationDate = dateMatch[1];
    }

    // Abstract extraction
    const abstractMatch = text.match(/abstract[:\s]*([^]{0,500})/i);
    if (abstractMatch) {
      abstract = abstractMatch[1].trim();
    }

    // Step 3: Quality assessment (now less punitive)
    const quality = this.assessPatentRelevance(result);

    // Step 4: Combine all data with confidence metadata
    return {
      // Precision fields (with confidence metadata)
      patent_number: patentNumberData.patent_number,
      patent_id: patentNumberData.patent_number,
      cpc_classifications: classificationsData.cpc,
      uspc_classifications: classificationsData.uspc,
      ipc_classifications: classificationsData.ipc,
      status: statusData,

      // AI-extracted fields (flexible descriptive content)
      inventors: inventors,
      assignees: assignees,
      assignee_organization: assignees[0]?.assignee_organization || null,
      publication_date: publicationDate,
      abstract: abstract,

      // Standard metadata
      patent_title: result.title || '',
      url: result.url || '',
      score: result.score || null,

      // Quality assessment and confidence metadata
      _quality: quality,
      _extraction_method: 'hybrid',
      _confidence_scores: {
        patent_number: patentNumberData.confidence,
        classifications: {
          cpc: classificationsData._metadata?.cpc_confidence || 0,
          uspc: classificationsData._metadata?.uspc_confidence || 0,
          ipc: classificationsData._metadata?.ipc_confidence || 0
        },
        status: statusData._metadata?.confidence || 0
      },
      _extraction_metadata: {
        patent_number_source: patentNumberData.source,
        patent_format_valid: patentNumberData.format_valid,
        classification_raw: classificationsData._metadata?.raw_classifications || [],
        status_detected_terms: statusData._metadata?.detected_terms || []
      }
    };
  }

  /**
   * Extract smart snippet prioritizing technical patent content
   */
  extractSmartSnippet(text, maxLength = 500) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Clean and normalize text
    let cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Patent content priority order
    const priorityPatterns = [
      // 1. Abstract (highest priority for patents)
      {
        pattern: /(?:ABSTRACT|Abstract)[:\s]*\n?\s*([^]+?)(?:\n\s*(?:BACKGROUND|Claims|Field|CLAIMS)|$)/i,
        label: 'ABSTRACT'
      },
      // 2. First independent claim
      {
        pattern: /(?:CLAIMS?|What is claimed)[:\s]*\n?\s*1\.?\s*([^]+?)(?:\n\s*2\.|$)/i,
        label: 'CLAIM 1'
      },
      // 3. Technical field
      {
        pattern: /(?:TECHNICAL FIELD|Field of (?:the )?Invention)[:\s]*\n?\s*([^]+?)(?:\n\s*(?:BACKGROUND|SUMMARY)|$)/i,
        label: 'TECHNICAL FIELD'
      },
      // 4. Brief summary
      {
        pattern: /(?:BRIEF SUMMARY|Summary)[:\s]*\n?\s*([^]+?)(?:\n\s*(?:BACKGROUND|DETAILED)|$)/i,
        label: 'SUMMARY'
      },
      // 5. Background (fallback)
      {
        pattern: /(?:BACKGROUND|Background)[:\s]*\n?\s*([^]+?)(?:\n\s*(?:SUMMARY|DETAILED)|$)/i,
        label: 'BACKGROUND'
      }
    ];

    // Try to find priority content
    for (const { pattern, label } of priorityPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let snippet = match[1].trim();
        
        // Clean up common artifacts
        snippet = snippet
          .replace(/\[[^\]]*\]/g, '') // Remove reference numbers [1], [2]
          .replace(/\(\d+\)/g, '')    // Remove parenthetical numbers
          .replace(/\s+/g, ' ')       // Normalize whitespace
          .trim();
        
        if (snippet.length > 50) { // Ensure meaningful content
          if (snippet.length > maxLength) {
            snippet = snippet.substring(0, maxLength - 3) + '...';
          }
          return snippet;
        }
      }
    }

    // Fallback: Extract first meaningful paragraph
    const paragraphs = cleanText.split(/\n\s*\n/);
    for (const paragraph of paragraphs) {
      const cleaned = paragraph.trim();
      if (cleaned.length > 50 && !cleaned.match(/^(?:US\d+|Patent|Copyright|Figure)/i)) {
        let snippet = cleaned;
        if (snippet.length > maxLength) {
          snippet = snippet.substring(0, maxLength - 3) + '...';
        }
        return snippet;
      }
    }

    // Final fallback: truncate beginning of text
    if (cleanText.length > maxLength) {
      return cleanText.substring(0, maxLength - 3) + '...';
    }

    return cleanText;
  }

  /**
   * Search patents via web search
   */
  async searchPatentsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      query_type = 'patents',
      search_text,
      assignee_organization,  
      inventor_name,
      patent_date_start,
      patent_date_end,
      technology_area,
      limit,
      include_snippet = false,
      include_text = false
    } = args;

    // Preserve provided inputs; rely on buildPatentQuery() fallbacks when inputs are absent
    let finalSearchText = search_text;
    let finalAssigneeOrganization = assignee_organization;
    let finalInventorName = inventor_name;
    let finalTechnologyArea = technology_area;

    // Smart default limits based on content type requested
    let finalLimit = limit;
    if (finalLimit === undefined) {
      if (include_text === true) {
        finalLimit = 3;   // Full text: small, targeted
      } else if (include_snippet === true) {
        finalLimit = 10;  // Snippets: moderate discovery
      } else {
        finalLimit = 15;  // Metadata only: broader search
      }
    }

    // Validate inputs
    const validatedLimit = validateLimit(finalLimit, 100);

    // Validate dates if provided
    if (patent_date_start) {
      validateDate(patent_date_start, 'start date');
    }
    if (patent_date_end) {
      validateDate(patent_date_end, 'end date');
    }

    try {
      // Build patent-specific query with processed parameters
      const query = this.buildPatentQuery({
        query_type,
        search_text: finalSearchText,
        assignee_organization: finalAssigneeOrganization,
        inventor_name: finalInventorName, 
        patent_date_start,
        patent_date_end,
        technology_area: finalTechnologyArea,
        include_google: true
      });

      // Determine which summary query to use based on query type
      const summaryQuery = query_type === 'litigation'
        ? 'invalidity obviousness anticipation infringement PTAB IPR CBM PGR inter partes review covered business method post grant review'
        : query_type === 'technical'
        ? 'specification disclosure enablement best mode utility novelty non-obvious inventive step technical field background'
        : 'patent number US inventor assignee claims prior art priority filing date classification CPC USPC abstract embodiment figures specification';

      // Execute Exa search using inherited BaseWebSearchClient method
      const exaResults = await super.executeExaSearch(query, validatedLimit, {
        dataType: 'uspto_patent',
        includeDomains: this.domains,
        domain: 'patents',
        summaryQuery: summaryQuery,
        numSentences: 8,
        includeFullText: include_text  // Only fetch full text if explicitly requested
      });

      // Apply patent-specific post-processing
      const processedResults = this.processPatentResults(exaResults, query_type, include_snippet, include_text);

      return {
        content: [{
          type: "text", 
          text: JSON.stringify({
            query_type,
            search_type: 'uspto_patents_web',
            total_results: processedResults.length,
            results: processedResults,
            search_criteria: args
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('USPTO patents web search error:', error);
      throw new Error(`USPTO patents web search failed: ${error.message}`);
    }
  }

  // ===== Phase 3: Quality Assessment =====

  /**
   * Assess patent relevance and quality
   * Helps distinguish actual patents from policy documents
   * @param {Object} result - Search result
   * @returns {Object} Quality assessment
   */
  assessPatentRelevance(result) {
    const text = (result.text || '').toLowerCase();
    const title = (result.title || '').toLowerCase();
    const url = (result.url || '').toLowerCase();

    const quality = {
      relevance_score: 0,
      is_actual_patent: false,
      has_patent_number: false,
      has_claims: false,
      has_technical_content: false,
      is_policy_document: false,
      confidence: 0
    };

    // Check for patent number indicators (more permissive)
    const hasPatentNumber = /(?:us|patent)\s*\d{6,8}|application\s*\d{6,8}|\d{7,8}[a-z]\d*/i.test(text + ' ' + title);
    const hasStrongPatentNumber = /us\d{7,8}[a-z]*\d*/i.test(text + ' ' + title);

    if (hasStrongPatentNumber) {
      quality.has_patent_number = true;
      quality.relevance_score += 30; // Reduced from 40
      quality.is_actual_patent = true;
    } else if (hasPatentNumber) {
      quality.has_patent_number = true;
      quality.relevance_score += 15; // Partial credit for patent-like numbers
    }

    // Check for patent structure elements
    if (/\bclaim[s]?\b/.test(text) || /what is claimed/.test(text)) {
      quality.has_claims = true;
      quality.relevance_score += 20;
    }

    if (/abstract|invention|embodiment|figure|drawing/.test(text)) {
      quality.has_technical_content = true;
      quality.relevance_score += 15;
    }

    // Check for patent-specific terminology
    const patentTerms = /inventor|assignee|filing date|grant date|prior art|specification/.test(text);
    if (patentTerms) {
      quality.relevance_score += 10;
    }

    // Detect policy documents (less punitive, more specific)
    const strongPolicyIndicators = [
      /uspto\s+(?:policy|procedure|manual)/i,
      /examination\s+guideline/i,
      /federal\s+register/i,
      /rule\s+change/i,
      /administrative\s+(?:notice|procedure)/i
    ];

    const weakPolicyIndicators = [
      /patent\s+office(?!\s+patent)/i, // "patent office" but not "patent office patent"
      /trademark\s+office/i
    ];

    // Strong policy document indicators
    for (const indicator of strongPolicyIndicators) {
      if (indicator.test(text + ' ' + title)) {
        quality.is_policy_document = true;
        quality.relevance_score -= 20; // Reduced from 30
        break;
      }
    }

    // Weak policy document indicators (only apply if no patent indicators found)
    if (!quality.has_patent_number && !quality.has_claims && !quality.has_technical_content) {
      for (const indicator of weakPolicyIndicators) {
        if (indicator.test(text + ' ' + title)) {
          quality.is_policy_document = true;
          quality.relevance_score -= 10; // Much more lenient
          break;
        }
      }
    }

    // URL-based assessment
    if (url.includes('patents.google.com') || url.includes('patent')) {
      quality.relevance_score += 10;
    }
    if (url.includes('policy') || url.includes('guideline') || url.includes('admin')) {
      quality.relevance_score -= 20;
      quality.is_policy_document = true;
    }

    // Calculate final confidence
    quality.relevance_score = Math.max(0, Math.min(100, quality.relevance_score));
    quality.confidence = quality.relevance_score / 100;

    // Final determination (more permissive thresholds)
    if (quality.relevance_score >= 40) { // Lowered from 60
      quality.is_actual_patent = true;
    } else if (quality.relevance_score <= 15) { // Lowered from 30
      quality.is_actual_patent = false;
    }
    // Results between 15-40 remain ambiguous (not explicitly false)

    return quality;
  }

  /**
   * Sort and flag results by patent relevance (advisory, not blocking)
   * @param {Array} results - Array of results with quality assessments
   * @param {number} flagThreshold - Confidence threshold for flagging (0-1)
   * @returns {Array} All results sorted with quality flags
   */
  filterLowQualityResults(results, flagThreshold = 0.1) {
    if (!results || results.length === 0) return [];

    return results
      .map(result => {
        const quality = result._quality || { confidence: 0 };

        // Add advisory flags instead of filtering out results
        result._advisory_flags = [];

        if (quality.confidence < flagThreshold) {
          result._advisory_flags.push('very_low_confidence');
        } else if (quality.confidence < 0.3) {
          result._advisory_flags.push('low_confidence');
        }

        if (quality.is_policy_document) {
          result._advisory_flags.push('likely_policy_document');
        }

        if (!result.patent_number) {
          result._advisory_flags.push('no_patent_number');
        }

        if (!result.inventors || result.inventors.length === 0) {
          result._advisory_flags.push('no_inventors');
        }

        // Mark results as potentially useful even if flagged
        result._display_priority = quality.confidence > 0.5 ? 'high' :
                                  quality.confidence > 0.2 ? 'medium' : 'low';

        return result;
      })
      .sort((a, b) => {
        // Sort by relevance score but keep all results
        const aScore = (a._quality?.relevance_score || 0);
        const bScore = (b._quality?.relevance_score || 0);
        return bScore - aScore; // Sort by relevance score descending
      });
  }

  /**
   * Process patent results with domain-specific enhancements
   * @param {Array} results - Raw results from executeExaSearch
   * @param {string} queryType - Type of patent query
   * @param {boolean} includeSnippet - Whether to include snippets
   * @param {boolean} includeText - Whether to include full text
   * @returns {Array} Enhanced patent results
   */
  processPatentResults(results, queryType = 'patents', includeSnippet = false, includeText = false) {
    if (!results || results.length === 0) return [];

    // Extract metadata using permissive hybrid approach
    const extractedResults = results.map(result => {
      // Use NEW hybrid extraction method (always returns data)
      const metadata = this.extractPatentMetadataHybrid(result);

      // Extract additional patent-specific information
      const citations = this.extractPatentCitations(result);

      // Build enhanced result with patent-specific structure
      return {
        patent_id: metadata.patent_id,
        patent_title: metadata.patent_title,
        patent_number: metadata.patent_number,
        patent_date: metadata.publication_date,
        inventors: metadata.inventors,
        assignees: metadata.assignees,
        assignee_organization: metadata.assignee_organization,
        cpc_classifications: metadata.cpc_classifications,
        uspc_classifications: metadata.uspc_classifications,
        ipc_classifications: metadata.ipc_classifications,
        abstract: metadata.abstract,
        url: metadata.url || result.url,
        patent_status: metadata.status,
        citations: citations,
        query_type: queryType,
        score: metadata.score,

        // Quality and confidence metadata
        _quality: metadata._quality,
        _extraction_method: metadata._extraction_method,
        _confidence_scores: metadata._confidence_scores,
        _extraction_metadata: metadata._extraction_metadata,
        _highlight_quality: result._highlight_quality,

        // Keep reference to original result for additional processing
        _originalResult: result
      };
    }); // NO MORE .filter(Boolean) - keep all results!

    // Apply advisory quality assessment (no longer blocks results)
    const flaggedResults = this.filterLowQualityResults(extractedResults, 0.05);

    return flaggedResults.map(processedResult => {
      // Get original result for additional processing
      const originalResult = processedResult._originalResult;

      // COMPACT MODE: Return minimal fields when full text not requested
      // Reduces token usage from ~10,000 to ~200 per result
      if (!includeText && !includeSnippet) {
        return {
          patent_id: processedResult.patent_id,
          patent_number: processedResult.patent_number,
          patent_title: processedResult.patent_title,
          patent_date: processedResult.patent_date,
          assignee_organization: processedResult.assignee_organization,
          url: processedResult.url,
          snippet: (originalResult.highlights?.join(' ... ') || processedResult.abstract || '').slice(0, 400),
          query_type: queryType
        };
      }

      // Add snippet if requested (use existing abstract or extract new one)
      if (includeSnippet) {
        if (!processedResult.abstract && (originalResult.highlights || originalResult.text)) {
          processedResult.snippet = this.extractSmartSnippet(
            originalResult.highlights ? originalResult.highlights.join(' ') : originalResult.text
          );
        } else {
          processedResult.snippet = processedResult.abstract || '';
        }
      }

      // Add full text if requested
      if (includeText && originalResult.text) {
        processedResult.full_text = originalResult.text;
      }

      // Add query-specific enhancements
      if (queryType === 'litigation') {
        processedResult.litigation_info = this.extractLitigationInfo(originalResult);
      } else if (queryType === 'technical') {
        processedResult.technical_details = this.extractTechnicalDetails(originalResult);
      }

      // Clean up temporary fields
      delete processedResult._originalResult;

      return processedResult;
    });
  }

  /**
   * Determine patent status from result content
   */
  determinePatentStatus(result) {
    const text = (result.highlights || []).join(' ') + ' ' + (result.text || '');
    
    const status = {
      active: false,
      expired: false,
      abandoned: false,
      pending: false
    };
    
    if (/expired|lapsed|terminated/i.test(text)) {
      status.expired = true;
    } else if (/abandoned|withdrawn/i.test(text)) {
      status.abandoned = true;
    } else if (/pending|application|provisional/i.test(text)) {
      status.pending = true;
    } else if (/active|enforceable|granted/i.test(text)) {
      status.active = true;
    }
    
    return status;
  }

  /**
   * Extract patent citations using Exa highlights
   */
  extractPatentCitations(result) {
    const citations = [];
    const text = (result.highlights || []).join(' ');
    
    // US Patent citations
    const usPatterns = text.match(/US\s*\d{7,8}[A-Z]*\d*/gi) || [];
    citations.push(...usPatterns.map(p => ({
      type: 'us_patent',
      number: p.replace(/\s/g, '')
    })));
    
    // Foreign patents
    const foreignPatterns = text.match(/[A-Z]{2}\s*\d{7,}/gi) || [];
    citations.push(...foreignPatterns.map(p => ({
      type: 'foreign_patent',
      number: p.replace(/\s/g, '')
    })));
    
    return citations;
  }

  /**
   * Extract litigation information for litigation-focused queries
   */
  extractLitigationInfo(result) {
    const text = (result.highlights || []).join(' ') + ' ' + (result.text || '');
    
    return {
      ptab_proceedings: /PTAB|IPR|CBM|PGR/i.test(text),
      court_proceedings: /district court|federal circuit|CAFC/i.test(text),
      invalidity_claims: /invalid|obviousness|anticipation|prior art/i.test(text),
      infringement_claims: /infringement|infringing|claims/i.test(text)
    };
  }

  /**
   * Extract technical details for technical-focused queries
   */
  extractTechnicalDetails(result) {
    const text = (result.highlights || []).join(' ') + ' ' + (result.text || '');
    
    return {
      has_technical_field: /technical field|field of invention/i.test(text),
      has_background: /background|prior art/i.test(text),
      has_summary: /summary|brief summary/i.test(text),
      has_detailed_description: /detailed description|description of/i.test(text),
      has_claims: /claims|claim 1/i.test(text),
      has_figures: /fig\.|figure|drawing/i.test(text)
    };
  }

  /**
   * Search patent locations via web search
   */
  async searchPatentLocationsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      location_city,
      location_state, 
      location_country = 'US',
      min_patents = 1,
      limit,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart default limits based on content type requested
    let finalLimit = limit;
    if (finalLimit === undefined) {
      if (include_text === true) {
        finalLimit = 3;   // Full text: small, targeted
      } else if (include_snippet === true) {
        finalLimit = 10;  // Snippets: moderate discovery
      } else {
        finalLimit = 15;  // Metadata only: broader search
      }
    }

    const validatedLimit = validateLimit(finalLimit, 100);

    try {
      // Build location-focused query
      let query = '(site:uspto.gov OR site:patents.google.com)';
      
      const locationParts = [];
      if (location_city) locationParts.push(`"${location_city}"`);
      if (location_state) locationParts.push(`"${location_state}"`);
      if (location_country) locationParts.push(`"${location_country}"`);
      
      if (locationParts.length > 0) {
        query += ` (inventor location OR assignee location) ${locationParts.join(' AND ')}`;
      } else {
        query += ' inventor location OR assignee location';
      }

      const results = await this.executeExaSearch(query, validatedLimit, {
        dataType: 'uspto_patent_location',
        domain: 'patents',
        summaryQuery: 'patent inventor assignee location city state country address',
        numSentences: 6,
        includeDomains: this.domains,
        includeFullText: include_snippet || include_text
      });

      // Extract location-specific information
      const processedResults = results.map(result => {
        const metadata = this.extractPatentMetadata(result);
        const text = result.text || '';

        // Extract location information from text
        const locationInfo = {
          location_name: location_city || 'Unknown',
          location_city: location_city,
          location_state: location_state,
          location_country: location_country,
          patents_found: 1, // Individual result
          inventors_found: metadata.inventors.length,
          assignee_found: metadata.assignee_organization ? 1 : 0,
          patent_details: {
            patent_number: metadata.patent_number,
            patent_title: metadata.patent_title,
            inventors: metadata.inventors,
            assignee: metadata.assignee_organization
          }
        };

        if (include_snippet && result.text) {
          locationInfo.snippet = this.extractSmartSnippet(result.text);
        }

        if (include_text && result.text) {
          locationInfo.full_text = result.text;
        }

        return locationInfo;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            endpoint: "patent_locations_web",
            search_type: 'uspto_locations_web', 
            total_results: processedResults.length,
            results: processedResults,
            search_criteria: args
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('USPTO locations web search error:', error);
      throw new Error(`USPTO locations web search failed: ${error.message}`);
    }
  }

  /**
   * Search CPC classifications via web search
   */
  async searchCPCClassificationsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      cpc_section,
      cpc_subsection_id,
      search_text,
      limit,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart default limits based on content type requested
    let finalLimit = limit;
    if (finalLimit === undefined) {
      if (include_text === true) {
        finalLimit = 3;   // Full text: small, targeted
      } else if (include_snippet === true) {
        finalLimit = 10;  // Snippets: moderate discovery
      } else {
        finalLimit = 15;  // Metadata only: broader search
      }
    }

    const validatedLimit = validateLimit(finalLimit, 100);

    try {
      // Build CPC-specific query
      let query = '(site:uspto.gov OR site:patents.google.com) CPC';
      
      if (cpc_subsection_id) {
        query += ` "${cpc_subsection_id}"`;
      } else if (cpc_section) {
        const sectionDesc = this.cpcSections[cpc_section.toUpperCase()];
        query += ` "${cpc_section}" classification`;
        if (sectionDesc) {
          query += ` "${sectionDesc}"`;
        }
      } else if (search_text) {
        query += ` "${search_text}" classification`;
      } else {
        query += ' classification system';
      }

      const results = await this.executeExaSearch(query, validatedLimit, {
        dataType: 'uspto_patent_location',
        domain: 'patents',
        summaryQuery: 'patent inventor assignee location city state country address',
        numSentences: 6,
        includeDomains: this.domains,
        includeFullText: include_snippet || include_text
      });

      // Process CPC classification results
      const processedResults = results.map(result => {
        const metadata = this.extractPatentMetadata(result);
        const text = result.text || '';

        // Extract CPC-specific information
        const cpcInfo = {
          cpc_subclass_id: cpc_subsection_id || (cpc_section ? `${cpc_section}XX` : 'Unknown'),
          cpc_subclass_title: search_text || (this.cpcSections[cpc_section?.toUpperCase()] || 'CPC Classification'),
          cpc_section: cpc_section,
          patent_examples: [{
            patent_number: metadata.patent_number,
            patent_title: metadata.patent_title,
            cpc_codes: metadata.cpc_classifications
          }].filter(ex => ex.patent_number)
        };

        if (include_snippet && result.text) {
          cpcInfo.snippet = this.extractSmartSnippet(result.text);
        }

        if (include_text && result.text) {
          cpcInfo.full_text = result.text;
        }

        return cpcInfo;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            endpoint: "cpc_classifications_web",
            search_type: 'uspto_cpc_web',
            total_results: processedResults.length, 
            results: processedResults,
            search_criteria: args
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('CPC classifications web search error:', error);
      throw new Error(`CPC classifications web search failed: ${error.message}`);
    }
  }

  /**
   * Search CPC groups via web search
   */
  async searchCPCGroupsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      cpc_group_id,
      cpc_subclass_id,
      search_text,
      limit,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart default limits based on content type requested
    let finalLimit = limit;
    if (finalLimit === undefined) {
      if (include_text === true) {
        finalLimit = 3;   // Full text: small, targeted
      } else if (include_snippet === true) {
        finalLimit = 10;  // Snippets: moderate discovery
      } else {
        finalLimit = 15;  // Metadata only: broader search
      }
    }

    const validatedLimit = validateLimit(finalLimit, 100);

    try {
      // Build CPC group-specific query
      let query = '(site:uspto.gov OR site:patents.google.com) CPC group';
      
      if (cpc_group_id) {
        query += ` "${cpc_group_id}"`;
      } else if (cpc_subclass_id) {
        query += ` "${cpc_subclass_id}" subclass`;
      } else if (search_text) {
        query += ` "${search_text}"`;
      }

      const results = await this.executeExaSearch(query, validatedLimit, {
        dataType: 'uspto_patent_location',
        domain: 'patents',
        summaryQuery: 'patent inventor assignee location city state country address',
        numSentences: 6,
        includeDomains: this.domains,
        includeFullText: include_snippet || include_text
      });

      // Process CPC group results
      const processedResults = results.map(result => {
        const metadata = this.extractPatentMetadata(result);

        const groupInfo = {
          cpc_group_id: cpc_group_id || 'Unknown',
          cpc_group_title: search_text || 'CPC Group',
          cpc_subclass_id: cpc_subclass_id,
          patent_examples: [{
            patent_number: metadata.patent_number,
            patent_title: metadata.patent_title,
            cpc_codes: metadata.cpc_classifications
          }].filter(ex => ex.patent_number)
        };

        if (include_snippet && result.text) {
          groupInfo.snippet = this.extractSmartSnippet(result.text);
        }

        if (include_text && result.text) {
          groupInfo.full_text = result.text;
        }

        return groupInfo;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            endpoint: "cpc_groups_web",
            search_type: 'uspto_cpc_groups_web',
            total_results: processedResults.length,
            results: processedResults,
            search_criteria: args
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('CPC groups web search error:', error);
      throw new Error(`CPC groups web search failed: ${error.message}`);
    }
  }

  /**
   * Search USPC classifications via web search
   */
  async searchUSPCClassificationsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      classification_type = 'mainclass',
      uspc_mainclass_id,
      search_text,
      limit,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart default limits based on content type requested
    let finalLimit = limit;
    if (finalLimit === undefined) {
      if (include_text === true) {
        finalLimit = 3;   // Full text: small, targeted
      } else if (include_snippet === true) {
        finalLimit = 10;  // Snippets: moderate discovery
      } else {
        finalLimit = 15;  // Metadata only: broader search
      }
    }

    const validatedLimit = validateLimit(finalLimit, 100);

    try {
      // Build USPC-specific query
      let query = '(site:uspto.gov OR site:patents.google.com) USPC';
      
      if (uspc_mainclass_id) {
        query += ` "${uspc_mainclass_id}"`;
        const classDesc = this.uspcMajorClasses[uspc_mainclass_id];
        if (classDesc) {
          query += ` "${classDesc}"`;
        }
      } else if (search_text) {
        query += ` "${search_text}" classification`;
      } else {
        query += ' classification system';
      }

      const results = await this.executeExaSearch(query, validatedLimit, {
        dataType: 'uspto_patent_location',
        domain: 'patents',
        summaryQuery: 'patent inventor assignee location city state country address',
        numSentences: 6,
        includeDomains: this.domains,
        includeFullText: include_snippet || include_text
      });

      // Process USPC results
      const resultKey = classification_type === 'mainclass' ? 'uspc_mainclasses' : 'uspc_subclasses';
      const processedResults = results.map(result => {
        const metadata = this.extractPatentMetadata(result);

        const uspcInfo = {
          uspc_mainclass_id: uspc_mainclass_id || 'Unknown',
          uspc_mainclass_title: search_text || this.uspcMajorClasses[uspc_mainclass_id] || 'USPC Classification',
          patent_examples: [{
            patent_number: metadata.patent_number,
            patent_title: metadata.patent_title,
            uspc_codes: metadata.uspc_classifications
          }].filter(ex => ex.patent_number)
        };

        if (include_snippet && result.text) {
          uspcInfo.snippet = this.extractSmartSnippet(result.text);
        }

        if (include_text && result.text) {
          uspcInfo.full_text = result.text;
        }

        return uspcInfo;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            endpoint: `uspc_${classification_type}_web`,
            search_type: 'uspto_uspc_web',
            total_results: processedResults.length,
            [resultKey]: processedResults,
            search_criteria: args
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('USPC classifications web search error:', error);
      throw new Error(`USPC classifications web search failed: ${error.message}`);
    }
  }

  /**
   * Search WIPO classifications via web search  
   */
  async searchWIPOClassificationsWeb(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }

    const {
      wipo_field_id,
      search_text,
      limit,
      include_snippet = false,
      include_text = false
    } = args;

    // Smart default limits based on content type requested
    let finalLimit = limit;
    if (finalLimit === undefined) {
      if (include_text === true) {
        finalLimit = 3;   // Full text: small, targeted
      } else if (include_snippet === true) {
        finalLimit = 10;  // Snippets: moderate discovery
      } else {
        finalLimit = 15;  // Metadata only: broader search
      }
    }

    const validatedLimit = validateLimit(finalLimit, 100);

    try {
      // Build WIPO/IPC-specific query
      let query = '(site:uspto.gov OR site:patents.google.com) (IPC OR "International Patent Classification" OR WIPO)';
      
      if (wipo_field_id) {
        query += ` "${wipo_field_id}"`;
        const fieldDesc = this.wipoFields[wipo_field_id];
        if (fieldDesc) {
          query += ` "${fieldDesc}"`;
        }
      } else if (search_text) {
        query += ` "${search_text}"`;
      }

      const results = await this.executeExaSearch(query, validatedLimit, {
        dataType: 'uspto_patent_location',
        domain: 'patents',
        summaryQuery: 'patent inventor assignee location city state country address',
        numSentences: 6,
        includeDomains: this.domains,
        includeFullText: include_snippet || include_text
      });

      // Process WIPO results
      const processedResults = results.map(result => {
        const metadata = this.extractPatentMetadata(result);

        const wipoInfo = {
          wipo_id: wipo_field_id || 'Unknown',
          field_title: search_text || this.wipoFields[wipo_field_id] || 'WIPO Technology Field',
          sector_title: 'Patent Technology Classification',
          patent_examples: [{
            patent_number: metadata.patent_number,
            patent_title: metadata.patent_title,
            ipc_codes: metadata.ipc_classifications
          }].filter(ex => ex.patent_number)
        };

        if (include_snippet && result.text) {
          wipoInfo.snippet = this.extractSmartSnippet(result.text);
        }

        if (include_text && result.text) {
          wipoInfo.full_text = result.text;
        }

        return wipoInfo;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            endpoint: "wipo_classifications_web",
            search_type: 'uspto_wipo_web',
            total_results: processedResults.length,
            results: processedResults,
            search_criteria: args
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('WIPO classifications web search error:', error);
      throw new Error(`WIPO classifications web search failed: ${error.message}`);
    }
  }
}