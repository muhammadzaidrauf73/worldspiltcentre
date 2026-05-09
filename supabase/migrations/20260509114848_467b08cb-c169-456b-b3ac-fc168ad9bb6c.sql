
-- Sequence for WSC document numbers starting at 100
CREATE SEQUENCE IF NOT EXISTS public.wsc_document_seq START WITH 100 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.next_wsc_document_number()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nextval('public.wsc_document_seq')::integer;
$$;

-- WSC documents history table (quotations + receipts)
CREATE TABLE IF NOT EXISTS public.wsc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('quotation','receipt')),
  ref_no TEXT NOT NULL,
  doc_date TEXT,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  body_text TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wsc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage wsc documents"
ON public.wsc_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_wsc_documents_updated_at
BEFORE UPDATE ON public.wsc_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wsc_documents_created_at ON public.wsc_documents (created_at DESC);
