# System Architecture & Directory Structure

This document outlines the reorganized directory structure of the project, explaining the purpose of each directory to help contributors navigate the codebase.

## Folder Hierarchy

```text
symptom-scribe/
├── docs/                       # Project documentation
├── public/                     # Static assets (images, icons, manifest files)
├── src/
│   ├── assets/                 # Local images, icons, and font files
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Generic, app-wide helper components (e.g., ThemeToggler, BackToTop)
│   │   ├── layout/             # Structure-level layout components (e.g., AppSidebar, Layout)
│   │   └── ui/                 # Atomic UI components (shadcn primitives)
│   ├── constants/              # Application-wide constants
│   ├── hooks/                  # Custom React hooks
│   ├── integrations/           # External service configurations (e.g., Supabase)
│   ├── pages/                  # Route-level components
│   ├── services/               # API endpoints wrapper and business logic layer
│   ├── styles/                 # Global styles and tailwind directives
│   ├── types/                  # Shared TypeScript interfaces and type definitions
│   ├── utils/                  # Reusable helper functions
│   └── main.tsx                # App entrypoint
├── .github/
│   ├── ISSUE_TEMPLATE/         # Custom GitHub issue templates
│   └── PULL_REQUEST_TEMPLATE.md # PR description template
```

## Architectural Guidelines

1. **Separation of Concerns**: Reusable components should be placed in `src/components/`, while logic that interacts with external services belongs in `src/services/` or `src/integrations/`.
2. **Path Aliases**: Make use of the `@/` path alias pointing to the `src/` directory to write clean, location-independent imports.
