# 🤖 Code Generation Prompts for Viraltify V2

This file contains AI prompts specifically designed for generating code for the Viraltify V2 project. These prompts help maintain consistency, follow best practices, and accelerate development.

## 📋 General Guidelines

When generating code for Viraltify V2, always:
- Use TypeScript with proper type definitions
- Follow React functional component patterns with hooks
- Implement responsive design with Tailwind CSS
- Use semantic design tokens from the design system
- Include proper error handling and loading states
- Write accessible components with proper ARIA attributes
- Follow the established folder structure and naming conventions

---

## 🎨 UI Component Generation

### Basic Component Prompt
```
Generate a React TypeScript component for Viraltify V2 with the following requirements:

Component Name: [ComponentName]
Purpose: [Brief description of what the component does]
Props: [List of props and their types]
Features: [List of specific features to implement]

Requirements:
- Use functional component with TypeScript
- Implement responsive design with Tailwind CSS
- Use design tokens from the Viraltify design system (avoid hardcoded colors)
- Include proper loading and error states
- Add accessibility attributes (ARIA labels, roles, etc.)
- Follow the existing code patterns in the project
- Include JSDoc comments for props and functions

Design System Notes:
- Use semantic color tokens (primary, secondary, accent, etc.)
- Follow the spacing system (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px)
- Use the typography scale (text-xs through text-4xl)
- Apply consistent border radius (rounded-lg for cards, rounded-md for inputs)
- Include hover and focus states for interactive elements

Return the complete component code with proper imports and exports.
```

### Form Component Prompt
```
Generate a form component for Viraltify V2 with the following specifications:

Form Name: [FormName]
Fields: [List of form fields with types and validation rules]
Submission: [What happens when form is submitted]
Validation: [Specific validation requirements]

Requirements:
- Use react-hook-form for form management
- Implement proper validation with error messages
- Include loading state during submission
- Use Viraltify design system components (Input, Button, etc.)
- Add proper accessibility (labels, error announcements)
- Include success/error toast notifications
- Implement proper TypeScript types for form data

Return the complete form component with validation schema and submission handler.
```

### Data Table Component Prompt
```
Generate a data table component for Viraltify V2 with these features:

Table Name: [TableName]
Data Type: [Type of data being displayed]
Columns: [List of columns with their data types]
Features: [Sorting, filtering, pagination, etc.]

Requirements:
- Use TypeScript interfaces for data structures
- Implement sorting for specified columns
- Add filtering capabilities
- Include pagination with proper controls
- Use Viraltify design system for styling
- Add responsive design (mobile-friendly)
- Implement selection functionality if needed
- Include loading skeletons and empty states
- Add proper accessibility for table navigation

Return the complete table component with all necessary sub-components and utilities.
```

---

## 🔧 API Integration

### API Hook Generation Prompt
```
Generate a custom React hook for Viraltify V2 API integration:

Hook Name: [useHookName]
API Endpoint: [Endpoint URL and method]
Data Type: [TypeScript interface for response data]
Parameters: [Query parameters or request body]
Features: [Caching, error handling, etc.]

Requirements:
- Use React Query (TanStack Query) for data fetching
- Implement proper error handling and retry logic
- Include loading and error states
- Add TypeScript types for all parameters and responses
- Follow Viraltify API patterns and authentication
- Include proper cache invalidation strategies
- Add JSDoc documentation

Return the complete hook with error handling and type definitions.
```

### Edge Function Prompt
```
Generate a Supabase Edge Function for Viraltify V2:

Function Name: [function-name]
Purpose: [What the function does]
Input: [Request parameters and body structure]
Output: [Response structure]
External APIs: [Any third-party APIs being called]

Requirements:
- Use Deno with TypeScript
- Include proper CORS headers
- Implement rate limiting if applicable
- Add comprehensive error handling
- Use environment variables for API keys
- Include request validation
- Add proper logging for debugging
- Return appropriate HTTP status codes

Return the complete Edge Function code with proper imports and error handling.
```

---

## 📊 Analytics & Metrics

### Analytics Component Prompt
```
Generate an analytics component for Viraltify V2:

Component Name: [ComponentName]
Metrics: [List of metrics to display]
Visualization: [Charts, tables, cards, etc.]
Filters: [Available filter options]
Time Period: [Date range functionality]

Requirements:
- Use Recharts for data visualization
- Implement responsive chart sizing
- Include interactive elements (tooltips, click events)
- Add data export functionality
- Use Viraltify design system colors for charts
- Include loading states and error handling
- Add accessibility for screen readers
- Implement proper data formatting (numbers, percentages, dates)

Return the complete analytics component with chart configurations.
```

