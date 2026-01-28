/**
 * Exa API Client
 * Handles Exa state statute search functionality
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for loading config
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ExaClient {
  constructor(rateLimiter) {
    this.rateLimiter = rateLimiter;
    
    // Load state statute configuration
    try {
      this.stateConfig = JSON.parse(
        readFileSync(join(__dirname, '../../config', 'all-states-statute-urls.json'), 'utf8')
      );
    } catch (error) {
      console.warn('State configuration file not found, state statute search will be limited');
      this.stateConfig = { states: {} };
    }
  }

  // searchStateStatute method has been moved to StateStatuteWebSearchClient
  // for better architecture and BaseWebSearchClient integration
}