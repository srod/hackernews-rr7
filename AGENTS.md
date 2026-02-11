# AGENTS.md - Coding Agent Guidelines

**Generated:** 2026-02-11
**Commit:** 72902b2
**Branch:** main

## Overview

HackerNews clone with TanStack Start (React Router v7), SSR on Cloudflare Workers. Features infinite scroll, LRU caching, PWA offline support, auto-refresh on focus.

**Stack**: React 19, TanStack Router, Vite 7, TypeScript (strict), Biome, Cloudflare Workers

## Commands

```bash
bun run dev              # Dev server (localhost:5173)
bun run build            # Build (vite build) + typecheck (tsc --noEmit)
bun run deploy           # Build + deploy to Cloudflare Workers
bun run lint             # Biome lint
bun run format           # Biome format (auto-fix)
bun run format:check     # Biome check (no write)
bun run typecheck        # TypeScript only
bun run typegen          # Generate Cloudflare types
bun run preview          # Vite preview
# No tests configured
```

## Structure

```
app/
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout (html, head, body, PWA, NProgress)
│   ├── _layout.tsx      # App layout with Header, error/404/offline handling
│   ├── _layout/         # Nested content routes
│   │   ├── $type.tsx    # Story feeds (/top, /new, /ask, /show, /job)
│   │   ├── post.$id.tsx # Post detail + comments
│   │   └── user.$id.tsx # User profile + tabs (about/submitted/comments)
│   └── index.tsx        # Redirect → /top
├── components/          # Feature-based organization
│   ├── post/            # Post, Comment, Comments + CSS modules
│   ├── user/            # User + CSS module
│   ├── Header.tsx       # Navigation (exports `items` array for route validation)
│   ├── Skeleton.tsx     # Loading states (Post, Comment, User variants)
│   ├── OfflineBanner.tsx
│   └── UpdateToast.tsx
├── hooks/               # useOnlineStatus, useIntersectionObserver, useServiceWorker
├── lib/                 # fetch-data (concurrency), fetch-comments, visited-posts
├── types/               # Post, Comment, User
├── styles/              # global.css (imports colors.css + minireset)
├── assets/              # icon.png (app icon source)
├── router.tsx           # Router factory (defaultPreload: false, scrollRestoration)
└── routeTree.gen.ts     # AUTO-GENERATED (DO NOT EDIT)
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add story type | `app/components/Header.tsx` `items` array | Loader validates via `isValidType()` |
| API fetching | `app/lib/fetch-data.ts` | 6-connection semaphore queue |
| Comment loading | `app/lib/fetch-comments.ts` | Recursive, depth=2, top 15 initially |
| Visited tracking | `app/lib/visited-posts.ts` | LocalStorage, 500 max, auto-prunes |
| Route data loading | `app/routes/_layout/*.tsx` loaders | SSR, 30s staleTime, LRU-backed |
| Infinite scroll | `app/hooks/useIntersectionObserver.ts` | 200px rootMargin for early trigger |
| Offline support | `public/sw.js` + `OfflineBanner.tsx` | SW: stale-while-revalidate for API |
| PWA updates | `app/hooks/useServiceWorker.ts` | 60s poll, skipWaiting flow |
| Live timestamps | `app/components/post/Post.tsx` `useRelativeTime` | Colocated hook, 60s interval |
| CSS variables | `app/styles/colors.css` | `--background`, `--primary`, `--secondary` |
| Router config | `app/router.tsx` | `defaultPreload: false` (prevents API spam) |
| Build pipeline | `vite.config.ts` | 5 plugins: tsConfigPaths → cloudflare → tanstackStart → viteReact → swManifest |
| NProgress bar | `app/routes/__root.tsx` | Tied to `routerState.status === "pending"` |

## Data Architecture

### Caching Layers
1. **Service Worker** (`public/sw.js`): HN API stale-while-revalidate, navigation network-first, static cache-first
2. **Router**: 30s `staleTime` on all loaders
3. **Client LRU**: Module-level caches per route (survive navigation, cleared on refresh)

### LRU Cache Config

| Cache | File | Max | TTL | Key Format |
|-------|------|-----|-----|------------|
| `storyIdsCache` | `$type.tsx` | 10 | 1min | `type` (e.g. "top") |
| `postsCache` | `$type.tsx` | 500 | 1min | post `id` |
| `postCache` | `post.$id.tsx` | 1000 | 1min | `post-${id}` |
| `userCache` | `user.$id.tsx` | 1000 | 5min | `user-${id}` |

### Service Worker Cache Names
- `hn-api-v1` — API responses (stale-while-revalidate)
- `hn-static-v${version}` — Static assets (cache-first, versioned via `sw-manifest.json`)
- Old static caches auto-deleted on SW activate

### Fetching Patterns
- **Concurrency limited**: Max 6 parallel requests via semaphore queue (`fetch-data.ts`)
- **Batch loading**: Comments load top 15, user submissions load 20/batch with min 5 results
- **Debounced refresh**: 5s minimum between auto-refreshes on focus
- **Race condition prevention**: `useRef` flags in `user.$id.tsx` prevent duplicate fetches

### Refresh Invalidation (3 layers)
1. `navigator.serviceWorker.postMessage("clearApiCache")` — clears SW API cache
2. `storyIdsCache.delete(type)` + `postsCache.delete()` per post — clears LRU
3. `router.invalidate()` — clears router staleTime cache

### Error Handling
```typescript
// Non-critical (pagination, background refresh): silent fail OK
fetchPosts(ids).then(setPosts).catch(() => {});

// Critical (loader): throw → error boundary
if (res.status !== 200) throw new Error(`Status ${res.status}`);
```

## Conventions

### Formatting (Biome)
- 4 spaces (2 for package.json only)
- Double quotes, semicolons always, ES5 trailing commas
- CSS: 4 spaces, CSS modules parser enabled
- Overrides: `global.css` allows `!important` (NProgress styling)

### TypeScript
- Strict mode, no `any`, no `!`, no `as Type`
- `verbatimModuleSyntax` — use `import type { X }` for types
- Path alias: `~/` → `./app/`
- Target: ES2022, module: ES2022, moduleResolution: bundler

### React Components
- Function declarations, not arrows: `export function Header() {}`
- Named exports, no defaults
- Memoized components: `export const PostItem = memo(function PostItem() {})`
- Colocated CSS modules: `Component.tsx` + `Component.module.css`

### CSS Modules
- BEM-like: `.post`, `.post__title`, `.post__titleVisited`
- Use CSS vars from `colors.css`: `var(--background)`, `var(--primary)`, `var(--secondary)`
- Nested selectors OK: `& > span`

### Route Patterns
```typescript
export const Route = createFileRoute("/_layout/$type")({
    loader: async ({ params }) => { /* SSR data fetch, LRU-cached */ },
    component: TypeComponent,
    pendingComponent: LoadingSkeleton,
    head: ({ loaderData }) => ({ meta: [{ title: "..." }] }),
    staleTime: 30_000,
});
```

### Biome Suppression Convention
```typescript
// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted content
```
Always include reason after colon. Only used for `noArrayIndexKey` (static lists) and `noDangerouslySetInnerHtml` (HN API HTML content).

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase function | `function PostItem()` |
| Hooks | use* prefix | `useOnlineStatus` |
| Types | PascalCase | `type PostTypes` |
| Constants | UPPER_SNAKE | `POST_PER_PAGE` |
| CSS classes | BEM-like | `.header__linkActive` |
| Route files | param syntax | `post.$id.tsx` |

## Anti-Patterns (This Project)

- **No `any`, `!`, `as Type`**: Use proper types or `unknown`
- **No editing `routeTree.gen.ts`**: Auto-generated by router plugin
- **No editing `worker-configuration.d.ts`**: Generated by wrangler
- **No SSR data in client state**: Use loader data, not useState for initial data
- **No uncached recursive fetches**: Always use LRU cache for HN API items
- **No `defaultPreload`**: Explicitly disabled in `router.tsx` (causes concurrent API spam)
- **No new biome-ignore without reason**: Always explain after colon

## Hidden Patterns

### Refresh Logic
- Auto-refresh on **both** `visibilitychange` AND `focus` events
- 5s debounce via `lastRefreshRef` prevents API spam
- Invalidates **all 3 cache layers**: SW API cache, LRU caches, router cache
- Smooth scroll to top on story type switch

### Visited Posts
- LocalStorage `hn-visited-posts` tracks `{ commentCount, visitedAt }` per post
- Auto-prunes to newest 500 entries when limit exceeded
- Shows "(N new)" badge: `currentCount - snapshotCount`
- Marked visited in **two places**: external link click (Post.tsx) + post detail view (post.$id.tsx)

### Comment Threads
- Collapsible with reply count when collapsed: `({N} replies)`
- OP comments highlighted with `<span class="comment__op">OP</span>`
- Depth-limited to 2 levels initially; lazy loads full tree on "N more replies" click
- Top-level batch: 15 comments initially, then 15 per "load more"
- Handles `deleted` and `dead` comments with placeholder rendering

### Live Relative Time
- `useRelativeTime` hook colocated in `Post.tsx` (not in hooks/)
- 60s interval updates "2 hours ago" text
- Uses `date-fns/formatDistance`

### Offline Mode
- OfflineBanner shows when `navigator.onLine === false`
- Routes hide "load more" and disable refresh when offline
- Error component shows "You're offline" variant with "Go back" button
- SW returns `{ error: "offline" }` with 503 when no cache + offline

### PWA Update Flow
- SW checked for updates every 60s (`reg.update()`)
- `updatefound` → wait for `installed` state → show UpdateToast
- Toast calls `registration.waiting.postMessage("skipWaiting")`
- `controllerchange` event triggers `window.location.reload()`
- Custom `swManifestPlugin` in `vite.config.ts` generates versioned `sw-manifest.json` at build

### User Profile
- Tabs: About / Submitted / Comments — lazy-loaded on tab switch
- Submissions/comments batch-load 20 items, filter by type, require min 5 results per batch
- Race condition prevention via `useRef` loading flags (not state)
- Infinite scroll per tab via `useIntersectionObserver`

## Cloudflare Workers

- Config: `wrangler.toml` (6 lines, minimal)
- `nodejs_compat` flag required for Node.js APIs (`crypto`, `fs`, `path` in build)
- SSR entry: `@tanstack/react-start/server-entry`
- `compatibility_date`: 2026-01-14

## Build Pipeline

Vite plugins in order:
1. `tsConfigPaths()` — Resolves `~/` path alias
2. `cloudflare()` — SSR environment for Workers
3. `tanstackStart()` — File-based routing + route tree generation
4. `viteReact()` — JSX transformation
5. `swManifestPlugin()` — Custom: generates `sw-manifest.json` with MD5 version hash

Output: `dist/client/` (browser assets) + `dist/server/` (Workers entry)

## Key Dependencies

| Package | Purpose |
|---------|---------|
| @tanstack/react-router | File-based routing |
| @tanstack/react-start | SSR framework |
| @cloudflare/vite-plugin | Workers SSR environment |
| lru-cache | Client-side caching (4 separate instances) |
| date-fns | Relative time formatting |
| radash | Utilities (capitalize) |
| nprogress | Route transition progress bar |
| minireset.css | CSS reset |
