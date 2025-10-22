# Stores Directory

This directory contains Pinia stores for state management in the Crew Call application.

## Structure

- Each store should be in its own file
- Use camelCase for store file names
- Export stores as default exports
- Use TypeScript for type safety

## Example Store Structure

```typescript
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', {
  state: () => ({
    // state properties
  }),

  getters: {
    // computed properties
  },

  actions: {
    // methods
  }
})
```

## Best Practices

- Keep stores focused on specific domains
- Use TypeScript interfaces for state
- Implement proper error handling
- Keep actions pure and testable
