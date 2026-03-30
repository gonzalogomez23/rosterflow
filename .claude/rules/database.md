---
paths:
  - "src/actions/**"
  - "src/lib/supabase/**"
  - "supabase/**"
---

# Database rules

- Always use the server Supabase client (`createClient` from `@/lib/supabase/server`) in Server Actions
- Browser client is only for auth state and realtime subscriptions
- RLS is enforced — never bypass with service role key in app code
- All queries are automatically scoped to the user's org via `get_user_org_id()`
- Soft-delete employees (`is_active = false`), hard-delete everything else
- Use `revalidatePath()` after every mutation to refresh Server Components
- Migrations go in `supabase/migration.sql` — document new tables and RLS policies
- Generated types in `src/lib/types/database.ts` — regenerate after schema changes
