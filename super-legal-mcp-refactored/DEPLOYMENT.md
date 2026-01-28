# Deployment Guide - Enhanced Legal MCP Server

This guide covers deploying the refactored Enhanced Legal MCP Server for use with Claude Desktop and other MCP clients.

## 🎯 Claude Desktop Integration

### Step 1: Install Dependencies

```bash
cd super-legal-mcp-refactored
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Required for full functionality
COURTLISTENER_API_TOKEN=your_courtlistener_token_here

# Optional API keys (features disabled if not provided)
USPTO_API_KEY=your_uspto_api_key_here
GOVINFO_API_KEY=your_govinfo_api_key_here
EXA_API_KEY=your_exa_api_key_here
```

### Step 3: Copy Configuration Files

Ensure the state statute configuration is available:

```bash
# Create config directory if it doesn't exist
mkdir -p config

# Copy from original if available
cp ../super-legal-mcp/config/all-states-statute-urls.json ./config/
```

### Step 4: Configure Claude Desktop

Add the following to your Claude Desktop MCP configuration file:

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "enhanced-legal-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/super-legal-mcp-refactored/index.js"],
      "env": {
        "COURTLISTENER_API_TOKEN": "your_courtlistener_token_here",
        "USPTO_API_KEY": "your_uspto_api_key_here",
        "GOVINFO_API_KEY": "your_govinfo_api_key_here",
        "EXA_API_KEY": "your_exa_api_key_here"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/absolute/path/to/super-legal-mcp-refactored/` with the actual absolute path
- Only include API keys you have obtained
- The server will gracefully disable features for missing API keys

### Step 5: Restart Claude Desktop

After updating the configuration:
1. Completely quit Claude Desktop
2. Restart the application
3. The Enhanced Legal MCP Server should now be available

## 🔧 Alternative Deployment Methods

### NPM Global Installation (Future)

The modular structure is ready for npm packaging:

```bash
# Future npm installation
npm install -g enhanced-legal-mcp

# Then in Claude Desktop config:
{
  "mcpServers": {
    "enhanced-legal-mcp": {
      "command": "enhanced-legal-mcp",
      "env": {
        "COURTLISTENER_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t enhanced-legal-mcp .
docker run -p 3000:3000 --env-file .env enhanced-legal-mcp
```

### Systemd Service (Linux)

Create `/etc/systemd/system/enhanced-legal-mcp.service`:

```ini
[Unit]
Description=Enhanced Legal MCP Server
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/enhanced-legal-mcp
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/enhanced-legal-mcp/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable enhanced-legal-mcp
sudo systemctl start enhanced-legal-mcp
```

## 🔍 Verification

### Test Server Startup

```bash
# Test the server directly
node index.js

# Expected output:
# Enhanced Legal MCP Server starting...
# Environment validation passed
# Server initialized successfully on stdio
```

### Test in Claude Desktop

After configuration, you should see the following tools available in Claude Desktop:

**CourtListener Tools (13):**
- search_cases, get_case_details, lookup_citation
- search_judges, get_judge_details
- get_court_info, list_courts
- search_opinions, search_audio, get_audio_details
- get_opinion_with_citations, search_dockets

**Financial Disclosure Tools (9):**
- search_financial_disclosures, get_financial_disclosure_details
- search_judge_investments, get_judge_gifts, get_judge_positions
- search_judge_spouse_income, search_judge_reimbursements
- search_judge_debts, get_disclosure_positions

**SEC EDGAR Tools (4):**
- search_sec_filings, get_sec_company_facts
- get_sec_xbrl_frames, search_sec_company_tickers

**Federal Register Tools (1):**
- search_federal_register

**USPTO Patent Tools (6):**
- search_patents, search_patent_locations
- search_cpc_classifications, search_cpc_groups
- search_uspc_classifications, search_wipo_classifications

**GovInfo USC Tools (4):**
- search_us_code, get_usc_section
- get_usc_title_structure, list_usc_titles

**State Statute Tools (1):**
- search_state_statute

**Analysis Tools (1):**
- comprehensive_legal_entity_analysis

## 🚨 Troubleshooting

### Common Issues

**1. Server Not Starting**
```bash
# Check Node.js version
node --version  # Should be 18.0.0+

# Check dependencies
npm list

# Check for syntax errors
node --check index.js
```

**2. Claude Desktop Not Detecting Server**
- Verify absolute path in configuration
- Check file permissions
- Ensure Node.js is in system PATH
- Restart Claude Desktop completely

**3. API Rate Limiting**
- The server automatically handles rate limits
- Check stderr output for rate limit messages
- Verify API keys are valid

**4. Missing Tools**
- Tools are disabled if API keys are missing
- Check environment variables
- Verify API key validity

### Debug Mode

Run with debug output:

```bash
# Enable debug logging
DEBUG=* node index.js

# Or use the dev script
npm run dev
```

### Log Analysis

The server outputs structured logs to stderr:

```bash
# Redirect logs to file
node index.js 2> server.log

# Monitor logs in real-time
tail -f server.log
```

## 📊 Performance Monitoring

### Rate Limit Status

The server automatically logs rate limit status:

```
Rate limiter initialized for SEC_EDGAR: 9 requests per second
Rate limiter initialized for FEDERAL_REGISTER: 5 requests per second
Rate limiter initialized for USPTO: 40 requests per minute
```

### Cache Performance

Monitor cache hit rates in the logs:

```
Cache hit for key: courtlistener_cases_search_...
Cache miss for key: sec_filings_search_...
Cache cleanup completed: removed 15 expired entries
```

### Memory Usage

Monitor memory usage for long-running deployments:

```bash
# Check memory usage
ps aux | grep "node.*index.js"

# Monitor with htop
htop -p $(pgrep -f "node.*index.js")
```

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit for security issues
npm audit
```

### Configuration Updates

The modular structure makes updates easy:

- **API Changes**: Update individual client files
- **New Tools**: Add to `toolDefinitions.js` and `toolImplementations.js`
- **Rate Limits**: Update `apiConfig.js`
- **Validation**: Update `validation.js`

### Backup and Recovery

Important files to backup:
- `.env` (environment variables)
- `config/all-states-statute-urls.json` (state configuration)
- Claude Desktop configuration file

## 🎉 Success Indicators

Your deployment is successful when:

1. ✅ Server starts without errors
2. ✅ Claude Desktop shows all 39 tools
3. ✅ API calls return valid responses
4. ✅ Rate limiting works correctly
5. ✅ Caching improves performance
6. ✅ Error handling is graceful

The refactored architecture provides a robust, maintainable foundation for legal research automation through Claude Desktop.