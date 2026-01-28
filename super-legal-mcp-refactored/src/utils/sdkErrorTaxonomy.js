export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
  TOOL_EXECUTION_ERROR: 'TOOL_EXECUTION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  OVERLOADED_ERROR: 'OVERLOADED_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

const HTTP_MAP = {
  NETWORK_ERROR: 502,
  VALIDATION_ERROR: 400,
  TIMEOUT_ERROR: 504,
  RATE_LIMIT_ERROR: 429,
  CIRCUIT_BREAKER_OPEN: 503,
  TOOL_EXECUTION_ERROR: 500,
  AUTHENTICATION_ERROR: 401,
  PERMISSION_ERROR: 403,
  OVERLOADED_ERROR: 529,
  UNKNOWN_ERROR: 500
};

export function toErrorResponse(code, message, details = {}, requestId = null) {
  const status = HTTP_MAP[code] || 500;
  return {
    status,
    body: {
      error: {
        code,
        message,
        details,
        request_id: requestId || undefined
      }
    }
  };
}

export function mapExceptionToCode(err) {
  if (!err) return ERROR_CODES.UNKNOWN_ERROR;
  if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') return ERROR_CODES.TIMEOUT_ERROR;
  if (err.status === 429) return ERROR_CODES.RATE_LIMIT_ERROR;
  if (err.status === 401) return ERROR_CODES.AUTHENTICATION_ERROR;
  if (err.status === 403) return ERROR_CODES.PERMISSION_ERROR;
  if (err.status === 529) return ERROR_CODES.OVERLOADED_ERROR;
  if (err.status === 400 || err.name === 'ValidationError') return ERROR_CODES.VALIDATION_ERROR;
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') return ERROR_CODES.NETWORK_ERROR;
  return ERROR_CODES.UNKNOWN_ERROR;
}

