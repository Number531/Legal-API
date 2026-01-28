# Contributing to Super-Legal MCP Server

Thank you for your interest in contributing to Super-Legal! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Contributions](#making-contributions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Types of Contributions

We welcome the following types of contributions:

- **Bug fixes**: Corrections to existing functionality
- **New API integrations**: Adding support for additional legal databases
- **Documentation improvements**: Clarifications, examples, tutorials
- **Performance optimizations**: Speed and efficiency improvements
- **Test coverage**: Additional unit and integration tests
- **Feature enhancements**: New capabilities for existing tools

## Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Super-Legal.git
   cd Super-Legal/super-legal-mcp-refactored
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Making Contributions

### Branch Naming Convention

Use descriptive branch names:

- `feature/add-westlaw-integration`
- `fix/courtlistener-pagination-bug`
- `docs/update-api-reference`
- `refactor/simplify-query-builder`
- `test/add-sec-edgar-tests`

### Commit Message Format

Follow conventional commits:

```
type(scope): short description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add Bloomberg Terminal integration

fix(courtlistener): handle rate limiting gracefully

docs(readme): add M&A workflow examples
```

## Pull Request Process

1. **Create a feature branch** from `main`

2. **Make your changes** following our coding standards

3. **Write/update tests** for your changes

4. **Update documentation** if needed

5. **Run the test suite**
   ```bash
   npm test
   npm run lint
   ```

6. **Submit a Pull Request** using our [PR template](.github/PULL_REQUEST_TEMPLATE.md)

7. **Address review feedback** promptly

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No sensitive data (API keys, credentials)
- [ ] Changelog updated (for features/fixes)

## Coding Standards

### JavaScript/Node.js Style

- Use ES6+ features
- Prefer `const` over `let`
- Use async/await over callbacks
- Add JSDoc comments for public functions

```javascript
/**
 * Search court opinions by query
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum results
 * @returns {Promise<Array>} Search results
 */
async function searchOpinions(query, options = {}) {
  const { limit = 20 } = options;
  // Implementation
}
```

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Log errors with context

```javascript
try {
  const results = await apiClient.search(query);
  return results;
} catch (error) {
  logger.error('Search failed', { query, error: error.message });
  throw new SearchError(`Failed to search: ${error.message}`);
}
```

### API Client Guidelines

When adding new API integrations:

1. Create client in `src/clients/`
2. Implement rate limiting
3. Add retry logic with exponential backoff
4. Handle API-specific errors
5. Document required API keys

```javascript
// Example structure for new API client
class NewLegalApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.example.com';
    this.rateLimiter = new RateLimiter({ maxRequests: 100, interval: 60000 });
  }

  async search(query) {
    await this.rateLimiter.acquire();
    // Implementation with retry logic
  }
}
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### Writing Tests

```javascript
describe('CourtListenerClient', () => {
  describe('searchOpinions', () => {
    it('should return opinions matching query', async () => {
      const client = new CourtListenerClient(mockApiKey);
      const results = await client.searchOpinions('antitrust');

      expect(results).toBeArray();
      expect(results[0]).toHaveProperty('case_name');
    });

    it('should handle rate limiting', async () => {
      // Test rate limiting behavior
    });
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Focus on critical paths
- Test edge cases and error conditions

## Documentation

### Code Documentation

- Add JSDoc comments to all public functions
- Include parameter types and descriptions
- Document return values and exceptions

### README Updates

When adding features, update:
- Tool list in README.md
- Quick start examples
- API key requirements

### Changelog

Update CHANGELOG.md for:
- New features
- Bug fixes
- Breaking changes
- Deprecations

## Adding New API Integrations

1. **Research the API**
   - Review API documentation
   - Understand rate limits
   - Identify authentication method

2. **Create the client**
   ```
   src/clients/newApiClient.js
   ```

3. **Add tools**
   ```
   src/tools/newApiTools.js
   ```

4. **Register in index**
   ```
   src/index.js
   ```

5. **Write tests**
   ```
   tests/unit/newApiClient.test.js
   tests/integration/newApi.test.js
   ```

6. **Document**
   - Update README.md
   - Add to CHANGELOG.md
   - Create docs if complex

## Questions?

- Open a [Discussion](https://github.com/Number531/Legal-API/discussions)
- Check existing [Issues](https://github.com/Number531/Legal-API/issues)

Thank you for contributing to Super-Legal!
