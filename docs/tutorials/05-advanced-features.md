# Tutorial 5: Advanced Features

This tutorial covers Super-Legal's enterprise features including financial modeling, custom API integration, and advanced configuration.

---

## Financial Modeling & Code Execution

Super-Legal includes a sandboxed Python execution environment for quantitative analysis.

### Enabling Code Execution

```bash
# In .env
CODE_EXECUTION_ENABLED=true
CODE_EXECUTION_TIMEOUT=30000  # 30 seconds max
```

### Example: DCF Valuation

```
Perform a DCF analysis for the target company with:
- Revenue: $95M (FY2024)
- Growth rate: 8% (years 1-3), 5% (years 4-5), 3% terminal
- EBITDA margin: 19.5%
- WACC: 10%
- Tax rate: 25%

Generate sensitivity tables for WACC (8-12%) and
terminal growth (2-4%).
```

The system executes:

```python
import numpy as np
import pandas as pd

def dcf_valuation(revenue, growth_rates, ebitda_margin, wacc, terminal_growth, tax_rate):
    """
    Discounted Cash Flow valuation model
    """
    # Project revenues
    years = len(growth_rates)
    revenues = [revenue]
    for g in growth_rates:
        revenues.append(revenues[-1] * (1 + g))

    # Calculate EBITDA and FCF
    ebitda = [r * ebitda_margin for r in revenues]
    fcf = [e * (1 - tax_rate) for e in ebitda]  # Simplified

    # Discount factors
    discount_factors = [(1 + wacc) ** -i for i in range(1, years + 2)]

    # Terminal value
    terminal_value = fcf[-1] * (1 + terminal_growth) / (wacc - terminal_growth)

    # Enterprise value
    pv_fcf = sum(f * d for f, d in zip(fcf[1:], discount_factors[:-1]))
    pv_terminal = terminal_value * discount_factors[-1]

    return pv_fcf + pv_terminal

# Base case
ev = dcf_valuation(
    revenue=95_000_000,
    growth_rates=[0.08, 0.08, 0.08, 0.05, 0.05],
    ebitda_margin=0.195,
    wacc=0.10,
    terminal_growth=0.03,
    tax_rate=0.25
)
print(f"Enterprise Value: ${ev:,.0f}")

# Sensitivity analysis
wacc_range = np.arange(0.08, 0.13, 0.01)
tg_range = np.arange(0.02, 0.05, 0.005)

sensitivity = pd.DataFrame(index=wacc_range, columns=tg_range)
for w in wacc_range:
    for tg in tg_range:
        sensitivity.loc[w, tg] = dcf_valuation(
            95_000_000, [0.08]*3 + [0.05]*2, 0.195, w, tg, 0.25
        )

print("\nSensitivity Table (WACC vs Terminal Growth):")
print(sensitivity.to_string())
```

### Example: Monte Carlo Risk Analysis

```
Run a Monte Carlo simulation (10,000 iterations) for
litigation exposure with the following parameters:
- Settlement probability: 60-80%
- Settlement range: $500K-$2M (log-normal)
- Trial probability: 20-40%
- Verdict range: $1M-$10M (log-normal)
- Defense costs: $200K-$500K (uniform)

Output: Expected value, 95th percentile, VaR
```

---

## Custom API Integration

### Adding New Data Sources

Super-Legal supports custom API connectors for enterprise data sources.

#### Configuration Structure

```javascript
// src/config/customApis.js
export const customApis = {
  bloomberg: {
    name: 'Bloomberg Terminal',
    baseUrl: process.env.BLOOMBERG_API_URL,
    auth: {
      type: 'oauth2',
      tokenUrl: process.env.BLOOMBERG_TOKEN_URL,
      clientId: process.env.BLOOMBERG_CLIENT_ID,
      clientSecret: process.env.BLOOMBERG_CLIENT_SECRET
    },
    endpoints: {
      companySearch: '/v1/companies/search',
      filings: '/v1/filings',
      news: '/v1/news'
    },
    rateLimit: {
      requests: 100,
      interval: 60000 // 1 minute
    }
  },

  westlaw: {
    name: 'Westlaw Edge',
    baseUrl: process.env.WESTLAW_API_URL,
    auth: {
      type: 'apiKey',
      header: 'X-API-Key',
      key: process.env.WESTLAW_API_KEY
    },
    endpoints: {
      search: '/v2/search',
      document: '/v2/documents/{id}',
      keycite: '/v2/keycite/{citation}'
    }
  },

  lexisnexis: {
    name: 'LexisNexis',
    baseUrl: process.env.LEXIS_API_URL,
    auth: {
      type: 'basic',
      username: process.env.LEXIS_USERNAME,
      password: process.env.LEXIS_PASSWORD
    }
  }
};
```

