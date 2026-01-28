/**
 * Unit tests for Financial Model Handler
 * Tests template loading, input validation, and exports
 *
 * Note: API integration tests are in test/sdk/financialModelHandler.live-test.js
 * since Jest ESM mocking has limitations with the Anthropic SDK
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../../../src/models/financial');
const HANDLER_PATH = path.join(__dirname, '../../../src/tools/financialModelHandler.js');

describe('Financial Model Handler', () => {
  let executeFinancialModel;
  let isCodeExecutionEnabled;
  let getAvailableModels;
  let financialModelToolDefinition;

  beforeEach(async () => {
    // Set environment for code execution
    process.env.CODE_EXECUTION_ENABLED = 'true';

    // Dynamically import the handler
    const handler = await import('../../../src/tools/financialModelHandler.js');
    executeFinancialModel = handler.executeFinancialModel;
    isCodeExecutionEnabled = handler.isCodeExecutionEnabled;
    getAvailableModels = handler.getAvailableModels;
    financialModelToolDefinition = handler.financialModelToolDefinition;
  });

  afterEach(() => {
    delete process.env.CODE_EXECUTION_ENABLED;
  });

  describe('Template Files', () => {
    const templateFiles = ['dcf.py', 'event_study.py', 'monte_carlo.py', 'regression.py', 'damages.py', 'comps.py', 'precedent.py', 'val_409a.py', 'benford.py', 'beneish.py', 'lbo.py', 'sotp.py', 'accretion_dilution.py', 'cvr.py', 'apv.py', 'earnout.py', 'spinoff.py', 'vc_method.py'];

    templateFiles.forEach(file => {
      test(`${file} template should exist`, () => {
        const templatePath = path.join(MODELS_DIR, file);
        expect(fs.existsSync(templatePath)).toBe(true);
      });

      test(`${file} template should contain DATA_PLACEHOLDER`, () => {
        const templatePath = path.join(MODELS_DIR, file);
        const content = fs.readFileSync(templatePath, 'utf8');
        expect(content).toContain('DATA_PLACEHOLDER');
      });

      test(`${file} template should contain PARAMS_PLACEHOLDER`, () => {
        const templatePath = path.join(MODELS_DIR, file);
        const content = fs.readFileSync(templatePath, 'utf8');
        expect(content).toContain('PARAMS_PLACEHOLDER');
      });

      test(`${file} template should have main execution block`, () => {
        const templatePath = path.join(MODELS_DIR, file);
        const content = fs.readFileSync(templatePath, 'utf8');
        expect(content).toContain("if __name__ == '__main__':");
      });

      test(`${file} template should output JSON`, () => {
        const templatePath = path.join(MODELS_DIR, file);
        const content = fs.readFileSync(templatePath, 'utf8');
        expect(content).toContain('json.dumps');
      });

      test(`${file} template should import required libraries`, () => {
        const templatePath = path.join(MODELS_DIR, file);
        const content = fs.readFileSync(templatePath, 'utf8');
        expect(content).toContain('import json');
        expect(content).toContain('import numpy');
      });
    });
  });

  describe('isCodeExecutionEnabled', () => {
    test('should return true when CODE_EXECUTION_ENABLED is not set', () => {
      delete process.env.CODE_EXECUTION_ENABLED;
      expect(isCodeExecutionEnabled()).toBe(true);
    });

    test('should return true when CODE_EXECUTION_ENABLED is true', () => {
      process.env.CODE_EXECUTION_ENABLED = 'true';
      expect(isCodeExecutionEnabled()).toBe(true);
    });

    test('should return false when CODE_EXECUTION_ENABLED is false', () => {
      process.env.CODE_EXECUTION_ENABLED = 'false';
      expect(isCodeExecutionEnabled()).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    test('should return all 18 model types', () => {
      const models = getAvailableModels();
      expect(Object.keys(models)).toHaveLength(18);
      expect(models).toHaveProperty('dcf');
      expect(models).toHaveProperty('event_study');
      expect(models).toHaveProperty('monte_carlo');
      expect(models).toHaveProperty('regression');
      expect(models).toHaveProperty('damages');
      expect(models).toHaveProperty('comps');
      expect(models).toHaveProperty('precedent');
      expect(models).toHaveProperty('val_409a');
      expect(models).toHaveProperty('benford');
      expect(models).toHaveProperty('beneish');
      expect(models).toHaveProperty('lbo');
      expect(models).toHaveProperty('sotp');
      expect(models).toHaveProperty('accretion_dilution');
      expect(models).toHaveProperty('cvr');
      expect(models).toHaveProperty('apv');
      expect(models).toHaveProperty('earnout');
      expect(models).toHaveProperty('spinoff');
      expect(models).toHaveProperty('vc_method');
    });

    test('each model should have required metadata', () => {
      const models = getAvailableModels();
      Object.entries(models).forEach(([key, model]) => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('description');
        expect(model).toHaveProperty('requiredData');
        expect(model).toHaveProperty('parameters');
        expect(Array.isArray(model.requiredData)).toBe(true);
        expect(Array.isArray(model.parameters)).toBe(true);
      });
    });

    test('DCF model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.dcf.requiredData).toContain('revenue');
    });

    test('Event study model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.event_study.requiredData).toContain('stock_prices');
      expect(models.event_study.requiredData).toContain('market_prices');
      expect(models.event_study.requiredData).toContain('event_date_index');
    });

    test('Monte Carlo model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.monte_carlo.requiredData).toContain('base_value');
      expect(models.monte_carlo.requiredData).toContain('variables');
    });

    test('Regression model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.regression.requiredData).toContain('dependent');
      expect(models.regression.requiredData).toContain('independents');
    });

    test('Damages model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.damages.requiredData).toContain('damages_components');
    });

    test('Comps model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.comps.requiredData).toContain('target');
      expect(models.comps.requiredData).toContain('comparables');
    });

    test('Precedent model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.precedent.requiredData).toContain('target');
      expect(models.precedent.requiredData).toContain('transactions');
    });

    test('409A model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.val_409a.requiredData).toContain('enterprise_value OR recent_financing');
      expect(models.val_409a.requiredData).toContain('preferred_series');
      expect(models.val_409a.requiredData).toContain('common_shares');
    });

    test('Benford model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.benford.requiredData).toContain('values');
    });

    test('Beneish model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.beneish.requiredData).toContain('accounts_receivable_t');
      expect(models.beneish.requiredData).toContain('sales_t');
    });

    test('LBO model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.lbo.requiredData).toContain('entry_ebitda');
      expect(models.lbo.requiredData).toContain('entry_multiple');
    });

    test('SOTP model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.sotp.requiredData).toContain('segments');
    });

    test('Accretion/Dilution model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.accretion_dilution.requiredData).toContain('acquirer');
      expect(models.accretion_dilution.requiredData).toContain('target');
    });

    test('CVR model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.cvr.requiredData).toContain('milestones');
    });

    test('APV model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.apv.requiredData).toContain('fcfs');
    });

    test('Earnout model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.earnout.requiredData).toContain('base_metric_value');
    });

    test('Spinoff model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.spinoff.requiredData).toContain('parent');
      expect(models.spinoff.requiredData).toContain('spinco');
    });

    test('VC Method model should have correct required data', () => {
      const models = getAvailableModels();
      expect(models.vc_method.requiredData).toContain('investment_amount');
      expect(models.vc_method.requiredData).toContain('pre_money_valuation');
    });
  });

  describe('financialModelToolDefinition', () => {
    test('should have correct tool name', () => {
      expect(financialModelToolDefinition.name).toBe('execute_financial_model');
    });

    test('should have description', () => {
      expect(financialModelToolDefinition.description).toBeTruthy();
      expect(financialModelToolDefinition.description.length).toBeGreaterThan(100);
    });

    test('should mention available models in description', () => {
      const desc = financialModelToolDefinition.description;
      expect(desc).toContain('dcf');
      expect(desc).toContain('event_study');
      expect(desc).toContain('monte_carlo');
      expect(desc).toContain('regression');
      expect(desc).toContain('damages');
      expect(desc).toContain('comps');
      expect(desc).toContain('precedent');
      expect(desc).toContain('val_409a');
      expect(desc).toContain('benford');
      expect(desc).toContain('beneish');
      expect(desc).toContain('lbo');
      expect(desc).toContain('sotp');
      expect(desc).toContain('accretion_dilution');
      expect(desc).toContain('cvr');
      expect(desc).toContain('apv');
      expect(desc).toContain('earnout');
      expect(desc).toContain('spinoff');
      expect(desc).toContain('vc_method');
    });

    test('should have valid input schema', () => {
      const schema = financialModelToolDefinition.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('modelType');
      expect(schema.properties).toHaveProperty('financialData');
      expect(schema.properties).toHaveProperty('parameters');
      expect(schema.required).toContain('modelType');
      expect(schema.required).toContain('financialData');
    });

    test('should have valid model type enum', () => {
      const modelTypes = financialModelToolDefinition.inputSchema.properties.modelType.enum;
      expect(modelTypes).toContain('dcf');
      expect(modelTypes).toContain('event_study');
      expect(modelTypes).toContain('monte_carlo');
      expect(modelTypes).toContain('regression');
      expect(modelTypes).toContain('damages');
      expect(modelTypes).toContain('comps');
      expect(modelTypes).toContain('precedent');
      expect(modelTypes).toContain('val_409a');
      expect(modelTypes).toContain('benford');
      expect(modelTypes).toContain('beneish');
      expect(modelTypes).toContain('lbo');
      expect(modelTypes).toContain('sotp');
      expect(modelTypes).toContain('accretion_dilution');
      expect(modelTypes).toContain('cvr');
      expect(modelTypes).toContain('apv');
      expect(modelTypes).toContain('earnout');
      expect(modelTypes).toContain('spinoff');
      expect(modelTypes).toContain('vc_method');
      expect(modelTypes).toHaveLength(18);
    });
  });

  describe('executeFinancialModel - Input Validation', () => {
    test('should reject invalid model type', async () => {
      const result = await executeFinancialModel({
        modelType: 'invalid_model',
        financialData: { test: true }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid model type');
      expect(result.attempts).toBe(0);
    });

    test('should reject missing financialData', async () => {
      const result = await executeFinancialModel({
        modelType: 'dcf'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('financialData is required');
    });

    test('should reject null financialData', async () => {
      const result = await executeFinancialModel({
        modelType: 'dcf',
        financialData: null
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('financialData is required');
    });

    test('should reject non-object financialData (string)', async () => {
      const result = await executeFinancialModel({
        modelType: 'dcf',
        financialData: 'not an object'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    test('should reject non-object financialData (number)', async () => {
      const result = await executeFinancialModel({
        modelType: 'dcf',
        financialData: 12345
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    test('should reject non-object financialData (array)', async () => {
      const result = await executeFinancialModel({
        modelType: 'dcf',
        financialData: [1, 2, 3]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    test('should return disabled error when CODE_EXECUTION_ENABLED is false', async () => {
      process.env.CODE_EXECUTION_ENABLED = 'false';

      const result = await executeFinancialModel({
        modelType: 'dcf',
        financialData: { revenue: [100, 110, 121] }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
      expect(result.attempts).toBe(0);
    });

    test('should accept valid input structure for DCF', async () => {
      // This test verifies the input passes validation
      // The actual API call will fail without mocking, but we verify the error is API-related not validation
      const result = await executeFinancialModel({
        modelType: 'dcf',
        financialData: { revenue: [100, 110, 121, 133, 146] },
        parameters: { wacc: 0.10 }
      });

      // If validation failed, error would mention "Invalid model type" or "financialData"
      // API-related errors are different
      if (!result.success) {
        expect(result.error).not.toContain('Invalid model type');
        expect(result.error).not.toContain('financialData is required');
        expect(result.error).not.toContain('must be an object');
        expect(result.error).not.toContain('disabled');
      }
    });

    test('should accept valid input for each model type', async () => {
      const testCases = [
        { modelType: 'dcf', financialData: { revenue: [100] } },
        { modelType: 'event_study', financialData: { stock_prices: [100], market_prices: [100], event_date_index: 0 } },
        { modelType: 'monte_carlo', financialData: { base_value: 1000, variables: [] } },
        { modelType: 'regression', financialData: { dependent: [1], independents: {} } },
        { modelType: 'damages', financialData: { damages_components: [] } },
        { modelType: 'comps', financialData: { target: { ltm_revenue: 100 }, comparables: [] } },
        { modelType: 'precedent', financialData: { target: { ltm_revenue: 100 }, transactions: [] } },
        { modelType: 'val_409a', financialData: { enterprise_value: 10000000, preferred_series: [], common_shares: 1000000 } },
        { modelType: 'benford', financialData: { values: [100, 200, 300], data_name: 'Test Data' } },
        { modelType: 'beneish', financialData: { accounts_receivable_t: 100, sales_t: 1000, accounts_receivable_t1: 90, sales_t1: 900, total_assets_t: 5000 } },
        { modelType: 'lbo', financialData: { entry_ebitda: 100, entry_multiple: 8.0 } },
        { modelType: 'sotp', financialData: { segments: [{ name: 'Segment A', ebitda: 50, multiple: 8 }] } },
        { modelType: 'accretion_dilution', financialData: { acquirer: { shares_outstanding: 100, net_income: 500 }, target: { shares_outstanding: 50, net_income: 100 } } },
        { modelType: 'cvr', financialData: { milestones: [{ name: 'Milestone 1', payment: 20, probability: 0.5 }] } },
        { modelType: 'apv', financialData: { fcfs: [100, 110, 120, 130, 140] } },
        { modelType: 'earnout', financialData: { base_metric_value: 90 } },
        { modelType: 'spinoff', financialData: { parent: { ebitda: 500, multiple: 8 }, spinco: { ebitda: 100, standalone_multiple: 10 } } },
        { modelType: 'vc_method', financialData: { investment_amount: 10, pre_money_valuation: 40, exit_revenue: 100 } }
      ];

      for (const testCase of testCases) {
        const result = await executeFinancialModel(testCase);
        // Verify it doesn't fail on input validation
        if (!result.success) {
          expect(result.error).not.toContain('Invalid model type');
          expect(result.error).not.toContain('financialData is required');
        }
      }
    });
  });

  describe('Handler File Integrity', () => {
    test('handler file should exist', () => {
      expect(fs.existsSync(HANDLER_PATH)).toBe(true);
    });

    test('handler should export executeFinancialModel function', async () => {
      const handler = await import('../../../src/tools/financialModelHandler.js');
      expect(typeof handler.executeFinancialModel).toBe('function');
    });

    test('handler should export isCodeExecutionEnabled function', async () => {
      const handler = await import('../../../src/tools/financialModelHandler.js');
      expect(typeof handler.isCodeExecutionEnabled).toBe('function');
    });

    test('handler should export getAvailableModels function', async () => {
      const handler = await import('../../../src/tools/financialModelHandler.js');
      expect(typeof handler.getAvailableModels).toBe('function');
    });

    test('handler should export financialModelToolDefinition object', async () => {
      const handler = await import('../../../src/tools/financialModelHandler.js');
      expect(typeof handler.financialModelToolDefinition).toBe('object');
    });

    test('handler should export default function', async () => {
      const handler = await import('../../../src/tools/financialModelHandler.js');
      expect(typeof handler.default).toBe('function');
    });
  });

  describe('Template Content Validation', () => {
    test('DCF template should have calculate_dcf function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'dcf.py'), 'utf8');
      expect(content).toContain('def calculate_dcf');
    });

    test('Event study template should have calculate_event_study function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'event_study.py'), 'utf8');
      expect(content).toContain('def calculate_event_study');
    });

    test('Monte Carlo template should have calculate_monte_carlo function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'monte_carlo.py'), 'utf8');
      expect(content).toContain('def calculate_monte_carlo');
    });

    test('Regression template should have calculate_regression function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'regression.py'), 'utf8');
      expect(content).toContain('def calculate_regression');
    });

    test('Damages template should have calculate_damages function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'damages.py'), 'utf8');
      expect(content).toContain('def calculate_damages');
    });

    test('All templates should have generate_charts function', () => {
      const templates = ['dcf.py', 'event_study.py', 'monte_carlo.py', 'regression.py', 'damages.py', 'comps.py', 'precedent.py', 'val_409a.py', 'benford.py', 'beneish.py', 'lbo.py', 'sotp.py', 'accretion_dilution.py', 'cvr.py', 'apv.py', 'earnout.py', 'spinoff.py', 'vc_method.py'];
      templates.forEach(file => {
        const content = fs.readFileSync(path.join(MODELS_DIR, file), 'utf8');
        expect(content).toContain('def generate_charts');
      });
    });

    test('All templates should use matplotlib for charts', () => {
      const templates = ['dcf.py', 'event_study.py', 'monte_carlo.py', 'regression.py', 'damages.py', 'comps.py', 'precedent.py', 'val_409a.py', 'benford.py', 'beneish.py', 'lbo.py', 'sotp.py', 'accretion_dilution.py', 'cvr.py', 'apv.py', 'earnout.py', 'spinoff.py', 'vc_method.py'];
      templates.forEach(file => {
        const content = fs.readFileSync(path.join(MODELS_DIR, file), 'utf8');
        expect(content).toContain('import matplotlib');
      });
    });

    test('All templates should encode charts as base64', () => {
      const templates = ['dcf.py', 'event_study.py', 'monte_carlo.py', 'regression.py', 'damages.py', 'comps.py', 'precedent.py', 'val_409a.py', 'benford.py', 'beneish.py', 'lbo.py', 'sotp.py', 'accretion_dilution.py', 'cvr.py', 'apv.py', 'earnout.py', 'spinoff.py', 'vc_method.py'];
      templates.forEach(file => {
        const content = fs.readFileSync(path.join(MODELS_DIR, file), 'utf8');
        expect(content).toContain('base64');
      });
    });

    test('Comps template should have calculate_comps function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'comps.py'), 'utf8');
      expect(content).toContain('def calculate_comps');
    });

    test('Precedent template should have calculate_precedent function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'precedent.py'), 'utf8');
      expect(content).toContain('def calculate_precedent');
    });

    test('409A template should have calculate_409a function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'val_409a.py'), 'utf8');
      expect(content).toContain('def calculate_409a');
    });

    test('Benford template should have calculate_benford function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'benford.py'), 'utf8');
      expect(content).toContain('def calculate_benford');
    });

    test('Beneish template should have calculate_beneish function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'beneish.py'), 'utf8');
      expect(content).toContain('def calculate_beneish');
    });

    test('LBO template should have calculate_lbo function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'lbo.py'), 'utf8');
      expect(content).toContain('def calculate_lbo');
    });

    test('SOTP template should have calculate_sotp function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'sotp.py'), 'utf8');
      expect(content).toContain('def calculate_sotp');
    });

    test('Accretion/Dilution template should have calculate_accretion_dilution function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'accretion_dilution.py'), 'utf8');
      expect(content).toContain('def calculate_accretion_dilution');
    });

    test('CVR template should have calculate_cvr function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'cvr.py'), 'utf8');
      expect(content).toContain('def calculate_cvr');
    });

    test('APV template should have calculate_apv function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'apv.py'), 'utf8');
      expect(content).toContain('def calculate_apv');
    });

    test('Earnout template should have calculate_earnout function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'earnout.py'), 'utf8');
      expect(content).toContain('def calculate_earnout');
    });

    test('Spinoff template should have calculate_spinoff function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'spinoff.py'), 'utf8');
      expect(content).toContain('def calculate_spinoff');
    });

    test('VC Method template should have calculate_vc_method function', () => {
      const content = fs.readFileSync(path.join(MODELS_DIR, 'vc_method.py'), 'utf8');
      expect(content).toContain('def calculate_vc_method');
    });
  });
});
