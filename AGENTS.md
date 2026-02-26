# AGENTS.md

## Cursor Cloud specific instructions

This is a **Money Tracking** Next.js 15 App Router application (TypeScript). It is fully self-contained with no external databases or services.

### Quick reference

| Action | Command |
|---|---|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (port 3000) |
| Lint | `pnpm lint` |
| Tests | `pnpm test` (Vitest + jsdom) |
| Build | `pnpm build` |
| Generate mock data | `pnpm generate:mock` |

### Key caveats

- **Mock data must exist** before the app or tests can run. If `src/lib/mock-data/transactions.json` is missing, run `pnpm generate:mock` to create it. The file is gitignored and generated from Faker.
- **Login credentials**: `demo@example.com` / `password123` (hardcoded in `src/app/api/auth/login/route.ts`).
- **No external services needed**: all API routes, auth (JWT via `jose`), and data live inside the Next.js process.
- **Pre-existing lint errors**: `pnpm lint` exits non-zero due to existing `@typescript-eslint/no-unused-vars` and `no-explicit-any` violations — this is expected.
- **pnpm build script warnings**: Some native packages (esbuild, sharp, unrs-resolver) have ignored build scripts; this does not affect dev or test workflows.