#### Environment Configuration

```bash
# .env - Custom API credentials

# Bloomberg Terminal
BLOOMBERG_API_URL=https://api.bloomberg.com
BLOOMBERG_TOKEN_URL=https://auth.bloomberg.com/oauth/token
BLOOMBERG_CLIENT_ID=your_client_id
BLOOMBERG_CLIENT_SECRET=your_client_secret

# Westlaw Edge
WESTLAW_API_URL=https://api.westlaw.com
WESTLAW_API_KEY=your_api_key

# LexisNexis
LEXIS_API_URL=https://api.lexisnexis.com
LEXIS_USERNAME=your_username
LEXIS_PASSWORD=your_password

# PitchBook (PE/VC data)
PITCHBOOK_API_URL=https://api.pitchbook.com
PITCHBOOK_API_KEY=your_api_key

# CapIQ (S&P Capital IQ)
CAPIQ_API_URL=https://api.capitaliq.com
CAPIQ_USERNAME=your_username
CAPIQ_PASSWORD=your_password
```

#### Creating Custom Tools

```javascript
// src/tools/customTools.js
export const bloombergTools = [
  {
    name: 'bloomberg_company_search',
    description: 'Search Bloomberg for company financial data',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Company name or ticker'
        },
        fields: {
          type: 'array',
          description: 'Data fields to return',
          items: { type: 'string' },
          default: ['revenue', 'ebitda', 'marketCap']
        }
      },
      required: ['query']
    }
  },
  {
    name: 'bloomberg_comparable_analysis',
    description: 'Get comparable company analysis',
    inputSchema: {
      type: 'object',
      properties: {
        company: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' } },
        peerGroup: { type: 'string' }
      },
      required: ['company']
    }
  }
];
```

---

## Configurable Review Structure

### Custom Specialist Configuration

```javascript
// src/config/legalSubagents.js
export const customSpecialists = {
  // Add industry-specific specialists
  pharmaceuticalRegulatory: {
    name: 'Pharmaceutical Regulatory Specialist',
    focus: ['FDA approvals', 'NDA/ANDA', 'clinical trials', 'GMP'],
    tools: [
      'search_fda_drug_labels',
      'search_fda_warning_letters',
      'search_fda_drug_adverse_events',
      'search_federal_register'
    ],
    prompt: `You are a pharmaceutical regulatory specialist...`
  },

  cryptoCompliance: {
    name: 'Cryptocurrency Compliance Specialist',
    focus: ['SEC regulations', 'CFTC jurisdiction', 'state licensing', 'AML'],
    tools: [
      'search_sec_filings',
      'search_federal_register',
      'search_ftc_enforcement_cases',
      'search_state_statute'
    ],
    prompt: `You are a cryptocurrency regulatory specialist...`
  },

  cfius: {
    name: 'CFIUS/National Security Analyst',
    focus: ['foreign investment', 'national security', 'FIRRMA'],
    tools: [
      'search_federal_register',
      'search_cases',
      'search_us_code'
    ],
    prompt: `You are a CFIUS and national security specialist...`
  }
};
```

### Custom Validation Rules

```javascript
// src/config/validationRules.js
export const customValidation = {
  // Industry-specific citation requirements
  healthcare: {
    requiredSources: [
      'CMS regulations',
      'State licensing statutes',
      'OIG guidance'
    ],
    citationFormats: {
      regulations: '42 C.F.R. § {section}',
      statutes: '42 U.S.C. § {section}'
    }
  },

  securities: {
    requiredSources: [
      'Securities Act',
      'Exchange Act',
      'SEC rules',
      'No-action letters'
    ],
    citationFormats: {
      rules: '17 C.F.R. § {section}',
      releases: 'SEC Release No. {type}-{number}'
    }
  },

  // Custom quality thresholds
  qualityThresholds: {
    citationAccuracy: 0.95,    // 95% verified
    creacCompliance: 0.90,     // 90% structure adherence
    coverageScore: 0.85        // 85% issue coverage
  }
};
```

