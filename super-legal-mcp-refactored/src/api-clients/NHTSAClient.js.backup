/**
 * NHTSA APIs Client
 * - vPIC (vehicles) for VIN decode and make/model data
 * - Recalls API for recalls by VIN/make/model/year
 * - Complaints API for consumer complaints
 * - Safety Ratings API for NCAP ratings
 */

import { makeApiRequest } from '../utils/apiHelpers.js';

export class NHTSAClient {
  constructor(rateLimiters) {
    // Receive a map of rate limiters per API
    this.rateLimiters = rateLimiters;
  }

  // vPIC: Decode VIN
  async decodeVin(args) {
    if (!args || typeof args !== 'object') args = {};
    const { vin } = args;
    if (!vin || String(vin).length < 11) {
      throw new Error('vin is required and must be at least 11 chars');
    }
    const response = await makeApiRequest(`/vehicles/DecodeVin/${vin}?format=json`, {}, {
      apiType: 'nhtsa_vpic',
      rateLimiter: this.rateLimiters.get('nhtsa_vpic')
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // vPIC: Get models for a make (optional year)
  async getModelsForMake(args) {
    if (!args || typeof args !== 'object') args = {};
    const { make, year } = args;
    if (!make) throw new Error('make is required');
    const endpoint = year
      ? `/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`
      : `/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
    const response = await makeApiRequest(endpoint, {}, {
      apiType: 'nhtsa_vpic',
      rateLimiter: this.rateLimiters.get('nhtsa_vpic')
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // Recalls: by VIN (uses VIN decode + recalls by make/model/year as workaround)
  async getRecallsByVin(args) {
    if (!args || typeof args !== 'object') args = {};
    const { vin } = args;
    if (!vin) throw new Error('vin is required');
    
    // The direct VIN recall endpoint requires authentication we don't have
    // Workaround: Decode VIN first, then get recalls by make/model/year
    try {
      // Step 1: Decode the VIN to get make, model, year
      const decodeResponse = await makeApiRequest(`/vehicles/DecodeVin/${vin}?format=json`, {}, {
        apiType: 'nhtsa_vpic',
        rateLimiter: this.rateLimiters.get('nhtsa_vpic')
      });
      
      // Extract vehicle details from decode response
      const make = decodeResponse.Results?.find(r => r.Variable === 'Make')?.Value;
      const model = decodeResponse.Results?.find(r => r.Variable === 'Model')?.Value;
      const year = decodeResponse.Results?.find(r => r.Variable === 'Model Year')?.Value;
      
      if (!make || !model || !year) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: 'Could not determine vehicle details from VIN',
              vin: vin,
              decoded: { make, model, year }
            }, null, 2)
          }]
        };
      }
      
      // Step 2: Get recalls using the decoded information
      const params = {
        make: encodeURIComponent(make),
        model: encodeURIComponent(model),
        modelYear: encodeURIComponent(year)
      };
      
      const recallsResponse = await makeApiRequest('/recallsByVehicle', params, {
        apiType: 'nhtsa_recalls',
        rateLimiter: this.rateLimiters.get('nhtsa_recalls')
      });
      
      // Add VIN and decoded info to the response
      if (recallsResponse) {
        recallsResponse.searchedVIN = vin;
        recallsResponse.decodedVehicle = { make, model, year };
      }
      
      return { content: [{ type: 'text', text: JSON.stringify(recallsResponse, null, 2) }] };
      
    } catch (error) {
      // If workaround fails, return helpful error message
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Failed to get recalls for VIN',
            vin: vin,
            message: error.message,
            note: 'The direct VIN recall API requires authentication. This method uses VIN decode + recalls by make/model/year as a workaround.'
          }, null, 2)
        }]
      };
    }
  }

  // Recalls: by make/model/year
  async getRecallsByMakeModelYear(args) {
    if (!args || typeof args !== 'object') args = {};
    const { make, model, year } = args;
    if (!make || !model || !year) throw new Error('make, model, and year are required');
    const params = {
      make: encodeURIComponent(make),
      model: encodeURIComponent(model),
      modelYear: encodeURIComponent(year)
    };
    const response = await makeApiRequest('/recallsByVehicle', params, {
      apiType: 'nhtsa_recalls',
      rateLimiter: this.rateLimiters.get('nhtsa_recalls')
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // Complaints: by make/model/year (or VIN)
  async searchComplaints(args) {
    if (!args || typeof args !== 'object') args = {};
    const { make, model, year, vin, limit = 50, start = 0 } = args;
    const params = {};
    if (make) params.make = make;
    if (model) params.model = model;
    if (year) params.modelYear = year;
    if (vin) params.vin = vin;
    // Note: pageSize and page don't seem to work on this endpoint, we'll use limit/start client-side
    const response = await makeApiRequest('/complaintsByVehicle', params, {
      apiType: 'nhtsa_complaints',
      rateLimiter: this.rateLimiters.get('nhtsa_complaints')
    });
    
    // Apply client-side pagination if results exist
    if (response && response.results && Array.isArray(response.results)) {
      const paginatedResults = response.results.slice(start, start + limit);
      response.results = paginatedResults;
    }
    
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // Safety Ratings: overall ratings by year/make/model
  async getSafetyRatings(args) {
    if (!args || typeof args !== 'object') args = {};
    const { year, make, model } = args;
    if (!year || !make || !model) throw new Error('year, make, and model are required');
    const response = await makeApiRequest(`/modelyear/${encodeURIComponent(year)}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`, {}, {
      apiType: 'nhtsa_safety_ratings',
      rateLimiter: this.rateLimiters.get('nhtsa_safety_ratings')
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }
}


