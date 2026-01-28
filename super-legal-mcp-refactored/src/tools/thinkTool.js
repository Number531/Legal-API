export const thinkTool = {
  name: 'think',
  description:
    'Pause and reason through complex problems. Use for multi-step analysis, verifying information, or planning before proceeding.',
  inputSchema: {
    type: 'object',
    properties: {
      thought: {
        type: 'string',
        description: 'Your reasoning or analysis of the current situation'
      }
    },
    required: ['thought']
  },
  handler: async ({ thought }) => {
    const preview = typeof thought === 'string' ? thought.slice(0, 100) : '';
    console.log(`[think] ${preview}...`);
    return 'Thought recorded. Continue with your analysis.';
  }
};

