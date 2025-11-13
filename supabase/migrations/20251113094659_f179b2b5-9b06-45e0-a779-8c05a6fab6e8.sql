-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create finance_entries table
CREATE TABLE public.finance_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

-- Finance entries policies
CREATE POLICY "Users can view own entries"
  ON public.finance_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON public.finance_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON public.finance_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON public.finance_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX idx_finance_entries_user_id ON public.finance_entries(user_id);
CREATE INDEX idx_finance_entries_date ON public.finance_entries(date);
CREATE INDEX idx_finance_entries_type ON public.finance_entries(type);