const suspiciousPatterns = [
  /ignore (previous|all|above) (instructions|prompts)/i,
  /system prompt/i,
  /\[SYSTEM\]/i,
  /you are (now|actually)/i,
  /new (directive|instructions)/i,
  /<\|im_start\|\>/i
];

function validateToolChoiceWithThinking(body) {
  const thinkingEnabled = body?.thinking?.type === 'enabled';
  const toolChoice = body?.tool_choice;
  if (thinkingEnabled && toolChoice) {
    const type = toolChoice.type || toolChoice;
    if (type === 'any' || (type === 'tool' && toolChoice.name)) {
      return {
        valid: false,
        error: 'tool_choice "any" or specific tool not supported with extended thinking'
      };
    }
  }
  return { valid: true };
}

export function inputValidationMiddleware(req, res, next) {
  try {
    const content = JSON.stringify(req.body || '');
    if (content.length > 100000) {
      return res.status(400).json({ error: 'Input rejected: message too long' });
    }
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return res
          .status(400)
          .json({ error: 'Input rejected: potential prompt injection detected' });
      }
    }
    const toolChoiceCheck = validateToolChoiceWithThinking(req.body);
    if (!toolChoiceCheck.valid) {
      return res.status(400).json({ error: toolChoiceCheck.error });
    }
    return next();
  } catch (err) {
    return res.status(400).json({ error: 'Input validation failed' });
  }
}