---

## Enterprise Observability

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'super-legal'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

Available metrics:

```
# Tool execution metrics
super_legal_tool_calls_total{tool="search_cases"} 1523
super_legal_tool_latency_seconds{tool="search_cases",quantile="0.99"} 2.4

# Agent metrics
super_legal_agent_sessions_active 12
super_legal_agent_tokens_used_total 4500000

# API client metrics
super_legal_api_requests_total{api="courtlistener",status="200"} 892
super_legal_api_rate_limit_hits{api="sec_edgar"} 3

# Quality metrics
super_legal_memorandum_qa_score{document="project_x"} 92.5
super_legal_citation_verification_rate 0.97
```

### Grafana Dashboards

Pre-built dashboards for:
- Tool usage and latency
- API health and rate limits
- Agent session monitoring
- Quality score trends
- Cost tracking

### OpenTelemetry Tracing

```bash
# Enable tracing
OTEL_ENABLED=true
OTEL_EXPORTER_ENDPOINT=http://jaeger:4317
OTEL_SERVICE_NAME=super-legal
```

Trace spans include:
- Request → Research Planning → Specialist Execution → Validation → Assembly
- Per-tool execution with parameters
- External API calls with latency

---

## Cost Optimization

### Token Usage Tracking

```javascript
// Monitor token usage
const tokenTracker = {
  research: 0,
  validation: 0,
  synthesis: 0,

  report() {
    const total = this.research + this.validation + this.synthesis;
    const cost = total * 0.000015; // Claude pricing
    console.log(`Total tokens: ${total}, Est. cost: $${cost.toFixed(2)}`);
  }
};
```

### Intelligent Filtering

Use Gemini 2.5 Flash (1M context) for initial filtering:

```javascript
// Filter large result sets before Claude analysis
const filterConfig = {
  enabled: true,
  model: 'gemini-2.5-flash',
  maxInputTokens: 1000000,
  filteringPrompt: `Review these {count} documents and return
    only the {topK} most relevant for: {query}`
};
```

### Caching Strategy

```javascript
// Cache configuration
const cacheConfig = {
  enabled: true,
  ttl: {
    caselaw: 86400,      // 24 hours (stable)
    regulations: 3600,    // 1 hour (may change)
    secFilings: 43200,   // 12 hours
    patents: 86400       // 24 hours
  },
  maxSize: '1GB'
};
```

---

## Deployment Options

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000 9090
CMD ["node", "src/server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  super-legal:
    build: .
    ports:
      - "3000:3000"
      - "9090:9090"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./reports:/app/reports

  prometheus:
    image: prom/prometheus
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - ./grafana:/var/lib/grafana
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: super-legal
spec:
  replicas: 3
  selector:
    matchLabels:
      app: super-legal
  template:
    spec:
      containers:
      - name: super-legal
        image: super-legal:latest
        ports:
        - containerPort: 3000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

---

## Security Configuration

### API Key Management

```bash
# Use environment variables (never commit)
ANTHROPIC_API_KEY=sk-ant-...

# Or use secrets manager
AWS_SECRETS_MANAGER_ARN=arn:aws:secretsmanager:...
AZURE_KEY_VAULT_URL=https://vault.azure.net/...
GCP_SECRET_MANAGER_PROJECT=project-id
```

### Network Security

```javascript
// src/config/security.js
export const securityConfig = {
  // Allowed outbound domains
  allowedDomains: [
    'api.anthropic.com',
    'www.courtlistener.com',
    'efts.sec.gov',
    'api.exa.ai'
  ],

  // Request timeouts
  timeouts: {
    default: 30000,
    longRunning: 120000
  },

  // Rate limiting
  rateLimits: {
    perMinute: 60,
    perHour: 1000
  }
};
```

---

## Next Steps

- [API Reference](../API-REFERENCE.md)
- [Architecture Documentation](../super-legal-mcp-refactored/docs/ARCHITECTURE_WHITEPAPER.md)
- [Deployment Guide](../super-legal-mcp-refactored/DEPLOYMENT.md)
