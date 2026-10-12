-- Allow the Imports storefront template on sellers.template.
-- seller_template is a Postgres enum (see 20260830160000_seller_enums.sql).

alter type public.seller_template add value if not exists 'imports-template';
