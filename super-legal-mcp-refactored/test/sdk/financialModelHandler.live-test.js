#!/usr/bin/env node

/**
 * Live Tests for Financial Model Handler
 * Tests actual Code Execution sandbox with real API calls
 *
 * Run: node test/sdk/financialModelHandler.live-test.js
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY environment variable set
 * - CODE_EXECUTION_ENABLED=true (or not set)
 *
 * Note: These tests make real API calls and will incur costs
 */

import { executeFinancialModel, getAvailableModels, isCodeExecutionEnabled } from '../../src/tools/financialModelHandler.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Test configuration
const TIMEOUT_MS = 180000; // 3 minutes per test

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`  ${icon} ${name}`, color);
  if (details) {
    console.log(`    ${details}`);
  }
}

async function runWithTimeout(promise, timeoutMs, testName) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Test "${testName}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test data for each model type
const testCases = {
  dcf: {
    name: 'DCF Valuation',
    financialData: {
      revenue: [100000000, 110000000, 121000000, 133100000, 146410000], // 5-year projection
      existing_cash: 5000000,
      existing_debt: 10000000
    },
    parameters: {
      wacc: 0.10,
      terminal_growth: 0.025,
      operating_margin: 0.15,
      tax_rate: 0.21
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.enterprise_value !== 'number') return 'Missing enterprise_value';
      if (result.data.enterprise_value <= 0) return 'Invalid enterprise_value';
      if (!result.data.fcf_by_year) return 'Missing fcf_by_year';
      return null;
    }
  },

  event_study: {
    name: 'Event Study',
    financialData: {
      // Simulated stock prices around an event
      stock_prices: [
        100, 101, 99, 102, 100, 101, 98, 100, 99, 101, // Pre-estimation
        100, 102, 101, 99, 100, 98, 101, 100, 99, 100,
        101, 100, 99, 101, 100, 102, 99, 100, 101, 100,
        99, 101, 100, 98, 100, 101, 99, 100, 102, 100,
        101, 99, 100, 101, 98, 100, 99, 101, 100, 102,
        100, 101, 99, 100, 98, 101, 100, 99, 100, 101,
        99, 100, 101, 98, 100, 99, 101, 100, 102, 100,
        101, 99, 100, 98, 101, 100, 99, 100, 101, 99,
        100, 101, 100, 99, 100, 98, 101, 100, 99, 100,
        101, 99, 100, 102, 100, 99, 100, 101, 98, 100,
        99, 101, 100, 102, 100, 99, 100, 101, 98, 100,
        99, 101, 100, 102, 100, 99, 100, 101, 98, 100,
        101, 99, 100, 102, 100, // Pre-event
        85, 82, 80, 78, 79, 81 // Event and post (significant drop)
      ],
      market_prices: [
        1000, 1002, 999, 1003, 1001, 1002, 998, 1000, 999, 1001,
        1000, 1003, 1001, 999, 1000, 998, 1001, 1000, 999, 1000,
        1001, 1000, 999, 1001, 1000, 1002, 999, 1000, 1001, 1000,
        999, 1001, 1000, 998, 1000, 1001, 999, 1000, 1002, 1000,
        1001, 999, 1000, 1001, 998, 1000, 999, 1001, 1000, 1002,
        1000, 1001, 999, 1000, 998, 1001, 1000, 999, 1000, 1001,
        999, 1000, 1001, 998, 1000, 999, 1001, 1000, 1002, 1000,
        1001, 999, 1000, 998, 1001, 1000, 999, 1000, 1001, 999,
        1000, 1001, 1000, 999, 1000, 998, 1001, 1000, 999, 1000,
        1001, 999, 1000, 1002, 1000, 999, 1000, 1001, 998, 1000,
        999, 1001, 1000, 1002, 1000, 999, 1000, 1001, 998, 1000,
        999, 1001, 1000, 1002, 1000, 999, 1000, 1001, 998, 1000,
        1001, 999, 1000, 1002, 1000,
        1001, 1002, 1001, 1000, 1001, 1002 // Market stable during event
      ],
      event_date_index: 125
    },
    parameters: {
      estimation_window: 100,
      event_window_pre: 5,
      event_window_post: 5,
      confidence_level: 0.95
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.car !== 'number') return 'Missing CAR';
      if (Math.abs(result.data.car) > 1) return 'CAR out of valid range';
      if (!result.data.daily_results) return 'Missing daily_results';
      return null;
    }
  },

  monte_carlo: {
    name: 'Monte Carlo Simulation',
    financialData: {
      base_value: 1000000,
      variables: [
        {
          name: 'revenue_growth',
          distribution: 'normal',
          params: { mean: 1.05, std: 0.10 },
          impact_type: 'multiplicative'
        },
        {
          name: 'margin_adjustment',
          distribution: 'triangular',
          params: { low: 0.90, mode: 1.0, high: 1.15 },
          impact_type: 'multiplicative'
        },
        {
          name: 'market_discount',
          distribution: 'uniform',
          params: { low: 0.85, high: 1.0 },
          impact_type: 'multiplicative'
        }
      ]
    },
    parameters: {
      iterations: 5000,
      seed: 42, // For reproducibility
      confidence_levels: [0.05, 0.25, 0.50, 0.75, 0.95]
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.mean !== 'number') return 'Missing mean';
      if (!result.data.percentiles) return 'Missing percentiles';
      if (!result.data.sensitivities) return 'Missing sensitivities';
      return null;
    }
  },

  regression: {
    name: 'Regression Analysis',
    financialData: {
      // Simulated salary data for discrimination analysis
      dependent: [
        50000, 55000, 48000, 62000, 58000, 45000, 70000, 52000, 49000, 65000,
        47000, 54000, 68000, 51000, 46000, 63000, 57000, 44000, 72000, 53000,
        50000, 56000, 49000, 64000, 59000, 46000, 71000, 52000, 48000, 66000
      ],
      independents: {
        years_experience: [5, 7, 4, 10, 8, 3, 12, 6, 4, 9, 3, 6, 11, 5, 3, 9, 7, 2, 14, 6, 5, 7, 4, 9, 8, 3, 13, 6, 4, 10],
        education_level: [2, 3, 2, 4, 3, 2, 4, 2, 2, 3, 2, 2, 4, 2, 2, 3, 3, 1, 4, 2, 2, 3, 2, 3, 3, 2, 4, 2, 2, 3],
        performance_rating: [3, 4, 3, 5, 4, 2, 5, 3, 3, 4, 2, 3, 5, 3, 2, 4, 4, 2, 5, 3, 3, 4, 3, 4, 4, 2, 5, 3, 3, 4]
      }
    },
    parameters: {
      model_type: 'ols',
      robust_se: true,
      confidence_level: 0.95
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.r_squared !== 'number') return 'Missing r_squared';
      if (result.data.r_squared < 0 || result.data.r_squared > 1) return 'Invalid r_squared';
      if (!result.data.coefficients) return 'Missing coefficients';
      return null;
    }
  },

  damages: {
    name: 'Damages Calculator',
    financialData: {
      damages_components: [
        {
          name: 'Lost Profits - Q1 2022',
          amount: 250000,
          date: '2022-03-31',
          category: 'lost_profits'
        },
        {
          name: 'Lost Profits - Q2 2022',
          amount: 275000,
          date: '2022-06-30',
          category: 'lost_profits'
        },
        {
          name: 'Contract Value Differential',
          amount: 500000,
          date: '2022-01-15',
          category: 'benefit_of_bargain'
        },
        {
          name: 'Out-of-Pocket Costs',
          amount: 75000,
          date: '2022-02-28',
          category: 'compensatory'
        }
      ],
      calculation_date: '2024-12-18',
      mitigation_amounts: [
        { name: 'Replacement contract revenue', amount: 150000 }
      ]
    },
    parameters: {
      interest_rate: 0.05,
      interest_type: 'simple',
      jurisdiction: 'federal'
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.total_damages !== 'number') return 'Missing total_damages';
      if (result.data.total_damages < 0) return 'Invalid negative damages';
      if (!result.data.components) return 'Missing components breakdown';
      return null;
    }
  },

  comps: {
    name: 'Comparable Company Analysis',
    financialData: {
      target: {
        ltm_revenue: 50000000,
        ltm_ebitda: 10000000,
        ltm_ebit: 8000000,
        ntm_revenue: 55000000,
        ntm_ebitda: 12000000,
        revenue_growth: 0.10,
        ebitda_margin: 0.20
      },
      comparables: [
        {
          ticker: 'COMP1',
          name: 'Competitor A Inc',
          market_cap: 150000000,
          net_debt: 20000000,
          ltm_revenue: 80000000,
          ltm_ebitda: 16000000,
          ltm_ebit: 12000000,
          ntm_revenue: 88000000,
          ntm_ebitda: 18000000,
          revenue_growth: 0.10,
          ebitda_margin: 0.20
        },
        {
          ticker: 'COMP2',
          name: 'Competitor B Corp',
          market_cap: 200000000,
          net_debt: 30000000,
          ltm_revenue: 100000000,
          ltm_ebitda: 22000000,
          ltm_ebit: 18000000,
          ntm_revenue: 110000000,
          ntm_ebitda: 25000000,
          revenue_growth: 0.10,
          ebitda_margin: 0.22
        },
        {
          ticker: 'COMP3',
          name: 'Competitor C Holdings',
          market_cap: 120000000,
          net_debt: 15000000,
          ltm_revenue: 60000000,
          ltm_ebitda: 12000000,
          ltm_ebit: 9000000,
          ntm_revenue: 66000000,
          ntm_ebitda: 14000000,
          revenue_growth: 0.10,
          ebitda_margin: 0.20
        }
      ]
    },
    parameters: {
      use_median: true,
      exclude_outliers: true,
      outlier_threshold: 2.0
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (!result.data.enterprise_value_range) return 'Missing enterprise_value_range';
      if (typeof result.data.enterprise_value_range.midpoint !== 'number') return 'Missing midpoint value';
      if (!result.data.multiples_statistics) return 'Missing multiples_statistics';
      return null;
    }
  },

  precedent: {
    name: 'Precedent Transaction Analysis',
    financialData: {
      target: {
        ltm_revenue: 50000000,
        ltm_ebitda: 10000000,
        ltm_ebit: 8000000,
        revenue_growth: 0.10,
        ebitda_margin: 0.20
      },
      transactions: [
        {
          announce_date: '2024-06-15',
          acquirer: 'Strategic Buyer A',
          target_name: 'Target Company 1',
          transaction_value: 200000000,
          enterprise_value: 200000000,
          ltm_revenue: 75000000,
          ltm_ebitda: 18000000,
          ltm_ebit: 14000000,
          deal_type: 'Strategic',
          premium_to_unaffected: 0.30
        },
        {
          announce_date: '2024-03-20',
          acquirer: 'PE Firm Alpha',
          target_name: 'Target Company 2',
          transaction_value: 180000000,
          enterprise_value: 180000000,
          ltm_revenue: 80000000,
          ltm_ebitda: 16000000,
          ltm_ebit: 12000000,
          deal_type: 'Financial Sponsor',
          premium_to_unaffected: 0.25
        },
        {
          announce_date: '2023-11-10',
          acquirer: 'Strategic Buyer B',
          target_name: 'Target Company 3',
          transaction_value: 150000000,
          enterprise_value: 150000000,
          ltm_revenue: 60000000,
          ltm_ebitda: 13000000,
          ltm_ebit: 10000000,
          deal_type: 'Strategic',
          premium_to_unaffected: 0.35
        }
      ]
    },
    parameters: {
      use_median: true,
      exclude_outliers: true,
      recency_weight: false,
      years_lookback: 3
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (!result.data.enterprise_value_range) return 'Missing enterprise_value_range';
      if (typeof result.data.enterprise_value_range.midpoint !== 'number') return 'Missing midpoint value';
      if (!result.data.multiples_statistics) return 'Missing multiples_statistics';
      return null;
    }
  },

  val_409a: {
    name: '409A Valuation',
    financialData: {
      company_name: 'TechStartup Inc',
      valuation_date: '2024-12-15',
      enterprise_value: 50000000,
      preferred_series: [
        {
          series_name: 'Series A',
          shares_outstanding: 2000000,
          liquidation_preference_per_share: 5.00,
          participating: false
        },
        {
          series_name: 'Series B',
          shares_outstanding: 3000000,
          liquidation_preference_per_share: 8.00,
          participating: true,
          participation_cap: 3
        }
      ],
      common_shares: 10000000,
      option_pool_shares: 1500000,
      time_to_liquidity: 3
    },
    parameters: {
      volatility: 0.50,
      risk_free_rate: 0.04,
      dlom: 0.25,
      method: 'opm'
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (!result.data.fair_market_value) return 'Missing fair_market_value';
      if (typeof result.data.fair_market_value.common_per_share_post_dlom !== 'number') return 'Missing FMV per share';
      if (!result.data.equity_allocation) return 'Missing equity_allocation';
      return null;
    }
  },

  benford: {
    name: "Benford's Law Analysis",
    financialData: {
      data_name: 'Vendor Payments',
      values: [
        // Simulated invoice amounts - mix of conforming and suspicious
        1234.56, 2345.67, 3456.78, 1567.89, 2678.90, 1890.12, 3012.34, 1123.45,
        4567.89, 5678.90, 6789.01, 1234.56, 2345.67, 8901.23, 1456.78, 2567.89,
        9012.34, 1678.90, 3789.01, 1890.12, 4901.23, 1012.34, 2123.45, 1234.56,
        5234.56, 6345.67, 1456.78, 2567.89, 7678.90, 1789.01, 3890.12, 1901.23,
        8012.34, 1123.45, 4234.56, 1345.67, 2456.78, 1567.89, 5678.90, 1789.01,
        9890.12, 1901.23, 3012.34, 1123.45, 2234.56, 1345.67, 6456.78, 1567.89,
        7678.90, 1789.01, 4890.12, 1901.23, 2012.34, 1123.45, 3234.56, 1345.67,
        1456.78, 2567.89, 1678.90, 4789.01, 1890.12, 5901.23, 1012.34, 2123.45,
        1234.56, 3345.67, 1456.78, 6567.89, 1678.90, 7789.01, 1890.12, 8901.23,
        1012.34, 4123.45, 1234.56, 2345.67, 1456.78, 3567.89, 1678.90, 9789.01,
        // More values to ensure statistical significance
        1250.00, 2150.00, 1350.00, 4250.00, 1450.00, 5350.00, 1550.00, 6450.00,
        1650.00, 7550.00, 1750.00, 8650.00, 1850.00, 9750.00, 1950.00, 2050.00,
        1150.00, 3250.00, 1350.00, 4450.00, 1550.00, 5650.00, 1750.00, 6850.00
      ]
    },
    parameters: {
      confidence_level: 0.95,
      flag_threshold_percentile: 95
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (!result.data.overall_fraud_risk) return 'Missing overall_fraud_risk';
      if (typeof result.data.chi_square_test?.statistic !== 'number') return 'Missing chi_square_test';
      if (!result.data.observed_distribution) return 'Missing observed_distribution';
      return null;
    }
  },

  beneish: {
    name: 'Beneish M-Score',
    financialData: {
      company_name: 'Target Acquisition Corp',
      // Current year financials
      accounts_receivable_t: 15000000,
      sales_t: 100000000,
      cogs_t: 60000000,
      current_assets_t: 40000000,
      ppe_t: 50000000,
      total_assets_t: 120000000,
      depreciation_t: 5000000,
      sga_t: 20000000,
      long_term_debt_t: 30000000,
      current_liabilities_t: 25000000,
      working_capital_t: 15000000,
      // Prior year financials
      accounts_receivable_t1: 12000000,
      sales_t1: 85000000,
      cogs_t1: 51000000,
      current_assets_t1: 35000000,
      ppe_t1: 48000000,
      total_assets_t1: 110000000,
      depreciation_t1: 4800000,
      sga_t1: 18000000,
      long_term_debt_t1: 28000000,
      current_liabilities_t1: 22000000,
      working_capital_t1: 13000000
    },
    parameters: {
      threshold: -1.78
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.m_score !== 'number') return 'Missing m_score';
      if (!result.data.classification) return 'Missing classification';
      if (!result.data.ratios) return 'Missing ratios breakdown';
      return null;
    }
  },

  lbo: {
    name: 'Leveraged Buyout',
    financialData: {
      company_name: 'Target Manufacturing Co',
      entry_ebitda: 50000000,
      entry_multiple: 8.0
    },
    parameters: {
      equity_pct: 0.40,
      interest_rate: 0.08,
      debt_paydown_pct: 0.50,
      hold_period: 5,
      exit_multiple: 8.5,
      revenue_growth: 0.05,
      ebitda_margin: 0.20
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.returns?.irr !== 'number') return 'Missing IRR';
      if (typeof result.data.returns?.moic !== 'number') return 'Missing MOIC';
      if (!result.data.projection) return 'Missing projection';
      return null;
    }
  },

  sotp: {
    name: 'Sum-of-the-Parts',
    financialData: {
      company_name: 'Diversified Holdings Inc',
      segments: [
        { name: 'Technology Division', revenue: 200000000, ebitda: 40000000, multiple: 12.0, growth_rate: 0.15 },
        { name: 'Manufacturing Division', revenue: 150000000, ebitda: 22500000, multiple: 7.0, growth_rate: 0.03 },
        { name: 'Services Division', revenue: 100000000, ebitda: 15000000, multiple: 9.0, growth_rate: 0.08 }
      ]
    },
    parameters: {
      conglomerate_discount: 0.15,
      corporate_costs: 10000000
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (result.data.valuation?.nav_after_discount === undefined) return 'Missing NAV';
      if (!Array.isArray(result.data.segments)) return 'Missing segments';
      return null;
    }
  },

  accretion_dilution: {
    name: 'Accretion/Dilution Analysis',
    financialData: {
      acquirer: {
        name: 'Acquirer Corp',
        shares_outstanding: 100000000,
        share_price: 50,
        net_income: 500000000
      },
      target: {
        name: 'Target Inc',
        shares_outstanding: 30000000,
        net_income: 60000000
      }
    },
    parameters: {
      offer_price: 40,
      cash_pct: 0.50,
      synergies: 50000000,
      synergy_phase_in: [0.25, 0.50, 0.75, 1.0],
      tax_rate: 0.25,
      debt_rate: 0.05
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (!Array.isArray(result.data.pro_forma_by_year)) return 'Missing pro_forma_by_year';
      if (result.data.summary?.year1_accretion_pct === undefined) return 'Missing accretion percentage';
      return null;
    }
  },

  cvr: {
    name: 'Contingent Value Rights',
    financialData: {
      company_name: 'BioPharma Target',
      milestones: [
        { name: 'FDA Phase 2 Approval', payment: 50000000, probability: 0.70, years_to_milestone: 1, type: 'binary' },
        { name: 'FDA Phase 3 Approval', payment: 100000000, probability: 0.45, years_to_milestone: 2.5, type: 'binary' },
        { name: 'Commercial Launch', payment: 150000000, probability: 0.30, years_to_milestone: 4, type: 'binary' }
      ]
    },
    parameters: {
      discount_rate: 0.10,
      risk_premium: 0.05
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (result.data.fair_value_conclusion?.cvr_fair_value === undefined) return 'Missing CVR fair value';
      if (!Array.isArray(result.data.milestones)) return 'Missing milestones';
      return null;
    }
  },

  apv: {
    name: 'Adjusted Present Value',
    financialData: {
      company_name: 'Leveraged Target Corp',
      fcfs: [50000000, 55000000, 60500000, 66550000, 73205000],
      debt_schedule: [200000000, 175000000, 150000000, 125000000, 100000000]
    },
    parameters: {
      unlevered_cost_of_equity: 0.12,
      debt_cost: 0.06,
      tax_rate: 0.25,
      terminal_growth: 0.03,
      distress_probability: 0.05,
      distress_cost_pct: 0.20
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (result.data.components?.apv === undefined) return 'Missing APV';
      if (typeof result.data.components?.equity_value !== 'number') return 'Missing equity value';
      return null;
    }
  },

  earnout: {
    name: 'Earnout Valuation',
    financialData: {
      company_name: 'Growth Acquisition Target',
      metric: 'EBITDA',
      base_metric_value: 20000000,
      targets: [
        { threshold: 22000000, payout: 10000000, type: 'binary' },
        { threshold: 25000000, payout: 15000000, type: 'binary' },
        { threshold: 30000000, payout: 25000000, type: 'binary' }
      ]
    },
    parameters: {
      expected_growth: 0.10,
      volatility: 0.25,
      earnout_period: 3,
      discount_rate: 0.12,
      simulations: 5000
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (result.data.valuation?.fair_value === undefined) return 'Missing fair value';
      if (!Array.isArray(result.data.results_by_year)) return 'Missing results_by_year';
      return null;
    }
  },

  spinoff: {
    name: 'Spin-off/Carve-out Analysis',
    financialData: {
      parent: {
        name: 'Conglomerate Parent Inc',
        ebitda: 500000000,
        multiple: 8.0
      },
      spinco: {
        name: 'High Growth SpinCo',
        ebitda: 100000000,
        standalone_multiple: 12.0
      }
    },
    parameters: {
      one_time_separation_costs: 50000000,
      stranded_costs_annual: 20000000,
      stranded_cost_elimination_years: 3,
      remainco_multiple: 7.5,
      tax_rate: 0.25,
      discount_rate: 0.10,
      dis_synergies_annual: 5000000,
      spinco_standalone_synergies: 10000000
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (result.data.value_creation?.value_created === undefined) return 'Missing value creation';
      if (!result.data.recommendation) return 'Missing recommendation';
      return null;
    }
  },

  vc_method: {
    name: 'Venture Capital Method',
    financialData: {
      company_name: 'TechStartup Series B',
      investment_amount: 15000000,
      pre_money_valuation: 60000000,
      exit_revenue: 200000000,
      current_revenue: 10000000
    },
    parameters: {
      exit_multiple: 5.0,
      multiple_basis: 'revenue',
      years_to_exit: 5,
      target_irr: 0.30,
      future_dilution: 0.25,
      option_pool_expansion: 0.10
    },
    validate: (result) => {
      if (!result.data) return 'No data returned';
      if (typeof result.data.returns?.irr !== 'number') return 'Missing IRR';
      if (!result.data.investment_decision) return 'Missing investment decision';
      return null;
    }
  }
};

