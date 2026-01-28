/**
 * CPSC Recalls API Client (saferproducts.gov)
 * Docs summary: https://www.cpsc.gov/Data and saferproducts.gov RestWebServices
 * Recall endpoint supports JSON via `?format=json` and query parameters like RecallID, ProductName, etc. (varies by dataset)
 */

import { makeApiRequest } from '../utils/apiHelpers.js';

export class CPSCClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Search product recalls
   * Example base: /Recall?format=json
   * Common filters (when supported): ProductName, RecallID, RecallDateStart/End, Company, Hazard,
   * Country, State, etc. Not all may be supported uniformly; we pass through generic query terms.
   */
  async searchRecalls(args) {
    if (!args || typeof args !== 'object') args = {};
    const {
      product_name,
      recalling_firm,
      hazard,
      recall_id,
      date_start,
      date_end,
      limit = 50,
      skip = 0
    } = args;

    // Build params; the API primarily returns everything; some instances use OData-like filters,
    // but public docs are inconsistent. We'll apply client-side filters if needed.
    const params = { format: 'json' };

    // Fetch recalls
    const response = await makeApiRequest('/Recall', params, {
      apiType: 'cpsc_recalls',
      rateLimiter: this.rateLimiter
    });

    let items = Array.isArray(response) ? response : (response.Recall || response.results || []);

    // Client-side filtering for safety, given inconsistent filter support
    if (product_name) {
      const q = product_name.toLowerCase();
      items = items.filter(r => {
        // Check main fields
        if ((r.Title || '').toLowerCase().includes(q)) return true;
        if ((r.Description || '').toLowerCase().includes(q)) return true;
        // Check nested Products array
        if (r.Products && Array.isArray(r.Products)) {
          return r.Products.some(p => (p.Name || '').toLowerCase().includes(q));
        }
        return false;
      });
    }
    if (recalling_firm) {
      const q = recalling_firm.toLowerCase();
      items = items.filter(r => {
        // Check various company fields
        if (r.Manufacturers && Array.isArray(r.Manufacturers)) {
          if (r.Manufacturers.some(m => (m.Name || '').toLowerCase().includes(q))) return true;
        }
        if (r.Importers && Array.isArray(r.Importers)) {
          if (r.Importers.some(m => (m.Name || '').toLowerCase().includes(q))) return true;
        }
        if (r.Distributors && Array.isArray(r.Distributors)) {
          if (r.Distributors.some(m => (m.Name || '').toLowerCase().includes(q))) return true;
        }
        return false;
      });
    }
    if (hazard) {
      const q = hazard.toLowerCase();
      items = items.filter(r => {
        // Check Hazards array
        if (r.Hazards && Array.isArray(r.Hazards)) {
          return r.Hazards.some(h => (h.Name || h.HazardType || '').toLowerCase().includes(q));
        }
        return false;
      });
    }
    if (recall_id) {
      items = items.filter(r => String(r.RecallID || r.Recall_ID || '').includes(String(recall_id)));
    }
    if (date_start) {
      items = items.filter(r => {
        const d = r.RecallDate || r.Recall_Release_Date || r.RecallDatePosted;
        return !d || d >= date_start;
      });
    }
    if (date_end) {
      items = items.filter(r => {
        const d = r.RecallDate || r.Recall_Release_Date || r.RecallDatePosted;
        return !d || d <= date_end;
      });
    }

    const start = Math.max(Number(skip) || 0, 0);
    const end = start + Math.min(Number(limit) || 50, 100);
    const page = items.slice(start, end);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: items.length,
          results: page.map(r => ({
            recall_id: r.RecallID,
            recall_number: r.RecallNumber,
            title: r.Title,
            description: r.Description,
            product: r.Products && r.Products[0] ? r.Products[0].Name : null,
            product_units: r.Products && r.Products[0] ? r.Products[0].NumberOfUnits : null,
            hazard: r.Hazards && r.Hazards[0] ? r.Hazards[0].Name : null,
            manufacturers: r.Manufacturers ? r.Manufacturers.map(m => m.Name) : [],
            importers: r.Importers ? r.Importers.map(m => m.Name) : [],
            distributors: r.Distributors ? r.Distributors.map(m => m.Name) : [],
            retailers: r.Retailers ? r.Retailers.map(m => m.Name) : [],
            injuries: r.Injuries ? r.Injuries.map(i => i.Name) : [],
            remedy: r.Remedies && r.Remedies[0] ? r.Remedies[0].Name : null,
            recall_date: r.RecallDate,
            url: r.URL,
            images: r.Images ? r.Images.map(img => ({ url: img.URL, caption: img.Caption })) : []
          }))
        }, null, 2)
      }]
    };
  }
}


