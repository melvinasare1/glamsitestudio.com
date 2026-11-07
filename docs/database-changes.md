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

Before starting, check this log and the migration history on both projects
(`list_migrations`, or Dashboard → Database → Migrations), in case another
session has already applied the change.

## How to undo a change

1. Turn off or revert the code that depends on it first (see the entry).
2. Run the undo script in Supabase → SQL Editor, on staging, then production.
3. Remove the migration's row from the history, so it can be applied again
   later:
   `delete from supabase_migrations.schema_migrations where name = '{name}';`
4. Add an entry below saying what was undone and why.

---

## 7 Nov 2026 · `20261109000000_platform_referrals`

**What:** adds three new tables for the "Earn" business-to-business referral
program: `platform_referrals`, `platform_referral_earnings`,
`platform_referral_payout_details`, with RLS policies scoping owners to their
own rows (insert/select only; staff/service-role does everything else).
Nothing existing is dropped or rewritten.

**File:** `supabase/migrations/20261109000000_platform_referrals.sql`.
**Undo:** `supabase/rollbacks/20261109000000_platform_referrals.down.sql`
(written alongside this log entry — missing when the feature first merged).
Drops all three tables; turn off the owner-facing Earn page and admin Earn
pipeline first, since both read/write them.

| | Staging `idlqgpervgglazzozhkb` | Production `ufrfhimjmvltpdtcoord` |
| --- | --- | --- |
| Before | Migration file existed in the repo (merged with the Earn feature) but was never applied; checked via `list_migrations` and `information_schema.tables` — no `platform_referral*` tables present | Not checked/applied in this session |
| Applied | 10:59:35 UTC, history version `20261107105935`, by Claude through the Supabase connection | Not applied yet |
| Name in history | `20261109000000_platform_referrals` | — |
| Verified | `select count(*) from platform_referrals` succeeds (0 rows) | — |
| Security advisor | Clean for the new tables (only pre-existing, unrelated findings: `leads` and `rate_limits` RLS-enabled-no-policy, and leaked-password-protection) | — |

**Why this happened:** the Earn feature's migration file was committed but
the apply step was missed, so the owner-facing referral form failed on every
submit with a generic "something went wrong" error until this was caught and
fixed.

**Still open:** production needs the same migration before Earn ships live
there — not done in this session, since it wasn't needed to fix the staging
bug being debugged.

---

## 2 Nov 2026 · `20261102090000_booking_core`

**What:** adds `appointments.cancelled_by` (`client` or `business`, nullable)
and the function `public.upsert_booking_client(uuid, text, text, text)`.
Nothing is dropped or rewritten. Needed by booking phase 1 (PR #3).

**File:** `supabase/migrations/20261102090000_booking_core.sql`
(sha256 `d76b655c…3d22c`, same as `main` at `906d6a1`).
**Undo:** `supabase/rollbacks/20261102090000_booking_core.down.sql`. Dropping
the column loses who cancelled each appointment. Turn off Glam Site booking
or revert PR #3's code first, because booking and cancelling call both.

| | Staging `idlqgpervgglazzozhkb` | Production `ufrfhimjmvltpdtcoord` |
| --- | --- | --- |
| Before | Project was paused; restored 08:50 UTC | Checked 08:49 UTC: not applied; `clients_business_email_key` present; 0 businesses, clients, appointments |
| Applied | 08:55:22 UTC, history version `20261102085522`, by a separate session (most likely Claude Code following the handoff prompt), not this one | 11:47:17 UTC, history version `20261102114717`, by Claude through the Supabase connection |
| Name in history | `20261102090000_booking_core` | `20261102090000_booking_core` |
| Verified | Function body matches the repo file; not security definer; execute granted to `authenticated` and `service_role` only (not `anon`); column check correct; 0 businesses | Same checks; function definition fingerprint `2e5010447e6dc4cf5a5b42fcf6bf93c3`, identical to staging |
| Security advisor | Clean (only the intended `leads` note) | Clean (only the intended `leads` note) |

Production still has no data, so this change affected no salons or clients.

**Note:** staging was applied by another session at the same time this one
was preparing to. Before changing a database, check this log and the
project's migration history, so two sessions don't apply the same change.

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
