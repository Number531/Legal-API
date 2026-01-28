/**
 * Financial Model Handler
 * Executes financial models in Anthropic's Code Execution sandbox
 *
 * Available models:
 * - dcf: Discounted Cash Flow valuation
 * - event_study: Event study for securities analysis
 * - monte_carlo: Monte Carlo simulation for uncertainty
 * - regression: Regression analysis for causation
 * - damages: Legal damages with prejudgment interest
 *
 * @module financialModelHandler
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CODE_EXECUTION_BETA = 'code-execution-2025-08-25';
const CODE_EXECUTION_TOOL_TYPE = 'code_execution_20250825';
const DEFAULT_MODEL = process.env.CODE_EXECUTION_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_RETRIES = 3;
const MAX_TOKENS = 16000;

// Valid model types
const VALID_MODEL_TYPES = ['dcf', 'event_study', 'monte_carlo', 'regression', 'damages', 'comps', 'precedent', 'val_409a', 'benford', 'beneish', 'lbo', 'sotp', 'accretion_dilution', 'cvr', 'apv', 'earnout', 'spinoff', 'vc_method'];

/**
 * Check if code execution is enabled via environment variable
 * @returns {boolean}
 */
export function isCodeExecutionEnabled() {
  return process.env.CODE_EXECUTION_ENABLED !== 'false';
}

/**
 * Load Python template for a given model type
 * @param {string} modelType - Type of financial model
 * @returns {string} Python code template
 */
