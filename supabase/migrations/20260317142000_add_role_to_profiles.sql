
-- 1. Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'employee';

-- 2. Update existing role data from user_roles table (optional but helpful)
UPDATE public.profiles p
SET role = nr.role
FROM public.user_roles nr
WHERE p.id = nr.user_id;

-- 3. Update the handle_new_user function to include role in profiles
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

  -- Insert into profiles (now including role)
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), new_role);
  
  -- Insert into user_roles (legacy/backup)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
