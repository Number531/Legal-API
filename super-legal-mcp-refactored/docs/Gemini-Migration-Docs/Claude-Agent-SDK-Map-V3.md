# Google Agent Development Kit (ADK) - Comprehensive Technical Guide
## December 2025 Edition

---

## Table of Contents

1. [Overview](#overview)
2. [Latest Models and Releases](#latest-models-and-releases)
3. [Tool Calling and Integration](#tool-calling-and-integration)
4. [Interactions API](#interactions-api)
5. [Multi-Agent Architecture](#multi-agent-architecture)
6. [Parallel Execution and Limits](#parallel-execution-and-limits)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Deployment Options](#deployment-options)
10. [Resources](#resources)

---

## Overview

The **Google Agent Development Kit (ADK)** is an open-source, code-first framework for building, evaluating, and deploying sophisticated AI agents and multi-agent systems. Released in 2025 and open-sourced at Google Cloud NEXT 2025, ADK powers agents within Google products like Agentspace and the Google Customer Engagement Suite (CES).

### Key Features

- **Code-First Approach**: Define agent logic, tools, and orchestration directly in code (Python, TypeScript, Java, Go)
- **Multi-Agent Architecture**: Build modular, hierarchical agent systems with specialized roles
- **Flexible Orchestration**: Sequential, parallel, loop-based, and custom workflow patterns
- **Model Agnostic**: Optimized for Gemini but compatible with other LLMs
- **Rich Tool Ecosystem**: Pre-built tools, custom functions, OpenAPI specs, MCP servers
- **End-to-End Type Safety**: (TypeScript) Build backend and frontend in a cohesive language
- **Integrated Developer Experience**: CLI, visual Web UI, API server for testing and debugging
- **Built-in Evaluation**: Assess agent performance with test cases
- **Production Ready**: Deploy to Cloud Run, Vertex AI Agent Engine, or any container platform

### Supported Languages

- **Python 3.10+** (Primary)
- **TypeScript/JavaScript** (Released December 17, 2025)
- **Java 17+**
- **Go**

---

## Latest Models and Releases

### Gemini Models (December 2025)

```python
# Latest Gemini models for ADK
GEMINI_MODELS = {
    "gemini-3-pro-preview": "Most capable reasoning model",
    "gemini-3-flash": "Fast, efficient for production",
    "gemini-2.5-flash": "Balanced performance",
    "gemini-2.5-pro": "Advanced reasoning capabilities"
}
```

### Deep Research Agent

```python
# Access to Google's built-in Deep Research agent
DEEP_RESEARCH_AGENT = "deep-research-pro-preview-12-2025"
```

### ADK Versions

- **Python ADK**: Latest stable release
- **TypeScript ADK**: Released December 17, 2025 (`@google/adk`)
- **Java ADK**: Production ready
- **Go ADK**: Production ready

---

## Tool Calling and Integration

### 1. Function Tools (Custom Tools)

Function tools are Python/TypeScript/Java functions with structured input/output that agents can call.

#### Python Example - Basic Function Tool

```python
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool, ToolContext
from typing import Dict

def get_weather(location: str, tool_context: ToolContext) -> Dict:
    """Get current weather for a location.
    
    Args:
        location: City name to get weather for
    
    Returns:
        Dictionary with weather information
    """
    # Access session state
    preferences = tool_context.state.get('user_preferences', {})
    
    # Simulate weather API call
    return {
        'temperature': 72,
        'conditions': 'sunny',
        'location': location,
        'unit': preferences.get('temp_unit', 'F')
    }

# Create tool
weather_tool = FunctionTool(get_weather)

# Create agent with tool
weather_agent = LlmAgent(
    name='weather_assistant',
    model='gemini-2.5-flash',
    tools=[weather_tool],
    instruction='Help users check weather conditions.'
)
```

#### TypeScript Example - Function Tool with Zod

```typescript
import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';

const getCurrentTime = new FunctionTool({
  name: 'get_current_time',
  description: 'Returns the current time in a specified city.',
  parameters: z.object({
    city: z.string().describe("The name of the city for which to retrieve the current time."),
  }),
  execute: ({city}) => {
    return {
      status: 'success', 
      report: `The current time in ${city} is ${new Date().toLocaleTimeString()}`
    };
  },
});

export const rootAgent = new LlmAgent({
  name: 'hello_time_agent',
  model: 'gemini-2.5-flash',
  description: 'Tells the current time in a specified city.',
  instruction: `You are a helpful assistant that tells the current time in a city. Use the 'getCurrentTime' tool for this purpose.`,
  tools: [getCurrentTime],
});
```

#### Advanced Function Tool with ToolContext

```python
from google.adk.tools import FunctionTool, ToolContext
from typing import Dict, Optional

def create_ticket(
    title: str,
    description: str,
    priority: str = "medium",
    tool_context: ToolContext = None
) -> Dict:
    """Create a support ticket in the system.
    
    Args:
        title: Ticket title
        description: Detailed description of the issue
        priority: Priority level (low, medium, high, critical)
    
    Returns:
        Created ticket information
    """
    # Access state
    user_id = tool_context.state.get('user_id')
    ticket_count = tool_context.state.get('ticket_count', 0)
    
    # Create ticket
    ticket = {
        'ticket_id': f"TKT-{ticket_count + 1:04d}",
        'title': title,
        'description': description,
        'priority': priority,
        'user_id': user_id,
        'status': 'open'
    }
    
    # Update state
    tool_context.state['ticket_count'] = ticket_count + 1
    tool_context.state[f'ticket_{ticket["ticket_id"]}'] = ticket
    
    return ticket

# Tool response modifiers
def approve_request(tool_context: ToolContext) -> Dict:
    """Approve a request and transfer to another agent."""
    return {
        'status': 'approved',
        'transfer_to_agent': 'billing_specialist',  # Transfer control
        'skip_summarization': True  # Don't let LLM summarize this
    }
```

#### Tool Context Capabilities

```python
from google.adk.tools import ToolContext

def advanced_tool_usage(tool_context: ToolContext):
    """Demonstrates all ToolContext capabilities."""
    
    # 1. State Management
    tool_context.state['key'] = 'value'  # Write to state
    value = tool_context.state.get('key')  # Read from state
    
    # 2. Authentication
    auth_data = tool_context.auth_response
    
    # 3. Services (when configured)
    # - Artifacts service
    # - Memory service
    
    # 4. Control Flow
    return {
        'result': 'data',
        'transfer_to_agent': 'specialist_agent',  # Transfer to another agent
        'escalate': True,  # Escalate to parent agent
        'skip_summarization': True  # Skip LLM summary
    }
```

**Important**: Don't include `tool_context` in the function docstring - it's automatically injected by ADK and shouldn't be visible to the LLM.

---

### 2. Built-in Google Tools

ADK provides pre-built tools for Google services:

```python
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.agents import LlmAgent

# Google Search tool
search_agent = LlmAgent(
    name="search_assistant",
    model="gemini-2.5-flash",
    tools=[
        GoogleSearchTool(bypass_multi_tools_limit=True)
    ],
    instruction="Search the web to answer user questions."
)

# Code Execution tool (executes code inside Gemini)
from google.adk.tools import CodeExecutionTool

code_agent = LlmAgent(
    name="code_executor",
    model="gemini-2.5-flash",
    tools=[CodeExecutionTool()],
    instruction="Execute code to solve mathematical problems."
)
```

---

### 3. MCP (Model Context Protocol) Tools

MCP is an open standard for connecting LLMs to external tools and data sources.

#### Connecting to MCP Servers

```python
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool import McpToolset

# Connect to filesystem MCP server
filesystem_agent = LlmAgent(
    name="filesystem_assistant_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant with access to file system operations.",
    tools=[
        McpToolset(
            command="npx",
            args=[
                "-y",
                "@modelcontextprotocol/server-filesystem",
                "/path/to/your/folder"  # Replace with actual path
            ],
        )
    ],
)

# Connect to GitHub MCP server with tool filtering
github_agent = LlmAgent(
    name="github_assistant",
    model="gemini-2.5-flash",
    instruction="Help users with GitHub operations.",
    tools=[
        McpToolset(
            command="npx",
            args=["-y", "@modelcontextprotocol/server-github"],
            tool_filter=[
                "search_repositories",
                "get_file_contents",
                "list_issues"
            ]  # Only expose specific tools
        )
    ],
)
```

#### Using MCP with TypeScript

```typescript
import { LlmAgent } from '@google/adk';
import { McpToolset } from '@google/adk';

const agent = new LlmAgent({
  name: 'mcp_agent',
  model: 'gemini-2.5-flash',
  tools: [
    new McpToolset({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/folder']
    })
  ]
});
```

#### MCP Tool Filtering

```python
# Filter tools to expose only what's needed
McpToolset(
    command="npx",
    args=["-y", "@modelcontextprotocol/server-github"],
    tool_filter=[
        "get_file_contents",
        "search_repositories",
        "list_commits"
    ]
)
```

**Benefits of MCP:**
- Standardized protocol for tool integration
- Reusable tools across different AI applications
- Large ecosystem (GitHub, filesystem, databases, APIs)
- Security through tool filtering

---

### 4. LangChain Tools Integration

ADK supports third-party tools via LangChain:

```python
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

# Import LangChain tool
wikipedia_tool = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

# Use in ADK agent
from google.adk.agents import LlmAgent

agent = LlmAgent(
    name="research_assistant",
    model="gemini-2.5-flash",
    tools=[wikipedia_tool],  # LangChain tool works directly
    instruction="Research topics using Wikipedia."
)
```

---

### 5. Multi-Tool Integration Patterns

#### Pattern 1: Agent with Multiple Tool Types

```python
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from google.adk.tools.google_search_tool import GoogleSearchTool
from langchain_community.tools import WikipediaQueryRun

# Custom function tool
def get_weather(location: str) -> dict:
    """Get weather for a location."""
    return {'temp': 72, 'condition': 'sunny'}

# Combine different tool types
multi_tool_agent = LlmAgent(
    name="multi_tool_assistant",
    model="gemini-2.5-flash",
    tools=[
        FunctionTool(get_weather),           # Custom function
        GoogleSearchTool(),                   # Built-in Google tool
        WikipediaQueryRun(api_wrapper=...),  # LangChain tool
    ],
    instruction="You have access to weather data, web search, and Wikipedia."
)
```

#### Pattern 2: Hierarchical Tool Access

```python
# Specialist agents as tools
search_specialist = LlmAgent(
    name="search_specialist",
    model="gemini-3-flash",
    tools=[GoogleSearchTool()],
    instruction="Expert at web searches."
)

data_specialist = LlmAgent(
    name="data_specialist", 
    model="gemini-3-flash",
    tools=[FunctionTool(query_database)],
    instruction="Expert at database queries."
)

# Orchestrator uses specialists as tools
orchestrator = LlmAgent(
    name="orchestrator",
    model="gemini-3-pro-preview",
    sub_agents=[search_specialist, data_specialist],
    instruction="Coordinate specialists to answer complex questions."
)
```

---

## Interactions API

The **Interactions API** (launched December 2025) is Google's new interface for stateful, multi-turn agent interactions. It shifts from "send input, get output" to "participate in an interaction that unfolds over time."

### Key Features

1. **Unified Model & Agent Access**: Same API for models (`model="gemini-3-pro-preview"`) and agents (`agent="deep-research-pro-preview-12-2025"`)
2. **Simplified State Management**: Offload conversation history with `previous_interaction_id`
3. **Background Execution**: Long-running tasks via `background=True`
4. **Native Agentic Interface**: Designed specifically for complex state management

### Enabling Interactions API in ADK

#### Python Implementation

```python
from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools.google_search_tool import GoogleSearchTool

def get_current_weather(location: str) -> dict:
    """Get weather for a location."""
    return {'temperature': 72, 'condition': 'sunny'}

root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        # Enable Interactions API - this is the key line
        use_interactions_api=True,
    ),
    name="interactions_test_agent",
    tools=[
        GoogleSearchTool(bypass_multi_tools_limit=True),
        get_current_weather,
    ],
    instruction="Help users with weather and web search."
)
```

**That's it!** Just add `use_interactions_api=True` to your Gemini model config.

### Interactions API with A2A Protocol

The Interactions API integrates with Agent2Agent (A2A) protocol for interoperability:

```python
from interactions_api_transport import InteractionsApiTransport
from a2a.client import ClientFactory, ClientConfig

# 1. Configure factory for Interactions API
client_config = ClientConfig()
client_factory = ClientFactory(client_config)
InteractionsApiTransport.setup(client_factory)

# 2. Create AgentCard for Deep Research agent
card = InteractionsApiTransport.make_card(
    url="https://generativelanguage.googleapis.com",
    agent="deep-research-pro-preview-12-2025"
)

# 3. Or interact with a Gemini model
card = InteractionsApiTransport.make_card(
    url="https://generativelanguage.googleapis.com",
    model="gemini-3-pro-preview",
    request_opts={
        "generation_config": {
            "thinking_summaries": "auto"
        }
    }
)

# 4. Use card as standard A2A agent
# Your existing A2A clients can now talk to Interactions API
# without knowing they're talking to Google-hosted agents
```

### Benefits of Interactions API

- **Inner Loop**: API manages conversation state and context
- **Outer Loop**: Your ADK agent controls orchestration and routing
- **Seamless Migration**: Minimal code changes (just enable flag)
- **Background Processing**: For long-running research tasks
- **Better State Management**: Less boilerplate in your agent code

### What Changes with Interactions API?

**Before (generateContent):**
```python
# ADK reconstructed context each call
# Agent loop owned reasoning AND continuity
# More manual state management
```

**After (Interactions API):**
```python
# API manages conversation state
# Agent loop focuses on orchestration
# Automatic context management
```

The responsibility shifts from your code to the API, but capabilities remain the same.

---

## Multi-Agent Architecture

ADK provides robust primitives for building hierarchical, collaborative agent systems.

### Core Agent Types

#### 1. LlmAgent

Uses LLMs for reasoning and decision-making. Non-deterministic, dynamic behavior.

```python
from google.adk.agents import LlmAgent

agent = LlmAgent(
    name="assistant",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
    description="General purpose assistant",
    tools=[...],           # Optional tools
    sub_agents=[...],      # Optional sub-agents
    output_key="result"    # Save output to state
)
```

#### 2. Workflow Agents

Deterministic agents that orchestrate other agents:

##### SequentialAgent

Executes sub-agents in order, passing state between them:

```python
from google.adk.agents import SequentialAgent, LlmAgent

validator = LlmAgent(
    name="validator",
    model="gemini-3-flash",
    instruction="Validate input data",
    output_key="validation_result"
)

processor = LlmAgent(
    name="processor",
    model="gemini-3-flash",
    instruction="Process data if {validation_result} is valid",
    output_key="processed_data"
)

reporter = LlmAgent(
    name="reporter",
    model="gemini-3-flash",
    instruction="Create report from {processed_data}"
)

pipeline = SequentialAgent(
    name="data_pipeline",
    sub_agents=[validator, processor, reporter]
)
```

##### ParallelAgent

Executes sub-agents concurrently for independent tasks:

```python
from google.adk.agents import ParallelAgent, LlmAgent

weather_agent = LlmAgent(
    name="weather_fetcher",
    model="gemini-3-flash",
    output_key="weather_data"
)

news_agent = LlmAgent(
    name="news_fetcher", 
    model="gemini-3-flash",
    output_key="news_data"
)

parallel_gatherer = ParallelAgent(
    name="info_gatherer",
    sub_agents=[weather_agent, news_agent]
)
# Both agents run simultaneously
```

##### LoopAgent

Repeats sub-agents until a condition is met:

```python
from google.adk.agents import LoopAgent, LlmAgent

writer = LlmAgent(
    name="writer",
    model="gemini-3-flash",
    instruction="Write content based on feedback",
    output_key="content"
)

critic = LlmAgent(
    name="critic",
    model="gemini-3-flash",
    instruction="Review {content} and provide feedback. If good, call exit_loop tool.",
    output_key="feedback"
)

refinement_loop = LoopAgent(
    name="refinement_loop",
    sub_agents=[writer, critic],
    max_iterations=5  # Safety limit
)
```

Exit conditions:
- `max_iterations` reached
- Sub-agent returns `escalate=True` in EventActions
- Sub-agent calls `exit_loop` tool

#### 3. Custom Agents

For specialized orchestration logic:

```python
from google.adk.agents import BaseAgent
from google.adk.events import Event, EventActions
from typing import AsyncGenerator

class CustomOrchestrator(BaseAgent):
    """Custom agent with specialized logic."""
    
    def __init__(self, name: str, specialist_agents: list):
        super().__init__(name=name)
        self.specialists = specialist_agents
    
    async def _run_async_impl(
        self, 
        ctx
    ) -> AsyncGenerator[Event, None]:
        """Custom orchestration logic."""
        
        # Custom decision logic
        if some_condition:
            # Run specialist 1
            async for event in self.specialists[0].run_async(ctx):
                yield event
        else:
            # Run specialist 2
            async for event in self.specialists[1].run_async(ctx):
                yield event
        
        # Yield final response
        yield Event(
            author=self.name,
            content=...,
            actions=EventActions(is_final_response=True)
        )
```

---

### Multi-Agent Patterns

#### Pattern 1: Hierarchical Delegation

```python
# Coordinator pattern
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-3-pro-preview",
    sub_agents=[
        specialist_1,  # LlmAgent
        specialist_2,  # LlmAgent
        specialist_3   # LlmAgent
    ],
    instruction="Delegate tasks to appropriate specialists."
)
```

#### Pattern 2: Sequential Pipeline

```python
# Data processing pipeline
pipeline = SequentialAgent(
    name="pipeline",
    sub_agents=[
        extract_agent,    # Extract data
        transform_agent,  # Transform data
        load_agent        # Load data
    ]
)
```

#### Pattern 3: Fan-Out / Gather

```python
# Parallel research, then synthesis
parallel_research = ParallelAgent(
    name="researchers",
    sub_agents=[
        research_agent_1,
        research_agent_2,
        research_agent_3
    ]
)

synthesizer = LlmAgent(
    name="synthesizer",
    model="gemini-3-pro-preview",
    instruction="Synthesize research findings."
)

workflow = SequentialAgent(
    name="research_workflow",
    sub_agents=[parallel_research, synthesizer]
)
```

#### Pattern 4: Iterative Refinement

```python
# Generator-Critic loop
loop = LoopAgent(
    name="refinement",
    sub_agents=[
        generator,  # Creates content
        critic      # Reviews and provides feedback
    ],
    max_iterations=3
)
```

#### Pattern 5: Agents as Tools

```python
# Use specialized agents as tools
main_agent = LlmAgent(
    name="main_agent",
    model="gemini-3-pro-preview",
    sub_agents=[specialist_1, specialist_2],  # These become tools
    instruction="Use specialists when needed."
)
# Specialists are automatically converted to tools
# LLM decides when to call them
```

---

### State Management in Multi-Agent Systems

#### Session State

```python
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner

# Create session
session_service = InMemorySessionService()
session = await session_service.create_session(
    app_name="my_app",
    user_id="user_123",
    session_id="session_456"
)

# Agents can read/write to state
agent = LlmAgent(
    name="agent",
    model="gemini-2.5-flash",
    output_key="result"  # Writes output to state['result']
)

# In tools
def my_tool(tool_context: ToolContext):
    # Read state
    value = tool_context.state.get('key')
    
    # Write state
    tool_context.state['new_key'] = 'new_value'
```

#### State in Parallel Agents

**Critical**: Parallel agents share session state but run in separate threads.

```python
# CORRECT: Each agent writes to unique key
parallel = ParallelAgent(
    name="gatherer",
    sub_agents=[
        LlmAgent(name="agent1", output_key="result_1"),  # Unique key
        LlmAgent(name="agent2", output_key="result_2"),  # Unique key
        LlmAgent(name="agent3", output_key="result_3"),  # Unique key
    ]
)

# INCORRECT: Race condition!
parallel = ParallelAgent(
    sub_agents=[
        LlmAgent(name="agent1", output_key="result"),  # Same key
        LlmAgent(name="agent2", output_key="result"),  # Same key - conflict!
    ]
)
```

#### Template Variables

Access state in instructions using `{variable_name}`:

```python
agent = LlmAgent(
    name="processor",
    model="gemini-2.5-flash",
    instruction="""
    Process the following data: {input_data}
    
    Follow these rules from validation: {validation_rules}
    
    Optional context: {optional_context?}  # ? makes it optional
    """
)
```

---

## Parallel Execution and Limits

### Maximum Number of Parallel Subagents

**TL;DR**: No hard-coded limit in ADK, but practical maximum is **10-20 parallel subagents**.

### Constraints

#### 1. ADK Framework Constraints

- **No explicit limit** in ADK code
- ParallelAgent accepts list of any length
- Limited by system resources and API quotas

#### 2. Gemini API Rate Limits

Each parallel subagent makes a separate API call:

**Free Tier (Express Mode):**
- ~15 requests per minute (RPM)
- 10 parallel agents = 10 requests
- Hit limit quickly with concurrent execution

**Paid Tier:**
- 360-1000+ RPM depending on model
- More headroom for parallel execution

#### 3. Resource Constraints

- **Memory**: Each agent holds context in memory
- **Network I/O**: Concurrent API calls
- **Token Budget**: All agents consume tokens
- **CPU**: Context switching overhead

### Recommended Architecture for Orchestrator + Subagents

```python
from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent

# Orchestrator (Gemini-3-Pro)
orchestrator = LlmAgent(
    name="orchestrator",
    model="gemini-3-pro-preview",
    instruction="Synthesize and coordinate specialist findings.",
    output_key="final_result"
)

# Create multiple specialist subagents (Gemini-3-Flash)
num_specialists = 10  # Recommended: 5-10 for most use cases

specialists = [
    LlmAgent(
        name=f"specialist_{i}",
        model="gemini-3-flash",
        instruction=f"You are specialist {i} focusing on aspect {i}.",
        output_key=f"result_{i}",  # CRITICAL: Unique keys
        tools=[...]  # Each specialist can have different tools
    )
    for i in range(num_specialists)
]

# Parallel execution of specialists
parallel_team = ParallelAgent(
    name="specialist_team",
    sub_agents=specialists
)

# Full workflow: Parallel specialists → Orchestrator synthesis
workflow = SequentialAgent(
    name="orchestrated_workflow",
    sub_agents=[
        parallel_team,    # All specialists run in parallel
        orchestrator      # Synthesizes all results
    ]
)
```

### Practical Limits by Use Case

| Number of Parallel Agents | Use Case | Considerations |
|---------------------------|----------|----------------|
| 2-5 | Simple fan-out | Low overhead, easy to manage |
| 5-10 | Standard parallel workflows | Recommended for most cases |
| 10-20 | Complex research/analysis | Monitor API quotas carefully |
| 20-50 | Advanced parallelism | Consider batching or queues |
| 50+ | Large-scale processing | Use external job queue system |

### Scaling Strategies

#### Strategy 1: Batching

```python
# Instead of 100 parallel agents
# Do 5 batches of 20 agents

from google.adk.agents import BaseAgent, ParallelAgent
import asyncio

class BatchedParallelAgent(BaseAgent):
    """Execute agents in batches."""
    
    def __init__(self, name: str, agents: list, batch_size: int = 10):
        super().__init__(name=name)
        self.agents = agents
        self.batch_size = batch_size
    
    async def _run_async_impl(self, ctx):
        # Split into batches
        for i in range(0, len(self.agents), self.batch_size):
            batch = self.agents[i:i + self.batch_size]
            
            # Execute batch in parallel
            parallel_batch = ParallelAgent(
                name=f"batch_{i}",
                sub_agents=batch
            )
            
            async for event in parallel_batch.run_async(ctx):
                yield event
```

#### Strategy 2: Dynamic Parallelism

```python
from google.adk.agents import BaseAgent, ParallelAgent, LlmAgent
from typing import ClassVar, List
import secrets

class DynamicParallelAgent(BaseAgent):
    """Create parallel agents dynamically at runtime."""
    
    WORKER_POOL: ClassVar[List[str]] = ["w0", "w1", "w2", "w3", "w4"]
    
    async def _run_async_impl(self, ctx):
        run_id = secrets.token_hex(2)
        
        # Determine how many workers needed (runtime decision)
        num_workers = determine_worker_count(ctx)
        
        # Create workers dynamically
        workers = [
            LlmAgent(
                name=f"worker_{i}",
                model="gemini-3-flash",
                output_key=f"result_{run_id}_{i}"
            )
            for i in range(num_workers)
        ]
        
        # Execute in parallel
        parallel = ParallelAgent(
            name="dynamic_parallel",
            sub_agents=workers
        )
        
        async for event in parallel.run_async(ctx):
            yield event
```

#### Strategy 3: Rate Limit Handling

```python
import asyncio
from datetime import datetime, timedelta

class RateLimitedParallelAgent(BaseAgent):
    """Execute with rate limiting."""
    
    def __init__(self, name: str, agents: list, rpm_limit: int = 60):
        super().__init__(name=name)
        self.agents = agents
        self.rpm_limit = rpm_limit
        self.requests = []  # Track request timestamps
    
    async def _run_async_impl(self, ctx):
        for agent in self.agents:
            # Check rate limit
            await self._wait_for_rate_limit()
            
            # Execute agent
            async for event in agent.run_async(ctx):
                yield event
    
    async def _wait_for_rate_limit(self):
        """Implement token bucket rate limiting."""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        # Remove old requests
        self.requests = [r for r in self.requests if r > minute_ago]
        
        # Wait if at limit
        if len(self.requests) >= self.rpm_limit:
            sleep_time = (self.requests[0] - minute_ago).total_seconds()
            await asyncio.sleep(sleep_time)
        
        self.requests.append(now)
```

### Monitoring Parallel Execution

```python
# Use ADK dev UI to monitor parallel execution
# Run with: adk web

# View in UI:
# 1. Events tab shows all parallel agent calls
# 2. Trace button shows latency
# 3. State tab shows all agent outputs

# Programmatic monitoring
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()
runner = Runner(
    agent=workflow,
    app_name="parallel_test",
    session_service=session_service
)

async for event in runner.run_async(
    user_id="user_123",
    session_id="session_456",
    new_message=...
):
    print(f"Event from: {event.author}")
    if event.is_final_response():
        print(f"Final response: {event.content}")
```

---

## Code Examples

### Complete Multi-Agent System

```python
# complete_example.py
import os
from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent, LoopAgent
from google.adk.tools import FunctionTool
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

# Constants
APP_NAME = "multi_agent_example"
USER_ID = "user_123"
SESSION_ID = "session_456"

# --- Custom Tools ---
def fetch_data(source: str) -> dict:
    """Fetch data from a source."""
    return {'source': source, 'data': f'Data from {source}'}

def validate_data(data: dict) -> dict:
    """Validate data quality."""
    return {'valid': True, 'data': data}

# --- Specialist Agents (Parallel) ---
specialist_1 = LlmAgent(
    name="specialist_1",
    model="gemini-3-flash",
    instruction="Research topic from perspective 1.",
    tools=[GoogleSearchTool()],
    output_key="research_1"
)

specialist_2 = LlmAgent(
    name="specialist_2",
    model="gemini-3-flash",
    instruction="Research topic from perspective 2.",
    tools=[GoogleSearchTool()],
    output_key="research_2"
)

specialist_3 = LlmAgent(
    name="specialist_3",
    model="gemini-3-flash",
    instruction="Research topic from perspective 3.",
    tools=[GoogleSearchTool()],
    output_key="research_3"
)

# --- Parallel Research Team ---
research_team = ParallelAgent(
    name="research_team",
    sub_agents=[specialist_1, specialist_2, specialist_3]
)

# --- Synthesizer (after parallel research) ---
synthesizer = LlmAgent(
    name="synthesizer",
    model="gemini-3-pro-preview",
    instruction="""
    Synthesize research from all specialists:
    - Research 1: {research_1}
    - Research 2: {research_2}
    - Research 3: {research_3}
    
    Create a comprehensive summary.
    """,
    output_key="synthesis"
)

# --- Critic (for iterative refinement) ---
critic = LlmAgent(
    name="critic",
    model="gemini-3-flash",
    instruction="""
    Review the synthesis: {synthesis}
    
    If quality is excellent, call the exit_loop tool.
    Otherwise, provide specific feedback.
    """,
    output_key="feedback"
)

# --- Refiner (improves based on feedback) ---
refiner = LlmAgent(
    name="refiner",
    model="gemini-3-flash",
    instruction="""
    Improve the synthesis based on feedback: {feedback}
    Previous synthesis: {synthesis}
    """,
    output_key="synthesis"  # Updates synthesis
)

# --- Refinement Loop ---
refinement_loop = LoopAgent(
    name="refinement_loop",
    sub_agents=[critic, refiner],
    max_iterations=3
)

# --- Complete Workflow ---
complete_workflow = SequentialAgent(
    name="complete_workflow",
    sub_agents=[
        research_team,      # 1. Parallel research
        synthesizer,        # 2. Synthesize findings
        refinement_loop     # 3. Iteratively refine
    ]
)

# --- Execution ---
async def main():
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID
    )
    
    runner = Runner(
        agent=complete_workflow,
        app_name=APP_NAME,
        session_service=session_service
    )
    
    user_message = types.Content(
        role='user',
        parts=[types.Part(text="Research the impact of AI on education")]
    )
    
    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=user_message
    ):
        print(f"Event from: {event.author}")
        if event.is_final_response():
            print(f"\nFinal Response:\n{event.content.parts[0].text}")

# Run
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### TypeScript Complete Example

```typescript
// complete-example.ts
import {
  LlmAgent,
  ParallelAgent,
  SequentialAgent,
  LoopAgent,
  FunctionTool,
  InMemoryRunner
} from '@google/adk';
import { z } from 'zod';

// Custom tool
const fetchData = new FunctionTool({
  name: 'fetch_data',
  description: 'Fetch data from a source',
  parameters: z.object({
    source: z.string()
  }),
  execute: async ({source}) => {
    return {source, data: `Data from ${source}`};
  }
});

// Specialists (parallel)
const specialist1 = new LlmAgent({
  name: 'specialist_1',
  model: 'gemini-3-flash',
  instruction: 'Research topic from perspective 1.',
  outputKey: 'research_1'
});

const specialist2 = new LlmAgent({
  name: 'specialist_2',
  model: 'gemini-3-flash',
  instruction: 'Research topic from perspective 2.',
  outputKey: 'research_2'
});

// Parallel team
const researchTeam = new ParallelAgent({
  name: 'research_team',
  subAgents: [specialist1, specialist2]
});

// Synthesizer
const synthesizer = new LlmAgent({
  name: 'synthesizer',
  model: 'gemini-3-pro-preview',
  instruction: `
    Synthesize research:
    - Research 1: {research_1}
    - Research 2: {research_2}
  `,
  outputKey: 'synthesis'
});

// Complete workflow
export const workflow = new SequentialAgent({
  name: 'complete_workflow',
  subAgents: [researchTeam, synthesizer]
});

// Run
const runner = new InMemoryRunner({
  agent: workflow,
  appName: 'typescript_example'
});

const result = await runner.run({
  userId: 'user_123',
  sessionId: 'session_456',
  message: 'Research AI in education'
});

console.log(result);
```

---

## Best Practices

### 1. Tool Design

✅ **DO:**
- Keep tool functions focused and single-purpose
- Use clear, descriptive docstrings (LLM reads these)
- Return structured data (dicts/objects)
- Use ToolContext for state management
- Implement proper error handling

❌ **DON'T:**
- Include `tool_context` in docstring
- Make tools that do multiple unrelated things
- Return plain strings when structure is better
- Ignore state management needs

### 2. Multi-Agent Design

✅ **DO:**
- Break complex tasks into specialist agents
- Use descriptive agent names and instructions
- Assign unique `output_key` to each agent
- Use workflow agents (Sequential, Parallel, Loop) appropriately
- Keep agent hierarchies shallow (2-3 levels max)

❌ **DON'T:**
- Create monolithic agents that do everything
- Use parallel agents for dependent tasks
- Forget to handle state race conditions
- Over-complicate agent hierarchies

### 3. State Management

✅ **DO:**
- Use unique keys for parallel agents
- Use optional templates: `{key?}` for optional values
- Document what keys your agents write/read
- Clear state between unrelated sessions

❌ **DON'T:**
- Have multiple agents write to same key in parallel
- Assume state persists across sessions
- Forget to initialize required state values

### 4. Performance Optimization

✅ **DO:**
- Use ParallelAgent for independent tasks
- Batch large numbers of parallel operations
- Implement rate limiting for high-volume scenarios
- Monitor API quota usage
- Use faster models (Flash) for simple tasks

❌ **DON'T:**
- Run 50+ agents in parallel without batching
- Use Pro models when Flash is sufficient
- Ignore rate limits until hitting them
- Block on sequential tasks that could be parallel

### 5. Error Handling

```python
from google.adk.tools import FunctionTool

def robust_tool(param: str) -> dict:
    """A well-designed tool with error handling."""
    try:
        # Attempt operation
        result = perform_operation(param)
        return {
            'success': True,
            'data': result
        }
    except SpecificError as e:
        # Handle expected errors gracefully
        return {
            'success': False,
            'error': str(e),
            'error_type': 'expected_error'
        }
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in tool: {e}")
        return {
            'success': False,
            'error': 'An unexpected error occurred',
            'error_type': 'unexpected_error'
        }
```

### 6. Testing

```python
# test_agent.py
import pytest
from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner

@pytest.mark.asyncio
async def test_agent_response():
    """Test agent produces expected response."""
    agent = LlmAgent(
        name="test_agent",
        model="gemini-3-flash",
        instruction="Always respond with 'Hello World'"
    )
    
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name="test",
        user_id="test_user",
        session_id="test_session"
    )
    
    runner = Runner(
        agent=agent,
        app_name="test",
        session_service=session_service
    )
    
    response = None
    async for event in runner.run_async(
        user_id="test_user",
        session_id="test_session",
        new_message=...
    ):
        if event.is_final_response():
            response = event.content.parts[0].text
    
    assert "Hello World" in response
```

### 7. Monitoring and Debugging

```python
# Use ADK Web UI for development
# Terminal: adk web

# Features:
# - Visual chat interface
# - Event inspection
# - State viewer
# - Trace latency analysis
# - Agent selection dropdown

# For production: Use callbacks for observability
from google.adk.callbacks import BaseCallback

class CustomCallback(BaseCallback):
    """Custom observability callback."""
    
    def on_agent_start(self, agent_name: str):
        logger.info(f"Agent started: {agent_name}")
    
    def on_agent_end(self, agent_name: str, output):
        logger.info(f"Agent ended: {agent_name}")
    
    def on_tool_start(self, tool_name: str):
        logger.info(f"Tool called: {tool_name}")

# Use with runner
runner = Runner(
    agent=agent,
    callbacks=[CustomCallback()]
)
```

---

## Deployment Options

### 1. Local Development

```bash
# Python
adk web          # Launch dev UI
adk run          # Terminal mode
adk api_server   # API server

# TypeScript
npx adk web      # Launch dev UI
npx adk run      # Terminal mode
```

### 2. Vertex AI Agent Engine

Easiest managed deployment on Google Cloud:

```bash
# Deploy to Agent Engine
gcloud ai agents deploy \
  --agent-file=agent.py \
  --region=us-central1
```

### 3. Cloud Run (Serverless)

Full control, serverless scaling:

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

```bash
# Deploy to Cloud Run
gcloud run deploy agent-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 4. Custom Deployment

ADK agents are standard Python/TypeScript applications. Deploy anywhere:
- Kubernetes
- AWS ECS/Lambda
- Azure Container Apps
- Your own servers

---

## Resources

### Official Documentation

- **ADK Docs**: https://google.github.io/adk-docs/
- **API Reference**: https://google.github.io/adk-docs/api-reference/
- **GitHub - Python**: https://github.com/google/adk-python
- **GitHub - TypeScript**: https://github.com/google/adk-typescript
- **Sample Agents**: https://github.com/google/adk-samples

### Blog Posts

- **Interactions API + ADK**: https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/
- **TypeScript ADK Launch**: https://developers.googleblog.com/introducing-agent-development-kit-for-typescript-build-ai-agents-with-the-power-of-a-code-first-approach/
- **Multi-Agent Patterns**: https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/
- **ADK Introduction**: https://developers.googleblog.com/en/agent-development-kit-easy-to-build-multi-agent-applications/

### Tutorials

- **Multi-Agent Codelab**: https://codelabs.developers.google.com/codelabs/production-ready-ai-with-gc/3-developing-agents/build-a-multi-agent-system-with-adk
- **Building with Tools**: https://codelabs.developers.google.com/devsite/codelabs/build-agents-with-adk-empowering-with-tools

### Community

- **Discord**: Join ADK community discussions
- **GitHub Issues**: Report bugs and request features
- **Stack Overflow**: Tag `google-adk`

### Getting API Keys

**Free Tier (Express Mode):**
1. Visit https://aistudio.google.com/
2. Create project
3. Get API key
4. ~15 RPM limit

**Paid Tier (Vertex AI):**
1. Enable Vertex AI API in Google Cloud
2. Use service account credentials
3. Higher rate limits

### Environment Setup

```bash
# Python
export GOOGLE_API_KEY="your_api_key_here"
# OR for Vertex AI:
export GOOGLE_GENAI_USE_VERTEXAI=TRUE
export GOOGLE_CLOUD_PROJECT="your_project_id"

# TypeScript (.env file)
GOOGLE_API_KEY=your_api_key_here
```

---

## Appendix: Quick Reference

### Agent Types Cheat Sheet

| Agent Type | Purpose | Deterministic | LLM-Powered |
|------------|---------|---------------|-------------|
| LlmAgent | Reasoning, decisions | No | Yes |
| SequentialAgent | Run agents in order | Yes | No |
| ParallelAgent | Run agents concurrently | Yes | No |
| LoopAgent | Repeat until condition | Yes | No |
| CustomAgent | Custom orchestration | Varies | Varies |

### Common Model Strings

```python
# Gemini Models (December 2025)
"gemini-3-pro-preview"     # Most capable
"gemini-3-flash"           # Fast and efficient
"gemini-2.5-flash"         # Previous generation
"gemini-2.5-pro"           # Previous generation

# Deep Research
"deep-research-pro-preview-12-2025"
```

### Installation Commands

```bash
# Python
pip install google-adk
pip install google-adk[web]      # Dev UI
pip install google-adk[tracing]  # Observability

# TypeScript
npm install @google/adk @google/adk-devtools

# Java
# See https://google.github.io/adk-docs/get-started/java/

# Go
# See https://google.github.io/adk-docs/get-started/go/
```

### Common Patterns

```python
# 1. Simple Agent
agent = LlmAgent(name="agent", model="gemini-3-flash")

# 2. Agent with Tools
agent = LlmAgent(
    name="agent",
    model="gemini-3-flash",
    tools=[tool1, tool2]
)

# 3. Sequential Pipeline
pipeline = SequentialAgent(
    name="pipeline",
    sub_agents=[agent1, agent2, agent3]
)

# 4. Parallel Execution
parallel = ParallelAgent(
    name="parallel",
    sub_agents=[agent1, agent2, agent3]
)

# 5. Iterative Loop
loop = LoopAgent(
    name="loop",
    sub_agents=[generator, critic],
    max_iterations=5
)

# 6. Hierarchical (agents as tools)
orchestrator = LlmAgent(
    name="orchestrator",
    model="gemini-3-pro-preview",
    sub_agents=[specialist1, specialist2]
)
```

---

## Conclusion

Google's Agent Development Kit provides a comprehensive, production-ready framework for building sophisticated AI agent systems. Key takeaways:

1. **Code-First Philosophy**: Define agents, tools, and workflows in code with full type safety
2. **Rich Tool Ecosystem**: Function tools, built-in Google tools, MCP servers, LangChain integration
3. **Interactions API**: Native stateful execution with minimal code changes
4. **Multi-Agent Patterns**: Sequential, parallel, loop, and custom orchestration
5. **Practical Limits**: 10-20 parallel agents recommended, scale with batching strategies
6. **Production Ready**: Deploy anywhere with built-in observability

The framework is actively developed, with TypeScript support launched December 2025 and continuous improvements to the Interactions API and agent primitives.

---

**Document Version**: 1.0  
**Last Updated**: December 29, 2025  
**Author**: Compiled from official ADK documentation and Google Developer blogs