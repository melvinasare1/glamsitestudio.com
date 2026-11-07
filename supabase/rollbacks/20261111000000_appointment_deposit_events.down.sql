-- Undo 20261111000000_appointment_deposit_events.sql.
-- Turn off or revert the appointment refund/forfeit UI/actions first --
-- they insert into and read from this table.

drop table if exists public.appointment_deposit_events;
