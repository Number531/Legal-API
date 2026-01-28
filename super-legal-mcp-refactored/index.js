#!/usr/bin/env node

/**
 * Enhanced Legal MCP Server - Main Entry Point
 * 
 * This is the main entry point for the refactored Enhanced Legal MCP Server.
 * The server provides comprehensive legal research capabilities through MCP,
 * integrating multiple APIs including CourtListener, SEC EDGAR, Federal Register,
 * USPTO Patents, GovInfo USC, and Exa for state statutes.
 * 
 * Usage:
 *   node index.js
 *   npm start
 * 
 * Environment Variables Required:
 *   - COURTLISTENER_API_TOKEN: CourtListener API token
 *   - USPTO_API_KEY: USPTO PatentsView API key (optional)
 *   - GOVINFO_API_KEY: GovInfo API key (optional)
 *   - EXA_API_KEY: Exa API key for state statute search (optional)
 * 
 * @version 2.0.0
 * @author Enhanced Legal MCP Team
 */

import 'dotenv/config';
import { EnhancedLegalMcpServer } from './src/server/EnhancedLegalMcpServer.js';

// Validate critical environment variables
function validateEnvironment() {
  const warnings = [];
  const errors = [];

  // Check for CourtListener token (most important)
  if (!process.env.COURTLISTENER_API_TOKEN) {
    warnings.push("COURTLISTENER_API_TOKEN not set - CourtListener features will be limited");
  }

  // Check for optional API keys
  if (!process.env.USPTO_API_KEY) {
    warnings.push("USPTO_API_KEY not set - USPTO patent search will be unavailable");
  }

  if (!process.env.GOVINFO_API_KEY) {
    warnings.push("GOVINFO_API_KEY not set - US Code search will be unavailable");
  }

  if (!process.env.EXA_API_KEY) {
    warnings.push("EXA_API_KEY not set - State statute search will be unavailable");
  }

  // Log warnings
  if (warnings.length > 0) {
    console.error("⚠️  Environment Warnings:");
    warnings.forEach(warning => console.error(`   ${warning}`));
    console.error("");
  }

  // Log errors and exit if critical
  if (errors.length > 0) {
    console.error("❌ Environment Errors:");
    errors.forEach(error => console.error(`   ${error}`));
    console.error("");
    process.exit(1);
  }

  // Log success if all keys are present
  if (warnings.length === 0) {
    console.error("✅ All API keys configured - full functionality available");
  }
}

// Main execution
async function main() {
  try {
    // Validate environment
    validateEnvironment();

    // Create and start the server
    console.error("🚀 Starting Enhanced Legal MCP Server v2.0.0...");
    console.error("📚 Available APIs: CourtListener, SEC EDGAR, Federal Register, USPTO, GovInfo, Exa");
    console.error("");

    const server = new EnhancedLegalMcpServer();
    await server.run();

  } catch (error) {
    console.error("❌ Failed to start Enhanced Legal MCP Server:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main();