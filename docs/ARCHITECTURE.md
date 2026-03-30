# Architecture

## System overview

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│   Browser    │────▶│  Next.js 15 App  │────▶│   Supabase    │
│  (React 19)  │◀────│  (App Router)    │◀────│  PostgreSQL   │
└─────────────┘     └──────────────────┘     └───────────────┘
                           │                        │
                    Server Actions           RLS policies
                    Server Components        Auth (JWT)
```

## Data flow

1. **Read path**: Server Component → Supabase server client → RLS-filtered query → render
2. **Write path**: Form submit → Zod validation → Server Action → Supabase mutation → `revalidatePath`
3. **Roster generation**: Load data → transform to engine types → `generateRoster()` → preview → save

## Route groups

- `(auth)` — login, signup (public)
- `(dashboard)` — all app pages (protected by middleware)

## Roster engine (`src/lib/roster-engine/`)

Pure TypeScript, no external dependencies. Two-pass greedy algorithm:

1. **Slot building**: Expand shift schedules into individual slots for the date range
2. **Difficulty sorting**: Slots with fewer eligible employees get filled first
3. **Pass 1 — Primary**: Assign employees to their primary position only
4. **Pass 2 — Secondary**: Fill remaining slots with any eligible employee
5. **Scoring**: Weighted score per candidate (primary bonus, hours remaining, consistency, variety)

### Scoring weights

| Factor | Weight | Purpose |
|--------|--------|---------|
| Primary position | +100 | Always prefer primary over secondary |
| Hours remaining | 0–10 | Favor employees with more capacity |
| Consistency | +0.5/repeat | Reward returning to same shift |
| Previous roster | -0.3 | Penalize same shift as last week |

## Database

Supabase PostgreSQL with Row-Level Security. All queries are scoped to the user's organization via `get_user_org_id()`.

### Key tables

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant container |
| `managers` | User ↔ organization mapping |
| `positions` | Roles with color (chef, server, etc.) |
| `shifts` | Named shifts per position |
| `shift_schedules` | Weekly templates (day, time, headcount) |
| `employees` | Staff with max hours, active flag |
| `employee_positions` | Many-to-many with `is_primary` flag |
| `employee_availability` | Weekly recurring windows |
| `rosters` | Generated schedules (draft/published/archived) |
| `roster_assignments` | Individual employee–shift–date assignments |

## Auth

Supabase Auth → cookie-based sessions → Next.js middleware checks auth on every `(dashboard)` route. Organization is auto-created on signup.
