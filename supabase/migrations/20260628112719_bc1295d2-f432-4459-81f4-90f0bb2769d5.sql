ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_method_trx_id_key;
ALTER TABLE public.payment_requests ALTER COLUMN trx_id DROP NOT NULL;