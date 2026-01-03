# Repository Guidelines

## Project Overview
ZKB Budget is a React Native/Expo app for tracking personal finances using transaction data exported from ZKB (Zürcher Kantonalbank). It features AI-powered transaction categorization and subscription detection.

## Project Structure & Module Organization
- `app/`: Expo Router entry points and screens
  - `api/`: API routes for AI-powered features (`enrich-transactions`, `detect-subscriptions`)
  - `transactions/`: Transaction list, import flow
  - `subscriptions/`: Subscription management, detection, and review screens
- `db/`: Drizzle ORM schema (`schema.ts`) and Expo SQLite client (`client.ts`)
- `drizzle/`: Auto-generated SQL migrations. Never hand-edit generated files.
- `lib/`: Shared utilities
  - `api/`: API schemas (Zod), AI response schemas, prompts, validation helpers
  - `xml-parser.ts`: Parses ZKB XML transaction exports
  - `toon-converter.ts`: Converts data to TOON format for token-efficient AI calls
  - `logo-cache.ts`: Caches company logos fetched by domain
  - `utils.ts`: General utilities (cn, chunkArray, etc.)
- `components/`: Reusable UI components (`DomainLogo`, form inputs, `AmountText`)
- `assets/`: Images/fonts; reference via Expo asset system
- Root configs: `tailwind.config.js` + `global.css` for NativeWind, `eslint.config.js`, `drizzle.config.ts`

## Tech Stack
- **Framework**: Expo SDK 54, React Native 0.81, Expo Router 6
- **Language**: TypeScript with React function components
- **Styling**: NativeWind (TailwindCSS), @expo/ui SwiftUI components
- **Database**: Expo SQLite with Drizzle ORM
- **AI**: OpenRouter SDK with Google Gemini for transaction enrichment
- **Validation**: Zod for schema validation, drizzle-zod for DB integration
- **Forms**: react-hook-form with @hookform/resolvers

## Database Schema
Two main tables in `db/schema.ts`:
- `transactions`: Bank transactions with fields for amount (cents), category, display name, domain, and optional subscription linking
- `subscriptions`: Tracked subscriptions with name, price (cents), billing cycle (weekly/monthly/yearly), domain

## Build, Test, and Development Commands
- Install deps: `bun install`
- Run app: `bun start` for Expo dev server; `bun run android`, `bun run ios`, `bun run web` for platforms
- Lint: `bun run lint`
- DB migrations: `bun run db:generate` after schema changes; `bun run db:studio` for Drizzle Studio

## Environment Variables
- `OPENROUTER_API_KEY`: Required for AI-powered features (transaction enrichment, subscription detection)

## Key Features
1. **Transaction Import**: Import XML files from ZKB bank exports
2. **AI Transaction Enrichment**: Automatically categorize transactions, extract merchant names, and match to subscriptions
3. **Subscription Detection**: AI analyzes transaction patterns to detect recurring subscriptions
4. **Subscription Management**: Manual creation/editing of subscriptions with domain-based logos

## Coding Style & Naming Conventions
- Use 2-space indentation
- Components in `PascalCase`; hooks/utilities in `camelCase`
- File names should match the default export
- Prefer NativeWind `className` utilities for styling
- Use alias paths (`@/foo/bar`) instead of relative traversals
- Store currency as integer cents (e.g., `subscriptions.price`, `transactions.amount`)

## Testing Guidelines
- No automated tests configured yet
- When adding tests, use Jest with `@testing-library/react-native`
- Name test files `*.test.tsx` alongside the code or under `__tests__/`
- Priority test coverage: transaction import/parsing, subscription detection, SQLite migrations

## Commit & Pull Request Guidelines
- Commits: short, imperative summaries (e.g., `add subscription detection`, `fix transaction import`)
- PRs: describe what changed, why, how to test; include screenshots for UI changes

## Security & Configuration
- Never hardcode API keys; use environment variables
- SQLite DB files are device-local; don't commit `.db` artifacts
- Keep migrations in sync with `db/schema.ts`
