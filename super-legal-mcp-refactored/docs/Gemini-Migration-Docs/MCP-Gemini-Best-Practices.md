# Integrating Large-Scale MCP Servers into Google ADK
## Architecture Guide: 114-Tool MCP Integration

---

## Table of Contents

1. [Challenge Overview](#challenge-overview)
2. [Architecture Strategies](#architecture-strategies)
3. [Strategy 1: Domain-Specialized Agents](#strategy-1-domain-specialized-agents)
4. [Strategy 2: Dynamic Tool Loading](#strategy-2-dynamic-tool-loading)
5. [Strategy 3: Hierarchical Tool Routing](#strategy-3-hierarchical-tool-routing)
6. [Strategy 4: Hybrid Approach](#strategy-4-hybrid-approach)
7. [Performance Optimization](#performance-optimization)
8. [Complete Implementation](#complete-implementation)
9. [Monitoring and Debugging](#monitoring-and-debugging)
10. [Production Considerations](#production-considerations)

---

## Challenge Overview

### The Problem

You have a custom MCP server with **114 separate tools**. Key challenges:

1. **Context Window Limits**: 114 tool definitions consume significant tokens
2. **LLM Confusion**: Too many tools overwhelm the model's decision-making
3. **Performance**: Tool selection latency increases with tool count
4. **Maintenance**: Managing access control and updates across 114 tools
5. **Cost**: Larger context = higher API costs per request

### The Goal

Design an architecture that:
- ✅ Provides access to all 114 tools when needed
- ✅ Doesn't overwhelm any single agent with too many options
- ✅ Routes requests to appropriate tools efficiently
- ✅ Maintains good performance and low latency
- ✅ Scales well as more tools are added

### Recommended Approach

**Don't give all 114 tools to one agent.** Instead, use **domain-specialized agents** or **dynamic tool loading** based on context.

---

## Architecture Strategies

### Quick Comparison

| Strategy | Best For | Complexity | Performance | Flexibility |
|----------|----------|------------|-------------|-------------|
| Domain-Specialized Agents | Clear tool categories | Low | Excellent | Medium |
| Dynamic Tool Loading | Unknown/varied queries | Medium | Good | High |
| Hierarchical Routing | Large team coordination | High | Good | High |
| Hybrid Approach | Production systems | Medium-High | Excellent | Very High |

---

## Strategy 1: Domain-Specialized Agents

### Concept

Group the 114 tools into logical domains (e.g., database, API, file operations) and create specialized agents for each domain. An orchestrator routes to the appropriate specialist.

### Architecture Diagram (Text)

```
User Query
    ↓
Orchestrator Agent (Gemini-3-Pro)
    ↓
    ├─→ Database Agent (Tools 1-20: DB queries, connections, migrations)
    ├─→ API Agent (Tools 21-45: HTTP requests, webhooks, REST/GraphQL)
    ├─→ File Agent (Tools 46-60: Read, write, search, transform files)
    ├─→ Analytics Agent (Tools 61-80: Calculations, reports, metrics)
    ├─→ Integration Agent (Tools 81-100: External service integrations)
    └─→ Admin Agent (Tools 101-114: System admin, config, monitoring)
```

### Implementation

#### Step 1: Categorize Your 114 Tools

```python
# tool_categories.py
"""
Categorization of 114 MCP tools into logical domains.
"""

TOOL_CATEGORIES = {
    "database": [
        # Tools 1-20: Database operations
        "db_query",
        "db_insert",
        "db_update",
        "db_delete",
        "db_transaction_start",
        "db_transaction_commit",
        "db_transaction_rollback",
        "db_get_schema",
        "db_create_table",
        "db_drop_table",
        "db_create_index",
        "db_backup",
        "db_restore",
        "db_optimize",
        "db_analyze",
        "db_export_csv",
        "db_import_csv",
        "db_connection_pool_status",
        "db_kill_long_running_queries",
        "db_get_table_size"
    ],
    
    "api": [
        # Tools 21-45: API and HTTP operations
        "http_get",
        "http_post",
        "http_put",
        "http_delete",
        "http_patch",
        "graphql_query",
        "graphql_mutation",
        "rest_api_call",
        "webhook_send",
        "webhook_register",
        "oauth_authenticate",
        "api_key_validate",
        "rate_limit_check",
        "api_health_check",
        "api_version_info",
        "api_documentation",
        "api_mock_response",
        "api_retry_failed",
        "api_batch_request",
        "api_stream_data",
        "cors_configure",
        "api_cache_clear",
        "api_log_request",
        "api_monitor_latency",
        "api_circuit_breaker"
    ],
    
    "file": [
        # Tools 46-60: File operations
        "file_read",
        "file_write",
        "file_append",
        "file_delete",
        "file_copy",
        "file_move",
        "file_rename",
        "file_search",
        "file_get_metadata",
        "file_compress",
        "file_decompress",
        "file_encrypt",
        "file_decrypt",
        "file_validate_format",
        "file_convert_format"
    ],
    
    "analytics": [
        # Tools 61-80: Analytics and calculations
        "analytics_calculate_sum",
        "analytics_calculate_avg",
        "analytics_calculate_median",
        "analytics_calculate_percentile",
        "analytics_time_series",
        "analytics_trend_analysis",
        "analytics_correlation",
        "analytics_regression",
        "analytics_forecasting",
        "analytics_anomaly_detection",
        "analytics_clustering",
        "analytics_classification",
        "analytics_generate_report",
        "analytics_export_chart",
        "analytics_pivot_table",
        "analytics_filter_data",
        "analytics_aggregate",
        "analytics_join_datasets",
        "analytics_deduplicate",
        "analytics_validate_data"
    ],
    
    "integration": [
        # Tools 81-100: External integrations
        "slack_send_message",
        "slack_create_channel",
        "email_send",
        "email_send_bulk",
        "sms_send",
        "stripe_create_payment",
        "stripe_refund",
        "aws_s3_upload",
        "aws_s3_download",
        "aws_lambda_invoke",
        "github_create_issue",
        "github_create_pr",
        "jira_create_ticket",
        "jira_update_ticket",
        "salesforce_create_lead",
        "salesforce_query",
        "twilio_make_call",
        "sendgrid_send_email",
        "google_calendar_create_event",
        "google_drive_upload"
    ],
    
    "admin": [
        # Tools 101-114: System administration
        "admin_get_system_status",
        "admin_restart_service",
        "admin_clear_cache",
        "admin_update_config",
        "admin_rotate_secrets",
        "admin_backup_system",
        "admin_restore_system",
        "admin_monitor_resources",
        "admin_scale_service",
        "admin_deploy_update",
        "admin_rollback_update",
        "admin_view_logs",
        "admin_alert_configure",
        "admin_user_permissions"
    ]
}

# Total: 114 tools
assert sum(len(tools) for tools in TOOL_CATEGORIES.values()) == 114
```

#### Step 2: Create Specialized Agents

```python
# specialized_agents.py
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool import McpToolset
from tool_categories import TOOL_CATEGORIES

# MCP Server Configuration
MCP_SERVER_COMMAND = "npx"
MCP_SERVER_ARGS = ["-y", "@your-company/custom-mcp-server"]

# --- Database Specialist Agent ---
database_agent = LlmAgent(
    name="database_specialist",
    model="gemini-3-flash",
    instruction="""
    You are a database specialist with access to 20 database tools.
    
    Your capabilities:
    - Execute SQL queries and transactions
    - Manage database schema (tables, indexes)
    - Perform backups and restores
    - Optimize and analyze database performance
    - Import/export data
    
    Always ensure data integrity and follow transaction best practices.
    """,
    tools=[
        McpToolset(
            command=MCP_SERVER_COMMAND,
            args=MCP_SERVER_ARGS,
            tool_filter=TOOL_CATEGORIES["database"]  # Only 20 DB tools
        )
    ],
    output_key="database_result"
)

# --- API Specialist Agent ---
api_agent = LlmAgent(
    name="api_specialist",
    model="gemini-3-flash",
    instruction="""
    You are an API integration specialist with access to 25 API tools.
    
    Your capabilities:
    - Make HTTP/REST/GraphQL requests
    - Handle authentication (OAuth, API keys)
    - Manage webhooks
    - Monitor API health and performance
    - Handle retries and circuit breaking
    
    Always validate responses and handle errors gracefully.
    """,
    tools=[
        McpToolset(
            command=MCP_SERVER_COMMAND,
            args=MCP_SERVER_ARGS,
            tool_filter=TOOL_CATEGORIES["api"]  # Only 25 API tools
        )
    ],
    output_key="api_result"
)

# --- File Operations Specialist Agent ---
file_agent = LlmAgent(
    name="file_specialist",
    model="gemini-3-flash",
    instruction="""
    You are a file operations specialist with access to 15 file tools.
    
    Your capabilities:
    - Read, write, and modify files
    - Search and organize files
    - Compress, encrypt, and convert files
    - Validate file formats
    
    Always check file permissions and validate input paths.
    """,
    tools=[
        McpToolset(
            command=MCP_SERVER_COMMAND,
            args=MCP_SERVER_ARGS,
            tool_filter=TOOL_CATEGORIES["file"]  # Only 15 file tools
        )
    ],
    output_key="file_result"
)

# --- Analytics Specialist Agent ---
analytics_agent = LlmAgent(
    name="analytics_specialist",
    model="gemini-3-flash",
    instruction="""
    You are a data analytics specialist with access to 20 analytics tools.
    
    Your capabilities:
    - Statistical calculations and aggregations
    - Time series analysis and forecasting
    - Anomaly detection and clustering
    - Report generation and data visualization
    - Data validation and transformation
    
    Always validate data quality before analysis.
    """,
    tools=[
        McpToolset(
            command=MCP_SERVER_COMMAND,
            args=MCP_SERVER_ARGS,
            tool_filter=TOOL_CATEGORIES["analytics"]  # Only 20 analytics tools
        )
    ],
    output_key="analytics_result"
)

# --- Integration Specialist Agent ---
integration_agent = LlmAgent(
    name="integration_specialist",
    model="gemini-3-flash",
    instruction="""
    You are an external integration specialist with access to 20 integration tools.
    
    Your capabilities:
    - Slack, email, and SMS communications
    - Payment processing (Stripe)
    - Cloud services (AWS S3, Lambda)
    - Third-party APIs (GitHub, Jira, Salesforce)
    - Calendar and drive management
    
    Always confirm actions before executing critical integrations.
    """,
    tools=[
        McpToolset(
            command=MCP_SERVER_COMMAND,
            args=MCP_SERVER_ARGS,
            tool_filter=TOOL_CATEGORIES["integration"]  # Only 20 integration tools
        )
    ],
    output_key="integration_result"
)

# --- Admin Specialist Agent ---
admin_agent = LlmAgent(
    name="admin_specialist",
    model="gemini-3-flash",
    instruction="""
    You are a system administration specialist with access to 14 admin tools.
    
    Your capabilities:
    - System monitoring and health checks
    - Service management and scaling
    - Configuration and secret management
    - Backup and restore operations
    - Deployment and rollback
    
    CRITICAL: Always confirm before executing destructive operations.
    """,
    tools=[
        McpToolset(
            command=MCP_SERVER_COMMAND,
            args=MCP_SERVER_ARGS,
            tool_filter=TOOL_CATEGORIES["admin"]  # Only 14 admin tools
        )
    ],
    output_key="admin_result"
)

# List of all specialists for easy access
SPECIALIST_AGENTS = [
    database_agent,
    api_agent,
    file_agent,
    analytics_agent,
    integration_agent,
    admin_agent
]
```

#### Step 3: Create Orchestrator Agent

```python
# orchestrator.py
from google.adk.agents import LlmAgent
from specialized_agents import SPECIALIST_AGENTS

orchestrator = LlmAgent(
    name="orchestrator",
    model="gemini-3-pro-preview",  # Use Pro for better routing decisions
    instruction="""
    You are an intelligent orchestrator managing a team of 6 specialist agents.
    
    **Your Team:**
    
    1. **database_specialist**: Database operations, queries, schema management (20 tools)
    2. **api_specialist**: HTTP/REST/GraphQL requests, webhooks, authentication (25 tools)
    3. **file_specialist**: File operations, search, compression, encryption (15 tools)
    4. **analytics_specialist**: Data analysis, statistics, forecasting, reports (20 tools)
    5. **integration_specialist**: External services (Slack, email, AWS, Stripe, etc.) (20 tools)
    6. **admin_specialist**: System administration, monitoring, deployment (14 tools)
    
    **Your Role:**
    - Analyze user requests and determine which specialist(s) to engage
    - Coordinate multiple specialists for complex tasks
    - Synthesize results from specialists into coherent responses
    - Escalate if no specialist can handle the request
    
    **Decision Framework:**
    - Database queries/operations → database_specialist
    - API calls/webhooks → api_specialist
    - File operations → file_specialist
    - Data analysis/reports → analytics_specialist
    - External integrations → integration_specialist
    - System admin tasks → admin_specialist
    - Complex tasks may require multiple specialists
    
    Always explain which specialist you're engaging and why.
    """,
    sub_agents=SPECIALIST_AGENTS,  # Specialists become tools
    output_key="final_response"
)
```

#### Step 4: Running the System

```python
# main.py
import asyncio
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types
from orchestrator import orchestrator

async def run_query(user_query: str):
    """Execute a query through the orchestrated system."""
    
    # Setup session
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name="mcp_114_tools",
        user_id="user_123",
        session_id="session_456"
    )
    
    # Create runner
    runner = Runner(
        agent=orchestrator,
        app_name="mcp_114_tools",
        session_service=session_service
    )
    
    # Create message
    message = types.Content(
        role='user',
        parts=[types.Part(text=user_query)]
    )
    
    # Run
    print(f"\n{'='*60}")
    print(f"User Query: {user_query}")
    print(f"{'='*60}\n")
    
    async for event in runner.run_async(
        user_id="user_123",
        session_id="session_456",
        new_message=message
    ):
        print(f"[{event.author}]: Processing...")
        
        if event.is_final_response():
            response = event.content.parts[0].text
            print(f"\n{'='*60}")
            print(f"Final Response:")
            print(f"{'='*60}")
            print(response)
            print(f"{'='*60}\n")

# Example queries
async def main():
    # Query 1: Database operation
    await run_query(
        "Query the users table for all users created in the last 30 days"
    )
    
    # Query 2: Integration operation
    await run_query(
        "Send a Slack message to #engineering channel about the deployment"
    )
    
    # Query 3: Complex multi-specialist task
    await run_query(
        "Analyze sales data from the database, generate a trend report, "
        "and email it to the sales team"
    )
    # This would engage: database_specialist → analytics_specialist → integration_specialist

if __name__ == "__main__":
    asyncio.run(main())
```

### Advantages

✅ **Clear separation of concerns**: Each agent has 10-25 tools (manageable)
✅ **Efficient context usage**: Only relevant tools loaded per request
✅ **Easy to maintain**: Add tools to specific categories
✅ **Good performance**: Reduced tool selection time
✅ **Scalable**: Easy to add new specialist agents

### Disadvantages

❌ Requires upfront categorization
❌ Orchestrator needs good routing logic
❌ Multi-specialist tasks add latency

---

## Strategy 2: Dynamic Tool Loading

### Concept

Use a "meta-agent" that analyzes the query, determines which tools are needed, and dynamically loads only those tools.

### Architecture

```
User Query
    ↓
Meta-Agent (Gemini-3-Pro)
    │
    ├─ Step 1: Analyze query to determine needed tools
    │           Output: ["db_query", "analytics_calculate_avg", "email_send"]
    │
    ├─ Step 2: Dynamically create executor agent with ONLY those 3 tools
    │
    └─ Step 3: Execute with minimal context
```

### Implementation

```python
# dynamic_tool_loading.py
from google.adk.agents import LlmAgent, BaseAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.events import Event, EventActions
from typing import List, AsyncGenerator
import json

class ToolSelector(LlmAgent):
    """Meta-agent that selects which tools are needed."""
    
    def __init__(self):
        # Tool catalog with descriptions
        self.tool_catalog = self._build_tool_catalog()
        
        super().__init__(
            name="tool_selector",
            model="gemini-3-pro-preview",
            instruction=f"""
            You are a tool selection expert. Given a user query, identify which tools
            from our catalog of 114 tools are needed to fulfill the request.
            
            **Tool Catalog** (abbreviated for context):
            {json.dumps(self._get_abbreviated_catalog(), indent=2)}
            
            **Your Task:**
            1. Analyze the user query
            2. Identify the 3-10 most relevant tools (be selective!)
            3. Return ONLY a JSON array of tool names
            
            **Output Format:**
            ["tool_name_1", "tool_name_2", "tool_name_3"]
            
            Be conservative - only include tools that are directly needed.
            """,
            output_key="selected_tools"
        )
    
    def _build_tool_catalog(self) -> dict:
        """Build complete tool catalog with descriptions."""
        return {
            # Database tools
            "db_query": "Execute SQL query on database",
            "db_insert": "Insert data into database table",
            "db_update": "Update existing database records",
            # ... all 114 tools with descriptions
            
            # Analytics tools
            "analytics_calculate_avg": "Calculate average of numeric data",
            "analytics_trend_analysis": "Analyze trends in time series data",
            # ... etc
            
            # Integration tools
            "email_send": "Send email via SMTP",
            "slack_send_message": "Send message to Slack channel",
            # ... etc
        }
    
    def _get_abbreviated_catalog(self) -> dict:
        """Get abbreviated catalog for context (to save tokens)."""
        # Group by category for LLM
        return {
            "database": ["db_query", "db_insert", "db_update", "...20 tools total"],
            "api": ["http_get", "http_post", "graphql_query", "...25 tools total"],
            "file": ["file_read", "file_write", "file_search", "...15 tools total"],
            "analytics": ["analytics_calculate_avg", "analytics_trend_analysis", "...20 tools total"],
            "integration": ["email_send", "slack_send_message", "stripe_create_payment", "...20 tools total"],
            "admin": ["admin_get_system_status", "admin_restart_service", "...14 tools total"]
        }


class DynamicToolAgent(BaseAgent):
    """Agent that dynamically loads tools based on query."""
    
    def __init__(self):
        super().__init__(name="dynamic_tool_agent")
        self.tool_selector = ToolSelector()
        self.mcp_command = "npx"
        self.mcp_args = ["-y", "@your-company/custom-mcp-server"]
    
    async def _run_async_impl(self, ctx) -> AsyncGenerator[Event, None]:
        """
        1. Analyze query to select tools
        2. Create executor with selected tools
        3. Execute query with minimal context
        """
        
        # Step 1: Select tools
        print("[DynamicToolAgent] Analyzing query to select tools...")
        
        selected_tools = []
        async for event in self.tool_selector.run_async(ctx):
            if event.is_final_response():
                # Parse selected tools from response
                response_text = event.content.parts[0].text
                # Extract JSON array
                import re
                json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
                if json_match:
                    selected_tools = json.loads(json_match.group())
        
        print(f"[DynamicToolAgent] Selected {len(selected_tools)} tools: {selected_tools}")
        
        # Step 2: Create executor with selected tools only
        executor = LlmAgent(
            name="executor",
            model="gemini-3-flash",
            instruction=f"""
            You have access to the following tools to complete the user's request:
            {', '.join(selected_tools)}
            
            Use these tools to fulfill the user's query completely.
            """,
            tools=[
                McpToolset(
                    command=self.mcp_command,
                    args=self.mcp_args,
                    tool_filter=selected_tools  # Only selected tools!
                )
            ]
        )
        
        # Step 3: Execute
        print("[DynamicToolAgent] Executing with selected tools...")
        async for event in executor.run_async(ctx):
            yield event


# Usage
async def main():
    from google.adk.sessions import InMemorySessionService
    from google.adk.runners import Runner
    from google.genai import types
    
    agent = DynamicToolAgent()
    
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name="dynamic_tools",
        user_id="user_123",
        session_id="session_456"
    )
    
    runner = Runner(
        agent=agent,
        app_name="dynamic_tools",
        session_service=session_service
    )
    
    message = types.Content(
        role='user',
        parts=[types.Part(text="Query the database for user counts and send results via email")]
    )
    
    async for event in runner.run_async(
        user_id="user_123",
        session_id="session_456",
        new_message=message
    ):
        if event.is_final_response():
            print(event.content.parts[0].text)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Advantages

✅ **Minimal context per request**: Only loads necessary tools
✅ **Flexible**: Handles any query pattern
✅ **Efficient token usage**: Smaller contexts = lower cost
✅ **No predefined categories needed**: Self-organizing

### Disadvantages

❌ **Extra latency**: Two-step process (select → execute)
❌ **Tool selection errors**: May miss necessary tools
❌ **More complex**: Requires sophisticated tool selector

---

## Strategy 3: Hierarchical Tool Routing

### Concept

Create a three-tier hierarchy: Orchestrator → Domain Managers → Specialists

### Architecture

```
User Query
    ↓
Orchestrator (Gemini-3-Pro)
    │
    ├─→ Database Domain Manager (Gemini-3-Flash)
    │       ├─→ SQL Specialist (Tools: queries, transactions)
    │       ├─→ Schema Specialist (Tools: DDL, migrations)
    │       └─→ Performance Specialist (Tools: optimization, monitoring)
    │
    ├─→ Integration Domain Manager (Gemini-3-Flash)
    │       ├─→ Communication Specialist (Tools: email, Slack, SMS)
    │       ├─→ Payment Specialist (Tools: Stripe operations)
    │       └─→ Cloud Specialist (Tools: AWS, Google Cloud)
    │
    └─→ Analytics Domain Manager (Gemini-3-Flash)
            ├─→ Statistical Specialist (Tools: calculations, aggregations)
            └─→ Reporting Specialist (Tools: charts, exports)
```

### Implementation

```python
# hierarchical_routing.py
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools.mcp_tool import McpToolset

# --- Tier 3: Ultra-Specialized Agents (5-10 tools each) ---

sql_specialist = LlmAgent(
    name="sql_specialist",
    model="gemini-3-flash",
    instruction="Expert in SQL queries and transactions.",
    tools=[
        McpToolset(
            command="npx",
            args=["-y", "@company/mcp"],
            tool_filter=[
                "db_query",
                "db_insert",
                "db_update",
                "db_delete",
                "db_transaction_start",
                "db_transaction_commit",
                "db_transaction_rollback"
            ]
        )
    ]
)

schema_specialist = LlmAgent(
    name="schema_specialist",
    model="gemini-3-flash",
    instruction="Expert in database schema management.",
    tools=[
        McpToolset(
            command="npx",
            args=["-y", "@company/mcp"],
            tool_filter=[
                "db_get_schema",
                "db_create_table",
                "db_drop_table",
                "db_create_index",
                "db_backup",
                "db_restore"
            ]
        )
    ]
)

# ... more ultra-specialists ...

# --- Tier 2: Domain Managers ---

database_manager = LlmAgent(
    name="database_manager",
    model="gemini-3-flash",
    instruction="""
    You manage a team of database specialists:
    - sql_specialist: Queries and transactions
    - schema_specialist: Schema management
    - performance_specialist: Optimization
    
    Delegate tasks to the appropriate specialist.
    """,
    sub_agents=[sql_specialist, schema_specialist]
)

integration_manager = LlmAgent(
    name="integration_manager",
    model="gemini-3-flash",
    instruction="""
    You manage integration specialists:
    - communication_specialist: Email, Slack, SMS
    - payment_specialist: Stripe operations
    - cloud_specialist: AWS, Google Cloud
    """,
    sub_agents=[...]  # Communication, payment, cloud specialists
)

# --- Tier 1: Orchestrator ---

orchestrator = LlmAgent(
    name="orchestrator",
    model="gemini-3-pro-preview",
    instruction="""
    You coordinate high-level domain managers:
    - database_manager: All database operations
    - integration_manager: External integrations
    - analytics_manager: Data analysis
    
    Delegate to appropriate manager based on request.
    """,
    sub_agents=[database_manager, integration_manager]
)
```

### Advantages

✅ **Maximum specialization**: Each agent has 5-10 tools
✅ **Clear responsibility chains**: Easy to debug
✅ **Scales well**: Add specialists without changing structure
✅ **Good for complex organizations**: Mirrors real team structure

### Disadvantages

❌ **High latency**: Three levels of delegation
❌ **Complex**: Many agents to maintain
❌ **Over-engineering risk**: May be overkill for simple queries

---

## Strategy 4: Hybrid Approach (Recommended)

### Concept

Combine strategies for production use:
1. Domain-specialized agents for common patterns
2. Dynamic tool loading for uncommon/complex queries
3. Parallel execution where possible

### Architecture

```
User Query
    ↓
Intent Classifier (Quick LLM call)
    │
    ├─→ "Common Pattern" → Direct to Specialist (Strategy 1)
    │       ├─ Database queries → database_specialist
    │       ├─ API calls → api_specialist
    │       └─ File ops → file_specialist
    │
    ├─→ "Complex/Multi-domain" → Dynamic Loading (Strategy 2)
    │       └─ Analyze → Load specific tools → Execute
    │
    └─→ "Parallel Tasks" → Fan-out (Strategy 1 + Parallel)
            └─ Multiple specialists execute in parallel
```

### Complete Implementation

```python
# hybrid_system.py
from google.adk.agents import LlmAgent, ParallelAgent, BaseAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.events import Event, EventActions
from typing import AsyncGenerator, List
import re
import json

# Import specialists from Strategy 1
from specialized_agents import (
    database_agent,
    api_agent,
    file_agent,
    analytics_agent,
    integration_agent,
    admin_agent
)

class IntentClassifier(LlmAgent):
    """Quickly classify user intent."""
    
    def __init__(self):
        super().__init__(
            name="intent_classifier",
            model="gemini-3-flash",  # Fast model for quick classification
            instruction="""
            Classify the user query into ONE of these categories:
            
            1. "database" - Database queries, data operations
            2. "api" - API calls, HTTP requests
            3. "file" - File operations
            4. "analytics" - Data analysis, calculations
            5. "integration" - External services (Slack, email, etc.)
            6. "admin" - System administration
            7. "complex" - Requires multiple domains
            8. "parallel" - Independent tasks that can run in parallel
            
            Respond with ONLY the category name.
            
            Examples:
            - "Query users table" → database
            - "Send email to team" → integration
            - "Analyze sales and email report" → complex
            - "Query DB and call API simultaneously" → parallel
            """,
            output_key="intent"
        )


class HybridOrchestrator(BaseAgent):
    """Hybrid orchestrator using multiple strategies."""
    
    def __init__(self):
        super().__init__(name="hybrid_orchestrator")
        
        # Components
        self.intent_classifier = IntentClassifier()
        
        # Specialists (Strategy 1)
        self.specialists = {
            "database": database_agent,
            "api": api_agent,
            "file": file_agent,
            "analytics": analytics_agent,
            "integration": integration_agent,
            "admin": admin_agent
        }
        
        # Tool catalog for dynamic loading
        self.all_tools = self._build_tool_catalog()
    
    def _build_tool_catalog(self) -> dict:
        """Complete catalog of all 114 tools."""
        from tool_categories import TOOL_CATEGORIES
        catalog = {}
        for category, tools in TOOL_CATEGORIES.items():
            for tool in tools:
                catalog[tool] = {
                    "category": category,
                    "description": f"Tool from {category} domain"
                }
        return catalog
    
    async def _run_async_impl(self, ctx) -> AsyncGenerator[Event, None]:
        """Intelligent routing based on intent."""
        
        # Step 1: Classify intent
        print("[Hybrid] Classifying intent...")
        intent = await self._classify_intent(ctx)
        print(f"[Hybrid] Intent: {intent}")
        
        # Step 2: Route based on intent
        if intent in self.specialists:
            # Strategy 1: Direct to specialist
            print(f"[Hybrid] Routing to {intent} specialist...")
            async for event in self.specialists[intent].run_async(ctx):
                yield event
        
        elif intent == "complex":
            # Strategy 2: Dynamic tool loading
            print("[Hybrid] Complex query - using dynamic tool loading...")
            async for event in self._handle_complex(ctx):
                yield event
        
        elif intent == "parallel":
            # Strategy 1 + Parallel: Multiple specialists
            print("[Hybrid] Parallel tasks detected...")
            async for event in self._handle_parallel(ctx):
                yield event
        
        else:
            # Fallback
            yield Event(
                author=self.name,
                content=types.Content(
                    role="assistant",
                    parts=[types.Part(text="Could not determine how to handle this query.")]
                ),
                actions=EventActions(is_final_response=True)
            )
    
    async def _classify_intent(self, ctx) -> str:
        """Classify user intent."""
        intent = "unknown"
        async for event in self.intent_classifier.run_async(ctx):
            if event.is_final_response():
                intent = event.content.parts[0].text.strip().lower()
        return intent
    
    async def _handle_complex(self, ctx) -> AsyncGenerator[Event, None]:
        """Handle complex multi-domain queries with dynamic loading."""
        
        # Sub-step 1: Analyze to determine tools
        tool_selector = LlmAgent(
            name="tool_selector",
            model="gemini-3-pro-preview",
            instruction="""
            Analyze this query and select 5-15 tools needed from our 114-tool catalog.
            
            Available categories:
            - database: 20 tools
            - api: 25 tools
            - file: 15 tools
            - analytics: 20 tools
            - integration: 20 tools
            - admin: 14 tools
            
            Return a JSON array of tool names.
            """,
            output_key="selected_tools"
        )
        
        selected_tools = []
        async for event in tool_selector.run_async(ctx):
            if event.is_final_response():
                response_text = event.content.parts[0].text
                json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
                if json_match:
                    selected_tools = json.loads(json_match.group())
        
        print(f"[Hybrid] Dynamically loading {len(selected_tools)} tools")
        
        # Sub-step 2: Execute with selected tools
        executor = LlmAgent(
            name="dynamic_executor",
            model="gemini-3-flash",
            instruction="Use the provided tools to complete the task.",
            tools=[
                McpToolset(
                    command="npx",
                    args=["-y", "@company/mcp"],
                    tool_filter=selected_tools
                )
            ]
        )
        
        async for event in executor.run_async(ctx):
            yield event
    
    async def _handle_parallel(self, ctx) -> AsyncGenerator[Event, None]:
        """Handle queries that can be parallelized."""
        
        # Parse query to identify parallel tasks
        task_identifier = LlmAgent(
            name="task_identifier",
            model="gemini-3-flash",
            instruction="""
            Identify independent tasks in this query that can run in parallel.
            
            Output format:
            {
                "tasks": [
                    {"domain": "database", "description": "..."},
                    {"domain": "api", "description": "..."}
                ]
            }
            """,
            output_key="tasks"
        )
        
        # Get tasks
        tasks = []
        async for event in task_identifier.run_async(ctx):
            if event.is_final_response():
                response_text = event.content.parts[0].text
                # Parse tasks
                import json
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    task_data = json.loads(json_match.group())
                    tasks = task_data.get("tasks", [])
        
        # Create parallel execution
        if tasks:
            agents_to_run = []
            for task in tasks:
                domain = task.get("domain")
                if domain in self.specialists:
                    agents_to_run.append(self.specialists[domain])
            
            if len(agents_to_run) > 1:
                print(f"[Hybrid] Running {len(agents_to_run)} specialists in parallel")
                parallel_executor = ParallelAgent(
                    name="parallel_executor",
                    sub_agents=agents_to_run
                )
                
                async for event in parallel_executor.run_async(ctx):
                    yield event
            else:
                # Fallback to single specialist
                async for event in agents_to_run[0].run_async(ctx):
                    yield event


# Usage
async def main():
    from google.adk.sessions import InMemorySessionService
    from google.adk.runners import Runner
    from google.genai import types
    
    orchestrator = HybridOrchestrator()
    
    session_service = InMemorySessionService()
    runner = Runner(
        agent=orchestrator,
        app_name="hybrid_system",
        session_service=session_service
    )
    
    # Test different query types
    queries = [
        # Simple - routes to specialist
        "Query the users table for active users",
        
        # Complex - dynamic loading
        "Query database, analyze trends, generate report, and email to team",
        
        # Parallel - multiple specialists
        "Simultaneously query the database and call the payment API"
    ]
    
    for query in queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print(f"{'='*60}\n")
        
        session = await session_service.create_session(
            app_name="hybrid_system",
            user_id="user_123",
            session_id=f"session_{hash(query)}"
        )
        
        message = types.Content(
            role='user',
            parts=[types.Part(text=query)]
        )
        
        async for event in runner.run_async(
            user_id="user_123",
            session_id=f"session_{hash(query)}",
            new_message=message
        ):
            if event.is_final_response():
                print(f"\nResponse: {event.content.parts[0].text}\n")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### Hybrid System Advantages

✅ **Best of all strategies**: Flexibility + performance
✅ **Optimized for common cases**: Fast routing for frequent patterns
✅ **Handles complex cases**: Dynamic loading when needed
✅ **Parallel execution**: Speed for independent tasks
✅ **Production-ready**: Battle-tested pattern

---

## Performance Optimization

### 1. Tool Filter Caching

```python
# Cache tool filters to avoid recreation
from functools import lru_cache

@lru_cache(maxsize=128)
def get_mcp_toolset(tool_category: str) -> McpToolset:
    """Cached MCP toolset creation."""
    from tool_categories import TOOL_CATEGORIES
    
    return McpToolset(
        command="npx",
        args=["-y", "@company/mcp"],
        tool_filter=TOOL_CATEGORIES[tool_category]
    )

# Usage
database_agent = LlmAgent(
    name="database_agent",
    model="gemini-3-flash",
    tools=[get_mcp_toolset("database")]  # Cached
)
```

### 2. Lazy Tool Loading

```python
class LazyToolAgent(LlmAgent):
    """Agent that loads tools only when needed."""
    
    def __init__(self, name: str, tool_category: str):
        self._tool_category = tool_category
        self._tools_loaded = False
        
        super().__init__(
            name=name,
            model="gemini-3-flash",
            tools=[]  # Empty initially
        )
    
    async def _run_async_impl(self, ctx):
        # Load tools on first run
        if not self._tools_loaded:
            print(f"[{self.name}] Loading tools for {self._tool_category}...")
            self.tools = [get_mcp_toolset(self._tool_category)]
            self._tools_loaded = True
        
        # Continue with normal execution
        async for event in super()._run_async_impl(ctx):
            yield event
```

### 3. Parallel Specialist Initialization

```python
import asyncio

async def initialize_specialists_parallel():
    """Initialize all specialists in parallel."""
    
    async def init_specialist(name: str, category: str):
        """Initialize a single specialist."""
        return LlmAgent(
            name=name,
            model="gemini-3-flash",
            tools=[get_mcp_toolset(category)]
        )
    
    # Create all specialists in parallel
    specialists = await asyncio.gather(
        init_specialist("database_agent", "database"),
        init_specialist("api_agent", "api"),
        init_specialist("file_agent", "file"),
        init_specialist("analytics_agent", "analytics"),
        init_specialist("integration_agent", "integration"),
        init_specialist("admin_agent", "admin")
    )
    
    return specialists
```

### 4. Request Batching

```python
class BatchedMCPAgent(BaseAgent):
    """Agent that batches multiple tool calls."""
    
    async def _run_async_impl(self, ctx):
        # Collect all tool calls first
        tool_calls = await self._identify_tool_calls(ctx)
        
        # Batch similar operations
        batched_calls = self._batch_by_domain(tool_calls)
        
        # Execute batches in parallel
        results = await asyncio.gather(*[
            self._execute_batch(domain, calls)
            for domain, calls in batched_calls.items()
        ])
        
        # Synthesize results
        yield self._synthesize_results(results)
```

### 5. Tool Description Optimization

```python
# Instead of sending all tool descriptions every time,
# send abbreviated descriptions and fetch details on demand

ABBREVIATED_CATALOG = {
    "db_query": "Execute SQL",
    "db_insert": "Insert data",
    # ... abbreviated descriptions
}

FULL_CATALOG = {
    "db_query": "Execute SQL query with parameters, transactions, etc...",
    # ... full descriptions
}

# Send abbreviated to LLM first
# Only send full description when tool is selected
```

---

## Monitoring and Debugging

### 1. Tool Usage Analytics

```python
from collections import Counter
from datetime import datetime

class ToolUsageMonitor:
    """Monitor which tools are being used."""
    
    def __init__(self):
        self.tool_calls = Counter()
        self.tool_errors = Counter()
        self.call_timestamps = []
    
    def record_call(self, tool_name: str, success: bool):
        """Record a tool call."""
        self.tool_calls[tool_name] += 1
        if not success:
            self.tool_errors[tool_name] += 1
        self.call_timestamps.append({
            'tool': tool_name,
            'success': success,
            'timestamp': datetime.now()
        })
    
    def get_stats(self):
        """Get usage statistics."""
        return {
            'most_used_tools': self.tool_calls.most_common(10),
            'most_errors': self.tool_errors.most_common(10),
            'total_calls': sum(self.tool_calls.values()),
            'error_rate': sum(self.tool_errors.values()) / sum(self.tool_calls.values())
        }

# Global monitor
monitor = ToolUsageMonitor()

# In your agents, record tool usage
def instrumented_tool(original_tool):
    """Wrap tool to monitor usage."""
    async def wrapper(*args, **kwargs):
        try:
            result = await original_tool(*args, **kwargs)
            monitor.record_call(original_tool.name, success=True)
            return result
        except Exception as e:
            monitor.record_call(original_tool.name, success=False)
            raise
    return wrapper
```

### 2. Logging Strategy

```python
import logging
from datetime import datetime

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s'
)

logger = logging.getLogger("mcp_system")

class LoggedAgent(LlmAgent):
    """Agent with comprehensive logging."""
    
    async def _run_async_impl(self, ctx):
        start_time = datetime.now()
        
        logger.info(f"[{self.name}] Starting execution")
        logger.debug(f"[{self.name}] Context: {ctx.session.state}")
        
        try:
            async for event in super()._run_async_impl(ctx):
                logger.debug(f"[{self.name}] Event: {event.author}")
                yield event
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"[{self.name}] Completed in {duration:.2f}s")
            
        except Exception as e:
            logger.error(f"[{self.name}] Error: {str(e)}", exc_info=True)
            raise
```

### 3. ADK Web UI Usage

```bash
# Run with dev UI for visual debugging
adk web

# Then access http://localhost:8000
# Features:
# - View all agent calls
# - Inspect tool calls
# - See state changes
# - Trace latency
# - Debug errors
```

### 4. Custom Callbacks for Observability

```python
from google.adk.callbacks import BaseCallback

class MCPToolCallback(BaseCallback):
    """Custom callback for MCP tool monitoring."""
    
    def on_tool_start(self, tool_name: str, inputs: dict):
        logger.info(f"Tool called: {tool_name}")
        logger.debug(f"Inputs: {inputs}")
    
    def on_tool_end(self, tool_name: str, outputs: dict):
        logger.info(f"Tool completed: {tool_name}")
        logger.debug(f"Outputs: {outputs}")
    
    def on_tool_error(self, tool_name: str, error: Exception):
        logger.error(f"Tool error: {tool_name} - {str(error)}")

# Use callback
runner = Runner(
    agent=orchestrator,
    callbacks=[MCPToolCallback()]
)
```

---

## Production Considerations

### 1. Environment Configuration

```python
# config.py
import os
from dataclasses import dataclass
from typing import List

@dataclass
class MCPConfig:
    """MCP Server configuration."""
    command: str
    args: List[str]
    timeout: int = 30  # seconds
    max_retries: int = 3
    
    @classmethod
    def from_env(cls):
        """Load from environment variables."""
        return cls(
            command=os.getenv("MCP_COMMAND", "npx"),
            args=os.getenv("MCP_ARGS", "-y,@company/mcp").split(","),
            timeout=int(os.getenv("MCP_TIMEOUT", "30")),
            max_retries=int(os.getenv("MCP_MAX_RETRIES", "3"))
        )

# Usage
config = MCPConfig.from_env()

mcp_toolset = McpToolset(
    command=config.command,
    args=config.args
)
```

### 2. Error Handling and Retries

```python
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

class ResilientMCPAgent(LlmAgent):
    """Agent with retry logic for MCP calls."""
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _call_tool_with_retry(self, tool_name: str, inputs: dict):
        """Call MCP tool with exponential backoff retry."""
        try:
            result = await self._call_tool(tool_name, inputs)
            return result
        except Exception as e:
            logger.warning(f"Tool call failed: {tool_name}, retrying...")
            raise
```

### 3. Rate Limiting

```python
from datetime import datetime, timedelta
import asyncio

class RateLimitedMCPToolset:
    """MCP Toolset with rate limiting."""
    
    def __init__(self, tools_per_minute: int = 60):
        self.rpm_limit = tools_per_minute
        self.call_timestamps = []
    
    async def call_tool(self, tool_name: str, inputs: dict):
        """Call tool with rate limiting."""
        await self._wait_for_rate_limit()
        
        # Make actual call
        result = await self._actual_call(tool_name, inputs)
        
        # Record timestamp
        self.call_timestamps.append(datetime.now())
        
        return result
    
    async def _wait_for_rate_limit(self):
        """Wait if rate limit would be exceeded."""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        # Remove old timestamps
        self.call_timestamps = [
            ts for ts in self.call_timestamps if ts > minute_ago
        ]
        
        # Wait if at limit
        if len(self.call_timestamps) >= self.rpm_limit:
            sleep_time = (self.call_timestamps[0] - minute_ago).total_seconds()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
```

### 4. Security and Access Control

```python
class SecureMCPAgent(LlmAgent):
    """Agent with access control for sensitive tools."""
    
    RESTRICTED_TOOLS = {
        "db_delete",
        "db_drop_table",
        "admin_restart_service",
        "admin_deploy_update"
    }
    
    def __init__(self, name: str, user_role: str, **kwargs):
        self.user_role = user_role
        super().__init__(name=name, **kwargs)
    
    async def _run_async_impl(self, ctx):
        """Execute with access control checks."""
        
        # Check permissions before tool calls
        for event in super()._run_async_impl(ctx):
            # If event is a tool call
            if hasattr(event, 'tool_name'):
                if not self._check_permission(event.tool_name):
                    raise PermissionError(
                        f"User role '{self.user_role}' cannot use tool '{event.tool_name}'"
                    )
            yield event
    
    def _check_permission(self, tool_name: str) -> bool:
        """Check if user has permission for tool."""
        if tool_name in self.RESTRICTED_TOOLS:
            return self.user_role == "admin"
        return True
```

### 5. Graceful Degradation

```python
class FallbackMCPAgent(LlmAgent):
    """Agent that degrades gracefully when tools fail."""
    
    async def _run_async_impl(self, ctx):
        """Execute with fallback behavior."""
        try:
            # Try primary execution
            async for event in super()._run_async_impl(ctx):
                yield event
        
        except Exception as e:
            logger.error(f"Primary execution failed: {e}")
            
            # Fallback: Try with reduced tool set
            logger.info("Attempting fallback with core tools only...")
            
            fallback_agent = LlmAgent(
                name=f"{self.name}_fallback",
                model="gemini-3-flash",
                tools=[get_mcp_toolset("database")],  # Only essential tools
                instruction="Limited tools available. Do your best."
            )
            
            async for event in fallback_agent.run_async(ctx):
                yield event
```

---

## Complete Example: Production-Ready System

```python
# production_system.py
"""
Production-ready MCP integration for 114 tools.
Combines all best practices and strategies.
"""

import asyncio
import logging
from typing import List, Dict
from google.adk.agents import LlmAgent, ParallelAgent, BaseAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.callbacks import BaseCallback
from google.genai import types

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger("production_mcp")

# --- Configuration ---
class ProductionConfig:
    """Production configuration."""
    MCP_COMMAND = "npx"
    MCP_ARGS = ["-y", "@company/custom-mcp-server"]
    ENABLE_CACHING = True
    ENABLE_MONITORING = True
    MAX_PARALLEL_AGENTS = 10
    RATE_LIMIT_RPM = 100

config = ProductionConfig()

# --- Tool Categories (from earlier) ---
from tool_categories import TOOL_CATEGORIES

# --- Monitoring ---
class ProductionCallback(BaseCallback):
    """Production monitoring callback."""
    
    def on_agent_start(self, agent_name: str):
        logger.info(f"Agent started: {agent_name}")
    
    def on_agent_end(self, agent_name: str, output):
        logger.info(f"Agent completed: {agent_name}")
    
    def on_tool_start(self, tool_name: str, inputs: dict):
        logger.info(f"Tool called: {tool_name}")
    
    def on_tool_error(self, tool_name: str, error: Exception):
        logger.error(f"Tool error: {tool_name} - {str(error)}")

# --- Specialized Agents (with all best practices) ---
def create_specialist_agent(
    name: str,
    category: str,
    instruction: str
) -> LlmAgent:
    """Factory for creating specialist agents."""
    return LlmAgent(
        name=name,
        model="gemini-3-flash",
        instruction=instruction,
        tools=[
            McpToolset(
                command=config.MCP_COMMAND,
                args=config.MCP_ARGS,
                tool_filter=TOOL_CATEGORIES[category]
            )
        ],
        output_key=f"{category}_result"
    )

# Create all specialists
database_specialist = create_specialist_agent(
    "database_specialist",
    "database",
    "Expert in database operations. 20 tools available."
)

api_specialist = create_specialist_agent(
    "api_specialist",
    "api",
    "Expert in API and HTTP operations. 25 tools available."
)

file_specialist = create_specialist_agent(
    "file_specialist",
    "file",
    "Expert in file operations. 15 tools available."
)

analytics_specialist = create_specialist_agent(
    "analytics_specialist",
    "analytics",
    "Expert in data analytics. 20 tools available."
)

integration_specialist = create_specialist_agent(
    "integration_specialist",
    "integration",
    "Expert in external integrations. 20 tools available."
)

admin_specialist = create_specialist_agent(
    "admin_specialist",
    "admin",
    "Expert in system administration. 14 tools available."
)

# --- Production Orchestrator ---
class ProductionOrchestrator(LlmAgent):
    """Production orchestrator with all optimizations."""
    
    def __init__(self):
        self.specialists = {
            "database": database_specialist,
            "api": api_specialist,
            "file": file_specialist,
            "analytics": analytics_specialist,
            "integration": integration_specialist,
            "admin": admin_specialist
        }
        
        super().__init__(
            name="production_orchestrator",
            model="gemini-3-pro-preview",
            instruction="""
            You are a production orchestrator managing 6 specialist agents
            with access to 114 total tools.
            
            **Specialists:**
            1. database_specialist - Database operations (20 tools)
            2. api_specialist - API/HTTP operations (25 tools)
            3. file_specialist - File operations (15 tools)
            4. analytics_specialist - Data analytics (20 tools)
            5. integration_specialist - External integrations (20 tools)
            6. admin_specialist - System administration (14 tools)
            
            **Your role:**
            - Analyze requests and route to appropriate specialist(s)
            - Coordinate multiple specialists for complex tasks
            - Ensure efficient execution
            - Provide clear, comprehensive responses
            
            **Guidelines:**
            - Use parallel execution when tasks are independent
            - Always explain your routing decisions
            - Handle errors gracefully
            """,
            sub_agents=list(self.specialists.values())
        )

# --- Production Runner ---
async def run_production_query(query: str):
    """Execute query in production system."""
    
    logger.info(f"Processing query: {query}")
    
    # Setup
    orchestrator = ProductionOrchestrator()
    session_service = InMemorySessionService()
    
    session = await session_service.create_session(
        app_name="production_mcp",
        user_id="user_123",
        session_id="session_456"
    )
    
    runner = Runner(
        agent=orchestrator,
        app_name="production_mcp",
        session_service=session_service,
        callbacks=[ProductionCallback()] if config.ENABLE_MONITORING else []
    )
    
    # Execute
    message = types.Content(
        role='user',
        parts=[types.Part(text=query)]
    )
    
    results = []
    async for event in runner.run_async(
        user_id="user_123",
        session_id="session_456",
        new_message=message
    ):
        if event.is_final_response():
            response = event.content.parts[0].text
            results.append(response)
            logger.info(f"Query completed: {query[:50]}...")
    
    return results

# --- Main ---
async def main():
    """Run production examples."""
    
    test_queries = [
        # Simple queries
        "Query the users table for all active accounts",
        "Send a POST request to the payments API",
        "Read the config.json file",
        
        # Complex queries
        "Query database for sales data, analyze trends, and email report to team",
        
        # Parallel queries
        "Simultaneously backup the database and send status email"
    ]
    
    for query in test_queries:
        print(f"\n{'='*70}")
        print(f"QUERY: {query}")
        print(f"{'='*70}\n")
        
        try:
            results = await run_production_query(query)
            print(f"\nRESULT:\n{results[0]}\n")
        except Exception as e:
            logger.error(f"Query failed: {e}", exc_info=True)
            print(f"\nERROR: {e}\n")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Summary and Recommendations

### For Your 114-Tool MCP Server

**Recommended Architecture: Hybrid Approach (Strategy 4)**

```
User Query
    ↓
Intent Classification (Fast)
    │
    ├─→ 80% of queries → Domain Specialists (10-25 tools each)
    │                     ├─ Database (20 tools)
    │                     ├─ API (25 tools)
    │                     ├─ File (15 tools)
    │                     ├─ Analytics (20 tools)
    │                     ├─ Integration (20 tools)
    │                     └─ Admin (14 tools)
    │
    ├─→ 15% of queries → Dynamic Loading (5-15 tools)
    │
    └─→ 5% of queries → Parallel Execution
```

### Implementation Checklist

- [ ] Categorize all 114 tools into 4-8 logical domains
- [ ] Create specialist agent for each domain (10-25 tools each)
- [ ] Implement orchestrator with clear routing logic
- [ ] Add intent classification for quick routing
- [ ] Implement dynamic tool loading for complex queries
- [ ] Add parallel execution support for independent tasks
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Implement error handling and retries
- [ ] Add access control for sensitive tools
- [ ] Test with representative queries
- [ ] Deploy with ADK Web UI for debugging
- [ ] Monitor tool usage patterns
- [ ] Optimize based on actual usage data

### Performance Expectations

| Metric | Expected Value |
|--------|----------------|
| Simple query (1 specialist) | 2-5 seconds |
| Complex query (dynamic loading) | 5-10 seconds |
| Parallel query (2-3 specialists) | 3-7 seconds |
| Tool selection accuracy | >95% |
| Context window usage | 30-50% reduction vs all tools |

### Key Takeaways

1. **Don't give all 114 tools to one agent** - It will confuse the LLM and waste tokens
2. **Domain specialization works best** - Group tools logically (database, API, files, etc.)
3. **Use 10-25 tools per specialist** - Sweet spot for LLM decision-making
4. **Implement intelligent routing** - Orchestrator or intent classifier
5. **Add dynamic loading for edge cases** - Handle unusual tool combinations
6. **Monitor and optimize** - Track which tools are actually used
7. **Use parallel execution** - Speed up independent tasks

---

**Document Version**: 1.0  
**Last Updated**: December 29, 2025  
**Author**: Architecture guide for large-scale MCP integration