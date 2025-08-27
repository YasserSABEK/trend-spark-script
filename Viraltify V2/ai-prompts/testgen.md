# 🧪 Test Generation Prompts for Viraltify V2

This file contains AI prompts specifically designed for generating comprehensive tests for the Viraltify V2 project. These prompts help ensure thorough test coverage, consistent testing patterns, and maintainable test suites.

## 📋 Testing Philosophy

Viraltify V2 follows these testing principles:
- **User-Centric Testing**: Test from the user's perspective, not implementation details
- **Accessibility Testing**: Ensure components work with screen readers and keyboard navigation
- **Error Handling**: Test all error states and edge cases
- **Performance Testing**: Verify components perform well with realistic data loads
- **Integration Testing**: Test how components work together in real workflows

---

## 🧩 Component Testing

### Basic Component Test Prompt
```
Generate comprehensive unit tests for the following Viraltify V2 component:

Component: [ComponentName]
File Location: [src/path/to/Component.tsx]
Testing Framework: Vitest + React Testing Library + User Events

Component Description:
[Brief description of what the component does]

Props Interface:
[TypeScript interface for component props]

Test Requirements:
- Test all prop variations and combinations
- Test user interactions (clicks, form inputs, keyboard navigation)
- Test accessibility (ARIA attributes, screen reader support)
- Test responsive behavior (mobile/desktop differences)
- Test loading states and error conditions
- Test integration with design system components
- Mock external dependencies (APIs, router, etc.)
- Include performance tests for heavy operations

Return:
- Complete test file with describe/it structure
- Proper setup and teardown functions
- Mock implementations for dependencies
- TypeScript types for test data
- Comments explaining complex test scenarios
```

### Form Component Test Prompt
```
Generate thorough tests for a Viraltify V2 form component:

Form Component: [FormComponentName]
Form Purpose: [What the form is used for]
Fields: [List of form fields with types and validation]
Submission: [What happens on form submission]

Test Coverage Required:
- Field validation (required, format, length, etc.)
- Error message display and accessibility
- Form submission success and failure scenarios
- Loading states during submission
- Field interaction and state management
- Keyboard navigation and form accessibility
- Auto-save functionality (if applicable)
- File upload handling (if applicable)

Testing Patterns:
- Use userEvent for realistic user interactions
- Mock API calls with different response scenarios
- Test form reset and clear functionality
- Verify proper focus management
- Test with screen reader simulation

Return complete test suite with realistic user scenarios and edge cases.
```

### Data Table Test Prompt
```
Generate comprehensive tests for a Viraltify V2 data table component:

Table Component: [TableComponentName]
Data Type: [Type of data displayed]
Features: [Sorting, filtering, pagination, selection, etc.]

Test Scenarios:
- Loading states (skeleton, empty state, error state)
- Data rendering with various dataset sizes
- Sorting functionality for all sortable columns
- Filtering and search operations
- Pagination controls and navigation
- Row selection (single/multiple)
- Responsive behavior (mobile table handling)
- Keyboard navigation through table cells
- Accessibility for screen readers

Performance Tests:
- Large dataset rendering (1000+ rows)
- Virtual scrolling behavior (if implemented)
- Filter/search performance
- Memory usage with large datasets

Mock Data:
- Create realistic mock data generators
- Include edge cases (empty values, long text, special characters)
- Test with minimum and maximum data scenarios

Return complete test suite with performance benchmarks and accessibility tests.
```

---

## 🔄 Hook Testing

### Custom Hook Test Prompt
```
Generate comprehensive tests for a Viraltify V2 custom hook:

Hook Name: [useHookName]
Purpose: [What the hook does]
Dependencies: [External dependencies like APIs, localStorage, etc.]
Return Value: [What the hook returns]

Test Coverage:
- Initial state and default values
- State updates and side effects
- Error handling and recovery
- Loading states and async operations
- Cleanup and unmounting behavior
- Dependency changes and re-renders
- Performance optimization (memoization, etc.)

API Integration Tests (if applicable):
- Mock different API response scenarios (success, error, timeout)
- Test retry logic and rate limiting
- Verify proper cache management
- Test offline/online behavior

Testing Patterns:
- Use renderHook from @testing-library/react
- Mock external dependencies appropriately
- Test hook in different component contexts
- Verify proper cleanup and memory management

Return complete hook test suite with realistic scenarios and edge cases.
```

### React Query Hook Test Prompt
```
Generate tests for a Viraltify V2 React Query hook:

Hook Name: [useQueryHookName]
API Endpoint: [Endpoint being queried]
Query Key: [Query key structure]
Data Type: [TypeScript interface for data]

Test Scenarios:
- Successful data fetching and caching
- Error handling and retry logic
- Loading states and transitions
- Data refetching and invalidation
- Optimistic updates (if applicable)
- Background refetch behavior
- Cache stale time and garbage collection

Mock API Responses:
- Success responses with realistic data
- Error responses (404, 500, network errors)
- Slow responses for timeout testing
- Partial data scenarios

Integration Tests:
- Test with QueryClient provider
- Verify proper cache sharing between components
- Test mutation interactions
- Verify proper cleanup on unmount

Return complete test suite with proper React Query testing patterns.
```

