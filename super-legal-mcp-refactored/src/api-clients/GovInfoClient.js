/**
 * GovInfo USC API Client
 * Handles all GovInfo United States Code related API calls
 */

import { makeApiRequest } from '../utils/apiHelpers.js';
import { fetchGovInfoContent } from '../utils/apiHelpers.js';
import { validateYear } from '../utils/validation.js';

export class GovInfoClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  async searchUSCode(args) {
    if (!args || typeof args !== 'object') {
      args = {};
    }
    
    const {
      title_number,
      section,
      search_text,
      year = 2023,  // Most recent USC edition is 2023
      limit = 20,
      include_full_text = false  // New parameter for full text
    } = args;

    // Check API key
    if (!process.env.GOVINFO_API_KEY) {
      throw new Error("GovInfo API key not configured. Set GOVINFO_API_KEY environment variable.");
    }

    try {
      let results = [];

      // If we have search text, use the search endpoint
      if (search_text) {
        const searchUrl = `https://api.govinfo.gov/search?api_key=${process.env.GOVINFO_API_KEY}`;
        // Build search query with collection filter
        let searchQuery = search_text;
        
        // Add collection-specific filter to limit to USC
        searchQuery = `${searchQuery} AND collection:(USCODE)`;
        
        const searchBody = {
          query: searchQuery,
          pageSize: Math.min(limit, 100),
          offsetMark: '*'
        };

        // Add title filter if specified using the proper usctitlenum field
        if (title_number) {
          searchQuery = `${searchQuery} AND usctitlenum:${title_number}`;
          searchBody.query = searchQuery;
        }

        const searchResponse = await fetch(searchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(searchBody)
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          results = searchData.results || [];
        }
      } else {
        // Use collections endpoint for browsing
        const params = new URLSearchParams();
        params.append('api_key', process.env.GOVINFO_API_KEY);
        params.append('pageSize', Math.min(limit, 100).toString());
        params.append('offsetMark', '*');
        
        // Build collection path for USC
        let collectionPath = `/collections/USCODE`;
        
        // Add date range for specific year with proper format
        if (year) {
          collectionPath += `/${year}-01-01T00:00:00Z/${year}-12-31T23:59:59Z`;
        }

        // Make API request using existing infrastructure
        const response = await makeApiRequest(
          `${collectionPath}?${params.toString()}`,
          {},
          { apiType: 'govinfo', rateLimiter: this.rateLimiter }
        );

        // Process and filter results
        results = response.packages || [];
        
        // Filter by title if specified
        if (title_number) {
          results = results.filter(pkg => 
            pkg.packageId.includes(`title${title_number}`)
          );
        }
        
        // Additional filtering if section specified
        if (section && results.length > 0) {
          results = results.filter(pkg => 
            pkg.packageId.includes(`section${section}`) ||
            pkg.title?.includes(`Section ${section}`)
          );
        }
      }

      // Process results and optionally fetch full text
      const processedResults = await Promise.all(
        results.slice(0, limit).map(async (pkg) => {
          const result = {
            package_id: pkg.packageId,
            title: pkg.title,
            collection: pkg.collectionCode,
            date_issued: pkg.dateIssued,
            last_modified: pkg.lastModified,
            package_link: pkg.packageLink,
            download_url: pkg.download?.txtLink || pkg.download?.pdfLink,
            granules_link: pkg.granulesLink
          };

          // FULL TEXT EXTRACTION TEMPORARILY DISABLED
          // Issue: USC titles are 8-20MB each, causing system overload
          // TODO: Implement granular section fetching before re-enabling
          
          // Return informative message if full text was requested
          if (include_full_text) {
            result.full_text_status = "TEMPORARILY DISABLED: USC full text extraction disabled due to file size constraints (8-20MB per title). Use download_url instead.";
          }

          return result;
        })
      );

      // Format response following existing patterns
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            search_criteria: {
              title_number,
              section,
              search_text,
              year,
              include_full_text
            },
            count: processedResults.length,
            full_text_included: include_full_text,
            results: processedResults
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('USC search error:', error);
      throw new Error(`USC search failed: ${error.message}`);
    }
  }

  async getUSCSection(args) {
    // Validate required parameters
    const { title, section, year = 2023, format = 'json' } = args;
    
    if (!title || !section) {
      throw new Error("Title and section are required");
    }
    
    // Validate title number (1-54)
    if (title < 1 || title > 54) {
      throw new Error("Invalid title number. Must be between 1 and 54");
    }

    if (!process.env.GOVINFO_API_KEY) {
      throw new Error("GovInfo API key not configured. Set GOVINFO_API_KEY environment variable.");
    }

    try {
      // Construct package ID following GovInfo pattern
      // Format: USCODE-{year}-title{number}
      const packageId = `USCODE-${year}-title${title}`;
      
      // Build request URL
      const params = new URLSearchParams();
      params.append('api_key', process.env.GOVINFO_API_KEY);
      
      // First, get the package summary to find the section
      const summaryResponse = await makeApiRequest(
        `/packages/${packageId}/summary?${params.toString()}`,
        {},
        { apiType: 'govinfo', rateLimiter: this.rateLimiter }
      );

      // Optimized granule fetching - progressive search with smart batch sizing
      let sectionGranule = null;
      let offsetMark = '*';
      let hasMore = true;
      let totalGranulesSearched = 0;
      
      // Smart batch sizing based on section number
      // Higher section numbers are typically found later in the granule list
      const sectionNum = parseInt(section.toString().match(/\d+/)?.[0] || '0');
      let batchSize;
      
      // Determine initial batch size based on section number patterns
      if (sectionNum >= 1100 && sectionNum < 1200 && title === 11) {
        // Title 11 Chapter 11 sections (1100-1199) are around position 400+
        batchSize = 500;
      } else if (sectionNum >= 1000) {
        // Higher section numbers tend to be later
        batchSize = 300;
      } else if (sectionNum >= 500) {
        // Mid-range sections
        batchSize = 200;
      } else {
        // Lower section numbers are usually early
        batchSize = 100;
      }
      
      // Search progressively, starting with the determined batch size
      while (hasMore && !sectionGranule && totalGranulesSearched < 1000) {
        const granulesParams = new URLSearchParams(params);
        granulesParams.append('pageSize', Math.min(batchSize, 600).toString()); // Max 600 per API limits
        granulesParams.append('offsetMark', offsetMark);
        
        const granulesResponse = await makeApiRequest(
          `/packages/${packageId}/granules?${granulesParams.toString()}`,
          {},
          { apiType: 'govinfo', rateLimiter: this.rateLimiter }
        );
        
        if (granulesResponse.granules && granulesResponse.granules.length > 0) {
          totalGranulesSearched += granulesResponse.granules.length;
          
          // Search for the section in this batch
          sectionGranule = granulesResponse.granules.find(g => {
            const gId = g.granuleId.toLowerCase();
            const gTitle = g.title?.toLowerCase() || '';
            const sectionStr = section.toString().toLowerCase();
            
            // Primary pattern: -sec{section} at end of granuleId
            if (gId.endsWith(`-sec${sectionStr}`)) {
              return true;
            }
            
            // Fallback patterns
            return gId.includes(`section${sectionStr}`) ||
                   gId.includes(`sec${sectionStr}`) ||
                   gTitle.includes(`§ ${sectionStr}.`) ||
                   gTitle.includes(`§ ${sectionStr} `) ||
                   gTitle.includes(`section ${sectionStr}.`) ||
                   gTitle.includes(`section ${sectionStr} `) ||
                   (gTitle.includes(sectionStr) && gTitle.includes('§'));
          });
          
          if (!sectionGranule) {
            // Update offset for next batch
            offsetMark = granulesResponse.nextPage?.offsetMark;
            hasMore = !!offsetMark;
            
            // After first batch, use smaller increments for efficiency
            if (totalGranulesSearched >= batchSize) {
              batchSize = 100;
            }
          } else {
            hasMore = false; // Found it, stop searching
          }
        } else {
          hasMore = false;
        }
      }

      if (!sectionGranule) {
        throw new Error(`Section ${section} not found in Title ${title}. Total granules searched: ${totalGranulesSearched}`);
      }

      // Get the section content based on format
      let contentUrl = '';
      switch (format) {
        case 'pdf':
          contentUrl = sectionGranule.download?.pdfLink;
          break;
        case 'xml':
          contentUrl = sectionGranule.download?.xmlLink;
          break;
        case 'html':
          contentUrl = sectionGranule.download?.htmlLink;
          break;
        default:
          contentUrl = sectionGranule.download?.txtLink;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            title: title,
            section: section,
            year: year,
            granule_id: sectionGranule.granuleId,
            section_title: sectionGranule.title,
            last_modified: sectionGranule.lastModified,
            download_url: contentUrl,
            format: format,
            package_id: packageId
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('Get USC section error:', error);
      throw new Error(`Failed to get USC section: ${error.message}`);
    }
  }

  async getUSCTitleStructure(args) {
    const { title, year = 2023 } = args;
    
    if (!title) {
      throw new Error("Title number is required");
    }
    
    if (title < 1 || title > 54) {
      throw new Error("Invalid title number. Must be between 1 and 54");
    }

    if (!process.env.GOVINFO_API_KEY) {
      throw new Error("GovInfo API key not configured. Set GOVINFO_API_KEY environment variable.");
    }

    try {
      const packageId = `USCODE-${year}-title${title}`;
      const params = new URLSearchParams();
      params.append('api_key', process.env.GOVINFO_API_KEY);
      
      // Get package summary
      const summaryResponse = await makeApiRequest(
        `/packages/${packageId}/summary?${params.toString()}`,
        {},
        { apiType: 'govinfo', rateLimiter: this.rateLimiter }
      );

      // Get all granules (sections) with pagination
      let allGranules = [];
      let offsetMark = '*';
      let hasMore = true;
      
      while (hasMore && allGranules.length < 1000) { // Safety limit
        const granulesParams = new URLSearchParams(params);
        granulesParams.append('pageSize', '100');
        granulesParams.append('offsetMark', offsetMark);
        
        const granulesResponse = await makeApiRequest(
          `/packages/${packageId}/granules?${granulesParams.toString()}`,
          {},
          { apiType: 'govinfo', rateLimiter: this.rateLimiter }
        );
        
        if (granulesResponse.granules && granulesResponse.granules.length > 0) {
          allGranules.push(...granulesResponse.granules);
          offsetMark = granulesResponse.nextPage?.offsetMark;
          hasMore = !!offsetMark;
        } else {
          hasMore = false;
        }
      }

      // Organize sections into structure
      const structure = {
        title_number: title,
        title_name: summaryResponse.title,
        year: year,
        package_id: packageId,
        date_issued: summaryResponse.dateIssued,
        total_sections: allGranules.length,
        chapters: {},
        sections: []
      };

      // Group sections by chapter if identifiable
      allGranules.forEach(granule => {
        const sectionInfo = {
          granule_id: granule.granuleId,
          title: granule.title,
          last_modified: granule.lastModified
        };
        
        // Try to extract chapter from granuleId or title
        const chapterMatch = granule.granuleId.match(/chapter(\d+)/i) || 
                            granule.title?.match(/Chapter (\d+)/i);
        
        if (chapterMatch) {
          const chapterNum = chapterMatch[1];
          if (!structure.chapters[chapterNum]) {
            structure.chapters[chapterNum] = [];
          }
          structure.chapters[chapterNum].push(sectionInfo);
        } else {
          structure.sections.push(sectionInfo);
        }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(structure, null, 2)
        }]
      };
    } catch (error) {
      console.error('Get USC title structure error:', error);
      throw new Error(`Failed to get USC title structure: ${error.message}`);
    }
  }

  async listUSCTitles(args) {
    const { year = 2023, include_enacted = false } = args;

    if (!process.env.GOVINFO_API_KEY) {
      throw new Error("GovInfo API key not configured. Set GOVINFO_API_KEY environment variable.");
    }

    try {
      // USC Titles reference (static data with enacted status)
      const uscTitles = [
        { number: 1, name: "General Provisions", enacted: true },
        { number: 2, name: "The Congress", enacted: false },
        { number: 3, name: "The President", enacted: true },
        { number: 4, name: "Flag and Seal, Seat of Government, and the States", enacted: true },
        { number: 5, name: "Government Organization and Employees", enacted: true },
        { number: 6, name: "Domestic Security", enacted: false },
        { number: 7, name: "Agriculture", enacted: false },
        { number: 8, name: "Aliens and Nationality", enacted: false },
        { number: 9, name: "Arbitration", enacted: true },
        { number: 10, name: "Armed Forces", enacted: true },
        { number: 11, name: "Bankruptcy", enacted: true },
        { number: 12, name: "Banks and Banking", enacted: false },
        { number: 13, name: "Census", enacted: true },
        { number: 14, name: "Coast Guard", enacted: true },
        { number: 15, name: "Commerce and Trade", enacted: false },
        { number: 16, name: "Conservation", enacted: false },
        { number: 17, name: "Copyrights", enacted: true },
        { number: 18, name: "Crimes and Criminal Procedure", enacted: true },
        { number: 19, name: "Customs Duties", enacted: false },
        { number: 20, name: "Education", enacted: false },
        { number: 21, name: "Food and Drugs", enacted: false },
        { number: 22, name: "Foreign Relations and Intercourse", enacted: false },
        { number: 23, name: "Highways", enacted: true },
        { number: 24, name: "Hospitals and Asylums", enacted: false },
        { number: 25, name: "Indians", enacted: false },
        { number: 26, name: "Internal Revenue Code", enacted: true },
        { number: 27, name: "Intoxicating Liquors", enacted: false },
        { number: 28, name: "Judiciary and Judicial Procedure", enacted: true },
        { number: 29, name: "Labor", enacted: false },
        { number: 30, name: "Mineral Lands and Mining", enacted: false },
        { number: 31, name: "Money and Finance", enacted: true },
        { number: 32, name: "National Guard", enacted: true },
        { number: 33, name: "Navigation and Navigable Waters", enacted: false },
        { number: 34, name: "Crime Control and Law Enforcement", enacted: true },
        { number: 35, name: "Patents", enacted: true },
        { number: 36, name: "Patriotic and National Observances", enacted: true },
        { number: 37, name: "Pay and Allowances of the Uniformed Services", enacted: true },
        { number: 38, name: "Veterans' Benefits", enacted: true },
        { number: 39, name: "Postal Service", enacted: true },
        { number: 40, name: "Public Buildings, Property, and Works", enacted: true },
        { number: 41, name: "Public Contracts", enacted: true },
        { number: 42, name: "The Public Health and Welfare", enacted: false },
        { number: 43, name: "Public Lands", enacted: false },
        { number: 44, name: "Public Printing and Documents", enacted: true },
        { number: 45, name: "Railroads", enacted: false },
        { number: 46, name: "Shipping", enacted: true },
        { number: 47, name: "Telecommunications", enacted: false },
        { number: 48, name: "Territories and Insular Possessions", enacted: false },
        { number: 49, name: "Transportation", enacted: true },
        { number: 50, name: "War and National Defense", enacted: false },
        { number: 51, name: "National and Commercial Space Programs", enacted: true },
        { number: 52, name: "Voting and Elections", enacted: false },
        { number: 53, name: "[Reserved]", enacted: false },
        { number: 54, name: "National Park Service", enacted: true }
      ];

      // Query GovInfo for actual availability
      const params = new URLSearchParams();
      params.append('api_key', process.env.GOVINFO_API_KEY);

      // Check availability for each title
      const availableTitles = await Promise.all(uscTitles.map(async (title) => {
        const packageId = `USCODE-${year}-title${title.number}`;
        let isAvailable = false;
        
        try {
          // Try to get the package summary - if it succeeds, the title is available
          const summaryUrl = `/packages/${packageId}/summary?${params.toString()}`;
          const summaryResponse = await makeApiRequest(
            summaryUrl,
            {},
            { apiType: 'govinfo', rateLimiter: this.rateLimiter }
          );
          
          // If we got a response with a packageId, it's available
          isAvailable = !!summaryResponse.packageId;
        } catch (error) {
          // If it fails with 404, the title is not available
          isAvailable = false;
        }
        
        const titleInfo = {
          number: title.number,
          name: title.name,
          package_id: packageId,
          available: isAvailable
        };
        
        if (include_enacted) {
          titleInfo.enacted_positive_law = title.enacted;
        }
        
        return titleInfo;
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            year: year,
            total_titles: uscTitles.length,
            available_count: availableTitles.filter(t => t.available).length,
            titles: availableTitles
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('List USC titles error:', error);
      throw new Error(`Failed to list USC titles: ${error.message}`);
    }
  }
}