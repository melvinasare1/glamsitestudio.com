-- Undo 20261102090000_booking_core.sql.
--
-- Run this only to back the change out (see docs/database-changes.md).
-- Dropping appointments.cancelled_by permanently loses who cancelled each
-- appointment; the cancellations themselves (status, cancelled_at) are kept.
-- Client records created through the function stay, as ordinary clients.
-- The booking code in apps/web and apps/dashboard needs the function and the
-- column, so revert that code too (or turn booking off) before running this.

drop function if exists public.upsert_booking_client(uuid, text, text, text);
alter table public.appointments drop column if exists cancelled_by;