---

## 🌐 API Testing

### Edge Function Test Prompt
```
Generate comprehensive tests for a Viraltify V2 Supabase Edge Function:

Function Name: [function-name]
Purpose: [What the function does]
Input: [Request parameters and body]
Output: [Response structure]
External APIs: [Third-party APIs called]

Test Coverage:
- Valid request handling and response format
- Input validation and error responses
- Authentication and authorization
- Rate limiting behavior
- CORS header verification
- External API integration (mocked)
- Error handling and status codes
- Performance under load

Mock Scenarios:
- Valid and invalid request payloads
- Different authentication states
- External API failures and timeouts
- Rate limit exceeded scenarios
- Network connectivity issues

Testing Environment:
- Set up test environment variables
- Mock external API responses
- Test with different user contexts
- Verify proper logging and monitoring

Return complete test suite with integration and unit tests for the Edge Function.
```

### API Client Test Prompt
```
Generate tests for a Viraltify V2 API client module:

Client Module: [ClientModuleName]
Endpoints: [List of API endpoints]
Authentication: [Authentication method]
Error Handling: [How errors are handled]

Test Coverage:
- All endpoint methods (GET, POST, PUT, DELETE)
- Request/response data transformation
- Authentication token handling
- Error response parsing and formatting
- Retry logic and exponential backoff
- Request/response interceptors
- Cache management

Mock Network:
- Success responses with realistic data
- Various error response codes
- Network timeout scenarios
- Invalid JSON responses
- Authentication failures

Integration Tests:
- Test with real API endpoints (if applicable)
- Verify proper error propagation
- Test concurrent request handling
- Verify proper cleanup and cancelation

Return complete API client test suite with realistic network scenarios.
```

---

## 🎭 E2E Testing

### User Workflow Test Prompt
```
Generate end-to-end tests for a Viraltify V2 user workflow:

Workflow: [Name of user workflow]
User Journey: [Step-by-step user journey]
Pages Involved: [List of pages/components]
Expected Outcome: [What should happen at the end]

Test Scenario:
- Start from user's initial entry point
- Navigate through each step of the workflow
- Interact with forms, buttons, and other UI elements
- Verify data persistence across page transitions
- Test error recovery at each step
- Verify final outcome and user feedback

Technical Requirements:
- Use Playwright or Cypress for E2E testing
- Include mobile and desktop test scenarios
- Test with different user roles/permissions
- Verify accessibility at each step
- Test performance and loading times

Mock Data:
- Set up realistic test data
- Include edge cases and error scenarios
- Test with different data volumes
- Verify data cleanup after tests

Return complete E2E test suite with setup, teardown, and utilities.
```

### Cross-Platform Test Prompt
```
Generate cross-platform tests for Viraltify V2:

Feature: [Feature being tested]
Platforms: [Desktop, Mobile Web, Different browsers]
Responsive Breakpoints: [Specific breakpoints to test]

Test Coverage:
- Visual consistency across devices
- Touch vs. mouse interactions
- Keyboard navigation on all platforms
- Performance on different device capabilities
- Feature availability based on platform

Browser Testing:
- Chrome, Firefox, Safari, Edge compatibility
- Different browser versions
- Mobile browser specific features
- Progressive enhancement testing

Accessibility Testing:
- Screen reader compatibility
- Keyboard navigation consistency
- Touch target sizes on mobile
- Color contrast in different environments

Return comprehensive cross-platform test strategy with specific test cases.
```

---

## 🔒 Security Testing

### Security Test Prompt
```
Generate security tests for Viraltify V2:

Component/Feature: [What's being tested]
Security Concerns: [Specific security aspects to test]
User Data: [Types of user data involved]

Security Test Coverage:
- Input validation and sanitization
- XSS prevention in user-generated content
- Authentication state management
- Authorization for different user roles
- Data exposure in client-side code
- API security and rate limiting

Test Scenarios:
- Malicious input injection attempts
- Unauthorized access attempts
- Session hijacking simulation
- Data leakage through client state
- CSRF attack prevention

Mock Attacks:
- Script injection in text inputs
- Malformed API requests
- Unauthorized route access
- Session token manipulation

Return security test suite focusing on common web vulnerabilities.
```

---

## 📊 Performance Testing

