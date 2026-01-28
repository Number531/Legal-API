const REQUIRED_FIELDS = ['name', 'description', 'input_schema'];

function validateSchema(tool, errors) {
  if (!tool.input_schema || tool.input_schema.type !== 'object') {
    errors.push(`${tool.name || 'unknown'}: input_schema must be an object schema`);
    return;
  }

  if (!tool.input_schema.properties) {
    errors.push(`${tool.name}: input_schema missing properties`);
  }

  if (tool.input_schema.required && !Array.isArray(tool.input_schema.required)) {
    errors.push(`${tool.name}: input_schema.required must be an array when present`);
  }

  if (tool.input_schema.properties) {
    for (const [param, def] of Object.entries(tool.input_schema.properties)) {
      if (def.type === 'number' && param.toLowerCase().includes('limit') && !def.maximum) {
        errors.push(`${tool.name}.${param}: numeric limit missing maximum`);
      }
    }
  }
}

export async function validateMCPTools(tools = [], connector) {
  const errors = [];

  tools.forEach((tool) => {
    REQUIRED_FIELDS.forEach((field) => {
      if (!tool?.[field]) {
        errors.push(`${tool?.name || 'unknown'}: missing '${field}'`);
      }
    });

    validateSchema(tool, errors);
  });

  if (errors.length) {
    throw new Error(`MCP tool validation failed:\n${errors.join('\n')}`);
  }

  if (connector) {
    for (const tool of tools) {
      try {
        await connector.callTool(tool.name, {}); // Reachability probe
      } catch (err) {
        if (err?.code !== 'INVALID_PARAMS') {
          errors.push(`${tool.name}: handler unreachable (${err?.message || err})`);
        }
      }
    }
  }

  if (errors.length) {
    throw new Error(`MCP tool validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

