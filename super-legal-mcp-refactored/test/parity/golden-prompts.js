/**
 * Golden prompts for parity checks across SEC/EPA/FDA/GovInfo.
 * These serve as a shared baseline for legacy vs SDK regression tests.
 */

export const goldenPrompts = {
  // SEC domain
  sec: 'Find 10-K filings for Tesla in 2023',
  // EPA domain
  epa: 'Show EPA violations for ExxonMobil facilities in Texas',
  // FDA domain
  fda: 'Search FDA device recalls for pacemakers in 2024',
  // GovInfo domain
  govinfo: 'Find recent Congressional bills about climate change',
  // Multi-tool scenario (SEC + EPA)
  multi:
    'Analyze bankruptcy risk for Tesla using SEC filings and recent EPA compliance findings'
};

