---
name: generate-roster
description: Improve the roster generation engine — add AI integration, optimize the algorithm, or fix generation bugs. Use when working on anything related to how rosters are created.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Agent
---

# Generate Roster — Development Workflow

You are improving Rosterflow's roster generation system.

## Context files to read first

1. `docs/AI-INTEGRATION.md` — planned architecture and phases
2. `src/lib/roster-engine/types.ts` — all type definitions
3. `src/lib/roster-engine/generate.ts` — current greedy algorithm
4. `src/lib/roster-engine/scoring.ts` — employee scoring weights
5. `src/lib/roster-engine/constraints.ts` — validation functions
6. `src/app/(dashboard)/dashboard/rosters/generate/page.tsx` — generation UI

## When adding AI integration

1. Check if `src/lib/ai/` exists. If not, create the structure from `docs/AI-INTEGRATION.md`.
2. The AI layer augments the greedy engine — it receives the greedy draft as input and optimizes it.
3. Always validate AI responses with Zod before using them.
4. Use streaming for any generation that takes > 2 seconds.
5. Keep the greedy engine as a fallback if the AI call fails.

## When optimizing the algorithm

1. Read the current scoring weights in `scoring.ts`.
2. Test changes against edge cases: understaffed days, employees at max hours, single-position employees.
3. The two-pass approach (primary first, then secondary) is intentional — don't merge passes.

## Testing

Run `pnpm build` to verify no type errors. Test generation manually via the UI with different employee/shift configurations.
