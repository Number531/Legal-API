import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export function validateSchema(data, schema) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: validate.errors || null };
}

const metrics = {
  attempts: 0,
  success: 0,
  failure: 0
};

export function recordStructuredOutputMetrics(toolName, valid) {
  metrics.attempts += 1;
  if (valid) {
    metrics.success += 1;
  } else {
    metrics.failure += 1;
  }
  // Hook for external logging/telemetry if needed
  console.log(`[structured-output] tool=${toolName} valid=${valid} attempts=${metrics.attempts} success=${metrics.success} failure=${metrics.failure}`);
}

export function getStructuredOutputMetrics() {
  return { ...metrics };
}

export function safeParseStructured(text, schema, toolName = 'unknown') {
  try {
    const parsed = JSON.parse(text);
    const { valid, errors } = validateSchema(parsed, schema);
    recordStructuredOutputMetrics(toolName, valid);
    if (!valid) {
      return { valid: false, errors, parsed };
    }
    return { valid: true, parsed, errors: null };
  } catch (error) {
    recordStructuredOutputMetrics(toolName, false);
    return { valid: false, errors: [{ message: error.message }], parsed: null };
  }
}

