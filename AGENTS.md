# AGENTS.md (ZKB Budget)

This file is guidance for agentic coding assistants working in this repo.

## Project Summary

ZKB Budget is a React Native / Expo app (Expo Router) for importing ZKB XML exports,
tracking transactions, and using AI to enrich/categorize transactions and detect subscriptions.

## Key Directories

- `app/`: Expo Router routes and screens
  - `app/api/*+api.ts`: server-like API handlers (Edge-style `Request`/`Response`)
  - `app/transactions/`: transaction list + import flow
  - `app/subscriptions/`: subscription management + detection review
  - `app/analytics/`: analytics views
- `components/`: reusable React components
  - `components/ui/`: UI-only primitives (e.g. inputs, labels, buttons, text)
- `lib/`: shared utilities and business logic
  - Prefer putting reusable helpers here (parsing, formatting, mapping, validation)
  - `lib/api/`: Zod schemas, prompts, AI response validation
- `db/`: Drizzle ORM schema + Expo SQLite client
- `drizzle/`: generated migrations (never edit by hand)

## Commands (Build / Lint / Format / Typecheck)

This repo uses Bun and Expo.

- Install dependencies: `bun install`
- Start dev server: `bun start` (same as `expo start`)
- Run on devices:
  - Android: `bun run android`
  - iOS: `bun run ios`
  - Web: `bun run web`

Lint / format / types:

- Lint: `bun run lint` (runs `expo lint`)
- Typecheck: `bun run typecheck` (runs `tsc --noEmit`)
- Format: `bun run format` (Prettier)
- Check formatting: `bun run format:check`

Target a single file (useful while iterating):

- Lint one file: `bunx eslint app/api/enrich-transactions+api.ts`
- Format one file: `bunx prettier --write app/api/enrich-transactions+api.ts`
- Typecheck whole project (no single-file mode configured): `bun run typecheck`

Database:

- Generate migrations after schema changes: `bun run db:generate`
- Open Drizzle Studio: `bun run db:studio`

## Tests

- No dedicated test runner is configured right now:
  - No `test` script in `package.json`
  - No `jest`/`vitest` config files detected

If/when tests are added, keep them easy to run locally and in CI:

- Prefer a single-test workflow (examples, depending on chosen runner):
  - Vitest: `bunx vitest run path/to/file.test.ts`
  - Jest: `bunx jest path/to/file.test.ts -t "test name"`

(Only add the above scripts once the project actually adopts that runner.)

## Environment Variables

- `OPENROUTER_API_KEY`: required for AI API routes (`app/api/*`)
- `EXPO_PUBLIC_LOGO_DEV_KEY`: required for logo fetching in development
- `EXPO_PUBLIC_API_URL`: referenced by `lib/config.ts`
- `POSTHOG_API_KEY`: optional, enables AI analytics tracking via PostHog
- `POSTHOG_HOST`: optional, PostHog instance URL (e.g. `https://us.i.posthog.com`)

Never hardcode secrets; use env vars.

## Imports

- Prefer path alias imports using `@/*` (configured in `tsconfig.json`).
- Avoid deep relative imports like `../../../`.
- Use type-only imports when applicable: `import type { Foo } from '...'`.
- Keep imports grouped and readable:
  1. React / React Native / Expo
  2. third-party libraries
  3. internal alias imports (`@/...`)
  4. local relative imports (`./...`)

## Formatting

- Prettier is configured via `.prettierrc`:
  - `tabWidth: 2`, `singleQuote: true`, `semi: true`, `printWidth: 100`
  - `prettier-plugin-tailwindcss` is enabled (keeps class ordering stable)
- Use 2-space indentation.

## TypeScript Guidelines

- Use `strict: true` TypeScript; avoid `any`.
- Narrow `unknown` errors before using:
  - `error instanceof Error ? error.message : String(error)`
- Prefer explicit return types for public utilities in `lib/` and API handlers.
- Prefer `as const` for string literal sets (see `db/schema.ts`).

## Component Architecture

- Keep screen/routes thin: push reusable logic into `lib/`.
- When adding a helper that could be reused by multiple screens/components, put it in `lib/`.
- If a component grows too large:
  - split it into smaller components
  - put reusable smaller components in `components/`
  - put UI-only primitives in `components/ui/`

## Styling (NativeWind)

- Prefer NativeWind `className` over inline styles when possible.
- Tailwind content sources are `app/**/*` and `components/**/*` (see `tailwind.config.js`).

## Error Handling

API routes (`app/api/*+api.ts`):

- Validate inputs with Zod and `validateRequest` (`lib/api/api-validation.ts`).
- On validation errors, return a `400` with structured JSON.
- On server errors, return `500` with a stable `error` message; include `details` only as strings.
- Use `console.error` for unexpected errors and `console.warn` for recoverable issues.

UI code:

- Don’t swallow errors silently. Log with context and show a user-friendly message.
- Prefer pure helpers in `lib/` that are easy to unit test later.

## Database & Money

- Store currency amounts as integer cents (e.g. `subscriptions.price`, `transactions.amount`).
- Drizzle migrations in `drizzle/` are generated; do not edit them manually.

## AI / API Conventions

- Prompts and schemas live in `lib/api/`.
- Always validate AI outputs with Zod schemas before using them.
- Keep token-heavy transformations in utilities (e.g. TOON conversion in `lib/toon-converter.ts`).

## Lint Rules

- Lint is configured via `eslint.config.js` using Expo’s flat config.
- Notable project rule: `@typescript-eslint/no-unnecessary-condition` is `error`.
