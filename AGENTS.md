# gql-conn-ui Agents Guide

This document provides guidelines for AI agents (such as GitHub Copilot) contributing to the `gql-conn-ui` project.

## Project Structure

- `/src`: Main source code
  - `/components`: React components (functional, with hooks)
  - `/contexts`: React context providers and definitions
  - `/hooks`: Custom React hooks
  - `/lib`: Core logic (GraphQL generation, config, etc.)
  - `/types`: TypeScript type definitions
  - `/utils`: Utility functions
- `/public`: Static assets (do not modify directly)
- `/test`: Test utilities and wrappers
- `/samples`: Example OpenAPI/GraphQL files
- `/coverage`: Test coverage output

## Coding Conventions

- Use **TypeScript** for all code
- Follow the existing code style and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused
- Use proper prop typing for all React components
- File naming: React components must use `PascalCase.tsx`

## Styling

- Use **Chakra UI** for all styling (utility-first approach)
- Use custom CSS only if necessary

## Testing

- Place all tests alongside source files or in `/test`
- Use Jest and React Testing Library for tests
- Run tests with:
  ```bash
  npm run test
  # or to run a specific test file:
  npm run test -- src/components/ComponentName.test.tsx
  # or with coverage:
  npm run test:coverage
  ```

## Pull Request Guidelines

When submitting a PR:

1. Provide a clear description of the changes
2. Reference related issues if applicable
3. Ensure all tests pass
4. Add screenshots for UI changes
5. Keep PRs focused and minimal in scope

## Programmatic Checks

Before merging, ensure all checks pass:

```bash
npm run lint        # Lint check
npm run test        # Tests
npm run build       # Build check
```

All checks must pass before merging.