---

## 🎯 CRM Components

### Kanban Board Prompt
```
Generate a Kanban board component for Viraltify V2 CRM:

Board Name: [BoardName]
Columns: [List of workflow stages]
Card Data: [Content item structure]
Features: [Drag & drop, filtering, etc.]

Requirements:
- Use @dnd-kit for drag and drop functionality
- Implement smooth animations and visual feedback
- Include card modal for detailed editing
- Add bulk selection and operations
- Use Viraltify design system for styling
- Implement responsive design (mobile stacking)
- Include keyboard navigation support
- Add proper accessibility attributes

Return the complete Kanban board with drag & drop functionality.
```

---

## 🤖 AI Integration

### Script Generation Prompt
```
Generate an AI script generation component for Viraltify V2:

Component Name: [ComponentName]
Input: [Content data and generation parameters]
Output: [Generated script structure]
Customization: [Tone, style, length options]

Requirements:
- Use streaming responses for real-time generation
- Include customization options (tone, style, length)
- Add script editing capabilities
- Implement version history
- Use Viraltify design system components
- Include proper loading states and error handling
- Add export functionality (text, PDF)
- Implement script quality scoring

Return the complete script generation component with AI integration.
```

---

## 🔍 Search & Discovery

### Search Interface Prompt
```
Generate a search interface component for Viraltify V2:

Component Name: [ComponentName]
Search Type: [Content, creators, hashtags, etc.]
Filters: [Available filter options]
Results: [How results are displayed]

Requirements:
- Implement debounced search with real-time results
- Add advanced filtering options
- Include search suggestions and autocomplete
- Use Viraltify design system for styling
- Add search history functionality
- Implement proper loading states
- Include keyboard navigation (arrow keys, enter)
- Add accessibility for screen readers

Return the complete search interface with filtering and suggestions.
```

---

## 📱 Mobile Components

### Mobile-First Prompt
```
Generate a mobile-optimized component for Viraltify V2:

Component Name: [ComponentName]
Mobile Features: [Touch gestures, responsive layout, etc.]
Desktop Enhancements: [Additional features for larger screens]

Requirements:
- Use mobile-first responsive design approach
- Implement touch-friendly interactions
- Add swipe gestures where appropriate
- Optimize for various screen sizes
- Use progressive enhancement for desktop features
- Include proper touch target sizes (minimum 44px)
- Add haptic feedback for supported devices
- Implement proper focus management

Return the complete component optimized for all device sizes.
```

---

## 🧪 Testing Prompts

### Unit Test Generation
```
Generate comprehensive unit tests for the following Viraltify V2 component:

Component: [ComponentName]
Testing Framework: Vitest + React Testing Library
Test Cases: [Specific scenarios to test]

Requirements:
- Test all component props and state changes
- Mock external dependencies (APIs, localStorage, etc.)
- Test user interactions (clicks, form submissions, etc.)
- Include accessibility testing
- Test error states and edge cases
- Mock API responses for different scenarios
- Include performance considerations
- Use proper TypeScript types in tests

Return complete test suite with setup and teardown functions.
```

---

## 🎨 Styling Prompts

### Design System Component
```
Generate a design system component for Viraltify V2:

Component Name: [ComponentName]
Variants: [Different visual styles]
States: [Hover, focus, disabled, etc.]
Props: [Customization options]

Requirements:
- Use class-variance-authority (cva) for variant management
- Implement all accessibility states
- Include proper TypeScript prop types
- Add JSDoc documentation with examples
- Use semantic design tokens exclusively
- Include proper focus indicators
- Add smooth transitions for state changes
- Support both light and dark themes

Return the complete design system component with all variants and states.
```

---

## 💡 Tips for Effective Code Generation

1. **Be Specific**: The more detailed your requirements, the better the generated code
2. **Include Context**: Mention the Viraltify V2 project and existing patterns
3. **Specify Dependencies**: List which libraries and frameworks to use
4. **Design System**: Always reference the Viraltify design system tokens
5. **Accessibility**: Include accessibility requirements in every prompt
6. **TypeScript**: Always request proper TypeScript implementations
7. **Testing**: Consider including test generation in your prompts
8. **Performance**: Mention performance considerations for complex components

---

*These prompts are designed to generate high-quality, consistent code that follows Viraltify V2 patterns and best practices. Customize them based on your specific needs and requirements.*