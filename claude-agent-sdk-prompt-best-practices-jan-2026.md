# Claude Agent SDK Prompt Design Best Practices (January 2026)

**Research Date:** January 4, 2026
**Topic:** Anthropic Claude Agent SDK - Subagent Prompt Engineering
**SDK Version:** Claude Agent SDK (formerly Claude Code SDK)
**Model Coverage:** Claude 4.5 (Sonnet 4.5, Opus 4.5, Haiku 4.5)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Recommended Prompt Size for Subagents](#recommended-prompt-size-for-subagents)
3. [Prompt Granularity Best Practices](#prompt-granularity-best-practices)
4. [Explicit Instruction Patterns](#explicit-instruction-patterns)
5. [Context Passing to Subagents](#context-passing-to-subagents)
6. [Implementation Examples](#implementation-examples)
7. [References](#references)

---

## Executive Summary

Based on official Anthropic documentation and engineering blog posts from late 2025 through January 2026, this report provides comprehensive guidance on prompt engineering for the Claude Agent SDK, with specific focus on subagent configuration.

### Key Findings

1. **Prompt Size**: No specific token limits mentioned for subagent prompts, but comprehensive detail is strongly encouraged over brevity
2. **Granularity**: Anthropic explicitly recommends detailed, specific instructions over vague, concise prompts
3. **Explicit Instructions**: Documentation strongly endorses explicit "do NOT" instructions and prerequisite validation
4. **Context Passing**: Subagents use isolated context windows; orchestrator should pass explicit parameters rather than relying on file reading

---

## Recommended Prompt Size for Subagents

### Token Limits and Context Windows

**Model Context Windows** (as of January 2026):
- Standard API/Paid plans: 200,000+ tokens (~500 pages of text)
- Claude for Work (Team/Enterprise): 500,000 tokens with Sonnet 4
- No specific subagent prompt size limits documented

**Source:** [Understanding Usage and Length Limits](https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits)

### Prompt Length vs. Effectiveness

Anthropic's official guidance strongly favors **detailed, comprehensive prompts** over brevity:

> "Claude Code's success rate improves significantly with more specific instructions, especially on first attempts."

**Source:** [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)

### Anti-Pattern: Short, Vague Instructions

From Anthropic's multi-agent research system case study:

> "Anthropic started by allowing the lead agent to give simple, short instructions like 'research the semiconductor shortage,' but found these instructions often were vague enough that subagents misinterpreted the task or performed the exact same searches as other agents."

**Real-world failure example**: One subagent investigated the 2021 automotive chip crisis while two others duplicated efforts on 2025 supply chains due to vague delegation.

**Source:** [Building a Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

### Recommended Approach

**Each subagent needs:**
1. Clear objective
2. Explicit output format
3. Guidance on tools and sources to use
4. Clear task boundaries
5. Division of labor specifications

**Source:** [Building a Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

### Token Management Strategies

For long-running agents approaching context limits:

```text
Your context window will be automatically compacted as it approaches its limit,
allowing you to continue working indefinitely from where you left off. Therefore,
do not stop tasks early due to token budget concerns. As you approach your token
budget limit, save your current progress and state to memory before the context
window refreshes. Always be as persistent and autonomous as possible and complete
tasks fully, even if the end of your budget is approaching. Never artificially
stop any task early regardless of the context remaining.
```

**Source:** [Claude 4 Best Practices - Context awareness](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

---

## Prompt Granularity Best Practices

### Core Principle: Explicit Over Implicit

Claude 4.x models are trained for **precise instruction following** and respond well to clear, explicit instructions:

> "Being specific about your desired output can help enhance results. Customers who desire the 'above and beyond' behavior from previous Claude models might need to more explicitly request these behaviors with newer models."

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

### Detailed vs. Concise Instructions

**Less Effective** (vague):
```text
Create an analytics dashboard
```

**More Effective** (detailed):
```text
Create an analytics dashboard. Include as many relevant features and interactions
as possible. Go beyond the basics to create a fully-featured implementation.
```

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

### Step-by-Step Instructions: Recommended

Anthropic explicitly recommends planning before implementation:

> "Request Claude 'make a plan for how to approach a specific problem' before coding. The guidance notes this is crucial—'without them, Claude tends to jump straight to coding a solution.'"

**Source:** [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Subagent Prompt Structure

**AgentDefinition Configuration Fields:**

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `description` | `string` | Yes | Natural language description of when to use this agent (3-5 sentences recommended) |
| `prompt` | `string` | Yes | The agent's system prompt defining its role and behavior (detailed recommended) |
| `tools` | `string[]` | No | Array of allowed tool names. If omitted, inherits all tools |
| `model` | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit'` | No | Model override for this agent |

**Source:** [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents)

### Example: Detailed Subagent Prompt

```python
AgentDefinition(
    description="Expert code review specialist. Use for quality, security, and maintainability reviews.",
    prompt="""You are a code review specialist with expertise in security, performance, and best practices.

When reviewing code:
- Identify security vulnerabilities
- Check for performance issues
- Verify adherence to coding standards
- Suggest specific improvements

Be thorough but concise in your feedback.""",
    tools=["Read", "Grep", "Glob"],
    model="sonnet"
)
```

**Source:** [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents)

### Context-Driven Instructions

Adding context or motivation behind instructions improves performance:

**Less effective:**
```text
NEVER use ellipses
```

**More effective:**
```text
Your response will be read aloud by a text-to-speech engine, so never use ellipses
since the text-to-speech engine will not know how to pronounce them.
```

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

---

## Explicit Instruction Patterns

### "Do NOT" Instructions: Strongly Recommended

Anthropic's documentation extensively uses explicit negative instructions across multiple contexts:

#### Example 1: Feature List Management

> "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality"

**Source:** [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

#### Example 2: Code Exploration

```text
ALWAYS read and understand relevant files before proposing code edits.
Do not speculate about code you have not inspected. If the user references
a specific file/path, you MUST open and inspect it before explaining or
proposing fixes.
```

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

#### Example 3: Minimizing Hallucinations

```text
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a
specific file, you MUST read the file before answering. Make sure to investigate
and read relevant files BEFORE answering questions about the codebase. Never make
any claims about code before investigating unless you are certain of the correct
answer - give grounded and hallucination-free answers.
</investigate_before_answering>
```

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

#### Example 4: Avoiding Overengineering

```text
Avoid over-engineering. Only make changes that are directly requested or clearly necessary.
Keep solutions simple and focused.

Don't add features, refactor code, or make "improvements" beyond what was asked.
A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need
extra configurability.

Don't add error handling, fallbacks, or validation for scenarios that can't happen.
```

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

### Prerequisite Validation Before Task Execution

Anthropic's effective harness design explicitly recommends validation steps:

**Session Startup Sequence:**
1. Verify working directory (`pwd`)
2. Read git logs and progress files
3. Run basic end-to-end tests before implementing new features
4. Select highest-priority incomplete feature

**Source:** [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

### Positive vs. Negative Framing

While explicit "do NOT" instructions are recommended, Anthropic also suggests balancing with positive instructions:

**For output formatting:**

> "Tell Claude what to do instead of what not to do"
> - Instead of: "Do not use markdown in your response"
> - Try: "Your response should be composed of smoothly flowing prose paragraphs."

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

### XML Tags for Critical Instructions

Anthropic frequently uses XML tags to emphasize important directives:

```text
<default_to_action>
By default, implement changes rather than only suggesting them. If the user's
intent is unclear, infer the most useful likely action and proceed, using tools
to discover any missing details instead of guessing.
</default_to_action>
```

**Source:** [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)

---

## Context Passing to Subagents

### Subagent Context Isolation

**Key Architecture Principle:**

> "Subagents maintain separate context from the main agent, preventing information overload and keeping interactions focused. This isolation ensures that specialized tasks don't pollute the main conversation context with irrelevant details."

**Source:** [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents)

### Context Isolation vs. Context Injection

**How Subagents Receive Context:**

1. **Isolated Context Windows**: Each subagent operates in its own separate context
2. **Task Tool Interface**: Subagents are invoked via the Task tool with explicit parameters
3. **Return Relevant Information Only**: Subagents send back only relevant findings, not full context

**Source:** [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents)

### Task Tool Structure for Subagent Invocation

```typescript
{
  description: "short 3-5 word description of the task",
  prompt: "the task for the agent to perform",
  subagent_type: "the type of specialized agent to use"
}
```

**Source:** [Claude Agent SDK Best Practices](https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/)

### Best Practice: Explicit Parameter Passing

**Recommended Pattern**: Pass explicit parameters through the Task tool rather than assuming subagents will read files:

```python
# Orchestrator explicitly passes context via prompt parameter
async for message in query(
    prompt="Use the code-reviewer agent to review the authentication module at /src/auth.py",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Task"],
        agents={
            "code-reviewer": AgentDefinition(
                description="Expert code reviewer for security and quality reviews.",
                prompt="""You are a code review specialist.

When reviewing code:
- Read the specified file path first
- Identify security vulnerabilities
- Check for performance issues
- Provide specific, actionable feedback""",
                tools=["Read", "Grep", "Glob"]
            )
        }
    )
)
```

### Setting Sources for Context Isolation

Control which settings are loaded using the `setting_sources` parameter:

> "When `setting_sources` is omitted or `None`, the SDK does not load any filesystem settings. This provides isolation for SDK applications."

**Source:** [Agent SDK Context Isolation](https://platform.claude.com/docs/en/agent-sdk/overview)

**Configuration Options:**
```python
# Isolated subagent (no filesystem settings)
setting_sources=None

# Load only project settings
setting_sources=["project"]

# Full settings hierarchy
setting_sources=["user", "project", "local"]
```

### File Reading vs. Parameter Injection

**Current Best Practice** (based on documentation patterns):

1. **Explicit Task Instructions**: The orchestrator should provide specific file paths and context in the task prompt
2. **Tool Access**: Subagents should have Read/Grep tools to access files directly
3. **Boundary Definition**: Clearly specify which files/directories are in scope

**Example from Documentation:**

```python
prompt="Review the authentication module for security issues"
# The subagent will use Read tools to access the module
# The orchestrator doesn't need to read and pass file contents
```

**Source:** [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents)

### Multi-Agent Research System Pattern

From Anthropic's research system, detailed task delegation includes:

1. **Objective**: What the subagent should accomplish
2. **Output Format**: Expected structure of results
3. **Tools and Sources**: Which tools to use and where to look
4. **Task Boundaries**: Clear scope limitations

**Source:** [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

### CLAUDE.md for Shared Context

For context that should be available to all agents:

> "CLAUDE.md is a special file that Claude automatically pulls into context when starting a conversation. This makes it an ideal place for documenting repository etiquette, developer environment setup, and any unexpected behaviors particular to the project."

**Recommendations:**
- Keep CLAUDE.md concise and human-readable
- No required format
- Use for project-wide conventions

**Source:** [Building Agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

### Orchestrator State Management

**Best Practices for Orchestrator:**

> "Isolate per-subagent context, let the orchestrator maintain the global plan and a compact state (not every detail), and use CLAUDE.md to encode project conventions so agents converge on shared standards."

**Source:** [Claude Agent SDK Best Practices](https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/)

---

## Implementation Examples

### Example 1: Security Review Subagent with Explicit Instructions

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def main():
    async for message in query(
        prompt="Use the security-reviewer agent to audit /src/auth.py for vulnerabilities",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob", "Task"],
            agents={
                "security-reviewer": AgentDefinition(
                    description="Security code reviewer specializing in vulnerability detection and secure coding practices.",
                    prompt="""You are a security code review specialist with deep expertise in application security.

Your responsibilities:
1. ALWAYS read the complete file before analyzing (DO NOT speculate about code you haven't seen)
2. Identify security vulnerabilities (SQL injection, XSS, CSRF, authentication issues, etc.)
3. Check for secure coding practices (input validation, error handling, secrets management)
4. Verify adherence to OWASP Top 10 guidelines
5. Provide specific, actionable remediation recommendations

Critical rules:
- DO NOT make assumptions about code structure without reading files
- DO NOT suggest changes without understanding the full context
- MUST verify that proposed fixes don't introduce new vulnerabilities
- ALWAYS explain the security impact of identified issues

Output format:
- List each vulnerability with severity (Critical/High/Medium/Low)
- Provide specific line numbers and code excerpts
- Include detailed remediation steps
- Reference relevant OWASP guidelines

Be thorough and precise in your analysis.""",
                    tools=["Read", "Grep", "Glob"],
                    model="opus"  # Use more capable model for critical security reviews
                )
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

### Example 2: Test-Driven Development Workflow

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def main():
    async for message in query(
        prompt="""Implement the user registration feature using TDD:
        1. Use test-writer to create comprehensive tests first
        2. Use implementer to make the tests pass
        3. Use code-reviewer to verify the implementation""",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob", "Task"],
            agents={
                "test-writer": AgentDefinition(
                    description="Test specialist who writes comprehensive test suites before implementation.",
                    prompt="""You are a test-driven development specialist.

Your process:
1. Read existing test files to understand testing patterns
2. Create tests in tests/ directory following project conventions
3. Write tests that MUST fail initially (feature not yet implemented)
4. Cover edge cases, error conditions, and happy paths
5. Use descriptive test names and clear assertions

Critical rules:
- DO NOT implement any production code
- Tests MUST be runnable and initially failing
- Follow existing test file naming conventions
- Include setup/teardown as needed
- Document test requirements clearly

Test coverage requirements:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling and validation
- Security requirements""",
                    tools=["Read", "Write", "Grep", "Glob", "Bash"],
                    model="sonnet"
                ),
                "implementer": AgentDefinition(
                    description="Implementation specialist who writes production code to make tests pass.",
                    prompt="""You are a software implementation specialist.

Your process:
1. Read and understand ALL test requirements first
2. Run tests to verify they fail (DO NOT proceed if tests pass already)
3. Implement the minimum code needed to make tests pass
4. Re-run tests after each change
5. Refactor only after tests pass

Critical rules:
- NEVER modify or remove tests (tests define requirements)
- NEVER hard-code solutions to pass specific test cases
- Implement general-purpose solutions that work for all valid inputs
- DO NOT add features beyond test requirements
- MUST run full test suite before declaring completion

If tests are incorrect or requirements unclear:
- Report the issue instead of working around it
- DO NOT guess at intended behavior""",
                    tools=["Read", "Edit", "Write", "Bash", "Grep", "Glob"],
                    model="sonnet"
                ),
                "code-reviewer": AgentDefinition(
                    description="Code review specialist ensuring quality, security, and maintainability.",
                    prompt="""You are a senior code reviewer.

Review criteria:
1. Code quality and readability
2. Security vulnerabilities
3. Performance implications
4. Test coverage adequacy
5. Documentation completeness

Verification steps:
1. Read all modified files completely
2. Run full test suite (must be 100% passing)
3. Check for security issues
4. Verify error handling
5. Ensure code follows project conventions

Provide actionable feedback with specific line numbers and examples.""",
                    tools=["Read", "Bash", "Grep", "Glob"],
                    model="opus"
                )
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

### Example 3: Multi-Agent Research with Explicit Task Decomposition

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def main():
    async for message in query(
        prompt="""Research the current state of AI agent orchestration frameworks.

        Decompose this into parallel subagent tasks:
        1. Use academic-researcher for scholarly papers (2023-2026)
        2. Use industry-analyzer for commercial implementations
        3. Use technical-reviewer for GitHub repositories and open source projects

        Each subagent should return structured findings with sources.""",
        options=ClaudeAgentOptions(
            allowed_tools=["WebSearch", "WebFetch", "Read", "Write", "Task"],
            agents={
                "academic-researcher": AgentDefinition(
                    description="Academic research specialist for scholarly papers and research publications.",
                    prompt="""You are an academic research specialist.

Task boundaries:
- Focus ONLY on peer-reviewed papers, arXiv preprints, and conference proceedings
- Date range: 2023-2026 publications only
- Search academic databases and research repositories

Research process:
1. Search for relevant papers using academic keywords
2. Identify 5-10 most cited/relevant papers
3. Extract key findings, methodologies, and conclusions
4. Cross-reference claims across multiple papers

Output format (JSON):
{
  "papers": [
    {
      "title": "Paper title",
      "authors": ["Author 1", "Author 2"],
      "publication": "Conference/Journal",
      "date": "YYYY-MM",
      "url": "https://...",
      "key_findings": ["finding 1", "finding 2"],
      "methodology": "Brief description",
      "citations": 123
    }
  ],
  "summary": "2-3 paragraph synthesis of findings",
  "trends": ["trend 1", "trend 2"]
}

DO NOT include:
- Blog posts or informal content
- Commercial whitepapers
- Undated or pre-2023 publications""",
                    tools=["WebSearch", "WebFetch"],
                    model="sonnet"
                ),
                "industry-analyzer": AgentDefinition(
                    description="Industry analysis specialist for commercial frameworks and enterprise implementations.",
                    prompt="""You are an industry analysis specialist.

Task boundaries:
- Focus on commercial products, enterprise frameworks, and vendor solutions
- Analyze feature sets, pricing, and enterprise adoption
- Identify major vendors and market leaders

Research process:
1. Identify major vendors and products
2. Compare feature sets and capabilities
3. Research enterprise case studies
4. Analyze pricing and licensing models

Output format (JSON):
{
  "vendors": [
    {
      "name": "Vendor name",
      "product": "Product name",
      "url": "https://...",
      "key_features": ["feature 1", "feature 2"],
      "pricing_model": "Description",
      "enterprise_clients": ["client 1", "client 2"],
      "last_updated": "YYYY-MM"
    }
  ],
  "market_analysis": "2-3 paragraph market overview",
  "trends": ["trend 1", "trend 2"]
}

DO NOT include:
- Academic papers
- Open source projects (handled by technical-reviewer)
- Outdated or deprecated solutions""",
                    tools=["WebSearch", "WebFetch"],
                    model="sonnet"
                ),
                "technical-reviewer": AgentDefinition(
                    description="Technical analysis specialist for open source projects and GitHub repositories.",
                    prompt="""You are a technical analysis specialist for open source projects.

Task boundaries:
- Focus on GitHub repositories, open source frameworks, and developer tools
- Analyze code quality, community activity, and documentation
- Exclude commercial products (handled by industry-analyzer)

Research process:
1. Search GitHub for relevant repositories (stars > 1000)
2. Analyze repository activity (commits, releases, contributors)
3. Review documentation quality and examples
4. Check issue resolution and community engagement

Output format (JSON):
{
  "repositories": [
    {
      "name": "Repo name",
      "url": "https://github.com/...",
      "stars": 12345,
      "language": "Python/TypeScript/etc",
      "last_commit": "YYYY-MM-DD",
      "key_features": ["feature 1", "feature 2"],
      "community_health": "Active/Moderate/Inactive",
      "documentation_quality": "Excellent/Good/Fair/Poor"
    }
  ],
  "ecosystem_analysis": "2-3 paragraph analysis of open source landscape",
  "recommended_projects": ["project 1", "project 2"]
}

DO NOT include:
- Repositories with < 1000 stars
- Inactive projects (no commits in 6+ months)
- Commercial products""",
                    tools=["WebSearch", "WebFetch"],
                    model="sonnet"
                )
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

### Example 4: Dynamic Subagent Configuration

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

def create_code_analyzer(strictness: str, language: str) -> AgentDefinition:
    """Factory function for creating language-specific code analyzers with variable strictness."""

    strict_rules = """
Critical rules (strict mode):
- ZERO tolerance for security vulnerabilities
- ALL edge cases must be handled
- 100% test coverage required
- NO technical debt accumulation
- Performance benchmarks must be met
""" if strictness == "strict" else """
Standard rules:
- Address critical security issues
- Handle common edge cases
- Aim for >80% test coverage
- Document technical debt for future resolution
"""

    language_specifics = {
        "python": {
            "tools": ["Read", "Grep", "Glob", "Bash"],
            "checks": """
Python-specific checks:
- PEP 8 compliance (run: black --check .)
- Type hints coverage (run: mypy .)
- Security scanning (run: bandit -r .)
- Dependency vulnerabilities (run: safety check)
""",
            "model": "opus" if strictness == "strict" else "sonnet"
        },
        "typescript": {
            "tools": ["Read", "Grep", "Glob", "Bash"],
            "checks": """
TypeScript-specific checks:
- ESLint compliance (run: npm run lint)
- Type safety (run: tsc --noEmit)
- Security scanning (run: npm audit)
- Bundle size analysis
""",
            "model": "opus" if strictness == "strict" else "sonnet"
        }
    }

    config = language_specifics.get(language, language_specifics["python"])

    return AgentDefinition(
        description=f"{strictness.capitalize()} {language} code analyzer for quality and security.",
        prompt=f"""You are a {language} code analysis specialist operating in {strictness} mode.

{config['checks']}

{strict_rules}

Analysis process:
1. Read all relevant files completely
2. Run automated checks using available tools
3. Perform manual code review
4. Document findings with severity levels
5. Provide specific remediation steps

Output format:
- Severity: Critical/High/Medium/Low
- File: path/to/file.ext
- Line: line number
- Issue: description
- Remediation: specific fix

DO NOT:
- Make assumptions about code you haven't read
- Ignore warnings in {strictness} mode
- Suggest fixes without verifying they work""",
        tools=config['tools'],
        model=config['model']
    )

async def analyze_codebase(language: str, strictness: str):
    """Analyze codebase with dynamically configured subagent."""
    async for message in query(
        prompt=f"Perform a {strictness} code analysis of this {language} project",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob", "Bash", "Task"],
            agents={
                "code-analyzer": create_code_analyzer(strictness, language)
            }
        )
    ):
        if hasattr(message, "result"):
            print(message.result)

# Usage
asyncio.run(analyze_codebase(language="python", strictness="strict"))
```

---

## References

### Official Anthropic Documentation

1. [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) - Claude Agent SDK official documentation, January 2026

2. [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents) - Official subagent configuration guide, January 2026

3. [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) - Prompt engineering best practices for Claude 4.x models, January 2026

4. [Understanding Usage and Length Limits](https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits) - Token limits and context windows, January 2026

### Official Anthropic Engineering Blog Posts

5. [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) - Agent design patterns and context management, 2025

6. [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) - Practical guidance for agentic workflows, 2025

7. [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Agent harness design and validation patterns, 2025

8. [Building a Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) - Multi-agent orchestration and task decomposition, 2025

### Community Resources

9. [Claude Agent SDK Best Practices for AI Agent Development (2025)](https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/) - Third-party analysis and best practices compilation

10. [Claude Agent SDK | Promptfoo](https://www.promptfoo.dev/docs/providers/claude-agent-sdk/) - Testing and evaluation framework documentation

### GitHub Repositories

11. [anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) - Official Python SDK repository

12. [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) - Official TypeScript SDK repository

13. [anthropics/claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos) - Official example agents and demonstrations

---

## Document Metadata

**Created:** January 4, 2026
**Author:** Research compilation based on official Anthropic documentation
**Claude Model Used for Research:** Claude Sonnet 4.5
**SDK Versions Covered:** Claude Agent SDK (Python and TypeScript)
**Model Coverage:** Claude 4.5 family (Sonnet 4.5, Opus 4.5, Haiku 4.5)
**Last Updated:** January 4, 2026

**Research Methodology:**
- Primary sources: Official Anthropic documentation and engineering blog posts
- Date range: Late 2025 through January 2026
- Search tools: Web search with date filtering
- Verification: Cross-referenced multiple official sources
- Citation: All claims linked to authoritative sources

**Gaps Identified:**
- No specific token limit recommendations for subagent prompts (only general context window limits)
- Limited quantitative metrics on prompt length vs. effectiveness
- Few explicit examples comparing parameter injection vs. file reading patterns
- Minimal discussion of prompt compression techniques for subagents

**Recommendations for Further Research:**
- Monitor Anthropic's blog and documentation for updates on subagent best practices
- Review community case studies for real-world prompt engineering patterns
- Test different prompt lengths empirically to establish project-specific guidelines
- Explore the new Skills feature for reusable subagent patterns
