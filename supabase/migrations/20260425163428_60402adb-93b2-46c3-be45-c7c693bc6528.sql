
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Only create if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@wedding.com') THEN
    demo_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      demo_user_id,
      'authenticated',
      'authenticated',
      'demo@wedding.com',
      crypt('demo1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name','Demo Admin','phone','0000000000','dob','1990-01-01','wedding_name','Demo Wedding'),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      demo_user_id,
      jsonb_build_object('sub', demo_user_id::text, 'email', 'demo@wedding.com'),
      'email',
      demo_user_id::text,
      now(), now(), now()
    );
  END IF;
END $$;
