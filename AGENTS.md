# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Expo Router entry points (`_layout.tsx`, route screens). Keep new screens co-located with feature hooks/components.
- `db/`: Drizzle ORM schema (`schema.ts`) and Expo SQLite client (`client.ts`). Update schema before generating migrations.
- `drizzle/`: Auto-generated SQL migrations (`0000_*.sql`) and runner (`migrations.js`). Never hand-edit generated files.
- `assets/`: Images/fonts; reference via Expo asset system.
- Root configs: `tailwind.config.js` + `global.css` for NativeWind utility styling, `eslint.config.js` for lint rules, `drizzle.config.ts` for migration targets.

## Build, Test, and Development Commands
- Install deps: `bun install` (preferred with `bun.lock`) or `npm install` if bun unavailable.
- Run app: `npm start` for Expo dev server; platform targets via `npm run android`, `npm run ios`, `npm run web`.
- Lint: `npm run lint` (Expo ESLint config with TypeScript support).
- DB migrations: `npm run db:generate` after schema changes; inspect output in `drizzle/`. Use `npm run db:studio` for Drizzle Studio.
- Reset template: `npm run reset-project` wipes current `app/` in favor of starter; use only when intentionally restarting.

## Coding Style & Naming Conventions
- Language: TypeScript with React function components; use 2-space indentation.
- Components in `PascalCase`; hooks/utilities in `camelCase`. Keep file names matching the default export.
- Styling: Prefer NativeWind `className` utilities; Tailwind classes auto-sorted by Prettier Tailwind plugin.
- Imports: use alias paths (`@/foo/bar`) instead of relative traversals (`../foo/bar`).
- Keep DB enums/timestamps typed at the schema; store currency as integer cents (see `subscriptions.price`).

## Testing Guidelines
- No automated tests are configured yet. When adding, favor Jest with `@testing-library/react-native`; name files `*.test.tsx` alongside the code or under `__tests__/`.
- Cover critical flows: subscription creation/editing, SQLite migrations, routing guards. Document any manual test steps in PRs until automated coverage exists.

## Commit & Pull Request Guidelines
- Commits: short, imperative summaries (e.g., `add nativewind`, `update table to have integer for price`). Reference issues inline (e.g., `#2`) when relevant.
- PRs: include what changed, why, and how to test. Add screenshots for UI changes, note DB schema/migration impacts, and list any follow-ups or known gaps.

## Security & Configuration Tips
- Avoid hardcoding secrets; if APIs are added, load keys via Expo config or environment variables and exclude from VCS.
- SQLite DB files are device-local; don’t commit generated `.db` artifacts. Keep migrations in sync with `db/schema.ts` to avoid drift.
