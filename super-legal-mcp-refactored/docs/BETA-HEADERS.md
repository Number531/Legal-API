# Beta Header Usage

## Core Headers (always on)
- `interleaved-thinking-2025-05-14` — thinking blocks
- `fine-grained-tool-streaming-2025-05-14` — incremental tool params

## Conditional Headers
- `structured-outputs-2025-11-13` — when `output_format` is set
- `context-1m-2025-08-07` — only for large context needs
- `code-execution-2025-08-25`, `skills-2025-10-02` — when skills container present

## Builder Reference
- Code: `src/utils/skillsRequestBuilder.js` (`buildBetaHeader`)
- Config flags: `STRUCTURED_OUTPUTS`, `SKILLS_ENABLED`

## Example
```javascript
const beta = buildBetaHeader({
  includeStructuredOutputs: true,
  includeSkills: true
});
// yields: interleaved-thinking, fine-grained-tool-streaming, structured-outputs, code-execution, skills
```

## Compatibility
- Structured outputs require schema (`output_format: { type: 'json_schema', ... }`)
- Skills require container with managed/custom skills
- Avoid `context-1m` unless needed; higher cost


