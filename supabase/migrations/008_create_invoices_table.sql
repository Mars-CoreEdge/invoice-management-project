-- Invoices table for per-team, per-user storage
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_team_id ON public.invoices(team_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow team members to select only their own created invoices by default
CREATE POLICY invoices_select_policy ON public.invoices
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- Allow creators with admin/accountant roles to insert/update
CREATE POLICY invoices_insert_policy ON public.invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = invoices.team_id AND tm.user_id = auth.uid() AND tm.role IN ('admin','accountant')
    ) AND created_by = auth.uid()
  );

CREATE POLICY invoices_update_policy ON public.invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = invoices.team_id AND tm.user_id = auth.uid() AND tm.role IN ('admin','accountant')
    ) AND created_by = auth.uid()
  ) WITH CHECK (
    created_by = auth.uid()
  );

-- Only admins can delete their own invoices
CREATE POLICY invoices_delete_policy ON public.invoices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = invoices.team_id AND tm.user_id = auth.uid() AND tm.role = 'admin'
    ) AND created_by = auth.uid()
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_invoices_updated
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoices_updated_at();

COMMENT ON TABLE public.invoices IS 'Invoices stored per team and creator with RLS';


