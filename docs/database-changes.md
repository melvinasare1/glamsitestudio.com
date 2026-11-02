# Database change log

Every change made to the **staging** or **production** Supabase databases,
newest first. Use it to see what changed, when, and how to undo it.

## How changes are made

1. The change is a migration file in `supabase/migrations/`, reviewed in a
   pull request and covered by `npm run test:db`.
2. Every migration that changes structure has an undo script in
   `supabase/rollbacks/{same name}.down.sql`, tested locally (apply, undo,
   apply again) before it goes anywhere.
3. A read-only check records the database's state before the change.
4. **Staging first.** Apply, verify, run Supabase's security advisor.
5. Then production, with the same checks.
6. The migration is recorded in Supabase's own history
   (`supabase_migrations.schema_migrations`, shown in Dashboard → Database →
   Migrations) under its repo file name, e.g. `20261102090000_booking_core`.
   Supabase gives it its own version number (the time it ran); the name is
   what links it to the file.
7. An entry is added below, in the same pull request or straight after.

## How to undo a change

1. Turn off or revert the code that depends on it first (see the entry).
2. Run the undo script in Supabase → SQL Editor, on staging, then production.
3. Remove the migration's row from the history, so it can be applied again
   later:
   `delete from supabase_migrations.schema_migrations where name = '{name}';`
4. Add an entry below saying what was undone and why.

---

_No entries yet: `20261102090000_booking_core` is being applied to staging, then production._

---

## Before this log (12–14 Oct 2026)

Applied before this log existed. Supabase's history for these is
incomplete, because some were pasted into the SQL Editor:

| Change | How it was applied | In Supabase's history as |
| --- | --- | --- |
| Ansaa's 28 migrations, then `supabase/one-off/20261014-remove-ansaa-schema.sql` | SQL Editor | not recorded |
| `20261013170000_security_advisor_fixes` (Ansaa era, since replaced by the baseline) | Supabase connection | `20261013170000_security_advisor_fixes` |
| `20261014090000_baseline.sql` | SQL Editor | not recorded |
| `20261014100000_fk_indexes.sql` | Supabase connection | `20261014100000_fk_indexes` |
| `20261014190000_luxe_template.sql` | Supabase connection | `luxe_template` |

The repo's `supabase/migrations/` folder is the source of truth for what
the schema should be.
