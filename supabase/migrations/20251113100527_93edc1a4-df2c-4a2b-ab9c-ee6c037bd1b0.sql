-- Create admin user in auth.users table
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the admin user (without confirmed_at as it's generated)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@masdar.local',
    crypt('Masdar@Supp@123!@#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    0
  ) RETURNING id INTO new_user_id;

  -- Update the profile with username (profile should be auto-created by trigger)
  UPDATE public.profiles 
  SET username = 'admin' 
  WHERE id = new_user_id;
END $$;