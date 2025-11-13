-- Add username to profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Create deleted_entries table for deletion log
CREATE TABLE public.deleted_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_entry_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  project_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  currency TEXT NOT NULL CHECK (currency IN ('SAR', 'SAR_NO_VAT', 'JOD', 'USD', 'EUR')),
  amount_net NUMERIC(15,2) NOT NULL,
  vat_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_gross NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('مدفوع', 'معلق', 'غير مدفوع')),
  location TEXT NOT NULL CHECK (location IN ('Saudi Arabia', 'Jordan')),
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- Enable RLS on deleted_entries
ALTER TABLE public.deleted_entries ENABLE ROW LEVEL SECURITY;

-- Policies for deleted_entries
CREATE POLICY "Users can view own deleted entries"
  ON public.deleted_entries FOR SELECT
  USING (auth.uid() = deleted_by);

CREATE POLICY "Users can insert deleted entries"
  ON public.deleted_entries FOR INSERT
  WITH CHECK (auth.uid() = deleted_by);

CREATE POLICY "Users can delete from log"
  ON public.deleted_entries FOR DELETE
  USING (auth.uid() = deleted_by);

-- Create index for deleted_entries
CREATE INDEX idx_deleted_entries_deleted_by ON public.deleted_entries(deleted_by);
CREATE INDEX idx_deleted_entries_deleted_at ON public.deleted_entries(deleted_at);