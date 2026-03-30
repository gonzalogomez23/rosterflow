# Rosterflow

AI-powered roster scheduling tool for hospitality businesses. Portfolio/case-study project showcasing practical AI integration in frontend development.

## Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Auth & DB**: Supabase (Auth + PostgreSQL with RLS)
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod validation
- **UI**: Radix primitives + custom components (CVA + tailwind-merge)
- **AI**: Claude API — Sonnet 4.6 for generation, Haiku 4.5 for validation
- **Language**: TypeScript strict mode
- **Linter/Formatter**: Biome (tabs, organized imports)
- **Package manager**: pnpm
- **Deploy**: Vercel

## Commands

- `pnpm dev` — start dev server (Turbopack)
- `pnpm build` — production build
- `pnpm check` — biome check --write (run before committing)
- `pnpm lint` — biome lint
- `pnpm format` — biome format --write

## Code conventions

- ES modules only (import/export), never CommonJS
- Functional components with hooks, no class components
- Destructure imports: `import { useState } from 'react'`
- File naming: `kebab-case.tsx` for components, `kebab-case.ts` for utilities
- TypeScript strict — no `any`, no `as` casts without justifying comment
- Use `satisfies` for type-safe config objects
- Biome handles formatting and linting — no Prettier or ESLint

## Architecture

```
src/
├── actions/           # Server Actions (mutations + queries)
├── app/
│   ├── (auth)/        # Login, signup (public)
│   ├── (dashboard)/   # All app pages (protected)
│   └── auth/callback/ # Supabase OAuth callback
├── components/        # React components
│   └── ui/            # Reusable primitives (button, badge, etc.)
├── lib/
│   ├── ai/            # Claude API integration (planned)
│   ├── roster-engine/ # Pure TS greedy algorithm
│   ├── supabase/      # DB clients (browser + server)
│   ├── types/         # Generated Supabase types
│   ├── validations/   # Zod schemas
│   └── utils.ts       # cn() helper
└── middleware.ts      # Auth middleware
```

## Roster engine

Two-pass greedy weighted algorithm in `src/lib/roster-engine/`:
- `types.ts` — Position, Shift, Employee, RosterAssignment, GenerateInput, RosterResult
- `generate.ts` — Pass 1: primary positions, Pass 2: any eligible. Difficulty-first slot ordering.
- `scoring.ts` — Primary bonus (+100), hours remaining, consistency, variety
- `constraints.ts` — Availability, max hours, position eligibility, no double-booking

## Domain concepts

- **Organization**: the business (tenant isolation via RLS)
- **Position**: a role with a color (chef, server, bartender)
- **Shift**: belongs to a position, has weekly schedules (day, time, headcount)
- **Employee**: works multiple positions (one primary), has max hours and availability
- **Roster**: weekly schedule with assignments (employee + shift + date), status: draft/published/archived

## Database

Supabase PostgreSQL with RLS. All queries scoped by `get_user_org_id()`. Key tables: organizations, managers, positions, shifts, shift_schedules, employees, employee_positions, employee_availability, rosters, roster_assignments.

Generated types: `src/lib/types/database.ts`

## Git workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- Run `pnpm check` before committing

@docs/ARCHITECTURE.md
@docs/AI-INTEGRATION.md
