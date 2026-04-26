
-- Profiles table for admin info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Weddings (one admin can have one or more weddings; we will use one default per admin)
CREATE TABLE public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own weddings select" ON public.weddings
  FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "Admins manage own weddings insert" ON public.weddings
  FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins manage own weddings update" ON public.weddings
  FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Admins manage own weddings delete" ON public.weddings
  FOR DELETE USING (auth.uid() = admin_id);

-- Guest entries
CREATE TYPE public.gift_type AS ENUM ('money', 'gift');

CREATE TABLE public.guest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  address TEXT,
  type public.gift_type NOT NULL,
  amount NUMERIC(12,2),
  gift_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT money_or_gift CHECK (
    (type = 'money' AND amount IS NOT NULL AND gift_description IS NULL)
    OR (type = 'gift' AND gift_description IS NOT NULL AND amount IS NULL)
  )
);

CREATE INDEX idx_guest_entries_wedding ON public.guest_entries(wedding_id);
CREATE INDEX idx_guest_entries_admin ON public.guest_entries(admin_id);

ALTER TABLE public.guest_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own entries select" ON public.guest_entries
  FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "Admins manage own entries insert" ON public.guest_entries
  FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins manage own entries update" ON public.guest_entries
  FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Admins manage own entries delete" ON public.guest_entries
  FOR DELETE USING (auth.uid() = admin_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_weddings_updated BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_guest_entries_updated BEFORE UPDATE ON public.guest_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto create profile + default wedding on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_wedding_id UUID;
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.weddings (admin_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'wedding_name','My Wedding'))
  RETURNING id INTO new_wedding_id;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
