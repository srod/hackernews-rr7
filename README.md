# HackerNews Clone

A fast, modern HackerNews client built with TanStack Start and deployed to Cloudflare Workers.

## Features

- 🚀 Server-side rendering on Cloudflare Workers edge
- ⚡️ Infinite scroll with LRU caching
- 📱 PWA support with offline capability
- 🔄 Auto-refresh on tab focus
- 🎨 Dark theme with CSS Modules

## Tech Stack

- **Framework**: TanStack Start (React Router v7)
- **Runtime**: Cloudflare Workers
- **Build**: Vite 7
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules
- **Linting**: Biome

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
```

App available at `http://localhost:5173`

## Scripts

```bash
bun run dev           # Development server
bun run build         # Build + typecheck
bun run deploy        # Build + deploy to Cloudflare
bun run lint          # Biome lint
bun run format        # Biome format
bun run typecheck     # TypeScript check
```

## Deployment

Deployed to Cloudflare Workers via Wrangler:

```bash
bun run deploy
```

Requires Cloudflare account and `wrangler` authentication.

## Project Structure

```
app/
├── routes/           # TanStack Router file-based routes
├── components/       # React components + CSS modules
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── types/            # TypeScript types
└── styles/           # Global CSS
```

## API

Uses the official [HackerNews Firebase API](https://github.com/HackerNews/API).
