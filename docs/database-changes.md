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

## 7 Nov 2026 · `20261111000000_appointment_deposit_events`

**What:** adds `appointment_deposit_events`, an append-only log of every
refund/forfeit on an appointment's deposit (`kind`: `refunded` or
`forfeited`, `amount_cents`, `created_at`), scoped by `business_id` with the
same owner-RLS pattern as `appointments`. Needed because
`appointments.refund_cents`/`refunded_at` only ever held the latest refund,
so a deposit could never be refunded in two parts and forfeits left no
record at all. Nothing existing is dropped or rewritten.

**File:** `supabase/migrations/20261111000000_appointment_deposit_events.sql`.
**Undo:** `supabase/rollbacks/20261111000000_appointment_deposit_events.down.sql`.
Drops the table; turn off or revert the refund/forfeit UI and actions first,
since they insert into and read from it.

| | Staging `idlqgpervgglazzozhkb` | Production `ufrfhimjmvltpdtcoord` |
| --- | --- | --- |
| Before | Checked via `list_migrations`: not applied | Not checked/applied in this session |
| Applied | Same session, by Claude through the Supabase connection | Not applied yet |
| Name in history | `20261111000000_appointment_deposit_events` | — |
| Verified | `select count(*) from appointment_deposit_events` succeeds (0 rows) | — |
| Security advisor | Clean for the new table (only the same pre-existing, unrelated findings as above) | — |

**Why this happened:** Phase 3 (refunds and no-show rules) was mostly built
already, but owners could only ever record one refund per appointment and
had no visibility into deposit history; marking a no-show also didn't
prompt the owner to keep the deposit.

**Still open:** production needs this migration before the feature ships
live there.

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

## 7 Nov 2026 · `20261110000000_universal_payout_methods`

**What:** reshapes `platform_referral_payout_details` so payout fields work
for referrers outside the UK, not just UK bank transfer. Renames
`account_number` → `identifier` and `sort_code` → `identifier_2`, and adds a
`method` column (`bank_uk`, `iban`, `zelle`, `cashapp`, `paypal`, `interac`)
with a check constraint, defaulting existing rows to `bank_uk`. The two
identifier columns are now generic slots whose meaning depends on `method`
(e.g. IBAN + BIC/SWIFT for `iban`, email/phone for `zelle`/`interac`, a
$cashtag for `cashapp`, an email for `paypal`), documented via column
comments. Nothing is dropped except the UK-specific column names.

**File:** `supabase/migrations/20261110000000_universal_payout_methods.sql`.
**Undo:** `supabase/rollbacks/20261110000000_universal_payout_methods.down.sql`.
Drops `method`, then renames `identifier_2` back to `sort_code` and
`identifier` back to `account_number`; turn off or revert the Earn payout
details UI/actions first, since they read and write `method`/`identifier`/
`identifier_2`.

| | Staging `idlqgpervgglazzozhkb` | Production `ufrfhimjmvltpdtcoord` |
| --- | --- | --- |
| Before | `platform_referral_payout_details` had UK-only `account_number`/`sort_code` columns, applied as part of `20261109000000_platform_referrals` the same session | Not checked/applied in this session |
| Applied | Same session, by Claude through the Supabase connection | Not applied yet |
| Name in history | `20261110000000_universal_payout_methods` | — |
| Verified | `information_schema.columns` for the table shows `business_id, account_name, identifier, identifier_2, notes, updated_at, method` | — |
| Security advisor | Re-checked clean after the change (same pre-existing unrelated findings as above) | — |

**Why this happened:** the owner-facing payout details form only asked for a
UK account number and sort code, which doesn't work for referrers banking in
the US, Canada, or Europe. Staff also had no visibility into payout details
at all before this session — the admin Earn pipeline now shows them
read-only per referral so staff can actually pay commissions out.

**Still open:** production needs both this migration and
`20261109000000_platform_referrals` before Earn ships live there.

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
