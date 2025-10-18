-- Create function to check if email is the hardcoded superadmin
CREATE OR REPLACE FUNCTION public.is_hardcoded_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id 
    AND email = 'tafnijhove@gmail.com'
  );
$$;

-- Update has_role function to always return true for superadmin if hardcoded
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _role = 'superadmin' AND public.is_hardcoded_superadmin(_user_id) THEN true
      ELSE EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    END;
$$;

-- Ensure the hardcoded superadmin always has the superadmin role in user_roles
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id for tafnijhove@gmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tafnijhove@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure superadmin role exists for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Create trigger to prevent deletion of hardcoded superadmin role
CREATE OR REPLACE FUNCTION public.protect_hardcoded_superadmin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent deletion of superadmin role for hardcoded superadmin
  IF OLD.role = 'superadmin' AND public.is_hardcoded_superadmin(OLD.user_id) THEN
    RAISE EXCEPTION 'Cannot remove superadmin role from hardcoded superadmin account';
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger on user_roles to protect hardcoded superadmin
DROP TRIGGER IF EXISTS protect_hardcoded_superadmin_trigger ON public.user_roles;
CREATE TRIGGER protect_hardcoded_superadmin_trigger
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_hardcoded_superadmin();

-- Create trigger to prevent role updates for hardcoded superadmin
CREATE OR REPLACE FUNCTION public.protect_hardcoded_superadmin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing role from superadmin for hardcoded superadmin
  IF OLD.role = 'superadmin' AND NEW.role != 'superadmin' AND public.is_hardcoded_superadmin(OLD.user_id) THEN
    RAISE EXCEPTION 'Cannot change role of hardcoded superadmin account';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_hardcoded_superadmin_update_trigger ON public.user_roles;
CREATE TRIGGER protect_hardcoded_superadmin_update_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_hardcoded_superadmin_update();