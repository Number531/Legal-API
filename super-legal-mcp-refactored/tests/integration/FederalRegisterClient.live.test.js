/**
 * Live API Integration Test for FederalRegisterClient
 * Tests the native Federal Register API directly (no mocks)
 *
 * This verifies the Federal Register API works correctly before building the hybrid version
 */

import { describe, test, expect } from '@jest/globals';
import { FederalRegisterClient } from '../../src/api-clients/FederalRegisterClient.js';
import { rateLimiterConfigs } from '../../src/config/apiConfig.js';

describe('FederalRegisterClient - Live API Integration', () => {
  const client = new FederalRegisterClient(rateLimiterConfigs.federal_register);

  test('Should search Federal Register with basic query', async () => {
    const result = await client.searchFederalRegister({
      query: 'climate change',
      limit: 5
    });

    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0].type).toBe('text');

    const data = JSON.parse(result.content[0].text);

    // Verify structure
    expect(data.count).toBeDefined();
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);

    // Verify we got results
    expect(data.count).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.length).toBeLessThanOrEqual(5);

    // Verify result structure
    const firstResult = data.results[0];
    expect(firstResult.title).toBeDefined();
    expect(firstResult.publication_date).toBeDefined();
    expect(firstResult.document_type).toBeDefined();
    expect(firstResult.agencies).toBeDefined();
    expect(Array.isArray(firstResult.agencies)).toBe(true);

    console.log('\n✅ Basic search test passed');
    console.log(`   Found ${data.count} total results, returned ${data.results.length}`);
    console.log(`   Sample title: "${firstResult.title.substring(0, 60)}..."`);
  }, 30000);

  test('Should filter by agency (EPA)', async () => {
    const result = await client.searchFederalRegister({
      agency: 'EPA',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.length).toBeLessThanOrEqual(3);

    // Verify all results have EPA as an agency
    data.results.forEach(doc => {
      const hasEPA = doc.agencies.some(a =>
        a.name && (
          a.name.includes('Environmental Protection') ||
          a.name.includes('EPA')
        )
      );
      expect(hasEPA).toBe(true);
    });

    console.log('\n✅ Agency filter test passed');
    console.log(`   Found ${data.results.length} EPA documents`);
  }, 30000);

  test('Should filter by date range', async () => {
    const result = await client.searchFederalRegister({
      date_range: '2024-01-01..2024-12-31',
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    expect(data.results).toBeDefined();

    // Verify dates are within range
    data.results.forEach(doc => {
      const pubDate = new Date(doc.publication_date);
      expect(pubDate >= new Date('2024-01-01')).toBe(true);
      expect(pubDate <= new Date('2024-12-31')).toBe(true);
    });

    console.log('\n✅ Date range filter test passed');
    console.log(`   Found ${data.results.length} documents from 2024`);
  }, 30000);

  test('Should handle document_type filter', async () => {
    const result = await client.searchFederalRegister({
      document_type: 'RULE',
      limit: 3
    });

    const data = JSON.parse(result.content[0].text);

    expect(data.results).toBeDefined();

    // Verify all are rules
    data.results.forEach(doc => {
      expect(doc.document_type.toUpperCase()).toContain('RULE');
    });

    console.log('\n✅ Document type filter test passed');
    console.log(`   Found ${data.results.length} RULE documents`);
  }, 30000);

  test('Should handle empty/no parameters (default search)', async () => {
    const result = await client.searchFederalRegister({});

    const data = JSON.parse(result.content[0].text);

    // Should return some results even with no query
    expect(data.count).toBeDefined();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    console.log('\n✅ Default search test passed');
    console.log(`   Returned ${data.results.length} documents with no filters`);
  }, 30000);

  test('Should handle significant_only filter', async () => {
    const result = await client.searchFederalRegister({
      significant_only: true,
      limit: 5
    });

    const data = JSON.parse(result.content[0].text);

    expect(data.results).toBeDefined();

    // Verify all are marked as significant
    data.results.forEach(doc => {
      expect(doc.significant).toBe(true);
    });

    console.log('\n✅ Significant documents filter test passed');
    console.log(`   Found ${data.results.length} significant documents`);
  }, 30000);
});
