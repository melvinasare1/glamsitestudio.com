-- Revert the Heavenly Massage template catalogue row.
-- Revert the application code first. This delete will also be blocked by the
-- business template foreign key if any business is still using this template.
delete from public.templates
where id = 'heavenly-massage';
