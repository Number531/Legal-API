# Testing Guide - Enhanced Legal MCP Server

This guide covers the comprehensive testing architecture for the refactored Enhanced Legal MCP Server.

## 🧪 Testing Architecture Overview

The testing suite is designed with multiple layers to ensure comprehensive coverage:

```
tests/
├── setup.js                           # Global test configuration
├── unit/                              # Unit tests (isolated components)
│   ├── config/
│   │   ├── apiConfig.test.js          # API configuration tests
│   │   └── stateStatuteConfig.test.js # State statute configuration tests
│   ├── utils/
│   │   ├── validation.test.js         # Validation utilities tests
│   │   ├── cache.test.js              # Cache management tests
│   │   └── apiHelpers.test.js         # API helper functions tests
│   ├── api-clients/
│   │   ├── SecEdgarClient.test.js     # SEC EDGAR client tests
│   │   ├── CourtListenerClient.test.js # CourtListener client tests
│   │   └── ... (other client tests including PTABWebSearchClient.test.js and FTCClient.test.js)
│   └── tools/
│       ├── toolDefinitions.test.js    # Tool schema validation tests
│       └── toolImplementations.test.js # Tool mapping tests
├── integration/
│   └── server/
│       └── EnhancedLegalMcpServer.test.js # Server integration tests
└── e2e/
    └── index.test.js                  # End-to-end server tests
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

```bash
# Install dependencies (includes Jest)
npm install

# Install development dependencies
npm install --save-dev jest @jest/globals
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only

