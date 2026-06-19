# DORA — Agent Notes

Dog daycare/boarding management platform. Next.js App Router + TypeScript + Tailwind + Supabase.

## Conventions used throughout this codebase

- `lib/*.ts` modules return `{ data, error }` results, never throw. Follow this pattern for new functions.
- Every query is facility-scoped via `profiles.facility_id`; always filter by `facility_id` when touching `dogs`, `clients`, `bookings`, `dog_checkins`, `facility_capacity`.
- DB rows (snake_case, see `lib/supabase/types.ts`) are mapped to app-level camelCase types (`lib/types.ts`) via `mapXRowToX` functions. Don't pass raw Supabase rows into components.
- RLS policies mirror the facility-scoping logic — if you add a table, add matching select/insert/update policies keyed on `facility_id in (select facility_id from profiles where id = auth.uid())`.
- Migrations live in `supabase/migrations/`, numbered sequentially.

## Build verification

Before committing, run `npm run build` and fix all TypeScript errors. Do not rely on `npm run dev` as a correctness signal.
