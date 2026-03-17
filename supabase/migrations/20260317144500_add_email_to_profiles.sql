
-- 1. Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_role public.app_role;
BEGIN
  -- Determine role from metadata
  new_role := CASE 
    WHEN NEW.raw_user_meta_data->>'signup_role' = 'customer' THEN 'customer'::public.app_role
    ELSE 'employee'::public.app_role
  END;

  -- Insert into profiles (now including email and role)
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email,
    new_role
  );
  
  -- Insert into user_roles (legacy/backup)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