# Run specific test files
npx jest tests/unit/config/apiConfig.test.js
npx jest tests/unit/utils/validation.test.js
```

## 📋 Test Categories

### Unit Tests

**Purpose**: Test individual modules in isolation with mocked dependencies.

**Coverage**:
- ✅ **API Configuration** (`src/config/apiConfig.js`)
  - Configuration exports validation
  - Rate limiter functionality
  - Regex patterns and constants

- ✅ **Validation Utilities** (`src/utils/validation.js`)
  - Date format validation
  - Court ID validation
  - Input sanitization
  - Parameter validation

- ✅ **Cache Management** (`src/utils/cache.js`)
  - TTL-based caching
  - Automatic cleanup
  - Cache statistics
  - Backward compatibility functions

- ✅ **API Helpers** (`src/utils/apiHelpers.js`)
  - HTTP request handling
  - Retry logic
  - Rate limiting integration
  - Response parsing

- ✅ **API Clients** (`src/api-clients/*.js`)
  - SEC EDGAR client methods
  - CourtListener client methods
  - Error handling
  - Response formatting

- 🔄 **Tool Definitions** (`src/tools/toolDefinitions.js`)
  - MCP tool schema validation
  - Required parameter checking
  - Tool categorization

- 🔄 **Tool Implementations** (`src/tools/toolImplementations.js`)
  - Tool-to-method mapping
  - Client dependency injection
  - Error propagation

### Integration Tests

**Purpose**: Test component interactions and server initialization.

**Coverage**:
- 🔄 **Server Integration** (`src/server/EnhancedLegalMcpServer.js`)
  - Server initialization
  - Tool registration
  - Request dispatching
  - Rate limiter setup
  - Client management

### End-to-End Tests

**Purpose**: Test complete server functionality from startup to tool execution.

**Coverage**:
- 🔄 **Full Server Lifecycle** (`index.js`)
  - Environment validation
  - Server startup process
  - MCP tool execution simulation
  - Error handling scenarios

## 🛠️ Testing Patterns

### Mocking Strategy

The testing suite uses comprehensive mocking to isolate components:

```javascript
// Mock external dependencies
jest.mock('../../../src/utils/apiHelpers.js', () => ({
  makeApiRequest: jest.fn(),
  resolveToCIK: jest.fn(),
  filterSECFilings: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock rate limiters
const mockRateLimiter = {
  enforce: jest.fn().mockResolvedValue()
};
```

### Test Structure

Each test file follows a consistent structure:

```javascript
describe('ComponentName', () => {
  let component;
  let mockDependencies;

  beforeEach(() => {
    // Setup fresh instances and mocks
    mockDependencies = createMocks();
    component = new ComponentName(mockDependencies);
  });

  afterEach(() => {
    // Clean up mocks
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    test('should handle success case', async () => {
      // Arrange
      mockDependencies.method.mockResolvedValue(expectedResult);
      
      // Act
      const result = await component.methodName(input);
      
      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockDependencies.method).toHaveBeenCalledWith(input);
    });

    test('should handle error case', async () => {
      // Arrange
      mockDependencies.method.mockRejectedValue(new Error('Test error'));
      
      // Act & Assert
      await expect(component.methodName(input))
        .rejects.toThrow('Test error');
    });
  });
});
```

### Environment Setup

Tests use controlled environment variables:

```javascript
// In tests/setup.js
process.env.NODE_ENV = 'test';
process.env.COURTLISTENER_API_TOKEN = 'test-token';
process.env.USPTO_API_KEY = 'test-uspto-key';
process.env.GOVINFO_API_KEY = 'test-govinfo-key';
process.env.EXA_API_KEY = 'test-exa-key';
```

## 📊 Coverage Goals

### Target Coverage Metrics

- **Overall Coverage**: 90%+
- **Statement Coverage**: 95%+
- **Branch Coverage**: 85%+
- **Function Coverage**: 95%+

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Exclusions

The following are excluded from coverage requirements:
- Test files (`*.test.js`)
- Node modules
- Configuration files
- Development utilities

## 🔍 Test Data Management

### Mock Data Patterns

```javascript
// API Response Mocks
const mockApiResponse = {
  results: [
    { id: 1, name: 'Test Item 1' },
    { id: 2, name: 'Test Item 2' }
  ],
  next: null,
  count: 2
};

// Error Response Mocks
const mockApiError = {
  status: 400,
  message: 'Bad Request',
  details: 'Invalid parameter'
};

// Client Instance Mocks
const mockClient = {
  searchMethod: jest.fn().mockResolvedValue(mockApiResponse),
  getMethod: jest.fn().mockResolvedValue(mockSingleItem)
};
```

### Time-Based Testing

```javascript
// Mock Date.now for cache TTL testing
const mockDateNow = jest.spyOn(Date, 'now');
mockDateNow.mockReturnValue(1000000); // Fixed timestamp

// Test cache expiration
mockDateNow.mockReturnValue(1000000 + ttl + 1);
expect(cache.getFromCache(key)).toBeNull();

mockDateNow.mockRestore();
```

## 🚨 Testing Best Practices

### 1. Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Mock all external dependencies

### 2. Clarity
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test one behavior per test case

### 3. Coverage
- Test both success and failure paths
- Include edge cases and boundary conditions
- Validate error messages and types

### 4. Performance
- Keep tests fast (< 100ms per test)
- Use mocks instead of real API calls
- Avoid unnecessary async operations

### 5. Maintainability
- Keep test data close to tests
- Use helper functions for common setup
- Update tests when code changes

## 🐛 Debugging Tests

### Common Issues

1. **Mock Not Working**
   ```javascript
   // Ensure mock is called before import
   jest.mock('./module');
   import { Module } from './module';
   ```

2. **Async Test Failures**
   ```javascript
   // Always await async operations
   await expect(asyncFunction()).rejects.toThrow();
   ```

3. **Environment Variables**
   ```javascript
   // Set in beforeEach if test-specific
   beforeEach(() => {
     process.env.TEST_VAR = 'test-value';
   });
   ```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest tests/unit/config/apiConfig.test.js

# Run tests with coverage and open report
npm run test:coverage && open coverage/lcov-report/index.html
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## 🔄 Test Maintenance

### Regular Tasks

1. **Update Test Data**: Keep mock data current with API changes
2. **Review Coverage**: Ensure new code has adequate test coverage
3. **Refactor Tests**: Keep tests maintainable as code evolves
4. **Performance Monitoring**: Ensure test suite remains fast

### Adding New Tests

When adding new functionality:

1. Create corresponding test file
2. Follow existing naming conventions
3. Include both positive and negative test cases
4. Update this documentation if needed
5. Ensure coverage targets are met

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [MCP SDK Testing](https://modelcontextprotocol.io/docs/testing)

The testing architecture ensures the Enhanced Legal MCP Server maintains high quality and reliability through comprehensive automated testing at all levels.