async function runTest(modelType, testCase) {
  log(`\n  Testing: ${testCase.name}`, 'blue');

  const startTime = Date.now();

  try {
    const result = await runWithTimeout(
      executeFinancialModel({
        modelType,
        financialData: testCase.financialData,
        parameters: testCase.parameters
      }),
      TIMEOUT_MS,
      testCase.name
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!result.success) {
      logTest(testCase.name, false, `Failed: ${result.error} (${duration}s)`);
      return { passed: false, error: result.error };
    }

    // Run custom validation
    const validationError = testCase.validate(result);
    if (validationError) {
      logTest(testCase.name, false, `Validation: ${validationError} (${duration}s)`);
      return { passed: false, error: validationError };
    }

    // Check for charts
    const chartCount = result.charts?.length || 0;

    logTest(
      testCase.name,
      true,
      `Attempts: ${result.attempts}, Charts: ${chartCount}, Duration: ${duration}s`
    );

    // Log key results
    if (modelType === 'dcf') {
      console.log(`    Enterprise Value: $${result.data.enterprise_value?.toLocaleString()}`);
    } else if (modelType === 'event_study') {
      console.log(`    CAR: ${(result.data.car * 100).toFixed(2)}%, Significant: ${result.data.significant}`);
    } else if (modelType === 'monte_carlo') {
      console.log(`    Mean: $${result.data.mean?.toLocaleString()}, 95% CI: [$${result.data.percentiles?.p5?.toLocaleString()} - $${result.data.percentiles?.p95?.toLocaleString()}]`);
    } else if (modelType === 'regression') {
      console.log(`    R²: ${result.data.r_squared?.toFixed(4)}, Coefficients: ${result.data.coefficients?.length}`);
    } else if (modelType === 'damages') {
      console.log(`    Total Damages: $${result.data.total_damages?.toLocaleString()}`);
    } else if (modelType === 'comps') {
      const range = result.data.enterprise_value_range;
      console.log(`    EV Range: $${range?.low?.toLocaleString()} - $${range?.high?.toLocaleString()} (Mid: $${range?.midpoint?.toLocaleString()})`);
    } else if (modelType === 'precedent') {
      const range = result.data.enterprise_value_range;
      console.log(`    EV Range: $${range?.low?.toLocaleString()} - $${range?.high?.toLocaleString()} (Mid: $${range?.midpoint?.toLocaleString()})`);
    } else if (modelType === 'val_409a') {
      const fmv = result.data.fair_market_value;
      console.log(`    Common FMV: $${fmv?.common_per_share_post_dlom?.toFixed(2)}/share (DLOM: ${(fmv?.dlom_applied * 100)?.toFixed(0)}%)`);
    } else if (modelType === 'benford') {
      const chi2 = result.data.chi_square_test;
      console.log(`    Fraud Risk: ${result.data.overall_fraud_risk}, Chi²: ${chi2?.statistic?.toFixed(2)} (p=${chi2?.p_value?.toFixed(4)})`);
    } else if (modelType === 'beneish') {
      console.log(`    M-Score: ${result.data.m_score?.toFixed(4)}, Classification: ${result.data.classification}, Red Flags: ${result.data.red_flags_count}/8`);
    } else if (modelType === 'lbo') {
      console.log(`    IRR: ${(result.data.returns?.irr * 100)?.toFixed(1)}%, MOIC: ${result.data.returns?.moic?.toFixed(2)}x`);
    } else if (modelType === 'sotp') {
      console.log(`    NAV: $${result.data.valuation?.nav_after_discount?.toLocaleString()}, Discount: ${result.data.valuation?.conglomerate_discount_pct?.toFixed(0)}%`);
    } else if (modelType === 'accretion_dilution') {
      console.log(`    Year 1 Accretion: ${result.data.summary?.year1_accretion_pct?.toFixed(2)}%, Accretive: ${result.data.summary?.is_accretive_year1}`);
    } else if (modelType === 'cvr') {
      console.log(`    CVR Fair Value: $${result.data.fair_value_conclusion?.cvr_fair_value?.toLocaleString()}, Discount to Max: ${result.data.fair_value_conclusion?.discount_to_max?.toFixed(1)}%`);
    } else if (modelType === 'apv') {
      console.log(`    APV: $${result.data.components?.apv?.toLocaleString()}, Equity Value: $${result.data.components?.equity_value?.toLocaleString()}`);
    } else if (modelType === 'earnout') {
      console.log(`    Fair Value: $${result.data.valuation?.fair_value?.toLocaleString()}, Payout Probability: ${(result.data.valuation?.overall_payout_probability * 100)?.toFixed(1)}%`);
    } else if (modelType === 'spinoff') {
      console.log(`    Value Created: $${result.data.value_creation?.value_created?.toLocaleString()}, Recommendation: ${result.data.recommendation}`);
    } else if (modelType === 'vc_method') {
      console.log(`    IRR: ${(result.data.returns?.irr * 100)?.toFixed(1)}%, MOIC: ${result.data.returns?.moic?.toFixed(2)}x, Decision: ${result.data.investment_decision}`);
    }

    return { passed: true, result };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logTest(testCase.name, false, `Error: ${error.message} (${duration}s)`);
    return { passed: false, error: error.message };
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bold');
  log('Financial Model Handler - Live Sandbox Tests', 'bold');
  log('='.repeat(60) + '\n', 'bold');

  // Pre-flight checks
  log('Pre-flight Checks:', 'yellow');

  if (!process.env.ANTHROPIC_API_KEY) {
    log('  ✗ ANTHROPIC_API_KEY not set', 'red');
    process.exit(1);
  }
  log('  ✓ ANTHROPIC_API_KEY present', 'green');

  if (!isCodeExecutionEnabled()) {
    log('  ✗ Code execution disabled (CODE_EXECUTION_ENABLED=false)', 'red');
    process.exit(1);
  }
  log('  ✓ Code execution enabled', 'green');

  const models = getAvailableModels();
  log(`  ✓ ${Object.keys(models).length} model types available`, 'green');

  // Run tests
  log('\n' + '-'.repeat(60), 'yellow');
  log('Running Live Tests (this will take several minutes)...', 'yellow');
  log('-'.repeat(60), 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const [modelType, testCase] of Object.entries(testCases)) {
    const testResult = await runTest(modelType, testCase);
    if (testResult.passed) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push({ model: modelType, error: testResult.error });
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'bold');
  log('Test Summary', 'bold');
  log('='.repeat(60), 'bold');

  log(`\n  Total: ${results.passed + results.failed}`, 'blue');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.errors.length > 0) {
    log('\n  Failures:', 'red');
    results.errors.forEach(({ model, error }) => {
      log(`    - ${model}: ${error}`, 'red');
    });
  }

  const exitCode = results.failed === 0 ? 0 : 1;
  log(`\n  Exit code: ${exitCode}`, exitCode === 0 ? 'green' : 'red');

  process.exit(exitCode);
}

// Run if executed directly
main().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