function loadTemplate(modelType) {
  if (!VALID_MODEL_TYPES.includes(modelType)) {
    throw new Error(`Invalid model type: ${modelType}. Valid types: ${VALID_MODEL_TYPES.join(', ')}`);
  }

  const templatePath = path.join(__dirname, `../models/financial/${modelType}.py`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Build the prompt for Claude with embedded data
 * @param {string} template - Python template code
 * @param {Object} data - Financial data
 * @param {Object} params - Model parameters
 * @returns {string} Complete prompt
 */
function buildPrompt(template, data, params) {
  // Replace placeholders in template with actual data
  const dataJson = JSON.stringify(data, null, 2);
  const paramsJson = JSON.stringify(params || {}, null, 2);

  const populatedTemplate = template
    .replace("'''DATA_PLACEHOLDER'''", `'''${dataJson}'''`)
    .replace("'''PARAMS_PLACEHOLDER'''", `'''${paramsJson}'''`);

  return `Execute the following Python financial model. The data and parameters are already embedded in the code.

## Python Code to Execute
\`\`\`python
${populatedTemplate}
\`\`\`

Execute this code using the code_execution tool. The script will print JSON results to stdout.

IMPORTANT:
1. Execute the code as-is - do not modify it
2. Capture the JSON output from stdout
3. If there are any matplotlib charts generated, they will be base64 encoded in the output
4. Return the complete JSON results`;
}

/**
 * Extract results from Claude's response
 * @param {Object} response - Claude API response
 * @returns {Object} Extracted results
 */
function extractResults(response) {
  const results = {
    outputs: [],
    charts: [],
    text: '',
    executionSuccess: false,
    stderr: null
  };

  for (const content of response.content) {
    if (content.type === 'text') {
      results.text += content.text;
      // Check if text contains JSON output (fallback extraction)
      if (content.text.includes('{') && content.text.includes('enterprise_value')) {
        try {
          // Try to extract JSON from text
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            results.outputs.push(jsonMatch[0]);
          }
        } catch (e) {
          // Ignore extraction errors
        }
      }
    } else if (content.type === 'bash_code_execution_tool_result' || content.type === 'code_execution_tool_result') {
      // Handle code execution results (bash_code_execution_tool_result is the actual type returned)
      results.executionSuccess = content.content?.return_code === 0;

      if (content.content?.stdout) {
        results.outputs.push(content.content.stdout.trim());
      }
      if (content.content?.stderr) {
        results.stderr = content.content.stderr;
      }
    } else if (content.type === 'server_tool_result') {
      // Alternative response format for server-side tool execution
      if (content.tool_use_id && content.content) {
        for (const resultContent of content.content) {
          if (resultContent.type === 'code_execution_result') {
            results.executionSuccess = resultContent.return_code === 0;
            if (resultContent.stdout) {
              results.outputs.push(resultContent.stdout);
            }
            if (resultContent.stderr) {
              results.stderr = resultContent.stderr;
            }
          }
        }
      }
    } else if (content.type === 'tool_use' && content.name === 'code_execution') {
      // This is Claude requesting to execute code - expected behavior
      continue;
    }
  }

  return results;
}

/**
 * Validate results based on model type
 * @param {string} modelType - Type of financial model
 * @param {Object} results - Extracted results
 * @returns {boolean} Whether results are valid
 */
function validateResults(modelType, results) {
  if (!results.outputs.length) {
    return false;
  }

  try {
    // Try to parse the JSON output
    const parsed = JSON.parse(results.outputs[0]);

    // Model-specific validation
    switch (modelType) {
      case 'dcf':
        return typeof parsed.enterprise_value === 'number' && parsed.enterprise_value > 0;

      case 'event_study':
        return typeof parsed.car === 'number' && Math.abs(parsed.car) <= 1;

      case 'monte_carlo':
        return typeof parsed.mean === 'number';

      case 'regression':
        return typeof parsed.r_squared === 'number' &&
               parsed.r_squared >= 0 &&
               parsed.r_squared <= 1;

      case 'damages':
        return typeof parsed.total_damages === 'number';

      case 'comps':
        return parsed.enterprise_value_range &&
               typeof parsed.enterprise_value_range.midpoint === 'number';

      case 'precedent':
        return parsed.enterprise_value_range &&
               typeof parsed.enterprise_value_range.midpoint === 'number';

      case 'val_409a':
        return parsed.fair_market_value &&
               typeof parsed.fair_market_value.common_per_share_post_dlom === 'number';

      case 'benford':
        return parsed.overall_fraud_risk &&
               typeof parsed.chi_square_test?.statistic === 'number';

      case 'beneish':
        return typeof parsed.m_score === 'number' &&
               parsed.classification;

      case 'lbo':
        return typeof parsed.returns?.irr === 'number' &&
               typeof parsed.returns?.moic === 'number';

      case 'sotp':
        return parsed.valuation?.nav_after_discount !== undefined &&
               Array.isArray(parsed.segments);

      case 'accretion_dilution':
        return Array.isArray(parsed.pro_forma_by_year) &&
               parsed.summary?.year1_accretion_pct !== undefined;

      case 'cvr':
        return parsed.fair_value_conclusion?.cvr_fair_value !== undefined &&
               Array.isArray(parsed.milestones);

      case 'apv':
        return parsed.components?.apv !== undefined &&
               typeof parsed.components?.equity_value === 'number';

      case 'earnout':
        return parsed.valuation?.fair_value !== undefined &&
               Array.isArray(parsed.results_by_year);

      case 'spinoff':
        return parsed.value_creation?.value_created !== undefined &&
               parsed.recommendation;

      case 'vc_method':
        return typeof parsed.returns?.irr === 'number' &&
               parsed.investment_decision;

      default:
        return true;
    }
  } catch (error) {
    console.error(`[FinancialModel] Validation error for ${modelType}:`, error.message);
    return false;
  }
}

/**
 * Parse and structure the final output
 * @param {string} modelType - Type of financial model
 * @param {Object} results - Raw results from extraction
 * @returns {Object} Structured output
 */
function parseOutput(_modelType, results) {
  if (!results.outputs.length) {
    return null;
  }

  try {
    const parsed = JSON.parse(results.outputs[0]);
    return {
      data: parsed,
      charts: parsed.charts || [],
      methodology: parsed.methodology || null
    };
  } catch (error) {
    // If JSON parsing fails, return raw text
    return {
      data: null,
      rawOutput: results.outputs[0],
      text: results.text
    };
  }
}

/**
 * Execute a financial model using Anthropic's Code Execution sandbox
 *
 * @param {Object} input - Tool input
 * @param {string} input.modelType - Type of model (dcf, event_study, monte_carlo, regression, damages)
 * @param {Object} input.financialData - Data for the model
 * @param {Object} [input.parameters] - Model parameters
 * @returns {Promise<Object>} Model results
 */
export async function executeFinancialModel({ modelType, financialData, parameters = {} }) {
  // Check if enabled
  if (!isCodeExecutionEnabled()) {
    return {
      success: false,
      modelType,
      error: 'Code execution is disabled. Set CODE_EXECUTION_ENABLED=true in .env',
      attempts: 0
    };
  }

  // Validate model type
  if (!VALID_MODEL_TYPES.includes(modelType)) {
    return {
      success: false,
      modelType,
      error: `Invalid model type. Valid types: ${VALID_MODEL_TYPES.join(', ')}`,
      attempts: 0
    };
  }

  // Validate financial data (must be object, not array)
  if (!financialData || typeof financialData !== 'object' || Array.isArray(financialData)) {
    return {
      success: false,
      modelType,
      error: 'financialData is required and must be an object',
      attempts: 0
    };
  }

  // Initialize Anthropic client
  const client = new Anthropic();

  // Load template and build prompt
  let template;
  try {
    template = loadTemplate(modelType);
  } catch (error) {
    return {
      success: false,
      modelType,
      error: `Failed to load template: ${error.message}`,
      attempts: 0
    };
  }

  const prompt = buildPrompt(template, financialData, parameters);

  // Retry loop
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[FinancialModel] Executing ${modelType} model, attempt ${attempt}/${MAX_RETRIES}`);

    try {
      const response = await client.beta.messages.create({
        model: DEFAULT_MODEL,
        betas: [CODE_EXECUTION_BETA],
        max_tokens: MAX_TOKENS,
        tools: [{ type: CODE_EXECUTION_TOOL_TYPE, name: 'code_execution' }],
        messages: [{ role: 'user', content: prompt }]
      });

      const results = extractResults(response);

      // Check for execution errors
      if (results.stderr && !results.executionSuccess) {
        lastError = `Execution error: ${results.stderr}`;
        console.error(`[FinancialModel] Attempt ${attempt} stderr:`, results.stderr);
        continue;
      }

      // Validate results
      if (validateResults(modelType, results)) {
        const output = parseOutput(modelType, results);

        console.log(`[FinancialModel] ${modelType} succeeded on attempt ${attempt}`);

        return {
          success: true,
          modelType,
          ...output,
          attempts: attempt,
          executionDetails: {
            model: DEFAULT_MODEL,
            beta: CODE_EXECUTION_BETA
          }
        };
      }

      lastError = 'Validation failed - results did not pass model-specific checks';
      console.warn(`[FinancialModel] Attempt ${attempt} validation failed`);

    } catch (error) {
      lastError = error.message;
      console.error(`[FinancialModel] Attempt ${attempt} error:`, error.message);
    }
  }

  // All retries exhausted
  return {
    success: false,
    modelType,
    error: lastError || 'Unknown error after all retries',
    attempts: MAX_RETRIES
  };
}

/**
 * Get available model types and their descriptions
 * @returns {Object} Model type descriptions
 */
export function getAvailableModels() {
  return {
    dcf: {
      name: 'Discounted Cash Flow',
      description: 'Valuation model for M&A fairness opinions, shareholder litigation',
      requiredData: ['revenue'],
      optionalData: ['ebitda', 'existing_cash', 'existing_debt'],
      parameters: ['wacc', 'terminal_growth', 'operating_margin', 'tax_rate']
    },
    event_study: {
      name: 'Event Study',
      description: 'Market efficiency analysis for securities fraud, insider trading',
      requiredData: ['stock_prices', 'market_prices', 'event_date_index'],
      optionalData: ['dates'],
      parameters: ['estimation_window', 'event_window_pre', 'event_window_post', 'confidence_level']
    },
    monte_carlo: {
      name: 'Monte Carlo Simulation',
      description: 'Probability-based damages with uncertainty quantification',
      requiredData: ['base_value', 'variables'],
      optionalData: [],
      parameters: ['iterations', 'seed', 'confidence_levels']
    },
    regression: {
      name: 'Regression Analysis',
      description: 'Causation analysis for but-for scenarios, discrimination cases',
      requiredData: ['dependent', 'independents'],
      optionalData: ['treatment', 'time_period', 'group'],
      parameters: ['model_type', 'robust_se', 'confidence_level']
    },
    damages: {
      name: 'Damages Calculator',
      description: 'Nominal damages with prejudgment interest',
      requiredData: ['damages_components'],
      optionalData: ['calculation_date', 'mitigation_amounts'],
      parameters: ['interest_rate', 'interest_type', 'jurisdiction']
    },
    comps: {
      name: 'Comparable Company Analysis',
      description: 'Market-based valuation using publicly-traded peer multiples',
      requiredData: ['target', 'comparables'],
      optionalData: [],
      parameters: ['use_median', 'exclude_outliers', 'outlier_threshold']
    },
    precedent: {
      name: 'Precedent Transaction Analysis',
      description: 'Valuation based on historical M&A transaction multiples',
      requiredData: ['target', 'transactions'],
      optionalData: [],
      parameters: ['use_median', 'exclude_outliers', 'recency_weight', 'years_lookback']
    },
    val_409a: {
      name: '409A Valuation',
      description: 'Fair market value of private company common stock for option pricing',
      requiredData: ['enterprise_value OR recent_financing', 'preferred_series', 'common_shares'],
      optionalData: ['option_pool_shares', 'time_to_liquidity'],
      parameters: ['volatility', 'risk_free_rate', 'dlom', 'method']
    },
    benford: {
      name: "Benford's Law Analysis",
      description: 'Fraud detection using first-digit distribution analysis',
      requiredData: ['values'],
      optionalData: ['data_name'],
      parameters: ['confidence_level', 'flag_threshold_percentile']
    },
    beneish: {
      name: 'Beneish M-Score',
      description: 'Earnings manipulation detection using 8 financial ratios',
      requiredData: ['accounts_receivable_t', 'sales_t', 'cogs_t', 'total_assets_t', 'accounts_receivable_t1', 'sales_t1'],
      optionalData: ['company_name'],
      parameters: ['threshold']
    },
    lbo: {
      name: 'Leveraged Buyout',
      description: 'Private equity acquisition analysis with debt paydown mechanics',
      requiredData: ['entry_ebitda', 'entry_multiple'],
      optionalData: ['company_name'],
      parameters: ['equity_pct', 'interest_rate', 'debt_paydown_pct', 'hold_period', 'exit_multiple', 'revenue_growth']
    },
    sotp: {
      name: 'Sum-of-the-Parts',
      description: 'Conglomerate segment valuation with discount analysis',
      requiredData: ['segments'],
      optionalData: ['company_name'],
      parameters: ['conglomerate_discount', 'corporate_costs']
    },
    accretion_dilution: {
      name: 'Accretion/Dilution Analysis',
      description: 'Merger EPS impact analysis for public company boards',
      requiredData: ['acquirer', 'target'],
      optionalData: [],
      parameters: ['offer_price', 'cash_pct', 'synergies', 'synergy_phase_in', 'tax_rate', 'debt_rate']
    },
    cvr: {
      name: 'Contingent Value Rights',
      description: 'Probability-weighted milestone payout valuation (biotech/pharma)',
      requiredData: ['milestones'],
      optionalData: ['company_name', 'valuation_date'],
      parameters: ['discount_rate', 'risk_premium']
    },
    apv: {
      name: 'Adjusted Present Value',
      description: 'Separates operating value from financing effects (changing leverage)',
      requiredData: ['fcfs'],
      optionalData: ['company_name', 'debt_schedule'],
      parameters: ['unlevered_cost_of_equity', 'debt_cost', 'tax_rate', 'terminal_growth', 'distress_probability']
    },
    earnout: {
      name: 'Earnout Valuation',
      description: 'Performance-based contingent payment valuation',
      requiredData: ['base_metric_value'],
      optionalData: ['company_name', 'metric', 'targets'],
      parameters: ['expected_growth', 'volatility', 'earnout_period', 'discount_rate', 'simulations']
    },
    spinoff: {
      name: 'Spin-off/Carve-out Analysis',
      description: 'Separation value creation with stranded cost mechanics',
      requiredData: ['parent', 'spinco'],
      optionalData: [],
      parameters: ['one_time_separation_costs', 'stranded_costs_annual', 'stranded_cost_elimination_years', 'remainco_multiple']
    },
    vc_method: {
      name: 'Venture Capital Method',
      description: 'Early-stage valuation working backward from target exit/IRR',
      requiredData: ['investment_amount', 'pre_money_valuation', 'exit_revenue OR exit_ebitda'],
      optionalData: ['company_name', 'current_revenue'],
      parameters: ['exit_multiple', 'multiple_basis', 'years_to_exit', 'target_irr', 'future_dilution', 'option_pool_expansion']
    }
  };
}

/**
 * Tool definition for MCP integration
 * This can be imported by agentSdkToolAdapter.js
 */
export const financialModelToolDefinition = {
  name: 'execute_financial_model',
  description: `Execute financial models in a secure Python sandbox for legal analysis.

Available models:
- dcf: Discounted Cash Flow (M&A fairness, shareholder litigation)
- event_study: Market efficiency analysis (securities fraud, insider trading)
- monte_carlo: Probability-based damages (uncertainty quantification)
- regression: Causation analysis (but-for scenarios, discrimination)
- damages: Nominal damages with prejudgment interest
- comps: Comparable Company Analysis (market-based valuation using peer multiples)
- precedent: Precedent Transaction Analysis (valuation from historical M&A deals)
- val_409a: 409A Valuation (private company common stock FMV for options)
- benford: Benford's Law Analysis (fraud detection via first-digit distribution)
- beneish: Beneish M-Score (earnings manipulation detection with 8 ratios)
- lbo: Leveraged Buyout (PE acquisition with debt paydown and IRR analysis)
- sotp: Sum-of-the-Parts (conglomerate segment valuation with discount)
- accretion_dilution: Merger EPS impact analysis (public company boards)
- cvr: Contingent Value Rights (milestone-based payouts, biotech/pharma)
- apv: Adjusted Present Value (separates operating from financing value)
- earnout: Earnout Valuation (performance-based contingent payments)
- spinoff: Spin-off/Carve-out (separation costs and value creation)
- vc_method: Venture Capital Method (early-stage, backward from target IRR)

Returns: Quantitative results, sensitivity analysis, charts (base64 PNG), methodology notes.
Note: Sandbox has NO network access - all data must be provided in financialData.`,
  inputSchema: {
    type: 'object',
    properties: {
      modelType: {
        type: 'string',
        enum: VALID_MODEL_TYPES,
        description: 'Type of financial model to execute'
      },
      financialData: {
        type: 'object',
        description: 'Financial data for the model (varies by modelType)'
      },
      parameters: {
        type: 'object',
        description: 'Model parameters (WACC, event dates, iterations, etc.)'
      }
    },
    required: ['modelType', 'financialData']
  }
};

export default executeFinancialModel;
