# Tool Permission Configuration

Config file: `src/config/toolPermissions.js`

## Structure
```javascript
export const TOOL_PERMISSIONS = {
  '/api/research': {
    allowedTools: [],      // empty = allow all known tools
    disallowedTools: [],   // use ['*'] to block all
    parallelExecution: true
  }
};
```

## Guidance
- Use allowlists for sensitive routes; default open on research routes
- Disallow `*` for admin/internal routes
- Set `parallelExecution=false` when tools have dependencies (e.g., sequential SEC -> EPA)
- Pair with input validation and quotas for safety

## Example: SEC-only route
```javascript
TOOL_PERMISSIONS['/api/sec'] = {
  allowedTools: ['search_sec_filings', 'get_sec_company_info'],
  disallowedTools: [],
  parallelExecution: true
};
```

## Testing
- Unit: see `test/sdk/safety.test.js` (allowlist enforcement)
- Runtime: log filtered tools when building SDK tools


