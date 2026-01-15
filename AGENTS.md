# AGENTS.md - Coding Agent Guidelines

## Project Overview

HackerNews clone built with TanStack Start (React Router v7), deployed to Cloudflare Workers.

**Stack**: React 19, TanStack Router, Vite 7, TypeScript, Biome, Cloudflare Workers

## Build/Lint/Test Commands

```bash
# Development
bun run dev              # Start dev server

# Build & Deploy
bun run build            # Build + typecheck (vite build && tsc --noEmit)
bun run deploy           # Build + deploy to Cloudflare Workers
bun run typecheck        # TypeScript only (tsc)
bun run typegen          # Generate Cloudflare types (wrangler types)

# Linting & Formatting
bun run lint             # Biome lint
bun run format           # Biome format (auto-fix)
bun run format:check     # Biome check (no fix)

# No tests configured - project has no test suite
```

## Project Structure

```
app/
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout (html, head, body)
│   ├── _layout.tsx      # App layout with Header
│   ├── _layout/         # Nested routes under layout
│   │   ├── $type.tsx    # Dynamic route: /top, /new, /ask, etc.
│   │   ├── post.$id.tsx # Post detail page
│   │   └── user.$id.tsx # User profile page
│   └── index.tsx        # Redirect to /top
├── components/          # React components (colocated with CSS modules)
├── hooks/               # Custom React hooks (use* prefix)
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
├── styles/              # Global CSS
└── routeTree.gen.ts     # Auto-generated (DO NOT EDIT)
```

## Code Style

### Formatting (Biome)

- **Indentation**: 4 spaces (2 for package.json)
- **Quotes**: Double quotes
- **Semicolons**: Always
- **Trailing commas**: ES5 style
- **Line width**: Default (80)

### TypeScript

- **Strict mode**: Enabled
- **No `any`**: Use proper types or `unknown`
- **No non-null assertions (`!`)**: Handle nullability explicitly
- **No type assertions (`as Type`)**: Use type guards instead
- **Explicit type imports**: Use `import type { X }` for types

```typescript
// Good
import type { Post } from "~/types/Post";
import { fetchData } from "~/lib/fetch-data";

// Bad
import { Post } from "~/types/Post";  // Missing 'type' keyword
```

### Path Aliases

Use `~/` alias for app imports (configured in tsconfig.json):

```typescript
import { Header } from "~/components/Header";
import type { Post } from "~/types/Post";
```

### Import Order (Biome organizeImports)

1. External packages (react, @tanstack/*, etc.)
2. Internal modules (`~/...`)
3. Relative imports (`./`, `../`)
4. CSS/asset imports

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase function | `function Header()` |
| Hooks | camelCase with `use` prefix | `useOnlineStatus` |
| Types | PascalCase | `type PostTypes = ...` |
| Constants | UPPER_SNAKE_CASE | `const POST_PER_PAGE = 30` |
| CSS Modules | BEM-like with component prefix | `.header__nav`, `.header__linkActive` |
| Route files | kebab-case with params | `post.$id.tsx`, `user.$id.tsx` |

### React Components

- Use function declarations (not arrow functions) for components
- Export named functions, not default exports
- Colocate CSS modules with components

```typescript
// Good
export function PostItem({ post }: { post: Post }) {
    return <div className={styles.post}>{post.title}</div>;
}

// Bad
export default ({ post }) => <div>{post.title}</div>;
```

### TanStack Router Patterns

Routes export a `Route` constant created with `createFileRoute`:

```typescript
export const Route = createFileRoute("/_layout/$type")({
    loader: async ({ params }) => { /* fetch data */ },
    component: TypeComponent,
    pendingComponent: LoadingSkeleton,
    head: ({ loaderData }) => ({ meta: [{ title: "..." }] }),
    staleTime: 30_000,
});
```

### CSS Modules

- One `.module.css` file per component
- Use BEM-like naming: `.component__element`, `.component__elementModifier`
- Use CSS custom properties from global.css: `var(--background)`, `var(--secondary)`

```css
.post {
    padding: 16px;
}

.post__title {
    color: var(--color-white);
}

.post__titleVisited {
    color: var(--secondary);
}
```

### Error Handling

- Use try/catch with proper error typing
- Empty catch blocks acceptable for non-critical operations (e.g., cache misses)
- Throw `Error` objects with descriptive messages

```typescript
// Acceptable for non-critical
fetchPosts(ids)
    .then(setPosts)
    .catch(() => {});  // Silent fail OK for background refresh

// Critical operations need handling
try {
    const res = await fetch(url);
    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`);
    }
} catch (error) {
    // Handle or rethrow
}
```

### Type Definitions

Define types in `app/types/` with explicit property types:

```typescript
export type Post = {
    by: string;
    id: number;
    title: string;
    kids?: string[];      // Optional arrays
    comments?: Comment[]; // Nested types
};
```

## Cloudflare Workers

- Config in `wrangler.toml`
- `compatibility_date` should match workerd version
- Use `nodejs_compat` flag for Node.js APIs
- SSR handled by `@tanstack/react-start/server-entry`

## Key Dependencies

- **@tanstack/react-router**: File-based routing
- **@tanstack/react-start**: SSR framework
- **@cloudflare/vite-plugin**: Cloudflare Workers integration
- **lru-cache**: Client-side caching
- **date-fns**: Date formatting
- **radash**: Utility functions (capitalize, etc.)
- **nprogress**: Loading progress bar

## Generated Files (DO NOT EDIT)

- `app/routeTree.gen.ts` - Auto-generated by TanStack Router plugin
- `worker-configuration.d.ts` - Generated by `wrangler types`

## Communication Style

- Be extremely concise in commit messages and responses
- Sacrifice grammar for brevity when appropriate
