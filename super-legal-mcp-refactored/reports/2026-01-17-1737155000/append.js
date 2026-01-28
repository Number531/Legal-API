#!/usr/bin/env node
/**
 * Append Section IV.B to final-memorandum.md
 * Workaround for Agent SDK file size limitations
 */

const fs = require('fs');
const path = require('path');

const baseDir = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-17-1737155000';
const finalMemoPath = path.join(baseDir, 'final-memorandum.md');
const tempSectionPath = path.join(baseDir, 'temp-section-IV-B.md');
const markerPath = path.join(baseDir, 'section-IV-B-appended.marker');

try {
    console.log('Reading Section IV.B content...');
    const sectionContent = fs.readFileSync(tempSectionPath, 'utf8');

    console.log('Appending to final-memorandum.md...');
    fs.appendFileSync(finalMemoPath, sectionContent);

    // Count lines
    const finalContent = fs.readFileSync(finalMemoPath, 'utf8');
    const lineCount = finalContent.split('\n').length;

    console.log(`✓ Append successful`);
    console.log(`✓ New line count: ${lineCount}`);
    console.log(`✓ Expected: 967 + 501 = 1468 lines`);

    // Create marker
    const timestamp = new Date().toISOString();
    fs.writeFileSync(markerPath, `Section IV.B appended successfully at ${timestamp}\nFinal line count: ${lineCount}\n`);

    console.log(`✓ Marker file created: ${markerPath}`);

    process.exit(0);
} catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
}
