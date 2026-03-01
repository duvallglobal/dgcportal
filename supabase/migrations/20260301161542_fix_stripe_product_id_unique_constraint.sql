ALTER TABLE public.services ADD CONSTRAINT services_stripe_product_id_key UNIQUE (stripe_product_id);