### Performance Test Prompt
```
Generate performance tests for Viraltify V2:

Component/Feature: [What's being tested]
Performance Metrics: [Load time, render time, memory usage, etc.]
Expected Load: [Typical and peak usage scenarios]

Performance Test Coverage:
- Component render performance with large datasets
- Memory usage and leak detection
- Network request optimization
- Image and media loading performance
- JavaScript bundle size impact

Load Testing:
- Simulate realistic user loads
- Test with slow network conditions
- Verify graceful degradation
- Test memory cleanup on unmount

Benchmarking:
- Establish performance baselines
- Compare against previous versions
- Identify performance regressions
- Monitor bundle size changes

Tools and Metrics:
- Use React DevTools Profiler
- Implement custom performance markers
- Monitor Core Web Vitals
- Track user interaction responsiveness

Return comprehensive performance test suite with benchmarking and monitoring.
```

---

## 🎯 Accessibility Testing

### Accessibility Test Prompt
```
Generate comprehensive accessibility tests for Viraltify V2:

Component: [ComponentName]
Accessibility Standards: [WCAG 2.1 AA compliance]
User Groups: [Screen reader users, keyboard users, low vision users]

Accessibility Test Coverage:
- Keyboard navigation and focus management
- Screen reader compatibility and announcements
- Color contrast and visual accessibility
- Touch target sizes and mobile accessibility
- Error message accessibility
- Loading state announcements

Testing Tools:
- axe-core for automated accessibility testing
- jest-axe for integration with test suite
- Manual testing with screen readers
- Keyboard-only navigation testing

Test Scenarios:
- Navigate entire component with keyboard only
- Verify proper ARIA labels and roles
- Test with NVDA, JAWS, and VoiceOver
- Verify focus indicators are visible
- Test with high contrast mode
- Verify text scaling up to 200%

Return complete accessibility test suite following WCAG guidelines.
```

---

## 💡 Test Utilities and Helpers

### Test Utility Generation Prompt
```
Generate test utilities and helpers for Viraltify V2:

Utility Purpose: [What the utility helps with]
Common Patterns: [Repeated testing patterns in the project]
Mock Data: [Types of data that need mocking]

Utility Requirements:
- Custom render function with providers
- Mock data generators for different entity types
- Helper functions for common user interactions
- API response mocking utilities
- Authentication state helpers

Specific Utilities Needed:
- renderWithProviders (React Query, Router, Auth)
- createMockUser, createMockContent, createMockAnalytics
- simulateApiResponse, simulateApiError
- setupAuthenticatedUser, setupUnauthenticatedUser
- advanceTimersAndFlush for async testing

Return complete test utility module with TypeScript types and documentation.
```

---

## 🚀 Test Automation

### CI/CD Test Integration Prompt
```
Generate CI/CD test configuration for Viraltify V2:

Testing Pipeline: [Steps in the testing pipeline]
Test Types: [Unit, Integration, E2E, Visual Regression]
Environments: [Development, Staging, Production]

Pipeline Configuration:
- Test parallelization strategies
- Test result reporting and artifacts
- Performance regression detection
- Accessibility compliance checking
- Security vulnerability scanning

Quality Gates:
- Minimum test coverage requirements
- Performance budget enforcement
- Accessibility standard compliance
- Security scan pass requirements

Monitoring and Alerts:
- Test failure notifications
- Performance regression alerts
- Flaky test detection and reporting
- Test coverage trend monitoring

Return complete CI/CD configuration with test automation and quality gates.
```

---

## 📝 Test Documentation

### Test Documentation Prompt
```
Generate comprehensive test documentation for Viraltify V2:

Documentation Scope: [What aspects of testing to document]
Audience: [Developers, QA engineers, Product team]
Testing Strategy: [Overall approach to testing]

Documentation Sections:
- Testing philosophy and principles
- Test structure and organization
- Mock data and test fixtures
- Common testing patterns and utilities
- Performance testing guidelines
- Accessibility testing requirements

Guidelines:
- How to write effective tests
- When to use unit vs integration vs E2E tests
- Mocking strategies and best practices
- Test naming conventions
- Debugging failing tests

Examples:
- Sample test cases for common scenarios
- Template tests for new features
- Code examples for testing patterns
- Troubleshooting guide for common issues

Return comprehensive testing documentation with examples and guidelines.
```

---

## 💡 Tips for Effective Test Generation

1. **Test User Flows**: Focus on how users actually interact with the application
2. **Mock Realistically**: Create mocks that behave like real services
3. **Test Edge Cases**: Include error conditions, empty states, and boundary values
4. **Accessibility First**: Include accessibility testing in every component test
5. **Performance Aware**: Test with realistic data volumes and slow networks
6. **Maintainable Tests**: Write tests that are easy to understand and update
7. **Proper Isolation**: Each test should be independent and not rely on others
8. **Documentation**: Include comments explaining complex test scenarios

---

*These prompts are designed to generate comprehensive, maintainable tests that ensure Viraltify V2 is reliable, accessible, and performant. Customize them based on your specific testing needs and requirements.*