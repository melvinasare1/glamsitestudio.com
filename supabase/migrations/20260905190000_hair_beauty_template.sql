-- Allow the Hair & Beauty storefront template on sellers.template.

alter type public.seller_template add value if not exists 'hair-beauty-template';
