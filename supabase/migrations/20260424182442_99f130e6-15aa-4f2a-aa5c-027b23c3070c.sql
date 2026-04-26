ALTER TABLE public.profiles ADD COLUMN dob DATE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_wedding_id UUID;
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, dob)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'dob','')::date
  );

  INSERT INTO public.weddings (admin_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'wedding_name','My Wedding'))
  RETURNING id INTO new_wedding_id;

  RETURN NEW;
END; $$;